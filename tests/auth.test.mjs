// Unit test for the login gate: in-memory store, fake request/response, real crypto. Never touches the real store.
process.env.BLOB_READ_WRITE_TOKEN='unit-test-secret';
const R=new URL('../',import.meta.url).href;
const sh=await import(R+'api/_shared.js'),au=await import(R+'api/_auth.js');
const mem=new Map();sh.store.read=async p=>mem.has(p)?JSON.parse(mem.get(p)):null;sh.store.write=async(p,o)=>{mem.set(p,JSON.stringify(o))};sh.store.paths=async pre=>[...mem.keys()].filter(k=>k.startsWith(pre));
const login=(await import(R+'api/login.js')).default,codes=(await import(R+'api/codes.js')).default,logout=(await import(R+'api/logout.js')).default,mw=(await import(R+'middleware.js')).default;
let fail=0;const ok=(c,m)=>{console.log((c?'PASS':'FAIL')+' '+m);if(!c)fail++};
function call(h,{method='POST',body={},cookie=''}={}){return new Promise(async done=>{const res={code:200,headers:{},status(c){this.code=c;return this},json(o){this.body=o;done(this)},setHeader(k,v){this.headers[k.toLowerCase()]=v},end(){done(this)},set statusCode(c){this.code=c},get statusCode(){return this.code}};await h({method,body,headers:{cookie}},res)})}
const cookieOf=r=>(r.headers['set-cookie']||[]).map(c=>c.split(';')[0]).join('; ');
// the pincode itself is only known to the parent; the test checks a wrong one and that the parent route exists
let r=await call(login,{body:{who:'Ouder',code:'0000'}});ok(r.code===403,'wrong parent pincode refused');
r=await call(login,{body:{who:'Niek',code:'1234'}});ok(r.code===409&&r.body.error==='geen-code','child without a code cannot log in yet');
r=await call(login,{body:{who:'Hacker',code:'1'}});ok(r.code===400,'unknown name refused');
// a parent cookie made by the server helper (as after a correct pincode)
const parent='sq_auth='+au.signLogin('Ouder');
r=await call(codes,{method:'GET',cookie:''});ok(r.code===403,'codes need a parent login');
r=await call(codes,{method:'GET',cookie:'sq_auth='+au.signLogin('Niek')});ok(r.code===403,'a child cannot set codes');
r=await call(codes,{body:{Niek:'12a4'},cookie:parent});ok(r.code===400,'code must be 4-8 digits');
r=await call(codes,{body:{Niek:'4711',Floor:'4711'},cookie:parent});ok(r.code===400&&r.body.error==='gelijk','two children cannot share a code');
r=await call(codes,{body:{Niek:'4711',Floor:'90210'},cookie:parent});ok(r.code===200&&r.body.set.Niek&&r.body.set.Floor,'parent sets both codes');
ok(!JSON.stringify([...mem.values()]).includes('4711'),'codes are stored only as hashes');
r=await call(codes,{body:{Floor:'4711'},cookie:parent});ok(r.code===400,'new code equal to the other child refused');
r=await call(login,{body:{who:'Niek',code:'90210'}});ok(r.code===403,'Floor\'s code does not open Niek');
r=await call(login,{body:{who:'Niek',code:'4711'}});ok(r.code===200&&r.body.who==='Niek'&&/sq_auth=Niek\./.test(cookieOf(r))&&/HttpOnly/.test(r.headers['set-cookie'][0]),'Niek logs in with his code, HttpOnly cookie');
const niek=cookieOf(r);
// lockout after 8 misses
for(let i=0;i<8;i++)await call(login,{body:{who:'Floor',code:'0000'}});
r=await call(login,{body:{who:'Floor',code:'90210'}});ok(r.code===429&&r.body.seconds>0,'after 8 misses Floor is locked for a while, even with the right code');
ok(au.lockLeft({n:8,since:Date.now()-16*60e3})===0,'lock ends after 15 minutes');
// middleware
const req=(path,cookie='')=>new Request('https://x.test'+path,{headers:{cookie}});
let m=mw(req('/'));ok(m&&m.status===302&&m.headers.get('location')==='/login.html','no cookie: page goes to login');
m=mw(req('/models/fir1_l1.mdl'));ok(m&&m.status===302,'no cookie: models are not served');
m=mw(req('/api/sync'));ok(m&&m.status===401,'no cookie: API answers 401');
m=mw(req('/',niek));ok(m===undefined,'with Niek\'s cookie the game is served');
const forged=niek.replace('Niek.','Floor.');m=mw(req('/',forged));ok(m&&m.status===302,'a renamed cookie is refused');
const old='sq_auth='+au.signLogin('Niek',Date.now()-500*86400e3);m=mw(req('/',old));ok(m&&m.status===302,'an expired cookie is refused');
r=await call(logout,{method:'GET',cookie:niek});ok(r.code===302&&/Max-Age=0/.test(r.headers['set-cookie'][0]),'logout clears the cookie');
delete process.env.BLOB_READ_WRITE_TOKEN;m=mw(req('/',niek));ok(m&&m.status===302,'without a server secret nothing is let through');
console.log(fail?fail+' FAILED':'ALL PASS')
