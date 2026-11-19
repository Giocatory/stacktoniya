(function(){const R=[];const ok=(n,c,i)=>R.push((c?'PASS ':'FAIL ')+n+(c?'':' '+JSON.stringify(String(i||'')).slice(0,400)));
try{tplLoad(TPL[cmTplI()]);const d=byNm('PC1');sel=d.id;
 const ids=['py1','py2','py3','py4','py5','py6','py7','py8'];
 ids.forEach(id=>{const t=SXT.find(x=>x.id===id);if(!t){ok(id+' есть',false);return}
  if(t.prep)t.prep(d);const nm={py1:'sum',py2:'pal',py3:'words',py4:'log',py5:'net',py6:'node',py7:'inv',py8:'safe'}[id]+'.py';
  const before=t.chk(d);ok(id+' без решения не проходит',before.some(r=>!r[1]));
  sxPutF(d,SXB+nm,t.sol);const R2=t.chk(d);ok(id+' эталон проходит',R2.every(r=>r[1]),JSON.stringify(R2.filter(r=>!r[1])));
  const sh=sxShellOf(SXB+nm);ok(id+' sh=bash',sh==='bash')});
 ok('MAN Т45',MAN.some(x=>/^Т45/.test(x[0])));
}catch(e){R.push('ERR '+e.stack)}return R.join('\n')})()
