/* Mount the interactive Lokali Taxi prototype in the home card and full case. */
(() => {
 const mount=(target,compact)=>{
  if(!target||target.querySelector('iframe[data-taxi-prototype]'))return;
  target.replaceChildren();
  const f=document.createElement('iframe');
  f.dataset.taxiPrototype='';
  f.title='Lokali Taxi interactive prototype';
  f.src=(location.pathname.includes('/taxi/')?'./prototype.html':'/taxi/prototype.html')+(compact?'?compact=1':'');
  f.loading='lazy';
  f.style.cssText='display:block;width:100%;height:'+(compact?'700px':'720px')+';border:0;overflow:hidden;background:transparent;';
  target.append(f);
 };
 mount(document.querySelector('.case--taxi .case__demo--phone'),true);
 const full=document.querySelector('#try');
 if(full){full.classList.add('cs-try--embed');full.style.cssText='display:block;width:100%;max-width:none;';mount(full,false);}
})();