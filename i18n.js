/* 界面语言：'ja'（默认）或 'zh'，所有页面共用一个设置；切换后刷新页面。
   约定：界面文字就地成对书写 T('中文','日本語')；模板字符串同理 T(`…${x}…`,`…${x}…`)。
   静态 HTML 用 data-ja / data-ja-aria / data-ja-alt 属性。<html data-lang="zh"> 可强制某页只用中文。 */
(function(root){
  const KEY='cmp-fab-lang';let lang='ja';
  try{const v=localStorage.getItem(KEY);if(v==='zh'||v==='ja')lang=v}catch(e){}
  const forced=document.documentElement.dataset.lang;if(forced==='zh'||forced==='ja')lang=forced;
  root.LANG=lang;
  root.T=(zh,ja)=>lang==='ja'&&ja!==undefined?ja:zh;
  root.setLang=l=>{try{localStorage.setItem(KEY,l)}catch(e){}location.reload()};
  document.documentElement.lang=lang==='ja'?'ja':'zh-CN';
  if(lang==='ja'){
    for(const el of document.querySelectorAll('[data-ja]'))el.textContent=el.dataset.ja;
    for(const el of document.querySelectorAll('[data-ja-aria]'))el.setAttribute('aria-label',el.dataset.jaAria);
    for(const el of document.querySelectorAll('[data-ja-alt]'))el.alt=el.dataset.jaAlt;
    if(document.documentElement.dataset.jaTitle)document.title=document.documentElement.dataset.jaTitle;
  }
})(globalThis);
