(function(){const R=[];const ok=(n,c,i)=>R.push((c?'PASS ':'FAIL ')+n+(c?'':' '+JSON.stringify(String(i||'')).slice(0,900)));
try{exSyncCustom();const ix=n=>EXQ.findIndex(q=>q.n.startsWith(n));
 const sh=(c,n)=>{sel=byNm(n).id;const o=document.getElementById('out');o.textContent='';run(c);return o.textContent};
 const score=(i,c)=>{const cs=EXQ[i].crit(c);let s=0,m=0,bad=[];cs.forEach(([t,p,f])=>{m+=p;let k=false;try{k=!!f()}catch(e){}if(k)s+=p;else bad.push(t)});return{s,m,bad}};
 for(const [nm,fix] of [['IPv6: авто',v=>{sh('ra on gi0/0','R1');sh('ra flag gi0/0 A on','R1');sh('ra flag gi0/0 M off','R1');sh('slaac','PC1');sh('slaac','PC2');sh('ip6 eth0 none','PC3');sh('ra lifetime gi0/1 1800','R1');sh('dhcp6','PC3')}],
   ['OSPF: сосед',v=>{const rb=byNm('R-B'),ra=byNm('R-A');['area','hello','dead','oauth','mtu','passive','prio'].forEach(k=>{rb.ifaces.forEach(f=>delete f[k]);ra.ifaces.forEach(f=>delete f[k])});ch()}],
   ['VPN: подн',v=>{vpnTuns().forEach(x=>{x.f.tun.p=null});ch()}],
   ['Wi-Fi: проб',v=>{sh('channel 1','AP1');sh('channel 6','AP2');sh('channel 11','AP3');['AP1','AP2','AP3'].forEach(n=>sh('security wpa2 StrongOffice2026','AP'+n.slice(2)));S.devs.forEach(d=>d.ifaces.forEach(f=>{if(f.wifi&&f.ssid)f.pass='StrongOffice2026'}));ch()}]]){
  const i=ix(nm);ok(nm+': задание найдено',i>=0);if(i<0)continue;
  for(const v of [0,1]){
   const c=EXQ[i].init(()=>v?0.9:0.1);EXQ[i].start(c);
   ok(nm+' v'+v+': текст не пуст',EXQ[i].text(c).length>50);
   const a=score(i,c);ok(nm+' v'+v+': до исправления не 100',a.s<a.m&&a.m===100,a);
   fix(v);const b=score(i,c);ok(nm+' v'+v+': после исправления 100/100',b.s===100,b.bad);
   if(nm.startsWith('Wi-Fi'))break}}
 // режим экзамена: запуск одного задания и отчёт
 const q=ix('OSPF: сосед');const o=document.getElementById('out');o.textContent='';run('exam start '+q+' 3 Иванов');
 ok('exam start запускает задание',/Экзамен|экзамен/.test(o.textContent)||!!EXS,o.textContent.slice(0,200));
 ok('в меню экзамена есть новые задания',/OSPF: соседства не образуются/.test(exMenu())&&/IPv6: автоадресация/.test(exMenu()));
}catch(e){R.push('FAIL EXC '+e.stack)}
return R.join('\n')})();
