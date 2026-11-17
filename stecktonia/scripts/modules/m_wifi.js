// ===== m_wifi: углублённый Wi‑Fi: каналы и помехи, режимы защиты, сканер эфира, планировщик и аудит, роуминг =====
const WF_SEC={open:'ОТКРЫТАЯ',wep:'WEP',wpa2:'WPA2-PSK',wpa3:'WPA3-SAE'};
const wfSec=a=>a.sec||'wpa2';
const wfRad=a=>a.ifaces.find(g=>g.radio);
const wfAPs=()=>S.devs.filter(a=>a.ssid!==undefined&&a.ssid!==null&&wfRad(a));
const wfOn=a=>!a.off&&!(wfRad(a)||{}).off;
const wfE=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function wfRssi(ap,c){const m=Math.max(1,dm(ap,c)),b=wband(ap,c)||'2.4';return Math.round(b==='5'?-41-25*Math.log10(m):-35-22*Math.log10(m))}
const wfQ=r=>Math.max(0,Math.min(100,Math.round(2*(r+100))));
const wfCfg=a=>a.ch!==undefined||a.ch5!==undefined||a.sec!==undefined;
function wfIntf(ap,band){const ch=band==='5'?ap.ch5:ap.ch;if(ch===undefined)return 1;let f=1;
 wfAPs().forEach(o=>{if(o===ap||!wfOn(o))return;const oc=band==='5'?o.ch5:o.ch;if(oc===undefined)return;if(!(o.bands||'2.4+5').includes(band==='5'?'5':'2.4'))return;
  const dist=Math.hypot(o.x-ap.x,o.y-ap.y)/(typeof wpm==='function'?wpm():4);if(dist>((ap.r||40)+(o.r||40))*(band==='5'?.6:1))return;
  const dc=Math.abs(oc-ch);if(dc===0)f*=.5;else if(band!=='5'&&dc<5)f*=.5+.1*dc});return Math.max(.2,f)}
function wfCap(ap,c){const band=wband(ap,c);const base=band==='5'?300:72;if(!wfCfg(ap))return base;const r=wfRssi(ap,c);const sig=r>=-67?1:r>=-75?.7:r>=-82?.4:.2;return Math.max(1,Math.round(base*sig*wfIntf(ap,band||'2.4')))}
const wfChLab=(a,b)=>b==='5'?(a.ch5!==undefined?a.ch5:'авто'):(a.ch!==undefined?a.ch:'авто');
// ---------- сканер эфира ----------
function wfScan(c,out){const rows=wfAPs().filter(a=>a!==c&&wfOn(a)).map(a=>({a,b:wband(a,c)})).filter(x=>x.b).sort((x,y)=>dm(x.a,c)-dm(y.a,c));
 const cur=c.ifaces.filter(f=>f.wifi&&f.ssid).map(f=>apOf(c,f)).filter(Boolean);
 if(!rows.length){out('Сети не найдены: вне зоны покрытия точек доступа');return}
 out('  BSSID              SSID              КАНАЛ ГГц   СИГНАЛ          ЗАЩИТА');
 rows.forEach(({a,b})=>{const r=wfRssi(a,c),q=wfQ(r),s=wfSec(a);out(`${cur.includes(a)?'*':' '} ${(a.mac||'').padEnd(17)}  ${String(a.ssid||'(скрыта)').padEnd(16)}  ${String(wfChLab(a,b)).padEnd(5)} ${b.padEnd(5)}  ${String(q).padStart(3)}% ${String(r).padStart(4)} дБм  ${WF_SEC[s]}${s==='open'||s==='wep'?'  ⚠':''}`)});
 out('* — текущее подключение')}
