const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
const T=TPL.find(x=>/^SPAN:/.test(x.n));ok(!!T&&!tplLoad(T).length,'template loads');
const SW=byNm('SW1'),A=byNm('PC-A'),B=byNm('PC-B'),I=byNm('PC-IDS');
const go=(d,c)=>{sel=d.id;const o=out.textContent.length;run(c);return out.textContent.slice(o)};
const pn=d=>SW.ifaces[SW.ifaces.findIndex((f,i)=>{const q=peer(SW,i);return q&&q.d===d})].n;
go(A,'ping 192.168.1.20');let t=go(I,'sniff');ok(/зеркального порта нет/.test(t)&&/Кадров нет/.test(t),'no SPAN: IDS sees nothing');
t=go(A,'sniff');ok(/кадр моего узла/.test(t),'host sees its own frames');
t=go(SW,'span 1 destination '+pn(I));ok(/порт-приёмник/.test(t),'dest set');
t=go(SW,'span 1 source '+pn(I));ok(/не может быть/.test(t),'src==dst rejected');
t=go(SW,'span 1 source '+pn(A)+' both');ok(/источник/.test(t)&&SW.span['1'].src.length===1,'source set');
t=go(SW,'show span');ok(new RegExp(pn(A)).test(t)&&new RegExp(pn(I)).test(t),'show span');
go(A,'ping 192.168.1.20 -n 1');t=go(I,'sniff');ok(/SPAN SW1 сессия 1/.test(t)&&/192\.168\.1\.10 → 192\.168\.1\.20/.test(t)&&/ICMP/.test(t),'IDS sees mirrored A→B ('+(t.split('\n').length)+' lines)');
ok(/rx/.test(t)&&/tx/.test(t),'both directions captured');
// rx only
go(SW,'span 1 source '+pn(A)+' rx');SPAN_LOG.length=0;go(A,'ping 192.168.1.20 -n 1');t=go(I,'sniff');
ok(/rx/.test(t)&&!/ tx/.test(t.replace(/rx/g,'')),'rx-only filter');
// B->A traffic with source A (tx towards A on reply)
SPAN_LOG.length=0;go(B,'ping 192.168.1.10 -n 1');t=go(I,'sniff');ok(/SPAN/.test(t),'traffic towards source port mirrored (tx/rx by dir)');
// cisco syntax
SW.vend='cisco';SW.vm={m:'conf'};t=go(SW,'monitor session 2 source interface '+pn(B)+' both');ok(SW.span['2']&&SW.span['2'].src.length===1,'cisco monitor session source');
go(SW,'monitor session 2 destination interface '+pn(I));ok(SW.span['2'].dst===pn(I),'cisco monitor session destination');
go(SW,'no monitor session 2');ok(!SW.span['2'],'no monitor session');delete SW.vend;delete SW.vm;
t=go(SW,'span 9 off');ok(/1–4/.test(t),'validation');
go(SW,'span 1 off');ok(!SW.span,'session removed');
t=go(I,'sniff clear');ok(/очищен/.test(t),'sniff clear');
// exam
const x=EXNET.find(e=>/SPAN: подключить/.test(e.n));ok(!!x,'exam registered');x.start({});const cr=x.crit({});ok(cr.reduce((a,b)=>a+b[1],0)===100,'sum 100');
let sc=cr.map(c=>c[2]()?c[1]:0);ok(sc[3]===15&&sc.reduce((a,b)=>a+b)===15,'before: only connectivity ('+sc+')');
const S2=byNm('SW1'),A2=byNm('PC-A'),I2=byNm('PC-IDS');const pn2=d=>S2.ifaces[S2.ifaces.findIndex((f,i)=>{const q=peer(S2,i);return q&&q.d===d})].n;
sel=S2.id;run('span 1 source '+pn2(A2)+' both');run('span 1 destination '+pn2(I2));sc=cr.map(c=>c[2]()?c[1]:0);ok(sc.reduce((a,b)=>a+b)===100,'after: 100 ('+sc+')');
ok(MAN.some(m=>/Т59/.test(m[0])),'manual entry');
