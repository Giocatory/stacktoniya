const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
const go=(d,c)=>{sel=d.id;const o=out.textContent.length;try{run(c)}catch(e){console.log('ERR',c,e.message)}return out.textContent.slice(o)};
ok(!tplLoad(TPL.find(x=>/STP: разбор/.test(x.n))).length,'tpl');
const S1=byNm('SW1'),S2=byNm('SW2'),S3=byNm('SW3'),A=byNm('PC-A'),C=byNm('PC-C');
ok(S1.prio===4096,'priority preset');
let t=go(S1,'stp show');console.log(t);ok(/SW1\s+корневой/.test(t)&&/SW2\s+некорневой/.test(t)&&/Заблокированы: SW\d/.test(t),'show');
t=go(S2,'stp explain');console.log(t);ok(/Корневой мост: SW1/.test(t)&&/наименьший приоритет \(4096\)/.test(t)&&/Заблокирован порт SW\d/.test(t)&&/корневой порт/.test(t),'explain');
ok(/Корневой мост: SW1/.test(go(S1,'show spanning-tree')===''?'':go(S1,'stp explain')),'ok');
ok(/Bridge ID/.test(go(S3,'show spanning-tree')),'show spanning-tree alias');
// tie on priority -> MAC
['SW1','SW2','SW3'].forEach(n=>go(byNm(n),'stp priority 32768'));t=go(S1,'stp explain');ok(/приоритеты равны \(32768\), побеждает наименьший MAC/.test(t),'tie -> MAC');
// target config
go(S2,'stp priority 4096');go(S1,'stp priority 8192');t=go(S2,'stp explain');console.log(t);
ok(/Корневой мост: SW2/.test(t)&&/Заблокирован порт SW3 .* \(к SW1\)/.test(t)&&/Стоимость пути до корня одинакова/.test(t),'target explanation');
// cost-based block: make SW1 uplink slower
const l12=S.links.find(l=>(l.a===S1.id&&l.b===S2.id)||(l.a===S2.id&&l.b===S1.id));(l12.a===S1.id?S1:S2).ifaces[l12.a===S1.id?l12.ai:l12.bi].spd=100;
t=go(S2,'stp explain');console.log(t);ok(/дальше от корня/.test(t)||/Заблокирован/.test(t),'cost explanation');
// no switches
S.devs=S.devs.filter(d=>d.t!=='sw');ok(/нет управляемых/.test(go(A,'stp show')),'no switches');
// exam
const x=EXNET.find(e=>/STP: корень SW2/.test(e.n));x.start({});const cr=x.crit({});const sc=()=>cr.map(c=>c[2]()?c[1]:0);
ok(cr.reduce((a,b)=>a+b[1],0)===100,'sum');ok(sc().reduce((a,b)=>a+b)===0,'before 0 ('+sc()+')');
const s1=byNm('SW1'),s2=byNm('SW2'),s3=byNm('SW3'),a=byNm('PC-A'),c=byNm('PC-C');
go(s2,'stp priority 4096');console.log(sc());go(s1,'stp priority 8192');console.log(sc());
go(a,'ip eth0 192.168.1.10 /24');go(c,'ip eth0 192.168.1.11 /24');console.log(sc());ok(sc().reduce((x,y)=>x+y)===100,'full 100');
go(s3,'stp priority 1');go(s2,'stp priority 4096');console.log(sc());
ok(MAN.some(m=>/Т75/.test(m[0])),'manual');
