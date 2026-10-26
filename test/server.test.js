const {test}=require("node:test");
const assert=require("node:assert/strict");
const http=require("node:http");
const fs=require("node:fs");
const path=require("node:path");
const {createServer}=require("../server");

test("Vercel deploys the browser app as static files, not a function",()=>{
 const config=JSON.parse(fs.readFileSync(path.join(__dirname,"..","vercel.json"),"utf8"));
 assert.equal(config.framework,null);
 assert.equal(config.buildCommand,null);
 assert.equal(config.outputDirectory,"public");
 assert.equal(config.cleanUrls,true);
 assert.equal(config.headers.find(rule=>rule.source==="/(.*)").headers.find(header=>header.key==="Cross-Origin-Embedder-Policy").value,"require-corp");
 assert.deepEqual(config.redirects,[{source:"/dmca",destination:"/copyright",permanent:true}]);
 assert.deepEqual(config.rewrites,[{source:"/copyright",destination:"/dmca.html"}]);
});

test("serves the local app safely without file or account APIs",async t=>{
 const server=createServer();
 await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
 t.after(()=>new Promise(resolve=>server.close(resolve)));
 const origin=`http://127.0.0.1:${server.address().port}`;

 const home=await fetch(origin);
 assert.equal(home.status,200);
 assert.match(home.headers.get("content-security-policy"),/default-src 'self'/);
 assert.equal(home.headers.get("cross-origin-embedder-policy"),"require-corp");
 const homeHtml=await home.text();
 assert.match(homeHtml,/For when I need it/);
 assert.match(homeHtml,/href="\/about"/);
 assert.doesNotMatch(homeHtml,/href="\/(?:about|accessibility|security|ai-disclosure|dmca)\.html"/);

 const registry=await fetch(origin+"/js/registry.js").then(response=>response.text());
 assert.match(registry,/id:"ai-background-remover"/);
 assert.match(registry,/run:aiBgTool/);
 const analyticsBootstrap=await fetch(origin+"/js/vercel-analytics.js").then(response=>response.text());
 assert.match(analyticsBootstrap,/localhost/);
 assert.match(analyticsBootstrap,/_vercel\/insights\/script\.js/);
 assert.match(homeHtml,/vercel-analytics\.js/);
 for(const asset of [
  "/js/ai-background.js",
  "/js/ai-background-worker.js",
  "/vendor/onnxruntime/ort.min.js",
  "/vendor/onnxruntime/ort-wasm-simd-threaded.mjs",
  "/vendor/onnxruntime/ort-wasm-simd-threaded.wasm",
  "/models/u2netp.onnx"
 ]){
  assert.equal((await fetch(origin+asset,{method:"HEAD"})).status,200,asset+" should be available to the AI tool");
 }

 const about=await fetch(origin+"/about");
 assert.equal(about.status,200);
 const aboutHtml=await about.text();
 assert.match(aboutHtml,/<h1>About<\/h1>/);
 const oldAbout=await fetch(origin+"/about.html",{redirect:"manual"});
 assert.equal(oldAbout.status,301);
 assert.equal(oldAbout.headers.get("location"),"/about");
 for(const [page,file] of [["accessibility","accessibility.html"],["security","security.html"],["ai-disclosure","ai-disclosure.html"],["copyright","dmca.html"]]){
  const response=await fetch(origin+"/"+page);
  assert.equal(response.status,200,page+" should have a clean URL");
  if(page==="ai-disclosure"){
   const disclosure=await response.text();
   assert.match(disclosure,/website hosted online/);
   assert.match(disclosure,/not uploaded to us/);
  }
  const oldPage=await fetch(origin+"/"+file,{redirect:"manual"});
  assert.equal(oldPage.status,301,file+" should redirect to its clean URL");
  assert.equal(oldPage.headers.get("location"),"/"+page);
 }
 assert.match(aboutHtml,/<a href="https:\/\/abvullah\.github\.io"/);

 const account=await fetch(origin+"/api/me");
 assert.equal(account.status,404);
 for(const path of ["/account.html","/admin.html","/pricing.html","/openapi.json"]){
  assert.equal((await fetch(origin+path)).status,404,path+" should no longer exist");
 }

 const upload=await fetch(origin+"/api/files",{method:"POST",body:"not accepted"});
 assert.equal(upload.status,405);
 assert.equal(upload.headers.get("allow"),"GET, HEAD");

 const traversal=await new Promise((resolve,reject)=>{
  http.get({hostname:"127.0.0.1",port:server.address().port,path:"/%2e%2e%2fpackage.json"},resolve).on("error",reject);
 });
 assert.equal(traversal.statusCode,403);
 traversal.resume();
});
