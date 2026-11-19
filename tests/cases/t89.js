const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
const t=EXNET.find(x=>/плавающие/.test(x.n));ok(!!t,'exam task registered');
t.start({});const cr=t.crit({});ok(cr.reduce((a,x)=>a+x[1],0)===100,'points sum 100');
let sc=cr.map(x=>x[2]()?x[1]:0);ok(sc[2]===20&&sc.reduce((a,b)=>a+b,0)===20,'before fix only primary-path criterion passes: '+sc);
execOn(byNm('R1'),'route add 192.168.2.0 /24 10.0.13.2 200');execOn(byNm('R4'),'route add 192.168.1.0 /24 10.0.34.1 200');
sc=cr.map(x=>x[2]()?x[1]:0);ok(sc.reduce((a,b)=>a+b,0)===100,'after fix 100: '+sc);
ok(!!byNm('R2'),'crit restores state after simulated failure');
const T=TPL.find(x=>/плавающий/.test(x.n));ok(T&&!tplLoad(T).length,'template loads cleanly');
