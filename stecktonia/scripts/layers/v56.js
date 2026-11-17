// ===== v56: содержание режимов ГИА (ДЭ) и «Профессионалы»: связные сценарии на одной схеме, многозадачные модули, дополнение заказчика =====
const cmOn=(nm,f)=>{const sv=sel,d=byNm(nm);if(d)sel=d.id;try{return f(d)}finally{sel=sv}};
const cmIf=(nm,n)=>{const d=byNm(nm);return d?d.ifaces.find(f=>f.n===n):null};
const cmNet=(c,i)=>`10.${c.x}.${c.vid[i]}`;
const cmOkIp=(nm,pre)=>{const d=byNm(nm);return !!d&&d.ifaces[0].ip.startsWith(pre+'.')&&d.ifaces[0].mask==='255.255.255.0'&&d.gw===pre+'.1'};
const cmPin=(a,b)=>{try{return !!exPing(a,b)}catch(e){return false}};
const cmL4=(a,b,p)=>{try{return !!exL4(a,b,p)}catch(e){return false}};
const SXPOOL={ge:['adm1','adm2','adm4','adm5','fw1','fw2','usr1','usr2'],b:['adm1','adm3','adm6','fw3','usr3','usr4'],g:['ci2','ci3','dk2','dk3','b7','g5']};
function cmGeInit(r){const off=[0,100,200][Math.floor(r()*3)],pool=SXPOOL.ge.slice(),sx=[];for(let i=0;i<3;i++)sx.push(pool.splice(Math.floor(r()*pool.length),1)[0]);
 return{x:10+Math.floor(r()*200),vid:[10+off,20+off,30+off],sx}}
// ---------- схема «Филиал» ----------
function cmGeBuild(c,sxOn){tplLoad({n:'ДЭ',dev:[],link:[],cfg:[],hint:''});
 [['pc','Admin',80,100],['pc','PC2',80,230],['pc','PC3',80,360],['srv','Server',330,430],['l3','L3SW1',330,230],['rt','R1',570,230],['rt','ISP',770,230],['srv','Web',950,230]].forEach(([k,n,x,y])=>addDev(k,x,y,n));
 const L=(a,ai,b,bi)=>{link(byNm(a),ai,byNm(b),bi);const l=S.links[S.links.length-1];l.id=rid();l.ct='cat5e';l.len=10};
 L('Admin',0,'L3SW1',0);L('PC2',0,'L3SW1',1);L('PC3',0,'L3SW1',2);L('Server',0,'L3SW1',3);L('L3SW1',4,'R1',0);L('R1',1,'ISP',0);L('ISP',1,'Web',0);
 const X=(n,...cs)=>cs.forEach(l=>execOn(byNm(n),l));
 X('R1','ip gi0/1 203.0.113.2 /30','route add 0.0.0.0 0.0.0.0 203.0.113.1');X('ISP','ip gi0/0 203.0.113.1 /30','ip gi0/1 8.8.8.1 /24');X('Web','ip eth0 8.8.8.8 /24','gateway 8.8.8.1','service add tcp 80');
 if(sxOn)cmSxPrep(c.sx,'Admin');sel=byNm('Admin').id;ch();draw();side()}
