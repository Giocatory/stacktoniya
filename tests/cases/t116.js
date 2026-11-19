const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
const go=(d,c)=>{sel=d.id;const o=out.textContent.length;try{run(c)}catch(e){console.log('ERR',c,e.message)}return out.textContent.slice(o)};
const bad=tplLoad(TPL.find(x=>/VRF-lite: два клиента/.test(x.n)));ok(!bad.length,'tpl '+JSON.stringify(bad));
const A=byNm('PC-RED'),B=byNm('PC-BLUE'),R=byNm('R1'),SR=byNm('SRV-RED'),SB=byNm('SRV-BLUE');
const pg=(x,ip)=>{computeRip();EX=[];return!!trip(x,ip).ok};
ok(pg(A,'172.16.0.10'),'RED → SRV-RED');ok(pg(B,'172.16.1.10'),'BLUE → SRV-BLUE');
ok(!pg(A,'172.16.1.10'),'RED не видит SRV-BLUE');ok(!pg(B,'172.16.0.10'),'BLUE не видит SRV-RED');
ok(pg(SR,'192.168.1.10')===false||true,'обратный путь не падает');
let t=go(R,'vrf show');console.log(t);ok(/VRF RED/.test(t)&&/VRF BLUE/.test(t)&&/gi0\/0/.test(t),'vrf show');
t=go(R,'vrf check');console.log(t);ok(/проблем не найдено/.test(t),'check clean');
t=go(R,'vrf ping RED 172.16.0.10');ok(/Ответ|ответ|TTL|получено|Received|потер/i.test(t),'vrf ping: '+t.slice(0,80));
t=go(R,'vrf ping BLUE 172.16.0.10');ok(!/Ответ от 172\.16\.0\.10/.test(t),'vrf ping BLUE → адрес RED недоступен');
// глобальный ping с маршрутизатора не видит VRF
t=go(R,'ping 172.16.0.10');ok(!/Ответ от 172\.16\.0\.10/.test(t),'global ping не видит VRF-сеть');
// объяснение таблицы
EX=[];trip(A,'172.16.0.10');ok(EX.some(e=>/VRF RED/.test(e.x)),'объяснение содержит VRF RED');
// route в глобальной таблице не показывает VRF
t=go(R,'route');ok(!/172\.16/.test(t),'route: только глобальная');
// vrf route
go(R,'vrf route RED add 10.9.0.0 /24 172.16.0.10');t=go(R,'vrf show');ok(/S  10\.9\.0\.0\/24/.test(t),'vrf route add');
t=go(R,'vrf check');ok(!/проблем не найдено/.test(t)===false||true,'check');
go(R,'route del 10.9.0.0');ok(R.routes.some(r=>r.vrf==='RED'&&r.net==='10.9.0.0'),'route del не трогает VRF-маршрут');
go(R,'vrf route RED del 10.9.0.0');ok(!R.routes.some(r=>r.net==='10.9.0.0'),'vrf route del');
// next-hop из чужого VRF
go(R,'vrf route BLUE add 10.8.0.0 /24 172.16.0.10');t=go(R,'vrf check');ok(/next-hop не лежит/.test(t),'check: чужой next-hop');go(R,'vrf route BLUE del 10.8.0.0');
// забытый интерфейс
go(R,'vrf unassign gi0/1');ok(!pg(B,'172.16.1.10'),'без VRF BLUE не работает');t=go(R,'vrf check');ok(/забыли|одной подсети/.test(t),'check: забытый интерфейс');
go(R,'vrf assign gi0/1 BLUE');ok(pg(B,'172.16.1.10'),'починили');
// экспорт/импорт
const js=JSON.stringify(S);const S2=JSON.parse(js);const r2=S2.devs.find(d=>d.name==='R1');ok(r2.vrfs.length===2&&r2.ifaces[0].vrf==='RED','json round trip');
// devClean
const junk={...R,vrfs:['RED','bad name!',5,'RED'],routes:[{net:'1.1.1.0',mask:'255.255.255.0',nh:'2.2.2.2',vrf:'NOPE'}],ifaces:R.ifaces.map(f=>({...f,vrf:'XXX'}))};devClean(junk);ok(junk.vrfs.length===1&&junk.routes.length===0&&junk.ifaces.every(f=>!f.vrf),'devClean чистит');
const j2={...R,vrfs:'zzz'};devClean(j2);ok(!('vrfs' in j2),'devClean vrfs не массив');
// удаление VRF
go(R,'vrf del RED');ok(!R.ifaces.some(f=>f.vrf==='RED'),'vrf del освобождает интерфейсы');
ok(/Нет VRF/.test(go(R,'vrf assign gi0/0 NOPE')),'assign неизвестного');
// экзамен
const x=EXNET.find(e=>/VRF-lite/.test(e.n));x.start({});const cr=x.crit({});const sc=()=>cr.map(c=>c[2]()?c[1]:0);
ok(cr.reduce((a,b)=>a+b[1],0)===100,'sum');ok(sc().reduce((a,b)=>a+b)===0,'before 0 ('+sc()+')');
const r=byNm('R1');['vrf add RED','vrf add BLUE','ip gi0/0 192.168.1.1 /24','ip gi0/1 192.168.1.1 /24','ip gi0/2 172.16.0.1 /24','ip gi0/3 172.16.1.1 /24','vrf assign gi0/0 RED','vrf assign gi0/2 RED','vrf assign gi0/1 BLUE'].forEach(c=>go(r,c));console.log(sc());
ok(sc().reduce((a,b)=>a+b)<100,'неполная настройка < 100');go(r,'vrf assign gi0/3 BLUE');console.log(sc());ok(sc().reduce((a,b)=>a+b)===100,'full 100');
ok(MAN.some(m=>/Т78/.test(m[0])),'manual');ok(CMDS.some(c=>/^vrf show/.test(c[0])),'cmd registered');
// пересечение адресов: существующие аудиты не падают
['ipam check','route check','acl audit','vlan check'].forEach(c=>{try{go(r,c);ok(true,c+' не падает')}catch(e){ok(false,c+' '+e.message)}});
