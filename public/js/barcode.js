function barcodeTool(root){
 root.innerHTML=`<div class="opts">
  <label>Barcode format<select id="barcode-format"><option value="CODE128">Code 128</option><option value="CODE39">Code 39</option><option value="EAN13">EAN-13</option></select></label>
  <label>Barcode value<input id="barcode-value" type="text" maxlength="80" placeholder="Enter a value"></label>
  <button id="barcode-create" class="btn p" type="button">Create barcode</button>
 </div>
 <p id="barcode-status" class="note" role="status" aria-live="polite"></p>
 <div id="barcode-preview" class="barcode-preview"></div>
 <div id="barcode-downloads" class="opts" hidden><button id="barcode-png" class="btn" type="button">Download PNG</button><button id="barcode-svg" class="btn" type="button">Download SVG</button></div>
 <p class="note">EAN-13 accepts 12 digits (the check digit is added) or 13 digits (the check digit is verified). Code 39 supports uppercase letters, digits and its standard symbols.</p>`;
 const status=$("#barcode-status",root),preview=$("#barcode-preview",root),downloads=$("#barcode-downloads",root);
 let svg=null,value="";
 const filename=()=>value.slice(0,24).replace(/[^\w.-]+/g,"_")||"code";
 const setStatus=(text,kind="note")=>{status.textContent=text;status.className=kind};
 const normalizeEan=value=>{
  if(!/^\d{12,13}$/.test(value))throw Error("EAN-13 needs 12 digits, or 13 digits including its check digit.");
  const digits=value.slice(0,12).split("").map(Number);
  const check=(10-digits.reduce((sum,digit,index)=>sum+digit*(index%2?3:1),0)%10)%10;
  if(value.length===13&&Number(value[12])!==check)throw Error("That EAN-13 check digit is invalid; expected "+check+".");
  return value.length===12?value+check:value;
 };
 $("#barcode-create",root).onclick=()=>{
  try{
   if(typeof JsBarcode!=="function")throw Error("The local barcode generator failed to load.");
   const format=$("#barcode-format",root).value;
   value=$("#barcode-value",root).value.trim();
   if(!value)throw Error("Enter a barcode value.");
   if(value.length>80)throw Error("Barcode values are limited to 80 characters.");
   if(format==="EAN13")value=normalizeEan(value);
   svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
   JsBarcode(svg,value,{format,lineColor:"#111111",background:"#ffffff",width:2,height:100,displayValue:true,fontSize:18,margin:12});
   svg.classList.add("barcode-svg");preview.replaceChildren(svg);downloads.hidden=false;setStatus("Barcode ready.");
  }catch(error){svg=null;preview.replaceChildren();downloads.hidden=true;setStatus(error.message,"err")}
 };
 $("#barcode-svg",root).onclick=()=>{
  if(svg)download(new Blob([new XMLSerializer().serializeToString(svg)],{type:"image/svg+xml"}),`barcode-${filename()}.svg`);
 };
 $("#barcode-png",root).onclick=async()=>{
  if(!svg)return;
  const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:"image/svg+xml;charset=utf-8"}));
  try{
   const image=new Image(),loaded=new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error("Could not render the barcode SVG."))});
   image.src=url;await loaded;
   const canvas=document.createElement("canvas");canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
   const ctx=canvas.getContext("2d");if(!ctx)throw Error("Could not create a PNG canvas.");
   ctx.drawImage(image,0,0);download(await canvasToBlob(canvas,"image/png"),`barcode-${filename()}.png`);
  }catch(error){setStatus("Could not export PNG: "+error.message,"err")}
  finally{URL.revokeObjectURL(url)}
 };
}
