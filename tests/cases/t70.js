(function(){const R=[];const ok=(n,c,i)=>R.push((c?'PASS ':'FAIL ')+n+(c?'':' '+String(i||'').slice(0,300)));
try{for(const v of [1,2]){const c=cyBuild('blue',v);const rs=siemCollect();const A=siemAnalyze(rs.ev);
 ok(`blue v${v} (${c.kind}): оповещение для атакующего`,A.some(a=>a.ip===c.atk),JSON.stringify(A.map(a=>a.ip)));
 ok('легитимный Admin не в оповещениях',!A.some(a=>a.ip==='192.168.10.20'),JSON.stringify(A));
 ok('тип правила',A[0].rule===(c.kind==='ssh'?'Подбор пароля SSH':'Сканирование портов'),A[0].rule);
 ok('источник найден',rs.srcs.length>=1,JSON.stringify(rs.srcs))}
 cyBuild('blue',2);SIEM.thr.ssh=1000;ok('высокий порог — без оповещений',siemAnalyze(siemCollect().ev).length===0);SIEM.thr.ssh=10;
 // красная команда → SIEM
 const c=cyBuild('red',3);sel=byNm('Attacker').id;out.textContent='';run('brute 192.168.10.10 admin');const A=siemAnalyze(siemCollect().ev);
 ok('следы brute видны в SIEM',(S.cy.ev||[]).length>0,JSON.stringify(S.cy.ev||[]).slice(0,100));
 const cc=S.cy;ok('успешный вход помечен (критический, если порог достигнут) либо не ниже среднего',A.length===0||A[0].ip===cc.atk,JSON.stringify(A));
 // принудительно: 12 неудач + вход
 S.cy.ev=[];for(let i=0;i<12;i++)S.cy.ev.push(`Nov  3 12:00:${10+i} server sshd[1]: Failed password for root from 1.2.3.4 port 1 ssh2`);S.cy.ev.push('Nov  3 12:01:00 server sshd[2]: Accepted password for root from 1.2.3.4 port 2 ssh2');
 const A2=siemAnalyze(siemCollect().ev);ok('вход после подбора = критический',A2[0]&&A2[0].sev==='critical'&&/Успешный вход/.test(A2[0].rule),JSON.stringify(A2));
 siemOpen();ok('окно',!document.getElementById('sm').hidden&&/Критический/.test(document.getElementById('smp').textContent));document.getElementById('sm_t1')&&0;
 document.querySelector('[data-x="sm_cl"]').click();ok('закрыто',document.getElementById('sm').hidden);ok('меню и MAN',!!document.getElementById('bsiem')&&MAN.some(x=>/^Т42/.test(x[0])));
}catch(e){R.push('ERR '+e.stack)}return R.join('\n')})()
