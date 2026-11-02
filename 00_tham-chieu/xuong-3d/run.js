// node run.js <module> <outdir> [jobName...]
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
(async()=>{const [mod,out,...names]=process.argv.slice(2);fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const p=await b.newPage();
p.on('pageerror',e=>console.log('PAGEERR',e.message));p.on('console',m=>{if(m.type()==='error'||m.type()==='warning')console.log('CONSOLE',m.text().slice(0,300))});
await p.goto('http://127.0.0.1:8901/stage.html?m='+mod);await p.waitForFunction(()=>window.ready,null,{timeout:30000});
const le=await p.evaluate(()=>window.loadErr);if(le){console.log(le);process.exit(1);}
const all=await p.evaluate(()=>Object.keys(window.JOBS));const list=names.length?names:all;const meta={};
for(const n of list){const t=Date.now();const res=await p.evaluate(async n=>{const r=await window.JOBS[n]();return r;},n);
 for(const f of res){if(f.data){fs.writeFileSync(path.join(out,f.file),Buffer.from(f.data.split(',')[1],'base64'));}if(f.meta)meta[f.file||n]=f.meta;}
 console.log(n,res.length,'files',Date.now()-t,'ms');}
if(Object.keys(meta).length){const mf=path.join(out,'meta.json');let old={};try{old=JSON.parse(fs.readFileSync(mf))}catch(e){};fs.writeFileSync(mf,JSON.stringify(Object.assign(old,meta),null,1));}
await b.close();})();
