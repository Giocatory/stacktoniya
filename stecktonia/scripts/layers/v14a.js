
// ================= v14: план помещения (подложка под схемой) =================
document.head.insertAdjacentHTML('beforeend','<style>#plp{position:absolute;left:8px;right:8px;top:8px;z-index:6;background:var(--pn);color:var(--tx);border:1px solid var(--bd);border-radius:10px;padding:5px 6px;font-size:12px;box-shadow:0 4px 18px #0003;display:flex;flex-wrap:wrap;gap:4px;align-items:center}#plp[hidden]{display:none}#plp button,#plp summary{background:transparent;color:var(--tx);border:1px solid var(--bd);border-radius:6px;padding:3px 7px;cursor:pointer;font:inherit;list-style:none}#plp summary::-webkit-details-marker{display:none}#plp button.on,#plp details[open]>summary{background:var(--ac);color:#fff;border-color:var(--ac)}#plp .sep{width:1px;height:20px;background:var(--bd);margin:0 3px}#plp details{position:relative}#plp .pop{position:absolute;top:calc(100% + 4px);left:0;z-index:7;width:250px;background:var(--pn);border:1px solid var(--bd);border-radius:8px;padding:8px;box-shadow:0 6px 20px #0004}#plp .pop label{display:block;margin:3px 0}#plp input[type=text],#plp input:not([type]),#plp select{width:100%;background:var(--bg);color:var(--tx);border:1px solid var(--bd);border-radius:5px;padding:3px 5px;font:inherit}#plp input[type=checkbox]{width:auto}#plp .h{color:var(--mt);margin-top:6px;white-space:normal}#plp .sel{flex-basis:100%;display:flex;gap:6px;align-items:center;border-top:1px solid var(--bd);padding-top:4px}#plp .sel input{width:130px}#plp .sel input.n{width:60px}</style>');
const PL={a:null,c:null,sel:null,drag:null};
const plan=()=>S.plan||(S.plan={m:20,snap:1,ortho:1,dim:1,auto:0,show:1,el:[]});
const pxm=()=>plan().m||20;
const plSn=v=>{const p=plan();if(!p.snap)return Math.round(v);const g=p.m/2;return Math.round(v/g)*g};
const PKN={wall:'Стена',part:'Перегородка',door:'Дверь',win:'Окно',tray:'Кабель-канал',room:'Помещение',desk:'Стол',rack:'Стойка',outlet:'Розетка RJ-45',label:'Подпись'};
const PLINE=['wall','part','door','win','tray'];
const plAsk=(q,def)=>{let v;try{v=window.prompt(q,def)}catch(_){v=def}return(v==null||v==='undefined'||v===undefined)?def:String(v).trim()||def};
const plAdd=o=>{const p=plan();o.id='p'+(++S.c);p.el.push(o);return o};
const plIn=(d,r)=>d.x>=r.x&&d.x<=r.x+r.w&&d.y>=r.y&&d.y<=r.y+r.h;
const roomOf=d=>(S.plan?S.plan.el:[]).filter(e=>e.k==='room'&&plIn(d,e)).sort((a,b)=>a.w*a.h-b.w*b.h)[0]||null;
function cableLen(l){const A=dv(l.a),B=dv(l.b);if(!A||!B)return null;if(l.pts&&l.pts.length)return Math.max(1,Math.ceil(routeLen(l)/pxm()+2));return Math.max(1,Math.ceil(Math.hypot(A.x-B.x,A.y-B.y)/pxm()*1.25+2))}
function autoCables(){let c=false;S.links.forEach(l=>{const n=cableLen(l);if(n!=null&&l.len!==n){l.len=n;c=true}});if(c)cableScan();return c}
function planBBox(){const E=(S.plan&&S.plan.el)||[];if(!E.length)return null;let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;const u=(x,y)=>{x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y)};E.forEach(e=>{if('x1' in e){u(e.x1,e.y1);u(e.x2,e.y2)}else if('w' in e){u(e.x,e.y);u(e.x+e.w,e.y+e.h)}else if(e.k==='label'){u(e.x,e.y-14);u(e.x+Math.max(30,(e.t||'').length*8),e.y+6)}else{u(e.x-6,e.y-6);u(e.x+6,e.y+6)}});return{x:x0,y:y0,w:Math.max(1,x1-x0),h:Math.max(1,y1-y0)}}
function planEdit(){if(plp.hidden)return'';const b=planBBox();if(!b)return'';return`<rect x="${b.x-6}" y="${b.y-6}" width="${b.w+12}" height="${b.h+12}" fill="none" stroke="var(--ac)" stroke-width="1" stroke-dasharray="5 4" opacity=".7"/><rect data-phandle="1" x="${b.x+b.w+1}" y="${b.y+b.h+1}" width="11" height="11" rx="2" fill="var(--ac)" pointer-events="all" style="cursor:nwse-resize"/><text x="${b.x+b.w+16}" y="${b.y+b.h+10}" font-size="9" fill="var(--ac)">масштаб плана: тяните за угол</text>`}
function planSvg(){const p=S.plan;if(!p||!(p.el||[]).length&&!PL.a)return'';let h='<g id="planlayer" pointer-events="none">';const m=p.m,ed=tool==='plan:move'||tool==='plan:del';
 const hit=(e,sh)=>ed?sh:'';
 const dim=(x1,y1,x2,y2)=>p.dim?`<text x="${(x1+x2)/2}" y="${(y1+y2)/2-7}" font-size="10" text-anchor="middle" fill="var(--mt)">${(Math.hypot(x2-x1,y2-y1)/m).toFixed(1).replace('.',',')} м</text>`:'';
 const selC=e=>PL.sel===e.id&&!plp.hidden?'var(--ac)':null;
 const one=e=>{const s=selC(e);let o='';
  if(e.k==='room'){o+=`<rect x="${e.x}" y="${e.y}" width="${e.w}" height="${e.h}" fill="${s||'var(--ac)'}" fill-opacity=".05" stroke="${s||'var(--mt)'}" stroke-width="${s?2:1}" stroke-dasharray="${s?'':'2 4'}"/><text x="${e.x+8}" y="${e.y+16}" font-size="12" font-weight="600" fill="var(--mt)">${esc(e.t||'Помещение')} · ${(e.w*e.h/m/m).toFixed(1).replace('.',',')} м²</text>`+(p.dim?`<text x="${e.x+e.w/2}" y="${e.y+e.h-5}" font-size="10" text-anchor="middle" fill="var(--mt)">${(e.w/m).toFixed(1).replace('.',',')} м</text><text x="${e.x+e.w-5}" y="${e.y+e.h/2}" font-size="10" text-anchor="end" fill="var(--mt)">${(e.h/m).toFixed(1).replace('.',',')} м</text>`:'')+hit(e,`<rect data-pid="${e.id}" x="${e.x}" y="${e.y}" width="${e.w}" height="${e.h}" fill="transparent" pointer-events="all" style="cursor:move"/>`)}
  else if(PLINE.includes(e.k)){const {x1,y1,x2,y2}=e,L=Math.hypot(x2-x1,y2-y1)||1,st=s||'var(--tx)';
   if(e.k==='wall')o+=`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${s||'var(--tx)'}" stroke-width="7" stroke-linecap="square" opacity=".75"/>`+dim(x1,y1,x2,y2);
   else if(e.k==='part')o+=`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${s||'var(--mt)'}" stroke-width="3.5" stroke-linecap="square"/>`+dim(x1,y1,x2,y2);
   else if(e.k==='tray')o+=`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${s||'#e08a00'}" stroke-width="3" stroke-dasharray="9 4"/><text x="${(x1+x2)/2}" y="${(y1+y2)/2-5}" font-size="9" text-anchor="middle" fill="#e08a00">кабель-канал ${(L/m).toFixed(1).replace('.',',')} м</text>`;
   else if(e.k==='win')o+=`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--cv)" stroke-width="9"/><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${s||'var(--ac)'}" stroke-width="5" opacity=".55"/><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--cv)" stroke-width="1.5"/>`;
   else{const px=(y2-y1)/L*L,py=-(x2-x1)/L*L;o+=`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--cv)" stroke-width="10"/><line x1="${x1}" y1="${y1}" x2="${x1+px}" y2="${y1+py}" stroke="${s||'#9a6a2f'}" stroke-width="2.5"/><path d="M${x2} ${y2}A${L} ${L} 0 0 0 ${x1+px} ${y1+py}" fill="none" stroke="${s||'#9a6a2f'}" stroke-width="1" stroke-dasharray="3 3"/>`}
   o+=hit(e,`<line data-pid="${e.id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="transparent" stroke-width="16" pointer-events="stroke" style="cursor:move"/>`)}
  else if(e.k==='desk'||e.k==='rack'){const c=e.k==='rack'?'#51606e':'#b99a6b';o+=`<rect x="${e.x}" y="${e.y}" width="${e.w}" height="${e.h}" rx="2" fill="${c}" fill-opacity=".35" stroke="${s||c}" stroke-width="${s?2:1}"/><text x="${e.x+e.w/2}" y="${e.y+e.h/2+3}" font-size="8" text-anchor="middle" fill="var(--tx)">${e.k==='rack'?'стойка':'стол'}</text>`+hit(e,`<rect data-pid="${e.id}" x="${e.x}" y="${e.y}" width="${e.w}" height="${e.h}" fill="transparent" pointer-events="all" style="cursor:move"/>`)}
  else if(e.k==='outlet')o+=`<circle cx="${e.x}" cy="${e.y}" r="6" fill="var(--cv)" stroke="${s||'#16a05a'}" stroke-width="2"/><text x="${e.x}" y="${e.y+3}" font-size="7" text-anchor="middle" fill="#16a05a" font-weight="700">RJ</text>`+hit(e,`<circle data-pid="${e.id}" cx="${e.x}" cy="${e.y}" r="12" fill="transparent" pointer-events="all" style="cursor:move"/>`);
  else if(e.k==='label')o+=`<text x="${e.x}" y="${e.y}" font-size="13" font-weight="600" fill="${s||'var(--tx)'}" opacity=".8">${esc(e.t||'')}</text>`+hit(e,`<rect data-pid="${e.id}" x="${e.x-3}" y="${e.y-14}" width="${Math.max(30,(e.t||'').length*8)}" height="20" fill="transparent" pointer-events="all" style="cursor:move"/>`);
  return o};
 ['room'].forEach(k=>p.el.filter(e=>e.k===k).forEach(e=>h+=one(e)));
 p.el.filter(e=>e.k!=='room'&&!['desk','rack','outlet','label','tray'].includes(e.k)).forEach(e=>h+=one(e));
 p.el.filter(e=>['desk','rack','outlet','tray','label'].includes(e.k)).forEach(e=>h+=one(e));
 if(PL.a&&PL.c){const{a,c}=PL,k=tool.slice(5);if(k==='room')h+=`<rect x="${Math.min(a.x,c.x)}" y="${Math.min(a.y,c.y)}" width="${Math.abs(c.x-a.x)}" height="${Math.abs(c.y-a.y)}" fill="var(--ac)" fill-opacity=".1" stroke="var(--ac)" stroke-dasharray="4 3"/><text x="${c.x+6}" y="${c.y+14}" font-size="11" fill="var(--ac)">${(Math.abs(c.x-a.x)/m).toFixed(1)} × ${(Math.abs(c.y-a.y)/m).toFixed(1)} м</text>`;
  else h+=`<line x1="${a.x}" y1="${a.y}" x2="${c.x}" y2="${c.y}" stroke="var(--ac)" stroke-width="${k==='wall'?7:4}" opacity=".6"/><text x="${(a.x+c.x)/2}" y="${(a.y+c.y)/2-8}" font-size="11" font-weight="600" text-anchor="middle" fill="var(--ac)">${(Math.hypot(c.x-a.x,c.y-a.y)/m).toFixed(1).replace('.',',')} м</text>`}
 h+=planEdit();
 const wkE=document.getElementById('wk'),H=wkE?wkE.scrollTop+wkE.clientHeight:(cv.clientHeight||400),X0=(wkE?wkE.scrollLeft:0)+14;h+=`<g><line x1="${X0}" y1="${H-14}" x2="${X0+5*m}" y2="${H-14}" stroke="var(--tx)" stroke-width="2"/><path d="M${X0} ${H-19}v10M${X0+5*m} ${H-19}v10" stroke="var(--tx)"/><text x="${X0+2.5*m}" y="${H-20}" font-size="10" text-anchor="middle" fill="var(--tx)">5 м (масштаб: 1 м = ${+m.toFixed(1)} пикс.)</text></g>`;
 return h+'</g>'}
