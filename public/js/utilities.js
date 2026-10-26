/* ---------- Utilities ---------- */
function textTool(root,actions,{rows=1}={}){
 root.innerHTML=`<label>Input<textarea id="i"></textarea></label><div class="opts" id="b"></div><label>Output<textarea id="o" readonly></textarea></label><div class="opts"><button class="btn" id="cp">Copy output</button></div><p id="m" role="status"></p>`;
 const i=$("#i",root),o=$("#o",root),m=$("#m",root);
 actions.forEach(([name,fn])=>{const b=el(`<button class="btn p"></button>`);b.textContent=name;b.onclick=async()=>{try{m.textContent="";const r=await fn(i.value);if(typeof r==="object"){m.textContent=Object.entries(r).map(([k,v])=>k+": "+v).join("   ");o.value=""}else o.value=r}catch(e){m.className="err";m.textContent=e.message;return}m.className="ok"};$("#b",root).append(b)});
 $("#cp",root).onclick=()=>{navigator.clipboard?.writeText(o.value);say("Copied")};
}
const hash=async(a,t)=>[...new Uint8Array(await crypto.subtle.digest(a,new TextEncoder().encode(t)))].map(x=>x.toString(16).padStart(2,"0")).join("");
function passTool(root){
 root.innerHTML=`<div class="opts"><label>Length<input id="l" type="number" min="8" max="128" value="20"></label><label><span><input id="s" type="checkbox" checked> Symbols</span></label><button class="btn p" id="g">Generate</button></div><input id="o" type="text" readonly aria-label="Password" style="width:100%;min-height:48px;padding:0 12px;border-radius:10px;border:1px solid var(--line);background:var(--bg);font-family:monospace"><p class="note">Generated with the browser’s secure random source. Never sent anywhere.</p>`;
 $("#g",root).onclick=()=>{const L=Math.min(128,Math.max(8,+$("#l",root).value||20));const set="abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"+($("#s",root).checked?"!@#$%^&*-_+=?":"");
  const r=crypto.getRandomValues(new Uint32Array(L));$("#o",root).value=[...r].map(v=>set[v%set.length]).join("")};$("#g",root).click();
}
function uuidTool(root){textTool(root,[["Generate 10 UUIDs",()=>Array.from({length:10},()=>crypto.randomUUID()).join("\n")]])}
