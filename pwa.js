/* 两件小事：① 注册离线缓存；② 累计各页面的前台使用时间（只存在本设备，用于学习记录页）。 */
(function(){
  /* ① 只在 https（或显式加 ?sw=1）时启用；本地开发用的 http://localhost 默认不启用，避免调试时读到旧文件。 */
  if('serviceWorker' in navigator){
    const local=['localhost','127.0.0.1'].includes(location.hostname);
    if(location.protocol==='https:'||(local&&/[?&]sw=1/.test(location.search)))window.addEventListener('load',()=>{navigator.serviceWorker.register('sw.js').catch(()=>{})});
  }
  /* ② 每 30 秒记一次，仅当页面在前台。演示模式和学习记录页不计。 */
  const page=(location.pathname.split('/').pop()||'index.html').replace('.html','')||'index';
  if(['index','shift','profile','defects'].includes(page)&&!/[?&]demo=1/.test(location.search))setInterval(()=>{
    if(document.visibilityState!=='visible')return;
    try{const t=JSON.parse(localStorage.getItem('cmp-fab-time')||'{}');t[page]=(Number(t[page])||0)+.5;localStorage.setItem('cmp-fab-time',JSON.stringify(t))}catch(e){}
  },30000);
})();
