const SHELL_CACHE="when-i-need-it-shell-v1",ASSET_CACHE="when-i-need-it-runtime-v1";
const SHELL_PATHS=["/","/index.html","/about","/accessibility","/security","/ai-disclosure","/copyright","/about.html","/manifest.webmanifest","/icon.svg","/css/styles.css","/css/fonts.css",
 "/js/core.js","/js/image.js","/js/pdf.js","/js/pdf-render.js","/js/pdf-images.js","/js/ocr.js","/js/qr-generator.js",
 "/js/qr-scanner.js","/js/barcode.js","/js/media-core.js","/js/video.js","/js/audio.js","/js/background.js",
 "/js/ai-background.js","/js/ai-background-worker.js","/js/utilities.js","/js/registry.js","/js/utilities2.js",
 "/js/views.js","/js/theme.js","/js/vercel-analytics.js","/js/palette.js","/js/legal.js","/js/main.js",
 "/vendor/pdf-lib/pdf-lib.min.js","/vendor/jszip/jszip.min.js","/vendor/tesseract/tesseract.min.js",
 "/vendor/qrcode-generator/qrcode.js","/vendor/qrcode-generator/qrcode_UTF8.js","/vendor/jsqr/jsQR.js",
 "/vendor/jsbarcode/JsBarcode.all.min.js","/vendor/ffmpeg/ffmpeg.js"];
const RUNTIME_PATHS=["/models/u2netp.onnx","/models/tessdata/eng.traineddata.gz","/vendor/ffmpeg-core-mt/ffmpeg-core.wasm",
 "/vendor/onnxruntime/ort.min.js","/vendor/onnxruntime/ort-wasm-simd-threaded.mjs","/vendor/onnxruntime/ort-wasm-simd-threaded.wasm"];

self.addEventListener("install",event=>event.waitUntil((async()=>{
 const cache=await caches.open(SHELL_CACHE);
 await cache.addAll(SHELL_PATHS);
 await self.skipWaiting();
})()));
self.addEventListener("activate",event=>event.waitUntil((async()=>{
 const names=await caches.keys();
 await Promise.all(names.filter(name=>/^(toolnest-|when-i-need-it-)/.test(name)&&![SHELL_CACHE,ASSET_CACHE].includes(name)).map(name=>caches.delete(name)));
 await self.clients.claim();
})()));
self.addEventListener("fetch",event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=="GET"||url.origin!==self.location.origin)return;
 if(RUNTIME_PATHS.includes(url.pathname)){
  event.respondWith((async()=>{
   const cache=await caches.open(ASSET_CACHE),cached=await cache.match(request);
   if(cached)return cached;
   const response=await fetch(request);
   if(!response.ok)return response;
   try{await cache.put(request,response.clone())}
   catch(error){console.error("Could not cache a local runtime asset:",url.pathname,error)}
   return response;
  })());
  return;
 }
 if(!["document","script","style","image","font","worker"].includes(request.destination))return;
 event.respondWith((async()=>{
  const cache=await caches.open(SHELL_CACHE);
  try{
   const response=await fetch(request);
   if(response.ok&&Number(response.headers.get("content-length")||0)<=5*1024*1024){
    try{await cache.put(request,response.clone())}
    catch(error){console.error("Could not cache an app resource:",url.pathname,error)}
   }
   return response;
  }catch(error){
   const cached=await cache.match(request);
   if(cached)return cached;
   if(request.mode==="navigate"){
    const shell=await cache.match("/index.html");
    if(shell)return shell;
   }
   throw error;
  }
 })());
});
