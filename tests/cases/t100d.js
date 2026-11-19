const T=TPL.find(x=>/Консоль Eltex ESR/.test(x.n));tplLoad(T);const R1=byNm('R1');
console.log('fresh',JSON.stringify(R1.ifaces[0]),JSON.stringify(Object.keys(R1)));
const go=(d,c)=>{sel=d.id;try{run(c)}catch(e){console.log('ERR',c,e.stack.split('\n').slice(0,2).join(' | '))}};
['cli eltex','configure','interface gi 1/0/1','ip address 192.168.1.1/24','exit','commit'].forEach(c=>go(R1,c));
console.log('after commit',JSON.stringify(R1.ifaces[0]));
try{side()}catch(e){console.log('side ok?',e.message)}
go(R1,'rollback');
console.log(side.toString().slice(0,300));
