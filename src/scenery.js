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
 const tex=(w,h,draw,rep=1)=>{const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(rep,rep);return t};
 canvas.map=tex(128,128,(g,w,h)=>{g.fillStyle='#8f7b55';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=2){g.fillStyle=y%4?'rgba(50,38,20,.22)':'rgba(255,240,200,.1)';g.fillRect(0,y,w,1)}for(let x=0;x<w;x+=2){g.fillStyle='rgba(40,30,15,.14)';g.fillRect(x,0,1,h)}for(let i=0;i<60;i++){g.fillStyle=`rgba(40,30,15,${Math.random()*.12})`;g.fillRect(Math.random()*w,Math.random()*h,6+Math.random()*14,3+Math.random()*8)}},3);canvas.color.set(0xc4b08a);
 leather.map=tex(128,128,(g,w,h)=>{g.fillStyle='#6b4428';g.fillRect(0,0,w,h);for(let i=0;i<500;i++){g.fillStyle=`rgba(${Math.random()<.5?20:120},${Math.random()<.5?12:80},6,${Math.random()*.18})`;g.fillRect(Math.random()*w,Math.random()*h,1+Math.random()*3,1+Math.random()*3)}},2);leather.color.set(0xb08868);
 roll.map=tex(64,128,(g,w,h)=>{g.fillStyle='#8c2f28';g.fillRect(0,0,w,h);for(const [y,c] of [[18,'#e8dcc2'],[26,'#2c3e4a'],[94,'#e8dcc2'],[102,'#2c3e4a']]){g.fillStyle=c;g.fillRect(0,y,w,5)}for(let i=0;i<300;i++){g.fillStyle=`rgba(255,255,255,${Math.random()*.06})`;g.fillRect(Math.random()*w,Math.random()*h,2,2)}});roll.color.set(0xffffff);
 const body=person.body;body.updateMatrixWorld(true);
 // Measure this body in bind pose, so pack, straps, belt and scarf sit on it whatever its build.
 if(person.mixer){person.mixer.update(0);body.updateMatrixWorld(true)}
 const fit=(()=>{const inv=new T.Matrix4().copy(body.matrixWorld).invert(),v=new T.Vector3(),rows=new Map(),hips=[];
  body.traverse(o=>{if(!o.isSkinnedMesh)return;o.skeleton.update();const pos=o.geometry.attributes.position,M=new T.Matrix4().multiplyMatrices(inv,o.matrixWorld);
   for(let i=0;i<pos.count;i++){o.getVertexPosition(i,v);v.applyMatrix4(M);const k=Math.round(v.y/2.5);if(Math.abs(v.x)<9){const r=rows.get(k)||[1e9,-1e9];r[0]=Math.min(r[0],v.z);r[1]=Math.max(r[1],v.z);rows.set(k,r)}if(Math.abs(v.y-(girl?83:80))<2)hips.push([Math.abs(v.x),v.z])}});
  const range=(y0,y1,f)=>{const out=[];for(let k=Math.round(y0/2.5);k<=Math.round(y1/2.5);k++)if(rows.has(k))out.push(f(rows.get(k)));return out};
  hips.sort((a,b)=>a[0]-b[0]);let hw=hips.length?hips[0][0]:14;for(let i=1;i<hips.length;i++){if(hips[i][0]-hips[i-1][0]>1.4)break;hw=hips[i][0]}
  const at=y=>{const r=rows.get(Math.round(y/2.5));return r||[-10,10]};
  const backAt=(y0,y1)=>Math.min(...range(y0,y1,r=>r[0]));
  return {back:backAt(84,108),top:backAt(101,110),low:backAt(84,93),front:y=>Math.max(...range(y-6,y+6,r=>r[1])),belt:at(girl?83:80),hw}})();
 const neckZ=(()=>{const w=new T.Vector3(),inv=new T.Matrix4().copy(body.matrixWorld).invert();(B.Neck||B.Head).getWorldPosition(w);return w.applyMatrix4(inv).z})();
 let frame=body;
 function part(geo,mat,x,y,z,bone,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1){const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.scale.set(sx,sy,sz);m.castShadow=true;frame.add(m);m.updateMatrixWorld(true);(B[bone]||B.Spine2).attach(m);made.push(m);return m}
 const box=(w,h,d)=>new T.BoxGeometry(w,h,d,2,2,2);
 // backpack
 const py=97,pz=fit.back-6.2,tilt=Math.asin(Math.max(-.35,Math.min(.35,(fit.top-fit.low)/17)));
 // the pack leans with the back: build it in a frame tilted to the measured slope of the back
 const packFrame=new T.Group();packFrame.position.set(0,py,pz);packFrame.rotation.x=tilt;body.add(packFrame);packFrame.updateMatrixWorld(true);
 const packParts=[],P0=(fn)=>{frame=packFrame;const n=made.length;fn();frame=body;packParts.push(...made.slice(n))};
 const bag=box(25,29,11);{const p=bag.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);p.setXYZ(i,x*(1-.12*Math.abs(y)/14.5),y,z*(1-.1*Math.abs(x)/12.5)+(z>0?0:-1.2*Math.cos(x/12.5*1.5)))}bag.computeVertexNormals()}
 P0(()=>{
 part(bag,canvas,0,0,0,'Spine2');part(box(25.6,9,11.8),canvas,0,0+10.5,0-.4,'Spine2',.18);
 part(box(9,10,4),canvas,-7,0-6,0-6.8,'Spine2');part(box(9,10,4),canvas,7,0-6,0-6.8,'Spine2');
 for(const x of [-6,6])part(box(2.2,30,.8),leather,x,0,0-6,'Spine2');
 const bed=new T.CylinderGeometry(6.3,6.3,30,14,1);part(bed,roll,0,girl?0-19:0+19,0+1,'Spine2',0,0,Math.PI/2);
 for(const x of [-9,9])part(new T.TorusGeometry(6.5,.55,6,16),leather,x,girl?0-19:0+19,0+1,'Spine2',0,Math.PI/2);
 });
 // the scanned canvas pack with bedroll (tevy.dev, CC0) replaces the modelled bag once it has loaded; straps and belt stay
 if(typeof Models!=='undefined')Models.load('sf_backpack').then(r=>{const m=new T.Mesh(r.geometry,r.material);m.scale.setScalar(68);m.position.set(0,-15,-4.6);m.rotation.y=Math.PI;m.castShadow=true;
  frame=packFrame;packFrame.add(m);m.updateMatrixWorld(true);frame=body;(B.Spine2||B.Spine1).attach(m);made.push(m);for(const o of packParts)o.visible=false}).catch(()=>{});
 // shoulder straps
 const pad=girl?2.2:.9,f1=fit.front(py+7)+pad,f2=fit.front(py-3)+pad,f3=fit.front(py-12)+pad;
 for(const s of [-1,1]){const c=new T.CatmullRomCurve3([[7,py+11,pz+4],[8.2,py+16,pz+9],[8.6,py+15.5,(pz+9+f1)/2],[8.4,py+7,f1],[8.4,py-3,f2],[8,py-12,f3]].map(([x,y,z])=>new T.Vector3(s*x,y,z)));
  part(new T.TubeGeometry(c,18,1.05,5),leather,0,0,0,'Spine2',0,0,0,1,1,1);part(box(2.8,2.4,.7),brass,s*8.4,py+2,(f1+f2)/2+.3,'Spine2')}
 P0(()=>{for(const x of [-5.5,5.5]){part(box(2,12,1),leather,x,12,-6.4,'Spine2',.18);part(box(2.6,2.2,.6),brass,x,7.6,-6.9,'Spine2')}
 part(new T.CylinderGeometry(2.4,2.1,4.2,16,1,true),new T.MeshStandardMaterial({color:0xaab0b4,metalness:.8,roughness:.4,side:T.DoubleSide}),11.5,-10,-2,'Spine2')});
 // belt, buckle, pouch, compass
 const by=girl?83:80,bz=(fit.belt[0]+fit.belt[1])/2,rz=(fit.belt[1]-fit.belt[0])/2+(girl?1.6:.55),rx=Math.max(rz*1.22,fit.hw+.55);
 part(new T.CylinderGeometry(1,1,3.6,40,1,true),leather,0,by,bz,'Pelvis',0,0,0,rx,1,rz);
 part(box(4.2,4,1.2),brass,0,by,bz+rz+.1,'Pelvis');
 part(box(7,8,4.5),leather,-rx*.86,by-4,bz+2.6,'Pelvis',0,-.25);part(box(7.4,2.6,5),leather,-rx*.86,by+.4,bz+2.6,'Pelvis',0,-.25);
 part(new T.CylinderGeometry(2.9,2.9,1.1,20),brass,rx*.55,by-3.8,bz+rz*.86,'Pelvis',Math.PI/2-.25,0,0);
 // scarf: collar around the neck plus two tails that trail behind
 const ny=girl?120.5:120;
 const nz=neckZ+1.4,nr=girl?6.3:7.4;
 part(new T.CylinderGeometry(1,1.12,6.2,28,2,true),scarf,0,ny,nz,'Neck',0,0,0,nr,1,nr*.97);
 part(new T.SphereGeometry(3.1,10,8),scarf,3.2,ny-3.6,nz+nr*.84,'Neck',0,0,0,1,.8,.7);
 const tails=[0,1].map(i=>{const g=new T.PlaneGeometry(1,1,1,9);const m=new T.Mesh(g,scarf);m.castShadow=true;m.frustumCulled=false;person.root.add(m);return {g,m,i}});
 const knot=new T.Object3D();knot.position.set(3.2,ny-3.6,nz+nr*.84);body.add(knot);knot.updateMatrixWorld(true);(B.Neck||B.Head).attach(knot);
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
  const grain=new T.MeshStandardMaterial({map:tex(64,256,(g,w,h)=>{g.fillStyle='#8d6038';g.fillRect(0,0,w,h);for(let i=0;i<34;i++){g.strokeStyle=`rgba(${50+i%3*25},${30+i%4*10},14,.35)`;g.lineWidth=1+i%3;g.beginPath();const x=(i*13)%w;g.moveTo(x,0);g.bezierCurveTo(x+6,h*.3,x-6,h*.6,x+3,h);g.stroke()}}),roughness:.65}),
   steel=new T.MeshStandardMaterial({color:0x8f969c,metalness:.85,roughness:.38}),edge=new T.MeshStandardMaterial({color:0xdfe3e6,metalness:.9,roughness:.18});
  const bentHandle=(len,bend,r=.9)=>new T.TubeGeometry(new T.CatmullRomCurve3([[0,-len/2,0],[bend,-len/6,0],[-bend*.4,len/6,0],[0,len/2,0]].map(a=>new T.Vector3(...a))),24,r,10,false);
  const axeHead=(()=>{const sh=new T.Shape();sh.moveTo(-2.4,2.3);sh.lineTo(2.6,2.6);sh.quadraticCurveTo(7.5,4.2,10,7);sh.lineTo(10.8,-7);sh.quadraticCurveTo(7.5,-4.2,2.6,-2.6);sh.lineTo(-2.4,-2.3);sh.lineTo(-3.6,0);sh.closePath();const g=new T.ExtrudeGeometry(sh,{depth:1.5,bevelEnabled:true,bevelThickness:.4,bevelSize:.35,bevelSegments:2,curveSegments:10});g.translate(0,0,-.75);return g})();
  tool('bijl',g=>{g.position.set(-11.5,py+2,pz-4);g.rotation.set(.1,0,.5);add(g,bentHandle(40,1.1),grain,0,0,0);add(g,axeHead,steel,.6,18.4,0);add(g,new T.BoxGeometry(.7,13.4,.9),edge,10.9,18.4,0);add(g,new T.CylinderGeometry(1.05,1.05,1.4,10),new T.MeshStandardMaterial({color:0x3a2a1c,roughness:.8}),0,-18,0)});
  tool('houweel',g=>{g.position.set(11.5,py+2,pz-4);g.rotation.set(.1,0,-.5);add(g,bentHandle(40,-1),grain,0,0,0);const arc=new T.CatmullRomCurve3([[-13,17.6,0],[-6,20.2,0],[0,21,0],[6,20.2,0],[12,17.8,0]].map(a=>new T.Vector3(...a)));add(g,new T.TubeGeometry(arc,24,1.1,8),steel,0,0,0);add(g,new T.ConeGeometry(1.1,3,8),edge,-14.2,17.1,0,0,0,Math.PI/2+.35);add(g,new T.BoxGeometry(5,1.6,2.6),edge,13.4,17.4,0,0,0,-.35);add(g,new T.BoxGeometry(3.4,3.6,3.2),steel,0,20.4,0)});
  tool('zaag',g=>{g.position.set(0,py-1,pz-6.4);g.rotation.set(0,0,.12);const sh=new T.Shape();sh.moveTo(-15,3);sh.lineTo(14,4.4);sh.lineTo(14,-4);for(let x=14;x>-15;x-=1.2){sh.lineTo(x-.6,-4.9);sh.lineTo(x-1.2,-4)}sh.lineTo(-15,-1.5);sh.closePath();add(g,new T.ExtrudeGeometry(sh,{depth:.25,bevelEnabled:false}),steel,0,0,-.12);const hs=new T.Shape();hs.moveTo(0,-5);hs.lineTo(6,-4);hs.quadraticCurveTo(8,1,6,6);hs.lineTo(0,5.5);hs.closePath();const hole=new T.Path();hole.moveTo(1.5,-2);hole.lineTo(4.5,-1.6);hole.quadraticCurveTo(5.4,1,4.4,3.2);hole.lineTo(1.5,2.8);hole.closePath();hs.holes.push(hole);add(g,new T.ExtrudeGeometry(hs,{depth:2,bevelEnabled:true,bevelThickness:.3,bevelSize:.3,bevelSegments:2}),grain,14,0,-1)});
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
