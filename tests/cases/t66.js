(function(){const R=[];const ok=(n,c,i)=>R.push((c?'PASS ':'FAIL ')+n+(c?'':' '+String(i||'').slice(0,400)));
try{tplLoad(TPL[0]);const A=byNm('PC1'),W=byNm('Web');
 const run1=(sc,a,z,o)=>pcBuild(sc,a,z,o||{});
 let r=run1('icmp',A,byNm('PC2'));ok('ping в LAN: ARP+8 ICMP',r.fr.length>=10&&r.fr[0].proto==='ARP'&&r.fr.some(f=>f.proto==='ICMP'),r.fr.map(f=>f.proto).join());
 r.fr.forEach(f=>{});const ic=r.fr.find(f=>f.proto==='ICMP');ok('контрольная сумма IP верна',pcB.sum(ic.bytes.slice(14,34))===0);ok('контрольная сумма ICMP верна',pcB.sum(ic.bytes.slice(34))===0);
 r=run1('icmp',A,W);ok('ping через роутеры: несколько сегментов',new Set(r.fr.map(f=>f.seg)).size>=4,[...new Set(r.fr.map(f=>f.seg))].join('|'));
 const ttls=r.fr.filter(f=>f.proto==='ICMP'&&f.meta.ips[0]===r.sip).map(f=>f.bytes[22]);ok('TTL уменьшается по пути',Math.max(...ttls)>Math.min(...ttls),ttls.join());
 r=run1('http',A,W,{name:'',port:80});const hp=r.fr.filter(f=>f.proto==='HTTP');ok('HTTP: GET и 200',hp.some(f=>/GET \//.test(f.httpTxt))&&hp.some(f=>/200 OK/.test(f.httpTxt)),r.fr.map(f=>f.proto).join());
 const syn=r.fr.find(f=>f.proto==='TCP');ok('TCP checksum верна',(()=>{const b=syn.bytes,pseudo=[...b.slice(26,34),0,6,...pcB.u16(b.length-34),...b.slice(34)];return pcB.sum(pseudo)===0})());
 const tcpF=pcFilter('tcp.port==80 && ip.addr=='+srcIp(A));ok('фильтр tcp.port && ip.addr',r.fr.filter(tcpF).length>=6&&r.fr.filter(f=>!f.meta.protos.has('arp')).every(tcpF));
 ok('фильтр !arp',r.fr.filter(pcFilter('!arp')).every(f=>f.proto!=='ARP'));ok('фильтр contains',r.fr.filter(pcFilter('frame contains "GET"')).length>=1);ok('or/скобки',r.fr.filter(pcFilter('(arp || http) && !tcp.port==9999')).length>0);
 r=run1('tcp',A,W,{port:2222});ok('закрытый порт → RST',r.fr.some(f=>/RST/.test(f.info)),r.fr.map(f=>f.info).join(' / '));
 r=run1('dns',A,W,{name:'www.test.lab'});const dq=r.fr.filter(f=>f.proto==='DNS');ok('DNS запрос и ответ',dq.length>=2&&dq.some(f=>f.bytes.length>60),r.fr.map(f=>f.proto).join());
 const dd=pcDissect(dq.find(f=>/response/.test(f.info)));ok('DNS дерево с ответом',dd.some(l=>/Domain Name System \(response\)/.test(l.n)),JSON.stringify(dd.map(l=>l.n)));
 r=run1('dhcp',A,byNm('R1'),{});ok('DHCP DORA 4 кадра',r.fr.filter(f=>f.proto==='DHCP').length===4&&/Offer/.test(r.fr[1].info),r.fr.map(f=>f.info).join('|'));
 r=run1('trace',A,W,{});ok('трассировка: Time exceeded и reply',r.fr.some(f=>/Time-to-live exceeded/.test(f.info))&&r.fr.some(f=>/достигнут/.test(f.info)),r.fr.map(f=>f.info).join('|'));
 // Нет связи
 const bk=JSON.stringify(S);byNm('ISP').ifaces[0].off=true;r=run1('icmp',A,W,{});ok('нет связи → пустой захват',r.fr.length===0,r.fr.length);S=JSON.parse(bk);
 // UI
 pcOpen();ok('окно открылось',!document.getElementById('pcw').hidden);document.getElementById('pcs').value='http';document.getElementById('pca').value='PC1';document.getElementById('pcz').value='Web';pcGo();ok('таблица кадров',document.querySelectorAll('#pct tr[data-n]').length>5);
 document.querySelector('#pct tr[data-n="1"]').click();ok('дерево и hex',document.querySelectorAll('#pctree .fl').length>5&&/0000/.test(document.getElementById('pchex').textContent));
 const fl=document.querySelector('#pctree .fl[data-o]');fl.click();ok('подсветка байтов',document.querySelectorAll('#pchex .hl').length>0);
 const f=document.getElementById('pcf');f.value='icmp';f.dispatchEvent(new Event('input',{bubbles:true}));ok('фильтр в UI',document.querySelectorAll('#pct tr[data-n]').length===0);f.value='';f.dispatchEvent(new Event('input',{bubbles:true}));
 const pc=pcPcap();ok('pcap заголовок',pc[0]===0xd4&&pc[1]===0xc3&&pc.length>24+PC.fr.length*16);document.getElementById('pcc').click();
 ok('пункт меню',!!document.getElementById('bpcap'));ok('MAN Т39',MAN.some(x=>/^Т39/.test(x[0])));
}catch(e){R.push('ERR '+e.stack)}return R.join('\n')})()
