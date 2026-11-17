// ===== v34: пошаговая трассировка bash-скрипта (отладчик: строка, переменные, вывод) =====
let BTR=null;
{const _s=bSimple;bSimple=function(X,n,io){if(!BTR||BTR.length>3000)return _s(X,n,io);
 const st={ln:n.ln||X.ln||0,pre:{...X.env},out:''};BTR.push(st);
 const io2=Object.assign(Object.create(Object.getPrototypeOf(io)),io,{out:s=>{st.out+=s;return io.out(s)}});
 let r;try{r=_s(X,n,io2)}finally{st.post={...X.env};st.rc=r}return r}}
document.head.insertAdjacentHTML('beforeend','<style>#sxg span.tr{background:#2f7d32;color:#fff;font-weight:700}#sxtr{border:1px solid var(--bd);border-radius:6px;padding:8px;margin-top:6px;font-size:13px;background:var(--pn)}#sxtr table{border-collapse:collapse;width:100%}#sxtr td,#sxtr th{border-bottom:1px solid var(--bd);padding:2px 6px;text-align:left;font-family:ui-monospace,Consolas,monospace}#sxtr .ch{color:#2f7d32;font-weight:700}#sxtr pre{margin:4px 0;white-space:pre-wrap;background:var(--cv);padding:4px 6px;border-radius:4px;max-height:90px;overflow:auto}</style>');
{const _g=sxuGut;sxuGut=function(){_g();const g=sxq('#sxg');if(g&&SXU.trln&&g.children[SXU.trln-1])g.children[SXU.trln-1].className='tr'}}
function sxuTrace(){const ta=sxq('#sxed');if(ta)SXU.buf=ta.value;const SH=SXU.file&&sxShellOf(SXU.file);if(SH!=='bash'&&SH!=='cmd'&&SH!=='ps')return;sxuSave();
 BTR=[];if(SH==='cmd')BTR.cmd=1;if(SH==='ps')BTR.ps=1;let r;try{r=sxRunFile(SXU.d,SXU.file,sxuArgs(sxq('#sxar').value),{stdin:sxq('#sxin').value.replace(/\\n/g,'\n'),ask:sxAsk()})}finally{var T=BTR;BTR=null}
 if(SH==='bash'||SH==='ps')T.shift();/* первый вызов — сам запуск скрипта */
 if(SH==='cmd'&&T.length){const l=T[T.length-1],X=sxSession(SXU.d,'cmd');if(!l.post){l.post={...X.env};l.rc=X.last}}
 const o=sxq('#sxout');o.innerHTML=sxE(r.o)+(r.e?`<span class="e">${sxE((r.o&&!r.o.endsWith('\n')?'\n':'')+r.e)}</span>`:'')+`\n<span class="p">[код возврата: ${r.code}]</span>`;
 const keys=new Set();T.forEach(s=>{if(!s.post)s.post=s.pre;Object.keys(s.post).forEach(k=>{if(s.pre[k]!==s.post[k])keys.add(k)})});
 let pn=sxq('#sxtr');if(!pn){pn=document.createElement('div');pn.id='sxtr';o.parentNode.insertBefore(pn,o.nextSibling)}
 if(!T.length){pn.innerHTML='Команд не выполнено.';return}
 const lines=SXU.buf.split('\n');let i=0,cum=[];let acc='';T.forEach(s=>{acc+=s.out;cum.push(acc)});
 const ks=[...keys].filter(k=>!/^(_|PWD|OLDPWD|\?|LINENO|RANDOM|SECONDS)$/.test(k)).slice(0,14);
 const draw=()=>{const s=T[i],p=i?T[i-1]:null;SXU.trln=s.ln;sxuGut();const ta2=sxq('#sxed');if(ta2&&s.ln)ta2.scrollTop=Math.max(0,(s.ln-3)*19);
  pn.innerHTML=`<div class="sxr"><b>🔍 Шаг ${i+1} из ${T.length}</b><button id="trp">◀</button><button id="trn" class="pr">▶ Дальше</button><input type="range" id="trs" min="0" max="${T.length-1}" value="${i}" style="flex:1;min-width:80px"><span style="font-size:12px;color:var(--mt)">к строке</span><input id="trl" type="number" min="1" style="width:56px" value="${SXU.trbp||''}"><button id="trg" title="Перейти к следующему шагу на этой строке (точка останова); номер можно задать и кликом по номеру строки в редакторе">⏭</button><button id="trx">Закрыть</button></div>
  <div>Строка ${s.ln||'?'}: <code>${sxE((lines[s.ln-1]||'').trim())}</code> · код: ${s.rc===undefined?'—':s.rc}</div>
  ${ks.length?`<table><tr><th>переменная</th><th>после шага</th></tr>${ks.map(k=>{const v=(s.post||s.pre)[k],ch=s.pre[k]!==(s.post||s.pre)[k];return`<tr><td>${sxE(k)}</td><td class="${ch?'ch':''}">${v===undefined?'<i>не задана</i>':sxE(v)}${ch?` <small>(было: ${s.pre[k]===undefined?'—':sxE(s.pre[k])})</small>`:''}</td></tr>`}).join('')}</table>`:''}
  <div>Вывод к этому шагу:</div><pre>${sxE(cum[i])||'(пока пусто)'}</pre>`;
  sxq('#trp').onclick=()=>{if(i>0){i--;draw()}};sxq('#trn').onclick=()=>{if(i<T.length-1){i++;draw()}};sxq('#trs').oninput=e=>{i=+e.target.value;draw()};
  const go=ln=>{ln=+ln;if(!ln||!pn.isConnected)return;SXU.trbp=ln;let k=-1;for(let j=1;j<=T.length;j++){const q=(i+j)%T.length;if(T[q].ln===ln){k=q;break}}if(k>=0){i=k;draw()}else{const pp=sxq('#sxtr');pp.insertAdjacentHTML('beforeend','<div style="color:var(--er)">Строка '+ln+' не выполнялась.</div>')}};
  sxq('#trg').onclick=()=>go(sxq('#trl').value);sxq('#trl').onkeydown=e=>{if(e.key==='Enter')go(e.target.value)};
  const gg=sxq('#sxg');if(gg)gg.onclick=e=>{const n=+e.target.textContent;if(n)go(n)};
  sxq('#trx').onclick=()=>{SXU.trln=0;pn.remove();sxuGut()}};draw()}
{const _e=sxuEd;sxuEd=function(el){_e(el);SXU.trln=0;const b=sxq('#sxrn');if(!b||!SXU.file||!/^(bash|cmd|ps)$/.test(sxShellOf(SXU.file))||sxq('#sxtb'))return;
 const x=document.createElement('button');x.id='sxtb';x.textContent='🔍 Пошагово';x.title='Выполнить и пройти по шагам: строка, переменные, вывод';x.onclick=sxuTrace;b.parentNode.insertBefore(x,b.nextSibling)}}
