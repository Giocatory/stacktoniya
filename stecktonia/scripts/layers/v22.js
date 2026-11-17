// ================= v22: экзамен из собственных заданий преподавателя (редактор заданий → экзамен) =================
const EXN=EXQ.length;
function exChk([a,b,e,pr,pt]){return exQ(()=>{const f=n=>byNm(n),A=f(a),B=f(b);if(!A)return false;if(!B&&ip2n(b)==null&&v6(b)===null)return false;
 const bip=B?(srcIp(B)||addrOf6(B)):b;if(!bip)return !e;let ok;EX=[];
 if(pr)ok=!!l4(A,bip,pr,+pt).ok;else ok=!!trip(A,bip).ok;return ok===!!e})}
function exSyncCustom(){EXQ.length=EXN;(CT||[]).forEach((k,ci)=>{const cs=k.c||[];if(!cs.length)return;
 EXQ.push({n:k.t||('Задание преподавателя '+(ci+1)),min:k.min>0?k.min:20,tag:'Задание преподавателя',custom:1,
  init:r=>({}),start:c=>{exLoad0(null)},text:c=>k.d||'Условие задано преподавателем.',
  crit:c=>{const n=cs.length,base=Math.floor(100/n);return cs.map((ch,i)=>{const [a,b,e,pr,pt]=ch;const lab=`${a} → ${b}${pr?' '+String(pr).toUpperCase()+'/'+pt:''}: ${e?'проходит':'заблокирован'}`;return[lab,base+(i===0?100-base*n:0),()=>exChk(ch)]})}})})}
function exBuild(name,variant,mode,strict){const t=[];
 if(mode==='ticket'){const r=exRng(variant*7919+13),ids=EXQ.slice(0,EXN).map((_,i)=>i).sort(()=>r()-.5).slice(0,3);ids.forEach(q=>t.push({q}))}
 else if(mode==='custom'){EXQ.forEach((q,i)=>{if(q.custom)t.push({q:i})})}
 else t.push({q:+mode});
 t.forEach(x=>{const r=exRng(variant*104729+x.q*31+7);x.ctx=EXQ[x.q].init(r);x.att=0;x.res=null;x.spent=0});
 return{name:name||'',variant,strict:!!strict,tasks:t,cur:0,final:null,t0:Date.now()}}
{const _m=exMenu;exMenu=function(){exSyncCustom();let h=_m();const n=EXQ.filter(q=>q.custom).length;
 return n?h.replace('<option value="ticket">',`<option value="custom">Билет преподавателя — все свои задания (${n})</option><option value="ticket">`):h.replace('<h4>Банк заданий</h4>','<p class="mt">Свои задания преподавателя (кнопка «Инструменты → Редактор заданий») появятся здесь как экзаменационные: проверки задания становятся критериями с равными баллами.</p><h4>Банк заданий</h4>')}}
{const _run22=run;run=function(c){const a=c.trim().split(/\s+/);if(a[0].toLowerCase()==='exam'&&(a[1]||'').toLowerCase()==='start'){exSyncCustom();if(a[2]==='custom'){if(!EXQ.some(q=>q.custom))return p('Своих заданий нет: создайте их в «Инструменты → Редактор заданий».');exStart(a.slice(4).join(' '),+a[3]||1,'custom',false);return p(`Экзамен из своих заданий: ${EXS.tasks.length} шт.`)}}return _run22(c)}}
exSyncCustom();
p('Новое (v22): свои задания из редактора заданий можно провести как экзамен («Экзамен» → «Билет преподавателя», команда exam start custom).');
