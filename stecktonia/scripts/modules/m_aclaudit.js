// ===== m_aclaudit (v102): аудит ACL — перекрытые и избыточные правила, проверка пути пакета, удаление и перенос правил =====
const aaRules=d=>(Array.isArray(d.acl)?d.acl:[]).filter(r=>r&&typeof r==='object'&&ip2n(r.sn)!=null&&ip2n(r.sm)!=null&&ip2n(r.dn)!=null&&ip2n(r.dm)!=null);
const aaNetCov=(an,am,bn,bm)=>plen(am)<=plen(bm)&&same(bn,an,am);
const aaCov=(A,B)=>aaNetCov(A.sn,A.sm,B.sn,B.sm)&&aaNetCov(A.dn,A.dm,B.dn,B.dm)&&(!A.pr||A.pr===B.pr)&&(!A.pt||(A.pr===B.pr&&A.pt===B.pt));
function aaMatch(d,s,t,pr,pt){const R=aaRules(d);for(let i=0;i<R.length;i++){const r=R[i];if(same(s,r.sn,r.sm)&&same(t,r.dn,r.dm)&&(!r.pr||r.pr===pr)&&(!r.pt||r.pt===pt))return{i,r,a:r.a}}return{i:-1,r:null,a:'permit'}}
function aaAudit(d){const R=aaRules(d),F=[];
 R.forEach((B,j)=>{for(let i=0;i<j;i++){const A=R[i];if(aaCov(A,B)){F.push({j,i,k:A.a===B.a?'dup':'dead'});break}}});return F}
const aaTxt=r=>r.txt||`${r.a} ${r.sn}/${plen(r.sm)} → ${r.dn}/${plen(r.dm)}${r.pr?' '+r.pr+(r.pt?'/'+r.pt:''):''}`;
function aaShow(d,io){const R=aaRules(d);if(!R.length)return io('Правил нет: разрешено всё (в модели Стектонии, в отличие от Cisco, неявного deny нет).');
 const F=aaAudit(d),by={};F.forEach(f=>by[f.j]=f);io('Аудит ACL на '+d.name+' (правила проверяются сверху вниз, срабатывает первое совпавшее):');
 R.forEach((r,j)=>{const f=by[j];io(` ${j+1}. ${aaTxt(r)}`+(f?(f.k==='dup'?`   ⚠ избыточно: уже покрыто правилом ${f.i+1} с тем же действием`:`   ✖ никогда не сработает: перекрыто правилом ${f.i+1} с противоположным действием`):''))});
 const last=R[R.length-1];
 if(!F.length)io('Перекрытых и избыточных правил нет.');else io(`Найдено проблем: ${F.length}. Удалите лишнее (acl del N) или переставьте правила (acl move N M): конкретные правила должны стоять выше общих.`);
 if(R.some((r,j)=>r.a==='permit'&&plen(r.sm)===0&&plen(r.dm)===0&&!r.pr&&j<R.length-1))io('Подсказка: «permit any any» не в конце списка закрывает все правила ниже.');
 if(!R.some(r=>r.a==='deny'))io('Подсказка: в списке нет ни одного deny — фильтрация ничего не запрещает.');
 else if(last.a!=='deny'||plen(last.sm)||plen(last.dm))io('Напоминание: если ни одно правило не подошло, пакет разрешается (неявный permit).')}
function aaTest(d,a,io){const s=a[0],t=a[1],pr=/^(tcp|udp)$/.test(a[2]||'')?a[2]:'',pt=pr?+a[3]||0:0;
 if(ip2n(s)==null||ip2n(t)==null)return io('Использование: acl test <ip источника> <ip назначения> [tcp|udp <порт>]');
 const m=aaMatch(d,s,t,pr||'icmp',pt);io(`Пакет ${s} → ${t}${pr?' '+pr+'/'+pt:' (icmp)'}: `+(m.i<0?'ни одно правило не подошло → разрешено (неявный permit)':`правило ${m.i+1} «${aaTxt(m.r)}» → ${m.a==='deny'?'ЗАПРЕЩЕНО':'разрешено'}`))}
{const _r=run;run=function(c){const a=String(c||'').trim().split(/\s+/),w=a.map(x=>x.toLowerCase()),d=sel&&dv(sel);
 if(d&&d.t==='rt'&&w[0]==='acl'&&['audit','test','del','move'].includes(w[1])){
  if(w[1]==='audit')return aaShow(d,p);
  if(w[1]==='test')return aaTest(d,a.slice(2),p);
  const n=+a[2],L=Array.isArray(d.acl)?d.acl:[];
  if(!Number.isInteger(n)||n<1||n>L.length)return p('Номер правила от 1 до '+L.length+' (acl — список правил)');
  if(w[1]==='del'){const r=L.splice(n-1,1)[0];ch();return p('Удалено правило '+n+': '+aaTxt(r))}
  const m=+a[3];if(!Number.isInteger(m)||m<1||m>L.length)return p('Использование: acl move <номер> <новая позиция 1–'+L.length+'>');
  const r=L.splice(n-1,1)[0];L.splice(m-1,0,r);ch();return p('Правило перенесено на позицию '+m+'. Проверьте результат: acl audit');}
 return _r(c)}}
