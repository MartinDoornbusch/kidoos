(async()=>{
 const out=document.getElementById('report');out.textContent='';
 for(const mobile of [false,true]){
 const frame=document.createElement('iframe');frame.width=mobile?390:980;frame.height=mobile?844:640;document.getElementById('screen').replaceChildren(frame);
 let src=await (await fetch('../index.html')).text();
 src=src.replace('<head>','<head><base href="../">').replace('<script src="vendor/three.min.js">','<script>const tempStore=new Map();Object.defineProperty(window,"localStorage",{value:{getItem:k=>tempStore.get(k),setItem:(k,v)=>tempStore.set(k,v)}});<\/script><script src="vendor/three.min.js">');
 if(mobile){let css=await(await fetch('../style.css')).text();src=src.replace('</head>','<style>'+css.replace('@media(pointer:coarse)','@media(min-width:0px)')+'</style></head>')}
 const loaded=new Promise(resolve=>frame.onload=resolve);frame.srcdoc=src;await loaded;const w=frame.contentWindow;
 try{const run=w.document.createElement('script');run.textContent='('+scenario.toString()+')('+mobile+')';w.document.body.append(run);if(!w.document.body.dataset.result)throw Error('Geen testresultaat');out.textContent+=(mobile?'Mobiel 390 × 844':'Desktop 980 × 640')+'\n'+w.document.body.dataset.result+'\n';}catch(e){out.textContent+=e.message}
 }
 out.textContent+='Test afgerond.';
})()
function scenario(mobile){const results=[];function pass(ok,label){if(!ok)throw Error(label+' (mislukt)');results.push('✓ '+label)}
function near(a,b){return Math.abs(a-b)<.45}
function walk(x,z,reach=.24){
 // Navigate the route with the same input and physics as a player. Keep clearance
 // at corners and stop within interaction range of solid resource piles.
 const spacing=.5,id=(a,b)=>a+'/'+b;
 const first={x:Math.round(p.x/spacing)*spacing,z:Math.round(p.z/spacing)*spacing};
 const frontier=[first],seen=new Set(),distance=n=>Math.hypot(n.x-x,n.z-z);
 let end;
 while(frontier.length&&seen.size<36000){
  const n=frontier.pop();if(distance(n)<=reach){end=n;break}
  const next=[];
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const a=n.x+dx*spacing,b=n.z+dz*spacing,k=id(a,b);
   if(seen.has(k)||Math.abs(a)>26||b>26||b< -146)continue;seen.add(k);
   const height=world.ground(a,b,s,.25);
   if(height<-.5||world.blocked(a,b,s,height,.47))continue;
   next.push({x:a,z:b,parent:n});
  }
  next.sort((a,b)=>distance(b)-distance(a));frontier.push(...next)
 }
 if(!end)throw Error('Geen looproute naar '+[x,z]);
 const path=[];for(let n=end;n;n=n.parent)path.push(n);
 for(const n of path.reverse()){
  let turns=0;while(Math.hypot(n.x-p.x,n.z-p.z)>.085&&turns++<120){
   const dx=n.x-p.x,dz=n.z-p.z,l=Math.max(.19,Math.hypot(dx,dz));joyX=dx/l;joyZ=dz/l;move(.018);
  }
  if(turns>=120)throw Error('Blokkade op '+[p.x,p.z].map(a=>a.toFixed(2))+' naar '+[x,z])
 }
 joyX=joyZ=0;updateHUD()
}
function click(id){const el=document.getElementById(id);if(!el)throw Error('Ontbrekende actie '+id);el.click()}
function harvest(x,z){walk(x,z,2.5);click('act')}
function solve(wrong=false){let question=document.querySelector('.question').textContent;let q=German.bank.find(q=>q.sentence===question);const answer=wrong?'testfout':q.correct;
 if($('word')){$('word').value=answer;$('answer').requestSubmit()}else{[...$('answer').querySelectorAll('button')].find(b=>b.textContent===answer).click()}click('continue')}
function answerHistory(){
 const prompt=document.querySelector('.question').textContent,q=HistoryCourse.bank.find(q=>q.prompt===prompt);
 if($('historyWord')){$('historyWord').value=q.answer.split('|')[0];$('historyForm').requestSubmit()}
 else [...$('historyForm').children].find(b=>b.textContent===q.answer).click();
 click('historyNext')
}
function repairHere(stage){const target=repair[stage];walk(0,target.z,stage===2?3.5:.25);click('act');
 if(stage===1){click('historyMission');for(let j=0;j<3;j++)answerHistory();click('work');pass(s.stage===2,'Geschiedenisvragen ontgrendelen de bergbrug');return}
 click('work');let loops=0;while($('answer')&&loops++<10)solve();click('work');pass(s.stage===stage+1,'Missie '+(stage+1)+' voltooid met verzameld materiaal en Duitse instructies')}
