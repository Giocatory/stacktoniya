const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
const T=TPL.find(x=>/Фильтрация редистрибуции/.test(x.n));const bad=tplLoad(T);ok(!!T&&!bad.length,'template loads '+JSON.stringify(bad));
const A=byNm('PC-A'),R1=byNm('R1'),R2=byNm('R2');
const go=(d,c)=>{sel=d.id;const o=out.textContent.length;run(c);return out.textContent.slice(o)};
const png=(a,ip)=>{EX=[];return!!trip(a,ip).ok};
let t=go(R1,'route');
ok(/O E2\s+172\.16\.10\.0\/24/.test(t)&&/O E2\s+172\.16\.20\.0\/24/.test(t),'R1 sees 172.16.x branches');
ok(!/10\.99\.0\.0/.test(t),'10.99/16 filtered');
ok(/\[110\/100\]/.test(t),'metric 100 set by route-map: '+(t.match(/O E2.*/g)||[]).join('|'));
t=go(R2,'show prefix-list');ok(/BR/.test(t)&&/permit 172\.16\.0\.0\/16 le 24/.test(t),'show prefix-list');
t=go(R2,'show route-map');ok(/route-map FILT permit 10/.test(t)&&/set metric 100/.test(t),'show route-map');
t=go(R2,'show redistribute');ok(/route-map FILT/.test(t),'show redistribute has route-map');
// add 192.168.2.0/24
go(R2,'prefix-list BR permit 10.99.0.0/16');t=go(R1,'route');ok(/O E2\s+10\.99\.0\.0\/16/.test(t),'after adding permit 10.99/16, seen');ok(png(A,'192.168.2.10'),'ping works');
// exact length: 172.16.0.0/16 without le
go(R2,'no prefix-list BR');go(R2,'prefix-list BR permit 172.16.0.0/16');t=go(R1,'route');ok(!/172\.16\./.test(t),'exact /16 does not match /24');
go(R2,'prefix-list BR permit 172.16.10.0/24');t=go(R1,'route');ok(/172\.16\.10\.0/.test(t)&&!/172\.16\.20\.0/.test(t),'single /24 exact match');
// ge/le
go(R2,'no prefix-list BR');go(R2,'prefix-list BR permit 172.16.0.0/16 ge 25');t=go(R1,'route');ok(!/172\.16\./.test(t),'ge 25 excludes /24');
// deny order + implicit deny
go(R2,'no prefix-list BR');go(R2,'prefix-list BR deny 172.16.20.0/24');go(R2,'prefix-list BR permit 0.0.0.0/0 le 32');t=go(R1,'route');ok(/172\.16\.10\.0/.test(t)&&!/172\.16\.20\.0/.test(t),'deny first then permit any');
// direct prefix-list on redistribute
go(R2,'no route-map FILT');t=go(R2,'show route-map');ok(/не настроены/.test(t),'no route-map');
go(R2,'redistribute static ospf prefix-list BR');t=go(R1,'route');ok(/O E2\s+172\.16\.10\.0/.test(t)&&!/172\.16\.20\.0/.test(t),'redistribute prefix-list BR');
// route-map referencing missing pl -> nothing; deny rule
go(R2,'route-map X permit 10 match NOPE');go(R2,'redistribute static ospf route-map X');t=go(R1,'route');ok(!/172\.16\./.test(t),'missing prefix-list = no match');
t=go(R2,'show route-map');ok(/не создан/.test(t),'warns about missing prefix-list');
// errors
ok(/Использование|длина/.test(go(R2,'prefix-list Z permit 1.2.3.4')),'bad prefix');
ok(/ge/.test(go(R2,'prefix-list Z permit 10.0.0.0/16 ge 8')),'ge < len');
ok(/metric/.test(go(R2,'route-map Q permit 10 set metric 0')),'bad metric');
ok(/Использование/.test(go(R2,'route-map Q permit 10 foo')),'bad route-map args');
// cisco
R2.vend='cisco';R2.vm={m:'conf'};go(R2,'ip prefix-list CB seq 5 permit 10.99.0.0/16');ok(R2.pl.CB&&R2.pl.CB[0].net==='10.99.0.0','cisco ip prefix-list');
go(R2,'route-map CM permit 10');ok(R2.vm.m==='rmap','cisco enters rmap');go(R2,'match ip address prefix-list CB');go(R2,'set metric 7');go(R2,'exit');
ok(R2.vm.m==='conf'&&R2.rmap.CM[0].match==='CB'&&R2.rmap.CM[0].metric===7,'cisco route-map fields');
R2.vm={m:'router',p:'ospf'};go(R2,'redistribute static route-map CM');t=go(R1,'route');ok(/O E2\s+10\.99\.0\.0\/16.*\[110\/7\]/.test(t),'cisco router-mode route-map applied: '+(t.match(/O E2.*/g)||[]).join('|'));
delete R2.vend;delete R2.vm;
// exam
const x=EXNET.find(e=>/Фильтрация: пропустить/.test(e.n));ok(!!x,'exam registered');x.start({});const cr=x.crit({});ok(cr.reduce((a,b)=>a+b[1],0)===100,'sum 100');
let sc=cr.map(c=>c[2]()?c[1]:0);console.log('before',sc);ok(sc.reduce((a,b)=>a+b)<=25,'before score low');
go(byNm('R2'),'prefix-list BR permit 172.16.0.0/16 le 24');go(byNm('R2'),'prefix-list BR permit 192.168.2.0/24');
go(byNm('R2'),'redistribute static ospf prefix-list BR');
sc=cr.map(c=>c[2]()?c[1]:0);ok(sc.reduce((a,b)=>a+b)===100,'after 100 ('+sc+')');
ok(MAN.some(m=>/Т62/.test(m[0])),'manual entry');