const _draw14=draw;
draw=function(){const P=S.plan;if(P&&P.auto)autoCables();_draw14();
 cv.style.cursor=tool.startsWith('plan:')?(tool==='plan:move'?'move':'crosshair'):'';
 if(P&&P.show!==0||tool.startsWith('plan:')){const s=planSvg();if(s)cv.insertAdjacentHTML('afterbegin',s)}
 if(P&&P.el)cv.querySelectorAll('g[data-id]').forEach(g=>{});};
// ---- панель инструментов ----
const mainEl=cv.parentNode;mainEl.style.position='relative';
mainEl.insertAdjacentHTML('beforeend','<div id="plp" hidden></div>');
const plp=$('#plp');
function planInfo(){const p=plan();const rooms=p.el.filter(e=>e.k==='room');const area=rooms.reduce((s,r)=>s+r.w*r.h,0)/p.m/p.m;
 return`Помещений: ${rooms.length}, общая площадь ${area.toFixed(1).replace('.',',')} м²; стен ${p.el.filter(e=>e.k==='wall'||e.k==='part').length}, дверей ${p.el.filter(e=>e.k==='door').length}, окон ${p.el.filter(e=>e.k==='win').length}, розеток RJ-45 ${p.el.filter(e=>e.k==='outlet').length}.`}
