"use strict";
const $=id=>document.getElementById(id);
let world;
const newSave=()=>({version:1,stage:0,hout:0,steen:0,planken:0,seals:0,rings:[],harvest:{},yield:{},tools:{},toolProgress:{},munten:0,items:{},scarf:null,dogFriend:false,builds:[],log:{chapter:7,turn:0,items:{}},position:null});
let profile='Niek',s=newSave(),playing=false,context=null,guide=null,placement=null,preview=null,race=null,last=0,toastTimer,joyX=0,joyZ=0,drag=null;
const p={x:0,y:0,z:13,vy:0,heading:0,speed:0,walk:0,on:true},view={yaw:0,height:3.9,dist:6.9,look:0},keys=new Set();
let currentRoom=null, outdoorPose=null, ride=null, windNote=-1e9;
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
// Beheermodus (open the game with ?beheer): jump to any stage, fly, teleport and visit every house.
// Nothing is saved while it is on, so the children's progress stays untouched.
const admin={on:false,asked:/[?&](beheer|admin)\b/i.test(location.search),fly:false,hash:'9caefa318f0fca222dc0efb95e4587ef916a1a78395cf9aeb07a812fbbbe602d'};
// The pincode is checked against a salted SHA-256 hash, so the code itself never shows it.
function adminOpen(){if(admin.on){adminPanel();return}
 show('<small>BEHEERMODUS</small><h2>Pincode</h2><p>Voer de pincode in om de beheermodus te openen. Daarna wordt er in deze sessie niets meer opgeslagen.</p><form id="pinform" class="row"><input id="pin" type="password" inputmode="numeric" autocomplete="off" maxlength="8" aria-label="Pincode"><button class="primary">Openen</button></form><p id="pinmsg"></p>'+buttons());back();setTimeout(()=>$('pin')?.focus(),50);
 $('pinform').onsubmit=async e=>{e.preventDefault();let hex='';try{const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('skybound:'+$('pin').value.trim()));hex=[...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,'0')).join('')}catch{}
  if(hex===admin.hash){admin.on=true;admin.pin=$('pin').value.trim();notify('Beheermodus aan: er wordt niets meer opgeslagen.');adminPanel()}else{$('pinmsg').textContent='Die pincode klopt niet.';$('pin').value=''}}}
function adminPanel(){
 const st=[['Begin, alles dicht',0,1],['Havenbrug klaar',1,1],['Bergbrug klaar',2,1],['Baken brandt',3,1],['Level 2 gestart',3,2],['Molen draait',4,2],['Kraan hijst',5,2],['Alles klaar',6,2],['L3 gestart',6,3,0],['L3 · 2 fases',6,3,2],['L3 · 4 fases',6,3,4],['L3 klaar',6,3,5],['L4 ontwerp',6,4,-1],['L4 · 2 fases',6,4,2],['L4 · 4 fases',6,4,4],['L4 klaar',6,4,5]];
 const isl=world.islands.map((I,i)=>'<button data-go="'+i+'">'+I.name+'</button>').join('');
 const homes=world.rooms.map((r,i)=>'<button data-house="'+i+'">'+r.house.place+'</button>').join('');
 show('<small>BEHEERMODUS · WORDT NIET OPGESLAGEN</small><h2>Godmodus</h2><p>Alles wat je hier doet is tijdelijk. Ververs de pagina zonder <b>?beheer</b> om terug te gaan naar de echte voortgang.</p>'+
  '<div class="question">Voortgang (nu: stap '+s.stage+', level '+(s.level||1)+')</div><div class="row">'+st.map(([t,n,l],i)=>'<button data-stage="'+i+'">'+t+'</button>').join('')+'</div>'+
  '<div class="question">Uitrusting en vliegen</div><div class="row"><button id="admAll" class="primary">Alles tonen + al het gereedschap</button><button id="admRes">+50 van alles</button><button id="admFly">Vliegen '+(admin.fly?'uit':'aan')+'</button></div><p><small>Vliegen: W/S/A/D om te bewegen, spatie omhoog, C omlaag, Shift sneller. Je gaat door muren heen.</small></p>'+
  '<div class="question">Ouders</div><p>'+(Track.linked()?'Dit apparaat is gekoppeld aan het ouderoverzicht.':'Dit apparaat is nog niet gekoppeld. Koppel elk apparaat waarop de kinderen spelen één keer.')+'</p><div class="row"><button id="admOverview" class="primary">Ouderoverzicht</button><button id="admLink">'+(Track.linked()?'Ontkoppelen':'Dit apparaat koppelen')+'</button></div>'+
  '<div class="question">Naar een eiland</div><div class="row">'+isl+'<button id="admCable">Kabelbaanstation</button></div>'+
  '<div class="question">Binnen kijken</div><div class="row">'+homes+'</div>'+buttons());back();
 const setStage=(n,l,k)=>{s.stage=n;s.level=l;s.seals=0;if(l===4){const t=ConstructionCampaign.state(s,L3.id).ok?s:ConstructionCampaign.start(s,{id:L3.id,blueprintId:L3.blueprint,plotId:L3.plot,x:L3.x,z:L3.z}).save;s=t;s.constructionProjects=s.constructionProjects.map(p=>p.id===L3.id?{...p,completed:5}:p);
   if(k<0){s.constructionProjects=s.constructionProjects.filter(p=>p.id!==L4.id);if(s.constructionDesigns)delete s.constructionDesigns[L4.id];s.houseFurnitureStorage=[]}
   else{if(!houseInfo()){const d=houseDraft(),r=HousePlanner.begin(s,d,siteCtx(d));if(r.ok){s=r.save;delete s.houseDraft}}s.constructionProjects=s.constructionProjects.map(p=>p.id===L4.id?{...p,completed:k}:p)}s.constructionStudy={};houseView()}
  if(l===3){if(!ConstructionCampaign.state(s,L3.id).ok)s=ConstructionCampaign.start(s,{id:L3.id,blueprintId:L3.blueprint,plotId:L3.plot,x:L3.x,z:L3.z}).save;s.constructionProjects=s.constructionProjects.map(p=>p.id===L3.id?{...p,completed:k}:p);s.constructionStudy={}}world.sync(s);updateHUD()};
 document.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>{const [,n,l,k]=st[+b.dataset.stage];setStage(n,l,k);closePanel();notify('Beheer: '+st[+b.dataset.stage][0]+'.')});
 $('admOverview').onclick=parentOverview;$('admLink').onclick=linkThisDevice;
 $('admAll').onclick=()=>{setStage(6,2);Object.keys(TOOLS).forEach(k=>s.tools[k]=true);world.equip(s.tools);closePanel();notify('Beheer: alle bruggen, effecten en gereedschap staan aan.')};
 $('admRes').onclick=()=>{s.hout+=50;s.steen+=50;s.planken+=50;s.munten=(s.munten||0)+50;closePanel();notify('Beheer: 50 hout, steen, planken en munten erbij.')};
 $('admFly').onclick=()=>{admin.fly=!admin.fly;p.glide=false;closePanel();notify(admin.fly?'Vliegen aan: spatie omhoog, C omlaag.':'Vliegen uit.')};
 const go=(x,z)=>{if(currentRoom)leaveHouse();ride=null;p.ride=false;Object.assign(p,{x,z,y:world.ground(x,z,s)+.05,vy:0,on:true,glide:false,speed:0});resetSteering();closePanel();updateHUD()};
 document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{const I=world.islands[+b.dataset.go],g=I.gate;g?go(g.x+(I.x-g.x)/I.r*3,g.z+(I.z-g.z)/I.r*3):go(0,I.z+8)});
 $('admCable').onclick=()=>{const a=world.cable.a;go(a.x-1.5,a.z+1.8)};
 document.querySelectorAll('[data-house]').forEach(b=>b.onclick=()=>{const r=world.rooms[+b.dataset.house];if(currentRoom)leaveHouse();ride=null;p.ride=false;closePanel();visitHouse(r)})}
