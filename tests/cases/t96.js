const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
const T=TPL.find(x=>/Редистрибуция: OSPF/.test(x.n));ok(!!T&&!tplLoad(T).length,'template loads');
const A=byNm('PC-A'),B=byNm('PC-B'),R1=byNm('R1'),R2=byNm('R2'),R3=byNm('R3');
const go=(d,c)=>{sel=d.id;const o=out.textContent.length;run(c);return out.textContent.slice(o)};
const png=(a,ip)=>{EX=[];return!!trip(a,ip).ok};
ok(png(A,'192.168.2.10')&&png(B,'192.168.1.10'),'mutual redistribution: ping both ways');
let t=go(R1,'route');ok(/O E2\s+192\.168\.2\.0\/24/.test(t)&&/\[110\/20\]/.test(t),'R1 sees O E2 192.168.2.0/24 [110/20]: '+(t.match(/O E2.*/g)||[]).join('|'));
t=go(R3,'route');ok(/R\s+192\.168\.1\.0\/24/.test(t),'R3 sees RIP route to 192.168.1.0/24');
t=go(R2,'show redistribute');ok(/rip → ospf/.test(t)&&/ospf → rip/.test(t),'show redistribute');
go(R2,'no redistribute rip ospf');ok(!png(A,'192.168.2.10'),'one direction removed -> fails');
go(R2,'redistribute rip ospf metric 50');t=go(R1,'route');ok(/\[110\/50\]/.test(t),'metric 50 applied');
ok(png(A,'192.168.2.10'),'restored');
t=go(R2,'redistribute rip ospf only 10.99.0.0/16');t=go(R1,'route');ok(!/O E2\s+192\.168\.2\.0/.test(t),'only filter excludes other prefixes');
go(R2,'redistribute rip ospf');
t=go(R2,'redistribute ospf ospf');ok(/совпадают/.test(t),'same protocol rejected');
t=go(R2,'redistribute foo ospf');ok(/Использование/.test(t),'bad source');
t=go(R2,'redistribute rip ospf metric x');ok(/metric/.test(t),'bad metric');
// static + default
tplLoad({n:'s',dev:[['pc','PA',0,0],['pc','PB',9,0],['rt','R1',1,1],['rt','R2',2,1],['rt','R3',3,1]],link:[['PA',0,'R1',0],['R1',1,'R2',0],['R2',1,'R3',0],['R3',1,'PB',0]],
 cfg:[['PA','ip eth0 192.168.1.10 /24','gateway 192.168.1.1'],['PB','ip eth0 192.168.2.10 /24','gateway 192.168.2.1'],['R1','ip gi0/0 192.168.1.1 /24','ip gi0/1 10.0.12.1 /30','ospf on'],
 ['R2','ip gi0/0 10.0.12.2 /30','ip gi0/1 10.0.23.1 /30','ospf on','route add 192.168.2.0 /24 10.0.23.2'],['R3','ip gi0/0 10.0.23.2 /30','ip gi0/1 192.168.2.1 /24','route add 192.168.1.0 /24 10.0.23.1','route add 10.0.12.0 /30 10.0.23.1'],],hint:''});
const a2=byNm('PA'),r1=byNm('R1'),r2=byNm('R2');ok(!png(a2,'192.168.2.10'),'static-only: R1 has no route -> fails');
let u=go(r2,'redistribute static ospf');ok(png(a2,'192.168.2.10'),'redistribute static ospf fixes it');
u=go(r1,'route');ok(/O E2\s+192\.168\.2\.0\/24/.test(u),'static appears as O E2');
// connected
go(r2,'no redistribute static ospf');ok(!png(a2,'192.168.2.10'),'removed -> fails');
go(r2,'redistribute connected ospf');u=go(r1,'route');ok(/O\s+10\.0\.23\.0\/30/.test(u)&&!/O E2\s+10\.0\.23\.0/.test(u),'connected already in OSPF: internal route wins over external');
// default-information
go(r2,'route add 0.0.0.0 0.0.0.0 10.0.23.2');go(r2,'redistribute default ospf');u=go(r1,'route');ok(/O E2\s+0\.0\.0\.0\/0/.test(u),'default route originated into OSPF');
ok(png(a2,'192.168.2.10'),'ping through originated default');
// cisco
r2.vend='cisco';r2.vm={m:'router',p:'ospf'};go(r2,'redistribute static subnets');ok((r2.redist||[]).some(r=>r.from==='static'&&r.to==='ospf'),'cisco router-mode redistribute');
go(r2,'default-information originate');ok(r2.redist.some(r=>r.from==='default'),'cisco default-information originate');
go(r2,'no redistribute static');ok(!r2.redist.some(r=>r.from==='static'),'cisco no redistribute');
delete r2.vend;delete r2.vm;
// exam
const x=EXNET.find(e=>/Редистрибуция: объединить/.test(e.n));ok(!!x,'exam registered');x.start({});const cr=x.crit({});ok(cr.reduce((a,b)=>a+b[1],0)===100,'sum 100');
let sc=cr.map(c=>c[2]()?c[1]:0);ok(sc.reduce((a,b)=>a+b)===10,'before: only protocols intact ('+sc+')');
go(byNm('R2'),'redistribute ospf rip');go(byNm('R2'),'redistribute rip ospf');sc=cr.map(c=>c[2]()?c[1]:0);ok(sc.reduce((a,b)=>a+b)===100,'after 100 ('+sc+')');
ok(MAN.some(m=>/Т61/.test(m[0])),'manual entry');
