importScripts("/vendor/onnxruntime/ort.min.js");

ort.env.wasm.wasmPaths="/vendor/onnxruntime/";
ort.env.wasm.numThreads=1;

const MODEL_URL="/models/u2netp.onnx",SIZE=320,PIXELS=SIZE*SIZE;
let sessionPromise;

async function readModel(){
 const response=await fetch(MODEL_URL,{cache:"force-cache"});
 if(!response.ok)throw new Error("Could not load the U²-NetP model ("+response.status+").");
 const total=Number(response.headers.get("content-length"))||0,reader=response.body?.getReader();
 if(!reader)return new Uint8Array(await response.arrayBuffer());
 const chunks=[];let loaded=0;
 while(true){
  const {done,value}=await reader.read();if(done)break;
  chunks.push(value);loaded+=value.length;postMessage({type:"progress",loaded,total});
 }
 const model=new Uint8Array(loaded);let offset=0;
 for(const chunk of chunks){model.set(chunk,offset);offset+=chunk.length}
 return model;
}

function getSession(){
 if(!sessionPromise)sessionPromise=(async()=>{
  postMessage({type:"status",message:"Loading the AI model. This only needs to finish once per browser cache."});
  return ort.InferenceSession.create(await readModel(),{executionProviders:["wasm"],graphOptimizationLevel:"all"});
 })();
 return sessionPromise;
}

self.onmessage=async event=>{
 const {type,id,pixels,bitmap}=event.data;if(type!=="segment")return;
 try{
  postMessage({type:"status",message:"Running U²-NetP in your browser…"});
  const session=await getSession(),input=new Float32Array(3*PIXELS),means=[.485,.456,.406],stds=[.229,.224,.225];
  for(let p=0;p<PIXELS;p++)for(let c=0;c<3;c++)input[c*PIXELS+p]=(pixels[p*4+c]/255-means[c])/stds[c];
  const feeds={[session.inputNames[0]]:new ort.Tensor("float32",input,[1,3,SIZE,SIZE])};
  const outputs=await session.run(feeds),prediction=outputs[session.outputNames[0]].data;
  if(prediction.length!==PIXELS)throw new Error("Unexpected mask size from the AI model.");
  let min=Infinity,max=-Infinity;
  for(const value of prediction){if(Number.isFinite(value)){if(value<min)min=value;if(value>max)max=value}}
  const spread=max-min,mask=new Float32Array(PIXELS);
  if(Number.isFinite(spread)&&spread>1e-8)for(let i=0;i<PIXELS;i++)mask[i]=Math.max(0,Math.min(1,(prediction[i]-min)/spread));
  postMessage({type:"mask",id,mask:mask.buffer,bitmap},[mask.buffer,bitmap]);
 }catch(error){
  bitmap?.close();postMessage({type:"error",id,message:error.message||"AI inference failed."});
 }
};
