(function(){const R=[];const ok=(n,c,i)=>R.push((c?'PASS ':'FAIL ')+n+(c?'':' '+JSON.stringify(String(i||'')).slice(0,700)));
try{const o=document.getElementById('out');const sh=(c,d)=>{if(d)sel=d.id;o.textContent='';run(c);return o.textContent};
 const i=TPL.findIndex(t=>/^IPv6: RA/.test(t.n));ok('шаблон есть',i>=0);const bad=tplLoad(TPL[i]);ok('шаблон без ошибок',!bad.length,bad);
 const R1=byNm('R1'),P1=byNm('PC1'),P2=byNm('PC2'),P3=byNm('PC3');
 ok('PC1 получил адрес SLAAC',/^2001:db8:1:/.test(P1.ifaces[0].ip6)&&P1.gw6,P1.ifaces[0].ip6);
 ok('PC3 получил адрес DHCPv6 ::100',P3.ifaces[0].ip6==='2001:db8:2::100',P3.ifaces[0].ip6);
 ok('gw PC3 из RA',/^fe80/.test(P3.gw6||''));
 ok('проблем нет',i6Problems().length===0,i6Problems());
 const ping=(a,b)=>{EX=[];return !!trip6(a,b.ifaces[0].ip6).ok};
 ok('ping PC1→PC2',ping(P1,P2));ok('ping PC1→PC3',ping(P1,P3));
 let t=sh('ndp',P1);ok('ndp: запись о соседе с REACHABLE',/REACHABLE/.test(t)&&/R1|SW1/.test(t),t);
 t=sh('ndp clear',P1);t=sh('ndp',P1);ok('ndp clear',/пусто/.test(t),t);
 t=sh('ndp discover',P1);t=sh('show ipv6 neighbors',P1);ok('ndp discover',/fe80/.test(t),t);
 t=sh('ra show',R1);ok('ra show',/M=1 O=0 A=0/.test(t)&&/A=1/.test(t),t);
 t=sh('dhcp6 show',R1);ok('dhcp6 show: аренда',/2001:db8:2::100/.test(t),t);
 t=sh('dhcp6 show',P3);ok('pc dhcp6 show',/DHCPv6/.test(t)&&/2001:db8:2::53/.test(t),t);
 // RA off
 sh('ip6 none',P1);P1.ifaces[0].ip6='';P1.gw6='';sh('ra off gi0/0',R1);t=sh('slaac',P1);ok('RA выключен → нет адреса',/отправка RA выключена/.test(t)&&!P1.ifaces[0].ip6,t);
 ok('проверка: RA выключен',i6Problems().some(x=>/RA выключен/.test(x)),i6Problems());sh('ra on gi0/0',R1);
 // A off
 sh('ra flag gi0/0 A off',R1);t=sh('slaac',P1);ok('A=0 → адрес не сформирован',/Флаг A/.test(t)&&!P1.ifaces[0].ip6,t);
 ok('проверка: A=0 и M=0',i6Problems().some(x=>/A=0 и M=0/.test(x)));
 sh('ra flag gi0/0 M on',R1);ok('проверка: M без DHCPv6',i6Problems().some(x=>/сервер DHCPv6 не включён/.test(x)));
 t=sh('dhcp6',P1);ok('DHCPv6 без сервера',/не включён сервер DHCPv6/.test(t)&&!P1.ifaces[0].ip6,t);
 sh('dhcp6 on gi0/0 5',R1);t=sh('dhcp6',P1);ok('DHCPv6 выдал адрес',P1.ifaces[0].ip6==='2001:db8:1::100',t);
 t=sh('dhcp6',P2);ok('второй клиент — следующий адрес',P2.ifaces[0].ip6==='2001:db8:1::101',P2.ifaces[0].ip6+' '+t);
 sh('ra flag gi0/0 M off',R1);sh('ra flag gi0/0 O on',R1);P2.ifaces[0].ip6='';t=sh('dhcp6',P2);ok('stateless: только DNS',/Information-Request/.test(t)&&!P2.ifaces[0].ip6,t);
 sh('ra flag gi0/0 M off',R1);sh('ra flag gi0/0 O off',R1);t=sh('dhcp6',P2);ok('M=0 O=0 → клиент не запускается',/не запускается/.test(t),t);
 // lifetime
 sh('ra flag gi0/0 A on',R1);P1.ifaces[0].ip6='';P1.gw6='';sh('ra lifetime gi0/0 0',R1);t=sh('slaac',P1);ok('lifetime 0: адрес есть, шлюза нет',P1.ifaces[0].ip6&&!P1.gw6&&/не изменён/.test(t),t);
 ok('проверка: нет шлюза',i6Problems().some(x=>/нет шлюза IPv6/.test(x)||/lifetime 0/.test(x)));sh('ra lifetime gi0/0 1800',R1);
 // DAD
 P2.ifaces[0].ip6=P1.ifaces[0].ip6;t=sh('ip6 '+P1.ifaces[0].ip6+'/64',P2);ok('DAD: предупреждение',/DAD/.test(t),t);
 ok('проверка: дубликат',i6Problems().some(x=>/Дубликат/.test(x)));
 P2.ifaces[0].ip6='';t=sh('slaac',P2);ok('SLAAC работает после очистки',/^2001:db8:1:/.test(P2.ifaces[0].ip6),t);
 // slaac при дубликате MAC
 const addr=P2.ifaces[0].ip6;P3.ifaces[0].ip6=addr;P2.ifaces[0].ip6='';t=sh('slaac',P2);ok('DAD при SLAAC отклоняет адрес',/DAD: ответил PC3/.test(t)&&!P2.ifaces[0].ip6,t);P3.ifaces[0].ip6='2001:db8:2::100';
 // ip info
 t=sh('ipv6 info fe80::1',P1);ok('info: link-local',/link-local/.test(t)&&/Solicited-node/.test(t),t);
 t=sh('ipv6 info 2001:db8:1::10/64',P1);ok('info: документационный + диапазон',/документационный/.test(t)&&/Подсетей \/64/.test(t),t);
 t=sh('v6info fc00::1',P1);ok('info ULA',/ULA/.test(t));t=sh('ipv6 info ff02::1:2',P1);ok('info ff02::1:2',/DHCPv6/.test(t),t);t=sh('ipv6 info ff02::2',P1);ok('info ff02::2',/маршрутизаторы/.test(t),t);
 t=sh('ipv6 info 2a00::1',P1);ok('info глобальный',/глобальный unicast/.test(t));
 t=sh('v6split 2001:db8:abcd::/48 64 3',P1);ok('v6split',/2\^16/.test(t)&&/2001:db8:abcd::\/64/.test(t)&&/2001:db8:abcd:2::\/64/.test(t),t);
 t=sh('v6split 2001:db8::/32 30',P1);ok('v6split ошибка',/должна быть больше/.test(t),t);
 // сценарий
 i6Scenario();const A=byNm('PC1'),C=byNm('PC3'),r=byNm('R1');
 ok('сценарий: PC1 без адреса',!A.ifaces[0].ip6);
 const pr=i6Problems();ok('сценарий: найдены проблемы',pr.length>=4,pr);
 ok('сценарий: дубликат с R1',pr.some(x=>/Дубликат/.test(x)&&/R1/.test(x)),pr);
 ok('сценарий: PC3 не пингует',!trip6(C,'2001:db8:1::1').ok);
 // исправление по подсказкам
 sh('ra flag gi0/0 A on',r);sh('ra flag gi0/0 M off',r);sh('slaac',byNm('PC1'));sh('slaac',byNm('PC2'));ok('исправление: PC1,PC2 получили адреса',byNm('PC1').ifaces[0].ip6&&byNm('PC2').ifaces[0].ip6);
 sh('ip6 gi0/1 2001:db8:2::1/64',r);sh('ip6 eth0 none',C);sh('ra lifetime gi0/1 1800',r);sh('dhcp6',C);
 ok('исправление PC3',C.ifaces[0].ip6==='2001:db8:2::100'&&C.gw6,C.ifaces[0].ip6);
 ok('после исправления проблем нет',i6Problems().length===0,i6Problems());
 ok('ping PC1→PC3 после исправления',trip6(byNm('PC1'),'2001:db8:2::100').ok);
 // панель
 openMd(i6Panel());ok('панель',/IPv6: адреса/.test(mb.innerHTML)&&/SLAAC/.test(mb.innerHTML)&&/DHCPv6/.test(mb.innerHTML));
 document.querySelector('[data-i6b="scn"]').click();ok('кнопка сценария',!byNm('PC1').ifaces[0].ip6&&document.getElementById('i6x'));
 document.querySelector('[data-i6b="fix"]').click();document.querySelector('[data-i6b="auto"]').click();
 ok('кнопка «Получить адреса»',!!byNm('PC1').ifaces[0].ip6,i6Problems());
 ok('меню',!!document.getElementById('bi6c'));ok('MAN Т51',MAN.some(m=>/^Т51/.test(m[0])));
 ok('v6check открывает окно',(sh('v6check',P1),!!document.getElementById('i6x')));
}catch(e){R.push('FAIL EXC '+e.stack)}
return R.join('\n')})();
