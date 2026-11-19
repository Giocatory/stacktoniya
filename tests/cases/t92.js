const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
vpnScenario();vpnTuns().forEach(x=>{x.f.tun.key='LongSecretKey2026';x.f.tun.p=null});ch();
const T=vpnTuns();ok(T.length>=2&&T.every(x=>tunStatus(x.d,x.i).up),'baseline tunnels up ('+T.length+')');
const go=(d,c)=>{sel=d.id;const o=out.textContent.length;run(c);return out.textContent.slice(o)};
let t=go(T[0].d,'gost');ok(/Кузнечик/.test(t)&&/ГОСТ Р 34.11-2012/.test(t),'gost info');
t=go(T[0].d,'ipsec '+T[0].f.n+' gost');ok(/ГОСТ-профиль/.test(t)&&T[0].f.tun.p.enc==='kuznyechik'&&gsIs(T[0].f.tun),'profile set one end');
ok(!tunStatus(T[0].d,T[0].i).up&&/шифрование/.test(tunStatus(T[0].d,T[0].i).why),'mismatch -> down with reason: '+tunStatus(T[0].d,T[0].i).why);
t=go(T[1].d,'ipsec '+T[1].f.n+' gost magma 512');ok(/Магма/.test(t)&&/64-битный/.test(t),'magma note');
ok(!tunStatus(T[0].d,T[0].i).up,'kuznyechik vs magma mismatch');
go(T[1].d,'ipsec '+T[1].f.n+' gost');ok(vpnTuns().every(x=>tunStatus(x.d,x.i).up),'both ends gost -> up');
t=go(T[0].d,'show crypto');ok(/Кузнечик/.test(t)&&/Стрибог/.test(t)&&/VKO/.test(t),'show crypto shows names');
ok(vpnAudit().every(x=>x.ok)&&vpnAudit().some(x=>/ГОСТ-профиль/.test(x.t)),'audit ok + gost row');
t=go(T[0].d,'ipsec '+T[0].f.n+' gost foo');ok(/Неверный параметр/.test(t),'bad param');
t=go(T[0].d,'ipsec '+T[0].f.n+' enc magma hash streebog512');ok(/IKEv2, magma, streebog512/.test(t.replace(/\s+/g,' '))||T[0].f.tun.p.enc==='magma','generic ipsec accepts gost names');
// exam
const x=EXNET.find(e=>/ГОСТ/.test(e.n));ok(!!x,'exam registered');x.start({});const cr=x.crit({});
ok(cr.reduce((a,b)=>a+b[1],0)===100,'sum 100');let sc=cr.map(c=>c[2]()?c[1]:0);ok(sc[1]===0&&sc[0]===20,'before: up but not gost ('+sc+')');
vpnTuns().forEach(y=>{go(y.d,'ipsec '+y.f.n+' gost')});sc=cr.map(c=>c[2]()?c[1]:0);ok(sc.reduce((a,b)=>a+b,0)===100,'after: 100 ('+sc+')');