try{click('start');pass(playing&&s.stage===0,'Nieuw profiel start in Windhaven');
 pass(document.querySelector('.profilelabel').textContent.includes('HAVO 2'),'Niek heeft het profiel Havo 2');
 const original={...p};
 for(const room of world.rooms){
  const h=room.house;
  Object.assign(p,{x:h.x,z:h.z+.85,y:0});click('act');pass(currentRoom===room,h.place+' is betreedbaar');
  joyZ=-1;for(let i=0;i<17;i++)move(.025);joyZ=0;updateHUD();click('act');
  document.querySelector('[data-ask="1"]').click();click('askAgain');document.querySelector('[data-ask="0"]').click();
  document.querySelector('[data-conclusion="'+h.right+'"]').click();click('endTalk');
  pass(s.village[h.key],h.name+' beantwoordt je vraag en het onderzoek wordt opgeslagen');
  Object.assign(p,{x:room.exit.x,z:room.exit.z});click('act');pass(!currentRoom,'De uitgang leidt terug naar het dorp')
 }
 // Use a fresh local profile for the independent progression scenario.
 s=newSave();Object.assign(p,original);view.yaw=0;world.sync(s);resetSteering();
 const poseBefore={...p};
 const originalYaw=view.yaw;
 for(const angle of [0,1.19]){
  for(const [x,z] of [[1,0],[-1,0],[0,1],[0,-1]]){
   Object.assign(p,poseBefore);view.yaw=angle;resetSteering();joyX=x;joyZ=z;
   const vx=x*Math.cos(angle)+z*Math.sin(angle),vz=z*Math.cos(angle)-x*Math.sin(angle);
   for(let i=0;i<60;i++){move(.01);followCamera(.01)}
   const along=(p.x-poseBefore.x)*vx+(p.z-poseBefore.z)*vz;
   const drift=Math.abs((p.x-poseBefore.x)*vz-(p.z-poseBefore.z)*vx);
   pass(along>1&&drift<.05&&-Math.sin(p.heading)*vx-Math.cos(p.heading)*vz>.999&&Math.cos(view.yaw-p.heading)>.98,
    'Volgcamera en looprichting bij invoer '+[x,z]+' en camerahoek '+angle);
  }
 }
 joyX=joyZ=0;resetSteering();view.yaw=originalYaw;Object.assign(p,poseBefore);
 function driveFrom(x,z,key,seconds,doJump=false){
  Object.assign(p,{x,z,y:0,vy:0,on:true,glide:false});keys.add(key);keys.add('shift');
  if(doJump)jump();for(let i=0;i<seconds*100;i++)move(.01);keys.clear()
 }
 driveFrom(-8,9.5,'w',.55,true);pass(p.z>7.4,'Sprint en sprong stoppen bij de gevel');
 keys.add('a');driveFrom(-6.6,6,'w',.22,true);pass(p.x> -7.1&&p.z<5,'Schuine sprong glijdt langs de gevel '+p.x.toFixed(2)+' / '+p.z.toFixed(2));
 const savedView={...view};
 Object.assign(p,{x:-8,z:8.1,y:0,heading:0});view.yaw=Math.PI;
 world.animate(0,s,p,view,false,1);pass(world.cam.position.z>7.35,'Camera trekt vóór de gevel in');
 Object.assign(view,savedView);
 driveFrom(8,6.5,'w',.3);pass(p.z>4.7,'Boomstam houdt de piloot tegen');
 driveFrom(6,17,'w',.75);pass(p.z>15.2,'Havenkisten houden de piloot tegen');
 driveFrom(-5,10,'w',.5);pass(p.z>8.4,'Houtstapel blokkeert vóór verzamelen');
 pass(world.blocked(-9,-11,s,4.7)&&world.blocked(-9,-125,s,4.7),'Molen en sterrenwacht blijven op hoogte solide');
 pass(world.blocked(0,-130,s,0)&&world.blocked(-5,4,s,0),'Baken en poortpalen zijn solide');
 Object.assign(p,poseBefore);
 if(mobile){const j=$('joy'),r=j.getBoundingClientRect();pass(r.width>70,'Aanraakjoystick past in portretweergave');let old=p.z;stick({clientX:r.left+r.width/2,clientY:r.top+1});move(.1);joyZ=joyX=0;pass(p.z<old,'Joystick stuurt het personage');}
 else {let old=p.z;window.dispatchEvent(new KeyboardEvent('keydown',{key:'w'}));move(.1);window.dispatchEvent(new KeyboardEvent('keyup',{key:'w'}));pass(p.z<old,'W-toets beweegt het personage')}
 walk(-5,7,2.5);click('act');pass(s.hout===2,'Houtstapel geeft twee hout');click('act');pass(s.hout===2,'Lege stapel geeft geen dubbele beloning');
 walk(0,12);p.heading=0;click('build');click('crate');click('act');pass(s.builds.length===1&&s.hout===1,'Vrij bouwblok geplaatst en hout afgeschreven');
 let b=s.builds[0];walk(b.x,b.z+1.6,.26);joyZ=-1;for(let j=0;j<12;j++)move(.025);joyZ=0;pass(p.z>b.z+1.2,'Botsing met gebouwd blok');jump();joyZ=-1;for(let j=0;j<15;j++)move(.025);joyZ=0;for(let j=0;j<35;j++)move(.025);pass(near(p.y,1.12),'Op eigen blok gesprongen');
 joyX=1;for(let j=0;j<17;j++)move(.025);joyX=0;walk(5,-1,2.5);click('act');harvest(-5,-9);pass(s.hout>=3&&s.steen>=1,'Materiaal voor eerste brug verzameld');
 pass(world.ground(0,-31,s)<-10,'Oversteek begint als lucht');walk(0,-21);click('act');click('work');const bad=German.next(s.log).id;solve(true);pass(s.seals===0&&s.log.items[bad].due!=null,'Fout wordt ingepland en levert geen reparatie op');solve();solve();click('work');pass(s.stage===1&&world.ground(0,-31,s)>=0,'Eerste brug gerepareerd en beloopbaar');
 const onBridge={...p};driveFrom(0,-31,'d',.55);pass(p.x<1.48,'Brugleuning stopt zijwaartse sprint');Object.assign(p,onBridge);
 walk(0,-44);harvest(-6,-47);harvest(5,-54);harvest(5,-73);repairHere(1);walk(0,-100);harvest(-5,-104);harvest(6,-114);
 for(let g of world.gates){walk(g.x,g.z);jump();for(let j=0;j<10;j++)move(.025);if(g===world.gates[0]){jump();pass(p.glide,'Zwever opent in de lucht');jump()}for(let j=0;j<50;j++)move(.025)}
 pass(s.rings.length===3,'Drie windringen bereikt');repairHere(2);click('back');
 click('mapbtn');pass($('atlas').width===600,'Atlas opent met actuele posities');click('back');
 const previousWood=s.hout;click('act');pass(!!race,'Tijdrit bij het baken gestart');for(const g of world.gates){walk(g.x,g.z);jump();for(let j=0;j<60;j++)move(.025)}pass(s.best>0&&!race&&s.hout===previousWood+2,'Tijdrit voltooid met record en materiaalbeloning');
 pass(s.log.items[bad].good>0&&s.log.items[bad].due===null,'Eerdere fout opnieuw aangeboden en goed beantwoord');
 click('journal');click('pilot');document.querySelector('[data-profile="Floor"]').click();click('start');pass(!s.stage&&!s.builds.length&&!s.log.turn,'Tweede profiel heeft eigen leer- en spelvoortgang');
 click('journal');click('pilot');document.querySelector('[data-profile="Niek"]').click();click('start');pass(s.stage===3&&s.builds.length===1&&s.rings.length===3,'Einddoel en bouwwerk hersteld uit opgeslagen profiel');
 click('journal');click('practice');click('reference');pass($('lists').querySelectorAll('.studyline').length===German.bank.length,'Leerlijst bevat alle toetskaarten');click('training');
 const writing=$('subjects').children[3];writing.click();const firstSentence=document.querySelector('.question').textContent;pass(German.bank.some(q=>q.skill===3&&q.sentence===firstSentence),'Schreibmittel vragen Nederlands naar Duits');solve(true);solve();solve();pass(document.querySelector('.question').textContent===firstSentence,'Schrijfzin komt na twee andere vragen terug');click('back');
 click('journal');click('historyLog');pass($('historyTopics').children.length===5,'Geschiedenis bevat precies vijf paragrafen');click('mixedHistory');for(let j=0;j<10;j++)answerHistory();pass($('content').querySelector('h2').textContent==='10 van 10 goed','Gemengde geschiedenistoets met uitslag');click('back');
 const rect=$('jump').getBoundingClientRect();pass(rect.x>=0&&rect.right<=innerWidth&&rect.bottom<=innerHeight,'Actieknoppen passen in het scherm');
}catch(e){results.push('FOUT: '+e.message+' '+e.stack.split('\n').slice(1,2))}
document.body.dataset.result=results.join('\n')}
