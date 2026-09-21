/* Finishing layer for the hands-on mode. Loaded after practical.js and wraps its globals:
   save export/import/reset, six-scenario progress and graduation, coworker talk,
   optional walk sprite sheet (falls back to the single image), and opt-in sound. */
const SPRITE_SHEET='assets/engineer-walk.png';
let pendingImport=null,resetArmed=false,settingsNote='';

/* ---------- 存档：导出 / 导入 / 重置 ---------- */
function readSave(text){
  let raw;
  try{raw=JSON.parse(text)}catch(e){throw Error(T('文件不是有效的 JSON。','有効な JSON ファイルではありません。'))}
  if(raw&&raw.app==='cmp-fab-days'&&raw.save)raw=raw.save;
  const sim=raw&&raw.sim;
  if(!raw||raw.version!==2||!sim||sim.version!==1||!Array.isArray(sim.runs)||!sim.tools||!sim.tools.A||!sim.tools.B||!sim.recipes||!Number.isInteger(sim.scenario))throw Error(T('这不是自主实验版的存档文件。','このゲームのセーブファイルではありません。'));
  /* 除自由文字外，存档里的字符串都会直接进入界面；拒绝带标记字符的文件。 */
  const freeText=['note','notes','hypothesis','conclusion','text'];
  (function check(v,k){if(typeof v==='string'){if(!freeText.includes(k)&&/[<>]/.test(v))throw Error(T('存档包含异常内容，已拒绝导入。','セーブデータに不正な内容が含まれているため、読み込みを拒否しました。'))}else if(v&&typeof v==='object')for(const [kk,vv] of Object.entries(v))check(vv,kk)})(raw,'');
  const g=E.normalize(raw);
  if(!g.sim)throw Error(T('存档内容不完整，无法读取。','セーブデータが不完全なため、読み込めません。'));
  return g;
}
function adoptGame(g){
  game=g;selectedRun=game.sim.runs.at(-1)?.id||1;selectedMeter='M1';comparisonResult=null;benchTab='recipe';target=null;pendingImport=null;resetArmed=false;briefIntro=true;
  $('destination').hidden=true;closeDialog();hud();if(shift().clocked)showNight();
}
function exportSave(){
  const data=JSON.stringify({app:'cmp-fab-days',mode:'practical',exportedAt:new Date().toISOString(),save:game},null,1);
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([data],{type:'application/json'}));
  a.download=`fab-days-DAY${String(game.day).padStart(2,'0')}-${game.xp}xp.json`;
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function showSettings(){
  const body=`${settingsNote?`<div class="notice">${esc(settingsNote)}</div>`:''}
<section class="section"><h3>${T('声音','サウンド')}</h3><p class="small">${T('简单的合成提示音：按钮、加工、量测和结案。默认关闭。','ボタン、処理、測定、報告時に鳴る簡単な合成音です。初期設定はオフです。')}</p><button data-ext="sound">${game.muted?T('♪ 打开声音','♪ サウンドをオン'):T('♪ 关闭声音','♪ サウンドをオフ')}</button></section>
<section class="section"><h3>${T('导出存档','セーブデータの書き出し')}</h3><p class="small">${T(`把当前进度（第 ${game.day} 天 · ${game.xp} XP · ${game.history.length} 份历史档案）保存为一个 JSON 文件，可用于备份或换浏览器、换电脑。`,`現在の進行状況（${game.day} 日目 · ${game.xp} XP · 履歴 ${game.history.length} 件）を JSON ファイルとして保存します。バックアップや、別のブラウザ・PC への移行に使えます。`)}</p><button class="primary" data-ext="export">${T('导出存档文件','セーブファイルを書き出す')}</button></section>
<section class="section"><h3>${T('导入存档','セーブデータの読み込み')}</h3><p class="small">${T('选择之前导出的文件。导入会覆盖当前浏览器里的自主实验进度，剧情模式和经典训练不受影响。','以前書き出したファイルを選択します。読み込むと、このブラウザ内の研修センターの進行状況が上書きされます。他のモードには影響しません。')}</p><input type="file" id="importFile" accept=".json,application/json" hidden><button data-ext="pickImport">${T('选择存档文件…','セーブファイルを選択…')}</button>${pendingImport?`<div class="notice good">${T(`已读取：第 ${pendingImport.day} 天 · ${pendingImport.xp} XP · ${pendingImport.history.length} 份历史档案。`,`読み込み内容：${pendingImport.day} 日目 · ${pendingImport.xp} XP · 履歴 ${pendingImport.history.length} 件。`)}<div class="rowActions"><button class="primary" data-ext="confirmImport">${T('用它覆盖当前进度','この内容で上書きする')}</button><button data-ext="cancelImport">${T('取消','キャンセル')}</button></div></div>`:''}</section>
<section class="section"><h3>${T('重新开始','最初からやり直す')}</h3><p class="small">${T('清空自主实验版的全部进度、经验和历史档案，回到第 1 天。建议先导出备份。','研修センターの進行状況、経験値、履歴をすべて消去し、1 日目に戻ります。先にバックアップを書き出すことをおすすめします。')}</p>${resetArmed?`<div class="notice">${T('确定吗？此操作无法撤销。','本当によろしいですか？この操作は取り消せません。')}<div class="rowActions"><button data-ext="confirmReset">${T('确定清空并重新开始','消去して最初から始める')}</button><button class="primary" data-ext="cancelReset">${T('保留进度','進行状況を残す')}</button></div></div>`:`<button data-ext="armReset">${T('重新开始…','最初からやり直す…')}</button>`}</section>`;
  showDialog(T('设置与存档','設定とセーブデータ'),T('SETTINGS / 当前浏览器','SETTINGS / このブラウザ'),body,'settings');settingsNote='';
}
function doExt(action){
  try{switch(action){
    case 'sound':game.muted=!game.muted;save();if(!game.muted)sounds.measure();break;
    case 'export':exportSave();settingsNote=T('存档文件已生成，请查看浏览器的下载位置。','セーブファイルを作成しました。ブラウザのダウンロード先をご確認ください。');break;
    case 'pickImport':$('importFile').click();return;
    case 'confirmImport':if(pendingImport){const g=pendingImport;g.muted=game.muted;adoptGame(g);toast(T('存档已导入。','セーブデータを読み込みました。'));}return;
    case 'cancelImport':pendingImport=null;break;
    case 'armReset':resetArmed=true;break;
    case 'cancelReset':resetArmed=false;break;
    case 'confirmReset':{const g=E.fresh();g.muted=game.muted;g.sim=S.init(1);adoptGame(g);toast(T('已重新开始。欢迎回到第 1 天。','最初からやり直します。1 日目へようこそ。'));return;}
  }}catch(e){settingsNote=e.message}
  showSettings();
}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(b&&!b.disabled&&b.dataset.ext)doExt(b.dataset.ext)});
document.addEventListener('change',e=>{
  if(e.target.id!=='importFile'||!e.target.files[0])return;
  const file=e.target.files[0];
  if(file.size>5e6){settingsNote=T('文件过大，不像是本游戏的存档。','ファイルが大きすぎます。このゲームのセーブデータではないようです。');showSettings();return}
  file.text().then(t=>{pendingImport=readSave(t)}).catch(err=>{pendingImport=null;settingsNote=err.message}).then(showSettings);
});
$('settingsButton').onclick=()=>{resetArmed=false;showSettings()};
$('langButton').onclick=()=>{save();setLang(LANG==='ja'?'zh':'ja')};

