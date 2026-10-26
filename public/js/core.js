const CONFIG={brand:"For when I need it"};
const $=(s,r=document)=>r.querySelector(s);
const el=(h)=>{const t=document.createElement("template");t.innerHTML=h.trim();return t.content.firstChild};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const kb=n=>n>1048576?(n/1048576).toFixed(2)+" MB":(n/1024).toFixed(1)+" KB";
const say=t=>{$("#live").textContent=t};
const CATS={pdf:["PDF","var(--pdf)"],image:["Image","var(--img)"],util:["Utilities","var(--txt)"]};
document.title=CONFIG.brand+" – browser file and image tools";
$("#logo").textContent=CONFIG.brand;
$("#foot").innerHTML="<p>Your files are processed in your browser and are not uploaded to us.</p><nav class='footer-links' aria-label='Site information'><a href='/about'>About</a><a href='/accessibility'>Accessibility</a><a href='/security'>Security</a><a href='/ai-disclosure'>AI disclosure</a><a href='/copyright'>Copyright</a><a href='#privacy'>Privacy</a><a href='#terms'>Terms</a></nav><p>Made with love by <a href='https://abvullah.github.io' target='_blank' rel='noopener noreferrer'>Abdullah</a></p>";

function download(blob,name){const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}
function drop(root,{accept,multiple=true,onFiles,label}){
 const d=el(`<div class="drop" tabindex="0" role="button" aria-label="${esc(label||"Select files")}"><b>Drop ${multiple?"files":"a file"} here</b><div class="sub" style="margin:6px 0 0">or click to select. You can also paste an image.</div><input type="file" hidden ${multiple?"multiple":""} accept="${accept}"></div>`);
 const inp=$("input",d);
 d.onclick=()=>inp.click();d.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();inp.click()}};
 inp.onchange=()=>{onFiles([...inp.files]);inp.value=""};
 ["dragenter","dragover"].forEach(v=>d.addEventListener(v,e=>{e.preventDefault();d.classList.add("over")}));
 ["dragleave","drop"].forEach(v=>d.addEventListener(v,e=>{e.preventDefault();d.classList.remove("over")}));
 d.addEventListener("drop",e=>onFiles([...e.dataTransfer.files]));
 root._paste&&removeEventListener("paste",root._paste);
 root._paste=e=>{const f=[...(e.clipboardData?.files||[])];if(f.length)onFiles(f)};addEventListener("paste",root._paste);
 root.append(d);return d;
}
async function sniff(file){const b=new Uint8Array(await file.slice(0,12).arrayBuffer());const h=[...b].map(x=>x.toString(16).padStart(2,"0")).join("");
 if(h.startsWith("25504446"))return"pdf";if(h.startsWith("ffd8ff"))return"jpg";if(h.startsWith("89504e47"))return"png";
 if(h.startsWith("52494646")&&h.slice(16,24)==="57454250")return"webp";if(h.startsWith("47494638"))return"gif";return"other"}
