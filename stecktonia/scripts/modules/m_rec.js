// ===== m_rec: запись и воспроизведение сеанса терминала, режим проектора =====
const RECX={on:false,ev:[],t0:0};
{const _pa=pAdd;pAdd=function(t){if(RECX.on&&RECX.ev.length<5000){let d='';try{d=sel&&dv(sel)?dv(sel).name:''}catch(e){}RECX.ev.push({t:Date.now()-RECX.t0,k:tcEchoF?'c':'o',s:String(t),d})}return _pa(t)}}
function recBadge(){let b=document.getElementById('recbd');if(!b){b=document.createElement('span');b.id='recbd';b.textContent='● REC';b.style.cssText='color:#fff;background:#c62828;border-radius:10px;padding:1px 8px;font-size:12px;font-weight:700;margin-left:8px';b.setAttribute('data-nohelp','1');const br=document.querySelector('header b');if(br)br.after(b)}b.hidden=!RECX.on}
function recToggle(){if(RECX.on){RECX.on=false}else{RECX.ev=[];RECX.t0=Date.now();RECX.on=true}recBadge();const bt=document.getElementById('brec');if(bt)bt.textContent=RECX.on?'■ Остановить запись терминала':'● Запись терминала';if(!RECX.on&&RECX.ev.length)recOpen()}
// ---------- воспроизведение ----------
const RP={ev:[],i:0,tm:null,sp:1};
document.head.insertAdjacentHTML('beforeend',`<style>
#rpw{position:fixed;inset:0;background:#000b;z-index:13;display:flex;align-items:center;justify-content:center;padding:8px}#rpw[hidden]{display:none}
#rpp{background:var(--pn);color:var(--tx);border:1px solid var(--bd);border-radius:12px;width:min(980px,100%);height:min(640px,100%);display:flex;flex-direction:column;overflow:hidden}
#rpp .pb{display:flex;gap:6px;flex-wrap:wrap;align-items:center;padding:8px 10px;border-bottom:1px solid var(--bd)}
#rpo{flex:1;margin:0;background:#0b1117;color:#d6e2ec;font:13.5px ui-monospace,Consolas,monospace;padding:10px;overflow:auto;white-space:pre-wrap}
#rps{flex:1;min-width:140px}
body.proj{--pj:1}body.proj #out,body.proj #in,body.proj #ps{font-size:20px!important;line-height:1.4}
body.proj aside,body.proj #side{font-size:17px}body.proj header button,body.proj header select{font-size:16px!important}
body.proj .qh,body.proj [class*="qhb"],body.proj .qmark{display:none!important}
#pjl{position:fixed;left:-100px;top:-100px;width:46px;height:46px;border-radius:50%;border:3px solid #ff3b3b;background:#ff3b3b33;pointer-events:none;z-index:99;transform:translate(-50%,-50%);display:none}
body.proj #pjl{display:block}
</style>`);
document.body.insertAdjacentHTML('beforeend','<div id="rpw" hidden><div id="rpp" role="dialog" aria-label="Воспроизведение сеанса"><div class="pb"><b>Запись сеанса</b><button id="rpg" class="p"><b>▶ Воспроизвести</b></button><select id="rpv"><option value="1">1×</option><option value="2">2×</option><option value="4" selected>4×</option><option value="10">10×</option></select><input id="rps" type="range" min="0" max="0" value="0"><span id="rpc" class="mt"></span></div><div class="pb"><button id="rpx">Сохранить запись</button><label>Открыть запись: <input type="file" id="rpf" accept=".json"></label><button id="rpe">Закрыть</button></div><pre id="rpo"></pre></div></div>');
const rpNH=()=>document.querySelectorAll('#rpw button,#rpw select,#rpw input').forEach(e=>e.setAttribute('data-nohelp','1'));
function recOpen(ev){RP.ev=ev||RECX.ev.slice();RP.i=RP.ev.length;const s=document.getElementById('rps');s.max=RP.ev.length;s.value=RP.i;document.getElementById('rpw').hidden=false;rpNH();rpDraw()}
function rpDraw(){const o=document.getElementById('rpo');o.innerHTML='';const f=document.createDocumentFragment();RP.ev.slice(0,RP.i).forEach(e=>{if(e.k==='c'){const m=String(e.s).match(/^([^>]*> )([\s\S]*)$/),a=document.createElement('span');a.className='tl-ps';a.textContent=m?m[1]:'';const b=document.createElement('span');b.className='tl-cmd';b.textContent=m?m[2]:e.s;f.append(a,b,document.createTextNode('\n'))}else String(e.s).split('\n').forEach(l=>f.appendChild(tcLine(l,true)))});o.appendChild(f);o.scrollTop=o.scrollHeight;
 document.getElementById('rps').value=RP.i;const T=RP.ev.length?RP.ev[RP.ev.length-1].t:0,cur=RP.i?RP.ev[RP.i-1].t:0;document.getElementById('rpc').textContent=`${RP.i}/${RP.ev.length} событий · ${(cur/1000).toFixed(1)} из ${(T/1000).toFixed(1)} с`}