// Parent overview (beheermodus): practice and play time per day, results per subject and the weakest topics,
// merged from every linked device.
const snapshot=()=>({stage:s.stage,level:s.level||1,tower:(s.constructionProjects||[]).find(p=>p.id==='wachttoren')?.completed??null,house:(s.constructionProjects||[]).find(p=>p.id==='mijn-huis')?.completed??null,munten:s.munten||0,hout:s.hout,steen:s.steen,planken:s.planken,tools:Object.keys(s.tools).filter(k=>s.tools[k]).map(k=>TOOLS[k]?.name||k),village:Object.keys(s.village||{}).length,best:s.best||0});
async function parentOverview(){
 show('<small>OUDEROVERZICHT</small><h2>Oefentijd en voortgang</h2><p>Gegevens ophalen...</p>'+buttons());back();
 let res;try{res=await Track.overview(admin.pin)}catch(e){$('content').innerHTML='<small>OUDEROVERZICHT</small><h2>Niet gelukt</h2><p>'+(e.message==='opslag'?'De opslag op de server is nog niet ingesteld.':e.message==='pincode'?'De server accepteerde de pincode niet.':'Er is geen verbinding met de server.')+'</p>'+buttons();back();return}
 const m=v=>Math.round(v/60),pct=a=>a&&a[1]?Math.round(a[0]/a[1]*100)+'%':'nog geen',key=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
 const days=[...Array(14)].map((_,i)=>{const d=new Date();d.setHours(12);d.setDate(d.getDate()-13+i);return d}),wd=['zo','ma','di','wo','do','vr','za'];
 const fmt=t=>new Date(t).toLocaleString('nl-NL',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
 const table=(head,rows)=>'<table style="width:100%;border-collapse:collapse;font-size:13px;margin:.4em 0 1em"><tr>'+head.map(h=>'<th style="text-align:left;border-bottom:1px solid #c9b98f;padding:3px 4px">'+h+'</th>').join('')+'</tr>'+rows.map(r=>'<tr>'+r.map(c=>'<td style="padding:3px 4px;border-bottom:1px solid #eadfc4">'+c+'</td>').join('')+'</tr>').join('')+'</table>';
 function kid(name,k){
  if(!k)return '<h3>'+name+'</h3><p>Nog geen gegevens. Koppel het apparaat waarop '+name+' speelt via de beheermodus op dat apparaat.</p>';
  const v=d=>k.days[key(d)]||{play:0,practice:0,subj:{}},max=Math.max(60,...days.map(d=>v(d).practice+v(d).play));
  const bars='<div style="display:flex;gap:3px;align-items:flex-end;margin:.3em 0">'+days.map(d=>{const x=v(d);return '<div style="flex:1;text-align:center"><div style="height:80px;display:flex;flex-direction:column;justify-content:flex-end"><div style="height:'+Math.round(x.play/max*78)+'px;background:#d9c49a;border-radius:3px 3px 0 0"></div><div style="height:'+Math.round(x.practice/max*78)+'px;background:#2f6f6a"></div></div><div style="font-size:10px;line-height:1.2">'+wd[d.getDay()]+'<br>'+d.getDate()+'<br><b>'+m(x.practice)+'</b></div></div>'}).join('')+'</div>';
  const sum=list=>list.reduce((a,d)=>{const x=v(d);a.p+=x.practice;a.s+=x.play;for(const [sub,[ok,n]] of Object.entries(x.subj)){const t=a.subj[sub]??=[0,0];t[0]+=ok;t[1]+=n}return a},{p:0,s:0,subj:{}});
  const week=sum(days.slice(7)),all={};for(const x of Object.values(k.days))for(const [sub,[ok,n]] of Object.entries(x.subj)){const t=all[sub]??=[0,0];t[0]+=ok;t[1]+=n}
  const weak=Object.entries(k.skills).flatMap(([sub,sk])=>Object.entries(sk).map(([n,a])=>({sub,n,a}))).filter(x=>x.a[1]>=4).sort((x,y)=>x.a[0]/x.a[1]-y.a[0]/y.a[1]).slice(0,3);
  const g=k.game||{},lvl=g.stage<3?'level 1, missie '+(g.stage+1):g.stage===3&&g.level<2?'level 1 klaar':g.stage>=6?(g.level>=4?(g.house>=5?'alle levels klaar':g.house==null?'level 4, huis ontwerpen':'level 4, huis fase '+((g.house||0)+1)):g.level>=3?(g.tower>=5?'level 3 klaar':'level 3, wachttoren fase '+((g.tower||0)+1)):'level 2 klaar'):'level 2, missie '+(g.stage-2);
  return '<h3>'+name+'</h3><p>Laatst actief: '+(k.sessions[0]?fmt(k.sessions[0].end):'nog niet')+'. Nu in '+lvl+', met '+(g.tools?.length||0)+' gereedschap en '+(g.munten||0)+' munten'+(k.devices>1?' (op '+k.devices+' apparaten)':'')+'.</p>'+
   '<p><b>Deze week:</b> '+m(week.p)+' minuten oefenen en '+m(week.s)+' minuten spelen.</p>'+bars+
   '<p style="font-size:12px"><span style="display:inline-block;width:10px;height:10px;background:#2f6f6a"></span> oefenen (getal = minuten) <span style="display:inline-block;width:10px;height:10px;background:#d9c49a;margin-left:8px"></span> spelen</p>'+
   (Object.keys(all).length?table(['Vak','Vragen 7 dagen','Goed 7 dagen','Vragen totaal','Goed totaal'],Object.keys(all).map(sub=>[sub,week.subj[sub]?.[1]||0,pct(week.subj[sub]),all[sub][1],pct(all[sub])])):'<p>Nog geen vragen beantwoord.</p>')+
   (weak.length?'<p><b>Lastigste onderdelen:</b></p>'+table(['Vak','Onderdeel','Goed'],weak.map(x=>[x.sub,x.n,x.a[0]+' van '+x.a[1]+' ('+pct(x.a)+')'])):'')+
   (k.sessions.length?'<p><b>Laatste sessies:</b></p>'+table(['Start','Actief','Oefenen','Vragen','Goed'],k.sessions.slice(0,6).map(x=>[fmt(x.start),m(x.play+x.practice)+' min',m(x.practice)+' min',x.q,pct([x.ok,x.q])])):'')}
 $('content').innerHTML='<small>OUDEROVERZICHT · ALLE GEKOPPELDE APPARATEN</small><h2>Oefentijd en voortgang</h2><p>Alleen actieve tijd telt: na een minuut zonder toets of tik stopt de klok. Oefenen is de tijd waarin een vraag op het scherm staat.</p>'+kid('Niek',res.kids?.Niek)+kid('Floor',res.kids?.Floor)+buttons();back()}
async function linkThisDevice(){const b=$('admLink');if(Track.linked()){Track.unlink();notify('Dit apparaat is ontkoppeld.');adminPanel();return}
 b.disabled=true;b.textContent='Koppelen...';try{await Track.linkDevice(admin.pin);notify('Gekoppeld. Ververs de pagina zonder ?beheer om te spelen; de oefentijd wordt dan bijgehouden.');adminPanel()}
 catch(e){b.disabled=false;b.textContent='Dit apparaat koppelen';notify(e.message==='opslag'?'De opslag op de server is nog niet ingesteld.':e.message==='pincode'?'Pincode niet geaccepteerd.':'Geen verbinding met de server.')}}
const houseOf=key=>world.rooms.find(r=>r.house.key===key).house;
const repair=[{x:0,z:-21},{x:0,z:-81},{x:0,z:-130},{x:-63.5,z:-63.5},{x:56.5,z:-84},{x:63,z:-128}];
const key=()=> 'studyquest.skybound.v1.'+(profile==='Floor'?'Nova':'Flint');
function persist(){if(!playing||admin.on)return;try{s.position=currentRoom?{...outdoorPose}:{x:p.x,y:p.y,z:p.z,yaw:view.yaw};localStorage.setItem(key(),JSON.stringify(s))}catch{notify('Opslaan lukt niet in deze browser.')}}
function notify(str){$('toast').textContent=str;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').textContent='',3500)}
function dist(o){return Math.hypot(o.x-p.x,o.z-p.z)}
function area(){return world.islands.reduce((a,b)=>dist(a)<dist(b)?a:b)}
function restore(){Track.save();Track.load(profile);currentRoom=null;world.enterRoom(null);resetSteering();world.outfit(profile==="Floor"?"Nova":"Flint");race=null;let data;try{data=JSON.parse(localStorage.getItem(key()))}catch{}s=data?.version===1?Object.assign(newSave(),data):newSave();
 if(s.log.chapter!==7){s.previousGermanLog=s.log;s.log={chapter:7,turn:0,items:{}}}
 let pos=s.position;Object.assign(p,{x:pos?.x??0,z:pos?.z??13,y:pos?.y??0,vy:0,speed:0,heading:pos?.yaw??0,on:false,glide:false});view.yaw=pos?.yaw??0;if(world.ground(p.x,p.z,s)<-20||world.blocked(p.x,p.z,s,p.y))respawn();world.sync(s);world.equip(s.tools);world.scarf(s.scarf);if(s.dogFriend)world.fauna?.befriend()}
function respawn(){let anchor=world.islands[Math.min(s.stage,2)];Object.assign(p,{x:0,z:anchor.z+8,y:world.ground(0,anchor.z+8,s),vy:0,on:true,speed:0,glide:false});if(playing)notify('Terug op vaste grond. Je uitrusting is mee.')}
function show(html){resetSteering();if(race&&!race.paused)race.paused=performance.now();keys.clear();joyX=joyZ=0;$('joy').firstElementChild.style.transform='';$('content').innerHTML=html;if(!$('panel').open)$('panel').showModal()}
$('panel').addEventListener('close',()=>{if(race?.paused){race.start+=performance.now()-race.paused;delete race.paused}keys.clear();if(document.activeElement&&document.activeElement!==document.body)document.activeElement.blur()});
function closePanel(){$('panel').close();updateHUD()}
function buttons(){return '<div class="row"><button id="back">Terug naar het eiland</button></div>'}
function back(){$('back').onclick=closePanel}
function start(){if(!world){try{world=createWorld($('world'));window.addEventListener('resize',world.resize)}catch(error){$('start').textContent='Spelwereld laden mislukt';console.error(error);return false}}playing=true;if(world.walkers)world.walkers.onGreet=(name,line)=>{if(!$('panel').open)notify(name+': “'+line+'”')};restore();houseView();$('entry').hidden=true;$('hud').hidden=false;world.animate(0,s,p,view,false,1);updateHUD();notify(s.log.turn||s.hout?'Welkom terug, '+profile+'!':'Loop naar de gemarkeerde houtstapel.')}
document.querySelectorAll('[data-profile]').forEach(b=>b.onclick=()=>{profile=b.dataset.profile;updateProfileMenu();world?.outfit(profile==="Floor"?"Nova":"Flint");document.querySelectorAll('[data-profile]').forEach(c=>c.classList.toggle('selected',c===b))});$('start').onclick=start;$('school').onclick=()=>{start();if(playing)school()};$('history').onclick=()=>{start();if(playing)historyMenu()};
function needs(){const cp=cur(),t3=cp?.r;if(t3){const c=t3.progress.next.cost,planks=Math.max(0,(c.planken||0)-s.planken);return {hout:Math.max(0,(c.hout||0)+planks-s.hout),steen:Math.max(0,(c.steen||0)-s.steen),planks}}
 const m=mission();if(!m)return null;const planks=Math.max(0,(m[4]||0)-s.planken);
 return {hout:Math.max(0,m[1]+planks-s.hout),steen:Math.max(0,m[2]-s.steen),planks}}
function pileLeft(n){return s.harvest[n.i]>Date.now()?0:(s.yield[n.i]??PILE)}
function reachable(n){const I=world.islands.find(i=>Math.hypot(i.x-n.x,i.z-n.z)<i.r);return !!I&&I.open<=Math.min(s.stage,2)}
function objective(){
 const m=mission(),cp=cur(),t3=cp?.r;
 if(!m&&!t3&&(s.level||1)>=4&&!houseInfo()&&houseReady()){const d=houseDraft();return {obj:{x:d.x,z:d.z},name:'Bouwkavel · '+plotById(d.plotId).name}}
 if(!m&&!t3)return race?{obj:world.gates[race.hit],name:'Tijdrit · windring '+(race.hit+1)}:null;
 const n=needs(),visit=(id)=>{const h=houseOf(TOOLS[id].owner);return {obj:h,name:TOOLS[id].name+' · '+h.name}};
 if(t3&&t3.answersNeeded>0){const h=houseOf(t3.stepStory.npc);return {obj:h,name:cp.P.name+' · vraag '+h.name}}
 const pile=type=>world.nodes.filter(o=>o.type===type&&reachable(o)&&pileLeft(o)>0).sort((a,b)=>dist(a)-dist(b))[0];
 if(n.hout>0){if(!s.tools.bijl)return visit('bijl');const o=pile('hout');if(o)return {obj:o,name:'Houtstapel · hak hout'}}
 if(n.steen>0){if(!s.tools.houweel)return visit('houweel');const o=pile('steen');if(o)return {obj:o,name:'Steengroeve · hak steen'}}
 if(n.planks>0&&!s.tools.zaag)return visit('zaag');
 if(t3)return {obj:siteOf(cp.P),name:cp.P.name+' · '+t3.progress.next.title.toLowerCase()};
 for(const id of missionTools[s.stage])if(!s.tools[id])return visit(id);
 if(s.stage===2&&s.rings.length<3)return {obj:world.gates.find((_,i)=>!s.rings.includes(i)),name:'Windring · spring'};
 return {obj:repair[s.stage],name:s.stage===2?'Baken':'Brugwerf'}
}
// Safety net: only when the current mission can no longer be finished does one pile regrow, so nobody gets stuck.
function replenish(){const m=mission();if(!(m||cur())||currentRoom)return;const now=Date.now(),n=needs();
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
let m=mission();$('region').textContent=area().name;$('chapter').textContent=m?'LEVEL '+(s.stage<3?1:2)+'  /  MISSIE '+(s.stage%3+1)+' VAN 3':s.stage>=6?((s.level||1)<3?'LEVEL 2 VOLTOOID':'ALLE LEVELS VOLTOOID'):'LEVEL 1 VOLTOOID';
 $('objective').textContent=m?m[0]:s.stage===3&&(s.level||1)<2?'Klaar voor level 2':s.stage>=6&&(s.level||1)<3?'Klaar voor level 3 · open je logboek':'Vrije bouwvlucht';$('progress').textContent=m?(m[4]?'Planken '+Math.min(s.planken,m[4])+'/'+m[4]:'Hout '+Math.min(s.hout,m[1])+'/'+m[1])+' · Steen '+Math.min(s.steen,m[2])+'/'+m[2]+(s.stage===2?' · Ringen '+s.rings.length+'/3':''):(race?'Tijdrit · '+((performance.now()-race.start)/1000).toFixed(1)+' s · '+race.hit+'/3':s.stage===3&&(s.level||1)<2?'Start level 2 in je logboek, of vlieg een tijdrit bij het baken.':'Bouw verder of start een tijdrit bij het baken.');
 {const cp=cur(),t3=cp?.r,lv=s.level||1;if(t3){const st=t3.progress.next,c=st.cost;$('chapter').textContent='LEVEL '+cp.P.level+'  /  FASE '+(t3.progress.current+1)+' VAN 5';$('objective').textContent=st.title;
  $('progress').textContent=['Antwoorden '+t3.correctAnswers+'/'+st.questions,...['hout','steen','planken'].filter(k=>c[k]).map(k=>k[0].toUpperCase()+k.slice(1)+' '+Math.min(s[k],c[k])+'/'+c[k])].join(' · ')}
  else if(lv>=4&&houseReady()){const hi=houseInfo();if(!hi){$('chapter').textContent='LEVEL 4  /  ONTWERP';$('objective').textContent='Ontwerp je huis';$('progress').textContent='Kavel: '+plotById(houseDraft().plotId).name}
   else{$('chapter').textContent='ALLE LEVELS VOLTOOID';$('objective').textContent='Richt je huis in';$('progress').textContent=hi.design.furniture.length+' meubels in je huis'}}
  else if(l3Done()){$('chapter').textContent='LEVEL 3 VOLTOOID';$('objective').textContent='Klaar voor level 4 · open je logboek'}}
 $('inventory').textContent=inventoryText();
 context=null;
 if(placement){context={kind:'place'};$('act').textContent='Plaatsen · E'}
 else {if(s.stage>=3&&!race&&dist(repair[2])<4.6)context={kind:'race'};let r=mission()&&repair[s.stage];if(r&&dist(r)<4.6)context={kind:'repair'};
 let n=world.nodes.filter(n=>pileLeft(n)>0&&dist(n)<3.4).sort((a,b)=>dist(a)-dist(b))[0];
 if(n&&(!context||(r&&dist(n)<dist(r))))context={kind:'resource',n};
 $('act').textContent=context?.kind==='resource'?(context.n.type==='hout'?(s.tools.bijl?'Hout hakken':'Bijl nodig'):(s.tools.houweel?'Steen hakken':'Houweel nodig'))+' · E':context?.kind==='race'?'Start de windrace · E':context?'Werkplaats · E':''}
 if(l3On()&&!placement&&!race&&dist(L3.site)<4.4&&(!context||context.kind!=='resource'||dist(L3.site)<dist(context.n))){context={kind:'tower'};$('act').textContent='Bouwplaats wachttoren · E'}
 else if((s.level||1)>=4&&houseReady()&&!placement&&!race){const hi=houseInfo(),d=hi?hi.design:houseDraft(),near=Math.hypot(p.x-d.x,p.z-d.z)<6.5;
  if(near&&(!context||context.kind!=='resource')){context={kind:'house'};$('act').textContent=(!hi?'Ontwerp je huis':hi.progress.finished?'Inrichten':'Bouwplek mijn huis')+' · E'}}
 else if(l3Done()&&!context&&!placement&&dist(L3.site)<3){context={kind:'tower'};$('act').textContent='Wachttoren · E'}
 const cab=world.cable,station=[cab.a,cab.b].findIndex(st=>Math.hypot(st.x-p.x,st.z-p.z)<3.4&&Math.abs(p.y-st.y-world.liftAt(st.x,st.z))<2.5);
 if(station>=0&&!context&&!placement&&!ride){context={kind:'cable',from:station};$('act').textContent=(station?'Kabelbaan naar de berg':'Kabelbaan naar de Bloesemvallei')+' · E'}
 const door=world.rooms.find(room=>dist(room.house)<1.8);
 if(door&&!context&&!race&&!placement){context={kind:'enter',door};$('act').textContent=door.house.place+' binnengaan · E'}
 // something you built yourself can be picked up again: the top piece of the stack right in front of you
 if(!context&&!race&&!placement&&!ride&&s.builds.length){const fx=p.x-Math.sin(p.heading)*1.9,fz=p.z-Math.cos(p.heading)*1.9;let best=null,bd=1.8;
  for(const b of s.builds){const d=Math.hypot(b.x-fx,b.z-fz);if(d<bd&&b.y<=p.y+1.3&&b.y>=p.y-1.3&&!s.builds.some(o=>o!==b&&Math.abs(o.x-b.x)<.5&&Math.abs(o.z-b.z)<.5&&o.y>b.y)){best=b;bd=d}}
  if(best){context={kind:'pickup',b:best};$('act').textContent=BUILD_NAME[best.type]+' oppakken · E'}}
 guide=objective();if(guide){let dx=guide.obj.x-p.x,dz=guide.obj.z-p.z;let angle=Math.atan2(dx,-dz)+view.yaw;$('waypoint').style.setProperty('--bearing',angle+'rad');$('waypoint').textContent=guide.name+' · '+Math.round(dist(guide.obj))+' m'}else $('waypoint').textContent='';
}
function act(){if(!playing||$('panel').open)return;updateHUD();if(!context)return;
 if(context.kind==='enter'){visitHouse(context.door);return}
 if(context.kind==='leave'){leaveHouse();return}
 if(context.kind==='talk'){interview();return}
 if(context.kind==='race'){race={start:performance.now(),hit:0};world.gates[0].g.visible=true;notify('Tijdrit gestart! Volg de drie windringen.');updateHUD();return}
 if(context.kind==='place'){place();return}
 if(context.kind==='pickup'){const b=context.b,i=s.builds.indexOf(b);if(i<0)return;s.builds.splice(i,1);if(b.type==='blok')s.hout++;else if(b.type==='lamp')s.steen++;else s.items[b.type]=(s.items[b.type]||0)+1;world.sync(s);persist();updateHUD();notify(BUILD_NAME[b.type]+' terug in je rugzak');return}
 if(context.kind==='cable'){if(s.stage<1){notify('De kabelbaan draait pas als de havenbrug weer heel is.');return}ride={from:context.from,t:0,dur:15};p.ride=true;notify('Instappen! Geniet van het uitzicht.');return}
 if(context.kind==='resource'){harvest(context.n);return}
 if(context.kind==='tower'){projPanel(L3);return}
 if(context.kind==='house'){housePanel();return}
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
function germanSkill(q){return German.groups[(German.bank[q.id]||q).skill]||'Duits'}
function subject(kind){if(profile==='Floor')return 'nl';if(kind==='kaart')return 'hist';return 'de'}
function nextDutch(){const bank=dutchBanks[profile],st=s.dutch||={good:0,total:0,cursor:0};st.retry||=[];
 const due=st.retry.find(r=>r.at<=st.total);if(due){st.retry=st.retry.filter(r=>r!==due);return due.i}
 const i=st.cursor%bank.length;st.cursor++;return i}
// One question in the pupil's subject. onGraded(ok) updates the game and returns the follow-up buttons.
function askOne(kind,{kicker,title,lead},onGraded){
 let q,prompt,task,check,record,correct,why,options=null,german=false,subj='Duits',qid='';
 if(kind==='de'){q=German.next(s.log,null);german=true;qid='de:'+q.id;prompt=q.sentence;task=q.task||'Schrijf het juiste antwoord.';correct=q.correct;why=q.why;
  check=v=>German.accepts(q,v);record=ok=>{German.record(s.log,q,ok);Track.answer('Duits',germanSkill(q),ok)}}
 else if(kind==='hist'){const log=s.history??={turn:0,items:{}};q=HistoryCourse.next(log,null);subj='Geschiedenis';qid='hist:'+(q.id??q.prompt);prompt=q.prompt;task=HistoryCourse.task(q);correct=q.answer.split('|')[0];why=q.why;options=q.choices||null;
  check=v=>HistoryCourse.accepts(q,v);record=ok=>{German.record(log,q,ok);Track.answer('Geschiedenis',HistoryCourse.titles[q.section]||'Geschiedenis',ok)}}
 else{const bank=dutchBanks[profile],i=nextDutch(),[topic,p,answer,w,t]=bank[i];subj='Nederlands';qid='nl:'+profile+':'+i;prompt=p;why=w;task=t||(Array.isArray(answer)?'Kies het beste antwoord.':'Typ je antwoord.');
  const norm=v=>v.trim().toLocaleLowerCase('nl').replace(/[“”"‘’',;:]/g,'').replace(/[.!?]+$/,'').replace(/\s+/g,' ').trim();
  const accepted=typeof answer==='string'?answer.split('|'):[answer[0]];correct=accepted[0];if(Array.isArray(answer))options=answer;
  check=v=>accepted.some(a=>norm(a)===norm(v));record=ok=>{Track.answer('Nederlands',topic,ok);const st=s.dutch;st.total++;if(ok)st.good++;else st.retry.push({i,at:st.total+3})}}
 show('<small>'+kicker+'</small><h2>'+title+'</h2>'+(lead?'<p>'+lead+'</p>':'')+'<div class="question"></div><p class="task"></p><form id="oneForm"></form>'+buttons());back();
 document.querySelector('.question').textContent=prompt;document.querySelector('.task').textContent=task;const form=$('oneForm');
 function grade(value){
  const ok=check(value);record(ok);const next=onGraded(ok,{subject:subj,qid:String(qid).slice(0,110)});
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
function sawPlanks(target,again){const m=mission();target=target??m?.[4]??0;again=again||workshop;
 if(!s.hout){notify('Hak eerst hout om planken van te zagen.');again();return}
 askOne(subject(),{kicker:'BRUGWERF · ZAGEN',title:'Zaag een plank · '+s.planken+' van '+target,lead:'Een goed antwoord is een rechte zaagsnede.'},ok=>{
  if(ok){s.hout--;s.planken++;world.reach()}persist();const more=s.planken<target&&s.hout>0;
  return {head:ok?'Strak gezaagd! +1 plank':'Scheef gezaagd. Probeer opnieuw',buttons:more?[['Volgende plank',()=>sawPlanks(target,again),true],['Terug',again]]:[['Terug',again,true]]}
 })}
function workshop(){let m=mission();if(!m)return;
 const tools=missionTools[s.stage].filter(id=>!s.tools[id]),enough=s.hout>=m[1]&&s.steen>=m[2]&&s.planken>=(m[4]||0)&&!tools.length&&(s.stage!==2||s.rings.length===3);
 const meters=(m[1]?'<div class="meter">Hout <b>'+s.hout+' / '+m[1]+'</b></div>':'')+(m[4]?'<div class="meter">Planken <b>'+s.planken+' / '+m[4]+'</b></div>':'')+'<div class="meter">Steen <b>'+s.steen+' / '+m[2]+'</b></div>'+missionTools[s.stage].map(id=>'<div class="meter">'+TOOLS[id].name+' <b>'+(s.tools[id]?'in je rugzak':'nog halen bij '+houseOf(TOOLS[id].owner).name)+'</b></div>').join('')+(s.stage===2?'<div class="meter">Windringen <b>'+s.rings.length+' / 3</b></div>':'')+'<div class="meter">Instructies opgelost <b>'+s.seals+' / '+m[3]+'</b></div>';
 const saw=m[4]&&s.planken<m[4]?(s.tools.zaag?'<button class="primary" id="saw">Planken zagen · '+s.hout+' hout</button>':'<p>Voor planken heb je de zaag van '+houseOf('bram').name+' nodig.</p>'):'';
 show('<small>WERKPLAATS · '+area().name.toUpperCase()+'</small><h2>'+m[0]+'</h2><p>'+(s.stage===2?'Spring door de drie gouden windringen en stel het baken af met de opdrachten.':'Verzamel het materiaal en los opdrachten op voor de werkplaats. Daarna kun je de brug echt oversteken.')+'</p>'+meters+(saw?'<div class="row">'+saw+'</div>':'')+(enough?'<div class="row"><button class="primary" id="work">'+(s.seals>=m[3]?'Reparatie uitvoeren':(profile==='Floor'?'Oefen Nederlands':'Oefen Duits'))+'</button>'+(s.seals<m[3]&&profile==='Niek'?'<button id="historyMission">Oefen geschiedenis</button><button id="dutchMission">Oefen Nederlands</button>':'')+'</div>':'<p>Volg de pijl op je kompas om verder te komen.</p>')+buttons());back();
 if($('saw'))$('saw').onclick=()=>sawPlanks();
 if($('dutchMission'))$('dutchMission').onclick=()=>dutchRound(true);
 if($('historyMission'))$('historyMission').onclick=()=>historyQuestion(null,true);
 if(enough)$('work').onclick=()=>s.seals>=m[3]?finishMission():profile==="Floor"?dutchRound(true):exercise(true)}
function finishMission(){let m=mission();if(!m||s.seals<m[3]||s.hout<m[1]||s.steen<m[2]||s.planken<(m[4]||0)||missionTools[s.stage].some(id=>!s.tools[id])||s.stage===2&&s.rings.length!==3)return;s.hout-=m[1];s.steen-=m[2];s.planken-=m[4]||0;s.stage++;s.seals=0;world.sync(s);persist();closePanel();notify({1:'Brug gereed! Steek over naar de Bloesemvallei.',2:'Zwever vrijgespeeld! Spring en druk in de lucht opnieuw op Spring.',3:'Het baken brandt! De windroute is weer open.',4:'De molen draait weer!',5:'De kraan hijst weer stenen!',6:'Het signaalvuur brandt op de Valkenrots!'}[s.stage]);
 if(s.stage===3){show('<small>LEVEL 1 VOLTOOID</small><h2>De windroute is open!</h2><p>'+profile+', het sterrenbaken schijnt weer boven de archipel.</p><p>In level 2 herstel je de verre eilanden: de molen op de Molenhoeve, de kraan in de Steengroeve en het signaalvuur op de Valkenrots. Gerrit, Anke en Joost helpen je aan het gereedschap.</p><div class="row"><button id="lvl2" class="primary">Start level 2</button><button id="back">Eerst vrij bouwen</button></div>');back();$('lvl2').onclick=startLevel2}
 if(s.stage===6){show('<small>ALLE LEVELS VOLTOOID</small><h2>De archipel bloeit!</h2><p>'+profile+', de molen draait, de kraan hijst en het signaalvuur brandt. Je hebt alle zes de missies volbracht.</p><p>Maar in Dennenhoek wacht nog een geheim: een vervallen wachttoren achter het bos.</p><div class="row"><button id="lvl3" class="primary">Start level 3</button><button id="back">Eerst vrij bouwen</button></div>');back();$('lvl3').onclick=startLevel3}}
function startLevel2(){s.level=2;persist();closePanel();notify('Level 2 begonnen: herstel de molen op de Molenhoeve.');updateHUD()}
// ---- Construction projects: level 3 restores the forgotten watchtower in Dennenhoek, level 4 builds your own house.
// Stages, costs, story and answer bookkeeping come from ConstructionProjects / ConstructionStory / ConstructionCampaign
// (the house design from HouseDesigner / HousePlanner); only verified right answers from the pupil's own subject count,
// each question once per stage.
const L3={id:'wachttoren',blueprint:'wachttoren_ruine',plot:'dennenhoek-ruine',x:-54,z:-10.5,site:{x:-53.4,z:-6.4},level:3,name:'Wachttoren',there:'naar de wachttoren'};
const L4={id:'mijn-huis',blueprint:'vakwerkhuis',level:4,name:'Mijn huis',there:'naar je bouwplek'};
const l3Ready=()=>typeof ConstructionCampaign!=='undefined';
const houseReady=()=>l3Ready()&&typeof HouseDesigner!=='undefined'&&typeof HousePlanner!=='undefined'&&!!world?.housePlots;
function pstate(P){if(!l3Ready()||(s.level||1)<P.level)return null;const r=ConstructionCampaign.state(s,P.id);return r.ok?r:null}
function l3(){return pstate(L3)}
function l3On(){const r=l3();return !!r&&!r.progress.finished}
function l3Done(){const r=l3();return !!r&&r.progress.finished}
// the project being built right now, if any
function cur(){for(const P of [L3,L4]){const r=pstate(P);if(r&&!r.progress.finished)return {P,r}}return null}
// level 4 texts: the house story has goals but no conversation lines yet
const L4TEXT={foundation:{prompt:'Joost vraagt waarom een fundering breder is dan de muur die erop komt.',done:'De fundering ligt. Nu zie je precies waar je huis komt.'},
 frame:{prompt:'Bram wil weten hoe je de balken haaks en stevig neerzet.',done:'Het houten skelet staat. Je huis heeft zijn vorm.'},
 walls:{prompt:'Bram vraagt hoe je muren, ramen en deur netjes laat aansluiten.',done:'De muren staan, met ramen en een deur. Je kunt al naar binnen.'},
 roof:{prompt:'Bram wil weten hoe je een dak waterdicht maakt.',done:'Het dak ligt erop. Je huis is waterdicht.'},
 interior:{prompt:'Wies helpt je met de inrichting, maar eerst heeft ze een vraag.',done:'De vloer ligt. Tijd om je huis in te richten.'}};
function stepText(P,r){const sto=r.stepStory||{},t=P===L4?L4TEXT[r.progress.next?.id]||{}:{};return {prompt:sto.prompt||t.prompt||'',goal:sto.goal||''}}
const doneText=(P,stageId,story)=>story?.completedText||(P===L4?L4TEXT[stageId]?.done:'')||'Fase voltooid.';
// where the player builds: the tower gate, or the front door of the planned house
function houseInfo(){if(!houseReady()||(s.level||1)<4)return null;const g=HousePlanner.get(s,L4.id);return g.ok?g:null}
function siteOf(P){if(P===L3)return L3.site;const h=houseInfo();if(h)return h.plan.entrance;const d=s.houseDraft;return d?{x:d.x,z:d.z}:null}
function startLevel3(){if(!l3Ready())return;if(!ConstructionCampaign.state(s,L3.id).ok){const r=ConstructionCampaign.start(s,{id:L3.id,blueprintId:L3.blueprint,plotId:L3.plot,x:L3.x,z:L3.z});if(!r.ok){notify('Level 3 starten lukt niet.');return}s=r.save}
 s.level=3;world.sync(s);persist();const story=ConstructionStory.get(L3.blueprint);
 show('<small>LEVEL 3 · DENNENHOEK</small><h2>'+story.title+'</h2><p>'+story.intro+'</p><p>Je herstelt de toren in vijf fases. Elke fase begint met een gesprek met een bewoner: goede antwoorden in jouw vak tellen mee. Daarna heb je soms hout, steen of planken nodig. Je kompas wijst steeds de weg.</p><div class="row"><button class="primary" id="l3go">Op weg naar de ruïne</button></div>');$('l3go').onclick=closePanel;updateHUD()}
function projTalk(P,h){const r=pstate(P),st=r.progress.next,tx=stepText(P,r);
 show('<small>'+h.place+' · '+P.name.toUpperCase()+'</small><h2>'+h.name+'</h2><p>“'+tx.prompt+'”</p><p>'+tx.goal+'</p><div class="meter">Goede antwoorden voor deze fase <b>'+r.correctAnswers+' / '+st.questions+'</b></div><div class="row"><button class="primary" id="t3q">Beantwoord de vraag</button><button id="t3other">Iets anders vragen</button><button id="endTalk">Gesprek sluiten</button></div>');
 $('t3q').onclick=()=>projQuestion(P,h);$('t3other').onclick=()=>{interview.skip3=true;interview()};$('endTalk').onclick=closePanel}
function projQuestion(P,h){const r=pstate(P);if(!r||!r.answersNeeded){projTalk(P,h);return}const st=r.progress.next;
 askOne(subject(),{kicker:P.name.toUpperCase()+' · '+h.name.toUpperCase(),title:st.title+' · '+r.correctAnswers+' van '+st.questions+' goed',lead:stepText(P,r).prompt},(ok,info)=>{
  let counted=false;if(ok){const a=ConstructionCampaign.answer(s,P.id,{correct:true,verified:true,stageId:st.id,subject:info.subject,questionId:info.qid,eventId:P.id.slice(0,8)+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8)});if(a.ok){s=a.save;counted=true}}
  persist();const now=pstate(P),left=now?.answersNeeded||0,n=needs(),ready=n&&n.hout<=0&&n.steen<=0&&n.planks<=0;
  return {head:ok?(counted?'Goed! '+now.correctAnswers+' van '+st.questions:'Goed, maar deze vraag telde al mee'):'Nog niet goed',note:left?'':'Genoeg antwoorden voor deze fase. '+(ready?'Ga '+P.there+' om te bouwen.':'Verzamel nu het materiaal; je kompas wijst de weg.'),
   buttons:left?[['Volgende vraag',()=>projQuestion(P,h),true],['Later verder',closePanel]]:[['Gesprek sluiten',closePanel,true]]}})}
function projPanel(P){const r=pstate(P);if(!r)return;const story=r.story;
 if(r.progress.finished){if(P===L4){furnishPanel();return}show('<small>DENNENHOEK · WACHTTOREN</small><h2>De wachttoren staat weer</h2><p>'+story.ending+'</p><p>Klim via de trap langs de muur en om de toren heen naar de uitkijkpost.</p>'+buttons());back();return}
 const st=r.progress.next,tx=stepText(P,r),c=st.cost,h=houseOf(r.stepStory.npc);
 const meters='<div class="meter">Goede antwoorden bij '+h.name+' <b>'+r.correctAnswers+' / '+st.questions+'</b></div>'+['hout','steen','planken'].filter(k=>c[k]).map(k=>'<div class="meter">'+k[0].toUpperCase()+k.slice(1)+' <b>'+s[k]+' / '+c[k]+'</b></div>').join('');
 const saw=c.planken&&s.planken<c.planken?(s.tools.zaag?'<button id="saw">Planken zagen · '+s.hout+' hout</button>':'<p>Voor planken heb je de zaag van '+houseOf('bram').name+' nodig.</p>'):'';
 show('<small>'+P.name.toUpperCase()+' · FASE '+(r.progress.current+1)+' VAN 5</small><h2>'+st.title+'</h2><p>'+tx.goal+'</p>'+(r.answersNeeded?'<p>Eerst praten: '+tx.prompt.replace(/\.$/,'')+'. Ga naar '+h.name+' in de '+h.place.toLowerCase()+'.</p>':'')+meters+'<div class="row">'+(r.canFinishStep?'<button class="primary" id="t3build">'+st.title+'</button>':'')+saw+(P===L4?'<button id="design">Ontwerp aanpassen</button>':'')+'</div>'+buttons());back();
 if($('saw'))$('saw').onclick=()=>sawPlanks(c.planken,()=>projPanel(P));if($('t3build'))$('t3build').onclick=()=>buildStage(P);if($('design'))$('design').onclick=designPanel}
function buildStage(P){const r=ConstructionCampaign.complete(s,P.id);if(!r.ok){notify('Nog niet alles is klaar voor deze fase.');return}
 s=r.save;world.sync(s);const at=P===L3?{x:L3.x,z:L3.z}:siteOf(P);world.burst(at.x,P===L3?3.5:world.liftAt(at.x,at.z)+3,at.z,0xffd27a);persist();
 const stage=ConstructionProjects.blueprint(P.blueprint).stages[r.project.completed-1],text=doneText(P,stage.id,r.stageStory);
 if(r.finished&&P===L3){const story=ConstructionStory.get(L3.blueprint);show('<small>LEVEL 3 VOLTOOID</small><h2>De wachttoren staat weer!</h2><p>'+text+'</p><p>'+story.ending+'</p><p>Beloning: '+r.rewards.coins+' munten en de verzegelde kaart in de kist op de toren.</p><p>Klim via de trap naar de uitkijkpost en kijk uit over de handelsroute. Daarna wacht level 4: je eigen huis.</p><div class="row"><button class="primary" id="lvl4">Start level 4</button><button id="back">Eerst naar de toren</button></div>');back();$('lvl4').onclick=startLevel4}
 else if(r.finished){const story=ConstructionStory.get(L4.blueprint);show('<small>LEVEL 4 VOLTOOID</small><h2>Je huis is klaar!</h2><p>'+text+'</p><p>'+story.ending+'</p><p>Ga naar binnen en zet er meubels neer. Een nieuw meubel kost hout of planken; verplaatsen en opbergen is gratis.</p><div class="row"><button class="primary" id="furnish">Inrichten</button><button id="back">Terug naar het eiland</button></div>');back();$('furnish').onclick=furnishPanel}
 else{show('<small>'+P.name.toUpperCase()+' · FASE '+r.project.completed+' VAN 5 KLAAR</small><h2>'+stage.title+'</h2><p>'+text+'</p><div class="row"><button class="primary" id="t3next">Volgende fase bekijken</button><button id="back">Terug naar het eiland</button></div>');back();$('t3next').onclick=()=>projPanel(P)}
 updateHUD()}
// ---- Level 4 · Mijn huis: design on an approved plot, check it against the world, build it in five stages, furnish it
const DNAME={facade:{plaster:'Witte leem',brick:'Baksteen',stone:'Natuursteen'},timber:{oak:'Eiken',dark_oak:'Donker eiken',weathered:'Verweerd'},roof:{gable:'Zadeldak',hip:'Schilddak'},roofMaterial:{clay_red:'Rode pannen',clay_brown:'Bruine pannen',slate:'Leisteen'},floor:{oak_planks:'Eiken planken',stone_tiles:'Stenen tegels'}};
const DSIDE={front:'Voorkant',back:'Achterkant',left:'Linkerkant',right:'Rechterkant'},DSLOT={left:'links',center:'midden',right:'rechts'};
const FNAME={table:'Tafel',chair:'Stoel',bench:'Bank',bed:'Bed',chest:'Kist',bookcase:'Boekenkast'};
const plotById=id=>world.housePlots.find(p=>p.id===id);
const siteCtx=d=>({plot:plotById(d.plotId),obstacles:[],worldCheck:c=>world.siteCheck(c,s)});
const SITE_ERR={'outside-plot':'Zo past het huis niet op de kavel. Draai het of kies een andere kavel.','wrong-plot':'Dit ontwerp hoort bij een andere kavel.','world-check-required':'De bouwplek kon niet worden gecontroleerd.'};
const siteMsg=errs=>(errs||[]).map(e=>e.startsWith('world-rejected:')?'Hier kan het niet: '+e.slice(15)+'.':SITE_ERR[e]||'Dat kan zo niet ('+e+').')[0]||'';
function houseDraft(){if(!houseReady())return null;if(!s.houseDraft||!HouseDesigner.valid(s.houseDraft).valid){const pl=world.housePlots[0];s.houseDraft=HouseDesigner.create({projectId:L4.id,plotId:pl.id,x:pl.x,z:pl.z})}return s.houseDraft}
// what the world shows: the draft as a pale ghost until building starts, then the real house (world.sync)
function houseView(){if(!world?.houseGhost)return;world.houseGhost((s.level||1)>=4&&houseReady()&&!houseInfo()?houseDraft():null)}
function startLevel4(){if(!houseReady()){notify('Level 4 laden lukt niet.');return}s.level=4;houseDraft();persist();houseView();updateHUD();const story=ConstructionStory.get(L4.blueprint);
 show('<small>LEVEL 4 · MIJN HUIS</small><h2>'+story.title+'</h2><p>'+story.intro+'</p><p>Eerst ontwerp je het: kies een bouwkavel, draai het huis, kies gevel, houtwerk, dak, vloer, deur en ramen. Het ontwerp staat als doorzichtig huis op de kavel. Daarna bouw je het in vijf fases, net als de wachttoren.</p><div class="row"><button class="primary" id="design">Ontwerp je huis</button><button id="back">Later</button></div>');back();$('design').onclick=designPanel}
// design: one panel for everything that may still change; parts already built are locked
function designPanel(){const info=houseInfo(),d=info?info.design:houseDraft(),done=info?info.progress.current:0;if(!d)return;
 const lock={plot:!!info,rotation:done>=1,walls:done>=3,roof:done>=4,floor:done>=5},chk=HouseDesigner.checkSite(d,siteCtx(d));
 const opt=(key,locked)=>'<div class="dz"><b>'+{facade:'Gevel',timber:'Houtwerk',roof:'Dakvorm',roofMaterial:'Dakbedekking',floor:'Vloer'}[key]+'</b><div class="opts">'+HouseDesigner.CHOICES[key].map(v=>'<button data-k="'+key+'" data-v="'+v+'" class="'+(d[key]===v?'on':'')+'"'+(locked?' disabled':'')+'>'+DNAME[key][v]+'</button>').join('')+'</div></div>';
 const plots='<div class="dz"><b>Bouwkavel</b><div class="opts">'+world.housePlots.map(p=>'<button data-plot="'+p.id+'" class="'+(d.plotId===p.id?'on':'')+'"'+(lock.plot?' disabled':'')+'>'+p.name+'</button>').join('')+'</div></div>';
 const turn='<div class="dz"><b>Draaien</b><div class="opts">'+[0,90,180,270].map(a=>'<button data-rot="'+a+'" class="'+(d.rotation===a?'on':'')+'"'+(lock.rotation?' disabled':'')+'>'+a+'°</button>').join('')+'</div></div>';
 const door='<div class="dz"><b>Voordeur</b><div class="opts">'+['front','back'].map(sd=>'<button data-door="'+sd+'" class="'+(d.door.side===sd?'on':'')+'"'+(lock.walls?' disabled':'')+'>'+DSIDE[sd]+'</button>').join('')+'</div></div>';
 const wins='<div class="dz"><b>Ramen · '+d.windows.length+' van max. 8</b><div class="wingrid">'+Object.keys(DSIDE).map(sd=>'<span>'+DSIDE[sd]+'</span>'+['left','center','right'].map(sl=>{const isDoor=d.door.side===sd&&sl==='center',on=d.windows.some(w=>w.side===sd&&w.slot===sl);return '<button data-ws="'+sd+'" data-wl="'+sl+'" class="'+(on?'on':'')+'"'+(lock.walls||isDoor?' disabled':'')+'>'+(isDoor?'deur':DSLOT[sl])+'</button>'}).join('')).join('')+'</div></div>';
 const status=chk.ok?'<p class="okline">✓ Dit huis past op '+plotById(d.plotId).name+'.</p>':'<p class="badline">'+siteMsg(chk.errors)+'</p>';
 show('<small>LEVEL 4 · '+(info?'ONTWERP AANPASSEN':'ONTWERP')+'</small><h2>Mijn huis</h2><p>Een vakwerkhuis van 8 bij 6 meter. '+(info?'Wat al gebouwd is, ligt vast.':'Je ziet het ontwerp als doorzichtig huis op de kavel.')+'</p>'+plots+turn+opt('facade',lock.walls)+opt('timber',lock.walls)+door+wins+opt('roof',lock.roof)+opt('roofMaterial',lock.roof)+opt('floor',lock.floor)+status
  +'<div class="row">'+(info?'<button class="primary" id="dclose">Klaar</button>':'<button class="primary" id="dbegin"'+(chk.ok?'':' disabled')+'>Bouwplan vastleggen</button><button id="dclose">Later verder</button>')+'</div>');
 $('dclose').onclick=()=>{if(info)projPanel(L4);else closePanel()};if($('dbegin'))$('dbegin').onclick=beginHouse;
 for(const b of $('content').querySelectorAll('button[data-k]'))b.onclick=()=>applyDesign({[b.dataset.k]:b.dataset.v});
 for(const b of $('content').querySelectorAll('button[data-plot]'))b.onclick=()=>applyDesign({plotId:b.dataset.plot});
 for(const b of $('content').querySelectorAll('button[data-rot]'))b.onclick=()=>applyDesign({rotation:+b.dataset.rot});
 for(const b of $('content').querySelectorAll('button[data-door]'))b.onclick=()=>{const sd=b.dataset.door;applyDesign({door:{side:sd,slot:'center'},windows:d.windows.filter(w=>!(w.side===sd&&w.slot==='center'))})};
 for(const b of $('content').querySelectorAll('button[data-ws]'))b.onclick=()=>{const sd=b.dataset.ws,sl=b.dataset.wl,on=d.windows.some(w=>w.side===sd&&w.slot===sl);
  if(!on&&d.windows.length>=8){notify('Maximaal 8 ramen.');return}applyDesign({windows:on?d.windows.filter(w=>w.side!==sd||w.slot!==sl):[...d.windows,{side:sd,slot:sl}]})}}
const EDIT_ERR={'foundation-locked':'De fundering ligt al: het huis staat vast.','walls-locked':'De muren staan al.','roof-locked':'Het dak ligt er al op.','interior-locked':'De vloer ligt er al in.'};
function applyDesign(patch){const info=houseInfo();
 if(!info){let d=houseDraft();
  try{if(patch.plotId){const pl=plotById(patch.plotId),n=HouseDesigner.create({projectId:L4.id,plotId:pl.id,x:pl.x,z:pl.z,rotation:d.rotation,facade:d.facade,timber:d.timber,roof:d.roof,roofMaterial:d.roofMaterial,floor:d.floor});d=HouseDesigner.edit(n,{door:d.door,windows:d.windows},0)}
   else d=HouseDesigner.edit(d,patch,0)}catch(e){notify(EDIT_ERR[e.message]||'Dat kan zo niet.');return}
  s.houseDraft=d;persist();houseView();designPanel();return}
 const r=HousePlanner.change(s,L4.id,patch,siteCtx(info.design));
 if(!r.ok){notify(r.errors?siteMsg(r.errors):EDIT_ERR[r.message]||'Dat kan zo niet.');return}
 s=r.save;persist();world.sync(s);designPanel()}
function beginHouse(){const d=houseDraft(),r=HousePlanner.begin(s,d,siteCtx(d));if(!r.ok){notify(siteMsg(r.errors)||'Dat lukt zo niet.');return}
 s=r.save;delete s.houseDraft;persist();houseView();world.sync(s);updateHUD();const st=pstate(L4),h=houseOf(st.stepStory.npc);
 show('<small>LEVEL 4 · BOUWPLAN VASTGELEGD</small><h2>Aan de slag!</h2><p>Je bouwplan ligt vast op '+plotById(d.plotId).name+'. Zolang een onderdeel nog niet gebouwd is, kun je het ontwerp ervan nog aanpassen bij de bouwplek.</p><p>Eerste fase: '+st.progress.next.title.toLowerCase()+'. Ga eerst naar '+h.name+' in de '+h.place.toLowerCase()+'.</p><div class="row"><button class="primary" id="back">Op weg</button></div>');back()}
// furnishing: new pieces cost wood or planks, moving and storing is free, stored pieces come back for free
let furnRot=0,furnPick=null;
function furnSpot(){const fx=p.x-Math.sin(p.heading)*1.4,fz=p.z-Math.cos(p.heading)*1.4,l=world.houseLocal(fx,fz);return l?{x:Math.round(l[0]*2)/2,z:Math.round(l[1]*2)/2}:null}
const FURN_ERR={'outside-interior':'Daar raakt het de muur. Ga iets verder van de muur staan.','blocking-door':'Daar staat het voor de deur. Houd de ingang vrij.','overlap-furniture':'Daar staat al een meubel.','not-on-grid':'Dat past niet op het raster.','house-not-finished':'Je huis is nog niet klaar.'};
const costText=c=>Object.entries(c).map(([k,n])=>n+' '+k).join(' en ');
function furnishPanel(){const info=houseInfo();if(!info||!info.progress.finished){projPanel(L4);return}const d=info.design,me=world.houseLocal(p.x,p.z),inside=me&&Math.abs(me[0])<3.9&&Math.abs(me[1])<2.9;
 const placed=d.furniture.map(f=>'<div class="meter">'+FNAME[f.type]+' <b><button data-move="'+f.id+'"'+(inside?'':' disabled')+'>Hierheen</button> <button data-store="'+f.id+'">Opbergen</button></b></div>').join('')||'<p>Er staat nog niets.</p>';
 const stored=(s.houseFurnitureStorage||[]).map(f=>'<button data-put="'+f.id+'" data-type="'+f.type+'"'+(inside?'':' disabled')+'>'+FNAME[f.type]+' (opgeborgen)</button>').join('');
 const shop=Object.entries(HouseDesigner.FURNITURE).map(([t,spec])=>'<button data-buy="'+t+'"'+(inside?'':' disabled')+'>'+FNAME[t]+' · '+costText(spec.cost)+'</button>').join('');
 show('<small>LEVEL 4 · INRICHTEN</small><h2>Mijn huis</h2><p>'+(inside?'Een nieuw meubel komt vlak vóór je te staan. Kijk dus naar de plek waar het moet komen.':'Ga je huis binnen en kijk naar de plek waar een meubel moet komen.')+'</p>'
  +'<div class="dz"><b>Draaien</b><div class="opts">'+[0,90,180,270].map(a=>'<button data-frot="'+a+'" class="'+(furnRot===a?'on':'')+'">'+a+'°</button>').join('')+'</div></div>'
  +'<div class="dz"><b>Nieuw meubel</b><div class="opts">'+shop+'</div></div>'+(stored?'<div class="dz"><b>Opgeborgen</b><div class="opts">'+stored+'</div></div>':'')+'<div class="dz"><b>In je huis</b>'+placed+'</div>'
  +'<p>Je hebt '+s.hout+' hout en '+s.planken+' planken.</p>'+buttons());back();
 for(const b of $('content').querySelectorAll('button[data-frot]'))b.onclick=()=>{furnRot=+b.dataset.frot;furnishPanel()};
 const place=(item)=>{const spot=furnSpot();if(!spot){notify('Ga in je huis staan.');return}const r=HousePlanner.placeFurniture(s,L4.id,{...item,x:spot.x,z:spot.z,rotation:furnRot});
  if(!r.ok){notify(r.reason==='needs-materials'?'Daarvoor heb je '+costText(r.cost)+' nodig.':FURN_ERR[(r.message||'').split(':')[0]]||FURN_ERR[r.reason]||'Dat past daar niet.');return}
  s=r.save;persist();world.sync(s);notify(r.reused?FNAME[item.type]+' staat weer in je huis.':FNAME[item.type]+' gemaakt'+(Object.keys(r.cost).length?' · '+costText(r.cost):''));furnishPanel()};
 for(const b of $('content').querySelectorAll('button[data-buy]'))b.onclick=()=>place({id:b.dataset.buy+'-'+Date.now().toString(36),type:b.dataset.buy});
 for(const b of $('content').querySelectorAll('button[data-put]'))b.onclick=()=>place({id:b.dataset.put,type:b.dataset.type});
 for(const b of $('content').querySelectorAll('button[data-move]'))b.onclick=()=>{const spot=furnSpot();const f=d.furniture.find(o=>o.id===b.dataset.move);if(!spot||!f)return;const r=HousePlanner.moveFurniture(s,L4.id,f.id,{x:spot.x,z:spot.z,rotation:furnRot});
  if(!r.ok){notify(FURN_ERR[(r.message||'').split(':')[0]]||'Dat past daar niet.');return}s=r.save;persist();world.sync(s);furnishPanel()};
 for(const b of $('content').querySelectorAll('button[data-store]'))b.onclick=()=>{const r=HousePlanner.storeFurniture(s,L4.id,b.dataset.store);if(!r.ok){notify('Opbergen lukt niet.');return}s=r.save;persist();world.sync(s);furnishPanel()}}
function housePanel(){const info=houseInfo();if(!info){designPanel();return}if(info.progress.finished)furnishPanel();else projPanel(L4)}
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
 $('answer').onsubmit=e=>{e.preventDefault();const reply=input.value,ok=German.accepts(q,reply);German.record(s.log,q,ok);Track.answer('Duits',germanSkill(q),ok);if(ok&&mission)s.seals++;if(ok&&!mission)coin();persist();
 show('<small>'+(ok?'INSTRUCTIE BEGREPEN':'HERHALING INGEPLAND')+'</small><h2>'+(ok?'Helemaal goed!':'Kijk nog even mee')+'</h2><p class="source"></p><div class="question"></div><p class="youranswer"></p><p class="why"></p><div class="row"><button id="continue" class="primary">'+(mission&&s.seals>=mission()[3]?'Naar de reparatie':'Volgende opdracht')+'</button></div>'+buttons());
 document.querySelector('.source').textContent=q.sentence;document.querySelector('.question').textContent=q.correct;document.querySelector('.youranswer').textContent=ok?'':'Jouw antwoord: '+reply;document.querySelector('.why').textContent=(!ok&&German.nearMiss(q,reply)?'Bijna goed, alleen de hoofdletters kloppen niet. In het Duits krijgt elk zelfstandig naamwoord een hoofdletter, net als de beleefde vorm Sie. ':'')+q.why;back();
 $('continue').onclick=()=>mission&&s.seals>=mission()[3]?workshop():exercise(mission,skill)};
 if(!matchMedia('(pointer:coarse)').matches)input.focus()
}
function clearPlacement(){placement=null;if(preview){preview.traverse(o=>{if(o.isMesh)o.material.dispose()});world.scene.remove(preview);preview=null}}
function chooseBuild(){if(currentRoom||!playing||$('panel').open)return;if(placement){clearPlacement();updateHUD();return}
 show('<small>BOUWBOEK</small><h2>Eigen bouwwerken</h2><p>Kies een ontwerp. Loop naar een vrije plek en plaats het met E of de plaatsknop. Bouwblokken kun je naast elkaar zetten, stapelen en beklimmen. Sta je ervoor, dan pak je een bouwwerk met E weer op.</p><div class="row"><button id="crate">Bouwblok · 1 hout</button><button id="lamp">Lantaarn · 1 steen</button>'+['bloembak','bankje','vlag'].filter(k=>s.items[k]).map(k=>'<button data-item="'+k+'">'+k[0].toUpperCase()+k.slice(1)+' · '+s.items[k]+' over</button>').join('')+'</div><p>In je rugzak: '+s.hout+' hout en '+s.steen+' steen. Bloembakken, bankjes en vlaggen koop je in de handelspost.</p>'+buttons());back();
 document.querySelectorAll('[data-item]').forEach(b=>b.onclick=()=>choose(b.dataset.item));
 function choose(type){if(['blok','lamp'].includes(type)?s[type==='blok'?'hout':'steen']<1:!s.items[type]){notify('Verzamel eerst materiaal.');closePanel();return}placement=type;preview=world.construction(0,0,0,type,world.scene);preview.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.transparent=true;o.material.opacity=.48}});closePanel()}
 $('crate').onclick=()=>choose('blok');$('lamp').onclick=()=>choose('lamp')}
const BUILD_NAME={blok:'Bouwblok',lamp:'Lantaarn',bloembak:'Bloembak',bankje:'Bankje',vlag:'Vlag'};
function site(){let x=Math.round((p.x-Math.sin(p.heading)*2.9)/2)*2,z=Math.round((p.z-Math.cos(p.heading)*2.9)/2)*2,y=world.ground(x,z,s);
 let near=[...world.nodes,...repair,...world.gates].some(o=>Math.hypot(o.x-x,o.z-z)<3);let valid=area()&&world.islands.some(i=>Math.hypot(x-i.x,z-i.z)<i.r-2)&&y>=world.liftAt(x,z)-.01&&y<=p.y+1.23&&!near&&!world.blocked(x,z,placement==='blok'?{...s,builds:s.builds.filter(b=>b.type!=='blok')}:s,y,placement==='blok'?1.40:.55)&&(placement!=='blok'||!s.builds.some(b=>b.type==='blok'&&b.x===x&&b.z===z&&Math.abs(b.y-y)<1.1))&&!s.builds.some(b=>b.x===x&&b.z===z&&b.type==='lamp');
 return {x,y,z,valid}}
function place(){let b=site();if(!b.valid){notify('Zoek een vrije plek op het eiland.');return}const item=!['blok','lamp'].includes(placement);let material=placement==='blok'?'hout':'steen';if(item?!s.items[placement]:!s[material]){clearPlacement();return}
 s.builds.push({x:b.x,y:b.y,z:b.z,type:placement});if(item)s.items[placement]--;else s[material]--;clearPlacement();world.sync(s);persist();updateHUD();notify('Bouwwerk geplaatst')}
function logbook(){show('<small>VLUCHTLOG · '+profile.toUpperCase()+'</small><h2>Jouw expeditie</h2><p>'+(s.stage<3?'Level 1: '+s.stage+' van 3 missies voltooid.':(s.level||1)<2?'Level 1 voltooid. Level 2 staat klaar.':l3On()?'Level 3: '+l3().progress.current+' van 5 fases van de wachttoren hersteld.':(s.level||1)>=4&&houseReady()?(houseInfo()?(houseInfo().progress.finished?'Alle vier de levels voltooid. Je huis staat; richt het in.':'Level 4: '+houseInfo().progress.current+' van 5 fases van je huis gebouwd.'):'Level 4: ontwerp je huis.'):l3Done()?'Level 3 voltooid. Level 4 staat klaar.':s.stage>=6?'Level 2 voltooid. Level 3 staat klaar.':'Level 2: '+(s.stage-3)+' van 3 missies voltooid.')+' Vandaag heb je '+Track.minutesToday()+' minuten geoefend. Per vaardigheid zie je hoeveel antwoorden goed waren van alle pogingen.</p>'+(profile==='Niek'?German.groups.map((g,i)=>{let entries=Object.values(s.log.items).filter(e=>German.bank[e.id].skill===i);return '<div class="meter">'+g+'<b>'+entries.reduce((a,e)=>a+e.good,0)+' / '+entries.reduce((a,e)=>a+e.attempts,0)+'</b></div>'}).join('')+'<p>'+Object.values(s.log.items).filter(e=>e.due!==null).length+' opdrachten staan klaar voor herhaling.</p>':'<p>Duits en geschiedenis worden toegevoegd zodra je havo 3-stof er is.</p>')+dutchStats()+(s.best?'<p>Persoonlijk record windrace: '+s.best.toFixed(1)+' seconden.</p>':'')+'<h3>Dorpsonderzoeken</h3>'+villageHomes.map(h=>'<div class="meter">'+h.place+' · '+h.name+'<b>'+(s.village?.[h.key]?'Afgerond':'Open')+'</b></div>').join('')+'<div class="row"><button id="practice">Oefen Duits</button><button id="historyLog">Oefen geschiedenis</button><button id="practiceNL">Oefen Nederlands</button><button id="pilot">Wissel personage</button>'+(s.stage===3&&(s.level||1)<2?'<button id="lvl2" class="primary">Start level 2</button>':'')+(s.stage>=6&&(s.level||1)<3?'<button id="lvl3" class="primary">Start level 3</button>':'')+(l3Done()&&(s.level||1)<4?'<button id="lvl4" class="primary">Start level 4</button>':'')+((s.level||1)>=4&&houseReady()?'<button id="myhouse">Mijn huis</button>':'')+'<button id="restart">Opnieuw beginnen</button></div><p><a href="art/credits.txt" target="_blank" rel="noopener">Makers van de 3D-beelden</a></p>'+buttons());back();$('practiceNL').onclick=()=>dutchRound(false);if($('lvl2'))$('lvl2').onclick=startLevel2;if($('lvl3'))$('lvl3').onclick=startLevel3;if($('lvl4'))$('lvl4').onclick=startLevel4;if($('myhouse'))$('myhouse').onclick=housePanel;$('restart').onclick=restartGame;$('practice').disabled=$('historyLog').disabled=profile==='Floor';$('practice').onclick=school;$('historyLog').onclick=historyMenu;$('pilot').onclick=()=>{persist();playing=false;clearPlacement();$('panel').close();$('hud').hidden=true;$('entry').hidden=false}}
$('journal').onclick=logbook;$('adminbtn').hidden=!admin.asked;$('adminbtn').onclick=adminOpen;$('mapbtn').onclick=()=>{show('<small>ATLAS · NOORD ↑</small><h2>De windroute</h2><canvas id="atlas" width="600" height="420" aria-label="Kaart met eilanden, bruggen en je positie"></canvas>'+missionOverview()+buttons());drawAtlas();back()};
$('act').onclick=act;$('build').onclick=chooseBuild;function jump(){if(currentRoom||admin.fly)return;if(p.on){p.vy=7.8;p.on=false}else if(s.stage>=2&&p.y>.35){p.glide=!p.glide;if(p.glide)notify('Zwever open · stuur met je gewone besturing')}}$('jump').onclick=jump;
// Physical keys (e.code) keep WASD working with Shift, Caps Lock or another layout. Synthetic test events without a code fall back to e.key.
const codeNames={KeyW:'w',KeyA:'a',KeyS:'s',KeyD:'d',KeyE:'e',KeyB:'b',KeyM:'m',ArrowUp:'arrowup',ArrowDown:'arrowdown',ArrowLeft:'arrowleft',ArrowRight:'arrowright',Space:' ',ShiftLeft:'shift',ShiftRight:'shift',Escape:'escape'};
const keyName=e=>codeNames[e.code]||(e.key||'').toLowerCase();
// A key release that never reaches the page (context menu, Alt menu, tab switch) used to leave the pilot walking. Drop all input then.
function releaseControls(){keys.clear();joyX=joyZ=0;$('joy').firstElementChild.style.transform=''}
window.addEventListener('keydown',e=>{if(!playing||$('panel').open)return;if(e.ctrlKey||e.metaKey||e.altKey){releaseControls();return}let k=keyName(e);if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();keys.add(k);if(e.repeat)return;if(k===' ')jump();if(k==='e')act();if(k==='b')chooseBuild();if(k==='m')$('mapbtn').click();if(k==='g'&&admin.asked)adminOpen();if(k==='escape')clearPlacement()});
window.addEventListener('keyup',e=>{const k=keyName(e);keys.delete(k);keys.delete((e.key||'').toLowerCase());if(k===' '&&playing&&!$('panel').open)e.preventDefault();if(['Alt','Meta','Control','OS'].includes(e.key))releaseControls()});
window.addEventListener('blur',()=>{releaseControls();persist()});window.addEventListener('pagehide',persist);
document.addEventListener('visibilitychange',()=>{if(document.hidden)releaseControls()});
window.addEventListener('contextmenu',e=>{releaseControls();if(playing&&!$('panel').open)e.preventDefault()});
// A clicked HUD button keeps focus; Space would then press it again instead of only jumping.
$('hud').addEventListener('click',e=>{const b=e.target.closest('button');if(b&&e.detail)b.blur()});
const joy=$('joy');function stick(e){let b=joy.getBoundingClientRect(),x=(e.clientX-b.left-b.width/2)/36,z=(e.clientY-b.top-b.height/2)/36,l=Math.max(1,Math.hypot(x,z));joyX=x/l;joyZ=z/l;joy.firstElementChild.style.transform='translate('+joyX*25+'px,'+joyZ*25+'px)'}
function releaseStick(){joyX=joyZ=0;joy.firstElementChild.style.transform=''}
joy.onpointerdown=e=>{try{joy.setPointerCapture(e.pointerId)}catch{}stick(e)};joy.onpointermove=e=>{if(joy.hasPointerCapture(e.pointerId))stick(e)};joy.onlostpointercapture=joy.onpointerup=joy.onpointercancel=releaseStick;
const canvas=$('world');canvas.onpointerdown=e=>{if(playing){canvas.setPointerCapture(e.pointerId);drag=[e.clientX,e.clientY,e.button===2]}};canvas.onpointermove=e=>{if(!drag)return;if(drag[2]){view.look=Math.max(-.15,Math.min(1,(view.look||0)-(e.clientY-drag[1])*.006));view.yaw-=(e.clientX-drag[0])*.007;followHeading=null;drag=[e.clientX,e.clientY,true];return}const orbit=(e.clientX-drag[0])*.007;view.yaw-=orbit;if(movementYaw!==null)movementYaw-=orbit;followHeading=null;view.height=Math.min(10,Math.max(3,view.height+(e.clientY-drag[1])*.035));drag=[e.clientX,e.clientY]};canvas.onlostpointercapture=()=>drag=null;canvas.onwheel=e=>{view.dist=Math.max(5,Math.min(13,view.dist+e.deltaY*.01))};
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
  const speed=(keys.has('shift')?9.2:6.2)*(drive<0?.6:1)*drive*(admin.fly&&!currentRoom?2.2:1),vx=-Math.sin(p.heading)*speed,vz=-Math.cos(p.heading)*speed;
  const stuck=currentRoom&&world.blocked(p.x,p.z,s,p.y)||admin.fly&&!currentRoom;if(stuck||!world.blocked(p.x+vx*dt,p.z,s,p.y))p.x+=vx*dt;if(stuck||!world.blocked(p.x,p.z+vz*dt,s,p.y))p.z+=vz*dt}
 if(admin.fly&&!currentRoom){p.glide=false;p.vy=0;if(keys.has(' '))p.y+=(keys.has('shift')?18:9)*dt;if(keys.has('c'))p.y-=(keys.has('shift')?18:9)*dt;const fl=world.ground(p.x,p.z,s,p.y+.5);if(p.y<=fl){p.y=fl;p.on=true}else p.on=false}else{
 // The glider only drifts forward while you steer; let go and it sinks slowly in place.
 if(p.glide&&p.speed>.03){let gx=p.x-Math.sin(p.heading)*dt*2.6,gz=p.z-Math.cos(p.heading)*dt*2.6;if(!world.blocked(gx,gz,s,p.y)){p.x=gx;p.z=gz}else p.glide=false}let floor=world.ground(p.x,p.z,s,p.y);p.vy-=20*dt;if(p.glide)p.vy=Math.max(-1.15,p.vy);if(p.vy>0){let limit=world.ceiling(p.x,p.z,s,p.y,2.68)-2.68;if(p.y+p.vy*dt>limit){p.y=limit;p.vy=0}}p.y+=p.vy*dt;if(p.y<=floor&&p.vy<=0){p.y=floor;p.glide=false;p.vy=0;p.on=true}else if(p.on&&p.vy<=0&&!p.glide&&floor>p.y-.5&&floor>-50){p.y=floor;p.vy=0}else p.on=false;}if(p.y<world.liftAt(p.x,p.z)-12)respawn();
 // Wind barrier: an island whose bridge is not built yet cannot be reached by jumping, gliding or stacking blocks.
 // Near its edge a gust blows you back the way you came (and once over open air you drop back to safe ground).
 if(!admin.fly&&!currentRoom&&!p.ride){for(const I of world.islands){if((I.open??0)<=s.stage)continue;const dx=p.x-I.x,dz=p.z-I.z,d=Math.hypot(dx,dz)||1,edge=I.r+2.5;
   if(d<edge){p.x=I.x+dx/d*edge;p.z=I.z+dz/d*edge;p.gust={x:dx/d*7,z:dz/d*7,t:.7};p.glide=false;const now=performance.now();if(now-windNote>5000){windNote=now;notify('Een windvlaag blaast je terug. Bouw eerst de brug naar '+I.name+'.')}}}
  if(p.gust){const gx=p.x+p.gust.x*dt,gz=p.z+p.gust.z*dt;if(!world.blocked(gx,gz,s,p.y)){p.x=gx;p.z=gz}p.gust.t-=dt;if(p.gust.t<=0)p.gust=null}}
 // Wind rings count when you pass through them, walking or jumping.
 const throughGate=g=>{const L=world.liftAt(g.x,g.z);return dist(g)<1.8&&p.y>L-.2&&p.y<L+4.4};
 if(s.stage===2)world.gates.forEach((g,i)=>{if(!s.rings.includes(i)&&throughGate(g)){s.rings.push(i);g.g.visible=false;notify('Windring gevonden · '+s.rings.length+'/3');persist()}});
 if(race){const g=world.gates[race.hit];if(throughGate(g)){g.g.visible=false;race.hit++;
 if(race.hit===3){let seconds=(performance.now()-race.start)/1000;s.best=Math.min(s.best??Infinity,seconds);s.hout+=2;s.steen++;race=null;persist();notify('Finish! '+seconds.toFixed(1)+' s · +2 hout en +1 steen')}else world.gates[race.hit].g.visible=true}}
 if(preview){let b=site();preview.position.set(b.x,Math.max(0,b.y),b.z);preview.visible=b.valid}
}
// Missions per level for the atlas: what is done, what is next, what comes later. The numbers match the map pins.
function missionList(){const lvl=s.level||1,st=s.stage,out=[];
 missions.forEach((m,i)=>{const L=i<3?1:2,open=L===1||lvl>=2;out.push({level:L,n:L===1?i+1:i-2,text:m[0],state:st>i?'done':st===i&&open?'now':'later',at:repair[i]})});
 const t=l3(),tp=t&&t.progress;out.push({level:3,n:1,text:'Herstel de vergeten wachttoren'+(tp&&!tp.finished?' · fase '+(tp.current+1)+' van '+tp.total:''),state:tp?.finished?'done':lvl>=3?'now':'later',at:L3.site});
 const h=typeof houseInfo==='function'?houseInfo():null,hp=h&&h.progress,d=h?h.design:s.houseDraft;
 out.push({level:4,n:1,text:hp?(hp.finished?'Je huis is klaar · richt het in':'Bouw je huis · fase '+(hp.current+1)+' van '+hp.total):'Ontwerp en bouw je eigen huis',state:hp?.finished?'done':lvl>=4?'now':'later',at:d?{x:d.x,z:d.z}:null});
 return out}
