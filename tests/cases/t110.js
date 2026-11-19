const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
const go=(d,c)=>{sel=d.id;const o=out.textContent.length;try{run(c)}catch(e){console.log('ERR',c,e.message)}return out.textContent.slice(o)};
ok(!tplLoad(TPL.find(x=>/IPAM: найти/.test(x.n))).length,'tpl');
const A=byNm('PC-A'),B=byNm('PC-B'),C=byNm('PC-C'),R1=byNm('R1');
let t=go(A,'ipam check');console.log(t);ok(/Дубликат адреса 192\.168\.10\.10: PC-A eth0, PC-B eth0/.test(t)&&/Пересечение подсетей 192\.168\.10\.0\/24 /.test(t)&&/PC-B: шлюз 192\.168\.1\.1 вне подсети/.test(t)&&/Найдено проблем: 3/.test(t),'3 problems');
t=go(A,'ipam');console.log(t);ok(/192\.168\.10\.0\/24/.test(t)&&/192\.168\.10\.0\/25/.test(t)&&/Проблем адресации: 3/.test(t),'summary');
t=go(A,'ipam 192.168.10.0/24');console.log(t);ok(/ёмкость 254/.test(t)&&/Занято: 3/.test(t)&&/первые свободные: 192\.168\.10\.2–192\.168\.10\.9/.test(t)&&/Проблемы в этой сети/.test(t),'net view');
ok(/Использование/.test(go(A,'ipam foo'))&&/Использование/.test(go(A,'ipam 1.1.1.1/40')),'usage');
// special addresses
go(C,'ip eth0 192.168.10.0 /24');t=go(A,'ipam check');ok(/адрес сети 192\.168\.10\.0\/24/.test(t),'network address');
go(C,'ip eth0 192.168.10.255 /24');t=go(A,'ipam check');ok(/широковещательный/.test(t),'broadcast');
go(C,'ip eth0 192.168.10.30 /24');go(B,'ip eth0 192.168.10.20 /24');go(B,'gateway 192.168.10.1');t=go(A,'ipam check');ok(/Проблем адресации не найдено/.test(t),'clean: '+t);
t=go(A,'ipam');ok(/3 \/ 254/.test(t.replace(/\s+/g,' '))||/4 \/ 254/.test(t.replace(/\s+/g,' ')),'util');
// exam
const x=EXNET.find(e=>/IPAM: устранить/.test(e.n));x.start({});const cr=x.crit({});const sc=()=>cr.map(c=>c[2]()?c[1]:0);
ok(cr.reduce((a,b)=>a+b[1],0)===100,'sum');ok(sc().reduce((a,b)=>a+b)===0,'before 0 ('+sc()+')');
const a=byNm('PC-A'),b=byNm('PC-B'),c=byNm('PC-C');go(b,'ip eth0 192.168.10.20 /24');console.log(sc());ok(sc()[0]===20,'dup fixed');
go(c,'ip eth0 192.168.10.30 /24');ok(sc()[1]===20,'mask fixed');go(b,'gateway 192.168.10.1');
console.log(sc());ok(sc().reduce((s,v)=>s+v)===100,'full 100');
// robustness
S.devs[0].ifaces[0].mask='garbage';S.devs[1].ifaces[0].ip=null;ok(typeof go(a,'ipam check')==='string','garbage ok');
ok(MAN.some(m=>/Т73/.test(m[0])),'manual');
