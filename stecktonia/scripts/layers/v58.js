// ===== v58: вендорные консоли Cisco IOS и Huawei VRP (режимы, приглашения, show / display) поверх общей модели устройств =====
// Включение: команда `cli cisco` или `cli huawei` на выбранном маршрутизаторе, L3- или обычном коммутаторе; `cli native` возвращает обычную консоль.
// Консоль только переводит команды в изменения модели (интерфейсы, VLAN, маршруты, NAT, ACL, DHCP, OSPF), поэтому проверки заданий работают одинаково.
const vcDot=n=>[24,16,8,0].map(s=>(n>>>s)&255).join('.');
const vcLen=m=>{let n=0,x=ip2n(m);if(x==null)return -1;for(let i=31;i>=0;i--){if((x>>>i)&1)n++;else break}return n};
function vcMask(x,wild){x=String(x||'');if(/^\/?\d{1,2}$/.test(x)){const n=+x.replace('/','');if(n<0||n>32)return null;return vcDot(n?(0xffffffff<<(32-n))>>>0:0)}
 const n=ip2n(x);if(n==null)return null;return wild?vcDot((~n)>>>0):x}
const vcNetOf=(ip,m)=>vcDot((ip2n(ip)&ip2n(m))>>>0);
function vcIf(d,t){t=String(t||'').toLowerCase().replace(/\s+/g,'');let m=t.match(/^(?:vlanif|vlan)(\d+)$/);if(m){const v=+m[1];return d.ifaces.find(x=>x.svi===v)||{svi:v,n:'Vlan'+v,_new:1}}
 m=t.match(/^([a-z-]+?)(\d+(?:\/\d+)*)$/);if(!m)return null;const L=m[1][0],nums=m[2].split('/').map(Number),ph=d.ifaces.filter(x=>!x.svi),num=x=>x.n.replace(/^[a-z]+/i,'');
 return ph.find(x=>x.n.toLowerCase()===t)||ph.find(x=>x.n[0]===L&&num(x)===nums.join('/'))||(nums.length===3?ph.find(x=>x.n[0]===L&&num(x)===nums.slice(1).join('/')):null)||(nums.length>=2?ph.find(x=>num(x)===nums.slice(-2).join('/')):null)||ph.find(x=>x.n[0]===L&&num(x).split('/').pop()===String(nums[nums.length-1]))||null}
const vcPeerUp=(d,f)=>{const i=d.ifaces.indexOf(f);return !f.svi&&i>=0&&!f.off&&!!peer(d,i)};
function vcPs(d){const el=$('#ps');if(!el||!d||!d.vend)return;const s=d.vm||{m:'user'},n=d.name;
 if(d.vend==='cisco'){const t={user:'>',priv:'#',conf:'(config)#',if:'(config-if)#',vlan:'(config-vlan)#',router:'(config-router)#',pool:'(dhcp-config)#',acl:'(config-ext-nacl)#'}[s.m]||'>';el.textContent=n+t+' '}
 else{const t={user:'<'+n+'>',sys:'['+n+']',if:'['+n+'-'+(s.n||'')+']',vlan:'['+n+'-vlan'+(s.v||'')+']',ospf:'['+n+'-ospf-1]',area:'['+n+'-ospf-1-area-0.0.0.0]',pool:'['+n+'-ip-pool-'+(s.pool||'')+']',acl:'['+n+'-acl-adv-'+(s.acl||'')+']'}[s.m]||'<'+n+'>';el.textContent=t+' '}}
{const _s=side;side=function(){_s();const d=sel&&dv(sel);if(d&&d.vend)vcPs(d)}}
// ---------- общие действия над моделью ----------
function vcVlan(d,v,name){d.vl=d.vl||{};if(!d.vl[v])d.vl[v]=name||('VLAN'+String(v).padStart(4,'0'));else if(name)d.vl[v]=name}
function vcVlans(d){const set={1:'default'};Object.keys(d.vl||{}).forEach(k=>set[k]=d.vl[k]);d.ifaces.forEach(f=>{if(!f.svi&&!f.tr&&f.v&&!set[f.v])set[f.v]='VLAN'+String(f.v).padStart(4,'0')});return set}
function vcIfCfg(d,st){return d.ifaces.find(x=>x.n===st.n)}
function vcDhcp(d){const P=d.vp||{};Object.keys(P).forEach(k=>{const q=P[k];if(!q.net||!q.mask)return;d.ifaces.forEach(f=>{if(!f.ip||!f.mask||vcNetOf(f.ip,f.mask)!==vcNetOf(q.net,q.mask))return;
  const base=ip2n(vcNetOf(q.net,q.mask)),bc=base+(2**32-1-ip2n(q.mask))>>>0;let first=base+1;if(first<=ip2n(f.ip))first=ip2n(f.ip)+1;
  (d.vx||[]).forEach(([a,b])=>{if(first>=a&&first<=b)first=b+1});const n=Math.max(0,Math.min(100,bc-first));if(n<1)return;d.dhcp=d.dhcp||{};d.dhcp[f.n]={first:vcDot(first>>>0),n,gw:q.gw||f.ip,dns:q.dns||''}})})}
