/* ===== v5: анимация DHCP relay, STP по скорости портов, EtherChannel, port security ===== */
async function play(st){if(busy)return;busy=1;for(const s of st){await move(s.p,s.err,s.rep);p((s.err?'✖ ':s.rep?'↩ ':'• ')+s.x);if(s.fix)p('  ➜ Как исправить: '+s.fix)}busy=0}
const _dh5=dhcp;
dhcp=function(d,fi=0){EX=[];REP=0;_dh5(d,fi);const st=EX.slice();REP=0;if(st.length)play(st)};

// STP: стоимость пути зависит от скорости (10M=100, 100M=19, 1G=4, 10G=2); EtherChannel — одна логическая связь с суммой скоростей
const scost=s=>s>=10000?2:s>=1000?4:s>=100?19:100;
let STPC={};
stp=function(){BLK=new Set();ROOT={};S.loops=false;const sw=S.devs.filter(d=>d.t==='sw'&&d.k!=='hub'),ids=new Set(sw.map(d=>d.id)),sp=(d,i)=>d.ifaces[i].spd||1000;
 let L=S.links.map((l,k)=>({...l,k})).filter(l=>ids.has(l.a)&&ids.has(l.b)&&!dv(l.a).ifaces[l.ai].off&&!dv(l.b).ifaces[l.bi].off);
 L.forEach(l=>{l.sp=Math.min(sp(dv(l.a),l.ai),sp(dv(l.b),l.bi),cabCap(l))});const G={};
 L=L.filter(l=>{const A=dv(l.a).ifaces[l.ai],B=dv(l.b).ifaces[l.bi];l.m=[l];if(!A.ch||!B.ch)return true;const k=[l.a,l.b,A.ch,B.ch].join('|');if(G[k]){G[k].m.push(l);G[k].sp+=l.sp;return false}G[k]=l;return true});
 L.forEach(l=>l.c=scost(l.sp));
 const used=new Set(),cost={},seen=new Set();
 [...sw].sort((a,b)=>bless(a,b)?-1:1).forEach(r=>{if(seen.has(r.id))return;ROOT[r.id]=r.id;cost[r.id]=0;const q=[r.id],done=new Set(),via={};
  while(q.length){q.sort((x,y)=>cost[x]-cost[y]);const u=q.shift();if(done.has(u))continue;done.add(u);seen.add(u);
   L.forEach(l=>{if(l.a!==u&&l.b!==u)return;const v=l.a===u?l.b:l.a,nc=cost[u]+l.c;if(cost[v]===undefined||nc<cost[v]){cost[v]=nc;ROOT[v]=r.id;via[v]=l.k;q.push(v)}})}
  Object.values(via).forEach(k=>used.add(k))});
 L.forEach(l=>{if(used.has(l.k))return;S.loops=true;const A=dv(l.a),B=dv(l.b),aWin=cost[l.a]!==cost[l.b]?cost[l.a]<cost[l.b]:bless(A,B),lo=aWin?l.b:l.a;l.m.forEach(m=>BLK.add(lo+':'+(lo===l.a?m.ai:m.bi)))});
 STPC=cost;if(S.nostp)BLK.clear()};

// Port security
const behind=(d,f)=>{const m=new Map();l2all(d,d.ifaces.indexOf(f)).forEach(e=>m.set(e.d.id,e.d));return[...m.values()]};
let BDEV=new Set(),psKey='';
function psScan(){BDEV=new Set();let c1=0,key='';
 S.devs.filter(d=>d.t==='sw'&&kind(d)==='msw').forEach(d=>d.ifaces.forEach(f=>{if(!f.ps||f.off)return;const al=f.ps.mac||[],B=behind(d,f).sort((x,y)=>x.name<y.name?-1:1),
  bad=B.filter(x=>!al.includes(x.mac)).slice(Math.max(0,f.ps.max-al.length));if(!bad.length)return;
  if(f.ps.mode==='shutdown'){f.off=true;f.errd=true;c1=1;p(`⚠ Port security: ${d.name} ${f.n} — за портом ${B.length} устр. при лимите ${f.ps.max} (нарушитель: ${bad.map(x=>x.name).join(', ')}). Порт переведён в err-disabled.`)}
  else{bad.forEach(x=>BDEV.add(x.id));const s=d.id+f.n+bad.map(x=>x.id);key+=s;if(!psKey.includes(s))p(`⚠ Port security (restrict): ${d.name} ${f.n} блокирует кадры устройств: ${bad.map(x=>x.name).join(', ')}`)}}));
 psKey=key;if(c1){save();setTimeout(side,0)}}
const _trip5=trip;
trip=function(d,dst){const bad=[d,S.devs.find(x=>x.ifaces.some(f=>f.ip===dst))].find(x=>x&&BDEV.has(x.id));
 if(bad){EX=[];REP=0;ex([d.id],`${bad.name}: коммутатор отбрасывает кадры этого устройства — его MAC не разрешён на порту (port security, restrict)`,{err:1,fix:'Добавьте MAC в разрешённые (portsec <порт> mac <MAC> или sticky), увеличьте лимит max либо отключите защиту.'});return{ok:0,tr:[]}}
 return _trip5(d,dst)};

