// ===== m_cp (v99): контрольные точки схемы и понятное сравнение «что изменилось» =====
const CPK='netlab_cp_v1',CPAUTO='Начало (авто)';
let CPL=[];
(function(){try{const a=JSON.parse(localStorage.getItem(CPK)||'[]');if(Array.isArray(a))CPL=a.filter(x=>x&&typeof x.n==='string'&&typeof x.s==='string'&&typeof x.t==='string').slice(0,12)}catch(e){}})();
function cpPersist(){try{let tot=CPL.reduce((a,x)=>a+x.s.length,0);while(tot>2500000&&CPL.length>1){const i=CPL.findIndex(x=>x.n!==CPAUTO);const k=i<0?0:i;tot-=CPL[k].s.length;CPL.splice(k,1)}localStorage.setItem(CPK,JSON.stringify(CPL))}catch(e){}}
const cpNow=()=>new Date().toLocaleString('ru-RU',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
function cpSave(name,auto){name=String(name||'').trim();if(!/^[\wа-яА-ЯёЁ ()\.\-]{1,30}$/.test(name))return'Имя точки: 1–30 символов (буквы, цифры, пробел, ( ) . -)';
 const s=JSON.stringify(S),e=CPL.find(x=>x.n===name);if(e){e.s=s;e.t=cpNow()}else{if(CPL.length>=12){const i=CPL.findIndex(x=>x.n!==CPAUTO);if(i<0)CPL.shift();else CPL.splice(i,1)}CPL.push({n:name,t:cpNow(),s})}cpPersist();return auto?'':'Контрольная точка «'+name+'» сохранена ('+S.devs.length+' устр.)'}
const cpGet=n=>CPL.find(x=>x.n===String(n||'').trim());
function cpRestore(name){const e=cpGet(name);if(!e)return'Нет точки «'+name+'». Список: checkpoint list';let j;try{j=JSON.parse(e.s)}catch(_){return'Точка повреждена'}
 if(!schemeSet(j))return'Точка не прошла проверку и не загружена';return'Схема восстановлена из «'+e.n+'». Вернуть прежнее состояние можно кнопкой ↶ (Ctrl+Z).'}
const CPL_LBL={ip:'IP',mask:'маска',off:'порт отключён',n:'имя порта',gw:'шлюз',routes:'маршруты',dns:'DNS',pbr:'PBR',pl:'prefix-list',rmap:'route-map',redist:'редистрибуция',sla:'IP SLA',track:'track',vend:'консоль',ospf:'OSPF',vlan:'VLAN',acl:'ACL',nat:'NAT',span:'SPAN',elx:'Eltex',mtu:'MTU',ssid:'SSID'};
const cpL=k=>CPL_LBL[k]||k;
function cpFmt(v){if(v===undefined)return'—';if(v===''||v===null)return'(пусто)';if(typeof v==='boolean')return v?'да':'нет';if(typeof v==='object'){if(v&&v.net&&v.mask&&v.nh)return v.net+'/'+plen(v.mask)+' через '+v.nh+(v.ad?' [AD '+v.ad+']':'');const s=JSON.stringify(v);return s.length>70?s.slice(0,67)+'…':s}return String(v)}
function cpDiff(A,B){const L=[],ma=Object.fromEntries(A.devs.map(d=>[d.id,d])),mb=Object.fromEntries(B.devs.map(d=>[d.id,d]));
 A.devs.forEach(d=>{if(!mb[d.id])L.push('− удалено устройство '+d.name)});B.devs.forEach(d=>{if(!ma[d.id])L.push('+ добавлено устройство '+d.name+' ('+(d.k||d.t)+')')});
 const SK=new Set(['id','x','y','ifaces','mac','name','k','t']);
 B.devs.forEach(b=>{const a=ma[b.id];if(!a)return;const nm=b.name;if(a.name!==b.name)L.push(a.name+': имя → '+b.name);
  const nI=Math.max(a.ifaces.length,b.ifaces.length);for(let i=0;i<nI;i++){const fa=a.ifaces[i],fb=b.ifaces[i];if(!fa||!fb){L.push(nm+': '+(fa?'удалён':'добавлен')+' порт '+(fa||fb).n);continue}
   new Set([...Object.keys(fa),...Object.keys(fb)]).forEach(k=>{if(k==='mac')return;if(JSON.stringify(fa[k])!==JSON.stringify(fb[k]))L.push(nm+' '+fb.n+': '+cpL(k)+' '+cpFmt(fa[k])+' → '+cpFmt(fb[k]))})}
  new Set([...Object.keys(a),...Object.keys(b)]).forEach(k=>{if(SK.has(k))return;const x=a[k],y=b[k];if(JSON.stringify(x)===JSON.stringify(y))return;
   if(Array.isArray(x||[])&&Array.isArray(y||[])&&(x||y)){const sx=new Set((x||[]).map(e=>JSON.stringify(e))),sy=new Set((y||[]).map(e=>JSON.stringify(e)));
    (y||[]).forEach(e=>{if(!sx.has(JSON.stringify(e)))L.push(nm+': + '+cpL(k)+': '+cpFmt(e))});(x||[]).forEach(e=>{if(!sy.has(JSON.stringify(e)))L.push(nm+': − '+cpL(k)+': '+cpFmt(e))})}
   else if(x&&y&&typeof x==='object'&&typeof y==='object'){new Set([...Object.keys(x),...Object.keys(y)]).forEach(q=>{if(JSON.stringify(x[q])!==JSON.stringify(y[q]))L.push(nm+': '+cpL(k)+' '+q+': '+(x[q]===undefined?'добавлено':y[q]===undefined?'удалено':'изменено'))})}
   else L.push(nm+': '+cpL(k)+' '+cpFmt(x)+' → '+cpFmt(y))})});
 const nmI=(S0,id)=>{const d=S0.devs.find(x=>x.id===id);return d?d.name:'?'},pn=(S0,id,i)=>{const d=S0.devs.find(x=>x.id===id);return d&&d.ifaces[i]?d.ifaces[i].n:i};
 const key=(S0,l)=>{const e=[[l.a,l.ai],[l.b,l.bi]].sort((p,q)=>String(p[0]).localeCompare(String(q[0]))||p[1]-q[1]);return e.map(([id,i])=>nmI(S0,id)+':'+pn(S0,id,i)).join(' — ')};
 const ka=new Set(A.links.map(l=>key(A,l))),kb=new Set(B.links.map(l=>key(B,l)));
 kb.forEach(k=>{if(!ka.has(k))L.push('+ кабель '+k)});ka.forEach(k=>{if(!kb.has(k))L.push('− кабель '+k)});return L}
function cpDiffText(name,cur){const e=cpGet(name);if(!e)return null;let A;try{A=JSON.parse(e.s)}catch(_){return null}const B=cur||JSON.parse(JSON.stringify(S));return cpDiff(A,B)}
function cpPanel(){let h='<h3>Контрольные точки схемы</h3><p>Сохраните состояние схемы, продолжайте работу и в любой момент посмотрите, что изменилось, или вернитесь к точке. При загрузке шаблона точка «'+CPAUTO+'» создаётся сама.</p>'
 +'<p><input id="cpn" placeholder="Название точки" maxlength="30" style="width:220px"> <button data-cp="save">Сохранить</button></p>';
 if(!CPL.length)h+='<p><i>Точек пока нет.</i></p>';else h+='<table class="ex"><tr><th>Точка</th><th>Время</th><th>Устр.</th><th></th></tr>'+CPL.map((x,i)=>{let c='?';try{c=JSON.parse(x.s).devs.length}catch(_){}return`<tr><td>${esc(x.n)}</td><td>${esc(x.t)}</td><td>${c}</td><td><button data-cp="diff" data-i="${i}">Что изменилось</button> <button data-cp="rest" data-i="${i}">Восстановить</button> <button data-cp="del" data-i="${i}">Удалить</button></td></tr>`}).join('')+'</table>';
 if(CPS.msg)h+='<p>'+esc(CPS.msg)+'</p>';
 if(CPS.diff){h+='<p><b>Отличия: «'+esc(CPS.dn)+'» → текущая схема ('+CPS.diff.length+')</b></p>'+(CPS.diff.length?'<ul>'+CPS.diff.slice(0,80).map(x=>'<li>'+esc(x)+'</li>').join('')+(CPS.diff.length>80?'<li>… ещё '+(CPS.diff.length-80)+'</li>':'')+'</ul>':'<p>✓ Отличий нет (положение значков на схеме не учитывается).</p>')}
 return h}
const CPS={msg:'',diff:null,dn:''};
function cpOpen(){CPS.msg='';CPS.diff=null;openMd(cpPanel()+'<p><button data-x="close">Закрыть</button></p>')}
function cpRefresh(){mb.innerHTML=cpPanel()+'<p><button data-x="close">Закрыть</button></p>'}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-cp]');if(!b)return;const k=b.dataset.cp,x=CPL[+b.dataset.i];
 if(k==='save'){const n=document.getElementById('cpn');CPS.msg=cpSave(n&&n.value||'Точка '+(CPL.length+1))}
 else if(k==='diff'&&x){CPS.diff=cpDiffText(x.n);CPS.dn=x.n;CPS.msg=''}
 else if(k==='rest'&&x){CPS.msg=cpRestore(x.n);CPS.diff=null;if(/восстановлена/.test(CPS.msg)){md.hidden=true;return}}
 else if(k==='del'&&x){CPL.splice(+b.dataset.i,1);cpPersist();CPS.msg='Точка удалена';CPS.diff=null}
 cpRefresh()});
