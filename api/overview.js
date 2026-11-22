// The parent overview: merges every device's statistics per child. Needs the parent pincode.
import {pinOk,configured,store,sleep} from './_shared.js';
export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'method'});
 if(!configured())return res.status(503).json({error:'opslag'});
 if(!pinOk(req.body?.pin)){await sleep(900);return res.status(403).json({error:'pincode'})}
 const kids={};
 for(const path of await store.paths('progress/')){const d=await store.read(path);if(!d?.kid)continue;
  const k=kids[d.kid]??={updated:0,game:null,devices:0,days:{},skills:{},sessions:[]};k.devices++;
  if(d.at>k.updated){k.updated=d.at;k.game=d.game}
  for(const [day,v] of Object.entries(d.stats?.days||{})){const t=k.days[day]??={play:0,practice:0,subj:{}};t.play+=v.play;t.practice+=v.practice;for(const [sub,[ok,n]] of Object.entries(v.subj||{})){const a=t.subj[sub]??=[0,0];a[0]+=ok;a[1]+=n}}
  for(const [sub,sk] of Object.entries(d.stats?.skills||{}))for(const [name,[ok,n]] of Object.entries(sk)){const a=(k.skills[sub]??={})[name]??=[0,0];a[0]+=ok;a[1]+=n}
  k.sessions.push(...(d.stats?.sessions||[]))}
 for(const k of Object.values(kids)){k.sessions.sort((a,b)=>b.end-a.end);k.sessions.length=Math.min(k.sessions.length,30)}
 res.setHeader('cache-control','no-store');res.status(200).json({kids})}
