function ocrTool(root){
 const MAX_IMAGE_BYTES=25*1048576,MAX_PIXELS=16000000,MAX_PDF_PAGES=100;
 const st=status(root),info=el("<p class='note'></p>");
 const output=el(`<textarea id="ocr-output" aria-label="Recognized text" placeholder="Recognized text will appear here." readonly></textarea>`);
 const controls=el(`<div class="opts"><button id="ocr-go" class="btn p" type="button" disabled>Recognize text</button><button id="ocr-copy" class="btn" type="button" disabled>Copy text</button><button id="ocr-save" class="btn" type="button" disabled>Download text</button></div>`);
 const go=$("#ocr-go",controls),copy=$("#ocr-copy",controls),save=$("#ocr-save",controls);
 let file=null,worker=null,workerPromise=null,working=false;
 const onHashChange=()=>setTimeout(release,0);
 const release=()=>{
  if(root.isConnected)return;
  const pending=workerPromise;workerPromise=null;worker=null;
  if(pending)pending.then(w=>w.terminate()).catch(error=>console.error("Could not terminate the OCR worker:",error));
  removeEventListener("hashchange",onHashChange);
 };
 addEventListener("hashchange",onHashChange);
 const getWorker=()=>{
  if(worker)return Promise.resolve(worker);
  if(!workerPromise){
   if(!window.Tesseract)throw Error("The local OCR library failed to load. Reload the page and try again.");
   workerPromise=window.Tesseract.createWorker("eng",1,{
    workerPath:"/vendor/tesseract/worker.min.js",
    corePath:"/vendor/tesseract/tesseract-core-lstm.wasm.js",
    langPath:"/models/tessdata",
    gzip:true,
    workerBlobURL:false,
    logger:m=>{
     if(!root.isConnected)return;
     const progress=Number.isFinite(m.progress)?` ${Math.round(m.progress*100)}%`:"";
     st(`OCR ${m.status||"working"}${progress}…`);
    }
   }).then(result=>{worker=result;return result}).catch(error=>{workerPromise=null;throw Error("Could not start the local OCR engine: "+error.message)});
  }
  return workerPromise;
 };
 const imageCanvas=async imageFile=>{
  const bitmap=await createImageBitmap(imageFile);
  try{
   if(bitmap.width*bitmap.height>MAX_PIXELS)throw Error("This image is over the 16-megapixel limit.");
   const scale=Math.min(1,2500/Math.max(bitmap.width,bitmap.height),Math.sqrt(8000000/(bitmap.width*bitmap.height)));
   const canvas=document.createElement("canvas");
   canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
   const ctx=canvas.getContext("2d");
   if(!ctx)throw Error("Could not prepare the image for OCR.");
   ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);return canvas;
  }finally{bitmap.close()}
 };
 drop(root,{accept:"application/pdf,image/jpeg,image/png,image/webp",multiple:false,onFiles:async files=>{
  file=files[0]||null;output.value="";info.textContent="";
  copy.disabled=save.disabled=true;go.disabled=!file;
  if(file)st(`${file.name} ready.`);
 }});
 root.append(info,controls,output,el(`<p class="note">OCR and PDF rendering run in this browser. Supports English, JPG/PNG/WEBP images up to 25 MB and 16 megapixels, or PDFs up to 100 MB and 100 pages.</p>`));
 go.onclick=async()=>{
  if(!file||working)return;
  working=true;go.disabled=true;copy.disabled=save.disabled=true;output.value="";
  let pdf=null;
  try{
   const kind=await sniff(file),results=[];
   if(kind==="pdf"){
    if(file.size>100*1048576)throw Error("The PDF is over the 100 MB limit.");
    pdf=await loadBrowserPdf(file);
    if(pdf.numPages>MAX_PDF_PAGES)throw Error("OCR supports up to "+MAX_PDF_PAGES+" PDF pages at a time.");
    let worker=null;
    for(let number=1;number<=pdf.numPages;number++){
     st(`Reading PDF page ${number} of ${pdf.numPages}…`);
     const page=await pdf.getPage(number);
     try{
      const content=await page.getTextContent(),native=content.items.map(item=>item.str||"").join(" ").trim();
      if(native.length>=20){results.push(`--- Page ${number} ---\n${native}`);continue}
      worker??=await getWorker();
      const rendered=await renderBrowserPdfPage(pdf,number,2,8000000);
      try{
       const recognized=await worker.recognize(rendered.canvas);
       results.push(`--- Page ${number} ---\n${recognized.data.text.trim()}`);
      }finally{rendered.canvas.width=0;rendered.canvas.height=0;rendered.page.cleanup()}
     }finally{page.cleanup()}
    }
   }else{
    if(!["jpg","png","webp"].includes(kind))throw Error("Choose a PDF, JPG, PNG or WEBP file.");
    if(file.size>MAX_IMAGE_BYTES)throw Error("The image is over the 25 MB limit.");
    const canvas=await imageCanvas(file),worker=await getWorker();
    st("Recognizing text in the image…");
    try{const recognized=await worker.recognize(canvas);results.push(recognized.data.text.trim())}
    finally{canvas.width=0;canvas.height=0}
   }
   output.value=results.join("\n\n").trim();
   copy.disabled=save.disabled=!output.value;
   st(output.value?"Done. Recognized text is ready.":"No text was recognized.");
  }catch(error){st(error.message,1)}
  finally{
   if(pdf)try{await pdf.destroy()}catch(error){console.error("Could not release the OCR PDF:",error)}
   working=false;go.disabled=!file;
  }
 };
 copy.onclick=async()=>{
  try{await navigator.clipboard.writeText(output.value);st("Text copied to the clipboard.")}
  catch(error){st("Could not copy the text: "+error.message,1)}
 };
 save.onclick=()=>{
  try{download(new Blob([output.value],{type:"text/plain;charset=utf-8"}),`${file?.name.replace(/\.[^.]+$/,"")||"ocr"}-text.txt`);st("Text file downloaded.")}
  catch(error){st("Could not download the text: "+error.message,1)}
 };
}
