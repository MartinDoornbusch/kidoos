"use strict";
function createWorld(canvas) {
 const T=THREE, scene=new T.Scene(),cam=new T.PerspectiveCamera(53,1,.15,420);
 const options={antialias:true,alpha:true,powerPreference:'high-performance'};
 const context=canvas.getContext('webgl2',options)||canvas.getContext('webgl',options);
 const renderer=context?new T.WebGLRenderer({canvas,context,...options}):softwareRenderer(canvas);
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));renderer.outputColorSpace=T.SRGBColorSpace;
 scene.fog=new T.FogExp2(0xc7b7a6,.0065);
 scene.add(new T.HemisphereLight(0xffe9cf,0x8796b5,2.05));
 const sun=new T.DirectionalLight(0xffcf8a,2.25);sun.position.set(-36,34,22);scene.add(sun);
 const turf=loadSurface('grass.jpg'),rockMap=loadSurface('rock.jpg'),timber=loadSurface('wood.jpg');
 const panorama=new T.TextureLoader().load('art/alpen.jpg');panorama.mapping=T.EquirectangularReflectionMapping;panorama.colorSpace=T.SRGBColorSpace;
 if(context){scene.background=panorama;scene.environment=panorama;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-25,right:25,top:25,bottom:-25,near:1,far:115});sun.shadow.camera.updateProjectionMatrix();sun.shadow.bias=-.0005;sun.shadow.normalBias=.045;scene.add(sun.target)}
 sun.intensity=3.1;scene.children.find(o=>o.isHemisphereLight).intensity=.95;
 // HDR post-processing when WebGL2 allows it; otherwise filmic tone mapping straight to the screen.
 const fx=context?createFX(renderer,scene,cam):null;
 if(context&&!fx){renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15}
 const quality={level:/[?&]hq/.test(location.search)?3:2,frames:0,spent:0,locked:/[?&]hq/.test(location.search)};
 const skyCanvas=document.getElementById('world');skyCanvas.style.backgroundImage="url('art/alpen.jpg')";skyCanvas.style.backgroundSize='auto 245%';skyCanvas.style.backgroundRepeat='repeat-x';
 const iso=new T.IcosahedronGeometry(1,1), ball=new T.SphereGeometry(1,24,14), cube=new T.BoxGeometry(), cyl=new T.CylinderGeometry(1,1,1,24),cone=new T.ConeGeometry(1,1,7), wheel=new T.TorusGeometry(1,.085,6,32);
 const mat=new T.MeshStandardMaterial({flatShading:false,roughness:.86}),mats=new Map(),batches=new Map();
 let seed=718;function rnd(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
 const rotors=[],clouds=[],solids=createSolids(),falls=[],ports=[],islands=[{x:0,z:0,r:25,name:'Windhaven'},{x:0,z:-61,r:23,name:'Bloesemvallei'},{x:0,z:-120,r:24,name:'Sterrenwacht'}];
 function group(x,y,z,p=scene){let g=new T.Group();g.position.set(x,y,z);p.add(g);return g}
 function shape(geo,color,x,y,z,sx,sy,sz,ry=0,rz=0,rx=0,parent=null){
   if(parent){if(!mats.has(color))mats.set(color,new T.MeshStandardMaterial({color,flatShading:false,roughness:.8}));let o=new T.Mesh(geo,geo.userData.surface||(color===0x92583f?timberMat:mats.get(color)));o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.rotation.set(rx,ry,rz);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
   const obj=new T.Object3D();obj.position.set(x,y,z);obj.rotation.set(rx,ry,rz);obj.scale.set(sx,sy,sz);obj.updateMatrix();if(!batches.has(geo))batches.set(geo,[]);batches.get(geo).push([obj.matrix,color]);
 }
 const timberMat=new T.MeshStandardMaterial({map:timber,roughness:.91});
 const detailsMat=[timberMat,...['roof','wall','rock'].map(name=>new T.MeshStandardMaterial({map:loadSurface(name+'.jpg'),roughness:.93}))];
 const dirtMap=loadSurface('paving.jpg');
 const roofGeo=cube.clone(),wallGeo=cube.clone(),stoneGeo=iso.clone();
 const bark=new T.MeshStandardMaterial({map:loadSurface("ridged-bark.jpg"),color:0xffffff,roughness:1});
 const cutEnd=new T.MeshStandardMaterial({map:loadSurface('sawn-rings.jpg'),roughness:1});
 const ore=new T.MeshStandardMaterial({map:rockMap,color:0xabb7b3,roughness:.88});
 const woodenColors=new Set([0x92583f,0xbc8352,0xb88054,0xca9362,0x745344,0xc18d5c]);
 function flush(){
  for(const [geo,rows] of batches){
   const groups=[rows.filter(r=>!woodenColors.has(r[1])),rows.filter(r=>woodenColors.has(r[1]))];
   groups.forEach((items,i)=>{if(!items.length)return;const surface=geo===roofGeo?1:geo===wallGeo?2:geo===stoneGeo?3:i?0:-1;const m=new T.InstancedMesh(geo,geo.userData.surface||(surface>=0?detailsMat[surface]:mat),items.length);
    items.forEach(([matrix,color],j)=>{m.setMatrixAt(j,matrix);m.setColorAt(j,new T.Color(surface===0?0xe9d6bd:surface===1?0xe4d1be:surface===2?0xf1e0c7:surface===3?0xc3c1b8:color))});m.castShadow=m.receiveShadow=true;scene.add(m)})
  }
  batches.clear()
 }
 // Rounded grass lip, smooth cliff with soil band and rock, tapering to a point. The walkable top stays flat.
 function island(x,z,r,land,depth=15,h=0){
  for(let i=0;i<684;i++)rnd(); // keeps every later random placement exactly where it was
  const N=96,s=(Math.abs(x*13.7+z*7.1)%97),rim=a=>1+.013*Math.sin(a*9)+.008*Math.sin(a*17);
  const n=(a,y)=>.55*Math.sin(a*3+s)+.3*Math.sin(a*7+y*.35+s*1.7)+.15*Math.sin(a*13-y*.6+s*2.3);
  const profile=[[1.012,-.13,0],[1.022,-.4,0],[1.018,-.85,1],[.995,-1.7,1],[.95,-.2*depth,2],[.84,-.4*depth,2],[.68,-.6*depth,2],[.48,-.8*depth,3],[.27,-.97*depth,3],[.1,-1.12*depth,3],[.02,-1.22*depth,3]];
  const band=[0x5f7a33,0x6b4b31,0x8a786b,0x6a6274];
  const top=[],topC=[],topUv=[],topIdx=[],cliff=[],cliffC=[],cliffUv=[],cliffIdx=[],c=new T.Color(),grassTint=new T.Color(land).lerp(new T.Color(0xd8d6b0),.55);
  top.push(x,h,z);c.copy(grassTint);topC.push(c.r,c.g,c.b);topUv.push(0,0);
  const fr=[.3,.6,.85,1,1.012,1.022];
  for(let ring=0;ring<fr.length;ring++)for(let i=0;i<=N;i++){const a=i/N*Math.PI*2,rad=r*fr[ring]*(ring>=3?rim(a):1),y=ring===4?-.13:ring===5?-.4:0;
   const px=x+Math.cos(a)*rad,pz=z+Math.sin(a)*rad;top.push(px,h+y,pz);c.copy(grassTint).multiplyScalar(ring>=4?.78-(ring-4)*.12:.93+.07*Math.sin(a*5+s));topC.push(c.r,c.g,c.b);topUv.push((px-x)/6,(pz-z)/6)}
  for(let i=0;i<N;i++)topIdx.push(0,1+i+1,1+i);
  for(let ring=0;ring<fr.length-1;ring++)for(let i=0;i<N;i++){const a=1+ring*(N+1)+i,b=a+N+1;topIdx.push(a,a+1,b,a+1,b+1,b)}
  const rows=profile.length;
  for(let k=0;k<rows;k++){const [rr,yy,bi]=profile[k],deep=k>=4;
   for(let i=0;i<=N;i++){const a=i/N*Math.PI*2,rad=r*rr*(deep?1+.1*n(a,yy):rim(a)),wob=deep?n(a*1.3,yy*2)*depth*.04:0;
    const px=x+Math.cos(a)*rad,py=h+yy+wob,pz=z+Math.sin(a)*rad;cliff.push(px,py,pz);
    c.set(band[bi]).lerp(new T.Color(band[Math.min(3,bi+1)]),(.5+.5*n(a*2,yy))*.6).multiplyScalar(1-k/rows*.25);cliffC.push(c.r,c.g,c.b);cliffUv.push(a*r/4,py/4)}}
  for(let k=0;k<rows-1;k++)for(let i=0;i<N;i++){const a=k*(N+1)+i,b=a+N+1;cliffIdx.push(a,b,a+1,a+1,b,b+1)}
  for(const [points,tints,uv,index,map] of [[top,topC,topUv,topIdx,turf],[cliff,cliffC,cliffUv,cliffIdx,rockMap]]){
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(points,3));g.setAttribute('color',new T.Float32BufferAttribute(tints,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(index);g.computeVertexNormals();
   const m=new T.Mesh(g,new T.MeshStandardMaterial({vertexColors:true,map,roughness:1}));m.receiveShadow=map===turf;m.castShadow=map===rockMap;scene.add(m)
  }
 }
 const plantCards=new Map();
 function foliage(name){if(plantCards.has(name))return plantCards.get(name);
  const geo=new T.PlaneGeometry(1,1);geo.translate(0,.5,0);
  const surface=new T.MeshLambertMaterial({map:loadSurface(name+'.png'),side:T.DoubleSide,alphaTest:.38,transparent:false});
  geo.userData.surface=surface;plantCards.set(name,geo);return geo}
 // Real 3D trees and flower tufts; one instanced draw per species.
 const firs=[1,2,3].map(i=>{const g=Nature.firGeometry(i);g.userData.surface=Nature.treeMaterial;return g});
 const blossoms=[1,2].map(i=>{const g=Nature.blossomGeometry(i);g.userData.surface=Nature.blossomMaterial;return g});
 const tufts=[0xd94f2c,0xf0bd2c,0xf6f1e4,0x9b6ad0,0xe8708f].map((c,i)=>{const g=Nature.tuftGeometry(i+3,c);g.userData.surface=Nature.plantMaterial;return g});
 const pick=(list,x,z)=>list[Math.abs(Math.round(x*7.3+z*3.1))%list.length];
 const shade=(x,z,a,b)=>new T.Color(a).lerp(new T.Color(b),.5+.5*Math.sin(x*1.3+z*.7)).getHex();
 function grove(name,x,z,h,y,width){shape(pick(tufts,x,z),0xffffff,x,y,z,width*.75,h*.95,width*.75,(x+z)*2.4)}
 function patch(){}
 const canopies=[];
 function pine(x,z,h,y=0){canopies.push({x,z,y,h,r:h*.37});shape(pick(firs,x,z),shade(x,z,0xf2eee2,0xc9d6c0),x,y,z,h*.74,h,h*.74,(x+z)*2.4)}
 function cherry(x,z,h){canopies.push({x,z,y:h*.45,h:h*.6,r:h*.5});shape(pick(blossoms,x,z),shade(x,z,0xffffff,0xffe0ea),x,0,z,h*1.15,h,h*1.15,(x+z)*2.4);for(let i=0;i<6;i++)rnd()}
 const wood=0x92583f,dark=0x3f4441,cream=0xdfcda6,teal=0x526558,red=0x925c40;
 function surfaced(geometry,file) {
  geometry.userData={};geometry.userData.surface=new T.MeshStandardMaterial({map:loadSurface(file+'.jpg'),roughness:.96});
  return geometry
 }
 const frontPanel=surfaced(new T.PlaneGeometry(),'front'),sidePanel=surfaced(new T.PlaneGeometry(),'side');
 const masonry=surfaced(cube.clone(),'masonry'),slate=surfaced(cube.clone(),'slate');
 const rope=new T.CylinderGeometry(1,1,1,7),iron=0x39372e;
 function cord(x1,y1,z1,x2,y2,z2,r,color){
  const dx=x2-x1,dy=y2-y1,dz=z2-z1,len=Math.hypot(dx,dy,dz);
  const direction=new T.Vector3(dx,dy,dz).normalize(),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),direction);
  const e=new T.Euler().setFromQuaternion(q);
  shape(rope,color,(x1+x2)/2,(y1+y2)/2,(z1+z2)/2,r,len,r,e.y,e.z,e.x)
 }
 // ---- Architecture -------------------------------------------------------
 // Houses are assembled from real parts: plinth, plastered walls, a half-timbered frame in relief,
 // deep window frames with warm light, shutters, flower boxes, doors, an overhanging tiled roof and a smoking chimney.
 const chimneys=[],rotorDiscs=[];
 function plasterTexture(){const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');
  g.fillStyle='#e9dcc4';g.fillRect(0,0,256,256);let s=91;const r=()=>(s=(s*16807)%2147483647)/2147483647;
  for(let i=0;i<2600;i++){const v=200+r()*55|0;g.fillStyle=`rgba(${v},${v-14|0},${v-34|0},${.05+r()*.08})`;const w=2+r()*14;g.fillRect(r()*256,r()*256,w,w*(.4+r()))}
  for(let i=0;i<14;i++){g.fillStyle=`rgba(120,98,70,${.03+r()*.04})`;g.beginPath();g.ellipse(r()*256,r()*256,10+r()*40,6+r()*26,r()*3,0,7);g.fill()}
  const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.anisotropy=4;return tex}
 const withSurface=(geo,material)=>{geo.userData={surface:material};return geo};
 const plasterMap=plasterTexture(),oakMap=loadSurface('wood.jpg'),tileMap=loadSurface('roof.jpg');tileMap.repeat.set(2.2,1.6);
 const plasterBox=withSurface(cube.clone(),new T.MeshStandardMaterial({map:plasterMap,roughness:.96}));
 const beam=withSurface(cube.clone(),new T.MeshStandardMaterial({map:oakMap,roughness:.82}));
 const tiles=withSurface(cube.clone(),new T.MeshStandardMaterial({map:tileMap,roughness:.88}));
 const glass=withSurface(cube.clone(),new T.MeshStandardMaterial({color:0x2a2522,emissive:0xffb25c,emissiveIntensity:1.5,roughness:.2,metalness:.1}));
 const ember=withSurface(cube.clone(),new T.MeshStandardMaterial({color:0x2b140a,emissive:0xff6a1f,emissiveIntensity:3.2,roughness:.6}));
 const planks=withSurface(cube.clone(),new T.MeshStandardMaterial({map:loadSurface('board.jpg'),roughness:.9}));
 const blossom=withSurface(new T.IcosahedronGeometry(1,1),new T.MeshStandardMaterial({roughness:.7}));
 const ridge=withSurface(new T.CylinderGeometry(1,1,1,10),new T.MeshStandardMaterial({map:tileMap,roughness:.9}));
 function gableGeometry(w,rise){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([-w/2,0,0,w/2,0,0,0,rise,0],3));
  g.setAttribute('uv',new T.Float32BufferAttribute([0,0,w/4,0,w/8,rise/4],2));g.computeVertexNormals();g.userData={surface:plasterBox.userData.surface};return g}
 // Places parts in a frame turned by ry: local x runs along a facade, local z points outward.
 function frame(x,y,z,ry){const c=Math.cos(ry),s=Math.sin(ry);
  return (geo,color,lx,ly,lz,sx,sy,sz,rz=0,rx=0)=>shape(geo,color,x+lx*c+lz*s,y+ly,z-lx*s+lz*c,sx,sy,sz,ry,rz,rx)}
 const oak=0x4d3526,paint=[0x3f6b63,0x7c3b2c,0x45603a];
 function windowAt(P,lx,y,out,w,h,shutter,flowers=true){
  P(glass,0xffffff,lx,y,out+.015,w,h,.04);
  for(const sx of [-1,1])P(beam,oak,lx+sx*(w/2+.045),y,out+.06,.09,h+.18,.12);
  for(const sy of [-1,1])P(beam,oak,lx,y+sy*(h/2+.045),out+.06,w+.18,.09,.12);
  P(beam,oak,lx,y,out+.05,.045,h,.05);P(beam,oak,lx,y+h*.12,out+.05,w,.045,.05);
  P(planks,0xd8c3a2,lx,y-h/2-.11,out+.11,w+.34,.07,.22);
  for(const sx of [-1,1]){P(planks,shutter,lx+sx*(w/2+.27),y,out+.07,.4,h+.1,.04);P(beam,0x2a2a28,lx+sx*(w/2+.27),y+h*.25,out+.1,.32,.03,.02)}
  if(!flowers)return;
  P(planks,0x7a5536,lx,y-h/2-.25,out+.2,w+.18,.2,.24);
  const tones=[0xe2475b,0xf6c443,0xf4f0f2,0xd45a9b,0xe2475b];
  for(let i=0;i<9;i++){const fx=lx-w/2+.08+i*(w-.16)/8;P(blossom,i%2?0x4f7d32:tones[i%5],fx,y-h/2-.08+(i%3)*.03,out+.2+(i%2?.04:-.03),i%2?.09:.065,i%2?.07:.065,i%2?.09:.065)}}
 function doorAt(P,lx,y0,out,color){
  P(planks,color,lx,y0+.95,out+.03,1.0,1.9,.07);
  for(const sx of [-1,1])P(beam,oak,lx+sx*.56,y0+1.0,out+.07,.13,2.05,.14);
  P(beam,oak,lx,y0+2.05,out+.08,1.34,.16,.16);
  for(const yy of [.55,1.45])P(beam,0x2a2622,lx,y0+yy,out+.075,.9,.05,.02);
  P(ball,brass,lx+.3,y0+.98,out+.1,.045,.045,.045);
  P(masonry,0xcfc1a8,lx,.12,out+.42,1.5,.24,.8)}
 // Half-timbered facade: corner posts, rails at sill and plate height, St Andrew's crosses under the windows.
 function halfTimber(P,half,out,y0,hgt,openings){
  const sill=y0+hgt*.32,plate=y0+hgt-.07;
  for(const lx of [-half+.07,half-.07])P(beam,oak,lx,y0+hgt/2,out+.035,.16,hgt,.14);
  P(beam,oak,0,y0+.07,out+.035,half*2,.15,.14);P(beam,oak,0,plate,out+.035,half*2,.15,.14);P(beam,oak,0,sill,out+.035,half*2,.12,.13);
  const edges=[-half+.07,...openings.flatMap(([c,w])=>[c-w/2,c+w/2]),half-.07].sort((a,b)=>a-b);
  for(let i=0;i<edges.length-1;i+=2){const a=edges[i],b=edges[i+1],span=b-a;if(span<.45)continue;
   const mid=(a+b)/2,low=y0+.07,high=sill,len=Math.hypot(span,high-low),ang=Math.atan2(high-low,span);
   for(const s of [-1,1])P(beam,oak,mid,(low+high)/2,out+.03,len,.1,.11,s*ang);
   if(span>1.5)P(beam,oak,mid,(sill+plate)/2,out+.035,.13,plate-sill,.12)}
  for(const [c,w,full] of openings)if(!full)for(const sx of [-1,1])P(beam,oak,c+sx*(w/2+.12),(sill+plate)/2,out+.035,.12,plate-sill,.12)}
 function roof(x,z,w,d,yTop,rise,mat,color,over=.5){
  const a=Math.atan2(rise,w/2),slope=Math.hypot(w/2,rise),t=.18;
  for(const side of [-1,1]){const cx=x+side*w/4,cy=yTop+rise/2,ux=side*Math.cos(a),uy=-Math.sin(a),nx=side*Math.sin(a),ny=Math.cos(a);
   shape(mat,color,cx+ux*over/2+nx*(t/2+.02),cy+uy*over/2+ny*(t/2+.02),z,slope+over,t,d+.9,0,-side*a);
   shape(beam,oak,cx+ux*over/2+nx*.02,cy+uy*over/2-.06,z,slope+over,.12,d+.6,0,-side*a)}
  shape(ridge,0xc98a64,x,yTop+rise+.12,z,.13,d+.95,.13,0,0,Math.PI/2)}
 function gables(x,z,w,d,yTop,rise,attic=true){const g=gableGeometry(w,rise);
  for(const end of [-1,1]){const P=frame(x,yTop,z+end*d/2,end>0?0:Math.PI);
   shape(g,0xf2e6d0,x,yTop,z+end*d/2,1,1,1,end>0?0:Math.PI);
   P(beam,oak,0,rise*.42,.04,.15,rise*.84,.13);P(beam,oak,0,rise*.4,.04,w*.58,.13,.13);
   for(const s of [-1,1])P(beam,oak,s*w/4,rise/2-.03,.06,Math.hypot(w/2,rise)+.5,.12,.12,s*Math.atan2(rise,w/2)*-1);
   if(attic){P(glass,0xffffff,0,rise*.62,.03,.42,.42,.04);P(wheel,oak,0,rise*.62,.07,.3,.3,.4)}}}
 function chimney(x,z,yTop,rise){const h=rise+1.1;shape(masonry,0xd9c9ae,x,yTop+h/2,z,.62,h,.62);shape(masonry,0xa89886,x,yTop+h+.08,z,.8,.16,.8);chimneys.push([x,yTop+h+.25,z])}
 function hut(x,z,w,variant=0){
  const d=w*.86,y0=.48,hgt=w*.6,yTop=y0+hgt,rise=w*.47,colors=paint[variant%3];
  shape(masonry,0xd8cdb9,x,y0/2,z,w+.22,y0,d+.22);
  shape(plasterBox,variant?0xf3e4cc:0xffffff,x,yTop/2+y0/2,z,w,hgt,d);
  // front: door with a window either side
  let P=frame(x,0,z+d/2,0);halfTimber(P,w/2,0,y0,hgt,[[0,1.3,true],[-w*.31,.95],[w*.31,.95]]);doorAt(P,0,y0,0,0x6e4a30);
  for(const s of [-1,1])windowAt(P,s*w*.31,y0+hgt*.6,0,.78,.86,colors);
  lantern(x+.85,y0+2.05,z+d/2+.32);
  // sides and back
  for(const side of [-1,1]){P=frame(x+side*w/2,0,z,side*Math.PI/2);halfTimber(P,d/2,0,y0,hgt,[[side*-.45,.95]]);windowAt(P,side*-.45,y0+hgt*.6,0,.7,.78,colors,side>0)}
  P=frame(x,0,z-d/2,Math.PI);halfTimber(P,w/2,0,y0,hgt,[[0,.95]]);windowAt(P,0,y0+hgt*.6,0,.78,.86,colors,false);
  gables(x,z,w,d,yTop,rise);roof(x,z,w,d,yTop,rise,tiles,0xffffff);chimney(x+w*.24,z-d*.18,yTop,rise);
  // garden details: barrel, bench, bushes along the front
  shape(cyl,0x7a5232,x-w*.52,.42,z+d*.5+.45,.32,.84,.32);for(const yy of [.18,.66])shape(cyl,0x3b3a36,x-w*.52,yy,z+d*.5+.45,.335,.05,.335);
  shape(planks,0xb08d67,x+w*.33,.46,z+d/2+.55,1.2,.08,.36);for(const s of [-1,1])shape(beam,oak,x+w*.33+s*.5,.22,z+d/2+.55,.08,.44,.3);
  for(const s of [-1,1])for(let i=0;i<3;i++)shape(pick(tufts,x+s*i,z),0xffffff,x+s*(w*.18+i*.42),0,z+d/2+.3,.55,.5,.55,i+s);
  solids.add({x,z,w:w*.53,d:w*.46,base:0,top:yTop+rise})
 }
 // Stone smithy with a glowing forge, and a timber carpentry shed with a lean-to and lumber.
 function workshop(x,z,w,stone){
  const d=w*.87,h=stone?2.6:3.0,front=z+d*.5,rise=stone?1.25:1.7;
  if(stone){shape(masonry,0xf0dcc0,x,h/2,z,w,h,d);
   let P=frame(x,0,front,0);
   P(planks,0x5d3f2a,-.22*w,1.05,.04,1.25,2.1,.08);P(beam,oak,-.22*w,2.2,.09,1.55,.18,.18);for(const s of [-1,1])P(beam,oak,-.22*w+s*.7,1.1,.08,.14,2.2,.16);
   P(ember,0xffffff,.24*w,1.0,.03,.95,.7,.06);P(masonry,0x8c7f72,.24*w,1.42,.12,1.25,.16,.3);P(masonry,0x8c7f72,.24*w,.58,.12,1.25,.16,.3);for(const s of [-1,1])P(masonry,0x8c7f72,.24*w+s*.56,1.0,.12,.16,.95,.3);
   P(cube,0x3a3a3c,.05*w,.42,1.25,.7,.22,.32);P(cube,0x2c2c2e,.05*w,.2,1.25,.32,.4,.26);P(cone,0x3a3a3c,.05*w+.48,.45,1.25,.12,.32,.12,Math.PI/2);
   P(cyl,0x6b4a30,-.48*w,.42,.75,.34,.84,.34);
   for(const side of [-1,1]){P=frame(x+side*w/2,0,z,side*Math.PI/2);windowAt(P,0,1.45,0,.7,.72,0x5a4a3c,false)}
   gables(x,z,w,d,h,rise,false);roof(x,z,w,d,h,rise,slate,0xbcb2a6,.42);
   shape(masonry,0xc4ad90,x+.3*w,h/2+1.3,z-.2*d,1.05,h+2.6,1.05);shape(masonry,0x9a8a7a,x+.3*w,h+2.68,z-.2*d,1.25,.2,1.25);chimneys.push([x+.3*w,h+2.9,z-.2*d],[x+.3*w,h+3.2,z-.2*d]);
  }else{
   shape(planks,0xc6a47c,x,h/2,z,w,h,d);shape(masonry,0xcfc3ad,x,.15,z,w+.18,.3,d+.18);
   for(const sx of [-1,1])for(const sz of [-1,1])shape(beam,oak,x+sx*(w/2-.05),h/2,z+sz*(d/2-.05),.2,h,.2);
   for(const sz of [-1,1])shape(beam,oak,x,h-.08,z+sz*(d/2+.02),w+.1,.16,.12);
   let P=frame(x,0,front,0);doorAt(P,-.22*w,0,0,0x7d5636);windowAt(P,.22*w,1.6,0,.8,.8,0x3f6b63);
   for(const side of [-1,1]){P=frame(x+side*w/2,0,z,side*Math.PI/2);windowAt(P,0,1.7,0,.7,.7,0x3f6b63,false)}
   gables(x,z,w,d,h,rise,true);roof(x,z,w,d,h,rise,tiles,0xd9b89c,.5);
   // lean-to with stacked timber on the left
   const lx=x-w/2-1.05;for(const sz of [-1,1])shape(beam,oak,lx-.95,1.05,z+sz*(d/2-.2),.14,2.1,.14);
   shape(planks,0x9c7a58,lx-.1,2.15,z,2.1,.08,d+.2,0,-.22);
   for(let i=0;i<9;i++){const row=Math.floor(i/3),col=i%3;shape(cyl,0x8a6a4a,lx-.55+col*.34+row*.17,.18+row*.3,z,.16,d*.7,.16,0,0,Math.PI/2)}
   for(let i=0;i<5;i++)shape(planks,0xd9b98f,lx-.4,1.02+i*.07,z+.2,1.1,.05,d*.8,.1*i);
   shape(beam,oak,x,h+rise+.55,front+.35,.16,.16,1.3,0,0,Math.PI/2);shape(wheel,iron,x,h+rise+.35,front+.95,.16,.16,.16);
   cord(x,h+rise+.3,front+.95,x,2.6,front+.95,.02,0x8a7350);shape(wheel,iron,x,2.5,front+.95,.09,.09,.09,Math.PI/2);
   shape(beam,oak,x+.32*w,.55,front+.75,1.1,.12,.18);for(const s of [-1,1])shape(beam,oak,x+.32*w+s*.42,.28,front+.75,.08,.56,.32,0,s*.25);
  }
  solids.add({x,z,w:w*.52,d:d*.51,base:0,top:h+rise});
 }
 const lathe=(points,n=16)=>new T.LatheGeometry(points.map(([r,h])=>new T.Vector2(r,h)),n);
 const column=lathe([[.21,0],[.235,.05],[.23,.15],[.174,.19],[.165,.33],[.13,.39],[.095,.47],[.082,2.46],[.13,2.50],[.125,2.56],[.08,2.59],[.06,2.76],[0,2.83]]);
 const cap=lathe([[0,0],[.22,0],[.29,.04],[.255,.08],[.17,.13],[.11,.20],[.07,.22],[.066,.26],[0,.27]],12);
 const lens=lathe([[.112,-.22],[.166,-.15],[.19,.09],[.167,.17],[.135,.19]],12);
 lens.userData.surface=new T.MeshStandardMaterial({color:0xefc991,emissive:0xffa44a,emissiveIntensity:2.4,roughness:.22,metalness:.12});
 const bronze=0x554538, patina=0x40504b, brass=0xb69765;
 const hoop=new T.TorusGeometry(1,.13,7,18);
 function bracket(points,r){return new T.TubeGeometry(new T.CatmullRomCurve3(points.map(([x,y])=>new T.Vector3(x,y,0))),20,r,7,false)}
 const crook=bracket([[0,2.45],[.05,2.77],[.22,2.98],[.43,3.05],[.60,2.94],[.61,2.79],[.56,2.74]],.045);
 const scroll=bracket([[0,2.38],[.17,2.49],[.33,2.63],[.36,2.76],[.28,2.80],[.238,2.74],[.276,2.71]],.029);
 function lantern(x,y,z,parent=null){
  const piece=(geo,color,dy,w,h,d)=>shape(geo,color,x,y+dy,z,w,h,d,0,0,0,parent);
  piece(cap,patina,.17,1,1,1);piece(lens,0xffffff,0,1,1,1);
  piece(cyl,brass,-.197,.148,.041,.148);
  piece(cap,bronze,-.263,.66,.26,.66);piece(ball,brass,-.272,.055,.07,.055);
  for(let i=0;i<6;i++){const a=i*Math.PI/3;shape(rope,bronze,x+.165*Math.cos(a),y-.003,z+.165*Math.sin(a),.014,.38,.014,0,0,0,parent)}
  piece(hoop,bronze,.48,.062,.078,.06)
 }
 function lamp(x,z,y=0,parent=null){
  const piece=(geo,color,dy,w,h,d)=>shape(geo,color,x,y+dy,z,w,h,d,0,0,0,parent);
  piece(masonry,0xdeceaf,.055,.55,.11,.55);piece(column,patina,.09,1,1,1);
  for(const dy of [.29,.47,2.55])piece(cyl,brass,dy,dy<1?.154:.108,.032,dy<1?.154:.108);
  piece(crook,patina,.09,1,1,1);piece(scroll,bronze,.09,1,1,1);
  lantern(x+.56,y+2.32,z,parent)
 }
 const millRoof=surfaced(new T.ConeGeometry(1,1,16),"slate");
 const sailcloth=new T.PlaneGeometry(.65,2.77,4,10);
 const clothPos=sailcloth.attributes.position;
 for(let i=0;i<clothPos.count;i++){const u=(clothPos.getX(i)+.325)/.65,v=(clothPos.getY(i)+1.385)/2.77;
  clothPos.setZ(i,.02+.105*Math.sin(Math.PI*u)*Math.sin(Math.PI*v)+u*.07*v)}
 sailcloth.computeVertexNormals();sailcloth.userData.surface=new T.MeshStandardMaterial({map:loadSurface('canvas.jpg'),color:0xeaddc7,side:T.DoubleSide,roughness:1});
 function mill(x,z,smock=false){
  const tower=new T.CylinderGeometry(smock?1.37:1.5,2.6,7.8,smock?8:32);
  tower.userData.surface=smock?timberMat:masonry.userData.surface;
  shape(tower,0xf0e0c8,x,3.9,z,1,1,1);shape(millRoof,0xffffff,x,8.8,z,2.65,2.6,2.65);
  if(smock){for(let i=0;i<8;i++){const a=i*Math.PI/4,b=a+Math.PI/4;
   cord(x+2.59*Math.sin(a),.1,z+2.59*Math.cos(a),x+1.40*Math.sin(a),7.72,z+1.40*Math.cos(a),.10,wood);
   cord(x+2.5*Math.sin(a),.48,z+2.5*Math.cos(a),x+2.05*Math.sin(b),3.48,z+2.05*Math.cos(b),.069,cream)}
   shape(cyl,wood,x,3.5,z,2.74,.19,2.74);
   for(let i=0;i<16;i++){const a=i*Math.PI/8,b=a+Math.PI/8;
    const px=x+2.65*Math.sin(a),pz=z+2.65*Math.cos(a);shape(cyl,wood,px,3.91,pz,.04,.78,.04);
    cord(px,4.28,pz,x+2.65*Math.sin(b),4.28,z+2.65*Math.cos(b),.045,wood)}
  }else{for(const h of [1.1,5.1,7.7]){let radius=2.62-h*.14;shape(cyl,wood,x,h,z,radius,.12,radius)}}
  for(const side of [-1,1]){shape(cube,wood,x+side*.75,3.4,z+1.82,.65,1.2,.18,side*.45);shape(cube,0x617c80,x+side*.75,3.4,z+1.92,.41,.85,.12,side*.45)}
  // Rotor turns in XY. Even the gallery ends at 2.74, behind the blades' rear face at 3.18.
  const offset=3.32,hub=group(x,6.25,z+offset);hub.name='mill-rotor';rotorDiscs.push({x,y:6.25,z:z+offset,r:5.2});
  shape(cyl,bronze,x,6.25,z+2.33,.22,2.10,.22,0,0,Math.PI/2);
  for(let i=0;i<4;i++){
   const arm=group(0,0,0,hub);arm.rotation.z=i*Math.PI/2;
   const blade=(geo,color,x,y,z,w,h,d)=>shape(geo,color,x,y,z,w,h,d,0,0,0,arm);
   blade(cube,wood,0,2.28,0,.145,4.66,.15);
   for(const rail of [.38,.88])blade(cube,wood,rail,3,0,.042,3.1,.06);
   for(let j=0;j<10;j++)blade(cube,wood,.435,1.47+j*.337,.02,.97,.048,.076);
   blade(sailcloth,cream,.42,3.10,.069,1,1,1);
  }
  shape(cyl,wood,0,0,.065,.34,.43,.34,0,0,Math.PI/2,hub);
  shape(ball,brass,0,0,.31,.133,.133,.068,0,0,0,hub);rotors.push(hub);solids.add({x,z,r:smock?2.74:2.54,base:0,top:10.1})
 }
 function pennants(x,z,span){for(const side of [-1,1])solids.add({x:x+side*span/2,z,r:.14,base:0,top:6});for(let s of [-1,1])shape(cyl,wood,x+s*span/2,3,z,.13,6,.13);
 for(let i=0;i<11;i++){let t=i/10,px=x+(t-.5)*span,py=5.9-Math.sin(t*Math.PI)*1.12;shape(cube,wood,px,py,z,span/10+.04,.075,.075,0,-.16*Math.cos(t*Math.PI));shape(cone,i%3===0?red:i%3===1?cream:teal,px,py-.23,z,.24,.45,.07,0,Math.PI)}}
 function airship(x,y,z){const g=group(x,y,z);const hull=shape(ball,0xf2ab68,0,4,0,3.2,3.5,7.6,0,0,0,g);hull.material=new T.MeshStandardMaterial({map:loadSurface('canvas.jpg'),roughness:.96});
 const beltGeo=new T.TorusGeometry(1,.013,6,64);
 for(const t of [-.76,-.48,-.20,.20,.48,.76]){const radius=Math.sqrt(1-t*t);shape(beltGeo,0x65523c,0,4,t*7.6,3.23*radius,3.54*radius,1,0,0,0,g)}
 for(const side of [-1,1]){for(const t of [-1,0,1])shape(cyl,0x5f503e,side*1.75,1.4,t*2.15,.035,3.8,.035,0,-side*.42,0,g);
 shape(cube,cream,side*1.13,-.7,0,.08,.13,4.3,0,0,0,g);
 for(let t=-2;t<=2;t++)shape(wheel,0xb89059,side*1.23,-.92,t*.78,.20,.20,.20,Math.PI/2,0,0,g)}
 shape(ball,wood,0,-1,0,1.55,1.05,3.75,0,0,0,g);
 for(let s of [-1,1])for(let t of [-1,1])shape(cyl,dark,s*1.15,.65,t*2.15,.07,2.95,.07,0,-s*.19,0,g);
 shape(cone,teal,0,4,-6.7,1.6,2.6,1.1,0,.32,0,g);g.rotation.y=1.05;clouds.push([g,y,.45]);}
 const water=new T.MeshBasicMaterial({map:loadSurface('cascade.png'),side:T.DoubleSide,transparent:true,depthWrite:false});
 const land=[0x9cca75,0xa1c884,0xb0d5ca];
 islands.forEach(({x,z,r},k)=>{island(x,z,r,land[k]);
  for(let j=0;j<150;j++){let a=rnd()*6.28,d=Math.sqrt(rnd())*(r-1),px=x+Math.cos(a)*d,pz=z+Math.sin(a)*d;
   if(Math.abs(px)<3){continue}
   if(j%13===0 && d>12 && Math.abs(px)>10){let h=4+rnd()*3;if(nearPaving(px,pz,k,h*(k===1?.56:.405))){if(k===1)for(let j=0;j<6;j++)rnd();continue}k===1?cherry(px,pz,h):pine(px,pz,h);solids.add({x:px,z:pz,r:.43,base:0,top:h});solids.add({x:px,z:pz,r:k===1?2.6:h*.23,base:h*.40,top:h})}
   else if(j%5===0){if(nearPaving(px,pz,k,.8))continue;if(k===2&&[[-7,-112],[7,-120],[0,-126]].some(([a,b])=>Math.hypot(px-a,pz-b)<2)){rnd();continue}solids.add({x:px,z:pz,r:.70,base:0,top:.78});shape(stoneGeo,k===2?0x9caebc:0x9d9b84,px,.25,pz,.8,.57,.75,a)}
   else if(!nearPaving(px,pz,k,.39)){grove('meadow',px,pz,.45+.3*Math.sin(a)**2,0,.77)}
  }
  for(let j=-r+2;j<r-1;j+=1.55){let px=1.2*Math.sin(j*.18+k);
   for(let f=0;f<2;f++){let fx=px+(f?1:-1)*(2.65+rnd()*.8),fz=z+j;if(!nearPaving(fx,fz,k,.25)&&f===0 && Math.abs(Math.sin(j))>.65)grove("meadow",fx,fz,.31,0,.52)}}
  const pts=[],uv=[],indices=[];
  for(let n=0;n<=48;n++){let t=n/48,zz=(2*t-1)*(r-1),center=1.2*Math.sin(zz*.18+k);
   for(const side of [-1,1]){let xx=center+side*(2.13+.18*Math.sin(n*1.42+side));pts.push(xx,.045,z+zz);uv.push(xx/3.7,zz/3.7)}
   if(n>0){let i=n*2;indices.push(i-2,i,i-1,i-1,i,i+1)}}
  const road=new T.BufferGeometry();road.setAttribute('position',new T.Float32BufferAttribute(pts,3));road.setAttribute('uv',new T.Float32BufferAttribute(uv,2));road.setIndex(indices);road.computeVertexNormals();
  let path=new T.Mesh(road,new T.MeshStandardMaterial({map:dirtMap,roughness:1,color:0xdfd5b9}));path.receiveShadow=true;scene.add(path);
  for(const home of villageHomes.filter(h=>h.k===k)){
   const line=branchPoints(home),vertices=[],texcoords=[],faces=[];
   for(let i=0;i<line.length;i++){
    const prev=line[Math.max(0,i-1)],next=line[Math.min(line.length-1,i+1)];
    const before=new T.Vector2(line[i][0]-prev[0],line[i][1]-prev[1]).normalize();
    const after=new T.Vector2(next[0]-line[i][0],next[1]-line[i][1]).normalize();
    const dir=before.clone().add(after).normalize(),width=.88/Math.max(.52,dir.dot(i?before:after));
    for(const side of [-1,1]){
     const xx=line[i][0]-side*dir.y*width,zz=line[i][1]+side*dir.x*width;
     vertices.push(xx,.055,zz);texcoords.push(xx/3.7,(zz-z)/3.7)
    }
    if(i){const n=i*2;faces.push(n-2,n-1,n,n,n-1,n+1)}
   }
   const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(texcoords,2));geometry.setIndex(faces);geometry.computeVertexNormals();
   const lane=new T.Mesh(geometry,path.material);lane.material.side=T.DoubleSide;lane.receiveShadow=true;scene.add(lane)
  }
  let gx=r*.69,gz=z+r*.72;
  for(let j=0;j<9;j++){let yy=-6-rnd()*3;if(j>2)continue;
   const sheet=new T.PlaneGeometry(.9,-yy*2);
   const f=new T.Mesh(sheet,water);f.position.set(gx+j*.53,yy,gz-j*.41);f.rotation.y=-.65;
   scene.add(f);falls.push([f,yy])}
 });
 for(let i=0;i<8;i++){let x=6+i%3*1.16,z=12+Math.floor(i/3)*1.21;solids.add({x,z,w:.555,d:.555,base:0,top:1.08});shape(cube,0xbc8352,x,.54,z,1.07,1.04,1.08);for(let side of [-1,1])shape(cube,0x745344,x+side*.39,.54,z,.13,1.1,1.11)}
 for(let z of [10,-6,-17,-50,-71,-101,-118]){let x=z%2?3.8:-3.8;solids.add({x,z,r:.22,base:0,top:3.22});lamp(x,z)}
 pine(8,4,5);solids.add({x:8,z:4,r:.43,base:0,top:5});
 hut(-10,5,5,0);workshop(-15,-3,4,false);workshop(11,7,4.7,true);mill(-9,-11);pennants(0,4,10);airship(14,12,-15);
 hut(12,-60,5,1);pennants(0,-58,9);mill(-12,-68,true);
 // Copper observatory with a striped dome and telescope.
 shape(cyl,cream,-9,2.4,-125,4.2,4.8,4.2);shape(ball,teal,-9,4.85,-125,4.58,3.6,4.58);shape(cyl,0xc78d61,-9,5,-125,4.65,.5,4.65);solids.add({x:-9,z:-125,r:4.35,base:0,top:8.25});
 for(let i=0;i<30;i++){let s=i%2?1:-1,x=s*(48+rnd()*88),z=32-rnd()*205,r=4+rnd()*12,h=-6+rnd()*15;island(x,z,r,land[i%3],r*.85,h);for(let j=0;j<3;j++)pine(x+rnd()*r*.6,z+rnd()*r*.55,3+rnd()*4,h)}
 const cloudGeo=new T.PlaneGeometry();
 cloudGeo.userData.surface=new T.MeshBasicMaterial({map:loadSurface('mist.png'),transparent:true,depthWrite:false,side:T.DoubleSide,opacity:.77});
 for(let i=0;i<100;i++){let x=(rnd()-.5)*310,z=70-rnd()*315,y=-22-rnd()*10;shape(cloudGeo,0xffffff,x,y,z,35+rnd()*34,9+rnd()*12,1,(rnd()-.5)*1.4)}
 for(let j=0;j<2;j++){let z=j===0?-21:-81;shape(cube,wood,0,.04,z,5,.32,5);pennants(0,z+1.5,5.5);ports.push(z)}
 solids.add({x:0,z:-130,r:2.15,base:0,top:2});for(let j=0;j<3;j++){let a=j*2.095;solids.add({x:Math.cos(a)*1.5,z:-130+Math.sin(a)*1.5,r:.42,base:1.9,top:5.5})}
 const beacon=group(0,0,-130);shape(cyl,dark,0,1,0,2.2,2,2.2,0,0,0,beacon);for(let j=0;j<3;j++){let a=j*2.095;shape(cone,0xc48852,Math.cos(a)*1.5,3,Math.sin(a)*1.5,.48,5,.48,0,0,0,beacon)}
 const core=shape(iso,0xffcb61,0,4.4,0,1,1.65,1,0,0,0,beacon);
 const beaconBeam=new T.Mesh(new T.CylinderGeometry(.56,1.4,65,12),new T.MeshBasicMaterial({color:0xffec9d,transparent:true,opacity:.37,depthWrite:false}));beaconBeam.position.set(0,35,-130);scene.add(beaconBeam);
 flush();
 const bridgeGroups=[];
 const plank=surfaced(cube.clone(),'board');
 for(let j=0;j<2;j++){let begin=j===0?-22:-82,end=j===0?-40:-98;
  for(const side of [-1,1])solids.add({x:side*1.8,z:(begin+end)/2,w:.105,d:(begin-end)/2,base:0,top:1.39,stage:j+1});
  const length=begin-end,planks=Math.ceil(length/.38);
  for(let i=0;i<=planks;i++){
   const z=begin-length*i/planks;
   shape(plank,0xf3e3c9,0,.055,z,3.74+.09*Math.sin(i*17),.25,length/planks-.019,0,0,.013*Math.sin(i*19));
  }
  for(const side of [-1,1]){
   const x=1.8*side,sections=4,span=length/sections;
   for(let i=0;i<=sections;i++){
    const z=begin-span*i;shape(cyl,wood,x,.92,z,.105,1.86,.105);
    for(const y of [1.44,1.52,1.6])shape(cyl,0xb39b71,x,y,z,.124,.052,.124);
    if(i===0||i===sections){shape(cube,wood,x+side*.21,1.78,z,.58,.10,.12);lantern(x+side*.42,1.16,z)}
    if(i===sections)continue;
    let lastY=1.55;
    for(let k=1;k<=8;k++){
     const t=k/8,yy=1.55-.37*4*t*(1-t),zz=z-span*t;
     for(const offset of [0,-.58])cord(x,lastY+offset,zz+span/8,x,yy+offset,zz,.041,0x947651);
     if(k%2===0)cord(x,yy,zz,x,.15,zz,.023,0x826644);lastY=yy
    }
   }
  }
  let n=scene.children.length;flush();bridgeGroups.push(scene.children.slice(n))}
 // Each door opens into a furnished walkable room in a separate part of the scene.
 const rooms=villageHomes.map((house,i)=>{
  const x=410+i*24,z=0,room=group(x,0,z),build=(geo,color,x,y,z,w,h,d)=>shape(geo,color,x,y,z,w,h,d,0,0,0,room);
  build(slate,0xa9ac9c,0,-.14,0,10,.28,10);
  const wall=surfaced(cube.clone(),i===2?'masonry':'wall');
  build(wall,0xefdfbc,0,2.3,-5,10.3,4.6,.22);
  for(const side of [-1,1]){
   build(wall,0xe1cfaa,side*5,2.3,0,.22,4.6,10);
   for(const zz of [-4.8,0,4.8])build(cube,wood,side*4.84,2.18,zz,.19,4.4,.22);
   build(cube,wood,side*4.84,3.55,0,.21,.21,10);
  }
  build(cube,wood,0,3.75,-4.82,10,.21,.20);
  build(cube,0x689298,-2,2.6,-4.78,2.45,1.45,.14);
  for(const xx of [-3.24,-2,-.76])build(cube,wood,xx,2.6,-4.65,.11,1.58,.12);
  for(const yy of [1.85,2.6,3.35])build(cube,wood,-2,yy,-4.65,2.59,.09,.12);
  build(plank,0xe9d6ba,2.9,1.12,-3.18,2.58,.19,1.18);
  for(const xx of [1.78,4.02])for(const zz of [-3.65,-2.72])build(cube,wood,xx,.54,zz,.13,1.10,.13);
  for(let j=0;j<5;j++)build(i===2?stoneGeo:cube,[house.color,0xb19466,0x67664e][j%3],2.05+j*.34,1.37,-3.2,.23,.31+j%2*.12,.43);
  build(cube,house.color,0,.02,1.8,2.7,.032,3);build(plank,0xefcf94,0,.035,4.05,1.85,.06,.78);
  lantern(3.7,3.30,-4.47,room);room.visible=false;
  return {house,x,z,room,exit:{x,z:4.05},npc:{x:x+.55,z:-1.83},actor:null}
 });
 let inside=null;
 function enterRoom(room){
  if(inside)inside.room.visible=false;
  inside=room;if(!room)return;room.room.visible=true;
  if(!room.actor){room.actor=embodiedPerson(room.room,room.house.key);room.actor.root.position.set(.55,0,-1.83);room.actor.root.rotation.y=Math.PI;
   room.actor.ready.catch(()=>console.error('Bewoner kon niet laden'))}
 }
 const hero=expeditionPilot(scene),shadow=new T.Mesh(new T.PlaneGeometry(1.46,.94),new T.MeshBasicMaterial({map:loadSurface("footshadow.png"),transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;scene.add(shadow);
 const nodes=[[-5,7,'hout'],[5,-1,'hout'],[-5,-9,'steen'],[6,-15,'steen'],[-6,-47,'hout'],[5,-54,'steen'],[-5,-66,'hout'],[5,-73,'steen'],[-5,-104,'steen'],[6,-114,'hout'],[-5,-120,'steen'],[7,-132,'hout']].map(([x,z,type],i)=>{
  solids.add(type==='hout'?{x,z,w:.83,d:1.12,base:0,top:1.48,harvest:i}:{x,z,r:1.16,base:0,top:1.74,harvest:i});
  const g=group(x,0,z);if(type==='hout'){for(let j=0;j<3;j++){
   const r=[.396,.346,.319][j],len=[2.17,1.93,2.02][j],log=group([-.36,.34,-.045][j],[.40,.35,.965][j],[.015,-.08,.06][j],g);
   log.rotation.y=[-.045,.05,.013][j];log.rotation.z=[.014,-.018,.009][j];
   const trunk=new T.CylinderGeometry(r*.90,r,len,21,5,true),pos=trunk.attributes.position;
   for(let v=0;v<pos.count;v++){const a=Math.atan2(pos.getZ(v),pos.getX(v)),h=pos.getY(v);
    const k=1+.041*Math.cos(5*a+j)+.026*Math.sin(9*a+h*1.1)+.014*Math.cos(13*a);pos.setXYZ(v,pos.getX(v)*k,h,pos.getZ(v)*k)}
   trunk.computeVertexNormals();shape(trunk,wood,0,0,0,1,1,1,0,0,Math.PI/2,log).material=bark;
   for(const side of [-1,1]){
    const rad=r*(side>0?.90:1),end=new T.CircleGeometry(rad,21),points=end.attributes.position;
    for(let v=1;v<points.count;v++){const a=Math.atan2(-points.getY(v)*side,points.getX(v)),h=side*len/2;
     const k=1+.041*Math.cos(5*a+j)+.026*Math.sin(9*a+h*1.1)+.014*Math.cos(13*a);points.setXY(v,points.getX(v)*k,points.getY(v)*k)}
    shape(end,0xffffff,0,0,side*len/2,1,1,1,side>0?0:Math.PI,0,0,log).material=cutEnd
   }
   const knot=shape(cyl,wood,r*.65,r*.58,.2-j*.13,.062,.21,.065,.35,-.78,.22,log);knot.material=bark
  }}else{for(let j=0;j<4;j++)shape(iso, [0x5f8c9c,0x83b5b9][j%2],Math.sin(j*2)*.61,.5+j%2*.37,Math.cos(j*2)*.58,.8,1.1,.82,j*.7,0,0,g).material=ore}
  const marker=shape(wheel,0xffc65a,0,2.4,0,.29,.29,.29,0,0,0,g);return {g,x,z,type,i,marker}});
 const probe={stage:9,harvest:{},builds:[]};
 const grassAreas=(count,r)=>{const out=[];for(let k=0;k<3;k++){const {x,z,r:R}=islands[k];let made=0,tries=0;
  while(made<count/3&&tries++<count*4){const a=r()*Math.PI*2,d=Math.sqrt(r())*(R-.7),px=x+Math.cos(a)*d,pz=z+Math.sin(a)*d;
   if(nearPaving(px,pz,k,-.15)||solids.blocked(px,pz,probe,0,.18,.5)||Math.abs(px)<2.9&&[-21,-81].some(q=>Math.abs(pz-q)<2.9))continue;out.push([px,pz]);made++}}return out};
 const meadow=context?Nature.grass(scene,grassAreas,30000,77):[];
 const life=context?Nature.life(scene,{chimneys,glades:[[-15,11],[16,-6],[-14,-52],[15,-66],[12,-108]],valley:[0,0,-61]}):null;
 const gates=[[-7,-112],[7,-120],[0,-126]].map(([x,z])=>{let g=group(x,2.85,z);shape(wheel,0xffad39,0,0,0,1.7,1.7,1.7,0,0,0,g);return {g,x,z}});
 const sail=group(0,2.55,0,hero.root);
 for(let side of [-1,1]){shape(iso,side===1?red:0xffbc65,side*1.17,.16,.1,1.57,.19,.89,side*.22,side*.15,0,sail);shape(cube,wood,side*.54,-.39,0,.09,1.2,.1,0,-side*.56,0,sail)}
 sail.visible=false;
 const builds=group(0,0,0);function construction(x,z,y,type,parent=builds){let g=group(x,y,z,parent);
 if(type==='blok'){shape(cube,0xc18d5c,0,.56,0,2,1.12,2,0,0,0,g);for(let s of [-1,1])for(let d of [-1,1])shape(cube,wood,s*.9,.56,d*.9,.24,1.16,.24,0,0,0,g);shape(cube,cream,0,.56,1.01,2.1,.16,.09,0,.43,0,g)}
 else {lamp(0,0,0,g)}return g}
 function sync(s){bridgeGroups.forEach((gg,i)=>gg.forEach(g=>g.visible=s.stage>i));beaconBeam.visible=s.stage===3;builds.clear();s.builds.forEach(b=>construction(b.x,b.z,b.y,b.type));gates.forEach((o,i)=>o.g.visible=s.stage===2&&!s.rings.includes(i))}
 function ground(x,z,s,y=100){if(inside)return 0;let h=islands.some(i=>Math.hypot(x-i.x,z-i.z)<i.r-.35)?0:-100;
 if(Math.abs(x)<1.78 && ((s.stage>0 && z< -20&&z> -42)||(s.stage>1 && z< -80&&z> -100)))h=.19;
 return Math.max(h,solids.floor(x,z,s,y))}
 function blocked(x,z,s,y,r=.355,height=2.68){
  if(inside)return Math.abs(x-inside.x)>4.75-r||Math.abs(z)>4.73-r||Math.hypot(x-inside.npc.x,z-inside.npc.z)<r+.27||(Math.abs(x-inside.x-2.9)<1.29+r&&Math.abs(z+3.18)<.59+r);
  if(y<-.16&&y> -16&&islands.some(i=>Math.hypot(x-i.x,z-i.z)<i.r-.32))return true;
  return solids.blocked(x,z,s,y,r,height)
 }
 function animate(t,s,p,view,start,dt){rotors.forEach((v,i)=>v.rotation.z=t*(i?.48:.61));clouds.forEach(([g,y,k])=>g.position.y=y+Math.sin(t*k)*.52);falls.forEach(([f,y],i)=>f.position.y=y+.28*Math.sin(t*3+i));core.rotation.y=t;
  nodes.forEach(n=>{const was=n.g.visible;n.g.visible=!(s.harvest[n.i]>Date.now());if(was&&!n.g.visible&&!start&&life)life.burst(n.x,2.1,n.z,n.type==='hout'?0xffcf6a:0x9fe3ff);n.marker.rotation.y=t;n.marker.position.y=2.25+.17*Math.sin(t*2+n.i)});
  sail.visible=!start&&!!p.glide;const portrait=start?{x:0,y:0,z:13,heading:Math.PI+.32+.13*Math.sin(t*.37),on:true,speed:0,walk:0}:p;hero.pose(t,portrait,dt,view.yaw);
  shadow.position.set(portrait.x,Math.max(ground(portrait.x,portrait.z,s,portrait.y),-.6)+.082,portrait.z);
  let a=view.yaw,dist=view.dist,height=view.height;
  let target=start?new T.Vector3(cam.aspect<.85?-.48:-1.65,1.58,12.5):new T.Vector3(p.x,p.y+1.35,p.z);
  let eye=start?new T.Vector3(-1+.14*Math.sin(t*.22),1.95,17.5):new T.Vector3(p.x+Math.sin(a)*dist,p.y+height,p.z+Math.cos(a)*dist);
  if(inside){target.set(p.x,p.y+1.22,p.z);eye.set(inside.x+(p.x-inside.x)*.40,3.75,Math.min(6.55,p.z+4.25));inside.actor.root.rotation.y=Math.atan2(inside.npc.x-p.x,inside.npc.z-p.z);inside.actor.blend(idleLayers(t+3.7))}
  cam.position.lerp(eye,dt>=1?1:1-Math.exp(-dt*10));
  if(!start&&!inside){
   const offset=cam.position.clone().sub(target),distance=offset.length();offset.normalize();
   const near=canopies.filter(o=>Math.abs(o.x-target.x)<16&&Math.abs(o.z-target.z)<16);
   for(let d=.25;d<=distance;d+=.17){
    const sample=target.clone().addScaledVector(offset,d);
    if(blocked(sample.x,sample.z,s,sample.y-.10,.17,.22)||rotorDiscs.some(o=>Math.abs(sample.z-o.z)<.7&&Math.hypot(sample.x-o.x,sample.y-o.y)<o.r)||near.some(o=>{const k=(sample.y-o.y)/o.h;return k>.12&&k<1&&Math.hypot(sample.x-o.x,sample.z-o.z)<o.r*(1-k)+.25})){
     cam.position.copy(target).addScaledVector(offset,Math.max(.22,d-.24));break;
    }
   }
  }
  cam.lookAt(target);
  if(context){sun.position.set(portrait.x-36,portrait.y+34,portrait.z+22);sun.target.position.set(portrait.x,portrait.y,portrait.z)}
  else {const angle=Math.atan2(eye.x-target.x,eye.z-target.z);skyCanvas.style.backgroundPosition=(50+angle*100/Math.PI)+'% 62%'}
  if(life)life.update(t,target,cam,renderer.domElement.height);
  tune(dt);
  if(fx&&quality.level>0)fx.render(t);else renderer.render(scene,cam)
 }
 // Measures frame time and steps quality down on slow devices: bloom first, then grass and resolution.
 function tune(dt){if(quality.locked||!context||dt>=1)return;const now=performance.now();quality.since??=now;if(now-quality.since<6000)return;quality.frames++;quality.spent+=dt;if(quality.frames<90)return;
  const avg=quality.spent/quality.frames;quality.frames=quality.spent=0;
  if(avg>1/26&&quality.level>0){quality.level--;applyQuality()}}
 function applyQuality(){const q=quality.level;if(fx)fx.bloom=q>=2;meadow.forEach((m,i)=>m.visible=q>=2||i%2===0);
  renderer.setPixelRatio(Math.min(devicePixelRatio,q>=2?1.65:q===1?1.2:1));resize();
  if(context&&!fx){renderer.toneMapping=T.ACESFilmicToneMapping}else if(q===0){renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15}}
 function resize(){let w=canvas.clientWidth,h=canvas.clientHeight;renderer.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();if(fx){const r=renderer.getPixelRatio();fx.setSize(Math.round(w*r),Math.round(h*r))}}resize();
 return {burst:(x,y,z,c)=>life&&life.burst(x,y,z,c),rooms,enterRoom,outfit:hero.outfit,reach:hero.reach,ceiling:solids.ceiling,animate,resize,ground,blocked,sync,nodes,islands,gates,ports,construction,scene,cam}
}
