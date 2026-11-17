/* ===== v4: STP, OSPF, Wi‑Fi (радиус/диапазоны), роутер-мост, L3 с SVI, DHCP relay ===== */
const dm=(a,c)=>Math.hypot(a.x-c.x,a.y-c.y)/(typeof wpm==='function'?wpm():4)+(typeof wallPen==='function'?wallPen(a,c):0); // 1 м = 4 px
function wband(a,c){const b=a.bands||'2.4+5',r=a.r||40,m=dm(a,c);if(b.includes('5')&&!c.o24&&m<=r*.6)return'5';if(b.includes('2.4')&&m<=r)return'2.4';return null}
const apOf=(c,f)=>S.devs.filter(a=>a!==c&&a.ssid&&a.ssid===f.ssid&&wfPass(a,f)&&!(a.sec==='wpa3'&&c.o24)&&!a.off&&!(a.ifaces.find(g=>g.radio)||{}).off&&wband(a,c)).sort((x,y)=>dm(x,c)-dm(y,c))[0];
const lanIdx=d=>d.ifaces.map((f,i)=>i).filter(i=>i>0&&!d.ifaces[i].radio&&!d.ifaces[i].wifi);
const radioClients=d=>d.off?[]:S.devs.flatMap(c=>c===d?[]:c.ifaces.map((g,j)=>g.wifi&&!g.off&&g.ssid&&apOf(c,g)===d?{d:c,i:j}:null).filter(Boolean));
const _peers4=peers;
peers=function(d,i){const f=d.ifaces[i];if(f&&f.wifi){const q=peer(d,i);return q?[q]:[]}if(f&&f.radio){if(f.off)return[];const r=radioClients(d);return d.bridge?[...r,...lanIdx(d).flatMap(j=>_peers4(d,j))]:r}return _peers4(d,i)};
const _peer4=peer;
peer=function(d,i){const f=d.ifaces[i];if(!f||f.off)return null;
 if(f.wifi){const a=f.ssid&&apOf(d,f);return a?{d:a,i:a.ifaces.findIndex(g=>g.radio)}:null}
 if(f.radio)return peers(d,i)[0]||null;
 if(f.svi){const j=d.ifaces.findIndex((g,k)=>g.sp&&!g.off&&(g.tr||(g.v||1)===f.svi)&&_peer4(d,k));return j>=0?_peer4(d,j):null}
 return _peer4(d,i)};
const _ww=wifiWhy;
wifiWhy=function(d,i){const w=_ww(d,i);if(w!==true)return w;const f=d.ifaces[i];if(apOf(d,f))return true;
 const a=S.devs.find(x=>x!==d&&x.ssid===f.ssid&&wfPass(x,f)&&!x.off);
 return !(a.bands||'2.4+5').includes('2.4')&&d.o24?'нет общего диапазона: устройство умеет только 2.4 ГГц, а точка работает на 5 ГГц':`вне зоны покрытия: до «${a.name}» ${Math.round(dm(a,d))} м, радиус ${a.r||40} м (на 5 ГГц — ${Math.round((a.r||40)*.6)} м)`};

// STP: корневой мост = минимальный (приоритет, MAC); лишние петлевые связи блокируются
let BLK=new Set(),ROOT={};
const bless=(a,b)=>{const x=[a.prio||32768,a.mac,a.name],y=[b.prio||32768,b.mac,b.name];return x[0]!==y[0]?x[0]<y[0]:x[1]!==y[1]?x[1]<y[1]:x[2]<y[2]};
function stp(){BLK=new Set();ROOT={};S.loops=false;const sw=new Set(S.devs.filter(d=>d.t==='sw'&&d.k!=='hub').map(d=>d.id));
 const L=S.links.map((l,k)=>({...l,k})).filter(l=>sw.has(l.a)&&sw.has(l.b)&&!dv(l.a).ifaces[l.ai].off&&!dv(l.b).ifaces[l.bi].off),used=new Set(),seen=new Set();
 [...sw].map(dv).sort((a,b)=>bless(a,b)?-1:1).forEach(r=>{if(seen.has(r.id))return;seen.add(r.id);ROOT[r.id]=r.id;const q=[r.id];
  while(q.length){const u=q.shift();L.forEach(l=>{if(l.a!==u&&l.b!==u)return;const v=l.a===u?l.b:l.a;if(!seen.has(v)){seen.add(v);ROOT[v]=r.id;used.add(l.k);q.push(v)}})}});
 L.forEach(l=>{if(used.has(l.k))return;S.loops=true;const lo=bless(dv(l.a),dv(l.b))?l.b:l.a;BLK.add(lo+':'+(lo===l.a?l.ai:l.bi))});
 if(S.nostp)BLK.clear()}