/* ---------- 六场景进度与结业 ---------- */
function scenarioProgress(){return S.scenarios.map((sc,i)=>{const hs=game.history.filter(h=>h.case===i&&h.simArchive);return {title:sc.title,plays:hs.length,best:hs.length?Math.max(...hs.map(h=>h.score)):null}})}
function progressHTML(){
  const ps=scenarioProgress(),done=ps.filter(p=>p.plays).length;
  return `<h3>${T(`六个场景 · 已完成 ${done} / 6`,`6つのシナリオ · 完了 ${done} / 6`)}</h3><div class="history">${ps.map((p,i)=>`<div class="stamp ${p.plays?'':'pending'}"><strong>${p.plays?p.best:'◇'}</strong>${T('场景','シナリオ')} ${i+1}<br><small>${p.plays?esc(p.title)+' · '+p.plays+T(' 次',' 回'):T('尚未进行','未実施')}</small></div>`).join('')}</div><h3>${T('研修称号','研修の称号')}</h3><div class="history">${E.levels.map(([name,xp])=>`<div class="stamp ${game.xp>=xp?'':'pending'}"><strong>${game.xp>=xp?'✓':'◇'}</strong>${name}<br><small>${xp} XP</small></div>`).join('')}</div><p class="small">${T('称号只表示游戏内的研修进度。印章上的数字是该场景的最高实验习惯分。','称号はゲーム内の研修の進み具合を示すだけです。スタンプの数字は、そのシナリオでの実験習慣スコアの最高点です。')}</p><h3>${T('每日记录','日ごとの記録')}</h3>`;
}
function graduationHTML(){
  const ps=scenarioProgress();if(game.day%6!==0||ps.some(p=>!p.plays))return '';
  const avg=Math.round(ps.reduce((n,p)=>n+p.best,0)/6),archives=game.history.filter(h=>h.simArchive),wafers=archives.reduce((n,h)=>n+h.simArchive.runs.length,0),cost=archives.reduce((n,h)=>n+h.simArchive.expense,0),round=game.day/6;
  const words=avg>=90?T('基准、单变量、重复、量测核查，你已经把它们变成了习惯。接下来的复训，可以试试用更少的试片和成本达到同样的证据强度。','ベースライン、一因子比較、繰り返し、測定の確認。どれも習慣になりましたね。次の再研修では、より少ないテストウェーハとコストで、同じ強さの根拠を得ることに挑戦してみてください。'):avg>=70?T('主要的实验习惯已经建立。翻翻印章分数较低的场景，看看复盘里缺了哪一类记录，复训时补上。','主な実験習慣は身についてきました。スコアの低いシナリオの振り返りを見直し、どの記録が足りなかったかを確認して、再研修で補いましょう。'):T('六个场景都走完了，这本身就是收获。复训时先抓两件事：每天留一片基准，每次只改一个因素。','6つのシナリオをやり遂げたこと自体が成果です。再研修ではまず二つだけ意識しましょう。毎日ベースラインを1枚取ること、一度に変える因子は一つだけにすることです。');
  return `<section class="section graduation"><span class="overline">${round>1?T('第 '+round+' 轮复训完成','再研修 '+round+' 周目 完了'):T('研修结业','研修修了')}</span><h3 class="nightTitle">${T('六个场景，全部走完了。','6つのシナリオを、すべてやり遂げました。')}</h3><div class="history">${ps.map((p,i)=>`<div class="stamp"><strong>${p.best}</strong>${T('场景','シナリオ')} ${i+1}<br><small>${esc(p.title)}</small></div>`).join('')}</div><div class="costSummary"><span>${T('最高分平均','最高点の平均')} <b>${avg}</b></span><span>${T('累计试片','テストウェーハ累計')} <b>${wafers}</b></span><span>${T('累计模拟成本','コスト累計')} <b>${cost}</b></span><span>${T('称号','称号')} <b>${E.rank(game)}</b></span></div>${speech('lead',words)}<p class="small">${T('之后的每一天会按相同顺序复训六个场景，随机扰动不同。可在「设置」里导出存档留作纪念。','この後は同じ順番で6つのシナリオを再研修します。ばらつきは毎回変わります。「設定」からセーブデータを書き出して記念に残せます。')}</p><p>${T('研修结束后，可以去','研修が終わったら、')} <a href="shift.html">${T('量产值班','量産シフト')}</a>${T('：两台机台连续跑批，异常不再提前告诉你，要自己从控制图上发现。',' に進みましょう。2台の装置が連続生産し、異常は事前に知らされません。管理図から自分で気づく必要があります。')}</p></section>`;
}
const baseShowNotebook=showNotebook;
showNotebook=function(tab='evidence'){baseShowNotebook(tab);if(tab==='growth')$('dialogBody').querySelector('.bookTabs').insertAdjacentHTML('afterend',progressHTML())};
const baseShowNight=showNight;
showNight=function(){baseShowNight();const next=$('dialogBody').querySelector('[data-sim="nextday"]'),grad=graduationHTML();if(next&&grad){next.insertAdjacentHTML('beforebegin',grad);next.textContent=T('开始下一轮复训 →','次の再研修を始める →');if(!showNight.played){showNight.played=game.day;sounds.done()}}};

