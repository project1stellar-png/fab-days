/* 学习手册：场景知识卡（结案后解锁）、三语术语检索、面试演练（要点自查，不做自动判分）、FMEA 练习。
   依赖 knowledge.js 的 CMP_KB，i18n.js 的 T / LANG，以及 rpg.js / practical.js 的 showDialog、game、save 等全局。
   内容字段约定：日语界面优先取 xxxJa，没有则回退到中文字段。 */
const KB=CMP_KB,JA=LANG==='ja',FLOW=globalThis.CMP_FLOW,SAFE=globalThis.CMP_SAFETY;
/* 把制造流程、安全常识两份数据里的术语和面试题并入手册 */
if(SAFE&&!KB.terms.some(t=>t.id==='ky'))KB.terms.push(...SAFE.terms.map(([id,cat,zh,ja,yomi,en,desc,descJa,descEn])=>({id,cat,zh,ja,yomi,en,desc,descJa,descEn})));
for(const src of [FLOW,SAFE])if(src)for(const d of src.drills)if(!KB.drills.some(x=>x.id===d.id))KB.drills.push(d);
let flowStep='cmp';
let learnTab='cards',learnCard=null,learnDrill=null,drillOpen=false,termQuery='',termCat='';
function learnState(){if(!game.learn||typeof game.learn!=='object')game.learn={};const L=game.learn;if(!L.drills||typeof L.drills!=='object')L.drills={};if(!L.answers||typeof L.answers!=='object')L.answers={};if(!L.fmea||typeof L.fmea!=='object')L.fmea={};return L}
const cardUnlocked=i=>game.history.some(h=>h.case===i&&h.simArchive)||(game.sim.scenario===i&&shift().report);
const termById=id=>KB.terms.find(t=>t.id===id);
const F=(o,k)=>JA&&o[k+'Ja']!==undefined?o[k+'Ja']:o[k];
const catName=c=>JA&&KB.catsJa?KB.catsJa[c]||c:c;
const levelNames=[T('还讲不清','まだ説明できない'),T('基本能讲','だいたい説明できる'),T('能流利讲','流暢に説明できる')];
const scenarioLabel=i=>T('场景','シナリオ')+' '+(i+1);
/* 示范回答：当前界面语言的那一份默认展开，另一种语言折叠 */
function answers(o,open){const ja=`<details ${JA||open?'open':''}><summary>${T('示范回答（日本語）','回答例（日本語）')}</summary><p class="jp" lang="ja">${o.aJa}</p></details>`,zh=`<details ${!JA&&open?'open':''}><summary>${T('示范回答（中文）','回答例（中国語）')}</summary><p lang="zh-CN">${o.aZh}</p></details>`;return JA?ja+zh:zh+ja}
function question(o){return JA?`<h3 lang="ja">${o.qJa}</h3><p class="small" lang="zh-CN">${o.qZh}</p>`:`<h3>${o.qZh}</h3><p class="jp" lang="ja"><b>${o.qJa}</b></p>`}