function plRender(){const p=plan(),t=tool.startsWith('plan:')?tool.slice(5):'';
 const op=[...plp.querySelectorAll('details[open]')].map(x=>x.dataset.n);
 const tb=(k,l)=>`<button data-pl="t:${k}" class="${t===k?'on':''}" title="${PKN[k]||l}">${l}</button>`;
 const ck=(k,l)=>`<label><input type="checkbox" data-plc="${k}" ${p[k]?'checked':''}> ${l}</label>`;
 const se=p.el.find(e=>e.id===PL.sel);
 plp.innerHTML=`<b>План:</b>${tb('wall','Стена')}${tb('part','Перегородка')}${tb('door','Дверь')}${tb('win','Окно')}${tb('room','Помещение')}${tb('tray','Кабель-канал')}<span class="sep"></span>${tb('desk','Стол')}${tb('rack','Стойка')}${tb('outlet','Розетка RJ-45')}${tb('label','Подпись')}<span class="sep"></span>${tb('move','Двигать')}${tb('del','Ластик')}<span class="sep"></span>
<details data-n="o"><summary>Параметры ▾</summary><div class="pop">${ck('snap','Привязка к сетке 0,5 м')}${ck('ortho','Стены строго по осям')}${ck('dim','Показывать размеры')}${ck('show','Показывать план')}${ck('auto','Длины кабелей — по плану (авто)')}
<label>Масштаб<select data-pls>${[...new Set([10,15,20,25,30,40,+p.m.toFixed(1)])].sort((x,y)=>x-y).map(v=>`<option value="${v}" ${v===+p.m.toFixed(1)?'selected':''}>1 м = ${v} пикс.</option>`).join('')}</select></label><button data-pl="cables" style="width:100%;margin-top:4px">Пересчитать кабели по плану</button><button data-pl="clear" style="width:100%;margin-top:4px">Очистить план</button><div class="h">${planInfo()}</div></div></details>
<details data-n="t"><summary>Типовые планы ▾</summary><div class="pop"><button data-pl="tpl:class" style="width:100%">Кабинет информатики 12×7 м</button><button data-pl="tpl:office" style="width:100%;margin-top:4px">Офис: open-space, серверная, переговорная</button><button data-pl="tpl:floor" style="width:100%;margin-top:4px">Этаж: 5 кабинетов, серверная, коридор</button></div></details>
<button data-pl="off">Готово</button>
${se?`<div class="sel"><b>${PKN[se.k]}:</b>${(se.k==='room'||se.k==='label')?`<input type="text" data-plt value="${esc(se.t||'')}" placeholder="название">`:''}${se.k==='room'?`ширина, м <input class="n" data-plw value="${(se.w/p.m).toFixed(1)}"> длина, м <input class="n" data-plh value="${(se.h/p.m).toFixed(1)}">`:''}<button data-pl="delsel">Удалить</button></div>`:''}`;
 plp.querySelectorAll('details').forEach(x=>{if(op.includes(x.dataset.n))x.open=true})}