function cmGeSolve(c,part){const X=(n,...cs)=>cs.forEach(l=>execOn(byNm(n),l)),v=c.vid,n=i=>cmNet(c,i);
 if(part==='A'||part==='all'){X('L3SW1',`port fa0/1 access ${v[0]}`,`port fa0/2 access ${v[0]}`,`port fa0/3 access ${v[1]}`,`port fa0/4 access ${v[2]}`,'port fa0/5 access 99',`svi ${v[0]} ${n(0)}.1 /24`,`svi ${v[1]} ${n(1)}.1 /24`,`svi ${v[2]} ${n(2)}.1 /24`,`svi 99 10.${c.x}.99.1 /30`,`route add 0.0.0.0 0.0.0.0 10.${c.x}.99.2`);
  X('R1',`ip gi0/0 10.${c.x}.99.2 /30`,`route add 10.${c.x}.0.0 255.255.0.0 10.${c.x}.99.1`,'nat gi0/1 on');
  X('Admin',`ip eth0 ${n(0)}.10 /24`,`gateway ${n(0)}.1`);X('PC2',`ip eth0 ${n(0)}.11 /24`,`gateway ${n(0)}.1`);X('Server',`ip eth0 ${n(2)}.10 /24`,`gateway ${n(2)}.1`)}
 if(part==='B'||part==='all'){X('L3SW1',`dhcp Vlan${v[1]} ${n(1)}.100 20`,`acl deny ${n(1)}.0/24 ${n(2)}.0/24 tcp 80`,'acl permit any any');X('PC3','dhcp eth0');X('Server','service add tcp 80',`dnsrec www ${n(2)}.10`)}}
function cmGeAdd(c){execOn(byNm('L3SW1'),'acl clear');execOn(byNm('Server'),'service add tcp 22');
 execOn(byNm('L3SW1'),`acl deny ${cmNet(c,1)}.0/24 ${cmNet(c,2)}.0/24 tcp 80`);execOn(byNm('L3SW1'),`acl deny ${cmNet(c,1)}.0/24 ${cmNet(c,2)}.0/24 tcp 22`);execOn(byNm('L3SW1'),'acl permit any any')}
// ---------- многозадачные Linux-модули ----------
const cmTplI=()=>TPL.findIndex(x=>/скрипты и Git/.test(x.n));
function cmSxPrep(ids,dev){ids.forEach(id=>{const t=SXT.find(z=>z.id===id);if(t&&t.prep)cmOn(dev,d=>{try{t.prep(d)}catch(e){}})})}
function cmSxCrit(ids,dev){const per=Math.floor(100/ids.length),out=[];ids.forEach((id,ti)=>{const t=SXT.find(z=>z.id===id);let R;try{R=cmOn(dev,d=>t.chk(d))}catch(e){R=[['Проверка не выполнена',false]]}
 const k=R.length,b=Math.floor(per/k);R.forEach(([l,ok],i)=>out.push([`Задание ${ti+1}. ${l}`,b+(i===0?per-b*k:0),()=>ok]))});const ex=100-out.reduce((a,x)=>a+x[1],0);if(out.length)out[0][1]+=ex;return out}
