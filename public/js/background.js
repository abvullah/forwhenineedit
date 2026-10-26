function bgTool(root){
 root.innerHTML=`<div class="opts"><label>Tolerance (<span id="tv">40</span>)<input id="t" type="range" min="5" max="150" value="40"></label><label>Replace with<select id="m"><option value="t">Transparent</option><option value="#ffffff">White</option><option value="c">Custom colour</option></select></label><label>Colour<input id="c" type="color" value="#7c4dff"></label></div><div id="d"></div><div id="v" style="margin-top:16px"></div><p class="note">This removes a plain or evenly coloured background by colour, not with AI. Raise tolerance for shadows or gradients. Cluttered backgrounds need an AI model, which this page can’t load.</p>`;
 let img,name;const v=$("#v",root);
 const run=()=>{if(!img)return;const s=Math.min(1,2000/Math.max(img.width,img.height)),W=Math.round(img.width*s),H=Math.round(img.height*s);
  const c=document.createElement("canvas");c.width=W;c.height=H;const x=c.getContext("2d",{willReadFrequently:true});x.drawImage(img,0,0,W,H);
  const id=x.getImageData(0,0,W,H),D=id.data,at=(px,py)=>(py*W+px)*4,cs=[[0,0],[W-1,0],[0,H-1],[W-1,H-1]].map(([a,b])=>at(a,b));
  const k=[0,1,2].map(j=>cs.reduce((m,i)=>m+D[i+j],0)/4),tol=+$("#t",root).value,T=tol*tol,seen=new Uint8Array(W*H),st=[];
  const near=p=>{const i=p*4;return(D[i]-k[0])**2+(D[i+1]-k[1])**2+(D[i+2]-k[2])**2<=T};
  const push=p=>{if(!seen[p]&&near(p)){seen[p]=1;st.push(p)}};
  for(let i=0;i<W;i++){push(i);push((H-1)*W+i)}for(let j=0;j<H;j++){push(j*W);push(j*W+W-1)}
  while(st.length){const p=st.pop(),px=p%W,py=(p/W)|0;if(px>0)push(p-1);if(px<W-1)push(p+1);if(py>0)push(p-W);if(py<H-1)push(p+W)}
  const m=$("#m",root).value,hex=m==="c"?$("#c",root).value:m,rgb=hex[0]==="#"?[1,3,5].map(i=>parseInt(hex.substr(i,2),16)):null;
  for(let p=0;p<W*H;p++)if(seen[p]){const i=p*4;if(rgb){D[i]=rgb[0];D[i+1]=rgb[1];D[i+2]=rgb[2];D[i+3]=255}else D[i+3]=0}
  x.putImageData(id,0,0);c.style.cssText="max-width:100%;border-radius:10px;background:repeating-conic-gradient(#ccc 0 25%,#fff 0 50%) 0 0/20px 20px";
  v.innerHTML="";v.append(c);const b=el(`<button class="btn p" style="margin-top:12px">Download PNG</button>`);
  b.onclick=()=>c.toBlob(bl=>download(bl,name.replace(/\.\w+$/,"")+"-nobg.png"));v.append(b);say("Background removed")};
 $("#t",root).oninput=e=>{$("#tv",root).textContent=e.target.value};
 ["#t","#m","#c"].forEach(s=>$(s,root).onchange=run);
 drop($("#d",root),{accept:"image/*",multiple:false,onFiles:async f=>{const k=await sniff(f[0]);if(!["jpg","png","webp"].includes(k)){v.innerHTML='<p class="err">Use a JPG, PNG or WEBP image.</p>';return}
  try{img=await createImageBitmap(f[0]);name=f[0].name;run()}catch(e){v.innerHTML='<p class="err">Couldn’t read that image.</p>'}}});
}