function plTool(k){tool='plan:'+k;linkFrom=null;PL.a=null;document.querySelectorAll('header [data-t]').forEach(x=>x.classList.remove('on'));if($('#ad'))$('#ad').value='';if($('#adn'))$('#adn').value='';plRender();draw()}
function plOff(){tool='sel';PL.a=null;document.querySelectorAll('header [data-t]').forEach(x=>x.classList.toggle('on',x.dataset.t==='sel'));plRender();draw()}
$('#baddr').insertAdjacentHTML('afterend','<button id="bpl" title="Нарисовать план помещения и строить сеть поверх него">План</button>');
$('#bpl').onclick=()=>{plp.hidden=!plp.hidden;if(plp.hidden&&tool.startsWith('plan:'))plOff();else plRender()};
// ---- мышь (перехват до обычных обработчиков схемы) ----
const plPos=e=>{const r=cv.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}};
mainEl.addEventListener('pointerdown',e=>{if(!tool.startsWith('plan:')||!cv.contains(e.target)&&e.target!==cv)return;e.stopPropagation();e.preventDefault();
 const k=tool.slice(5),q=plPos(e),x=plSn(q.x),y=plSn(q.y),m=pxm();
 if(PLINE.includes(k)||k==='room'){PL.a={x,y};PL.c={x,y};try{cv.setPointerCapture(e.pointerId)}catch(_){}return}
 if(k==='desk'||k==='rack'){const w=(k==='desk'?1.4:.8)*m,h=(k==='desk'?.7:1)*m;const o=plAdd({k,x:x-w/2,y:y-h/2,w,h});PL.sel=o.id;ch();plRender();return}
 if(k==='outlet'){const o=plAdd({k,x,y});PL.sel=o.id;ch();plRender();return}
 if(k==='label'){const o=plAdd({k,x,y,t:plAsk('Текст подписи','Подпись')});PL.sel=o.id;ch();plRender();return}
 const t=e.target.closest&&e.target.closest('[data-pid]');
 if(k==='del'){if(t){plan().el=plan().el.filter(z=>z.id!==t.dataset.pid);if(PL.sel===t.dataset.pid)PL.sel=null;ch();plRender()}return}
 if(k==='move'){if(t){const o=plan().el.find(z=>z.id===t.dataset.pid);PL.sel=o.id;PL.drag={o,sx:q.x,sy:q.y,c:{...o}};try{cv.setPointerCapture(e.pointerId)}catch(_){}}else PL.sel=null;plRender();draw()}},true);
