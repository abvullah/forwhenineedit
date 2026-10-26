function pdfImagesTool(root){
 const MAX_PAGES=100,MAX_TOTAL_PIXELS=120000000,MAX_OUTPUT=100*1048576;
 const st=status(root),info=el("<p class='note'></p>");
 const controls=el(`<div class="opts">
  <label>Pages<input id="pi-range" type="text" placeholder="e.g. 1-3, 5"></label>
  <label>Scale<select id="pi-scale"><option value="1">1×</option><option value="1.5" selected>1.5×</option><option value="2">2×</option></select></label>
  <label>Image format<select id="pi-format"><option value="image/png">PNG</option><option value="image/jpeg">JPG</option></select></label>
  <button id="pi-go" class="btn p" type="button" disabled>Convert to images</button>
 </div>`);
 const go=$("#pi-go",controls),range=$("#pi-range",controls);
 let pdf=null,working=false;
 const closePdf=async()=>{if(pdf){const old=pdf;pdf=null;await old.destroy()}};
 const release=()=>setTimeout(()=>{if(root.isConnected)return;closePdf().catch(error=>console.error("Could not release the PDF document:",error));removeEventListener("hashchange",release)},0);
 addEventListener("hashchange",release);
 drop(root,{accept:"application/pdf",multiple:false,onFiles:async files=>{
  if(working)return;
  go.disabled=true;info.textContent="";st("Loading PDF…");
  try{
   await closePdf();pdf=await loadBrowserPdf(files[0]);
   info.textContent=`${files[0].name}: ${pdf.numPages} pages`;
   range.value=pdf.numPages>MAX_PAGES?`1-${MAX_PAGES}`:`1-${pdf.numPages}`;
   go.disabled=false;st("PDF ready.");
  }catch(error){st(error.message,1)}
 }});
 root.append(info,controls,el(`<p class="note">Renders locally with PDF.js. Convert up to ${MAX_PAGES} pages per ZIP; each page is limited to 12 megapixels and each ZIP to 100 MB.</p>`));
 go.onclick=async()=>{
  if(!pdf||working)return;
  working=true;go.disabled=true;
  try{
   const pages=parseRange(range.value,pdf.numPages);
   if(!pages.length)throw Error("Select at least one page.");
   if(pages.length>MAX_PAGES)throw Error("Convert no more than "+MAX_PAGES+" pages at a time.");
   if(typeof JSZip!=="function")throw Error("ZIP support is unavailable. Reload the page and try again.");
   const zip=new JSZip(),type=$("#pi-format",controls).value,scale=+$("#pi-scale",controls).value;
   const ext=type==="image/jpeg"?"jpg":"png";let pixels=0,bytes=0;
   for(let i=0;i<pages.length;i++){
    st(`Rendering page ${pages[i]+1} (${i+1} of ${pages.length})…`);
    const rendered=await renderBrowserPdfPage(pdf,pages[i]+1,scale);
    try{
     pixels+=rendered.canvas.width*rendered.canvas.height;
     if(pixels>MAX_TOTAL_PIXELS)throw Error("The selected pages exceed the 120-megapixel total render limit.");
     const blob=await canvasToBlob(rendered.canvas,type,type==="image/jpeg" ? 0.92 : undefined);
     bytes+=blob.size;if(bytes>MAX_OUTPUT)throw Error("The images exceed the 100 MB ZIP limit.");
     zip.file(`page-${String(pages[i]+1).padStart(3,"0")}.${ext}`,blob);
    }finally{rendered.page.cleanup();rendered.canvas.width=0;rendered.canvas.height=0}
   }
   st("Creating ZIP archive…");
   const blob=await zip.generateAsync({type:"blob",compression:"STORE"},progress=>st(`Creating ZIP archive: ${Math.round(progress.percent)}%`));
   if(blob.size>MAX_OUTPUT)throw Error("The generated ZIP exceeds the 100 MB limit.");
   download(blob,"pdf-pages.zip");st(`Done. ${pages.length} pages saved as ${ext.toUpperCase()} images.`);
  }catch(error){st(error.message,1)}
  finally{working=false;go.disabled=!pdf}
 };
}
