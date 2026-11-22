// Diagnostics for the family overview storage: checks the store settings and a private write, read and list.
// Touches only health/ping.json, never anyone's progress.
import {store,configured} from './_shared.js';
export default async function handler(req,res){
 res.setHeader('cache-control','no-store');
 const out={token:configured(),storeId:!!process.env.BLOB_STORE_ID,write:false,read:false,list:false};
 if(!out.token)return res.status(503).json(out);
 try{const now=Date.now();await store.write('health/ping.json',{at:now});out.write=true;const back=await store.read('health/ping.json');out.read=back?.at===now;out.list=(await store.paths('health/')).includes('health/ping.json')}
 catch(e){out.error=String(e?.message||e).slice(0,160)}
 res.status(out.read&&out.list?200:500).json(out)}
