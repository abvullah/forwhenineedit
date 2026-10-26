/* ---------- Views ---------- */
const main=$("#main");let cat="all";
function home(){
 document.title=CONFIG.brand+" – browser file and image tools";
 main.innerHTML=`<h1>Tools for when you need them.</h1><p class="sub">Compress images, merge PDFs, recognize text and more. Files are processed in your browser and are not uploaded to us.</p><div id="dz"></div><div class="chips" role="group" aria-label="Filter tools"></div><div class="grid"></div>`;
 const chips=$(".chips",main);
 [["all","All"],...Object.entries(CATS).map(([k,v])=>[k,v[0]])].forEach(([k,n])=>{const c=el(`<button class="chip" aria-pressed="${k===cat}"></button>`);c.textContent=n;c.onclick=()=>{cat=k;home()};chips.append(c)});
 const g=$(".grid",main);
 TOOLS.filter(t=>cat==="all"||t.cat===cat).forEach(t=>g.append(toolCard(t)));
 const dz=$("#dz",main);
 drop(dz,{accept:"*/*",label:"Drop any file to get tool suggestions",onFiles:async f=>{const k=await sniff(f[0]);const m={pdf:["merge-pdf","extract-pages","rotate-pdf"],jpg:["compress-image","strip-metadata","images-to-pdf"],png:["compress-image","convert-image","images-to-pdf"],webp:["convert-image","compress-image"],gif:["convert-image"]}[k];
  const box=el(`<div class="ws"><b>${m?"Here’s what you can do with "+esc(f[0].name):"No tool for this file type yet"}</b><div class="grid" style="margin-top:12px"></div></div>`);
  (m||[]).forEach(id=>$(".grid",box).append(toolCard(TOOLS.find(t=>t.id===id))));dz.querySelector(".ws")?.remove();dz.append(box)}});
}
function toolCard(t){const [cn,cc]=CATS[t.cat];const a=el(`<a class="card" href="#${t.id}"><span class="ic" style="background:${cc}" aria-hidden="true"></span><span><b></b><span></span></span></a>`);
 $(".ic",a).textContent=cn[0];$("b",a).textContent=t.name;if(t.b)$("b",a).append(el(`<span class="badge">${t.b}</span>`));$("b+span",a).textContent=t.d;return a}
function toolPage(t){
 document.title=t.name+" – "+CONFIG.brand;
 main.innerHTML=`<p><a href="#">← All tools</a></p><h1 style="max-width:none;font-size:clamp(1.8rem,5vw,2.8rem)"></h1><p class="sub"></p><div class="ws" id="ws"></div><h2>How it works</h2><ol id="how"></ol><h2>FAQ</h2><div id="faq"></div><h2>Related tools</h2><div class="grid" id="rel"></div><p class="note" id="privacy-note"></p>`;
 $("h1",main).textContent=t.name;$(".sub",main).textContent=t.d;
 t.how.forEach(s=>{const l=el("<li></li>");l.textContent=s;$("#how",main).append(l)});
 t.faq.forEach(([q,a])=>{const d=el("<details><summary></summary><p></p></details>");$("summary",d).textContent=q;$("p",d).textContent=a;$("#faq",main).append(d)});
 TOOLS.filter(x=>x.cat===t.cat&&x.id!==t.id).slice(0,3).forEach(x=>$("#rel",main).append(toolCard(x)));
 const ld=document.createElement("script");ld.type="application/ld+json";ld.textContent=JSON.stringify({"@context":"https://schema.org","@type":"FAQPage",mainEntity:t.faq.map(([q,a])=>({"@type":"Question",name:q,acceptedAnswer:{"@type":"Answer",text:a}}))});main.append(ld);
 $("#privacy-note",main).textContent="Privacy: your files stay on your device and are processed in this browser.";
 t.run($("#ws",main));
}
function route(){const h=location.hash.slice(1),t=TOOLS.find(x=>x.id===h);LEGAL[h]?legalPage(h):t?toolPage(t):home();scrollTo(0,0);$("#main").focus?.()}
addEventListener("hashchange",route);
