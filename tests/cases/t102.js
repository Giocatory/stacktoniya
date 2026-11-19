const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
let n=0,diff=[];
for(const T of TPL){try{tplLoad(T)}catch(e){diff.push(T.n+' load '+e);continue}
 const a=JSON.stringify(S);const r=schemeSet(JSON.parse(a));if(!r){diff.push(T.n+' rejected');continue}
 const b=JSON.stringify(S);if(a!==b){const A=JSON.parse(a),B=JSON.parse(b);const ks=new Set();A.devs.forEach((d,i)=>{for(const k of Object.keys(d))if(JSON.stringify(d[k])!==JSON.stringify(B.devs[i][k]))ks.add(k)});diff.push(T.n+' changed: '+[...ks].join(','))}n++}
ok(n===TPL.length&&!diff.length,'all '+TPL.length+' templates survive import unchanged; '+JSON.stringify(diff.slice(0,5)));
// features carried through import
tplLoad(TPL.find(x=>/Фильтрация редистрибуции/.test(x.n)));schemeSet(JSON.parse(JSON.stringify(S)));
const R2=byNm('R2');ok(R2.pl&&R2.rmap&&R2.redist&&R2.redist.some(r=>r.rm),'prefix-list/route-map/redist kept');
tplLoad(TPL.find(x=>/PBR по источнику/.test(x.n)));schemeSet(JSON.parse(JSON.stringify(S)));ok(byNm('R1').pbr.length===1,'pbr kept');