/* ---------- 同事交流（每天每人一次，不透露当日场景答案） ---------- */
const practicalHints={
  lead:[T('先留一片什么都不改的基准。没有基准，后面的“变好了”就没有参照。','まず何も変えずに1枚、ベースラインを取りましょう。基準がなければ、後で「良くなった」と言っても比べるものがありません。'),T('一次只动一个因素。两样一起改，变好了也说不清是谁的功劳。','一度に変える因子は一つだけ。二つ同時に変えると、良くなってもどちらの効果か分かりません。'),T('达标一次不算数。同一方案连续几片都稳定，才值得写进结论。','1回規格に入っただけでは不十分です。同じ条件で何枚か続けて安定して、初めて結論に書けます。')],
  tool:[T('设定值是你要的，实际反馈是机台给的。两者对不上时，先别急着改配方。','設定値はこちらが指示した値、実測値は装置が返してくる値です。二つが合わないときは、慌ててレシピを変えないでください。'),T('新垫不是装上就能用。磨合前后各跑一片，看看差多少。','新しいパッドは取り付けてすぐには使えません。慣らしの前後で1枚ずつ処理して、どれだけ違うか見てみてください。'),T('一台机怪的时候，拿另一台同配方跑一片。机台间对照比猜快。','片方の号機がおかしいときは、もう一台で同じレシピを1枚流してみましょう。推測するより号機間の比較のほうが早いです。')],
  metrology:[T('读数可疑时，同一片拿去另一台量测机再测一次，不用重新研磨。','測定値が疑わしいときは、同じウェーハを別の測定機でもう一度測ってください。研磨し直す必要はありません。'),T('参考片是已知厚度的标尺。先量标尺，再相信读数。','標準ウェーハは膜厚が分かっている物差しです。まず物差しを測ってから、測定値を信じましょう。'),T('别只看平均膜厚。打开晶圆图，看看边缘和中心是不是一个样。','平均膜厚だけを見ないでください。面内マップを開いて、エッジと中心が同じ傾向かを確認しましょう。')]};