const cmSxText=ids=>ids.map((id,i)=>{const t=SXT.find(z=>z.id===id);return`${i+1}) ${t.t}. ${t.d}`}).join('\n');
const cmPick=(pool,k,r)=>{const a=pool.slice(),o=[];for(let i=0;i<k&&a.length;i++)o.push(a.splice(Math.floor(r()*a.length),1)[0]);return o};
// ---------- провайдеры модулей ----------
const gAT=c=>`Комплексное задание «Филиал»: схема собрана и кабели подключены — Admin, PC2, PC3 (рабочие места), Server, L3-коммутатор L3SW1, маршрутизатор R1, провайдер ISP и сайт Web (8.8.8.8). Адреса и службы не настроены.
Модуль А. Отделы: «Администрация» — VLAN ${c.vid[0]} (Admin на fa0/1, PC2 на fa0/2), «Бухгалтерия» — VLAN ${c.vid[1]} (PC3 на fa0/3), «Серверы» — VLAN ${c.vid[2]} (Server на fa0/4). Порт fa0/5 — транзитный VLAN 99 к R1.
Адресация: ${cmNet(c,0)}.0/24, ${cmNet(c,1)}.0/24, ${cmNet(c,2)}.0/24, шлюзы — интерфейсы VLAN (SVI) с адресом .1; транзит 10.${c.x}.99.0/30 (L3SW1 — .1, R1 gi0/0 — .2). Admin — .10, PC2 — .11, Server — .10 (статически, шлюз .1). L3SW1: маршрут по умолчанию через R1; R1: маршрут в 10.${c.x}.0.0/16 через L3SW1 и NAT на интерфейсе в сторону провайдера (gi0/1). R1 gi0/1 и маршрут к ISP уже настроены.`;
const gBT=c=>`Модуль Б. Сервисы: на L3SW1 включите DHCP для «Бухгалтерии» (VLAN ${c.vid[1]}, пул — ${cmNet(c,1)}.100, 20 адресов) и получите адрес на PC3 (dhcp eth0); на Server включите веб (tcp/80) и создайте DNS-запись www → адрес Server. Безопасность: сотрудники «Бухгалтерии» не должны открывать веб-сайт на Server, остальные подсети (Admin) — должны; ping и прочий трафик не блокируйте.`;
const gVT=c=>`Модуль В. Администрирование ОС: на компьютере Admin (окно «Скрипты») выполните задания:\n${cmSxText(c.sx)}`;
const gA=c=>[
 ['Порты L3SW1 в нужных VLAN (fa0/1, fa0/2 — '+c.vid[0]+'; fa0/3 — '+c.vid[1]+'; fa0/4 — '+c.vid[2]+'; fa0/5 — 99)',10,()=>{const g=n=>(cmIf('L3SW1',n)||{}).v;return g('fa0/1')===c.vid[0]&&g('fa0/2')===c.vid[0]&&g('fa0/3')===c.vid[1]&&g('fa0/4')===c.vid[2]&&g('fa0/5')===99}],
 ['Интерфейсы VLAN (шлюзы) на L3SW1: '+cmNet(c,0)+'.1, '+cmNet(c,1)+'.1, '+cmNet(c,2)+'.1 /24 и транзит 10.'+c.x+'.99.1 /30',15,()=>{const d=byNm('L3SW1');if(!d)return false;const s=(v,ip,m)=>d.ifaces.some(f=>f.svi===v&&f.ip===ip&&f.mask===m);return s(c.vid[0],cmNet(c,0)+'.1','255.255.255.0')&&s(c.vid[1],cmNet(c,1)+'.1','255.255.255.0')&&s(c.vid[2],cmNet(c,2)+'.1','255.255.255.0')&&s(99,'10.'+c.x+'.99.1','255.255.255.252')}],
 ['Admin и PC2 настроены: адреса .10/.11, маска /24, шлюз .1',10,()=>cmOkIp('Admin',cmNet(c,0))&&cmOkIp('PC2',cmNet(c,0))],
 ['Server настроен: '+cmNet(c,2)+'.10 /24, шлюз .1',10,()=>cmOkIp('Server',cmNet(c,2))],
 ['ping Admin ↔ PC2 (один VLAN)',5,()=>cmPin('Admin','PC2')&&cmPin('PC2','Admin')],
 ['ping Admin → Server (маршрутизация между VLAN)',15,()=>cmPin('Admin','Server')],
 ['R1: gi0/0 — 10.'+c.x+'.99.2 /30 и маршрут в 10.'+c.x+'.0.0/16 через L3SW1',10,()=>{const f=cmIf('R1','gi0/0'),d=byNm('R1');return !!f&&f.ip==='10.'+c.x+'.99.2'&&f.mask==='255.255.255.252'&&d.routes.some(r=>r.net==='10.'+c.x+'.0.0'&&r.nh==='10.'+c.x+'.99.1')}],
 ['NAT включён на R1 (gi0/1)',10,()=>{const f=cmIf('R1','gi0/1');return !!f&&!!f.nat}],
 ['ping Admin → 8.8.8.8 (Интернет через NAT)',15,()=>cmPin('Admin','8.8.8.8')]];
