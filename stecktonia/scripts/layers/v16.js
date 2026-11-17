
// ================= v16: трассы кабелей (изгибы, прокладка вдоль стен, стиль) =================
document.head.insertAdjacentHTML('beforeend','<style>#rtp{position:absolute;left:8px;right:8px;top:8px;z-index:6;background:var(--pn);color:var(--tx);border:1px solid var(--bd);border-radius:10px;padding:4px 6px;font-size:11px;box-shadow:0 4px 18px #0003;display:flex;flex-wrap:wrap;gap:4px;align-items:center}#rtp[hidden]{display:none}#rtp button,#rtp select{background:transparent;color:var(--tx);border:1px solid var(--bd);border-radius:6px;padding:2px 6px;cursor:pointer;font:inherit}#rtp select{background:var(--bg)}#rtp .h{color:var(--mt);flex-basis:100%}#rtp label{display:inline-flex;gap:3px;align-items:center}</style>');
const RT={sel:null,drag:null,snap:1};
const lnk=id=>S.links.find(l=>l.id===id);
const routePts=l=>{const a=dv(l.a),b=dv(l.b);return[{x:a.x,y:a.y},...(l.pts||[]),{x:b.x,y:b.y}]};
const routeLen=l=>{const P=routePts(l);let s=0;for(let i=1;i<P.length;i++)s+=Math.hypot(P[i].x-P[i-1].x,P[i].y-P[i-1].y);return s};
function ptAt(l,dist){const P=routePts(l),L=routeLen(l);let d=dist<0?L+dist:dist;d=Math.max(0,Math.min(L,d));
 for(let i=1;i<P.length;i++){const s=Math.hypot(P[i].x-P[i-1].x,P[i].y-P[i-1].y);if(d<=s||i===P.length-1){const t=s?Math.min(1,d/s):0;return{x:P[i-1].x+(P[i].x-P[i-1].x)*t,y:P[i-1].y+(P[i].y-P[i-1].y)*t}}d-=s}return P[0]}
const CSTY={solid:'сплошной (открытая прокладка)',hid:'пунктир (скрыт в стене/под полом)',tray:'в кабель-канале / лотке'};
const rtp=document.createElement('div');rtp.id='rtp';rtp.hidden=true;wkw.appendChild(rtp);
function rtRender(){const l=RT.sel&&lnk(RT.sel),A=l&&dv(l.a),B=l&&dv(l.b);
 rtp.innerHTML=`<b>Трасса кабеля:</b>`+(l&&A&&B?`<span>${esc(A.name)} ⇄ ${esc(B.name)} · трасса ${(routeLen(l)/pxm()).toFixed(1).replace('.',',')} м, в поле «длина» ${l.len||10} м</span>
<button data-rt="straight">Выпрямить</button><button data-rt="L">Г-образно</button><button data-rt="apply">Длина по трассе</button>
<select data-rts>${Object.keys(CSTY).map(k=>`<option value="${k}" ${(l.sty||'solid')===k?'selected':''}>${CSTY[k]}</option>`).join('')}</select>`:`<span>выберите кабель щелчком</span>`)+
 `<label><input type="checkbox" data-rtc ${RT.snap?'checked':''}> прилипать к стенам и осям</label><button data-rt="done">Готово</button>
<div class="h">${l?'● — переместить точку изгиба, ○ на середине участка — потяните, чтобы добавить изгиб, двойной щелчок по ● — убрать.':'Нажмите на кабель — на нём появятся маркеры. Протяните кабель вдоль стены: длина пересчитается по трассе.'}</div>`}
const rtLen=l=>{l.len=cableLen(l);cableScan()};
rtp.addEventListener('click',e=>{const b=e.target.closest('[data-rt]');if(!b)return;const l=RT.sel&&lnk(RT.sel),v=b.dataset.rt;
 if(v==='done'){tool='sel';document.querySelectorAll('header [data-t]').forEach(x=>x.classList.toggle('on',x.dataset.t==='sel'));RT.sel=null;draw();return}
 if(!l)return;const A=dv(l.a),B=dv(l.b);
 if(v==='straight'){delete l.pts;if(S.plan&&S.plan.auto)rtLen(l);ch()}
 else if(v==='L'){const cur=l.pts&&l.pts.length===1&&l.pts[0].x===B.x;l.pts=(Math.abs(A.x-B.x)<2||Math.abs(A.y-B.y)<2)?undefined:[cur?{x:A.x,y:B.y}:{x:B.x,y:A.y}];if(!l.pts)delete l.pts;rtLen(l);ch()}
 else if(v==='apply'){rtLen(l);ch();p(`Длина кабеля ${A.name} ⇄ ${B.name} по трассе: ${l.len} м (расстояние по трассе + 2 м на разделку).`)}
 rtRender()});
