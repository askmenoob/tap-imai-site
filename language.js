import {translateUI} from './language-catalog.mjs?v=share-brand-20261027-1';

const key='smarttap.language';
let language='ms';
try{if(localStorage.getItem(key)==='en')language='en';}catch{}
const originals=new WeakMap();
const protectedContent='script,style,textarea,input,code,pre,[data-no-i18n],.language-picker,.business-identity,.business-tagline,.business-promo h2,.business-promo p,.business-details p,.record h3,#edit-title,#identity,.choice,.selection-summary,#payment-payee';
const picker=document.createElement('div');picker.className='language-picker';
const label=document.createElement('label');label.htmlFor='smarttap-language';label.textContent='Bahasa / Language';
const select=document.createElement('select');select.id='smarttap-language';select.name='language';
for(const [value,text] of [['ms','Bahasa Melayu'],['en','English']]){const option=document.createElement('option');option.value=value;option.textContent=text;select.append(option);}
select.value=language;picker.append(label,select);

function translated(node,slot,current,set){
  const slots=originals.get(node)||{};let record=slots[slot];
  if(!record||current!==record.rendered)record={source:current};
  const next=translateUI(record.source,language);record.rendered=next;slots[slot]=record;originals.set(node,slots);
  if(next!==current)set(next);
}
function render(){
  document.documentElement.lang=language;
  // Prefer the application's navigation; the public card has its own compact bar.
  const host=document.querySelector('.business-page')||document.querySelector('body > header .app-tools')||document.querySelector('body > header')||document.body;
  if(picker.parentNode!==host)host.prepend(picker);
  const walk=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  while(walk.nextNode()){
    const node=walk.currentNode;
    if(!node.parentElement?.closest(protectedContent))translated(node,'text',node.nodeValue,value=>node.nodeValue=value);
  }
  for(const node of document.querySelectorAll('[placeholder],[aria-label],[title],[alt]')){
    if(node.closest('.language-picker,[data-no-i18n],.business-identity'))continue;
    for(const attr of ['placeholder','aria-label','title','alt'])if(node.hasAttribute(attr))translated(node,attr,node.getAttribute(attr),value=>node.setAttribute(attr,value));
  }
  translated(document,'title',document.title,value=>document.title=value);
}
select.addEventListener('change',()=>{
  language=select.value==='en'?'en':'ms';try{localStorage.setItem(key,language);}catch{}
  render();window.dispatchEvent(new CustomEvent('smarttap:language',{detail:{language}}));
});
let pending=false;
new MutationObserver(()=>{if(pending)return;pending=true;queueMicrotask(()=>{pending=false;render();});}).observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['placeholder','aria-label','title','alt']});
render();
