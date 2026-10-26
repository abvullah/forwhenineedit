/* ---------- PDF tools (pdf-lib) ---------- */
const PL=()=>{if(!window.PDFLib)throw Error("PDF engine failed to load. Check your connection and reload.");return PDFLib};
async function loadPdf(file){if(await sniff(file)!=="pdf")throw Error(file.name+" isn’t a PDF.");
 if(file.size>100*1048576)throw Error(file.name+" is over the 100 MB limit.");
 return PL().PDFDocument.load(await file.arrayBuffer(),{ignoreEncryption:false})}
function parseRange(s,n){const set=new Set();for(const part of s.split(",")){const m=part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);if(!m)throw Error("Use ranges like 1-3, 5, 8-10.");
 const a=+m[1],b=+(m[2]||m[1]);if(a<1||b>n||a>b)throw Error("Pages must be between 1 and "+n+".");for(let i=a;i<=b;i++)set.add(i-1)}return[...set].sort((x,y)=>x-y)}
function status(root){const s=el(`<p role="status"></p>`);root.append(s);return(t,bad)=>{s.className=bad?"err":"ok";s.textContent=t}}

function mergeTool(root){
 let files=[];const list=el("<div></div>"),go=el(`<button class="btn p" disabled>Merge PDF</button>`);const st=status(root);
 const draw=()=>{list.innerHTML="";files.forEach((f,i)=>{const r=el(`<div class="row"><span class="n">${i+1}. ${esc(f.name)} (${kb(f.size)})</span></div>`);
  [["↑",-1],["↓",1]].forEach(([t,d])=>{const b=el(`<button class="sm" aria-label="Move ${d<0?"up":"down"}">${t}</button>`);b.onclick=()=>{const j=i+d;if(j<0||j>=files.length)return;[files[i],files[j]]=[files[j],files[i]];draw()};r.append(b)});
  const x=el(`<button class="sm" aria-label="Remove ${esc(f.name)}">✕</button>`);x.onclick=()=>{files.splice(i,1);draw()};r.append(x);list.append(r)});go.disabled=files.length<2};
 drop(root,{accept:"application/pdf",onFiles:f=>{files.push(...f);draw()}});root.append(list,el(`<div class="opts"></div>`));
 $(".opts",root).append(go);
 go.onclick=async()=>{try{st("Merging…");const out=await PL().PDFDocument.create();
  for(const f of files){const d=await loadPdf(f);(await out.copyPages(d,d.getPageIndices())).forEach(p=>out.addPage(p))}
  const bytes=await out.save();download(new Blob([bytes],{type:"application/pdf"}),"merged.pdf");st("Done. "+out.getPageCount()+" pages, "+kb(bytes.length)+".")}catch(e){st(e.message.includes("encrypted")?"One file is password-protected. Unlock it first.":e.message,1)}};
 root.append(el(`<p class="note">Files are read and merged on your device. Reorder with the arrows.</p>`));
}
function pagesTool(root,mode){
 const keep=mode==="extract";let file;
 const o=el(`<div class="opts"><label>Pages<input id="r" type="text" placeholder="e.g. 1-3, 5" value=""></label><button class="btn p" id="go" disabled>${keep?"Extract pages":"Remove pages"}</button></div>`);
 const info=el("<p></p>");const st=status(root);
 drop(root,{accept:"application/pdf",multiple:false,onFiles:async f=>{try{file=f[0];const d=await loadPdf(file);info.textContent=file.name+": "+d.getPageCount()+" pages";info.dataset.n=d.getPageCount();$("#go",o).disabled=false;st("")}catch(e){st(e.message,1)}}});
 root.append(info,o);
 $("#go",o).onclick=async()=>{try{const d=await loadPdf(file),n=d.getPageCount();let idx=parseRange($("#r",o).value,n);
  if(!keep)idx=d.getPageIndices().filter(i=>!idx.includes(i));if(!idx.length)throw Error("That would leave no pages.");
  const out=await PL().PDFDocument.create();(await out.copyPages(d,idx)).forEach(p=>out.addPage(p));
  download(new Blob([await out.save()],{type:"application/pdf"}),(keep?"extracted":"trimmed")+".pdf");st("Done. "+idx.length+" pages saved.")}catch(e){st(e.message,1)}};
}
function rotateTool(root){
 let file;const o=el(`<div class="opts"><label>Rotate<select id="a"><option value="90">90° clockwise</option><option value="180">180°</option><option value="270">90° counter-clockwise</option></select></label><button class="btn p" id="go" disabled>Rotate PDF</button></div>`);const st=status(root);
 drop(root,{accept:"application/pdf",multiple:false,onFiles:f=>{file=f[0];$("#go",o).disabled=false;st(file.name+" ready")}});root.append(o);
 $("#go",o).onclick=async()=>{try{const d=await loadPdf(file),a=+$("#a",o).value;d.getPages().forEach(p=>p.setRotation(PL().degrees((p.getRotation().angle+a)%360)));
  download(new Blob([await d.save()],{type:"application/pdf"}),"rotated.pdf");st("Done.")}catch(e){st(e.message,1)}};
}
function numbersTool(root){
 let file;const o=el(`<div class="opts"><label>Position<select id="p"><option value="c">Bottom centre</option><option value="r">Bottom right</option></select></label><button class="btn p" id="go" disabled>Add page numbers</button></div>`);const st=status(root);
 drop(root,{accept:"application/pdf",multiple:false,onFiles:f=>{file=f[0];$("#go",o).disabled=false;st(file.name+" ready")}});root.append(o);
 $("#go",o).onclick=async()=>{try{const d=await loadPdf(file),P=PL(),f=await d.embedFont(P.StandardFonts.Helvetica),n=d.getPageCount();
  d.getPages().forEach((pg,i)=>{const t=(i+1)+" / "+n,w=f.widthOfTextAtSize(t,10),W=pg.getWidth();pg.drawText(t,{x:$("#p",o).value==="c"?(W-w)/2:W-w-36,y:20,size:10,font:f,color:P.rgb(.3,.3,.3)})});
  download(new Blob([await d.save()],{type:"application/pdf"}),"numbered.pdf");st("Done.")}catch(e){st(e.message,1)}};
}
function watermarkTool(root){
 let file;const o=el(`<div class="opts"><label>Watermark text<input id="t" type="text" value="CONFIDENTIAL"></label><label>Opacity (%)<input id="a" type="number" min="5" max="100" value="20"></label><button class="btn p" id="go" disabled>Add watermark</button></div>`);const st=status(root);
 drop(root,{accept:"application/pdf",multiple:false,onFiles:f=>{file=f[0];$("#go",o).disabled=false;st(file.name+" ready")}});root.append(o);
 $("#go",o).onclick=async()=>{try{const d=await loadPdf(file),P=PL(),f=await d.embedFont(P.StandardFonts.HelveticaBold),t=$("#t",o).value||" ";
  d.getPages().forEach(pg=>{const{width:W,height:H}=pg.getSize(),sz=Math.min(W,H)/Math.max(6,t.length*.6),w=f.widthOfTextAtSize(t,sz),a=Math.PI/4;
   pg.drawText(t,{x:W/2-Math.cos(a)*w/2,y:H/2-Math.sin(a)*w/2,size:sz,font:f,rotate:P.degrees(45),color:P.rgb(.5,.5,.5),opacity:Math.min(1,Math.max(.05,$("#a",o).value/100))})});
  download(new Blob([await d.save()],{type:"application/pdf"}),"watermarked.pdf");st("Done.")}catch(e){st(e.message,1)}};
}
function splitAllTool(root){
 let file;const o=el(`<div class="opts"><button class="btn p" id="go" disabled>Split into single pages (ZIP)</button></div>`);const st=status(root);
 drop(root,{accept:"application/pdf",multiple:false,onFiles:f=>{file=f[0];$("#go",o).disabled=false;st(file.name+" ready")}});root.append(o);
 $("#go",o).onclick=async()=>{try{if(!window.JSZip)throw Error("ZIP engine failed to load. Reload and try again.");const d=await loadPdf(file),z=new JSZip(),n=d.getPageCount();
  if(n>500)throw Error("Limit is 500 pages.");
  for(let i=0;i<n;i++){const out=await PL().PDFDocument.create();out.addPage((await out.copyPages(d,[i]))[0]);z.file("page-"+String(i+1).padStart(3,"0")+".pdf",await out.save());st("Page "+(i+1)+" of "+n+"…")}
  download(await z.generateAsync({type:"blob"}),"pages.zip");st("Done. "+n+" files.")}catch(e){st(e.message,1)}};
}
function img2pdfTool(root){
 let files=[];const list=el("<div></div>");const st=status(root);
 const o=el(`<div class="opts"><label>Page size<select id="s"><option value="fit">Fit to image</option><option value="a4">A4</option></select></label><button class="btn p" id="go" disabled>Create PDF</button></div>`);
 const draw=()=>{list.innerHTML="";files.forEach((f,i)=>{const r=el(`<div class="row"><span class="n">${i+1}. ${esc(f.name)}</span></div>`);const x=el(`<button class="sm" aria-label="Remove ${esc(f.name)}">✕</button>`);x.onclick=()=>{files.splice(i,1);draw()};r.append(x);list.append(r)});$("#go",o).disabled=!files.length};
 drop(root,{accept:"image/*",onFiles:async f=>{for(const x of f){const k=await sniff(x);if(["jpg","png","webp","gif"].includes(k))files.push(x);else st(x.name+" isn’t a supported image.",1)}draw()}});root.append(list,o);
 $("#go",o).onclick=async()=>{try{st("Building…");const out=await PL().PDFDocument.create();
  for(const f of files){const k=await sniff(f);let img;
   if(k==="jpg")img=await out.embedJpg(await f.arrayBuffer());else if(k==="png")img=await out.embedPng(await f.arrayBuffer());
   else{const b=await createImageBitmap(f),c=document.createElement("canvas");c.width=b.width;c.height=b.height;c.getContext("2d").drawImage(b,0,0);img=await out.embedPng(await (await new Promise(r=>c.toBlob(r,"image/png"))).arrayBuffer())}
   let[w,h]=[img.width,img.height];let pw=w,ph=h;
   if($("#s",o).value==="a4"){pw=595;ph=842;const s=Math.min((pw-40)/w,(ph-40)/h);w*=s;h*=s}
   out.addPage([pw,ph]).drawImage(img,{x:(pw-w)/2,y:(ph-h)/2,width:w,height:h})}
  download(new Blob([await out.save()],{type:"application/pdf"}),"images.pdf");st("Done. "+files.length+" pages.")}catch(e){st(e.message,1)}};
}
