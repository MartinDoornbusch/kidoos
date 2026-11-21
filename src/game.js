"use strict";
const $=id=>document.getElementById(id);
let world;
const newSave=()=>({version:1,stage:0,hout:0,steen:0,seals:0,rings:[],harvest:{},builds:[],log:{chapter:7,turn:0,items:{}},position:null});
let profile='Niek',s=newSave(),playing=false,context=null,guide=null,placement=null,preview=null,race=null,last=0,toastTimer,joyX=0,joyZ=0,drag=null;
const p={x:0,y:0,z:13,vy:0,heading:0,speed:0,walk:0,on:true},view={yaw:0,height:3.9,dist:6.9},keys=new Set();
let currentRoom=null, outdoorPose=null;
let movementYaw=null, followHeading=null;
function resetSteering(){movementYaw=null;followHeading=null}
function followCamera(dt){
 if(currentRoom||followHeading===null||drag)return;
 const delta=Math.atan2(Math.sin(followHeading-view.yaw),Math.cos(followHeading-view.yaw));
 view.yaw+=delta*(1-Math.exp(-5*dt))
}
const missions=[['Herstel de havenbrug',3,1,2],['Bouw de bergbrug',2,3,3],['Ontsteek het sterrenbaken',1,2,3]];
const repair=[{x:0,z:-21},{x:0,z:-81},{x:0,z:-130}];
const key=()=> 'studyquest.skybound.v1.'+(profile==='Floor'?'Nova':'Flint');
function persist(){if(!playing)return;try{s.position=currentRoom?{...outdoorPose}:{x:p.x,y:p.y,z:p.z,yaw:view.yaw};localStorage.setItem(key(),JSON.stringify(s))}catch{notify('Opslaan lukt niet in deze browser.')}}
function notify(str){$('toast').textContent=str;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').textContent='',3500)}
function dist(o){return Math.hypot(o.x-p.x,o.z-p.z)}
function area(){return world.islands.reduce((a,b)=>dist(a)<dist(b)?a:b)}
function restore(){currentRoom=null;world.enterRoom(null);resetSteering();world.outfit(profile==="Floor"?"Nova":"Flint");race=null;let data;try{data=JSON.parse(localStorage.getItem(key()))}catch{}s=data?.version===1?Object.assign(newSave(),data):newSave();
 if(s.log.chapter!==7){s.previousGermanLog=s.log;s.log={chapter:7,turn:0,items:{}}}
 let pos=s.position;Object.assign(p,{x:pos?.x??0,z:pos?.z??13,y:pos?.y??0,vy:0,speed:0,heading:pos?.yaw??0,on:false,glide:false});view.yaw=pos?.yaw??0;if(world.ground(p.x,p.z,s)<-20||world.blocked(p.x,p.z,s,p.y))respawn();world.sync(s)}
function respawn(){let anchor=world.islands[Math.min(s.stage,2)];Object.assign(p,{x:0,z:anchor.z+8,y:0,vy:0,on:true,speed:0,glide:false});if(playing)notify('Terug op vaste grond. Je uitrusting is mee.')}
function show(html){resetSteering();if(race&&!race.paused)race.paused=performance.now();keys.clear();joyX=joyZ=0;$('joy').firstElementChild.style.transform='';$('content').innerHTML=html;if(!$('panel').open)$('panel').showModal()}
$('panel').addEventListener('close',()=>{if(race?.paused){race.start+=performance.now()-race.paused;delete race.paused}keys.clear();if(document.activeElement&&document.activeElement!==document.body)document.activeElement.blur()});
function closePanel(){$('panel').close();updateHUD()}
function buttons(){return '<div class="row"><button id="back">Terug naar het eiland</button></div>'}
function back(){$('back').onclick=closePanel}
function start(){if(!world){try{world=createWorld($('world'));window.addEventListener('resize',world.resize)}catch(error){$('start').textContent='Spelwereld laden mislukt';console.error(error);return false}}playing=true;restore();$('entry').hidden=true;$('hud').hidden=false;world.animate(0,s,p,view,false,1);updateHUD();notify(s.log.turn||s.hout?'Welkom terug, '+profile+'!':'Loop naar de gemarkeerde houtstapel.')}
document.querySelectorAll('[data-profile]').forEach(b=>b.onclick=()=>{profile=b.dataset.profile;updateProfileMenu();world?.outfit(profile==="Floor"?"Nova":"Flint");document.querySelectorAll('[data-profile]').forEach(c=>c.classList.toggle('selected',c===b))});$('start').onclick=start;$('school').onclick=()=>{start();if(playing)school()};$('history').onclick=()=>{start();if(playing)historyMenu()};
function objective(){
 const m=missions[s.stage];if(!m)return race?{obj:world.gates[race.hit],name:'Tijdrit · windring '+(race.hit+1)}:null;
 let need=s.hout<m[1]?'hout':s.steen<m[2]?'steen':null;
 if(need){const list=world.nodes.filter(n=>n.type===need&&world.islands.findIndex(i=>Math.hypot(i.x-n.x,i.z-n.z)<i.r)<=s.stage&&!(s.harvest[n.i]-Date.now()>9e4));if(list.length)return {obj:list.sort((a,b)=>dist(a)-dist(b))[0],name:need==='hout'?'Houtstapel':'Steengroeve'}}
 if(s.stage===2&&s.rings.length<3)return {obj:world.gates.find((_,i)=>!s.rings.includes(i)),name:'Windring · spring'};
 return {obj:repair[s.stage],name:s.stage===2?'Baken':'Brugwerf'}
}
// Safety net: only when the current mission can no longer be finished does one pile regrow, so nobody gets stuck.
function replenish(){const m=missions[s.stage];if(!m||currentRoom)return;const now=Date.now(),home=Math.min(s.stage,2);
 for(const type of ['hout','steen']){if(s[type]>=(type==='hout'?m[1]:m[2]))continue;
  const here=world.nodes.filter(n=>n.type===type&&world.islands.findIndex(i=>Math.hypot(i.x-n.x,i.z-n.z)<i.r)<=home);
  if(!here.length||here.some(n=>!(s.harvest[n.i]>now)||s.harvest[n.i]-now<9e4))continue;
  const n=here.sort((a,b)=>dist(a)-dist(b))[0];s.harvest[n.i]=now+45000;persist();
  notify(type==='hout'?'Er groeit nieuw hout aan bij een houtstapel. Nog even geduld.':'Er komt nieuwe steen vrij bij een steengroeve. Nog even geduld.')}}
function updateHUD(){if(!playing)return;replenish();
 $('build').hidden=!!currentRoom;
 if(currentRoom){
  const {house,exit,npc}=currentRoom,nearExit=dist(exit)<1.35,nearNpc=dist(npc)<2.65;
  $('region').textContent=house.place;$('chapter').textContent='DORPSONDERZOEK';
  $('objective').textContent='Spreek met '+house.name;$('progress').textContent=s.village?.[house.key]?'Onderzoek afgerond':'Vraag de bewoner om een aanwijzing';
  $('inventory').textContent='Hout '+s.hout+' · Steen '+s.steen;
  context=nearNpc?{kind:'talk'}:nearExit?{kind:'leave'}:null;
  $('act').textContent=nearNpc?'Praat met '+house.name+' · E':nearExit?'Naar buiten · E':'';
  $('waypoint').textContent=nearExit?'Uitgang':house.name+' · '+Math.round(dist(npc))+' m';return
 }
let m=missions[s.stage];$('region').textContent=area().name;$('chapter').textContent=m?'EXPEDITIE  /  '+(s.stage+1)+' VAN 3':'EXPEDITIE VOLTOOID';
 $('objective').textContent=m?m[0]:'Vrije bouwvlucht';$('progress').textContent=m?'Hout '+Math.min(s.hout,m[1])+'/'+m[1]+' · Steen '+Math.min(s.steen,m[2])+'/'+m[2]+(s.stage===2?' · Ringen '+s.rings.length+'/3':''):(race?'Tijdrit · '+((performance.now()-race.start)/1000).toFixed(1)+' s · '+race.hit+'/3':'Bouw verder of start een tijdrit bij het baken.');
 $('inventory').textContent='Hout  '+s.hout+'   ·   Steen  '+s.steen;
 context=null;
 if(placement){context={kind:'place'};$('act').textContent='Plaatsen · E'}
 else {if(s.stage===3&&!race&&dist(repair[2])<4.6)context={kind:'race'};let r=repair[s.stage];if(r&&dist(r)<4.6)context={kind:'repair'};
 let n=world.nodes.filter(n=>!(s.harvest[n.i]>Date.now())&&dist(n)<3.4).sort((a,b)=>dist(a)-dist(b))[0];
 if(n&&(!context||(r&&dist(n)<dist(r))))context={kind:'resource',n};
 $('act').textContent=context?.kind==='resource'?(context.n.type==='hout'?'Hout verzamelen':'Steen delven')+' · E':context?.kind==='race'?'Start de windrace · E':context?'Werkplaats · E':''}
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
 if(context.kind==='resource'){harvest(context.n);return}
 workshop()}
// Taken is taken: a harvested pile stays gone (for about 30 years of play).
const GONE=1e12;
function harvest(n,touched=false){world.reach();s[n.type]+=2;s.harvest[n.i]=Date.now()+GONE;notify((touched?'Ring gepakt! ':'')+'+2 '+n.type);persist();updateHUD()}
// The golden ring above each pile is the pickup: touch the pile or jump into the ring to collect it.
function touchRings(){if(currentRoom)return;const now=Date.now();
 for(const n of world.nodes){if(s.harvest[n.i]>now)continue;if(Math.hypot(n.x-p.x,n.z-p.z)<2.05&&p.y<4){harvest(n,true);return}}}
function workshop(){let m=missions[s.stage];if(!m)return;
 let enough=s.hout>=m[1]&&s.steen>=m[2]&&(s.stage!==2||s.rings.length===3);
 show('<small>WERKPLAATS · '+area().name.toUpperCase()+'</small><h2>'+m[0]+'</h2><p>'+(s.stage===2?'Spring door de drie gouden windringen en stel het baken af met de opdrachten.':'Verzamel het materiaal en los opdrachten op voor de werkplaats. Daarna kun je de brug echt oversteken.')+'</p><div class="meter">Hout <b>'+s.hout+' / '+m[1]+'</b></div><div class="meter">Steen <b>'+s.steen+' / '+m[2]+'</b></div>'+(s.stage===2?'<div class="meter">Windringen <b>'+s.rings.length+' / 3</b></div>':'')+'<div class="meter">Instructies opgelost <b>'+s.seals+' / '+m[3]+'</b></div>'+(enough?'<div class="row"><button class="primary" id="work">'+(s.seals>=m[3]?'Reparatie uitvoeren':(profile==='Floor'?'Oefen Nederlands':'Oefen Duits'))+'</button>'+(s.seals<m[3]&&profile==='Niek'?'<button id="historyMission">Oefen geschiedenis</button><button id="dutchMission">Oefen Nederlands</button>':'')+'</div>':'<p>Volg de pijl op je kompas om verder te komen.</p>')+buttons());back();
 if($('dutchMission'))$('dutchMission').onclick=()=>dutchRound(true);
 if($('historyMission'))$('historyMission').onclick=()=>historyQuestion(null,true);
 if(enough)$('work').onclick=()=>s.seals>=m[3]?finishMission():profile==="Floor"?dutchRound(true):exercise(true)}
function finishMission(){let m=missions[s.stage];if(!m||s.seals<m[3]||s.hout<m[1]||s.steen<m[2]||s.stage===2&&s.rings.length!==3)return;s.hout-=m[1];s.steen-=m[2];s.stage++;s.seals=0;world.sync(s);persist();closePanel();notify(s.stage===3?'Het baken brandt! De windroute is weer open.':(s.stage===2?'Zwever vrijgespeeld! Spring en druk in de lucht opnieuw op Spring.':'Brug gereed! Steek over naar '+world.islands[s.stage].name+'.'));
 if(s.stage===3){show('<small>EXPEDITIE VOLTOOID</small><h2>De windroute is open!</h2><p>'+profile+', het sterrenbaken schijnt weer boven de archipel. Je kunt verder bouwen op alle drie de eilanden.</p>'+buttons());back()}}
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
 $('answer').onsubmit=e=>{e.preventDefault();const reply=input.value,ok=German.accepts(q,reply);German.record(s.log,q,ok);if(ok&&mission)s.seals++;persist();
 show('<small>'+(ok?'INSTRUCTIE BEGREPEN':'HERHALING INGEPLAND')+'</small><h2>'+(ok?'Helemaal goed!':'Kijk nog even mee')+'</h2><p class="source"></p><div class="question"></div><p class="youranswer"></p><p class="why"></p><div class="row"><button id="continue" class="primary">'+(mission&&s.seals>=missions[s.stage][3]?'Naar de reparatie':'Volgende opdracht')+'</button></div>'+buttons());
 document.querySelector('.source').textContent=q.sentence;document.querySelector('.question').textContent=q.correct;document.querySelector('.youranswer').textContent=ok?'':'Jouw antwoord: '+reply;document.querySelector('.why').textContent=(!ok&&German.nearMiss(q,reply)?'Bijna goed, alleen de hoofdletters kloppen niet. In het Duits krijgt elk zelfstandig naamwoord een hoofdletter, net als de beleefde vorm Sie. ':'')+q.why;back();
 $('continue').onclick=()=>mission&&s.seals>=missions[s.stage][3]?workshop():exercise(mission,skill)};
 if(!matchMedia('(pointer:coarse)').matches)input.focus()
}
function clearPlacement(){placement=null;if(preview){preview.traverse(o=>{if(o.isMesh)o.material.dispose()});world.scene.remove(preview);preview=null}}
function chooseBuild(){if(currentRoom||!playing||$('panel').open)return;if(placement){clearPlacement();updateHUD();return}
 show('<small>BOUWBOEK</small><h2>Eigen bouwwerken</h2><p>Kies een ontwerp. Loop naar een vrije plek en plaats het met E of de plaatsknop. Bouwblokken kun je beklimmen en stapelen.</p><div class="row"><button id="crate">Bouwblok · 1 hout</button><button id="lamp">Lantaarn · 1 steen</button></div><p>In je rugzak: '+s.hout+' hout en '+s.steen+' steen.</p>'+buttons());back();
 function choose(type){if(s[type==='blok'?'hout':'steen']<1){notify('Verzamel eerst materiaal.');closePanel();return}placement=type;preview=world.construction(0,0,0,type,world.scene);preview.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.transparent=true;o.material.opacity=.48}});closePanel()}
 $('crate').onclick=()=>choose('blok');$('lamp').onclick=()=>choose('lamp')}
