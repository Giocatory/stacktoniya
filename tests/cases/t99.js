const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
const T=TPL.find(x=>/PBR по источнику/.test(x.n));const bad=tplLoad(T);ok(!bad.length,'template loads '+JSON.stringify(bad));
const A=byNm('PC-A'),B=byNm('PC-B'),R1=byNm('R1'),R2=byNm('R2'),R3=byNm('R3');
const go=(d,c)=>{sel=d.id;const o=out.textContent.length;run(c);return out.textContent.slice(o)};
const via=(s,r)=>{EX=[];const t=trip(s,'192.168.9.10');return{ok:!!t.ok,thru:EX.some(e=>e.p&&e.p.includes(r.id)),pbr:EX.some(e=>/PBR/.test(e.x||''))}};
let v=via(B,R3);ok(v.ok&&v.thru&&v.pbr,'PC-B via R3 with PBR '+JSON.stringify(v));
v=via(A,R2);ok(v.ok&&v.thru&&!via(A,R3).thru,'PC-A via R2 only');
ok(R1.routes.length===1,'R1 routes untouched after PBR (no leaks)');
let t=go(R1,'show pbr');ok(/192\.168\.1\.20\/32/.test(t)&&/10\.0\.13\.2/.test(t),'show pbr');
t=go(R1,'route get 192.168.9.10 from 192.168.1.20');ok(/PBR правило 1/.test(t),'route get from: PBR '+t.split('\n')[0]);
t=go(R1,'route get 192.168.9.10 from 192.168.1.10');ok(/правил нет/.test(t),'route get from: no PBR');
go(R1,'pbr del 1');v=via(B,R3);ok(v.ok&&!v.thru,'after del PC-B via R2');
t=go(R1,'pbr add 192.168.1.20/32 via 8.8.8.8');ok(/не из подсети/.test(t),'bad nh');
t=go(R1,'pbr add foo via 10.0.13.2');ok(/Использование/.test(t),'bad src');
t=go(R1,'pbr add 192.168.1.0/24 to 192.168.9.0/24 via 10.0.13.2');ok(/правило 1/.test(t),'add with to');
v=via(A,R3);ok(v.ok&&v.thru,'subnet rule sends PC-A via R3');
t=go(R1,'pbr add 192.168.1.0/24 to 192.168.9.0/24 via 10.0.12.2');ok(/уже есть/.test(t),'dup rejected');
// failover: shut gi0/2 -> fallback
go(R1,'shutdown gi0/2');v=via(B,R2);ok(v.ok&&v.thru,'nh down -> fallback to table (R2)');
go(R1,'no shutdown gi0/2');go(R1,'pbr clear');ok(!R1.pbr,'clear');
ok(R1.routes.length===1&&!R1.routes.some(r=>r.mask==='255.255.255.255'),'no leaked /32');
// exam
const x=EXNET.find(e=>/PBR: бухгалтерия/.test(e.n));ok(!!x,'exam');x.start({});const cr=x.crit({});ok(cr.reduce((a,b)=>a+b[1],0)===100,'sum 100');
let sc=cr.map(c=>c[2]()?c[1]:0);ok(sc.reduce((a,b)=>a+b)===0,'before 0 ('+sc+')');
go(byNm('R1'),'pbr add 192.168.1.20/32 via 10.0.13.2');sc=cr.map(c=>c[2]()?c[1]:0);ok(sc.reduce((a,b)=>a+b)===100,'after 100 ('+sc+')');
ok(MAN.some(m=>/Т64/.test(m[0])),'manual');
