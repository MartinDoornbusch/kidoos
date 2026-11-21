"use strict";
function historyMenu(){
 const log=s.history??={turn:0,items:{}};
 show('<small>GESCHIEDENIS · HOOFDSTUK 2</small><h2>De Opstand</h2><p>Hoe groeide kritiek op de kerk uit tot een conflict waaruit een nieuwe staat ontstond? Kies een paragraaf of toets jezelf over alle vijf.</p><div id="historyTopics"></div><div class="row"><button class="primary" id="mixedHistory">Gemengde toets · 10 vragen</button></div>'+buttons());
 back();
 HistoryCourse.titles.forEach((title,i)=>{
  const cards=HistoryCourse.bank.filter(q=>q.section===i);
  const done=cards.filter(q=>log.items[q.id]?.good>0&&log.items[q.id]?.due==null).length;
  const button=document.createElement('button');button.textContent=title+' · '+done+'/'+cards.length;button.onclick=()=>historyTopic(i);$('historyTopics').append(button)
 });
 $('mixedHistory').onclick=()=>historyQuestion(null,false,{count:0,good:0})
}
function historyTopic(i){
 show('<small>DE OPSTAND · LEERSTOF</small><h2>'+HistoryCourse.titles[i]+'</h2><p>'+HistoryCourse.summaries[i]+'</p><div class="row"><button class="primary" id="historyGo">Oefen deze paragraaf</button><button id="historyBack">Alle paragrafen</button></div>');
 $('historyGo').onclick=()=>historyQuestion(i,false,{count:0,good:0});$('historyBack').onclick=historyMenu
}
function historyQuestion(section,mission,round={count:0,good:0}){
 const log=s.history??={turn:0,items:{}},q=HistoryCourse.next(log,section);
 show('<small>GESCHIEDENIS · '+(mission?'WERKPLAATS':'VRAAG '+(round.count+1)+' VAN 10')+'</small><h2>'+HistoryCourse.titles[q.section]+'</h2><div class="question"></div><p id="historyTask"></p><form id="historyForm"></form>'+buttons());
 back();document.querySelector('.question').textContent=q.prompt;$('historyTask').textContent=HistoryCourse.task(q);const form=$('historyForm');
 function grade(value){
  const ok=HistoryCourse.accepts(q,value);German.record(log,q,ok);round.count++;round.good+=Number(ok);if(ok&&mission)s.seals++;if(ok&&!mission)coin();persist();
  show('<small>DE OPSTAND · '+(ok?'GOED BEANTWOORD':'HERHALING INGEPLAND')+'</small><h2>'+(ok?'Dat klopt!':'Zo zit het')+'</h2><p class="source"></p><p class="youranswer"></p><div class="question"></div><p class="why"></p><div class="row"><button class="primary" id="historyNext"></button><button id="historyHome">Paragrafen</button></div>'+buttons());back();
  document.querySelector('.source').textContent=q.prompt;document.querySelector('.youranswer').textContent=ok?'':'Jouw antwoord: '+value.trim()+' · Het goede antwoord is:';document.querySelector('.question').textContent=q.answer.split('|')[0];document.querySelector('.why').textContent=q.why;
  const ready=mission&&s.seals>=missions[s.stage][3];
  $('historyNext').textContent=ready?'Naar de reparatie':!mission&&round.count>=10?'Bekijk resultaat':'Volgende vraag';
  $('historyHome').onclick=historyMenu;
  $('historyNext').onclick=()=>{if(ready)return workshop();if(!mission&&round.count>=10){
   show('<small>GESCHIEDENIS · RESULTAAT</small><h2>'+round.good+' van 10 goed</h2><p>Je voortgang per paragraaf is opgeslagen. Opdrachten met een fout antwoord komen terug bij het oefenen.</p><div class="row"><button id="historyAgain">Terug naar de paragrafen</button></div>'+buttons());back();$('historyAgain').onclick=historyMenu
  }else historyQuestion(section,mission,round)}
 }
 if(q.choices){let options=q.choices.slice();for(let i=options.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[options[i],options[j]]=[options[j],options[i]]}
  for(const text of options){const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=()=>grade(text);form.append(b)}
 }else{form.innerHTML='<input required id="historyWord" placeholder="Typ je antwoord" aria-label="Geschiedenisantwoord" autocomplete="off"><button class="primary">Controleer antwoord</button>';form.onsubmit=e=>{e.preventDefault();grade($('historyWord').value)}}
}