function rpStop(){if(RP.tm){clearTimeout(RP.tm);RP.tm=null}const b=document.getElementById('rpg');if(b)b.innerHTML='<b>▶ Воспроизвести</b>'}
function rpStep(){if(RP.i>=RP.ev.length){rpStop();return}RP.i++;rpDraw();const nx=RP.ev[RP.i],cu=RP.ev[RP.i-1];const gap=nx?Math.min(1500,Math.max(30,nx.t-cu.t)):0;RP.tm=nx?setTimeout(rpStep,gap/RP.sp):null;if(!nx)rpStop()}
function rpPlay(){if(RP.tm){rpStop();return}if(RP.i>=RP.ev.length){RP.i=0;rpDraw()}RP.sp=+document.getElementById('rpv').value;document.getElementById('rpg').innerHTML='<b>❚❚ Пауза</b>';RP.tm=setTimeout(rpStep,50)}
document.addEventListener('click',e=>{const t=e.target;if(!t.closest)return;
 if(t.closest('#rpg'))return rpPlay();if(t.closest('#rpe')){rpStop();document.getElementById('rpw').hidden=true;return}
 if(t.closest('#rpx')){if(!RP.ev.length)return;const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({kind:'nl-rec',v:1,ev:RP.ev})],{type:'application/json'}));a.download='сеанс_Стектония.nlrec.json';document.body.appendChild(a);a.click();setTimeout(()=>{a.remove();URL.revokeObjectURL(a.href)},500)}});
document.addEventListener('input',e=>{if(e.target&&e.target.id==='rps'){rpStop();RP.i=+e.target.value;rpDraw()}});
document.addEventListener('change',e=>{const t=e.target;if(t&&t.id==='rpf'&&t.files[0])t.files[0].text().then(s=>{try{const j=JSON.parse(s),ev=j.kind==='nl-rec'?j.ev:(j.kind==='nl-sub'&&Array.isArray(j.rec)?j.rec:null);if(!ev)return alert('В файле нет записи сеанса');recOpen(ev);RP.i=0;rpDraw()}catch(er){alert('Не удалось прочитать файл')}})});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){const w=document.getElementById('rpw');if(w&&!w.hidden){rpStop();w.hidden=true;e.stopPropagation()}}},true);
// ---------- режим проектора ----------
let PJ=false;try{PJ=localStorage.getItem('nl_proj')==='1'}catch(e){}
document.body.insertAdjacentHTML('beforeend','<div id="pjl"></div>');
document.addEventListener('mousemove',e=>{if(!PJ)return;const l=document.getElementById('pjl');l.style.left=e.clientX+'px';l.style.top=e.clientY+'px'});
function pjSet(v){PJ=!!v;document.body.classList.toggle('proj',PJ);try{localStorage.setItem('nl_proj',PJ?'1':'0')}catch(e){}const b=document.getElementById('bproj');if(b)b.textContent=PJ?'Режим проектора: выключить':'Режим проектора'}
{const _r=run;run=function(c){const a=String(c).trim().split(/\s+/),cm=a[0].toLowerCase();
 if(cm==='proj'||cm==='проектор'){pjSet(a[1]?a[1]==='on'||a[1]==='вкл':!PJ);return p('Режим проектора: '+(PJ?'включён':'выключен'))}
 if(cm==='rec'||cm==='запись'){const x=(a[1]||'').toLowerCase();if(x==='play'||x==='показать'){if(!RECX.ev.length)return p('Записи нет: сначала rec start');recOpen();return}if(x==='start'&&!RECX.on)recToggle();else if(x==='stop'&&RECX.on)recToggle();else if(!x)return p('Запись терминала: '+(RECX.on?'идёт ('+RECX.ev.length+' событий)':'остановлена')+'. Команды: rec start | rec stop | rec play');return p(RECX.on?'Запись началась':'Запись остановлена, событий: '+RECX.ev.length)}
 return _r(c)}}
