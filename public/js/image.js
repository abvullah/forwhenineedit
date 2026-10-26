/* ---------- Image tools (canvas, in-browser) ---------- */
function imageTool(root,p){
 root.innerHTML=`<div class="opts">
 <label>Format<select id="f"><option value="image/jpeg">JPG</option><option value="image/png">PNG</option><option value="image/webp">WEBP</option></select></label>
 <label>Quality (${p.q}%)<input id="q" type="range" min="10" max="100" value="${p.q}"></label>
 <label>Max width (px, 0 = original)<input id="w" type="number" min="0" value="${p.w}"></label></div><div id="d"></div><div id="out"></div>
 <p class="note">${p.note}</p>`;
 $("#f",root).value=p.f;const q=$("#q",root);q.oninput=()=>q.previousSibling.textContent="Quality ("+q.value+"%)";
 const out=$("#out",root);
 const run=async files=>{
  for(const file of files){
   const kind=await sniff(file);
   if(!["jpg","png","webp","gif"].includes(kind)){out.append(el(`<p class="err">${esc(file.name)} isn’t a supported image. Use JPG, PNG, WEBP or GIF.</p>`));continue}
   const row=el(`<div class="row"><span class="n">${esc(file.name)}</span><span>working…</span></div>`);out.append(row);
   try{
    const bmp=await createImageBitmap(file);const mw=+$("#w",root).value;
    const s=mw&&bmp.width>mw?mw/bmp.width:1;const W=Math.round(bmp.width*s),H=Math.round(bmp.height*s);
    if(W*H>100e6)throw Error("Image is over 100 megapixels");
    const c=document.createElement("canvas");c.width=W;c.height=H;const x=c.getContext("2d");
    const type=$("#f",root).value;if(type==="image/jpeg"){x.fillStyle="#fff";x.fillRect(0,0,W,H)}
    x.drawImage(bmp,0,0,W,H);
    const blob=await new Promise(r=>c.toBlob(r,type,q.value/100));
    const ext={"image/jpeg":"jpg","image/png":"png","image/webp":"webp"}[type];
    const pct=Math.round((1-blob.size/file.size)*100);
    row.innerHTML=`<span class="n">${esc(file.name)}</span><span>${kb(file.size)} → ${kb(blob.size)} (${W}×${H}) <b class="${pct>0?"ok":""}">${pct>0?"−"+pct+"%":"+"+(-pct)+"%"}</b></span>`;
    const b=el(`<button class="btn p">Download</button>`);b.onclick=()=>download(blob,file.name.replace(/\.\w+$/,"")+"-"+p.sfx+"."+ext);row.append(b);
    say("Finished "+file.name);
   }catch(e){row.innerHTML=`<span class="n">${esc(file.name)}</span><span class="err">Couldn’t process: ${esc(e.message)}</span>`}
  }};
 drop($("#d",root),{accept:"image/*",onFiles:run});
}
