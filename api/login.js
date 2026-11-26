// Logs a player in: Niek or Floor with their own code, or Ouder with the parent pincode. Sets the signed login cookie.
import {configured,store,sleep} from './_shared.js';
import {WHO,KIDS,codeOk,loginCookies,lockLeft,addMiss,parentCheck} from './_auth.js';
export default async function handler(req,res){
 res.setHeader('cache-control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'method'});
 if(!configured())return res.status(503).json({error:'opslag'});
 const who=req.body?.who,code=String(req.body?.code??'').trim();
 if(!WHO.includes(who))return res.status(400).json({error:'invoer'});
 const fails=(await store.read('auth/fails.json').catch(()=>null))||{},left=lockLeft(fails[who]);
 if(left)return res.status(429).json({error:'wacht',seconds:left});
 let ok=false,mustChange=false;
 if(who==='Ouder'){const p=await parentCheck(code,store);if(p.error)return res.status(503).json({error:'opslag'});ok=p.ok;mustChange=p.legacy}
 else{const codes=(await store.read('auth/codes.json').catch(()=>null))||{};if(!codes[who])return res.status(409).json({error:'geen-code'});ok=codeOk(code,codes[who])}
 if(!ok){fails[who]=addMiss(fails[who]);await store.write('auth/fails.json',fails);await sleep(900);return res.status(403).json({error:'code',left:Math.max(0,8-fails[who].n)})}
 if(fails[who]){delete fails[who];await store.write('auth/fails.json',fails)}
 res.setHeader('set-cookie',loginCookies(who));res.status(200).json({ok:true,who,kids:KIDS,mustChange})}