// ---------- аудит ----------
function wfWeakPass(a){const p=a.pass||'';return p.length<12||p==='12345678'||/^\d+$/.test(p)||p.toLowerCase()===String(a.ssid||'').toLowerCase()}
function wfAudit(){const aps=wfAPs().filter(wfOn),R=[];const add=(ok,t,d)=>R.push({ok,t,d:d||''});
 // каналы 2.4
 const bad=[],unset=[];aps.forEach((a,i)=>{if((a.bands||'2.4+5').includes('2.4')&&a.ch===undefined)unset.push(a.name);aps.slice(i+1).forEach(o=>{if(!(o.bands||'2.4+5').includes('2.4')||(o.bands||'2.4+5')==='5'&&false)return;if(a.ch===undefined||o.ch===undefined)return;const dist=Math.hypot(o.x-a.x,o.y-a.y)/(typeof wpm==='function'?wpm():4);if(dist>(a.r||40)+(o.r||40))return;const dc=Math.abs(a.ch-o.ch);if(dc<5)bad.push(`${a.name} (канал ${a.ch}) и ${o.name} (канал ${o.ch})`+(dc===0?' — один канал':' — каналы пересекаются'))})});
 if(aps.length>1)add(!bad.length&&!unset.length,'Каналы 2.4 ГГц соседних точек не пересекаются (1, 6, 11)',bad.length?bad.join('; '):unset.length?'канал не задан («авто») у: '+unset.join(', ')+' — задайте вручную':'');
 const ins=aps.filter(a=>['open','wep'].includes(wfSec(a)));add(!ins.length,'Нет открытых сетей и сетей WEP',ins.map(a=>`${a.name}: ${WF_SEC[wfSec(a)]}`).join('; '));
 const wk=aps.filter(a=>wfSec(a)!=='open'&&wfWeakPass(a));add(!wk.length,'Пароли не короче 12 символов, не цифровые и не заводские',wk.map(a=>`${a.name}: «${a.pass||''}»`).join('; '));
 const dfl=aps.filter(a=>/^Stacktoniya-\d+$/.test(a.ssid||''));add(!dfl.length,'Имена сетей (SSID) заданы осмысленно, не по умолчанию',dfl.map(a=>a.name+': '+a.ssid).join('; '));
 const lost=[];S.devs.forEach(c=>c.ifaces.forEach((f,i)=>{if(f.wifi&&f.ssid&&!apOf(c,f)){const w=typeof wifiWhy==='function'?wifiWhy(c,i):'';lost.push(`${c.name}: ${typeof w==='string'?w:'нет связи'}`)}}));const cl=S.devs.some(c=>c.ifaces.some(f=>f.wifi&&f.ssid));
 if(cl)add(!lost.length,'Все Wi‑Fi клиенты подключены',lost.join('; '));
 const g={};aps.forEach(a=>{(g[a.ssid]=g[a.ssid]||[]).push(a)});const mism=Object.keys(g).filter(k=>g[k].length>1&&g[k].some(a=>wfSec(a)!==wfSec(g[k][0])||(wfSec(a)!=='open'&&a.pass!==g[k][0].pass)));
 if(Object.keys(g).some(k=>g[k].length>1))add(!mism.length,'Точки с общим SSID имеют одинаковую защиту и пароль (иначе роуминг не работает)',mism.map(k=>`«${k}»: `+g[k].map(a=>a.name+' '+WF_SEC[wfSec(a)]).join(', ')).join('; '));
 const w3=aps.filter(a=>wfSec(a)==='wpa3'&&S.devs.some(c=>c.o24&&c.ifaces.some(f=>f.wifi&&f.ssid===a.ssid)));if(w3.length)add(false,'Совместимость: старые устройства не поддерживают WPA3',w3.map(a=>a.name).join(', '));
 return R}
