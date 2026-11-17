// ================= v11: векторные иконки, выбор устройства с иконками, светлая/тёмная тема =================
document.head.insertAdjacentHTML('beforeend',`<style>
:root{--ic1:#e3eaf0;--ic2:#40505e;--ic3:#cfe3f1;--ic4:#0b6fa8;--ic5:#16a05a;--ic6:#d9822b;--ic7:#c4cfd9}
:root[data-theme="dark"]{--ic1:#2a3a48;--ic2:#a9bccb;--ic3:#0f2a3d;--ic4:#4aa8e0;--ic5:#3ccf84;--ic6:#e8a04c;--ic7:#3a4c5b;color-scheme:dark}
:root[data-theme="light"]{color-scheme:light}
@media(prefers-color-scheme:dark){:root:not([data-theme="light"]){--ic1:#2a3a48;--ic2:#a9bccb;--ic3:#0f2a3d;--ic4:#4aa8e0;--ic5:#3ccf84;--ic6:#e8a04c;--ic7:#3a4c5b}}
.ico{display:inline-block;vertical-align:middle;flex:none}
.ib{fill:var(--ic1);stroke:var(--ic2);stroke-width:1.6;stroke-linejoin:round;stroke-linecap:round}
.is{fill:none;stroke:var(--ic2);stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
.if{fill:var(--ic2);stroke:none}
.iscr{fill:var(--ic3);stroke:var(--ic2);stroke-width:1.4}
.ia{fill:none;stroke:var(--ic4);stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.iaf{fill:var(--ic4);stroke:none}
.ig{fill:var(--ic5);stroke:none}
.io{fill:var(--ic6);stroke:var(--ic2);stroke-width:1.2}
.ip{fill:var(--ic7);stroke:var(--ic2);stroke-width:1.2}
#adb{display:inline-flex;align-items:center;gap:6px}
#adp{position:fixed;z-index:30;background:var(--pn);color:var(--tx);border:1px solid var(--bd);border-radius:10px;box-shadow:0 8px 28px #0006;padding:6px;max-height:min(70vh,560px);overflow:auto;min-width:290px}
#adp[hidden]{display:none}
#adp h5{margin:8px 8px 3px;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--mt)}
#adp button{display:flex;align-items:center;gap:10px;width:100%;text-align:left;background:transparent;color:inherit;border:0;border-radius:7px;padding:5px 8px;cursor:pointer;font:inherit}
#adp button:hover,#adp button:focus-visible{background:var(--bg)}
#adp button.on{outline:2px solid var(--ac)}
#ad{display:none!important}
#bth{display:inline-flex;align-items:center;padding:5px 8px}
#side h3 .ico{margin-right:8px;position:relative;top:-2px}
</style>`);
const IC={
 pc:`<rect class="ib" x="6" y="5" width="36" height="25" rx="2.5"/><rect class="iscr" x="9.5" y="8.5" width="29" height="18" rx="1"/><path class="ia" d="M13 22l5-5 4 3 6-7 5 5"/><path class="ib" d="M20 30h8l1.5 6h-11z"/><rect class="ib" x="13" y="36" width="22" height="4" rx="1.5"/>`,
 lap:`<path class="ib" d="M10 8h28a2 2 0 012 2v19H8V10a2 2 0 012-2z"/><rect class="iscr" x="11" y="11" width="26" height="15" rx="1"/><path class="ib" d="M3 31h42l-3 7a2 2 0 01-2 1.4H8A2 2 0 016 38z"/><path class="is" d="M20 35h8"/>`,
 srv:[0,1,2].map(i=>`<rect class="ib" x="7" y="${4+i*13}" width="34" height="11" rx="2"/><circle class="ig" cx="12.5" cy="${9.5+i*13}" r="1.7"/><circle class="io" cx="18" cy="${9.5+i*13}" r="1.5"/><path class="is" d="M25 ${7.5+i*13}h12M25 ${11.5+i*13}h12"/>`).join('')+`<path class="is" d="M24 41v3M14 44h20"/>`,
 ph:`<rect class="ib" x="14" y="3" width="20" height="42" rx="4"/><rect class="iscr" x="16.5" y="8" width="15" height="29" rx="1"/><circle class="if" cx="24" cy="41" r="1.6"/><path class="is" d="M21.5 5.4h5"/><path class="ia" d="M19.5 18a6.5 6.5 0 019 0M17.5 15a9.5 9.5 0 0113 0M24 23v.1"/>`,
 tab:`<rect class="ib" x="7" y="5" width="34" height="38" rx="4"/><rect class="iscr" x="10.5" y="9" width="27" height="29" rx="1"/><circle class="if" cx="24" cy="41" r="1.3"/><path class="ia" d="M17 24a10 10 0 0114 0M20 28a5.5 5.5 0 018 0M24 32v.1"/>`,
 ipp:`<path class="ib" d="M5 15c0-5 5-8 10-8h18c5 0 10 3 10 8v3c0 1-1 2-2 2h-6c-1 0-2-1-2-2v-1H15v1c0 1-1 2-2 2H7c-1 0-2-1-2-2z"/><path class="ib" d="M9 22h30l4 19a2 2 0 01-2 2H7a2 2 0 01-2-2z"/><rect class="iscr" x="15" y="25" width="18" height="6" rx="1"/>${[0,1,2].map(r=>[0,1,2].map(c=>`<circle class="if" cx="${18+c*6}" cy="${35+r*3}" r="1"/>`).join('')).join('')}`,
 prn:`<path class="ib" d="M14 4h17l5 5v8H14z"/><path class="is" d="M31 4v5h5"/><rect class="ib" x="5" y="16" width="38" height="17" rx="3"/><circle class="ig" cx="37" cy="21" r="1.6"/><rect class="ib" x="12" y="28" width="24" height="14" rx="1"/><path class="is" d="M16 33h16M16 37h12"/>`,
 hub:`<rect class="ib" x="3" y="15" width="42" height="18" rx="3"/>${[0,1,2,3,4,5].map(i=>`<rect class="ip" x="${6.5+i*6.2}" y="23" width="4.4" height="5.5" rx=".8"/><circle class="ig" cx="${8.7+i*6.2}" cy="19" r="1.2"/>`).join('')}<path class="is" d="M8 40h32M24 33v7"/><path class="is" d="M8 40l-3 4M40 40l3 4M24 40v4"/>`,
 sw:`<rect class="ib" x="3" y="14" width="42" height="20" rx="3"/>${[0,1,2,3,4,5,6,7].map(i=>`<rect class="ip" x="${5.8+i*4.8}" y="22.5" width="3.8" height="5.6" rx=".7"/><circle class="ig" cx="${7.7+i*4.8}" cy="18.5" r="1"/>`).join('')}<path class="ia" d="M11 40h26M34 37l3 3-3 3M14 37l-3 3 3 3"/>`,
 msw:`<rect class="ib" x="3" y="12" width="42" height="22" rx="3"/><rect class="iscr" x="6" y="15" width="11" height="6" rx="1"/><path class="is" d="M19 18h6"/><circle class="io" cx="40" cy="18" r="1.6"/>${[0,1,2,3,4,5,6,7].map(i=>`<rect class="ip" x="${5.8+i*4.8}" y="24.5" width="3.8" height="5.6" rx=".7"/>`).join('')}<path class="ia" d="M11 40h26M34 37l3 3-3 3M14 37l-3 3 3 3"/><circle class="ig" cx="30" cy="18" r="1.1"/><circle class="ig" cx="34" cy="18" r="1.1"/>`,
 ap:`<path class="ia" d="M14 15a14 14 0 0120 0M9.5 10a20.500 20.500 0 0129 0M18.500 20a8 8 0 0111 0"/><path class="ib" d="M8 36c0-6 7-10 16-10s16 4 16 10z"/><ellipse class="ib" cx="24" cy="36" rx="16" ry="4.2"/><circle class="ig" cx="24" cy="31" r="1.6"/>`,
 rt:`<rect class="ib" x="3" y="26" width="42" height="14" rx="3"/><circle class="ig" cx="9" cy="33" r="1.4"/><circle class="io" cx="14" cy="33" r="1.4"/>${[0,1,2,3].map(i=>`<rect class="ip" x="${26+i*4.6}" y="30.5" width="3.6" height="5.6" rx=".7"/>`).join('')}<circle class="ib" cx="24" cy="15" r="11.500"/><path class="ia" d="M24 7v16M16 15h16M21 10l3-3 3 3M21 20l3 3 3-3M19 12l-3 3 3 3M29 12l3 3-3 3"/>`,
 l3:`<rect class="ib" x="3" y="22" width="42" height="18" rx="3"/>${[0,1,2,3,4,5,6,7].map(i=>`<rect class="ip" x="${5.8+i*4.8}" y="30" width="3.8" height="5.6" rx=".7"/><circle class="ig" cx="${7.7+i*4.8}" cy="26" r="1"/>`).join('')}<circle class="ib" cx="24" cy="11" r="8.500"/><path class="ia" d="M24 5v12M18 11h12M22 7.500l2-2 2 2M22 14.500l2 2 2-2M20.500 9l-2 2 2 2M27.500 9l2 2-2 2"/><path class="is" d="M24 40v4"/>`,
 wr:`<path class="is" d="M10 24L6 8M38 24l4-16"/><circle class="iaf" cx="6" cy="7" r="1.8"/><circle class="iaf" cx="42" cy="7" r="1.8"/><rect class="ib" x="3" y="24" width="42" height="15" rx="3"/><circle class="ig" cx="10" cy="31.500" r="1.4"/><circle class="io" cx="15" cy="31.500" r="1.4"/>${[0,1,2,3].map(i=>`<rect class="ip" x="${26+i*4.6}" y="29" width="3.6" height="5.6" rx=".7"/>`).join('')}<path class="ia" d="M18 16a9.500 9.500 0 0112 0M20.500 19.500a5.500 5.500 0 017 0M24 22.500v.1"/>`,
 fw:`<rect class="ib" x="4" y="6" width="40" height="36" rx="2"/>${[0,1,2,3].map(r=>{const y=8+r*8.5,o=r%2?0:6;return`<path class="is" d="M4 ${y+8.500}h40"/>`+[0,1,2].map(c=>{const x=4+c*13.300+(r%2?6.6:0);return x>4&&x<44?`<path class="is" d="M${x} ${y}v8.500"/>`:''}).join('')}).join('')}<path class="io" d="M24 14c4 4 9 6 9 12a9 9 0 01-18 0c0-4 2-5 3-8 1 2 2 2 3 2 0-3 1-4 3-6z"/><path d="M24 31a3.500 3.500 0 01-3.500-3.500c0-2 2-3 3-5 1 2 4 3 4 5A3.500 3.500 0 0124 31z" fill="#ffe08a" stroke="none"/>`,
 ids:`<path class="ib" d="M24 3l17 6v13c0 11-7 19-17 23C14 41 7 33 7 22V9z"/><path class="ia" d="M12 24c3-5.500 7-8 12-8s9 2.500 12 8c-3 5.500-7 8-12 8s-9-2.500-12-8z"/><circle class="iaf" cx="24" cy="24" r="4.200"/><circle fill="var(--ic1)" cx="25.300" cy="22.700" r="1.300"/>`,
 atk:`<path class="ib" d="M24 4c-9 0-15 7-15 16v6l-4 12h38l-4-12v-6C39 11 33 4 24 4z"/><path d="M13 22c0-6 4-10 11-10s11 4 11 10v5c0 5-5 8-11 8s-11-3-11-8z" fill="#0d151c" stroke="var(--ic2)" stroke-width="1.4"/><path d="M16.500 22.500l5 2.200-5 1.300zM31.500 22.500l-5 2.200 5 1.300z" fill="#ef4444"/><path class="is" d="M20 31h8" style="stroke:#8a9aa8"/>`
};
IC.sw2=IC.sw;
const icoK=k=>IC[k]||IC[({pc:'pc',sw:'sw',rt:'rt'})[k]]||IC.pc;
const icoSvg=(k,sz=22)=>`<svg class="ico" width="${sz}" height="${sz}" viewBox="0 0 48 48" aria-hidden="true">${icoK(k)}</svg>`;
const ICON_SUN=`<svg class="ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.200"/><path d="M12 2.500v2.500M12 19v2.500M2.500 12H5M19 12h2.500M5.300 5.300l1.800 1.800M16.900 16.900l1.800 1.800M5.300 18.700l1.800-1.800M16.900 7.100l1.800-1.800"/></svg>`;
const ICON_MOON=`<svg class="ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.500A8.500 8.500 0 019.500 4 8.500 8.500 0 1020 14.500z"/></svg>`;
const ICON_PLUS=`<svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.200" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>`;
const ICON_DOWN=`<svg class="ico" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 9l7 7 7-7"/></svg>`;

