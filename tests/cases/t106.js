const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
const T=TPL.find(x=>/BFD: быстрое обнаружение/.test(x.n));const bad=tplLoad(T);ok(!bad.length,'template loads '+JSON.stringify(bad));
const A=byNm('PC-A'),R1=byNm('R1'),R2=byNm('R2');
const go=(d,c)=>{sel=d.id;const o=out.textContent.length;try{run(c)}catch(e){console.log('ERR',c,e.message)}return out.textContent.slice(o)};
let t=go(R1,'show bfd neighbors detail');console.log(t);ok(/Down/.test(t)&&/BFD не включён/.test(t),'R1 session Down: neighbor not configured');
t=go(R2,'bfd gi0/0 interval 300 min_rx 300 multiplier 3 ospf');console.log(t);ok(/Сессия: Up/.test(t)&&/900 мс/.test(t),'session Up, detect 900 ms');
t=go(R1,'show bfd neighbors');ok(/Up/.test(t)&&/10\.0\.12\.2/.test(t),'R1 sees Up');
t=go(R1,'bfd fail gi0/1');console.log(t);ok(/Dead Interval = 40 с/.test(t)&&/900 мс/.test(t)&&/быстрее в 44 раз/.test(t),'fail timeline vs OSPF 40s');ok(/≈ 90 вместо ≈ 4000/.test(t),'packet loss estimate');
// negotiation: R2 min_rx 500 -> R1 detection = R2.mult * max(R2.tx,R1.rx)? R1 det = R2.m*max(R2.tx,R1.rx)
go(R2,'bfd gi0/0 interval 100 min_rx 500 multiplier 4');go(R1,'bfd gi0/1 interval 200 min_rx 250 multiplier 5 ospf');
t=go(R1,'show bfd neighbors detail');console.log(t);
const s1=bfSess(R1,R1.ifaces.findIndex(f=>f.ip==='10.0.12.1')),s2=bfSess(R2,R2.ifaces.findIndex(f=>f.ip==='10.0.12.2'));
ok(s1.det===4*Math.max(100,250)&&s2.det===5*Math.max(200,500),'detect = remote mult * max(remote tx, local rx): '+s1.det+'/'+s2.det);
ok(s1.tx===Math.max(200,500)&&s2.tx===Math.max(100,250),'negotiated tx = max(local tx, remote min_rx)');
// limits
ok(/50 до 999/.test(go(R1,'bfd gi0/1 interval 10')),'interval limit');ok(/3 до 50/.test(go(R1,'bfd gi0/1 multiplier 2')),'multiplier limit');
ok(/Неизвестный/.test(go(R1,'bfd gi0/1 foo')),'unknown param');ok(/Использование/.test(go(R1,'bfd gi9/9 interval 300')),'bad iface');
// interface down -> AdminDown/Down
go(R2,'bfd gi0/0 interval 300 min_rx 300 multiplier 3 ospf');go(R1,'bfd gi0/1 interval 300 min_rx 300 multiplier 3 ospf');
go(R1,'shutdown gi0/1');t=go(R2,'show bfd neighbors detail');ok(/Down/.test(t)&&/интерфейс соседа отключён/.test(t),'neighbor iface down -> Down: '+t.split('\n').find(l=>/причина/.test(l)));
t=go(R1,'show bfd neighbors detail');ok(/AdminDown/.test(t),'local AdminDown');go(R1,'no shutdown gi0/1');
// OSPF client without adjacency warning
// off
go(R1,'bfd gi0/1 off');ok(!R1.ifaces[1].bfd,'off');t=go(R1,'bfd fail gi0/1');ok(/Dead Interval/.test(t)&&/не настроена/.test(t),'fail without bfd -> advice');
// Cisco
go(R1,'cli cisco');go(R1,'enable');go(R1,'configure terminal');go(R1,'interface gi0/1');go(R1,'bfd interval 300 min_rx 300 multiplier 3');
ok(R1.ifaces[1].bfd&&R1.ifaces[1].bfd.m===3,'cisco bfd interval');t=go(R1,'ip ospf bfd');ok(R1.ifaces[1].bfd.ospf,'cisco ip ospf bfd');
go(R1,'end');t=go(R1,'show bfd neighbors details');ok(/Up/.test(t),'cisco show bfd neighbors details');go(R1,'cli native');
// exam
const x=EXNET.find(e=>/BFD: обнаружение отказа/.test(e.n));ok(!!x,'exam');x.start({});const cr=x.crit({});ok(cr.reduce((a,b)=>a+b[1],0)===100,'sum 100');
const e1=byNm('R1'),e2=byNm('R2');let sc=cr.map(c=>c[2]()?c[1]:0);ok(sc.reduce((a,b)=>a+b)===0,'before 0 ('+sc+')');
go(e1,'bfd gi0/1 interval 300 min_rx 300 multiplier 3 ospf');sc=cr.map(c=>c[2]()?c[1]:0);ok(sc.reduce((a,b)=>a+b)<100,'one side only < 100 ('+sc+')');
go(e2,'bfd gi0/0 interval 300 min_rx 300 multiplier 3 ospf');sc=cr.map(c=>c[2]()?c[1]:0);ok(sc.reduce((a,b)=>a+b)===100,'after 100 ('+sc+')');
go(e2,'bfd gi0/0 interval 500 min_rx 500 multiplier 3 ospf');sc=cr.map(c=>c[2]()?c[1]:0);ok(sc[2]===0,'slow timers fail the 1 s criterion');
// import
tplLoad(TPL.find(x=>/BFD: быстрое обнаружение/.test(x.n)));go(byNm('R2'),'bfd gi0/0 ospf');const j=JSON.parse(JSON.stringify(S));j.devs.find(d=>d.name==='R1').ifaces[1].bfd={tx:5,rx:'x',m:99};ok(schemeSet(j)&&!byNm('R1').ifaces[1].bfd,'corrupt bfd dropped on import');
ok(MAN.some(m=>/Т69/.test(m[0])),'manual');