const vcAcl=(d,act,pr,s,sw,t,tw,port)=>{const net=(a,w)=>a==='any'?'any':(()=>{const m=vcMask(w,true);if(!m||ip2n(a)==null)return null;return a+'/'+vcLen(m)})();
 const S1=s==='any'?'any':net(s,sw),T1=t==='any'?'any':net(t,tw);if(!S1||!T1)return false;return `acl ${act} ${S1} ${T1}${/^(tcp|udp)$/.test(pr)&&port?' '+pr+' '+port:''}`};
// разбор правила ACL Cisco: <permit|deny> <ip|tcp|udp|icmp> <src> <dst> [eq порт]
function vcCiscoRule(w){const act=w[0].toLowerCase(),pr=(w[1]||'').toLowerCase();let i=2;const addr=()=>{const x=w[i++];if(!x)return null;if(x.toLowerCase()==='any')return['any',''];if(x.toLowerCase()==='host')return[w[i++],'0.0.0.0'];const m=w[i++];return[x,m]};
 const s=addr(),t=addr();if(!s||!t)return null;let port='';if((w[i]||'').toLowerCase()==='eq')port=w[i+1];return{act,pr,s,t,port}}
// ---------- Cisco IOS ----------
function vcShowC(d,W,N,p){const a=W.join(' ');
 if(/^ip route/.test(a))return N('route'),true;if(/^(running-config|run|startup-config)/.test(a))return p(runCfg(d)),true;
 if(/^ip interface brief/.test(a)||/^ip int br/.test(a)){p('Interface'.padEnd(23)+'IP-Address'.padEnd(16)+'OK? Method Status'.padEnd(26)+'Protocol');d.ifaces.forEach(f=>{const up=f.svi?!!f.ip:vcPeerUp(d,f);p(f.n.padEnd(23)+(f.ip||'unassigned').padEnd(16)+('YES '+(f.ip?'manual':'unset')).padEnd(11)+(f.off?'administratively down':up?'up':'down').padEnd(21)+(f.off?'down':up?'up':'down'))});return true}
 if(/^vlan/.test(a)){p('VLAN Name                             Status    Ports');const V=vcVlans(d);Object.keys(V).sort((x,y)=>x-y).forEach(v=>p(String(v).padEnd(5)+V[v].padEnd(34)+'active    '+d.ifaces.filter(f=>!f.svi&&!f.tr&&(f.v||1)===+v).map(f=>f.n).join(', ')));return true}
 if(/^interfaces?( |$)/.test(a)){d.ifaces.forEach(f=>{const up=f.svi?!!f.ip:vcPeerUp(d,f);p(`${f.n} is ${f.off?'administratively down':up?'up':'down'}, line protocol is ${f.off?'down':up?'up':'down'}`+(f.ip?`\n  Internet address is ${f.ip}/${vcLen(f.mask)}`:''))});return true}
 if(/^mac/.test(a))return N('show mac address-table'),true;if(/^arp/.test(a))return N('arp'),true;if(/^(ip )?access-lists?/.test(a))return N('acl'),true;
 if(/^ip protocols/.test(a)){p(d.ospf?'Routing Protocol is "ospf 1"':d.rip?'Routing Protocol is "rip"':'Нет запущенных протоколов маршрутизации');return true}
 if(/^ip ospf neighbor/.test(a))return N('route'),true;
 if(/^version/.test(a)){p('Cisco IOS Software (учебная модель Стектонии), '+d.name);return true}
 if(/^ip dhcp (binding|pool)/.test(a)){const k=Object.keys(d.dhcp||{});p(k.length?k.map(x=>`${x}: ${d.dhcp[x].first}, адресов ${d.dhcp[x].n}`).join('\n'):'DHCP-пулов нет');return true}
 return false}