const gB=c=>[
 ['DHCP-пул на интерфейсе VLAN '+c.vid[1]+' L3SW1: начало '+cmNet(c,1)+'.100, не менее 10 адресов',15,()=>{const d=byNm('L3SW1'),p=d&&d.dhcp&&d.dhcp['Vlan'+c.vid[1]];return !!p&&p.first===cmNet(c,1)+'.100'&&p.n>=10}],
 ['PC3 получил адрес из пула и шлюз .1',15,()=>{const d=byNm('PC3');return !!d&&/^[\d.]+$/.test(d.ifaces[0].ip)&&d.ifaces[0].ip.startsWith(cmNet(c,1)+'.')&&+d.ifaces[0].ip.split('.')[3]>=100&&d.gw===cmNet(c,1)+'.1'}],
 ['DNS-запись www → адрес Server на Server',15,()=>{const d=byNm('Server');return !!d&&!!d.hosts&&d.hosts.www===cmNet(c,2)+'.10'}],
 ['Server слушает tcp/80',10,()=>{const d=byNm('Server');return !!d&&(d.svc||[]).some(s=>s.p==='tcp'&&s.n===80)}],
 ['Admin открывает веб Server (tcp/80)',15,()=>cmL4('Admin','Server',80)],
 ['ACL: «Бухгалтерия» (PC3) не открывает веб Server, но ping PC3 → Server проходит, Admin → Server:80 проходит',30,()=>!cmL4('PC3','Server',80)&&cmPin('PC3','Server')&&cmL4('Admin','Server',80)]];
CMX['ГИА · А: Сетевая инфраструктура («Филиал»)']={n:'ГИА · А: Сетевая инфраструктура («Филиал»)',text:gAT,crit:gA};
CMX['ГИА · Б: Сервисы и безопасность («Филиал»)']={n:'ГИА · Б: Сервисы и безопасность («Филиал»)',text:gBT,crit:gB};
CMX['ГИА · В: Администрирование ОС («Филиал»)']={n:'ГИА · В: Администрирование ОС («Филиал»)',text:gVT,crit:c=>cmSxCrit(c.sx,'Admin')};
// ---------- Профессионалы ----------
const lateA=c=>`Заказчик просит запретить подключение к Server по tcp/22 (SSH) из подсети «Бухгалтерии» ${cmNet(c,1)}.0/24; для Admin доступ по tcp/22 должен работать (включите службу tcp/22 на Server). Веб-правило и связность должны сохраниться.`;
CMX['Профи · А: Филиал с нуля']={n:'Профи · А: Филиал с нуля',text:c=>gAT(c)+'\n'+gBT(c).replace('Модуль Б. Сервисы','Сервисы'),
 crit:c=>gA(c).concat(gB(c)),
 start:c=>cmGeBuild(c,false),
 late:{at:.6,text:lateA,crit:c=>[
  ['Server принимает tcp/22 от Admin',20,()=>cmL4('Admin','Server',22)],
  ['tcp/22 к Server из «Бухгалтерии» закрыт (PC3), а Admin подключается',20,()=>cmL4('Admin','Server',22)&&!cmL4('PC3','Server',22)],
  ['Веб-правило и связность сохранены (tcp/80: Admin да, PC3 нет; ping PC3 → Server) при работающем tcp/22',20,()=>cmL4('Admin','Server',22)&&cmL4('Admin','Server',80)&&!cmL4('PC3','Server',80)&&cmPin('PC3','Server')]]}};