CMDS.push(['acl audit · acl test <src> <dst> [tcp|udp порт] · acl del <N> · acl move <N> <M>','Аудит ACL: перекрытые и избыточные правила, проверка пути пакета, удаление и перенос правил','Аудит ACL маршрутизатора','acl audit показывает правила с пометками: избыточное (покрыто более ранним правилом с тем же действием) и «никогда не сработает» (перекрыто правилом с противоположным действием). acl test определяет, какое правило применится к пакету. Порядок важен: конкретные правила выше общих. Учебная модель: неявного deny в конце нет.']);
const aaBase=()=>({dev:[['pc','PC-A',40,200],['rt','R1',260,200],['pc','SRV',480,200]],link:[['PC-A',0,'R1',0],['R1',1,'SRV',0]],
 cfg:[['PC-A','ip eth0 192.168.1.10 /24','gateway 192.168.1.1'],['SRV','ip eth0 192.168.2.10 /24','gateway 192.168.2.1'],
  ['R1','ip gi0/0 192.168.1.1 /24','ip gi0/1 192.168.2.1 /24','acl permit any any','acl deny 192.168.1.0/24 192.168.2.0/24 tcp 22','acl deny 192.168.1.0/24 192.168.2.0/24 tcp 22']]});
TPL.push(Object.assign({n:'ACL: аудит правил фильтрации',d:'На R1 список правил с ошибками: «permit any any» стоит первым и перекрывает запрет SSH, а запрет записан дважды. Найдите проблемы командой acl audit и исправьте.',hint:'Выполните acl audit на R1 и acl test 192.168.1.10 192.168.2.10 tcp 22. Затем acl move или acl del, чтобы запрет SSH сработал, а HTTP и ping остались разрешены. Повторите acl audit до чистого результата.'},aaBase()));
if(typeof EXNET!=='undefined')EXNET.push({n:'ACL: исправить список правил',min:15,tag:'Безопасность',init:r=>({}),start:c=>{tplLoad(Object.assign({n:'ACL',hint:''},aaBase()));p('На R1 настроен список правил с ошибками. Исправьте его.')},
 text:c=>'С компьютера PC-A (192.168.1.10) должен быть запрещён доступ к серверу SRV (192.168.2.10) по SSH (tcp 22), а HTTP (tcp 80) и ping должны работать. Исправьте список правил на R1: уберите избыточные правила и добейтесь, чтобы acl audit не находил проблем. Новых permit-правил для всего трафика добавлять не нужно.',
 crit:c=>{const R1=byNm('R1'),A='192.168.1.10',S='192.168.2.10',ssh=()=>aaMatch(R1,A,S,'tcp',22).a==='deny',web=()=>aaMatch(R1,A,S,'tcp',80).a==='permit',png=()=>aaMatch(R1,A,S,'icmp',0).a==='permit';
  return[['SSH с PC-A на SRV запрещён',30,()=>ssh()],['Запрет SSH не ломает HTTP',20,()=>ssh()&&web()],['Запрет SSH не ломает ping',10,()=>ssh()&&png()],
  ['acl audit не находит перекрытых и избыточных правил',20,()=>aaRules(R1).length>0&&aaAudit(R1).length===0&&ssh()],
  ['«permit any any» не стоит выше остальных правил',20,()=>{const L=aaRules(R1);return ssh()&&!L.some((r,j)=>r.a==='permit'&&!plen(r.sm)&&!plen(r.dm)&&!r.pr&&j<L.length-1)}]]}});
MAN.push(['Т70. Аудит ACL: порядок правил',`<p><b>Порядок решает всё.</b> Правила фильтрации проверяются сверху вниз, срабатывает первое совпавшее. Если выше стоит более общее правило, нижнее не сработает никогда. Самая частая ошибка – «permit any any» в начале или в середине списка: все запреты ниже превращаются в мёртвый код.</p>
<p><b>Два вида проблем.</b> <i>Избыточное</i> правило полностью покрыто более ранним с тем же действием (например, запрет записан дважды). <i>Перекрытое</i> правило покрыто более ранним с противоположным действием и не сработает вообще – обычно это ошибка порядка.</p>
<p><b>Команды Стектонии.</b> <code>acl audit</code> – показать правила с пометками; <code>acl test 192.168.1.10 192.168.2.10 tcp 22</code> – какое правило применится к пакету; <code>acl del N</code> – удалить; <code>acl move N M</code> – переставить. Правило: конкретное выше общего, общий «permit» – в конце.</p>
<p><b>Ограничения модели.</b> Если правило не подошло, пакет разрешается (в реальных системах обычно действует неявный deny). Анализ учитывает сети, протокол и порт, но не диапазоны портов и флаги соединения.</p>`]);
