// ===== v62: цветной вывод терминала: приглашение, команда, обычный текст, ошибки, предупреждения, успех, заголовки, IP/MAC =====
// Цвет задаётся только оформлением (span); текст out.textContent не меняется, поэтому проверки заданий работают как раньше.
const TCM=['on','hc','off'],TCN={on:'обычные',hc:'контрастные',off:'выключены'};
let tcMode='on';try{const v=localStorage.getItem('nl_tc');if(TCM.includes(v))tcMode=v}catch(e){}
function tcApply(){const b=document.body;b.dataset.tc=tcMode}
document.head.insertAdjacentHTML('beforeend',`<style>
:root{--tc-ps:#5fd3a0;--tc-cmd:#ffd866;--tc-err:#ff6b6b;--tc-warn:#ff9e64;--tc-ok:#56d364;--tc-head:#d2a8ff;--tc-dim:#6e8294;--tc-ip:#6cb6ff;--tc-mac:#4fd1c5;--tc-cbg:#ffd8661a}
body[data-tc="hc"]{--tc-ps:#00ff9c;--tc-cmd:#fff04d;--tc-err:#ff4040;--tc-warn:#ffa000;--tc-ok:#33ff66;--tc-head:#e0b0ff;--tc-dim:#9fb0be;--tc-ip:#4da6ff;--tc-mac:#2ee6d6}
.tl-ps{color:var(--tc-ps);font-weight:700}
.tl-cmd{color:var(--tc-cmd);font-weight:700;background:var(--tc-cbg)}
.tl-err{color:var(--tc-err)}
.tl-warn{color:var(--tc-warn)}
.tl-ok{color:var(--tc-ok)}
.tl-head{color:var(--tc-head);font-weight:700}
.tl-dim{color:var(--tc-dim)}
.tl-ip{color:var(--tc-ip)}
.tl-mac{color:var(--tc-mac)}
.tl-up{color:var(--tc-ok);font-weight:700}
.tl-dn{color:var(--tc-err);font-weight:700}
body[data-tc="hc"] .tl-err,body[data-tc="hc"] .tl-warn{font-weight:700}
body[data-tc="off"] #out [class^="tl-"],body[data-tc="off"] #sxterm [class^="tl-"]{color:inherit!important;background:none!important;font-weight:inherit!important}
#ps{font-weight:700}
.tcleg{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:6px}
</style>`);
// --- классификация строк
const TC_ERR=/^(%|\*\*\*|error\b|ошибка|fail|fatal|bash:|cmd:|-bash|sh:)|неизвестн(ая|ый|ое)|не найден|не удалось|отказано|запрещен|недопустим|неверн|некорректн|ошибк[аиу]\b|invalid|incorrect|ambiguous|unknown|not found|no such|denied|refused|failed|failure|unreachable|timed out|request time|нет маршрута|недоступ|превышен|permission|cannot|can't|не поддерживается|нельзя|не хватает|нет прав|syntax error|command not found|не является внутренней/i;
const TC_WARN=/^(warning|предупрежд|внимание|осторожно|note:|примечание|⚠)|предупрежд|deprecated|рекомендуется|устарел/i;
const TC_OK=/^(ok\b|готово|успешно|✔|✓|✅|done\b|\[ok\]|принято|сохранено|выполнено|зачтено)|успешно|reply from|bytes from|ttl=|is up\b|established|соединение установлено|completed|passed|все критерии|задание выполнено|зачтено/i;
const TC_HEAD=/^(={3,}|\*{3,}|▶|►|■|▌|—{2,})|^-{3,}\s*\S.*\S\s*-{3,}$|^[A-ZА-ЯЁ][A-ZА-ЯЁ0-9 _\/()-]{3,}:?$|^(Iface|Interface|Device|Name|Устройство|Интерфейс|Destination|Proto|Port|Адрес|Протокол|Узел|Host|Hostname|Address|Gateway|NAME|ID|PID|USER|Filesystem|VLAN|Prefix|Сеть|Маска|Шлюз|Таблица|Файл|Размер|Права)\b.*\S\s{2,}\S|^\S.{0,38}:$/;
const TC_DIM=/^\s*#|^[\s─━=\-_+|┌┐└┘├┤┬┴┼│]{3,}$/;
function tcClass(l){const s=l.trim();if(!s)return'';
 if(TC_DIM.test(l))return'dim';
 if(TC_ERR.test(s))return'err';
 if(TC_WARN.test(s))return'warn';
 if(TC_HEAD.test(s))return'head';
 if(TC_OK.test(s))return'ok';
 return''}
