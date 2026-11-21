"use strict";
const $=id=>document.getElementById(id);
let world;
const newSave=()=>({version:1,stage:0,hout:0,steen:0,planken:0,seals:0,rings:[],harvest:{},yield:{},tools:{},toolProgress:{},munten:0,items:{},scarf:null,dogFriend:false,builds:[],log:{chapter:7,turn:0,items:{}},position:null});
let profile='Niek',s=newSave(),playing=false,context=null,guide=null,placement=null,preview=null,race=null,last=0,toastTimer,joyX=0,joyZ=0,drag=null;
const p={x:0,y:0,z:13,vy:0,heading:0,speed:0,walk:0,on:true},view={yaw:0,height:3.9,dist:6.9},keys=new Set();
let currentRoom=null, outdoorPose=null, ride=null;
let movementYaw=null, followHeading=null;
function resetSteering(){movementYaw=null;followHeading=null}
function followCamera(dt){
 if(followHeading===null||drag)return;
 const delta=Math.atan2(Math.sin(followHeading-view.yaw),Math.cos(followHeading-view.yaw));
 view.yaw+=delta*(1-Math.exp(-5*dt))
}
// [naam, hout, steen, werkinstructies, planken]. Materiaal kost nu echt werk: elke slag met bijl of houweel is een vraag.
const missions=[['Herstel de havenbrug',6,3,3,0],['Bouw de bergbrug',0,6,4,6],['Ontsteek het sterrenbaken',4,8,4,0],['Herstel de molen op de Molenhoeve',8,2,5,6],['Herstel de kraan in de Steengroeve',4,10,5,4],['Ontsteek het signaalvuur op de Valkenrots',10,6,6,0]];
const missionTools=[[],['touw'],['kaart'],['hamer'],['lier'],['vuursteen']],PILE=4;
// Level 1 is the windroute; level 2 (the far islands) starts when the player chooses it.
function mission(){return s.stage<3||(s.level||1)>=2?missions[s.stage]:null}
// Gereedschap verdien je met opdrachten bij de bewoners.
const TOOLS={
 bijl:{name:'Bijl',owner:'bram',need:5,stage:0,use:'Met de bijl hak je hout bij de houtstapels. Elke goede slag levert één hout op.',intro:'Ik leen je mijn bijl, maar eerst wil ik zien dat je instructies goed begrijpt. Haal vijf opdrachten goed.'},
 houweel:{name:'Houweel',owner:'mara',need:5,stage:0,use:'Met het houweel hak je steen in de groeves. Elke goede slag levert één steen op.',intro:'Ik smeed een houweel voor je. Terwijl het ijzer gloeit, beantwoord jij vijf opdrachten goed.'},
 zaag:{name:'Zaag',owner:'bram',need:6,stage:1,use:'Met de zaag maak je op de brugwerf planken van hout. Elke goede zaagsnede levert één plank op.',intro:'Voor de bergbrug zijn planken nodig. Mijn beste zaag krijg je na zes goede opdrachten.'},
 touw:{name:'Touw',owner:'tomas',need:5,stage:1,use:'Het touw houdt de bergbrug bij elkaar. Zonder touw geen brug.',intro:'Ik vlecht stevig touw van de vezels uit mijn tuin. Help me met vijf opdrachten.'},
 hamer:{name:'Hamer en beitel',owner:'joost',need:6,stage:3,use:'Met hamer en beitel hak je stenen en tandwielen op maat. De molen op de Molenhoeve heeft ze nodig.',intro:'Een molen herstel je niet met blote handen. Haal zes opdrachten goed, dan krijg je mijn tweede hamer en beitel.'},
 lier:{name:'Lier',owner:'gerrit',need:6,stage:3,use:'Met de lier trek je zware lasten omhoog. De kraan in de Steengroeve draait er weer mee.',intro:'Met deze lier trek ik stammen uit het ravijn. Laat met zes goede antwoorden zien dat je hem verdient.'},
 vuursteen:{name:'Vuursteen',owner:'anke',need:6,stage:3,use:'Met vuursteen en staal sla je vonken. Zo ontsteek je het signaalvuur op de Valkenrots.',intro:'Mijn opa sloeg hier al vonken mee. Zes goede antwoorden en hij is van jou.'},
 kaart:{name:'Sterrenkaart',owner:'linde',need:5,stage:1,use:'Met de sterrenkaart stel je het baken af op de juiste sterren.',intro:'Ik teken een sterrenkaart voor je baken. Laat zien dat je vijf vragen goed kunt beantwoorden.'}
};
const houseOf=key=>world.rooms.find(r=>r.house.key===key).house;
const repair=[{x:0,z:-21},{x:0,z:-81},{x:0,z:-130},{x:-63.5,z:-63.5},{x:56.5,z:-84},{x:63,z:-128}];
const key=()=> 'studyquest.skybound.v1.'+(profile==='Floor'?'Nova':'Flint');
function persist(){if(!playing)return;try{s.position=currentRoom?{...outdoorPose}:{x:p.x,y:p.y,z:p.z,yaw:view.yaw};localStorage.setItem(key(),JSON.stringify(s))}catch{notify('Opslaan lukt niet in deze browser.')}}
function notify(str){$('toast').textContent=str;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').textContent='',3500)}
function dist(o){return Math.hypot(o.x-p.x,o.z-p.z)}
function area(){return world.islands.reduce((a,b)=>dist(a)<dist(b)?a:b)}
function restore(){currentRoom=null;world.enterRoom(null);resetSteering();world.outfit(profile==="Floor"?"Nova":"Flint");race=null;let data;try{data=JSON.parse(localStorage.getItem(key()))}catch{}s=data?.version===1?Object.assign(newSave(),data):newSave();
 if(s.log.chapter!==7){s.previousGermanLog=s.log;s.log={chapter:7,turn:0,items:{}}}
 let pos=s.position;Object.assign(p,{x:pos?.x??0,z:pos?.z??13,y:pos?.y??0,vy:0,speed:0,heading:pos?.yaw??0,on:false,glide:false});view.yaw=pos?.yaw??0;if(world.ground(p.x,p.z,s)<-20||world.blocked(p.x,p.z,s,p.y))respawn();world.sync(s);world.equip(s.tools);world.scarf(s.scarf);if(s.dogFriend)world.fauna?.befriend()}
function respawn(){let anchor=world.islands[Math.min(s.stage,2)];Object.assign(p,{x:0,z:anchor.z+8,y:world.ground(0,anchor.z+8,s),vy:0,on:true,speed:0,glide:false});if(playing)notify('Terug op vaste grond. Je uitrusting is mee.')}
function show(html){resetSteering();if(race&&!race.paused)race.paused=performance.now();keys.clear();joyX=joyZ=0;$('joy').firstElementChild.style.transform='';$('content').innerHTML=html;if(!$('panel').open)$('panel').showModal()}
$('panel').addEventListener('close',()=>{if(race?.paused){race.start+=performance.now()-race.paused;delete race.paused}keys.clear();if(document.activeElement&&document.activeElement!==document.body)document.activeElement.blur()});
function closePanel(){$('panel').close();updateHUD()}
function buttons(){return '<div class="row"><button id="back">Terug naar het eiland</button></div>'}
function back(){$('back').onclick=closePanel}
function start(){if(!world){try{world=createWorld($('world'));window.addEventListener('resize',world.resize)}catch(error){$('start').textContent='Spelwereld laden mislukt';console.error(error);return false}}playing=true;if(world.walkers)world.walkers.onGreet=(name,line)=>{if(!$('panel').open)notify(name+': “'+line+'”')};restore();$('entry').hidden=true;$('hud').hidden=false;world.animate(0,s,p,view,false,1);updateHUD();notify(s.log.turn||s.hout?'Welkom terug, '+profile+'!':'Loop naar de gemarkeerde houtstapel.')}
document.querySelectorAll('[data-profile]').forEach(b=>b.onclick=()=>{profile=b.dataset.profile;updateProfileMenu();world?.outfit(profile==="Floor"?"Nova":"Flint");document.querySelectorAll('[data-profile]').forEach(c=>c.classList.toggle('selected',c===b))});$('start').onclick=start;$('school').onclick=()=>{start();if(playing)school()};$('history').onclick=()=>{start();if(playing)historyMenu()};
function needs(){const m=mission();if(!m)return null;const planks=Math.max(0,(m[4]||0)-s.planken);
 return {hout:Math.max(0,m[1]+planks-s.hout),steen:Math.max(0,m[2]-s.steen),planks}}
function pileLeft(n){return s.harvest[n.i]>Date.now()?0:(s.yield[n.i]??PILE)}
function reachable(n){const I=world.islands.find(i=>Math.hypot(i.x-n.x,i.z-n.z)<i.r);return !!I&&I.open<=Math.min(s.stage,2)}
function objective(){
 const m=mission();if(!m)return race?{obj:world.gates[race.hit],name:'Tijdrit · windring '+(race.hit+1)}:null;
 const n=needs(),visit=(id)=>{const h=houseOf(TOOLS[id].owner);return {obj:h,name:TOOLS[id].name+' · '+h.name}};
 const pile=type=>world.nodes.filter(o=>o.type===type&&reachable(o)&&pileLeft(o)>0).sort((a,b)=>dist(a)-dist(b))[0];
 if(n.hout>0){if(!s.tools.bijl)return visit('bijl');const o=pile('hout');if(o)return {obj:o,name:'Houtstapel · hak hout'}}
 if(n.steen>0){if(!s.tools.houweel)return visit('houweel');const o=pile('steen');if(o)return {obj:o,name:'Steengroeve · hak steen'}}
 if(n.planks>0&&!s.tools.zaag)return visit('zaag');
 for(const id of missionTools[s.stage])if(!s.tools[id])return visit(id);
 if(s.stage===2&&s.rings.length<3)return {obj:world.gates.find((_,i)=>!s.rings.includes(i)),name:'Windring · spring'};
 return {obj:repair[s.stage],name:s.stage===2?'Baken':'Brugwerf'}
}
// Safety net: only when the current mission can no longer be finished does one pile regrow, so nobody gets stuck.
function replenish(){const m=mission();if(!m||currentRoom)return;const now=Date.now(),n=needs();
 for(const type of ['hout','steen']){if(n[type]<=0)continue;
  const here=world.nodes.filter(o=>o.type===type&&reachable(o)),left=here.reduce((a,o)=>a+pileLeft(o),0);
  if(left>=n[type]||here.some(o=>s.harvest[o.i]>now&&s.harvest[o.i]-now<9e4))continue;
  const o=here.filter(o=>pileLeft(o)===0).sort((a,b)=>dist(a)-dist(b))[0];if(!o)continue;s.harvest[o.i]=now+45000;delete s.yield[o.i];persist();
  notify(type==='hout'?'Er groeit nieuw hout aan bij een houtstapel. Nog even geduld.':'Er komt nieuwe steen vrij bij een steengroeve. Nog even geduld.')}}
function coin(n=1){s.munten=(s.munten||0)+n;persist()}
function toolList(){return Object.keys(TOOLS).filter(k=>s.tools[k]).map(k=>TOOLS[k].name.toLowerCase()).join(', ')}
function inventoryText(){return 'Munten '+(s.munten||0)+' · Hout '+s.hout+' · Steen '+s.steen+(s.planken||s.stage===1?' · Planken '+s.planken:'')+(toolList()?' · '+toolList():'')}
function updateHUD(){if(!playing)return;replenish();
 $('build').hidden=!!currentRoom;
 if(currentRoom){
  const {house,exit,npc}=currentRoom,nearExit=dist(exit)<1.35&&p.y<1,nearNpc=dist(npc)<2.65&&p.y<1;
  $('region').textContent=house.place;$('chapter').textContent='DORPSONDERZOEK';
  const offer=Object.keys(TOOLS).find(k=>TOOLS[k].owner===house.key&&!s.tools[k]&&TOOLS[k].stage<=s.stage);
  $('objective').textContent='Spreek met '+house.name;$('progress').textContent=offer?TOOLS[offer].name+' verdienen · '+(s.toolProgress[offer]||0)+' / '+TOOLS[offer].need+' goed':s.village?.[house.key]?'Onderzoek afgerond':'Vraag de bewoner om een aanwijzing';
  $('inventory').textContent=inventoryText();
  context=nearNpc?{kind:'talk'}:nearExit?{kind:'leave'}:null;
  $('act').textContent=nearNpc?'Praat met '+house.name+' · E':nearExit?'Naar buiten · E':'';
  $('waypoint').textContent=nearExit?'Uitgang':house.name+' · '+Math.round(dist(npc))+' m';return
 }
let m=mission();$('region').textContent=area().name;$('chapter').textContent=m?'LEVEL '+(s.stage<3?1:2)+'  /  MISSIE '+(s.stage%3+1)+' VAN 3':s.stage>=6?'ALLE LEVELS VOLTOOID':'LEVEL 1 VOLTOOID';
 $('objective').textContent=m?m[0]:s.stage===3&&(s.level||1)<2?'Klaar voor level 2':'Vrije bouwvlucht';$('progress').textContent=m?(m[4]?'Planken '+Math.min(s.planken,m[4])+'/'+m[4]:'Hout '+Math.min(s.hout,m[1])+'/'+m[1])+' · Steen '+Math.min(s.steen,m[2])+'/'+m[2]+(s.stage===2?' · Ringen '+s.rings.length+'/3':''):(race?'Tijdrit · '+((performance.now()-race.start)/1000).toFixed(1)+' s · '+race.hit+'/3':s.stage===3&&(s.level||1)<2?'Start level 2 in je logboek, of vlieg een tijdrit bij het baken.':'Bouw verder of start een tijdrit bij het baken.');
 $('inventory').textContent=inventoryText();
 context=null;
 if(placement){context={kind:'place'};$('act').textContent='Plaatsen · E'}
 else {if(s.stage>=3&&!race&&dist(repair[2])<4.6)context={kind:'race'};let r=mission()&&repair[s.stage];if(r&&dist(r)<4.6)context={kind:'repair'};
 let n=world.nodes.filter(n=>pileLeft(n)>0&&dist(n)<3.4).sort((a,b)=>dist(a)-dist(b))[0];
 if(n&&(!context||(r&&dist(n)<dist(r))))context={kind:'resource',n};
 $('act').textContent=context?.kind==='resource'?(context.n.type==='hout'?(s.tools.bijl?'Hout hakken':'Bijl nodig'):(s.tools.houweel?'Steen hakken':'Houweel nodig'))+' · E':context?.kind==='race'?'Start de windrace · E':context?'Werkplaats · E':''}
 const cab=world.cable,station=[cab.a,cab.b].findIndex(st=>Math.hypot(st.x-p.x,st.z-p.z)<3.4&&Math.abs(p.y-st.y-world.liftAt(st.x,st.z))<2.5);
 if(station>=0&&!context&&!placement&&!ride){context={kind:'cable',from:station};$('act').textContent=(station?'Kabelbaan naar de berg':'Kabelbaan naar de Bloesemvallei')+' · E'}
 const door=world.rooms.find(room=>dist(room.house)<1.8);
 if(door&&!context&&!race&&!placement){context={kind:'enter',door};$('act').textContent=door.house.place+' binnengaan · E'}
 guide=objective();if(guide){let dx=guide.obj.x-p.x,dz=guide.obj.z-p.z;let angle=Math.atan2(dx,-dz)+view.yaw;$('waypoint').style.setProperty('--bearing',angle+'rad');$('waypoint').textContent=guide.name+' · '+Math.round(dist(guide.obj))+' m'}else $('waypoint').textContent='';
}
function act(){if(!playing||$('panel').open)return;updateHUD();if(!context)return;
 if(context.kind==='enter'){visitHouse(context.door);return}
 if(context.kind==='leave'){leaveHouse();return}
 if(context.kind==='talk'){interview();return}
 if(context.kind==='race'){race={start:performance.now(),hit:0};world.gates[0].g.visible=true;notify('Tijdrit gestart! Volg de drie windringen.');updateHUD();return}
 if(context.kind==='place'){place();return}
 if(context.kind==='cable'){if(s.stage<1){notify('De kabelbaan draait pas als de havenbrug weer heel is.');return}ride={from:context.from,t:0,dur:15};p.ride=true;notify('Instappen! Geniet van het uitzicht.');return}
 if(context.kind==='resource'){harvest(context.n);return}
 workshop()}
// Taken is taken: an emptied pile stays gone (for about 30 years of play).
const GONE=1e12;
// Each swing of the axe or pick is one question. A right answer cuts one piece; a wrong one misses.
function harvest(n){
 const tool=n.type==='hout'?'bijl':'houweel';
 if(!s.tools[tool]){const t=TOOLS[tool],h=houseOf(t.owner);
  show('<small>GEREEDSCHAP NODIG</small><h2>'+(tool==='bijl'?'Zonder bijl geen hout':'Zonder houweel geen steen')+'</h2><p>'+h.name+' in de '+h.place.toLowerCase()+' geeft je '+(tool==='bijl'?'een bijl':'een houweel')+' als je '+t.need+' opdrachten goed maakt. Je kompas wijst de weg.</p>'+buttons());back();return}
 function swing(){
  const left=pileLeft(n);
  askOne(subject(),{kicker:(n.type==='hout'?'HOUTHAKKEN':'STEENHAKKEN')+' · NOG '+left+' IN DEZE '+(n.type==='hout'?'STAPEL':'GROEVE'),title:n.type==='hout'?'Raak de stam':'Raak de rots',lead:'Een goed antwoord is een raak slag.'},ok=>{
   if(ok){s[n.type]++;s.yield[n.i]=left-1;if(left-1<=0){s.harvest[n.i]=Date.now()+GONE;delete s.yield[n.i]}world.reach();world.burst(n.x,1.6,n.z,n.type==='hout'?0xffcf6a:0x9fe3ff)}
   persist();const more=pileLeft(n)>0,n2=needs();
   return {head:ok?'Raak! +1 '+n.type:'Mis! Deze slag levert niets op',note:ok&&!more?(n.type==='hout'?'De stapel is op.':'Deze groeve is leeg.'):'',
    buttons:more?[['Volgende slag',swing,true],['Stoppen',closePanel]]:[['Verder',closePanel,true]]}
  })
 }
 swing()
}
// Which subject a pupil practises: Niek mainly German, Floor Dutch. Linde's map asks history of Niek.
function subject(kind){if(profile==='Floor')return 'nl';if(kind==='kaart')return 'hist';return 'de'}
function nextDutch(){const bank=dutchBanks[profile],st=s.dutch||={good:0,total:0,cursor:0};st.retry||=[];
 const due=st.retry.find(r=>r.at<=st.total);if(due){st.retry=st.retry.filter(r=>r!==due);return due.i}
 const i=st.cursor%bank.length;st.cursor++;return i}
// One question in the pupil's subject. onGraded(ok) updates the game and returns the follow-up buttons.
function askOne(kind,{kicker,title,lead},onGraded){
 let q,prompt,task,check,record,correct,why,options=null,german=false;
 if(kind==='de'){q=German.next(s.log,null);german=true;prompt=q.sentence;task=q.task||'Schrijf het juiste antwoord.';correct=q.correct;why=q.why;
  check=v=>German.accepts(q,v);record=ok=>German.record(s.log,q,ok)}
 else if(kind==='hist'){const log=s.history??={turn:0,items:{}};q=HistoryCourse.next(log,null);prompt=q.prompt;task=HistoryCourse.task(q);correct=q.answer.split('|')[0];why=q.why;options=q.choices||null;
  check=v=>HistoryCourse.accepts(q,v);record=ok=>German.record(log,q,ok)}
 else{const bank=dutchBanks[profile],i=nextDutch(),[topic,p,answer,w,t]=bank[i];prompt=p;why=w;task=t||(Array.isArray(answer)?'Kies het beste antwoord.':'Typ je antwoord.');
  const norm=v=>v.trim().toLocaleLowerCase('nl').replace(/[“”"‘’',;:]/g,'').replace(/[.!?]+$/,'').replace(/\s+/g,' ').trim();
  const accepted=typeof answer==='string'?answer.split('|'):[answer[0]];correct=accepted[0];if(Array.isArray(answer))options=answer;
  check=v=>accepted.some(a=>norm(a)===norm(v));record=ok=>{const st=s.dutch;st.total++;if(ok)st.good++;else st.retry.push({i,at:st.total+3})}}
 show('<small>'+kicker+'</small><h2>'+title+'</h2>'+(lead?'<p>'+lead+'</p>':'')+'<div class="question"></div><p class="task"></p><form id="oneForm"></form>'+buttons());back();
 document.querySelector('.question').textContent=prompt;document.querySelector('.task').textContent=task;const form=$('oneForm');
 function grade(value){
  const ok=check(value);record(ok);const next=onGraded(ok);
  show('<small>'+kicker+'</small><h2>'+next.head+'</h2>'+(next.note?'<p>'+next.note+'</p>':'')+'<p class="youranswer"></p><div class="question"></div><p class="why"></p><div class="row" id="oneNext"></div>');
  document.querySelector('.youranswer').textContent=ok?'Goed antwoord:':'Jouw antwoord: '+value.trim()+' · Het goede antwoord is:';document.querySelector('.question').textContent=correct;
  document.querySelector('.why').textContent=(!ok&&german&&German.nearMiss(q,value)?'Bijna goed, alleen de hoofdletters kloppen niet. ':'')+(why||'');
  for(const [label,fn,primary] of next.buttons){const b=document.createElement('button');b.textContent=label;if(primary)b.className='primary';b.onclick=fn;$('oneNext').append(b)}
  updateHUD()
 }
 if(options){const opts=options.slice();for(let i=opts.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[opts[i],opts[j]]=[opts[j],opts[i]]}
  for(const o of opts){const b=document.createElement('button');b.type='button';b.textContent=o;b.onclick=()=>grade(o);form.append(b)}}
 else{form.innerHTML='<input required id="oneWord" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Jouw antwoord"><div id="oneLetters"></div><button class="primary">Controleer antwoord</button>';
  const input=$('oneWord');if(german)for(const ch of ['ä','ö','ü','ß','Ä','Ö','Ü']){const b=document.createElement('button');b.type='button';b.textContent=ch;b.onclick=()=>{input.setRangeText(ch,input.selectionStart,input.selectionEnd,'end');input.focus()};$('oneLetters').append(b)}
  form.onsubmit=e=>{e.preventDefault();if(input.value.trim())grade(input.value)};if(!matchMedia('(pointer:coarse)').matches)input.focus()}
}
// A tool assignment from a resident: collect enough right answers and the tool is yours.
function toolQuest(id){const t=TOOLS[id],h=houseOf(t.owner),prog=()=>s.toolProgress[id]||0;
 askOne(subject(id),{kicker:h.place.toUpperCase()+' · OPDRACHT VAN '+h.name.toUpperCase(),title:t.name+' verdienen · '+prog()+' van '+t.need+' goed'},ok=>{
  if(ok)s.toolProgress[id]=prog()+1;let got=false;if(prog()>=t.need&&!s.tools[id]){s.tools[id]=true;got=true;world.equip(s.tools)}persist();
  if(got)return {head:'Je hebt '+(id==='touw'?'het touw':id==='kaart'?'de sterrenkaart':'de '+t.name.toLowerCase())+'!',note:t.use,buttons:[['Gesprek sluiten',closePanel,true]]};
  return {head:ok?'Goed! '+prog()+' van '+t.need:'Nog niet goed · '+prog()+' van '+t.need,buttons:[['Volgende opdracht',()=>toolQuest(id),true],['Later verder',closePanel]]}
 })}
// The trading post: sell spare material for coins, buy things for your island and yourself.
// Coins also come from right answers in the practice rounds.
const PRICE={hout:2,steen:3,planken:5};
const GOODS=[
 {id:'koekje',name:'Hondenkoekje',cost:5,text:'Bolle de hond wordt je maatje en loopt overal met je mee.',owned:()=>s.dogFriend,buy(){s.dogFriend=true;world.fauna?.befriend()}},
 {id:'bloembak',name:'Bloembak',cost:8,text:'Een bak vol bloemen. Plaats hem met Bouwen.',item:true},
 {id:'bankje',name:'Bankje',cost:12,text:'Een houten bank om op uit te rusten. Plaats hem met Bouwen.',item:true},
 {id:'vlag',name:'Vlag',cost:10,text:'Een wapperende vlag voor je eigen plek. Plaats hem met Bouwen.',item:true},
 {id:'rood',name:'Rode sjaal',cost:15,scarf:0xa3342a,text:'Een nieuwe kleur voor je sjaal.'},
 {id:'blauw',name:'Blauwe sjaal',cost:15,scarf:0x2f5d8c,text:'Een nieuwe kleur voor je sjaal.'},
 {id:'groen',name:'Groene sjaal',cost:15,scarf:0x4b7a3a,text:'Een nieuwe kleur voor je sjaal.'}
];
function shop(note=''){
 const m=mission(),need={hout:m?m[1]+Math.max(0,(m[4]||0)-s.planken):0,steen:m?m[2]:0,planken:m?(m[4]||0):0},names={hout:'Hout',steen:'Steen',planken:'Planken'};
 s.owned||={};
 const sell=Object.keys(PRICE).map(k=>{const spare=Math.max(0,s[k]-need[k]);
  return '<div class="meter">'+names[k]+' <b>'+s[k]+' in je rugzak'+(need[k]?' · '+need[k]+' nodig':'')+'</b></div><div class="row"><button data-sell="'+k+'" data-n="1"'+(s[k]?'':' disabled')+'>Verkoop 1 · '+PRICE[k]+' munten</button>'+(spare>1?'<button data-sell="'+k+'" data-n="'+spare+'">Verkoop '+spare+' over · '+spare*PRICE[k]+' munten</button>':'')+'</div>'}).join('');
 const buy=GOODS.map(o=>{const have=o.owned?o.owned():o.scarf?s.owned[o.id]:false,wearing=o.scarf&&s.scarf===o.scarf;
  return '<div class="meter">'+o.name+' <b>'+(o.item&&s.items[o.id]?s.items[o.id]+' in je rugzak · ':'')+(have&&!o.scarf?'in bezit':o.cost+' munten')+'</b></div><p class="small">'+o.text+'</p><div class="row">'+(have&&o.scarf?'<button data-wear="'+o.id+'"'+(wearing?' disabled':'')+'>'+(wearing?'Draag je nu':'Omdoen')+'</button>':have&&!o.item?'':'<button data-buy="'+o.id+'"'+((s.munten||0)<o.cost?' disabled':'')+'>Koop · '+o.cost+'</button>')+'</div>'}).join('');
 show('<small>HANDELSPOST · KOOPVROUW</small><h2>Wies</h2><p>“'+(note||'Welkom! Ik koop je overgebleven hout, steen en planken. En wie goed oefent, verdient bij mij altijd wat.')+'”</p><div class="meter">Munten <b>'+(s.munten||0)+'</b></div><h3>Verkopen</h3>'+sell+'<h3>Kopen</h3>'+buy+(s.scarf?'<div class="row"><button id="ochre">Oker sjaal weer om</button></div>':'')+'<div class="row"><button id="endTalk">Gesprek sluiten</button></div>');
 $('endTalk').onclick=closePanel;if($('ochre'))$('ochre').onclick=()=>{s.scarf=null;world.scarf(null);persist();shop('Die okerkleurige staat je ook goed.')};
 document.querySelectorAll('[data-sell]').forEach(b=>b.onclick=()=>{const k=b.dataset.sell,n=Math.min(+b.dataset.n,s[k]);if(!n)return;const short=s[k]-n<need[k];s[k]-=n;coin(n*PRICE[k]);persist();updateHUD();shop(short?'Afgesproken. Let op: dit had je nog nodig voor de missie.':'Afgesproken, '+n*PRICE[k]+' munten voor jou.')});
 document.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{const o=GOODS.find(x=>x.id===b.dataset.buy);if((s.munten||0)<o.cost)return;s.munten-=o.cost;
  if(o.item){s.items[o.id]=(s.items[o.id]||0)+1}else if(o.scarf){s.owned[o.id]=true;s.scarf=o.scarf;world.scarf(o.scarf)}else o.buy();persist();updateHUD();
  shop(o.id==='koekje'?'Kijk eens hoe blij Bolle is! Hij loopt nu met je mee.':o.item?'Alsjeblieft. Je vindt hem bij Bouwen.':'Die staat je prachtig!')});
 document.querySelectorAll('[data-wear]').forEach(b=>b.onclick=()=>{const o=GOODS.find(x=>x.id===b.dataset.wear);s.scarf=o.scarf;world.scarf(o.scarf);persist();shop('Die staat je prachtig!')})
}
// Sawing: one log becomes one plank for every right answer.
function sawPlanks(){const m=mission();
 if(!s.hout){notify('Hak eerst hout om planken van te zagen.');workshop();return}
 askOne(subject(),{kicker:'BRUGWERF · ZAGEN',title:'Zaag een plank · '+s.planken+' van '+m[4],lead:'Een goed antwoord is een rechte zaagsnede.'},ok=>{
  if(ok){s.hout--;s.planken++;world.reach()}persist();const more=s.planken<m[4]&&s.hout>0;
  return {head:ok?'Strak gezaagd! +1 plank':'Scheef gezaagd. Probeer opnieuw',buttons:more?[['Volgende plank',sawPlanks,true],['Naar de werkplaats',workshop]]:[['Naar de werkplaats',workshop,true]]}
 })}
function workshop(){let m=mission();if(!m)return;
 const tools=missionTools[s.stage].filter(id=>!s.tools[id]),enough=s.hout>=m[1]&&s.steen>=m[2]&&s.planken>=(m[4]||0)&&!tools.length&&(s.stage!==2||s.rings.length===3);
 const meters=(m[1]?'<div class="meter">Hout <b>'+s.hout+' / '+m[1]+'</b></div>':'')+(m[4]?'<div class="meter">Planken <b>'+s.planken+' / '+m[4]+'</b></div>':'')+'<div class="meter">Steen <b>'+s.steen+' / '+m[2]+'</b></div>'+missionTools[s.stage].map(id=>'<div class="meter">'+TOOLS[id].name+' <b>'+(s.tools[id]?'in je rugzak':'nog halen bij '+houseOf(TOOLS[id].owner).name)+'</b></div>').join('')+(s.stage===2?'<div class="meter">Windringen <b>'+s.rings.length+' / 3</b></div>':'')+'<div class="meter">Instructies opgelost <b>'+s.seals+' / '+m[3]+'</b></div>';
 const saw=m[4]&&s.planken<m[4]?(s.tools.zaag?'<button class="primary" id="saw">Planken zagen · '+s.hout+' hout</button>':'<p>Voor planken heb je de zaag van '+houseOf('bram').name+' nodig.</p>'):'';
 show('<small>WERKPLAATS · '+area().name.toUpperCase()+'</small><h2>'+m[0]+'</h2><p>'+(s.stage===2?'Spring door de drie gouden windringen en stel het baken af met de opdrachten.':'Verzamel het materiaal en los opdrachten op voor de werkplaats. Daarna kun je de brug echt oversteken.')+'</p>'+meters+(saw?'<div class="row">'+saw+'</div>':'')+(enough?'<div class="row"><button class="primary" id="work">'+(s.seals>=m[3]?'Reparatie uitvoeren':(profile==='Floor'?'Oefen Nederlands':'Oefen Duits'))+'</button>'+(s.seals<m[3]&&profile==='Niek'?'<button id="historyMission">Oefen geschiedenis</button><button id="dutchMission">Oefen Nederlands</button>':'')+'</div>':'<p>Volg de pijl op je kompas om verder te komen.</p>')+buttons());back();
 if($('saw'))$('saw').onclick=sawPlanks;
 if($('dutchMission'))$('dutchMission').onclick=()=>dutchRound(true);
 if($('historyMission'))$('historyMission').onclick=()=>historyQuestion(null,true);
 if(enough)$('work').onclick=()=>s.seals>=m[3]?finishMission():profile==="Floor"?dutchRound(true):exercise(true)}
function finishMission(){let m=mission();if(!m||s.seals<m[3]||s.hout<m[1]||s.steen<m[2]||s.planken<(m[4]||0)||missionTools[s.stage].some(id=>!s.tools[id])||s.stage===2&&s.rings.length!==3)return;s.hout-=m[1];s.steen-=m[2];s.planken-=m[4]||0;s.stage++;s.seals=0;world.sync(s);persist();closePanel();notify({1:'Brug gereed! Steek over naar de Bloesemvallei.',2:'Zwever vrijgespeeld! Spring en druk in de lucht opnieuw op Spring.',3:'Het baken brandt! De windroute is weer open.',4:'De molen draait weer!',5:'De kraan hijst weer stenen!',6:'Het signaalvuur brandt op de Valkenrots!'}[s.stage]);
 if(s.stage===3){show('<small>LEVEL 1 VOLTOOID</small><h2>De windroute is open!</h2><p>'+profile+', het sterrenbaken schijnt weer boven de archipel.</p><p>In level 2 herstel je de verre eilanden: de molen op de Molenhoeve, de kraan in de Steengroeve en het signaalvuur op de Valkenrots. Gerrit, Anke en Joost helpen je aan het gereedschap.</p><div class="row"><button id="lvl2" class="primary">Start level 2</button><button id="back">Eerst vrij bouwen</button></div>');back();$('lvl2').onclick=startLevel2}
 if(s.stage===6){show('<small>ALLE LEVELS VOLTOOID</small><h2>De archipel bloeit!</h2><p>'+profile+', de molen draait, de kraan hijst en het signaalvuur brandt. Je hebt alle zes de missies volbracht.</p><p>Je kunt vrij verder bouwen en tijdritten vliegen. Opnieuw beginnen kan via je logboek.</p>'+buttons());back()}}
function startLevel2(){s.level=2;persist();closePanel();notify('Level 2 begonnen: herstel de molen op de Molenhoeve.');updateHUD()}
function restartGame(){show('<small>OPNIEUW BEGINNEN</small><h2>Weet je het zeker?</h2><p>Alle voortgang van '+profile+' wordt gewist: missies, grondstoffen, gereedschap, munten en gebouwde spullen. Je begint weer bij level 1 op Windhaven.</p><div class="row"><button id="wipe" class="primary">Ja, begin opnieuw</button><button id="back">Nee, terug</button></div>');back();
 $('wipe').onclick=()=>{try{localStorage.removeItem(key())}catch{}restore();persist();closePanel();notify('Een nieuw begin! Bram en Mara helpen je aan een bijl en een houweel.')}}
function school(){
 show('<small>DUITS · HOOFDSTUK 7</small><h2>Toetstraining</h2><p>Kies een onderdeel of oefen alles door elkaar. De toets bevat ook een onbekende leestekst.</p><div id="subjects"></div><div class="row"><button id="mix">Gemengde training</button><button id="reference">Bekijk de leerlijst</button></div>'+buttons());back();
 German.groups.forEach((name,i)=>{const b=document.createElement('button');b.textContent=name;b.onclick=()=>exercise(false,i);$('subjects').append(b)});$('mix').onclick=()=>exercise(false);$('reference').onclick=learnList
}
function learnList(){
 show('<small>HOOFDSTUK 7</small><h2>Leerlijst</h2><div id="lists"></div><div class="row"><button id="training">Naar de training</button></div>');
 German.groups.forEach((name,i)=>{
  const section=document.createElement('details'),summary=document.createElement('summary');
  const cards=German.bank.filter(q=>q.skill===i);summary.textContent=name+' ('+cards.length+')';section.append(summary);
  for(const q of cards){const row=document.createElement('div'),prompt=document.createElement('span'),answer=document.createElement('b');row.className='studyline';prompt.textContent=q.sentence;answer.textContent=q.correct;row.append(prompt,answer);section.append(row)}
  $('lists').append(section)
 });$('training').onclick=school
}
function exercise(mission,skill=null){
 const q=German.next(s.log,skill);
 const instructions=['Schrijf het Duitse woord. Neem bij een zelfstandig naamwoord het lidwoord over.','Geef de Nederlandse vertaling, inclusief het lidwoord als dat erbij hoort.','Geef de Nederlandse betekenis.','Schrijf de hele zin of afsluiting in het Duits.','Vul het Duitse voorzetsel in.','Schrijf de juiste Duitse vorm. Let op sie en Sie.'];
 show('<small>HOOFDSTUK 7 · '+German.groups[q.skill]+'</small><h2>'+(mission?'Werkinstructie':'Toetstraining')+'</h2><div class="question"></div><p>'+(q.task||instructions[q.skill])+'</p><form id="answer"><input id="word" required autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Jouw antwoord"><div id="letters"></div><div class="row"><button class="primary">Controleer antwoord</button></div></form>'+buttons());back();
 document.querySelector('.question').textContent=q.sentence;
 const input=$('word');
 if(q.language==='de')for(const ch of ['ä','ö','ü','ß','Ä','Ö','Ü']){const b=document.createElement('button');b.type='button';b.textContent=ch;b.onclick=()=>{input.setRangeText(ch,input.selectionStart,input.selectionEnd,'end');input.focus()};$('letters').append(b)}
 $('answer').onsubmit=e=>{e.preventDefault();const reply=input.value,ok=German.accepts(q,reply);German.record(s.log,q,ok);if(ok&&mission)s.seals++;if(ok&&!mission)coin();persist();
 show('<small>'+(ok?'INSTRUCTIE BEGREPEN':'HERHALING INGEPLAND')+'</small><h2>'+(ok?'Helemaal goed!':'Kijk nog even mee')+'</h2><p class="source"></p><div class="question"></div><p class="youranswer"></p><p class="why"></p><div class="row"><button id="continue" class="primary">'+(mission&&s.seals>=mission()[3]?'Naar de reparatie':'Volgende opdracht')+'</button></div>'+buttons());
 document.querySelector('.source').textContent=q.sentence;document.querySelector('.question').textContent=q.correct;document.querySelector('.youranswer').textContent=ok?'':'Jouw antwoord: '+reply;document.querySelector('.why').textContent=(!ok&&German.nearMiss(q,reply)?'Bijna goed, alleen de hoofdletters kloppen niet. In het Duits krijgt elk zelfstandig naamwoord een hoofdletter, net als de beleefde vorm Sie. ':'')+q.why;back();
 $('continue').onclick=()=>mission&&s.seals>=mission()[3]?workshop():exercise(mission,skill)};
 if(!matchMedia('(pointer:coarse)').matches)input.focus()
}
function clearPlacement(){placement=null;if(preview){preview.traverse(o=>{if(o.isMesh)o.material.dispose()});world.scene.remove(preview);preview=null}}
function chooseBuild(){if(currentRoom||!playing||$('panel').open)return;if(placement){clearPlacement();updateHUD();return}
 show('<small>BOUWBOEK</small><h2>Eigen bouwwerken</h2><p>Kies een ontwerp. Loop naar een vrije plek en plaats het met E of de plaatsknop. Bouwblokken kun je beklimmen en stapelen.</p><div class="row"><button id="crate">Bouwblok · 1 hout</button><button id="lamp">Lantaarn · 1 steen</button>'+['bloembak','bankje','vlag'].filter(k=>s.items[k]).map(k=>'<button data-item="'+k+'">'+k[0].toUpperCase()+k.slice(1)+' · '+s.items[k]+' over</button>').join('')+'</div><p>In je rugzak: '+s.hout+' hout en '+s.steen+' steen. Bloembakken, bankjes en vlaggen koop je in de handelspost.</p>'+buttons());back();
 document.querySelectorAll('[data-item]').forEach(b=>b.onclick=()=>choose(b.dataset.item));
 function choose(type){if(['blok','lamp'].includes(type)?s[type==='blok'?'hout':'steen']<1:!s.items[type]){notify('Verzamel eerst materiaal.');closePanel();return}placement=type;preview=world.construction(0,0,0,type,world.scene);preview.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.transparent=true;o.material.opacity=.48}});closePanel()}
 $('crate').onclick=()=>choose('blok');$('lamp').onclick=()=>choose('lamp')}
