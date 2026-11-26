// Headless game tests (1.26.1). Serves src/ on a local port, opens the game in Chromium with software WebGL and runs
// each scenario in tests/game/*.test.mjs. A scenario reports with ok(condition, label); the run fails on any FAIL,
// a scenario error or an uncaught page error.
//   node tests/game/run.mjs                 all scenarios
//   node tests/game/run.mjs progress        only progress.test.mjs
// Needs Playwright with Chromium: npm i --no-save playwright && npx playwright install chromium
// (or point PLAYWRIGHT_PATH at an existing install). The local server has no /api: login and sync are not part of
// these tests; tests/auth.test.mjs covers the server side.
import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,'../../src');
let pw;try{pw=process.env.PLAYWRIGHT_PATH?await import(pathToFileURL(process.env.PLAYWRIGHT_PATH).href):await import('playwright')}catch{console.error('Playwright ontbreekt: npm i --no-save playwright && npx playwright install chromium (of zet PLAYWRIGHT_PATH)');process.exit(2)}
const chromium=pw.chromium||pw.default?.chromium;
const types={'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.css':'text/css','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.ttf':'font/ttf','.txt':'text/plain','.json':'application/json'};
const srv=http.createServer((q,r)=>{let f=path.join(root,decodeURIComponent(q.url.split('?')[0]));if(!f.startsWith(root)){r.writeHead(403);r.end();return}if(f.endsWith('/'))f+='index.html';
 fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return}r.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream'});r.end(d)})});
await new Promise(res=>srv.listen(0,res));const port=srv.address().port;
const only=process.argv.slice(2),files=fs.readdirSync(here).filter(f=>f.endsWith('.test.mjs')&&(!only.length||only.some(o=>f.startsWith(o)))).sort();
const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
let failed=0;
for(const file of files){const {default:scenario,viewport='1280x720',touch=false}=await import(pathToFileURL(path.join(here,file)).href);
 const [w,h]=viewport.split('x').map(Number),pg=await browser.newPage({viewport:{width:w,height:h},...(touch?{hasTouch:true,isMobile:true}:{})});
 const errors=[];pg.on('pageerror',e=>errors.push(e.message));
 console.log('\n== '+file+' ('+viewport+(touch?', touch':'')+')');
 const ok=(c,label)=>{console.log((c?'PASS ':'FAIL ')+label);if(!c)failed++};
 try{await pg.goto('http://localhost:'+port+'/index.html');await pg.waitForTimeout(1200);await scenario(pg,{ok,port})}catch(e){failed++;console.log('FAIL scenario error: '+e.message)}
 ok(!errors.length,'no page errors'+(errors.length?': '+errors.slice(0,3).join(' | '):''));await pg.close()}
await browser.close();srv.close();
console.log(failed?'\n'+failed+' FAILED':'\nALL PASS');process.exit(failed?1:0);