// ---------- планировщик ----------
document.head.insertAdjacentHTML('beforeend','<style>.wfx table{width:100%;border-collapse:collapse;font-size:12.5px}.wfx td,.wfx th{border:1px solid var(--bd);padding:3px 5px;text-align:left}.wfx input,.wfx select{width:100%}.wfx .okk{color:#1f9d57}.wfx .nok{color:#d64545}.wfx .row{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}.wfx .note{color:var(--mt);font-size:12.5px}</style>');
function wfPanel(){const aps=wfAPs();const A=wfAudit();const ok=A.filter(x=>x.ok).length;
 const ch24=['','1','2','3','4','5','6','7','8','9','10','11','12','13'],ch5=['','36','40','44','48','149','153','157','161'];
 const opt=(arr,v)=>arr.map(x=>`<option value="${x}" ${String(v===undefined?'':v)===x?'selected':''}>${x===''?'авто':x}</option>`).join('');
 const rows=aps.map(a=>{const nc=S.devs.filter(c=>c.ifaces.some(f=>f.wifi&&apOf(c,f)===a)).length;return `<tr><td>${wfE(a.name)}</td><td><input data-wf="ssid" data-id="${a.id}" value="${wfE(a.ssid)}" data-nohelp="1"></td><td>${wfE(a.bands||'2.4+5')}</td><td><select data-wf="ch" data-id="${a.id}" data-nohelp="1">${opt(ch24,a.ch)}</select></td><td><select data-wf="ch5" data-id="${a.id}" data-nohelp="1">${opt(ch5,a.ch5)}</select></td><td><select data-wf="sec" data-id="${a.id}" data-nohelp="1">${Object.keys(WF_SEC).map(k=>`<option value="${k}" ${wfSec(a)===k?'selected':''}>${WF_SEC[k]}</option>`).join('')}</select></td><td><input data-wf="pass" data-id="${a.id}" value="${wfE(a.pass||'')}" data-nohelp="1"></td><td>${nc}</td></tr>`}).join('');
 return `<div class="wfx" id="wfx"><h3 data-nohelp="1">Wi‑Fi: планировщик и аудит</h3><p class="note">Измените каналы, режим защиты и пароли точек доступа — аудит ниже пересчитывается сразу. «авто» — канал не задан (помехи не учитываются).</p>
${aps.length?`<table><tr><th>Точка</th><th>SSID</th><th>Диапазон</th><th>Канал 2.4</th><th>Канал 5</th><th>Защита</th><th>Пароль</th><th>Клиенты</th></tr>${rows}</table>`:'<p>На схеме нет точек доступа или Wi‑Fi роутеров. Добавьте их или нажмите «Учебный сценарий».</p>'}
<div class="row"><button data-wfb="auto" data-nohelp="1">Авто-каналы (1/6/11, 36/40/44…)</button><button data-wfb="wpa2" data-nohelp="1">WPA2 для всех точек</button><button data-wfb="scn" data-nohelp="1">Учебный сценарий: проблемный офис</button></div>
<h4 data-nohelp="1">Аудит: выполнено ${ok} из ${A.length}</h4>${A.map(x=>`<div class="${x.ok?'okk':'nok'}">${x.ok?'✔':'✖'} ${wfE(x.t)}${x.d?`<div class="note">${wfE(x.d)}</div>`:''}</div>`).join('')||'<div class="note">Нет данных для аудита.</div>'}
<p class="note">Теория: на 2.4 ГГц непересекающиеся каналы — 1, 6 и 11; соседние точки на одном канале делят эфир, и скорость падает вдвое. Открытая сеть и WEP не защищают трафик. Заводской или короткий пароль — слабое место: меняйте. Роуминг возможен между точками с одинаковым SSID, защитой и паролем.</p></div>`}
function wfOpen(){openMd(wfPanel())}
function wfRefresh(){const x=document.getElementById('wfx');if(!x||md.hidden)return;const sc=mb.scrollTop;const keep=document.activeElement&&document.activeElement.dataset&&document.activeElement.dataset.id?[document.activeElement.dataset.wf,document.activeElement.dataset.id]:null;mb.innerHTML=wfPanel()+'<p><button data-x="close">Закрыть</button></p>';mb.scrollTop=sc}
function wfAuto(){const aps=wfAPs().sort((a,b)=>a.x-b.x);const c24=[1,6,11],c5=[36,40,44,48,149,153,157,161];aps.forEach((a,i)=>{a.ch=c24[i%3];a.ch5=c5[i%c5.length]});ch()}
function wfScenario(){S={devs:[],links:[],c:0,n:{pc:0,sw:0,rt:0}};sel=null;
 const a1=addDev('wr',200,200,'AP1'),a2=addDev('ap',420,200,'AP2'),a3=addDev('ap',640,200,'AP3');
 [a1,a2,a3].forEach(a=>{a.ssid='Office';a.pass='12345678';a.ch=6;a.bands='2.4+5'});a2.sec='open';a3.sec='wep';
 const l1=addDev('lap',300,290,'Laptop1'),p1=addDev('ph',520,290,'Phone1'),p2=addDev('ph',700,290,'Phone2');
 [l1,p1,p2].forEach(c=>c.ifaces.forEach(f=>{if(f.wifi){f.ssid='Office';f.pass='office-old'}}));ch();
 p('Учебный сценарий «проблемный офис»: три точки на одном канале, одна открытая, одна на WEP, заводской пароль. Исправьте по аудиту: «Wi‑Fi планировщик».')}
