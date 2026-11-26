// Stores one child's practice statistics from one device. Only whitelisted fields are kept.
import {tokenOk,configured,store,KIDS} from './_shared.js';
const num=v=>Number.isFinite(v)?Math.max(0,Math.min(v,1e13)):0;
const pair=a=>Array.isArray(a)?[num(a[0]),num(a[1])]:[0,0];
function cleanStats(st){const days={},skills={};
 for(const [d,v] of Object.entries(st?.days||{}).slice(-400)){if(!/^\d{4}-\d\d-\d\d$/.test(d))continue;const subj={};for(const [k,a] of Object.entries(v?.subj||{}).slice(0,8))subj[String(k).slice(0,40)]=pair(a);days[d]={play:num(v?.play),practice:num(v?.practice),subj}}
 for(const [sub,sk] of Object.entries(st?.skills||{}).slice(0,8)){const o=skills[String(sub).slice(0,40)]={};for(const [k,a] of Object.entries(sk||{}).slice(0,60))o[String(k).slice(0,60)]=pair(a)}
 const sessions=(Array.isArray(st?.sessions)?st.sessions:[]).slice(-80).map(x=>({start:num(x?.start),end:num(x?.end),play:num(x?.play),practice:num(x?.practice),q:num(x?.q),ok:num(x?.ok)}));
 return {days,skills,sessions}}
function cleanGame(g){g=g||{};return {stage:num(g.stage),level:num(g.level),munten:num(g.munten),hout:num(g.hout),steen:num(g.steen),planken:num(g.planken),
 tools:(Array.isArray(g.tools)?g.tools:[]).slice(0,12).map(t=>String(t).slice(0,30)),village:num(g.village),best:num(g.best),tower:num(g.tower),house:num(g.house),sky:Math.min(num(g.sky),6),runes:Math.min(num(g.runes),7),garden:Math.min(num(g.garden),6)}}
export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'method'});
 if(!configured())return res.status(503).json({error:'opslag'});
 const b=req.body||{};
 if(!tokenOk(b.token))return res.status(403).json({error:'token'});
 if(!KIDS.includes(b.kid)||!/^[a-f0-9]{8,32}$/.test(b.device||''))return res.status(400).json({error:'invoer'});
 await store.write('progress/'+b.kid+'/'+b.device+'.json',{at:Date.now(),kid:b.kid,device:b.device,game:cleanGame(b.game),stats:cleanStats(b.stats)});
 res.status(200).json({ok:true})}