function site(){let x=Math.round((p.x-Math.sin(p.heading)*2.9)/2)*2,z=Math.round((p.z-Math.cos(p.heading)*2.9)/2)*2,y=world.ground(x,z,s);
 let near=[...world.nodes,...repair,...world.gates].some(o=>Math.hypot(o.x-x,o.z-z)<3);let valid=area()&&world.islands.some(i=>Math.hypot(x-i.x,z-i.z)<i.r-2)&&y>=world.liftAt(x,z)-.01&&y<=p.y+1.23&&!near&&!world.blocked(x,z,s,y,placement==='blok'?1.40:.55)&&!s.builds.some(b=>b.x===x&&b.z===z&&b.type==='lamp');
 return {x,y,z,valid}}
function place(){let b=site();if(!b.valid){notify('Zoek een vrije plek op het eiland.');return}const item=!['blok','lamp'].includes(placement);let material=placement==='blok'?'hout':'steen';if(item?!s.items[placement]:!s[material]){clearPlacement();return}
 s.builds.push({x:b.x,y:b.y,z:b.z,type:placement});if(item)s.items[placement]--;else s[material]--;clearPlacement();world.sync(s);persist();updateHUD();notify('Bouwwerk geplaatst')}
function logbook(){show('<small>VLUCHTLOG · '+profile.toUpperCase()+'</small><h2>Jouw expeditie</h2><p>'+(s.stage<3?'Level 1: '+s.stage+' van 3 missies voltooid.':(s.level||1)<2?'Level 1 voltooid. Level 2 staat klaar.':s.stage>=6?'Alle levels voltooid.':'Level 2: '+(s.stage-3)+' van 3 missies voltooid.')+' Per vaardigheid zie je hoeveel antwoorden goed waren van alle pogingen.</p>'+(profile==='Niek'?German.groups.map((g,i)=>{let entries=Object.values(s.log.items).filter(e=>German.bank[e.id].skill===i);return '<div class="meter">'+g+'<b>'+entries.reduce((a,e)=>a+e.good,0)+' / '+entries.reduce((a,e)=>a+e.attempts,0)+'</b></div>'}).join('')+'<p>'+Object.values(s.log.items).filter(e=>e.due!==null).length+' opdrachten staan klaar voor herhaling.</p>':'<p>Duits en geschiedenis worden toegevoegd zodra je havo 3-stof er is.</p>')+dutchStats()+(s.best?'<p>Persoonlijk record windrace: '+s.best.toFixed(1)+' seconden.</p>':'')+'<h3>Dorpsonderzoeken</h3>'+villageHomes.map(h=>'<div class="meter">'+h.place+' · '+h.name+'<b>'+(s.village?.[h.key]?'Afgerond':'Open')+'</b></div>').join('')+'<div class="row"><button id="practice">Oefen Duits</button><button id="historyLog">Oefen geschiedenis</button><button id="practiceNL">Oefen Nederlands</button><button id="pilot">Wissel personage</button>'+(s.stage===3&&(s.level||1)<2?'<button id="lvl2" class="primary">Start level 2</button>':'')+'<button id="restart">Opnieuw beginnen</button></div><p><a href="art/credits.txt" target="_blank" rel="noopener">Makers van de 3D-beelden</a></p>'+buttons());back();$('practiceNL').onclick=()=>dutchRound(false);if($('lvl2'))$('lvl2').onclick=startLevel2;$('restart').onclick=restartGame;$('practice').disabled=$('historyLog').disabled=profile==='Floor';$('practice').onclick=school;$('historyLog').onclick=historyMenu;$('pilot').onclick=()=>{persist();playing=false;clearPlacement();$('panel').close();$('hud').hidden=true;$('entry').hidden=false}}
$('journal').onclick=logbook;$('mapbtn').onclick=()=>{show('<small>ATLAS · NOORD ↑</small><h2>De windroute</h2><canvas id="atlas" width="600" height="420" aria-label="Kaart met eilanden, bruggen en je positie"></canvas>'+[2,1,0].map(i=>'<div class="mapline"><b>'+world.islands[i].name+'</b><span>'+['Houthaven en molen · vertrekpunt','Bloesembos en tweede brugwerf','Windringen en sterrenbaken'][i]+' · '+(area()===world.islands[i]?'Je bent hier':i<=s.stage?'Bereikbaar':'Brug nodig')+'</span></div>').join('')+buttons());drawAtlas();back()};
$('act').onclick=act;$('build').onclick=chooseBuild;function jump(){if(currentRoom)return;if(p.on){p.vy=7.8;p.on=false}else if(s.stage>=2&&p.y>.35){p.glide=!p.glide;if(p.glide)notify('Zwever open · stuur met je gewone besturing')}}$('jump').onclick=jump;
// Physical keys (e.code) keep WASD working with Shift, Caps Lock or another layout. Synthetic test events without a code fall back to e.key.
const codeNames={KeyW:'w',KeyA:'a',KeyS:'s',KeyD:'d',KeyE:'e',KeyB:'b',KeyM:'m',ArrowUp:'arrowup',ArrowDown:'arrowdown',ArrowLeft:'arrowleft',ArrowRight:'arrowright',Space:' ',ShiftLeft:'shift',ShiftRight:'shift',Escape:'escape'};
const keyName=e=>codeNames[e.code]||(e.key||'').toLowerCase();
// A key release that never reaches the page (context menu, Alt menu, tab switch) used to leave the pilot walking. Drop all input then.
function releaseControls(){keys.clear();joyX=joyZ=0;$('joy').firstElementChild.style.transform=''}
window.addEventListener('keydown',e=>{if(!playing||$('panel').open)return;if(e.ctrlKey||e.metaKey||e.altKey){releaseControls();return}let k=keyName(e);if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();keys.add(k);if(e.repeat)return;if(k===' ')jump();if(k==='e')act();if(k==='b')chooseBuild();if(k==='m')$('mapbtn').click();if(k==='escape')clearPlacement()});
window.addEventListener('keyup',e=>{const k=keyName(e);keys.delete(k);keys.delete((e.key||'').toLowerCase());if(k===' '&&playing&&!$('panel').open)e.preventDefault();if(['Alt','Meta','Control','OS'].includes(e.key))releaseControls()});
window.addEventListener('blur',()=>{releaseControls();persist()});window.addEventListener('pagehide',persist);
document.addEventListener('visibilitychange',()=>{if(document.hidden)releaseControls()});
window.addEventListener('contextmenu',e=>{releaseControls();if(playing&&!$('panel').open)e.preventDefault()});
// A clicked HUD button keeps focus; Space would then press it again instead of only jumping.
$('hud').addEventListener('click',e=>{const b=e.target.closest('button');if(b&&e.detail)b.blur()});
const joy=$('joy');function stick(e){let b=joy.getBoundingClientRect(),x=(e.clientX-b.left-b.width/2)/36,z=(e.clientY-b.top-b.height/2)/36,l=Math.max(1,Math.hypot(x,z));joyX=x/l;joyZ=z/l;joy.firstElementChild.style.transform='translate('+joyX*25+'px,'+joyZ*25+'px)'}
function releaseStick(){joyX=joyZ=0;joy.firstElementChild.style.transform=''}
joy.onpointerdown=e=>{try{joy.setPointerCapture(e.pointerId)}catch{}stick(e)};joy.onpointermove=e=>{if(joy.hasPointerCapture(e.pointerId))stick(e)};joy.onlostpointercapture=joy.onpointerup=joy.onpointercancel=releaseStick;
const canvas=$('world');canvas.onpointerdown=e=>{if(playing){canvas.setPointerCapture(e.pointerId);drag=[e.clientX,e.clientY]}};canvas.onpointermove=e=>{if(!drag)return;const orbit=(e.clientX-drag[0])*.007;view.yaw-=orbit;if(movementYaw!==null)movementYaw-=orbit;followHeading=null;view.height=Math.min(10,Math.max(3,view.height+(e.clientY-drag[1])*.035));drag=[e.clientX,e.clientY]};canvas.onlostpointercapture=()=>drag=null;canvas.onwheel=e=>{view.dist=Math.max(5,Math.min(13,view.dist+e.deltaY*.01))};
function move(dt){
 // Riding the cable car: the gondola carries you, steering is off until you arrive.
 if(ride){ride.t+=dt;const k=Math.min(1,ride.t/ride.dur),e=k*k*(3-2*k),f=ride.from?1-e:e,c=world.cable.at(f);
  Object.assign(p,{x:c.x,y:c.y-4.05,z:c.z,vy:0,on:true,speed:0,glide:false});world.cable.gondola.userData.f=f;
  if(k>=1){const st=ride.from?world.cable.a:world.cable.b,o=ride.from?world.cable.b:world.cable.a,dx=st.x-o.x,dz=st.z-o.z,l=Math.hypot(dx,dz);
   Object.assign(p,{x:st.x+dx/l*2.6,z:st.z+dz/l*2.6,y:world.ground(st.x+dx/l*2.6,st.z+dz/l*2.6,s,st.y+world.liftAt(st.x,st.z)+3),heading:Math.atan2(-dx,-dz)});p.ride=false;ride=null;resetSteering();updateHUD()}
  return}
 // Keep a harvested pile from rematerialising around a pilot standing in its footprint.
 for(const n of world.nodes){
  const due=s.harvest[n.i];
  if(!due)continue;const now=Date.now();
  if(due>now&&due<now+300&&dist(n)<1.97&&p.y<1.8)s.harvest[n.i]=now+600;
  else if(due<=now)delete s.harvest[n.i];
 }
 // Steering: W/S (or the stick up/down) walk forward and back along the pilot's own heading, A/D (or the stick
 // left/right) turn. Letting go of a turn key keeps the new direction; dragging the view while walking steers too.
 const clamp=v=>Math.max(-1,Math.min(1,v));
 const turn=clamp(joyX+Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft')));
 const drive=clamp(-joyZ+Number(keys.has('w')||keys.has('arrowup'))-Number(keys.has('s')||keys.has('arrowdown')));
 if(Math.abs(turn)>.05)p.heading-=turn*dt*(Math.abs(drive)>.05?2.3:2.9);
 if(drag&&drive>.05)p.heading=view.yaw;
 p.speed=Math.max(Math.abs(drive),Math.abs(turn)*.3);
 if(p.speed>.03){
  if(!drag)followHeading=p.heading;p.walk+=dt*9*p.speed;
  const speed=(keys.has('shift')?9.2:6.2)*(drive<0?.6:1)*drive,vx=-Math.sin(p.heading)*speed,vz=-Math.cos(p.heading)*speed;
  const stuck=currentRoom&&world.blocked(p.x,p.z,s,p.y);if(stuck||!world.blocked(p.x+vx*dt,p.z,s,p.y))p.x+=vx*dt;if(stuck||!world.blocked(p.x,p.z+vz*dt,s,p.y))p.z+=vz*dt}
 // The glider only drifts forward while you steer; let go and it sinks slowly in place.
 if(p.glide&&p.speed>.03){let gx=p.x-Math.sin(p.heading)*dt*2.6,gz=p.z-Math.cos(p.heading)*dt*2.6;if(!world.blocked(gx,gz,s,p.y)){p.x=gx;p.z=gz}else p.glide=false}let floor=world.ground(p.x,p.z,s,p.y);p.vy-=20*dt;if(p.glide)p.vy=Math.max(-1.15,p.vy);if(p.vy>0){let limit=world.ceiling(p.x,p.z,s,p.y,2.68)-2.68;if(p.y+p.vy*dt>limit){p.y=limit;p.vy=0}}p.y+=p.vy*dt;if(p.y<=floor&&p.vy<=0){p.y=floor;p.glide=false;p.vy=0;p.on=true}else if(p.on&&p.vy<=0&&!p.glide&&floor>p.y-.5&&floor>-50){p.y=floor;p.vy=0}else p.on=false;if(p.y<world.liftAt(p.x,p.z)-12)respawn();
 // Wind rings count when you pass through them, walking or jumping.
 const throughGate=g=>{const L=world.liftAt(g.x,g.z);return dist(g)<1.8&&p.y>L-.2&&p.y<L+4.4};
 if(s.stage===2)world.gates.forEach((g,i)=>{if(!s.rings.includes(i)&&throughGate(g)){s.rings.push(i);g.g.visible=false;notify('Windring gevonden · '+s.rings.length+'/3');persist()}});
 if(race){const g=world.gates[race.hit];if(throughGate(g)){g.g.visible=false;race.hit++;
 if(race.hit===3){let seconds=(performance.now()-race.start)/1000;s.best=Math.min(s.best??Infinity,seconds);s.hout+=2;s.steen++;race=null;persist();notify('Finish! '+seconds.toFixed(1)+' s · +2 hout en +1 steen')}else world.gates[race.hit].g.visible=true}}
 if(preview){let b=site();preview.position.set(b.x,Math.max(0,b.y),b.z);preview.visible=b.valid}
}
function drawAtlas(){
 const c=$('atlas'),ctx=c.getContext('2d');ctx.fillStyle='#c6e0df';ctx.fillRect(0,0,c.width,c.height);
 const px=x=>225+x*2.33,py=z=>345+z*2.33;
 ctx.setLineDash([4,6]);ctx.strokeStyle='#779e9c';for(let x=0;x<600;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,420);ctx.stroke()}ctx.setLineDash([]);
 world.islands.forEach((i,k)=>{ctx.beginPath();ctx.ellipse(px(i.x),py(i.z),i.r*2.33,i.r*2.33,0,0,Math.PI*2);ctx.fillStyle=['#9bc38d','#9fc79d','#b9cabb','#8fb47c','#b5cf8f','#c9c6a8','#a9c7a0'][k]||'#a9c7a0';ctx.fill();ctx.strokeStyle='#638c79';ctx.stroke();
 ctx.font=k<3?'bold 19px system-ui':'bold 15px system-ui';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='rgba(240,248,246,.85)';ctx.strokeText(i.name,px(i.x),py(i.z)+6);ctx.fillStyle='#204754';ctx.fillText(i.name,px(i.x),py(i.z)+6);ctx.textAlign='left'});
 world.bridges.forEach(b=>{if(b.stage)return;ctx.strokeStyle='#926b46';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(px(b.ax),py(b.az));ctx.lineTo(px(b.bx),py(b.bz));ctx.stroke()});
 for(let k=0;k<2;k++){ctx.strokeStyle=s.stage>k?'#926b46':'#70959e';ctx.lineWidth=5;ctx.setLineDash(s.stage>k?[]:[5,6]);ctx.beginPath();ctx.moveTo(px(0),py(world.ports[k]));ctx.lineTo(px(0),py(world.islands[k+1].z+21));ctx.stroke()}ctx.setLineDash([]);
 world.nodes.forEach(n=>{ctx.fillStyle=n.type==='hout'?'#915e36':'#52878c';ctx.fillRect(px(n.x)-3,py(n.z)-3,6,6)});
 for(const home of villageHomes){ctx.fillStyle='#a47336';ctx.fillRect(px(home.x)-4,py(home.z)-4,8,8)}
 const spot=currentRoom?outdoorPose:p;
 ctx.beginPath();ctx.arc(px(spot.x),py(spot.z),9,0,Math.PI*2);ctx.fillStyle='#ffb947';ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='#23444f';ctx.stroke();ctx.fillStyle='#204754';ctx.font='bold 16px system-ui';ctx.fillText('N ↑',26,32)
}
function visitHouse(room){
 outdoorPose={x:room.house.x,y:0,z:room.house.z+.95,yaw:view.yaw};currentRoom=room;world.enterRoom(room);
 clearPlacement();keys.clear();joyX=joyZ=0;resetSteering();view.yaw=0;
 Object.assign(p,{x:room.x,y:0,z:2.40,on:true,glide:false,vy:0,speed:0,heading:0});
 world.animate(performance.now()/1000,s,p,view,false,1);updateHUD();notify('Loop naar '+room.house.name+' en stel een vraag.')
}
function leaveHouse(){
 world.enterRoom(null);currentRoom=null;resetSteering();keys.clear();joyX=joyZ=0;
 Object.assign(p,{x:outdoorPose.x,y:0,z:outdoorPose.z,on:true,glide:false,vy:0,speed:0,heading:Math.PI});
 view.yaw=outdoorPose.yaw;world.animate(performance.now()/1000,s,p,view,false,1);persist();updateHUD()
}
function interview(){
 const h=currentRoom.house,known=s.village?.[h.key],heading='<small>'+h.place+' · '+h.role+'</small><h2>'+h.name+'</h2>';
 const leave='<div class="row"><button id="endTalk">Gesprek sluiten</button></div>';
 function render(html){show(heading+html+leave);$('endTalk').onclick=closePanel}
 function ask(){
  render('<p>'+h.task+'</p><div class="row">'+h.questions.map((q,i)=>'<button data-ask="'+i+'">'+q+'</button>').join('')+'</div>');
  document.querySelectorAll('[data-ask]').forEach(button=>button.onclick=()=>{
   const i=Number(button.dataset.ask);
   render('<p>“'+h.answers[i]+'”</p>'+(i===0?'<div class="question">'+h.check+'</div><div class="row">'+h.choices.map((c,j)=>'<button data-conclusion="'+j+'">'+c+'</button>').join('')+'</div>':'<button id="askAgain">Stel een andere vraag</button>'));
   if(i){$('askAgain').onclick=ask;return}
   document.querySelectorAll('[data-conclusion]').forEach(answer=>answer.onclick=()=>{
    if(Number(answer.dataset.conclusion)!==h.right){render('<p>Lees wat '+h.name+' zelf heeft gezien. Welke conclusie volgt daaruit?</p><button id="askAgain">Vraag het opnieuw</button>');$('askAgain').onclick=ask;return}
    s.village??={};const first=!s.village[h.key];s.village[h.key]=true;if(first)s.hout++;persist();
    render('<p>'+h.choices[h.right]+'</p><p>'+(first?'Onderzoek afgerond. Je krijgt één hout.':'Dit onderzoek staat in je logboek.')+'</p>')
   })
  })
 }
 if(h.shop){shop();return}
 // Residents with a tool offer it first; the research questions stay available.
 const offers=Object.keys(TOOLS).filter(k=>TOOLS[k].owner===h.key&&!s.tools[k]&&TOOLS[k].stage<=s.stage);
 function menu(){
  if(!offers.length){if(known){render('<p>'+h.choices[h.right]+'</p><button id="againTalk">Gesprek herhalen</button>');$('againTalk').onclick=ask}else ask();return}
  const id=offers[0],t=TOOLS[id];
  render('<p>“'+t.intro+'”</p><div class="meter">'+t.name+' <b>'+(s.toolProgress[id]||0)+' / '+t.need+' goed</b></div><p>'+t.use+'</p><div class="row"><button class="primary" id="toolGo">'+((s.toolProgress[id]||0)?'Ga verder met de opdracht':'Start de opdracht')+'</button><button id="research">'+(known?'Gesprek herhalen':'Dorpsonderzoek')+'</button></div>');
  $('toolGo').onclick=()=>toolQuest(id);$('research').onclick=()=>known?(render('<p>'+h.choices[h.right]+'</p><button id="againTalk">Gesprek herhalen</button>'),$('againTalk').onclick=ask):ask()
 }
 menu()
}
let hudAt=0,saveAt=0;function frame(now){let dt=Math.min(.06,(now-last)/1000||.016);last=now;if(playing&&!$('panel').open){let elapsed=Math.min(.25,(now-(frame.previous??now))/1000);while(elapsed>0){let step=Math.min(.025,elapsed);move(step);elapsed-=step}followCamera(dt)}frame.previous=now;if(now>hudAt){updateHUD();hudAt=now+140}if(now>saveAt){persist();saveAt=now+2000}if(playing)world.animate(now/1000,s,p,view,false,dt);requestAnimationFrame(frame)}
requestAnimationFrame(frame);

function updateProfileMenu(){
 const floor=profile==='Floor';
 $('school').disabled=$('history').disabled=floor;
 $('school').textContent=floor?'Duits · volgt':'Duits hoofdstuk 7';
 $('history').textContent=floor?'Geschiedenis · volgt':'Geschiedenis';
 const link=document.querySelector('.trainerLink');link.style.display=floor?'none':'';
 document.querySelector('.profilelabel').textContent=floor?'FLOOR · HAVO 3 · Duits en geschiedenis volgen':'NIEK · HAVO 2';
 try{sessionStorage.setItem('skybound.pupil',profile)}catch{}
}
$('dutch').onclick=()=>{start();if(playing)dutchRound(false)};
let remembered;try{remembered=sessionStorage.getItem('skybound.pupil')}catch{}
document.querySelector('[data-profile="'+(remembered==='Floor'?'Floor':'Niek')+'"]').click();
