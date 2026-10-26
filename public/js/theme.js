try{
 const theme=localStorage.getItem("theme");
 if(theme==="light"||theme==="dark")document.documentElement.dataset.theme=theme;
}catch(error){console.warn("Could not load the saved theme preference:",error)}
