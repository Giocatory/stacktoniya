
// ================= v15: прокручиваемое полотно, изменяемые панели, масштаб плана, режим правки плана =================
const UIS=(()=>{try{return JSON.parse(localStorage.getItem('netlab_ui')||'{}')}catch(_){return{}}})();
const saveUIS=()=>{try{localStorage.setItem('netlab_ui',JSON.stringify(UIS))}catch(_){}};
document.head.insertAdjacentHTML('beforeend','<style>header{gap:5px;padding:5px 10px}header button,header select,header input{font-size:12px!important;padding:3px 8px!important}header b{font-size:15px}#wkw{position:relative;flex:1;min-width:0;display:flex}#wk{flex:1;min-width:0;overflow:auto;background:var(--cv)}#cv{flex:none!important;display:block;width:3200px;height:2000px}#wk.pan,#wk.pan *{cursor:grabbing!important}#spv,#sph{flex:none;background:var(--bd);transition:background .15s;touch-action:none}#spv{width:6px;cursor:col-resize}#sph{height:6px;cursor:row-resize}#spv:hover,#sph:hover,#spv.on,#sph.on{background:var(--ac)}@media(max-width:760px){#spv{display:none}}#cv.lblS text[font-size="9"]{font-size:8px}#cv.lblS text[font-size="10"]{font-size:9px}#cv.lblS text[font-size="11"]{font-size:10px}#cv.lblS text[font-size="12"]{font-size:11px}#cv.lblS text[font-size="13"]{font-size:12px}#cv.lblS text[font-size="14"]{font-size:13px}#plp{font-size:11px;gap:3px;padding:4px 5px}#plp button,#plp summary{font-size:11px;padding:2px 6px}#bpl.on{background:var(--ac)!important;border-color:var(--ac)!important;color:#fff}</style>');
// ---- каркас: полотно в прокручиваемом контейнере ----
const mainE=cv.parentNode,sideEl=$('#side'),termEl=$('#term');
const wkw=document.createElement('div');wkw.id='wkw';const wk=document.createElement('div');wk.id='wk';
mainE.insertBefore(wkw,cv);wk.appendChild(cv);wkw.appendChild(wk);wkw.appendChild(plp);
const spv=document.createElement('div');spv.id='spv';spv.title='Потяните, чтобы изменить ширину правой панели (двойной щелчок — по умолчанию)';mainE.insertBefore(spv,sideEl);
const sph=document.createElement('div');sph.id='sph';sph.title='Потяните, чтобы изменить высоту консоли (двойной щелчок — по умолчанию)';termEl.parentNode.insertBefore(sph,termEl);
const wide=()=>window.matchMedia('(min-width:761px)').matches;
if(UIS.sw&&wide())sideEl.style.width=UIS.sw+'px';if(UIS.th)termEl.style.height=UIS.th+'px';
const split=(el,fn,reset)=>{el.addEventListener('pointerdown',e=>{e.preventDefault();el.classList.add('on');try{el.setPointerCapture(e.pointerId)}catch(_){}const mv=ev=>{fn(ev);draw()},up=()=>{el.classList.remove('on');el.removeEventListener('pointermove',mv);el.removeEventListener('pointerup',up);saveUIS()};el.addEventListener('pointermove',mv);el.addEventListener('pointerup',up)});el.addEventListener('dblclick',()=>{reset();saveUIS();draw()})};
split(spv,ev=>{const r=mainE.getBoundingClientRect();const w=Math.max(180,Math.min(Math.min(720,r.width-260),r.right-ev.clientX));sideEl.style.width=w+'px';UIS.sw=Math.round(w)},()=>{sideEl.style.width='';delete UIS.sw});
split(sph,ev=>{const h=Math.max(70,Math.min(innerHeight*.75,innerHeight-ev.clientY-3));termEl.style.height=h+'px';UIS.th=Math.round(h)},()=>{termEl.style.height='';delete UIS.th});
// ---- перемещение рабочей области ----
let SPACE=false,pn=null;
addEventListener('keydown',e=>{if(e.code==='Space'&&!/INPUT|TEXTAREA|SELECT/.test((e.target||{}).tagName||'')){SPACE=true;e.preventDefault()}});
addEventListener('keyup',e=>{if(e.code==='Space')SPACE=false});
wk.addEventListener('pointerdown',e=>{const mid=e.button===1,empty=e.target===cv||e.target.id==='planlayer';
 if(!(mid||SPACE||(empty&&tool==='sel')))return;pn={x:e.clientX,y:e.clientY,l:wk.scrollLeft,t:wk.scrollTop,moved:false};if(mid||SPACE){e.preventDefault();e.stopPropagation()}},true);
