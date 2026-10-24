const menus=[['package','Status pakej','◈'],['business','Sunting perniagaan','✎'],['page','Sunting paparan','▧'],['my','Halaman saya','↗']];
export function createCustomerArea({coverNodes,onSelect}){
 const $=id=>document.getElementById(id),dashboard=$('dashboard'),editor=$('editor'),form=$('edit-form');
 document.body.classList.add('customer-workspace');
 const list=dashboard.firstElementChild;list.classList.add('customer-legacy-list');
 const bar=document.createElement('div');bar.className='customer-toolbar';
 bar.innerHTML='<div><p class="eyebrow">RUANG PELANGGAN</p><h1 id="customer-title" tabindex="-1">Status pakej</h1><p id="customer-business-name" data-no-i18n></p></div><button type="button" id="customer-menu-toggle" class="secondary" aria-label="Buka menu pelanggan" aria-expanded="false" aria-controls="customer-menu">☰ <span>Menu</span></button>';
 const nav=document.createElement('nav');nav.id='customer-menu';nav.className='customer-menu';nav.setAttribute('aria-label','Menu pelanggan');
 for(const [id,label,icon] of menus){const b=document.createElement('button');b.type='button';b.dataset.view=id;b.innerHTML='<span aria-hidden="true">'+icon+'</span><span>'+label+'</span>';b.onclick=()=>open(id,true);nav.append(b);}
 const account=document.createElement('button');account.type='button';account.textContent='Log keluar';account.className='customer-logout';account.onclick=()=>$('logout').click();nav.append(account);
 const stage=document.createElement('div');stage.className='customer-stage';stage.id='customer-stage';
 const packageView=document.createElement('section');packageView.id='customer-package';
 const myView=document.createElement('section');myView.id='customer-my';
 const picker=document.createElement('select');picker.id='customer-page-picker';picker.setAttribute('aria-label','Pilih halaman perniagaan');
 picker.onchange=()=>onSelect(picker.value);myView.append(picker,$('refresh'),$('more'),$('list-status'),$('public-sharing'));
 const empty=document.createElement('p');empty.className='notice';empty.id='customer-empty';empty.textContent='Pilih halaman perniagaan untuk mengurus maklumat anda.';
 const backdrop=document.createElement('button');backdrop.type='button';backdrop.className='customer-menu-backdrop';backdrop.tabIndex=-1;backdrop.setAttribute('aria-label','Tutup menu pelanggan');const closeMenu=document.createElement('button');closeMenu.type='button';closeMenu.className='customer-menu-close';closeMenu.textContent='Tutup menu ×';nav.prepend(closeMenu);
 dashboard.prepend(bar,backdrop,nav,stage);stage.append(empty,packageView,editor,myView);
 const management=document.querySelector('.management-panel');packageView.append(management);
 const subnav=document.createElement('nav');subnav.className='customer-subnav';subnav.setAttribute('aria-label','Bahagian status pakej');packageView.prepend(subnav);
 const groups={};
 for(const [id,label] of [['overview','Ringkasan'],['buy','Renew / beli'],['gateway','Status bayaran'],['delivery','Penghantaran'],['messages','Mesej']]){
  const section=document.createElement('div');section.className='customer-package-section';section.id='customer-section-'+id;management.append(section);groups[id]=section;
  const button=document.createElement('button');button.type='button';button.textContent=label;button.dataset.section=id;button.onclick=()=>{sectionName=id;if(id==='buy'&&$('payment-form').hidden&&!$('payment-toggle').disabled)$('payment-toggle').click();render();};subnav.append(button);
 }
 const emptySections={};for(const [name,text] of [['messages','Tiada mesej baharu daripada super admin.'],['delivery','Maklumat penghantaran tersedia selepas bayaran pesanan fizikal disahkan.'],['gateway','Belum ada bil pembayaran. Pilih Renew / beli untuk menyediakan pesanan.']]){const p=document.createElement('p');p.className='notice';p.textContent=text;groups[name].append(p);emptySections[name]=p;}
 const messageAlert=document.createElement('button');messageAlert.type='button';messageAlert.className='customer-message-alert';messageAlert.textContent='Mesej daripada super admin';messageAlert.onclick=()=>{sectionName='messages';render();};groups.overview.append(messageAlert);
 const move=(id,group)=>{if($(id))groups[group].append($(id));};
 // Keep every managed control below the same management root: existing payment handlers own their state.
 const statusHeading=$('page-state').previousElementSibling;groups.overview.append(statusHeading);
 for(const id of ['page-state','subscription-summary','google-listing-status','direct-review-wrap','payment-summary','renewal-reminder','payment-disclosure'])move(id,'overview');
 move('admin-message-box','messages');move('order-support','delivery');move('gateway-panel','gateway');move('payment-form','buy');
 const packageLink=[...management.querySelectorAll('a')].find(a=>a.getAttribute('href')==='/subscribe/');if(packageLink)groups.overview.append(packageLink);
 $('payment-toggle').addEventListener('click',()=>{sectionName=$('payment-form').hidden?'overview':'buy';render();});
 const paymentForm=$('payment-form'),paymentChildren=[...paymentForm.children];
 const cart=document.createElement('div'),checkout=document.createElement('div');cart.className=checkout.className='customer-payment-step';
 let confirm=false;for(const node of paymentChildren){if(node.id==='payment-quote')confirm=true;(confirm?checkout:cart).append(node);}paymentForm.prepend(cart,checkout);
 const paymentTabs=document.createElement('nav');paymentTabs.className='customer-subnav customer-payment-tabs';paymentTabs.setAttribute('aria-label','Bahagian pembelian');
 let paymentTab=0;const showCart=()=>{cart.hidden=paymentTab!==0;checkout.hidden=paymentTab!==1;for(const [i,button] of [...paymentTabs.children].entries())button.setAttribute('aria-current',i===paymentTab?'page':'false');};
 for(const [i,label] of ['Pesanan','Jumlah & bayaran'].entries()){const button=document.createElement('button');button.type='button';button.textContent=label;button.onclick=()=>{paymentTab=i;showCart();};paymentTabs.append(button);}paymentForm.prepend(paymentTabs);showCart();
 const fieldGroups={business:[['name','tagline'],['logo'],['phone','whatsapp'],['website','instagram','facebook','tiktok','threads'],['google']],page:[['theme','accent'],['cover'],['menu','directions'],['address','hours'],['promoTitle','promoText'],['promoURL'],['promoStart','promoEnd']]};
 const pages={business:[],page:[]};
 for(const [view,steps] of Object.entries(fieldGroups))for(const keys of steps){
  const group=document.createElement('div');group.className='customer-field-step';group.dataset.fieldView=view;if(keys.includes('instagram'))group.classList.add('customer-social-fields');
  for(const key of keys){const input=$('field-'+key),label=document.querySelector('label[for="field-'+key+'"]');const unit=document.createElement('div');unit.className='customer-field';unit.append(label,input);if(key==='cover')unit.append(...coverNodes);if(key==='google'&&$('google-pending-note'))unit.append($('google-pending-note'));group.append(unit);}
  $('fields').append(group);pages[view].push(group);
 }
 const fieldTabs=document.createElement('nav');fieldTabs.className='customer-subnav customer-field-tabs';fieldTabs.setAttribute('aria-label','Bahagian suntingan');form.prepend(fieldTabs);
 const tabLabels={business:['Maklumat','Logo','Hubungi','Social Media','Google Review'],page:['Tema & warna','Cover','Menu & lokasi','Alamat & waktu','Promosi','Pautan promosi','Tarikh promosi']};
 let view='package',sectionName='overview',activeTab={business:0,page:0},selected=null;
 for(const [name,labels] of Object.entries(tabLabels))for(const [i,label] of labels.entries()){const button=document.createElement('button');button.type='button';button.textContent=label;button.dataset.fieldView=name;button.dataset.index=String(i);button.onclick=()=>{activeTab[name]=i;render();};fieldTabs.append(button);}
 const toggle=$('customer-menu-toggle');
 function dismissMenu(restore=false){toggle.setAttribute('aria-expanded','false');nav.classList.remove('is-open');backdrop.classList.remove('is-open');nav.removeAttribute('role');nav.removeAttribute('aria-modal');stage.inert=false;bar.inert=false;document.querySelector('.app-header').inert=false;if(restore)toggle.focus();}
 toggle.onclick=()=>{if(toggle.getAttribute('aria-expanded')==='true'){dismissMenu(true);return;}toggle.setAttribute('aria-expanded','true');nav.classList.add('is-open');backdrop.classList.add('is-open');if(matchMedia('(max-width:700px)').matches){nav.setAttribute('role','dialog');nav.setAttribute('aria-modal','true');stage.inert=true;bar.inert=true;document.querySelector('.app-header').inert=true;closeMenu.focus();}};
 matchMedia('(max-width:700px)').addEventListener('change',()=>dismissMenu());
 closeMenu.onclick=()=>dismissMenu(true);backdrop.onclick=()=>dismissMenu(true);
 document.addEventListener('keydown',event=>{if(toggle.getAttribute('aria-expanded')!=='true')return;if(event.key==='Escape'){dismissMenu(true);return;}if(event.key==='Tab'&&matchMedia('(max-width:700px)').matches){const buttons=[...nav.querySelectorAll('button:not(:disabled)')];const first=buttons[0],last=buttons.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}});
 function open(next,focus=false){view=next;dismissMenu();render();if(focus)$('customer-title').focus({preventScroll:true});}
 function render(){
  const active=!!selected;empty.hidden=active;packageView.hidden=!active||view!=='package';myView.hidden=view!=='my';editor.hidden=!active||!['business','page'].includes(view);
  for(const b of nav.querySelectorAll('[data-view]')){b.setAttribute('aria-current',b.dataset.view===view?'page':'false');b.disabled=!active&&b.dataset.view!=='my';}
  const title=menus.find(m=>m[0]===view)[1];if($('customer-title').textContent!==title)$('customer-title').textContent=title;
  for(const [name,sections] of Object.entries(pages))sections.forEach((node,i)=>{node.hidden=view!==name||i!==activeTab[name];});
  for(const button of fieldTabs.children){button.hidden=button.dataset.fieldView!==view;button.setAttribute('aria-current',Number(button.dataset.index)===activeTab[button.dataset.fieldView]?'page':'false');}
  for(const [name,node] of Object.entries(groups)){const hide=name!==sectionName;if(node.hidden!==hide)node.hidden=hide;}
  for(const b of subnav.children)b.setAttribute('aria-current',b.dataset.section===sectionName?'page':'false');
  for(const [name,id] of Object.entries({messages:'admin-message-box',delivery:'order-support',gateway:'gateway-panel'}))emptySections[name].hidden=!$(id).hidden;
  const unread=!!selected?.adminMessage&&selected.adminMessage.status!=='resolved';messageAlert.hidden=!unread;subnav.querySelector('[data-section="messages"]').dataset.unread=String(unread);
 }
 // Native validation must first reveal the relevant section; hidden fields stay editable and are still saved together.
 form.noValidate=true;form.addEventListener('submit',event=>{const invalid=[...form.querySelectorAll('input,select,textarea')].find(input=>!input.disabled&&!input.checkValidity());if(invalid){event.preventDefault();event.stopImmediatePropagation();for(const [name,sections] of Object.entries(pages)){const at=sections.findIndex(group=>group.contains(invalid));if(at>=0){view=name;activeTab[name]=at;break;}}render();invalid.focus();invalid.reportValidity();}},true);
 $('cancel').addEventListener('click',()=>open('my'));
 return {update(item){if(!selected)view='package';selected=item;$('customer-business-name').textContent=item.profile.name;picker.value=item.id;document.body.classList.add('customer-session');render();},list(items){const current=picker.value;picker.replaceChildren();for(const item of items){const option=document.createElement('option');option.value=item.id;option.textContent=item.profile.name;picker.append(option);}picker.value=selected?.id||current;document.body.classList.add('customer-session');if(!selected)view='my';render();},clear(){selected=null;document.body.classList.remove('customer-session');dismissMenu();view='package';sectionName='overview';activeTab={business:0,page:0};paymentTab=0;showCart();render();},open};
}