mainEl.addEventListener('pointermove',e=>{if(!tool.startsWith('plan:'))return;if(!PL.a&&!PL.drag)return;e.stopPropagation();const q=plPos(e);
 if(PL.a){let x=plSn(q.x),y=plSn(q.y);if(tool!=='plan:room'&&plan().ortho){if(Math.abs(x-PL.a.x)>=Math.abs(y-PL.a.y))y=PL.a.y;else x=PL.a.x}PL.c={x,y};draw();return}
 if(PL.drag){const{o,c}=PL.drag,dx=plSn(q.x-PL.drag.sx),dy=plSn(q.y-PL.drag.sy);if('x1' in o){o.x1=c.x1+dx;o.x2=c.x2+dx;o.y1=c.y1+dy;o.y2=c.y2+dy}else{o.x=c.x+dx;o.y=c.y+dy}draw()}},true);
mainEl.addEventListener('pointerup',e=>{if(!tool.startsWith('plan:'))return;
 if(PL.a){e.stopPropagation();const{a,c}=PL,k=tool.slice(5);PL.a=null;
  if(k==='room'){const w=Math.abs(c.x-a.x),h=Math.abs(c.y-a.y);if(w>=20&&h>=20){const n=plan().el.filter(z=>z.k==='room').length+1;const o=plAdd({k:'room',x:Math.min(a.x,c.x),y:Math.min(a.y,c.y),w,h,t:plAsk('Название помещения','Помещение '+n)});PL.sel=o.id;ch()}else draw()}
  else if(Math.hypot(c.x-a.x,c.y-a.y)>=8){const o=plAdd({k,x1:a.x,y1:a.y,x2:c.x,y2:c.y});PL.sel=o.id;ch()}else draw();plRender();return}
 if(PL.drag){e.stopPropagation();PL.drag=null;ch();plRender()}},true);
plp.addEventListener('click',e=>{const b=e.target.closest('[data-pl]');if(!b)return;const v=b.dataset.pl;
 if(v.startsWith('t:'))return plTool(v.slice(2));
 if(v.startsWith('tpl:')||v==='cables')plp.querySelectorAll('details').forEach(x=>x.open=false);
 if(v==='off')return plOff();
 if(v==='clear'){plan().el=[];PL.sel=null;ch();return plRender()}
 if(v==='delsel'){plan().el=plan().el.filter(z=>z.id!==PL.sel);PL.sel=null;ch();return plRender()}
 if(v==='cables'){run('plan cables');return}
 if(v.startsWith('tpl:')){planTpl(v.slice(4));return}});
