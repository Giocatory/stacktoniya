// ===== m_assign: задания преподавателя — конструктор критериев, файл задания, файл сдачи, журнал =====
// Файл задания: *.nlassign.json. Файл сдачи: *.nlsub.json с печатью (контрольной суммой). Без сервера: файлы передаются любым способом.
const ASG_T=[['ping','Ping проходит / не проходит','от','к',''],['l4','Порт открыт / закрыт (tcp)','от','к','порт'],['ip','У устройства есть IP с префиксом','устройство','префикс, напр. 192.168.1.',''],['gw','Шлюз устройства','устройство','адрес шлюза',''],['dev','В схеме есть устройство','имя','',''],['cnt','Устройств не меньше','число','',''],['sx','Задание по скриптам выполнено','id задания, напр. b25','','']];
let ASG=null;try{ASG=JSON.parse(localStorage.getItem('nl_asg')||'null')}catch(e){}
const asgSave=()=>{try{localStorage.setItem('nl_asg',JSON.stringify(ASG))}catch(e){}};
const asgStud=()=>{try{return JSON.parse(localStorage.getItem('nl_stud')||'{}')}catch(e){return{}}};
const nlSeal=o=>{const s=JSON.stringify(o)+'|NetLab-1';let a=0x811c9dc5,b=0x9747b28c;for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);a^=c;a=Math.imul(a,16777619)>>>0;b=Math.imul(b^c,2246822519)>>>0;b^=b>>>13}return a.toString(16)+b.toString(16)};
const asgEsc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function asgCrit(c){const exp=c.exp!=='no';try{
 if(c.type==='ping')return cmPin(c.f1,c.f2)===exp;
 if(c.type==='l4')return cmL4(c.f1,c.f2,+c.f3)===exp;
 if(c.type==='ip'){const d=byNm(c.f1);return !!d&&d.ifaces.some(i=>i.ip&&i.ip.startsWith(c.f2))===exp}
 if(c.type==='gw'){const d=byNm(c.f1);return !!d&&d.gw===c.f2}
 if(c.type==='dev')return !!byNm(c.f1)===exp;
 if(c.type==='cnt')return S.devs.length>=+c.f1;
 if(c.type==='sx'){const t=SXT.find(z=>z.id===c.f1),d=sxTD();return !!t&&!!d&&t.chk(d).every(x=>x[1])}
 }catch(e){}return false}