// --- иконки на схеме ---
const _draw11=draw;
draw=function(){_draw11();
 cv.querySelectorAll('g[data-id]').forEach(g=>{const d=dv(g.dataset.id),t=g.querySelector('text');if(!d||!t||g.querySelector('svg.ico'))return;
  const s=document.createElementNS('http://www.w3.org/2000/svg','svg');s.setAttribute('class','ico');s.setAttribute('x',d.x-21);s.setAttribute('y',d.y-21);s.setAttribute('width',42);s.setAttribute('height',42);s.setAttribute('viewBox','0 0 48 48');s.setAttribute('pointer-events','none');
  s.innerHTML=icoK(d.ico||kind(d));t.replaceWith(s)})};
const _side11=side;
side=function(){_side11();const d=sel&&dv(sel),h=$('#side h3');if(d&&h&&!h.querySelector('.ico'))h.insertAdjacentHTML('afterbegin',icoSvg(d.ico||kind(d),26))};

// --- выпадающий выбор устройства с иконками ---
CAT.ids.g='Безопасность';
(function(){
 const hid=$('#ad');let h='',first=1;
 for(const k in CAT){const c=CAT[k];if(c.g)h+=`<h5>${c.g}</h5>`;h+=`<button type="button" data-k="${k}">${icoSvg(k,30)}<span>${c.l}</span></button>`}
 hid.insertAdjacentHTML('afterend',`<button id="adb" type="button" aria-haspopup="true" aria-expanded="false">${ICON_PLUS}<span>Добавить устройство</span>${ICON_DOWN}</button>`);
 document.body.insertAdjacentHTML('beforeend',`<div id="adp" hidden role="menu">${h}</div>`);
 const b=$('#adb'),pp=$('#adp');
 const close=()=>{pp.hidden=true;b.setAttribute('aria-expanded','false')};
 b.addEventListener('click',e=>{e.stopPropagation();if(!pp.hidden)return close();const r=b.getBoundingClientRect();pp.style.left=Math.max(8,Math.min(r.left,innerWidth-310))+'px';pp.style.top=(r.bottom+4)+'px';pp.style.maxHeight=Math.max(200,innerHeight-r.bottom-16)+'px';
  pp.querySelectorAll('button').forEach(x=>x.classList.toggle('on',tool==='add:'+x.dataset.k));pp.hidden=false;b.setAttribute('aria-expanded','true')});
 pp.addEventListener('click',e=>{const t=e.target.closest('button[data-k]');if(!t)return;hid.value=t.dataset.k;hid.dispatchEvent(new Event('change'));
  const c=CAT[t.dataset.k];b.innerHTML=`${icoSvg(t.dataset.k,18)}<span>${c.l.replace(/ \(.*$/,'')}</span>${ICON_DOWN}`;b.classList.add('on');close()});
 document.addEventListener('click',e=>{if(!pp.hidden&&!pp.contains(e.target))close()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!pp.hidden){close();b.focus()}});
 document.querySelectorAll('header [data-t]').forEach(x=>x.addEventListener('click',()=>{b.classList.remove('on');b.innerHTML=`${ICON_PLUS}<span>Добавить устройство</span>${ICON_DOWN}`}));
})();

// --- тема ---
(function(){
 const KEY='netlab_theme',root=document.documentElement,mq=window.matchMedia?matchMedia('(prefers-color-scheme: dark)'):{matches:false};
 let cur;try{cur=localStorage.getItem(KEY)}catch(_){}
 const eff=()=>cur==='dark'||cur==='light'?cur:(mq.matches?'dark':'light');
 const btn=document.createElement('button');btn.id='bth';btn.type='button';
 const apply=()=>{const t=eff();root.dataset.theme=t;btn.innerHTML=t==='dark'?ICON_SUN:ICON_MOON;btn.title=t==='dark'?'Включить светлую тему':'Включить тёмную тему';btn.setAttribute('aria-label',btn.title);if(typeof draw==='function'&&S&&S.devs)draw()};
 btn.onclick=()=>{cur=eff()==='dark'?'light':'dark';try{localStorage.setItem(KEY,cur)}catch(_){}apply()};
 document.querySelector('header .sp').after(btn);apply();
 if(mq.addEventListener)mq.addEventListener('change',()=>{if(cur!=='dark'&&cur!=='light')apply()});
})();
draw();side();


