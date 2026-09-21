/* 量产值班模式的纯逻辑引擎（无 DOM）。两台 CMP 机台连续跑批，耗材跨天延续，故障隐蔽出现。
   依赖 simulator.js 的 CMP_SIM.simulate。全部数值为游戏设定，不是实际设备数据。 */
(function(root){
const S=root.CMP_SIM;
const SPEC={lo:185,hi:215,nu:5,def:15},CHART={cl:200,sigma:3.5},HOURS=8,POINTS=2,TARGET=14;
/* 耗材寿命（片数；修整盘按批数）。到 85% 预警；超寿命后垫堵塞加快。均为游戏设定。 */
/* 换耗材后不做确认就放产品时，头两批带出颗粒/划伤的概率 */
const QUAL_RISK={pad:.4,dresser:.25,ring:.15};
const LIFE={pad:2000,ring:2500,dresser:400},QUAL={rate:[270,330],nu:5,particles:15};
const clone=o=>JSON.parse(JSON.stringify(o)),r1=x=>Math.round(x*10)/10;
function rng(seed){let a=seed>>>0;return ()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296}}
function gauss(r){return Math.sqrt(-2*Math.log(1-r()))*Math.cos(2*Math.PI*r())}
const clock=h=>String(8+h).padStart(2,'0')+':00';

/* 维护动作：points=占用工时点，down=停机小时数，cost=模拟成本 */
const ACTIONS={
 inspect:{points:1,down:0,cost:0},condition:{points:1,down:1,cost:20},dresser:{points:1,down:1,cost:200},
 flowcal:{points:1,down:1,cost:80},presscal:{points:1,down:1,cost:80},ring:{points:1,down:2,cost:350},pad:{points:1,down:3,cost:600},
 qual:{points:1,down:0,cost:30},skipqual:{points:0,down:0,cost:0},
 reference:{points:1,down:0,cost:0},metercal:{points:1,down:0,cost:80},timeUp:{points:1,down:0,cost:0},timeDown:{points:1,down:0,cost:0}};

function newDay(){return {lots:0,good:0,rework:0,scrap:0,falseScrap:0,escape:0,down:0,cost:0,actions:0,qualSkipped:0}}
function fresh(seed){
  const tools={A:S.newTool('A'),B:S.newTool('B')};
  for(const t of Object.values(tools)){t.pad.age=300;t.pad.glaze=0;t.ring.age=1000}
  tools.A.ring.wear=.06;tools.B.ring.wear=.1;
  return {version:1,seed:seed||Math.floor(Math.random()*1e6)+1,day:1,hour:0,points:POINTS,tools,recipes:{A:S.defaults(),B:S.defaults()},down:{A:0,B:0},downReason:{A:'',B:''},dresser:{A:{worn:false,serial:1,lots:120},B:{worn:false,serial:1,lots:60}},qual:{A:null,B:null},qualTried:{A:false,B:false},dirty:{A:0,B:0},qualLog:[],meter:{bias:0},faults:[],lots:[],seq:1,log:[],checks:[],refs:[],today:newDay(),history:[],note:'',lastNote:'',ended:false};
}
function normalize(raw){if(!raw||raw.version!==1||!raw.tools||!raw.tools.A||!raw.tools.B||!Array.isArray(raw.lots)||!Array.isArray(raw.history)||!Number.isInteger(raw.day))return fresh();const f=fresh(raw.seed),g={...f,...raw};for(const k of ['qual','qualTried','dirty'])g[k]={...f[k],...(raw[k]||{})};if(!Array.isArray(g.qualLog))g.qualLog=[];if(g.today.qualSkipped===undefined)g.today.qualSkipped=0;return g}
function addLog(st,key,args){st.log.push({day:st.day,at:clock(st.hour),key,args:args||{}});if(st.log.length>200)st.log.shift()}
const activeFaults=st=>st.faults.filter(f=>f.fixedAt===null);

function maybeFault(st){
  const r=rng(st.seed*7919+st.day*131+st.hour*17),act=activeFaults(st);
  if(act.length>=2||st.faults.some(f=>f.day===st.day))return;
  if(st.day===1&&st.hour<2)return;
  if(st.hour<1)return;
  const force=st.hour>=4; /* 每天至少发生一件事 */
  if(!force&&r()>.3)return;
  const busy=new Set(act.map(f=>f.type+(f.tool||''))),options=[];
  for(const type of ['dresser','flow','pressure'])for(const tool of ['A','B'])if(!busy.has(type+tool)&&!act.some(f=>f.tool===tool))options.push({type,tool});
  if(!busy.has('meter'))options.push({type:'meter',tool:null});
  if(!options.length)return;
  const pick=options[Math.floor(r()*options.length)],f={id:st.faults.length+1,type:pick.type,tool:pick.tool,day:st.day,hour:st.hour,detectedAt:null,fixedAt:null,lotsBad:0};
  if(f.type==='pressure')st.tools[f.tool].pressureGain=1.03+Math.floor(r()*4)*.01;
  if(f.type==='flow')st.tools[f.tool].flowGain=.95;
  if(f.type==='meter')st.meter.bias=-(10+Math.floor(r()*4)*2);
  if(f.type==='dresser')st.dresser[f.tool].worn=true;
  st.faults.push(f);
}
function processLot(st,id){
  const t=st.tools[id],rec=st.recipes[id],seed=st.seed*31+st.seq*101,r=rng(seed),truth=S.simulate(t,rec,seed).metrics;
  const th=truth.thickness+gauss(r)*2.5,nu=Math.max(.3,truth.uniformity+1.5+gauss(r)*.2),def=Math.max(0,Math.round(truth.defects+gauss(r)*1.5+(st.dirty[id]>0?14:0)));if(st.dirty[id]>0)st.dirty[id]--;
  const mTh=th+st.meter.bias+gauss(r)*.4;
  const ok=(a)=>a>=SPEC.lo&&a<=SPEC.hi&&nu<=SPEC.nu&&def<=SPEC.def;
  const lot={id:st.seq++,name:id+'-'+String(st.day).padStart(2,'0')+String(st.hour+1).padStart(2,'0'),tool:id,day:st.day,hour:st.hour,time:rec.time,th:r1(th),nu:r1(nu),def,mTh:r1(mTh),m2:null,truthOk:ok(th),status:ok(mTh)?'released':'hold',decision:null};
  st.lots.push(lot);st.today.lots++;
  if(lot.status==='released'){if(lot.truthOk)st.today.good++;else st.today.escape++}
  for(const f of activeFaults(st))if((f.tool===id||f.type==='meter')&&(!lot.truthOk||lot.status==='hold'))f.lotsBad++;
  /* 耗材自然消耗；修整器磨钝时垫堵塞加快 */
  t.pad.age+=25;st.dresser[id].lots=(st.dresser[id].lots||0)+1;t.pad.glaze=Math.min(1,t.pad.glaze+(st.dresser[id].worn?.02:.0015)+(t.pad.age>LIFE.pad||st.dresser[id].lots>LIFE.dresser?.006:0));t.ring.age+=25;t.ring.wear=Math.min(1,t.ring.wear+.006);
  const flow=activeFaults(st).find(f=>f.type==='flow'&&f.tool===id);if(flow)t.flowGain=Math.max(.68,t.flowGain-.04);
  return lot;
}
function advance(st){
  if(st.ended)throw Error('ended');
  maybeFault(st);
  const made=[];
  for(const id of ['A','B']){if(st.down[id]>0){st.down[id]--;st.today.down++;if(st.down[id]===0){addLog(st,'log.up',{tool:id});st.downReason[id]=''}}else if(st.qual[id]){st.today.down++}else made.push(processLot(st,id))}
  st.hour++;st.points=POINTS;
  if(st.lots.length>400)st.lots.splice(0,st.lots.length-400);
  if(st.hour>=HOURS)st.ended=true;
  return made;
}
function act(st,action,id){
  const a=ACTIONS[action];if(!a)throw Error('err.action');if(st.ended)throw Error('err.ended');if(st.points<a.points)throw Error('err.points');
  const toolAction=!['reference','metercal'].includes(action);
  if(toolAction){if(!st.tools[id])throw Error('err.tool');if(st.down[id]>0&&action!=='inspect')throw Error('err.down')}
  const t=st.tools[id],fix=(type,tool)=>{const f=activeFaults(st).find(f=>f.type===type&&(tool===undefined||f.tool===tool));if(f){f.fixedAt={day:st.day,hour:st.hour};if(!f.detectedAt)f.detectedAt=f.fixedAt}return !!f};
  const detect=(type,tool)=>{const f=activeFaults(st).find(f=>f.type===type&&(tool===undefined||f.tool===tool));if(f&&!f.detectedAt)f.detectedAt={day:st.day,hour:st.hour}};
  let result=null;
  if((action==='qual'||action==='skipqual')&&(!st.qual[id]||st.down[id]>0))throw Error('err.noqual');
  switch(action){
    case 'qual':{const bad=!st.qualTried[id]&&rng(st.seed*53+st.seq*11)()<QUAL_RISK[st.qual[id]],m=S.simulate(t,st.recipes[id],st.seed*17+st.seq).metrics;st.qualTried[id]=true;result={day:st.day,at:clock(st.hour),tool:id,after:st.qual[id],rate:Math.round(m.rr),nu:r1(m.uniformity+1.5),particles:Math.max(0,m.defects+(bad?24:0))};result.pass=result.rate>=QUAL.rate[0]&&result.rate<=QUAL.rate[1]&&result.nu<=QUAL.nu&&result.particles<=QUAL.particles;st.qualLog.unshift(result);st.qualLog.length=Math.min(st.qualLog.length,8);if(result.pass)st.qual[id]=null;break}
    case 'skipqual':{if(!st.qualTried[id]&&rng(st.seed*53+st.seq*11)()<QUAL_RISK[st.qual[id]])st.dirty[id]=2;st.qual[id]=null;st.today.qualSkipped++;break}
    case 'inspect':{const rec=st.recipes[id];result={day:st.day,at:clock(st.hour),tool:id,setP:rec.pressure,actP:Math.round(rec.pressure*t.pressureGain*100)/100,setF:rec.flow,actF:Math.round(rec.flow*t.flowGain),padAge:Math.round(t.pad.age),dresserLots:st.dresser[id].lots||0,ringAge:t.ring.age,ringWear:Math.round(t.ring.wear*100)/100,glazed:t.pad.glaze>.25,dresserWorn:st.dresser[id].worn};st.checks.unshift(result);st.checks.length=Math.min(st.checks.length,12);if(Math.abs(t.pressureGain-1)>.015)detect('pressure',id);if(Math.abs(t.flowGain-1)>.03)detect('flow',id);if(st.dresser[id].worn)detect('dresser',id);break}
    case 'condition':t.pad.conditioning+=60;t.pad.glaze=Math.max(0,t.pad.glaze-(st.dresser[id].worn?.25:.55));break;
    case 'dresser':st.dresser[id]={worn:false,serial:st.dresser[id].serial+1,lots:0};fix('dresser',id);t.pad.glaze=Math.max(0,t.pad.glaze-.55);break;
    case 'flowcal':t.flowGain=1;t.flowCalibration++;fix('flow',id);break;
    case 'presscal':t.pressureGain=1;t.pressureCalibration++;fix('pressure',id);break;
    case 'ring':t.ring={serial:id+'-R'+st.seq,wear:.02,age:0};break;
    case 'pad':t.pad={serial:id+'-P'+st.seq,type:'standard',age:0,glaze:0,ready:1,conditioning:120};break; /* 停机时间已含磨合与确认 */
    case 'reference':result={day:st.day,at:clock(st.hour),M1:r1(200+st.meter.bias),M2:200};st.refs.unshift(result);st.refs.length=Math.min(st.refs.length,8);if(st.meter.bias)detect('meter');break;
    case 'metercal':st.meter.bias=0;fix('meter');break;
    case 'timeUp':case 'timeDown':{const rec=st.recipes[id],v=rec.time+(action==='timeUp'?5:-5);if(v<30||v>100)throw Error('err.range');rec.time=v;result=v;break}
  }
  st.points-=a.points;st.today.cost+=a.cost;st.today.actions++;
  if(a.down){st.down[id]=a.down;st.downReason[id]=action}
  if(['pad','ring','dresser'].includes(action)){st.qual[id]=action;st.qualTried[id]=false} /* 换耗材后要先做保养后确认才能放产品 */
  addLog(st,'log.'+action,{tool:id||'',v:typeof result==='number'?result:''});
  return result;
}
function lotAction(st,lotId,what){
  const lot=st.lots.find(l=>l.id===lotId);if(!lot||lot.status!=='hold')throw Error('err.lot');
  if(what==='m2'){if(st.points<1)throw Error('err.points');if(lot.m2!==null)throw Error('err.m2');st.points--;lot.m2=r1(lot.th+.2);addLog(st,'log.m2',{lot:lot.name});return lot}
  const best=lot.m2!==null?lot.m2:lot.mTh;
  if(what==='rework'){if(!(best>SPEC.hi)||lot.def>SPEC.def||lot.nu>SPEC.nu)throw Error('err.rework');lot.status='reworked';st.today.rework++;st.today.cost+=60;if(lot.th>SPEC.hi||lot.truthOk)st.today.good++;else st.today.escape++}
  else if(what==='scrap'){lot.status='scrapped';st.today.cost+=500;if(lot.truthOk)st.today.falseScrap++;else st.today.scrap++}
  else if(what==='release'){lot.status='released';if(lot.truthOk)st.today.good++;else st.today.escape++}
  else throw Error('err.action');
  lot.decision={day:st.day,at:clock(st.hour),what};addLog(st,'log.'+what,{lot:lot.name});return lot;
}
/* 控制图判异：1 点超 3σ；连续 3 点中 2 点同侧超 2σ；连续 6 点同侧 */
function flags(values){
  const out=values.map(()=>null),z=values.map(v=>(v-CHART.cl)/CHART.sigma);
  for(let i=0;i<z.length;i++){
    if(Math.abs(z[i])>3){out[i]='r1';continue}
    if(i>=2){const w=z.slice(i-2,i+1);if(w.filter(x=>x>2).length>=2&&z[i]>2||w.filter(x=>x<-2).length>=2&&z[i]<-2){out[i]='r2';continue}}
    if(i>=5){const w=z.slice(i-5,i+1);if(w.every(x=>x>0)||w.every(x=>x<0))out[i]='r3'}
  }
  return out;
}
function chart(st,id,n){const lots=st.lots.filter(l=>l.tool===id).slice(-(n||24)),f=flags(lots.map(l=>l.mTh));return lots.map((l,i)=>({...l,flag:f[i]}))}
function score(st){
  const d=st.today,out=Math.round(30*Math.min(1,d.good/TARGET)),qual=Math.max(0,40-15*d.escape-10*d.falseScrap-5*d.scrap);
  const todays=st.faults.filter(f=>f.fixedAt===null||f.fixedAt.day===st.day||f.day===st.day);
  let resp=20;if(todays.length){resp=Math.round(todays.map(f=>{const start=(f.day-1)*HOURS+f.hour,end=f.fixedAt?(f.fixedAt.day-1)*HOURS+f.fixedAt.hour:(st.day-1)*HOURS+HOURS,age=end-start;if(f.fixedAt)return Math.max(5,20-3*Math.max(0,age-2));return age>=4?0:12}).reduce((a,b)=>a+b,0)/todays.length)}
  const rec=st.note.trim()?10:0;
  return {rows:[['output',out,30],['quality',qual,40],['response',resp,20],['record',rec,10]],total:out+qual+resp+rec};
}
/* 当天 M1 膜厚的工序能力指数；少于 4 批不计算 */
function cpk(st,id,day){const v=st.lots.filter(l=>l.tool===id&&l.day===day).map(l=>l.mTh);if(v.length<4)return null;const m=v.reduce((a,b)=>a+b,0)/v.length,sd=Math.sqrt(v.reduce((a,b)=>a+(b-m)**2,0)/(v.length-1));return sd?Math.round(Math.min(SPEC.hi-m,m-SPEC.lo)/(3*sd)*100)/100:null}
function endDay(st){
  if(!st.ended)throw Error('err.notEnded');
  const sc=score(st),revealed=st.faults.filter(f=>f.fixedAt&&f.fixedAt.day===st.day).map(clone),open=activeFaults(st).length;
  st.history.push({day:st.day,kpi:clone(st.today),score:sc,revealed,open,note:st.note,cpk:{A:cpk(st,'A',st.day),B:cpk(st,'B',st.day)}});
  st.day++;st.hour=0;st.points=POINTS;st.today=newDay();st.lastNote=st.note;st.note='';st.ended=false;
  return st.history.at(-1);
}
/* 各耗材的使用量与寿命，供界面显示 */
function life(st,id){const t=st.tools[id];return [['pad',Math.round(t.pad.age),LIFE.pad],['ring',t.ring.age,LIFE.ring],['dresser',st.dresser[id].lots||0,LIFE.dresser]]}
/* 面试演示用的固定状态：第 2 天 11:00，Tool B 的实际流量从早上开始慢慢下降，控制图已能看出上漂；Tool A 正常。 */
function demo(){
  const st=fresh(20260918),block=()=>{st.faults.push({id:0,type:'none',tool:null,day:st.day,hour:0,detectedAt:null,fixedAt:{day:st.day,hour:0},lotsBad:0})};
  block();while(!st.ended)advance(st);st.note='—';endDay(st);
  block();st.faults.push({id:1,type:'flow',tool:'B',day:2,hour:0,detectedAt:null,fixedAt:null,lotsBad:0});st.tools.B.flowGain=.94;
  for(let i=0;i<3;i++)advance(st);
  st.faults=st.faults.filter(f=>f.type!=='none');st.history=[];st.lastNote='';st.log=[];st.demo=true;
  return st;
}
root.CMP_LINE={LIFE,QUAL,life,demo,SPEC,CHART,HOURS,POINTS,TARGET,ACTIONS,clock,fresh,normalize,advance,act,lotAction,chart,flags,score,cpk,endDay,activeFaults};
})(globalThis);
