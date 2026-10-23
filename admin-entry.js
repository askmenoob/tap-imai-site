// This is a navigation shortcut only. Server-side Google admin checks still apply.
for(const logo of document.querySelectorAll('[data-admin-entry]')){
  let clicks=0,lastClick=-Infinity;
  logo.addEventListener('click',()=>{
    const now=performance.now();
    clicks=now-lastClick<=1500?clicks+1:1;
    lastClick=now;
    if(clicks===3){clicks=0;location.assign('/admin.html');}
  });
}
