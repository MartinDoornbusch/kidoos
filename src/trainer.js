'use strict';
const el=id=>document.getElementById(id);
let remaining,current,retry,completed,total,firstCorrect,misses;
function screen(id){for(const name of ['setup','round','result'])el(name).hidden=name!==id}
function shuffled(cards){const deck=cards.slice();for(let i=deck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]]}return deck}
el('options').onsubmit=e=>{
 e.preventDefault();remaining=shuffled(German.bank.filter(q=>q.skill===Number(el('list').value))).slice(0,Number(el('length').value));
 total=remaining.length;completed=0;firstCorrect=0;misses=new Map();retry=false;screen('round');question()
};
function question(){
 current=remaining.shift();el('counter').textContent=(retry?'Herhaling':'Oefenronde')+' · '+(retry?(remaining.length+1)+' te gaan':(completed+1)+' van '+total);
 el('meter').max=total;el('meter').value=completed;el('instruction').textContent=current.task||('Vertaal naar het '+(current.language==='de'?'Duits':'Nederlands')+'.');
 el('prompt').textContent=current.sentence;el('answerForm').hidden=false;el('answer').value='';el('feedback').textContent='';el('next').hidden=true;el('chars').hidden=current.language!=='de';el('answer').focus()
}
for(const ch of 'äöüßÄÖÜ'){const b=document.createElement('button');b.type='button';b.textContent=ch;b.onclick=()=>{const a=el('answer');a.setRangeText(ch,a.selectionStart,a.selectionEnd,'end');a.focus()};el('chars').append(b)}
el('answerForm').onsubmit=e=>{
 e.preventDefault();const value=el('answer').value.trim();if(!value)return;
 const ok=German.accepts(current,value);
 if(!retry){completed++;if(ok)firstCorrect++;else misses.set(current.id,{card:current,value})}
 else if(!ok)remaining.push(current);
 el('meter').value=completed;el('answerForm').hidden=true;
 el('feedback').textContent=ok?'Goed! '+current.correct:'Je schreef “'+value+'”. Het juiste antwoord is “'+current.correct+'”.';
 el('next').hidden=false;el('next').textContent=remaining.length?'Volgend woord →':!retry&&misses.size?'Herhaal de gemiste woorden →':'Bekijk resultaat →';el('next').focus()
};
el('next').onclick=()=>{
 if(!remaining.length&&!retry&&misses.size){retry=true;remaining=Array.from(misses.values(),m=>m.card)}
 if(remaining.length)question();else finish()
};
function finish(){screen('result');el('score').textContent=firstCorrect+' van '+completed;el('summary').textContent=completed?'In één keer goed. Je hebt '+completed+' van de '+total+' woorden beantwoord.':'Je hebt nog geen woorden beantwoord.';el('errors').replaceChildren();
 for(const {card,value} of misses.values()){const p=document.createElement('p');p.textContent=card.sentence+' → '+card.correct+' (jouw eerste antwoord: '+value+')';el('errors').append(p)}
 el('again').focus()
}
el('stop').onclick=finish;el('again').onclick=()=>{screen('setup');el('list').focus()};