const _peers5=peers;
peers=function(d,i){if(BLK.has(d.id+':'+i))return[];return _peers5(d,i).filter(q=>!BLK.has(q.d.id+':'+q.i))};

l2all=function(d,out){const res=[],seen=new Set(),f0=d.ifaces[out];let st=[];
 if(f0.svi)d.ifaces.forEach((g,j)=>{if(g.sp&&!g.off&&(g.tr||(g.v||1)===f0.svi))peers(d,j).forEach(q=>st.push({...q,v:g.tr?f0.svi:null,path:[d.id]}))});
 else st=peers(d,out).map(q=>({...q,v:null,path:[d.id]}));
 while(st.length){const{d:x,i,v,path}=st.pop(),k=x.id+':'+i+':'+v;if(seen.has(k))continue;seen.add(k);const np=[...path,x.id],xf=x.ifaces[i];
  if(x.t==='sw'||(x.k==='l3'&&xf.sp)){const hub=x.k==='hub',vv=xf.tr?(v||1):(xf.v||1);
   if(x.k==='l3'){const si=x.ifaces.findIndex(g=>g.svi===vv);if(si>=0&&x!==d)res.push({d:x,i:si,path:np})}
   x.ifaces.forEach((g,j)=>{if((j===i&&!g.radio)||(x.k==='l3'&&!g.sp)||!(hub||g.tr||(g.v||1)===vv))return;peers(x,j).forEach(n=>st.push({...n,v:g.tr?vv:null,path:np}))})}
  else if(x.bridge&&(xf.radio||lanIdx(x).includes(i))){const ri=x.ifaces.findIndex(g=>g.radio);if(x!==d)res.push({d:x,i:ri,path:np});
   [ri,...lanIdx(x)].forEach(j=>{if(j===i&&!x.ifaces[j].radio)return;(x.ifaces[j].radio?radioClients(x):_peers4(x,j)).forEach(n=>st.push({...n,v:null,path:np}))})}
  else if(x!==d)res.push({d:x,i,path:np})}
 return res};
connect=function(a,b){if(a===b)return;const A=dv(a),B=dv(b),fr=D=>D.ifaces.findIndex((f,i)=>!f.wifi&&!f.radio&&!f.svi&&!f.tun&&!S.links.some(l=>(l.a===D.id&&l.ai===i)||(l.b===D.id&&l.bi===i)));const ia=fr(A),ib=fr(B);
 if(ia<0||ib<0)return p('Нет свободных проводных портов на '+(ia<0?A.name:B.name));
 link(A,ia,B,ib);p(`Кабель: ${A.name} ${A.ifaces[ia].n} ⇄ ${B.name} ${B.ifaces[ib].n}`);ch()};

