// ================= v17: NTP- и почтовый серверы, диагностика схемы (lint), задание 25, теория Т29 =================
Object.assign(IC,{
 ntp:`<circle class="ib" cx="24" cy="24" r="18"/><circle class="iscr" cx="24" cy="24" r="14"/><path class="ia" d="M24 12v12l8 5"/><circle class="ig" cx="24" cy="24" r="1.800"/>`,
 mail:`<rect class="ib" x="5" y="10" width="38" height="28" rx="3"/><path class="ia" d="M7 13l17 14 17-14"/>`
});
Object.assign(CAT,{
 ntp:{l:'NTP-сервер (точное время)',p:'NTP',i:'',t:'pc',n:1},
 mail:{l:'Почтовый сервер (SMTP/IMAP)',p:'Mail',i:'',t:'pc',n:1}});
NOTE.ntp='NTP-сервер (UDP/123) раздаёт точное время. Без единого времени журналы устройств нельзя сопоставить, а сертификаты, Kerberos и IPsec перестают работать. Клиентам: ntp <ip сервера>, проверка: ntp.';
NOTE.mail='Почтовый сервер: SMTP (TCP/25) принимает письма, IMAP (TCP/143) отдаёт их клиентам. Клиент: sendmail <ip> <текст>. На сервере: inbox — посмотреть принятые письма.';
Object.assign(WATT,{ntp:60,mail:300});
const _ad17=addDev;
addDev=function(k,x,y,n){
 if(k==='ntp'||k==='mail'){const d=_ad17('srv',x,y,n||(k==='ntp'?'NTP':'Mail')+((S.n[k]=(S.n[k]||0)+1)));d.ico=k;d.role=k;
  d.svc=(d.svc||[]).concat(k==='ntp'?[{p:'udp',n:123}]:[{p:'tcp',n:25},{p:'tcp',n:143}]);if(k==='mail')d.inbox=[];ch();return d}
 return _ad17(k,x,y,n)};
['ntp','mail'].forEach(k=>{$('#ad').insertAdjacentHTML('beforeend',`<option value="${k}">${CAT[k].l}</option>`)});
$('#adp').innerHTML=(()=>{let h='';for(const k in CAT){const c=CAT[k];if(c.g)h+=`<h5>${c.g}</h5>`;h+=`<button type="button" data-k="${k}">${icoSvg(k,30)}<span>${c.l}</span></button>`}return h})();
// ---- диагностика схемы ----
function lintNet(){const r=[],ips={};
 S.devs.forEach(d=>d.ifaces.forEach(f=>{if(!f.ip)return;(ips[f.ip]=ips[f.ip]||[]).push(d.name+':'+f.n)}));
 for(const ip in ips)if(ips[ip].length>1)r.push(`✖ Повтор IP-адреса ${ip}: ${ips[ip].join(', ')}`);
 S.devs.forEach(d=>{const K=kind(d);
  if(d.t==='pc'&&d.gw){const f=d.ifaces.find(x=>x.ip&&x.mask);if(f){const m=ip2n(f.mask),a=ip2n(f.ip),g=ip2n(d.gw);if(g==null)r.push(`✖ ${d.name}: неверный адрес шлюза «${d.gw}»`);else if((a&m)>>>0!==(g&m)>>>0)r.push(`✖ ${d.name}: шлюз ${d.gw} вне подсети ${f.ip}/${plen(f.mask)}`)}}
  if(d.t==='pc'&&!d.ifaces.some(x=>x.ip)&&!d.ifaces.some(x=>x.dhcp)&&K!=='ups'&&!['cam','ph','ipp'].includes(K))r.push(`⚠ ${d.name}: нет IP-адреса`);
  if(d.ifaces.length&&!S.links.some(l=>l.a===d.id||l.b===d.id)&&K!=='ups')r.push(`⚠ ${d.name}: не подключено ни одним кабелем`)});
 return r}
