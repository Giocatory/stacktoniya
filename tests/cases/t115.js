const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
const go=(d,c)=>{sel=d.id;const o=out.textContent.length;try{run(c)}catch(e){console.log('ERR',c,e.message)}return out.textContent.slice(o)};
const bad=tplLoad(TPL.find(x=>/Маршруты: найти ошибки/.test(x.n)));ok(!bad.length,'tpl '+JSON.stringify(bad));
const A=byNm('PC-A'),B=byNm('PC-B'),R1=byNm('R1'),R2=byNm('R2'),R3=byNm('R3');
let t=go(R1,'route check');console.log(t);
ok(/R2: маршрут 192\.168\.2\.0\/24 через 10\.0\.23\.3 – в подсети gi0\/1 нет устройства/.test(t),'nonexistent nh');
ok(/R3: маршрут 192\.168\.1\.0\/24 через 10\.0\.12\.1 – next-hop не лежит/.test(t),'nh not connected');
ok(/Найдено проблем маршрутизации: \d/.test(t),'count');
go(R2,'route del 192.168.2.0');go(R2,'route add 192.168.2.0 /24 10.0.23.2');go(R3,'route del 192.168.1.0');go(R3,'route add 192.168.1.0 /24 10.0.23.1');
t=go(R1,'route check');console.log(t);ok(/Проблем статической маршрутизации не найдено/.test(t),'clean after fix');
computeRip();EX=[];ok(trip(A,B.ifaces[0].ip).ok&&trip(B,A.ifaces[0].ip).ok,'ping both ways');
// missing return route
go(R3,'route del 192.168.1.0');t=go(R1,'route check');console.log(t);ok(/Нет маршрута: R3 не знает сеть/.test(t)||/Нет маршрута/.test(t),'return path: '+t.split('\n')[1]);
go(R3,'route add 192.168.1.0 /24 10.0.23.1');
// loop
go(R2,'route del 192.168.2.0');go(R2,'route add 192.168.2.0 /24 10.0.12.1');go(R1,'route del 192.168.2.0');go(R1,'route add 192.168.2.0 /24 10.0.12.2');t=go(R1,'route check');console.log(t);ok(/Петля: R2 отправляет сеть 192\.168\.2\.0\/24 на R1, а R1 возвращает/.test(t)||/Петля/.test(t),'loop');
go(R2,'route del 192.168.2.0');go(R2,'route add 192.168.2.0 /24 10.0.23.2');
// self nh, iface off
go(R1,'route add 10.9.0.0 /24 10.0.12.1');t=go(R1,'route check');ok(/собственный адрес/.test(t),'self');go(R1,'route del 10.9.0.0');
go(R2,'shutdown gi0/1');t=go(R1,'route check');ok(/интерфейс gi0\/1 к next-hop отключён|отключён/.test(t),'iface off');go(R2,'no shutdown gi0/1');
ok(/Проблем статической маршрутизации не найдено/.test(go(R1,'route check')),'clean again');
// robustness
R1.routes=[null,{net:'x'},{net:'1.1.1.0',mask:'255.255.255.0',nh:'zzz'}];ok(typeof go(R1,'route check')==='string','junk routes ok');
// exam
const x=EXNET.find(e=>/Маршруты: исправить/.test(e.n));x.start({});const cr=x.crit({});const sc=()=>cr.map(c=>c[2]()?c[1]:0);
ok(cr.reduce((a,b)=>a+b[1],0)===100,'sum');ok(sc().reduce((a,b)=>a+b)===0,'before 0 ('+sc()+')');
const r1=byNm('R1'),r2=byNm('R2'),r3=byNm('R3');go(r2,'route del 192.168.2.0');go(r2,'route add 192.168.2.0 /24 10.0.23.2');console.log(sc());
go(r3,'route del 192.168.1.0');go(r3,'route add 192.168.1.0 /24 10.0.23.1');console.log(sc());ok(sc().reduce((a,b)=>a+b)===100,'full 100');
go(r1,'route add 0.0.0.0 0.0.0.0 10.0.12.2');ok(sc()[3]===0,'default route loses points');
ok(MAN.some(m=>/Т77/.test(m[0])),'manual');
