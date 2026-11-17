// ===== m_stpx (v108): разбор STP — выбор корня, стоимость пути, корневые и заблокированные порты с причинами =====
function sxInfo(){stp();const sw=S.devs.filter(d=>d.t==='sw'&&d.k!=='hub'),ids=new Set(sw.map(d=>d.id)),cost=(typeof STPC!=='undefined'&&STPC)||{};
 const L=S.links.map((l,k)=>({...l,k})).filter(l=>ids.has(l.a)&&ids.has(l.b)&&dv(l.a)&&dv(l.b)&&dv(l.a).ifaces[l.ai]&&dv(l.b).ifaces[l.bi]&&!dv(l.a).ifaces[l.ai].off&&!dv(l.b).ifaces[l.bi].off);
 L.forEach(l=>{l.c=scost(Math.min(dv(l.a).ifaces[l.ai].spd||1000,dv(l.b).ifaces[l.bi].spd||1000,cabCap(l)))});
 const rp={};sw.forEach(u=>{if(ROOT[u.id]===u.id)return;let best=null;L.forEach(l=>{if(l.a!==u.id&&l.b!==u.id)return;const vid=l.a===u.id?l.b:l.a,v=dv(vid),pi=l.a===u.id?l.ai:l.bi;if(ROOT[vid]!==ROOT[u.id]||cost[vid]===undefined)return;const tot=cost[vid]+l.c;
  if(!best||tot<best.tot||(tot===best.tot&&(bless(v,best.v)||(v===best.v&&pi<best.pi))))best={tot,v,pi,l}});if(best)rp[u.id]=best});
 return{sw,L,cost,rp}}
const sxBid=d=>`${d.prio||32768}/${d.mac}`;
function sxShow(io){const I=sxInfo();if(!I.sw.length)return io('На схеме нет управляемых коммутаторов.');if(S.nostp)io('⚠ STP отключён: петли в схеме вызовут широковещательный шторм.');
 io('Коммутатор  Роль         Bridge ID (приоритет/MAC)    Стоимость до корня  Корневой порт');
 I.sw.forEach(d=>{const root=ROOT[d.id]===d.id,r=I.rp[d.id];io(`${d.name.padEnd(11)} ${(root?'корневой':'некорневой').padEnd(12)} ${sxBid(d).padEnd(28)} ${String(I.cost[d.id]===undefined?'—':I.cost[d.id]).padEnd(19)} ${root?'—':r?d.ifaces[r.pi].n+' → '+r.v.name:'—'}`)});
 const B=[...BLK].map(k=>k.split(':')).filter(k=>dv(k[0]));io(B.length?'Заблокированы: '+B.map(k=>dv(k[0]).name+' '+dv(k[0]).ifaces[+k[1]].n).join(', '):'Заблокированных портов нет (петель нет).');io('Подробности: stp explain')}
function sxExplain(io){const I=sxInfo();if(!I.sw.length)return io('На схеме нет управляемых коммутаторов.');if(S.nostp)io('⚠ STP отключён (nostp): блокировки не применяются, петля вызовет шторм.');
 const roots=[...new Set(I.sw.map(d=>ROOT[d.id]))].filter(Boolean);
 roots.forEach(rid=>{const r=dv(rid),M=I.sw.filter(d=>ROOT[d.id]===rid),pr=r.prio||32768,lower=M.filter(d=>d!==r),why=M.length===1?'единственный коммутатор в этой части сети':lower.every(d=>(d.prio||32768)>pr)?`у него наименьший приоритет (${pr}) среди ${M.length} коммутаторов`:`приоритеты равны (${pr}), побеждает наименьший MAC-адрес ${r.mac}`;
  io(`Корневой мост${roots.length>1?' (отдельная часть сети)':''}: ${r.name}, Bridge ID ${sxBid(r)} – ${why}.`);
  M.filter(d=>d!==r).forEach(d=>{const x=I.rp[d.id];io(x?`  ${d.name}: корневой порт ${d.ifaces[x.pi].n} (к ${x.v.name}); стоимость пути до корня ${I.cost[d.id]}`:`  ${d.name}: корневой порт не определён`)})});
 io('Стоимость канала: 2 для 10 Гбит/с, 4 для 1 Гбит/с, 19 для 100 Мбит/с, 100 для 10 Мбит/с; стоимости суммируются по пути до корня.');
 const B=[...BLK].map(k=>k.split(':')).filter(k=>dv(k[0])&&dv(k[0]).ifaces[+k[1]]);
 if(!B.length)io('Блокировок нет: в схеме нет петель между коммутаторами (или STP отключён).');
 B.forEach(([id,pi])=>{const d=dv(id),f=d.ifaces[+pi],l=S.links.find(l=>(l.a===id&&l.ai===+pi)||(l.b===id&&l.bi===+pi));if(!l)return;const oid=l.a===id?l.b:l.a,o=dv(oid);if(!o)return;const cd=I.cost[id],co=I.cost[oid];
  io(`Заблокирован порт ${d.name} ${f.n} (к ${o.name}): этот канал создаёт петлю. `+(cd!==undefined&&co!==undefined&&cd!==co?`${d.name} дальше от корня (стоимость ${cd}), чем ${o.name} (${co}), поэтому блокируется порт на более удалённом коммутаторе.`:`Стоимость пути до корня одинакова, поэтому блокируется порт коммутатора с большим Bridge ID (${sxBid(d)} против ${sxBid(o)}).`))});
 io('Чтобы изменить выбор: stp priority <число> на нужном коммутаторе (меньше – главнее, по умолчанию 32768). Простой способ сделать коммутатор корневым – задать ему наименьший приоритет.')}
{const _r=run;run=function(c){const a=String(c||'').trim().split(/\s+/),w=a.map(x=>x.toLowerCase());
 if(w[0]==='stp'&&(w[1]==='show'||w[1]==='explain'))return w[1]==='show'?sxShow(p):sxExplain(p);
 if(w[0]==='show'&&w[1]==='spanning-tree'&&!w[2])return sxShow(p);
 return _r(c)}}
