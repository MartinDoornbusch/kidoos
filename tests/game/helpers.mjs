// Page-side helpers shared by the scenarios: installed once per page with installHelpers(pg).
export async function installHelpers(pg){await pg.evaluate(()=>{
 // answer the history question on screen correctly (or wrongly), through the real form
 window.__answer=(wrong=false)=>{const prompt=document.querySelector('.question')?.textContent;const q=HistoryCourse.bank.find(b=>b.prompt===prompt);if(!q)throw Error('geen geschiedenisvraag op het scherm: '+prompt);
  const ans=wrong?'testfout-antwoord':q.answer.split('|')[0],f=document.querySelector('#panel form');const btn=[...f.querySelectorAll('button')].find(b=>b.textContent.trim()===ans);
  if(btn&&!wrong)btn.click();else{const inp=f.querySelector('input');if(inp){inp.value=ans;f.requestSubmit()}else [...f.querySelectorAll('button')].find(b=>b.textContent.trim()!==q.answer.split('|')[0]).click()}};
 window.__click=label=>{const b=[...document.querySelectorAll('#panel button, #panel a')].find(b=>b.textContent.trim().startsWith(label));if(!b)throw Error('knop ontbreekt: '+label+' · '+[...document.querySelectorAll('#panel button')].map(b=>b.textContent).join('|'));b.click()};
 window.__btn=id=>{const b=document.getElementById(id);if(!b)throw Error('knop ontbreekt: #'+id);b.click()};
 // finish one stage of a construction project through the campaign rules (the same calls the question screens make)
 window.__stage=(P,k)=>{const st=pstate(P),need=st.answersNeeded;for(let i=0;i<need;i++){const a=ConstructionCampaign.answer(s,P.id,{correct:true,verified:true,stageId:st.progress.next.id,subject:'Geschiedenis',questionId:P.id+'-'+k+'-'+i,eventId:P.id+'-'+k+'-'+i+'-'+Date.now()});if(a.ok)s=a.save}
  const c=pstate(P).progress.next.cost;for(const r of ['hout','steen','planken'])s[r]=Math.max(s[r]||0,c[r]||0);buildStage(P);closePanel()}})}
