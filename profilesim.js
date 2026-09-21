/* 轮廓调整练习的纯逻辑（无 DOM）：4 个同心压力区 + 保持环压力 → 径向去除轮廓。
   方向性关系参考公开的教科书层面知识；全部系数为游戏设定，不是实际设备数据。
   简化：区与区之间的压力因晶圆刚性而互相渗透（用平滑权重表示）；保持环压力相对边缘区越高，边缘去除越慢；
   保持环磨损表现为最外圈偏快且片间不重复。 */
(function(root){
const ZONES=[{c:.17,w:.22},{c:.5,w:.17},{c:.76,w:.13},{c:.95,w:.08}];
const LIMITS={zone:[1.5,5,.1],ring:[2,8,.1],time:[40,90,1]};
const SPEC={lo:195,hi:205,nu:1.0},INCOMING=500,BUDGET=14,COST={run:1,inspect:2,ring:3};
const SCAN=Array.from({length:25},(_,i)=>-0.97+i*(1.94/24));
function rng(seed){let a=seed>>>0;return ()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296}}
const r2=x=>Math.round(x*100)/100,r1=x=>Math.round(x*10)/10;

/* 五个练习：shape 为机台/研磨垫固有的径向特征，ring0 为初始保持环压力，wear 为保持环磨损（0–1） */
const CASES=[
 {id:'center',shape:r=>1+.05*(1-2*r*r),ring0:4.5,wear:0},
 {id:'edge',shape:r=>1-.03*(1-2*r*r),ring0:3.0,wear:0},
 {id:'donut',shape:r=>1-.06*Math.exp(-(((r-.5)/.18)**2)),ring0:4.5,wear:0},
 {id:'mixed',shape:r=>1+.04*(1-2*r*r),ring0:6.5,wear:0},
 {id:'ringwear',shape:r=>1+.02*(1-2*r*r),ring0:4.5,wear:.7}
];
function pressureAt(r,z){let s=0,w=0;for(let i=0;i<4;i++){const k=Math.exp(-(((r-ZONES[i].c)/ZONES[i].w)**2));s+=k*z[i];w+=k}return s/w}
function edgeFactor(r,z4,ring){const e=Math.max(-.12,Math.min(.15,.10*(1-ring/(1.5*z4))));return 1+e*Math.exp(-(((1-r)/.07)**2))}
function fresh(caseIndex){const c=CASES[caseIndex];return {version:1,caseIndex,zones:[3,3,3,3],ring:c.ring0,time:60,wear:c.wear,runs:[],used:0,inspected:false,replaced:false,cleared:false,seed:caseIndex*7919+17}}
function validate(st){for(const z of st.zones)if(!(z>=LIMITS.zone[0]&&z<=LIMITS.zone[1]))throw Error('err.zone');if(!(st.ring>=LIMITS.ring[0]&&st.ring<=LIMITS.ring[1]))throw Error('err.ring');if(!(st.time>=LIMITS.time[0]&&st.time<=LIMITS.time[1]))throw Error('err.time');if(st.ring<.9*st.zones[3])throw Error('err.slip')}
function spend(st,n){if(st.cleared)throw Error('err.cleared');if(st.used+n>BUDGET)throw Error('err.budget');st.used+=n}
function polish(st){
  validate(st);spend(st,COST.run);
  const c=CASES[st.caseIndex],rand=rng(st.seed+st.runs.length*101),noise=()=>rand()*2-1;
  const points=SCAN.map(x=>{const r=Math.abs(x);let rem=100*pressureAt(r,st.zones)*(st.time/60)*c.shape(r)*edgeFactor(r,st.zones[3],st.ring);
    rem*=1+noise()*.004;
    if(st.wear>.2){const g=Math.exp(-(((1-r)/.05)**2));rem*=1+g*(.18*st.wear+noise()*.22*st.wear)} /* 磨损：最外圈偏快且不重复 */
    return {x:r2(x),removal:r1(rem),thickness:r1(INCOMING-rem)}});
  const rem=points.map(p=>p.removal),mean=rem.reduce((a,b)=>a+b,0)/rem.length,sd=Math.sqrt(rem.reduce((a,b)=>a+(b-mean)**2,0)/rem.length);
  const run={id:st.runs.length+1,zones:[...st.zones],ring:st.ring,time:st.time,replaced:st.replaced,points,mean:r1(mean),thickness:r1(INCOMING-mean),nu:r2(sd/mean*100),range:r1(Math.max(...rem)-Math.min(...rem))};
  run.pass=run.thickness>=SPEC.lo&&run.thickness<=SPEC.hi&&run.nu<=SPEC.nu;
  st.runs.push(run);
  /* 过关条件：同一设定连续两片都合格（重复确认） */
  const prev=st.runs.at(-2);
  if(run.pass&&prev&&prev.pass&&same(prev,run))st.cleared=true;
  return run;
}
function same(a,b){return a.ring===b.ring&&a.time===b.time&&a.replaced===b.replaced&&a.zones.every((z,i)=>z===b.zones[i])}
function inspect(st){spend(st,COST.inspect);st.inspected=true;return {wear:st.wear,ok:st.wear<=.2}}
function replaceRing(st){spend(st,COST.ring);st.wear=.02;st.replaced=true}
function stars(st){return !st.cleared?0:st.used<=6?3:st.used<=10?2:1}
root.CMP_PROFILE={ZONES,LIMITS,SPEC,BUDGET,COST,CASES,SCAN,fresh,polish,inspect,replaceRing,stars,pressureAt,same};
})(globalThis);
