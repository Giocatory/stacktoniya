// ================= v18: масштаб рабочего поля, анимация вдоль трассы кабеля, стены плана в Wi‑Fi =================
// ---- Wi‑Fi: масштаб плана и затухание стенами ----
function wpm(){const p=S.plan;return p&&p.el&&p.el.length&&p.m?p.m:4}
function wallPen(a,c){const p=S.plan;if(!p||!p.el||!p.el.length)return 0;
 const x1=a.x,y1=a.y,x2=c.x,y2=c.y;let pen=0;
 const cross=(e)=>{const d=(x2-x1)*(e.y2-e.y1)-(y2-y1)*(e.x2-e.x1);if(Math.abs(d)<1e-9)return null;
  const t=((e.x1-x1)*(e.y2-e.y1)-(e.y1-y1)*(e.x2-e.x1))/d,u=((e.x1-x1)*(y2-y1)-(e.y1-y1)*(x2-x1))/d;
  return t>=0&&t<=1&&u>=0&&u<=1?{x:x1+t*(x2-x1),y:y1+t*(y2-y1)}:null};
 const near=(pt,e)=>{const dx=e.x2-e.x1,dy=e.y2-e.y1,L2=dx*dx+dy*dy||1;let t=((pt.x-e.x1)*dx+(pt.y-e.y1)*dy)/L2;t=Math.max(0,Math.min(1,t));return Math.hypot(pt.x-(e.x1+t*dx),pt.y-(e.y1+t*dy))};
 const doors=p.el.filter(e=>e.k==='door'&&e.x1!=null),wins=p.el.filter(e=>e.k==='win'&&e.x1!=null);
 p.el.forEach(e=>{if((e.k!=='wall'&&e.k!=='part')||e.x1==null)return;const pt=cross(e);if(!pt)return;
  if(doors.some(d=>near(pt,d)<8)){pen+=2;return}
  if(wins.some(d=>near(pt,d)<8)){pen+=5;return}
  pen+=e.k==='wall'?12:5});
 return pen}
{const _ww18=wifiWhy;
 wifiWhy=function(d,i){const w=_ww18(d,i);if(typeof w!=='string')return w;
  const f=d.ifaces[i],a=S.devs.find(x=>x!==d&&x.ssid===f.ssid&&wfPass(x,f)&&!x.off);
  if(a&&/вне зоны покрытия/.test(w)){const pen=wallPen(a,d);if(pen)return w+` (в том числе +${pen} м на ослабление стенами и перегородками плана помещения)`}
  return w}}

// ---- анимация пакета вдоль изгибов кабеля ----
{const segPts=(a,b)=>{const l=linkOfPair(a.id,b.id);if(!l||!(l.pts||[]).length)return[{x:a.x,y:a.y},{x:b.x,y:b.y}];const P=routePts(l);return l.a===a.id?P:P.slice().reverse()};
 const polyAt=(P,k)=>{let L=0;const s=[];for(let i=0;i<P.length-1;i++){const d=Math.hypot(P[i+1].x-P[i].x,P[i+1].y-P[i].y);s.push(d);L+=d}
  let t=k*L;for(let i=0;i<s.length;i++){if(t<=s[i]||i===s.length-1){const f=s[i]?Math.min(1,t/s[i]):1;return{x:P[i].x+(P[i+1].x-P[i].x)*f,y:P[i].y+(P[i+1].y-P[i].y)*f}}t-=s[i]}return P[P.length-1]};
 move=async function(path,err,rep){const c=err?'var(--er)':rep?'var(--ok)':'var(--ac)',P=path.map(dv).filter(Boolean);
  for(let i=0;i<P.length-1;i++){const a=P[i],b=P[i+1],pts=segPts(a,b);let L=0;for(let j=0;j<pts.length-1;j++)L+=Math.hypot(pts[j+1].x-pts[j].x,pts[j+1].y-pts[j].y);
   const dur=Math.max(380,Math.min(1800,L*1.9)),t0=performance.now();
   await new Promise(r=>{const f=t=>{const k=Math.min(1,(t-t0)/dur),q=polyAt(pts,k);pk={x:q.x,y:q.y,c};draw();k<1?requestAnimationFrame(f):r()};requestAnimationFrame(f)})}
  const L=P[P.length-1];if(L){pk={x:L.x,y:L.y,c};if(!err)fl=new Set([L.id]);draw();await wait(err?900:350);fl.clear()}pk=null;draw()}}

// ---- масштаб рабочего поля ----
let CZ=1;const CZMIN=.3,CZMAX=2.5;
document.head.insertAdjacentHTML('beforeend','<style>#czp{position:absolute;right:14px;bottom:12px;z-index:4;display:flex;gap:2px;align-items:center;background:var(--pn);border:1px solid var(--bd);border-radius:8px;padding:3px;box-shadow:0 2px 8px rgba(0,0,0,.18)}#czp button{font-size:13px!important;min-width:28px;padding:2px 7px!important}#czp span{font-size:12px;min-width:44px;text-align:center;color:var(--mt)}</style>');
$('#wkw').insertAdjacentHTML('beforeend','<div id="czp" title="Масштаб рабочего поля: Ctrl + колесо мыши"><button type="button" data-cz="out" title="Уменьшить">−</button><span id="czv">100%</span><button type="button" data-cz="in" title="Увеличить">+</button><button type="button" data-cz="100" title="Масштаб 100%">1:1</button><button type="button" data-cz="fit" title="Вся схема на экране">Вся схема</button></div>');
function czApply(){cv.setAttribute('viewBox','0 0 3200 2000');cv.style.width=(3200*CZ)+'px';cv.style.height=(2000*CZ)+'px';const v=$('#czv');if(v)v.textContent=Math.round(CZ*100)+'%'}
function setZoom(z,px,py){z=Math.max(CZMIN,Math.min(CZMAX,z));if(px==null){px=wk.clientWidth/2;py=wk.clientHeight/2}
 const o=CZ,wx=(wk.scrollLeft+px)/o,wy=(wk.scrollTop+py)/o;CZ=z;czApply();wk.scrollLeft=wx*z-px;wk.scrollTop=wy*z-py;draw()}
