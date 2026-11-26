// (1.26.1) The parent pincode: GET says whether the old pincode is still in use (then it must be replaced first);
// POST {current, next} sets a new pincode of 6 to 8 digits. Only for a device logged in as Ouder, and the current
// pincode must be given again; wrong attempts count towards the same lockout as the login.
import {configured,store,sleep} from './_shared.js';
import {whoFrom,parentCheck,parentShape,hashCode,codeOk,lockLeft,addMiss,PARENT_PATH} from './_auth.js';
export default async function handler(req,res){
 res.setHeader('cache-control','no-store');
 if(!configured())return res.status(503).json({error:'opslag'});
 if(whoFrom(req)!=='Ouder')return res.status(403).json({error:'ouder'});
 let rec;try{rec=await store.read(PARENT_PATH)}catch{return res.status(503).json({error:'opslag'})}
 if(req.method==='GET')return res.status(200).json({mustChange:!rec?.hash});
 if(req.method!=='POST')return res.status(405).json({error:'method'});
 const cur=String(req.body?.current??'').trim(),next=String(req.body?.next??'').trim();
 if(!parentShape(next))return res.status(400).json({error:'vorm'});
 const fails=(await store.read('auth/fails.json').catch(()=>null))||{},left=lockLeft(fails.Ouder);
 if(left)return res.status(429).json({error:'wacht',seconds:left});
 const p=await parentCheck(cur,store);if(p.error)return res.status(503).json({error:'opslag'});
 if(!p.ok){fails.Ouder=addMiss(fails.Ouder);await store.write('auth/fails.json',fails);await sleep(900);return res.status(403).json({error:'huidig',left:Math.max(0,8-fails.Ouder.n)})}
 if(next===cur)return res.status(400).json({error:'zelfde'});
 // the parent pincode may not open a child's account and the other way round
 const codes=(await store.read('auth/codes.json').catch(()=>null))||{};if(Object.values(codes).some(c=>codeOk(next,c)))return res.status(400).json({error:'kindcode'});
 await store.write(PARENT_PATH,hashCode(next));
 res.status(200).json({ok:true,mustChange:false})}