addEventListener('pointermove',e=>{if(!pn)return;const dx=e.clientX-pn.x,dy=e.clientY-pn.y;if(!pn.moved&&Math.hypot(dx,dy)<4)return;pn.moved=true;wk.classList.add('pan');wk.scrollLeft=pn.l-dx;wk.scrollTop=pn.t-dy});
addEventListener('pointerup',()=>{if(pn){pn=null;wk.classList.remove('pan');draw()}});
wk.addEventListener('scroll',()=>{if(S.plan&&S.plan.el.length)draw()});
// ---- подписи помельче ----
const setLbl=on=>{cv.classList.toggle('lblS',!!on);UIS.lbl=on?1:0;saveUIS()};
setLbl(UIS.lbl===undefined?1:UIS.lbl);
// ---- режим правки плана: вход/выход ----
const _plOff15=plOff;
plOff=function(){_plOff15();plp.hidden=true;PL.sel=null;PL.zoom=null;$('#bpl').classList.remove('on');draw()};
$('#bpl').addEventListener('click',()=>{$('#bpl').classList.toggle('on',!plp.hidden);if(!plp.hidden)p('Режим правки плана: план можно рисовать, двигать и масштабировать. Кнопка «Готово» (или «План») фиксирует план — он больше не выделяется и не мешает строить сеть.');draw()});
// ---- масштаб плана ----
const curPts=()=>Object.fromEntries(S.links.filter(l=>l.pts&&l.pts.length).map(l=>[l.id,l.pts.map(q=>({...q}))]));
const shiftPts=(sp,dx,dy)=>S.links.forEach(l=>{if(l.pts&&l.pts.length){const o=(sp&&sp[l.id])||l.pts;l.pts=o.map(q=>({x:q.x+dx,y:q.y+dy}))}});
function planZoom(f,ox,oy,from){const P=plan(),src=from||{el:P.el,m:P.m},nm_=Math.max(5,Math.min(90,src.m*f));f=nm_/src.m;
 const sp=src.pts||curPts();S.links.forEach(l=>{if(l.pts&&l.pts.length&&sp[l.id])l.pts=sp[l.id].map(q=>({x:ox+(q.x-ox)*f,y:oy+(q.y-oy)*f}))});
 P.el=src.el.map(z=>{const n={...z};['x','x1','x2'].forEach(k=>{if(k in n)n[k]=ox+(n[k]-ox)*f});['y','y1','y2'].forEach(k=>{if(k in n)n[k]=oy+(n[k]-oy)*f});['w','h'].forEach(k=>{if(k in n)n[k]*=f});return n});P.m=nm_;return f}