plp.addEventListener('change',e=>{const t=e.target,p=plan();
 if(t.dataset.plc){p[t.dataset.plc]=t.checked?1:0;ch();plRender();return}
 if(t.dataset.pls!==undefined){const old=p.m,nv=+t.value;p.el.forEach(z=>{['x','y','w','h','x1','y1','x2','y2'].forEach(k=>{if(k in z)z[k]=z[k]/old*nv})});p.m=nv;ch();plRender();return}
 const se=p.el.find(z=>z.id===PL.sel);if(!se)return;
 if(t.dataset.plt!==undefined){se.t=t.value;ch();return}
 if(t.dataset.plw!==undefined){se.w=Math.max(1,+String(t.value).replace(',','.')||1)*p.m;ch();return}
 if(t.dataset.plh!==undefined){se.h=Math.max(1,+String(t.value).replace(',','.')||1)*p.m;ch()}});
// ---- типовые планы ----
function planTpl(kind){const p=plan();p.el=[];p.m=20;p.snap=1;p.ortho=1;p.dim=1;p.show=1;const m=20,ox=60,oy=115,M=v=>v*m;
 const wl=(k,a,b,c,d)=>plAdd({k,x1:ox+M(a),y1:oy+M(b),x2:ox+M(c),y2:oy+M(d)});
 const room=(x,y,w,h,t)=>{plAdd({k:'room',x:ox+M(x),y:oy+M(y),w:M(w),h:M(h),t});wl('wall',x,y,x+w,y);wl('wall',x+w,y,x+w,y+h);wl('wall',x+w,y+h,x,y+h);wl('wall',x,y+h,x,y)};
 const st=(k,x,y)=>{const w=(k==='desk'?1.4:.8)*m,h=(k==='desk'?.7:1)*m;plAdd({k,x:ox+M(x),y:oy+M(y),w,h})};
 if(kind==='class'){room(0,0,12,7,'Кабинет информатики');wl('door',1,7,2,7);[2,6,10].forEach(x=>wl('win',x,0,x+2,0));
  for(let r=0;r<2;r++)for(let i=0;i<5;i++)st('desk',1.2+i*2.1,2+r*2.4);st('rack',10.9,.5);wl('tray',1,.5,11,.5);for(let i=0;i<5;i++)plAdd({k:'outlet',x:ox+M(1.9+i*2.1),y:oy+M(1.6)})}
 else if(kind==='office'){room(0,0,14,8,'Open-space');room(14,0,4,4,'Серверная');room(14,4,4,4,'Переговорная');wl('door',14.5,4,15.5,4);wl('door',13,8,14,8);wl('door',16,8,17,8);
  [1,5,9].forEach(x=>wl('win',x,0,x+2,0));for(let r=0;r<2;r++)for(let i=0;i<4;i++)st('desk',1+i*3.2,2+r*3);st('rack',16,.6);st('rack',17,.6);wl('tray',.8,.5,13.5,.5)}
 else{[0,1,2,3,4].forEach(i=>{room(i*6,0,6,5,'Кабинет '+(101+i));wl('door',i*6+2.5,5,i*6+3.5,5);wl('win',i*6+2,0,i*6+4,0);st('desk',i*6+1,1.5);st('desk',i*6+3.6,1.5);plAdd({k:'outlet',x:ox+M(i*6+1.7),y:oy+M(1.2)})});
  room(30,0,5,5,'Серверная');wl('door',32,5,33,5);st('rack',31,1);st('rack',32.5,1);room(0,5,35,2.5,'Коридор');wl('tray',.5,6.25,34.5,6.25)}
 PL.sel=null;ch();plRender();p.dim=1;
 window.p&&0;pOut(`План «${kind==='class'?'Кабинет информатики':kind==='office'?'Офис':'Этаж с коридором'}» загружен. Расставьте устройства поверх него, включите «Длины кабелей — по плану» и проверьте, что кабели не длиннее 90 м.`)}
