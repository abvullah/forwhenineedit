/* More utilities: dependency-free, run in the browser. Registered into TOOLS below. */
function diffTool(root){
 root.innerHTML=`<div class="opts" style="align-items:stretch"><label style="flex:1;min-width:240px">Original<textarea id="a"></textarea></label><label style="flex:1;min-width:240px">Changed<textarea id="b"></textarea></label></div><button class="btn p" id="go">Compare</button><pre id="o" style="white-space:pre-wrap;margin-top:16px" role="status"></pre>`;
 $("#go",root).onclick=()=>{const A=$("#a",root).value.split("\n"),B=$("#b",root).value.split("\n"),o=$("#o",root);o.textContent="";
  if(A.length>1500||B.length>1500){o.textContent="Limit is 1,500 lines per side.";return}
  const n=A.length,m=B.length,L=Array.from({length:n+1},()=>new Uint16Array(m+1));
  for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)L[i][j]=A[i]===B[j]?L[i+1][j+1]+1:Math.max(L[i+1][j],L[i][j+1]);
  const add=(t,c,s)=>{const d=document.createElement("div");d.textContent=s+t;d.style.cssText="padding:0 6px;"+(c?"background:"+c:"");o.append(d)};
  let i=0,j=0,ch=0;while(i<n||j<m){if(i<n&&j<m&&A[i]===B[j]){add(A[i],"","  ");i++;j++}else if(j<m&&(i===n||L[i][j+1]>=L[i+1][j])){add(B[j++],"color-mix(in srgb,var(--txt) 22%,transparent)","+ ");ch++}else{add(A[i++],"color-mix(in srgb,var(--pdf) 22%,transparent)","− ");ch++}}
  if(!ch)o.prepend(Object.assign(document.createElement("div"),{textContent:"No differences.",className:"ok"}))};
}
function regexTool(root){
 root.innerHTML=`<div class="opts"><label>Pattern<input id="p" type="text" value="\\b\\w+@\\w+\\.\\w+\\b"></label><label>Flags<input id="f" type="text" value="g" size="4"></label></div><label>Test text<textarea id="t"></textarea></label><p id="r" role="status"></p><div id="l"></div>`;
 const run=()=>{const r=$("#r",root),l=$("#l",root);l.innerHTML="";try{const f=$("#f",root).value.includes("g")?$("#f",root).value:$("#f",root).value+"g",re=new RegExp($("#p",root).value,f),t=$("#t",root).value;let c=0,m;
  while((m=re.exec(t))&&c<500){c++;const d=el("<div class='row'></div>");d.textContent=m.index+": "+m[0];l.append(d);if(!m[0])re.lastIndex++}
  r.className="ok";r.textContent=c+" match"+(c===1?"":"es")}catch(e){r.className="err";r.textContent=e.message}};
 root.addEventListener("input",run);run();
}
function loremTool(root){
 const W="lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum fugiat nulla pariatur".split(" ");
 root.innerHTML=`<div class="opts"><label>Paragraphs<input id="n" type="number" min="1" max="20" value="3"></label><button class="btn p" id="g">Generate</button></div><textarea id="o" readonly style="min-height:240px"></textarea>`;
 const rnd=n=>crypto.getRandomValues(new Uint32Array(1))[0]%n;
 $("#g",root).onclick=()=>{const n=Math.min(20,Math.max(1,+$("#n",root).value||1));$("#o",root).value=Array.from({length:n},()=>{let s=Array.from({length:4+rnd(4)},()=>Array.from({length:6+rnd(8)},()=>W[rnd(W.length)]).join(" ")).map(x=>x[0].toUpperCase()+x.slice(1)+".").join(" ");return s}).join("\n\n")};$("#g",root).click();
}
function percentTool(root){
 root.innerHTML=`<div class="opts"><b>What is</b><label>%<input id="a" type="number" value="15"></label><b>of</b><label>number<input id="b" type="number" value="200"></label><b id="r1" class="ok"></b></div><div class="opts"><label>X<input id="c" type="number" value="30"></label><b>is what % of</b><label>Y<input id="d" type="number" value="120"></label><b id="r2" class="ok"></b></div><div class="opts"><label>From<input id="e" type="number" value="80"></label><label>To<input id="f" type="number" value="100"></label><b>change:</b><b id="r3" class="ok"></b></div>`;
 const g=i=>+$("#"+i,root).value,fmt=x=>isFinite(x)?+x.toFixed(4)+"":"n/a",calc=()=>{$("#r1",root).textContent=fmt(g("a")/100*g("b"));$("#r2",root).textContent=fmt(g("c")/g("d")*100)+"%";$("#r3",root).textContent=fmt((g("f")-g("e"))/Math.abs(g("e"))*100)+"%"};
 root.addEventListener("input",calc);calc();
}
function unitTool(root){
 const U={Length:{mm:.001,cm:.01,m:1,km:1000,in:.0254,ft:.3048,yd:.9144,mi:1609.344},Weight:{g:.001,kg:1,oz:.028349523,lb:.45359237},Temperature:{C:0,F:0,K:0}};
 root.innerHTML=`<div class="opts"><label>Type<select id="t">${Object.keys(U).map(k=>`<option>${k}</option>`).join("")}</select></label><label>Value<input id="v" type="number" value="1"></label><label>From<select id="a"></select></label><label>To<select id="b"></select></label></div><p id="r" class="ok" style="font-size:1.4rem" role="status"></p>`;
 const fill=()=>{const k=Object.keys(U[$("#t",root).value]).map(x=>`<option>${x}</option>`).join("");$("#a",root).innerHTML=k;$("#b",root).innerHTML=k;$("#b",root).selectedIndex=1;calc()};
 const calc=()=>{const t=$("#t",root).value,v=+$("#v",root).value,a=$("#a",root).value,b=$("#b",root).value;let r;
  if(t==="Temperature"){const c=a==="C"?v:a==="F"?(v-32)*5/9:v-273.15;r=b==="C"?c:b==="F"?c*9/5+32:c+273.15}else r=v*U[t][a]/U[t][b];
  $("#r",root).textContent=+r.toPrecision(8)+" "+b};
 $("#t",root).onchange=fill;root.addEventListener("input",calc);fill();
}
function colorTool(root){
 root.innerHTML=`<div class="opts"><label>Pick<input id="c" type="color" value="#7c4dff" style="min-height:48px;width:80px"></label><label>Hex<input id="h" type="text" value="#7c4dff" size="9"></label></div><p id="o" role="status"></p><div id="p" style="display:flex;gap:8px;flex-wrap:wrap"></div>`;
 const hsl=(r,g,b)=>{r/=255;g/=255;b/=255;const M=Math.max(r,g,b),m=Math.min(r,g,b),l=(M+m)/2,d=M-m;let h=0,s=0;if(d){s=d/(1-Math.abs(2*l-1));h=M===r?((g-b)/d)%6:M===g?(b-r)/d+2:(r-g)/d+4;h=(h*60+360)%360}return[Math.round(h),Math.round(s*100),Math.round(l*100)]};
 const fromHsl=(h,s,l)=>{s/=100;l/=100;const k=n=>(n+h/30)%12,a=s*Math.min(l,1-l),f=n=>l-a*Math.max(-1,Math.min(k(n)-3,Math.min(9-k(n),1)));return"#"+[f(0),f(8),f(4)].map(x=>Math.round(x*255).toString(16).padStart(2,"0")).join("")};
 const show=hex=>{if(!/^#[0-9a-f]{6}$/i.test(hex)){$("#o",root).className="err";$("#o",root).textContent="Enter a 6-digit hex like #7c4dff.";return}
  const[r,g,b]=[1,3,5].map(i=>parseInt(hex.substr(i,2),16)),[h,s,l]=hsl(r,g,b);$("#o",root).className="";$("#o",root).textContent=`${hex.toLowerCase()}   rgb(${r}, ${g}, ${b})   hsl(${h}, ${s}%, ${l}%)`;
  const p=$("#p",root);p.innerHTML="";[["Base",h],["Complement",h+180],["Analogous −30",h-30],["Analogous +30",h+30],["Triad +120",h+120],["Triad +240",h+240]].forEach(([n,x])=>{const c=fromHsl((x+360)%360,s,l),b=el(`<button class="btn" style="min-width:110px;border-left:24px solid ${c}"></button>`);b.textContent=c;b.title=n;b.setAttribute("aria-label",n+" "+c+", copy");b.onclick=()=>navigator.clipboard?.writeText(c);p.append(b)})};
 $("#c",root).oninput=e=>{$("#h",root).value=e.target.value;show(e.target.value)};$("#h",root).oninput=e=>show(e.target.value.trim());show("#7c4dff");
}
function imgB64Tool(root){
 root.innerHTML=`<div id="d"></div><label style="margin-top:12px">Data URL<textarea id="o" readonly></textarea></label><div class="opts"><button class="btn" id="cp">Copy</button></div><p id="m" role="status"></p>`;
 drop($("#d",root),{accept:"image/*",multiple:false,onFiles:async f=>{const m=$("#m",root);if(f[0].size>5*1048576){m.className="err";m.textContent="Limit is 5 MB.";return}
  if(!["jpg","png","webp","gif"].includes(await sniff(f[0]))){m.className="err";m.textContent="Use a JPG, PNG, WEBP or GIF.";return}
  const r=new FileReader();r.onload=()=>{$("#o",root).value=r.result;m.className="ok";m.textContent=kb(r.result.length)+" of text"};r.readAsDataURL(f[0])}});
 $("#cp",root).onclick=()=>navigator.clipboard?.writeText($("#o",root).value);
}
const T2=(id,name,d,run,b)=>({id,name,cat:"util",d,run,b,how:["Open the tool","Enter your input","Copy or download the result"],faq:[["Is my data sent anywhere?","No. Everything runs in your browser."]]});
TOOLS.push(
 T2("text-diff","Text diff checker","Compare two texts line by line.",diffTool,"New"),
 T2("regex-tester","Regex tester","Test patterns and see every match.",regexTool,"New"),
 T2("lorem-ipsum","Lorem ipsum generator","Placeholder paragraphs on demand.",loremTool),
 T2("percentage","Percentage calculator","Percent of, percent change and ratios.",percentTool),
 T2("unit-converter","Unit converter","Length, weight and temperature.",unitTool),
 T2("color-palette","Colour converter and palette","HEX, RGB, HSL plus matching colours.",colorTool,"New"),
 T2("image-to-base64","Image to Base64","Turn an image into a data URL.",imgB64Tool),
 T2("url-encode","URL encode/decode","Percent-encode or decode text.",r=>textTool(r,[["Encode",t=>encodeURIComponent(t)],["Decode",t=>decodeURIComponent(t)]]))
);
