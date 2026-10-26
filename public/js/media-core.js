const MEDIA_MAX_INPUT=100*1048576,MEDIA_MAX_OUTPUT=200*1048576;

function mediaTool(root,kind){
 const video=kind==="video";
 root.innerHTML=`<div id="media-drop"></div>
 <div class="opts">
  <label>Action<select id="media-action">${video?'<option value="compress">Compress video</option><option value="trim">Trim video</option><option value="convert">Convert video</option><option value="mute">Mute video</option><option value="extract">Extract audio</option>':'<option value="convert">Convert audio</option><option value="trim">Trim audio</option><option value="extract">Extract audio from video</option>'}</select></label>
  <div id="media-options"></div>
  <button id="media-run" class="btn p" type="button" disabled>Process media</button>
 </div>
 <p id="media-file" class="note"></p>
 <p id="media-status" class="note" role="status" aria-live="polite">Processes media in your browser with this website's FFmpeg runtime. First use downloads about 31 MB of core files.</p>
 <p class="note">Input files are limited to 100 MB; outputs are limited to 200 MB. Processing time and supported codecs depend on your device. GIF conversion is capped at 30 seconds.</p>`;
 const options=$("#media-options",root),run=$("#media-run",root),fileLabel=$("#media-file",root),status=$("#media-status",root);
 let file=null,ffmpeg=null,ffmpegPromise=null,running=false;
 const setStatus=(message,kind="note")=>{status.textContent=message;status.className=kind};
 const action=()=>$("#media-action",root).value;
 const renderOptions=()=>{
  const a=action();options.replaceChildren();
  if(a==="trim")options.append(el(`<div class="opts"><label>Start (seconds)<input id="media-start" type="number" min="0" max="3600" step="0.1" value="0"></label><label>Duration (seconds)<input id="media-duration" type="number" min="0.1" max="3600" step="0.1" value="10"></label></div>`));
  if(a==="convert")options.append(el(video?`<label>Output format<select id="media-format"><option value="mp4">MP4</option><option value="webm">WEBM</option><option value="gif">GIF (first 30 seconds)</option></select></label>`:`<label>Output format<select id="media-format"><option value="mp3">MP3</option><option value="wav">WAV</option><option value="ogg">OGG</option></select></label>`));
  if(a==="extract"&&!video)options.append(el(`<label>Output format<select id="media-format"><option value="mp3">MP3</option><option value="wav">WAV</option><option value="ogg">OGG</option></select></label>`));
  if(a==="trim")options.querySelector("#media-duration").max="3600";
 };
 const getFfmpeg=async()=>{
  if(ffmpeg?.loaded)return ffmpeg;
  if(!ffmpegPromise){
   if(!window.crossOriginIsolated)throw Error("FFmpeg requires cross-origin isolation. Open this site on localhost or HTTPS with COOP/COEP headers enabled.");
   if(!window.FFmpegWASM?.FFmpeg)throw Error("The local FFmpeg browser library failed to load.");
   ffmpeg=new window.FFmpegWASM.FFmpeg();
   ffmpeg.on("progress",event=>{
    if(!running||!Number.isFinite(event.progress))return;
    setStatus(`Processing: ${Math.max(0,Math.min(100,Math.round(event.progress*100)))}%`);
   });
   ffmpegPromise=ffmpeg.load({
    coreURL:"/vendor/ffmpeg-core-mt/ffmpeg-core.js",
    wasmURL:"/vendor/ffmpeg-core-mt/ffmpeg-core.wasm",
    workerURL:"/vendor/ffmpeg-core-mt/ffmpeg-core.worker.js"
   }).then(()=>ffmpeg).catch(error=>{
    ffmpeg?.terminate();ffmpeg=null;ffmpegPromise=null;
    throw Error("Could not load the local FFmpeg core: "+error.message);
   });
  }
  return ffmpegPromise;
 };
 const removeFiles=async(engine,names)=>{
  try{
   const entries=await engine.listDir("/");
   for(const name of names){
    if(!entries.some(entry=>entry.name===name))continue;
    try{await engine.deleteFile(name)}
    catch(error){console.error("Could not remove a temporary FFmpeg file:",name,error)}
   }
  }catch(error){console.error("Could not inspect temporary FFmpeg files:",error)}
 };
 const extensionFor=file=>{
  const ext=file.name.split(".").pop().toLowerCase();
  const allowed=["mp4","m4v","mov","mkv","avi","webm","wmv","mpg","mpeg","3gp","ts","mp3","wav","m4a","aac","ogg","oga","flac","opus","wma"];
  if(!allowed.includes(ext))throw Error("Use a supported video or audio file format.");
  return ext;
 };
 const validateInput=(selected,a)=>{
  if(selected.size>MEDIA_MAX_INPUT)throw Error("Input files are limited to 100 MB.");
  const isVideo=selected.type.startsWith("video/")||["mp4","m4v","mov","mkv","avi","webm","wmv","mpg","mpeg","3gp","ts"].includes(extensionFor(selected));
  const isAudio=selected.type.startsWith("audio/")||["mp3","wav","m4a","aac","ogg","oga","flac","opus","wma"].includes(extensionFor(selected));
  if(video&&!isVideo)throw Error("Choose a video file.");
  if(!video&&a!=="extract"&&!isAudio)throw Error("Choose an audio file.");
  if(!video&&a==="extract"&&!isVideo)throw Error("Choose a video file to extract audio from.");
 };
 const outputSpec=()=>{
  const a=action();
  if(video){
   if(a==="compress"||a==="trim"||a==="mute")return{ext:"mp4",mime:"video/mp4"};
   if(a==="extract")return{ext:"mp3",mime:"audio/mpeg"};
   const ext=$("#media-format",root).value;
   return{ext,mime:ext==="gif"?"image/gif":ext==="webm"?"video/webm":"video/mp4"};
  }
  const ext=$("#media-format",root)?.value||"mp3";
  return{ext,mime:ext==="wav"?"audio/wav":ext==="ogg"?"audio/ogg":"audio/mpeg"};
 };
 const argsFor=(input,output)=>{
  const a=action(),spec=outputSpec(),args=[];
  if(a==="trim"){
   const start=Number($("#media-start",root).value),duration=Number($("#media-duration",root).value);
   if(!Number.isFinite(start)||start<0||start>3600)throw Error("Start time must be between 0 and 3,600 seconds.");
   if(!Number.isFinite(duration)||duration<=0||duration>3600)throw Error("Duration must be between 0 and 3,600 seconds.");
   args.push("-ss",String(start),"-i",input,"-t",String(duration));
  }else args.push("-i",input);
  if(video){
   if(a==="compress")args.push("-c:v","libx264","-preset","veryfast","-crf","28","-c:a","aac","-b:a","128k","-threads","2","-movflags","+faststart");
   if(a==="trim")args.push("-c:v","libx264","-preset","veryfast","-crf","23","-c:a","aac","-b:a","128k","-threads","2","-movflags","+faststart");
   if(a==="mute")args.push("-an","-c:v","libx264","-preset","veryfast","-crf","23","-threads","2","-movflags","+faststart");
   if(a==="extract")args.push("-vn","-c:a","libmp3lame","-q:a","4");
   if(a==="convert"&&spec.ext==="mp4")args.push("-c:v","libx264","-preset","veryfast","-crf","23","-c:a","aac","-b:a","128k","-threads","2","-movflags","+faststart");
   if(a==="convert"&&spec.ext==="webm")args.push("-c:v","libvpx","-crf","32","-b:v","0","-c:a","libopus","-threads","1");
   if(a==="convert"&&spec.ext==="gif")args.push("-t","30","-vf","fps=12,scale=720:-1:flags=lanczos","-loop","0");
  }else if(spec.ext==="mp3")args.push("-vn","-c:a","libmp3lame","-q:a","4");
  else if(spec.ext==="wav")args.push("-vn","-c:a","pcm_s16le");
  else args.push("-vn","-c:a","libvorbis","-q:a","5");
  args.push("-fs",String(MEDIA_MAX_OUTPUT),output);
  return args;
 };
 const safeName=name=>name.replace(/\.[^.]+$/,"").replace(/[^\w.-]+/g,"_").slice(0,80)||"media";
 const release=()=>{
  if(root.isConnected)return;
  if(ffmpeg){ffmpeg.terminate();ffmpeg=null;ffmpegPromise=null}
  removeEventListener("hashchange",onHashChange);
 };
 const onHashChange=()=>setTimeout(release,0);
 addEventListener("hashchange",onHashChange);
 $("#media-action",root).onchange=()=>{renderOptions();run.disabled=!file};
 drop($("#media-drop",root),{accept:"video/*,audio/*",multiple:false,onFiles:files=>{
  file=files[0]||null;fileLabel.textContent=file?`${file.name} (${kb(file.size)})`:"";run.disabled=!file||running;
  if(file)setStatus("Media file ready.");
 }});
 renderOptions();
 run.onclick=async()=>{
  if(!file||running)return;
  running=true;run.disabled=true;setStatus("Preparing local FFmpeg…");
  let engine=null,input=null,output=null;
  try{
   validateInput(file,action());
   const spec=outputSpec(),inputExt=extensionFor(file);
   input=`input.${inputExt}`;output=`output.${spec.ext}`;
   engine=await getFfmpeg();
   setStatus("Loading input into the local FFmpeg worker…");
   await engine.writeFile(input,new Uint8Array(await file.arrayBuffer()));
   setStatus("Processing media locally…");
   const code=await engine.exec(argsFor(input,output),10*60*1000);
   if(code!==0)throw Error("FFmpeg could not process this media (exit code "+code+").");
   const data=await engine.readFile(output);
   if(!(data instanceof Uint8Array))throw Error("FFmpeg returned an invalid output.");
   if(data.byteLength>MEDIA_MAX_OUTPUT)throw Error("The output exceeds the 200 MB limit.");
   if(!data.byteLength)throw Error("FFmpeg produced an empty output.");
   const name=`${safeName(file.name)}-${action()}.${spec.ext}`;
   download(new Blob([data],{type:spec.mime}),name);setStatus(`Done. ${name} is ready.`,"ok");
  }catch(error){
   const message=typeof error?.message==="string"?error.message.trim():"";
   const fallback=error?.name==="RuntimeError"?String(error):"FFmpeg could not process this media.";
   setStatus(message||fallback,"err");
   if(error?.name==="RuntimeError"&&engine){
    engine.terminate();
    if(ffmpeg===engine){ffmpeg=null;ffmpegPromise=null}
    engine=null;
   }
  }
  finally{
   if(engine&&root.isConnected)await removeFiles(engine,[input,output].filter(Boolean));
   running=false;run.disabled=!file;
  }
 };
}
