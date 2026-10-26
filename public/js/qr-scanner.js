function qrScannerTool(root){
 root.innerHTML=`<div id="qr-scan-drop"></div>
 <div class="opts"><button id="qr-camera-start" class="btn p" type="button">Scan with camera</button><button id="qr-camera-stop" class="btn" type="button" disabled>Stop camera</button></div>
 <video id="qr-video" class="qr-video" playsinline muted hidden></video>
 <p id="qr-scan-status" class="note" role="status" aria-live="polite">Scan an image or allow camera access. QR contents are displayed as text and never opened automatically.</p>
 <label>QR contents<textarea id="qr-scan-result" readonly placeholder="Decoded text will appear here."></textarea></label>
 <button id="qr-scan-copy" class="btn" type="button" disabled>Copy contents</button>`;
 const status=$("#qr-scan-status",root),result=$("#qr-scan-result",root),video=$("#qr-video",root),start=$("#qr-camera-start",root),stop=$("#qr-camera-stop",root),copy=$("#qr-scan-copy",root);
 const canvas=document.createElement("canvas"),ctx=canvas.getContext("2d",{willReadFrequently:true});
 let stream=null,frameId=0;
 const setStatus=(message,kind="note")=>{status.textContent=message;status.className=kind};
 const stopCamera=()=>{
  if(frameId)cancelAnimationFrame(frameId);frameId=0;
  if(stream){stream.getTracks().forEach(track=>track.stop());stream=null}
  video.pause();video.srcObject=null;video.hidden=true;start.disabled=false;stop.disabled=true;
 };
 const release=()=>{
  if(root.isConnected)return;
  stopCamera();removeEventListener("hashchange",onHashChange);
 };
 const onHashChange=()=>setTimeout(release,0);
 addEventListener("hashchange",onHashChange);
 const decode=()=>{
  if(typeof jsQR!=="function")throw Error("The local QR scanner failed to load.");
  if(!canvas.width||!canvas.height)return null;
  return jsQR(ctx.getImageData(0,0,canvas.width,canvas.height).data,canvas.width,canvas.height,{inversionAttempts:"attemptBoth"});
 };
 const showCode=code=>{
  result.value=code.data;copy.disabled=false;setStatus("QR code decoded. The contents were not opened.","ok");
 };
 drop($("#qr-scan-drop",root),{accept:"image/jpeg,image/png,image/webp",multiple:false,onFiles:async files=>{
  stopCamera();
  const file=files[0];if(!file)return;
  try{
   if(file.size>25*1048576)throw Error("The image is larger than 25 MB.");
   if(!["jpg","png","webp"].includes(await sniff(file)))throw Error("Use a JPG, PNG or WEBP image.");
   const bitmap=await createImageBitmap(file);
   try{
    if(bitmap.width*bitmap.height>16000000)throw Error("This image is over the 16-megapixel limit.");
    const scale=Math.min(1,2000/Math.max(bitmap.width,bitmap.height),Math.sqrt(4000000/(bitmap.width*bitmap.height)));
    canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
    ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
    const code=decode();
    if(code)showCode(code);else{result.value="";copy.disabled=true;setStatus("No QR code was found in that image.","err")}
   }finally{bitmap.close()}
  }catch(error){setStatus("Could not scan the image: "+error.message,"err")}
 }});
 start.onclick=async()=>{
  if(!navigator.mediaDevices?.getUserMedia){setStatus("This browser does not support camera access.","err");return}
  start.disabled=true;setStatus("Waiting for camera permission…");
  try{
   stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}},audio:false});
   if(!root.isConnected){stopCamera();return}
   video.srcObject=stream;video.hidden=false;await video.play();stop.disabled=false;
   setStatus("Point the camera at a QR code.");
   const scanFrame=()=>{
    if(!stream||!root.isConnected)return;
    if(video.readyState>=2){
     const scale=Math.min(1,1280/Math.max(video.videoWidth,video.videoHeight));
     canvas.width=Math.max(1,Math.round(video.videoWidth*scale));canvas.height=Math.max(1,Math.round(video.videoHeight*scale));
     ctx.drawImage(video,0,0,canvas.width,canvas.height);
     try{const code=decode();if(code){showCode(code);stopCamera();return}}
     catch(error){stopCamera();setStatus("Camera scan failed: "+error.message,"err");return}
    }
    frameId=requestAnimationFrame(scanFrame);
   };
   frameId=requestAnimationFrame(scanFrame);
  }catch(error){stopCamera();setStatus("Could not start the camera: "+error.message,"err")}
 };
 stop.onclick=()=>{stopCamera();setStatus("Camera stopped.")};
 copy.onclick=async()=>{
  try{await navigator.clipboard.writeText(result.value);setStatus("QR contents copied.")}
  catch(error){setStatus("Could not copy the contents: "+error.message,"err")}
 };
}