const _run17=run;
run=function(c){const s=c.trim();if(!s)return _run17(c);
 const a=s.split(/\s+/),cm=a[0].toLowerCase();
 if(cm==='lint'||cm==='doctor'){const r=lintNet();return p(r.length?`Найдено замечаний: ${r.length}\n`+r.join('\n'):'✔ Явных ошибок адресации и подключения не найдено (повтор IP, шлюз вне подсети, узлы без IP и кабеля)')}
 const d=sel&&dv(sel);
 if(!d)return _run17(c);
 if(cm==='ntp'&&d.k!=='srv'||cm==='ntp'&&d.role!=='ntp'){
  if(a[1]==='off'){delete d.ntp;ch();return p('Синхронизация времени выключена')}
  if(a[1]){if(ip2n(a[1])==null)return p('Использование: ntp <ip сервера>|off');d.ntp=a[1];ch()}
  if(!d.ntp)return p('NTP не настроен. Пример: ntp 192.168.1.7');
  const r=l4(d,d.ntp,'udp',123);return p(r.ok?`✔ Время синхронизировано с ${d.ntp} (NTP, UDP/123). Все журналы устройства теперь согласованы по времени.`:`✖ Сервер ${d.ntp} недоступен: время не синхронизировано (stratum 16). ${r.msg||''}`)}
 if(cm==='sendmail'){if(ip2n(a[1]||'')==null)return p('Использование: sendmail <ip почтового сервера> [текст письма]');
  const r=l4(d,a[1],'tcp',25);if(!r.ok)return p('✖ Письмо не отправлено: '+(r.msg||'порт 25 недоступен'));
  const t=devByIp(a[1]);if(t&&t.role==='mail'){(t.inbox=t.inbox||[]).push({from:d.name,t:Date.now(),x:a.slice(2).join(' ')||'(без текста)'});ch();return p(`✔ SMTP: письмо принято сервером ${t.name} (250 OK).`)}
  return p('⚠ Порт 25 открыт, но это не почтовый сервер Стектония.')}
 if(cm==='inbox'){if(d.role!=='mail')return p('inbox выполняется на почтовом сервере');return p((d.inbox||[]).map((m,i)=>`${i+1}. ${hhmm(m.t)} от ${m.from}: ${m.x}`).join('\n')||'Ящик пуст: на клиенте выполните sendmail '+(srcIp(d)||'<ip сервера>')+' Привет')}
 return _run17(c)};
CMDS.push(
['ntp','ntp <ip сервера>|off','Синхронизация времени с NTP-сервером и проверка','Одинаковое время нужно для журналов, сертификатов, Kerberos и IPsec. Проверка идёт по UDP/123 через всю схему (учитываются маршруты и ACL).','ntp 192.168.1.7','Службы'],
['sendmail','sendmail <ip сервера> [текст]','Отправить письмо на почтовый сервер (SMTP, TCP/25)','Проверка доступности почты из разных сегментов сети; межсетевой экран должен пропускать порт 25.','sendmail 10.0.0.5 Привет','Службы'],
['inbox','inbox','Показать письма, принятые почтовым сервером','Подтверждает, что письмо дошло до сервера, а не просто порт был открыт.','inbox','Службы'],
['lint','lint','Автодиагностика схемы: повтор IP, шлюз вне подсети, узлы без адреса и кабеля','Первый шаг при поиске неисправности — исключить банальные ошибки адресации.','lint','Обзор']);
CMDS.forEach(c=>{if(!CMDNAMES.includes(c[0]))CMDNAMES.push(c[0])});
// ---- задание 25 ----
TASKS.push({t:'25. Службы времени и почты',d:'Постройте сеть: коммутатор, ПК PC1, NTP-сервер (имя NTP1) и почтовый сервер (Mail1) в одной подсети. На PC1 выполните ntp <ip NTP1> и sendmail <ip Mail1> Привет. Результат: время синхронизируется, а в inbox на Mail1 есть письмо. Теория: NTP (UDP/123), SMTP (TCP/25).',c:[['PC1','NTP1',1,'udp',123],['PC1','Mail1',1,'tcp',25]],fn:()=>{
  const pc=byNm('PC1'),n=byNm('NTP1'),m=byNm('Mail1');if(!pc||!n||!m)return[false,'нужны устройства PC1, NTP1 (NTP-сервер) и Mail1 (почтовый сервер)'];
  if(n.role!=='ntp'||m.role!=='mail')return[false,'NTP1 должен быть NTP-сервером, а Mail1 — почтовым сервером (добавьте их из списка устройств)'];
  if(pc.ntp!==srcIp(n))return[false,'на PC1 не настроена синхронизация: ntp '+(srcIp(n)||'<ip NTP1>')];
  if(!l4(pc,srcIp(n),'udp',123).ok)return[false,'сервер NTP1 недоступен с PC1'];
  if(!(m.inbox||[]).length)return[false,'на Mail1 нет писем: на PC1 выполните sendmail '+(srcIp(m)||'<ip Mail1>')+' Привет'];
  return[true,'время синхронизируется, письмо доставлено']}});
