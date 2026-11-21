"use strict";
function loadSurface(file,flipY=true){
 const tex=new THREE.TextureLoader().load('art/'+file);
 tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.colorSpace=THREE.SRGBColorSpace;
 tex.flipY=flipY;tex.anisotropy=4;return tex
}
// Rocketbox meshes retain their authored UV seams. The FBX skeleton poses are
// sampled offline so the same animated surface works with either renderer.
const peopleData=new Map(),peopleMaterials=new Map();
function readPerson(name){
 if(peopleData.has(name))return peopleData.get(name);
 const pending=fetch('people/'+name+'.model').then(async response=>{
  if(!response.ok)throw Error('Model ontbreekt: '+name);
  const bytes=await response.arrayBuffer(),size=new DataView(bytes).getUint32(0,true),start=4+size;
  const descriptors=JSON.parse(new TextDecoder().decode(new Uint8Array(bytes,4,size)));
  const read=(Type,offset,count)=>new Type(bytes.slice(start+offset,start+offset+count*Type.BYTES_PER_ELEMENT));
  return descriptors.map(d=>({...d,uv:read(Float32Array,d.uv,d.n*2),ids:read(Uint16Array,d.index,d.count),poses:d.frames.map(f=>read(Int16Array,f,d.n*3))}))
 }).catch(error=>{peopleData.delete(name);throw error});
 peopleData.set(name,pending);return pending
}
function embodiedPerson(parent,name){
 const T=THREE,root=new T.Group();parent.add(root);let parts=[];
 const ready=readPerson(name).then(data=>{
  parts=data.map(d=>{
   const geo=new T.BufferGeometry(),pos=new T.Float32BufferAttribute(Float32Array.from(d.poses[0],x=>x/8000),3);
   geo.setAttribute('position',pos);geo.setAttribute('uv',new T.BufferAttribute(d.uv,2));geo.setIndex(new T.BufferAttribute(d.ids,1));geo.computeVertexNormals();
   if(!peopleMaterials.has(d.tex)){
    const cutout=d.tex.includes('opacity'),map=new T.TextureLoader().load('people/'+d.tex+(cutout?'.webp':'.jpg'));map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
    peopleMaterials.set(d.tex,new T.MeshStandardMaterial({map,roughness:.86,alphaTest:cutout?.42:0,side:T.DoubleSide}))
   }
   const mesh=new T.Mesh(geo,peopleMaterials.get(d.tex));mesh.castShadow=mesh.receiveShadow=true;mesh.frustumCulled=false;root.add(mesh);return {pos,geo,poses:d.poses}
  })
 });
 let stamp='';
 // Layers add baked poses on top of the rest pose: [[frame,weight],...]. Negative weights move away from a pose.
 function blend(layers){
  const mark=layers.map(([f,w])=>f+':'+Math.round(w*240)).join('/');if(mark===stamp||!parts.length)return;stamp=mark;
  for(const {pos,geo,poses} of parts){
   const idle=poses[0],dst=pos.array,used=layers.filter(([f,w])=>f&&w&&poses[f]);
   for(let i=0;i<dst.length;i++){let v=idle[i];for(const [f,w] of used)v+=w*(poses[f][i]-idle[i]);dst[i]=v/8000}
   pos.needsUpdate=true;geo.computeVertexNormals()
  }
 }
 function animate(a,b,mix,weight){blend([[a,weight*(1-mix)],[b,weight*mix]])}
 return {root,ready,animate,blend}
}
// Standing still is never a statue: arms relax against the body, the chest breathes,
// the arms sway a little and the weight shifts. Shared by the pilot and the villagers.
function idleLayers(t){
 const breathe=Math.sin(t*1.55),sway=Math.sin(t*.62);
 return [[9,-.46+.05*breathe],[2,.06+.05*sway],[6,.06-.05*sway],[10,.035+.03*Math.max(0,Math.sin(t*.23))]]
}
// Explorer gear from the title art: amber scarf, canvas backpack with bedroll, leather belt with
// pouch and brass compass. Built in body space at the bind pose, then fixed to the bones.
function explorerGear(person,girl){
 const T=THREE,B=person.bones,made=[],leather=new T.MeshStandardMaterial({color:0x4b301d,roughness:.62}),canvas=new T.MeshStandardMaterial({color:0x6a5a3f,roughness:.92}),
  roll=new T.MeshStandardMaterial({color:0x8d6b45,roughness:.95}),brass=new T.MeshStandardMaterial({color:0xb48a3c,metalness:.85,roughness:.32}),
  scarf=new T.MeshStandardMaterial({color:0xc4862f,roughness:.92,side:T.DoubleSide});
 const body=person.body;body.updateMatrixWorld(true);
 function part(geo,mat,x,y,z,bone,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1){const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.scale.set(sx,sy,sz);m.castShadow=true;body.add(m);m.updateMatrixWorld(true);(B[bone]||B.Spine2).attach(m);made.push(m);return m}
 const box=(w,h,d)=>new T.BoxGeometry(w,h,d,2,2,2);
 // backpack
 const pz=-15.5,py=97;
 const bag=box(25,29,11);{const p=bag.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);p.setXYZ(i,x*(1-.12*Math.abs(y)/14.5),y,z*(1-.1*Math.abs(x)/12.5)+(z>0?0:-1.2*Math.cos(x/12.5*1.5)))}bag.computeVertexNormals()}
 part(bag,canvas,0,py,pz,'Spine2');part(box(25.6,9,11.8),canvas,0,py+10.5,pz-.4,'Spine2',.18);
 part(box(9,10,4),canvas,-7,py-6,pz-6.8,'Spine2');part(box(9,10,4),canvas,7,py-6,pz-6.8,'Spine2');
 for(const x of [-6,6])part(box(2.2,30,.8),leather,x,py,pz-6,'Spine2');
 const bed=new T.CylinderGeometry(6.3,6.3,30,14,1);part(bed,roll,0,girl?py-19:py+19,pz+1,'Spine2',0,0,Math.PI/2);
 for(const x of [-9,9])part(new T.TorusGeometry(6.5,.55,6,16),leather,x,girl?py-19:py+19,pz+1,'Spine2',0,Math.PI/2);
 // shoulder straps
 for(const s of [-1,1]){const c=new T.CatmullRomCurve3([[7,py+11,pz+4],[8.2,py+16,pz+9],[8.6,py+15,pz+15.5],[8.4,py+7,pz+25],[8.4,py-3,pz+26.5],[8,py-12,pz+26]].map(([x,y,z])=>new T.Vector3(s*x,y,z)));
  part(new T.TubeGeometry(c,18,1.05,5),leather,0,0,0,'Spine2',0,0,0,1,1,1)}
 // belt, buckle, pouch, compass
 const by=girl?81:80;
 part(new T.CylinderGeometry(1,1,3.6,40,1,true),leather,0,by,.4,'Pelvis',0,0,0,14.2,1,12.1);
 part(box(4.2,4,1.2),brass,0,by,12.6,'Pelvis');
 part(box(7,8,4.5),leather,-12.5,by-4,3,'Pelvis',0,-.25);part(box(7.4,2.6,5),leather,-12.5,by+.4,3,'Pelvis',0,-.25);
 part(new T.CylinderGeometry(2.9,2.9,1.1,20),brass,7.8,by-3.8,11.2,'Pelvis',Math.PI/2-.25,0,0);
 // scarf: collar around the neck plus two tails that trail behind
 const ny=girl?120.5:120;
 part(new T.CylinderGeometry(1,1.12,6.2,28,2,true),scarf,0,ny,.4,'Neck',0,0,0,7.4,1,7.2);
 part(new T.SphereGeometry(3.1,10,8),scarf,3.6,ny-3.6,6.6,'Neck',0,0,0,1,.8,.7);
 const tails=[0,1].map(i=>{const g=new T.PlaneGeometry(1,1,1,9);const m=new T.Mesh(g,scarf);m.castShadow=true;m.frustumCulled=false;person.root.add(m);return {g,m,i}});
 const knot=new T.Object3D();knot.position.set(3.6,ny-3.6,6.6);body.add(knot);knot.updateMatrixWorld(true);(B.Neck||B.Head).attach(knot);
 const w=new T.Vector3();let blow=0;
 // Tails hang from the knot and stream backwards with speed (the person faces -z in root space).
 function wave(t,dt,speed){
  person.root.updateWorldMatrix(true,false);knot.getWorldPosition(w);person.root.worldToLocal(w);
  blow+=(Math.min(1,speed/6)-blow)*(1-Math.exp(-3*dt));
  for(const {g,i} of tails){const p=g.attributes.position,len=i?.5:.62,wd=i?.075:.09;
   for(let r=0;r<10;r++){const f=r/9,flap=Math.sin(t*(4.6+i*.9)-f*4.2+i*1.7)*(.035+.08*f)*(.5+blow);
    const bx=w.x+(.05+i*.05+.06*blow)*f+flap*.7,by=w.y-len*f*(1-.62*blow)+flap*.2,bz=w.z+len*f*(.18+.7*blow)+flap*.25;
    p.setXYZ(r*2,bx-wd*.5,by,bz);p.setXYZ(r*2+1,bx+wd*.5,by,bz)}
   p.needsUpdate=true;g.computeVertexNormals()}
 }
 // Tools earned from the residents ride on the backpack.
 const kit={};
 {const handle=new T.CylinderGeometry(.9,1,44,8),iron=new T.MeshStandardMaterial({color:0x5d5e60,metalness:.75,roughness:.38}),haft=new T.MeshStandardMaterial({color:0x8a6239,roughness:.75});
  const tool=(name,build)=>{const g=new T.Group();build(g);g.traverse(o=>{if(o.isMesh)o.castShadow=true});body.add(g);g.updateMatrixWorld(true);B.Spine2.attach(g);g.visible=false;kit[name]=g};
  const add=(g,geo,mat,x,y,z,rx=0,ry=0,rz=0)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);g.add(m)};
  tool('bijl',g=>{g.position.set(-11.5,py+2,pz-4);g.rotation.set(.1,0,.5);add(g,handle,haft,0,0,0);add(g,new T.BoxGeometry(10,6,1.4),iron,4,19,0);add(g,new T.BoxGeometry(1.2,7.5,1.8),iron,9,19,0)});
  tool('houweel',g=>{g.position.set(11.5,py+2,pz-4);g.rotation.set(.1,0,-.5);add(g,handle,haft,0,0,0);add(g,new T.ConeGeometry(1.4,13,6),iron,-6.5,20,0,0,0,Math.PI/2);add(g,new T.ConeGeometry(1.4,10,6),iron,5,20,0,0,0,-Math.PI/2);add(g,new T.BoxGeometry(3,3,3),iron,0,20,0)});
  tool('zaag',g=>{g.position.set(0,py-1,pz-6.4);g.rotation.set(0,0,.12);add(g,new T.BoxGeometry(30,8,.3),iron,0,0,0);add(g,new T.BoxGeometry(7,9,2.2),haft,17,1,0)});
  tool('touw',g=>{g.position.set(13.8,py-8,pz+1);g.rotation.set(0,Math.PI/2,0);add(g,new T.TorusGeometry(6,1.3,8,22),new T.MeshStandardMaterial({color:0xb59a68,roughness:1}),0,0,0);add(g,new T.TorusGeometry(4.6,1.2,8,20),new T.MeshStandardMaterial({color:0xa88d5c,roughness:1}),0,0,1.3)});
  tool('kaart',g=>{g.position.set(-13.5,py-6,pz+1);add(g,new T.CylinderGeometry(2,2,20,10),new T.MeshStandardMaterial({color:0xdcc79a,roughness:.95}),0,0,0);add(g,new T.CylinderGeometry(2.2,2.2,2,10),haft,0,9,0)});
 }
 function equip(tools){for(const [k,g] of Object.entries(kit))g.visible=!!tools?.[k]}
 function tint(c){scarf.color.set(c??0xc4862f)}
 return {made,tails,wave,equip,tint}
}
function expeditionPilot(scene,rigged=true){
 const root=new THREE.Group();scene.add(root);const models={};let selected,heading=0,still=0,lastX=null,lastZ=0,speed=0,idleTimer=0,swing=-1,kit={},scarfColor=null;
 if(!rigged)return legacyPilot(scene,root);
 function outfit(name){
  const key=name==='Nova'?'floor':'niek';
  if(!models[key]){const m=models[key]=Rig.person(root,key,{gender:key==='floor'?'f':'m',height:2.57,skin:key});m.ready.then(()=>{m.gear=explorerGear(m,key==='floor');m.gear.equip(kit);m.gear.tint(scarfColor)})}
  selected=models[key];for(const model of Object.values(models))model.root.visible=model===selected;
  selected.ready.catch(()=>{document.getElementById('toast').textContent='Personage laden mislukt. Vernieuw de pagina.'})
 }
 function pose(t,p,dt){
  if(lastX===null){lastX=p.x;lastZ=p.z}
  const vx=(p.x-lastX)/Math.max(dt,1e-3),vz=(p.z-lastZ)/Math.max(dt,1e-3);lastX=p.x;lastZ=p.z;
  const ground=p.ride?0:Math.hypot(vx,vz);speed+=(Math.min(ground,14)-speed)*(1-Math.exp(-10*dt));
  root.position.set(p.x,p.y,p.z);const prev=heading;heading+=Math.atan2(Math.sin(p.heading-heading),Math.cos(p.heading-heading))*(1-Math.exp(-15*dt));root.rotation.y=heading;
  if(!selected?.mixer){selected?.update?.(dt);return}
  const m=selected,turn=(heading-prev)/Math.max(dt,1e-3),back=Math.cos(Math.atan2(-vx,-vz)-heading)<-.2&&ground>.3;
  if(swing>=0){swing-=dt}
  else if(p.glide)m.play('glide',{fade:.45});
  else if(p.on===false)m.play('air',{fade:.25});
  else if(speed>.12||Math.abs(turn)>.6){idleTimer=0;m.locomote(speed,{turning:turn,backwards:back})}
  else{
   if(!['idle','idle2','look','look2','fidget','stretch'].includes(m.state)||['glide','air'].includes(m.state))m.play('idle',{fade:.35});
   idleTimer+=dt;if(idleTimer>8&&m.state==='idle'){idleTimer=0;m.once(['look','look2','fidget','idle2'][Math.floor(t*7)%4],'idle',{fade:.5})}
  }
  m.update(dt);m.gear?.wave(t,dt,speed+.6)
 }
 return {root,outfit,pose,scarf(c){scarfColor=c;for(const m of Object.values(models))m.gear?.tint(c)},equip(tools){kit=tools||{};for(const m of Object.values(models))m.gear?.equip(kit)},reach(){if(!selected?.mixer)return;swing=selected.once('take','idle',{rate:1.6,fade:.2})*.6}}
}
// Fallback for the software renderer: baked pose frames without a skeleton.
function legacyPilot(scene,root){
 const models={};let selected,heading=0;
 function outfit(name){const key=name==='Nova'?'floor':'niek';selected=models[key]??=embodiedPerson(root,key);for(const model of Object.values(models))model.root.visible=model===selected}
 function pose(t,p,dt){
  root.position.set(p.x,p.y,p.z);heading+=Math.atan2(Math.sin(p.heading-heading),Math.cos(p.heading-heading))*(1-Math.exp(-15*dt));root.rotation.y=heading;
  if(!selected)return;const phase=(p.walk||0)*4/Math.PI,index=Math.floor(phase)%8,w=Math.min(1,p.speed||0),m=phase%1;
  if(p.glide||p.on===false)selected.animate(9,9,0,p.glide?1:.55);else if(w>.02)selected.blend([[1+index,w*(1-m)],[1+(index+1)%8,w*m]]);else selected.blend([])
 }
 return {root,outfit,pose,reach(){},equip(){},scarf(){}}
}