// OSPF: по алгоритму кратчайшего пути (Дейкстра), стоимость интерфейса настраивается; приоритетнее RIP
function computeOspf(){const rs=S.devs.filter(d=>d.t==='rt'&&d.ospf);if(!rs.length)return;const adj={};
 rs.forEach(a=>{adj[a.id]=[];a.ifaces.forEach((f,i)=>{if(!f.ip||f.off)return;l2all(a,i).forEach(e=>{const b=e.d,bf=b.ifaces[e.i];if(b.t==='rt'&&b.ospf&&bf.ip&&same(f.ip,bf.ip,f.mask)&&!(typeof ospfBad==='function'&&ospfBad(a,f,b,bf)))adj[a.id].push({b,c:+f.cost||1,nh:bf.ip,ar:+f.area||0})})})});
 rs.forEach(a=>{const dist={[a.id]:0},fh={},la={},q=[a.id],done=new Set();
  while(q.length){q.sort((x,y)=>dist[x]-dist[y]);const u=q.shift();if(done.has(u))continue;done.add(u);
   (adj[u]||[]).forEach(({b,c,nh,ar})=>{if(la[u]!==undefined&&la[u]!==0&&ar!==0&&ar!==la[u])return;const nd=dist[u]+c;if(dist[b.id]===undefined||nd<dist[b.id]){dist[b.id]=nd;fh[b.id]=u===a.id?nh:fh[u];la[b.id]=ar;q.push(b.id)}})}
  const best={};
  rs.forEach(r=>{if(r===a||dist[r.id]===undefined)return;r.ifaces.forEach(f=>{if(!f.ip||!f.mask||f.off)return;const net=n2ip((ip2n(f.ip)&ip2n(f.mask))>>>0),k=net+'/'+f.mask,m=dist[r.id]+(+f.cost||1);
   if(a.ifaces.some(g=>g.ip&&g.mask&&same(g.ip,net,f.mask)&&g.mask===f.mask))return;if(!best[k]||m<best[k].m)best[k]={net,mask:f.mask,nh:fh[r.id],m,o:1}})});
  RIPT[a.id]=[...Object.values(best),...(RIPT[a.id]||[])]})}
const _cr=computeRip;computeRip=function(){stp();_cr();computeOspf()};
const _trip4=trip;
trip=function(d,dst){stp();if(S.nostp&&S.loops){EX=[];REP=0;ex([d.id],'⚠ Широковещательный шторм: в L2-сети есть петля, а STP выключен — кадры бегают по кругу, MAC-таблицы нестабильны, сеть парализована',{err:1,fix:'Включите STP (кнопка «STP» сверху) или уберите лишний кабель между коммутаторами.'});return{ok:0,tr:[]}}return _trip4(d,dst)};

// DHCP relay (ip helper)
const _dh4=dhcp;
dhcp=function(d,fi=0){const f=d.ifaces[fi];if(!f)return;const E=l2all(d,fi);
 if(E.find(e=>(e.d.t==='rt'||e.d.k==='srv')&&(e.d.dhcp||{})[e.d.ifaces[e.i].n]))return _dh4(d,fi);
 const rl=E.find(e=>e.d.t==='rt'&&e.d.ifaces[e.i].helper&&e.d.ifaces[e.i].ip);if(!rl)return _dh4(d,fi);
 const r=rl.d,ri=r.ifaces[rl.i];p(`DHCP Discover (${f.n}): ${r.name} с «ip helper ${ri.helper}» ретранслирует запрос серверу unicast-ом (giaddr=${ri.ip})`);
 computeRip();EX=[];const a=deliver(r,ri.helper,64,[],1,ri.ip);if(!a.ok)return p('✖ Ретранслятор не достучался до DHCP-сервера: '+a.m);
 const sv=a.d,sc=(sv.scopes||[]).find(s=>same(ri.ip,s.net,s.mask));if(!sc)return p(`✖ На ${sv.name} нет области (scope) для сети ${ri.ip}. Команда: dhcp scope <сеть> <маска> <первый_ip> <число> [шлюз] [dns]`);
 let ip=null;for(let k=0;k<sc.n;k++){const c=n2ip(ip2n(sc.first)+k);if(!S.devs.some(x=>x!==d&&x.ifaces.some(g=>g.ip===c))){ip=c;break}}
 if(!ip)return p('✖ Пул области исчерпан');REP=1;
 const b=deliver(sv,ri.ip,64,[],1,ri.helper);if(!b.ok)return p('✖ Ответ сервера не вернулся к ретранслятору: '+b.m+' (серверу нужен маршрут обратно к сети клиентов)');
 f.ip=ip;f.mask=sc.mask;d.gw=sc.gw||ri.ip;if(sc.dns)d.dns=sc.dns;ch();p(`DHCP Offer/Ack от ${sv.name} через ${r.name}: ${ip}, маска ${sc.mask}, шлюз ${d.gw}`);flash([d,r,sv])};