(function(){const dd=document.querySelector('#mbar .mi[data-k="e"] .mdd');if(!dd||document.getElementById('bcp'))return;const b=document.createElement('button');b.id='bcp';b.type='button';b.textContent='Контрольные точки…';b.setAttribute('role','menuitem');b.setAttribute('data-nohelp','1');b.setAttribute('data-d','Сохранить состояние схемы, посмотреть, что изменилось, вернуться к точке');b.onclick=cpOpen;dd.appendChild(b)})();
{const _t=tplLoad;tplLoad=function(){const r=_t.apply(this,arguments);try{cpSave(CPAUTO,true)}catch(e){}return r}}
{const _r=run;run=function(c){const s=String(c||'').trim(),a=s.split(/\s+/),w=a.map(x=>x.toLowerCase());
 if(w[0]==='checkpoint'||w[0]==='chkpt'){const k=w[1]||'list',nm=a.slice(2).join(' ');
  if(k==='open')return cpOpen();
  if(k==='save')return p(cpSave(nm||'Точка '+(CPL.length+1)));
  if(k==='list'){if(!CPL.length)return p('Контрольных точек нет. Пример: checkpoint save до-изменений');return CPL.forEach((x,i)=>p(`${i+1}. ${x.n} — ${x.t}`))}
  if(k==='restore')return p(cpRestore(nm));
  if(k==='del'||k==='delete'){const i=CPL.findIndex(x=>x.n===nm);if(i<0)return p('Нет точки «'+nm+'»');CPL.splice(i,1);cpPersist();return p('Точка удалена')}
  if(k==='clear'){CPL=[];cpPersist();return p('Все точки удалены')}
  if(k==='diff'){const n=nm||(CPL.length?CPL[CPL.length-1].n:'');const L=cpDiffText(n);if(!L)return p('Нет точки «'+n+'». Список: checkpoint list');p('Отличия «'+n+'» → текущая схема: '+L.length);L.slice(0,60).forEach(x=>p('  '+x));if(L.length>60)p('  … ещё '+(L.length-60));if(!L.length)p('  Отличий нет.');return}
  return p('Использование: checkpoint save ИМЯ | list | diff [ИМЯ] | restore ИМЯ | del ИМЯ | clear | open')}
 return _r(c)}}