const TC_IN=/(\b\d{1,3}(?:\.\d{1,3}){3}(?:\/\d{1,2})?\b)|(\b[0-9a-f]{2}(?::[0-9a-f]{2}){5}\b)|(\badministratively down\b)|(\b(?:up|UP|Up)\b)|(\b(?:down|DOWN|Down)\b)/gi;
// части строки: [[текст, класс|'']]
function tcParts(l,base){if(base==='dim'||base==='head'||base==='err'&&/^%/.test(l.trim()))return[[l,'']];const r=[];let i=0,m;TC_IN.lastIndex=0;
 while((m=TC_IN.exec(l))){if(m.index>i)r.push([l.slice(i,m.index),'']);const c=m[1]?'ip':m[2]?'mac':m[3]?'warn':m[4]?'up':'dn';
  if(base==='err'&&(c==='up'||c==='dn')){r.push([m[0],''])}else r.push([m[0],'tl-'+c]);i=m.index+m[0].length}
 if(i<l.length)r.push([l.slice(i),''])
 return r}
function tcLine(l,withNl){const base=tcClass(l);const sp=document.createElement('span');if(base)sp.className='tl-'+base;
 tcParts(l,base).forEach(([t,c])=>{if(c){const e=document.createElement('span');e.className=c;e.textContent=t;sp.appendChild(e)}else sp.appendChild(document.createTextNode(t))});
 if(withNl)sp.appendChild(document.createTextNode('\n'));return sp}
// --- основная консоль
var tcEchoF=0;
function pAdd(t){t=String(t);const o=document.getElementById('out');if(!o)return;try{pAdd2(t,o)}catch(e){o.appendChild(document.createTextNode(t+'\n'))}}
function pAdd2(t,o){
 if(tcEchoF){const m=t.match(/^([^>]*> )([\s\S]*)$/);const f=document.createDocumentFragment();
  if(m){const a=document.createElement('span');a.className='tl-ps';a.textContent=m[1];const b=document.createElement('span');b.className='tl-cmd';b.textContent=m[2];f.append(a,b)}else f.appendChild(document.createTextNode(t));
  f.appendChild(document.createTextNode('\n'));o.appendChild(f);return}
 const L=t.split('\n');const f=document.createDocumentFragment();L.forEach((l,i)=>f.appendChild(tcLine(l,true)));o.appendChild(f)}