// L3-коммутатор (порты — switchport + SVI) и роутер-мост создаются по умолчанию в новом режиме
const _ad4=addDev;
addDev=function(k,x,y,n){const d=_ad4(k,x,y,n);let c=0;
 if(d.k==='l3'&&!d.ifaces[0].sp){d.ifaces.forEach((f,i)=>{f.sp=1;f.n='fa0/'+(i+1);f.v=1});c=1}
 if(d.k==='wr'&&d.bridge===undefined){d.bridge=true;c=1}if(c)ch();return d};
CAT.l3.l='Коммутатор L3 (VLAN + SVI)';[...document.querySelectorAll('#ad option')].forEach(o=>{if(o.value==='l3')o.textContent=CAT.l3.i+' '+CAT.l3.l});
NOTE.l3='Коммутатор L3: порты — как у управляемого коммутатора (VLAN/trunk), а маршрутизация между VLAN — через SVI (виртуальные интерфейсы Vlan10, Vlan20…) с IP-адресами-шлюзами.';
NOTE.wr='Wi‑Fi роутер: порт gi0/0 — WAN, LAN-порты и Wi‑Fi объединены в мост (одна подсеть, IP на wlan0, DHCP включён). Радиус и диапазон (2.4/5 ГГц) задаются в блоке Wi‑Fi.';
NOTE.ap='Точка доступа связывает Wi‑Fi клиентов с проводной сетью на L2. Дальность задаётся радиусом (на 5 ГГц — около 60% от 2.4 ГГц); перетащите клиента — связь пропадёт вне круга.';

const _run4=run;
run=function(c){const d=sel&&dv(sel),a=c.trim().split(/\s+/),cm=a[0].toLowerCase();if(!d||!c.trim())return _run4(c);const K=kind(d),ifn=n=>d.ifaces.find(f=>f.n.toLowerCase()===(n||'').toLowerCase());
 if(cm==='show'&&a[1]==='stp'){stp();S.devs.filter(x=>ROOT[x.id]).forEach(x=>p(`${x.name}: корень — ${dv(ROOT[x.id]).name}${ROOT[x.id]===x.id?' (это корневой мост)':''}`));S.links.forEach(l=>{[[l.a,l.ai],[l.b,l.bi]].forEach(([id,i])=>BLK.has(id+':'+i)&&p(`${dv(id).name} ${dv(id).ifaces[i].n}: BLOCKING`))});return p(S.nostp?'STP выключен':'STP включён')}
 if(cm==='stp'&&a[1]==='priority'&&d.t==='sw'){d.prio=+a[2]||32768;return ch()}
 if(cm==='ospf'&&d.t==='rt'){if(a[1]==='cost'){const f=ifn(a[2]);if(!f||!(+a[3]>0))return p('Использование: ospf cost <интерфейс> <стоимость>');f.cost=+a[3];ch();return p('OK')}d.ospf=a[1]!=='off';ch();return p('OSPF '+(d.ospf?'включён: маршруты строятся по кратчайшему пути (стоимость интерфейсов)':'выключен'))}
 if(cm==='helper'&&d.t==='rt'){const f=ifn(a[1]);if(!f||ip2n(a[2]||'')==null)return p('Использование: helper <интерфейс клиентов> <ip DHCP-сервера> (a[2]=none — убрать)');f.helper=a[2];ch();return p('ip helper-address '+a[2]+' на '+f.n)}
 if(cm==='dhcp'&&a[1]==='scope'&&K==='srv'){const m=nm(a[3]||''),n=+a[5];if(ip2n(a[2]||'')==null||!m||ip2n(a[4]||'')==null||!n)return p('Использование: dhcp scope <сеть> <маска|/N> <первый_ip> <число> [шлюз] [dns]');(d.scopes=d.scopes||[]).push({net:a[2],mask:m,first:a[4],n,gw:a[6]||'',dns:a[7]||''});ch();return p('Область добавлена: сервер выдаёт адреса клиентам удалённой сети через ретранслятор')}
 if(K==='l3'&&cm==='svi'){const v=+a[1],m=nm(a[3]||'');if(!(v>0)||ip2n(a[2]||'')==null||!m)return p('Использование: svi <vlan> <ip> <маска|/N>');let f=d.ifaces.find(x=>x.svi===v);if(!f){f={n:'Vlan'+v,svi:v,ip:'',mask:''};d.ifaces.push(f)}f.ip=a[2];f.mask=m;ch();return p(`SVI Vlan${v}: ${a[2]} — шлюз для узлов VLAN ${v}`)}
 if(K==='l3'&&cm==='port'){const f=d.ifaces.find(x=>x.sp&&x.n===a[1]);if(!f||!/^(access|trunk)$/.test(a[2]||''))return p('Использование: port fa0/1 access <vlan> | port fa0/1 trunk');f.tr=a[2]==='trunk';if(!f.tr)f.v=+a[3]||1;ch();return p('OK')}
 return _run4(c)};

