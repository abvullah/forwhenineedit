function aiBgTool(root){
 const SIZE=320,MAX_PIXELS=16000000,MAX_BYTES=25*1024*1024,MAX_BATCH=20,MAX_ZIP_BYTES=100*1024*1024;
 root.innerHTML=`<p id="ai-status" class="note" role="status" aria-live="polite">Runs locally in your browser. The first use loads the locally hosted AI model.</p>
 <div class="opts">
  <label>Replace background<select id="ai-mode"><option value="transparent">Transparent</option><option value="color">Colour</option><option value="blur">Blur</option><option value="image">Image</option></select></label>
  <label>Background colour<input id="ai-color" type="color" value="#ffffff"></label>
  <label>Blur strength (<span id="ai-blur-value">18</span>)<input id="ai-blur" type="range" min="2" max="40" value="18"></label>
  <label class="btn">Choose background image<input id="ai-background-file" type="file" accept="image/jpeg,image/png,image/webp" hidden></label>
 </div>
 <p id="ai-background-name" class="note" aria-live="polite">No replacement image selected.</p>
 <div id="ai-drop"></div>
 <section id="ai-editor" hidden>
  <h2 id="ai-filename"></h2>
  <div class="ai-compare" id="ai-compare"><canvas id="ai-before" aria-label="Original image"></canvas><canvas id="ai-after" aria-label="Edited image"></canvas></div>
  <label class="ai-range">Before / after<input id="ai-compare-range" type="range" min="0" max="100" value="50"></label>
  <div class="opts">
   <label>Mask brush<select id="ai-brush-mode-select"><option value="restore">Restore subject</option><option value="erase">Erase subject</option></select></label>
   <label>Brush size (<span id="ai-brush-value">32</span>)<input id="ai-brush-size" type="range" min="8" max="120" value="32"></label>
   <label>Export format<select id="ai-format"><option value="image/png">PNG</option><option value="image/webp">WEBP</option><option value="image/jpeg">JPG</option></select></label>
  </div>
  <button id="ai-download" class="btn p" type="button">Download edited image</button>
 </section>
 <p class="note">JPG, PNG and WEBP up to 16 megapixels and 25 MB each. Batch processing supports up to 20 images and creates PNGs in a ZIP (100 MB maximum), using the selected background. All processing stays in this browser.</p>`;
 const status=$("#ai-status",root),dropzone=$("#ai-drop",root),editor=$("#ai-editor",root),before=$("#ai-before",root),after=$("#ai-after",root);
 const workerPending=new Map();
 let worker=null,requestId=0,busy=false,sourceBitmap=null,maskCanvas=null,imageName="",backgroundBitmap=null;
 const setStatus=(message,kind="note")=>{status.textContent=message;status.className=kind};
 const setBusy=value=>{busy=value;dropzone.style.pointerEvents=value?"none":"";dropzone.style.opacity=value?".55":""};
 const release=()=>{
  if(root.isConnected)return;
  worker?.terminate();worker=null;
  sourceBitmap?.close();sourceBitmap=null;
  backgroundBitmap?.close();backgroundBitmap=null;
  for(const p of workerPending.values())p.reject(Error("The tool was closed."));
  workerPending.clear();
  removeEventListener("hashchange",release);
 };
 addEventListener("hashchange",()=>setTimeout(release,0));
 const fail=message=>{setBusy(false);setStatus(message,"err")};
 const getWorker=()=>{
  if(worker)return worker;
  worker=new Worker("/js/ai-background-worker.js");
  worker.onmessage=e=>{
   const m=e.data;
   if(m.type==="status"){setStatus(m.message);return}
   if(m.type==="progress"){setStatus(m.total?`Loading AI model: ${Math.round(m.loaded/m.total*100)}%`:`Loading AI model (${kb(m.loaded)})`);return}
   const pending=workerPending.get(m.id);
   if(!pending){m.bitmap?.close();return}
   workerPending.delete(m.id);
   if(m.type==="error"){pending.reject(Error(m.message));return}
   if(m.type==="mask"){
    const mask=new Float32Array(m.mask);
    if(mask.length!==SIZE*SIZE){m.bitmap?.close();pending.reject(Error("The AI worker returned an invalid mask."));return}
    pending.resolve({bitmap:m.bitmap,mask});return;
   }
   pending.reject(Error("The AI worker returned an unknown response."));
  };
  worker.onerror=e=>{
   const message="AI worker failed: "+(e.message||"unknown error");
   for(const p of workerPending.values())p.reject(Error(message));
   workerPending.clear();worker?.terminate();worker=null;fail(message);
  };
  return worker;
 };
 const runModel=async bitmap=>{
  const input=document.createElement("canvas");input.width=SIZE;input.height=SIZE;
  const ctx=input.getContext("2d",{willReadFrequently:true});
  ctx.fillStyle="#fff";ctx.fillRect(0,0,SIZE,SIZE);ctx.drawImage(bitmap,0,0,SIZE,SIZE);
  const pixels=new Uint8Array(ctx.getImageData(0,0,SIZE,SIZE).data);
  const id=++requestId;
  const result=new Promise((resolve,reject)=>workerPending.set(id,{resolve,reject}));
  try{getWorker().postMessage({type:"segment",id,pixels,bitmap},[pixels.buffer,bitmap])}
  catch(error){workerPending.delete(id);throw error}
  return result;
 };
 const makeMask=values=>{
  const canvas=document.createElement("canvas");canvas.width=SIZE;canvas.height=SIZE;
  const ctx=canvas.getContext("2d"),image=ctx.createImageData(SIZE,SIZE);
  for(let i=0;i<values.length;i++){const alpha=Math.max(0,Math.min(255,Math.round(values[i]*255))),p=i*4;image.data[p]=image.data[p+1]=image.data[p+2]=255;image.data[p+3]=alpha}
  ctx.putImageData(image,0,0);return canvas;
 };
 const backgroundMode=()=>$("#ai-mode",root).value;
 const drawBackground=(ctx,w,h,bitmap,mode,color=$("#ai-color",root).value)=>{
  if(mode==="color"){ctx.fillStyle=color;ctx.fillRect(0,0,w,h);return}
  if(mode==="blur"){
   const blur=+$("#ai-blur",root).value,outset=blur*2;
   ctx.filter=`blur(${blur}px)`;ctx.drawImage(bitmap,-outset,-outset,w+outset*2,h+outset*2);ctx.filter="none";return;
  }
  if(mode==="image"){
   if(!backgroundBitmap)throw Error("Choose a background image before using image replacement.");
   const scale=Math.max(w/backgroundBitmap.width,h/backgroundBitmap.height),bw=backgroundBitmap.width*scale,bh=backgroundBitmap.height*scale;
   ctx.drawImage(backgroundBitmap,(w-bw)/2,(h-bh)/2,bw,bh);
  }
 };
 const compose=(canvas,bitmap,mask,mode,color)=>{
  const ctx=canvas.getContext("2d");ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
  ctx.globalCompositeOperation="destination-in";ctx.drawImage(mask,0,0,canvas.width,canvas.height);
  ctx.globalCompositeOperation="destination-over";
  drawBackground(ctx,canvas.width,canvas.height,bitmap,mode,color);
  ctx.globalCompositeOperation="source-over";ctx.filter="none";
  return canvas;
 };
 const setComparison=()=>{
  const value=+$("#ai-compare-range",root).value;
  before.style.clipPath=`inset(0 ${100-value}% 0 0)`;
 };
 const refreshEditor=()=>{
  if(!sourceBitmap||!maskCanvas)return;
  const scale=Math.min(1,1200/sourceBitmap.width,1200/sourceBitmap.height);
  const w=Math.max(1,Math.round(sourceBitmap.width*scale)),h=Math.max(1,Math.round(sourceBitmap.height*scale));
  for(const canvas of [before,after]){canvas.width=w;canvas.height=h}
  before.getContext("2d").drawImage(sourceBitmap,0,0,w,h);
  compose(after,sourceBitmap,maskCanvas,backgroundMode());
  $("#ai-compare",root).style.aspectRatio=`${w}/${h}`;
  setComparison();
 };
 const canvasBlob=(canvas,type)=>{
  return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error("The browser could not export this image.")),type));
 };
 const safeName=name=>name.replace(/\.[^.]+$/,"").replace(/[^\w.-]+/g,"_").slice(0,80)||"image";
 const exportBlob=async(bitmap,mask,type,mode=backgroundMode())=>{
  const canvas=document.createElement("canvas");canvas.width=bitmap.width;canvas.height=bitmap.height;
  const jpegFallback=type==="image/jpeg"&&mode==="transparent";
  compose(canvas,bitmap,mask,jpegFallback?"color":mode,jpegFallback?"#ffffff":undefined);
  return canvasBlob(canvas,type);
 };
 const validate=async file=>{
  if(file.size>MAX_BYTES)throw Error(file.name+" is larger than 25 MB.");
  const kind=await sniff(file);
  if(!["jpg","png","webp"].includes(kind))throw Error(file.name+" is not a supported JPG, PNG or WEBP image.");
  const bitmap=await createImageBitmap(file);
  if(bitmap.width*bitmap.height>MAX_PIXELS){bitmap.close();throw Error(file.name+" is over the 16-megapixel limit.")}
  return bitmap;
 };
 const makeBatch=async files=>{
  if(typeof JSZip!=="function")throw Error("ZIP support is unavailable. Check that the local JSZip library is loaded.");
  if(files.length>MAX_BATCH)throw Error("Choose no more than 20 images at a time.");
  if(files.reduce((sum,file)=>sum+file.size,0)>MAX_BATCH*MAX_BYTES)throw Error("The selected images exceed the 500 MB total input limit.");
  const controls=[...root.querySelectorAll(".opts input, .opts select")],wasDisabled=controls.map(control=>control.disabled);
  controls.forEach(control=>control.disabled=true);
  try{
   const zip=new JSZip(),mode=backgroundMode();let total=0;
   for(let i=0;i<files.length;i++){
    setStatus(`Checking image ${i+1} of ${files.length}…`);
    let bitmap=await validate(files[i]);
    try{
     setStatus(`Processing image ${i+1} of ${files.length}…`);
     const result=await runModel(bitmap);bitmap=null;
     try{
      const mask=makeMask(result.mask),blob=await exportBlob(result.bitmap,mask,"image/png",mode);
      total+=blob.size;if(total>MAX_ZIP_BYTES)throw Error("The generated ZIP would exceed the 100 MB output limit.");
      zip.file(`${String(i+1).padStart(2,"0")}-${safeName(files[i].name)}-background.png`,blob);
     }finally{result.bitmap.close()}
    }finally{bitmap?.close()}
   }
   setStatus("Creating ZIP archive…");
   const blob=await zip.generateAsync({type:"blob",compression:"STORE"},progress=>setStatus(`Creating ZIP archive: ${Math.round(progress.percent)}%`));
   if(blob.size>MAX_ZIP_BYTES)throw Error("The generated ZIP exceeds the 100 MB output limit.");
   download(blob,"for-when-i-need-it-backgrounds.zip");setStatus(`Done. ${files.length} PNGs were saved in a ZIP.`,"ok");
  }finally{controls.forEach((control,index)=>control.disabled=wasDisabled[index])}
 };
 const applyStroke=e=>{
  if(!sourceBitmap||!maskCanvas)return;
  const rect=after.getBoundingClientRect(),x=(e.clientX-rect.left)/rect.width*SIZE,y=(e.clientY-rect.top)/rect.height*SIZE;
  const radius=(+$("#ai-brush-size",root).value)/rect.width*SIZE;
  const ctx=maskCanvas.getContext("2d"),restore=$("#ai-brush-mode-select",root).value==="restore";
  ctx.globalCompositeOperation=restore?"source-over":"destination-out";ctx.fillStyle="#fff";
  ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.fill();ctx.globalCompositeOperation="source-over";refreshEditor();
 };
 $("#ai-compare-range",root).oninput=setComparison;
 $("#ai-mode",root).onchange=()=>{try{refreshEditor()}catch(error){setStatus(error.message,"err")}};
 $("#ai-color",root).oninput=()=>{if(backgroundMode()==="color")refreshEditor()};
 $("#ai-blur",root).oninput=e=>{$("#ai-blur-value",root).textContent=e.target.value;if(backgroundMode()==="blur")refreshEditor()};
 $("#ai-brush-size",root).oninput=e=>$("#ai-brush-value",root).textContent=e.target.value;
 let painting=false;
 after.onpointerdown=e=>{if(!sourceBitmap)return;painting=true;after.setPointerCapture(e.pointerId);applyStroke(e)};
 after.onpointermove=e=>{if(painting)applyStroke(e)};
 after.onpointerup=after.onpointercancel=()=>{painting=false};
 $("#ai-background-file",root).onchange=async e=>{
  const file=e.target.files?.[0];e.target.value="";if(!file)return;
  try{
   if(file.size>MAX_BYTES)throw Error("The background image is larger than 25 MB.");
   if(!["jpg","png","webp"].includes(await sniff(file)))throw Error("Use a JPG, PNG or WEBP background image.");
   const bitmap=await createImageBitmap(file);
   if(bitmap.width*bitmap.height>MAX_PIXELS){bitmap.close();throw Error("The background image is over the 16-megapixel limit.")}
   backgroundBitmap?.close();backgroundBitmap=bitmap;
   $("#ai-background-name",root).textContent="Replacement: "+file.name;
   if(backgroundMode()==="image")refreshEditor();
  }catch(error){setStatus("Could not load the background image: "+error.message,"err")}
 };
 $("#ai-download",root).onclick=async()=>{
  if(!sourceBitmap||!maskCanvas)return;
  const button=$("#ai-download",root);button.disabled=true;
  try{
   const type=$("#ai-format",root).value,blob=await exportBlob(sourceBitmap,maskCanvas,type);
   const suffix=type==="image/jpeg"?"jpg":type==="image/webp"?"webp":"png";
   download(blob,`${safeName(imageName)}-background.${suffix}`);setStatus("Edited image downloaded.","ok");
  }catch(error){setStatus("Could not export the image: "+error.message,"err")}
  finally{button.disabled=false}
 };
 drop(dropzone,{accept:"image/jpeg,image/png,image/webp",multiple:true,onFiles:async files=>{
  if(busy){setStatus("Wait for the current image to finish.","err");return}
  if(!files.length)return;
  if(files.length>MAX_BATCH){fail("Choose no more than 20 images at a time.");return}
  setBusy(true);editor.hidden=true;sourceBitmap?.close();sourceBitmap=null;
  try{
   if(files.length>1){await makeBatch(files);return}
   imageName=files[0].name;setStatus("Checking image…");
   let bitmap=await validate(files[0]);setStatus("Running U²-NetP in your browser…");
   const result=await runModel(bitmap);bitmap=null;
   sourceBitmap=result.bitmap;maskCanvas=makeMask(result.mask);
   $("#ai-filename",root).textContent=imageName;
   editor.hidden=false;editor.scrollIntoView({block:"start"});refreshEditor();
   setStatus("Background removed. Adjust the mask, replacement and export format below.","ok");
  }catch(error){fail("Could not process the image: "+error.message)}
  finally{setBusy(false)}
 }});
}
