(function(){const R=[];const ok=(n,c,i)=>R.push((c?'PASS ':'FAIL ')+n+(c?'':' '+String(i||'').slice(0,500)));
try{tplLoad(TPL[cmTplI()]);const d=byNm('PC1');sel=d.id;ok('заданий',SXT.length>=86,SXT.length);
for(const t of SXT.filter(z=>/^(b(2[2-9]|3\d|40)|c[6-9]|p([7-9]|10))$/.test(z.id))){
 if(t.prep)t.prep(d);const r0=t.chk(d);
 const fm=t.d.match(/Создайте [^ ]*[\/\\]([\w.]+\.(?:sh|bat|ps1))/);const nm=fm[1];const base=t.sh==='bash'?SXB:SXWD;
 ok(t.id+' до решения не выполнено',!r0.every(x=>x[1]));
 sxPutF(d,base+nm,t.sol);const r1=t.chk(d);ok(t.id+' ('+t.t+'): эталон',r1.every(x=>x[1]),JSON.stringify(r1.filter(x=>!x[1])))}
}catch(e){R.push('ERR '+e.stack)}return R.join('\n')})()
