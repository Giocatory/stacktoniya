(function(){const R=[];const bad=[];
const CMDS=['help','ip','ipv6','show ip route','show ipv6 route','show ipv6 neighbors','show ipv6 ospf','show ipv6 dhcp','show ipv6 ra','show ip ospf neighbor','show ip eigrp neighbors','show crypto','show crypto Tunnel0','wg show','wg','ipsec','ipsec Tunnel0','ospf3','ospf3 on','ospf3 rid','ospf3 rid x','ospf3 show','ospf','ospf area','ospf area gi0/0','ospf area gi0/0 x','ospf hello','ospf hello gi0/0 0','eigrp','eigrp on','eigrp k','ra','ra flag','ra flag gi0/0 X on','ra lifetime gi0/0 -1','ra lifetime gi0/0 99999','ra on nope','dhcp6','dhcp6 on','dhcp6 on nope','dhcp6 on gi0/0 abc','dhcp6 show','dhcp6 force','slaac','ndp','ndp discover','ndp clear','ndp x','ipv6 info','ipv6 info zzz','ipv6 info ::','ipv6 info ::1','ipv6 info ff02::1:ff00:1','ipv6 info 2001:db8::/129','ipv6 info 2001:db8::/0','v6split','v6split 2001:db8::/32','v6split 2001:db8::/32 200','v6split ::/0 128 3','v6split 2001:db8::/32 64 0','v6check','vpncheck','routingcheck','wifiplan','wifi scan','iwlist scan','nmcli','channel','channel 99','channel5','security','security wpa2','security x y','share','python3','python3 -c','python3 -c "print(1/0)"','python3 -c "import sys;print(sys.argv)"','nano','vim','ansible','ansible all','ansible-playbook','ansible-playbook nofile.yml','ansible-inventory','stask','stask list','stask show 99','stask check 0','stask prep x','exam','ping','ping6','ping6 zzz','traceroute','traceroute6 ::1','gateway6','gateway6 zzz','ip6','ip6 zzz','ip6 2001:db8::1/200','route6','route6 add','route6 add x y','route6 del x','ipv6 unicast-routing','ipv6 address','cat','ls','echo $?','history','clear'];
const tpls=TPL.map((t,i)=>i);let runs=0;
const o=document.getElementById('out');
for(const ti of tpls){try{tplLoad(TPL[ti])}catch(e){bad.push('TPL '+ti+' '+e.message);continue}
 const devs=S.devs.slice();
 for(const d of devs){if(d.t==='sw'&&Math.random()<.5)continue;sel=d.id;
  for(const c of CMDS){o.textContent='';runs++;
   try{run(c)}catch(e){bad.push(`[${TPL[ti].n}] ${d.name}(${d.t}) "${c}" → ${e.message}`)}
   const t=o.textContent;if(/TypeError|ReferenceError|RangeError|SyntaxError: |Cannot read|is not a function|is not defined|Внутренняя ошибка|внутренняя ошибка/.test(t)){bad.push(`[${TPL[ti].n}] ${d.name} "${c}" → ${t.slice(0,120).replace(/\n/g,' ')}`)}
  }}
 if(bad.length>40)break}
R.push('runs '+runs+' bad '+bad.length);
const seen={};bad.forEach(b=>{const k=b.replace(/^\[[^\]]*\] \S+ /,'');if(!seen[k]){seen[k]=1;R.push(b)}});
return R.slice(0,60).join('\n')})();
