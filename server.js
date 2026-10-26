// Local static server. File processing stays in the browser.
const http=require("http"),fs=require("fs"),path=require("path");
const root=path.join(__dirname,"public"),port=+process.argv[2]||3000;
const types={".html":"text/html",".css":"text/css",".js":"text/javascript",".mjs":"text/javascript",".svg":"image/svg+xml",".json":"application/json",".webmanifest":"application/manifest+json",".xml":"application/xml",".txt":"text/plain",".wasm":"application/wasm",".woff2":"font/woff2"};
const cleanPages={"/about":"/about.html","/accessibility":"/accessibility.html","/security":"/security.html","/ai-disclosure":"/ai-disclosure.html","/copyright":"/dmca.html"};
const legacyPages=Object.fromEntries(Object.entries(cleanPages).map(([clean,file])=>[file,clean]));
const securityHeaders={
 "Content-Security-Policy":"default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
 "Cross-Origin-Opener-Policy":"same-origin",
 "Cross-Origin-Embedder-Policy":"require-corp",
 "Cross-Origin-Resource-Policy":"same-origin",
 "X-Content-Type-Options":"nosniff",
 "Referrer-Policy":"no-referrer",
 "Permissions-Policy":"camera=(self), microphone=(), geolocation=()"
};

function createServer(){
 return http.createServer((req,res)=>{
  if(req.method!=="GET"&&req.method!=="HEAD"){
   res.writeHead(405,{"Allow":"GET, HEAD",...securityHeaders}).end("Method not allowed");
   req.resume();
   return;
  }
  let pathname;
  try{pathname=decodeURIComponent(new URL(req.url,"http://localhost").pathname)}
  catch{res.writeHead(400,securityHeaders).end("Bad request");return}
  if(pathname==="/dmca")pathname="/copyright";
  if(legacyPages[pathname]){
   res.writeHead(301,{"Location":legacyPages[pathname]+new URL(req.url,"http://localhost").search,...securityHeaders}).end();
   return;
  }
  pathname=cleanPages[pathname]||pathname;
  if(pathname==="/"||pathname==="\\")pathname="/index.html";
  const file=path.resolve(root,"."+pathname),relative=path.relative(root,file);
  if(relative===".."||relative.startsWith(".."+path.sep)||path.isAbsolute(relative)){
   res.writeHead(403,securityHeaders).end("Forbidden");
   return;
  }
  fs.stat(file,(statError,stat)=>{
   if(statError||!stat.isFile()){
    const notFound=statError?.code==="ENOENT"||statError?.code==="ENOTDIR"||!statError;
    const status=notFound?404:500,pageName=notFound?"404.html":"500.html";
    fs.readFile(path.join(root,pageName),(pageError,page)=>{
     res.writeHead(status,{"Content-Type":"text/html; charset=utf-8",...securityHeaders});
     if(req.method==="HEAD"||pageError)res.end();
     else res.end(page);
    });
    return;
   }
   const extension=path.extname(file),type=types[extension]||"application/octet-stream";
   res.writeHead(200,{
    "Content-Type":type+(extension===".wasm"||extension===".woff2"?"":"; charset=utf-8"),
    "Content-Length":stat.size,
    ...securityHeaders,
    ...(path.basename(file)==="sw.js"?{"Service-Worker-Allowed":"/"}:{})
   });
   if(req.method==="HEAD"){res.end();return}
   fs.createReadStream(file).pipe(res);
  });
 });
}

if(require.main===module){
 createServer().listen(port,"127.0.0.1",()=>console.log("For when I need it on http://localhost:"+port));
}

module.exports={createServer};
