// Links a device to the family overview. Only a device logged in as Ouder may do this; returns the device token.
import {deviceToken,configured} from './_shared.js';
import {whoFrom} from './_auth.js';
export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'method'});
 if(!configured())return res.status(503).json({error:'opslag'});
 if(whoFrom(req)!=='Ouder')return res.status(403).json({error:'ouder'});
 res.setHeader('cache-control','no-store');res.status(200).json({token:deviceToken()})}