function vcCisco(d,s,N,p){const w=s.split(/\s+/),W=w.map(x=>x.toLowerCase()),st=d.vm=d.vm||{m:'user'},m=st.m,go=(mm,x)=>{d.vm=Object.assign({m:mm},x||{});return true},conf=m==='conf'||m==='if'||m==='vlan'||m==='router'||m==='pool'||m==='acl';
 if(W[0]==='do'&&conf){if(!vcShowC(d,W.slice(2),N,p))p('% Неизвестный show-запрос в учебной модели: '+s);return true}
 if(W[0]==='show'||W[0]==='sh'){if(!vcShowC(d,W.slice(1),N,p))p('% Неизвестный show-запрос в учебной модели: '+s);return true}
 if(m==='user'){if(W[0]==='enable'||W[0]==='en')return go('priv');if(/^(configure|conf)/.test(W[0])){p('% Для настройки сначала выполните enable');return true}return false}
 if(W[0]==='disable'&&m==='priv')return go('user');
 if(m==='priv'){if(/^conf(igure)?$/.test(W[0])){p('Enter configuration commands, one per line.  End with CNTL/Z.');return go('conf')}
  if(/^(write|wr|copy)/.test(W[0])){p('Building configuration...\n[OK]');return true}if(W[0]==='exit'||W[0]==='logout')return go('user');return false}
 if(W[0]==='end'||(W[0]==='c'&&0))return go('priv');
 if(W[0]==='exit'){return go(m==='conf'?'priv':'conf')}
 if(/^(banner|line|enable|service|username|logging|clock|crypto|login|password|exec-timeout|spanning-tree|ip routing|ip domain|no ip domain|ntp|snmp-server|cdp|lldp|ip cef|no cdp|transport|duplex|speed|description|ip ssh|archive|boot|errdisable|mls|ip classless|ipv6 unicast)/.test(s.toLowerCase()))return true;
 if(m==='conf'){
  if(W[0]==='hostname'){if(!w[1])return false;d.name=w[1];ch();return true}
  if(W[0]==='interface'||W[0]==='int'){const f=vcIf(d,w.slice(1).join(' '));if(!f){p('% Неверный интерфейс: '+w.slice(1).join(' '));return true}
   if(f._new){if(d.k!=='l3'&&d.t!=='sw'){p('% Интерфейс VLAN поддерживается на L3-коммутаторе');return true}if(d.k==='l3'){N(`svi ${f.svi} 0.0.0.0 /0`);const g=d.ifaces.find(x=>x.svi===f.svi);if(g){g.ip='';g.mask=''}}else{d.ifaces.push({n:'Vlan'+f.svi,svi:f.svi,ip:'',mask:''})}ch()}
   return go('if',{n:f.n})}
  if(W[0]==='vlan'&&+w[1]>0){vcVlan(d,+w[1]);return go('vlan',{v:+w[1]})}
  if(W[0]==='ip'&&W[1]==='route'){const mk=vcMask(w[3]);if(ip2n(w[2])==null||!mk||ip2n(w[4])==null){p('% ip route <сеть> <маска> <шлюз>');return true}N(`route add ${w[2]} ${mk} ${w[4]}${w.length>5?' '+w.slice(5).join(' '):''}`);return true}
  if(W[0]==='no'&&W[1]==='ip'&&W[2]==='route'){N('route del '+w[3]);return true}
  if(W[0]==='ip'&&W[1]==='default-gateway'){d.gw=w[2];ch();return true}
  if(W[0]==='router'){if(W[1]==='ospf'){d.ospf=true;ch();return go('router',{p:'ospf'})}if(W[1]==='rip'){d.rip=true;ch();return go('router',{p:'rip'})}return false}
  if(W[0]==='no'&&W[1]==='router'){if(W[2]==='ospf')d.ospf=false;if(W[2]==='rip')d.rip=false;ch();return true}
  if(W[0]==='access-list'){const r=vcCiscoRule(w.slice(2));const cmd=r&&vcAcl(d,r.act,r.pr,r.s[0],r.s[1],r.t[0],r.t[1],r.port);if(!cmd){p('% access-list <№> permit|deny <ip|tcp|udp> <откуда> <куда> [eq порт]');return true}N(cmd);return true}
  if(W[0]==='ip'&&W[1]==='access-list'){return go('acl',{acl:w[3]||w[2]})}
  if(W[0]==='ip'&&W[1]==='dhcp'&&W[2]==='pool'){d.vp=d.vp||{};d.vp[w[3]]=d.vp[w[3]]||{};return go('pool',{pool:w[3]})}
  if(W[0]==='ip'&&W[1]==='dhcp'&&W[2]==='excluded-address'){d.vx=d.vx||[];d.vx.push([ip2n(w[3]),ip2n(w[4]||w[3])]);vcDhcp(d);ch();return true}
  if(W[0]==='ip'&&W[1]==='nat')return true;
  return false}
 if(m==='if'){const f=vcIfCfg(d,st);if(!f)return false;
  if(W[0]==='ip'&&W[1]==='address'){const mk=vcMask(w[3]);if(ip2n(w[2])==null||!mk){p('% ip address <ip> <маска>');return true}f.ip=w[2];f.mask=mk;vcDhcp(d);ch();return true}
  if(W[0]==='no'&&W[1]==='ip'&&W[2]==='address'){f.ip=f.mask='';ch();return true}
  if(W[0]==='shutdown'){f.off=true;ch();return true}if(W[0]==='no'&&W[1]==='shutdown'){f.off=false;ch();return true}
  if(W[0]==='ip'&&W[1]==='nat'&&W[2]==='outside'){f.nat=true;ch();return true}if(W[0]==='ip'&&W[1]==='nat'&&W[2]==='inside')return true;if(W[0]==='no'&&W[1]==='ip'&&W[2]==='nat'){f.nat=false;ch();return true}
  if(W[0]==='ip'&&W[1]==='helper-address'){f.helper=w[2];ch();return true}if(W[0]==='ip'&&W[1]==='access-group')return true;
  if(W[0]==='switchport'){if(W[1]==='mode'&&W[2]==='trunk'){f.tr=true;ch();return true}if(W[1]==='mode'&&W[2]==='access'){f.tr=false;ch();return true}
   if(W[1]==='access'&&W[2]==='vlan'){f.tr=false;f.v=+w[3]||1;vcVlan(d,f.v);ch();return true}if(W[1]==='trunk'||W[1]==='nonegotiate'||W[1]==='voice')return true;return false}
  if(W[0]==='interface'||W[0]==='int'||W[0]==='router'||W[0]==='ip'&&W[1]==='route'){d.vm={m:'conf'};return vcCisco(d,s,N,p)}
  return false}
 if(m==='vlan'){if(W[0]==='name'){vcVlan(d,st.v,w[1]);return true}return false}
 if(m==='router'){if(W[0]==='network'||W[0]==='router-id'||W[0]==='passive-interface'||W[0]==='version'||W[0]==='no'||W[0]==='default-information')return true;if(W[0]==='router'||W[0]==='interface'||W[0]==='ip'){d.vm={m:'conf'};return vcCisco(d,s,N,p)}return false}
 if(m==='pool'){const q=d.vp[st.pool];if(W[0]==='network'){const mk=vcMask(w[2]);if(ip2n(w[1])==null||!mk){p('% network <сеть> <маска>');return true}q.net=w[1];q.mask=mk}else if(W[0]==='default-router')q.gw=w[1];else if(W[0]==='dns-server')q.dns=w[1];else if(W[0]==='lease'||W[0]==='domain-name'){}else return false;vcDhcp(d);ch();return true}
 if(m==='acl'){if(/^(permit|deny)$/.test(W[0])){const r=vcCiscoRule(w),cmd=r&&vcAcl(d,r.act,r.pr,r.s[0],r.s[1],r.t[0],r.t[1],r.port);if(!cmd){p('% permit|deny <ip|tcp|udp> <откуда> <куда> [eq порт]');return true}N(cmd);return true}return false}
 return false}