rtp.addEventListener('change',e=>{const t=e.target,l=RT.sel&&lnk(RT.sel);if(t.dataset.rtc!==undefined){RT.snap=t.checked?1:0;return}
 if(t.dataset.rts!==undefined&&l){l.sty=t.value==='solid'?undefined:t.value;if(!l.sty)delete l.sty;ch();rtRender()}});
$('header [data-t="cab"]').insertAdjacentHTML('afterend','<button data-t="route" title="Изгибы кабелей: проложить кабель вдоль стены, выбрать вид прокладки">Трасса кабеля</button>');
$('header [data-t="route"]').onclick=()=>{if(!plp.hidden)plOff();tool='route';linkFrom=null;RT.sel=null;sel=null;document.querySelectorAll('header [data-t]').forEach(x=>x.classList.toggle('on',x.dataset.t==='route'));if($('#ad'))$('#ad').value='';rtRender();side();draw();p('Режим трассировки кабелей: щёлкните кабель, затем тяните маркеры. Кабель можно проложить вдоль стен плана; длина считается по трассе.')};
// ---- рисование ----
const NSV='http://www.w3.org/2000/svg';
const _draw16=draw;
draw=function(){_draw16();rtp.hidden=tool!=='route';if(!rtp.hidden&&!rtp.innerHTML)rtRender();routeRender()};
function routeRender(){const withR=S.links.filter(l=>dv(l.a)&&dv(l.b)&&((l.pts&&l.pts.length)||l.sty));
 if(withR.length){const lines=[...cv.querySelectorAll('line')],texts=[...cv.querySelectorAll('text')];
  withR.forEach(l=>{const A=dv(l.a),B=dv(l.b),has=l.pts&&l.pts.length;
   const near=(e,v)=>['x1','y1','x2','y2'].every((k,i)=>Math.abs(+e.getAttribute(k)-v[i])<.01);
   const fw=[A.x,A.y,B.x,B.y],bw=[B.x,B.y,A.x,A.y],P=routePts(l);
   lines.forEach(e=>{if(!e.parentNode)return;const f=near(e,fw),r=!f&&near(e,bw);if(!f&&!r)return;
    const base=e.getAttribute('stroke')==='var(--ok)'&&e.getAttribute('stroke-width')==='2';let el=e;
    if(has){const pl=document.createElementNS(NSV,'polyline');[...e.attributes].forEach(at=>{if(!['x1','y1','x2','y2'].includes(at.name))pl.setAttribute(at.name,at.value)});
     pl.setAttribute('points',(r?P.slice().reverse():P).map(q=>q.x+','+q.y).join(' '));pl.setAttribute('fill','none');pl.setAttribute('stroke-linejoin','round');e.replaceWith(pl);el=pl}
    if(base&&l.sty==='hid')el.setAttribute('stroke-dasharray','7 4');
    if(base&&l.sty==='tray'){const cs=el.cloneNode(false);cs.setAttribute('stroke','#e08a00');cs.setAttribute('stroke-width','7');cs.setAttribute('opacity','.35');cs.removeAttribute('stroke-dasharray');cs.setAttribute('pointer-events','none');el.parentNode.insertBefore(cs,el)}});
   if(has){const x1=A.x+(B.x-A.x)*.2,y1=A.y+(B.y-A.y)*.2,x2=A.x+(B.x-A.x)*.8,y2=A.y+(B.y-A.y)*.8,mx=(A.x+B.x)/2,my=(A.y+B.y)/2,L=routeLen(l),k=Math.min(34,L*.3);
    const at=(t,x,y,nx)=>t.parentNode&&Math.abs(+t.getAttribute('x')-x)<.6&&Math.abs(+t.getAttribute('y')-y)<.6&&(nx===undefined||t.textContent===nx);
    texts.forEach(t=>{if(at(t,x1,y1-4,A.ifaces[l.ai].n)){const q=ptAt(l,k);t.setAttribute('x',q.x);t.setAttribute('y',q.y-4)}
     else if(at(t,x2,y2-4,B.ifaces[l.bi].n)){const q=ptAt(l,-k);t.setAttribute('x',q.x);t.setAttribute('y',q.y-4)}
     else if(t.getAttribute('pointer-events')==='none')[13,-6,26].forEach(dy=>{if(at(t,mx,my+dy)){const q=ptAt(l,L/2);t.setAttribute('x',q.x);t.setAttribute('y',q.y+dy)}})})}})}
 if(tool==='route'&&RT.sel){const l=lnk(RT.sel);if(!l||!dv(l.a)||!dv(l.b)){RT.sel=null;return}const P=routePts(l);let h=`<polyline points="${P.map(q=>q.x+','+q.y).join(' ')}" fill="none" stroke="var(--ac)" stroke-width="6" opacity=".3" stroke-linejoin="round" pointer-events="none"/>`;
  for(let j=0;j<P.length-1;j++)h+=`<circle data-rh="m:${j}" cx="${(P[j].x+P[j+1].x)/2}" cy="${(P[j].y+P[j+1].y)/2}" r="5" fill="var(--pn)" stroke="var(--ac)" stroke-width="2" pointer-events="all" style="cursor:copy"/>`;
  (l.pts||[]).forEach((q,i)=>h+=`<circle data-rh="w:${i}" cx="${q.x}" cy="${q.y}" r="6.5" fill="var(--ac)" stroke="#fff" stroke-width="2" pointer-events="all" style="cursor:move"/>`);
  cv.insertAdjacentHTML('beforeend',h)}}