function missionOverview(){const list=missionList(),done=villageHomes.filter(h=>s.village?.[h.key]).length;
 return '<div class="mlevels">'+[1,2,3,4].map(L=>'<div class="mlevel"><b>Level '+L+'</b>'+list.filter(m=>m.level===L).map(m=>'<div class="mrow '+m.state+'"><i>'+(m.state==='done'?'✓':m.state==='now'?'▶':'')+'</i><span>'+(L<3?L+'.'+m.n+' ':'')+m.text+'</span></div>').join('')+'</div>').join('')+
  '<div class="mlevel"><b>Dorpsonderzoeken</b><div class="mrow '+(done===villageHomes.length?'done':'now')+'"><i>'+(done===villageHomes.length?'✓':'▶')+'</i><span>'+done+' van '+villageHomes.length+' bewoners geholpen</span></div></div></div>'}
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
 // mission pins: a green tick when done, an orange numbered pin for the current mission, grey for later ones
 for(const m of missionList()){if(!m.at)continue;const x=px(m.at.x),y=py(m.at.z),now=m.state==='now';ctx.beginPath();ctx.arc(x,y,now?11:8,0,Math.PI*2);ctx.fillStyle=m.state==='done'?'#5d9a5a':now?'#ff8a3d':'#9aa7a6';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#fff';ctx.stroke();
  ctx.fillStyle='#fff';ctx.font='bold '+(now?13:11)+'px system-ui';ctx.textAlign='center';ctx.fillText(m.state==='done'?'✓':m.level<3?m.level+'.'+m.n:'L'+m.level,x,y+4);ctx.textAlign='left'}
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
 {const cp=cur();if(cp&&cp.r.answersNeeded>0&&cp.r.stepStory.npc===h.key&&!interview.skip3){projTalk(cp.P,h);return}interview.skip3=false}
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
let hudAt=0,saveAt=0;function frame(now){let dt=Math.min(.06,(now-last)/1000||.016);last=now;if(playing&&!admin.on){Track.tick(dt,$('panel').open&&!!$('content').querySelector('form input,form button,[data-ask],.question'));Track.sync(snapshot)}if(playing&&!$('panel').open){let elapsed=Math.min(.25,(now-(frame.previous??now))/1000);while(elapsed>0){let step=Math.min(.025,elapsed);move(step);elapsed-=step}followCamera(dt)}frame.previous=now;if(now>hudAt){updateHUD();hudAt=now+140}if(now>saveAt){persist();saveAt=now+2000}if(playing)world.animate(now/1000,s,p,view,false,dt);requestAnimationFrame(frame)}
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
document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing&&!admin.on){Track.save();Track.sync(snapshot,true)}});
