const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
const t=EXNET.find(x=>/MTU: найти/.test(x.n));ok(!!t,'task registered');t.start({});const cr=t.crit({});
ok(cr.reduce((a,x)=>a+x[1],0)===100,'sum 100');
let sc=cr.map(x=>x[2]()?x[1]:0);ok(sc[0]===20&&sc[1]===0,'before fix: ping ok, MTU bad ('+sc+')');
execOn(byNm('R2'),'mtu gi0/0 1500');sc=cr.map(x=>x[2]()?x[1]:0);ok(sc.reduce((a,b)=>a+b,0)===100,'after fix 100 ('+sc+')');
execOn(byNm('R2'),'mtu gi0/0 9000');sc=cr.map(x=>x[2]()?x[1]:0);ok(sc[3]===0,'jumbo rejected by crit');
ok(MAN.some(m=>/Т56/.test(m[0])),'manual entry Т56');
