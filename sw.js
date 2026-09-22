/* 离线缓存。策略：安装时预缓存全部文件；之后“先用缓存、后台更新”，所以改动会在下一次启动时生效。
   文件清单和 CACHE 版本号由项目根目录的 build_sw.js 生成：dist 有改动后、部署前运行 node build_sw.js。 */
const CACHE='fab-days-7695bbe065';
const FILES=[
 "./app.js",
 "./assets/cmp-lab-map.png",
 "./assets/engineer-walk.png",
 "./assets/icons/icon-180.png",
 "./assets/icons/icon-192.png",
 "./assets/icons/icon-512.png",
 "./assets/icons/icon-maskable-512.png",
 "./assets/junior-engineer.png",
 "./cases.html",
 "./changelog.html",
 "./changelog.js",
 "./data.js",
 "./defects.html",
 "./defects.js",
 "./engine.js",
 "./extras.css",
 "./extras.js",
 "./flowdata.js",
 "./i18n.js",
 "./index.html",
 "./knowledge.en.js",
 "./knowledge.js",
 "./labs.css",
 "./learn.js",
 "./manifest.webmanifest",
 "./practical.css",
 "./practical.js",
 "./profile.html",
 "./profile.js",
 "./profilesim.js",
 "./pwa.js",
 "./record.html",
 "./record.js",
 "./rpg-choice.html",
 "./rpg.css",
 "./rpg.js",
 "./safetydata.js",
 "./shift.css",
 "./shift.html",
 "./shift.js",
 "./shiftsim.js",
 "./simulator.js",
 "./style.css"
];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET'||new URL(req.url).origin!==location.origin)return;
  e.respondWith(caches.open(CACHE).then(async c=>{
    const hit=await c.match(req,{ignoreSearch:true});
    const net=fetch(req).then(res=>{if(res.ok)c.put(req,res.clone());return res}).catch(()=>hit);
    return hit||net;
  }));
});
