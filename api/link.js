// Links a device to the family overview. Needs the parent pincode; returns the device token.
import {pinOk,deviceToken,configured,sleep} from './_shared.js';
export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'method'});
 if(!configured())return res.status(503).json({error:'opslag'});
 if(!pinOk(req.body?.pin)){await sleep(900);return res.status(403).json({error:'pincode'})}
 res.setHeader('cache-control','no-store');res.status(200).json({token:deviceToken()})}
