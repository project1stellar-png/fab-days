/* 缺陷图判读练习（中文 / 日本語）。图样是教科书层面的典型模式，真实的缺陷图更杂乱，常常几种来源叠在一起。
   检查机只给出位置；类型要靠抽样复查（SEM レビュー）才知道。 */
const DKEY='cmp-fab-defects-v1',$=id=>document.getElementById(id);
function rng(seed){let a=seed>>>0;return ()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296}}
/* ---- 图样生成：返回 [{x,y,t}]，坐标在单位圆内；t: s 划伤 / p 颗粒 / r 残留 / c 腐蚀 / w 水痕 ---- */
const G={
  random(r,n,t){const o=[];while(o.length<n){const x=r()*2-1,y=r()*2-1;if(x*x+y*y<.94)o.push({x,y,t})}return o},
  edge(r,n,t){const o=[];for(let i=0;i<n;i++){const a=r()*6.283,d=.9+r()*.085;o.push({x:d*Math.cos(a),y:d*Math.sin(a),t})}return o},
  cluster(r,cx,cy,n,s,t){const o=[];for(let i=0;i<n;i++){const a=r()*6.283,d=Math.sqrt(r())*s;const x=cx+d*Math.cos(a),y=cy+d*Math.sin(a);if(x*x+y*y<.94)o.push({x,y,t})}return o},
  arcs(r,k,t){const o=[];for(let j=0;j<k;j++){const ca=r()*6.283,cd=1.5+r()*.6,cx=cd*Math.cos(ca),cy=cd*Math.sin(ca),rho=cd-.75+r()*1.3,a0=Math.atan2(-cy,-cx);for(let u=-.7;u<=.7;u+=.018){const x=cx+rho*Math.cos(a0+u),y=cy+rho*Math.sin(a0+u);if(x*x+y*y<.94&&r()>.12)o.push({x,y,t})}}return o},
  micro(r,n,t){const o=[];for(let i=0;i<n;i++){const x=r()*1.8-.9,y=r()*1.8-.9,a=r()*3.14;if(x*x+y*y>.85)continue;for(let k=-1;k<=1;k++)o.push({x:x+k*.012*Math.cos(a),y:y+k*.012*Math.sin(a),t})}return o},
  swirl(r,n,t){const o=[];for(let i=0;i<n;i++){const u=r(),a=u*9+r()*.25,d=.12+u*.78;o.push({x:d*Math.cos(a),y:d*Math.sin(a),t})}return o}
};
const bg=(r,n=10)=>G.random(r,n,'p');
const CASES=[
 {id:'arc',seed:11,make:r=>[...G.arcs(r,3,'s'),...bg(r)],stack:r=>[...G.arcs(r,2,'s'),...G.arcs(r,2,'s'),...bg(r,30)],other:r=>bg(r,12),trend:[9,11,10,58,64,71,69,75],
  ctx:T('Tool A。缺陷数从本批第 4 片开始突然升高。研磨液批次未变，昨天做过定期保养。','Tool A。このロットの4枚目から欠陥数が急増しました。スラリーのロットは変わっていません。昨日、定期メンテナンスを実施しています。'),
  cause:[T('修整盘金刚石脱落或垫上嵌入了硬颗粒','ドレッサーのダイヤモンド脱落、またはパッドへの硬い異物の食い込み'),T('研磨液团聚产生大颗粒','スラリーの凝集による粗大粒子'),T('清洗单元刷子老化','洗浄ユニットのブラシ劣化'),T('搬送机械手接触','搬送ロボットの接触')],causeOk:0,
  act:[T('立即停机，检查修整盘和垫表面，必要时更换；扣留第 4 片以后的晶圆','直ちに装置を停止し、ドレッサーとパッド表面を点検、必要なら交換。4枚目以降のウェーハをホールド'),T('更换研磨液过滤器后继续生产','スラリーフィルターを交換して生産を続ける'),T('降低研磨压力后继续生产','研磨圧力を下げて生産を続ける')],actOk:0,
  why:T('长的弧形划伤沿着垫相对晶圆的运动轨迹分布，说明有一个硬物固定在垫上、每转一圈划一次。突然出现、只在 Tool A、集中在某一片之后，都指向硬件上的单一事件（金刚石脱落或异物嵌入），而不是研磨液。带着这种状态继续跑，每一片都会被划。','長い円弧状のスクラッチは、パッドがウェーハに対して動く軌跡に沿って並んでいます。硬い異物がパッドに固定され、回転のたびに傷を付けていることを示します。突然発生し、Tool A だけで、ある枚数以降に集中していることは、スラリーではなくハード側の単発の出来事（ダイヤモンドの脱落や異物の食い込み）を示しています。この状態で処理を続けると、すべてのウェーハに傷が付きます。')},
 {id:'micro',seed:23,make:r=>[...G.micro(r,42,'s'),...bg(r,8)],stack:r=>G.micro(r,150,'s'),other:r=>[...G.micro(r,38,'s'),...bg(r,8)],trend:[18,22,27,31,38,44,49,55],
  ctx:T('Tool A 和 Tool B 的缺陷数这几天都在缓慢上升。两台机台共用同一套研磨液供给。','ここ数日、Tool A と Tool B の両方で欠陥数が徐々に増えています。両号機は同じスラリー供給系を使っています。'),
  cause:[T('修整盘金刚石脱落','ドレッサーのダイヤモンド脱落'),T('研磨液中的大颗粒（团聚、干结物）增加：过滤器或研磨液状态','スラリー中の粗大粒子（凝集・乾燥固化物）の増加：フィルターまたはスラリーの状態'),T('保持环磨损','リテーナリングの摩耗'),T('干燥单元异常','乾燥ユニットの異常')],causeOk:1,
  act:[T('两台机台都换研磨垫','両号機のパッドを交換する'),T('检查使用点过滤器的压差和更换记录、研磨液大颗粒数、批次与有效期','POUフィルターの差圧と交換履歴、スラリーの粗大粒子数、ロットとポットライフを確認する'),T('提高研磨压力缩短时间','研磨圧力を上げて時間を短縮する')],actOk:1,
  why:T('短小的微划伤随机、均匀地分布在整片上，而且缓慢增加、两台机台同时出现，共同点只有研磨液供给。大颗粒的来源是团聚和干结，第一步查过滤器和研磨液状态。只在一台机台上出现才先怀疑那台的垫或修整盘。','短いマイクロスクラッチがウェーハ全面にランダムかつ均一に分布し、徐々に増加し、しかも両号機で同時に起きています。共通点はスラリー供給系だけです。粗大粒子の原因は凝集や乾燥固化なので、まずフィルターとスラリーの状態を確認します。片方の号機だけで起きている場合に、その号機のパッドやドレッサーを先に疑います。')},
 {id:'edge',seed:37,make:r=>[...G.edge(r,85,'p'),...bg(r,9)],stack:r=>[...G.edge(r,300,'p'),...bg(r,30)],other:r=>bg(r,11),trend:[52,61,57,66,60,63,58,65],
  ctx:T('Tool A。平均膜厚和缺陷总数的趋势图此前都正常，这一批缺陷数偏高。','Tool A。平均膜厚と欠陥数のトレンドはこれまで正常でしたが、このロットで欠陥数が高めです。'),
  cause:[T('研磨液大颗粒','スラリーの粗大粒子'),T('晶圆边缘相关的部件：保持环磨损产生碎屑，或清洗单元的边缘接触部','ウェーハエッジに関わる部品：リテーナリング摩耗による屑、または洗浄ユニットのエッジ接触部'),T('量测设备偏差','測定機のバイアス'),T('研磨时间过长','研磨時間が長すぎる')],causeOk:1,
  act:[T('检查保持环的使用片数与磨损、清洗单元的边缘夹持部件；对比 Tool B','リテーナリングの使用枚数と摩耗、洗浄ユニットのエッジ保持部を点検し、Tool B と比較する'),T('全片加大清洗药液流量','洗浄薬液の流量を全体的に増やす'),T('更换研磨液批次','スラリーのロットを交換する')],actOk:0,
  why:T('缺陷集中在最外圈的一个环带上，内部很干净。研磨液或整体清洗的问题会影响整片，不会只挑边缘。只在边缘，说明来源是只接触边缘的东西：保持环，或清洗、搬送中夹持边缘的部件。','欠陥は最外周のリング状の領域に集中し、内側はきれいです。スラリーや洗浄全体の問題であればウェーハ全面に影響し、エッジだけを選ぶことはありません。エッジだけということは、エッジにだけ触れるもの、つまりリテーナリングや、洗浄・搬送でエッジを保持する部品が原因だと考えます。')},
 {id:'repeat',seed:41,make:r=>[...G.cluster(r,.45,-.55,34,.09,'p'),...bg(r,12)],stack:r=>[...G.cluster(r,.45,-.55,170,.09,'p'),...bg(r,55)],other:r=>bg(r,10),trend:[44,47,45,49,46,48,45,47],
  ctx:T('Tool A。缺陷数整批都偏高，片与片之间很稳定。','Tool A。ロット全体で欠陥数が高めで、ウェーハ間のばらつきは小さいです。'),
  cause:[T('研磨垫堵塞','パッドの目詰まり'),T('研磨液有效期过了','スラリーのポットライフ切れ'),T('搬送或清洗中有部件在固定位置接触晶圆','搬送または洗浄で、決まった位置に部品が接触している'),T('随机的环境落尘','ランダムな環境由来のパーティクル')],causeOk:2,
  act:[T('叠图确认位置重复，再按晶圆朝向对照搬送手臂、载具和清洗单元的接触点','スタックマップで位置の再現を確認し、ウェーハの向きを基準に搬送アーム、キャリア、洗浄ユニットの接触位置と照合する'),T('换研磨垫','パッドを交換する'),T('延长清洗时间','洗浄時間を延ばす')],actOk:0,
  why:T('单片看只是一小团；把几片叠起来，团块落在完全相同的位置。研磨时晶圆在旋转，研磨造成的缺陷不会每片都落在同一处。位置固定，说明是晶圆不转的环节（搬送、装载、清洗夹持）里有东西碰到它。叠图是发现这类问题最有效的手段。','1枚だけ見ると小さなかたまりにすぎませんが、数枚を重ねると、かたまりが全く同じ位置に現れます。研磨中はウェーハが回転しているため、研磨由来の欠陥が毎回同じ場所に出ることはありません。位置が固定されているのは、ウェーハが回転しない工程（搬送、ロード、洗浄時の保持）で何かが接触していることを示します。スタックマップは、この種の問題を見つける最も有効な手段です。')},
 {id:'clean',seed:53,make:r=>[...G.random(r,120,'r'),...bg(r,20)],stack:r=>G.random(r,420,'r'),other:r=>[...G.random(r,110,'r'),...bg(r,18)],trend:[95,110,128,131,140,138,144,149],
  ctx:T('Tool A、Tool B 共用一台清洗单元。去除速率、均匀性都正常。缺陷数一周来持续上升。','Tool A と Tool B は同じ洗浄ユニットを使っています。研磨レートと面内均一性は正常です。欠陥数はこの1週間、上昇し続けています。'),
  cause:[T('CMP 后清洗能力下降：刷子寿命、药液流量或浓度','CMP後洗浄の能力低下：ブラシ寿命、薬液の流量または濃度'),T('修整盘金刚石脱落','ドレッサーのダイヤモンド脱落'),T('保持环磨损','リテーナリングの摩耗'),T('研磨压力过高','研磨圧力が高すぎる')],causeOk:0,
  act:[T('两台机台都换研磨垫','両号機のパッドを交換する'),T('查清洗单元：刷子使用量、药液流量与浓度的实际值、最近的保养记录','洗浄ユニットを確認：ブラシの使用量、薬液流量と濃度の実測値、最近のメンテナンス履歴'),T('降低研磨液流量','スラリー流量を下げる')],actOk:1,
  why:T('复查结果以研磨液残留为主，不是划伤：表面没有被损伤，只是没洗干净。均匀分布在整片、两台研磨机台同时出现、研磨指标正常，三条都指向共用的清洗单元。颗粒和残留增加时，先查清洗而不是研磨。','レビュー結果はスラリー残渣が中心で、スクラッチではありません。表面は傷付いておらず、洗い切れていないだけです。全面に均一、両方の研磨号機で同時に発生、研磨の指標は正常。この三つはすべて、共通の洗浄ユニットを示しています。パーティクルや残渣が増えたときは、研磨より先に洗浄を確認します。')},
 {id:'idle',seed:67,make:r=>[...G.micro(r,30,'s'),...G.random(r,45,'p')],stack:r=>[...G.micro(r,36,'s'),...G.random(r,70,'p')],other:r=>bg(r,12),trend:[88,41,17,11,9,10,8,9],
  ctx:T('Tool A。周一早上的第一批。机台周末停了约 40 小时。这张图是本批第 1 片。','Tool A。月曜朝の最初のロットです。装置は週末に約40時間停止していました。このマップはロットの1枚目です。'),
  cause:[T('机台长时间闲置后，垫面和管路里的研磨液干结','長時間のアイドル後、パッド表面や配管内でスラリーが乾燥固化した'),T('保持环寿命到了','リテーナリングの寿命'),T('量测程序错误','測定レシピの誤り'),T('来片本身有缺陷','前工程起因の欠陥')],causeOk:0,
  act:[T('把前几片报废后照常生产，不改流程','最初の数枚を廃棄して通常どおり生産を続け、手順は変えない'),T('在流程里规定：闲置超过一定时间后，先冲洗并跑假片，确认颗粒合格再放产品','アイドルが一定時間を超えた後は、リンスとダミーウェーハ処理を行い、パーティクルが合格してから製品を流すよう手順に定める'),T('更换研磨垫','パッドを交換する')],actOk:1,
  why:T('批内趋势是关键：第 1 片最差，之后迅速回落到正常水平。这是“首片效应”，机台闲置期间垫面和喷嘴处的研磨液干结，开机后头几片把这些硬块带走。对策不是修东西，而是把“闲置后先跑假片并确认”写进流程，属于再发防止。','決め手はロット内のトレンドです。1枚目が最も悪く、その後すぐに通常レベルに戻っています。これは「ファーストウェーハ効果」で、アイドル中にパッド表面やノズルでスラリーが乾燥固化し、立ち上げ直後の数枚がその固まりを持ち去ります。対策は修理ではなく、「アイドル後はまずダミーウェーハを処理して確認する」ことを手順に組み込むこと、つまり再発防止です。')},
 {id:'toolonly',seed:79,make:r=>[...G.micro(r,48,'s'),...bg(r,8)],stack:r=>G.micro(r,170,'s'),other:r=>bg(r,10),trend:[35,38,41,45,44,49,52,51],
  ctx:T('Tool A。微划伤缓慢增加。Tool B 用同一套研磨液供给、同一批研磨液。','Tool A。マイクロスクラッチが徐々に増えています。Tool B は同じスラリー供給系、同じロットのスラリーを使っています。'),
  cause:[T('研磨液大颗粒','スラリーの粗大粒子'),T('Tool A 自己的垫或修整盘状态（寿命、修整不足、垫面干结物）','Tool A 自身のパッドまたはドレッサーの状態（寿命、ドレッシング不足、パッド表面の固化物）'),T('清洗单元','洗浄ユニット'),T('量测偏差','測定機のバイアス')],causeOk:1,
  act:[T('更换研磨液批次','スラリーのロットを交換する'),T('对比两台机台的垫与修整盘使用片数、修整条件，检查 Tool A 的垫面','両号機のパッドとドレッサーの使用枚数、ドレッシング条件を比較し、Tool A のパッド表面を点検する'),T('两台机台都停机','両号機を停止する')],actOk:1,
  why:T('图样和第 2 题几乎一样，但这次 Tool B 是干净的。同一批研磨液在 B 上没问题，研磨液就基本可以排除，差异在 Tool A 自己身上。同样的图样，对照组不同，结论就不同：这就是为什么要先看另一台机台。','マップの模様は2問目とほとんど同じですが、今回は Tool B がきれいです。同じスラリーで B に問題がなければ、スラリーはほぼ除外でき、違いは Tool A 自身にあります。同じ模様でも、比較対象の結果が違えば結論が変わります。だからこそ、まずもう一台を確認するのです。')},
 {id:'dry',seed:83,make:r=>[...G.swirl(r,70,'w'),...bg(r,8)],stack:r=>[...G.swirl(r,70,'w'),...G.swirl(r,70,'w'),...G.swirl(r,60,'w'),...bg(r,25)],other:r=>[...G.swirl(r,64,'w'),...bg(r,8)],trend:[70,74,69,78,72,75,71,77],
  ctx:T('Tool A、Tool B 共用一台清洗干燥单元。研磨指标正常。','Tool A と Tool B は同じ洗浄・乾燥ユニットを使っています。研磨の指標は正常です。'),
  cause:[T('研磨液大颗粒','スラリーの粗大粒子'),T('保持环磨损','リテーナリングの摩耗'),T('干燥不良留下的水痕','乾燥不良によるウォーターマーク'),T('修整盘金刚石脱落','ドレッサーのダイヤモンド脱落')],causeOk:2,
  act:[T('检查干燥单元：转速、吹扫或干燥用药液的供给、排液','乾燥ユニットを確認：回転数、パージや乾燥用薬液の供給、排液'),T('更换研磨垫','パッドを交換する'),T('延长研磨时间','研磨時間を延ばす')],actOk:0,
  why:T('缺陷沿着从中心向外的螺旋分布，这是液体在旋转中被甩出时留下的轨迹。研磨造成的缺陷不会是这种形状。复查确认是水痕后，对象就是干燥环节。两台研磨机台同时出现，也说明问题在共用的后段。','欠陥が中心から外側へ渦を巻くように分布しています。これは回転中に液体が振り切られるときに残る軌跡で、研磨由来の欠陥はこのような形にはなりません。レビューでウォーターマークと確認できれば、対象は乾燥工程です。両方の研磨号機で同時に出ていることも、共通の後段に問題があることを示します。')}
];
const TYPES={s:[T('划伤','スクラッチ'),'#f08c6a'],p:[T('颗粒','パーティクル'),'#79dbc1'],r:[T('残留','残渣'),'#ffda83'],c:[T('腐蚀','コロージョン'),'#c59cf0'],w:[T('水痕','ウォーターマーク'),'#7fb7f5']};
let store={current:0,best:{}},view={layer:'single',reviewed:false,cause:null,act:null,done:false},toastTimer=null;
try{const raw=JSON.parse(localStorage.getItem(DKEY)||'null');if(raw&&typeof raw.current==='number')store={current:Math.max(0,Math.min(CASES.length-1,raw.current)),best:raw.best||{}}}catch(e){}
function persist(){try{localStorage.setItem(DKEY,JSON.stringify(store))}catch(e){}}
function dialog(title,area,body){$('dlgTitle').textContent=title;$('dlgArea').textContent=area;$('dialogBody').innerHTML=body;if(!$('labDialog').open)$('labDialog').showModal()}
function points(c,layer){const r=rng(c.seed*(layer==='single'?1:layer==='stack'?3:7));return (layer==='single'?c.make:layer==='stack'?c.stack:c.other)(r)}
function mapSVG(pts,typed){return `<svg class="defMap" viewBox="0 0 300 300" role="img" aria-label="${T('晶圆缺陷位置图','ウェーハ欠陥マップ')}"><circle cx="150" cy="150" r="140" fill="#163b4b" stroke="#a9c6ca" stroke-width="2"/><path d="M142 289.5h16l-8 -9z" fill="#0f2730" stroke="#a9c6ca"/>${pts.map(p=>`<circle cx="${(150+p.x*136).toFixed(1)}" cy="${(150-p.y*136).toFixed(1)}" r="2.1" fill="${typed?TYPES[p.t][1]:'#e6efe9'}"/>`).join('')}</svg>`}
function reviewText(c){const pts=points(c,'single'),r=rng(c.seed+99),n=Math.min(20,pts.length),cnt={};for(let i=0;i<n;i++){const p=pts[Math.floor(r()*pts.length)];cnt[p.t]=(cnt[p.t]||0)+1}return T(`抽样复查 ${n} 点：`,`サンプリングレビュー ${n} 点：`)+Object.entries(cnt).sort((a,b)=>b[1]-a[1]).map(([t,k])=>`${TYPES[t][0]} ${k}`).join(' · ')}
function trendSVG(tr){const m=Math.max(...tr),W=300,H=110;return `<svg class="spc" viewBox="0 0 ${W} ${H}" role="img" aria-label="${T('批内各片缺陷数','ロット内の各ウェーハの欠陥数')}">${tr.map((v,i)=>`<rect x="${14+i*35}" y="${H-22-v/m*(H-40)}" width="24" height="${v/m*(H-40)}" fill="#79dbc1"/><text x="${26+i*35}" y="${H-8}" text-anchor="middle" class="axis">${i+1}</text><text x="${26+i*35}" y="${H-26-v/m*(H-40)}" text-anchor="middle" class="axis">${v}</text>`).join('')}</svg><p class="small">${T('横轴：本批内的加工顺序；数字：缺陷数。','横軸：ロット内の処理順。数字：欠陥数。')}</p>`}
function render(){
  const c=CASES[store.current],pts=points(c,view.layer),layers=[['single',T('本片','この1枚')],['stack',T('5 片叠图','5枚スタック')],['other',T('Tool B 同期','同時期の Tool B')]];
  $('caseTabs').innerHTML=CASES.map((_,i)=>`<button data-case="${i}" class="${i===store.current?'selected':''}">${T('题','問')} ${i+1} <span class="stars">${store.best[i]===undefined?'—':store.best[i]}</span></button>`).join('');
  $('mapPanel').innerHTML=`<div class="toolHead"><h2>${T('缺陷位置图','欠陥マップ')}</h2><span class="toolState">${T(`${pts.length} 点`,`${pts.length} 点`)}</span></div><div class="simTabs">${layers.map(([k,n])=>`<button data-layer="${k}" class="${view.layer===k?'selected':''}">${n}</button>`).join('')}</div>${mapSVG(pts,view.reviewed)}<div class="defLegend">${view.reviewed?Object.values(TYPES).map(([n,col])=>`<span><i style="background:${col}"></i>${n}</span>`).join(''):`<span><i style="background:#e6efe9"></i>${T('检查机只给出位置，不知道类型','検査機が出すのは位置だけで、種類は分かりません')}</span>`}</div><h3>${T('批内趋势','ロット内トレンド')}</h3>${trendSVG(c.trend)}`;
  const opt=(kind,list,ok)=>`<div class="answerGrid">${list.map((s,i)=>`<button data-${kind}="${i}" class="${view.done?(i===ok?'right':view[kind]===i?'wrong':''):view[kind]===i?'picked':''}" ${view.done?'disabled':''}>${s}</button>`).join('')}</div>`;
  const score=view.done?(view.cause===c.causeOk?50:0)+(view.act===c.actOk?40:0)+(view.reviewedBefore?10:0):null;
  $('quizPanel').innerHTML=`<div class="toolHead"><h2>${T('题','問')} ${store.current+1} / ${CASES.length}</h2></div><section class="section"><h3>${T('背景','状況')}</h3><p>${c.ctx}</p></section><div class="rowActions"><button data-ui="review" ${view.reviewed?'disabled':''}>${T('抽样复查缺陷类型','欠陥の種類をサンプリングレビュー')}</button></div>${view.reviewed?`<div class="notice">${reviewText(c)}</div>`:`<p class="small">${T('位置图、叠图、另一台机台、批内趋势都可以随便看。先确认缺陷类型再下结论，是好习惯。','マップ、スタック、もう一台の号機、ロット内トレンドは自由に確認できます。結論を出す前に欠陥の種類を確認するのは良い習慣です。')}</p>`}<h3>${T('① 最可能的来源','① 最も可能性の高い発生源')}</h3>${opt('cause',c.cause,c.causeOk)}<h3>${T('② 第一步处置','② 最初の処置')}</h3>${opt('act',c.act,c.actOk)}${view.done?`<div class="notice ${score>=90?'good':''}"><b>${score} / 100</b>（${T('来源 50 · 处置 40 · 先确认类型 10','発生源 50 · 処置 40 · 先に種類を確認 10')}）<p>${c.why}</p>${store.current<CASES.length-1?`<button class="primary" data-case="${store.current+1}">${T('下一题 →','次の問題へ →')}</button>`:`<p>${T('八题全部完成。','8問すべて完了しました。')}</p>`} <button data-ui="retry">${T('重做本题','もう一度')}</button></div>`:`<div class="rowActions"><button class="primary" data-ui="submit" ${view.cause===null||view.act===null?'disabled':''}>${T('提交判断','判断を提出')}</button></div>`}`;
  persist();
}
function help(){dialog(T('缺陷图怎么读','欠陥マップの読み方'),'HOW TO',T('<p>缺陷检查机给出的是一张位置图和一个总数，不会告诉你缺陷是什么、从哪来。工程师靠三样东西判断来源：<b>分布的形状</b>、<b>类型</b>（要抽样复查才知道）、以及<b>对照</b>（别的晶圆、别的机台、批内的先后顺序）。</p><h3>先问四个问题</h3><p>① 形状：弧线？整片均匀？只在边缘？一团？螺旋？<br>② 重复性：把几片叠起来，位置重复吗？研磨时晶圆在转，研磨造成的缺陷不会落在同一位置。<br>③ 范围：只有这台机台，还是共用同一供给或同一清洗单元的机台都有？<br>④ 时间：突然出现还是慢慢增加？批内第 1 片特别差吗？</p><p class="small">这里的八种图样是教科书层面的典型模式。真实的缺陷图更杂乱，常常几种来源叠在一起，而且很多缺陷来自前面的工序。</p>','<p>欠陥検査機が出すのは、位置のマップと総数だけです。欠陥が何で、どこから来たかは教えてくれません。エンジニアは三つの情報から発生源を判断します。<b>分布の形</b>、<b>種類</b>（サンプリングレビューで初めて分かる）、そして<b>比較</b>（他のウェーハ、他の号機、ロット内の処理順）です。</p><h3>まず四つの問いを立てる</h3><p>① 形：円弧か、全面に均一か、エッジだけか、かたまりか、渦巻きか。<br>② 再現性：数枚を重ねたとき、位置が再現するか。研磨中はウェーハが回転するため、研磨由来の欠陥は同じ位置には出ません。<br>③ 範囲：この号機だけか、同じ供給系や同じ洗浄ユニットを使う号機すべてか。<br>④ 時間：突然発生したのか、徐々に増えたのか。ロットの1枚目だけ極端に悪くないか。</p><p class="small">ここで扱う8種類の模様は、教科書レベルの典型的なパターンです。実際の欠陥マップはもっと雑然としており、複数の原因が重なっていることも多く、前工程に起因する欠陥も多数あります。</p>'))}
function resetView(){view={layer:'single',reviewed:false,reviewedBefore:false,cause:null,act:null,done:false}}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;const d=b.dataset;
  if(d.case!==undefined){store.current=Number(d.case);resetView()}
  else if(d.layer)view.layer=d.layer;
  else if(d.cause!==undefined)view.cause=Number(d.cause);
  else if(d.act!==undefined)view.act=Number(d.act);
  else if(d.ui==='review'){view.reviewed=true;view.reviewedBefore=true}
  else if(d.ui==='submit'){const c=CASES[store.current];view.done=true;view.reviewed=true;const sc=(view.cause===c.causeOk?50:0)+(view.act===c.actOk?40:0)+(view.reviewedBefore?10:0);store.best[store.current]=Math.max(store.best[store.current]||0,sc)}
  else if(d.ui==='retry')resetView();
  else return;
  render()});
$('langButton').onclick=()=>{persist();setLang(LANG==='ja'?'zh':'ja')};$('helpButton').onclick=help;$('dlgClose').onclick=()=>$('labDialog').close();
resetView();render();if(!Object.keys(store.best).length)help();
