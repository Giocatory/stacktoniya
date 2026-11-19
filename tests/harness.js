const {JSDOM}=require('jsdom');const fs=require('fs'),path=require('path');
const f=process.env.F||path.join(__dirname,'..','stecktonia','index.html');const root=path.dirname(f);const errs=[];
let html=fs.readFileSync(f,'utf8');
html=html.replace(/<script src="([^"]+)"><\/script>/g,(m,p)=>'<script>\n'+fs.readFileSync(path.join(root,p),'utf8').replace(/<\/script>/g,'<\\/script>')+'\n</script>').replace(/<link rel="stylesheet" href="([^"]+)">/g,(m,p)=>'<style>'+fs.readFileSync(path.join(root,p),'utf8')+'</style>');
const dom=new JSDOM(html,{url:'http://localhost/',runScripts:'dangerously',pretendToBeVisual:true,
 beforeParse(w){w.addEventListener('error',e=>errs.push('ERR '+e.message+' @'+e.lineno));w.HTMLElement.prototype.scrollIntoView=()=>{};w.requestAnimationFrame=cb=>setTimeout(()=>cb(Date.now()),1)}});
setTimeout(()=>{console.log('errors:',errs.length,errs.slice(0,8));
 const test=fs.existsSync(process.argv[2]||'')?fs.readFileSync(process.argv[2],'utf8'):'';
 if(test){try{const r=dom.window.eval(test);Promise.resolve(r).then(x=>{console.log(x);process.exit(0)})}catch(e){console.log('TESTERR',e.stack);process.exit(1)}}else process.exit(0)},300);