const _side4=side;
side=function(){_side4();const d=sel&&dv(sel);if(!d)return;const K=kind(d),el=$('#side'),vr=(f,i)=>`<div class="rt"><span>${f.n}</span><span><input data-v="${i}" value="${f.v||1}" style="width:52px;display:inline" ${f.tr?'disabled':''}> <label style="display:inline"><input type="checkbox" data-tr="${i}" ${f.tr?'checked':''} style="width:auto;display:inline"> trunk</label></span></div>`;let h='';
 if(K==='l3')el.querySelectorAll('fieldset').forEach(x=>{if(x.textContent.startsWith('fa0/'))x.remove()});
 if(K==='l3')h+='<h4>VLAN на портах</h4>'+d.ifaces.map((f,i)=>f.sp?vr(f,i):'').join('')+'<h4>VLAN-интерфейсы (SVI)</h4><p class="mt">SVI — виртуальный интерфейс VLAN с IP. Он служит шлюзом узлам своего VLAN и маршрутизирует между VLAN. IP задаётся в карточке интерфейса выше.</p><input id="svi_v" placeholder="Номер VLAN, напр. 10"><input id="svi_i" placeholder="IP-адрес SVI, напр. 192.168.10.1" style="margin-top:4px"><input id="svi_m" placeholder="Маска или /24" value="/24" style="margin-top:4px"><button class="b" id="svi_b" style="margin-top:6px;width:100%">Создать / изменить SVI</button>';
 if(K==='msw'||K==='sw')h+=`<h4>STP</h4>${K==='msw'?`<label>Приоритет моста (меньше — главнее)<input data-pr value="${d.prio||32768}"></label>`:''}<div class="mt">Корневой мост: ${ROOT[d.id]?dv(ROOT[d.id]).name:'—'}${ROOT[d.id]===d.id?' (это он)':''}</div>`;
 if(d.ssid!==undefined)h+=`<h4>Радио</h4><label>Диапазон<select data-bd style="width:100%">${['2.4+5','2.4','5'].map(b=>`<option ${(d.bands||'2.4+5')===b?'selected':''}>${b}</option>`).join('')}</select></label><label>Радиус 2.4 ГГц, м<input data-rr value="${d.r||40}"></label><div class="mt">5 ГГц быстрее, но покрывает ~60% радиуса. Круг на схеме — зона покрытия.</div>`;
 if(d.ifaces.some(f=>f.wifi))h+=`<label><input type="checkbox" data-o24 ${d.o24?'checked':''} style="width:auto;display:inline"> Старое устройство: только 2.4 ГГц</label>`;
 if(K==='wr')h+=`<label><input type="checkbox" data-br ${d.bridge?'checked':''} style="width:auto;display:inline"> Мост: LAN-порты + Wi‑Fi в одной подсети (IP на wlan0)</label>`;
 if(d.t==='rt'){h+=`<h4>OSPF и ретрансляция DHCP</h4><label><input type="checkbox" data-ospf ${d.ospf?'checked':''} style="width:auto;display:inline"> OSPF (кратчайший путь по стоимости)</label>`;
  if(d.ospf)h+=d.ifaces.map((f,i)=>f.ip?`<label>Стоимость ${f.n}<input data-cost="${i}" value="${f.cost||1}"></label>`:'').join('');
  h+=`<label>ip helper (DHCP-сервер) для интерфейса, выбранного в блоке DHCP<input id="dh_h" placeholder="IP DHCP-сервера"></label><button class="b" id="dh_hb">Задать helper</button>`}
 el.insertAdjacentHTML('beforeend',h)};