function termRow(t){
  const main=JA?`<b lang="ja">${t.ja}${t.yomi&&t.yomi!==t.ja?`<small>${t.yomi}</small>`:''}</b><span lang="en">${t.en}</span><span lang="zh-CN">${t.zh}</span>`:`<b>${t.zh}</b><span lang="ja">${t.ja}${t.yomi&&t.yomi!==t.ja?`<small>${t.yomi}</small>`:''}</span><span lang="en">${t.en}</span>`;
  return `<div class="termRow"><div class="termNames">${main}</div><p>${F(t,'desc')}</p></div>`;
}
function termList(){
  const q=termQuery.trim().toLowerCase(),list=KB.terms.filter(t=>(!termCat||t.cat===termCat)&&(!q||[t.zh,t.ja,t.yomi,t.en,t.desc,t.descJa||''].some(s=>s.toLowerCase().includes(q))));
  return list.length?list.map(termRow).join(''):`<p class="small">${T('没有匹配的术语。','該当する用語がありません。')}</p>`;
}
function termsTab(){
  return `<p class="small">${T(`共 ${KB.terms.length} 条，中文 / 日本語（读音）/ English。解释是教科书层面的通用知识；入职后以公司资料和现场说法为准。`,`全 ${KB.terms.length} 語。日本語（読み）/ English / 中国語。説明は教科書レベルの一般的な知識です。入社後は会社の資料と現場の用語を優先してください。`)}</p><div class="termFilter"><input id="termSearch" type="search" placeholder="${T('搜索：中文、日语、假名或英文','検索：日本語、かな、英語、中国語')}" value="${esc(termQuery)}" aria-label="${T('搜索术语','用語を検索')}"><select id="termCat" class="simSelect" aria-label="${T('分类','分類')}"><option value="">${T('全部分类','すべての分類')}</option>${KB.cats.map(c=>`<option value="${c}" ${c===termCat?'selected':''}>${catName(c)}</option>`).join('')}</select></div><div id="termList">${termList()}</div>`;
}
/* 知识卡：日语 / 英语左右对照，中文折叠备查。缺英文字段时回退为单栏。 */
function bi(ja,en,zh){return `<div class="bi"><div lang="ja">${ja}</div><div lang="en">${en||''}</div></div>${zh?`<details class="zhNote"><summary>中文</summary><div lang="zh-CN">${zh}</div></details>`:''}`}
function biTerm(t){return `<div class="termRow"><div class="termNames"><b lang="ja">${t.ja}${t.yomi&&t.yomi!==t.ja?`<small>${t.yomi}</small>`:''}</b><span lang="en">${t.en}</span><span lang="zh-CN">${t.zh}</span></div>${bi(`<p>${t.descJa||''}</p>`,`<p>${t.descEn||''}</p>`,`<p>${t.desc}</p>`)}</div>`}
function cardView(i){
  const c=KB.cards[i],h=(ja,en)=>`<h3><span lang="ja">${ja}</span> <small lang="en">/ ${en}</small></h3>`;
  return `<button data-learn="cards">${T('← 全部知识卡','← 知識カード一覧')}</button><h3>${scenarioLabel(i)} · <span lang="ja">${c.titleJa||c.title}</span><br><small lang="en">${c.titleEn||''}</small></h3><p class="small" lang="zh-CN">${c.title}</p><section class="section">${h('メカニズム','Mechanism')}${bi(`<p>${c.mechanismJa||''}</p>`,`<p>${c.mechanismEn||''}</p>`,`<p>${c.mechanism}</p>`)}</section><section class="section">${h('実際のラインでの確認手順','How it is checked on a real line')}<ol class="fabList biList">${c.fab.map((f,k)=>`<li>${bi((c.fabJa||[])[k]||'',(c.fabEn||[])[k]||'',f)}</li>`).join('')}</ol></section><section class="section">${h('ゲームとの対応','How this maps to the game')}${bi(`<p>${c.gameJa||''}</p>`,`<p>${c.gameEn||''}</p>`,`<p>${c.game}</p>`)}</section><section class="section">${h('関連用語','Related terms')}${c.terms.map(id=>biTerm(termById(id))).join('')}</section><section class="section">${h('面接での想定質問','Likely interview question')}${bi(`<p><b>${c.qJa}</b></p>`,`<p><b>${c.qEn||''}</b></p>`,`<p><b>${c.qZh}</b></p>`)}<p class="small">${T('先自己试着回答，再展开示范。','まず自分で答えてみてから、回答例を開いてください。')}</p><details><summary><span lang="ja">回答例</span> / <span lang="en">Model answer</span></summary>${bi(`<p class="jp">${c.aJa}</p>`,`<p>${c.aEn||''}</p>`,`<p>${c.aZh}</p>`)}</details></section>`;
}
function cardsTab(){
  if(learnCard!==null&&cardUnlocked(learnCard))return cardView(learnCard);
  const n=KB.cards.filter((_,i)=>cardUnlocked(i)).length;
  return `<p class="small">${T(`每完成一个场景并提交报告，解锁对应的知识卡：机理、产线上的排查方法、相关术语和面试问答。已解锁 ${n} / 6。`,`シナリオを完了して報告書を提出するたびに、対応する知識カードが解放されます。メカニズム、ラインでの確認手順、関連用語、面接想定問答を収録。解放済み ${n} / 6。`)}</p><div class="cardGrid">${KB.cards.map((c,i)=>cardUnlocked(i)?`<button class="kcard" data-learn="card" data-i="${i}"><small>${scenarioLabel(i)}</small><b lang="ja">${c.titleJa||c.title}</b><em lang="en">${c.titleEn||''}</em><span>${T('查看 →','開く →')}</span></button>`:`<div class="kcard locked"><small>${scenarioLabel(i)}</small><b>${T('完成该场景后解锁','シナリオ完了後に解放')}</b><span>${T('提前看会剧透','先に見るとネタバレになります')}</span></div>`).join('')}</div>`;
}
function drillView(id){
  const d=KB.drills.find(x=>x.id===id),L=learnState(),st=L.drills[id]||{n:0,level:-1},mine=L.answers[id]?.text||'';
  return `<button data-learn="drills">${T('← 全部问题','← 質問一覧')}</button><section class="section">${question(d)}<label for="drillAnswer" class="small">${T('先开口说一遍，或把你自己的回答写在这里（会保存，可以反复修改成你自己的版本）：','まず声に出して答えるか、自分の回答をここに書いてください（保存されます。何度でも自分の言葉に直せます）。')}</label><textarea id="drillAnswer" data-drill="${id}" placeholder="${T('用你面试时打算用的语言写。','面接で使う言語で書いてください。')}">${esc(mine)}</textarea>${drillOpen?`<h3>${T('要点自查','要点セルフチェック')}</h3><ul class="pointList">${F(d,'points').map(p=>`<li><label><input type="checkbox"> ${p}</label></li>`).join('')}</ul>${answers(d,true)}${d.link!==null?`<p class="small">${T('相关场景：','関連シナリオ：')}${cardUnlocked(d.link)?`<button data-learn="card" data-i="${d.link}">${scenarioLabel(d.link)} ${T('知识卡','知識カード')}</button>`:`${scenarioLabel(d.link)}${T('（完成后解锁知识卡）','（完了後に知識カード解放）')}`}</p>`:''}<h3>${T('这次讲得怎么样？','今回はどのくらい説明できましたか？')}</h3><div class="rowActions">${levelNames.map((n,i)=>`<button data-learn="rate" data-level="${i}" class="${i===2?'primary':''}">${n}</button>`).join('')}</div><p class="small">${T(`自己评。示范回答只是参考，面试时要用自己的话，并且只说自己真正理解的内容。已练习 ${st.n} 次。`,`自己評価です。回答例は参考にとどめ、面接では自分の言葉で、本当に理解している内容だけを話してください。練習回数 ${st.n} 回。`)}</p>`:`<div class="rowActions"><button class="primary" data-learn="reveal">${T('显示要点和示范回答','要点と回答例を表示')}</button></div>`}</section>`;
}
function drillsTab(){
  if(learnDrill)return drillView(learnDrill);
  const L=learnState(),good=KB.drills.filter(d=>L.drills[d.id]?.level===2).length;
  return `<p class="small">${T(`${KB.drills.length} 个常见问题。流程：看题 → 自己说或写 → 对照要点 → 自评。不做自动判分。能流利讲：${good} / ${KB.drills.length}。`,`よくある質問 ${KB.drills.length} 問。流れ：質問を読む → 自分で話す・書く → 要点と照合 → 自己評価。自動採点はしません。流暢に説明できる：${good} / ${KB.drills.length}。`)}</p><div class="rowActions"><button class="primary" data-learn="randomDrill">${T('随机抽一题','ランダムに1問')}</button></div><div class="drillList">${KB.drills.map(d=>{const st=L.drills[d.id];return `<button class="drillItem" data-learn="drill" data-id="${d.id}"><span lang="${JA?'ja':'zh-CN'}">${JA?d.qJa:d.qZh}<small lang="${JA?'zh-CN':'ja'}">${JA?d.qZh:d.qJa}</small></span><em class="lv${st?st.level:-1}">${st?levelNames[st.level]+' · '+st.n+T(' 次',' 回'):T('未练习','未練習')}</em></button>`}).join('')}</div>`;
}
function fmeaTab(){
  const L=learnState(),rows=KB.fmea.filter(r=>cardUnlocked(r.scenario)),rpn=r=>{const v=L.fmea[r.id];return v&&v.s&&v.o&&v.d?v.s*v.o*v.d:null};
  const sel=(r,k)=>{const v=L.fmea[r.id]?.[k]||'';return `<select class="simSelect" data-fmea="${r.id}" data-k="${k}" aria-label="${k.toUpperCase()}"><option value="">—</option>${[1,2,3,4,5,6,7,8,9,10].map(n=>`<option ${n===v?'selected':''}>${n}</option>`).join('')}</select>`};
  const ranked=rows.filter(r=>rpn(r)!==null).sort((a,b)=>rpn(b)-rpn(a)),mode=r=>JA?r.modeJa:r.mode;
  return `<p>${T('FMEA 是在问题发生<b>之前</b>给风险排序的工具。下面每一行是你在研修中心亲手处理过的一种失效。请你自己给三个分数（1–10），再对照示例，看看想法差在哪。','FMEA は、問題が起きる<b>前</b>にリスクの優先順位を付ける手法です。下の各行は、研修センターで自分が対応した故障モードです。三つの点数（1〜10）を自分で付けてから、参考例と比べて、考え方の違いを確認してください。')}</p><div class="notice">${T('<b>严重度 S</b>：后果多严重（10 = 最严重）。<b>发生度 O</b>：原因多常出现（10 = 经常）。<b>探测度 D</b>：现有管控多难在流出前发现它（10 = 几乎发现不了）。RPN = S × O × D。示例评分只是一种合理的判断，不是标准答案：真实的评分标准表由各公司规定，新版手册还改用了“措施优先级”。','<b>影響度 S</b>：結果の重大さ（10 = 最も重大）。<b>発生度 O</b>：原因の起こりやすさ（10 = 頻繁）。<b>検出度 D</b>：現在の管理で流出前に見つける難しさ（10 = ほぼ検出できない）。RPN = S × O × D。参考例は一つの妥当な判断であって、正解ではありません。実際の評価基準表は会社ごとに定められており、新しい手引きでは「処置優先度（AP）」が使われています。')}</div>${rows.length?'':`<p class="notice">${T('还没有可练习的行。每完成一个研修场景，解锁对应的失效模式。','まだ練習できる行がありません。研修シナリオを完了するたびに、対応する故障モードが解放されます。')}</p>`}${ranked.length>1?`<section class="section"><h3>${T('你的风险排序','あなたのリスク順位')}</h3>${ranked.map((r,i)=>`<div class="logEntry"><time>${i+1}</time><span>${mode(r)} · RPN ${rpn(r)}${L.fmea[r.id].s>=8?T(' · 严重度高，即使 RPN 不是最高也要优先看',' · 影響度が高いため、RPN が最大でなくても優先して確認'):''}</span></div>`).join('')}<p class="small">${T('想一想：排第一的这项，你会追加什么对策？是降低发生（改寿命、改流程），还是提前探测（加监控、加点检）？','考えてみましょう。1位の項目に、どんな対策を追加しますか。発生を減らす（寿命や手順の見直し）のか、検出を早める（監視や点検の追加）のか。')}</p></section>`:''}${rows.map(r=>{const v=L.fmea[r.id]||{},done=rpn(r)!==null;return `<section class="section fmeaRow"><h3>${mode(r)}</h3><p class="small" lang="${JA?'zh-CN':'ja'}">${JA?r.mode:r.modeJa}</p><div class="fmeaGrid"><div><b>${T('影响','影響')}</b><p>${F(r,'effect')}</p></div><div><b>${T('原因','原因')}</b><p>${F(r,'cause')}</p></div><div><b>${T('现行管控','現在の管理')}</b><p>${F(r,'control')}</p></div></div><div class="fmeaScore"><label>S ${sel(r,'s')}</label><label>O ${sel(r,'o')}</label><label>D ${sel(r,'d')}</label><span class="rpn">RPN <b>${done?rpn(r):'—'}</b></span><button data-learn="fmeaRef" data-id="${r.id}" ${done?'':'disabled'}>${T('对照示例评分','参考例と比べる')}</button></div>${v.shown&&done?`<div class="notice good">${T('示例','参考例')}：S ${r.ref.s} · O ${r.ref.o} · D ${r.ref.d} · RPN ${r.ref.s*r.ref.o*r.ref.d}<br>${F(r,'why')}</div>`:''}</section>`}).join('')}`;
}
/* 主语言显示一份，另一种语言折叠 */
function both(zh,ja){return `<p lang="${JA?'ja':'zh-CN'}">${JA?ja:zh}</p><details class="zhNote"><summary>${JA?'中文':'日本語'}</summary><p lang="${JA?'zh-CN':'ja'}">${JA?zh:ja}</p></details>`}
function flowTab(){
  if(!FLOW)return '';
  const st=FLOW.steps.find(x=>x.id===flowStep)||FLOW.steps[0],chip=x=>`<button data-flow="${x.id}" class="flowChip ${x.id===flowStep?'selected':''} ${x.id==='cmp'?'isCmp':''}"><b>${JA?x.ja:x.zh}</b><small>${x.en}</small></button>`;
  const pre=FLOW.steps.filter(x=>!x.loop&&x.id==='wafer'),loop=FLOW.steps.filter(x=>x.loop),post=FLOW.steps.filter(x=>!x.loop&&x.id!=='wafer');
  return `<p class="small">${T('点任意一步，看它做什么、和 CMP 是什么关系。中间框里的几步会重复几十次，一层一层把电路叠上去。内容是概括性的通用知识，各公司的工序名称和顺序不同。','各ステップをクリックすると、その役割と CMP との関係が表示されます。枠の中の工程を数十回繰り返し、一層ずつ回路を積み上げていきます。内容は一般的な概要であり、工程の名称や順序は会社によって異なります。')}</p><div class="flowRow">${pre.map(chip).join('')}<span class="flowArrow">→</span><div class="flowLoop"><span class="overline">${T('前工序 · 重复几十次','前工程 · 数十回繰り返す')}</span><div class="flowLoopRow">${loop.map(chip).join('<span class="flowArrow">→</span>')}</div></div><span class="flowArrow">→</span>${post.map(chip).join('<span class="flowArrow">→</span>')}</div><section class="section"><h3>${JA?st.ja:st.zh} <small lang="en">/ ${st.en}</small></h3>${both(st.whatZh,st.whatJa)}<h3>${T('和 CMP 的关系','CMP との関係')}</h3>${both(st.cmpZh,st.cmpJa)}</section><h3>${T('CMP 主要用在哪里','CMP が使われる主な場所')}</h3><div class="useGrid">${FLOW.uses.map(u=>`<section class="section"><h3>${JA?u.ja:u.zh} <small lang="en">/ ${u.en}</small></h3>${both(u.zhText,u.jaText)}</section>`).join('')}</div><h3>${T('按产品类型看','製品タイプ別に見ると')}</h3>${FLOW.products.map(p=>`<section class="section"><h3>${JA?p.ja:p.zh}</h3>${both(p.zhText,p.jaText)}</section>`).join('')}<p class="small">${T('面试前请看应聘公司公开的产品和工艺介绍，用它替换这里的概括说明。','面接の前に、応募先企業が公開している製品・プロセスの紹介を確認し、ここの一般的な説明を置き換えてください。')}</p>`;
}
function safetyTab(){
  if(!SAFE)return '';
  return `<div class="notice">${T('这里只写各公司通用的原则。具体的着装顺序、保护具、报告路径和紧急措施，以公司的规定和入职培训为准。','ここに書いてあるのは、どの会社にも共通する原則だけです。具体的な更衣手順、保護具、報告ルート、緊急時の対応は、会社の規定と入社時教育に従ってください。')}</div>${SAFE.cards.map(c=>`<section class="section"><h3>${JA?c.ja:c.zh}</h3>${both(c.zhText,c.jaText)}</section>`).join('')}`;
}
function showHandbook(){
  const tabs=[['cards',T('知识卡','知識カード')],['flow',T('制造流程','製造フロー')],['terms',T('术语','用語')],['drills',T('面试演练','面接練習')],['fmea',T('FMEA 练习','FMEA 演習')],['safety',T('安全与基本','安全・基本')]];
  showDialog(T('学习手册','学習ハンドブック'),'HANDBOOK',`<div class="bookTabs">${tabs.map(([k,n])=>`<button data-learn="${k}" class="${learnTab===k?'selected':''}">${n}</button>`).join('')}</div>${learnTab==='cards'?cardsTab():learnTab==='terms'?termsTab():learnTab==='fmea'?fmeaTab():learnTab==='flow'?flowTab():learnTab==='safety'?safetyTab():drillsTab()}`,'handbook');
}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-learn]');if(!b||b.disabled)return;
  const a=b.dataset.learn,L=learnState();
  if(a==='fmeaRef'){const v=L.fmea[b.dataset.id];if(v){v.shown=true;save()}showHandbook();return}
  if(a==='cards'||a==='terms'||a==='drills'||a==='fmea'||a==='flow'||a==='safety'){learnTab=a;learnCard=null;learnDrill=null;drillOpen=false}
  else if(a==='card'){learnTab='cards';learnCard=Number(b.dataset.i);learnDrill=null}
  else if(a==='drill'){learnDrill=b.dataset.id;drillOpen=false}
  else if(a==='randomDrill'){const pool=KB.drills.filter(d=>L.drills[d.id]?.level!==2),from=pool.length?pool:KB.drills;learnDrill=from[Math.floor(Math.random()*from.length)].id;drillOpen=false}
  else if(a==='reveal')drillOpen=true;
  else if(a==='rate'){const st=L.drills[learnDrill]||{n:0,level:-1};st.n++;st.level=Number(b.dataset.level);L.drills[learnDrill]=st;save();learnDrill=null;drillOpen=false;toast(T('已记录。隔一天再练一次，记得更牢。','記録しました。1日あけてもう一度練習すると、より定着します。'))}
  showHandbook();$('workDialog').scrollTop=0;
});
document.addEventListener('input',e=>{
  if(e.target.id==='termSearch'){termQuery=e.target.value;$('termList').innerHTML=termList()}
  if(e.target.id==='drillAnswer'){learnState().answers[e.target.dataset.drill]={text:e.target.value};save()}
});
document.addEventListener('change',e=>{if(e.target.dataset.fmea){const L=learnState(),v=L.fmea[e.target.dataset.fmea]||(L.fmea[e.target.dataset.fmea]={});v[e.target.dataset.k]=Number(e.target.value)||0;save();showHandbook()}if(e.target.id==='termCat'){termCat=e.target.value;$('termList').innerHTML=termList()}});
document.addEventListener('click',e=>{const b=e.target.closest('[data-flow]');if(!b)return;flowStep=b.dataset.flow;showHandbook()});
$('handbookButton').onclick=showHandbook;

/* 结案复盘里提示新解锁的知识卡 */
const baseSimReview=simReview;
simReview=function(){const i=game.sim.scenario;return baseSimReview()+`<section class="section kcardNotice"><span class="overline">${T('知识卡已解锁','知識カード解放')}</span><h3>${F(KB.cards[i],'title')}</h3><p class="small">${T('这个场景背后的机理、实际产线上的排查方法，以及面试时怎么讲。','このシナリオの背景にあるメカニズム、実際のラインでの確認手順、面接での説明の仕方。')}</p><button class="primary" data-learn="card" data-i="${i}">${T('打开知识卡','知識カードを開く')}</button></section>`};
if(location.hash==='#handbook')showHandbook();