function asgDesc(c){const e=c.exp==='no'?' НЕ ':' ';return{ping:`Ping ${c.f1} → ${c.f2}${e}проходит`,l4:`${c.f1} → ${c.f2}: tcp/${c.f3}${c.exp==='no'?' закрыт':' открыт'}`,ip:`${c.f1}: назначен IP ${c.f2}…`,gw:`${c.f1}: шлюз ${c.f2}`,dev:`В схеме${c.exp==='no'?' нет':' есть'} устройство ${c.f1}`,cnt:`В схеме не меньше ${c.f1} устройств`,sx:`Задание по скриптам ${c.f1}${(()=>{const t=SXT.find(z=>z.id===c.f1);return t?' — '+t.t:''})()}`}[c.type]||c.type}
function asgEval(){if(!ASG)return{score:0,max:0,crit:[]};const crit=(ASG.crit||[]).map(c=>({t:c.t||asgDesc(c),w:+c.w||1,ok:asgCrit(c)}));const max=crit.reduce((a,c)=>a+c.w,0),score=crit.reduce((a,c)=>a+(c.ok?c.w:0),0);return{score,max,crit}}
function asgSig(){const t=[];S.devs.forEach(d=>{(d.ifaces||[]).forEach(f=>{if(f.ip)t.push(`ip:${f.ip}/${f.mask||''}`);if(f.vlan)t.push('v:'+f.vlan);if(f.svi)t.push('svi:'+f.svi)});if(d.gw)t.push('gw:'+d.gw);(d.routes||[]).forEach(r=>t.push(`r:${r.net}>${r.gw||r.via||''}`));(d.acl||[]).forEach(a=>t.push('acl:'+JSON.stringify(a)))});return[...new Set(t)].sort()}
function asgScripts(){const d=sxTD(),o={};if(!d)return o;const fs=sxFs(d);Object.keys(fs).forEach(k=>{if(/\.(sh|bat|cmd|ps1)$/.test(k)&&fs[k]&&!fs[k].d&&String(fs[k].c||'').length<20000)o[k.replace(/^.*\//,'')]=String(fs[k].c||'')});return o}
function asgDl(name,text){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'application/json'}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{a.remove();URL.revokeObjectURL(a.href)},500)}
function asgLoad(j){if(!j||j.kind!=='nl-assign'||!Array.isArray(j.crit))return false;ASG=j;asgSave();
 if(j.scheme){schemeSet(JSON.parse(JSON.stringify(j.scheme)))}
 (j.crit||[]).forEach(c=>{if(c.type==='sx'){const t=SXT.find(z=>z.id===c.f1),d=sxTD();if(t&&t.prep&&d){try{t.prep(d)}catch(e){}}}});return true}
function asgPanel(msg){const st=asgStud();let h='<h3>Задание преподавателя</h3>';
 if(ASG){const R=asgEval();h+=`<p><b>${asgEsc(ASG.title)}</b>${ASG.author?' — '+asgEsc(ASG.author):''}</p><p>${asgEsc(ASG.text||'').replace(/\n/g,'<br>')}</p><ul>${R.crit.map(c=>`<li>${c.ok?'✅':'⬜'} ${asgEsc(c.t)} <small class="mt">(${c.w})</small></li>`).join('')}</ul><p><b>Результат: ${R.score} из ${R.max}</b>${R.max?' ('+Math.round(100*R.score/R.max)+'%)':''}</p>
<p><label>Фамилия и имя <input id="as_n" value="${asgEsc(st.n||'')}" style="width:220px"></label> <label>Группа <input id="as_g" value="${asgEsc(st.g||'')}" style="width:90px"></label></p>
<p><button data-x="as_chk">Проверить</button> <button data-x="as_sub"><b>Сдать работу (скачать файл)</b></button> <button data-x="as_drop">Закрыть задание</button></p><p class="mt">Файл сдачи отправьте преподавателю. В нём результаты проверки, подпись и тексты ваших скриптов.</p>`}
 else h+=`<p>Задания выдаёт преподаватель файлом <code>*.nlassign.json</code>. Откройте файл — загрузится схема и условие.</p><p><label>Открыть файл задания: <input type="file" id="as_f" accept=".json"></label></p>`;
 h+=`<hr><p><b>Преподавателю:</b> <button data-x="as_new">Создать задание</button> <button data-x="as_jr">Журнал группы</button></p>`+(msg?`<p class="mt">${asgEsc(msg)}</p>`:'');openMd(h)}
let ASGD={title:'',text:'',author:'',useS:true,crit:[]};
function asgForm(){const rows=ASGD.crit.map((c,i)=>`<tr><td><select data-ai="${i}" data-af="type">${ASG_T.map(t=>`<option value="${t[0]}"${t[0]===c.type?' selected':''}>${t[1]}</option>`).join('')}</select></td><td><input data-ai="${i}" data-af="f1" value="${asgEsc(c.f1)}" placeholder="${asgEsc((ASG_T.find(t=>t[0]===c.type)||[])[2]||'')}" size="9"></td><td><input data-ai="${i}" data-af="f2" value="${asgEsc(c.f2)}" placeholder="${asgEsc((ASG_T.find(t=>t[0]===c.type)||[])[3]||'')}" size="14"></td><td><input data-ai="${i}" data-af="f3" value="${asgEsc(c.f3)}" placeholder="${asgEsc((ASG_T.find(t=>t[0]===c.type)||[])[4]||'')}" size="5"></td><td><select data-ai="${i}" data-af="exp"><option value="yes"${c.exp!=='no'?' selected':''}>да</option><option value="no"${c.exp==='no'?' selected':''}>нет</option></select></td><td><input data-ai="${i}" data-af="w" type="number" min="1" value="${c.w}" style="width:50px"></td><td><button data-x="as_del" data-i="${i}">✕</button></td></tr>`).join('');
 openMd(`<h3>Конструктор задания</h3><p><label>Название <input id="as_t" value="${asgEsc(ASGD.title)}" style="width:300px"></label> <label>Автор <input id="as_a" value="${asgEsc(ASGD.author)}" style="width:150px"></label></p><p><textarea id="as_x" rows="4" style="width:96%" placeholder="Условие задания для студента">${asgEsc(ASGD.text)}</textarea></p>
<p><label><input type="checkbox" id="as_s"${ASGD.useS?' checked':''}> Выдать студенту текущую схему как стартовую (иначе студент работает на своей)</label></p>
<table><tr><th>Тип критерия</th><th>Поле 1</th><th>Поле 2</th><th>Поле 3</th><th>Ожидается</th><th>Вес</th><th></th></tr>${rows||'<tr><td colspan="7" class="mt">Критериев пока нет</td></tr>'}</table>
<p><button data-x="as_add">+ Критерий</button> <button data-x="as_test">Проверить на текущей схеме</button> <button data-x="as_save"><b>Скачать файл задания</b></button> <button data-x="as_back">← Назад</button></p><p class="mt">Критерии проверяются по текущему состоянию схемы. Чтобы проверить сам файл, выполните задание и нажмите «Проверить на текущей схеме». Подсказка: для скриптов используйте тип «Задание по скриптам» и id из окна «Скрипты → Задания».</p><div id="as_r"></div>`)}
function asgSyncForm(){const g=i=>document.getElementById(i);if(g('as_t')){ASGD.title=g('as_t').value;ASGD.author=g('as_a').value;ASGD.text=g('as_x').value;ASGD.useS=g('as_s').checked}}
function asgNum(){return nlSeal({t:ASGD.title,x:ASGD.text,c:ASGD.crit.length,d:Date.now()}).slice(0,8)}
function asgResult(R){return R.crit.map(c=>`<li>${c.ok?'✅':'❌'} ${asgEsc(c.t)}</li>`).join('')+`<li><b>${R.score} из ${R.max}</b></li>`}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-x^="as_"]');if(!b)return;const x=b.dataset.x;
 if(x==='as_chk')return asgPanel('Проверено: '+new Date().toLocaleTimeString('ru-RU'));
 if(x==='as_drop'){ASG=null;asgSave();return asgPanel('Задание закрыто')}
 if(x==='as_sub'){const n=(document.getElementById('as_n')||{}).value||'',g=(document.getElementById('as_g')||{}).value||'';if(!n.trim())return asgPanel('Укажите фамилию и имя');try{localStorage.setItem('nl_stud',JSON.stringify({n,g}))}catch(er){}
  const R=asgEval(),o={asgId:ASG.id,asgTitle:ASG.title,student:n.trim(),group:g.trim(),at:new Date().toLocaleString('ru-RU'),score:R.score,max:R.max,crit:R.crit.map(c=>({t:c.t,w:c.w,ok:c.ok})),sig:asgSig(),scripts:asgScripts()};
  const sub={kind:'nl-sub',v:1,...o,seal:nlSeal(o)};if(typeof RECX!=='undefined'&&RECX.ev.length)sub.rec=RECX.ev.slice(-800);asgDl(`сдача_${n.trim().replace(/\s+/g,'_')}_${(ASG.title||'').replace(/[^\wа-яА-Я]+/g,'_')}.nlsub.json`,JSON.stringify(sub));return asgPanel('Файл сдачи скачан: '+R.score+' из '+R.max)}
 if(x==='as_new'){return asgForm()}
 if(x==='as_back'){asgSyncForm();return asgPanel()}
 if(x==='as_add'){asgSyncForm();ASGD.crit.push({type:'ping',f1:'',f2:'',f3:'',exp:'yes',w:1});return asgForm()}
 if(x==='as_del'){asgSyncForm();ASGD.crit.splice(+b.dataset.i,1);return asgForm()}
 if(x==='as_test'||x==='as_save'){asgSyncForm();const bk=ASG;ASG={crit:ASGD.crit};const R=asgEval();ASG=bk;
  if(x==='as_test'){asgForm();const r=document.getElementById('as_r');r.innerHTML='<h4>Проверка по текущей схеме</h4><ul>'+asgResult(R)+'</ul>';return}
  if(!ASGD.title.trim())return asgForm();const j={kind:'nl-assign',v:1,id:asgNum(),title:ASGD.title.trim(),text:ASGD.text,author:ASGD.author,created:new Date().toLocaleString('ru-RU'),crit:ASGD.crit.map(c=>({...c,w:+c.w||1})),scheme:ASGD.useS?JSON.parse(JSON.stringify(S)):null};
  asgDl(`задание_${j.title.replace(/[^\wа-яА-Я]+/g,'_')}.nlassign.json`,JSON.stringify(j));asgForm();document.getElementById('as_r').innerHTML='<p class="ok">Файл задания скачан. Раздайте его студентам.</p>';return}
 if(x==='as_jr')return nlOpenPage('journal')},true);
