function qrGeneratorTool(root){
 root.innerHTML=`<div class="opts">
  <label>Content type<select id="qr-type"><option value="text">Text</option><option value="url">Website URL</option><option value="wifi">Wi-Fi</option><option value="vcard">Contact card</option></select></label>
  <label>Foreground<input id="qr-dark" type="color" value="#000000"></label>
  <label>Background<input id="qr-light" type="color" value="#ffffff"></label>
 </div>
 <div id="qr-fields"></div>
 <button id="qr-create" class="btn p" type="button">Create QR code</button>
 <p id="qr-status" class="note" role="status" aria-live="polite"></p>
 <div id="qr-preview" class="qr-preview"></div>
 <div id="qr-downloads" class="opts" hidden><button id="qr-png" class="btn" type="button">Download PNG</button><button id="qr-svg" class="btn" type="button">Download SVG</button></div>`;
 const fields=$("#qr-fields",root),status=$("#qr-status",root),preview=$("#qr-preview",root),downloads=$("#qr-downloads",root);
 let canvas=null,svgText="",filename="for-when-i-need-it-qr";
 const setStatus=(text,kind="note")=>{status.textContent=text;status.className=kind};
 const renderFields=()=>{
  const type=$("#qr-type",root).value;
  fields.replaceChildren();
  if(type==="text")fields.append(el(`<label>Text<textarea id="qr-text" maxlength="2000" placeholder="Enter text to encode"></textarea></label>`));
  if(type==="url")fields.append(el(`<label>Website URL<input id="qr-url" type="url" maxlength="2000" placeholder="https://example.com"></label>`));
  if(type==="wifi")fields.append(el(`<div class="opts"><label>Network name<input id="qr-ssid" type="text" maxlength="128"></label><label>Password<input id="qr-password" type="text" maxlength="128"></label><label>Security<select id="qr-security"><option value="WPA">WPA/WPA2</option><option value="WEP">WEP</option><option value="nopass">Open network</option></select></label></div>`));
  if(type==="vcard")fields.append(el(`<div class="opts"><label>Name<input id="qr-name" type="text" maxlength="128"></label><label>Phone<input id="qr-phone" type="tel" maxlength="64"></label><label>Email<input id="qr-email" type="email" maxlength="128"></label><label>Organization<input id="qr-org" type="text" maxlength="128"></label></div>`));
  preview.replaceChildren();downloads.hidden=true;setStatus("");
 };
 const escapeWifi=value=>value.replace(/([\\;,:"])/g,"\\$1");
 const escapeVCard=value=>value.replace(/\\/g,"\\\\").replace(/\r?\n/g,"\\n").replace(/([;,])/g,"\\$1");
 const payload=()=>{
  const type=$("#qr-type",root).value;
  if(type==="text"){const value=$("#qr-text",fields).value.trim();if(!value)throw Error("Enter text to encode.");return value}
  if(type==="url"){
   const value=$("#qr-url",fields).value.trim();if(!value)throw Error("Enter a website URL.");
   let url;try{url=new URL(value)}catch{throw Error("Enter a valid absolute URL, such as https://example.com.")}
   if(!["http:","https:"].includes(url.protocol))throw Error("Only HTTP and HTTPS website URLs are supported.");
   return url.href;
  }
  if(type==="wifi"){
   const name=$("#qr-ssid",fields).value;if(!name.trim())throw Error("Enter a Wi-Fi network name.");
   const security=$("#qr-security",fields).value,password=$("#qr-password",fields).value;
   if(security!=="nopass"&&!password)throw Error("Enter the Wi-Fi password or choose Open network.");
   return`WIFI:T:${security};S:${escapeWifi(name)};${security==="nopass"?"":`P:${escapeWifi(password)};`};;`;
  }
  const name=$("#qr-name",fields).value.trim();if(!name)throw Error("Enter a contact name.");
  const lines=["BEGIN:VCARD","VERSION:3.0",`FN:${escapeVCard(name)}`];
  const phone=$("#qr-phone",fields).value.trim(),email=$("#qr-email",fields).value.trim(),org=$("#qr-org",fields).value.trim();
  if(phone)lines.push(`TEL;TYPE=CELL:${escapeVCard(phone)}`);
  if(email)lines.push(`EMAIL:${escapeVCard(email)}`);
  if(org)lines.push(`ORG:${escapeVCard(org)}`);
  lines.push("END:VCARD");return lines.join("\r\n");
 };
 const luminance=hex=>{
  const channels=hex.slice(1).match(/.{2}/g).map(value=>parseInt(value,16)/255).map(value=>value<=.04045?value/12.92:((value+.055)/1.055)**2.4);
  return .2126*channels[0]+.7152*channels[1]+.0722*channels[2];
 };
 $("#qr-type",root).onchange=renderFields;
 $("#qr-create",root).onclick=()=>{
  try{
   if(typeof qrcode!=="function")throw Error("The local QR generator failed to load.");
   const value=payload(),dark=$("#qr-dark",root).value,light=$("#qr-light",root).value,l1=luminance(dark),l2=luminance(light);
   if((Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05)<4.5)throw Error("Choose foreground and background colours with at least 4.5:1 contrast.");
   if(new TextEncoder().encode(value).length>2000)throw Error("QR content is limited to 2,000 UTF-8 bytes.");
   const qr=qrcode(0,"H");qr.addData(value);qr.make();
   const count=qr.getModuleCount(),quiet=4,cell=8,side=(count+quiet*2)*cell;
   canvas=document.createElement("canvas");canvas.width=canvas.height=side;
   const ctx=canvas.getContext("2d");ctx.fillStyle=light;ctx.fillRect(0,0,side,side);ctx.fillStyle=dark;
   const paths=[];
   for(let row=0;row<count;row++)for(let col=0;col<count;col++)if(qr.isDark(row,col)){
    const x=col+quiet,y=row+quiet;ctx.fillRect(x*cell,y*cell,cell,cell);paths.push(`M${x} ${y}h1v1h-1z`);
   }
   svgText=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${count+quiet*2} ${count+quiet*2}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="${light}"/><path fill="${dark}" d="${paths.join("")}"/></svg>`;
   preview.replaceChildren(canvas);canvas.className="qr-canvas";downloads.hidden=false;
   filename=`for-when-i-need-it-${$("#qr-type",root).value}`;setStatus("QR code ready.");
  }catch(error){preview.replaceChildren();downloads.hidden=true;setStatus(error.message,"err")}
 };
 $("#qr-png",root).onclick=async()=>{
  try{const blob=await canvasToBlob(canvas,"image/png");download(blob,`${filename}.png`)}
  catch(error){setStatus("Could not export PNG: "+error.message,"err")}
 };
 $("#qr-svg",root).onclick=()=>download(new Blob([svgText],{type:"image/svg+xml"}),`${filename}.svg`);
 renderFields();
}
