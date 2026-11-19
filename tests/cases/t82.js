(function(){const R=[];const ok=(n,c,i)=>R.push((c?'PASS ':'FAIL ')+n+(c?'':' '+JSON.stringify(String(i||'')).slice(0,900)));
try{const sh=(c,n)=>{sel=byNm(n).id;const o=document.getElementById('out');o.textContent='';run(c);return o.textContent};
 const i=TPL.findIndex(t=>/^IPv6: OSPFv3/.test(t.n));ok('шаблон',i>=0);const bad=tplLoad(TPL[i]);ok('шаблон без ошибок',!bad.length,bad);
 const A=byNm('PC-A'),C=byNm('PC-C');ok('SLAAC на PC-A и PC-C',/^2001:db8:a:/.test(A.ifaces[0].ip6)&&/^2001:db8:c:/.test(C.ifaces[0].ip6),[A.ifaces[0].ip6,C.ifaces[0].ip6]);
 const ping=(a,b)=>{EX=[];return !!trip6(a,b.ifaces[0].ip6).ok};
 ok('PC-A → PC-C через OSPFv3',ping(A,C));ok('PC-C → PC-A',ping(C,A));
 ok('статических маршрутов нет, routes6 не загрязнён',byNm('R1').routes6===undefined||byNm('R1').routes6.length===0,byNm('R1').routes6);
 let t=sh('show ipv6 ospf neighbor','R2');ok('R2: два соседа FULL',(t.match(/FULL/g)||[]).length===2&&!/DOWN/.test(t),t);
 t=sh('show ipv6 route','R1');ok('R1: маршруты O до 2001:db8:c::/64 и 23::/64',/O\s+2001:db8:c::\/64/.test(t)&&/O\s+2001:db8:23::\/64/.test(t)&&/fe80/.test(t),t);
 ok('проблем нет',i6Problems().length===0,i6Problems());
 // ping с выключенным ospf3 на R2
 sh('ospf3 off','R2');ok('без OSPFv3 на R2 нет связи',!ping(A,C));sh('ospf3 on','R2');ok('снова есть связь',ping(A,C));
 // отдельные причины
 sh('ospf area gi0/1 1','R2');t=sh('show ipv6 ospf neighbor','R2');ok('область: DOWN с причиной',/DOWN/.test(t)&&/областей различаются/.test(t),t);ok('связи нет',!ping(A,C));
 ok('проверка видит область',i6Problems().some(x=>/OSPFv3 R2 ⇄ R3.*област/.test(x)||/OSPFv3 R2 ⇄ R3/.test(x)),i6Problems());sh('ospf area gi0/1 0','R2');
 sh('ospf mtu gi0/0 1400','R2');ok('MTU',/MTU/.test(sh('show ipv6 ospf neighbor','R2')));sh('ospf mtu gi0/0 1500','R2');
 sh('ospf passive gi0/0 on','R2');ok('passive',/passive/.test(sh('show ipv6 ospf neighbor','R2')));sh('ospf passive gi0/0 off','R2');
 sh('ospf3 rid 1.1.1.1','R2');ok('одинаковый Router ID',/одинаковый Router ID/.test(sh('show ipv6 ospf neighbor','R2')));sh('ospf3 rid 2.2.2.2','R2');
 ok('после исправлений связь восстановлена',ping(A,C)&&i6Problems().length===0,i6Problems());
 // сценарий
 o3Scenario();const pr=i6Problems();ok('сценарий: найдено ≥2 проблемы',pr.length>=2,pr);ok('сценарий: нет связи',!ping(byNm('PC-A'),byNm('PC-C')));
 ok('сценарий: R1 без Router ID',/нет Router ID/.test(pr.join('|')));
 sh('ospf3 rid 1.1.1.1','R1');ok('rid задан, hello всё ещё мешает',i6Problems().some(x=>/Hello/.test(x)),i6Problems());
 sh('ospf hello gi0/1 10','R2');ok('сценарий исправлен',i6Problems().length===0&&ping(byNm('PC-A'),byNm('PC-C')),i6Problems());
 // статический маршрут приоритетнее
 const r1=byNm('R1');r1.routes6=[{net:'2001:db8:c::',len:64,nh:'2001:db8:12::9'}];ok('статический маршрут с тем же префиксом сохраняется и приоритетен',!ping(byNm('PC-A'),byNm('PC-C')));r1.routes6=[];
 ok('после стат. маршрута динамические снова работают',ping(byNm('PC-A'),byNm('PC-C')));
 // панель и экзамен
 openMd(i6Panel());ok('панель: кнопка OSPFv3',!!document.querySelector('[data-o3b="scn"]'));document.querySelector('[data-o3b="scn"]').click();ok('кнопка запускает сценарий',i6Problems().length>=2);
 exSyncCustom();const q=EXQ.findIndex(x=>x.n.startsWith('IPv6: OSPFv3'));ok('экзамен: задание есть',q>=0);
 EXQ[q].start({});let sc=0,mx=0;EXQ[q].crit({}).forEach(([l,p,f])=>{mx+=p;if(f())sc+=p});ok('экзамен: до исправления <100',sc<mx&&mx===100,sc);
 sh('ospf3 rid 1.1.1.1','R1');sh('ospf hello gi0/1 10','R2');sc=0;EXQ[q].crit({}).forEach(([l,p,f])=>{if(f())sc+=p});ok('экзамен: после исправления 100',sc===100,sc);
 ok('MAN Т54',MAN.some(m=>/^Т54/.test(m[0])));
 // регрессия IPv6 шаблона
 const j=TPL.findIndex(t=>/^IPv6: RA/.test(t.n));ok('шаблон IPv6 всё ещё грузится',!tplLoad(TPL[j]).length&&byNm('PC3').ifaces[0].ip6==='2001:db8:2::100');
}catch(e){R.push('FAIL EXC '+e.stack)}
return R.join('\n')})();
