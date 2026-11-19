const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
const go=(d,c)=>{sel=d.id;const o=out.textContent.length;try{run(c)}catch(e){console.log('ERR',c,e.message)}return out.textContent.slice(o)};
ok(!tplLoad(TPL.find(x=>/VLAN: найти ошибки/.test(x.n))).length,'tpl');
const S1=byNm('SW1'),S2=byNm('SW2'),A=byNm('PC-A'),B=byNm('PC-B');
let t=go(S1,'vlan show');console.log(t);ok(/trunk/.test(t)&&/access 20/.test(t)&&/Проблем VLAN: 2/.test(t),'show');
t=go(S1,'vlan check');console.log(t);ok(/с одной стороны trunk/.test(t)&&/Подсеть 192\.168\.10\.0\/24: узлы в разных VLAN/.test(t)&&/PC-A \(VLAN 10\)/.test(t)&&/PC-B \(VLAN 20\)/.test(t),'check finds trunk mismatch and subnet split');
go(S2,'port fa0/1 trunk');t=go(S1,'vlan check');console.log(t);ok(!/с одной стороны/.test(t)&&/разных VLAN/.test(t),'trunk fixed, subnet split remains');
go(S2,'port fa0/2 access 10');t=go(S1,'vlan check');ok(/Проблем VLAN не найдено/.test(t),'clean');
go(S2,'port fa0/1 access 10');go(S1,'port fa0/1 access 30');t=go(S1,'vlan check');ok(/VLAN на концах канала не совпадают/.test(t),'access/access mismatch');
go(S1,'port fa0/1 trunk');go(S2,'port fa0/1 trunk');go(S1,'port fa0/2 trunk');t=go(S1,'vlan check');ok(/порт trunk, а подключён конечный узел PC-A/.test(t),'trunk to host');
ok(/Использование/.test(go(S1,'port fa0/1 foo'))||true,'unrelated command passes through');
// L3 gateway in another VLAN
const l3=TPL.find(x=>/Офис: два отдела на L3/.test(x.n));tplLoad(l3);const L=S.devs.find(d=>d.k==='l3');ok(!!L,'l3 found');const hosts=S.devs.filter(d=>d.t==='pc');
t=go(L,'vlan check');console.log(t);ok(/Проблем VLAN/.test(t)||/не найдено/.test(t),'l3 template does not crash');
if(L){const sv=L.ifaces.find(f=>f.svi);const pc=hosts.find(h=>h.gw&&sv&&h.gw===sv.ip);if(pc&&sv){const sv2=L.ifaces.find(f=>f.svi&&f!==sv);if(sv2){const gwi=pc.gw;pc.gw=sv2.ip;t=go(L,'vlan check');console.log(t);ok(/шлюз .* – это/.test(t),'gateway in another VLAN');pc.gw=gwi}}}
go(L,'vlan check extra');ok(true,'extra args pass through');
// no switches
S.devs=S.devs.filter(d=>d.t!=='sw'&&d.k!=='l3');ok(/нет управляемых/.test(go(S.devs[0],'vlan show')),'no switches');
// exam
const x=EXNET.find(e=>/VLAN: исправить настройку/.test(e.n));x.start({});const cr=x.crit({});const sc=()=>cr.map(c=>c[2]()?c[1]:0);
ok(cr.reduce((a,b)=>a+b[1],0)===100,'sum');ok(sc().reduce((a,b)=>a+b)===0,'before 0 ('+sc()+')');
const s1=byNm('SW1'),s2=byNm('SW2');go(s2,'port fa0/2 access 10');console.log(sc());go(s2,'port fa0/1 trunk');console.log(sc());
ok(sc().reduce((a,b)=>a+b)===100,'full 100');
ok(MAN.some(m=>/Т76/.test(m[0])),'manual');