const pOut=t=>p(t);
// ---- команды ----
const _run14=run;
run=function(c){const s=c.trim(),a=s.split(/\s+/);if((a[0]||'').toLowerCase()!=='plan')return _run14(c);
 const sub=(a[1]||'info').toLowerCase(),P=plan();
 if(sub==='info'||sub==='show')return p(planInfo()+`\nМасштаб: 1 м = ${P.m} пикс. Авто-длины кабелей: ${P.auto?'вкл':'выкл'}.\nКоманды: plan cables | plan scale <пикс/м> | plan auto on|off | plan clear | plan demo class|office|floor`);
 if(sub==='cables'){const ch_=S.links.map(l=>{const n=cableLen(l);return n==null?null:[l,n]}).filter(Boolean);if(!ch_.length)return p('Нет кабелей для расчёта.');
  ch_.forEach(([l,n])=>{l.len=n});cableScan();ch();
  return p('Длины кабелей рассчитаны по плану: расстояние между устройствами × 1,25 (трасса идёт вдоль стен, а не по прямой) + 2 м на разделку.\n'+ch_.map(([l,n])=>{const A=dv(l.a),B=dv(l.b),ct=CABLE[l.ct||'cat5e']||CABLE.cat5e;return`  ${(A.name+' ⇄ '+B.name).padEnd(20)} ${String(n).padStart(4)} м  ${n>ct.max?'✖ длиннее предела '+ct.max+' м: связи нет (нужна оптика или промежуточный коммутатор)':n>90?'⚠ больше 90 м (норма СКС для постоянной линии)':'✔'}`}).join('\n'))}
 if(sub==='scale'){const v=+a[2];if(!(v>=5&&v<=80))return p('Использование: plan scale <пикселей в метре, 5–80>');const old=P.m;P.el.forEach(z=>['x','y','w','h','x1','y1','x2','y2'].forEach(k=>{if(k in z)z[k]=z[k]/old*v}));P.m=v;ch();return p('Масштаб: 1 м = '+v+' пикс.')}
 if(sub==='auto'){P.auto=a[2]==='off'?0:1;ch();plRender();return p('Длины кабелей по плану: '+(P.auto?'включены — при перетаскивании устройств длины пересчитываются сами':'выключены'))}
 if(sub==='clear'){P.el=[];PL.sel=null;ch();plRender();return p('План очищен (Ctrl+Z вернёт)')}
 if(sub==='demo'){if(!['class','office','floor'].includes(a[2]))return p('Использование: plan demo class|office|floor');plp.hidden=false;return planTpl(a[2])}
 return p('Использование: plan [cables|scale|auto|clear|demo]')};
CMDS.push(['plan','plan | plan cables | plan scale <пикс/м> | plan auto on|off | plan demo class|office|floor | plan clear','План помещения: сводка, расчёт длин кабелей по плану, масштаб','Длина кабеля = расстояние по плану × 1,25 + 2 м; в СКС постоянная линия не длиннее 90 м.','plan cables','Планирование']);
if(!CMDNAMES.includes('plan'))CMDNAMES.push('plan');
// ---- задание и теория ----
TASKS.push({t:'24. План помещения и кабельная система',d:'Нажмите «План» и нарисуйте план: минимум два помещения (инструмент «Помещение»; можно взять «Типовые планы»), кабель-канал и стойку. Расставьте минимум 4 устройства так, чтобы каждое стояло внутри какого-либо помещения, и соедините их (например, коммутатор в серверной и ПК в кабинетах). Включите «Длины кабелей — по плану». Результат: все кабели не длиннее 90 м. Теория: СКС — постоянная линия до 90 м + 10 м шнуры; кабель идёт вдоль стен.',c:[],fn:()=>{const P=S.plan;if(!P||P.el.filter(e=>e.k==='room').length<2)return[false,'нарисуйте минимум два помещения'];if(!P.el.some(e=>e.k==='tray'))return[false,'добавьте кабель-канал (трассу для кабеля)'];if(!P.el.some(e=>e.k==='rack'))return[false,'добавьте стойку (место для телекоммуникационного оборудования)'];
  const inside=S.devs.filter(d=>d.k!=='ups'&&roomOf(d));if(inside.length<4)return[false,`внутри помещений стоит устройств: ${inside.length} (нужно ≥ 4)`];if(!P.auto)return[false,'включите «Длины кабелей — по плану (авто)»'];autoCables();const bad=S.links.filter(l=>(l.len||0)>90);if(!S.links.length)return[false,'соедините устройства кабелями'];return[!bad.length,bad.length?`кабели длиннее 90 м: ${bad.map(l=>dv(l.a).name+'—'+dv(l.b).name+' '+l.len+' м').join(', ')}`:`все ${S.links.length} кабелей укладываются в 90 м (самый длинный — ${Math.max(...S.links.map(l=>l.len||0))} м)`]}});