function practicalTalk(id){
  if(!people[id]||!shift().briefed)return '';
  const n=game.rapport[id]||0,done=shift().talked.includes(id);
  return `<section class="section"><h3>${T(`和${people[id].name}聊聊`,`${people[id].name}に相談する`)}</h3>${done?speech(id,practicalHints[id][(n-1)%3])+`<span class="small">${T(`今日已交流 · 默契 ${n}`,`本日は相談済み · 信頼度 ${n}`)}</span>`:`<p class="small">${T('每天一次，听一条通用的实验建议；不会透露今天场景的答案，也不计入评分。','1日1回、実験の進め方についての一般的なアドバイスがもらえます。今日のシナリオの答えは教えてもらえず、評価にも影響しません。')}</p>${costButton('talk',T('请教一个工作建议','仕事のアドバイスをもらう'),10,2,shift().report,`data-person="${id}"`)}`}</section>`;
}
const baseStationBody=stationBody;
stationBody=function(id){return baseStationBody(id)+(id==='lead'||id==='tool'||id==='metrology'?practicalTalk(id):'')};

/* ---------- HUD 补充：低专注力提示色、伙伴默契 ---------- */
const baseHud=hud;
hud=function(){
  baseHud();
  $('energyBar').style.background=shift().energy<30?'#f4b179':'var(--mint)';
  $('relations').insertAdjacentHTML('beforeend',`<div class="rapportRow">${Object.entries(people).map(([id,p])=>`<span title="${p.role}"><i class="initial">${p.initial}</i>${p.name} <b>${game.rapport[id]||0}</b></span>`).join('')}</div>`);
};
const baseGuide=guide;
guide=function(){baseGuide();$('dialogBody').insertAdjacentHTML('beforeend',`<h3>${T('存档、声音与同事','セーブ・サウンド・同僚')}</h3><p>${T('右上角「设置」可以导出 / 导入存档文件、打开提示音或重新开始。晨会、机台和量测室的同事每天可以请教一次，得到通用的实验建议。走完六个场景后会有一份结业总结，之后进入复训。','右上の「設定」で、セーブファイルの書き出し・読み込み、サウンドのオン、最初からのやり直しができます。朝会、装置、測定室の同僚には1日1回相談でき、実験の進め方について一般的なアドバイスがもらえます。6つのシナリオを終えると修了のまとめが表示され、その後は再研修に入ります。')}</p>`)};

