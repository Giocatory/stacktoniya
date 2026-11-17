// ===== v35: интерактивный граф коммитов (SVG) с просмотром коммита по клику =====
function gvLayout(r){const starts=[...Object.values(r.refs),...Object.values(r.rrefs),...Object.values(r.tags).map(t=>t.id)];const h=gHead(r);if(h)starts.push(h);
 const ids=gLogIds(r,[...new Set(starts.filter(Boolean))],[]).slice(0,60);const set=new Set(ids),lanes=[],pos={},edges=[];let maxL=0;
 ids.forEach((id,row)=>{let l=lanes.indexOf(id);if(l<0){l=lanes.indexOf(null);if(l<0){l=lanes.length;lanes.push(null)}}
  lanes.forEach((x,i)=>{if(x===id&&i!==l)lanes[i]=null});lanes[l]=null;pos[id]={l,row};
  const ps=(r.objs[id].p||[]).filter(p=>set.has(p));
  ps.forEach((p,k)=>{let t=lanes.indexOf(p);if(t<0){if(k===0&&lanes[l]===null)t=l;else{t=lanes.indexOf(null);if(t<0){t=lanes.length;lanes.push(null)}}lanes[t]=p}});
  maxL=Math.max(maxL,lanes.length)});
 ids.forEach(id=>{(r.objs[id].p||[]).forEach(p=>{if(pos[p])edges.push([id,p])})});
 return{ids,pos,edges,lanes:Math.max(maxL,1)}}
function gvSvg(r){const L=gvLayout(r),dc=gDeco(r),C=['#2f7dd1','#d9822b','#2f9e5a','#b04bd0','#d6453d','#18a3a3','#8a8a2a'],RH=28,CW=18,X0=14,tx=X0+L.lanes*CW+10;
 const X=l=>X0+l*CW,Y=row=>RH/2+row*RH;let s=`<svg id="gvs" width="100%" viewBox="0 0 ${Math.max(tx+420,520)} ${L.ids.length*RH+4}" style="max-width:900px;font:12px ui-monospace,Consolas,monospace">`;
 L.edges.forEach(([a,b])=>{const A=L.pos[a],B=L.pos[b],c=C[(A.l===B.l?A.l:B.l)%C.length];
  s+=A.l===B.l?`<line x1="${X(A.l)}" y1="${Y(A.row)}" x2="${X(B.l)}" y2="${Y(B.row)}" stroke="${c}" stroke-width="2"/>`:`<path d="M${X(A.l)} ${Y(A.row)} C ${X(A.l)} ${Y(A.row)+RH*.8}, ${X(B.l)} ${Y(B.row)-RH*.8}, ${X(B.l)} ${Y(B.row)}" fill="none" stroke="${c}" stroke-width="2"/>`});
 L.ids.forEach(id=>{const p=L.pos[id],c=r.objs[id],y=Y(p.row),mg=(c.p||[]).length>1;
  s+=`<g class="gvc" data-id="${id}" style="cursor:pointer"><rect x="0" y="${y-RH/2}" width="100%" height="${RH}" fill="transparent"/><circle cx="${X(p.l)}" cy="${y}" r="${mg?7:6}" fill="${mg?'var(--bg)':C[p.l%C.length]}" stroke="${C[p.l%C.length]}" stroke-width="2.5"/>`;
  let x=tx;(dc[id]||[]).forEach(t=>{const w=t.length*7+10,tag=/^tag:/.test(t),hd=/^HEAD/.test(t);s+=`<rect x="${x}" y="${y-9}" width="${w}" height="18" rx="9" fill="${hd?'#2f7d32':tag?'#b8860b':'#2f7dd1'}"/><text x="${x+5}" y="${y+4}" fill="#fff" font-size="11">${sxE(t)}</text>`;x+=w+4});
  s+=`<text x="${x}" y="${y+4}" fill="currentColor"><tspan fill="#888">${gShort(id)} </tspan>${sxE((c.m||'').split('\n')[0].slice(0,46))}</text></g>`});
 return s+'</svg>'}
{const _g=sxuGt;sxuGt=function(el){_g(el);const d=SXU.d,r=SXU.repo&&d.gdb&&d.gdb[SXU.repo];if(!r||!Object.keys(r.objs||{}).length)return;
 const w=document.createElement('div');w.className='sxk';w.id='gvw';w.innerHTML=`<h4>🌳 Граф коммитов</h4><p style="margin:0 0 6px;color:var(--mt);font-size:13px">Нажмите на коммит — ниже появится его содержимое (git show). Пустой кружок — слияние.</p>${gvSvg(r)}<pre class="sxo" id="gvo" style="display:none"></pre>`;
 const anchor=el.querySelector('.sxg');anchor?anchor.parentNode.insertBefore(w,anchor.nextSibling):el.appendChild(w);
 w.querySelectorAll('.gvc').forEach(g=>g.onclick=()=>{const o=w.querySelector('#gvo');const x=sxG(d,SXU.repo,'show',g.dataset.id);o.style.display='block';o.textContent=(x.o||'')+(x.e||'');w.querySelectorAll('.gvc circle').forEach(c=>c.setAttribute('stroke-dasharray',''));g.querySelector('circle').setAttribute('stroke-dasharray','3 2')})}}
