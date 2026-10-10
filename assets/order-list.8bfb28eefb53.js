(function () {
'use strict';
if (!window.HTMLDialogElement || !HTMLDialogElement.prototype.showModal) return;
const phone = document.querySelector('.contact-phone');
if (!phone) return;
const catalog = new Map();
const choiceMap = {
 '1-0':[['Egg roll',['Beef','Vegetable']]],
 '2-1':[['Protein',['Pork','Chicken','Beef','Shrimp']]],
 '2-4':[['Style',['Chicken','Beef','Shrimp','Pork','Vegetables']]],
 '2-6':[['Protein',['Chicken','Beef','Shrimp','Pork']]],
 '8-2':[['Curry',['Red curry','Green curry']]],
 '8-3':[['Protein',['Chicken','Shrimp','Pork','Beef']]],
 '8-4':[['Protein',['Chicken','Pork','Beef']]],
 '0-1':[['Protein',['Beef','Pork','Chicken']]],
 '0-2':[['Protein',['Chicken','Pork']]],
 '0-4':[['Dish',['Squid & pork','Kimchee & pork']]],
 '0-6':[['Pancake',['Seafood','Kimchee','Vegetable']]],
 '0-7':[['Protein',['Chicken','Pork','Beef','Tofu']]],
 '0-13':[['Filling',['Beef','Vegetables','Pork']]],
 '0-15':[['Size',['Pint','Quart']]], '0-16':[['Size',['Pint','Quart']]],
 '7-4':[['Protein',['Beef','Shrimp']]],
 '7-12':[['Protein',['Chicken','Beef']]],
 '7-13':[['Style',['Chicken','Pork','Beef','Shrimp','Vegetables']]],
 '7-17':[['Rice',['Shrimp fried rice','Pork fried rice']]],
 '9-0':[['Size',['2 oz','16 oz']]], '9-2':[['Size',['Small','Large']]]
};
function el(tag, text, cls) { const n=document.createElement(tag); if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n; }
const intro=el('p','Orders are taken by phone only. Select “Add to list” beside your dishes, then select the phone number at the top to view your list and call to order.','order-intro');document.querySelector('.menu-title-row').after(intro);
const live=el('p','','sr-only');live.setAttribute('role','status');document.body.append(live);
const badge=el('span','','order-count');badge.hidden=true;badge.setAttribute('aria-hidden','true');phone.append(badge);
const review=el('button','My order list','order-review');review.type='button';review.hidden=true;
document.querySelector('.menu-title-row').append(review);
const dialog=el('dialog',undefined,'order-dialog');dialog.setAttribute('aria-labelledby','order-title');
const head=el('div',undefined,'order-head'), title=el('h2','My order list');title.id='order-title';
const close=el('button','Close','order-close');close.type='button';head.append(title,close);
const body=el('div',undefined,'order-body');dialog.append(head,body);document.body.append(dialog);
let returnFocus=null;
function show(){returnFocus=document.activeElement;dialog.showModal();document.documentElement.classList.add('order-open');}
close.onclick=()=>dialog.close();
dialog.addEventListener('close',()=>{document.documentElement.classList.remove('order-open');if(returnFocus?.isConnected)returnFocus.focus();});
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
let queue=[];const key='ko-cha-phone-list-v1';
function count(){return queue.reduce((n,x)=>n+x.qty,0);}
function save(){try{localStorage.setItem(key,JSON.stringify(queue));}catch(e){}update();}
function update(){const n=count();badge.textContent=n;badge.hidden=!n;review.hidden=!n;review.textContent=`My order list (${n})`;phone.setAttribute('aria-label',n?`Review ${n} selected items before calling Ko Cha`:'Call Ko Cha at (843) 766-0301');}
function button(text,fn,label){const b=el('button',text);b.type='button';b.onclick=fn;if(label)b.setAttribute('aria-label',label);return b;}
function unitCents(price, options) {
 const parts=price.split('·').map(part=>{const match=part.trim().match(/^(.*?)\$(\d+)\.(\d{2})$/);return match?{label:match[1].trim().toLowerCase(),cents:Number(match[2])*100+Number(match[3])}:null;});
 if(parts.some(p=>!p))return null;
 if(parts.length===1)return parts[0].cents;
 const selected=new Set(options.map(v=>v.toLowerCase()));
 return parts.find(p=>selected.has(p.label))?.cents ?? null;
}
function money(cents){return '$'+(cents/100).toFixed(2);}
function estimate(items){let total=0;for(const item of items){const cents=unitCents(catalog.get(item.id).price,item.options);if(cents===null)return null;total+=cents*item.qty;}return total;}
function renderList(){
 title.textContent='My order list';body.replaceChildren();
 body.append(el('p','This list does not place an order. You must call Ko Cha to order. Nothing is sent to the restaurant.','order-note'));
 if(!queue.length)body.append(el('p','Your list is empty. Add dishes from the menu.','order-empty'));
 const list=el('ul',undefined,'order-items');
 queue.forEach((item,index)=>{
  const dish=catalog.get(item.id),row=el('li');
  const details=el('div',undefined,'order-item-details');
  details.append(el('strong',dish.label));details.append(el('p',dish.category,'order-category'));
  if(item.options.length)details.append(el('p',item.options.join(' · ')));
  if(item.note)details.append(el('p','Note: '+item.note));
  const cents=unitCents(dish.price,item.options);
  details.append(el('p',cents===null?'Price to be confirmed':money(cents)+' each · '+money(cents*item.qty)+' total','order-line-price'));
  row.append(details);
  const controls=el('div',undefined,'order-controls');
  const qtyLabel=el('span','Qty','order-qty-label');controls.append(qtyLabel);
  controls.setAttribute('role','group');controls.setAttribute('aria-label','Quantity for '+dish.label);
  function change(delta){item.qty=Math.max(1,Math.min(99,item.qty+delta));save();renderList();listFocus(index,delta<0?0:1);}
  const minus=button('−',()=>change(-1),'Decrease quantity for '+dish.label);minus.disabled=item.qty===1;
  const plus=button('+',()=>change(1),'Increase quantity for '+dish.label);plus.disabled=item.qty===99;
  controls.append(minus,el('span',String(item.qty),'order-quantity'),plus,button('Remove',()=>{queue.splice(index,1);save();renderList();const rows=body.querySelectorAll('.order-items li');(rows[Math.min(index,rows.length-1)]?.querySelector('button')||close).focus();},'Remove '+dish.label));row.append(controls);list.append(row);
 });body.append(list);
 const total=estimate(queue),summary=el('div',undefined,'order-estimate');summary.setAttribute('role','status');summary.setAttribute('aria-live','polite');summary.append(el('span','Estimated total'),el('strong',total===null?'Confirm by phone':money(total)));body.append(summary);
 body.append(el('p','Before tax. Extras and special requests may cost more. Confirm the final total when you call.','order-estimate-note'));
 const actions=el('div',undefined,'order-actions');const call=el('a','Call to order · (843) 766-0301','order-call');call.href=phone.getAttribute('href');actions.append(call,button('Keep browsing',()=>dialog.close()));body.append(actions);
 body.append(el('p','Your list stays here when you start the call. Confirm availability, prices, and special requests with the restaurant.','order-note'));
}
function listFocus(index,which){const controls=body.querySelectorAll('.order-controls')[index];const buttons=controls?.querySelectorAll('button');if(buttons)(buttons[which].disabled?buttons[1-which]:buttons[which]).focus();}
function openList(){renderList();show();}
review.onclick=openList;
phone.addEventListener('click',e=>{if(queue.length){e.preventDefault();openList();}});
function configure(dish){
 title.textContent=dish.label;body.replaceChildren();
 const form=el('form');form.append(el('p',dish.category,'order-category'));form.append(el('p',dish.price,'order-option-price'));
 if(dish.description)form.append(el('p',dish.description,'order-note'));
 const selects=[];
 dish.choices.forEach(([label,values],i)=>{const field=el('label',label+' (required)','order-field'),select=el('select');select.required=true;select.name='choice-'+i;const placeholder=el('option','Choose '+label.toLowerCase());placeholder.value='';placeholder.disabled=true;placeholder.selected=true;select.append(placeholder);values.forEach(v=>{const o=el('option',v);o.value=v;select.append(o);});field.append(select);form.append(field);selects.push(select);});
 const qlabel=el('label','Quantity','order-field'),quantity=el('input');quantity.type='number';quantity.min='1';quantity.max='99';quantity.step='1';quantity.value='1';quantity.required=true;qlabel.append(quantity);form.append(qlabel);
 const nlabel=el('label','Notes for your call (optional)','order-field'),note=el('textarea');note.maxLength=250;note.rows=2;note.placeholder='For example: mild, sauce on the side';nlabel.append(note);form.append(nlabel);
 const submit=el('button','Add to my list','order-call');submit.type='submit';form.append(submit);
 form.onsubmit=e=>{e.preventDefault();if(!form.reportValidity())return;const item={id:dish.id,qty:Number(quantity.value),options:selects.map(s=>s.value),note:note.value.trim()};const existing=queue.find(x=>x.id===item.id&&JSON.stringify(x.options)===JSON.stringify(item.options)&&x.note===item.note);if(existing)existing.qty=Math.min(99,existing.qty+item.qty);else queue.push(item);save();dialog.close();live.textContent=dish.label+' added. '+count()+' items in your order list.';};
 body.append(form);show();
}
document.querySelectorAll('.kc-dish').forEach(node=>{
 const heading=node.querySelector('h4'),code=heading.querySelector('.dish-code')?.textContent.trim();
 const name=heading.cloneNode(true);name.querySelector('.dish-code')?.remove();
 const label=(code?'Item #'+code+' · ':'')+name.textContent.trim(),category=node.closest('.kc-menu-group').querySelector('h3').textContent,price=node.querySelector('.kc-price').textContent;
 const id=node.id,choices=(choiceMap[id.replace('kc-dish-','')]||[]).map(x=>[x[0],[...x[1]]]);
 if(price.includes('Lunch $')&&price.includes('Dinner $'))choices.unshift(['Meal',['Lunch','Dinner']]);
 const dish={id,label,category,price,description:node.querySelector(':scope > p')?.textContent||'',choices};
 if(id.startsWith('kc-dish-7-')){const n=Number(id.split('-').pop());dish.category=n<7?'Lunch special':n<15?'Dinner combination':'All-day special';}
 catalog.set(id,dish);
 const add=button('Add to list',()=>configure(dish),'Add '+label+' to your order list');add.className='order-add';node.append(add);
});
try{const stored=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(stored))queue=stored.filter(x=>{const d=catalog.get(x?.id);return d&&Number.isInteger(x.qty)&&x.qty>0&&x.qty<=99&&typeof x.note==='string'&&x.note.length<=250&&Array.isArray(x.options)&&x.options.length===d.choices.length&&x.options.every((v,i)=>d.choices[i][1].includes(v));}).slice(0,300);}catch(e){}
update();
})();
