const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
tplLoad(TPL.find(x=>/PBR по источнику/.test(x.n)));
const R1=byNm('R1');const go=(d,c)=>{sel=d.id;const o=out.textContent.length;run(c);return out.textContent.slice(o)};
let t=go(R1,'matrix');console.log(t);
ok(/Доступно пар: 6 из 6/.test(t)&&/сегментов связности: 1/.test(t),'all 6 pairs ok, 1 segment');
t=go(R1,'matrix base');ok(/Эталон сохранён: 3/.test(t),'baseline');
go(R1,'shutdown gi0/1');go(R1,'shutdown gi0/2');
t=go(R1,'matrix diff');console.log(t);
ok(/Доступно пар: 2 из 6/.test(t)&&/сегментов связности: 2/.test(t),'after shutdown: 2 of 6, 2 segments');
ok(/Отличия от эталона/.test(t)&&/PC-A→SRV: ✓→✗/.test(t),'diff vs baseline');
ok(/✗ PC-A → SRV: /.test(t),'reason printed');
// panel
openMd(mxPanel());ok(/Матрица связности/.test(document.body.innerHTML)&&/data-mxc/.test(mb.innerHTML),'panel renders cells');
MX.sel=Object.keys(MX.res.cell).find(k=>!MX.res.cell[k].ok);ok(/нет связи/.test(mxPanel()),'cell details');
ok(mxCsv().split('\n').length===4,'csv 3 rows + header');
// stats: synthetic asymmetry + isolation
MX.res={ids:['a','b','c'],cell:{'a>b':{ok:true},'b>a':{ok:false},'a>c':{ok:false},'c>a':{ok:false},'b>c':{ok:false},'c>b':{ok:false}}};
const st=mxStats(MX.res);ok(st.asym.length===1&&st.iso.join()==='c'&&st.groups.length===3,'asym/isolated/groups '+JSON.stringify([st.asym,st.iso,st.groups.length]));
// no-op edge cases
tplLoad(TPL.find(x=>/Малый офис/.test(x.n)));const x=S.devs.find(d=>d.t==='rt')||S.devs[0];t=go(x,'matrix');ok(/./.test(t),'small office matrix runs');
go(x,'matrix foo');ok(/Использование/.test(go(x,'matrix foo')),'bad arg');
S.devs.filter(d=>d.t==='pc').forEach(d=>d.ifaces.forEach(f=>{f.ip='';f.mask=''}));ok(/минимум два/.test(go(x,'matrix')),'needs two hosts');
ok(MAN.some(m=>/Т66/.test(m[0])),'manual');
// state untouched: EX preserved, no leak
EX=[{p:[],x:'keep'}];mxRun();ok(EX.length===1&&EX[0].x==='keep','EX restored');