/* ---------- 行走精灵图（可选素材；文件不存在时沿用单张立绘） ---------- */
/* 规格：4 列 × 4 行等分网格。行：下、左、右、上；列：第 0 帧站立，0→3 循环为行走。 */
let spriteEl=null,facing=0,lastPos={...game.position};
function useSpriteSheet(url){
  const img=new Image();
  img.onload=()=>{const p=$('player');spriteEl=p.querySelector('.sprite');if(!spriteEl){spriteEl=document.createElement('div');spriteEl.className='sprite';p.appendChild(spriteEl)}spriteEl.style.backgroundImage=`url("${url}")`;p.classList.add('sheet')};
  img.src=url;
}
function spriteTick(t){
  const p=game.position,dx=p.x-lastPos.x,dy=p.y-lastPos.y;
  if(Math.abs(dx)>.001||Math.abs(dy)>.001)facing=Math.abs(dx)*1.5>=Math.abs(dy)?(dx<0?1:2):(dy<0?3:0);
  lastPos={x:p.x,y:p.y};
  if(spriteEl){const frame=$('player').classList.contains('walking')?Math.floor(t/140)%4:0;spriteEl.style.backgroundPosition=`${frame/3*100}% ${facing/3*100}%`}
  requestAnimationFrame(spriteTick);
}
useSpriteSheet(SPRITE_SHEET);requestAnimationFrame(spriteTick);

/* ---------- 声音（Web Audio 合成，无素材文件） ---------- */
let audioCtx=null;
function tone(freq,dur,type='square',vol=.04,when=0){
  if(game.muted)return;
  try{audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain(),t=audioCtx.currentTime+when;o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(audioCtx.destination);o.start(t);o.stop(t+dur)}catch(e){}
}
const sounds={
  click:()=>tone(660,.05),
  run:()=>{for(let i=0;i<6;i++)tone(110+i*12,.22,'sawtooth',.03,i*.2)},
  measure:()=>{tone(880,.06);tone(1320,.08,'square',.04,.08)},
  done:()=>[523,659,784,1047].forEach((f,i)=>tone(f,.18,'triangle',.06,i*.12))};
const measureCount=()=>runs().reduce((n,r)=>n+r.measurements.length,0);
const baseDoSim=doSim;
doSim=function(action,b){
  const r0=runs().length,m0=measureCount(),rep0=shift().report;
  baseDoSim(action,b);
  if(runs().length>r0)sounds.run();else if(measureCount()>m0)sounds.measure();else if(!rep0&&shift().report)sounds.done();
};
document.addEventListener('click',e=>{const b=e.target.closest('button');if(b&&!b.disabled)sounds.click()},true);

hud();if(shift().clocked)showNight();