syncTasks();
// ---- теория Т29 ----
{const th=['Т29. Сетевые службы: время, почта, журналы и диагностика',`
<h4>Зачем сети единое время</h4>
<p>Журналы маршрутизатора, межсетевого экрана и сервера сопоставляют по меткам времени. Если часы расходятся на минуты, восстановить цепочку событий при инциденте невозможно. От времени зависят сертификаты (TLS), протокол Kerberos (допуск расхождения обычно 5 минут), одноразовые коды и туннели IPsec.</p>
<p><b>NTP</b> работает по UDP/123 и использует иерархию <i>stratum</i>: stratum 0 — эталон (GPS, атомные часы), stratum 1 — серверы, подключённые к эталону, дальше каждый уровень на единицу ниже. Внутри организации обычно держат один-два локальных NTP-сервера, а клиенты и сетевое оборудование синхронизируются с ними.</p>
<h4>Почта: SMTP и IMAP</h4>
<p><b>SMTP</b> (TCP/25, для клиентов обычно 587) передаёт письма от клиента на сервер и между серверами. <b>IMAP</b> (TCP/143, 993 с шифрованием) и <b>POP3</b> (TCP/110) нужны, чтобы клиент забрал письма. Доставка между доменами опирается на DNS: запись MX указывает, какой сервер принимает почту домена. Для защиты от подделки отправителя настраивают SPF, DKIM и DMARC.</p>
<h4>Как проверить службу в Стектонии</h4>
<ul><li><code>ntp &lt;ip&gt;</code> — клиент проверяет доступность NTP-сервера по UDP/123 через всю схему.</li><li><code>sendmail &lt;ip&gt; текст</code> и <code>inbox</code> — проверка SMTP-доставки.</li><li>Закройте порт ACL или межсетевым экраном — и проверка покажет, на каком уровне «сломалось».</li></ul>
<h4>Автодиагностика</h4>
<p>Команда <code>lint</code> находит типовые ошибки: повторяющийся IP, шлюз вне подсети, узел без адреса или кабеля. Порядок поиска неисправности: физика (кабель, питание) → канал (VLAN, STP) → сеть (IP, шлюз, маршрут) → транспорт (порт, ACL) → служба.</p>
<div class="tip"><b>Практика:</b> выполните задание 25, затем добавьте ACL, запрещающий UDP/123, и убедитесь, что <code>ntp</code> перестаёт работать.</div>`];
 const i17=MAN.findIndex(x=>x[0].startsWith('17.'));MAN.splice(i17<0?MAN.length-1:i17,0,th)}
// ---- Wi‑Fi роутер: клиентов и серверов кабель подключает в LAN-порт, а не в WAN (gi0/0) ----
{const _cn17=connect;
 connect=function(a,b){if(a===b)return;const A=dv(a),B=dv(b);if(!A||!B)return _cn17(a,b);
  const lan=(X,Y)=>X.k==='wr'&&!['rt','l3','fw','wr'].includes(kind(Y));
  if(!lan(A,B)&&!lan(B,A))return _cn17(a,b);
  const free=(X,from)=>X.ifaces.findIndex((f,i)=>i>=from&&!f.radio&&!f.wifi&&!peer(X,i)&&f.n!=='wlan0');
  const ia=lan(A,B)?free(A,1):A.ifaces.findIndex((_,i)=>!peer(A,i)),ib=lan(B,A)?free(B,1):B.ifaces.findIndex((_,i)=>!peer(B,i));
  if(ia<0||ib<0){p('Нет свободных портов на '+(ia<0?A.name:B.name));return}
  link(A,ia,B,ib);p(`Кабель: ${A.name} ${A.ifaces[ia].n} ⇄ ${B.name} ${B.ifaces[ib].n}`+((lan(A,B)&&ia>0||lan(B,A)&&ib>0)?' (LAN-порт Wi‑Fi роутера; WAN – gi0/0 – для кабеля от провайдера/маршрутизатора)':''));ch()}}