$('#side').addEventListener('change',e=>{const t=e.target,d=dv(sel),D=t.dataset;if(!d)return;const n=Object.keys(D)[0];
 if(n==='pr'){d.prio=Math.max(0,Math.min(61440,+t.value||32768));ch()}
 else if(n==='bd'){d.bands=t.value;ch()}else if(n==='rr'){d.r=Math.max(5,Math.min(300,+t.value||40));ch()}
 else if(n==='o24'){d.o24=t.checked;ch()}else if(n==='br'){d.bridge=t.checked;ch()}
 else if(n==='ospf'){d.ospf=t.checked;ch()}else if(n==='cost'){d.ifaces[+D.cost].cost=Math.max(1,+t.value||1);ch()}});
$('#side').addEventListener('click',e=>{const t=e.target,d=sel&&dv(sel);if(!d)return;
 if(t.id==='svi_b')run('svi '+$('#svi_v').value.trim()+' '+$('#svi_i').value.trim()+' '+($('#svi_m').value.trim()||'/24'));
 else if(t.id==='dh_hb')run('helper '+($('#dh_if')||{}).value+' '+$('#dh_h').value.trim())});

const _draw4=draw;
draw=function(){stp();_draw4();let h='';
 S.devs.filter(a=>a.ssid&&!a.off).forEach(a=>{h+=`<circle pointer-events="none" cx="${a.x}" cy="${a.y}" r="${(a.r||40)*4}" fill="var(--ac)" fill-opacity=".05" stroke="var(--ac)" stroke-opacity=".3" stroke-dasharray="4 4"/>`;if((a.bands||'2.4+5').includes('5'))h+=`<circle pointer-events="none" cx="${a.x}" cy="${a.y}" r="${(a.r||40)*2.4}" fill="none" stroke="var(--ac)" stroke-opacity=".25"/>`});
 S.links.forEach(l=>{const a=dv(l.a),b=dv(l.b);if(a&&b&&(BLK.has(l.a+':'+l.ai)||BLK.has(l.b+':'+l.bi)))h+=`<line pointer-events="none" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="var(--er)" stroke-width="3" stroke-dasharray="6 6"/><text x="${(a.x+b.x)/2}" y="${(a.y+b.y)/2-8}" font-size="11" fill="var(--er)" text-anchor="middle">STP: порт заблокирован</text>`});
 S.devs.forEach(c=>c.ifaces.forEach((f,i)=>{if(!f.wifi)return;const q=peer(c,i);if(q)h+=`<text x="${(c.x+q.d.x)/2}" y="${(c.y+q.d.y)/2-6}" font-size="10" fill="var(--ac)" text-anchor="middle">${wband(q.d,c)} ГГц</text>`}));
 cv.insertAdjacentHTML('afterbegin',h);const b=$('#bstp');if(b)b.textContent='STP: '+(S.nostp?'выкл':'вкл')};
$('#bt').insertAdjacentHTML('beforebegin','<button id="bstp" title="Протокол остовного дерева"></button>');
$('#bstp').onclick=()=>{S.nostp=!S.nostp;ch();p(S.nostp?'STP выключен: петля между коммутаторами вызовет широковещательный шторм':'STP включён: лишние связи блокируются')};
TASKS.push({t:'7. Межвлановая маршрутизация на L3-коммутаторе',d:'Коммутатор L3 (имя L3SW1), PC1 в VLAN 10 (192.168.10.10/24), PC2 в VLAN 20 (192.168.20.10/24). Создайте SVI Vlan10 (192.168.10.1) и Vlan20 (192.168.20.1), на ПК укажите их как шлюзы. Теория: VLAN изолирует, SVI на L3-коммутаторе возвращает связь по политике сети.',c:[['PC1','PC2',1]]});
p('Новое: STP (кнопка сверху, show stp), OSPF (ospf on), Wi‑Fi: радиус и диапазоны, роутер-мост, L3 + SVI (svi), DHCP relay (helper, dhcp scope).');
draw();side();
