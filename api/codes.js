// The parent sets or changes the children's login codes. Only a device logged in as Ouder may do this.
// GET tells which children already have a code; POST {Niek:'1234', Floor:'5678'} stores new codes (salted hashes only).
import {configured,store} from './_shared.js';
import {KIDS,whoFrom,codeShape,hashCode,codeOk} from './_auth.js';
export default async function handler(req,res){
 res.setHeader('cache-control','no-store');
 if(!configured())return res.status(503).json({error:'opslag'});
 if(whoFrom(req)!=='Ouder')return res.status(403).json({error:'ouder'});
 const codes=(await store.read('auth/codes.json').catch(()=>null))||{};
 if(req.method==='GET')return res.status(200).json({set:Object.fromEntries(KIDS.map(k=>[k,!!codes[k]]))});
 if(req.method!=='POST')return res.status(405).json({error:'method'});
 const b=req.body||{},want={},changed=[];
 for(const k of KIDS){if(b[k]==null||b[k]==='')continue;const c=String(b[k]).trim();if(!codeShape(c))return res.status(400).json({error:'vorm',kid:k});want[k]=c}
 // two children never share a code, or one could log in as the other
 for(const [k,c] of Object.entries(want)){const o=KIDS.find(x=>x!==k);if(want[o]===c||(!want[o]&&codeOk(c,codes[o])))return res.status(400).json({error:'gelijk'})}
 for(const [k,c] of Object.entries(want)){codes[k]=hashCode(c);changed.push(k)}
 if(changed.length)await store.write('auth/codes.json',codes);
 res.status(200).json({ok:true,changed,set:Object.fromEntries(KIDS.map(k=>[k,!!codes[k]]))})}