function pEcho(t){tcEchoF=1;try{p(t)}finally{tcEchoF=0}}
function pSnap(){const o=document.getElementById('out');const s=new String(o.textContent);s.h=o.innerHTML;return s}
function pRst(k){const o=document.getElementById('out');if(k&&k.h!==undefined)o.innerHTML=k.h;else o.textContent=String(k)}
// --- окно «Скрипты»
function sxColCmd(pr,line){return`<span class="tl-ps">${sxE(pr)}</span><span class="tl-cmd">${sxE(line)}</span>`}
function sxCol(text){return String(text).split('\n').map(l=>{const base=tcClass(l);const h=tcParts(l,base).map(([t,c])=>c?`<span class="${c}">${sxE(t)}</span>`:sxE(t)).join('');return base?`<span class="tl-${base}">${h}</span>`:h}).join('\n')}
// --- режимы и легенда
function tcSet(m){if(!TCM.includes(m))return false;tcMode=m;try{localStorage.setItem('nl_tc',m)}catch(e){}tcApply();return true}
function tcLegend(){pEcho('R1> ping 192.168.1.10');p('Reply from 192.168.1.10: bytes=32 time=1ms TTL=64');p('Цвета терминала ('+TCN[tcMode]+'):');
 p('  зелёное приглашение + жёлтая жирная команда — то, что ввели вы');
 p('  обычный цвет — вывод команды (текст, таблицы, содержимое файлов)');
 p('Ошибка: неизвестная команда — красный (ошибки, отказы, «недоступен»)');
 p('Предупреждение: проверьте настройки — оранжевый');
 p('Успешно: задание выполнено — зелёный (успех, ответы ping)');
 p('# комментарий и разделители — серый');
 p('Адреса: 10.0.0.1/24 · MAC aa:bb:cc:00:11:22 · eth0 up · eth1 down — подсвечиваются внутри строки');
 p('Режимы: colors on | colors hc (контрастные) | colors off');}
{const _r=run;run=function(c){const a=String(c).trim().split(/\s+/),cm=a[0].toLowerCase();
 if(cm==='colors'||cm==='цвета'||cm==='colours'){const x=(a[1]||'').toLowerCase();
  if(x&&x!=='legend'&&x!=='легенда'){const mm={on:'on',вкл:'on',hc:'hc',контраст:'hc',off:'off',выкл:'off'}[x];if(!mm)return p('Использование: colors [on|hc|off|legend]');tcSet(mm)}
  return tcLegend()}
 return _r(c)}}
// --- пункт меню «Справка»
(function(){const dd=document.querySelector('#mbar .mi[data-k="h"] .mdd');if(!dd||document.getElementById('bcol'))return;
 const b=document.createElement('button');b.id='bcol';b.type='button';b.textContent='Цвета терминала';b.setAttribute('role','menuitem');b.setAttribute('data-nohelp','1');b.setAttribute('data-d','Подсветка команд, ошибок и вывода: обычная / контрастная / выкл');
 b.onclick=()=>{tcSet(TCM[(TCM.indexOf(tcMode)+1)%3]);tcLegend()};
 const first=dd.querySelector('button');dd.insertBefore(b,first&&first.nextSibling?first.nextSibling:null)})();
tcApply();
MAN.push(['Т35. Цвета терминала',`<h3>Что каким цветом выводится</h3>
<p>Чтобы с первого взгляда отличать команду от результата, консоль Стектонии и терминал окна «Скрипты» раскрашивают вывод:</p>
<ul><li><b style="color:#5fd3a0">зелёное приглашение</b> и <b style="color:#e0b000">жёлтая жирная команда</b> — то, что вы ввели;</li>
<li>обычный цвет — результат команды: текст, таблицы, содержимое файлов;</li>
<li><span style="color:#ff6b6b">красный</span> — ошибки и отказы («Неизвестная команда», <code>% Invalid input</code>, <code>Permission denied</code>, «недоступен»);</li>
<li><span style="color:#ff9e64">оранжевый</span> — предупреждения;</li>
<li><span style="color:#56d364">зелёный</span> — успех («Успешно», <code>Reply from …</code>, «задание выполнено»);</li>
<li><b style="color:#d2a8ff">фиолетовый</b> — заголовки и шапки таблиц; <span style="color:#6e8294">серый</span> — комментарии <code>#</code> и разделители;</li>
<li>внутри строки подсвечиваются IP-адреса (синий), MAC-адреса (бирюзовый) и состояния <b style="color:#56d364">up</b> / <b style="color:#ff6b6b">down</b>.</li></ul>
<h3>Режимы</h3>
<p>Меню «Справка → Цвета терминала» по кругу переключает: обычные → контрастные → выключены. То же делает команда <code>colors on</code>, <code>colors hc</code>, <code>colors off</code>; просто <code>colors</code> (или <code>цвета</code>) покажет легенду. Выбор запоминается в браузере. Консоль всегда тёмная, поэтому палитра одинаково читается в светлой и тёмной теме интерфейса.</p>
<p>Раскраска только оформление: текст вывода не меняется, поэтому проверка заданий и копирование текста работают как раньше. Определение вида строки делается по её содержимому (эвристика), так что редкая строка может получить «чужой» цвет — тогда включите режим «выключены».</p>`]);
