/* The Taxi prototype is shown as one mobile viewport; all controls live inside the phone. */
(() => {
 const mount=(target,compact)=>{
  if(!target||target.querySelector('iframe[data-taxi-prototype]'))return;
  target.replaceChildren();
  target.classList.add('taxi-prototype-host');
  const f=document.createElement('iframe');
  f.dataset.taxiPrototype='';
  f.title='Lokali Taxi — интерактивный макет';
  f.src=(location.pathname.includes('/taxi/')?'./prototype.html':'/taxi/prototype.html')+'?v=3';
  f.loading='lazy';
  f.style.cssText='display:block;width:100%;height:'+(compact?'790px':'810px')+';border:0;overflow:hidden;background:transparent;';
  target.append(f);
 };
 mount(document.querySelector('.case--taxi .case__demo--phone'),true);
 const full=document.querySelector('#try');
 if(full){full.classList.add('cs-try--embed');full.style.cssText='display:block;width:100%;max-width:none;min-height:810px;';mount(full,false);}
})();