// ---- мышь ----
function snapPt(x,y,l,idx){if(!RT.snap)return{x:Math.round(x),y:Math.round(y)};const P=routePts(l),i=idx+1,nb=[P[i-1],P[i+1]].filter(Boolean),tx=[],ty=[];
 nb.forEach(q=>{tx.push(q.x);ty.push(q.y)});(S.plan?S.plan.el:[]).forEach(e=>{if('x1' in e){if(e.x1===e.x2)tx.push(e.x1);if(e.y1===e.y2)ty.push(e.y1)}else if(e.k==='room'){tx.push(e.x,e.x+e.w);ty.push(e.y,e.y+e.h)}});
 const pick=(v,arr)=>{let b=9,r=null;arr.forEach(a=>{if(Math.abs(a-v)<b){b=Math.abs(a-v);r=a}});return r};
 const sx=pick(x,tx),sy=pick(y,ty);return{x:sx!=null?sx:Math.round(x),y:sy!=null?sy:Math.round(y)}}
mainE.addEventListener('pointerdown',e=>{if(tool!=='route'||!(cv.contains(e.target)||e.target===cv)||e.button===1||SPACE)return;e.stopPropagation();e.preventDefault();
 const r=cv.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,h=e.target.closest&&e.target.closest('[data-rh]');
 if(h&&RT.sel){const l=lnk(RT.sel),[t,i]=h.dataset.rh.split(':');let idx=+i;if(t==='m'){l.pts=l.pts||[];l.pts.splice(idx,0,{x,y})}RT.drag={l,idx};try{cv.setPointerCapture(e.pointerId)}catch(_){}draw();return}
 const ln=e.target.closest&&e.target.closest('[data-l]');RT.sel=ln&&S.links[+ln.dataset.l]?S.links[+ln.dataset.l].id:null;
 if(RT.sel){const l=lnk(RT.sel);if(!l.id)l.id=rid()}rtRender();draw()},true);
