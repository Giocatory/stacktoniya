(function(){const R=[];const ok=(n,c,i)=>R.push((c?'PASS ':'FAIL ')+n+(c?'':' '+String(i||'').slice(0,300)));
try{let bad=[];
 TPL.forEach((t,i)=>{try{tplLoad(t);S.devs.slice(0,6).forEach(d=>{sel=d.id;['help','ipconfig','ip a','show ip route','ping 127.0.0.1','history'].forEach(c=>{try{run(c)}catch(e){bad.push(i+':'+d.name+':'+c+':'+e.message)}})})}catch(e){bad.push('tpl'+i+':'+e.message)}});
 ok('шаблоны ('+TPL.length+') загружаются, базовые команды без исключений',bad.length===0,bad.slice(0,3).join(' | '));
 tplLoad(TPL[cmTplI()]);const d=byNm('PC1');sel=d.id;let nb=0,tot=0,fails=[];
 SXT.forEach(t=>{if(typeof t.sol!=='string')return;tot++;try{if(t.prep)t.prep(d);const m=t.d.match(/Создайте [^ ]*[\/\\]([\w.]+\.(?:sh|bat|ps1))/);if(!m)return;const base=t.sh==='bash'?SXB:SXWD;if(/^#!/.test(t.sol)||t.sh!=='bash'||true){sxPutF(d,base+m[1],t.sol);const r=t.chk(d);if(!r.every(x=>x[1]))fails.push(t.id)}}catch(e){fails.push(t.id+'!'+e.message)}});
 ok('эталонные решения заданий по скриптам ('+tot+')',fails.length<=4,fails.join(','));
 ok('MAN разделы',MAN.length>=40,MAN.length);ok('LAB список',typeof CMP==='object'&&CMP.ge&&CMP.pr);
 cmStart('ge','Тест',7,{});cmFinish(false);ok('ГИА: запуск/завершение',!!CMS.final);
}catch(e){R.push('ERR '+e.stack)}return R.join('\n')})()
