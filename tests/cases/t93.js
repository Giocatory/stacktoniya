const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
tplLoad({n:'q',dev:[['pc','PA',0,0],['sw','SW1',1,0],['rt','R1',2,0],['rt','R2',3,0],['pc','PB',4,0]],link:[['PA',0,'SW1',0],['SW1',1,'R1',0],['R1',1,'R2',0],['R2',1,'PB',0]],cfg:[['PA','ip eth0 192.168.1.10 /24','gateway 192.168.1.1'],['PB','ip eth0 192.168.2.10 /24','gateway 192.168.2.1'],['R1','ip gi0/0 192.168.1.1 /24','ip gi0/1 10.0.0.1 /30','route add 192.168.2.0 /24 10.0.0.2'],['R2','ip gi0/0 10.0.0.2 /30','ip gi0/1 192.168.2.1 /24','route add 192.168.1.0 /24 10.0.0.1']],hint:''});
const PA=byNm('PA'),PB=byNm('PB'),R1=byNm('R1'),R2=byNm('R2'),SW=byNm('SW1');
const r=simRun(PA,'192.168.2.10');ok(r&&r.ok,'simRun ok');const R=SIM.rows;ok(R.length>=9,'rows '+R.length);
const hops=R.filter(x=>x.kind==='hop'&&!x.rep);ok(hops.length===3,'3 forward hops');
ok(hops.map(x=>x.ttl).join()==='64,63,62','TTL 64,63,62 forward: '+hops.map(x=>x.ttl));
ok(hops.every(x=>x.sip==='192.168.1.10'&&x.dip==='192.168.2.10'),'IPs constant on forward path');
ok(hops[0].smac===PA.mac&&hops[0].dmac===R1.mac,'hop1 MAC PA→R1 (through switch)');
ok(hops[1].smac===R1.mac&&hops[1].dmac===R2.mac&&hops[2].smac===R2.mac&&hops[2].dmac===PB.mac,'MAC rewritten at each router hop');
const rh=R.filter(x=>x.kind==='hop'&&x.rep);ok(rh.length===3&&rh.map(x=>x.ttl).join()==='64,63,62'&&rh[0].sip==='192.168.2.10'&&rh[0].dip==='192.168.1.10','reply direction: IPs swapped, TTL restarts');
ok(R.some(x=>x.kind==='deliver')&&R[0].kind==='create','create first, deliver present');
ok(simLayers(hops[0]).some(l=>/Коммутатор/.test(l[1])),'switch layer entry (L2 only)');
const html=simPanel();ok(/Режим симуляции/.test(html)&&/Шаг/.test(html),'panel renders');
const go=c=>{sel=PA.id;const o=out.textContent.length;run(c);return out.textContent.slice(o)};
let t=go('simulate 192.168.2.10');ok(/TTL 62/.test(t)&&/MAC/.test(t),'console simulate');
t=go('simulate');ok(/Использование/.test(t),'usage');
// failure: no route
R2.routes=[];simRun(PA,'192.168.2.10');ok(SIM.rows.some(x=>x.kind==='error'||/нет маршрута|не знаю/i.test(x.x)),'failure events shown');
ok(!!document.getElementById('bsim'),'menu button');
// UI clicks
openMd(simPanel());document.querySelector('[data-sm="run"]')&&document.querySelector('[data-sm="run"]').click();
ok(true,'ui run click safe');