mainE.addEventListener('pointermove',e=>{if(!RT.drag)return;e.stopPropagation();const r=cv.getBoundingClientRect(),{l,idx}=RT.drag;l.pts[idx]=snapPt(e.clientX-r.left,e.clientY-r.top,l,idx);draw()},true);
mainE.addEventListener('pointerup',e=>{if(!RT.drag)return;e.stopPropagation();const{l}=RT.drag;RT.drag=null;rtLen(l);ch();rtRender()},true);
mainE.addEventListener('dblclick',e=>{if(tool!=='route')return;const h=e.target.closest&&e.target.closest('[data-rh^="w:"]');if(!h||!RT.sel)return;const l=lnk(RT.sel);l.pts.splice(+h.dataset.rh.slice(2),1);if(!l.pts.length)delete l.pts;rtLen(l);ch();rtRender()},true);
// ---- команда ----
const _run16=run;
run=function(c){const a=c.trim().split(/\s+/);if((a[0]||'').toLowerCase()!=='cable')return _run16(c);
 const sub=(a[1]||'').toLowerCase();
 if(sub==='route'||sub==='style'||sub==='straight'||sub==='len'){const A=byNm(a[2]),B=byNm(a[3]);if(!A||!B)return p('Использование: cable route <A> <B> <x,y x,y…> | cable straight <A> <B> | cable style <A> <B> solid|hid|tray | cable len <A> <B>');
  const l=S.links.find(z=>(z.a===A.id&&z.b===B.id)||(z.a===B.id&&z.b===A.id));if(!l)return p('Между этими устройствами нет кабеля');l.id=l.id||rid();
  if(sub==='straight'){delete l.pts;ch();return p('Кабель выпрямлен')}
  if(sub==='len'){rtLen(l);ch();return p(`Длина по трассе: ${l.len} м`)}
  if(sub==='style'){if(!CSTY[a[4]])return p('Стиль: solid | hid | tray');l.sty=a[4]==='solid'?undefined:a[4];if(!l.sty)delete l.sty;ch();return p('Вид прокладки: '+CSTY[a[4]])}
  const pts=a.slice(4).map(s=>s.split(',').map(Number)).filter(q=>q.length===2&&q.every(isFinite));if(!pts.length)return p('Укажите точки: cable route PC1 SW1 300,200 300,350');
  l.pts=l.a===A.id?pts.map(([x,y])=>({x,y})):pts.reverse().map(([x,y])=>({x,y}));rtLen(l);ch();return p(`Трасса задана (${pts.length} точек), длина кабеля ${l.len} м`)}
 return p('Использование: cable route|straight|style|len …  (удобнее мышью: кнопка «Трасса кабеля»)')};
CMDS.push(['cable','cable route <A> <B> <x,y …> | cable straight <A> <B> | cable style <A> <B> solid|hid|tray | cable len <A> <B>','Трасса кабеля: точки изгиба, вид прокладки, длина по трассе','Кабель идёт вдоль стен и в каналах, а не по прямой: длина трассы больше расстояния между устройствами и должна укладываться в 90 м.','cable route PC1 SW1 300,200 300,350','Планирование']);
if(!CMDNAMES.includes('cable'))CMDNAMES.push('cable');
p('Новое (v16): кнопка «Трасса кабеля» — кабели с изгибами вдоль стен, вид прокладки (открыто / в стене / в кабель-канале), длина считается по трассе.');
draw();