function planFit(){const b=planBBox();if(!b)return;const vw=wk.clientWidth||900,vh=(wk.clientHeight||400)-110,f=Math.min(vw*.92/b.w,vh*.92/b.h);planZoom(f,b.x,b.y);const nb=planBBox();const dx=wk.scrollLeft+20-nb.x,dy=wk.scrollTop+100-nb.y;plan().el.forEach(z=>{['x','x1','x2'].forEach(k=>{if(k in z)z[k]+=dx});['y','y1','y2'].forEach(k=>{if(k in z)z[k]+=dy})});shiftPts(null,dx,dy);ch();plRender()}
const _plRender15=plRender;
plRender=function(){_plRender15();
 const t=plp.querySelector('button[data-pl="t:del"]');
 if(t)t.insertAdjacentHTML('afterend','<button data-pl="t:pan" class="'+(tool==='plan:pan'?'on':'')+'" title="Сдвинуть весь план целиком">Сдвинуть всё</button><span class="sep"></span><span title="Масштаб плана: все размеры меняются пропорционально (также Ctrl + колесо мыши или маркер в углу рамки)">Масштаб плана:</span><button data-pl="z:-">−</button><button data-pl="z:+">+</button><button data-pl="z:fit">Вписать</button>');
 const pop=plp.querySelector('details[data-n=o] .pop');if(pop)pop.insertAdjacentHTML('afterbegin','<label><input type="checkbox" data-ui="lbl" '+(UIS.lbl?'checked':'')+'> Мелкие подписи на схеме</label>')};
plp.addEventListener('click',e=>{const b=e.target.closest('[data-pl]');if(!b)return;const v=b.dataset.pl;if(!v.startsWith('z:'))return;e.stopImmediatePropagation();
 if(v==='z:fit')return planFit();const bb=planBBox();if(!bb)return;planZoom(v==='z:+'?1.1:1/1.1,bb.x,bb.y);ch();plRender()},true);
plp.addEventListener('change',e=>{if(e.target.dataset.ui==='lbl'){setLbl(e.target.checked);e.stopImmediatePropagation()}},true);
wk.addEventListener('wheel',e=>{if(plp.hidden||!(e.ctrlKey||e.altKey))return;const bb=planBBox();if(!bb)return;e.preventDefault();const r=cv.getBoundingClientRect();planZoom(e.deltaY<0?1.1:1/1.1,e.clientX-r.left,e.clientY-r.top);ch()},{passive:false});
// маркер масштаба и «сдвинуть всё» (в режиме правки; перехват до обработчиков схемы)
let PZ=null;
mainE.addEventListener('pointerdown',e=>{if(plp.hidden||!cv.contains(e.target)&&e.target!==cv)return;
 const hd=e.target.closest&&e.target.closest('[data-phandle]');
 if(hd){const b=planBBox(),r=cv.getBoundingClientRect();e.stopPropagation();e.preventDefault();PZ={k:'z',b,src:{el:JSON.parse(JSON.stringify(plan().el)),m:plan().m,pts:curPts()},x0:e.clientX-r.left};try{cv.setPointerCapture(e.pointerId)}catch(_){}return}
 if(tool==='plan:pan'){const r=cv.getBoundingClientRect();e.stopPropagation();e.preventDefault();PZ={k:'m',src:{el:JSON.parse(JSON.stringify(plan().el)),m:plan().m,pts:curPts()},x0:e.clientX-r.left,y0:e.clientY-r.top};try{cv.setPointerCapture(e.pointerId)}catch(_){}}},true);
mainE.addEventListener('pointermove',e=>{if(!PZ)return;e.stopPropagation();const r=cv.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,P=plan();
 if(PZ.k==='z'){const f=Math.max(.2,Math.min(6,(x-PZ.b.x)/Math.max(20,PZ.x0-PZ.b.x)));planZoom(f,PZ.b.x,PZ.b.y,PZ.src)}
 else{const dx=plSn(x-PZ.x0),dy=plSn(y-PZ.y0);P.el=PZ.src.el.map(z=>{const n={...z};['x','x1','x2'].forEach(k=>{if(k in n)n[k]+=dx});['y','y1','y2'].forEach(k=>{if(k in n)n[k]+=dy});return n});shiftPts(PZ.src.pts,dx,dy)}
 draw()},true);
mainE.addEventListener('pointerup',e=>{if(!PZ)return;e.stopPropagation();PZ=null;ch();plRender()},true);
p('Новое (v15): полотно можно двигать (перетаскивание пустого места, колесо, Пробел или средняя кнопка), панель справа и консоль снизу меняют размер за тонкий разделитель, план масштабируется (кнопки «Масштаб плана», маркер в углу рамки, Ctrl + колесо) и редактируется только в режиме «План».');
draw();
