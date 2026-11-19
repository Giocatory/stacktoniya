const go=(d,c)=>{sel=d.id;try{run(c)}catch(e){}};
const rich=[];
function mkSnap(tn,setup){const TT=TPL.find(x=>x.n.includes(tn));if(!TT)throw new Error("no tpl "+tn);tplLoad(TT);setup&&setup();rich.push(JSON.stringify(S))}
mkSnap('Фильтрация редистрибуции',()=>{const R2=byNm('R2');go(R2,'prefix-list Z deny 1.2.3.0/24 le 28');go(R2,'route-map M2 permit 20 set metric 5');go(R2,'redistribute static ospf route-map M2')});
mkSnap('PBR по источнику',()=>{const R1=byNm('R1');go(R1,'pbr add 192.168.1.0/24 to 192.168.9.0/24 via 10.0.12.2')});
mkSnap('Консоль Eltex',()=>{const R1=byNm('R1');['cli eltex','configure','interface gi 1/0/1','ip address 192.168.1.1/24','exit','ip route 192.168.2.0/24 10.0.12.2','commit'].forEach(c=>go(R1,c));['configure','hostname RX','interface gi 1/0/2','shutdown'].forEach(c=>go(R1,c))});
mkSnap('IP SLA',()=>{});
mkSnap('Резервный канал',()=>{});
mkSnap('Редистрибуция: OSPF',()=>{});
let seed=2027;const rnd=()=>(seed=(seed*1103515245+12345)&0x7fffffff)/0x7fffffff;
const vals=[null,5,'x',[],{},-1,1e9,true,'999.1.1.1',[{}],[null],{a:1},'',[1,2],{ip:1}];
function walk(o,list){if(o&&typeof o==='object'){for(const k in o){list.push([o,k]);walk(o[k],list)}}}
let acc=0,rej=0,bad=[];const cmds=['route','route get 10.0.0.1','route get 192.168.9.10 from 192.168.1.20','show redistribute','show prefix-list','show route-map','show pbr','show ip route','show candidate-config','show running-config','commit','confirm','rollback','simulate 10.0.0.1','span show','show track','show sla','cdp','ping 192.168.2.10','mtu','pbr show','redistribute static ospf','sniff'];
const N=200;for(let i=0;i<N;i++){try{out.textContent=''}catch(e){}globalThis.__cur=null;const j=JSON.parse(rich[i%rich.length]);const L=[];walk(j,L);
 const m=[];for(let q=0;q<1+Math.floor(rnd()*3);q++){const [o,k]=L[Math.floor(rnd()*L.length)];m.push(k+'='+String(JSON.stringify(o[k])).slice(0,30));if(rnd()<.25)delete o[k];else o[k]=vals[Math.floor(rnd()*vals.length)]}
 let r;try{r=schemeSet(j)}catch(e){bad.push('schemeSet threw '+e);continue}
 if(!r){rej++;continue}acc++;
 try{draw();side();computeRip&&computeRip();
  for(const d of S.devs){sel=d.id;for(const c of cmds){try{run(c)}catch(e){bad.push('CMD "'+c+'" on '+d.t+': '+String(e).slice(0,100)+' @'+(e.stack||'').split('\n').slice(1,4).map(x=>x.trim().slice(0,90)).join(' < ')+' MUT '+m.join(';'))}}}
  const pcs=S.devs.filter(d=>d.t==='pc');if(pcs.length>1&&pcs[0].ifaces[0]){EX=[];try{trip(pcs[0],(pcs[1].ifaces[0]||{}).ip||'1.1.1.1')}catch(e){bad.push('trip: '+String(e).slice(0,100)+' MUT '+m.join(';'))}}
 }catch(e){bad.push('post '+String(e).slice(0,100)+' '+(e.stack||'').split('\n').slice(1,4).map(x=>x.trim().slice(0,90)).join(' < ')+' MUT '+m.join(';'))}}
console.log('acc',acc,'rej',rej,'bad',bad.length);const u=[...new Set(bad.map(x=>x.replace(/ MUT.*/,'')))];console.log(u.slice(0,15).join('\n'));
{const seen=new Set();for(const b of bad){const k=b.replace(/ MUT.*/,'').slice(-120);if(seen.has(k))continue;seen.add(k);console.log('EX',b.slice(b.indexOf(' MUT')).slice(0,300),'||',b.slice(0,200))}}