// ---------- Huawei VRP ----------
function vcShowH(d,W,N,p){const a=W.join(' ');
 if(/^ip routing-table/.test(a))return N('route'),true;if(/^(current-configuration|saved-configuration)/.test(a))return p(runCfg(d)),true;
 if(/^ip interface brief/.test(a)||/^interface brief/.test(a)){p('Interface'.padEnd(26)+'IP Address/Mask'.padEnd(20)+'Physical'.padEnd(10)+'Protocol');d.ifaces.forEach(f=>{const up=f.svi?!!f.ip:vcPeerUp(d,f);p((f.svi?'Vlanif'+f.svi:f.n).padEnd(26)+(f.ip?f.ip+'/'+vcLen(f.mask):'unassigned').padEnd(20)+(f.off?'*down':up?'up':'down').padEnd(10)+(f.off?'down':up?'up':'down'))});return true}
 if(/^vlan/.test(a)){p('VID  Type    Ports');const V=vcVlans(d);Object.keys(V).sort((x,y)=>x-y).forEach(v=>p(String(v).padEnd(5)+'common  '+d.ifaces.filter(f=>!f.svi&&!f.tr&&(f.v||1)===+v).map(f=>f.n).join(' ')));return true}
 if(/^arp/.test(a))return N('arp'),true;if(/^mac-address/.test(a))return N('show mac address-table'),true;if(/^acl/.test(a))return N('acl'),true;
 if(/^ospf/.test(a)){p(d.ospf?'OSPF Process 1 (учебная модель)':'OSPF не запущен');return true}
 if(/^version/.test(a)){p('Huawei Versatile Routing Platform (учебная модель Стектонии), '+d.name);return true}
 if(/^ip pool/.test(a)||/^dhcp/.test(a)){const k=Object.keys(d.dhcp||{});p(k.length?k.map(x=>`${x}: ${d.dhcp[x].first}, адресов ${d.dhcp[x].n}`).join('\n'):'Пулов нет');return true}
 return false}