const CMF=[
 {id:'vl',sym:'Admin не может обратиться к PC2, хотя они в одном отделе',ap:c=>{cmIf('L3SW1','fa0/2').v=c.vid[1]},ok:c=>cmIf('L3SW1','fa0/2').v===c.vid[0]&&cmPin('Admin','PC2')},
 {id:'nat',sym:'Ни один компьютер не открывает сайт Web (8.8.8.8), при этом внутри офиса всё работает',ap:c=>{cmIf('R1','gi0/1').nat=false},ok:c=>!!cmIf('R1','gi0/1').nat&&cmPin('Admin','8.8.8.8')},
 {id:'gw',sym:'PC3 («Бухгалтерия») не достаёт до других подсетей',ap:c=>{byNm('PC3').gw=cmNet(c,1)+'.254'},ok:c=>byNm('PC3').gw===cmNet(c,1)+'.1'&&cmPin('PC3','Server')},
 {id:'rt',sym:'Из внутренних сетей нет выхода за пределы офиса, хотя NAT включён',ap:c=>{byNm('L3SW1').routes=[]},ok:c=>byNm('L3SW1').routes.some(r=>r.net==='0.0.0.0')&&cmPin('Admin','8.8.8.8')},
 {id:'svi',sym:'Server недоступен из других подсетей, хотя компьютеры в других подсетях друг друга видят',ap:c=>{const f=byNm('L3SW1').ifaces.find(f=>f.svi===c.vid[2]);f.ip=cmNet(c,2)+'.2'},ok:c=>byNm('L3SW1').ifaces.some(f=>f.svi===c.vid[2]&&f.ip===cmNet(c,2)+'.1')&&cmPin('Admin','Server')}];
CMX['Профи · Б: Поиск неисправностей (3 отказа)']={n:'Профи · Б: Поиск неисправностей (3 отказа)',
 text:c=>`Схема «Филиал» была полностью настроена (VLAN ${c.vid.join(', ')}, подсети 10.${c.x}.x, DHCP для «Бухгалтерии», NAT, ACL на веб Server). После работ поступили жалобы:\n${c.f.map((k,i)=>(i+1)+') '+CMF.find(z=>z.id===k).sym).join('\n')}\nНайдите и устраните все причины. Не добавляйте и не удаляйте устройства и кабели, не стирайте ACL и DHCP.`,
 start:c=>{cmGeBuild(c,false);cmGeSolve(c,'all');c.nd=S.devs.length;c.nl=S.links.length;c.f.forEach(k=>CMF.find(z=>z.id===k).ap(c));ch();draw();side()},
 crit:c=>c.f.map(k=>{const z=CMF.find(q=>q.id===k);return['Устранено: '+z.sym,25,()=>{try{return z.ok(c)}catch(e){return false}}]}).concat([
  ['Восстановлена связность: Admin ↔ PC2, Admin → Server, PC3 → Server, Admin → 8.8.8.8',15,()=>cmPin('Admin','PC2')&&cmPin('Admin','Server')&&cmPin('PC3','Server')&&cmPin('Admin','8.8.8.8')],
  ['Число устройств и кабелей не изменено, DHCP и ACL сохранены',10,()=>S.devs.length===c.nd&&S.links.length===c.nl&&!!byNm('L3SW1').dhcp&&(byNm('L3SW1').acl||[]).length>=2]])};
const cmMultiMk=(name,pool,k,tag,dev)=>{CMX[name]={n:name,tag,
 text:c=>`Выполните задания на компьютере ${dev} (окно «Скрипты», схема из шаблона «Практикум: скрипты и Git», Git-сервер Git1, репозиторий team/app):\n${cmSxText(c.ids)}`,
 start:c=>{exLoad0(cmTplI());cmSxPrep(c.ids,dev);sel=byNm(dev).id;ch();draw();side()},
 crit:c=>cmSxCrit(c.ids,dev)};return r=>({prov:CMX[name],ctx:{ids:cmPick(pool,k,r)}})};