CMDS.push(['checkpoint save|list|diff|restore|del|clear|open [ИМЯ]','checkpoint save ИМЯ — запомнить схему; checkpoint diff [ИМЯ] — что изменилось относительно точки; checkpoint restore ИМЯ — вернуться (отменяется Ctrl+Z)','Контрольные точки схемы','Сохраняют состояние схемы под именем (до 12 точек, хранятся в браузере) и показывают понятный список отличий: устройства, адреса и маски портов, маршруты, шлюзы, правила и кабели. При загрузке шаблона создаётся точка «Начало (авто)» — удобно показать, что студент изменил относительно исходной схемы.']);
MAN.push(['Т67. Контрольные точки и сравнение конфигураций',`<p><b>Зачем.</b> В профессиональной работе перед изменением фиксируют исходное состояние, а после – проверяют, что именно изменилось. Это основа управления изменениями: можно доказать, что сделано, и откатиться при ошибке.</p>
<p><b>Как пользоваться.</b> Меню «Правка → Контрольные точки…» или команды <code>checkpoint save ИМЯ</code>, <code>checkpoint list</code>, <code>checkpoint diff [ИМЯ]</code>, <code>checkpoint restore ИМЯ</code>. Сравнение показывает добавленные и удалённые устройства, изменения адресов, масок, состояния портов, шлюзов, маршрутов, правил, а также добавленные и удалённые кабели; перемещение значков не учитывается. Восстановление можно отменить кнопкой ↶ (Ctrl+Z). При загрузке шаблона автоматически создаётся точка «Начало (авто)»: преподаватель сразу видит, что студент изменил относительно исходной схемы.</p>
<p><b>Ограничения.</b> До 12 точек, хранятся в браузере на этом компьютере (при очистке данных сайта пропадают); для переноса и сдачи используйте экспорт схемы. Сравнение описывает изменения настроек устройств, а не их работоспособность – для этого служит матрица связности.</p>`]);
