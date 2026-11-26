// Phone in portrait: the action button stays clear of the stick and has no key hint, the quest card sits below the
// inventory, the stick steers, and during the flight the compass pill is hidden.
export const viewport='390x844',touch=true;
export default async function(pg,{ok}){
 await pg.evaluate(()=>{localStorage.clear();document.getElementById('start').click()});await pg.waitForTimeout(5000);
 let r=await pg.evaluate(async()=>{$('act').textContent='Aan boord · vlieg naar de Wolkenkruin · E';await Promise.resolve();await Promise.resolve();const a=$('act').getBoundingClientRect(),j=$('joy').getBoundingClientRect();
  return {t:$('act').textContent,overlap:a.left<j.right&&a.bottom>j.top&&a.top<j.bottom}});
 ok(!/· E$/.test(r.t)&&!r.overlap,'action button: no key hint, clear of the stick');
 r=await pg.evaluate(()=>{s.hout=12;s.steen=9;s.planken=7;s.munten=40;updateHUD();const q=document.querySelector('.quest').getBoundingClientRect(),i=$('inventory').getBoundingClientRect();return q.top>=i.bottom-1});
 ok(r,'quest card below the inventory pill');
 r=await pg.evaluate(()=>{const z=p.z;joyZ=-1;for(let i=0;i<20;i++)move(.025);joyZ=0;return p.z<z});ok(r,'the stick moves the explorer');
 r=await pg.evaluate(()=>{s.stage=6;s.level=4;const d=houseDraft(),b=HousePlanner.begin(s,d,siteCtx(d));if(b.ok){s=b.save;delete s.houseDraft}s.constructionProjects=s.constructionProjects.map(q=>q.id===L4.id?{...q,completed:5}:q);startLevel5();closePanel();
  for(let k=1;k<=5;k++){const st=pstate(L5);for(let i=0;i<st.answersNeeded;i++){const a=ConstructionCampaign.answer(s,L5.id,{correct:true,verified:true,stageId:st.progress.next.id,subject:'Geschiedenis',questionId:'p'+k+i,eventId:'p'+k+i+Date.now()});if(a.ok)s=a.save}s.hout+=9;s.steen+=9;s.planken+=9;buildStage(L5);closePanel()}
  fly(0);updateHUD();return {ride:ride?.kind,wp:$('waypoint').textContent}});
 ok(r.ride==='air'&&r.wp==='','in flight the compass pill is hidden')}
