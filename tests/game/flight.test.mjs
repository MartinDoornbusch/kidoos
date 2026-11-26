// Level 5 extras: a flight without steering catches few wind sparks, spark coins stop at eight a day, the rune ring
// lights one rune per day through the sky chart question and wakes at seven.
import {installHelpers} from './helpers.mjs';
export default async function(pg,{ok}){
 await pg.evaluate(()=>{localStorage.clear();document.getElementById('start').click()});await pg.waitForTimeout(5000);await installHelpers(pg);
 await pg.evaluate(()=>{s.stage=6;s.level=4;const d=houseDraft(),b=HousePlanner.begin(s,d,siteCtx(d));if(b.ok){s=b.save;delete s.houseDraft}s.constructionProjects=s.constructionProjects.map(q=>q.id===L4.id?{...q,completed:5}:q);startLevel5();closePanel();for(let k=1;k<=5;k++)__stage(L5,k)});
 await pg.evaluate(()=>{fly(0)});for(let i=0;i<30&&await pg.evaluate(()=>!!ride);i++){await pg.evaluate(()=>{if(ride)ride.t+=1.1});await pg.waitForTimeout(700)}
 await pg.waitForFunction(()=>!ride,null,{timeout:60000});
 let r=await pg.evaluate(()=>({got:world.sky.sparks().filter(q=>q.got).length,at:s.skyAt}));ok(r.at===1&&r.got<=2,'hands-off flight lands and catches at most two sparks ('+r.got+')');
 r=await pg.evaluate(()=>{s.sparkDay=null;const m=s.munten;sparkCoins(8);const a=s.munten-m;sparkCoins(8);return [a,s.munten-m-a]});ok(r[0]===8&&r[1]===0,'spark coins: 8, then none more today');
 r=await pg.evaluate(()=>{closePanel();s.skyRunes=6;s.skyChart=null;s.skyCrown=false;skymapPanel();$('star').click();__answer();const head=document.querySelector('#panel h2')?.textContent;closePanel();
  return {runes:s.skyRunes,crown:s.skyCrown,head,beam:world.sky.data&&s.skyRunes>=7}});
 ok(r.runes===7&&r.crown&&/ontwaakt/.test(r.head||''),'seventh rune through the sky chart question wakes the ring ('+r.head+')')}
