"use strict";
/*
 * StudyQuest Construction Atelier — standalone prototype.
 * URL: /checks/construction-demo.html (on development branch)
 * Never touches the main game save, tracks or world. The questions here are
 * illustrative demo-only tasks, NOT the school question banks.
 */
(() => {
  const $=id=>document.getElementById(id);
  const T=window.THREE;
  const Campaign=ConstructionCampaign, Designer=HouseDesigner, Planner=HousePlanner, Projects=ConstructionProjects;
  const KEY="studyquest.construction.preview.v1";
  const ids={ruin:"ruin-demo",house:"house-demo"};
  const $status=$("feedback");
  let active="ruin", inside=false, save, view=null, currentModel=null;
  const QUESTIONS={
    ruin:{
      survey:[["Hoe leg je vast welke muren van een ruïne beschadigd zijn?",["Door alleen naar de kleur te kijken","Met een schets en duidelijke waarnemingen","Door meteen een nieuw dak te bouwen"],1]],
      clear:[["Waarom ruim je eerst los puin en kapotte balken op?",["Om de fundering veilig te kunnen onderzoeken","Omdat steen geen gewicht heeft","Om de toren hoger te maken"],0]],
      stonework:[["Waarom metsel je stenen in verband?",["Dan lijken ze allemaal even groot","Dan ontstaat een stevigere muur","Dan heb je geen mortel nodig"],1],
        ["Welk materiaal gebruik je vooral voor een historische stenen torenmuur?",["Glas","Steen","Textiel"],1]],
      platform:[["Wat maakt een hoge trap veiliger om te gebruiken?",["Een stevige leuning","Een gladde leuning zonder steun","Ontbrekende treden"],0]],
      roof:[["Waarvoor dient een goed dak op de toren?",["Om muren nat te laten worden","Om de verdieping tegen regen te beschermen","Om de fundering te vervangen"],1],
        ["Wat kun je vanaf een wachttoren beter doen dan vanaf de grond?",["De omgeving overzien","De muren wegen","Ondergronds graven"],0]]
    },
    house:{
      foundation:[["Wat draagt het gewicht van de muren van een huis?",["De fundering","De gordijnen","Het tuinhek"],0]],
      frame:[["Welke constructie vormt de draagstructuur van een vakwerkhuis?",["Houten balken","Alleen glas","De dakpannen"],0]],
      walls:[["Waarom moeten ramen op de juiste plaats komen?",["Om een doorgang en stevige muren te behouden","Omdat elke muur een raam nodig heeft","Omdat de vloer dan kleiner wordt"],0],
        ["Waar kun je het beste een deur plaatsen?",["Midden door een dragende balk","Op een vrijgehouden opening in de gevel","Onder de grond"],1]],
      roof:[["Waarvoor dienen dakpannen?",["Ze beschermen tegen regen","Ze houden de deuren open","Ze vervangen de fundering"],0]],
      interior:[["Welke vloer past goed bij een historisch vakwerkhuis?",["Houten vloerplanken","Los grind op de verdieping","Dakpannen als binnenvloer"],0]]
    }
  };
  const MSG={
    "needs-answers":"Maak eerst de voorbeeldvragen van deze bouwfase.",
    "needs-materials":"Er zijn nog onvoldoende bouwmaterialen.",
    "already-complete":"Dit bouwproject is al klaar."
  };
  function notify(message){$status.textContent=message;}
  function saveDemo(){try{localStorage.setItem(KEY,JSON.stringify(save))}catch{notify("Opslaan lukt niet; de proef blijft bruikbaar zolang deze pagina openstaat.");}}
  function context(){return {plot:{id:"demo-kavel",x:0,z:0,width:15,depth:13,rotation:0},obstacles:[],worldCheck:()=>true};}
  function fresh(){
    let s={hout:0,steen:0,planken:0,munten:0,builds:[]};
    const ruin=Campaign.start(s,{id:ids.ruin,blueprintId:"wachttoren_ruine",plotId:"demo-ruine",x:0,z:0});
    if(!ruin.ok)throw Error("Ruïneproject kon niet beginnen");
    s=ruin.save;
    const design=Designer.create({projectId:ids.house,plotId:"demo-kavel",x:0,z:0});
    const house=Planner.begin(s,design,context());
    if(!house.ok)throw Error("Huiskavel kon niet beginnen");
    return house.save;
  }
  function read(){
    try{
      const s=JSON.parse(localStorage.getItem(KEY));
      if(s&&Campaign.state(s,ids.ruin).ok&&Campaign.state(s,ids.house).ok&&Planner.get(s,ids.house).ok)return s;
    }catch(e){console.warn("Demo-opslag niet leesbaar",e)}
    return fresh();
  }
  save=read();
  function stage(){return Campaign.state(save,ids[active]);}
  function setupUI(){
    $("tabRuin").onclick=()=>select("ruin");
    $("tabHouse").onclick=()=>select("house");
    $("gather").onclick=()=>{save={...save,hout:save.hout+4,steen:save.steen+4,planken:save.planken+4};saveDemo();update();notify("Testmaterialen verzameld: +4 hout, +4 steen, +4 planken.")};
    $("reset").onclick=()=>{if(!confirm("Alleen de voortgang van deze proef opnieuw beginnen? De echte game blijft ongewijzigd."))return;save=fresh();saveDemo();select("ruin");notify("De proef is opnieuw begonnen.")};
    $("buildStep").onclick=()=>{
      const s=stage(),next=s.progress.next;
      if(!next)return;
      const out=Campaign.complete(save,ids[active]);
      if(!out.ok){notify(MSG[out.reason]||"Bouwen lukt nog niet.");return}
      save=out.save;saveDemo();inside=false;update();
      notify(out.finished?"Project voltooid! "+(out.rewards?.coins?"+12 munten en de verborgen kaart ontgrendeld.":"Je huis is klaar voor inrichting."):"Bouwfase klaar: "+(out.stageStory?.completedText||next.title));
    };
    for(const id of ["roof","roofMaterial","facade","timber","floor","door"]){
      $(id).addEventListener("change",()=>{
        const design=Planner.get(save,ids.house).design;
        const patch=id==="door" ? (()=>{try{const next=Designer.door(design,$(id).value,Campaign.state(save,ids.house).progress.current);return {door:next.door,windows:next.windows}}catch(e){notify(e.message);return null}})() : {[id]:$(id).value};
        if(patch)editHouse(patch);
      });
    }
    $("rotateLeft").onclick=()=>rotate(-90);
    $("rotateRight").onclick=()=>rotate(90);
    for(const [id,dx,dz] of [["moveWest",-1,0],["moveEast",1,0],["moveNorth",0,-1],["moveSouth",0,1]])$(id).onclick=()=>movePlot(dx,dz);
    $("lookInside").onclick=()=>{inside=!inside;$("lookInside").textContent=inside?"Bekijk buitenkant":"Kijk binnen";updateModel()};
    const furniture=document.createElement("section");
    furniture.className="design-section";furniture.id="furnitureSection";furniture.hidden=true;
    furniture.innerHTML='<h3>Interieur inrichten</h3><p class="small-note">Na de laatste bouwfase kun je meubels kopen en plaatsen. Verwijderde meubels bewaar je voor later.</p><label>Nieuw meubel <select id="furnitureType"><option value="table">Eettafel</option><option value="chair">Stoel</option><option value="bench">Bankje</option><option value="bed">Bed</option><option value="chest">Kist</option><option value="bookcase">Boekenkast</option></select></label><button type="button" id="addFurniture" class="subtle">Plaats meubel</button><div id="furnitureList"></div>';
    $("designSection").after(furniture);
    $("addFurniture").onclick=addFurniture;
  }
  function editHouse(patch){
    const result=Planner.change(save,ids.house,patch,context());
    if(!result.ok){notify(result.message||("Ontwerp niet toegestaan: "+(result.errors||[result.reason]).join(", ")));update();return}
    save=result.save;saveDemo();update();notify("Ontwerp aangepast. Je ziet de nieuwe keuze in de 3D-preview.");
  }
  function rotate(deg){
    const d=Planner.get(save,ids.house).design;
    editHouse({rotation:(d.rotation+deg+360)%360});
  }
  function movePlot(dx,dz){const d=Planner.get(save,ids.house).design;editHouse({x:d.x+dx,z:d.z+dz});}
  function addFurniture(){
    const type=$("furnitureType").value;
    const candidates=[[-2,-1],[1.5,-1],[2.5,1],[-2.5,1.5],[0,0],[1.5,1.5],[-2.5,-1.5],[2.5,-1.5]];
    const used=new Set([...Planner.get(save,ids.house).design.furniture.map(x=>x.id),...(save.houseFurnitureStorage||[]).map(x=>x.id)]);
    const count=used.size;
    const stored=(save.houseFurnitureStorage||[]).find(x=>x.type===type);
    const id=stored?stored.id:"demo-"+type+"-"+(count+1);
    for(const [x,z] of candidates){
      const result=Planner.placeFurniture(save,ids.house,{id,type,x,z,rotation:0});
      if(result.ok){save=result.save;saveDemo();update();notify(stored?"Meubel uit opslag geplaatst.":"Meubel geplaatst en materiaal afgeschreven.");return}
      if(result.reason==="needs-materials"){notify("Je hebt niet genoeg hout of planken voor dit meubel.");return}
    }
    notify("Er is geen geschikte vrije plek voor dit meubel. Verplaats of berg eerst iets op.");
  }
  function furnitureList(){
    const data=Planner.get(save,ids.house),target=$("furnitureList");
    const list=data.design.furniture;
    target.replaceChildren();
    for(const f of list){
      const line=document.createElement("div");line.className="furniture-item";
      const label=document.createElement("span");label.textContent=f.type+" · "+f.id;line.append(label);
      const move=document.createElement("button");move.type="button";move.textContent="Verplaats";move.className="subtle";
      move.onclick=()=>{
        const next=[[-2,-1],[1.5,-1],[2.5,1],[-2.5,1.5],[0,0],[1.5,1.5],[-2.5,-1.5],[2.5,-1.5]];
        for(const [x,z] of next){
          if(x===f.x&&z===f.z)continue;
          const r=Planner.moveFurniture(save,ids.house,f.id,{x,z});
          if(r.ok){save=r.save;saveDemo();update();notify("Meubel verplaatst.");return}
        }
        notify("Geen vrije andere plaats gevonden.");
      };
      const store=document.createElement("button");store.type="button";store.textContent="Opbergen";store.className="subtle";
      store.onclick=()=>{const r=Planner.storeFurniture(save,ids.house,f.id);if(r.ok){save=r.save;saveDemo();update();notify("Meubel opgeslagen; later gratis opnieuw plaatsen.")}};
      line.append(move,store);target.append(line);
    }
    if(!list.length){const p=document.createElement("p");p.className="small-note";p.textContent="Het huis is leeg. Kies een meubel hierboven.";target.append(p);}
  }
  function select(type){
    active=type;inside=false;
    $("tabRuin").classList.toggle("active",type==="ruin");
    $("tabHouse").classList.toggle("active",type==="house");
    $("lookInside").textContent="Kijk binnen";
    update();
  }
  function update(){
    const s=stage(),step=s.progress.next,ruin=active==="ruin";
    $("sceneTitle").textContent=ruin?"De vergeten wachttoren":"Mijn vakwerkhuis";
    $("sceneSubtitle").textContent=ruin?"Een oud gebouw krijgt een nieuw verhaal":"Ontwerp en bouw een eigen plek";
    $("phaseCount").textContent=s.progress.current+" van "+s.progress.total+" fasen voltooid";
    const percent=Math.round(s.progress.current/s.progress.total*100);
    $("progressPct").textContent=percent+"%";$("progressBar").style.width=percent+"%";
    $("wood").textContent=save.hout;$("stone").textContent=save.steen;$("planks").textContent=save.planken;$("coins").textContent=save.munten;
    $("stageTitle").textContent=step?step.title:"Helemaal klaar!";
    $("storyText").textContent=step?(s.stepStory?.goal||"Werk verder aan je bouwproject."):(s.story?.ending||"Je bouwproject is af.");
    $("quizHeading").textContent=step?"Opdracht voor deze fase":"Alle opdrachten afgerond";
    $("designSection").hidden=ruin;
    $("furnitureSection").hidden=ruin||!s.progress.finished;
    $("lookInside").hidden=ruin||!s.progress.finished;
    if(!ruin){
      const d=Planner.get(save,ids.house).design;
      for(const k of ["roof","roofMaterial","facade","timber","floor"])$(k).value=d[k];
      $("door").value=d.door.side;
      for(const k of ["facade","timber","door"])$(k).disabled=s.progress.current>=3;
      for(const k of ["roof","roofMaterial"])$(k).disabled=s.progress.current>=4;
      $("floor").disabled=s.progress.current>=5;
      $("rotateLeft").disabled=$("rotateRight").disabled=s.progress.current>=1;
      for(const id of ["moveWest","moveEast","moveNorth","moveSouth"])$(id).disabled=s.progress.current>=1;
      $("plotPosition").textContent="Kavelpositie: x = "+d.x+", z = "+d.z+" · rotatie "+d.rotation+"°";
      if(s.progress.finished)furnitureList();
    }
    renderQuiz(s);
    const cost=step?Object.entries(step.cost).map(([key,value])=>key+": "+value).join(" · "):"";
    const credits=step?"Goede antwoorden: "+s.correctAnswers+" / "+step.questions:"";
    $("needs").textContent=step?credits+(cost?" · Nodig: "+cost:" · Geen materialen nodig"):"Je kunt verder rondkijken en bij je huis de inrichting aanpassen.";
    $("buildStep").disabled=!s.canFinishStep;
    $("buildStep").hidden=!step;
    $("completion").hidden=!!step;
    if(!step){$("completion").textContent=ruin?"Beloning: 12 munten en toegang tot de uitkijkpost en oude kaart (demo-unlocks).":"Je huis is af. Kies onderaan welke meubels je wilt plaatsen.";}
    updateModel();
  }
  function renderQuiz(s){
    const target=$("quizBox");target.replaceChildren();
    if(!s.progress.next){
      const p=document.createElement("p");p.className="small-note";p.textContent="Alle voorbeeldvragen zijn goed beantwoord.";target.append(p);return;
    }
    const name=s.progress.next.id,available=QUESTIONS[active][name]||[],q=available[s.correctAnswers];
    if(!q){
      const p=document.createElement("p");p.textContent="Alle juiste antwoorden voor deze bouwfase zijn verzameld.";target.append(p);return;
    }
    const label=document.createElement("p");label.className="quiz-question";label.textContent=q[0];target.append(label);
    const options=document.createElement("div");options.className="answers";
    q[1].forEach((text,index)=>{
      const button=document.createElement("button");button.type="button";button.textContent=text;
      button.onclick=()=>{
        if(index!==q[2]){notify("Dat is nog niet goed. Probeer een ander antwoord.");return}
        const eventId="demo-attempt-"+active+"-"+name+"-"+s.correctAnswers;
        const result=Campaign.answer(save,ids[active],{eventId,questionId:"demo-question-"+active+"-"+name+"-"+s.correctAnswers,stageId:name,subject:"Nederlands",correct:true,verified:true});
        if(result.ok){save=result.save;saveDemo();update();notify("Goed beantwoord! Dit antwoord telt mee voor de huidige bouwfase.")}
        else notify("Deze beantwoording kon niet worden geregistreerd: "+result.reason);
      };
      options.append(button);
    });
    target.append(options);
  }

  /* Independent, deliberately simple preview geometry. Claude supplies final art. */
  let renderer,scene,camera,model,controls={yaw:.55,pitch:.55,distance:23}, dragging=null, resizeObserver;
  if(!T){$("renderError").hidden=false;setupUI();update();return}
  const colors={ground:0x516b4a,stone:0xafa99d,stoneDark:0x786f67,stoneLight:0xc9c4bb,wood:0x75523a,woodLight:0x9f7950,plaster:0xd2c5a5,brick:0xa76c56,slate:0x515c5e,roof:0x994c38,roofBrown:0x705249,gold:0xeacb81,glass:0x90c1b6};
  const mats={};Object.entries(colors).forEach(([k,color])=>mats[k]=new T.MeshStandardMaterial({color,roughness:k==="glass"?.4:.87,metalness:k==="gold"?.22:0}));
  mats.ghost=new T.MeshStandardMaterial({color:0xf3d99e,transparent:true,opacity:.23,depthWrite:false});
  function cube(parent,material,w,h,d,x,y,z,rotation=0){
    const m=new T.Mesh(new T.BoxGeometry(w,h,d),mats[material]||mats.wood);
    m.position.set(x,y,z);m.rotation.z=rotation;m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
  }
  function polygon(parent,material,radius,height,x,y,z,sides=8){
    const m=new T.Mesh(new T.CylinderGeometry(radius,radius,height,sides),mats[material]||mats.stone);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
  }
  function addRubble(group,n){
    for(let i=0;i<n;i++){
      const a=i*2.399,dist=2.7+(i%5)*.47,x=Math.cos(a)*dist,z=Math.sin(a)*dist;
      const mesh=new T.Mesh(new T.DodecahedronGeometry(.22+(i%4)*.12,0),mats[i%2?"stoneDark":"stone"]);
      mesh.position.set(x,.2,z);mesh.scale.set(1.4,.6,1);mesh.rotation.set(.2*i,.4*i,.17*i);mesh.castShadow=true;group.add(mesh);
    }
  }
  function ruinedWall(g,side){
    const a=side*Math.PI/2,wall=new T.Group();wall.rotation.y=a;g.add(wall);
    for(let j=0;j<2;j++)for(let i=0;i<5-j;i++){
      const x=-2.3+i*1.12+(j%2)*.23;
      if(j===1&&i%4===0)continue;
      cube(wall,j%3?"stone":"stoneDark",1.07,.54,.48,x,.35+j*.58,2.65);
    }
  }
  function repairTower(completed){
    const g=new T.Group();
    // Ruin is present at the start. Its pieces are illustrative; the final art
    // contract is in construction-story.js.
    polygon(g,"stoneDark",3.25,.45,0,.18,0,8);
    if(completed<3){for(let side=0;side<4;side++)ruinedWall(g,side);addRubble(g,completed<2?20:0)}
    if(completed>=1&&completed<3){
      const ring=cube(g,"gold",6.15,.07,6.15,0,.09,0);ring.material=mats.ghost;
      for(const [x,z]of [[-3,-3],[3,-3],[-3,3],[3,3]])cube(g,"gold",.10,1,.10,x,1,z);
    }
    if(completed>=3){
      // Four walls with a visible entrance in the front.
      for(const side of [-1,1])cube(g,"stone",.55,5.8,5.9,side*3,3,0);
      cube(g,"stone",5.9,5.8,.55,0,3,-3);
      cube(g,"stone",2.0,5.8,.55,-2.0,3,3);cube(g,"stone",2.0,5.8,.55,2.0,3,3);
      cube(g,"stone",2.0,1.5,.55,0,5.1,3);
      // Contrasting stone corner blocks.
      for(const x of [-3,3])for(const z of [-3,3])for(let y=.6;y<5.8;y+=.9)cube(g,"stoneLight",.72,.25,.72,x,y,z);
    }
    if(completed>=4){
      cube(g,"woodLight",5.6,.22,5.6,0,3.6,0);
      for(let i=0;i<9;i++)cube(g,"woodLight",1.2,.18,.58,1.65,.28+i*.38,2.2-i*.42);
      for(const x of [-2.5,2.5])for(const z of [-2.5,2.5])cube(g,"wood",.14,1.3,.14,x,4.27,z);
      for(const z of [-2.5,2.5])cube(g,"wood",5,.1,.12,0,4.9,z);
    }
    if(completed>=5){
      const r=new T.Mesh(new T.ConeGeometry(4.5,2.5,4),mats.slate);
      r.rotation.y=Math.PI/4;r.position.y=7.1;r.castShadow=true;g.add(r);
      polygon(g,"wood",.25,1.8,0,8.9,0);
      const cap=new T.Mesh(new T.SphereGeometry(.26,10,7),new T.MeshStandardMaterial({color:colors.gold,emissive:0xd5a653,emissiveIntensity:1.1}));
      cap.position.set(0,9.9,0);g.add(cap);
    }
    return g;
  }
  function houseWallSegment(g,part,y){
    const FRONT=3.0,BACK=-3.0, xBySlot={left:-2.65,center:0,right:2.65};
    const side=part.side,slot=part.slot,front=side==="front"||side==="back";
    const x=front?xBySlot[slot]:side==="left"?-4:4;
    const z=front?(side==="front"?FRONT:BACK):xBySlot[slot]*.7;
    const width=front?2.65:.3,depth=front?.25:1.95;
    const material={plaster:"plaster",brick:"brick",stone:"stone"}[part.facade]||"plaster";
    if(part.role==="wall_panel")cube(g,material,width,3.1,depth,x,y+1.55,z);
    else if(part.role==="window_opening"){
      cube(g,material,width,1.0,depth,x,y+.5,z);
      cube(g,material,width,.75,depth,x,y+2.72,z);
      const px=front?width/2-.11:.10,pz=front?.08:depth/2-.08;
      if(front){for(const side of [-1,1])cube(g,"wood",.12,1.36,.31,x+side*px,y+1.65,z)}
      else {for(const side of [-1,1])cube(g,"wood",.32,1.36,.12,x,y+1.65,z+side*pz)}
      cube(g,"glass",front?width-.25:.17,1.25,front?.12:depth-.2,x,y+1.65,z);
    }else if(part.role==="door_opening"){
      cube(g,material,width,.85,depth,x,y+2.67,z);
      for(const sign of [-1,1])cube(g,"wood",.14,2.25,.3,x+sign*(width/2-.13),y+1.13,z);
      cube(g,"wood",width-.4,2.12,.09,x,y+1.06,z+(side==="front"?.18:-.18));
    }
  }
  function houseScene(completed,d){
    const g=new T.Group();g.rotation.y=d.rotation*Math.PI/180;g.position.set(d.x,0,d.z);
    const plan=Designer.visualPlan(d,completed);
    const foundation=cube(g,"stoneDark",8.25,.32,6.3,0,.19,0);
    if(completed===0){foundation.material=mats.ghost;return g}
    if(completed>=2){
      for(const x of [-4,0,4])for(const z of [-3,3])cube(g,d.timber==="weathered"?"woodLight":"wood",.23,3.3,.23,x,2.0,z);
      for(const z of [-3,3])cube(g,"wood",8.35,.22,.23,0,3.64,z);
    }
    if(completed>=3){
      for(const part of plan.visible.filter(p=>p.stage===3))houseWallSegment(g,part,.35);
      for(const x of [-4,4])cube(g,"wood",.26,3.3,.26,x,1.98,0);
      for(const z of [-3,3])cube(g,"wood",.3,.2,6.5,0,2.9,z);
    }
    if(completed>=4&&!inside){
      const roofMat=d.roofMaterial==="slate"?"slate":d.roofMaterial==="clay_brown"?"roofBrown":"roof";
      if(d.roof==="gable"){
        const angle=Math.atan2(2.25,4),len=Math.hypot(4,2.25);
        cube(g,roofMat,len+.45,.2,7.25,-2,4.94,0,angle);
        cube(g,roofMat,len+.45,.2,7.25,2,4.94,0,-angle);
        for(const x of [-3.7,3.7])cube(g,"wood",.16,.23,6.7,x,3.9,0);
      }else{
        const roof=new T.Mesh(new T.ConeGeometry(5.2,2.6,4),mats[roofMat]);
        roof.position.y=4.75;roof.rotation.y=Math.PI/4;roof.scale.z=.78;roof.castShadow=true;g.add(roof);
      }
    }
    if(completed>=5){
      for(let i=0;i<12;i++)cube(g,d.floor==="stone_tiles"?"stone":"woodLight",7.6,.08,.45,0,.42,-2.65+i*.48);
      for(const part of plan.visible.filter(p=>p.role==="furniture")){
        const f=Designer.FURNITURE[part.type],m=new T.Group();m.position.set(part.x,.5,part.z);m.rotation.y=part.rotation*Math.PI/180;g.add(m);
        if(part.type==="bed"){
          cube(m,"wood",f.width,.2,f.depth,0,.38,0);cube(m,"plaster",f.width-.25,.15,f.depth-.2,0,.56,0);
        }else if(part.type==="chest"){
          cube(m,"wood",f.width,.58,f.depth,0,.3,0);cube(m,"woodLight",f.width,.12,f.depth,0,.65,0);
        }else if(part.type==="bookcase"){
          for(let i=0;i<3;i++)cube(m,"woodLight",f.width,.09,f.depth,0,.5+i*.6,0);
          for(const x of [-f.width/2,f.width/2])cube(m,"wood",.1,1.9,.4,x,1,0);
        }else{
          cube(m,"woodLight",f.width,.12,f.depth,0,.72,0);
          for(const x of [-f.width*.4,f.width*.4])for(const z of [-f.depth*.35,f.depth*.35])cube(m,"wood",.12,.7,.12,x,.36,z);
        }
      }
    }
    return g;
  }
  function setupScene(){
    const canvas=$("viewport");
    try{
      renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false});
    }catch(err){$("renderError").hidden=false;console.warn("WebGL ontbreekt",err);return;}
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.7));
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
    if(T.SRGBColorSpace)renderer.outputColorSpace=T.SRGBColorSpace;
    scene=new T.Scene();scene.background=new T.Color(0x81948d);scene.fog=new T.Fog(0x81948d,28,65);
    camera=new T.PerspectiveCamera(48,1,.1,100);
    scene.add(new T.HemisphereLight(0xdfeadf,0x364740,2.0));
    const sun=new T.DirectionalLight(0xffe3aa,2.8);sun.position.set(12,18,8);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
    sun.shadow.camera.left=-14;sun.shadow.camera.right=14;sun.shadow.camera.top=14;sun.shadow.camera.bottom=-14;scene.add(sun);
    const ground=new T.Mesh(new T.CircleGeometry(70,96),mats.ground);
    ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
    const trail=new T.Mesh(new T.PlaneGeometry(4,30),new T.MeshStandardMaterial({color:0x9f9b81,roughness:1}));
    trail.rotation.x=-Math.PI/2;trail.position.set(0,.01,9);trail.receiveShadow=true;scene.add(trail);
    for(let i=0;i<40;i++){
      const a=i*2.399,r=9+(i%7)*.72,x=Math.sin(a)*r,z=Math.cos(a)*r;
      polygon(scene,i%3===0?"stoneDark":"wood",.13,1.4,x,.7,z,6);
      const crown=new T.Mesh(new T.IcosahedronGeometry(.7+(i%3)*.15,1),new T.MeshStandardMaterial({color:i%4===0?0x4d644b:0x597856,roughness:.97}));
      crown.position.set(x,1.7,z);crown.castShadow=true;scene.add(crown);
    }
    model=new T.Group();scene.add(model);
    const resize=()=>{
      if(!renderer)return;const bounds=canvas.getBoundingClientRect();
      if(bounds.width<1||bounds.height<1)return;
      renderer.setSize(bounds.width,bounds.height,false);camera.aspect=bounds.width/bounds.height;camera.updateProjectionMatrix();
    };
    resize();
    if(typeof ResizeObserver!=="undefined"){resizeObserver=new ResizeObserver(resize);resizeObserver.observe(canvas);}
    else window.addEventListener("resize",resize);
    canvas.addEventListener("pointerdown",ev=>{dragging={x:ev.clientX,y:ev.clientY};canvas.setPointerCapture(ev.pointerId)});
    canvas.addEventListener("pointermove",ev=>{if(!dragging)return;controls.yaw+=(ev.clientX-dragging.x)*.009;controls.pitch=Math.max(.15,Math.min(1.28,controls.pitch+(ev.clientY-dragging.y)*.007));dragging={x:ev.clientX,y:ev.clientY}});
    for(const name of ["pointerup","pointercancel","lostpointercapture"])canvas.addEventListener(name,()=>dragging=null);
    canvas.addEventListener("wheel",ev=>{ev.preventDefault();controls.distance=Math.max(12,Math.min(39,controls.distance+Math.sign(ev.deltaY)*1.3))},{passive:false});
    function frame(){
      if(!document.hidden){
        const r=controls.distance,a=controls.yaw,p=controls.pitch;
        camera.position.set(r*Math.sin(a)*Math.cos(p),4+r*Math.sin(p),r*Math.cos(a)*Math.cos(p));
        camera.lookAt(0,3,0);
        renderer.render(scene,camera);
      }
      requestAnimationFrame(frame);
    }
    frame();
  }
  function updateModel(){
    if(!model)return;
    model.traverse(o=>{if(o.geometry?.dispose)o.geometry.dispose()});
    while(model.children.length)model.remove(model.children[0]);
    const completed=stage().progress.current;
    model.add(active==="ruin"?repairTower(completed):houseScene(completed,Planner.get(save,ids.house).design));
  }
  setupUI();setupScene();update();
})();