function zoomFit(){if(!S.devs.length)return setZoom(1);let x1=1e9,y1=1e9,x2=-1e9,y2=-1e9;S.devs.forEach(d=>{x1=Math.min(x1,d.x);y1=Math.min(y1,d.y);x2=Math.max(x2,d.x);y2=Math.max(y2,d.y)});
 const bw=x2-x1+200,bh=y2-y1+200,z=Math.max(CZMIN,Math.min(1.5,Math.min((wk.clientWidth||900)/bw,(wk.clientHeight||500)/bh)));CZ=z;czApply();wk.scrollLeft=(x1-100)*z;wk.scrollTop=(y1-100)*z;draw()}
$('#czp').addEventListener('click',e=>{const b=e.target.closest('[data-cz]');if(!b)return;e.stopPropagation();const k=b.dataset.cz;if(k==='in')setZoom(CZ*1.2);else if(k==='out')setZoom(CZ/1.2);else if(k==='100')setZoom(1);else zoomFit()});
$('#czp').addEventListener('pointerdown',e=>e.stopPropagation());
wk.addEventListener('wheel',e=>{if(!plp.hidden||!(e.ctrlKey||e.metaKey))return;e.preventDefault();const r=wk.getBoundingClientRect();setZoom(CZ*(e.deltaY<0?1.1:1/1.1),e.clientX-r.left,e.clientY-r.top)},{passive:false});
// мышь: переводим экранные координаты в координаты схемы (все обработчики используют clientX − left)
{let zDrag=false,zSkip=false;
 ['pointerdown','mousedown','pointermove','mousemove','pointerup','mouseup','click','dblclick','contextmenu'].forEach(t=>addEventListener(t,e=>{
  if(CZ===1||e.__zv)return;const inWk=e.target&&e.target.closest&&e.target.closest('#wk');
  if(t==='pointerdown'){if(!inWk)return;const mid=e.button===1,empty=e.target===cv||e.target.id==='planlayer';zSkip=mid||SPACE||(empty&&tool==='sel');zDrag=true}
  else if(!inWk&&!zDrag)return;
  if(zSkip)return;
  const r=cv.getBoundingClientRect(),vx=r.left+(e.clientX-r.left)/CZ,vy=r.top+(e.clientY-r.top)/CZ;
  try{Object.defineProperty(e,'clientX',{value:vx,configurable:true});Object.defineProperty(e,'clientY',{value:vy,configurable:true});e.__zv=1}catch(_){}
 },true));
 addEventListener('pointerup',()=>{zDrag=false;zSkip=false})}
// масштабная линейка плана читает scroll окна — подаём ей координаты схемы
{const _ps18=planSvg;planSvg=function(){if(CZ===1)return _ps18();const st=wk.scrollTop,sl=wk.scrollLeft,chh=wk.clientHeight;
 Object.defineProperties(wk,{scrollTop:{get:()=>st/CZ,configurable:true},scrollLeft:{get:()=>sl/CZ,configurable:true},clientHeight:{get:()=>chh/CZ,configurable:true}});
 try{return _ps18()}finally{delete wk.scrollTop;delete wk.scrollLeft;delete wk.clientHeight}}}
// редактирование плана — всегда в масштабе 100 %
$('#bpl').addEventListener('click',()=>{if(CZ!==1)setZoom(1)},true);
{const _run18=run;
 run=function(c){const s=c.trim(),a=s.split(/\s+/);
  if(a[0].toLowerCase()==='zoom'){const v=(a[1]||'').toLowerCase();
   if(!v)return p(`Масштаб поля: ${Math.round(CZ*100)} %. Использование: zoom <30…250>|fit|in|out|100`);
   if(v==='fit'){zoomFit();return p('Вся схема на экране, масштаб '+Math.round(CZ*100)+' %')}
   if(v==='in'){setZoom(CZ*1.2);return p('Масштаб '+Math.round(CZ*100)+' %')}
   if(v==='out'){setZoom(CZ/1.2);return p('Масштаб '+Math.round(CZ*100)+' %')}
   const n=parseFloat(v);if(!(n>0))return p('Использование: zoom <30…250>|fit|in|out|100');setZoom(n/100);return p('Масштаб '+Math.round(CZ*100)+' %')}
  return _run18(c)}}
CMDS.push(['zoom','zoom <30…250>|fit|in|out|100','Масштаб рабочего поля (Ctrl + колесо мыши; кнопки в правом нижнем углу)','Большую схему удобно видеть целиком («Вся схема»), а мелкие детали – рассматривать в увеличении. Масштаб влияет только на отображение.','zoom fit','Обзор']);
if(!CMDNAMES.includes('zoom'))CMDNAMES.push('zoom');
czApply();
p('Новое (v17–v18): NTP- и почтовый серверы (ntp, sendmail, inbox), диагностика схемы lint, масштаб рабочего поля (zoom, Ctrl + колесо, кнопка «Вся схема»), анимация пакета вдоль изгибов кабеля, ослабление Wi‑Fi стенами плана помещения.');