(function(){const dd=document.querySelector('#mbar .mi[data-k="h"] .mdd');if(!dd)return;
 const mk=(id,txt,d,fn)=>{if(document.getElementById(id))return;const b=document.createElement('button');b.id=id;b.type='button';b.textContent=txt;b.setAttribute('role','menuitem');b.setAttribute('data-nohelp','1');b.setAttribute('data-d',d);b.onclick=fn;dd.appendChild(b)};
 mk('bproj','Режим проектора','Крупный шрифт, красная «лазерная указка» у курсора, без значков «?»',()=>pjSet(!PJ));
 mk('brec','● Запись терминала','Записывает команды и вывод; потом их можно воспроизвести',recToggle);
 mk('bplay','Воспроизвести запись…','Открыть сохранённую запись сеанса или работу студента',()=>{recOpen(RECX.ev.length?null:[])})})();
pjSet(PJ);recBadge();
if(typeof QH_ID!=='undefined'){QH_ID.bproj=['Режим проектора','Увеличивает шрифты консоли и панелей и показывает красный круг-указку у курсора. Включается и командой proj.'];QH_ID.brec=['Запись терминала','Начните запись, выполните команды и остановите: откроется окно воспроизведения с перемоткой и скоростью. Запись можно сохранить в файл.'];QH_ID.bplay=['Воспроизвести запись','Открывает окно воспроизведения: файл записи (.nlrec.json) или файл сдачи студента (.nlsub.json), если запись была включена при сдаче.']}
MAN.push(['Т40. Запись сеанса и режим проектора',`<h3>Запись и воспроизведение</h3><p>Пункт «Справка → ● Запись терминала» (или команда <code>rec start</code>) записывает все команды и результаты в консоли с временем. По остановке (<code>rec stop</code>) откроется окно воспроизведения: кнопка «Воспроизвести», скорость 1×–10×, ползунок перемотки; паузы длиннее полутора секунд сокращаются. Запись сохраняется в файл <code>*.nlrec.json</code>; открыть её можно в том же окне («Воспроизвести запись…»). Если запись была включена при сдаче работы (раздел Т38), последние 800 событий попадают в файл сдачи, и преподаватель видит, как студент пришёл к решению: откройте файл сдачи в окне воспроизведения.</p>
<h3>Режим проектора</h3><p>Пункт «Справка → Режим проектора» или команда <code>proj</code>: крупный шрифт консоли и панелей, красная круглая «указка» вокруг курсора, скрыты значки «?». Выбор запоминается.</p><p>Ограничения: записываются только текстовые события консоли основного окна, а не действия мышью на схеме и не терминал окна «Скрипты»; запись не шифруется и не защищена подписью.</p>`]);
