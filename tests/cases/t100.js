const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
const T=TPL.find(x=>/Консоль Eltex ESR/.test(x.n));const bad=tplLoad(T);ok(!bad.length,'template loads '+JSON.stringify(bad));
const A=byNm('PC-A'),R1=byNm('R1'),R2=byNm('R2');
const go=(d,c)=>{sel=d.id;const o=out.textContent.length;run(c);return out.textContent.slice(o)};
const png=()=>{EX=[];return!!trip(A,'192.168.2.10').ok};
let t=go(R1,'cli eltex');ok(R1.vend==='eltex'&&/Eltex/.test(t),'cli eltex');
ok(/R1# /.test(document.getElementById('ps').textContent),'prompt priv: '+document.getElementById('ps').textContent);
go(R1,'configure');ok(/\(config\)/.test(document.getElementById('ps').textContent),'conf prompt');
go(R1,'interface gigabitethernet 1/0/1');go(R1,'ip address 192.168.1.1/24');go(R1,'exit');
go(R1,'interface gi 1/0/2');go(R1,'ip address 10.0.12.1/30');go(R1,'exit');
ok(!R1.ifaces[0].ip,'candidate not applied before commit');
t=go(R1,'show candidate-config');ok(/192\.168\.1\.1\/24/.test(t),'candidate shows pending');
go(R1,'ip route 192.168.2.0/24 10.0.12.2');
t=go(R1,'commit');ok(/successfully committed/.test(t)&&R1.ifaces[0].ip==='192.168.1.1'&&R1.routes.length===1,'commit applies');
t=go(R1,'rollback');ok(/rolled back/.test(t)&&!R1.ifaces[0].ip&&!R1.routes.length,'rollback restores');
go(R1,'interface gi 1/0/1');go(R1,'ip address 192.168.1.1/24');go(R1,'exit');go(R1,'interface gi 1/0/2');go(R1,'ip address 10.0.12.1/30');go(R1,'exit');go(R1,'ip route 192.168.2.0/24 10.0.12.2');
go(R1,'commit');t=go(R1,'confirm');ok(/confirmed/.test(t)&&R1.elx.conf,'confirm');
t=go(R1,'show running-config');ok(/ip address 192\.168\.1\.1\/24/.test(t)&&/ip route 192\.168\.2\.0\/24 10\.0\.12\.2/.test(t),'running-config');
go(R1,'end');
t=go(R1,'show ip route');ok(/192\.168\.2\.0/.test(t),'show ip route (native)');
t=go(R1,'ping 192.168.1.1');ok(/./.test(t),'ping passthrough works');
// R2 via exam-like flow
go(R2,'cli eltex');go(R2,'configure');go(R2,'interface gigabitethernet 1/0/1');go(R2,'ip address 10.0.12.2/30');go(R2,'exit');go(R2,'interface gigabitethernet 1/0/2');go(R2,'ip address 192.168.2.1/24');go(R2,'exit');go(R2,'ip route 192.168.1.0/24 10.0.12.1');go(R2,'commit');go(R2,'confirm');
ok(png(),'ping PC-A -> PC-B through two Eltex routers');
// errors
t=go(R2,'interface gigabitethernet 1/0/9');ok(/не найден/.test(t),'bad port');
go(R2,'interface gi 1/0/1');t=go(R2,'ip address 10.0.12.2 255.255.255.252');ok(/Использование/.test(t),'mask instead of prefix rejected');
t=go(R2,'bogus');ok(/Unrecognized/.test(t),'unknown cmd');
go(R2,'exit');go(R2,'exit');t=go(R2,'commit');ok(/Нет изменений/.test(t),'commit with nothing');
t=go(R2,'confirm');ok(/Нечего/.test(t),'confirm nothing');
// shutdown via candidate
go(R2,'configure');go(R2,'interface gi 1/0/2');go(R2,'shutdown');go(R2,'exit');go(R2,'commit');ok(R2.ifaces[1].off&&!png(),'shutdown applied -> ping fails');
go(R2,'rollback');ok(!R2.ifaces[1].off&&png(),'rollback restores link');
go(R2,'cli native');ok(!R2.vend,'cli native');
t=go(byNm('PC-A'),'cli eltex');ok(!byNm('PC-A').vend,'pc rejects (or ignored)');
// cisco still works
go(R1,'cli cisco');ok(R1.vend==='cisco','switch to cisco from eltex');go(R1,'enable');t=go(R1,'show ip interface brief');ok(/192\.168\.1\.1/.test(t),'cisco console unaffected');go(R1,'cli native');
// exam
const x=EXNET.find(e=>/Eltex ESR: настроить/.test(e.n));ok(!!x,'exam');x.start({});const cr=x.crit({});ok(cr.reduce((a,b)=>a+b[1],0)===100,'sum 100');
let sc=cr.map(c=>c[2]()?c[1]:0);ok(sc.reduce((a,b)=>a+b)===0,'before 0 ('+sc+')');
const e1=byNm('R1'),e2=byNm('R2');
[[e1,['configure','interface gigabitethernet 1/0/1','ip address 192.168.1.1/24','exit','interface gigabitethernet 1/0/2','ip address 10.0.12.1/30','exit','ip route 192.168.2.0/24 10.0.12.2','commit','confirm']],[e2,['configure','interface gigabitethernet 1/0/1','ip address 10.0.12.2/30','exit','interface gigabitethernet 1/0/2','ip address 192.168.2.1/24','exit','ip route 192.168.1.0/24 10.0.12.1','commit','confirm']]].forEach(([d,L])=>L.forEach(c=>go(d,c)));
sc=cr.map(c=>c[2]()?c[1]:0);ok(sc.reduce((a,b)=>a+b)===100,'after 100 ('+sc+')');
ok(MAN.some(m=>/Т65/.test(m[0])),'manual');
