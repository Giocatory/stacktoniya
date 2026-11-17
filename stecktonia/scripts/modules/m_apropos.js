// ===== m_apropos (v106): поиск по справке — команды и разделы «Инструкции» по ключевым словам =====
const apStem=w=>{w=w.toLowerCase();return w.length>5?w.slice(0,w.length-2):w};
const apStrip=h=>String(h||'').replace(/<[^>]*>/g,' ').replace(/&[a-z#0-9]+;/g,' ').replace(/\s+/g,' ');
function apFind(words){const W=words.map(apStem),res=[];
 for(const c of CMDS){if(!Array.isArray(c))continue;const name=String(c[0]||''),all=c.filter(x=>typeof x==='string').join(' ').toLowerCase(),nm=name.toLowerCase();
  if(!W.every(w=>all.includes(w)))continue;let sc=0;W.forEach(w=>{if(nm.split(/[\s·|]/)[0].includes(w))sc+=5;else if(nm.includes(w))sc+=3;if(String(c[1]||'').toLowerCase().includes(w))sc+=2;else sc+=1});res.push({c,sc})}
 res.sort((a,b)=>b.sc-a.sc);
 const man=[];for(const m of (typeof MAN!=='undefined'?MAN:[])){if(!Array.isArray(m))continue;const t=String(m[0]||'').toLowerCase(),b=apStrip(m[1]).toLowerCase();if(W.every(w=>t.includes(w)||b.includes(w)))man.push({t:m[0],sc:W.reduce((s,w)=>s+(t.includes(w)?3:0),0)})}
 man.sort((a,b)=>b.sc-a.sc);return{res,man}}
function apCmd(a,io){if(!a.length)return io('Использование: apropos <слово> [слово…]   например apropos маршрутизация, apropos vlan порт, apropos шифрование');
 const{res,man}=apFind(a);if(!res.length&&!man.length)return io(`По запросу «${a.join(' ')}» ничего не найдено. Попробуйте корень слова (например, «маршрут») или help all.`);
 if(res.length){io(`Команды (${res.length}${res.length>15?', первые 15':''}):`);res.slice(0,15).forEach(r=>{const seg=String(r.c[0]).split(/\s+·\s+|\s+\|\s+/),W=a.map(apStem),u=seg.find(x=>W.some(w=>x.toLowerCase().includes(w)))||seg[0];io(`  ${u.length>46?u.slice(0,45)+'…':u}`);io(`      ${r.c[1]||''}`)});io('Подробнее: man <команда>')}
 if(man.length){io(`Разделы «Инструкции» (${man.length}${man.length>8?', первые 8':''}):`);man.slice(0,8).forEach(m=>io('  '+m.t));io('Инструкция: меню «Справка» → «Инструкция».')}}
{const _r=run;run=function(c){const a=String(c||'').trim().split(/\s+/);if((a[0]||'').toLowerCase()==='apropos')return apCmd(a.slice(1),p);return _r(c)}}
CMDS.push(['apropos <слово> […]','Поиск по справке: команды и разделы «Инструкции» по ключевым словам','Поиск по справке','Укажите одно или несколько слов: найдутся команды, в описании которых встречаются все слова (регистр не важен, окончания обрезаются), и разделы «Инструкции». Лучше сначала самые характерные слова: apropos vlan, apropos маршрут.']);
MAN.push(['Т74. Поиск команд: apropos',`<p><b>Проблема.</b> Команд в Стектонии больше сотни, и студент часто помнит «что хочу сделать», но не помнит, как называется команда. Для этого есть поиск по справке.</p>
<p><b>Как пользоваться.</b> <code>apropos vlan</code> – команды и разделы «Инструкции», где встречается «vlan»; <code>apropos маршрут</code> – по корню слова (окончания учитываются автоматически); <code>apropos шифрование vpn</code> – несколько слов, должны встретиться все. Дальше – <code>man команда</code> для подробного описания.</p>
<p><b>Ограничения.</b> Поиск идёт по описаниям команд справки и по тексту разделов «Инструкции»; команды без описания в справке (системные утилиты терминала Linux) не находятся – для них смотрите <code>help all</code>.</p>`]);