const mkB=cmMultiMk('Профи · В: Администрирование Linux (3 задания)',SXPOOL.b,3,'Linux','PC1');
const mkG=cmMultiMk('Профи · Г: DevOps (3 задания)',SXPOOL.g,3,'DevOps','PC1');
const mkProA=(r)=>({prov:CMX['Профи · А: Филиал с нуля'],ctx:cmGeInit(r)});
const mkProB=(r)=>{const c=cmGeInit(r);c.f=cmPick(CMF.map(z=>z.id),3,r);return{prov:CMX['Профи · Б: Поиск неисправностей (3 отказа)'],ctx:c}};
// ---------- форматы ----------
const JL=[[0,'не выполнено'],[2,'частично'],[4,'в основном'],[5,'полностью']];
CMP.ge={key:'ge',short:'ГИА · ДЭ',title:'Подготовка к ГИА (демонстрационный экзамен)',total:180,free:true,shared:true,
 desc:'Учебная модель демонстрационного экзамена по профилю «Сетевое и системное администрирование»: одно комплексное задание «Филиал» на единой схеме, три модуля. Общее время 180 минут, модули можно выполнять в любом порядке. Баллы суммируются до 100 и переводятся в оценку по настраиваемой шкале (по умолчанию 70/40/20 %).',
 scen:{init:(r,v)=>cmGeInitK(r,v),start:sc=>cmGeBuild(sc,true)},
 mods:[{id:'А',name:'Сетевая инфраструктура',w:40,about:'VLAN, адресация, маршрутизация между VLAN, маршрут по умолчанию, NAT',mk:(r,sc)=>({prov:CMX['ГИА · А: Сетевая инфраструктура («Филиал»)'],ctx:sc})},
  {id:'Б',name:'Сетевые сервисы и безопасность',w:30,about:'DHCP, DNS, веб-служба, ACL',mk:(r,sc)=>({prov:CMX['ГИА · Б: Сервисы и безопасность («Филиал»)'],ctx:sc})},
  {id:'В',name:'Администрирование операционных систем',w:30,about:'три задания Linux на компьютере Admin: службы, права, cron, firewall, пользователи',mk:(r,sc)=>({prov:CMX['ГИА · В: Администрирование ОС («Филиал»)'],ctx:sc})}],
 judge:[],scale:[70,40,20]};
CMP.pr={key:'pr',short:'Профессионалы',title:'Подготовка к «Профессионалам»',total:0,free:false,shared:false,
 desc:'Учебная модель чемпионатного формата: четыре модуля со своим временем, строго по порядку (вернуться к завершённому модулю нельзя). В модуле А в середине времени приходит «дополнение заказчика». Модуль Б — три одновременные неисправности. Критерии скрыты, после модулей эксперт выставляет судейские аспекты и при необходимости корректирует результаты критериев. Итог — баллы из 100 и место в рейтинге.',
 mods:[{id:'А',name:'Проектирование и настройка сети',w:30,min:45,about:'схема с нуля, дополнение заказчика',mk:mkProA},
  {id:'Б',name:'Поиск и устранение неисправностей',w:20,min:30,about:'три отказа в готовой схеме',mk:mkProB},
  {id:'В',name:'Администрирование Linux',w:20,min:40,about:'три задания',mk:mkB},
  {id:'Г',name:'DevOps: автоматизация и контейнеры',w:20,min:40,about:'три задания: CI, Docker, Git, скрипты',mk:mkG}],
 judge:[{t:'Документация: таблица адресации и пояснения оформлены',max:5,levels:JL},{t:'Организация работы: аккуратность конфигурации, имена устройств, порядок',max:5,levels:JL}],scale:[70,40,20]};
// ---------- подсказки, инструкция ----------
if(typeof QH_ID!=='undefined'){QH_ID.bge=['ГИА · демонстрационный экзамен','Подготовка к ГИА в формате демонстрационного экзамена: единый сценарий «Филиал» на одной схеме, три модуля (сеть, сервисы и безопасность, администрирование ОС), общее время 180 минут, модули в любом порядке. В конце — баллы, оценка и протокол.','ГИА'];
 QH_ID.bpr=['Профессионалы','Тренировка в формате чемпионата: четыре модуля подряд со своим временем, назад возвращаться нельзя. В модуле А приходит дополнение заказчика, в Б — три неисправности. После модулей эксперт ставит судейские баллы; результаты попадают в рейтинг.','Профессионалы']}