CMDS.push(['stp show · stp explain · show spanning-tree','Разбор STP: корневой мост и причина выбора, корневые порты, стоимости путей, заблокированные порты и причины блокировки','Разбор STP','stp show – таблица коммутаторов (роль, Bridge ID, стоимость до корня, корневой порт) и список заблокированных портов; stp explain – пояснения: почему выбран корень (приоритет, затем MAC), как считается стоимость, почему заблокирован именно этот порт. Изменить приоритет: stp priority <число>.']);
const sxScn=()=>({dev:[['pc','PC-A',40,100],['pc','PC-C',40,320],['sw','SW1',240,100],['sw','SW2',420,210],['sw','SW3',240,320]],link:[['SW1',0,'SW2',0],['SW2',1,'SW3',0],['SW1',1,'SW3',1],['PC-A',0,'SW1',2],['PC-C',0,'SW3',2]],cfg:[['SW1','stp priority 4096']]});
TPL.push(Object.assign({n:'STP: разбор выбора корня и блокировок',d:'Три коммутатора в кольце. Сейчас корнем стал SW1 (приоритет 4096). Разберите выбор командами stp show и stp explain и сделайте корневым SW2 так, чтобы заблокирован был порт SW3 на канале к SW1.',hint:'Выполните stp explain на любом коммутаторе. Затем на SW2 задайте stp priority 4096, на SW1 – 8192, оставьте SW3 по умолчанию (32768) и снова выполните stp explain: блокируется порт коммутатора с большим Bridge ID на канале SW1–SW3.'},sxScn()));
if(typeof EXNET!=='undefined')EXNET.push({n:'STP: корень SW2 и блокировка порта SW3',min:15,tag:'Коммутация',init:r=>({}),start:c=>{tplLoad(Object.assign({n:'STP',hint:''},sxScn()));p('Три коммутатора в кольце, корнем сейчас стал SW1. Настройте приоритеты.')},
 text:c=>'В кольце из трёх коммутаторов корневым мостом должен быть SW2, а единственным заблокированным портом – порт SW3 на канале к SW1 (чтобы канал SW1–SW3 был резервным, а трафик шёл через SW2). Настройте приоритеты командой stp priority. PC-A и PC-C должны пинговать друг друга (адреса настройте самостоятельно из одной сети).',
 crit:c=>{const S1=byNm('SW1'),S2=byNm('SW2'),S3=byNm('SW3'),A=byNm('PC-A'),C=byNm('PC-C'),st=()=>{stp()},ln=S.links.find(l=>(l.a===S1.id&&l.b===S3.id)||(l.a===S3.id&&l.b===S1.id)),
  bl=()=>{st();return[...BLK]},pi=()=>ln?(ln.a===S3.id?ln.ai:ln.bi):-1;
  return[['Корневой мост – SW2',30,()=>{st();return ROOT[S2.id]===S2.id&&ROOT[S1.id]===S2.id&&ROOT[S3.id]===S2.id}],
  ['Заблокирован порт SW3 на канале к SW1 и больше ничего',40,()=>{const b=bl();return b.length===1&&b[0]===S3.id+':'+pi()}],
  ['Приоритет SW2 задан явно (меньше, чем у остальных)',10,()=>(S2.prio||32768)<(S1.prio||32768)&&(S2.prio||32768)<(S3.prio||32768)],
  ['PC-A → PC-C',20,()=>{st();const f=C.ifaces[0];if(!f||!f.ip||!A.ifaces[0].ip||ROOT[S2.id]!==S2.id)return false;computeRip();EX=[];return!!trip(A,f.ip).ok}]]}});
MAN.push(['Т75. STP: выбор корня, стоимость пути и блокировка портов',`<p><b>Как работает STP.</b> 1) Коммутаторы выбирают <i>корневой мост</i> – с наименьшим Bridge ID: сначала приоритет (по умолчанию 32768), при равенстве – наименьший MAC-адрес. 2) Каждый некорневой коммутатор выбирает <i>корневой порт</i> – с наименьшей суммарной стоимостью пути до корня (1 Гбит/с – 4, 100 Мбит/с – 19, 10 Гбит/с – 2; стоимости складываются по пути). 3) В петле блокируется порт на коммутаторе, который дальше от корня; при равенстве – на коммутаторе с большим Bridge ID.</p>
<p><b>Почему это важно.</b> Корень по умолчанию определяется случайным MAC-адресом – им может стать старый коммутатор на краю сети. Поэтому корень назначают явно: <code>stp priority 4096</code> на выбранном коммутаторе (меньше – главнее).</p>
<p><b>Команды Стектонии.</b> <code>stp show</code> – таблица ролей, стоимостей и заблокированных портов; <code>stp explain</code> – пояснения причин; <code>stp priority N</code> – задать приоритет текущему коммутатору. Есть шаблон «STP: разбор выбора корня и блокировок» и экзаменационное задание «STP: корень SW2 и блокировка порта SW3».</p>
<p><b>Ограничения модели.</b> Моделируется классический выбор корня, корневых и заблокированных портов; состояния прослушивания и обучения, BPDU-таймеры и сходимость RSTP по времени не воспроизводятся. Агрегированные каналы учитываются в расчёте, но stp explain показывает их приближённо.</p>`]);
