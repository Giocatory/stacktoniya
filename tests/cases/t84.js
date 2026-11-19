const bad=['{"devs":5}','{"devs":[{}]}','{"devs":[null]}','{"devs":[{"id":"d1","t":"pc","ifaces":5}]}','[1]','null','{"devs":[{"id":"d1","t":"zzz","ifaces":[]}]}'];
let ok=1;const before=JSON.stringify(S);
bad.forEach(b=>{let r;try{r=schemeSet(JSON.parse(b))}catch(e){r='EXC'}if(r!==false){ok=0;console.log('FAIL accepted',b,r)}if(JSON.stringify(S)!==before){ok=0;console.log('FAIL state changed',b)}});
// dangling link pruned
const g=JSON.parse(before);g.links.push({a:'x1',ai:0,b:'x2',bi:0});const n0=g.links.length-1;
console.log(schemeSet(g)&&S.links.length===n0?'PASS dangling link pruned':'FAIL prune');
// stored corrupt state does not brick start
console.log(ok?'PASS bad imports rejected, state intact':'FAIL');
// good roundtrip
const s1=JSON.stringify(S);console.log(schemeSet(JSON.parse(s1))&&S.devs.length?'PASS roundtrip':'FAIL roundtrip');
// collab check rejects
try{colCheck('{"devs":[{}],"links":[]}');console.log('FAIL collab')}catch(e){console.log('PASS collab rejects')}
