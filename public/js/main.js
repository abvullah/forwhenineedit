route();
if("serviceWorker" in navigator)navigator.serviceWorker.register("/sw.js").catch(error=>console.error("Could not register offline support:",error));
