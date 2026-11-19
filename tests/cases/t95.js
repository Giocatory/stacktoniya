const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
const T=TPL.find(x=>/IP SLA и track/.test(x.n));ok(!!T&&!tplLoad(T).length,'template loads');
const A=byNm('PC-A'),B=byNm('PC-B'),R1=byNm('R1'),R2=byNm('R2'),R3=byNm('R3'),R4=byNm('R4');
const go=(d,c)=>{sel=d.id;const o=out.textContent.length;run(c);return out.textContent.slice(o)};
const via=(a,ip)=>{EX=[];const r=trip(a,ip);return{ok:!!r.ok,path:(r.tr||[]).map(x=>x.name).join('>')}};
let r=via(A,'192.168.2.10');ok(r.ok&&/R2/.test(r.path)&&!/R3/.test(r.path),'normal: via R2 ('+r.path+')');
let t=go(R1,'show track');ok(/Track 1/.test(t)&&/Reachability is Up/.test(t),'show track Up');
t=go(R1,'show sla');ok(/icmp-echo/.test(t)&&/OK/.test(t),'show sla OK');
t=go(R1,'route');ok(/\[track 1: up\]/.test(t),'route table shows track up');
// downstream failure: cut R2-R4
R2.ifaces[1].off=true;
r=via(A,'192.168.2.10');ok(r.ok&&/R3/.test(r.path)&&!/R2/.test(r.path),'after R2-R4 cut: failover via R3 ('+r.path+')');
r=via(B,'192.168.1.10');ok(r.ok&&/R3/.test(r.path),'reverse path failover');
t=go(R1,'show track');ok(/Reachability is Down/.test(t),'show track Down');
t=go(R1,'route');ok(/DOWN/.test(t),'route table shows DOWN');
// restore
R2.ifaces[1].off=false;r=via(A,'192.168.2.10');ok(r.ok&&/R2/.test(r.path),'after repair: back to R2');
ok(typeof EX!=='undefined','state intact');
// no-track scenario fails (blackhole) -> demonstrates need
tplLoad(Object.assign({n:'x',hint:''},slaBuild(false)));const a2=byNm('PC-A'),R2b=byNm('R2'),R4b=byNm('R4');R2b.ifaces[1].off=true;
r=via(a2,'192.168.2.10');ok(!r.ok,'without track: traffic blackholed');
// native config
sel=byNm('R1').id;
t=go(byNm('R1'),'sla 7 icmp-echo 192.168.2.10 source 192.168.1.1');ok(/IP SLA 7/.test(t),'sla native');
t=go(byNm('R1'),'track 7 sla 7');ok(/track 7/.test(t),'track native');
t=go(byNm('R1'),'track 8 sla 99');ok(/не настроен/.test(t),'track missing sla rejected');
t=go(byNm('R1'),'route add 10.5.0.0 /24 10.0.12.2 track 700');ok(/от 1 до 500/.test(t),'track range validated');
t=go(byNm('R1'),'route add 10.5.0.0 /24 10.0.12.2 200 track 7');ok(byNm('R1').routes.some(x=>x.net==='10.5.0.0'&&x.ad===200&&x.track===7),'ad + track parsed');
t=go(byNm('R1'),'sla 7 off');ok(/удалён/.test(t),'sla off');
// cisco syntax
const R1c=byNm('R1');R1c.vend='cisco';R1c.vm={m:'conf'};go(R1c,'ip sla 5');ok(R1c.vm.m==='sla','cisco ip sla submode');
go(R1c,'icmp-echo 192.168.2.10');ok(R1c.sla['5']&&R1c.sla['5'].dst==='192.168.2.10','icmp-echo');
go(R1c,'frequency 5');go(R1c,'exit');ok(R1c.vm.m==='conf','exit back to conf');
go(R1c,'ip sla schedule 5 life forever start-time now');go(R1c,'track 5 ip sla 5 reachability');ok(R1c.track['5']&&R1c.track['5'].sla==='5','cisco track');
go(R1c,'ip route 10.6.0.0 255.255.255.0 10.0.12.2 track 5');ok(R1c.routes.some(x=>x.net==='10.6.0.0'&&x.track===5),'cisco ip route track');
ok(/ip route 10\.6\.0\.0 255\.255\.255\.0 10\.0\.12\.2 track 5/.test(runCfg(R1c)),'running-config shows track');
R1c.vm={m:'priv'};t=go(R1c,'show track');ok(/Track 5/.test(t),'cisco show track');delete R1c.vend;delete R1c.vm;
// exam
const x=EXNET.find(e=>/IP SLA и track/.test(e.n));ok(!!x,'exam registered');x.start({});const cr=x.crit({});ok(cr.reduce((a,b)=>a+b[1],0)===100,'sum 100');
let sc=cr.map(c=>c[2]()?c[1]:0);ok(sc.reduce((a,b)=>a+b)===10,'before: only backup routes kept ('+sc+')');
const q1=byNm('R1'),q4=byNm('R4');
['sla 1 icmp-echo 192.168.2.10','track 1 sla 1','route del 192.168.2.0','route add 192.168.2.0 /24 10.0.12.2 track 1','route add 192.168.2.0 /24 10.0.13.2 200'].forEach(c=>go(q1,c));
['sla 1 icmp-echo 192.168.1.10','track 1 sla 1','route del 192.168.1.0','route add 192.168.1.0 /24 10.0.24.1 track 1','route add 192.168.1.0 /24 10.0.34.1 200'].forEach(c=>go(q4,c));
sc=cr.map(c=>c[2]()?c[1]:0);ok(sc.reduce((a,b)=>a+b)===100,'after: 100 ('+sc+')');
ok(MAN.some(m=>/Т60/.test(m[0])),'manual entry');