document.addEventListener('input',e=>{const t=e.target;if(t&&t.dataset&&t.dataset.ai!==undefined&&t.dataset.af){const c=ASGD.crit[+t.dataset.ai];if(c)c[t.dataset.af]=t.value}});
document.addEventListener('change',e=>{const t=e.target;if(t&&t.dataset&&t.dataset.ai!==undefined&&t.dataset.af==='type'){asgSyncForm();ASGD.crit[+t.dataset.ai].type=t.value;asgForm()}
 if(t&&t.id==='as_f'&&t.files&&t.files[0]){t.files[0].text().then(s=>{try{const j=JSON.parse(s);asgPanel(asgLoad(j)?'Задание загружено':'Это не файл задания')}catch(er){asgPanel('Не удалось прочитать файл')}})}});
function nlOpenPage(k){const h=typeof NL_PAGES!=='undefined'&&NL_PAGES[k];if(!h)return;const u=URL.createObjectURL(new Blob([h],{type:'text/html;charset=utf-8'}));window.open(u,'_blank')}
// пункт меню «Практика»
(function(){const dd=document.querySelector('#mbar .mi[data-k="p"] .mdd');if(!dd||document.getElementById('basg'))return;const b=document.createElement('button');b.id='basg';b.type='button';b.textContent='Задание преподавателя';b.setAttribute('role','menuitem');b.setAttribute('data-nohelp','1');b.setAttribute('data-d','Открыть файл задания, сдать работу, конструктор, журнал группы');b.onclick=()=>asgPanel();dd.appendChild(b)})();
if(typeof QH_ID!=='undefined')QH_ID.basg=['Задание преподавателя','Открыть файл задания от преподавателя и сдать работу файлом, либо создать своё задание с автопроверкой и открыть журнал группы.'];
MAN.push(['Т38. Задания преподавателя, сдача работ и журнал',`<h3>Как это работает без сервера</h3><p>Все данные передаются файлами. Преподаватель создаёт <b>файл задания</b> (<code>*.nlassign.json</code>) в «Практика → Задание преподавателя → Создать задание»: название, условие, критерии с весами и, при желании, стартовая схема. Студент открывает файл там же — загружается схема и условие, а кнопка «Проверить» показывает выполнение критериев. Кнопка «Сдать работу» скачивает <b>файл сдачи</b> (<code>*.nlsub.json</code>): результаты, подпись и тексты скриптов студента.</p>
<h3>Журнал группы</h3><p>Кнопка «Журнал группы» открывает отдельную страницу: перетащите на неё файлы сдачи всей группы — получите ведомость с оценками, CSV и печать, проверку подписи файла, частые ошибки группы и список пар работ с высоким сходством (по схеме и по тексту скриптов).</p>
<h3>Типы критериев</h3><ul><li>Ping проходит / не проходит; tcp-порт открыт / закрыт;</li><li>у устройства есть IP с заданным префиксом; шлюз устройства; устройство есть в схеме; число устройств;</li><li>задание по скриптам из окна «Скрипты» (по id).</li></ul>
<p>Ограничения: подпись файла — контрольная сумма для обнаружения случайных правок, а не криптографическая защита: студент с хорошими знаниями может подделать файл. Сходство работ — подсказка для беседы, не доказательство.</p>`]);
