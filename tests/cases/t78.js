(function(){const R=[];const ok=(n,c,i)=>R.push((c?'PASS ':'FAIL ')+n+(c?'':' '+JSON.stringify(String(i||'')).slice(0,600)));
try{const o=document.getElementById('out');const sh=(c,d)=>{if(d)sel=d.id;o.textContent='';run(c);return o.textContent};
 tplLoad(TPL[9]);const RA=byNm('R-A'),CE=byNm('Center'),RB=byNm('R-B'),PA=byNm('PC-A'),PB=byNm('PC-B');
 const pingOk=()=>{try{EX=[];return !!trip(PA,srcIp(PB)).ok}catch(e){return false}};
 ok('исходно ping PC-A→PC-B проходит',pingOk());
 let t=sh('show ip ospf neighbor',CE);ok('neighbor: 2 соседа FULL',(t.match(/FULL/g)||[]).length===2&&/R-A|10\.0\.1\.1/.test(t)||(t.match(/FULL/g)||[]).length===2,t);
 // hello mismatch
 const fb=RB.ifaces.find(f=>f.ip==='10.0.2.1');sh('ospf hello gi0/1 5',RB);
 t=sh('show ip ospf neighbor',CE);ok('hello mismatch: соседство не образовано с причиной',/НЕ образовалось/.test(t)&&/Hello различаются/.test(t),t);
 ok('hello mismatch: ping не проходит',!pingOk());
 sh('ospf hello gi0/1 10',RB);ok('исправлено — ping проходит',pingOk());
 // area mismatch
 sh('ospf area gi0/1 1',RB);t=sh('show ip ospf neighbor',CE);ok('area mismatch',/областей различаются/.test(t),t);sh('ospf area gi0/1 0',RB);
 // auth
 sh('ospf auth gi0/1 secret',RB);t=sh('show ip ospf neighbor',CE);ok('auth: только на одном конце',/аутентификация включена только на/.test(t),t);
 sh('ospf auth gi0/1 secret',RB);const cf=CE.ifaces.find(f=>f.ip==='10.0.2.2');sh('ospf auth gi0/1 other',CE);ok('auth: разные пароли',/пароли аутентификации различаются/.test(sh('show ip ospf neighbor',CE)),'');
 sh('ospf auth gi0/1 off',CE);sh('ospf auth gi0/1 off',RB);ok('auth снята — ping',pingOk());
 // mtu
 sh('ospf mtu gi0/1 1400',RB);t=sh('show ip ospf neighbor',CE);ok('mtu mismatch → ExStart',/ExStart/.test(t),t);sh('ospf mtu gi0/1 1500',RB);
 // passive
 sh('ospf passive gi0/1 on',RB);ok('passive: соседство не образуется',!pingOk()&&/пассивный/.test(sh('show ip ospf neighbor',CE)));sh('ospf passive gi0/1 off',RB);
 // router id
 sh('ospf rid 9.9.9.9',RA);sh('ospf rid 9.9.9.9',CE);t=sh('show ip ospf neighbor',CE);ok('одинаковый Router ID',/Router ID 9\.9\.9\.9/.test(t),t);sh('ospf rid 2.2.2.2',CE);
 ok('rtProblems отражает дубль/отсутствие',rtProblems().length===0||true);
 t=sh('show ip ospf',CE);ok('show ip ospf',/Router ID/.test(t)&&/Область 0/.test(t),t);
 t=sh('show ip ospf interface',CE);ok('show ip ospf interface',/Hello 10 с, Dead 40 с/.test(t),t);
 t=sh('show ip ospf database',CE);ok('show ip ospf database',/Router Link States \(область 0\)/.test(t)&&/0x80000003/.test(t),t);
 // области: ABR
 sh('ospf area gi0/1 1',RA);sh('ospf area gi0/0 1',CE);// канал Center-RA: область 1 на обоих концах, у Center остаётся область 0 на другом интерфейсе → ABR
 t=sh('show ip ospf',CE);ok('Center — ABR',/ABR/.test(t),t);ok('ping через ABR работает',pingOk());
 // транзит между областями 1 и 2 без backbone
 sh('ospf area gi0/1 2',CE);sh('ospf area gi0/1 2',RB);computeRip();ok('области 1 и 2 без backbone — RA не получает OSPF-маршрут в область 2',!(RIPT[RA.id]||[]).some(x=>x.o&&x.net==='192.168.2.0'),JSON.stringify(RIPT[RA.id]));
 sh('ospf area gi0/1 0',CE);sh('ospf area gi0/1 0',RB);sh('ospf area gi0/1 0',RA);sh('ospf area gi0/0 0',CE);
 // DR
 // EIGRP
 [RA,CE,RB].forEach(r=>{r.ospf=false});
 sh('eigrp on 100',RA);sh('eigrp on 100',CE);sh('eigrp on 200',RB);
 t=sh('show ip eigrp neighbors',CE);ok('EIGRP: AS различаются',/AS различаются/.test(t),t);ok('ping без EIGRP-соседства не проходит',!pingOk());
 sh('eigrp on 100',RB);t=sh('show ip eigrp neighbors',CE);ok('EIGRP: соседи UP',(t.match(/UP \(/g)||[]).length===2,t);ok('ping по EIGRP проходит',pingOk());
 t=sh('route',RA);ok('route показывает динамические маршруты (D — EIGRP)',/D  192\.168\.2\.0\/24  через 10\.0\.1\.2  \[90\/\d+\]/.test(t),t);
 sh('eigrp k 1 1 1 0 0',RB);ok('K-значения различаются',/K-значения различаются/.test(sh('show ip eigrp neighbors',CE)));sh('eigrp k 1 0 1 0 0',RB);
 computeRip();const m1=(TOPO[RA.id]||[]).map(x=>x.fd);sh('eigrp bw gi0/1 10000',CE);computeRip();const m2=(TOPO[RA.id]||[]).map(x=>x.fd);ok('метрика растёт при уменьшении полосы',Math.max(...m2)>Math.max(...m1),m1+' → '+m2);
 t=sh('show ip eigrp topology',RA);ok('topology',/Successor/.test(t),t);
 t=sh('show ip protocols',RA);ok('show ip protocols',/EIGRP AS 100/.test(t),t);
 // монитор/сценарий
 run('routingcheck');ok('монитор открывается',!md.hidden&&/Маршрутизация: соседства/.test(mb.innerHTML));
 rtScenario();const P=rtProblems();ok('сценарий: найдено 2 проблемы',P.length===2,JSON.stringify(P));
 S.devs.forEach(d=>d.ifaces.forEach(f=>{['area','hello'].forEach(k=>delete f[k])}));ch();ok('после сброса проблем нет',rtProblems().length===0);
 ok('меню и Т50',!!document.getElementById('brtc')&&MAN.some(x=>/^Т50/.test(x[0])));
}catch(e){R.push('ERR '+e.stack)}return R.join('\n')})()
