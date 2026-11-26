// Front-door login for Skybound. Who may play is decided on the server: the routing middleware lets a request through
// only with a signed login cookie, so somebody who merely knows the address sees the login page and nothing else.
// The cookie carries who logged in (Niek, Floor or Ouder) and until when, signed with a key derived from the Blob
// store's server-side secret, so no extra secret is needed and nobody can forge or extend it in the browser.
import crypto from 'node:crypto';

export const WHO=['Niek','Floor','Ouder'];
export const KIDS=['Niek','Floor'];
export const COOKIE='sq_auth',WHO_COOKIE='sq_who',DAYS=400;
const secret=()=>process.env.BLOB_READ_WRITE_TOKEN||'';
const key=()=>crypto.createHmac('sha256',secret()).update('skybound-login-v1').digest();
const sig=body=>crypto.createHmac('sha256',key()).update(body).digest('hex').slice(0,40);

export function signLogin(who,now=Date.now()){const exp=Math.floor(now/1000)+DAYS*86400,body=who+'.'+exp;return body+'.'+sig(body)}
// returns who is logged in, or null for a missing, forged or expired cookie (and always null without a server secret)
export function readLogin(value,now=Date.now()){
 if(!secret()||typeof value!=='string')return null;const m=/^(Niek|Floor|Ouder)\.(\d{9,11})\.([a-f0-9]{40})$/.exec(value);if(!m)return null;
 const a=Buffer.from(m[3]),b=Buffer.from(sig(m[1]+'.'+m[2]));if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return null;
 return +m[2]*1000>now?m[1]:null}
export function cookieValue(header,name){for(const part of String(header||'').split(';')){const i=part.indexOf('=');if(i>0&&part.slice(0,i).trim()===name)return decodeURIComponent(part.slice(i+1).trim())}return null}
export const whoFrom=req=>readLogin(cookieValue(req.headers?.cookie??req.headers?.get?.('cookie'),COOKIE));
export function loginCookies(who){const age=DAYS*86400;return [COOKIE+'='+signLogin(who)+'; Path=/; Max-Age='+age+'; HttpOnly; Secure; SameSite=Lax',WHO_COOKIE+'='+who+'; Path=/; Max-Age='+age+'; Secure; SameSite=Lax']}
export const logoutCookies=()=>[COOKIE+'=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax',WHO_COOKIE+'=; Path=/; Max-Age=0; Secure; SameSite=Lax'];

// A child's code is 4 to 8 digits, stored only as a salted scrypt hash.
export const codeShape=c=>typeof c==='string'&&/^\d{4,8}$/.test(c);
export function hashCode(code){const salt=crypto.randomBytes(16).toString('hex');return {salt,hash:crypto.scryptSync('skybound:'+code,salt,32).toString('hex')}}
export function codeOk(code,rec){if(!codeShape(code)||!rec?.salt||!rec?.hash)return false;const a=crypto.scryptSync('skybound:'+code,rec.salt,32),b=Buffer.from(rec.hash,'hex');return a.length===b.length&&crypto.timingSafeEqual(a,b)}

// Wrong codes are counted per name: after 8 misses within 15 minutes that name is locked for the rest of the window.
export const LOCK={tries:8,window:15*60e3};
export function lockLeft(f,now=Date.now()){return f&&f.n>=LOCK.tries&&now-f.since<LOCK.window?Math.ceil((LOCK.window-(now-f.since))/1000):0}
export function addMiss(f,now=Date.now()){return !f||now-f.since>=LOCK.window?{n:1,since:now}:{n:f.n+1,since:f.since}}

// (1.26.1) The parent pincode lives only on the server. Once the parent has chosen one (6 to 8 digits) it is stored as a
// salted scrypt hash in auth/parent.json, like the children's codes. Until then the old pincode still opens the parent
// account, once, so the parent can choose the new one; its unsalted hash below was public (repo and game script) and is
// worthless as soon as auth/parent.json exists. A storage error never falls back to the old pincode.
const LEGACY=process.env.SQ_LEGACY_PARENT_HASH||'9caefa318f0fca222dc0efb95e4587ef916a1a78395cf9aeb07a812fbbbe602d';
export const PARENT_PATH='auth/parent.json';
export const parentShape=c=>typeof c==='string'&&/^\d{6,8}$/.test(c);
export async function parentCheck(code,store){let rec;try{rec=await store.read(PARENT_PATH)}catch{return {ok:false,error:true}}
 if(rec?.hash)return {ok:codeOk(code,rec),legacy:false};
 const ok=typeof code==='string'&&crypto.createHash('sha256').update('skybound:'+code.trim()).digest('hex')===LEGACY;return {ok,legacy:true}}