const _run5=run;
run=function(c){const d=sel&&dv(sel),a=c.trim().split(/\s+/),cm=a[0].toLowerCase();if(!d)return _run5(c);
 const q=d.ifaces.find(x=>x.n===(cm==='no'?a[2]:''));if(q)q.errd=false;
 if(d.t!=='sw'||kind(d)!=='msw')return _run5(c);const f=d.ifaces.find(x=>x.n===a[1]);
 if(cm==='speed'){if(!f||![10,100,1000,10000].includes(+a[2]))return p('Использование: speed <порт> 10|100|1000|10000');f.spd=+a[2];ch();return p('OK: STP учтёт скорость при выборе пути')}
 if(cm==='channel'){if(!f)return p('Использование: channel <порт> <группа|none>');f.ch=+a[2]||0;ch();return p(f.ch?`${f.n} в EtherChannel Po${f.ch}`:'Порт выведен из EtherChannel')}
 if(cm==='portsec'){if(!f)return p('Использование: portsec <порт> on [max] [shutdown|restrict] | off | mac <MAC> | sticky');
  if(a[2]==='off'){f.ps=null;ch();return p('Port security выключен')}
  if(a[2]==='on'){f.ps={max:+a[3]||1,mode:a[4]==='restrict'?'restrict':'shutdown',mac:[]};ch();return p(`Port security на ${f.n}: максимум MAC ${f.ps.max}, нарушение — ${f.ps.mode==='shutdown'?'порт отключается (err-disabled)':'лишние устройства блокируются'}`)}
  if(!f.ps)return p('Сначала: portsec '+f.n+' on');
  if(a[2]==='mac'){f.ps.mac.push((a[3]||'').toLowerCase());ch();return p('Разрешённый MAC добавлен')}
  if(a[2]==='sticky'){f.ps.mac=[...new Set(behind(d,f).map(x=>x.mac))];ch();return p('Sticky: запомнены MAC: '+f.ps.mac.join(', '))}
  return p('Неизвестный параметр')}
 return _run5(c)};

const _side5=side;
side=function(){_side5();const d=sel&&dv(sel);if(!d||kind(d)!=='msw')return;
 $('#side').insertAdjacentHTML('beforeend','<h4>Порты: скорость, EtherChannel, port security</h4><p class="mt">Скорость влияет на выбор пути STP. Одинаковый номер channel-group на связях между двумя коммутаторами объединяет их в EtherChannel (одна логическая связь, сумма скоростей, STP не блокирует). PS — port security: лимит MAC-адресов за портом (shutdown — отключить порт, restrict — блокировать лишних).</p>'+
 d.ifaces.map((f,i)=>f.radio?'':`<div class="rt" style="flex-wrap:wrap;gap:4px"><span style="width:100%"><b>${f.n}</b>${f.errd?' <span class="er">err-disabled</span>':''}</span><select data-spd="${i}">${[10,100,1000,10000].map(s=>`<option value="${s}" ${(f.spd||1000)===s?'selected':''}>${s>=1000?s/1000+'G':s+'M'}</option>`).join('')}</select><input data-ch="${i}" value="${f.ch||''}" placeholder="ch" title="channel-group" style="width:44px;display:inline"><label style="display:inline"><input type="checkbox" data-ps="${i}" ${f.ps?'checked':''} style="width:auto;display:inline"> PS</label>${f.ps?`<input data-pm="${i}" value="${f.ps.max}" title="max MAC" style="width:40px;display:inline"><select data-pd="${i}">${['shutdown','restrict'].map(m=>`<option ${f.ps.mode===m?'selected':''}>${m}</option>`).join('')}</select>`:''}</div>`).join(''))};
$('#side').addEventListener('change',e=>{const t=e.target,d=dv(sel),D=t.dataset;if(!d)return;const n=Object.keys(D)[0],f=d.ifaces[+D[n]];
 if(n==='spd'){f.spd=+t.value;ch()}else if(n==='ch'){f.ch=+t.value||0;ch()}
 else if(n==='ps'){f.ps=t.checked?{max:1,mode:'shutdown',mac:[]}:null;ch()}
 else if(n==='pm'){f.ps.max=Math.max(1,+t.value||1);ch()}else if(n==='pd'){f.ps.mode=t.value;ch()}
 else if(n==='off'){f.errd=false}});

const _draw5=draw;
draw=function(){psScan();_draw5();let h='';
 S.links.forEach(l=>{const A=dv(l.a),B=dv(l.b);if(!A||!B)return;const fa=A.ifaces[l.ai],fb=B.ifaces[l.bi],x=(A.x+B.x)/2,y=(A.y+B.y)/2;
  if(fa.ch&&fb.ch)h+=`<text pointer-events="none" x="${x}" y="${y+14}" font-size="10" fill="var(--ok)" text-anchor="middle">EtherChannel Po${fa.ch}/${fb.ch}</text>`;
  if(fa.errd||fb.errd)h+=`<text pointer-events="none" x="${x}" y="${y-18}" font-size="11" fill="var(--er)" text-anchor="middle">err-disabled</text>`});
 cv.insertAdjacentHTML('beforeend',h)};
TASKS.push({t:'8. Защита порта (port security)',d:'Управляемый коммутатор MSW1, на порт fa0/1 включите portsec on 1 restrict; к нему подключён хаб с ПК PC1 и ПК Intruder (и ещё PC2 на другом порту). Командой sticky или mac разрешите только PC1. Проверка: PC1 достучится до PC2, а Intruder — нет. Теория: port security защищает от подключения чужих устройств.',c:[['PC1','PC2',1],['Intruder','PC2',0]]});
p('Новое: связи по скорости в STP (speed), EtherChannel (channel), port security (portsec), анимация DHCP relay, форма SVI.');
draw();side();
