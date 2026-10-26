const PDF_RENDERER_URL="/vendor/pdfjs/pdf.min.mjs";
let pdfRendererPromise;

async function getPdfRenderer(){
 if(!pdfRendererPromise)pdfRendererPromise=import(PDF_RENDERER_URL).then(pdfjs=>{
  pdfjs.GlobalWorkerOptions.workerSrc="/vendor/pdfjs/pdf.worker.min.mjs";
  return pdfjs;
 }).catch(error=>{pdfRendererPromise=null;throw Error("Could not load the local PDF renderer: "+error.message)});
 return pdfRendererPromise;
}

async function loadBrowserPdf(file){
 if(await sniff(file)!=="pdf")throw Error(file.name+" isn’t a PDF.");
 if(file.size>100*1048576)throw Error(file.name+" is over the 100 MB limit.");
 const pdfjs=await getPdfRenderer();
 return pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false,useSystemFonts:true}).promise;
}

async function renderBrowserPdfPage(pdf,pageNumber,scale=1.5,maxPixels=12000000){
 const page=await pdf.getPage(pageNumber),initial=page.getViewport({scale});
 const factor=Math.min(1,Math.sqrt(maxPixels/(initial.width*initial.height)));
 const viewport=page.getViewport({scale:scale*factor});
 const canvas=document.createElement("canvas");
 canvas.width=Math.max(1,Math.ceil(viewport.width));canvas.height=Math.max(1,Math.ceil(viewport.height));
 const context=canvas.getContext("2d");
 if(!context)throw Error("Could not create a canvas to render the PDF page.");
 await page.render({canvasContext:context,viewport}).promise;
 return{canvas,page};
}

function canvasToBlob(canvas,type,quality){
 return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error("The browser could not export this canvas.")),type,quality));
}
