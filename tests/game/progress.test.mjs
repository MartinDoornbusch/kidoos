// The whole campaign for Niek, level 1 to 6, through the same buttons and question forms a player uses. Walking and
// gathering are skipped (the materials are handed over at each site); everything else is the real game logic.
import {installHelpers} from './helpers.mjs';
export const viewport='1280x720';
export default async function(pg,{ok}){
 await pg.evaluate(()=>{localStorage.clear();document.getElementById('start').click()});await pg.waitForTimeout(5000);await installHelpers(pg);
 ok(await pg.evaluate(()=>playing&&s.stage===0&&profile==='Niek'),'new profile starts in Windhaven');
 // a wrong instruction answer gives no seal
 let r=await pg.evaluate(()=>{const site=repair[0];Object.assign(p,{x:site.x,z:site.z});p.y=world.ground(site.x,site.z,s);s.hout+=20;s.steen+=20;updateHUD();act();while($('part'))$('part').click();
  if($('work'))$('work').click();__answer(true);const seals=s.seals;closePanel();return seals});ok(r===0,'a wrong answer gives no seal');
 for(let k=0;k<6;k++){
  r=await pg.evaluate(()=>{const start=s.stage,m=mission(),site=repair[s.stage];Object.assign(p,{x:site.x,z:site.z});p.y=world.ground(site.x,site.z,s);
   for(const id of missionTools[s.stage])s.tools[id]=true;if(s.stage===2)s.rings=[0,1,2];s.hout+=20;s.steen+=20;s.planken+=20;updateHUD();
   if(context?.kind!=='repair')return {err:'geen werkplaats, context '+context?.kind};act();
   let guard=0;while(s.stage===start&&guard++<60){
    if(document.querySelector('#panel .question')&&document.querySelector('#panel form')){__answer();continue}
    if($('historyNext')){$('historyNext').click();continue}
    if($('part')){$('part').click();continue}
    if($('work')){$('work').click();continue}
    closePanel();updateHUD();act()}
   const lvl=$('lvl2')||$('lvl3');const offer=lvl?.id||null;if(lvl)lvl.click();if($('l3go'))$('l3go').click();closePanel();
   return {from:start,to:s.stage,name:m[0],guard,offer,level:s.level}});
  ok(r.to===r.from+1,'mission '+(k+1)+' · '+r.name+(r.err?' · '+r.err:'')+(r.offer?' · '+r.offer:''))}
 ok(await pg.evaluate(()=>s.level===3&&!!l3()),'after level 2 the tower (level 3) starts from the finish screen');
 // level 3: the first stage through a real conversation with the resident, the rest through the campaign rules
 r=await pg.evaluate(()=>{const st=l3(),npc=st.stepStory.npc,room=world.rooms.find(q=>q.house.key===npc);visitHouse(room);const n=room.npc;Object.assign(p,{x:n.x+.9,z:n.z+.9,y:0});updateHUD();act();
  let guard=0;while(l3().answersNeeded>0&&guard++<12){if($('t3q')){$('t3q').click();continue}if(document.querySelector('#panel .question')){__answer();continue}if($('t3next')){$('t3next').click();continue}
   const nb=[...document.querySelectorAll('#panel button')].find(b=>/Volgende vraag/.test(b.textContent));if(nb){nb.click();continue}closePanel();updateHUD();act()}
  closePanel();leaveHouse();Object.assign(p,{x:L3.site.x,z:L3.site.z});p.y=world.ground(p.x,p.z,s);s.hout+=10;s.steen+=10;s.planken+=10;updateHUD();const ctx=context?.kind;act();if($('t3build'))$('t3build').click();closePanel();
  return {npc,ctx,done:l3().progress.current}});ok(r.done===1,'level 3 stage 1: answered at '+r.npc+', built at the tower ('+r.ctx+')');
 r=await pg.evaluate(()=>{for(let k=2;k<=5;k++)__stage(L3,k);return {done:l3Done(),offer:(logbook(),!!$('lvl4'))}});ok(r.done&&r.offer,'level 3 finished, logbook offers level 4');
 r=await pg.evaluate(()=>{$('lvl4').click();closePanel();const d=houseDraft(),b=HousePlanner.begin(s,d,siteCtx(d));if(b.ok){s=b.save;delete s.houseDraft}world.sync(s);for(let k=1;k<=5;k++)__stage(L4,k);return {level:s.level,done:houseDone(),offer:(logbook(),!!$('lvl5'))}});
 ok(r.level===4&&r.done&&r.offer,'level 4 house designed and built, logbook offers level 5');
 r=await pg.evaluate(()=>{$('lvl5').click();if($('l5go'))$('l5go').click();for(let k=1;k<=4;k++)__stage(L5,k);const st=l5().progress.next,c=st.cost;for(const q of ['hout','steen','planken'])s[q]+=c[q]||0;
  for(let i=0;i<st.questions;i++){const a=ConstructionCampaign.answer(s,L5.id,{correct:true,verified:true,stageId:st.id,subject:'Geschiedenis',questionId:'l5e'+i,eventId:'l5e'+i+Date.now()});if(a.ok)s=a.save}
  const coins=s.munten;buildStage(L5);const board=!!$('flyNow');if(board)$('flyNow').click();return {done:l5Done(),board,ride:ride?.kind,reward:s.munten-coins}});
 ok(r.done&&r.board&&r.ride==='air'&&r.reward===20,'level 5 airship rebuilt (+20), boarding starts the flight');
 await pg.evaluate(()=>{ride.t=ride.dur-.01});await pg.waitForFunction(()=>!ride,null,{timeout:120000});
 r=await pg.evaluate(()=>({at:s.skyAt,visited:s.skyVisited,panel:$('content').textContent.slice(0,40),onSky:onSky()}));ok(r.at===1&&r.visited&&r.onSky&&/WOLKENKRUIN/.test(r.panel),'flight lands on the Wolkenkruin with the arrival screen');
 r=await pg.evaluate(()=>{closePanel();logbook();const b=!!$('lvl6');if(b)$('lvl6').click();if($('l6go'))$('l6go').click();
  Object.assign(p,{x:L6.site.x,z:L6.site.z});p.y=world.ground(p.x,p.z,s,30);updateHUD();act();if($('t6q'))$('t6q').click();__answer();__click('Naar de bouwplek');if($('t3build'))$('t3build').click();closePanel();return {b,level:s.level,n:world.garden.level(s)}});
 ok(r.b&&r.level===6&&r.n===1,'level 6 starts from the logbook; stage 1 answered at the spring stone and built');
 r=await pg.evaluate(()=>{for(let k=2;k<=5;k++)__stage(L6,k);const d=world.garden.data().door;Object.assign(p,{x:d.x-.6,z:d.z});p.y=world.ground(p.x,p.z,s,30);updateHUD();const lbl=$('act').textContent,m=s.munten;act();return {done:l6Done(),lbl,gain:s.munten-m}});
 ok(r.done&&/Wolkenbessen/.test(r.lbl)&&r.gain===2,'level 6 garden restored; cloudberries +2 coins');
 r=await pg.evaluate(()=>{logbook();const lb=$('content').textContent;closePanel();const t=document.createElement('div');t.innerHTML=missionOverview();const ov=t.textContent;const snap=snapshot();
  persist();const keep={stage:s.stage,level:s.level,garden:world.garden.level(s),munten:s.munten};restore();const back={stage:s.stage,level:s.level,garden:world.garden.level(s),munten:s.munten};
  return {lb:/Alle zes de levels/.test(lb),ov:/Level 6/.test(ov)&&/Herstel de Wolkentuin/.test(ov),snap:snap.sky===6&&snap.garden===6,same:JSON.stringify(keep)===JSON.stringify(back),keep,back}});
 ok(r.lb,'logbook: all six levels done');ok(r.ov,'mission list shows level 6');ok(r.snap,'parent overview snapshot: airship and garden finished');ok(r.same,'saved and restored: '+JSON.stringify(r.back));
}