syncTasks();
{const th=['Т28. План помещения и структурированная кабельная система (СКС)',`
<h4>С чего начинается проектирование сети</h4>
<p>Сеть строят не «в вакууме», а в конкретном здании. Поэтому первый документ проекта — <b>план помещений с масштабом</b>: на нём видно, где стены, двери и окна, где можно проложить трассу, где будут рабочие места, серверная и точки доступа. Расстояния на плане превращаются в <b>длины кабелей</b>, а длины — в ограничения технологии.</p>
<h4>Структура СКС (ГОСТ Р 53246, ISO/IEC 11801, TIA-568)</h4>
<table class="t"><tr><th>Подсистема</th><th>Что это</th><th>Типичные ограничения</th></tr><tr><td>Рабочее место</td><td>розетка RJ-45, шнур до ПК</td><td>шнур до 5 м</td></tr><tr><td>Горизонтальная</td><td>от розетки до этажной кроссовой (патч-панель в стойке)</td><td><b>постоянная линия до 90 м</b>, вместе со шнурами — до 100 м</td></tr><tr><td>Вертикальная (магистраль)</td><td>между этажами, к серверной</td><td>медь до 100 м, многомод до 300–550 м, одномод — километры</td></tr><tr><td>Кампусная</td><td>между зданиями</td><td>оптика</td></tr></table>
<h4>Как посчитать длину кабеля по плану</h4>
<p><b>L = (расстояние по плану в метрах) × 1,25 + 2 м.</b> Коэффициент 1,25 учитывает, что кабель идёт <i>вдоль стен и по кабель-каналу</i>, а не напрямую, плюс подъёмы к потолку и спуски к розетке; 2 м — запас на разделку и обслуживание. Пример: розетка в 40 м от стойки по плану → 40 × 1,25 + 2 = <b>52 м</b>. Общий заказ кабеля: сумма длин + 10 % запаса. Кабель продают бухтами по 305 м.</p>
<div class="tip"><b>Не получилось уложиться в 90 м?</b> Поставьте этажный коммутатор ближе к потребителям (вторая кроссовая) или используйте оптику. Удлинять медь «репитером» в современных сетях нельзя — работающая альтернатива только коммутатор.</div>
<h4>Размещение оборудования</h4>
<ul><li><b>Стойка/серверная:</b> центр нагрузки (центр «тяжести» рабочих мест), отдельное питание и ИБП (см. Т27), вентиляция, замок. Вход — только по списку допуска.</li><li><b>Кабель-канал и лотки:</b> силовые и слаботочные кабели разносят (пересечение — под прямым углом, параллельно — не менее 20–30 см), иначе наводки.</li><li><b>Розетки:</b> минимум 2 порта на рабочее место (+ запас 20–30 % на рост), для телефонии и камер — отдельные точки.</li><li><b>Точки доступа Wi‑Fi:</b> ориентировочно одна на 80–100 м² открытого пространства, в коридорных системах — по одной в каждом 2–3-м кабинете; бетонные стены и перегородки с металлом сильно ослабляют сигнал (каждая стена ≈ −5…−15 дБ), поэтому «в соседнем кабинете сигнала почти нет» — норма. Питание — PoE.</li><li><b>Камеры:</b> входы, коридоры, серверная; высота 2,5–3 м; длина до PoE-коммутатора ≤ 100 м.</li></ul>
<h4>Документация</h4>
<p>К плану прилагают <b>кабельный журнал</b> (маркировка «розетка — порт патч-панели — длина»), схему стойки и таблицу адресации. Маркировка нужна, чтобы через год найти нужный кабель, а не «прозванивать» весь пучок.</p>
<p><b>В симуляторе:</b> кнопка «План» → «Типовые планы» (кабинет, офис, этаж) или рисуйте сами: стены, окна, двери, помещения, стойки, розетки, кабель-каналы. Расставьте устройства поверх, включите «Длины кабелей — по плану (авто)» и перетаскивайте устройства: на линиях сразу меняется длина, а кабель длиннее предела технологии (Cat5e — 100 м) перестаёт работать. Команда <code>plan cables</code> печатает таблицу и отмечает нарушения.</p>`];
 const i17=MAN.findIndex(x=>x[0].startsWith('17.'));MAN.splice(i17<0?MAN.length-1:i17,0,th)}
p('Новое (v14): кнопка «План» — рисование плана помещения (стены, двери, окна, помещения, стойки, розетки, кабель-каналы) под схемой; авто-длины кабелей по плану; команда plan.');
draw();