function site(){let x=Math.round((p.x-Math.sin(p.heading)*2.9)/2)*2,z=Math.round((p.z-Math.cos(p.heading)*2.9)/2)*2,y=world.ground(x,z,s);
 let near=[...world.nodes,...repair,...world.gates].some(o=>Math.hypot(o.x-x,o.z-z)<3);let valid=area()&&world.islands.some(i=>Math.hypot(x-i.x,z-i.z)<i.r-2)&&y>=0&&y<=p.y+1.23&&!near&&!world.blocked(x,z,s,y,placement==='blok'?1.40:.55)&&!s.builds.some(b=>b.x===x&&b.z===z&&b.type==='lamp');
 return {x,y,z,valid}}
function place(){let b=site();if(!b.valid){notify('Zoek een vrije plek op het eiland.');return}let material=placement==='blok'?'hout':'steen';if(!s[material]){clearPlacement();return}
 s.builds.push({x:b.x,y:b.y,z:b.z,type:placement});s[material]--;clearPlacement();world.sync(s);persist();updateHUD();notify('Bouwwerk geplaatst')}
function logbook(){show('<small>VLUCHTLOG · '+profile.toUpperCase()+'</small><h2>Jouw expeditie</h2><p>'+s.stage+' van 3 missies voltooid. Per vaardigheid zie je hoeveel antwoorden goed waren van alle pogingen.</p>'+(profile==='Niek'?German.groups.map((g,i)=>{let entries=Object.values(s.log.items).filter(e=>German.bank[e.id].skill===i);return '<div class="meter">'+g+'<b>'+entries.reduce((a,e)=>a+e.good,0)+' / '+entries.reduce((a,e)=>a+e.attempts,0)+'</b></div>'}).join('')+'<p>'+Object.values(s.log.items).filter(e=>e.due!==null).length+' opdrachten staan klaar voor herhaling.</p>':'<p>Duits en geschiedenis worden toegevoegd zodra je havo 3-stof er is.</p>')+dutchStats()+(s.best?'<p>Persoonlijk record windrace: '+s.best.toFixed(1)+' seconden.</p>':'')+'<h3>Dorpsonderzoeken</h3>'+villageHomes.map(h=>'<div class="meter">'+h.place+' · '+h.name+'<b>'+(s.village?.[h.key]?'Afgerond':'Open')+'</b></div>').join('')+'<div class="row"><button id="practice">Oefen Duits</button><button id="historyLog">Oefen geschiedenis</button><button id="practiceNL">Oefen Nederlands</button><button id="pilot">Wissel personage</button></div><p><a href="art/credits.txt" target="_blank" rel="noopener">Makers van de 3D-beelden</a></p>'+buttons());back();$('practiceNL').onclick=()=>dutchRound(false);$('practice').disabled=$('historyLog').disabled=profile==='Floor';$('practice').onclick=school;$('historyLog').onclick=historyMenu;$('pilot').onclick=()=>{persist();playing=false;clearPlacement();$('panel').close();$('hud').hidden=true;$('entry').hidden=false}}
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
const canvas=$('world');canvas.onpointerdown=e=>{if(playing){canvas.setPointerCapture(e.pointerId);drag=[e.clientX,e.clientY]}};canvas.onpointermove=e=>{if(!drag||currentRoom)return;const orbit=(e.clientX-drag[0])*.007;view.yaw-=orbit;if(movementYaw!==null)movementYaw-=orbit;followHeading=null;view.height=Math.min(10,Math.max(3,view.height+(e.clientY-drag[1])*.035));drag=[e.clientX,e.clientY]};canvas.onlostpointercapture=()=>drag=null;canvas.onwheel=e=>{view.dist=Math.max(5,Math.min(13,view.dist+e.deltaY*.01))};
function move(dt){
 // Keep a harvested pile from rematerialising around a pilot standing in its footprint.
 for(const n of world.nodes){
  const due=s.harvest[n.i];
  if(!due)continue;const now=Date.now();
  if(due>now&&due<now+300&&dist(n)<1.97&&p.y<1.8)s.harvest[n.i]=now+600;
  else if(due<=now)delete s.harvest[n.i];
 }
 let dx=joyX+Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft')),dz=joyZ+Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup')),l=Math.max(1,Math.hypot(dx,dz));dx/=l;dz/=l;p.speed=Math.hypot(dx,dz);
 if(p.speed>.03){
  if(movementYaw===null)movementYaw=view.yaw;
  const vx=dx*Math.cos(movementYaw)+dz*Math.sin(movementYaw),vz=dz*Math.cos(movementYaw)-dx*Math.sin(movementYaw);
  p.heading=Math.atan2(-vx,-vz);if(!drag)followHeading=p.heading;p.walk+=dt*9*p.speed;let speed=keys.has('shift')?12:8;
 if(!world.blocked(p.x+vx*dt*speed,p.z,s,p.y))p.x+=vx*dt*speed;if(!world.blocked(p.x,p.z+vz*dt*speed,s,p.y))p.z+=vz*dt*speed}else movementYaw=null;
 // The glider only drifts forward while you steer; let go and it sinks slowly in place.
 if(p.glide&&p.speed>.03){let gx=p.x-Math.sin(p.heading)*dt*2.6,gz=p.z-Math.cos(p.heading)*dt*2.6;if(!world.blocked(gx,gz,s,p.y)){p.x=gx;p.z=gz}else p.glide=false}let floor=world.ground(p.x,p.z,s,p.y);p.vy-=20*dt;if(p.glide)p.vy=Math.max(-1.15,p.vy);if(p.vy>0){let limit=world.ceiling(p.x,p.z,s,p.y,2.68)-2.68;if(p.y+p.vy*dt>limit){p.y=limit;p.vy=0}}p.y+=p.vy*dt;if(p.y<=floor&&p.vy<=0){p.y=floor;p.glide=false;p.vy=0;p.on=true}else p.on=false;if(p.y< -12)respawn();
 touchRings();
 // Wind rings count when you pass through them, walking or jumping.
 const throughGate=g=>dist(g)<1.8&&p.y>-.2&&p.y<4.4;
 if(s.stage===2)world.gates.forEach((g,i)=>{if(!s.rings.includes(i)&&throughGate(g)){s.rings.push(i);g.g.visible=false;notify('Windring gevonden · '+s.rings.length+'/3');persist()}});
 if(race){const g=world.gates[race.hit];if(throughGate(g)){g.g.visible=false;race.hit++;
 if(race.hit===3){let seconds=(performance.now()-race.start)/1000;s.best=Math.min(s.best??Infinity,seconds);s.hout+=2;s.steen++;race=null;persist();notify('Finish! '+seconds.toFixed(1)+' s · +2 hout en +1 steen')}else world.gates[race.hit].g.visible=true}}
 if(preview){let b=site();preview.position.set(b.x,Math.max(0,b.y),b.z);preview.visible=b.valid}
}
function drawAtlas(){
 const c=$('atlas'),ctx=c.getContext('2d');ctx.fillStyle='#c6e0df';ctx.fillRect(0,0,c.width,c.height);
 const px=x=>225+x*2.33,py=z=>345+z*2.33;
 ctx.setLineDash([4,6]);ctx.strokeStyle='#779e9c';for(let x=0;x<600;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,420);ctx.stroke()}ctx.setLineDash([]);
 world.islands.forEach((i,k)=>{ctx.beginPath();ctx.ellipse(px(i.x),py(i.z),i.r*2.33,i.r*2.33,0,0,Math.PI*2);ctx.fillStyle=['#9bc38d','#9fc79d','#b9cabb'][k];ctx.fill();ctx.strokeStyle='#638c79';ctx.stroke();
 ctx.fillStyle='#204754';ctx.font='bold 22px system-ui';ctx.fillText(i.name,310,py(i.z)+6)});
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
 if(known){render('<p>'+h.choices[h.right]+'</p><button id="againTalk">Gesprek herhalen</button>');$('againTalk').onclick=ask}else ask()
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
