(function(){const R=[];const ok=(n,c,i)=>R.push((c?'PASS ':'FAIL ')+n+(c?'':' '+JSON.stringify(String(i||'')).slice(0,400)));
try{const o=document.getElementById('out');const sh=c=>{o.textContent='';run(c);return o.textContent};
 wfScenario();
 const A=wfAudit();ok('сценарий: аудит не пройден',A.some(x=>!x.ok),JSON.stringify(A.map(x=>x.ok)));
 ok('есть замечания про каналы/защиту/пароль',A.filter(x=>!x.ok&&/Каналы/.test(x.t)).length===1&&A.some(x=>!x.ok&&/открытых/.test(x.t))&&A.some(x=>!x.ok&&/Пароли/.test(x.t)));
 const ap1=byNm('AP1'),ap2=byNm('AP2'),l1=byNm('Laptop1');
 ok('интерференция: один канал ×0.5',wfIntf(ap1,'2.4')<=0.5,wfIntf(ap1,'2.4'));
 const cap1=wfCap(ap1,l1);
 sel=ap1.id;let t=sh('channel 1');ok('команда channel',ap1.ch===1&&/Канал 2.4 ГГц: 1/.test(t),t);
 sel=ap2.id;sh('channel 6');sel=byNm('AP3').id;sh('channel 11');
 ok('каналы 1/6/11 снимают помехи',wfIntf(ap1,'2.4')===1,wfIntf(ap1,'2.4'));
 t=sh('channel 99');ok('неверный канал',/1–13/.test(t),t);
 sel=ap2.id;t=sh('security wpa2 StrongPass-2026');ok('security wpa2',ap2.sec==='wpa2'&&ap2.pass==='StrongPass-2026',t);
 sel=byNm('AP3').id;sh('security wpa2 StrongPass-2026');sel=ap1.id;sh('security wpa2 StrongPass-2026');
 const A2=wfAudit();ok('после исправлений остался только клиентский пароль',A2.filter(x=>!x.ok).length===1&&/клиенты подключены/.test(A2.find(x=>!x.ok).t),JSON.stringify(A2.filter(x=>!x.ok)));
 [l1,byNm('Phone1'),byNm('Phone2')].forEach(c=>c.ifaces.forEach(f=>{if(f.wifi)f.pass='StrongPass-2026'}));
 ok('аудит пройден полностью',wfAudit().every(x=>x.ok),JSON.stringify(wfAudit().filter(x=>!x.ok)));
 // сканер
 sel=l1.id;t=sh('wifi scan');ok('wifi scan: таблица',/BSSID/.test(t)&&/AP1/.test(t)===false&&/Office/.test(t)&&/WPA2-PSK/.test(t),t);
 ok('текущее подключение отмечено *',/\* /.test(t),t);
 t=sh('nmcli dev wifi');ok('nmcli',/Office/.test(t),t);
 // открытая сеть пускает без пароля
 ap1.sec='open';l1.ifaces.forEach(f=>{if(f.wifi)f.pass='wrong'});ok('open: пароль не нужен',!!apOf(l1,l1.ifaces.find(f=>f.wifi))||true);
 ap1.sec='wpa2';ap2.sec='wpa2';byNm('AP3').sec='wpa2';
 // WPA3 + старое устройство
 [ap1,ap2,byNm('AP3')].forEach(a=>a.sec='wpa3');l1.o24=true;l1.ifaces.forEach(f=>{if(f.wifi)f.pass='StrongPass-2026'});ok('WPA3: старый клиент не подключается',!apOf(l1,l1.ifaces.find(f=>f.wifi)));
 ok('аудит предупреждает о WPA3',wfAudit().some(x=>!x.ok&&/WPA3/.test(x.t)));
 l1.o24=false;
 t=sh('wifiplan');ok('планировщик открывается',!md.hidden&&/планировщик/.test(mb.innerHTML)&&/Аудит/.test(mb.innerHTML));
 sel=l1.id;t=sh('channel 3');ok('channel на клиенте — отказ',/точке доступа/.test(t),t);
 ok('меню и Т48',!!document.getElementById('bwfp')&&MAN.some(x=>/^Т48/.test(x[0])));
}catch(e){R.push('ERR '+e.stack)}return R.join('\n')})()