function vcHuawei(d,s,N,p){let w=s.split(/\s+/),W=w.map(x=>x.toLowerCase());const st=d.vm=d.vm||{m:'user'},m=st.m,go=(mm,x)=>{d.vm=Object.assign({m:mm},x||{});return true};
 if(W[0]==='display'||W[0]==='dis'){if(!vcShowH(d,W.slice(1),N,p))p('Error: Неизвестный display-запрос в учебной модели: '+s);return true}
 if(m==='user'){if(W[0]==='system-view'||W[0]==='sys')return go('sys');if(W[0]==='save'){p('Save the configuration successfully.');return true}if(W[0]==='quit')return true;return false}
 if(W[0]==='return')return go('user');
 if(W[0]==='quit'){return go(m==='sys'?'user':(m==='area'?'ospf':'sys'))}
 if(W[0]==='save'){p('Save the configuration successfully.');return true}
 if(/^(stp|lldp|ntp|info-center|undo info-center|user-interface|aaa|local-user|snmp-agent|dhcp enable|undo dhcp|sflow|clock|header|undo ntdp|undo ndp|vlan batch 1)/.test(s.toLowerCase()))return true;
 if(m==='sys'){
  if(W[0]==='sysname'){if(!w[1])return false;d.name=w[1];ch();return true}
  if(W[0]==='interface'){const f=vcIf(d,w.slice(1).join(' '));if(!f){p('Error: Неверный интерфейс: '+w.slice(1).join(' '));return true}
   if(f._new){if(d.k==='l3'){N(`svi ${f.svi} 0.0.0.0 /0`);const g=d.ifaces.find(x=>x.svi===f.svi);if(g){g.ip='';g.mask=''}}else d.ifaces.push({n:'Vlan'+f.svi,svi:f.svi,ip:'',mask:''});ch()}
   return go('if',{n:f.n})}
  if(W[0]==='vlan'){if(W[1]==='batch'){w.slice(2).forEach(x=>{if(+x>0)vcVlan(d,+x)});return true}if(+w[1]>0){vcVlan(d,+w[1]);return go('vlan',{v:+w[1]})}return false}
  if(W[0]==='ip'&&W[1]==='route-static'){const mk=vcMask(w[3]);if(ip2n(w[2])==null||!mk||ip2n(w[4])==null){p('Error: ip route-static <сеть> <маска|длина> <шлюз>');return true}const pi=W.indexOf('preference');N(`route add ${w[2]} ${mk} ${w[4]}${pi>0&&w[pi+1]?' '+w[pi+1]:''}`);return true}
  if(W[0]==='undo'&&W[1]==='ip'&&W[2]==='route-static'){N('route del '+w[3]);return true}
  if(W[0]==='ospf'){d.ospf=true;ch();return go('ospf')}if(W[0]==='undo'&&W[1]==='ospf'){d.ospf=false;ch();return true}
  if(W[0]==='rip'){d.rip=true;ch();return go('ospf')}
  if(W[0]==='acl'){return go('acl',{acl:w[1]==='number'?w[2]:w[1]})}
  if(W[0]==='ip'&&W[1]==='pool'){d.vp=d.vp||{};d.vp[w[2]]=d.vp[w[2]]||{};return go('pool',{pool:w[2]})}
  return false}
 if(m==='if'){const f=vcIfCfg(d,st);if(!f)return false;
  if(W[0]==='ip'&&W[1]==='address'){const mk=vcMask(w[3]);if(ip2n(w[2])==null||!mk){p('Error: ip address <ip> <маска|длина>');return true}f.ip=w[2];f.mask=mk;vcDhcp(d);ch();return true}
  if(W[0]==='undo'&&W[1]==='ip'&&W[2]==='address'){f.ip=f.mask='';ch();return true}
  if(W[0]==='shutdown'){f.off=true;ch();return true}if(W[0]==='undo'&&W[1]==='shutdown'){f.off=false;ch();return true}
  if(W[0]==='port'){if(W[1]==='link-type'){if(W[2]==='trunk'){f.tr=true;ch();return true}if(W[2]==='access'){f.tr=false;ch();return true}return false}
   if(W[1]==='default'&&W[2]==='vlan'){f.tr=false;f.v=+w[3]||1;vcVlan(d,f.v);ch();return true}if(W[1]==='trunk')return true;return false}
  if(W[0]==='nat'&&W[1]==='outbound'){f.nat=true;ch();return true}if(W[0]==='undo'&&W[1]==='nat'){f.nat=false;ch();return true}
  if(W[0]==='dhcp'||W[0]==='description')return true;
  if(W[0]==='interface'||W[0]==='vlan'||W[0]==='ospf'||W[0]==='ip'&&W[1]==='route-static'){d.vm={m:'sys'};return vcHuawei(d,s,N,p)}
  return false}
 if(m==='vlan'){if(W[0]==='name'){vcVlan(d,st.v,w[1]);return true}if(W[0]==='description')return true;return false}
 if(m==='ospf'||m==='area'){if(W[0]==='area'){return go('area')}if(W[0]==='network'||W[0]==='router-id'||W[0]==='silent-interface')return true;return false}
 if(m==='pool'){const q=d.vp[st.pool];if(W[0]==='network'){const mk=vcMask(w[w.indexOf('mask')>0?w.indexOf('mask')+1:2]);if(ip2n(w[1])==null||!mk){p('Error: network <сеть> mask <маска>');return true}q.net=w[1];q.mask=mk}else if(W[0]==='gateway-list')q.gw=w[1];else if(W[0]==='dns-list')q.dns=w[1];else if(W[0]==='excluded-ip-address'){d.vx=d.vx||[];d.vx.push([ip2n(w[1]),ip2n(w[2]||w[1])])}else if(W[0]==='lease'||W[0]==='static-bind')return true;else return false;vcDhcp(d);ch();return true}
 if(m==='acl'){if(W[0]==='rule'){let i=1;if(/^\d+$/.test(w[i]))i++;const act=W[i++],pr=W[i++];if(!/^(permit|deny)$/.test(act||'')||!pr)return false;let s1=['any',''],t1=['any',''],port='';
   while(i<w.length){const k=W[i];if(k==='source'){if(W[i+1]==='any'){s1=['any','']; i+=2}else{s1=[w[i+1],w[i+2]];i+=3}}else if(k==='destination'){if(W[i+1]==='any'){t1=['any','']; i+=2}else{t1=[w[i+1],w[i+2]];i+=3}}else if(k==='destination-port'){port=w[i+2];i+=3}else i++}
   const cmd=vcAcl(d,act,pr==='ip'?'ip':pr,s1[0],s1[1],t1[0],t1[1],port);if(!cmd){p('Error: rule [id] permit|deny <ip|tcp|udp> source <сеть> <wildcard> destination <сеть> <wildcard> [destination-port eq N]');return true}N(cmd);return true}return false}
 return false}
