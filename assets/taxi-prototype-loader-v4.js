(() => {
 const src = location.pathname.includes('/taxi/') ? './prototype-v4.html' : '/taxi/prototype-v4.html';
 const mount = (target, height) => {
  if (!target) return;
  target.innerHTML = '';
  target.style.cssText = 'display:flex;justify-content:center;align-items:center;width:100%;max-width:none;min-height:'+height+'px;padding:0;overflow:hidden;background:transparent;';
  const frame=document.createElement('iframe');
  frame.title='Lokali Taxi — интерактивный макет';
  frame.src=src+'?build=5';
  frame.loading='eager';
  frame.style.cssText='display:block;width:100%;height:'+height+'px;max-width:100%;border:0;background:transparent;flex:0 0 100%;';
  target.appendChild(frame);
 };
 const run=()=>{
  mount(document.querySelector('.case--taxi .case__demo--phone'),790);
  mount(document.querySelector('#try'),810);
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
})();