// ================= v11: углублённая теория =================
const TH=[];
TH.push(['Т1. Инкапсуляция и форматы PDU: кадр, пакет, сегмент',`
<p>Данные идут вниз по стеку, и каждый уровень <b>добавляет свой заголовок</b> (инкапсуляция). Принимающая сторона снимает заголовки в обратном порядке. Единица данных на каждом уровне называется PDU.</p>
<table class="t"><tr><th>Уровень</th><th>PDU</th><th>Адресация</th><th>Заголовок / что внутри</th></tr>
<tr><td>Прикладной</td><td>данные</td><td>—</td><td>HTTP-запрос, DNS-вопрос, DHCP-сообщение</td></tr>
<tr><td>Транспортный (L4)</td><td>сегмент TCP / датаграмма UDP</td><td>порты (16 бит)</td><td>TCP 20–60 байт, UDP 8 байт</td></tr>
<tr><td>Сетевой (L3)</td><td>пакет</td><td>IP-адрес</td><td>IPv4 20–60 байт, IPv6 40 байт</td></tr>
<tr><td>Канальный (L2)</td><td>кадр</td><td>MAC-адрес (48 бит)</td><td>Ethernet: 14 байт заголовка + 4 байта FCS</td></tr>
<tr><td>Физический (L1)</td><td>биты / сигнал</td><td>—</td><td>преамбула 7 байт + SFD 1 байт, межкадровый интервал 12 байт</td></tr></table>
<h4>Кадр Ethernet II</h4>
<table class="t"><tr><th>Поле</th><th>Размер</th><th>Назначение</th></tr>
<tr><td>MAC получателя</td><td>6 байт</td><td>unicast, multicast или broadcast <code>FF:FF:FF:FF:FF:FF</code></td></tr>
<tr><td>MAC отправителя</td><td>6 байт</td><td>всегда unicast</td></tr>
<tr><td>(тег 802.1Q)</td><td>4 байта</td><td>необязательно: TPID <code>0x8100</code> + приоритет 3 бита + DEI 1 бит + VLAN ID 12 бит</td></tr>
<tr><td>EtherType</td><td>2 байта</td><td><code>0x0800</code> IPv4, <code>0x0806</code> ARP, <code>0x86DD</code> IPv6</td></tr>
<tr><td>Данные</td><td>46–1500 байт</td><td>меньше 46 — дополняется нулями (padding)</td></tr>
<tr><td>FCS</td><td>4 байта</td><td>CRC-32; при несовпадении кадр молча отбрасывается</td></tr></table>
<p>Размер кадра 64–1518 байт (1522 с тегом VLAN). <b>MTU</b> — максимальный размер данных кадра, 1500 байт. Кадр больше MTU не пройдёт: пакет IP либо фрагментируется, либо (при флаге DF) отбрасывается с сообщением ICMP «Fragmentation needed».</p>
<h4>Заголовок IPv4 (20 байт без опций)</h4>
<table class="t"><tr><th>Поле</th><th>Бит</th><th>Смысл</th></tr>
<tr><td>Version / IHL</td><td>4 + 4</td><td>версия = 4; длина заголовка в 4-байтовых словах (5 = 20 байт)</td></tr>
<tr><td>DSCP / ECN</td><td>6 + 2</td><td>класс обслуживания для QoS</td></tr>
<tr><td>Total Length</td><td>16</td><td>длина пакета вместе с заголовком, до 65 535</td></tr>
<tr><td>Identification, Flags, Fragment Offset</td><td>16 + 3 + 13</td><td>сборка фрагментов; флаг DF — «не фрагментировать»</td></tr>
<tr><td><b>TTL</b></td><td>8</td><td>каждый маршрутизатор уменьшает на 1; при 0 пакет отбрасывается и отправителю уходит ICMP Time Exceeded. Защита от петель; на этом работает <code>tracert</code></td></tr>
<tr><td>Protocol</td><td>8</td><td>что внутри: 1 ICMP, 6 TCP, 17 UDP, 47 GRE, 50 ESP, 89 OSPF</td></tr>
<tr><td>Header Checksum</td><td>16</td><td>пересчитывается на каждом маршрутизаторе (из-за изменения TTL)</td></tr>
<tr><td>Source / Destination</td><td>32 + 32</td><td>адреса отправителя и получателя</td></tr></table>
<h4>Заголовок TCP (20 байт) и UDP (8 байт)</h4>
<p>TCP: порт источника (16), порт назначения (16), номер последовательности (32), номер подтверждения (32), длина заголовка (4), флаги <code>URG ACK PSH RST SYN FIN</code>, окно (16), контрольная сумма (16), указатель срочности (16). UDP: порт источника, порт назначения, длина, контрольная сумма — и всё.</p>
<div class="tip"><b>Пример расчёта.</b> Полезные данные TCP в одном кадре ограничены <b>MSS = MTU − IP − TCP = 1500 − 20 − 20 = 1460 байт</b>. Передача файла 1 МБ потребует ⌈1 048 576 / 1460⌉ = 719 сегментов. Накладные расходы на кадр: 14 + 20 + 20 + 4 = 58 байт плюс 20 байт преамбулы и межкадрового интервала.</div>
<p><b>В симуляторе:</b> кнопка «Анализатор» в «Инструментах» показывает путь пакета и какие поля меняются на каждом устройстве: MAC-адреса переписываются на каждом маршрутизаторе, IP-адреса остаются прежними (кроме NAT), TTL уменьшается.</p>`]);
TH.push(['Т2. Ethernet, MAC-адреса, коммутатор и ARP: как работает L2',`
<h4>MAC-адрес</h4>
<p>48 бит, записывается как шесть байт в hex: <code>00:1A:2B:3C:4D:5E</code>. Первые 3 байта — <b>OUI</b> производителя (организационно уникальный идентификатор), последние 3 — номер устройства. Младший бит первого байта — признак групповой адресации (I/G): 0 — unicast, 1 — multicast/broadcast. Следующий бит (U/L): 0 — глобально уникальный, 1 — назначен локально.</p>
<h4>Как коммутатор строит таблицу MAC-адресов</h4>
<ol><li><b>Learning (обучение):</b> пришёл кадр с MAC-источником A на порт 3 — запись «A → порт 3, VLAN» (время жизни по умолчанию 300 с).</li>
<li><b>Flooding:</b> адрес назначения неизвестен или broadcast — кадр отправляется во все порты этого VLAN, кроме входного.</li>
<li><b>Forwarding:</b> адрес известен — кадр идёт только в нужный порт.</li>
<li><b>Filtering:</b> получатель за тем же портом, откуда пришёл кадр, — кадр отбрасывается (так работает сегмент через хаб).</li></ol>
<p>Хаб (L1) повторяет биты на все порты: один домен коллизий и один широковещательный. Коммутатор: каждый порт — отдельный <b>домен коллизий</b>, широковещательный домен общий (в пределах VLAN). Маршрутизатор разделяет и те, и другие.</p>
<h4>Дуплекс и скорость</h4>
<p><b>Half-duplex</b> (хаб): передача и приём по очереди, метод доступа CSMA/CD — слушай среду, передавай, при коллизии подожди случайное время (экспоненциальная отсрочка). <b>Full-duplex</b> (коммутатор): передача и приём одновременно по разным парам, коллизий нет. Несовпадение дуплекса на концах (duplex mismatch) даёт «поздние коллизии» и потерю кадров — классическая причина «сеть работает, но тормозит». Автосогласование (autonegotiation) выбирает общую максимальную скорость и дуплекс.</p>
<h4>ARP: как по IP найти MAC</h4>
<p>Хост знает IP получателя, но кадру нужен MAC. Он рассылает <b>ARP-запрос</b> (broadcast, EtherType 0x0806, opcode 1): «Кто имеет 192.168.1.1? Сообщите 192.168.1.10». Владелец отвечает unicast (opcode 2) своим MAC. Результат хранится в ARP-таблице (обычно минуты). Если получатель в другой подсети, ARP-запрос делается <b>для шлюза</b>, а не для конечного узла.</p>
<ul><li><b>Gratuitous ARP:</b> узел объявляет собственную пару IP–MAC (при смене адреса, при переключении резервного шлюза, проверка дубликата IP).</li>
<li><b>Proxy ARP:</b> маршрутизатор отвечает на ARP за узлы другой сети — устаревший приём.</li>
<li><b>Уязвимость:</b> ARP не аутентифицирован. Узел злоумышленника может ответить «шлюз — это я» (ARP-spoofing) и стать посредником. Защита — DAI (Dynamic ARP Inspection) вместе с DHCP snooping.</li></ul>
<p><b>В симуляторе:</b> <code>show mac</code> на управляемом коммутаторе — таблица MAC; <code>arp</code> на узле — ARP-таблица; ошибка «ARP-запрос остался без ответа» значит: адреса в одной подсети, но по L2 до получателя дойти нельзя (кабель, VLAN, порт выключен, STP заблокировал порт).</p>`]);
TH.push(['Т3. Расчёт подсетей: CIDR, VLSM, суммирование',`
<h4>Основные формулы</h4>
<ul><li>Маска /n: первые n бит — сеть, остальные 32 − n — хосты.</li>
<li>Адресов в подсети: <code>2^(32−n)</code>; узлов: <code>2^(32−n) − 2</code> (минус адрес сети и broadcast). Исключения: /31 (2 узла, RFC 3021, для point-to-point) и /32 (один узел, loopback).</li>
<li>Размер «блока» в интересном октете: <code>256 − значение маски в этом октете</code>.</li></ul>
<table class="t"><tr><th>Префикс</th><th>Маска</th><th>Адресов</th><th>Узлов</th><th>Блок</th></tr>
<tr><td>/24</td><td>255.255.255.0</td><td>256</td><td>254</td><td>1 сеть</td></tr>
<tr><td>/25</td><td>255.255.255.128</td><td>128</td><td>126</td><td>128</td></tr>
<tr><td>/26</td><td>255.255.255.192</td><td>64</td><td>62</td><td>64</td></tr>
<tr><td>/27</td><td>255.255.255.224</td><td>32</td><td>30</td><td>32</td></tr>
<tr><td>/28</td><td>255.255.255.240</td><td>16</td><td>14</td><td>16</td></tr>
<tr><td>/29</td><td>255.255.255.248</td><td>8</td><td>6</td><td>8</td></tr>
<tr><td>/30</td><td>255.255.255.252</td><td>4</td><td>2</td><td>4</td></tr>
<tr><td>/22</td><td>255.255.252.0</td><td>1024</td><td>1022</td><td>4 в третьем октете</td></tr>
<tr><td>/16</td><td>255.255.0.0</td><td>65 536</td><td>65 534</td><td>—</td></tr>
<tr><td>/8</td><td>255.0.0.0</td><td>16 777 216</td><td>16 777 214</td><td>—</td></tr></table>
<h4>Пошаговый пример: 192.168.10.77/26</h4>
<ol><li>Маска /26 = 255.255.255.192, блок = 256 − 192 = 64. Границы блоков в последнем октете: 0, 64, 128, 192.</li>
<li>77 лежит между 64 и 127 → адрес сети <b>192.168.10.64</b>.</li>
<li>Broadcast = следующая граница − 1 → <b>192.168.10.127</b>.</li>
<li>Диапазон узлов: <b>.65 – .126</b> (62 узла). Шлюз обычно берут первым или последним адресом.</li></ol>
<h4>VLSM: делим 192.168.1.0/24 под разные нужды</h4>
<p>Нужно: офис — 100 узлов, склад — 50, серверы — 25, управление — 10. <b>Правило: сначала самые большие сети, выравнивание по границе блока.</b></p>
<table class="t"><tr><th>Сеть</th><th>Нужно</th><th>Префикс (узлов)</th><th>Адрес сети</th><th>Диапазон узлов</th><th>Broadcast</th></tr>
<tr><td>Офис</td><td>100</td><td>/25 (126)</td><td>192.168.1.0</td><td>.1 – .126</td><td>.127</td></tr>
<tr><td>Склад</td><td>50</td><td>/26 (62)</td><td>192.168.1.128</td><td>.129 – .190</td><td>.191</td></tr>
<tr><td>Серверы</td><td>25</td><td>/27 (30)</td><td>192.168.1.192</td><td>.193 – .222</td><td>.223</td></tr>
<tr><td>Управление</td><td>10</td><td>/28 (14)</td><td>192.168.1.224</td><td>.225 – .238</td><td>.239</td></tr></table>
<p>Свободно остаётся 192.168.1.240/28 — резерв. Каналы между маршрутизаторами берут /30 (2 узла) или /31.</p>
<h4>Суммирование маршрутов (агрегация)</h4>
<p>Смежные сети, выровненные по границе, объединяются в одну запись. 10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24: общие первые 22 бита → <b>10.0.0.0/22</b>. Проверка: размер блока 4 в третьем октете, начало 0 делится на 4. Агрегация уменьшает таблицы маршрутизации и скрывает от соседей нестабильность внутренних сетей.</p>
<h4>Особые диапазоны</h4>
<table class="t"><tr><th>Диапазон</th><th>Назначение</th></tr>
<tr><td>10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16</td><td>частные адреса (RFC 1918), в Интернете не маршрутизируются — нужен NAT</td></tr>
<tr><td>127.0.0.0/8</td><td>loopback (себя), 127.0.0.1</td></tr>
<tr><td>169.254.0.0/16</td><td>APIPA/link-local: ОС сама назначила адрес, потому что DHCP не ответил — признак проблемы с DHCP</td></tr>
<tr><td>100.64.0.0/10</td><td>общее адресное пространство операторов (CGNAT)</td></tr>
<tr><td>224.0.0.0/4</td><td>multicast (OSPF — 224.0.0.5/6, RIPv2 — 224.0.0.9)</td></tr>
<tr><td>192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24</td><td>документационные адреса (в примерах)</td></tr></table>
<p><b>Типичные ошибки:</b> шлюз вне подсети хоста; разные маски на двух концах канала; пересекающиеся подсети на двух интерфейсах маршрутизатора; адрес сети или broadcast, назначенный хосту.</p>`]);
TH.push(['Т4. Таблица маршрутизации, выбор маршрута, DV и Link-State',`
<h4>Как маршрутизатор выбирает маршрут</h4>
<ol><li>Из всех записей отбираются те, чей префикс <b>содержит</b> адрес назначения.</li>
<li>Побеждает запись с <b>самым длинным префиксом</b> (longest prefix match).</li>
<li>Если префиксы равны, выигрывает источник с меньшей <b>административной дистанцией</b> (AD, доверие к источнику).</li>
<li>Если и AD равны — меньшая <b>метрика</b>; при равенстве возможна балансировка нагрузки.</li>
<li>Маршрута нет — пакет отбрасывается, отправителю уходит ICMP «Destination Unreachable» (net unreachable).</li></ol>
<table class="t"><tr><th>Запись</th><th>Маршрут</th></tr>
<tr><td>10.0.0.0/8</td><td>через A</td></tr><tr><td>10.1.0.0/16</td><td>через B</td></tr><tr><td>10.1.2.0/24</td><td>через C</td></tr><tr><td>0.0.0.0/0</td><td>через D (по умолчанию)</td></tr></table>
<p>Пакет для 10.1.2.55 → C (/24 длиннее); 10.1.9.9 → B; 10.200.1.1 → A; 8.8.8.8 → D.</p>
<table class="t"><tr><th>Источник</th><th>AD</th></tr><tr><td>Подключённая сеть (connected)</td><td>0</td></tr><tr><td>Статический маршрут</td><td>1</td></tr><tr><td>EIGRP</td><td>90</td></tr><tr><td>OSPF</td><td>110</td></tr><tr><td>RIP</td><td>120</td></tr></table>
<h4>Статика или динамика</h4>
<ul><li><b>Статические:</b> простые, предсказуемые, без нагрузки на каналы. Минус — не реагируют на отказы и не масштабируются. Идеальны для «тупиковых» филиалов и маршрута по умолчанию.</li>
<li><b>Динамические:</b> маршрутизаторы обмениваются информацией и сами перестраивают пути при отказах.</li></ul>
<h4>Distance Vector (RIP)</h4>
<p>Каждый маршрутизатор периодически (RIP — раз в 30 с) сообщает соседям <i>всю свою таблицу</i>: «до сети X — N переходов». Метрика RIP — число переходов (hop count), максимум 15, 16 = недостижимо. Знает только соседей, «слухи о слухах». Проблемы и защита:</p>
<ul><li><b>Счёт до бесконечности:</b> после отказа сети маршрутизаторы по кругу увеличивают метрику до 16.</li>
<li><b>Split horizon:</b> не объявлять маршрут обратно туда, откуда он изучен. <b>Poison reverse:</b> объявлять, но с метрикой 16. <b>Hold-down:</b> игнорировать новости о сети, недавно ставшей недоступной.</li>
<li>Медленная сходимость (минуты), RIPv1 без масок (classful), RIPv2 с масками и multicast 224.0.0.9.</li></ul>
<h4>Link State (OSPF)</h4>
<p>Каждый маршрутизатор рассказывает всем о <i>своих каналах</i> (LSA). Все получают одинаковую базу состояния каналов (LSDB) и независимо запускают алгоритм <b>Дейкстры (SPF)</b>, строя дерево кратчайших путей от себя. Быстрая сходимость, метрика — стоимость (cost), поддержка VLSM и областей. Цена — память, процессор, сложность настройки.</p>
<p><b>Стоимость OSPF</b> = эталонная пропускная способность / скорость интерфейса. При эталоне 100 Мбит/с: 10 Мбит/с → 10, 100 Мбит/с → 1; гигабитные каналы «сравниваются» с Fast Ethernet, поэтому эталон на практике увеличивают. Путь = сумма стоимостей исходящих интерфейсов.</p>
<div class="tip"><b>Диагностика:</b> смотрите на таблицу маршрутов — есть ли запись, правильный ли next hop. Помните, что <b>обратный путь</b> нужен так же, как прямой: ping не пройдёт, если на удалённом маршрутизаторе нет маршрута к вашей сети (асимметричная маршрутизация). Симулятор всегда проверяет оба направления и показывает, где оборвался ответ.</div>`]);
TH.push(['Т5. OSPF подробно: соседства, DR/BDR, области',`
<h4>Этапы установления соседства</h4>
<ol><li><b>Down</b> — Hello не получали.</li><li><b>Init</b> — получили Hello, но в нём нет нашего Router ID.</li><li><b>2-Way</b> — взаимно видим друг друга; на широковещательных сетях здесь выбираются DR/BDR; не-DR остаются соседями только в этом состоянии.</li>
<li><b>ExStart / Exchange</b> — выбор ведущего, обмен описаниями баз (DBD).</li><li><b>Loading</b> — запрос недостающих LSA (LSR/LSU).</li><li><b>Full</b> — базы синхронизированы, маршруты считаются.</li></ol>
<h4>Параметры, которые должны совпасть</h4>
<table class="t"><tr><th>Параметр</th><th>Если не совпал</th></tr>
<tr><td>Подсеть и маска на канале</td><td>Hello игнорируется</td></tr>
<tr><td>Номер области (Area ID)</td><td>соседство не образуется</td></tr>
<tr><td>Hello/Dead интервалы (10/40 с на LAN и point-to-point)</td><td>соседства нет</td></tr>
<tr><td>Аутентификация</td><td>соседства нет</td></tr>
<tr><td>MTU</td><td>зависание в ExStart</td></tr>
<tr><td>Router ID</td><td>должен быть уникальным</td></tr></table>
<h4>DR и BDR</h4>
<p>В сети с общей средой (коммутатор) полносвязное соседство дало бы n(n−1)/2 связей. Поэтому выбирается <b>DR</b> (Designated Router) и <b>BDR</b> (резервный): остальные маршрутизаторы обмениваются LSA только с ними (адрес 224.0.0.6), а DR рассылает всем (224.0.0.5). Выбор: наибольший приоритет интерфейса (по умолчанию 1; 0 — никогда не DR), при равенстве — наибольший Router ID. Выборы <b>не вытесняющие</b>: пришедший позже маршрутизатор с большим приоритетом DR не станет, пока DR работает.</p>
<h4>Области (Area)</h4>
<p>Сеть делится на области; все они связаны с <b>областью 0 (backbone)</b>. Внутри области — полная база, наружу — суммарные маршруты. Это ограничивает рассылку LSA при изменениях и уменьшает нагрузку. Маршрутизатор на границе областей — ABR; на границе с другим протоколом маршрутизации — ASBR. Основные типы LSA: 1 (Router — «мои каналы»), 2 (Network — от DR), 3 (суммарный маршрут между областями), 5 (внешний маршрут).</p>
<p><b>Практика в симуляторе:</b> включите <code>ospf on</code> на маршрутизаторах, задайте стоимость интерфейсов и сравните, как меняется выбор пути, если на одном канале поднять cost. Затем выключите канал и посмотрите, как маршрут уходит на запасной.</p>`]);
TH.push(['Т6. STP/RSTP: от выбора корня до защиты портов',`
<p>Избыточные связи между коммутаторами нужны для отказоустойчивости, но создают <b>петли L2</b>. У кадра Ethernet нет TTL, поэтому широковещательный кадр в петле размножается лавинообразно (<b>broadcast storm</b>), таблицы MAC «скачут» (MAC flapping), загрузка процессора доходит до 100 % за секунды. STP (IEEE 802.1D) логически «отключает» часть портов, оставляя дерево без петель.</p>
<h4>Алгоритм</h4>
<ol><li><b>Корневой мост (root bridge)</b> — коммутатор с наименьшим Bridge ID = приоритет (по умолчанию 32768, шаг 4096) + MAC-адрес. Если нужен определённый root — понижайте приоритет, а не надейтесь на MAC.</li>
<li>На каждом не-корневом коммутаторе выбирается один <b>корневой порт (root port)</b> — с наименьшей суммарной стоимостью пути до корня. Ничья: меньший Bridge ID соседа, затем меньший ID порта.</li>
<li>В каждом сегменте выбирается один <b>назначенный порт (designated)</b> — с лучшим путём до корня; остальные порты сегмента переходят в <b>blocking</b> (не пересылают данные, но слушают BPDU).</li></ol>
<table class="t"><tr><th>Скорость</th><th>Стоимость (802.1D-1998)</th></tr><tr><td>10 Мбит/с</td><td>100</td></tr><tr><td>100 Мбит/с</td><td>19</td></tr><tr><td>1 Гбит/с</td><td>4</td></tr><tr><td>10 Гбит/с</td><td>2</td></tr></table>
<div class="tip"><b>Пример.</b> Три коммутатора SW1, SW2, SW3 с MAC …01, …02, …03 и одинаковым приоритетом соединены в треугольник гигабитными линками. Root — SW1 (наименьший MAC). У SW2 и SW3 корневые порты — к SW1 (стоимость 4). В канале SW2–SW3 назначенный порт у SW2 (его Bridge ID меньше), порт SW3 в этом канале — <b>заблокирован</b>. Если порвать SW1–SW3, SW3 за время сходимости разблокирует порт к SW2 и достучится до корня через него (стоимость 8).</div>
<h4>Состояния порта и таймеры</h4>
<p>Blocking → Listening (15 с) → Learning (15 с) → Forwarding. Классический STP сходится за 30–50 с (Hello 2 с, Max Age 20 с, Forward Delay 15 с). Порт, настроенный на хост, не должен ждать — для этого есть <b>PortFast</b>.</p>
<h4>RSTP (802.1w) и защитные механизмы</h4>
<ul><li><b>RSTP:</b> состояния discarding / learning / forwarding, роли root, designated, alternate, backup; соглашение proposal/agreement между соседями вместо таймеров — сходимость за секунды.</li>
<li><b>PortFast / edge port:</b> порт сразу в forwarding; только для конечных устройств.</li>
<li><b>BPDU guard:</b> если на PortFast-порт пришёл BPDU (подключили чужой коммутатор) — порт переходит в err-disabled.</li>
<li><b>Root guard:</b> запрещает порту стать root-портом: чужой коммутатор не отберёт роль корня.</li>
<li><b>Loop guard</b> и <b>UDLD</b> защищают от односторонних обрывов.</li>
<li><b>Storm control:</b> ограничение процента broadcast/multicast на порту.</li></ul>
<p><b>Практика:</b> постройте треугольник из трёх управляемых коммутаторов, нажмите «STP», найдите заблокированный порт. Выключите «STP: вкл» — получите петлю и сообщения о шторме; включите storm control и посмотрите, как порт отключится.</p>`]);
TH.push(['Т7. VLAN, 802.1Q, trunk и межвлановая маршрутизация',`
<p><b>VLAN</b> — логическое разбиение одного коммутатора (или сети) на несколько изолированных широковещательных доменов. Зачем: безопасность (бухгалтерия не видит гостей), меньше широковещательного трафика, гибкость (отдел не привязан к этажу), упрощение политик.</p>
<h4>Порты</h4>
<ul><li><b>Access</b> — принадлежит одному VLAN, кадры уходят к узлу без тега.</li>
<li><b>Trunk</b> — несёт много VLAN между коммутаторами/маршрутизатором; кадры помечены тегом 802.1Q (4 байта: TPID 0x8100, приоритет 3 бита, DEI, <b>VLAN ID 12 бит = 1–4094</b>). Список разрешённых VLAN ограничивают (allowed list).</li>
<li><b>Native VLAN</b> — кадры этого VLAN идут по trunk без тега; на обоих концах должна совпадать, иначе утечки и ошибки.</li></ul>
<h4>Как кадр идёт между VLAN</h4>
<p>Коммутатор L2 не передаёт кадры из одного VLAN в другой — для этого нужен L3: у каждого VLAN свой IP-подсеть и свой шлюз. Варианты:</p>
<table class="t"><tr><th>Способ</th><th>Как работает</th><th>Плюсы и минусы</th></tr>
<tr><td><b>Router-on-a-stick</b></td><td>один trunk к маршрутизатору, на нём подынтерфейсы (<code>gi0/0.10</code> с тегом 10, <code>.20</code> с тегом 20)</td><td>дёшево; весь межвлановый трафик идёт через один канал — узкое место</td></tr>
<tr><td><b>L3-коммутатор с SVI</b></td><td>виртуальный интерфейс <code>interface vlan 10</code> с IP-адресом шлюза; маршрутизация аппаратная</td><td>быстро, стандарт корпоративных сетей</td></tr>
<tr><td>Отдельный порт на каждый VLAN</td><td>физический кабель на VLAN</td><td>не масштабируется</td></tr></table>
<h4>Типичные ошибки</h4>
<ul><li>VLAN не разрешён на trunk — узлы одного VLAN на разных коммутаторах не видят друг друга.</li>
<li>Порт узла в «чужом» VLAN — адрес из своей подсети, а ARP не отвечает.</li>
<li>Разные native VLAN на концах trunk.</li>
<li>Шлюз в одном VLAN, а узел в другом.</li></ul>
<h4>Атаки на VLAN</h4>
<p><b>Switch spoofing:</b> узел изображает trunk (протокол DTP) и получает доступ ко всем VLAN — отключайте DTP, порты узлов принудительно в access. <b>Double tagging:</b> кадр с двумя тегами использует совпадение native VLAN — не используйте VLAN 1 как native, назначайте неиспользуемый. Неиспользуемые порты — выключить и перенести в изолированный VLAN.</p>`]);
TH.push(['Т8. Транспортный уровень: TCP, UDP, порты',`
<h4>Порты и сокеты</h4>
<p>Порт — 16-битное число, идентифицирующее приложение на узле. Соединение однозначно задаётся пятёркой: <b>протокол, IP-источника, порт источника, IP-назначения, порт назначения</b>. Диапазоны: 0–1023 — системные (well-known), 1024–49151 — зарегистрированные, 49152–65535 — динамические (клиент выбирает случайный порт источника).</p>
<table class="t"><tr><th>Свойство</th><th>TCP</th><th>UDP</th></tr>
<tr><td>Соединение</td><td>устанавливается (3-way handshake)</td><td>нет</td></tr>
<tr><td>Доставка</td><td>гарантированная, по порядку, повторная передача</td><td>без гарантий</td></tr>
<tr><td>Контроль потока / перегрузки</td><td>есть (окно)</td><td>нет</td></tr>
<tr><td>Заголовок</td><td>20+ байт</td><td>8 байт</td></tr>
<tr><td>Применение</td><td>HTTP/S, SSH, SMTP, FTP, БД</td><td>DNS-запросы, DHCP, VoIP/видео, SNMP, NTP, syslog, VPN</td></tr></table>
<h4>Установка соединения (3-way handshake)</h4>
<ol><li>Клиент → сервер: <code>SYN</code>, seq = x.</li><li>Сервер → клиент: <code>SYN+ACK</code>, seq = y, ack = x + 1.</li><li>Клиент → сервер: <code>ACK</code>, seq = x + 1, ack = y + 1. Соединение <b>ESTABLISHED</b>.</li></ol>
<p>Закрытие: каждая сторона шлёт <code>FIN</code> и получает <code>ACK</code> (4 шага), либо резко — <code>RST</code>. Состояния сокета: LISTEN (сервер ждёт), SYN_SENT, SYN_RECEIVED, ESTABLISHED, FIN_WAIT, TIME_WAIT (ждёт 2×MSL, чтобы старые сегменты не попали в новое соединение), CLOSED.</p>
<h4>Надёжность и скорость</h4>
<ul><li>Каждый байт нумеруется; получатель подтверждает (ACK) принятое. Нет ACK за время RTO — повторная передача.</li>
<li><b>Окно (window)</b> — сколько байт можно отправить без подтверждения. Пропускная способность ≤ окно / RTT. Окно 64 КБ при RTT 50 мс даёт 65 535 × 8 / 0,05 ≈ <b>10,5 Мбит/с</b>, как бы быстр канал ни был (поэтому используют масштабирование окна).</li>
<li><b>Контроль перегрузки:</b> медленный старт (окно растёт вдвое за RTT), затем линейный рост; при потере окно уменьшается; быстрая повторная передача после трёх одинаковых ACK.</li></ul>
<h4>Как порт «выглядит» при сканировании</h4>
<table class="t"><tr><th>Ответ на SYN</th><th>Состояние</th><th>Почему</th></tr>
<tr><td>SYN+ACK</td><td><b>открыт</b></td><td>на порту слушает служба</td></tr>
<tr><td>RST</td><td><b>закрыт</b></td><td>узел доступен, службы нет</td></tr>
<tr><td>тишина (тайм-аут)</td><td><b>фильтруется</b></td><td>межсетевой экран или ACL молча отбросил пакет</td></tr>
<tr><td>ICMP «administratively prohibited»</td><td>фильтруется явно</td><td>отбросил фильтр с уведомлением</td></tr></table>
<p><b>В симуляторе</b> те же три исхода: команды <code>connect</code>, <code>curl</code>, <code>scan</code>. «Закрыт» означает: проблема в службе (не запущена: <code>service add http</code>). «Фильтруется» — ищите ACL, зону межсетевого экрана или локальный <code>block</code>.</p>`]);
TH.push(['Т9. Службы: DNS, DHCP, HTTP, SNMP, syslog и др.',`
<h4>DNS</h4>
<p>Иерархическая распределённая база имён: корень «.» → TLD (<code>ru</code>, <code>com</code>) → домен → поддомены. Клиент спрашивает локальный (рекурсивный) резолвер, тот при необходимости обходит иерархию итеративно и кэширует ответ на время <b>TTL</b>. Транспорт — UDP/53, TCP/53 для больших ответов и передачи зон.</p>
<table class="t"><tr><th>Запись</th><th>Назначение</th></tr><tr><td>A / AAAA</td><td>имя → IPv4 / IPv6</td></tr><tr><td>CNAME</td><td>псевдоним на другое имя</td></tr><tr><td>MX</td><td>почтовый сервер домена (с приоритетом)</td></tr><tr><td>NS</td><td>серверы имён зоны</td></tr><tr><td>PTR</td><td>обратное: IP → имя</td></tr><tr><td>TXT</td><td>текст: SPF, DKIM, подтверждение домена</td></tr><tr><td>SOA</td><td>параметры зоны, серийный номер</td></tr></table>
<h4>DHCP (UDP 67 сервер / 68 клиент)</h4>
<ol><li><b>Discover</b> — клиент, не имея адреса, рассылает broadcast (0.0.0.0 → 255.255.255.255).</li><li><b>Offer</b> — сервер предлагает адрес и параметры.</li><li><b>Request</b> — клиент выбирает предложение (broadcast, чтобы известить остальные серверы).</li><li><b>Ack</b> — сервер подтверждает аренду.</li></ol>
<p>Продление: через 50 % срока аренды (T1) клиент обращается к своему серверу, через 87,5 % (T2) — к любому. Выдаются опции: маска (1), шлюз (3), DNS (6), домен (15), срок аренды (51). Broadcast не проходит через маршрутизатор, поэтому в другой подсети нужен <b>DHCP relay</b> (<code>ip helper-address</code>): маршрутизатор пересылает запрос сервером unicast и записывает свой адрес в поле giaddr, по которому сервер выбирает пул. Угрозы: подмена сервера (rogue DHCP) и истощение пула (starvation) — защита DHCP snooping и port security.</p>
<h4>Остальные службы</h4>
<table class="t"><tr><th>Служба</th><th>Протокол/порт</th><th>Суть</th></tr>
<tr><td>HTTP / HTTPS</td><td>TCP 80 / 443</td><td>запрос–ответ; коды: 2xx успех, 301/302 перенаправление, 401/403 доступ, 404 не найдено, 5xx ошибка сервера; HTTPS = HTTP поверх TLS</td></tr>
<tr><td>SSH / Telnet</td><td>TCP 22 / 23</td><td>удалённая консоль; Telnet передаёт пароль открытым текстом — использовать SSH</td></tr>
<tr><td>SMTP / IMAP / POP3</td><td>TCP 25 (587) / 143 (993) / 110 (995)</td><td>отправка / чтение почты на сервере / скачивание</td></tr>
<tr><td>FTP / TFTP</td><td>TCP 20,21 / UDP 69</td><td>передача файлов; TFTP без аутентификации (прошивки, конфигурации)</td></tr>
<tr><td>NTP</td><td>UDP 123</td><td>синхронизация времени (важна для логов и сертификатов)</td></tr>
<tr><td>SNMP</td><td>UDP 161 / 162 (trap)</td><td>мониторинг: GET читает значение по OID из MIB, SET меняет, TRAP — сообщение от устройства. v1/v2c — пароль-«community» открытым текстом, v3 — аутентификация и шифрование</td></tr>
<tr><td>Syslog</td><td>UDP 514</td><td>журналы; важность 0 Emergency … 3 Error, 4 Warning, 5 Notice, 6 Info, 7 Debug</td></tr>
<tr><td>RADIUS</td><td>UDP 1812 / 1813</td><td>AAA: аутентификация, авторизация, учёт (802.1X, Wi-Fi Enterprise, VPN)</td></tr>
<tr><td>RDP / SMB</td><td>TCP 3389 / 445</td><td>удалённый рабочий стол / файловый доступ Windows</td></tr></table>`]);
TH.push(['Т10. NAT и PAT: трансляция адресов',`
<p>NAT подменяет адреса в заголовке IP при прохождении пакета через маршрутизатор. Главная причина — нехватка публичных IPv4-адресов: вся частная сеть выходит в Интернет через один внешний адрес.</p>
<table class="t"><tr><th>Вид</th><th>Как работает</th></tr>
<tr><td><b>Static NAT</b></td><td>постоянное соответствие 1:1 (внутренний ↔ внешний). Публикация сервера</td></tr>
<tr><td><b>Dynamic NAT</b></td><td>из пула публичных адресов выдаётся свободный; когда пул кончился — новые соединения невозможны</td></tr>
<tr><td><b>PAT (overload, NAPT)</b></td><td>много внутренних адресов → один внешний, различаются <b>номером порта</b></td></tr></table>
<h4>Терминология Cisco</h4>
<p><b>Inside local</b> — адрес узла в локальной сети (192.168.1.10); <b>inside global</b> — его вид снаружи (203.0.113.5); <b>outside global</b> — адрес внешнего узла (198.51.100.20).</p>
<h4>Таблица трансляции PAT</h4>
<table class="t"><tr><th>Протокол</th><th>Inside local</th><th>Inside global</th><th>Outside global</th></tr>
<tr><td>TCP</td><td>192.168.1.10:51200</td><td>203.0.113.5:51200</td><td>198.51.100.20:80</td></tr>
<tr><td>TCP</td><td>192.168.1.11:51200</td><td>203.0.113.5:1025</td><td>198.51.100.20:80</td></tr></table>
<p>У двух узлов один и тот же порт-источник 51200 — маршрутизатор подменил порт второго на 1025, ответ по обратной записи вернётся нужному узлу. Всего портов 65 535 на один внешний адрес.</p>
<h4>Особенности и последствия</h4>
<ul><li>Инициировать соединение <b>снаружи</b> к узлу за PAT нельзя без проброса порта (<code>port forwarding</code> = static NAT для одного порта).</li>
<li>Записи живут ограниченное время (для TCP — часы, UDP — минуты, ICMP — секунды).</li>
<li>Ломает протоколы, передающие IP в данных (FTP active, SIP, IPsec AH), нарушает сквозную адресацию. IPsec требует NAT-Traversal (UDP 4500).</li>
<li>NAT — не средство безопасности: защищает только побочно; нужен межсетевой экран.</li>
<li>В IPv6 адресов хватает, NAT не нужен.</li></ul>
<p><b>В симуляторе:</b> включите <code>nat</code> на внешнем интерфейсе, из внутренней сети отправьте пакет во «внешнюю» и посмотрите на этапы разбора: адрес источника меняется на внешний адрес маршрутизатора; обратный пакет возвращается по записи трансляции. Попробуйте отправить снаружи на частный адрес — маршрута нет.</p>`]);
TH.push(['Т11. ACL, межсетевые экраны и зоны безопасности',`
<h4>ACL — список управления доступом</h4>
<ul><li>Правила проверяются <b>сверху вниз до первого совпадения</b>; остальные не читаются. Порядок решает всё: частное правило — выше общего.</li>
<li>В конце неявно стоит <b>«запретить всё» (implicit deny)</b>. В симуляторе, наоборот, при отсутствии подходящего правила трафик разрешён — так проще для начала; но в реальных сетях действует implicit deny.</li>
<li><b>Стандартный ACL</b> смотрит только адрес источника — ставят ближе к получателю. <b>Расширенный</b> — источник, получатель, протокол, порт — ставят ближе к источнику, чтобы не гонять запрещённый трафик по сети.</li>
<li>ACL привязывается к интерфейсу и направлению: <b>in</b> (при входе) или <b>out</b> (при выходе).</li>
<li>В Cisco ACL используют <b>wildcard-маску</b> — инверсию маски: 0 — бит должен совпасть, 1 — любой. Для 192.168.1.0/26 (255.255.255.192) wildcard = <code>0.0.0.63</code>.</li></ul>
<div class="tip"><b>Пример политики:</b> офисная сеть 10.0.1.0/24 может обращаться к серверу 10.0.2.10 только по HTTP и DNS; всё остальное — нельзя; ping разрешён администраторам 10.0.9.0/24. Правила: 1) permit tcp 10.0.9.0/24 → 10.0.2.10 любой порт; 2) permit tcp 10.0.1.0/24 → 10.0.2.10 порт 80; 3) permit udp 10.0.1.0/24 → 10.0.2.10 порт 53; 4) implicit deny.</div>
<h4>Stateless и stateful</h4>
<p>ACL не помнит соединений: для ответного трафика нужны отдельные правила. <b>Stateful-межсетевой экран</b> ведёт таблицу сессий: разрешил исходящее соединение — ответы пропускаются автоматически, а «чужой» пакет без записи в таблице отбрасывается. Next-generation FW дополнительно смотрит приложение (L7), встроенный IPS, репутацию адресов.</p>
<h4>Зоны и DMZ</h4>
<p>Интерфейсы относят к зонам доверия: <b>inside</b> (внутренняя, максимальное доверие), <b>dmz</b> (публичные серверы: веб, почта), <b>outside</b> (Интернет). Политика по умолчанию: inside → любая зона; dmz → outside (обновления, DNS); outside → dmz — только опубликованные порты (например, 80, 443); <b>dmz → inside — запрещено</b> (взломанный веб-сервер не должен давать путь в сеть); outside → inside — запрещено. Правило: сервер, доступный из Интернета, <i>никогда</i> не стоит во внутренней сети.</p>
<h4>Принципы построения политики</h4>
<ul><li>Наименьшие привилегии: разрешать только нужное.</li><li>Явная документация каждого правила (зачем, кто владелец, когда пересмотреть).</li><li>Проверка «негативных» сценариев: убедитесь, что запрещённое действительно не проходит (в симуляторе — матрица связности и <code>scan</code>).</li><li>Журналирование отказов (syslog) и разбор.</li></ul>`]);
TH.push(['Т12. Wi-Fi: стандарты 802.11, каналы, безопасность, расчёт',`
<table class="t"><tr><th>Стандарт</th><th>Диапазон</th><th>Скорость (теор.)</th><th>Примечание</th></tr>
<tr><td>802.11b</td><td>2,4 ГГц</td><td>11 Мбит/с</td><td>устарел</td></tr>
<tr><td>802.11a</td><td>5 ГГц</td><td>54 Мбит/с</td><td>—</td></tr>
<tr><td>802.11g</td><td>2,4 ГГц</td><td>54 Мбит/с</td><td>совместим с b</td></tr>
<tr><td>802.11n (Wi-Fi 4)</td><td>2,4 / 5 ГГц</td><td>до 600 Мбит/с</td><td>MIMO, каналы 40 МГц</td></tr>
<tr><td>802.11ac (Wi-Fi 5)</td><td>5 ГГц</td><td>до нескольких Гбит/с</td><td>каналы до 160 МГц, MU-MIMO</td></tr>
<tr><td>802.11ax (Wi-Fi 6/6E)</td><td>2,4 / 5 (6E — 6) ГГц</td><td>до ~9,6 Гбит/с</td><td>OFDMA, лучше в плотных сетях</td></tr></table>
<p>Реальная скорость в 2–3 раза ниже теоретической: среда общая, half-duplex, часть времени занята служебным трафиком и повторами.</p>
<h4>Диапазоны и каналы</h4>
<ul><li><b>2,4 ГГц:</b> дальше проникает через стены, но всего 3 непересекающихся канала шириной 20 МГц — <b>1, 6, 11</b> (в Европе возможна схема 1, 5, 9, 13); много помех (микроволновка, Bluetooth, соседи).</li>
<li><b>5 ГГц:</b> много каналов, выше скорость, меньше дальность; часть каналов требует DFS (уступать радарам).</li>
<li>Соседние точки доступа должны работать на разных каналах; при одинаковом канале клиенты делят эфир.</li></ul>
<h4>Метод доступа и структура</h4>
<p>Wi-Fi использует <b>CSMA/CA</b> (избегание коллизий): послушать эфир, выждать случайный интервал, передать, дождаться ACK. Коллизии обнаружить нельзя (приём во время передачи невозможен), поэтому каждый кадр подтверждается. Проблема «скрытого узла» (два клиента не слышат друг друга, но слышит точка) решается RTS/CTS. <b>BSS</b> — одна точка и её клиенты; <b>SSID</b> — имя сети; <b>BSSID</b> — MAC точки; <b>ESS</b> — несколько точек с одним SSID, между которыми клиент перемещается (roaming).</p>
<h4>Безопасность</h4>
<table class="t"><tr><th>Режим</th><th>Оценка</th></tr>
<tr><td>Open</td><td>без шифрования — только для гостевых с порталом</td></tr><tr><td>WEP</td><td>взламывается за минуты — не использовать</td></tr>
<tr><td>WPA (TKIP)</td><td>устарел</td></tr><tr><td>WPA2-PSK (AES-CCMP)</td><td>общий пароль; слабый пароль подбирается по перехваченному handshake</td></tr>
<tr><td>WPA2/WPA3-Enterprise</td><td>802.1X + RADIUS: у каждого пользователя своя учётная запись</td></tr>
<tr><td>WPA3-Personal (SAE)</td><td>защита от офлайн-подбора, прямая секретность</td></tr></table>
<p>Дополнительно: отдельный VLAN и SSID для гостей, изоляция клиентов, отключение WPS, обновление прошивок. Скрытие SSID безопасностью не является.</p>
<h4>Потери на трассе (FSPL)</h4>
<p>Затухание в свободном пространстве: <code>FSPL (дБ) = 20·lg(d, км) + 20·lg(f, МГц) + 32,44</code>. Для 100 м (0,1 км) на 2437 МГц: −20 + 67,74 + 32,44 ≈ <b>80 дБ</b>. Каждые +6 дБ — удвоение расстояния даёт потерю ещё 6 дБ. Стены добавляют 3–15 дБ в зависимости от материала (бетон, металл — больше всего); 5 ГГц затухает сильнее 2,4 ГГц.</p>
<p><b>В симуляторе:</b> радиус точки доступа и диапазон влияют на то, кто подключится; клиент вне зоны покрытия не получит адрес и не сможет отправить данные.</p>`]);
TH.push(['Т13. Основы информационной безопасности сети: угрозы и защита',`
<h4>Базовые понятия</h4>
<ul><li><b>CIA-триада:</b> конфиденциальность (данные видит только имеющий право), целостность (данные не изменены), доступность (сервис работает, когда нужен).</li>
<li><b>Актив → уязвимость → угроза → риск.</b> Риск = вероятность × ущерб. Меры: снизить, перенести (страхование), принять, избежать.</li>
<li><b>Эшелонированная защита (defense in depth):</b> несколько независимых рубежей — периметр, сегментация, защита узлов, учётные записи, мониторинг. Отказ одного не раскрывает всё.</li>
<li><b>Принцип наименьших привилегий</b> и <b>сегментация</b> (VLAN, подсети, зоны) ограничивают распространение атаки.</li></ul>
<h4>Атаки уровня L2–L4 и защита</h4>
<table class="t"><tr><th>Атака</th><th>Как работает</th><th>Защита</th></tr>
<tr><td>MAC flooding</td><td>переполнение таблицы MAC поддельными адресами; коммутатор превращается в «хаб»</td><td>port security: лимит MAC на порт, действие shutdown/restrict</td></tr>
<tr><td>Rogue DHCP</td><td>злоумышленник раздаёт адреса и подставляет себя шлюзом/DNS</td><td>DHCP snooping: доверенные порты только к настоящему серверу</td></tr>
<tr><td>DHCP starvation</td><td>исчерпание пула запросами с разных MAC</td><td>port security, ограничение скорости DHCP</td></tr>
<tr><td>ARP spoofing</td><td>ложный ARP-ответ перенаправляет трафик жертвы (MITM)</td><td>Dynamic ARP Inspection по таблице DHCP snooping, статические записи</td></tr>
<tr><td>Атаки на STP</td><td>подключение коммутатора с низким приоритетом становится root</td><td>BPDU guard, root guard, PortFast только на портах узлов</td></tr>
<tr><td>VLAN hopping</td><td>switch spoofing, double tagging</td><td>порты узлов в access, DTP off, неиспользуемый native VLAN</td></tr>
<tr><td>Broadcast storm</td><td>петля или умышленный поток broadcast</td><td>STP, storm control</td></tr>
<tr><td>Сканирование портов</td><td>разведка открытых служб</td><td>межсетевой экран, минимум открытых служб, IDS/IPS</td></tr>
<tr><td>SYN flood</td><td>поток SYN без завершения handshake исчерпывает таблицу соединений</td><td>SYN cookies, лимиты, IPS</td></tr>
<tr><td>Подмена DNS</td><td>ложный ответ даёт неверный IP</td><td>DNSSEC, доверенные резолверы, DoT/DoH</td></tr></table>
<h4>Аутентификация: AAA и 802.1X</h4>
<p><b>AAA</b> — Authentication (кто ты), Authorization (что можно), Accounting (что делал). В 802.1X три роли: <b>supplicant</b> (клиент), <b>authenticator</b> (коммутатор или точка доступа, пропускает только EAP до проверки), <b>authentication server</b> (RADIUS). Порт открывается после успешной проверки; неуспешным можно выдать гостевой VLAN.</p>
<h4>VPN</h4>
<ul><li><b>GRE</b> (IP-протокол 47): универсальный туннель, поддерживает маршрутизацию и multicast, но <b>без шифрования</b>. Добавляет 24 байта (внешний IP 20 + GRE 4), поэтому MTU внутри туннеля меньше (≈ 1476).</li>
<li><b>IPsec:</b> шифрование и аутентификация на L3. <b>ESP</b> (протокол 50) — конфиденциальность и целостность; <b>AH</b> (51) — только целостность. <b>IKE</b> (UDP 500, через NAT — 4500) согласует ключи и параметры: фаза 1 создаёт защищённый канал управления, фаза 2 — туннели данных (SA). Режимы: <i>транспортный</i> (шифруется только полезная нагрузка) и <i>туннельный</i> (шифруется весь исходный пакет, добавляется новый заголовок — для связи сетей). Обе стороны должны совпасть по ключу (PSK), алгоритмам, адресам.</li>
<li>Частая схема: <b>GRE поверх IPsec</b> — динамическая маршрутизация и шифрование вместе.</li>
<li>Межсетевой экран на пути должен пропускать IKE (UDP 500/4500), ESP (50), GRE (47).</li></ul>
<h4>Обнаружение: IDS/IPS, журналы, NetFlow</h4>
<p><b>IDS</b> только сообщает, <b>IPS</b> — блокирует. Сигнатурные системы ищут известные шаблоны (сканирование, подбор паролей), поведенческие — отклонения от нормы. Журналы (syslog) с синхронизацией времени и NetFlow (кто с кем, сколько, по каким портам) — основа расследований. Без централизованного сбора журналов инцидент невозможно восстановить.</p>`]);
TH.push(['Т14. Физический уровень: кабели, разъёмы, PoE, СКС',`
<h4>Витая пара</h4>
<table class="t"><tr><th>Категория</th><th>Полоса</th><th>Скорость и длина</th></tr>
<tr><td>Cat5e</td><td>100 МГц</td><td>1 Гбит/с, 100 м</td></tr>
<tr><td>Cat6</td><td>250 МГц</td><td>1 Гбит/с на 100 м; 10 Гбит/с до 55 м</td></tr>
<tr><td>Cat6a</td><td>500 МГц</td><td>10 Гбит/с, 100 м</td></tr>
<tr><td>Cat7/Cat8</td><td>600 МГц / 2 ГГц</td><td>экранированные; 25/40 Гбит/с на короткие расстояния (Cat8 — до 30 м)</td></tr></table>
<p>Предел сегмента Ethernet на витой паре — <b>100 м</b> (до 90 м постоянная линия + до 10 м патч-корды). Превышение даёт затухание, ошибки CRC, нестабильную связь. Решение: коммутатор в промежуточном шкафу или оптика. Типы: UTP (без экрана), F/UTP, S/FTP (экранированные, для помех и заземления).</p>
<h4>Разводка RJ-45</h4>
<p><b>T568B:</b> 1 бело-оранжевый, 2 оранжевый, 3 бело-зелёный, 4 синий, 5 бело-синий, 6 зелёный, 7 бело-коричневый, 8 коричневый. В T568A меняются местами пары оранжевая и зелёная. Для 10/100 Мбит/с используются пары 1-2 (передача) и 3-6 (приём); для 1000BASE-T — все четыре пары, в обе стороны. <b>Прямой</b> кабель (на концах одинаковая разводка) — между разнородными устройствами (ПК ↔ коммутатор). <b>Кроссовер</b> (одна сторона A, другая B) — для одинаковых устройств; современные порты имеют <b>Auto-MDIX</b> и сами подстраиваются.</p>
<h4>Оптика</h4>
<table class="t"><tr><th>Тип</th><th>Свойства</th></tr>
<tr><td>Многомодовое (OM1–OM5)</td><td>толстая сердцевина (50/62,5 мкм), светодиод/VCSEL, до ~550 м на 10 Гбит/с (OM3/OM4: 300–400 м); внутри зданий и ЦОД</td></tr>
<tr><td>Одномодовое (OS1/OS2)</td><td>сердцевина 9 мкм, лазер, километры и десятки километров; между зданиями, магистрали</td></tr></table>
<p>Для канала нужны два волокна (передача и приём), либо BiDi-трансиверы на одном волокне. Разъёмы: LC (малый, в SFP), SC, ST. Преимущества оптики: нет электромагнитных наводок, гальваническая развязка, большая дальность. Недостатки: цена, хрупкость, чистота торцов, расчёт оптического бюджета (мощность передатчика − затухания в волокне, разъёмах и сварках ≥ чувствительность приёмника).</p>
<h4>PoE — питание по Ethernet</h4>
<table class="t"><tr><th>Стандарт</th><th>Мощность порта коммутатора</th><th>Применение</th></tr>
<tr><td>802.3af (PoE)</td><td>15,4 Вт</td><td>IP-телефоны, простые камеры, точки доступа</td></tr>
<tr><td>802.3at (PoE+)</td><td>30 Вт</td><td>Wi-Fi 5/6, PTZ-камеры</td></tr>
<tr><td>802.3bt (PoE++)</td><td>60 / 90 Вт</td><td>мощные точки, терминалы, освещение</td></tr></table>
<p>Суммарный бюджет PoE коммутатора ограничен — учитывайте его при проектировании.</p>
<h4>Структурированная кабельная система (СКС)</h4>
<p>Подсистемы: рабочее место (розетка) → <b>горизонтальная</b> (до 90 м, кабель витая пара) → этажный кросс (патч-панели, коммутаторы) → <b>магистральная</b> (между этажами/зданиями, чаще оптика) → главный кросс/серверная. Правила: маркировка обеих концов, запас кабеля, отделение силовых линий от слаботочных (не менее 30 см при параллельной прокладке), радиус изгиба не менее 4 диаметров кабеля, тестирование сертифицированным тестером.</p>
<p><b>В симуляторе:</b> выберите тип кабеля и длину перед проведением линии. Витая пара свыше 100 м даст ошибку «длина больше предельной»; оптика поддерживает километры.</p>`]);
TH.push(['Т15. Проектирование сети и методика поиска неисправностей',`
<h4>Иерархическая трёхуровневая модель</h4>
<table class="t"><tr><th>Уровень</th><th>Задачи</th><th>Оборудование</th></tr>
<tr><td><b>Доступ (access)</b></td><td>подключение узлов, VLAN, PoE, port security, 802.1X</td><td>управляемые L2-коммутаторы</td></tr>
<tr><td><b>Распределение (distribution)</b></td><td>агрегация доступа, межвлановая маршрутизация, ACL, политики QoS, граница STP</td><td>L3-коммутаторы</td></tr>
<tr><td><b>Ядро (core)</b></td><td>быстрый транспорт между зданиями/серверными, без сложных политик</td><td>мощные L3-коммутаторы, резервирование</td></tr></table>
<p>В малых сетях ядро и распределение объединяют (<b>collapsed core</b>). Дополнительные блоки: серверная ферма/ЦОД, периметр с межсетевым экраном и DMZ, модуль удалённого доступа и VPN, беспроводной сегмент.</p>
<h4>Принципы проектирования</h4>
<ul><li><b>Сегментация:</b> VLAN и подсеть на группу по функции (пользователи, серверы, управление, гости, VoIP, камеры).</li>
<li><b>Резервирование:</b> два канала и два устройства на критичных участках; на L2 — STP/RSTP или EtherChannel; на шлюзе — протоколы резервирования (HSRP/VRRP); на выходе — два провайдера.</li>
<li><b>Масштабируемость:</b> адресный план с запасом, суммирование маршрутов, модульность.</li>
<li><b>Oversubscription:</b> отношение суммарной скорости портов доступа к скорости uplink. 24 порта × 1 Гбит/с на uplink 10 Гбит/с = 2,4:1 — для офиса нормально.</li>
<li><b>Управляемость:</b> единые имена, документированные адреса, SNMP/syslog, резервное копирование конфигураций.</li></ul>
<div class="tip"><b>Пример адресного плана</b> (шаблон): 10.<i>здание</i>.<i>VLAN</i>.0/24. VLAN 10 — пользователи: 10.1.10.0/24, шлюз .1; VLAN 20 — серверы: 10.1.20.0/24; VLAN 99 — управление: 10.1.99.0/24; межмаршрутизаторные каналы — 10.255.<i>n</i>.0/30; внешние — адреса провайдера. По адресу сразу видно, где узел.</div>
<h4>Документация</h4>
<p>Минимальный пакет: схема L1 (кабели, порты), L2 (VLAN, trunk, STP), L3 (подсети, маршруты); таблица адресации (устройство, интерфейс, IP/маска, шлюз); таблица VLAN; перечень правил ACL с обоснованием.</p>
<h4>Методика поиска неисправностей</h4>
<ol><li><b>Сформулировать проблему:</b> кто, откуда, куда, что именно не работает, когда началось, что менялось.</li>
<li><b>Выбрать подход:</b> <i>снизу вверх</i> (кабель → порт → VLAN → IP → маршрут → порт/служба) — надёжнее при подозрении на физику; <i>сверху вниз</i> — если ясно, что сеть работает, а служба нет; <i>деление пополам</i> — проверить середину пути (ping шлюза, ping через маршрутизатор) и сузить область.</li>
<li><b>Выдвинуть гипотезу</b> и проверить одним изменением за раз.</li>
<li><b>Проверить результат</b> и убедиться, что не сломали другое.</li>
<li><b>Записать</b> причину и решение.</li></ol>
<table class="t"><tr><th>Симптом</th><th>Вероятная причина</th><th>Проверка</th></tr>
<tr><td>Нет линка</td><td>кабель, порт выключен, превышена длина</td><td>индикаторы, <code>show</code> порта, тип и длина кабеля</td></tr>
<tr><td>ARP без ответа</td><td>другой VLAN, STP-блок, порт выключен, неверная маска</td><td>VLAN портов, <code>show mac</code>, маска</td></tr>
<tr><td>Свои видны, чужая сеть нет</td><td>нет или неверный шлюз</td><td>шлюз ∈ подсети хоста; ping шлюза</td></tr>
<tr><td>Туда доходит, ответа нет</td><td>нет обратного маршрута, ACL на обратном пути</td><td>таблица маршрутов на далёком конце</td></tr>
<tr><td>Ping есть, сайт нет</td><td>служба не запущена, порт закрыт/фильтруется, DNS</td><td><code>connect</code>, <code>scan</code>, <code>nslookup</code></td></tr>
<tr><td>Адрес 169.254.x.x</td><td>DHCP не ответил</td><td>VLAN, пул, helper, snooping trust</td></tr>
<tr><td>Нестабильно/медленно</td><td>петля, duplex mismatch, перегрузка, помехи Wi-Fi</td><td>NetFlow, график нагрузки, STP</td></tr>
<tr><td>Маршрут «пропал» после отказа</td><td>нет резервного маршрута или протокола</td><td>динамическая маршрутизация, плавающий статический маршрут</td></tr></table>`]);
TH.push(['Т16. Справочные таблицы',`
<h4>Номера протоколов IP</h4>
<table class="t"><tr><th>1</th><th>6</th><th>17</th><th>47</th><th>50</th><th>51</th><th>58</th><th>89</th></tr><tr><td>ICMP</td><td>TCP</td><td>UDP</td><td>GRE</td><td>ESP</td><td>AH</td><td>ICMPv6</td><td>OSPF</td></tr></table>
<h4>Часто встречающиеся порты</h4>
<table class="t"><tr><th>Порт</th><th>Служба</th><th>Порт</th><th>Служба</th></tr>
<tr><td>20/21 TCP</td><td>FTP</td><td>443 TCP</td><td>HTTPS</td></tr>
<tr><td>22 TCP</td><td>SSH</td><td>445 TCP</td><td>SMB</td></tr>
<tr><td>23 TCP</td><td>Telnet</td><td>500, 4500 UDP</td><td>IKE / NAT-T</td></tr>
<tr><td>25 TCP</td><td>SMTP</td><td>514 UDP</td><td>Syslog</td></tr>
<tr><td>53 UDP/TCP</td><td>DNS</td><td>520 UDP</td><td>RIP</td></tr>
<tr><td>67/68 UDP</td><td>DHCP</td><td>993 / 995 TCP</td><td>IMAPS / POP3S</td></tr>
<tr><td>69 UDP</td><td>TFTP</td><td>1812 UDP</td><td>RADIUS</td></tr>
<tr><td>80 TCP</td><td>HTTP</td><td>3306 TCP</td><td>MySQL</td></tr>
<tr><td>110 / 143 TCP</td><td>POP3 / IMAP</td><td>3389 TCP</td><td>RDP</td></tr>
<tr><td>123 UDP</td><td>NTP</td><td>5432 TCP</td><td>PostgreSQL</td></tr>
<tr><td>161/162 UDP</td><td>SNMP</td><td>9100 TCP</td><td>печать RAW</td></tr>
<tr><td>179 TCP</td><td>BGP</td><td>389 / 636 TCP</td><td>LDAP / LDAPS</td></tr></table>
<h4>Сообщения ICMP</h4>
<table class="t"><tr><th>Тип</th><th>Значение</th><th>Когда</th></tr>
<tr><td>0</td><td>Echo Reply</td><td>ответ на ping</td></tr>
<tr><td>3</td><td>Destination Unreachable</td><td>код 0 — сеть, 1 — узел, 3 — порт недоступен (UDP), 4 — нужна фрагментация при DF, 13 — запрещено фильтром</td></tr>
<tr><td>8</td><td>Echo Request</td><td>запрос ping</td></tr>
<tr><td>11</td><td>Time Exceeded</td><td>TTL дошёл до 0 (трассировка)</td></tr></table>
<h4>Степени двойки и скорости</h4>
<p>2^1…2^10: 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024. 1 байт = 8 бит; 1 Мбит/с = 125 КБ/с (идеально); 100 Мбит/с ≈ 12,5 МБ/с; 1 Гбит/с ≈ 125 МБ/с. Время передачи кадра: <code>размер, бит / скорость, бит/с</code> — 1500 байт на 100 Мбит/с: 12 000 / 10^8 = <b>120 мкс</b>; задержка распространения в кабеле ≈ 5 мкс на километр.</p>
<h4>Приоритеты syslog</h4>
<p>0 Emergency · 1 Alert · 2 Critical · 3 Error · 4 Warning · 5 Notice · 6 Informational · 7 Debug.</p>
<h4>Модель OSI одной строкой</h4>
<p>7 Прикладной (HTTP, DNS) · 6 Представления (шифрование, кодировки) · 5 Сеансовый · 4 Транспортный (TCP, UDP) · 3 Сетевой (IP, ICMP, маршрутизатор) · 2 Канальный (Ethernet, MAC, коммутатор, VLAN) · 1 Физический (кабель, хаб, радиоканал). В стеке TCP/IP уровни 5–7 объединены в прикладной, 1–2 — в канальный (доступ к среде).</p>`]);
TH.push(['Т17. Вопросы для самопроверки (с ответами)',(()=>{const Q=[
['Чем отличается домен коллизий от широковещательного домена? Что разделяет коммутатор, а что маршрутизатор?','Домен коллизий — участок, где кадры двух передатчиков могут столкнуться (хаб — один общий, у коммутатора каждый порт отдельный). Широковещательный домен — все узлы, получающие broadcast. Коммутатор разделяет домены коллизий (но не широковещательные, кроме VLAN); маршрутизатор разделяет и те, и другие.'],
['Хост 192.168.10.77/26. Найдите адрес сети, broadcast и диапазон узлов.','Блок 64. Сеть 192.168.10.64, broadcast 192.168.10.127, узлы .65–.126 (62 узла).'],
['Сколько узлов поддерживает подсеть /27? А /30?','/27: 2^5 − 2 = 30. /30: 2^2 − 2 = 2.'],
['В таблице маршрутов есть 10.0.0.0/8 через A, 10.1.0.0/16 через B и 0.0.0.0/0 через D. Куда пойдёт пакет на 10.1.5.5? На 10.9.9.9? На 8.8.8.8?','Выбирается самый длинный совпадающий префикс: 10.1.5.5 → B; 10.9.9.9 → A; 8.8.8.8 → D.'],
['Почему хост не может отправить пакет в другую подсеть, если шлюз не задан?','Он определяет, что адрес вне его подсети, и должен отправить кадр шлюзу. Без шлюза отправлять некуда — пакет не покидает локальную сеть.'],
['Для чего нужен TTL и какое сообщение возвращается при его исчерпании?','Защита от бесконечных петель маршрутизации. Маршрутизатор отбрасывает пакет с TTL = 0 и отправляет ICMP Time Exceeded (тип 11). На этом основана трассировка.'],
['Ping в одну сторону проходит, ответа нет. Какие две причины самые вероятные?','Нет обратного маршрута на удалённом маршрутизаторе (или у удалённого узла нет/неверный шлюз), либо фильтр (ACL, межсетевой экран) блокирует ответ.'],
['Как коммутатор поступает с кадром, если адрес получателя ему неизвестен?','Рассылает во все порты этого VLAN, кроме порта, откуда кадр пришёл (flooding).'],
['Какую роль в STP играет Bridge ID и как выбрать корневой коммутатор вручную?','Bridge ID = приоритет + MAC; корнем становится наименьший. Чтобы назначить корень, уменьшают его приоритет (кратно 4096).'],
['К чему приводит отключение STP в сети с петлёй? Какие защитные механизмы вы знаете?','Широковещательный шторм и «скачущие» MAC-адреса, сеть перестаёт работать. Защиты: STP/RSTP, BPDU guard, root guard, storm control, loop guard.'],
['Чем access-порт отличается от trunk? Что такое native VLAN?','Access — один VLAN, кадры без тега. Trunk — несколько VLAN, кадры с тегом 802.1Q. Native VLAN идёт по trunk без тега; на концах должна совпадать.'],
['Назовите три способа межвлановой маршрутизации и главный недостаток router-on-a-stick.','Router-on-a-stick, L3-коммутатор с SVI, отдельный физический порт на VLAN. Недостаток router-on-a-stick: весь межвлановый трафик проходит по одному trunk-каналу.'],
['Опишите установку TCP-соединения и закрытие.','SYN → SYN+ACK → ACK. Закрытие: FIN → ACK, FIN → ACK (или RST для резкого разрыва).'],
['Порт ответил RST, другой — молчание. Что это значит?','RST — порт закрыт, узел доступен, службы нет. Молчание — трафик отброшен фильтром (порт «фильтруется»).'],
['Почему DNS в основном использует UDP, а когда применяет TCP?','Запрос и ответ короткие, handshake не нужен — UDP быстрее. TCP — для больших ответов (> 512 байт без EDNS), передачи зон.'],
['Перечислите шаги получения адреса по DHCP и объясните, зачем нужен relay.','Discover → Offer → Request → Ack. Broadcast не проходит через маршрутизатор; relay пересылает запрос серверу в другой подсети unicast и указывает giaddr.'],
['Как работает PAT и почему снаружи нельзя подключиться к узлу за PAT без проброса порта?','Маршрутизатор подменяет адрес и порт источника и хранит таблицу соответствий. Входящий пакет без записи в таблице не знает, какому внутреннему узлу адресован, — нужен static NAT/port forwarding.'],
['Запишите ACL, разрешающий сети 10.0.1.0/24 только HTTP к серверу 10.0.2.10. Какое правило стоит в конце неявно?','permit tcp 10.0.1.0/24 → 10.0.2.10 порт 80; затем неявное deny any. Первое совпавшее правило решает судьбу пакета.'],
['Что такое DMZ и какой трафик между зонами запрещён?','Отдельная зона для публичных серверов. Запрещены outside → inside и dmz → inside; из outside в dmz разрешены только опубликованные порты.'],
['Чем GRE отличается от IPsec? Что нужно открыть на межсетевом экране для IPsec?','GRE — туннелирование без шифрования (протокол 47); IPsec — шифрование и аутентификация (ESP 50). Для IPsec: UDP 500 (IKE), UDP 4500 при NAT, протокол ESP.'],
['От каких атак защищают DHCP snooping, DAI и BPDU guard?','Snooping — от поддельного DHCP-сервера (и даёт таблицу привязок). DAI — от ARP-spoofing. BPDU guard — от подключения постороннего коммутатора к порту узла и подмены корня STP.'],
['Какие каналы 2,4 ГГц не пересекаются и почему важно их чередовать?','1, 6, 11 (20 МГц). Соседние точки на одном канале делят эфир, на пересекающихся — мешают друг другу.'],
['Какая максимальная длина сегмента витой пары? Что делать, если нужно больше?','100 м (90 + 10). Ставить промежуточный коммутатор или использовать оптику.'],
['Что делает 802.1X и какие в нём роли?','Проверяет подключающееся устройство до открытия порта. Роли: supplicant (клиент), authenticator (коммутатор/точка), authentication server (RADIUS).'],
['Опишите методику поиска неисправности «снизу вверх» на примере: узел не открывает сайт.','Физика/порт → VLAN → IP-настройки и шлюз → ping шлюза → ping внешнего адреса (маршрутизация, NAT) → DNS (nslookup) → порт и служба (connect). Один шаг — одна проверка.']];
return `<p class="mt">Нажимайте на вопрос, чтобы увидеть ответ. Попробуйте ответить сами — затем проверьте на схеме в симуляторе.</p>`+Q.map((q,i)=>`<details style="margin:3px 0"><summary>${i+1}. ${q[0]}</summary><div>${q[1]}</div></details>`).join('')})()]);
{const at=MAN.findIndex(x=>x[0].startsWith('17.'));MAN.splice(at<0?MAN.length-1:at,0,...TH)}
// быстрый поиск по инструкции
$('#bh').onclick=()=>{openMd('<h3>Инструкция и теория сетевых архитектур</h3><p class="mt">Для студентов ИТ- и ИБ-специальностей СПО (09.02.xx–10.02.xx). Разделы раскрываются по клику; теория сопровождается командами симулятора.</p><p><input id="mn_q" type="search" placeholder="Поиск по инструкции: например, STP, TTL, DHCP, маска…" style="width:100%;padding:7px 9px;border:1px solid var(--bd);border-radius:6px;background:var(--bg);color:var(--tx);font:inherit"></p><p class="mt" id="mn_c"></p><div id="mn_l">'+MAN.map((s,i)=>`<details ${i===0?'open':''}><summary>${s[0]}</summary><div>${s[1]}</div></details>`).join('')+'</div>');
 const q=$('#mn_q');q.addEventListener('input',()=>{const v=q.value.trim().toLowerCase();let n=0;document.querySelectorAll('#mn_l details').forEach(d=>{const hit=!v||d.textContent.toLowerCase().includes(v);d.hidden=!hit;if(v&&hit){d.open=true;n++}else if(!v)d.open=false});$('#mn_c').textContent=v?(n?`Найдено разделов: ${n}`:'Ничего не найдено'):''})};