// ---------- подключение к консоли ----------
{const _r=run;run=function(c){const d=sel&&dv(sel),s=String(c||'').trim();if(!d||!s)return _r(c);const a=s.split(/\s+/);
  if(a[0].toLowerCase()==='cli'){if(!(d.t==='rt'||d.t==='sw')){return p('Вендорные консоли доступны на маршрутизаторах и коммутаторах.')}const v=(a[1]||'').toLowerCase();
   if(!/^(cisco|huawei|native)$/.test(v))return p('Использование: cli cisco | cli huawei | cli native — язык консоли выбранного устройства (сейчас: '+(d.vend||'native')+')');
   if(v==='native'){delete d.vend;delete d.vm;$('#ps').textContent=d.name+'> ';ch();return p('Обычная консоль Стектонии.')}
   d.vend=v;d.vm={m:'user'};ch();vcPs(d);return p(v==='cisco'?'Консоль Cisco IOS: enable → configure terminal → interface … Справка: show running-config, show ip interface brief.':'Консоль Huawei VRP: system-view → interface … Справка: display current-configuration, display ip interface brief.')}
  if(d.vend&&(d.t==='rt'||d.t==='sw')){let r=false;const N=x=>_r(x);try{r=d.vend==='cisco'?vcCisco(d,s,N,p):vcHuawei(d,s,N,p)}catch(e){r=false}
   if(r){vcPs(d);return}
   if(/^(ping|traceroute|tracert|trace|send|arp|help|clear|cls|iperf|nslookup|contest|stask|ci|ls|cat|stat|git|systemctl|crontab|vendor)\b/i.test(s)){vcPs(d);return _r(c)}
   p(d.vend==='cisco'?'% Invalid input detected: '+s:'Error: Unrecognized command found at \'^\' position: '+s);vcPs(d);return}
  return _r(c)}}
CMDS.push(['cli','cli cisco | cli huawei | cli native','Язык консоли устройства: Cisco IOS, Huawei VRP или обычный','На выбранном маршрутизаторе или коммутаторе включает привычные режимы и команды: Cisco — enable, configure terminal, interface, ip address, ip route, switchport, vlan, router ospf, access-list, ip dhcp pool, show …; Huawei — system-view, interface, ip address, ip route-static, port link-type, port default vlan, vlan batch, acl, ip pool, display …. Команды изменяют ту же модель, поэтому задания и проверки работают одинаково.','Консоль']);
if(!CMDNAMES.includes('cli'))CMDNAMES.push('cli');
