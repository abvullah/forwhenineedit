/* ---------- Palette, theme ---------- */
const pal=$("#pal"),pq=$("#q",pal),res=$("#res");
function filt(){res.innerHTML="";const s=pq.value.toLowerCase();TOOLS.filter(t=>(t.name+t.d).toLowerCase().includes(s)).slice(0,6).forEach(t=>{const c=toolCard(t);c.onclick=()=>pal.close();res.append(c)})}
const openPal=()=>{pq.value="";filt();pal.showModal();pq.focus()};
$("#kbtn").onclick=openPal;pq.oninput=filt;
pq.onkeydown=e=>{if(e.key==="Enter"){const f=$("a",res);if(f){location.hash=f.getAttribute("href");pal.close()}}};
addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();openPal()}});
$("#theme").onclick=()=>{const d=document.documentElement,dark=d.dataset.theme?d.dataset.theme==="dark":true;d.dataset.theme=dark?"light":"dark";try{localStorage.setItem("theme",d.dataset.theme)}catch(error){console.warn("Could not save the theme preference:",error)}};