document.addEventListener('change',e=>{const t=e.target;if(!t.dataset||!t.dataset.wf)return;const a=dv(t.dataset.id);if(!a)return;const k=t.dataset.wf,v=t.value;
 if(k==='ssid')a.ssid=v.trim();else if(k==='pass')a.pass=v;else if(k==='sec')a.sec=v;else if(k==='ch'||k==='ch5'){if(v==='')delete a[k];else a[k]=+v}
 ch();wfRefresh()});
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-wfb]');if(!b)return;const k=b.dataset.wfb;if(k==='auto')wfAuto();else if(k==='wpa2'){wfAPs().forEach(a=>{a.sec='wpa2'});ch()}else if(k==='scn')wfScenario();wfRefresh()});
// ---------- команды ----------
{const _r=run;run=function(c){const t=String(c).trim(),a=t.split(/\s+/),w=(a[0]||'').toLowerCase();const d=sel&&dv(sel);const o=s=>p(s);
 if(d&&(w==='channel'||w==='channel5'||w==='security')){if(d.ssid===undefined||!wfRad(d)){p('Команда доступна на точке доступа или Wi‑Fi роутере');return}
  if(w==='security'){const m=(a[1]||'').toLowerCase();if(!WF_SEC[m]){p('Использование: security open|wep|wpa2|wpa3 [пароль]  (сейчас: '+WF_SEC[wfSec(d)]+')');return}d.sec=m;if(a[2])d.pass=a[2];ch();p(`Защита сети «${d.ssid}»: ${WF_SEC[m]}${m==='open'||m==='wep'?' — небезопасно!':''}`);return}
  const v=a[1];if(!v){p(`Канал: 2.4 ГГц — ${wfChLab(d,'2.4')}, 5 ГГц — ${wfChLab(d,'5')}`);return}if(v==='auto'||v==='авто'){delete d[w==='channel'?'ch':'ch5'];ch();p('Канал: авто');return}
  const n=+v;const okc=w==='channel'?(n>=1&&n<=13):[36,40,44,48,149,153,157,161].includes(n);if(!okc){p(w==='channel'?'Канал 2.4 ГГц: 1–13 (непересекающиеся: 1, 6, 11)':'Канал 5 ГГц: 36, 40, 44, 48, 149, 153, 157, 161');return}d[w==='channel'?'ch':'ch5']=n;ch();p(`Канал ${w==='channel'?'2.4':'5'} ГГц: ${n}`);return}
 if(w==='wifiplan'||(w==='wifi'&&/^(plan|audit|план|аудит)$/i.test(a[1]||''))){wfOpen();return}
 if(d&&((w==='wifi'&&/^scan$/i.test(a[1]||''))||(w==='iwlist'&&/scan/i.test(a[1]||a[2]||''))||(w==='nmcli'&&/wifi/i.test(a.join(' '))&&/dev|d\b/.test(a.join(' '))))){if(!d.ifaces.some(f=>f.wifi)){p('Нет Wi‑Fi адаптера (добавьте NIC «Wi‑Fi» в панели справа)');return}wfScan(d,o);return}
 return _r(c)}}
