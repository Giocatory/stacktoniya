(function(){const R=[];const ok=(n,c,i)=>R.push((c?'PASS ':'FAIL ')+n+(c?'':' '+String(i||'').slice(0,300)));
try{for(const v of [1,2,3,4]){
 const c=cyBuild('blue',v);const ad=byNm('Admin');const log=sxRd(ad,SXH+'/'+(c.kind==='ssh'?'auth.log':'firewall.log'));
 ok(`blue v${v} (${c.kind}): журнал создан`,log&&log.split('\n').length>c.n);
 const lines=log.split('\n');const cnt=c.kind==='ssh'?lines.filter(l=>l.includes('Failed')&&l.includes(c.atk)).length:new Set(lines.filter(l=>l.includes('SRC='+c.atk)).map(l=>l.match(/DPT=(\d+)/)[1])).size;ok('n в журнале = ctx.n',cnt===c.n,cnt+' vs '+c.n);
 ok('до решения ничего не выполнено, но связность есть',cyEval().filter(x=>x[1]).length>=2&&!cyEval().every(x=>x[1]),JSON.stringify(cyEval()));
 ok('Attacker достаёт Server:22 до блокировки',cmL4('Attacker','Server',22)&&cmL4('Admin','Server',22),'');
 sxPutF(ad,SXH+'/incident.txt',c.atk+' '+c.n+'\n');
 if(c.kind==='ssh')execOn(byNm('R1'),`acl deny ${c.atk}/32 any tcp 22`),execOn(byNm('R1'),'acl permit any any');else{execOn(byNm('R1'),`acl deny ${c.atk}/32 any tcp 22`);execOn(byNm('R1'),`acl deny ${c.atk}/32 any tcp 80`);execOn(byNm('R1'),'acl permit any any')}
 const r=cyEval();ok('после правильного решения всё выполнено',r.every(x=>x[1]),JSON.stringify(r.filter(x=>!x[1])));
}
 // неверное решение: блок всей сети
 cyBuild('blue',1);execOn(byNm('R1'),'acl deny any any tcp 22');execOn(byNm('R1'),'acl permit any any');ok('грубая блокировка всех ловится (Admin теряет доступ?)',(()=>{const r=cyEval();return r.some(x=>!x[1])})());
 // red
 const c=cyBuild('red',2);const A=byNm('Attacker');sel=A.id;const o=document.getElementById('out');o.textContent='';run('brute 192.168.10.10 admin');ok('brute: пароль не из встроенного словаря → не найден (hard)',/не найдено/.test(o.textContent)&&c.hard,o.textContent.slice(0,200));
 sxPutF(A,SXH+'/words.txt','x\n'+c.pw+'\n');o.textContent='';run('brute 192.168.10.10 admin words.txt');ok('brute со своим словарём находит',o.textContent.includes('password: '+c.pw));
 sxPutF(A,SXH+'/pentest.txt','ports 22 80 '+c.extra+' pw '+c.pw+'\n');ok('red все критерии',cyEval().every(x=>x[1]),JSON.stringify(cyEval()));
 const c3=cyBuild('red',3);sel=byNm('Attacker').id;o.textContent='';run('brute 192.168.10.10 admin');ok('простой пароль находится встроенным словарём (v3)',o.textContent.includes('password: '+c3.pw),o.textContent.slice(-150));
 execOn(byNm('R1'),`acl deny ${c3.atk}/32 any tcp 22`);execOn(byNm('R1'),'acl permit any any');o.textContent='';run('brute 192.168.10.10 admin');ok('после блокировки brute не проходит',/не установлено/.test(o.textContent),o.textContent);
 cyPanel();ok('панель',document.getElementById('mb').innerHTML.includes('Кибер-учения'));ok('меню и MAN',!!document.getElementById('bcyb')&&MAN.some(x=>/^Т41/.test(x[0])));
}catch(e){R.push('ERR '+e.stack)}return R.join('\n')})()
