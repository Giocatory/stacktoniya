const N=25;const dev=[['pc','PA',0,0],['pc','PB',9,0]],link=[['PA',0,'R0',0],['R'+(N-1),1,'PB',0]],cfg=[['PA','ip eth0 192.168.1.10 /24','gateway 192.168.1.1'],['PB','ip eth0 192.168.2.10 /24','gateway 192.168.2.1']];
for(let i=0;i<N;i++){dev.push(['rt','R'+i,100+i*40,200]);
 cfg.push(['R'+i,'ip gi0/0 '+(i?'10.0.'+i+'.2 /30':'192.168.1.1 /24'),'ip gi0/1 '+(i<N-1?'10.0.'+(i+1)+'.1 /30':'192.168.2.1 /24'),'ospf on']);if(i<N-1)link.push(['R'+i,1,'R'+(i+1),0]);}
const bad=tplLoad({n:'chain',dev,link,cfg,hint:''});
const r=trip(byNm('PA'),'192.168.2.10');
console.log(!bad.length&&r.ok?'PASS chain of 25 routers ping (TTL 64)':'FAIL '+JSON.stringify(bad).slice(0,200)+JSON.stringify(r&&r.ok));
console.log(typeof draw==='function'&&typeof side==='function'?'PASS draw/side restored':'FAIL restore');