// ---------- журнал роуминга ----------
const WFR={m:{},t:null};
function wfWatch(){const cl=S.devs.filter(c=>c.ifaces.some(f=>f.wifi&&f.ssid));if(!cl.length)return;cl.forEach(c=>{const f=c.ifaces.find(g=>g.wifi&&g.ssid);const ap=apOf(c,f),nm=ap?ap.name:null;const prev=WFR.m[c.id];if(prev!==undefined&&prev!==nm&&typeof p==='function')p(`📶 ${c.name}: ${prev?'роуминг '+prev+' → '+(nm||'нет связи'):'подключён к '+nm}${nm?' ('+wfRssi(ap,c)+' дБм, канал '+wfChLab(ap,wband(ap,c)||'2.4')+')':''}`);WFR.m[c.id]=nm})}
WFR.t=setInterval(()=>{try{wfWatch()}catch(e){}},900);
(function(){const dd=document.querySelector('#mbar .mi[data-k="n"] .mdd');if(!dd||document.getElementById('bwfp'))return;const b=document.createElement('button');b.id='bwfp';b.type='button';b.textContent='Wi‑Fi: планировщик и аудит';b.setAttribute('role','menuitem');b.setAttribute('data-nohelp','1');b.setAttribute('data-d','Каналы, защита, пароли точек доступа и аудит беспроводной сети');b.onclick=wfOpen;dd.appendChild(b)})();
if(typeof QH_ID!=='undefined')QH_ID.bwfp=['Wi‑Fi: планировщик','Таблица всех точек доступа: каналы 2.4 и 5 ГГц, режим защиты, пароль, число клиентов, плюс автоматический аудит и учебный сценарий.'];
MAN.push(['Т48. Wi‑Fi: каналы, защита, аудит',`<p>Меню «Сеть → Wi‑Fi: планировщик и аудит» (или команда <code>wifiplan</code>) показывает все точки доступа схемы и проверяет настройки беспроводной сети.</p>
<h3>Каналы и помехи</h3><p>У точки доступа можно задать канал 2.4 ГГц (<code>channel 1</code>…<code>13</code>) и канал 5 ГГц (<code>channel5 36</code>). Если две соседние точки (их зоны покрытия пересекаются) работают на одном или пересекающемся канале, они делят эфир: скорость клиентов падает (одинаковый канал — вдвое, соседние — меньше). Непересекающиеся каналы 2.4 ГГц — 1, 6 и 11. Значение «авто» (канал не задан) помехи не моделирует, чтобы не менять прежние схемы. Кнопка «Авто-каналы» расставляет 1/6/11.</p>
<h3>Режимы защиты</h3><p>Команда <code>security open|wep|wpa2|wpa3 [пароль]</code> на точке. Открытая сеть не требует пароля и не шифрует трафик; WEP устарел и считается небезопасным; WPA2-PSK — стандарт; WPA3 лучше, но старые устройства (флажок «только 2.4 ГГц» у клиента) к такой точке не подключатся.</p>
<h3>Сканер эфира</h3><p>На клиенте (ПК, ноутбук, телефон с Wi‑Fi) выберите устройство и введите <code>wifi scan</code> (также <code>iwlist scan</code>, <code>nmcli dev wifi</code>): список видимых сетей с BSSID, каналом, диапазоном, уровнем сигнала (% и дБм), защитой; звёздочка — текущее подключение. Уровень зависит от расстояния и стен плана помещения; при слабом сигнале скорость снижается.</p>
<h3>Роуминг</h3><p>Клиент подключается к ближайшей доступной точке с тем же SSID, защитой и паролем. При перетаскивании клиента между точками в консоли появляется строка «роуминг AP1 → AP2». Если пароли или защита у точек различаются, роуминг невозможен.</p>
<h3>Аудит</h3><p>Проверки: непересекающиеся каналы, отсутствие открытых сетей и WEP, длина и «заводской» вид пароля (короче 12 символов, только цифры, заводской 12345678, совпадение с SSID), осмысленные SSID, подключение всех клиентов, одинаковая защита у точек с общим SSID, совместимость WPA3. Кнопка «Учебный сценарий: проблемный офис» строит схему с типовыми ошибками — исправьте всё до полного зачёта аудита.</p>
<p><b>Ограничения:</b> модель упрощена — уровень сигнала считается по расстоянию и стенам, помехи — по пересечению каналов, нет ширины канала, MIMO, скрытых сетей, WPA2-Enterprise в планировщике (802.1X настраивается отдельно, см. Т15).</p>`]);
