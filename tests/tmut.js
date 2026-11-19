const base=JSON.stringify(S);let seed=7;const rnd=()=>(seed=(seed*1103515245+12345)&0x7fffffff)/0x7fffffff;
const vals=[null,5,'x',[],{},-1,1e9,true,'999.1.1.1'];
function walk(o,path,list){if(o&&typeof o==='object'){for(const k in o){list.push([o,k]);walk(o[k],path+'.'+k,list)}}}
let rej=0,acc=0,bad=[];const cmds=['ping 10.0.0.1','show ip route','ipconfig','help','arp','ls'];
for(let i=0;i<800;i++){const j=JSON.parse(base);const L=[];walk(j,'',L);
 for(let m=0;m<1+Math.floor(rnd()*3);m++){const [o,k]=L[Math.floor(rnd()*L.length)];(j.__m=j.__m||[]).push(k+'='+String(JSON.stringify(o[k])).slice(0,40));if(rnd()<.3)delete o[k];else o[k]=vals[Math.floor(rnd()*vals.length)]}
 const keep=JSON.stringify(S);
 let r;try{r=schemeSet(j)}catch(e){bad.push('schemeSet threw '+e);continue}
 if(!r){rej++;if(JSON.stringify(S)!==keep)bad.push('rollback changed state #'+i)}
 else{acc++;try{draw();side();for(const c of cmds){if(S.devs[0])execOn(S.devs[0],c)}computeRip&&computeRip()}catch(e){bad.push('post-load #'+i+': '+String(e).slice(0,90)+' '+(e.stack||'').split('\n').slice(1,3).join('|').slice(0,200)+' MUT '+JSON.stringify(j.__m))}}
 S=JSON.parse(base);}
console.log('acc',acc,'rej',rej,'bad',bad.length);console.log([...new Set(bad)].slice(0,8).join('\n'));
