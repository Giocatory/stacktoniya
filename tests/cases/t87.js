const R=[];const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
const dev=[['pc','PA',0,0],['pc','PB',9,0],['rt','R1',1,1],['rt','R2',2,1],['rt','R3',2,2],['rt','R4',3,1]];
const link=[['PA',0,'R1',0],['R1',1,'R2',0],['R1',2,'R3',0],['R2',1,'R4',0],['R3',1,'R4',1],['R4',2,'PB',0]];
const cfg=[['PA','ip eth0 192.168.1.10 /24','gateway 192.168.1.1'],['PB','ip eth0 192.168.2.10 /24','gateway 192.168.2.1'],
['R1','ip gi0/0 192.168.1.1 /24','ip gi0/1 10.0.12.1 /30','ip gi0/2 10.0.13.1 /30','route add 192.168.2.0 /24 10.0.12.2','route add 192.168.2.0 /24 10.0.13.2 200'],
['R2','ip gi0/0 10.0.12.2 /30','ip gi0/1 10.0.24.1 /30','route add 192.168.2.0 /24 10.0.24.2','route add 192.168.1.0 /24 10.0.12.1'],
['R3','ip gi0/0 10.0.13.2 /30','ip gi0/1 10.0.34.1 /30','route add 192.168.2.0 /24 10.0.34.2','route add 192.168.1.0 /24 10.0.13.1'],
['R4','ip gi0/0 10.0.24.2 /30','ip gi0/1 10.0.34.2 /30','ip gi0/2 192.168.2.1 /24','route add 192.168.1.0 /24 10.0.24.1','route add 192.168.1.0 /24 10.0.34.1 200']];
const bad=tplLoad({n:'ad',dev,link,cfg,hint:''});ok(!bad.length,'template loaded '+JSON.stringify(bad).slice(0,120));
const via=(a,b)=>{EX=[];const r=trip(byNm(a),b);return{ok:r.ok,path:(r.tr||[]).map(x=>x.name).join('>')}};
let r=via('PA','192.168.2.10');ok(r.ok&&/R2/.test(r.path)&&!/R3/.test(r.path),'primary path via R2: '+r.path);
const R1=byNm('R1');ok(R1.routes.find(x=>x.nh==='10.0.13.2').ad===200,'floating route keeps ad=200');
// output
const o0=out.textContent.length;execOn(R1,'route');const t=out.textContent.slice(o0);ok(/\[AD 200\]/.test(t),'route table shows [AD 200]');
// primary fails (R2 removed)
const R2=byNm('R2');S.links=S.links.filter(l=>l.a!==R2.id&&l.b!==R2.id);S.devs=S.devs.filter(d=>d!==R2);
r=via('PA','192.168.2.10');ok(r.ok&&/R3/.test(r.path),'failover via R3 after R2 removal: '+r.path);
// ad ordering independent of list order
execOn(R1,'route add 10.99.0.0 /24 10.0.13.2 50');execOn(R1,'route add 10.99.0.0 /24 10.0.12.2 3');
// validation
const o1=out.textContent.length;execOn(R1,'route add 10.98.0.0 /24 10.0.13.2 999');ok(/1 до 255/.test(out.textContent.slice(o1))&&!R1.routes.some(x=>x.net==='10.98.0.0'),'bad AD rejected');
// cisco syntax
R1.vend='cisco';execOn(R1,'enable');execOn(R1,'configure terminal');execOn(R1,'ip route 10.97.0.0 255.255.255.0 10.0.13.2 150');ok(R1.routes.some(x=>x.net==='10.97.0.0'&&x.ad===150),'cisco ip route … 150');
ok(/ip route 10\.97\.0\.0 255\.255\.255\.0 10\.0\.13\.2 150/.test(runCfg(R1)),'running-config shows AD');
delete R1.vend;delete R1.vm;['R1','R3','R4'].forEach(n=>execOn(byNm(n),'ospf on'));
EX=[];const q=trip(byNm('PA'),'192.168.2.10');const txt=EX.map(e=>e.x).join(' ');
ok(q.ok&&/OSPF/.test(txt)&&!/плавающий/.test(txt.split('R1:')[1]||''),'OSPF (AD 110) beats floating static (AD 200)');