MAN.push(['Т31. Режимы «ГИА · ДЭ» и «Профессионалы»',`<h3>Подготовка к демонстрационному экзамену и чемпионату</h3>
<p>Пункты <b>«ГИА · ДЭ»</b> и <b>«Профессионалы»</b> меню «Практика» запускают модульные конкурсные форматы. Это <b>учебная модель</b>: задания, критерии и шкала составлены для тренировки и не заменяют официальных материалов; нормативные требования уточняйте у методиста.</p>
<p><b>ГИА · демонстрационный экзамен.</b> Одно комплексное задание «Филиал» на единой схеме (Admin, PC2, PC3, Server, L3SW1, R1, ISP, Web): «А. Сетевая инфраструктура» (40 баллов: VLAN, адресация, маршрутизация между VLAN, маршрут по умолчанию, NAT), «Б. Сетевые сервисы и безопасность» (30: DHCP, DNS, веб-служба, ACL), «В. Администрирование ОС» (30: три задания Linux на компьютере Admin). Общее время — 180 минут, модули можно выполнять в любом порядке (вкладки А, Б, В); схема общая, как на настоящем экзамене. Баллы суммируются до 100, оценка — по шкале, которую задаёт преподаватель (по умолчанию 70/40/20 %).</p>
<p><b>Профессионалы.</b> Четыре модуля со своим таймером и строго по порядку: «А. Проектирование и настройка сети» (30 баллов, 45 мин; в 60% времени приходит <b>дополнение заказчика</b> с новыми требованиями — модуль нельзя завершить, пока оно не показано), «Б. Поиск неисправностей» (20, 30 мин; <b>три</b> одновременных отказа), «В. Администрирование Linux» (20, 40 мин; три задания), «Г. DevOps» (20, 40 мин; три задания). Критерии скрыты до конца. Оставшиеся 10 баллов — судейские аспекты (документация и организация работы) с уровнями «не выполнено / частично / в основном / полностью».</p>
<p><b>Эксперт.</b> В окне результата эксперт может изменить результат любого критерия («зачесть» / «не зачесть»), написать комментарий к модулю и выставить судейские аспекты; кнопка «Сохранить оценки эксперта» пересчитывает итог и рейтинг.</p>
<p><b>Условия запуска.</b> Номер варианта задаёт числа в условии (VLAN, подсети), набор заданий Linux и набор неисправностей. «Режим без справки» скрывает Инструкцию, Шаблоны, Пример, Аварии и значки «?» (организационная мера, не защита от обхода). Предупреждения о времени — за 10, 5 и 1 минуту. Если страницу закрыли или перезагрузили, работа восстанавливается, а время не останавливается.</p>
<p><b>Протокол и рейтинг.</b> «Скачать протокол» сохраняет HTML-файл с баллами по критериям, комментариями и строкой для подписи эксперта. «Рейтинг участников»: сортировка по баллам, при равенстве — по времени; места и медали для Профессионалов; блок «Частые ошибки группы»; выгрузка в CSV (ведомость и баллы по критериям). Данные хранятся в браузере этого компьютера.</p>
<p><b>Консоль:</b> <code>contest start ge|pro &lt;вариант&gt; [ФИО]</code>, <code>contest check</code>, <code>contest module А|Б|В</code> (ГИА), <code>contest next</code> (Профессионалы), <code>contest finish</code>, <code>contest stop</code>, <code>contest board ge|pro</code>.</p>
<p class="mt">Ограничения: интерпретаторы скриптов — подмножества; проверка и шкала — учебные; рейтинг локален для браузера (для общей ведомости выгружайте CSV); судейские аспекты и спорные критерии эксперт оценивает вручную; в модулях Linux пул заданий ограничен банком платформы.</p>`]);
{const m=MAN.find(x=>/Скрипты \(bash/.test(x[0]));if(m)m[1]=m[1].replace(/\d+ заданий/,SXT.length+' заданий')}
if(typeof exSyncCustom==='function')exSyncCustom();
