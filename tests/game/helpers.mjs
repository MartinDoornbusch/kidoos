// Page-side helpers shared by the scenarios: installed once per page with installHelpers(pg).
export async function installHelpers(pg){await pg.evaluate(()=>{
 // Resolve the current child's Dutch/German question from its real, active bank.
 window.__answer=(wrong=false)=>{const prompt=document.querySelector('.question')?.textContent;
  const g=German.bank.find(b=>b.sentence===prompt),nl=dutchBanks[profile]?.find(b=>b[1]===prompt);
  if(!g&&!nl)throw Error('geen schoolvraag uit actieve bank: '+prompt);
  const a=g?g.correct:nl[2],answer=Array.isArray(a)?a[0]:String(a).split('|')[0],f=document.querySelector('#panel form');
  if(!f)throw Error('antwoordformulier ontbreekt');
  const btn=[...f.querySelectorAll('button')].find(b=>b.textContent.trim()===answer);
  if(btn&&!wrong)btn.click();else {const input=f.querySelector('input');if(input){input.value=wrong?'testfout-antwoord':answer;f.requestSubmit()}
   else {const wrongChoice=[...f.querySelectorAll('button')].find(b=>b.textContent.trim()!==answer);if(!wrongChoice)throw Error('geen alternatief antwoord');wrongChoice.click()}}};
 window.__click=label=>{const b=[...document.querySelectorAll('#panel button, #panel a')].find(b=>b.textContent.trim().startsWith(label));if(!b)throw Error('knop ontbreekt: '+label+' · '+[...document.querySelectorAll('#panel button')].map(b=>b.textContent).join('|'));b.click()};
 window.__btn=id=>{const b=document.getElementById(id);if(!b)throw Error('knop ontbreekt: #'+id);b.click()};
 // finish one stage of a construction project through the campaign rules (the same calls the question screens make)
 window.__stage=(P,k)=>{const st=pstate(P),need=st.answersNeeded;for(let i=0;i<need;i++){const a=ConstructionCampaign.answer(s,P.id,{correct:true,verified:true,stageId:st.progress.next.id,subject:profile==='Floor'?'Duits':'Nederlands',questionId:P.id+'-'+k+'-'+i,eventId:P.id+'-'+k+'-'+i+'-'+Date.now()});if(a.ok)s=a.save}
  const c=pstate(P).progress.next.cost;for(const r of ['hout','steen','planken'])s[r]=Math.max(s[r]||0,c[r]||0);buildStage(P);closePanel()}})}
