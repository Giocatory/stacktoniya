// ===== v36: граф коммитов для репозиториев на Git-сервере =====
{const _g=sxuGt;sxuGt=function(el){_g(el);const gs=S.devs.filter(x=>x.role==='git');const blocks=[...el.querySelectorAll('.sxk')].filter(b=>/Git-сервер/.test((b.querySelector('h4')||{}).textContent||''));
 gs.forEach((g,i)=>{const b=blocks[i];if(!b)return;Object.keys(g.gdb||{}).filter(k=>g.gdb[k].bare&&Object.keys(g.gdb[k].objs||{}).length).sort().forEach(k=>{
  const dt=document.createElement('details');dt.innerHTML=`<summary style="cursor:pointer;font-size:13px">🌳 Граф: ${sxE(k.replace('/srv/git/',''))}</summary>${gvSvg(g.gdb[k])}`;b.appendChild(dt)})})}}
