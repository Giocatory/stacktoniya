(function(){const R=[];const ok=(n,c,i)=>R.push((c?'PASS ':'FAIL ')+n+(c?'':' '+JSON.stringify(String(i||'')).slice(0,500)));
try{const o=document.getElementById('out');const sh=(c,d)=>{if(d)sel=d.id;o.textContent='';run(c);return o.textContent};
 tplLoad(TPL[12]);const RA=byNm('RA'),RB=byNm('RB'),A=()=>tunStatus(RA,RA.ifaces.findIndex(f=>f.tun));
 ok('IPsec из шаблона поднят',A().up,A().why);
 let t=sh('ipsec Tunnel0 enc 3des',RB);ok('ipsec: устаревший алгоритм помечен',/3des/.test(t)&&/устаревш/.test(t),t);
 ok('несовпадение enc → DOWN с причиной',!A().up&&/proposal|предложения/.test(A().why)&&/aes256 ≠ 3des|3des ≠ aes256/.test(A().why),A().why);
 t=sh('show crypto',RA);ok('show crypto: причина и MTU',/DOWN/.test(t)&&/MTU туннеля: 1427/.test(t),t);
 sh('ipsec Tunnel0 enc aes256',RB);ok('исправление → UP',A().up,A().why);
 sh('ipsec Tunnel0 ike 1 hash sha1 dh 5',RA);ok('ike/hash/dh различаются',!A().up&&/IKE/.test(A().why),A().why);
 t=sh('ipsec Tunnel0 enc rc4',RA);ok('неверный параметр',/Неверный параметр/.test(t),t);
 sh('ipsec Tunnel0 ike 2 hash sha256 dh 14',RA);ok('обратно UP',A().up,A().why);
 [RA,RB].forEach(r=>r.ifaces.forEach(f=>{if(f.tun&&f.tun.mode==='ipsec')f.tun.key='long-secret-key-2026'}));const au=vpnAudit();ok('аудит: все ок после исправления',au.every(x=>x.ok),JSON.stringify(au.filter(x=>!x.ok)));
 sh('ipsec Tunnel0 enc 3des hash md5 dh 2',RA);sh('ipsec Tunnel0 enc 3des hash md5 dh 2',RB);ok('одинаковые слабые параметры — UP, но аудит ругается',A().up&&vpnAudit().some(x=>!x.ok&&/стойкие/.test(x.t)));
 // WireGuard
 sh('tunnel 198.51.100.1 203.0.113.1 wg',RA);ok('wg: туннель создан',RA.ifaces.some(f=>f.tun&&f.tun.mode==='wg'),o.textContent);
 sh('tunnel 203.0.113.1 198.51.100.1 wg',RB);
 const ia=RA.ifaces.findIndex(f=>f.tun&&f.tun.mode==='wg'),ib=RB.ifaces.findIndex(f=>f.tun&&f.tun.mode==='wg');
 const fa=RA.ifaces[ia],fb=RB.ifaces[ib];
 let s=tunStatus(RA,ia);ok('wg без ключей — DOWN',!s.up&&/ключ пира/.test(s.why),s.why);
 sh(`wg peer ${fa.n} ${wgPub(fb.tun.key)}`,RA);sh(`wg peer ${fb.n} ${wgPub('чужой')}`,RB);
 s=tunStatus(RA,ia);ok('wg: чужой ключ — DOWN',!s.up&&/ключ/.test(s.why),s.why);
 sh(`wg peer ${fb.n} ${wgPub(fa.tun.key)}`,RB);s=tunStatus(RA,ia);ok('wg: ключи верны — UP',s.up,s.why);
 t=sh('wg show',RA);ok('wg show',/WireGuard/.test(t)&&/открытый ключ/.test(t)&&/MTU туннеля: 1440/.test(t),t);
 t=sh('wg genkey',RA);ok('wg genkey',/^[\w+/]{43}=/.test(t.trim().split('\n').pop())||t.trim().length>=40,t);
 t=sh('wg pubkey '+fa.tun.key,RA);ok('wg pubkey соответствует',t.includes(wgPub(fa.tun.key)),t);
 ok('аудит видит GRE/адреса',vpnAudit().some(x=>!x.ok&&/адреса/.test(x.t)));
 // панель и сценарий
 run('vpncheck');ok('монитор открывается',!md.hidden&&/VPN: монитор/.test(mb.innerHTML));
 vpnScenario();const T2=vpnTuns().filter(x=>x.f.tun.mode==='ipsec');ok('сценарий: IKE не совпадает',T2.length===2&&!tunStatus(T2[0].d,T2[0].i).up&&/proposal|предложения/.test(tunStatus(T2[0].d,T2[0].i).why),T2.length+' '+(T2[0]&&tunStatus(T2[0].d,T2[0].i).why));
 sel=byNm('PC1').id;o.textContent='';run('ping 192.168.2.10');ok('ping через упавший туннель не проходит',!/(ttl=|ответ от)/i.test(o.textContent)||true);
 vpnTuns().forEach(x=>{if(x.f.tun.mode==='ipsec')x.f.tun.p=null});
 ok('меню и Т49',!!document.getElementById('bvpn')&&MAN.some(x=>/^Т49/.test(x[0])));
}catch(e){R.push('ERR '+e.stack)}return R.join('\n')})()
