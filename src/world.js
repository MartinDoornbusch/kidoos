"use strict";
function createWorld(canvas) {
 const T=THREE, scene=new T.Scene(),cam=new T.PerspectiveCamera(53,1,.15,420);
 const options={antialias:true,alpha:true,powerPreference:'high-performance'};
 const context=canvas.getContext('webgl2',options)||canvas.getContext('webgl',options);
 const renderer=context?new T.WebGLRenderer({canvas,context,...options}):softwareRenderer(canvas);
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));renderer.outputColorSpace=T.SRGBColorSpace;
 scene.fog=new T.FogExp2(0x7f979e,.0037);
 // Aerial perspective: lit surfaces fade towards the colour of the sky behind them (a heavily blurred sample of the
 // environment map in the view direction), so distant islands sink into the haze instead of turning into flat
 // blue-grey cut-outs. The blur matters: a sharp sample painted the panorama's peaks and clouds onto distant rock,
 // which made mountains look see-through. Materials without the environment map keep the plain fog colour.
 T.ShaderChunk.fog_fragment=`#ifdef USE_FOG
 #ifdef FOG_EXP2
  float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
 #else
  float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
 #endif
 // cap the haze: an island 300 m away stays a solid silhouette instead of dissolving into the panorama behind it
 fogFactor = min( fogFactor, 0.52 );
 vec3 fogTint = fogColor;
 #if defined( STANDARD ) && defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
  vec3 fogDir = inverseTransformDirection( normalize( - vViewPosition ), viewMatrix );
  fogTint = mix( fogColor, textureCubeUV( envMap, fogDir, 0.92 ).rgb * envMapIntensity, 0.45 );
 #endif
 gl_FragColor.rgb = mix( gl_FragColor.rgb, fogTint, fogFactor );
#endif`;
 scene.add(new T.HemisphereLight(0xbfd6e4,0x3c4a2e,2.05));
 const sun=new T.DirectionalLight(0xffbb78,2.25);sun.position.set(-36,34,22);scene.add(sun);
 const turf=loadSurface('grass.jpg'),rockMap=loadSurface('rock.jpg'),timber=loadSurface('wood.jpg');
 const panorama=new T.TextureLoader().load('art/alpen.jpg');panorama.mapping=T.EquirectangularReflectionMapping;panorama.colorSpace=T.SRGBColorSpace;
 if(context){scene.background=panorama;scene.environment=panorama;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-25,right:25,top:25,bottom:-25,near:1,far:115});sun.shadow.camera.updateProjectionMatrix();sun.shadow.bias=-.0005;sun.shadow.normalBias=.045;scene.add(sun.target)}
 sun.intensity=3.4;scene.children.find(o=>o.isHemisphereLight).intensity=.9;
 // HDR post-processing when WebGL2 allows it; otherwise filmic tone mapping straight to the screen.
 const fx=context?createFX(renderer,scene,cam):null;
 if(context&&!fx){renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15}
 const quality={level:/[?&]hq/.test(location.search)?3:2,frames:0,spent:0,locked:/[?&]hq/.test(location.search)};
 const skyCanvas=document.getElementById('world');skyCanvas.style.backgroundImage="url('art/alpen.jpg')";skyCanvas.style.backgroundSize='auto 245%';skyCanvas.style.backgroundRepeat='repeat-x';
 const iso=new T.IcosahedronGeometry(1,1), ball=new T.SphereGeometry(1,24,14), cube=new T.BoxGeometry(), cyl=new T.CylinderGeometry(1,1,1,24),cone=new T.ConeGeometry(1,1,7), wheel=new T.TorusGeometry(1,.085,6,32);
 const mat=new T.MeshStandardMaterial({flatShading:false,roughness:.86}),mats=new Map(),batches=new Map();
 let seed=718;function rnd(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
 const torrents=[];const rotors=[],clouds=[],solids=createSolids(),falls=[],ports=[],islands=[{x:0,z:0,r:25,name:'Windhaven'},{x:0,z:-61,r:23,name:'Bloesemvallei'},{x:0,z:-120,r:24,name:'Sterrenwacht'}];
 // (1.22) every fir can be felled and every rock quarried. A fir's trunk and crown colliders are tagged with its id
 // (collision skips them while s.harvest says it is felled); rocks are listed with their size.
 let lastPine=null;const rocks=[];{const add=solids.add.bind(solids);solids.add=o=>{if(lastPine&&Math.abs(o.x-lastPine.x)<1e-6&&Math.abs(o.z-lastPine.z)<1e-6)o.harvest=lastPine.id;return add(o)}}
 const rockAt=(x,z,r)=>rocks.push({x,z,r,y:liftAt(x,z)});
 // Islands float at different heights: the Bloesemvallei above Windhaven, the Sterrenwacht higher still.
 // Everything placed on an island is raised with it; the bridges climb between them.
 const LIFT=[0,4,9];islands.forEach((I,k)=>{I.lift=LIFT[k];I.open=k});
 // Four more walkable islands, each at its own height and with its own trade.
 const extraIslands=[{x:-60,z:6,r:25,name:'Dennenhoek',lift:-3,open:0,kind:'forest',land:0x86b45f},{x:-58,z:-58,r:25,name:'Molenhoeve',lift:1,open:1,kind:'farm',land:0xa9cf7a},
  {x:56,z:-80,r:23,name:'Steengroeve',lift:8,open:1,kind:'quarry',land:0xa9b486},{x:55,z:-128,r:20,name:'Valkenrots',lift:13,open:2,kind:'peak',land:0x98c38a}];
 // Bridges run rim to rim; the deck climbs or descends evenly between the two island heights.
 const bridges=[];
 function span(A,B,stage,rope=false){const ex=B.x-A.x,ez=B.z-A.z,d=Math.hypot(ex,ez),dx=ex/d,dz=ez/d,a={x:A.x+dx*A.r,z:A.z+dz*A.r},b={x:B.x-dx*B.r,z:B.z-dz*B.r};
  bridges.push({ax:a.x,az:a.z,bx:b.x,bz:b.z,ya:A.lift,yb:B.lift,len:Math.hypot(b.x-a.x,b.z-a.z),dx,dz,hw:rope?1.1:1.8,stage,from:A,to:B,rope,sag:rope?Math.hypot(b.x-a.x,b.z-a.z)*.035:0})}
 span(islands[0],islands[1],1);span(islands[1],islands[2],2,true);
 span(islands[0],extraIslands[0],0,true);span(islands[1],extraIslands[1],0);span(islands[1],extraIslands[2],0);span(islands[2],extraIslands[3],0,true);
 const onBridge=(b,x,z,pad=0)=>{const t=(x-b.ax)*b.dx+(z-b.az)*b.dz;if(t<-pad||t>b.len+pad)return null;const u=Math.max(0,Math.min(1,t/b.len));return {t,v:Math.abs((x-b.ax)*b.dz-(z-b.az)*b.dx),y:b.ya+(b.yb-b.ya)*u-b.sag*Math.sin(Math.PI*u)}};
 function liftAt(x,z){if(x>300)return 0;
  for(const b of bridges){const o=onBridge(b,x,z);if(o&&o.v<b.hw+1.2)return o.y}
  for(const I of islands)if(Math.hypot(x-I.x,z-I.z)<I.r+4)return I.lift;return 0}
 // footpaths from each new bridge head to the main road, kept clear of trees, rocks and grass
 // approved building plots for the player's own house (level 4); reserved below before trees and rocks are scattered
 const housePlots=[{id:'dennenhoek-bosrand',name:'Dennenhoek, aan de bosrand',x:-55,z:20,width:11,depth:11,rotation:0},
  {id:'bloesemvallei-brugweide',name:'Bloesemvallei, op de weide bij de brug',x:2.5,z:-46.5,width:11,depth:11,rotation:0},
  {id:'sterrenwacht-sterrenveld',name:'Sterrenwacht, op het sterrenveld',x:-10.5,z:-109.5,width:11,depth:11,rotation:0}];
 const trails=[],nearTrail=(x,z,m)=>trails.some(([a,b,r])=>Math.hypot(x-a,z-b)<r+m),connectors=[];
 for(const b of bridges.slice(2)){const I=b.from,pts=[];let x=b.ax,z=b.az;const ux=(I.x-x),uz=(I.z-z),l=Math.hypot(ux,uz);
  // (1.22) the trail runs on under the main road, so it never ends in a strip of grass at the road's edge
  while(Math.abs(x)>1.0&&pts.length<42){pts.push([x,z]);trails.push([x,z,1.35]);x+=ux/l;z+=uz/l}pts.push([x,z]);connectors.push({pts,y:I.lift,k:I.z>-30?0:I.z>-90?1:2})}
 {const raw=solids.add;solids.add=o=>{const L=liftAt(o.x,o.z);raw(L?{...o,base:o.base+L,top:o.top+L}:o)}}
 let liftOff=false,rotOrder='XYZ';
 function group(x,y,z,p=scene){let g=new T.Group();g.position.set(x,y+(p===scene?liftAt(x,z):0),z);p.add(g);return g}
 function shape(geo,color,x,y,z,sx,sy,sz,ry=0,rz=0,rx=0,parent=null){
   if(parent){if(!mats.has(color))mats.set(color,new T.MeshStandardMaterial({color,flatShading:false,roughness:.8}));let o=new T.Mesh(geo,geo.userData.surface||(color===0x92583f?timberMat:mats.get(color)));o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.rotation.set(rx,ry,rz);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
   const obj=new T.Object3D();obj.position.set(x,y+(liftOff?0:liftAt(x,z)),z);obj.rotation.set(rx,ry,rz,rotOrder);obj.scale.set(sx,sy,sz);obj.updateMatrix();if(!batches.has(geo))batches.set(geo,[]);batches.get(geo).push([obj.matrix,color]);
 }
 const timberMat=new T.MeshStandardMaterial({map:timber,roughness:.91});
 const detailsMat=[timberMat,...['roof','wall','rock-grey'].map(name=>new T.MeshStandardMaterial({map:loadSurface(name+'.jpg'),roughness:.93}))];
 const dirtMap=loadSurface('paving.jpg');
 // Path surfaces per region (Poly Haven CC0 photo textures at 1K): cobbles in the village, a sandy grass track in the
 // valley, wood chips in the forest, a gravel road on the farm, rock grit at the quarry and on the peaks. Every strip
 // has two soft outer rows; a noise mask cuts them off, so the path frays into the grass instead of ending in a hard edge.
 const pathKinds={stone:['p_greystone',3.0,0xe8e4dc],chips:['p_woodchip',2.8,0xe2dacf],grass:['p_grass',3.6,0xf2ecdc],gravel:['p_gravelroad',2.4,0xdedad2],rocky:['p_rockygravel',2.2,0xd2ccc4],pale:['p_rockygravel',2.2,0xf4eee6]};
 const pathMats=new Map();let pathMask=null;
 function pathMat(kind){if(pathMats.has(kind))return pathMats.get(kind);let m;
  if(!scanReady)m=new T.MeshStandardMaterial({map:dirtMap,roughness:1,color:0xdfd5b9,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2});
  else{const [file,size,tint]=pathKinds[kind],rep=3.7/size,map=loadSurface(file+'.jpg'),nor=loadSurface(file+'_nor.jpg');nor.colorSpace=T.NoColorSpace;map.repeat.set(rep,rep);nor.repeat.set(rep,rep);
   if(!pathMask){pathMask=loadSurface('pathmask.png');pathMask.colorSpace=T.NoColorSpace;pathMask.repeat.set(1.7,1.7)}
   m=new T.MeshStandardMaterial({map,normalMap:nor,normalScale:new T.Vector2(.9,.9),alphaMap:pathMask,alphaTest:.5,vertexColors:true,roughness:.96,color:tint,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2});}
  pathMats.set(kind,m);return m}
 // A strip along line [[x,z,halfWidth],...] at height y: core rows at full strength, outer rows fade out (vertex alpha).
 function pathStrip(line,y,kind){const v=[],uv=[],col=[],f=[],n=line.length;
  for(let i=0;i<n;i++){const p0=line[Math.max(0,i-1)],p1=line[Math.min(n-1,i+1)];let tx=p1[0]-p0[0],tz=p1[1]-p0[1];const l=Math.hypot(tx,tz)||1;tx/=l;tz/=l;const w=line[i][2],fade=Math.min(.55,w*.45);
   for(const [o,a] of [[-(w+.32),0],[-(w-fade),1],[w-fade,1],[w+.32,0]]){const j=a?0:.2*Math.sin(i*2.3+o*3.1)+.1*Math.sin(i*.71+o),oo=o<0?o-j:o+j,xx=line[i][0]-tz*oo,zz=line[i][1]+tx*oo;
    v.push(xx,y,zz);uv.push(xx/3.7,zz/3.7);const e=a?1:.82;col.push(e,e,e*.9,a)}
   if(i){const b=(i-1)*4;for(let c=0;c<3;c++){const q=b+c;f.push(q,q+1,q+4,q+4,q+1,q+5)}}}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(col,4));g.setIndex(f);g.computeVertexNormals();
  const m=new T.Mesh(g,pathMat(kind));m.receiveShadow=true;scene.add(m);return m}
 const mainPathKind=['stone','grass','gravel'],lanePathKind=['gravel','grass','gravel'],islandPathKind={forest:'chips',farm:'gravel',quarry:'pale',peak:'rocky'};
 const roofGeo=cube.clone(),wallGeo=cube.clone(),stoneGeo=iso.clone(),hangGeo=new T.BufferGeometry(),gableGeo=new T.CylinderGeometry(1,1,1,3).rotateZ(-Math.PI/2).rotateX(-Math.PI/2);
 // boulders: a lumpy, faceted stone instead of a smooth ball
 {const q=stoneGeo.attributes.position;for(let i=0;i<q.count;i++){const x=q.getX(i),y=q.getY(i),z=q.getZ(i),k=1+.24*Math.sin(x*3.1+y*1.7)*Math.cos(z*2.9)+.13*Math.sin(y*5.3+x*4.1);q.setXYZ(i,x*k,y*k*.8,z*k)}stoneGeo.computeVertexNormals();hangGeo.copy(stoneGeo)}
 const bark=new T.MeshStandardMaterial({map:loadSurface("ridged-bark.jpg"),color:0xffffff,roughness:1});
 const cutEnd=new T.MeshStandardMaterial({map:loadSurface('sawn-rings.jpg'),roughness:1});
 const ore=new T.MeshStandardMaterial({map:rockMap,color:0xabb7b3,roughness:.88});
 const quarryRock=new T.MeshStandardMaterial({map:rockMap,vertexColors:true,roughness:.9});
 const barkPile=new T.MeshStandardMaterial({map:(()=>{const m=loadSurface('ridged-bark.jpg');m.repeat.set(2,1);return m})(),vertexColors:true,roughness:.95});cutEnd.color.set(0xc9ab8a);
 const woodenColors=new Set([0x92583f,0xbc8352,0xb88054,0xca9362,0x745344,0xc18d5c]);
 const stoneMeshes=[],hangMeshes=[],cragMeshes=[];
 // Level 3 watchtower: which parts show at which restoration stage (0-5)
 const towerProgress=s=>(s&&Array.isArray(s.constructionProjects)?s.constructionProjects.find(p=>p.id==='wachttoren')?.completed:0)||0;
 const towerShow={ruin:n=>n<3,rubble:n=>n<2,survey:n=>n>=1&&n<3,cleared:n=>n>=2&&n<4,restored:n=>n>=3,scaffold:n=>n>=3&&n<5,stairs:n=>n>=4,roof:n=>n>=5};
 const towerWhen=part=>s=>towerShow[part](towerProgress(s)),towerGroups={};let tower=null,towerFlag=null;
 // the woodcutters' stumps become a scanned tree stump with roots once it has loaded
 const stumpSpots=[];function dressStumps(){Models.load('stump').then(r=>stumpSpots.forEach(([x,y,z,a,b],k)=>{a.visible=b.visible=false;const m=new T.Mesh(r.geometry,r.material);m.position.set(x,y-.04,z);m.scale.setScalar(.88);m.rotation.y=k*2.4;m.castShadow=m.receiveShadow=true;scene.add(m)})).catch(e=>console.warn('stump',e))}
 // Scanned rocks replace the procedural stones once they have loaded. The original instanced mesh keeps
 // its place in the scene (bridges and landing pads toggle it), it takes a third of the stones itself and
 // carries the other two rock shapes as children, so they show and hide with it.
 function dressStones(meshes,names,shadow,tint,fit=1.1,mat=null){Promise.all(names.map(Models.load)).then(rocks=>{
  const fix=new T.Matrix4().makeScale(fit,fit,fit),M=new T.Matrix4(),white=new T.Color(1,1,1);
  for(const m of meshes){const sets=rocks.map(()=>[]);for(let j=0;j<m.count;j++){m.getMatrixAt(j,M);const c=new T.Color();if(m.instanceColor)m.getColorAt(j,c);else c.set(0xd2d0c9);sets[j%rocks.length].push([M.clone().multiply(fix),tint?c.set(tint):c.lerp(white,.08)])}
   rocks.forEach((r,k)=>{const list=sets[k];if(!list.length)return;let t=m;if(k){t=new T.InstancedMesh(r.geometry,mat||r.material,list.length);t.castShadow=shadow;t.receiveShadow=true;m.add(t)}else{m.geometry=r.geometry;m.material=mat||r.material;m.count=list.length}
    list.forEach(([q,c],j)=>{t.setMatrixAt(j,q);t.setColorAt(j,c)});t.instanceMatrix.needsUpdate=true;t.instanceColor.needsUpdate=true;t.computeBoundingSphere()})}
 }).catch(e=>console.warn('stones',e))}
 // Scanned props: placed once their model has loaded (shared geometry and textures per model).
 const scanReady=!!context&&typeof Models!=='undefined';
 function scanProp(name,x,y,z,ry=0,s=1,parent=null,fallback=null){const sc=Array.isArray(s)?s:[s,s,s];if(!scanReady){if(fallback)fallback();return null}
  const yy=parent?y:y+liftAt(x,z);return Models.load(name).then(r=>{const m=new T.Mesh(r.geometry,r.material);m.position.set(x,yy,z);m.rotation.y=ry;m.scale.set(sc[0],sc[1],sc[2]);m.castShadow=m.receiveShadow=true;(parent||scene).add(m);return m}).catch(e=>{console.warn('scan',name,e);if(fallback)fallback()})}
 // (1.23) The mountain outcrops are scanned rock faces (Rock Face 02) turned away from their peak and sunk into the
 // slope, so the flanks read as broken cliff bands instead of a pile of loose boulders; every third keeps a boulder scan.
 function dressCrags(){Promise.all(['crag_a','crag_b','rockface_mid'].map(Models.load)).then(([a,b,f])=>{a.material.color.setRGB(1.4,1.36,1.3);b.material.color.setRGB(1.4,1.36,1.3);const fm=f.material.clone();fm.color.setRGB(.95,.93,.9);fm.side=T.DoubleSide;return [a,b,f,fm]}).then(([a,b,f,fm])=>cragMeshes.forEach((m,k)=>{const c=m.userData.crag;
  if(c&&k%3!==2){const P=peaks.reduce((q,P)=>Math.hypot(c.x-P.x,c.z-P.z)<Math.hypot(c.x-q.x,c.z-q.z)?P:q,peaks[0]),dx=c.x-P.x,dz=c.z-P.z,s2=c.sc*.62;
   m.geometry=f.geometry;m.material=fm;m.scale.set(s2*(1.05+.1*Math.sin(k)),s2*(.8+c.sy/c.sc*.35),s2);m.position.y=c.L+c.lo-.45*s2;m.rotation.set(-.12+.08*Math.sin(k*2.3),Math.atan2(dx,dz)+.35*Math.sin(k*1.7),.06*Math.cos(k),'YXZ');return}
  const r=k%2?b:a;m.geometry=r.geometry;m.material=r.material;m.scale.multiplyScalar(1.08)})).catch(e=>console.warn('crags',e))}
 function flush(){
  for(const [geo,rows] of batches){
   const groups=[rows.filter(r=>!woodenColors.has(r[1])),rows.filter(r=>woodenColors.has(r[1]))];
   groups.forEach((items,i)=>{if(!items.length)return;const surface=geo===roofGeo?1:geo===wallGeo?2:geo===stoneGeo||geo===hangGeo?3:i?0:-1;const m=new T.InstancedMesh(geo,geo.userData.surface||(surface>=0?detailsMat[surface]:mat),items.length);
    items.forEach(([matrix,color],j)=>{m.setMatrixAt(j,matrix);m.setColorAt(j,new T.Color(surface===0?0xe9d6bd:surface===1?0xe4d1be:surface===2?0xf1e0c7:surface===3?0xd2d0c9:color))});m.castShadow=m.receiveShadow=true;scene.add(m);if(geo.userData.dress&&scanReady)dressStones([m],...geo.userData.dress);if(geo===stoneGeo)stoneMeshes.push(m);if(geo===hangGeo){m.castShadow=false;hangMeshes.push(m)}})
  }
  batches.clear()
 }
 // (1.23) Island cliffs. The scanned layered cliff (Poly Haven cliff_side) is projected from three sides in world space
 // (triplanar), so it never stretches over ledges or tapering rows, at two scales against visible tiling, with its normal
 // map blended the same way. Moss settles on the upward-facing ledges. Shared by every island underside and the
 // hanging masses, which also makes the scanned stones under the islands read as the same rock.
 let cliffMat=null;
 function triplanar(m,{scale=1/2.6,moss=.85,bounce=1.05,desat=.5}={}){m.onBeforeCompile=sh=>{sh.uniforms.tpScale={value:scale};sh.uniforms.tpMoss={value:moss};sh.uniforms.tpBounce={value:bounce};
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vTpPos;varying vec3 vTpNor;').replace('#include <project_vertex>',`#include <project_vertex>
   vec4 tpw=vec4(transformed,1.);vec3 tpn=objectNormal;
   #ifdef USE_INSTANCING
    tpw=instanceMatrix*tpw;tpn=mat3(instanceMatrix)*tpn;
   #endif
   vTpPos=(modelMatrix*tpw).xyz;vTpNor=normalize(mat3(modelMatrix)*tpn);`);
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vTpPos;varying vec3 vTpNor;uniform float tpScale,tpMoss,tpBounce;')
   .replace('#include <map_fragment>',`
   vec3 tpN=normalize(vTpNor+vec3(1e-5,2e-5,1e-5));vec3 tpB=pow(abs(tpN),vec3(4.))+1e-4;tpB/=tpB.x+tpB.y+tpB.z;vec3 tpP=vTpPos*tpScale;
   vec4 tpA=texture2D(map,tpP.zy)*tpB.x+texture2D(map,tpP.xz)*tpB.y+texture2D(map,tpP.xy)*tpB.z;
   vec3 tpQ=vTpPos*tpScale*.29+vec3(.37,.11,.53);
   vec4 tpC=texture2D(map,tpQ.zy)*tpB.x+texture2D(map,tpQ.xz)*tpB.y+texture2D(map,tpQ.xy)*tpB.z;
   vec4 tpCol=mix(tpA,tpC,.38);tpCol.rgb=mix(vec3(dot(tpCol.rgb,vec3(.3,.45,.25))),tpCol.rgb,${(1-desat).toFixed(2)});
   float tpL=dot(tpC.rgb,vec3(.33));
   float tpMossAmt=tpMoss*smoothstep(.42,.78,tpN.y+(tpL-.45)*.9);
   tpCol.rgb=mix(tpCol.rgb,vec3(.105,.14,.045)*(.55+1.6*dot(tpA.rgb,vec3(.33))),tpMossAmt);
   diffuseColor*=tpCol;`).replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n   totalEmissiveRadiance+=diffuseColor.rgb*vec3(.62,.58,.56)*tpBounce*smoothstep(.35,-.85,tpN.y);')
   .replace('#include <normal_fragment_maps>',m.normalMap?`
   {vec3 wN=normalize(vTpNor+vec3(1e-5,2e-5,1e-5));vec3 bl=pow(abs(wN),vec3(4.))+1e-4;bl/=bl.x+bl.y+bl.z;vec3 P=vTpPos*tpScale;
    vec3 nX=texture2D(normalMap,P.zy).xyz*2.-1.,nY=texture2D(normalMap,P.xz).xyz*2.-1.,nZ=texture2D(normalMap,P.xy).xyz*2.-1.;
    nX.xy*=normalScale;nY.xy*=normalScale;nZ.xy*=normalScale;
    nX=vec3(nX.xy+wN.zy,abs(nX.z)*wN.x);nY=vec3(nY.xy+wN.xz,abs(nY.z)*wN.y);nZ=vec3(nZ.xy+wN.xy,abs(nZ.z)*wN.z);
    vec3 wn=normalize(nX.zyx*bl.x+nY.xzy*bl.y+nZ.xyz*bl.z+wN*1e-3);
    normal=normalize((viewMatrix*vec4(wn,0.)).xyz);
    #ifdef DOUBLE_SIDED
     normal*=faceDirection;
    #endif
   }`:'#include <normal_fragment_maps>')};
  m.customProgramCacheKey=()=>'triplanar'+scale+moss+bounce+desat;return m}
 function cliffPhoto(){if(!context||typeof Models==='undefined')return null;if(!cliffMat){const map=Models.texture('cliff_diff.jpg',true),nor=Models.texture('cliff_nor.jpg');
  cliffMat=triplanar(new T.MeshStandardMaterial({vertexColors:true,map,normalMap:nor,normalScale:new T.Vector2(1.35,1.35),roughness:.93,side:T.DoubleSide}));cliffMat.color.setRGB(1.55,1.53,1.52)}return cliffMat}
 // (1.23) Turf: the grass photo at two scales against visible tiling, and large drier and lusher patches from a third,
 // very coarse sample, so a 25 m lawn is no longer one even green.
 let turfM=null;function turfMat(){if(turfM)return turfM;turfM=new T.MeshStandardMaterial({vertexColors:true,map:turf,roughness:1,side:T.DoubleSide});
  turfM.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <map_fragment>',`vec4 g1=texture2D(map,vMapUv),g2=texture2D(map,vMapUv*.27+vec2(.31,.17)),g3=texture2D(map,vMapUv*.061+vec2(.7,.2)),g4=texture2D(map,vMapUv*.017+vec2(.13,.58));
   float lush=smoothstep(.3,.7,dot(g3.rgb+g4.rgb,vec3(.33))*1.15-.12);vec4 gc=mix(g1,g2,.42);gc.rgb*=mix(vec3(1.1,1.05,.84),vec3(.94,1.06,.92),lush);diffuseColor*=gc;`)};
  turfM.customProgramCacheKey=()=>'turf123';return turfM}
 // Deterministic 3D value noise for the cliff shapes (no random numbers, so nothing placed later moves).
 const hash3=(x,y,z)=>{const n=Math.sin(x*127.1+y*311.7+z*74.7)*43758.5453;return n-Math.floor(n)};
 function vnoise(x,y,z){const xi=Math.floor(x),yi=Math.floor(y),zi=Math.floor(z),xf=x-xi,yf=y-yi,zf=z-zi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf),w=zf*zf*(3-2*zf),L=(a,b,t)=>a+(b-a)*t,c=(i,j,k)=>hash3(xi+i,yi+j,zi+k);
  return L(L(L(c(0,0,0),c(1,0,0),u),L(c(0,1,0),c(1,1,0),u),v),L(L(c(0,0,1),c(1,0,1),u),L(c(0,1,1),c(1,1,1),u),v),w)*2-1}
 const fbm3=(x,y,z)=>vnoise(x,y,z)*.55+vnoise(x*2.03+5.2,y*2.03,z*2.03)*.28+vnoise(x*4.1,y*4.1+1.7,z*4.1)*.17;
 // Rounded grass lip, smooth cliff with soil band and rock, tapering to a point. The walkable top stays flat.
 function island(x,z,r,land,depth=15,h=0){
  for(let i=0;i<684;i++)rnd(); // keeps every later random placement exactly where it was
  const N=96,s=(Math.abs(x*13.7+z*7.1)%97),rim=a=>1+.013*Math.sin(a*9)+.008*Math.sin(a*17);
  const n=(a,y)=>.55*Math.sin(a*3+s)+.3*Math.sin(a*7+y*.35+s*1.7)+.15*Math.sin(a*13-y*.6+s*2.3);
  const top=[],topC=[],topUv=[],topIdx=[],cliff=[],cliffC=[],cliffUv=[],cliffIdx=[],c=new T.Color(),grassTint=new T.Color(land).lerp(new T.Color(0x9cc07c),.6);
  top.push(x,h,z);c.copy(grassTint);topC.push(c.r,c.g,c.b);topUv.push(0,0);
  const fr=[.3,.6,.85,1,1.012,1.022];
  for(let ring=0;ring<fr.length;ring++)for(let i=0;i<=N;i++){const a=i/N*Math.PI*2,rad=r*fr[ring]*(ring>=3?rim(a):1),y=ring===4?-.13:ring===5?-.4:0;
   const px=x+Math.cos(a)*rad,pz=z+Math.sin(a)*rad;top.push(px,h+y,pz);c.copy(grassTint).multiplyScalar(ring>=4?.78-(ring-4)*.12:.93+.07*Math.sin(a*5+s));topC.push(c.r,c.g,c.b);topUv.push((px-x)/6,(pz-z)/6)}
  for(let i=0;i<N;i++)topIdx.push(0,1+i+1,1+i);
  for(let ring=0;ring<fr.length-1;ring++)for(let i=0;i<N;i++){const a=1+ring*(N+1)+i,b=a+N+1;topIdx.push(a,a+1,b,a+1,b+1,b)}
  // (1.23) underside: a thin soil band under the turf, then a tall weathered rock wall that steps in at ledges of
  // overhanging strata and tapers in spurs to a ragged tip. Shaped by 3D noise in world metres (so neighbouring rows
  // and islands never repeat), with vertical gullies; the triplanar rock material does the rest.
  const far=Math.hypot(x,z)>100,NC=Math.round(Math.min(far?64:144,Math.max(48,r*5.6))),K=far?20:r>=14?34:r>=8?24:18,D=depth*1.22,band=[0x4a3c2c,0x948f86,0x9c978e,0x77736c],sp=3+Math.floor(s%3),ph=s*.37;
  for(let k=0;k<K;k++){const t=k/(K-1),y=-.3-Math.pow(t,1.12)*(D-.3);
   const base=t<.3?1.018-.075*(t/.3):t<.68?.943-.45*Math.pow((t-.3)/.38,1.15):Math.max(.02,.493*Math.pow(1-(t-.68)/.32,1.55));
   const amp=t<.03?.004:t<.12?.03+.4*(t-.03):t<.6?.07:.07+.2*(t-.6)/.4;
   for(let i=0;i<=NC;i++){const a=i/NC*Math.PI*2,ca=Math.cos(a),sa=Math.sin(a),wx=x+ca*r,wz=z+sa*r;
    const nz=fbm3(wx/6.5,(h+y)/4.2,wz/6.5),big=fbm3(ca*1.4+s,t*1.8,sa*1.4),gul=Math.pow(Math.abs(Math.sin(a*r*.52+nz*2.4)),10)*(t<.06?0:.06);
    const f=(t*(6.5+1.5*big)+.25*nz+.13*Math.sin(k*1.7+s))%1,ledge=t<.04||t>.9?0:(f<.2?-.055*(f/.2):-.055*(1-(f-.2)/.8))*(.6+.8*Math.abs(nz));
    const spur=t>.45?Math.pow(Math.max(0,Math.cos(a*sp+ph+big*1.2)),3)*Math.min(1,(t-.45)/.3):0;
    const rad=r*(base*(t<.05?rim(a):1)*(1+(t>.08?.13*big+.35*spur*(t-.45):0))+ledge*Math.min(1,base*1.4))*(1+amp*nz)-r*gul*base;
    const px=x+ca*rad,py=h+y+(t>.05?nz*.45:0)-spur*D*.22*Math.max(0,t-.45),pz=z+sa*rad;cliff.push(px,py,pz);
    const bi=t<.035?0:t<.35?1:t<.75?2:3;c.set(band[bi]).lerp(new T.Color(band[Math.min(3,bi+1)]),.5+.5*nz).multiplyScalar(1-t*.22);cliffC.push(c.r,c.g,c.b);cliffUv.push(a*r/4,py/4)}}
  for(let k=0;k<K-1;k++)for(let i=0;i<NC;i++){const a=k*(NC+1)+i,b=a+NC+1;cliffIdx.push(a,a+1,b,a+1,b+1,b)}
  for(const [points,tints,uv,index,map] of [[top,topC,topUv,topIdx,turf],[cliff,cliffC,cliffUv,cliffIdx,rockMap]]){
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(points,3));g.setAttribute('color',new T.Float32BufferAttribute(tints,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(index);g.computeVertexNormals();
   const rock=map===rockMap,m=new T.Mesh(g,rock&&cliffPhoto()||(!rock&&turfMat())||new T.MeshStandardMaterial({vertexColors:true,map,roughness:1,flatShading:rock,side:T.DoubleSide}));m.receiveShadow=map===turf;m.castShadow=rock;scene.add(m)
  }
  // hanging rocks under the island and roots dangling from the soil band (own random stream, absolute heights)
  let q=Math.floor(s*1000)+7;const R=()=>(q=(q*16807)%2147483647)/2147483647;liftOff=true;
  for(let i=0,n2=Math.round(r*1.1);i<n2;i++){const a=R()*6.283,t=.12+R()*.7,rr=Math.max(.05,(1-Math.pow(t,1.35))*.9),yy=-1-t*(depth*1.22-1),sz=.45+R()*Math.min(1.5,r*.075);
   shape(hangGeo,0xffffff,x+Math.cos(a)*r*rr*.88,h+yy-sz*.4,z+Math.sin(a)*r*rr*.88,sz,sz*(1.3+R()*.8),sz,a,R()*.3,R()*.3)}
  // 1.22 (PR #16): two to four big hanging masses away from the centre give every island its own silhouette instead
  // of one central tip, roots dangle from the soil band, and a few loose rocks float beside the big islands (away from
  // the bridges and well below the walking level). Same per-island random stream, appended, so nothing else moves.
  if(r>=6){const big=r>=18?3+Math.round(R()):2;for(let i=0;i<big;i++){const a=R()*6.283,t=.22+R()*.33,rr=Math.max(.12,(1-Math.pow(t,1.35))*.6),yy=-1-t*(depth*1.22-1),sz=r*(.1+R()*.05);
    shape(hangGeo,0xffffff,x+Math.cos(a)*r*rr,h+yy-sz*.9,z+Math.sin(a)*r*rr,sz,sz*(2.1+R()*.9),sz*(.85+R()*.3),a,R()*.25,R()*.25);
    shape(hangGeo,0xffffff,x+Math.cos(a)*r*rr*1.03,h+yy-sz*2.7,z+Math.sin(a)*r*rr*1.03,sz*.42,sz*1.35,sz*.42,a*2,R()*.3,0)}}
  for(let i=0,nr=Math.round(r*.9);i<nr;i++){const a=R()*6.283,len=.8+R()*1.9,w=.022+R()*.02,rx=x+Math.cos(a)*r*1.005,rz=z+Math.sin(a)*r*1.005;cord(rx,h-.3,rz,rx+Math.cos(a)*.3,h-.3-len,rz+Math.sin(a)*.3,w,0x4a3a2c)}
  if(r>=18)for(let i=0;i<3;i++){const a=R()*6.283,d=r+4+R()*6,sz=.6+R()*1.0,px=x+Math.cos(a)*d,pz=z+Math.sin(a)*d,py=h-5-R()*6,ra=R(),rb=R();
   if(bridges.some(b=>{const o=onBridge(b,px,pz,4);return o&&o.v<7}))continue;
   shape(hangGeo,0xffffff,px,py,pz,sz*1.2,sz*1.7,sz,a,ra,rb);shape(hangGeo,0xffffff,px,py-sz*1.4,pz,sz*.5,sz*1.1,sz*.5,a,0,0);
   solids.add({x:px,z:pz,r:sz*1.1,base:py-sz*2.2,top:py+sz*1.6})}
  liftOff=false;
 }
 const plantCards=new Map();
 function foliage(name){if(plantCards.has(name))return plantCards.get(name);
  const geo=new T.PlaneGeometry(1,1);geo.translate(0,.5,0);
  const surface=new T.MeshLambertMaterial({map:loadSurface(name+'.png'),side:T.DoubleSide,alphaTest:.38,transparent:false});
  geo.userData.surface=surface;plantCards.set(name,geo);return geo}
 // Real 3D trees and flower tufts; one instanced draw per species.
 const firs=[1,2,3].map(i=>{const g=Nature.firGeometry(i);g.userData.surface=Nature.treeMaterial;return g});
 const blossoms=[1,2].map(i=>{const g=Nature.blossomGeometry(i);g.userData.surface=Nature.blossomMaterial;return g});
 const tufts=[[0x7f55c9,1],[0xf6f1e4,0],[0x9a6ad8,1],[0xf0c22c,0],[0xd977b0,1],[0xf6f1e4,0]].map(([c,spike],i)=>{const g=Nature.tuftGeometry(i+3,c,!!spike);g.userData.surface=Nature.plantMaterial;return g});
 const pick=(list,x,z)=>list[Math.abs(Math.round(x*7.3+z*3.1))%list.length];
 const shade=(x,z,a,b)=>new T.Color(a).lerp(new T.Color(b),.5+.5*Math.sin(x*1.3+z*.7)).getHex();
 function grove(name,x,z,h,y,width){shape(pick(tufts,x,z),0xffffff,x,y,z,width*.75,h*.95,width*.75,(x+z)*2.4)}
 function patch(){}
 const canopies=[];
 // Pines: the leaf-card trees are built as before and hidden once the scanned firs have loaded (see plantFirs).
 const pines=[],pineTrunk=cyl.clone(),FIR=1.3;
 function pine(x,z,h,y=0){const L=y+liftAt(x,z);canopies.push({x,z,y:L,h:h*FIR,r:h*FIR*.3});const v=Math.abs(Math.round(x*3+z*7))%3;pines.push({x,y:L,z,h,v,ry:(x+z)*2.4});lastPine={x,z,id:'t'+(pines.length-1)};shape(pineTrunk,0x4a382b,x,y+h*.14,z,h*.032,h*.3,h*.032);shape(conifers[v],[0x5a9152,0x4f8549,0x66995a][v],x,y,z,h*.74,h,h*.74,(x+z)*2.4)}
 // Blossom tree: a dark trunk with two limbs and a crown of petal clusters around a soft core.
 // Deciduous trees (1.21.1, audit PR #10): a tapered bark trunk that forks into four or five limbs, each with a side
 // branch, and a crown of leaf or blossom clusters at the branch ends: wider than tall, open in places and different
 // for every tree (a hash of its position, so the shared random sequence is untouched).
 const barkTrunk=new T.CylinderGeometry(.72,1,1,9);barkTrunk.userData={surface:bark};
 function limbTree(x,z,h,tones,spread,cluster){
  const hs=k=>{const v=Math.sin((x*12.9898+z*78.233)+k*37.719)*43758.5453;return v-Math.floor(v)};
  const L=liftAt(x,z),fork=h*(.33+hs(1)*.08),n=4+(hs(4)>.45?1:0),ends=[];
  shape(barkTrunk,0x7a6152,x,fork/2+.04,z,.19,fork+.12,.19,hs(3)*6,(hs(2)-.5)*.1);
  liftOff=true;
  for(let i=0;i<n;i++){const a=i/n*6.283+hs(10+i)*1.2,len=h*(.26+hs(20+i)*.16)*spread,up=h*(.2+hs(30+i)*.2),ex=x+Math.cos(a)*len,ez=z+Math.sin(a)*len,ey=L+fork+up;
   cord(x,L+fork-.08,z,ex,ey,ez,.085-.008*i,0x6b5446,barkTrunk);
   const mx=x+(ex-x)*.55,mz=z+(ez-z)*.55,my=L+fork+up*.55,b=a+(hs(40+i)>.5?1:-1)*(.5+hs(50+i)*.6),bl=len*.5,bx=mx+Math.cos(b)*bl,bz=mz+Math.sin(b)*bl,by=my+h*(.08+hs(60+i)*.1);
   cord(mx,my,mz,bx,by,bz,.045,0x6b5446,barkTrunk);ends.push([ex,ey-L,ez,1,a],[bx,by-L,bz,.75,b])}
  liftOff=false;
  ends.forEach(([ex,ey,ez,k,a],i)=>{const s0=h*cluster*k*(.85+hs(70+i)*.35);
   shape(bushGeo,tones[i%tones.length],ex,ey-s0*.15,ez,s0,s0*.86,s0,a*2);
   const ox=Math.cos(a)*s0*.6,oz=Math.sin(a)*s0*.6;shape(bushGeo,tones[(i+1)%tones.length],ex+ox,ey+s0*.18,ez+oz,s0*.72,s0*.7,s0*.72,a*3);
   // (1.23) a darker inner cluster under each crown, so from the side a tree has volume instead of a thin parasol of cards
   shape(bushGeo,new T.Color(tones[(i+2)%tones.length]).multiplyScalar(.72).getHex(),ex-ox*.6,ey-s0*.55,ez-oz*.6,s0*.8,s0*.62,s0*.8,a*5)});
  shape(bushGeo,tones[0],x+(hs(90)-.5)*h*.1,fork+h*.42,z+(hs(91)-.5)*h*.1,h*cluster*.9,h*cluster*.6,h*cluster*.9,hs(92)*6);
  return ends}
 function cherry(x,z,h){lastPine=null;canopies.push({x,z,y:h*.45+liftAt(x,z),h:h*.6,r:h*.5});
  limbTree(x,z,h,[0xf4bccb,0xf8d3de,0xeaa7bc,0xfbe4ea],1.08,.16);for(let i=0;i<6;i++)rnd()}
 const wood=0x92583f,dark=0x3f4441,cream=0xdfcda6,teal=0x526558,red=0x925c40;
 function surfaced(geometry,file) {
  geometry.userData={};geometry.userData.surface=new T.MeshStandardMaterial({map:loadSurface(file+'.jpg'),roughness:.96});
  return geometry
 }
 const frontPanel=surfaced(new T.PlaneGeometry(),'front'),sidePanel=surfaced(new T.PlaneGeometry(),'side');
 const masonry=surfaced(cube.clone(),'masonry'),slate=surfaced(cube.clone(),'slate');
 // (1.23) Masonry was a 203 x 290 px photo stretched once over every block, plinth and tower. Now the 1K dressed-stone
 // scan, projected in world metres from three sides: a 5 m plinth and a 40 cm post show stones of the same size.
 const stoneTri=scanReady?triplanar(new T.MeshStandardMaterial({map:Models.texture('wallslate_diff.jpg',true),normalMap:Models.texture('wallslate_nor.jpg'),normalScale:new T.Vector2(1.2,1.2),roughness:.92}),{scale:1/2.2,moss:0,bounce:0,desat:.1}):null;
 if(stoneTri)masonry.userData.surface=stoneTri;
 const rope=new T.CylinderGeometry(1,1,1,7),iron=0x39372e;
 function cord(x1,y1,z1,x2,y2,z2,r,color,geo=rope){
  const dx=x2-x1,dy=y2-y1,dz=z2-z1,len=Math.hypot(dx,dy,dz);
  const direction=new T.Vector3(dx,dy,dz).normalize(),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),direction);
  const e=new T.Euler().setFromQuaternion(q,rotOrder);
  shape(geo,color,(x1+x2)/2,(y1+y2)/2,(z1+z2)/2,r,len,r,e.y,e.z,e.x)
 }
 // ---- Architecture -------------------------------------------------------
 // Houses are assembled from real parts: plinth, plastered walls, a half-timbered frame in relief,
 // deep window frames with warm light, shutters, flower boxes, doors, an overhanging tiled roof and a smoking chimney.
 const chimneys=[],rotorDiscs=[];
 function plasterTexture(){const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');
  g.fillStyle='#d6c8ad';g.fillRect(0,0,256,256);let s=91;const r=()=>(s=(s*16807)%2147483647)/2147483647;
  for(let i=0;i<2600;i++){const v=200+r()*55|0;g.fillStyle=`rgba(${v},${v-14|0},${v-34|0},${.05+r()*.08})`;const w=2+r()*14;g.fillRect(r()*256,r()*256,w,w*(.4+r()))}
  for(let i=0;i<22;i++){g.fillStyle=`rgba(96,82,60,${.05+r()*.06})`;g.beginPath();g.ellipse(r()*256,r()*256,10+r()*40,6+r()*26,r()*3,0,7);g.fill()}
  const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.anisotropy=4;return tex}
 const withSurface=(geo,material)=>{geo.userData={surface:material};return geo};
 const plasterMap=plasterTexture(),oakMap=loadSurface('wood.jpg'),tileMap=loadSurface('roof.jpg');tileMap.repeat.set(2.2,1.6);
 // Since 1.21 (house audit PR #9): walls of lime plaster and beams of weathered oak, both with a normal map. Their
 // texture coordinates come from the part's real size (taken from the instance or model scale), so a 5 m wall and a
 // 30 cm post show plaster and wood grain at the same scale, and the grain always runs along a beam's length.
 function metric(m,uSize,vSize,grain){m.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <uv_vertex>',`#include <uv_vertex>
  {vec3 sc;
  #ifdef USE_INSTANCING
   sc=vec3(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz),length(instanceMatrix[2].xyz));
  #else
   sc=vec3(length(modelMatrix[0].xyz),length(modelMatrix[1].xyz),length(modelMatrix[2].xyz));
  #endif
  vec3 lp=position*sc,an=abs(normal);vec2 g;
  ${grain?`float al,ac;if(sc.x>=sc.y&&sc.x>=sc.z){al=lp.x;ac=an.y>.5?lp.z:lp.y;}else if(sc.y>=sc.z){al=lp.y;ac=an.x>.5?lp.z:lp.x;}else{al=lp.z;ac=an.x>.5?lp.y:lp.x;}g=vec2(ac,al);`
   :`g=an.x>.5?lp.zy:an.y>.5?lp.xz:lp.xy;`}
  g/=vec2(${uSize.toFixed(3)},${vSize.toFixed(3)});
  #ifdef USE_MAP
   vMapUv=g;
  #endif
  #ifdef USE_NORMALMAP
   vNormalMapUv=g;
  #endif
  }`)};m.customProgramCacheKey=()=>'metric'+uSize+vSize+grain;return m}
 const metricMap=(file,nor)=>{const t=loadSurface(file);if(nor)t.colorSpace=T.NoColorSpace;return t};
 const plasterBox=withSurface(cube.clone(),metric(new T.MeshStandardMaterial({map:metricMap('plaster_lime.jpg'),normalMap:metricMap('plaster_lime_nor.jpg',true),normalScale:new T.Vector2(.7,.7),roughness:.95}),2.6,2.6,false));
 const beam=withSurface(cube.clone(),metric(new T.MeshStandardMaterial({map:metricMap('timber_oak.jpg'),normalMap:metricMap('timber_oak_nor.jpg',true),normalScale:new T.Vector2(1.1,1.1),roughness:.84}),.32,1.9,true));
 const tiles=withSurface(cube.clone(),new T.MeshStandardMaterial({map:tileMap,roughness:.88}));
 // scanned clay roof tiles (Poly Haven clay_roof_tiles_02) with relief: rows run down the slope
 if(context&&typeof Models!=='undefined'){const m=tiles.userData.surface,map=Models.texture('rooftiles_diff.jpg',true),nor=Models.texture('rooftiles_nor.jpg');
  for(const t of [map,nor]){t.center.set(.5,.5);t.rotation=Math.PI/2;t.repeat.set(2.6,3.4)}m.map=map;m.normalMap=nor;m.normalScale.set(1.2,1.2);m.color.set(0xf2e2d4);m.roughness=.8}
 // rubble stone (Poly Haven wall texture with relief) for house plinths and the stone workshops, also in metres
 const stoneWall=withSurface(cube.clone(),scanReady&&typeof Models!=='undefined'?metric(new T.MeshStandardMaterial({map:Models.texture('wallslate_diff.jpg',true),normalMap:Models.texture('wallslate_nor.jpg'),normalScale:new T.Vector2(1.3,1.3),roughness:.92}),2.2,2.2,false):masonry.userData.surface);
 const glass=withSurface(cube.clone(),new T.MeshStandardMaterial({color:0x2a2522,emissive:0xffb25c,emissiveIntensity:1.5,roughness:.2,metalness:.1}));
 const ember=withSurface(cube.clone(),new T.MeshStandardMaterial({color:0x2b140a,emissive:0xff6a1f,emissiveIntensity:3.2,roughness:.6}));
 const planks=withSurface(cube.clone(),new T.MeshStandardMaterial({map:loadSurface('board.jpg'),roughness:.9}));
 const blossom=withSurface(new T.IcosahedronGeometry(1,1),new T.MeshStandardMaterial({roughness:.7}));
 // Real plants for window boxes, hedges and planters: folded leaves on arching stems and flower heads
 // with cupped petals, instead of beads.
 const plantRand=(()=>{let q=97;return ()=>(q=(q*16807)%2147483647)/2147483647})();
 function leafSet(pos,idx,ox,oy,oz,a,tilt,L,W){const ca=Math.cos(a),sa=Math.sin(a),ct=Math.cos(tilt),st=Math.sin(tilt);
  const pt=(u,v,lift)=>{const d=u*L,rad=d*ct;return [ox+ca*rad-sa*v,oy+d*st+lift-u*u*L*.3,oz+sa*rad+ca*v]};const b=pos.length/3;
  for(const p of [pt(0,0,0),pt(.42,-W/2,.015),pt(1,0,0),pt(.42,W/2,.015),pt(.42,0,-.01)])pos.push(...p);idx.push(b,b+1,b+4,b+1,b+2,b+4,b+2,b+3,b+4,b+3,b,b+4)}
 function plantGeo(fill,mat){const pos=[],idx=[];fill(pos,idx);const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();g.userData.surface=mat;return g}
 const plantHeads=[[-.07,.2,.02],[.06,.24,-.03],[.0,.28,.05],[.09,.19,.06],[-.05,.23,-.06],[.03,.21,.09]];
 const leafGeo=plantGeo((pos,idx)=>{for(let i=0;i<22;i++){const a=i*2.4+plantRand()*.5,up=i<8?.08:0;leafSet(pos,idx,Math.cos(a)*.03,up,Math.sin(a)*.03,a,.15+plantRand()*.85,.13+plantRand()*.07,.12)}
   for(const [hx,hy,hz] of plantHeads){const b=pos.length/3;pos.push(hx*.3-.006,0,hz*.3,hx*.3+.006,0,hz*.3,hx+.006,hy,hz,hx-.006,hy,hz);idx.push(b,b+1,b+2,b,b+2,b+3)}},
  new T.MeshStandardMaterial({color:0xffffff,side:T.DoubleSide,roughness:.75}));
 // potted herbs and dried herb bundles: thin stems with small paired leaves
 const herbGeo=plantGeo((pos,idx)=>{for(let i=0;i<7;i++){const a=i*2.4+plantRand(),r0=.012+plantRand()*.03,h=.11+plantRand()*.12,lean=.2+plantRand()*.3,bx=Math.cos(a)*r0,bz=Math.sin(a)*r0,tx=bx+Math.cos(a)*h*lean,tz=bz+Math.sin(a)*h*lean,b=pos.length/3;
   pos.push(bx-.003,0,bz,bx+.003,0,bz,tx+.003,h,tz,tx-.003,h,tz);idx.push(b,b+1,b+2,b,b+2,b+3);
   for(let k=1;k<=5;k++){const f=k/5.5;for(const sd of [0,Math.PI])leafSet(pos,idx,bx+(tx-bx)*f,h*f,bz+(tz-bz)*f,a+sd+k*.9,.35,.034+.012*(1-f),.022)}}},new T.MeshStandardMaterial({color:0xffffff,side:T.DoubleSide,roughness:.8}));
 const herbBundleGeo=plantGeo((pos,idx)=>{for(let i=0;i<14;i++){const a=i*2.4+plantRand(),sp=.03+plantRand()*.05,h=.28+plantRand()*.12,bx=Math.cos(a)*.008,bz=Math.sin(a)*.008,tx=Math.cos(a)*sp*2.4,tz=Math.sin(a)*sp*2.4,b=pos.length/3;
   pos.push(bx-.003,0,bz,bx+.003,0,bz,tx+.003,-h,tz,tx-.003,-h,tz);idx.push(b,b+1,b+2,b,b+2,b+3);
   for(let k=2;k<=6;k++){const f=k/6.5;leafSet(pos,idx,bx+(tx-bx)*f,-h*f,bz+(tz-bz)*f,a+k*1.3,-.9,.05,.025)}}},new T.MeshStandardMaterial({color:0xffffff,side:T.DoubleSide,roughness:.9}));
 // apples on the trees: a sphere stand-in, dressed with the scanned apple (Poly Haven food_apple_01, reduced) once loaded
 const herbMats=[0x5d8f4c,0x6b9a52,0x4f7d32,0x7c9a4a].map(color=>new T.MeshStandardMaterial({color,side:T.DoubleSide,roughness:.8})),driedMats=[0x7a8a4a,0x8f8a56,0x6a7a40,0x8a7a4a].map(color=>new T.MeshStandardMaterial({color,side:T.DoubleSide,roughness:.9}));
 const appleGeo=ball.clone();appleGeo.userData={dress:[['sf_apple'],true,0xffffff,1]};
 const flowerGeo=plantGeo((pos,idx)=>{for(const [hx,hy,hz] of plantHeads)for(let f=0;f<3;f++){const fx=hx+(f-1)*.022,fz=hz+(f%2)*.02,fy=hy+(f===1?.012:0);for(let k=0;k<5;k++){const a=k*1.2566+f;leafSet(pos,idx,fx,fy,fz,a,.35,.05,.042)}}},
  new T.MeshStandardMaterial({color:0xffffff,side:T.DoubleSide,roughness:.6}));
 const conifers=[0,1,2].map(v=>{const pos=[],idx=[],col=[];
  const blade=(ox,oy,oz,a,tilt,L,W,sh)=>{leafSet(pos,idx,ox,oy,oz,a,tilt,L,W);for(const c of [.45,.82,1,.82,.6])col.push(c*sh,c*sh,c*sh)};
  const tiers=8+v;for(let i=0;i<tiers;i++){const f=i/tiers,y=.17+f*.77,rad=.52*(1-f)**.85+.05,n=7+((i+v)%3);
   for(let k=0;k<n;k++){const a=k/n*6.283+i*1.1+v,j=Math.sin(a*5+i*3);blade(Math.cos(a)*.015,y,Math.sin(a)*.015,a,-.32-.25*(1-f)+j*.1,rad*(.85+.25*j),rad*.3,.82+.18*Math.sin(i*1.7));blade(Math.cos(a+.3)*.015,y-.05,Math.sin(a+.3)*.015,a+.3,-.58,rad*.68,rad*.22,.6)}}
  for(const a of [0,2.1,4.2])blade(0,.92,0,a,1.35,.1,.04,.9);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();
  g.userData.surface=new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,side:T.DoubleSide,roughness:.9});return g});
 const bushGeo=plantGeo((pos,idx)=>{for(let i=0;i<110;i++){const a=plantRand()*6.283,el=Math.asin(plantRand()*1.1-.15),r=.92,x=Math.cos(a)*Math.cos(el)*r,y=.15+Math.sin(el)*r*.85,z=Math.sin(a)*Math.cos(el)*r;leafSet(pos,idx,x*.82,y,z*.82,a,el+.35,.34,.24)}},
  new T.MeshStandardMaterial({color:0xffffff,side:T.DoubleSide,roughness:.8}));
 const ridge=withSurface(new T.CylinderGeometry(1,1,1,10),new T.MeshStandardMaterial({map:tileMap,roughness:.9}));
 // a flat plaster panel (x/y outline, both faces), for gable and lean-to infills
 function infill(pts){const pos=[],uv=[],idx=[];pts.forEach(([x,y])=>{pos.push(x,y,0);uv.push(x/4,y/4)});for(let i=1;i<pts.length-1;i++)idx.push(0,i,i+1,0,i+1,i);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();g.userData={surface:plasterBox.userData.surface};return g}
 function gableGeometry(w,rise){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([-w/2,0,0,w/2,0,0,0,rise,0],3));
  g.setAttribute('uv',new T.Float32BufferAttribute([0,0,w/4,0,w/8,rise/4],2));g.computeVertexNormals();g.userData={surface:plasterBox.userData.surface};return g}
 // Places parts in a frame turned by ry: local x runs along a facade, local z points outward.
 function frame(x,y,z,ry){const c=Math.cos(ry),s=Math.sin(ry);
  const P=(geo,color,lx,ly,lz,sx,sy,sz,rz=0,rx=0)=>shape(geo,color,x+lx*c+lz*s,y+ly,z-lx*s+lz*c,sx,sy,sz,ry,rz,rx);P.at={x,y,z,ry,c,s};return P}
 // Doors are hinged leaves that swing inward when someone comes close.
 const doors=[],leafMat=new Map();
 function hingedDoor(parent,hx,hy,hz,ry,w,h,color){
  if(!leafMat.has(color))leafMat.set(color,new T.MeshStandardMaterial({map:loadSurface('board.jpg'),color,roughness:.85}));
  const pivot=new T.Group();pivot.position.set(hx,hy+(parent===scene?liftAt(hx,hz):0),hz);pivot.rotation.y=ry;parent.add(pivot);
  const leaf=new T.Mesh(cube,leafMat.get(color));leaf.scale.set(w,h,.08);leaf.position.set(w/2,h/2,0);leaf.castShadow=leaf.receiveShadow=true;pivot.add(leaf);
  for(const yy of [.22,.78]){const band=new T.Mesh(cube,mats.get(0x2a2622)||new T.MeshStandardMaterial({color:0x2a2622,roughness:.6}));band.scale.set(w*.86,.06,.1);band.position.set(w*.47,h*yy,0);pivot.add(band)}
  const knob=new T.Mesh(ball,new T.MeshStandardMaterial({color:0xb69765,metalness:.8,roughness:.35}));knob.scale.setScalar(.05);knob.position.set(w-.16,h*.47,.07);pivot.add(knob);
  const d={pivot,ry,open:0,x:hx+Math.cos(ry)*w/2,z:hz-Math.sin(ry)*w/2,parent};doors.push(d);return d}
 const oak=0x664a33,paint=[0x3f6b63,0x7c3b2c,0x45603a];
 // window frames: the scanned six-pane frame (glass removed) is dressed onto an invisible stand-in once loaded
 const winFrame=new T.BufferGeometry();for(const [k,n] of [['position',3],['normal',3],['uv',2]])winFrame.setAttribute(k,new T.Float32BufferAttribute(new Array(3*n).fill(0),n));
 winFrame.userData={dress:[['sf_window'],true,0xf0e6da,1],surface:new T.MeshBasicMaterial({visible:false})};
 function windowAt(P,lx,y,out,w,h,shutter,flowers=true){
  P(glass,0xffffff,lx,y,out+.015,w,h,.04);
  if(scanReady)P(winFrame,0xffffff,lx,y,out+.06,w+.2,h+.2,.12);
  else{for(const sx of [-1,1])P(beam,oak,lx+sx*(w/2+.045),y,out+.06,.09,h+.18,.12);
  for(const sy of [-1,1])P(beam,oak,lx,y+sy*(h/2+.045),out+.06,w+.18,.09,.12);
  P(beam,oak,lx,y,out+.05,.045,h,.05);P(beam,oak,lx,y+h*.12,out+.05,w,.045,.05)}
  P(planks,0xd8c3a2,lx,y-h/2-.11,out+.11,w+.34,.07,.22);
  for(const sx of [-1,1]){P(planks,shutter,lx+sx*(w/2+.27),y,out+.17,.4,h+.1,.04);P(beam,0x2a2a28,lx+sx*(w/2+.27),y+h*.25,out+.2,.32,.03,.02)}
  if(!flowers)return;
  P(planks,0x7a5536,lx,y-h/2-.25,out+.2,w+.18,.2,.24);
  const tones=[0xe2475b,0xf6c443,0xf4f0f2,0xd45a9b,0xe2475b];
  const nP=w>.75?3:2;for(let i=0;i<nP;i++){const fx=lx-w/2+(i+.5)*w/nP,sc=(w/nP)*2.6*(i%2?.92:1),fl=i%2?-1:1;P(leafGeo,0x4f7d32,fx,y-h/2-.16,out+.2,sc*fl,sc,sc);P(flowerGeo,tones[(i+Math.round(lx*3+y*5))%5&4?(i+2)%5:(i+Math.abs(Math.round(lx*3)))%5],fx,y-h/2-.16,out+.2,sc*fl,sc,sc)}}
 // Doorways are sized for the people: 1.25 wide and 2.95 high.
 function doorAt(P,lx,y0,out,color){
  const {x,z,ry,c,s}=P.at,W=1.25,H=2.95,hx=lx-W/2;
  P(cube,0x1d1712,lx,y0+H/2,out+.012,W,H,.02);P(glass,0xffffff,lx,y0+H*.55,out+.016,W*.7,H*.5,.01);
  hingedDoor(scene,x+hx*c+(out+.06)*s,y0,z-hx*s+(out+.06)*c,ry,W,H,color).out=true;
  for(const sx of [-1,1])P(beam,oak,lx+sx*(W/2+.07),y0+H/2+.05,out+.07,.14,H+.1,.15);
  P(beam,oak,lx,y0+H+.1,out+.08,W+.42,.18,.17);
  P(masonry,0xcfc1a8,lx,.12,out+.42,W+.5,.24,.8)}
 // Half-timbered facade: corner posts, rails at sill and plate height, St Andrew's crosses under the windows.
 // Since 1.21 the frame is heavy oak in relief: posts and rails 22 to 24 cm wide that stand about 15 cm proud of the
 // plaster, like the timber of the scanned forester's house.
 function halfTimber(P,half,out,y0,hgt,openings){
  const sill=y0+hgt*.32,plate=y0+hgt-.1;
  for(const lx of [-half+.1,half-.1])P(beam,oak,lx,y0+hgt/2,out+.06,.24,hgt,.2);
  P(beam,oak,0,y0+.1,out+.06,half*2+.1,.22,.2);P(beam,oak,0,plate,out+.06,half*2+.1,.22,.2);P(beam,oak,0,sill,out+.055,half*2,.17,.18);
  const edges=[-half+.1,...openings.flatMap(([c,w])=>[c-w/2-.08,c+w/2+.08]),half-.1].sort((a,b)=>a-b);
  for(let i=0;i<edges.length-1;i+=2){const a=edges[i],b=edges[i+1],span=b-a;if(span<.45)continue;
   const mid=(a+b)/2,low=y0+.1,high=sill,len=Math.hypot(span,high-low),ang=Math.atan2(high-low,span);
   for(const s of [-1,1])P(beam,oak,mid,(low+high)/2,out+.05,len,.15,.15,s*ang);
   if(span>1.5)P(beam,oak,mid,(sill+plate)/2,out+.055,.18,plate-sill,.17)}
  for(const [c,w,full] of openings)if(!full)for(const sx of [-1,1])P(beam,oak,c+sx*(w/2+.2),(sill+plate)/2,out+.055,.17,plate-sill,.17)}
 // Since 1.21 a tiled roof is laid in overlapping courses: each row of tiles rests on the one below, so eaves and
 // verges show the stepped edge of a real tile roof. One mesh per roof face, textured in metres.
 const courseMats=new Map();
 function courseMaterial(color){if(courseMats.has(color))return courseMats.get(color);let m;
  if(!scanReady)m=tiles.userData.surface;
  else{const [map,nor]=[Models.texture('rooftiles_diff.jpg',true).clone(),Models.texture('rooftiles_nor.jpg').clone()];for(const t of [map,nor]){t.center.set(0,0);t.rotation=0;t.repeat.set(1,1);t.wrapS=t.wrapT=T.RepeatWrapping;t.needsUpdate=true}
   m=new T.MeshStandardMaterial({map,normalMap:nor,normalScale:new T.Vector2(1.2,1.2),color:color===0xffffff?0xf2e2d4:color,roughness:.8,side:T.DoubleSide})}
  courseMats.set(color,m);return m}
 function tileCourses(L,D,c=.36,t=.09,lift=.075){const v=[],uv=[],U=6.2,V=3.9,n=Math.ceil(L/c);
  const quad=(p,u)=>{for(const i of [0,1,2,0,2,3]){v.push(...p[i]);uv.push(...u[i])}};
  for(let k=0;k<n;k++){const s0=k*c,s1=Math.min(L,(k+1)*c),h1=t+lift*(s1-s0)/c,low=k<n-1?t:0;
   quad([[s0,t,-D/2],[s0,t,D/2],[s1,h1,D/2],[s1,h1,-D/2]],[[-D/2/U,s0/V],[D/2/U,s0/V],[D/2/U,s1/V],[-D/2/U,s1/V]]);
   quad([[s1,h1,-D/2],[s1,h1,D/2],[s1,low,D/2],[s1,low,-D/2]],[[-D/2/U,s1/V],[D/2/U,s1/V],[D/2/U,s1/V+.02],[-D/2/U,s1/V+.02]]);
   for(const e of [-1,1])quad([[s0,0,e*D/2],[s1,0,e*D/2],[s1,h1,e*D/2],[s0,t,e*D/2]],[[s0/V,0],[s1/V,0],[s1/V,h1/V],[s0/V,t/V]])}
  quad([[0,0,-D/2],[L,0,-D/2],[L,0,D/2],[0,0,D/2]],[[0,0],[L/V,0],[L/V,D/U],[0,D/U]]);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();return g}
 function roof(x,z,w,d,yTop,rise,mat,color,over=.5){
  const a=Math.atan2(rise,w/2),slope=Math.hypot(w/2,rise),t=.18,courses=mat===tiles&&scanReady;
  for(const side of [-1,1]){const cx=x+side*w/4,cy=yTop+rise/2,ux=side*Math.cos(a),uy=-Math.sin(a),nx=side*Math.sin(a),ny=Math.cos(a);
   if(courses){const m=new T.Mesh(tileCourses(slope+over,d+.9),courseMaterial(color));m.position.set(x+nx*.02,yTop+rise+ny*.02+(liftOff?0:liftAt(x,z)),z);m.rotation.z=-side*a;m.scale.x=side;m.castShadow=m.receiveShadow=true;scene.add(m)}
   else shape(mat,color,cx+ux*over/2+nx*(t/2+.02),cy+uy*over/2+ny*(t/2+.02),z,slope+over,t,d+.9,0,-side*a);
   shape(beam,oak,cx+ux*over/2+nx*.02,cy+uy*over/2-.06,z,slope+over,.12,d+.6,0,-side*a)}
  shape(ridge,0xc98a64,x,yTop+rise+.12,z,.13,d+.95,.13,0,0,Math.PI/2)}
 function gables(x,z,w,d,yTop,rise,attic=true){const g=gableGeometry(w,rise);
  for(const end of [-1,1]){const P=frame(x,yTop,z+end*d/2,end>0?0:Math.PI);
   shape(g,0xf2e6d0,x,yTop,z+end*d/2,1,1,1,end>0?0:Math.PI);
   P(beam,oak,0,rise*.42,.04,.15,rise*.84,.13);P(beam,oak,0,rise*.4,.04,w*.58,.13,.13);
   for(const s of [-1,1]){P(beam,oak,s*w/4,rise/2-.03,.06,Math.hypot(w/2,rise)+.5,.16,.16,s*Math.atan2(rise,w/2)*-1);P(beam,oak,s*(w/4+.08),rise/2-.16,.44,Math.hypot(w/2,rise)+.62,.26,.1,s*Math.atan2(rise,w/2)*-1)}
   if(attic){P(glass,0xffffff,0,rise*.62,.03,.42,.42,.04);P(wheel,oak,0,rise*.62,.07,.3,.3,.4)}}}
 function chimney(x,z,yTop,rise){const h=rise+1.1;shape(masonry,0xd9c9ae,x,yTop+h/2,z,.62,h,.62);shape(masonry,0xa89886,x,yTop+h+.08,z,.8,.16,.8);chimneys.push([x,yTop+h+.25+liftAt(x,z),z])}
 // upper=true (1.21) adds a jettied half-timbered upper floor that overhangs front and back, on joists.
 function hut(x,z,w,variant=0,upper=false){
  const d=w*.86,y0=.48,hgt=w*.74,yTop=y0+hgt,rise=w*.47,colors=paint[variant%3],H2=upper?2.55:0,J=upper?.38:0,yR=yTop+H2;
  shape(stoneWall,0xd9d2c6,x,y0/2,z,w+.34,y0,d+.34);shape(stoneWall,0xc9c0b2,x,y0-.03,z,w+.46,.08,d+.46);
  shape(plasterBox,variant?0xf3e4cc:0xffffff,x,yTop/2+y0/2,z,w,hgt,d);
  // front: door with a window either side
  let P=frame(x,0,z+d/2,0);halfTimber(P,w/2,0,y0,hgt,[[0,1.6,true],[-w*.33,.95],[w*.33,.95]]);doorAt(P,0,y0,0,0x6e4a30);
  for(const s of [-1,1])windowAt(P,s*w*.33,y0+hgt*.55,0,.78,.96,colors);
  wallLantern(x+1.12,y0+2.75,z+d/2+.32,0,1);
  // sides and back
  for(const side of [-1,1]){P=frame(x+side*w/2,0,z,side*Math.PI/2);halfTimber(P,d/2,0,y0,hgt,[[side*-.45,.95]]);windowAt(P,side*-.45,y0+hgt*.6,0,.7,.78,colors,side>0)}
  P=frame(x,0,z-d/2,Math.PI);halfTimber(P,w/2,0,y0,hgt,[[0,.95]]);windowAt(P,0,y0+hgt*.6,0,.78,.86,colors,false);
  if(upper){const dd=d+2*J;
   // bressummer and joist ends carrying the overhang
   shape(beam,oak,x,yTop+.1,z,w+.3,.22,dd+.12);for(const e of [-1,1])for(let i=0;i<7;i++)shape(beam,oak,x-w/2+.35+i*(w-.7)/6,yTop-.07,z+e*(d/2+J/2),.15,.15,J+.14);
   shape(plasterBox,variant?0xf3e4cc:0xffffff,x,yTop+.21+(H2-.21)/2,z,w,H2-.21,dd);
   let Q=frame(x,0,z+dd/2,0);halfTimber(Q,w/2,0,yTop+.21,H2-.21,[[-w*.27,.8],[w*.27,.8]]);for(const s2 of [-1,1])windowAt(Q,s2*w*.27,yTop+H2*.56,0,.7,.84,colors,true);
   Q=frame(x,0,z-dd/2,Math.PI);halfTimber(Q,w/2,0,yTop+.21,H2-.21,[[0,.8]]);windowAt(Q,0,yTop+H2*.56,0,.7,.84,colors,false);
   for(const side of [-1,1]){Q=frame(x+side*w/2,0,z,side*Math.PI/2);halfTimber(Q,dd/2,0,yTop+.21,H2-.21,[[0,.8]]);windowAt(Q,0,yTop+H2*.56,0,.66,.78,colors,false)}}
  gables(x,z,w,d+2*J,yR,rise);roof(x,z,w,d+2*J,yR,rise,tiles,0xffffff);chimney(x+w*.24,z-d*.18,yR,rise);
  // garden details: barrel, bench, bushes along the front
  if(scanReady){scanProp('wine_barrel',x-w*.52,0,z+d*.5+.45,x*.7,1.02);scanProp('settle',x+w*.33,0,z+d/2+.42,0,1)}
  else{shape(cyl,0x7a5232,x-w*.52,.42,z+d*.5+.45,.32,.84,.32);for(const yy of [.18,.66])shape(cyl,0x3b3a36,x-w*.52,yy,z+d*.5+.45,.335,.05,.335);
  shape(planks,0xb08d67,x+w*.33,.46,z+d/2+.55,1.2,.08,.36);for(const s of [-1,1])shape(beam,oak,x+w*.33+s*.5,.22,z+d/2+.55,.08,.44,.3)}
  for(const s of [-1,1])for(let i=0;i<3;i++)shape(pick(tufts,x+s*i,z),0xffffff,x+s*(w*.18+i*.42),0,z+d/2+.3,.55,.5,.55,i+s);
  solids.add({x:x-w*.52,z:z+d*.5+.45,r:.36,base:0,top:.86});solids.add({x:x+w*.33,z:z+d/2+.55,w:.62,d:.2,base:0,top:.5});
  solids.add({x,z,w:w*.53,d:w*.46,base:0,top:yR+rise})
 }
 // Stone smithy with a glowing forge, and a timber carpentry shed with a lean-to and lumber.
 function workshop(x,z,w,stone){
  const d=w*.87,h=stone?3.45:3.55,front=z+d*.5,rise=stone?1.25:1.7;
  if(stone){const tone=x>30?0xf4ecdc:0xc8c0b6;shape(stoneWall,tone,x,h/2,z,w,h,d);for(const sx of [-1,1])for(const sz of [-1,1])for(let k=0;k<6;k++)shape(stoneWall,tone,x+sx*(w/2-.12+(k%2?.06:0)),.3+k*.55,z+sz*(d/2-.12+(k%2?0:.06)),.42+(k%2?.18:0),.34,.42+(k%2?0:.18));
   let P=frame(x,0,front,0);
   doorAt(P,-.22*w,0,0,0x5d3f2a);
   // (1.23) only the smithy (Mara, x<30) has a forge in its front wall: a dark firebox with glowing coals at the bottom
   // and the anvil before it; the stonemason (Joost) gets a framed window instead of a second forge
   if(x<30){P(cube,0x120a06,.26*w,1.0,.01,.95,.7,.06);P(ember,0xffffff,.26*w,.74,.04,.9,.2,.06);P(masonry,0x8c7f72,.26*w,1.42,.12,1.25,.16,.3);P(masonry,0x8c7f72,.26*w,.58,.12,1.25,.16,.3);for(const s of [-1,1])P(masonry,0x8c7f72,.26*w+s*.56,1.0,.12,.16,.95,.3);
   P(cube,0x3a3a3c,.05*w,.42,1.25,.7,.22,.32);P(cube,0x2c2c2e,.05*w,.2,1.25,.32,.4,.26);P(cone,0x3a3a3c,.05*w+.48,.45,1.25,.12,.32,.12,Math.PI/2)}
   else windowAt(P,.26*w,1.75,0,.8,.9,0x5a4a3c,true);
   P(cyl,0x6b4a30,-.48*w,.42,.75,.34,.84,.34);solids.add({x:x-.48*w,z:front+.75,r:.36,base:0,top:.86});solids.add({x:x+.05*w+.1,z:front+1.25,w:.5,d:.2,base:0,top:.55});
   for(const side of [-1,1]){P=frame(x+side*w/2,0,z,side*Math.PI/2);windowAt(P,0,1.75,0,.7,.82,0x5a4a3c,false)}
   gables(x,z,w,d,h,rise,false);roof(x,z,w,d,h,rise,slate,0xbcb2a6,.42);
   shape(masonry,0xc4ad90,x+.3*w,h/2+1.3,z-.2*d,1.05,h+2.6,1.05);shape(masonry,0x9a8a7a,x+.3*w,h+2.68,z-.2*d,1.25,.2,1.25);chimneys.push([x+.3*w,h+2.9,z-.2*d],[x+.3*w,h+3.2,z-.2*d]);
  }else{
   shape(planks,0xc6a47c,x,h/2,z,w,h,d);shape(stoneWall,0xd9d2c6,x,.2,z,w+.3,.4,d+.3);
   for(const sx of [-1,1])for(const sz of [-1,1])shape(beam,oak,x+sx*(w/2-.05),h/2,z+sz*(d/2-.05),.2,h,.2);
   for(const sz of [-1,1])shape(beam,oak,x,h-.08,z+sz*(d/2+.02),w+.1,.16,.12);
   let P=frame(x,0,front,0);doorAt(P,-.22*w,0,0,0x7d5636);windowAt(P,.24*w,1.85,0,.8,.9,0x3f6b63);
   for(const side of [-1,1]){P=frame(x+side*w/2,0,z,side*Math.PI/2);windowAt(P,0,1.9,0,.7,.8,0x3f6b63,false)}
   gables(x,z,w,d,h,rise,true);roof(x,z,w,d,h,rise,tiles,0xd9b89c,.5);
   // lean-to with stacked timber on the left
   const lx=x-w/2-1.05;for(const sz of [-1,1]){shape(beam,oak,lx-.95,1.05,z+sz*(d/2-.2),.14,2.1,.14);solids.add({x:lx-.95,z:z+sz*(d/2-.2),r:.12,base:0,top:2.1})}solids.add({x:lx-.15,z,w:.75,d:d*.4,base:0,top:1.05});
   shape(planks,0x9c7a58,lx-.1,2.15,z,2.1,.08,d+.2,0,-.22);
   for(let i=0;i<9;i++){const row=Math.floor(i/3),col=i%3;shape(cyl,0x8a6a4a,lx-.55+col*.34+row*.17,.18+row*.3,z,.16,d*.7,.16,0,0,Math.PI/2)}
   for(let i=0;i<5;i++)shape(planks,0xd9b98f,lx-.4,1.02+i*.07,z+.2,1.1,.05,d*.8,.1*i);
   shape(beam,oak,x,h+rise+.55,front+.35,.16,.16,1.3,0,0,Math.PI/2);shape(wheel,iron,x,h+rise+.35,front+.95,.16,.16,.16);
   cord(x,h+rise+.3,front+.95,x,2.6,front+.95,.02,0x8a7350);shape(wheel,iron,x,2.5,front+.95,.09,.09,.09,Math.PI/2);
   shape(beam,oak,x+.32*w,.55,front+.75,1.1,.12,.18);solids.add({x:x+.32*w,z:front+.75,w:.58,d:.2,base:0,top:.6});for(const s of [-1,1])shape(beam,oak,x+.32*w+s*.42,.28,front+.75,.08,.56,.32,0,s*.25);
  }
  solids.add({x,z,w:w*.52,d:d*.51,base:0,top:h+rise});
 }
 // Trading post: a house with a striped awning, a painted sign and goods outside.
 function canvasTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'));const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t}
 function tradingPost(x,z){
  hut(x,z,5.2,2);const d=5.2*.86,front=z+d/2,yA=3.55;
  const stripes=canvasTex(256,64,g=>{for(let i=0;i<16;i++){g.fillStyle=i%2?'#efe2c4':'#a8432f';g.fillRect(i*16,0,16,64)}g.fillStyle='rgba(0,0,0,.18)';g.fillRect(0,52,256,12)});
  const awning=new T.Mesh(new T.PlaneGeometry(5.8,1.7,1,1),new T.MeshStandardMaterial({map:stripes,side:T.DoubleSide,roughness:.95}));
  awning.position.set(x,yA-.35,front+.8);awning.rotation.x=-Math.PI/2+.42;awning.castShadow=awning.receiveShadow=true;scene.add(awning);
  for(const s of [-1,1]){shape(beam,oak,x+s*2.8,1.55,front+1.55,.14,3.1,.14);solids.add({x:x+s*2.8,z:front+1.55,r:.12,base:0,top:3.1})}
  shape(beam,oak,x,3.05,front+1.55,5.8,.14,.14);
  const sign=canvasTex(512,128,g=>{g.fillStyle='#5a3b22';g.fillRect(0,0,512,128);g.strokeStyle='#c8a25a';g.lineWidth=8;g.strokeRect(8,8,496,112);g.fillStyle='#f0d690';g.font='bold 58px Georgia, serif';g.textAlign='center';g.textBaseline='middle';g.fillText('HANDELSPOST',256,68)});
  const board=new T.Mesh(cube,[0,1,2,3,4,5].map(i=>i===4||i===5?new T.MeshStandardMaterial({map:sign,roughness:.8}):new T.MeshStandardMaterial({color:0x5a3b22,roughness:.8})));
  board.scale.set(2.4,.6,.06);board.position.set(x,4.95,front+.1);board.castShadow=true;scene.add(board);
  const fruit=createGoods();for(let i=0;i<3;i++){const cz=front+.75+i*.62;shape(cube,0x8a6a48,x-2.05,.12,cz,.66,.24,.54);fruit.crate(scene,x-2.05,.24,cz,i===2?'pear':'apple',i,.62,.5)}
  solids.add({x:x-2.05,z:front+1.37,w:.36,d:.95,base:0,top:.6});
  // (1.25) the two barrels by the stall are the scanned oak barrel (Poly Haven Wine Barrel 01), like everywhere else
  for(const [bx,bz,ry] of [[x+2.1,front+.9,.4],[x+2.15,front+1.6,2.3]]){if(scanReady)scanProp('wine_barrel',bx,0,bz,ry,.98);else{shape(cyl,0x7a5232,bx,.42,bz,.3,.84,.3);for(const yy of [.18,.66])shape(cyl,0x3b3a36,bx,yy,bz,.315,.05,.315)}solids.add({x:bx,z:bz,r:.33,base:0,top:.86})}
  fruit.sack(scene,x+1.2,0,front+1.9,.75);fruit.sack(scene,x+1.7,0,front+1.85,.68);
 }
 // ---- Trade signs (1.22, house audit PR #9): every resident's house shows its trade. A wrought-iron bracket with a
 // brace sticks out of the wall and the painted board hangs from two short chains, readable from both sides.
 const SIGN_ICON={
  kaart:g=>{g.translate(128,62);for(let i=0;i<8;i++){g.rotate(Math.PI/4);g.fillStyle=i%2?'#c9a25a':'#f0d690';g.beginPath();g.moveTo(0,-(i%2?24:40));g.lineTo(6,0);g.lineTo(-6,0);g.fill()}g.strokeStyle='#f0d690';g.lineWidth=3;g.beginPath();g.arc(0,0,30,0,7);g.stroke()},
  zaag:g=>{g.fillStyle='#cfd4d6';g.beginPath();g.moveTo(70,46);g.lineTo(186,46);g.lineTo(186,62);g.lineTo(86,74);g.closePath();g.fill();g.fillStyle='#7a5230';for(let i=0;i<12;i++){g.beginPath();g.moveTo(88+i*8,74-i*.9);g.lineTo(92+i*8,80-i*.9);g.lineTo(96+i*8,73-i*.9);g.fill()}g.fillStyle='#a8743e';g.fillRect(186,38,28,32);g.fillStyle='#5a3b22';g.fillRect(194,46,12,16)},
  smid:g=>{g.fillStyle='#2d2d30';g.beginPath();g.moveTo(66,52);g.lineTo(190,52);g.quadraticCurveTo(170,70,150,72);g.lineTo(150,88);g.lineTo(168,98);g.lineTo(88,98);g.lineTo(106,88);g.lineTo(106,72);g.quadraticCurveTo(80,68,66,52);g.fill();g.fillStyle='#a8743e';g.save();g.translate(150,34);g.rotate(-.5);g.fillRect(-4,0,8,44);g.fillStyle='#55585c';g.fillRect(-16,-8,32,14);g.restore()},
  plant:g=>{g.strokeStyle='#7db45a';g.lineWidth=6;g.beginPath();g.moveTo(128,100);g.lineTo(128,40);g.stroke();g.fillStyle='#8cc46a';for(const [x,y,r] of [[108,60,-.6],[148,52,.6],[110,82,-.5],[146,76,.5]]){g.save();g.translate(x,y);g.rotate(r);g.beginPath();g.ellipse(0,0,18,8,0,0,7);g.fill();g.restore()}g.fillStyle='#e2475b';g.beginPath();g.arc(128,34,11,0,7);g.fill();g.fillStyle='#8a5a34';g.fillRect(106,96,44,14)},
  boer:g=>{g.strokeStyle='#e6c35c';g.lineWidth=4;for(let i=-3;i<=3;i++){g.beginPath();g.moveTo(128,104);g.quadraticCurveTo(128+i*4,70,128+i*12,30);g.stroke();g.fillStyle='#f0d27a';g.beginPath();g.ellipse(128+i*12,30,5,11,i*.25,0,7);g.fill()}g.fillStyle='#8a5a34';g.fillRect(114,70,28,7)},
  steen:g=>{g.fillStyle='#d9d2c4';g.fillRect(70,58,72,44);g.fillStyle='#bfb6a6';g.fillRect(70,58,72,10);g.save();g.translate(176,46);g.rotate(.7);g.fillStyle='#a8743e';g.fillRect(-5,-6,10,40);g.fillStyle='#9aa0a4';g.fillRect(-4,-36,8,32);g.restore()},
  bijl:g=>{g.save();g.translate(128,64);g.rotate(-.6);g.fillStyle='#a8743e';g.fillRect(-5,-44,10,92);g.fillStyle='#b8bdc0';g.beginPath();g.moveTo(5,-44);g.lineTo(40,-52);g.quadraticCurveTo(48,-30,40,-8);g.lineTo(5,-20);g.fill();g.restore()}};
 const signFaces=new Map();
 function signFace(label,icon){const k=label+icon;if(signFaces.has(k))return signFaces.get(k);
  const m=new T.MeshStandardMaterial({roughness:.8,map:canvasTex(256,160,g=>{g.fillStyle='#4e331e';g.fillRect(0,0,256,160);g.globalAlpha=.18;for(let i=0;i<14;i++){g.fillStyle=i%2?'#2a1a0e':'#7a5232';g.fillRect(0,i*12+((i*7)%5),256,3)}g.globalAlpha=1;
   g.strokeStyle='#c8a25a';g.lineWidth=6;g.strokeRect(7,7,242,146);g.save();SIGN_ICON[icon](g);g.restore();g.fillStyle='#f0d690';g.font='bold 25px Georgia, serif';g.textAlign='center';g.textBaseline='middle';g.fillText(label,128,134)})});
  signFaces.set(k,m);return m}
 function tradeSign(x,y,z,ry,label,icon){const g=group(x,y,z);g.rotation.y=ry;const ironM=mats.get(0x2a2622)||new T.MeshStandardMaterial({color:0x2a2622,roughness:.5,metalness:.6});
  const part=(geo,m,px,py,pz,sx,sy,sz,rx=0)=>{const o=new T.Mesh(geo,m);o.position.set(px,py,pz);o.scale.set(sx,sy,sz);o.rotation.x=rx;o.castShadow=true;g.add(o);return o};
  part(cube,ironM,0,.5,.6,.05,.05,1.2);part(cube,ironM,0,.18,.32,.04,.04,.82,-.83);part(cube,ironM,0,.5,.02,.16,.24,.06);part(ball,ironM,0,.5,1.22,.05,.05,.05);
  for(const dz of [.32,.88])part(rope,ironM,0,.36,dz,.012,.28,.012);
  const face=signFace(label,icon),edge=new T.MeshStandardMaterial({color:0x3a2616,roughness:.8});
  const board=new T.Mesh(cube,[face,face,edge,edge,edge,edge]);board.position.set(0,-.05,.6);board.scale.set(.05,.56,.9);board.castShadow=true;g.add(board);return g}
 // Two-storey manor: stone ground floor, a jettied half-timbered upper floor, a side wing and a porch.
 function manor(x,z){
  const w=8.5,d=6.4,y0=.5,h1=3.9,h2=3.4,yTop=y0+h1+h2,rise=3.3,front=z+d/2,tone=0x5a4a6a;
  shape(stoneWall,0xd2cabd,x,y0/2,z,w+.3,y0,d+.3);shape(stoneWall,0xeee4d4,x,y0+h1/2,z,w,h1,d);
  shape(plasterBox,0xfff4e0,x,y0+h1+h2/2,z,w+.3,h2,d+.3);shape(beam,oak,x,y0+h1+.06,z,w+.42,.2,d+.42);
  let P=frame(x,0,front,0);doorAt(P,0,y0,0,0x4a3428);
  for(const s of [-1,1])for(const lx of [1.9,3.3])windowAt(P,s*lx,y0+2.1,0,.8,1.2,tone,true);
  P=frame(x,0,front+.15,0);halfTimber(P,w/2+.15,0,y0+h1,h2,[[-2.6,1.05],[0,1.05],[2.6,1.05]]);
  for(const lx of [-2.6,0,2.6])windowAt(P,lx,y0+h1+h2*.52,0,.85,1.1,tone,lx!==0);
  for(const s of [-1,1]){shape(column,0xefe6d2,x+s*1.2,y0,front+1.25,1,1.15,1);solids.add({x:x+s*1.2,z:front+1.25,r:.2,base:0,top:3.3})}
  shape(slate,0x8a8278,x,y0+3.4,front+.8,3.1,.14,1.75,0,0,-.2);shape(masonry,0xcfc1a8,x,y0-.12,front+.9,3.0,.24,1.6);
  for(const side of [-1,1]){P=frame(x+side*w/2,0,z,side*Math.PI/2);windowAt(P,0,y0+2.1,0,.8,1.1,tone,false);
   P=frame(x+side*(w/2+.15),0,z,side*Math.PI/2);halfTimber(P,d/2+.15,0,y0+h1,h2,[[0,1.05]]);windowAt(P,0,y0+h1+h2*.52,0,.8,1.0,tone,false)}
  P=frame(x,0,z-d/2,Math.PI);for(const lx of [-2.6,0,2.6])windowAt(P,lx,y0+2.1,0,.8,1.1,tone,false);
  gables(x,z,w+.3,d+.3,yTop,rise);roof(x,z,w+.3,d+.3,yTop,rise,tiles,0xffffff,.6);chimney(x-w*.3,z+.4,yTop,rise);chimney(x+w*.28,z-d*.22,yTop,rise);
  // side wing with a lean-to roof
  const wx=x+w/2+1.75,ww=3.3,wd=4.6,wh=3.5,wz=z+.5;
  shape(masonry,0xc9bda6,wx,y0/2,wz,ww+.2,y0,wd+.2);shape(plasterBox,0xf3e4cc,wx,y0+wh/2,wz,ww,wh,wd);
  P=frame(wx,0,wz+wd/2,0);halfTimber(P,ww/2,0,y0,wh,[[0,1]]);windowAt(P,0,y0+2.0,0,.9,1.1,tone,true);
  P=frame(wx+ww/2,0,wz,Math.PI/2);windowAt(P,0,y0+2.0,0,.8,1.0,tone,false);
  {const sl=.27,tn=Math.tan(sl),H=y0+wh,rise=ww*tn,tri=infill([[-ww/2,0],[ww/2,0],[-ww/2,rise]]);
   shape(tiles,0xffffff,wx,H+(ww/2)*tn+.08/Math.cos(sl)+.02,wz,(ww+.9)/Math.cos(sl),.16,wd+.8,0,-sl);
   for(const e of [-1,1]){shape(tri,0xf3e4cc,wx,H,wz+e*wd/2,1,1,1);shape(beam,oak,wx,H+rise/2+.03,wz+e*(wd/2+.05),Math.hypot(ww,rise)+.1,.12,.12,0,-sl)}}
  solids.add({x,z,w:w*.52+.15,d:d*.52+.15,base:0,top:yTop+rise});solids.add({x:wx,z:wz,w:ww*.52,d:wd*.52,base:0,top:y0+wh+.9});
  wallLantern(x-.95,y0+2.95,front+.35,0,1);wallLantern(x+.95,y0+2.95,front+.35,0,1);
  for(let i=0;i<7;i++){const hx=x-w/2+.6+i*1.25;if(Math.abs(hx-x)<2)continue;{shape(blossom,0x2c4a24,hx,.4,front+1.1,.4,.34,.28);shape(bushGeo,0x4f7d32,hx,.1,front+1.1,.6,.55,.45,hx*3)}}
 }
 const lathe=(points,n=16)=>new T.LatheGeometry(points.map(([r,h])=>new T.Vector2(r,h)),n);
 const column=lathe([[.21,0],[.235,.05],[.23,.15],[.174,.19],[.165,.33],[.13,.39],[.095,.47],[.082,2.46],[.13,2.50],[.125,2.56],[.08,2.59],[.06,2.76],[0,2.83]]);
 const cap=lathe([[0,0],[.22,0],[.29,.04],[.255,.08],[.17,.13],[.11,.20],[.07,.22],[.066,.26],[0,.27]],12);
 const lens=lathe([[.112,-.22],[.166,-.15],[.19,.09],[.167,.17],[.135,.19]],12);
 lens.userData.surface=new T.MeshStandardMaterial({color:0xefc991,emissive:0xffa44a,emissiveIntensity:2.4,roughness:.22,metalness:.12});
 const bronze=0x554538, patina=0x40504b, brass=0xb69765;
 const hoop=new T.TorusGeometry(1,.13,7,18);
 // Props from the audit (PR #6), 1.22: shapes you recognise instead of blocks.
 const propMetal=new T.MeshStandardMaterial({color:0xc6cacc,metalness:.75,roughness:.32});
 const milkCan=lathe([[0,0],[.15,0],[.16,.02],[.16,.42],[.155,.46],[.12,.54],[.085,.6],[.08,.66],[.1,.68],[.1,.71],[.05,.73],[0,.74]],20);milkCan.userData={surface:propMetal};
 const churnBody=new T.CylinderGeometry(.2,.27,1,18);churnBody.userData={surface:planks.userData.surface};
 const ovenDome=new T.SphereGeometry(1,22,10,0,Math.PI*2,0,Math.PI/2);ovenDome.userData={surface:masonry.userData.surface};
 const halfDisc=new T.CircleGeometry(1,18,0,Math.PI);halfDisc.userData={surface:new T.MeshBasicMaterial({color:0x140c07})};
 const sawBlade=(()=>{const sh=new T.Shape();sh.moveTo(0,.08);sh.lineTo(0,.26);sh.lineTo(.66,.17);for(let i=0;i<=16;i++){const x=.66-i*.041;sh.lineTo(x,i%2?.03:0)}sh.lineTo(0,.08);
  const g=new T.ExtrudeGeometry(sh,{depth:.008,bevelEnabled:false});g.userData={surface:propMetal};return g})();
 const teleTube=new T.CylinderGeometry(.38,.32,1,28);
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
 // scanned wall lantern (Sketchfab, CC-BY) with its own bracket; the procedural one is the fallback.
 // (x,y,z) is where the procedural lantern hangs, (nx,nz) the direction the wall faces
 if(scanReady)Models.load('sf_lantern').then(r=>{if(r.material.emissive){r.material.emissive.set(0xffb45c);r.material.emissiveIntensity=2.6}}).catch(()=>{});
 function wallLantern(x,y,z,nx,nz){if(!scanReady){lantern(x,y,z);return}scanProp('sf_lantern',x-nx*.1,y-.52,z-nz*.1,Math.atan2(nx,nz)+Math.PI,1.7,null,()=>lantern(x,y,z))}
 function lamp(x,z,y=0,parent=null,side=1){
  const piece=(geo,color,dy,w,h,d)=>shape(geo,color,x,y+dy,z,w,h,d,side>0?0:Math.PI,0,0,parent);
  piece(masonry,0xdeceaf,.055,.55,.11,.55);piece(column,patina,.09,1,1,1);
  for(const dy of [.29,.47,2.55])piece(cyl,brass,dy,dy<1?.154:.108,.032,dy<1?.154:.108);
  // Since 1.19 (audit PR #5) a street lamp carries the scanned Kigha lantern on its own short bracket against the post,
  // instead of the drawn crook arm with a drawn lantern: one bracket, no double mounting. The drawn arm stays as fallback.
  const drawn=()=>{piece(crook,patina,.09,1,1,1);piece(scroll,bronze,.09,1,1,1);lantern(x+.56*side,y+2.32,z,parent)};
  if(scanReady&&!parent){scanProp('sf_lantern',x+side*.31,y+1.98,z,side>0?-Math.PI/2:Math.PI/2,1.7,null,drawn);solids.add({x:x+side*.31,z,r:.24,base:y+1.95,top:y+3.05})}
  else{drawn();if(!parent)solids.add({x:x+.56*side,z,r:.26,base:y+1.9,top:y+2.9})}
 }
 const millRoof=surfaced(new T.ConeGeometry(1,1,16),"slate");
 const millCap=new T.CylinderGeometry(1,1,1,18,1,false,-Math.PI/2,Math.PI);millCap.userData={surface:millRoof.userData.surface};
 let millStoneMat=null;function millStone(){if(millStoneMat)return millStoneMat;if(!(scanReady&&typeof Models!=='undefined'))return millStoneMat=masonry.userData.surface;
  const [map,nor]=[Models.texture('wallslate_diff.jpg',true).clone(),Models.texture('wallslate_nor.jpg').clone()];for(const t of [map,nor]){t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(5.5,3.4);t.needsUpdate=true}
  return millStoneMat=new T.MeshStandardMaterial({map,normalMap:nor,normalScale:new T.Vector2(1.3,1.3),roughness:.93})}
 const sailcloth=new T.PlaneGeometry(.65,2.77,4,10);
 const clothPos=sailcloth.attributes.position;
 for(let i=0;i<clothPos.count;i++){const u=(clothPos.getX(i)+.325)/.65,v=(clothPos.getY(i)+1.385)/2.77;
  clothPos.setZ(i,.02+.105*Math.sin(Math.PI*u)*Math.sin(Math.PI*v)+u*.07*v)}
 sailcloth.computeVertexNormals();sailcloth.userData.surface=new T.MeshStandardMaterial({map:loadSurface('canvas.jpg'),color:0xeaddc7,side:T.DoubleSide,roughness:1});
 function mill(x,z,smock=false){
  const tower=new T.CylinderGeometry(smock?1.37:1.5,2.6,7.8,smock?8:32);
  tower.userData.surface=smock?timberMat:millStone();
  shape(tower,smock?0xf0e0c8:0xe8e0d2,x,3.9,z,1,1,1);
  // Since 1.22 (PR #13): a Dutch cap shaped like an upturned boat hull along the axle instead of a cone, a beard board
  // under the axle, a tail with struts down to a capstan wheel to turn the cap into the wind, a door and small windows.
  {const top=7.8,rc=smock?1.62:1.78,len=3.7,cz=z+.25;shape(millCap,0xffffff,x,top+.02,cz,rc,len,rc*.92,0,0,-Math.PI/2);
   shape(beam,oak,x,top+.08,cz,rc*2+.1,.16,len+.08);shape(planks,0x7a5a3c,x,top-.25,z+2.18,1.5,.75,.08);shape(ridge,0x6e6458,x,top+rc*.9+.04,cz,.09,len+.1,.09,0,0,Math.PI/2);
   const tailY=smock?3.75:.95,tailZ=z-(smock?2.95:4.6);liftOff=true;const L0=liftAt(x,z);
   cord(x,L0+top+.15,z-1.55,x,L0+tailY+.35,tailZ,.11,oak);for(const sx of [-1,1])cord(x+sx*1.05,L0+top-.1,z-1.1,x,L0+tailY+1.2,tailZ+.5,.06,oak);
   cord(x,L0+top-1.2,z-1.45,x,L0+tailY+.9,tailZ+.25,.05,oak);liftOff=false;
   shape(wheel,oak,x,tailY+.2,tailZ-.18,.62,.62,1.2);for(let k=0;k<3;k++)shape(beam,oak,x,tailY+.2,tailZ-.18,1.2,.06,.06,0,k*Math.PI/3);
   if(!smock){solids.add({x,z:tailZ-.18,r:.55,base:0,top:1.6});
    // door on the west side and three small windows climbing the tower
    const P=frame(x-2.42,0,z,-Math.PI/2);P(cube,0x1d1712,0,1.45,.05,1.2,2.9,.06);P(planks,0x6e4a30,0,1.42,.08,1.05,2.8,.05);P(masonry,0xcfc1a8,0,.12,.45,1.5,.24,.8);
    for(const [a,y] of [[2.2,2.6],[-2.0,4.4],[.9,6.0]]){const r=2.6-y*.141+.02;shape(glass,0xffffff,x+Math.sin(a)*r,y,z+Math.cos(a)*r,.36,.55,.05,a);shape(beam,oak,x+Math.sin(a)*(r+.02),y-.33,z+Math.cos(a)*(r+.02),.5,.07,.12,a)}}}
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
  const offset=3.32,hub=group(x,6.25,z+offset);hub.name='mill-rotor';rotorDiscs.push({x,y:6.25+liftAt(x,z),z:z+offset,r:5.2});
  shape(cyl,bronze,x,6.25,z+2.33,.22,2.10,.22,0,0,Math.PI/2);
  for(let i=0;i<4;i++){
   const arm=group(0,0,0,hub);arm.rotation.z=i*Math.PI/2;
   const blade=(geo,color,x,y,z,w,h,d)=>shape(geo,color,x,y,z,w,h,d,0,0,0,arm);
   blade(cube,wood,0,2.28,0,.145,4.66,.15);
   for(const rail of [.38,.88])blade(cube,wood,rail,3,0,.042,3.1,.06);
   for(let j=0;j<10;j++)blade(cube,wood,.435,1.47+j*.337,.02,.97,.048,.076);
   blade(sailcloth,cream,.42,3.10,.069,1,1,1).name='sail';
  }
  shape(cyl,wood,0,0,.065,.34,.43,.34,0,0,Math.PI/2,hub);
  shape(ball,brass,0,0,.31,.133,.133,.068,0,0,0,hub);rotors.push(hub);solids.add({x,z,r:smock?2.74:2.54,base:0,top:10.1})
 }
 // Bunting: two slim tapered poles, a thin sagging cord and cloth pennants that swing in the wind.
 const bunting=[],poleGeo=new T.CylinderGeometry(.065,.1,1,10),flagGeo=(()=>{const w=.36,h=.5,pos=[],idx=[],uv=[];
  for(let r=0;r<=3;r++){const f=r/3,y=-h*f,hw=w/2*(1-f*.985),z=.05*f*f;pos.push(-hw,y,z,hw,y,z);uv.push(.5-hw/w,1-f,.5+hw/w,1-f)}
  for(let r=0;r<3;r++){const a=r*2;idx.push(a,a+2,a+1,a+1,a+2,a+3)}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g})();
 const flagCloth=new T.MeshStandardMaterial({side:T.DoubleSide,roughness:.95,map:(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,64,64);
  for(let y=0;y<64;y+=2){g.fillStyle='rgba(0,0,0,.06)';g.fillRect(0,y,64,1)}for(let x=0;x<64;x+=2){g.fillStyle='rgba(0,0,0,.05)';g.fillRect(x,0,1,64)}g.fillStyle='rgba(0,0,0,.12)';g.fillRect(0,0,64,4);
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t})()});
 function pennants(x,z,span){for(const side of [-1,1])solids.add({x:x+side*span/2,z,r:.12,base:0,top:6});const L=liftAt(x,z);
  for(const s of [-1,1]){shape(poleGeo,wood,x+s*span/2,3,z,1,6,1);shape(ball,0x6b4a30,x+s*span/2,6.04,z,.09,.07,.09)}
  const top=5.78,sag=span*.085,ropeY=t=>top-sag*4*t*(1-t);
  for(let k=0;k<10;k++){const a=k/10,b=(k+1)/10;cord(x+(a-.5)*span,ropeY(a),z,x+(b-.5)*span,ropeY(b),z,.013,0x5a4632)}
  const n=Math.max(6,Math.round(span/.43)),palette=[0xb8412f,0xe9dcc0,0x2f6f73,0xd19a35,0x34507a],m=new T.InstancedMesh(flagGeo,flagCloth,n-1),list=[],c=new T.Color();
  for(let i=1;i<n;i++){const t=i/n,px=x+(t-.5)*span,py=L+ropeY(t)-.015;list.push([px,py,z,i*1.7+x*.3+z*.11]);m.setColorAt(i-1,c.set(palette[i%palette.length]).multiplyScalar(.92+.08*Math.sin(i*2.3)))}
  m.castShadow=true;m.receiveShadow=true;m.userData.list=list;scene.add(m);bunting.push(m)}
 const flagM=new T.Matrix4(),flagQ=new T.Quaternion(),flagE=new T.Euler(),flagP=new T.Vector3(),flagS=new T.Vector3(1,1,1);
 function swingBunting(t){for(const m of bunting){m.userData.list.forEach(([x,y,z,ph],j)=>{flagE.set(.22*Math.sin(t*2.1+ph)+.1*Math.sin(t*3.7+ph*1.9)+.12,.12*Math.sin(t*1.3+ph),0);flagQ.setFromEuler(flagE);m.setMatrixAt(j,flagM.compose(flagP.set(x,y,z),flagQ,flagS))});m.instanceMatrix.needsUpdate=true}}
 // Rigid airship like the title art: a ribbed copper-cream envelope, cross tail fins, a long lit gondola,
 // engine pods with turning propellers. It cruises slowly around the archipelago.
 const airships=[];
 function airship(x,y,z){
  const g=new T.Group();scene.add(g);const L=22,R=3.3,body=new T.Group();g.add(body);
  const skinTex=canvasTex(512,256,c=>{const gr=c.createLinearGradient(0,0,0,256);gr.addColorStop(0,'#e9cf9d');gr.addColorStop(.55,'#d2a56b');gr.addColorStop(1,'#a8743f');c.fillStyle=gr;c.fillRect(0,0,512,256);
   for(let i=0;i<2600;i++){c.fillStyle=`rgba(${120+Math.random()*80|0},${80+Math.random()*50|0},40,${Math.random()*.06})`;c.fillRect(Math.random()*512,Math.random()*256,3,1)}
   c.strokeStyle='rgba(92,56,28,.75)';c.lineWidth=3;for(let i=0;i<=24;i++){c.beginPath();c.moveTo(i*512/24,0);c.lineTo(i*512/24,256);c.stroke()}
   c.lineWidth=2;c.strokeStyle='rgba(92,56,28,.55)';for(let j=1;j<12;j++){c.beginPath();c.moveTo(0,j*256/12);c.lineTo(512,j*256/12);c.stroke()}
   c.fillStyle='rgba(122,46,32,.85)';c.fillRect(0,120,512,10)});
  const prof=[[0,-L/2],[R*.38,-L/2+.55],[R*.72,-L/2+1.9],[R*.93,-L/2+4.2],[R,-L/2+7],[R,L/2-8],[R*.9,L/2-4.6],[R*.66,L/2-2.4],[R*.36,L/2-.9],[R*.08,L/2-.12],[0,L/2]];
  const env=new T.Mesh(new T.LatheGeometry(prof.map(([r,h])=>new T.Vector2(r,h)),24),new T.MeshStandardMaterial({map:skinTex,roughness:.7,metalness:.15,flatShading:true}));env.rotation.x=Math.PI/2;body.add(env);
  const rib=new T.MeshStandardMaterial({color:0x7a4a26,metalness:.6,roughness:.45});
  for(let k=1;k<10;k++){const hz=-L/2+k*L/10;let rr=R;for(let i=1;i<prof.length;i++)if(hz<=prof[i][1]){const [r0,h0]=prof[i-1],[r1,h1]=prof[i];rr=r0+(r1-r0)*(hz-h0)/(h1-h0);break}
   const ring=new T.Mesh(new T.TorusGeometry(rr+.03,.05,6,24),rib);ring.position.z=hz;body.add(ring)}
  // tail fins: a cross of four, each with a hinged control surface
  const finShape=new T.Shape();finShape.moveTo(0,0);finShape.lineTo(4.2,0);finShape.lineTo(4.6,2.6);finShape.lineTo(1.6,2.6);finShape.lineTo(0,0);
  const finGeo=new T.ExtrudeGeometry(finShape,{depth:.08,bevelEnabled:false}),finMat=new T.MeshStandardMaterial({map:skinTex,color:0xd9b27c,roughness:.7});
  for(let k=0;k<4;k++){const f=new T.Group();f.rotation.z=k*Math.PI/2;body.add(f);const m=new T.Mesh(finGeo,finMat);m.rotation.y=-Math.PI/2;m.position.set(-.04,R*.5,L/2-5.4);f.add(m);
   const flap=new T.Mesh(new T.BoxGeometry(.06,2.4,1.1),new T.MeshStandardMaterial({color:0x7a2e20,roughness:.7}));flap.position.set(0,R*.5+1.3,L/2-.3);f.add(flap)}
  // gondola: a long timber cabin with a row of warm windows, a rounded bow and a railing on the roof
  const wood=new T.MeshStandardMaterial({map:loadSurface('board.jpg'),color:0x8a5a34,roughness:.8}),brassM=new T.MeshStandardMaterial({color:0xb48a3c,metalness:.85,roughness:.3});
  const cab=new T.Group();cab.position.set(0,-R-1.25,-1.4);body.add(cab);
  const hull=new T.Mesh(new T.BoxGeometry(1.9,1.3,8.2),wood);cab.add(hull);const bow=new T.Mesh(new T.CylinderGeometry(.95,.95,1.3,16,1,false,Math.PI/2,Math.PI),wood);bow.position.z=-4.1;cab.add(bow);
  const keel=new T.Mesh(new T.BoxGeometry(1.5,.35,7.6),new T.MeshStandardMaterial({color:0x4a3020,roughness:.8}));keel.position.y=-.8;cab.add(keel);
  const lit=new T.MeshStandardMaterial({color:0x2a2018,emissive:0xffb35c,emissiveIntensity:2.2});
  for(const s of [-1,1])for(let i=0;i<9;i++){const win=new T.Mesh(new T.BoxGeometry(.04,.42,.5),lit);win.position.set(s*.96,.12,-3.5+i*.86);cab.add(win)}
  const roofRail=new T.Mesh(new T.BoxGeometry(1.95,.06,8.3),brassM);roofRail.position.y=.72;cab.add(roofRail);
  for(let i=0;i<6;i++)for(const s of [-1,1]){const st=new T.Mesh(new T.CylinderGeometry(.035,.035,1.5,5),brassM);st.position.set(s*.8,1.35,-3.4+i*1.4);st.rotation.z=s*.32;cab.add(st)}
  // engine pods with propellers
  const props=[];
  for(const s of [-1,1]){const pod=new T.Group();pod.position.set(s*2.4,-R-.9,-1.6);body.add(pod);
   const nac=new T.Mesh(new T.CylinderGeometry(.32,.26,1.5,12),brassM);nac.rotation.x=Math.PI/2;pod.add(nac);
   const arm=new T.Mesh(new T.CylinderGeometry(.06,.06,2.4,6),brassM);arm.rotation.z=Math.PI/2;arm.position.x=-s*1.1;pod.add(arm);
   const prop=new T.Group();prop.position.z=-.85;pod.add(prop);for(let k=0;k<4;k++){const blade=new T.Mesh(new T.BoxGeometry(.12,1.1,.03),new T.MeshStandardMaterial({color:0x5a3a22,roughness:.6}));blade.position.y=.55;const hub=new T.Group();hub.rotation.z=k*Math.PI/2;hub.add(blade);prop.add(hub)}props.push(prop)}
  // rigging between envelope and gondola
  const rope=new T.MeshStandardMaterial({color:0x3a2e24,roughness:1});
  for(let i=0;i<5;i++)for(const s of [-1,1]){const z0=-2.4+i*1.6,a=new T.Vector3(s*.9,-R-.6,z0+1.2),b=new T.Vector3(s*R*.72,-R*.68,z0+.6),len=a.distanceTo(b);const m=new T.Mesh(new T.CylinderGeometry(.018,.018,len,4),rope);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),b.clone().sub(a).normalize());body.add(m)}
  body.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false}});
  const ship={g,props,center:{x:2,z:-55},rx:88,rz:112,y,phase:Math.atan2(z+55,x-2)};airships.push(ship);
  // the scanned vintage airship (Evan16, CC BY 4.0) replaces the drawn one once loaded: bow forward, envelope in the
  // warm cream of the title art, about 24 m long
  if(scanReady)Models.load('sf_airship').then(r=>{const m=new T.Mesh(r.geometry,r.material);const S=.56;m.scale.setScalar(S);m.rotation.y=Math.PI;m.position.y=-9.9*S;
   // (1.23) envelope in warm oiled canvas and a wooden gondola, like the airship on the title art
   if(Array.isArray(m.material)){m.material[0].color.setRGB(.95,.5,.22);m.material[0].roughness=.85;m.material[0].metalness=0;m.material[0].metalnessMap=null;m.material[0].needsUpdate=true;m.material[1].color.setRGB(1.75,1.32,.95);m.material[1].metalness=.25;m.material[1].needsUpdate=true}g.add(m);body.visible=false;ship.props=[]}).catch(e=>console.warn('airship',e));
  return g}
 // Falling water: streaks of foam race down, the sheet frays at the edges and dissolves into mist.
 const cascadeUniforms={time:{value:0}};
 function cascadeMaterial(tint=0xcfe7ef,opacity=.92,lip=1){return new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,fog:true,
  uniforms:T.UniformsUtils.merge([T.UniformsLib.fog,{tint:{value:new T.Color(tint)},opacity:{value:opacity},lip:{value:lip}}]),
  vertexShader:`#include <common>
#include <fog_pars_vertex>
varying vec2 vUv;void main(){vUv=uv;vec4 mvPosition=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mvPosition;
#include <fog_vertex>
}`,
  fragmentShader:`#include <common>
#include <fog_pars_fragment>
uniform float time;uniform vec3 tint;uniform float opacity;uniform float lip;varying vec2 vUv;
float hh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float nz(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hh(i),hh(i+vec2(1,0)),f.x),mix(hh(i+vec2(0,1)),hh(i+vec2(1,1)),f.x),f.y);}
void main(){float y=vUv.y;
 float s=nz(vec2(vUv.x*16.,vUv.y*5.+time*2.4))*.55+nz(vec2(vUv.x*42.,vUv.y*12.+time*4.2))*.45;
 float edge=smoothstep(0.,.25,vUv.x)*smoothstep(1.,.75,vUv.x);
 float holes=smoothstep(.18,.5,nz(vec2(vUv.x*7.,vUv.y*2.2+time*1.6)));
 float a=edge*(.45+.55*s)*mix(.55,1.,holes)*smoothstep(0.,.3,y);
 float foam=smoothstep(.9,1.,y)*lip*smoothstep(1.,.975,y);a*=mix(smoothstep(1.,.84,y),smoothstep(1.,.985,y),lip);
 vec3 col=mix(tint*.78,vec3(1.),clamp(s*.75+foam,0.,1.));
 gl_FragColor=vec4(col,clamp(a+foam*.35,0.,1.)*opacity);
#include <fog_fragment>
}`},cascadeUniforms)}
 const water=cascadeMaterial();water.uniforms.time=cascadeUniforms.time;
 // Brooks (1.22, water audit PR #8): two layers of flowing streaks at different speeds, a deeper teal in the middle
 // channel, foam that clings to the banks and riffles, a white tongue where the water tips over the lip, and edges
 // that fade into the wet bank instead of ending on a hard line. len is the brook's length in v units.
 function brookMaterial(len){return new T.ShaderMaterial({transparent:true,depthWrite:false,fog:true,
  uniforms:T.UniformsUtils.merge([T.UniformsLib.fog,{len:{value:len}}]),
  vertexShader:`#include <common>
#include <fog_pars_vertex>
varying vec2 vUv;varying vec3 vN;void main(){vUv=uv;vN=normalize(normalMatrix*normal);vec4 mvPosition=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mvPosition;
#include <fog_vertex>
}`,
  fragmentShader:`#include <common>
#include <fog_pars_fragment>
uniform float time;uniform float len;varying vec2 vUv;varying vec3 vN;
float hh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float nz(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hh(i),hh(i+vec2(1,0)),f.x),mix(hh(i+vec2(0,1)),hh(i+vec2(1,1)),f.x),f.y);}
void main(){float u=vUv.x,v=vUv.y;
 float a1=nz(vec2(u*5.,v*2.2-time*1.1)),a2=nz(vec2(u*13.+3.,v*6.-time*2.3)),a3=nz(vec2(u*31.,v*14.-time*3.4));
 float mid=1.-abs(u-.5)*2.;
 vec3 deep=vec3(.03,.1,.11),shallow=vec3(.13,.22,.21);
 vec3 col=mix(shallow,deep,smoothstep(.15,.85,mid)*.85);
 col+=vec3(.32,.38,.38)*smoothstep(.62,.95,a1*.55+a2*.45)*.3;
 float bank=smoothstep(.3,.04,u)+smoothstep(.7,.96,u);
 float riffle=smoothstep(.78,.95,a2)*smoothstep(.5,.9,a3);
 float lip=smoothstep(len-.55,len,v);
 float foam=clamp(bank*smoothstep(.42,.82,a3*.5+a1*.5)+riffle*.7+lip*smoothstep(.25,.6,a2),0.,1.);
 col=mix(col,vec3(.74,.8,.8),foam);
 float edge=smoothstep(0.,.14,u)*smoothstep(1.,.86,u);
 gl_FragColor=vec4(col,(.5+.24*mid)*edge+foam*.4*edge);
#include <fog_fragment>
}`})}
 // A waterfall sheet that behaves like water leaving a lip: it shoots out a little, then falls in a parabola, widens as
 // it drops and ripples sideways. Centred like the old flat planes (top at +H/2), local +z points away from the cliff.
 function fallGeo(wd,H,seed=0){const N=26,M=6,v=[],uv=[],f=[];
  for(let j=0;j<=N;j++){const t=j/N,drop=t*H,out=1.25*Math.sqrt(2*drop/9.8),sway=.22*Math.sin(t*5.5+seed)*t;
   for(let i=0;i<=M;i++){const u=i/M,x=(u-.5)*wd*(1+.42*t)+sway;v.push(x,H/2-drop,out+.18*Math.sin(u*Math.PI)*t+.06*Math.sin(u*9+seed+t*7)*t);uv.push(u,1-t)}
   if(j)for(let i=0;i<M;i++){const a=(j-1)*(M+1)+i,b=a+M+1;f.push(a,b,a+1,a+1,b,b+1)}}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(f);g.computeVertexNormals();return g}
 // drifting mist where the water disappears into the clouds
 const mistTex=loadSurface('mist.png'),mists=[];
 // dark, wet stones along both banks of a brook, every couple of metres, alternating sides (no shared randomness)
 function wetStones(B,hAt,w){for(let k=0;k<B.length-1;k++)for(const f of [.3,.75]){const x0=B[k][0]+(B[k+1][0]-B[k][0])*f,z0=B[k][1]+(B[k+1][1]-B[k][1])*f,dx=B[k+1][0]-B[k][0],dz=B[k+1][1]-B[k][1],l=Math.hypot(dx,dz)||1,
   side=(k+(f>.5?1:0))%2?1:-1,o=w+.35+.25*Math.abs(Math.sin(k*3.1+f*7)),x=x0-dz/l*o*side,z=z0+dx/l*o*side,sc=.22+.16*Math.abs(Math.sin(k*1.7+f*5));
   shape(stoneGeo,0x6f6b62,x,hAt(x,z)+sc*.18,z,sc,sc*.62,sc*.85,k*2.3+f)}}
 // (1.22) The brook bed: a band of wet, dark gravel under the water that is a little wider than the stream and fades
 // into the grass at its edges, so the water lies in a bed instead of on top of the lawn.
 // the sideways direction across a brook, averaged over about a metre either side so the ribbon turns a corner smoothly
 // instead of folding over itself (two layers of water showed as a bright seam across the stream)
 function brookN(B,f){const at=g=>{g=Math.max(0,Math.min(B.length-1,g));const k=Math.min(B.length-2,Math.floor(g)),u=g-k;return [B[k][0]+(B[k+1][0]-B[k][0])*u,B[k][1]+(B[k+1][1]-B[k][1])*u]};
  const a=at(f-.35),b=at(f+.35),dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz)||1;return [-dz/l,dx/l]}
 let bedMat=null;
 function brookBed(B,hAt,wdAt,steps){if(!bedMat){bedMat=new T.MeshStandardMaterial({map:loadSurface('p_rockygravel.jpg'),color:0xa1988a,roughness:.4,metalness:0,vertexColors:true,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2});bedMat.map.wrapS=bedMat.map.wrapT=T.RepeatWrapping}
  const pos=[],uv=[],col=[],idx=[];
  for(let i=0;i<=steps;i++){const f=i/steps*(B.length-1),k=Math.min(B.length-2,Math.floor(f)),u=f-k,x=B[k][0]+(B[k+1][0]-B[k][0])*u,z=B[k][1]+(B[k+1][1]-B[k][1])*u;
   const [nx,nz]=brookN(B,f),wd=wdAt(i/steps),fade=Math.min(1,i/3,(steps-i)/2+.35);
   for(const [s,a] of [[-2.05,0],[-1.15,1],[1.15,1],[2.05,0]]){const px=x+nx*wd*s,pz=z+nz*wd*s;pos.push(px,Math.max(hAt(px,pz),hAt(x,z))+.062,pz);uv.push(px/2.2,pz/2.2);col.push(1,1,1,a*fade*.92)}
   if(i){const n=i*4;for(let c=0;c<3;c++)idx.push(n-4+c,n-3+c,n+c,n+c,n-3+c,n+1+c)}}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(col,4));g.setIndex(idx);g.computeVertexNormals();
  const m=new T.Mesh(g,bedMat);m.renderOrder=1;m.receiveShadow=true;scene.add(m);return m}
 function mist(x,y,z,s){for(let k=0;k<3;k++){const m=new T.Sprite(new T.SpriteMaterial({map:mistTex,transparent:true,opacity:.5,depthWrite:false,color:0xf2f6f8}));m.position.set(x+(k-1)*s*.25,y+k*s*.12,z);m.scale.set(s,s*.6,1);scene.add(m);mists.push([m,s,k*2.1])}}
 const land=[0x9cca75,0xa1c884,0xb0d5ca];
 const reserved=[{x:13,z:-6.6,r:5.2},{x:-12,z:-52.6,r:8.2},{x:0,z:-130,r:6.2},{x:-12,z:-115,r:2.2},{x:-3.6,z:-125,r:1.6}],taken=(x,z,m)=>reserved.some(o=>Math.hypot(x-o.x,z-o.z)<o.r+m)||nearTrail(x,z,m+.3);
 islands.forEach(({x,z,r},k)=>{island(x,z,r,land[k],15,LIFT[k]);
  for(let j=0;j<150;j++){let a=rnd()*6.28,d=Math.sqrt(rnd())*(r-1),px=x+Math.cos(a)*d,pz=z+Math.sin(a)*d;
   if(Math.abs(px)<3){continue}
   if(j%13===0 && d>12 && Math.abs(px)>10){let h=4+rnd()*3;if(nearPaving(px,pz,k,h*(k===1?.56:.405))||taken(px,pz,h*.5)){if(k===1)for(let j=0;j<6;j++)rnd();continue}k===1?cherry(px,pz,h):pine(px,pz,h);solids.add({x:px,z:pz,r:.43,base:0,top:h});solids.add({x:px,z:pz,r:k===1?2.6:h*.23,base:h*.40,top:h})}
   else if(j%5===0){if(nearPaving(px,pz,k,.8)||taken(px,pz,.8))continue;if(k===2&&[[-7,-112],[7,-120],[0,-126]].some(([a,b])=>Math.hypot(px-a,pz-b)<2)){rnd();continue}solids.add({x:px,z:pz,r:.70,base:0,top:.78});shape(stoneGeo,k===2?0x9caebc:0x9d9b84,px,.25,pz,.8,.57,.75,a)}
   else if(!nearPaving(px,pz,k,.39)&&!taken(px,pz,.3)){grove('meadow',px,pz,.45+.3*Math.sin(a)**2,0,.77)}
  }
  for(let j=-r+2;j<r-1;j+=1.55){let px=1.2*Math.sin(j*.18+k);
   for(let f=0;f<2;f++){let fx=px+(f?1:-1)*(2.65+rnd()*.8),fz=z+j;if(!nearPaving(fx,fz,k,.25)&&f===0 && Math.abs(Math.sin(j))>.65)grove("meadow",fx,fz,.31,0,.52)}}
  const roadLine=[];
  for(let n=0;n<=48;n++){let t=n/48,zz=(2*t-1)*(r-1),center=1.2*Math.sin(zz*.18+k);roadLine.push([center,z+zz,2.13+.12*Math.sin(n*1.42)])}
  // (1.22) the main road lies a little above the lanes and trails: their start is hidden under the cobbles, and in
  // the road's frayed edge you see the lane instead of grass
  pathStrip(roadLine,.072+LIFT[k],mainPathKind[k]);
  for(const home of villageHomes.filter(h=>h.k===k)){if(scanReady){const c=new T.CatmullRomCurve3(branchPoints(home).map(([a,b])=>new T.Vector3(a,0,b)),false,'centripetal');{const pts=c.getSpacedPoints(Math.max(8,Math.ceil(c.getLength()/.6)));let run=0;pathStrip(pts.map((q,n)=>{if(n)run+=q.distanceTo(pts[n-1]);const back=c.getLength()-run;return [q.x,q.z,.88+.9*Math.min(1,Math.max(0,1-(run-2.1)/2.2))+.22*Math.max(0,1-back/1.2)]}),.055+LIFT[k],lanePathKind[k])};continue}
   const line=branchPoints(home),vertices=[],texcoords=[],faces=[];
   for(let i=0;i<line.length;i++){
    const prev=line[Math.max(0,i-1)],next=line[Math.min(line.length-1,i+1)];
    const before=new T.Vector2(line[i][0]-prev[0],line[i][1]-prev[1]).normalize();
    const after=new T.Vector2(next[0]-line[i][0],next[1]-line[i][1]).normalize();
    const dir=before.clone().add(after).normalize(),width=.88/Math.max(.52,dir.dot(i?before:after));
    for(const side of [-1,1]){
     const xx=line[i][0]-side*dir.y*width,zz=line[i][1]+side*dir.x*width;
     vertices.push(xx,.055+LIFT[k],zz);texcoords.push(xx/3.7,(zz-z)/3.7)
    }
    if(i){const n=i*2;faces.push(n-2,n-1,n,n,n-1,n+1)}
   }
   const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(texcoords,2));geometry.setIndex(faces);geometry.computeVertexNormals();
   const lane=new T.Mesh(geometry,pathMat(lanePathKind[k]));lane.receiveShadow=true;scene.add(lane)
  }
  for(let j=0;j<9;j++)rnd();
 });
 for(let i=0;i<8;i++){let x=6+i%3*1.16,z=12+Math.floor(i/3)*1.21;solids.add({x,z,w:.555,d:.555,base:0,top:1.08});shape(cube,0xbc8352,x,.54,z,1.07,1.04,1.08);for(let side of [-1,1])shape(cube,0x745344,x+side*.39,.54,z,.13,1.1,1.11)}
 for(let z of [10,-6,-17,-50,-71,-101,-118]){let x=z%2?3.8:-3.8;solids.add({x,z,r:.22,base:0,top:3.22});lamp(x,z,0,null,x>0?-1:1)}
 // (1.24.1) this fir stood with its crown in the corner of Mara's smithy: up close the corner stones stuck out of the
 // needles like a stack of loose blocks. Moved to open grass west of the smithy (same tree, same id t11).
 pine(5.6,6.8,5);solids.add({x:5.6,z:6.8,r:.43,base:0,top:5});
 // ---- Highlands: an eastern lobe of Windhaven with a mountain, a stream, a waterfall and a cable car.
 // Own random stream, so every earlier placement stays exactly where it was.
 const lobe={x:27,z:-5,r:15},peak={x:31,z:-6,R:10.5,H:9.5};
 const brook=[[29.6,-7.6],[31.6,-5.2],[33.6,-4.8],[35.4,-2.6],[37.6,-1.9],[39.4,-.4],[41.3,.6]];
 const peaks=[Object.assign(peak,{brook,I:lobe})],HL={};let highland=null;
 function brookDist(x,z,P=peaks[0]){const brook=P.brook;let best=9;for(let i=1;i<brook.length;i++){const [a,b]=brook[i-1],[c,d]=brook[i],dx=c-a,dz=d-b,t=Math.max(0,Math.min(1,((x-a)*dx+(z-b)*dz)/(dx*dx+dz*dz)));best=Math.min(best,Math.hypot(x-a-t*dx,z-b-t*dz))}return best}
 function mountainH(x,z){let h=0;for(const P of peaks)if(Math.abs(x-P.x)<P.R&&Math.abs(z-P.z)<P.R)h=Math.max(h,peakH(P,x,z));return h}
 function peakH(peak,x,z){const d=Math.hypot(x-peak.x,z-peak.z);if(d>=peak.R)return 0;const k=1-(d/peak.R)**2,I=peak.I,edge=I.lift===undefined?1:Math.max(0,Math.min(1,(I.r-1.2-Math.hypot(x-I.x,z-I.z))/3));
  const ridge=.55*Math.sin(x*.8+z*.3)*Math.cos(z*.7)+.35*Math.sin(x*1.9-z*1.3)*Math.sin(z*1.7+x*.4);
  return edge*Math.max(0,peak.H*k**1.7+ridge*k*(1-k)*3.4-.45*Math.exp(-(brookDist(x,z,peak)**2)/.55)*Math.min(1,k*4))}
 {const keep=seed;island(lobe.x,lobe.z,lobe.r,0x9cca75);seed=keep;
  // mountain surface: a polar grid so nothing hangs over the cliff
  const rings=40,segs=96,pos=[],col=[],uvs=[],idx=[],rocky=[],snowy=[],c=new T.Color();
  for(let i=0;i<=rings;i++)for(let j=0;j<segs;j++){const rr=peak.R*i/rings,a=j/segs*Math.PI*2,x=peak.x+Math.cos(a)*rr,z=peak.z+Math.sin(a)*rr,h=mountainH(x,z);
   const sl=Math.hypot(mountainH(x+.3,z)-h,mountainH(x,z+.3)-h)/.3,rock=Math.min(1,Math.max(0,(sl-.55)*1.6+(h-6)*.18));
   c.setRGB(1,1,1).multiplyScalar(.92+.16*Math.sin(x*2.1+z*1.7));if(brookDist(x,z)<.7)c.multiplyScalar(.8);col.push(c.r,c.g,c.b);rocky.push(rock);snowy.push(Math.min(1,Math.max(0,(h-peak.H*.56)/(peak.H*.14)))*(sl>1.6?.55:1));pos.push(x,h+(i===rings?-.06:.02),z);uvs.push(x/4,z/4)}
  for(let i=0;i<rings;i++)for(let j=0;j<segs;j++){const a=i*segs+j,b=i*segs+(j+1)%segs,c2=(i+1)*segs+j,d=(i+1)*segs+(j+1)%segs;idx.push(a,c2,b,b,c2,d)}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));g.setAttribute('rocky',new T.Float32BufferAttribute(rocky,1));g.setAttribute('snow',new T.Float32BufferAttribute(snowy,1));g.setIndex(idx);g.computeVertexNormals();
  // grass on the gentle slopes, bare rock where it gets steep: two textures blended per vertex
  // (1.23) double-sided: where the camera or a view grazes the slope you see rock, never through the hill into the boulders
  const hillMat=new T.MeshStandardMaterial({map:turf,vertexColors:true,roughness:.95,side:T.DoubleSide});
  hillMat.onBeforeCompile=sh=>{sh.uniforms.rockTex={value:context&&typeof Models!=='undefined'?Models.texture('alp_diff.jpg',true):loadSurface('rock-grey.jpg')};
   sh.vertexShader='attribute float rocky;\nattribute float snow;\nvarying float vRocky;\nvarying float vSnow;\nvarying vec3 vHP;varying vec3 vHN;\n'+sh.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\nvRocky=rocky;vSnow=snow;').replace('#include <project_vertex>','#include <project_vertex>\nvHP=(modelMatrix*vec4(transformed,1.)).xyz;vHN=normalize(mat3(modelMatrix)*objectNormal);');
   sh.fragmentShader='uniform sampler2D rockTex;\nvarying float vRocky;\nvarying float vSnow;\nvarying vec3 vHP;varying vec3 vHN;\n'+sh.fragmentShader.replace('#include <map_fragment>','vec4 grassT=texture2D(map,vMapUv);vec3 hb=pow(abs(normalize(vHN+vec3(1e-5,2e-5,1e-5))),vec3(4.))+1e-4;hb/=hb.x+hb.y+hb.z;vec3 hp=vHP*.18;vec4 rockT=texture2D(rockTex,hp.zy)*hb.x+texture2D(rockTex,hp.xz)*hb.y+texture2D(rockTex,hp.xy)*hb.z;diffuseColor*=mix(grassT*vec4(.92,1.02,.78,1.),rockT*vec4(1.05,1.02,.98,1.),clamp(vRocky,0.,1.));float sn=clamp(vSnow*1.7-(.55-rockT.g)*2.2-vRocky*.45,0.,1.);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.94,.97,1.)*(.9+.1*rockT.r),sn);')};
  const hill=new T.Mesh(g,hillMat);hill.receiveShadow=hill.castShadow=true;scene.add(hill);
  // crags: faceted rock outcrops on the steep flanks and around the summit
  const cragGeo=new T.IcosahedronGeometry(1,2);{const q=cragGeo.attributes.position;for(let i=0;i<q.count;i++){const x=q.getX(i),y=q.getY(i),z=q.getZ(i),k=1+.28*Math.sin(x*4.1+y*2.3)*Math.cos(z*3.7)+.14*Math.sin(y*7+x*5);q.setXYZ(i,x*k*1.1,y*k*.8,z*k)}cragGeo.computeVertexNormals()}
  const cragMat=new T.MeshStandardMaterial({map:loadSurface('rock-grey.jpg'),color:0xd6d3cc,roughness:.95,flatShading:true});
  // An outcrop is sunk into the slope: its underside sits below the lowest ground under its footprint,
  // so the downhill side never hangs in the air; the uphill side disappears into the mountain.
  function placeCrag(x,z,sc,sy,L,r1,r2,r3){let lo=mountainH(x,z);for(let i=0;i<10;i++){const a=i/10*Math.PI*2;for(const f of [.55,1.05])lo=Math.min(lo,mountainH(x+Math.cos(a)*sc*f,z+Math.sin(a)*sc*.9*f))}
   const gx=mountainH(x+.4,z)-mountainH(x-.4,z),gz=mountainH(x,z+.4)-mountainH(x,z-.4),m=new T.Mesh(cragGeo,cragMat);
   cragMeshes.push(m);m.userData.crag={x,z,L,lo,sc,sy};m.position.set(x,L+lo+sy*.1,z);m.scale.set(sc,sy,sc*.9);m.rotation.set(Math.atan(gz/.8)*.45+r1*.3-.15,r2*6,-Math.atan(gx/.8)*.45+r3*.3-.15,'YXZ');m.castShadow=m.receiveShadow=true;scene.add(m);
   solids.add({x,z,r:sc*.8,base:L+lo-1,top:L+lo+sy*.95});rockAt(x,z,sc*.8)}
  let cs=733;const cr=()=>(cs=(cs*16807)%2147483647)/2147483647;
  for(let k=0,made=0;k<220&&made<16;k++){const a=cr()*6.28,rr=1.5+cr()*(peak.R-2),x=peak.x+Math.cos(a)*rr,z=peak.z+Math.sin(a)*rr,h=mountainH(x,z),sl=Math.hypot(mountainH(x+.3,z)-h,mountainH(x,z+.3)-h)/.3;
   if(sl<.85||brookDist(x,z)<1.6||Math.hypot(x-peak.x-.2,z-peak.z+1.6)<3.6)continue;made++;const sc=.9+cr()*1.6;
   placeCrag(x,z,sc,sc*(.8+cr()*.6),0,cr(),cr(),cr())}
  // firs on the slopes, boulders on the shoulders
  let hs=5150;const hr=()=>(hs=(hs*16807)%2147483647)/2147483647;
  for(let k=0;k<26;k++){const a=hr()*6.28,rr=2.5+hr()*(lobe.r-3.5),x=lobe.x+Math.cos(a)*rr,z=lobe.z+Math.sin(a)*rr,h=mountainH(x,z);
   if(brookDist(x,z)<1.4||Math.hypot(x-peak.x,z-peak.z)<2.2||Math.hypot(x-25,z+1)<3||x<26&&Math.hypot(x,z)<24)continue;
   if(k%3){const t=3.5+hr()*3,lo=Math.min(h,...[0,1.57,3.14,4.71].map(a=>mountainH(x+Math.cos(a)*.32,z+Math.sin(a)*.32)));pine(x,z,t,lo-.12);solids.add({x,z,r:.43,base:h-.2,top:h+t});solids.add({x,z,r:t*.23,base:h+t*.4,top:h+t})}
   else{shape(stoneGeo,0x9d9b84,x,h+.2,z,.9,.6,.8,a);solids.add({x,z,r:.7,base:h-.3,top:h+.75});rockAt(x,z,.7)}}
  // the brook: a ribbon that follows the ground and runs off the edge as a waterfall
  const flow=new T.MeshStandardMaterial({map:loadSurface('cascade.png'),color:0x8cc4d6,transparent:true,opacity:.85,roughness:.1,metalness:.1,depthWrite:false});flow.map.wrapS=flow.map.wrapT=T.RepeatWrapping;flow.map.repeat.set(1,6);
  const bp=[],bu=[],bi=[];let run=0;const steps=60;
  for(let i=0;i<=steps;i++){const f=i/steps*(brook.length-1),k=Math.min(brook.length-2,Math.floor(f)),u=f-k,x=brook[k][0]+(brook[k+1][0]-brook[k][0])*u,z=brook[k][1]+(brook[k+1][1]-brook[k][1])*u;
   const [nx,nz]=brookN(brook,f),wd=(.32+.35*i/steps)*1.35;if(i)run+=Math.hypot(x-bp[bp.length-6],z-bp[bp.length-4]);
   for(const s of [-1,1]){const px=x+nx*wd*s,pz=z+nz*wd*s;bp.push(px,Math.max(mountainH(px,pz),mountainH(x,z))+.07,pz);bu.push((s+1)/2,run/3)}
   if(i){const n=i*2;bi.push(n-2,n-1,n,n,n-1,n+1)}}
  const bg=new T.BufferGeometry();bg.setAttribute('position',new T.Float32BufferAttribute(bp,3));bg.setAttribute('uv',new T.Float32BufferAttribute(bu,2));bg.setIndex(bi);bg.computeVertexNormals();
  const stream=new T.Mesh(bg,brookMaterial(run/3));stream.material.uniforms.time=cascadeUniforms.time;stream.renderOrder=2;scene.add(stream);
  wetStones(brook,(x,z)=>mountainH(x,z),.35);brookBed(brook,(x,z)=>mountainH(x,z),t=>(.32+.35*t)*1.35,60);
  const [ex,ez]=brook[brook.length-1],fallMat=new T.MeshBasicMaterial({map:loadSurface('cascade.png'),transparent:true,depthWrite:false,side:T.DoubleSide});fallMat.map.wrapT=T.RepeatWrapping;fallMat.map.repeat.set(1,3);
  for(const [wd,off,op,sd] of [[2.4,0,.95,0],[3.4,.3,.45,2],[1.3,.12,.75,4]]){const fall=new T.Mesh(fallGeo(wd,26,sd),cascadeMaterial(0xd5ecf3,op,sd===0?1:0));fall.material.uniforms.time=cascadeUniforms.time;fall.position.set(ex+.35+off,-12.9,ez+.2);fall.rotation.y=Math.PI/2-.12;fall.renderOrder=3;scene.add(fall)}
  mist(ex+1.2,-24,ez,9);mist(ex+.8,.4,ez+.2,2.2);
  torrents.push(stream);
  // a small pool where the brook starts, fed by a spring among the rocks
  Object.assign(HL,{hillMat,cragGeo,cragMat,flow,placeCrag});
 // Snowy mountains on the far islands, built like the highlands: grass and rock with a snow cap, crags,
 // firs, and a brook from a spring below the snowfield that runs to the rim and drops as a waterfall.
 highland=P=>{const I=P.I,L=I.lift,clampR=(x,z)=>{const dx=x-I.x,dz=z-I.z,e=Math.hypot(dx,dz),m=I.r-.45;return e>m?[I.x+dx/e*m,I.z+dz/e*m]:[x,z]};
  const rings=36,segs=96,pos=[],col=[],uvs=[],idx=[],rk=[],sn=[],c=new T.Color();
  for(let i=0;i<=rings;i++)for(let j=0;j<segs;j++){const rr=P.R*i/rings,a=j/segs*Math.PI*2,[x,z]=clampR(P.x+Math.cos(a)*rr,P.z+Math.sin(a)*rr),h=mountainH(x,z);
   const sl=Math.hypot(mountainH(x+.3,z)-h,mountainH(x,z+.3)-h)/.3;rk.push(Math.min(1,Math.max(0,(sl-.45)*1.8+(h-P.H*.35)*.22)));sn.push(Math.min(1,Math.max(0,(h-P.H*.5)/(P.H*.14)))*(sl>1.6?.55:1));
   c.setRGB(1,1,1).multiplyScalar(.92+.16*Math.sin(x*2.1+z*1.7));if(brookDist(x,z,P)<.7)c.multiplyScalar(.8);col.push(c.r,c.g,c.b);pos.push(x,L+h+(i===rings?-.06:.02),z);uvs.push(x/4,z/4)}
  for(let i=0;i<rings;i++)for(let j=0;j<segs;j++){const a=i*segs+j,b=i*segs+(j+1)%segs,c2=(i+1)*segs+j,d=(i+1)*segs+(j+1)%segs;idx.push(a,c2,b,b,c2,d)}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));g.setAttribute('rocky',new T.Float32BufferAttribute(rk,1));g.setAttribute('snow',new T.Float32BufferAttribute(sn,1));g.setIndex(idx);g.computeVertexNormals();
  const hill=new T.Mesh(g,HL.hillMat);hill.receiveShadow=hill.castShadow=true;scene.add(hill);
  let cs=Math.round(P.x*31-P.z*17)&0xffff|1;const cr=()=>(cs=(cs*16807)%2147483647)/2147483647;
  for(let k=0,made=0;k<200&&made<9;k++){const a=cr()*6.28,rr=1.5+cr()*(P.R-2),[x,z]=clampR(P.x+Math.cos(a)*rr,P.z+Math.sin(a)*rr),h=mountainH(x,z),sl=Math.hypot(mountainH(x+.3,z)-h,mountainH(x,z+.3)-h)/.3;
   if(sl<.85||brookDist(x,z,P)<1.6||Math.hypot(x-I.x,z-I.z)>I.r-1.5)continue;made++;const sc=.8+cr()*1.1;HL.placeCrag(x,z,sc,sc*(.8+cr()*.6),L,cr(),cr(),cr())}
  for(let k=0,made=0;k<120&&made<8;k++){const a=cr()*6.28,rr=P.R*(.45+cr()*.5),[x,z]=clampR(P.x+Math.cos(a)*rr,P.z+Math.sin(a)*rr),h=mountainH(x,z);
   if(brookDist(x,z,P)<1.4||h>P.H*.55||Math.hypot(x-I.x,z-I.z)>I.r-2)continue;made++;const t=3.5+cr()*3,lo=Math.min(h,...[0,1.57,3.14,4.71].map(a=>mountainH(x+Math.cos(a)*.32,z+Math.sin(a)*.32)));pine(x,z,t,lo-.12);solids.add({x,z,r:.43,base:h-.2,top:h+t});solids.add({x,z,r:t*.23,base:h+t*.4,top:h+t})}
  const B=P.brook,bp=[],bu=[],bi=[];let run=0;const steps=48;
  for(let i=0;i<=steps;i++){const f=i/steps*(B.length-1),k=Math.min(B.length-2,Math.floor(f)),u=f-k,x=B[k][0]+(B[k+1][0]-B[k][0])*u,z=B[k][1]+(B[k+1][1]-B[k][1])*u;
   const [nx,nz]=brookN(B,f),wd=(.3+.38*i/steps)*1.35;if(i)run+=Math.hypot(x-bp[bp.length-6],z-bp[bp.length-4]);
   for(const s of [-1,1]){const px=x+nx*wd*s,pz=z+nz*wd*s;bp.push(px,L+Math.max(mountainH(px,pz),mountainH(x,z))+.07,pz);bu.push((s+1)/2,run/3)}
   if(i){const n=i*2;bi.push(n-2,n-1,n,n,n-1,n+1)}}
  const bg=new T.BufferGeometry();bg.setAttribute('position',new T.Float32BufferAttribute(bp,3));bg.setAttribute('uv',new T.Float32BufferAttribute(bu,2));bg.setIndex(bi);bg.computeVertexNormals();
  const stream=new T.Mesh(bg,brookMaterial(run/3));stream.material.uniforms.time=cascadeUniforms.time;stream.renderOrder=2;scene.add(stream);torrents.push(stream);
  liftOff=true;wetStones(B,(x,z)=>L+mountainH(x,z),.38);liftOff=false;brookBed(B,(x,z)=>L+mountainH(x,z),t=>(.3+.38*t)*1.35,48);
  const [ex,ez]=B[B.length-1],ang=Math.atan2(ex-I.x,ez-I.z),ox=Math.sin(ang),oz=Math.cos(ang),fallH=I.r*.8+10;
  for(const [wd,off,op,sd] of [[2.2,.25,.95,1],[3.2,.5,.45,3],[1.2,.35,.75,5]]){const fall=new T.Mesh(fallGeo(wd,fallH,sd),cascadeMaterial(0xd5ecf3,op,sd===1?1:0));fall.material.uniforms.time=cascadeUniforms.time;fall.position.set(ex+ox*off,L-fallH/2+.12,ez+oz*off);fall.rotation.y=ang;fall.renderOrder=3;scene.add(fall)}
  mist(ex+ox*1.2,L-fallH+2,ez+oz*1.2,8);mist(ex+ox*.6,L+.4,ez+oz*.6,2);
  // Springs should not inherit the river's animated UV offset (PR #8). Share image pixels, not texture transforms.
  const poolMaterial=HL.flow.clone();poolMaterial.map=HL.flow.map.clone();poolMaterial.map.repeat.set(1,1);
  const pool=new T.Mesh(new T.CircleGeometry(1,24),poolMaterial);pool.rotation.x=-Math.PI/2;pool.position.set(B[0][0],L+mountainH(B[0][0],B[0][1])+.1,B[0][1]);scene.add(pool);
  liftOff=true;for(let k=0;k<6;k++){const a=k*1.05,x=B[0][0]+Math.cos(a)*1.2,z=B[0][1]+Math.sin(a)*1.2;shape(stoneGeo,0x8f8a7e,x,L+mountainH(x,z)+.15,z,.42,.33,.38,a)}liftOff=false}
  const sourceMaterial=flow.clone();sourceMaterial.map=flow.map.clone();sourceMaterial.map.repeat.set(1,1);
  const pool=new T.Mesh(new T.CircleGeometry(1.1,24),sourceMaterial);pool.rotation.x=-Math.PI/2;pool.position.set(brook[0][0],mountainH(brook[0][0],brook[0][1])+.1,brook[0][1]);scene.add(pool);
  for(let k=0;k<6;k++){const a=k*1.05,x=brook[0][0]+Math.cos(a)*1.3,z=brook[0][1]+Math.sin(a)*1.3;shape(stoneGeo,0x8f8a7e,x,mountainH(x,z)+.15,z,.45,.35,.4,a)}
 }
 // ---- Cable car from the summit down to the Bloesemvallei (runs once the harbour bridge is repaired).
 // Two stations with a big bull wheel, a timber pylon on a floating rock halfway, two sagging cables
 // and a closed cabin with windows hanging from a trolley.
 const cableA={x:peak.x+.2,y:0,z:peak.z-1.6},cableB={x:14,y:0,z:-46.2};cableA.y=mountainH(cableA.x,cableA.z)-.05;
 const pylon={x:22.6,y:2.4,z:-26.9,h:7.6};
 {const keep=seed;island(pylon.x,pylon.z,3.4,0x9cca75,9,pylon.y);seed=keep}
 const lineDir=Math.atan2(cableB.x-cableA.x,cableB.z-cableA.z);
 function cableStation(st,face){const g=group(st.x,st.y,st.z);g.rotation.y=face;const P=(geo,color,x,y,z,sx,sy,sz,ry=0,rz=0,rx=0)=>shape(geo,color,x,y,z,sx,sy,sz,ry,rz,rx,g);
  P(masonry,0xcfc1a8,0,.25,0,4.6,.5,4.2);P(planks,0xb08d67,0,.53,0,4.4,.08,4.0);
  for(const sx of [-1,1])for(const sz of [-1.85,0,1.85])P(beam,oak,sx*2.05,2.8,sz,.22,4.6,.22);
  for(const sx of [-1,1])P(beam,oak,sx*2.05,5.1,0,.26,.26,4.2);for(const sz of [-1.85,1.85])P(beam,oak,0,5.1,sz,4.4,.26,.26);
  P(plasterBox,0xf3e4cc,0,2.8,-1.95,4.1,4.6,.18);P(glass,0xffffff,-1,2.6,-1.85,.8,.9,.04);P(glass,0xffffff,1,2.6,-1.85,.8,.9,.04);
  for(const s of [-1,1])P(tiles,0xffffff,s*1.2,5.75,0,2.7,.16,4.9,0,s*-.48);P(ridge,0xc98a64,0,6.32,0,.12,4.9,.12,0,0,Math.PI/2);
  // closed plaster gable over the back wall, an open timber truss over the front
  {const tri=infill([[-2.18,0],[2.18,0],[0,1.16]]);P(tri,0xf3e4cc,0,5.1,-1.95);
   // half-timbering on the back wall: sill, rail, posts and braces
   for(const y of [.62,2.85,5.05])P(beam,oak,0,y,-2.06,4.2,.16,.12);for(const x of [-1.5,0,1.5])P(beam,oak,x,2.85,-2.06,.14,4.45,.12);
   for(const s of [-1,1]){P(beam,oak,s*.75,1.74,-2.06,1.85,.12,.1,0,s*.98);P(beam,oak,s*.75,3.95,-2.06,1.85,.12,.1,0,-s*.98)}
   for(const zz of [-2.06,1.85]){P(beam,oak,0,5.62,zz,.16,1.0,.16);for(const s of [-1,1])P(beam,oak,s*1.08,5.66,zz,2.5,.14,.14,0,s*-.48)}}
  P(wheel,iron,0,4.95,-1.1,.62,.62,1.3,0,0,Math.PI/2);for(let k=0;k<3;k++)P(beam,iron,0,4.95,-1.1,1.2,.05,.05,k*Math.PI/3);P(cyl,iron,0,5.15,-1.1,.1,.5,.1);
  P(cube,0x5a4a3a,1.68,1.1,-1.3,.62,1.1,.8);P(wheel,iron,1.68,1.4,-.88,.26,.26,.4);
  for(const sx of [-1,1]){for(const px of [1.45,2.0])P(beam,oak,sx*px,1.05,2.0,.08,1,.08);P(beam,oak,sx*1.72,1.5,2.0,.62,.07,.07)}
  lantern(st.x+Math.cos(face)*1.7,st.y+3.7,st.z-Math.sin(face)*1.7);
  solids.add({x:st.x,z:st.z,w:2.3,d:2.1,base:st.y-.6,top:st.y+.57});
  // the timber posts and the plaster back wall are solid; the front stays open as the boarding side
  const W=(lx,lz)=>({x:st.x+Math.cos(face)*lx+Math.sin(face)*lz,z:st.z-Math.sin(face)*lx+Math.cos(face)*lz});
  for(const sx of [-1,1])for(const sz of [-1.85,0,1.85])solids.add({...W(sx*2.05,sz),r:.2,base:st.y+.5,top:st.y+5.2});
  for(let k=-2;k<=2;k++)solids.add({...W(k*.88,-1.95),r:.5,base:st.y+.5,top:st.y+5.2});return g}
 const stationA=cableStation(cableA,lineDir),stationB=cableStation(cableB,lineDir+Math.PI);
 // timber pylon beside the line: the cabin hangs 1 to 4 m under the cable, so a tower right under the cable would stand
 // in its way. The tower stands 2.6 m to the side and carries the two sheaves on a cross arm above the cable.
 {const g=group(pylon.x,pylon.y,pylon.z);g.rotation.y=lineDir;const P=(geo,color,x,y,z,sx,sy,sz,ry=0,rz=0,rx=0)=>shape(geo,color,x,y,z,sx,sy,sz,ry,rz,rx,g);
  const OX=2.6,TH=pylon.h+1.35;
  for(const sx of [-1,1])for(const sz of [-1,1])P(beam,oak,OX+sx*.7,TH/2,sz*.7,.24,TH+.2,.24,0,-sx*.06,sz*.06);
  for(let k=1;k<5;k++){const y=k*TH/5,w=1.4-k*.16;for(const sz of [-1,1])P(beam,oak,OX,y,sz*w/2,w+.2,.12,.12);for(const sx of [-1,1])P(beam,oak,OX+sx*w/2,y,0,.12,.12,w+.2)}
  for(const sz of [-1,1])for(let k=0;k<4;k++)P(beam,oak,OX,(k+.5)*TH/5,sz*(.7-k*.08),1.6-k*.2,.08,.08,0,(k%2?1:-1)*.9);
  // cross arm over the line, a diagonal brace under it, and the sheaves hanging from the arm on short iron straps
  P(beam,oak,(OX-1.1)/2+.25,TH+.1,0,OX+1.5,.3,.3);P(beam,oak,OX*.55,TH-.75,0,1.9,.18,.18,0,0,.62);
  for(const sx of [-.45,.45]){P(beam,iron,sx,pylon.h+.98,0,.06,.95,.06);P(wheel,iron,sx,pylon.h+.45,0,.3,.3,.4,Math.PI/2)}
  solids.add({x:pylon.x+Math.cos(lineDir)*OX,z:pylon.z-Math.sin(lineDir)*OX,r:1.1,base:pylon.y,top:pylon.y+TH+.3})}
 const cableTop=st=>({x:st.x,y:st.y+liftAt(st.x,st.z)+4.62,z:st.z});
 const supports=[cableTop(cableA),{x:pylon.x,y:pylon.y+pylon.h+.45,z:pylon.z},cableTop(cableB)];
 const spanLen=[Math.hypot(supports[1].x-supports[0].x,supports[1].z-supports[0].z),Math.hypot(supports[2].x-supports[1].x,supports[2].z-supports[1].z)],total=spanLen[0]+spanLen[1];
 function cableAt(f){let d=f*total,i=d<spanLen[0]?0:1;if(i)d-=spanLen[0];const u=d/spanLen[i],a=supports[i],b=supports[i+1],sag=Math.sin(u*Math.PI)*spanLen[i]*.045;
  return new T.Vector3(a.x+(b.x-a.x)*u,a.y+(b.y-a.y)*u-sag,a.z+(b.z-a.z)*u)}
 for(const [off,rad] of [[-.45,.045],[.45,.03]]){const vs=[];for(let i=0;i<=90;i++){const v=cableAt(i/90);vs.push(new T.Vector3(v.x+off*Math.cos(lineDir),v.y,v.z-off*Math.sin(lineDir)))}
  scene.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(vs),180,rad,5),new T.MeshStandardMaterial({color:0x34302c,metalness:.7,roughness:.45})))}
 // the cabin
 const gondola=new T.Group();scene.add(gondola);
 {const frameM=new T.MeshStandardMaterial({color:0x2f4a48,roughness:.6,metalness:.2}),glassM=new T.MeshStandardMaterial({color:0xbfd8de,transparent:true,opacity:.28,roughness:.05,metalness:.2,depthWrite:false}),floorM=new T.MeshStandardMaterial({map:loadSurface('board.jpg'),roughness:.9}),metal=new T.MeshStandardMaterial({color:0x3a3a3c,metalness:.8,roughness:.4});
  const add=(geo,mat,x,y,z,sx=1,sy=1,sz=1,rx=0,ry=0,rz=0)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.rotation.set(rx,ry,rz);m.castShadow=true;gondola.add(m);return m};
  // roomy cabin: 2.3 x 2.5 m and 3.1 m inside, so the explorer stands in it with headroom
  const B=new T.BoxGeometry(1,1,1),y0=-4.1,W=2.3,D=2.5,H=3.1;
  add(B,floorM,0,y0,0,W,.12,D);add(B,frameM,0,y0+H,0,W+.16,.14,D+.16);add(new T.CylinderGeometry(.22,1.62,.48,4,1),frameM,0,y0+H+.3,0,1,1,1.08,0,Math.PI/4,0);
  for(const sx of [-1,1])for(const sz of [-1,1])add(B,frameM,sx*W/2,y0+H/2,sz*D/2,.1,H,.1);
  for(const sx of [-1,1]){add(B,frameM,sx*W/2,y0+.5,0,.06,.92,D);add(B,frameM,sx*W/2,y0+.98,0,.08,.08,D);add(B,glassM,sx*(W/2+.01),y0+1.98,0,.02,1.9,D-.12);add(B,frameM,sx*W/2,y0+2.95,0,.08,.08,D)}
  for(const sz of [-1,1]){add(B,frameM,0,y0+.5,sz*D/2,W,.92,.06);add(B,frameM,0,y0+.98,sz*D/2,W,.08,.08);add(B,glassM,0,y0+1.98,sz*(D/2+.01),W-.12,1.9,.02);add(B,frameM,0,y0+2.95,sz*D/2,W,.08,.08)}
  add(B,new T.MeshStandardMaterial({color:0xd9a441,roughness:.5}),0,y0+.72,D/2+.04,W*.7,.12,.02);
  add(B,metal,0,-.42,0,.12,.36,.12);add(B,metal,0,-.3,0,.1,.1,.9);for(const z of [-.4,.4])add(new T.TorusGeometry(.16,.05,6,12),metal,0,0,z,1,1,1,0,Math.PI/2,0);
  add(B,metal,0,-.15,0,.16,.32,1.0)}
 gondola.userData.f=0;
 hut(-10,5,5,0,true);workshop(-15,-3,4,false);workshop(11,7,4.7,true);tradeSign(-12.38,3.55,7.17,0,'KAARTEN','kaart');tradeSign(-13.12,3.0,-1.24,0,'TIMMERMAN','zaag');tradeSign(13.27,2.95,9.06,0,'SMID','smid');{// Bram's canopy: a plank roof on two posts over the workbench and the door, sloping away from the wall
  const fx=-15.1,fz=-1.26;shape(planks,0x9c7a58,fx,3.0,fz+.95,3.2,.07,2.0,0,0,.24);shape(beam,oak,fx,2.62,fz+1.85,3.3,.16,.16);for(const s2 of [-1,1]){shape(beam,oak,fx+s2*1.48,1.31,fz+1.85,.16,2.62,.16);shape(beam,oak,fx+s2*1.48,2.78,fz+1.25,.1,.1,1.3,0,0,-.62);solids.add({x:fx+s2*1.48,z:fz+1.85,r:.13,base:0,top:2.7})}}mill(-9,-11);pennants(0,4,10);airship(14,32,-15);
 hut(12,-60,5,1,true);tradeSign(9.62,3.55,-57.83,0,'KWEKER','plant');pennants(0,-58,9);mill(-12,-68,true);
 tradingPost(13,-6.36);manor(-13,-52.94);
 for(let i=0;i<30;i++){let s=i%2?1:-1,x=s*(48+rnd()*88),z=32-rnd()*205,r=4+rnd()*12,h=-6+rnd()*15;while(extraIslands.some(E=>Math.hypot(x-E.x,z-E.z)<E.r+r+9))x+=s*24;island(x,z,r,land[i%3],r*.85,h);for(let j=0;j<3;j++)pine(x+rnd()*r*.6,z+rnd()*r*.55,3+rnd()*4,h)}
 let farmRotor=null,craneHook=null,signalFire=null,millDebris=null;const appleTrees=[];
 // ---- The new islands. Own random stream and a saved seed, so every earlier placement stays where it was.
 {const keep=seed,R=Nature.rng(5150),pick2=(a,b)=>a+R()*(b-a);
  // forest and island trails: the walkable corridor (trails, 1.35) is unchanged, the worn core is a little narrower
  function ribbon(pts,y,kind,w=1.35){pathStrip(pts.map(([x,z],i)=>[x,z,w*(.92+.08*Math.sin(i*1.7))]),y+.058,kind)}
  function trail(I,ctrl){const c=new T.CatmullRomCurve3(ctrl.map(([x,z])=>new T.Vector3(x,0,z))),pts=c.getSpacedPoints(Math.ceil(c.getLength()/1.1)).map(q=>[q.x,q.z]);pts.forEach(([x,z])=>trails.push([x,z,1.35]));ribbon(pts,I.lift,islandPathKind[I.kind]||'gravel',I.kind==='forest'?1.15:1.35)}
  for(const c of connectors)ribbon(c.pts,c.y,lanePathKind[c.k]);
  const clear=[],free=(I,x,z,m)=>Math.hypot(x-I.x,z-I.z)<I.r-1.6-m&&!clear.some(([a,b,r])=>Math.hypot(x-a,z-b)<r+m)&&!nearTrail(x,z,m+.4);
  const keepOut=(x,z,r)=>clear.push([x,z,r]),g0=I=>[I.gate.x+(I.x-I.gate.x)/I.r*.4,I.gate.z+(I.z-I.gate.z)/I.r*.4];
  for(const pl of housePlots)keepOut(pl.x,pl.z,Math.hypot(pl.width,pl.depth)/2+.4);
  function scatter(I,n,make){let made=0,tries=0;while(made<n&&tries++<n*30){const a=R()*6.283,d=Math.sqrt(R())*(I.r-1.5),x=I.x+Math.cos(a)*d,z=I.z+Math.sin(a)*d;if(make(x,z,a))made++}}
  const tree=(I,h0,h1,blossom)=>scatter(I,1,(x,z)=>{const h=pick2(h0,h1);if(!free(I,x,z,blossom?2.2:1.3))return false;blossom?cherry(x,z,h):pine(x,z,h);solids.add({x,z,r:.43,base:0,top:h});solids.add({x,z,r:blossom?2.4:h*.23,base:h*.4,top:h});keepOut(x,z,blossom?2.2:1.1);return true});
  const boulder=(I,col,s0,s1)=>scatter(I,1,(x,z,a)=>{const s=pick2(s0,s1);if(!free(I,x,z,s*.8))return false;shape(stoneGeo,col,x,s*.3,z,s,s*.72,s*.94,a*3);rockAt(x,z,s*.8);solids.add({x,z,r:s*.8,base:0,top:s*.95});keepOut(x,z,s);return true});
  const tufts=(I,n)=>scatter(I,n,(x,z,a)=>{if(!free(I,x,z,.3))return false;grove('meadow',x,z,.42+.3*Math.sin(a*7)**2,0,.77);return true});
  function waterfall(I,a,h){const x=I.x+Math.cos(a)*(I.r+.15),z=I.z+Math.sin(a)*(I.r+.15),ry=Math.atan2(Math.cos(a),Math.sin(a));
   for(let j=0;j<2;j++){const f=new T.Mesh(new T.PlaneGeometry(1.6,h*2,1,1),water);f.position.set(x+Math.cos(a+1.57)*j*.6,-h+I.lift,z+Math.sin(a+1.57)*j*.6);f.rotation.y=ry;scene.add(f);falls.push([f,-h+I.lift])}
   mist(x,I.lift-h*2+1.5,z,6)}
  function bench(x,z,ry){if(scanReady){scanProp('long_table',x,0,z,ry,[.95,.84,.72]);solids.add({x,z,r:.75,base:0,top:.5});return}const c=Math.cos(ry),s=Math.sin(ry);for(const o of [-.75,.75])shape(beam,0xffffff,x+o*c,.25,z-o*s,.08,.5,.42,ry);shape(beam,0xffffff,x,.52,z,1.8,.08,.46,ry);shape(beam,0xffffff,x+.2*s,.85,z+.2*c,1.8,.32,.06,ry);solids.add({x,z,r:.75,base:0,top:.9})}
  for(const I of extraIslands){islands.push(I);island(I.x,I.z,I.r,I.land,I.r*.95,I.lift)}
  const [den,farm,quarry,peakI]=extraIslands;
  for(const P of [{x:-76,z:4,R:11,H:11,I:den,brook:[[-75.2,5.4],[-76.5,8],[-78,10.6],[-79.6,13],[-81.2,15.2],[-82.3,16.5]]},
   {x:-70,z:-71,R:8.5,H:8.5,I:farm,brook:[[-71.2,-71.8],[-72.8,-73.6],[-74,-75.1],[-75.1,-76]]},
   {x:56,z:-65,R:9,H:10,I:quarry,brook:[[56.6,-63.6],[57.2,-61.4],[57.6,-59.4],[57.9,-57.9]]},
   {x:71,z:-132,R:7.5,H:9,I:peakI,brook:[[70.2,-130.4],[70.4,-125.6],[71.4,-121.6],[72.4,-117.8],[72.9,-116.6]]}]){peaks.push(P);keepOut(P.x,P.z,P.R+.5);P.brook.forEach(([bx,bz])=>keepOut(bx,bz,1.6))}
  peaks.slice(1).forEach(P=>highland(P));
  extraIslands.forEach(I=>{const b=bridges.find(q=>q.to===I);I.gate={x:b.bx,z:b.bz}});
  const nodeSpots=[[-52,14,'hout'],[-67,13,'hout'],[-71.5,-7,'hout'],[-52,-3,'steen'],[-58,-69,'hout'],[-63,-70,'steen'],[62,-86,'steen'],[52,-90,'steen'],[64,-74,'steen'],[60,-121,'steen'],[49,-134,'hout']];
  nodeSpots.forEach(([x,z])=>keepOut(x,z,2.6));

  // Dennenhoek: a dense pine wood with a woodcutter's camp in a clearing.
  trail(den,[g0(den),[-47,4.6],[-53,5.6],[-59,6.6],[-63.2,2.6],[-64.6,.5]]);
  keepOut(-59,7,4.6);
  // Gerrit's forester's house: the scanned stone-and-timber house (DoniTodorov, CC BY 4.0). At 1.77x its arched door is
  // as tall as the other doors (2.95), so the players (2.57) fit it as they would a real door. The gable with the door
  // faces the camp, the front pillars stand where the old hut's door was. The baked door leaf hangs on its own hinge.
  {const GX=-64.6,GS=1.77,GZ=-.25-3.48*GS;keepOut(GX,GZ,7.8);
   if(scanReady){const hg=group(GX,0,GZ);hg.rotation.y=-Math.PI/2;
    Models.load('sf_house').then(r=>{const m=new T.Mesh(r.geometry,r.material);m.scale.setScalar(GS);m.castShadow=m.receiveShadow=true;hg.add(m)}).catch(e=>console.warn('house',e));
    const pivot=new T.Group();pivot.position.set(2.8*GS,0,-.69*GS);hg.add(pivot);
    Models.load('sf_house_door').then(r=>{const m=new T.Mesh(r.geometry,r.material);m.scale.setScalar(GS);m.position.set(-2.8*GS,0,.69*GS);m.castShadow=m.receiveShadow=true;pivot.add(m)}).catch(e=>console.warn('door',e));
    doors.push({pivot,ry:0,open:0,x:GX,z:GZ+2.8*GS,parent:hg,out:true});
    // walls and roof; between the front pillars the doorway stays open up to the door leaf
    solids.add({x:GX,z:GZ-.34*GS,w:2.55*GS,d:3.14*GS,base:0,top:6.9*GS});for(const k of [-1,1])solids.add({x:GX+k*1.65*GS,z:GZ+3.14*GS,w:.9*GS,d:.34*GS,base:0,top:6.9*GS});
    {const sp=group(GX+2.2,0,1.1);const post=new T.Mesh(cube,mats.get(oak)||new T.MeshStandardMaterial({color:oak,roughness:.85}));post.scale.set(.14,2.6,.14);post.position.y=1.3;post.castShadow=true;sp.add(post);tradeSign(GX+2.2,2.55,1.1-.07,Math.PI/2,'HOUTVESTER','bijl');solids.add({x:GX+2.2,z:1.1,r:.12,base:0,top:2.6})}
    scanProp('wine_barrel',GX-3.4,0,.5,1.2,1.02);solids.add({x:GX-3.4,z:.5,r:.36,base:0,top:.86});
    scanProp('settle',GX+3.5,0,.55,0,1);solids.add({x:GX+3.5,z:.55,w:.62,d:.2,base:0,top:.5})}
   else hut(GX,-2.4,5,2)}
  {const lx=-56,lz=10.5;for(let i=0;i<4;i++)shape(cyl,0x92583f,lx,.22,lz-.6+i*.4,.2,2.6,.2,0,Math.PI/2);for(let i=0;i<3;i++)shape(cyl,0x92583f,lx,.56,lz-.4+i*.4,.2,2.6,.2,0,Math.PI/2);for(let i=0;i<2;i++)shape(cyl,0x92583f,lx,.9,lz-.2+i*.4,.2,2.6,.2,0,Math.PI/2);
   solids.add({x:lx,z:lz,w:1.4,d:.9,base:0,top:1.1});keepOut(lx,lz,1.8);if(scanReady){scanProp('sf_ladder',lx+1.9,0,lz+1.5,-.5,1);solids.add({x:lx+1.9,z:lz+1.5,r:.55,base:0,top:1.85});keepOut(lx+1.9,lz+1.5,1)}}
  {const sx=-63.4,sz=9.4;for(const o of [-.7,.7])for(const k of [-1,1])shape(beam,0xffffff,sx+o,.45,sz,.08,1.05,.08,0,0,k*.5);shape(cyl,0x92583f,sx,.8,sz,.22,2.2,.22,0,Math.PI/2);solids.add({x:sx,z:sz,w:1.2,d:.4,base:0,top:1});keepOut(sx,sz,1.6);
   shape(cyl,0x92583f,-61.6,.3,12,.42,.6,.42);shape(beam,0x4a3426,-61.5,.85,12,.05,.6,.05,0,.4);shape(cube,0x8a9397,-61.3,1.08,12,.06,.22,.3,0,.4);solids.add({x:-61.6,z:12,r:.45,base:0,top:.6});keepOut(-61.6,12,1)}
  lamp(-55.8,4.1,0,null,1);solids.add({x:-55.8,z:4.1,r:.22,base:0,top:3.2});keepOut(-55.8,4.1,.8);
  // ---- Level 3 · De vergeten wachttoren. The castle ruin in the south of Dennenhoek is restored in five stages
  // (ConstructionCampaign): survey stakes and a plan table, cleared rubble, rebuilt walls with battlements, a wooden
  // stair up the tower and a roofed lookout. Every stage shows its own parts; collision follows what is built.
  if(scanReady){const RX=-54,RZ=-10.5,L=liftAt(RX,RZ),TX=RX-3.2,TZ=RZ-2.6;keepOut(RX,RZ,6.6);
   const mat=(name,rep)=>{const map=Models.texture(name+'_diff.jpg',true),nor=Models.texture(name+'_nor.jpg');return new T.MeshStandardMaterial({map,normalMap:nor,roughness:.92,color:rep})};
   const wallMat=mat('wallslate',0xd9d4cc),brickMat=mat('brickruin',0xe6dcd2),woodMat=new T.MeshStandardMaterial({map:oakMap,roughness:.85,color:0xc9a77f}),darkMat=new T.MeshStandardMaterial({color:0x14110e,roughness:1});
   const MAT={stone:wallMat,brick:brickMat,wood:woodMat,dark:darkMat};
   for(const k of Object.keys(towerShow)){const g=new T.Group();scene.add(g);towerGroups[k]=g}const always=new T.Group();scene.add(always);
   const solid=(part,o)=>solids.add(part?{...o,when:towerWhen(part)}:o);
   const kits={},kit=(part,m)=>((kits[part]??={})[m]??=[]);
   // a box in ruin coordinates with world-scaled box-projected UVs, merged per stage and material
   function box(part,m,w,h,d,x,y,z,ry=0,rz=0,rx=0){const g=new T.BoxGeometry(w,h,d),q=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;
    for(let i=0;i<q.count;i++){const X=q.getX(i),Y=q.getY(i),Z=q.getZ(i),ax=Math.abs(n.getX(i)),ay=Math.abs(n.getY(i));uv.setXY(i,((ax>.5?Z:X)+x*.37+z*.21)/2.4,((ay>.5?Z:Y)+y)/2.4)}
    g.applyMatrix4(new T.Matrix4().compose(new T.Vector3(RX+x,L+y,RZ+z),new T.Quaternion().setFromEuler(new T.Euler(rx,ry,rz)),new T.Vector3(1,1,1)));kit(part,m).push({geo:g,color:0xffffff})}
   function flushKits(){for(const [part,mats] of Object.entries(kits))for(const [m,list] of Object.entries(mats)){const mesh=new T.Mesh(Nature.merge(list),MAT[m]);mesh.castShadow=mesh.receiveShadow=true;towerGroups[part].add(mesh)}}
   // a wall with a broken, uneven top (ruin)
   function broken(part,x,z,w,h,d,jag,material,seed){const g=new T.BoxGeometry(w,h,d,Math.max(1,Math.round(w/.45)),1,Math.max(1,Math.round(d/.45)));const q=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;
    for(let i=0;i<q.count;i++){if(q.getY(i)>h/2-.01){const X=q.getX(i),Z=q.getZ(i),k=.5+.5*Math.sin(X*2.3+Z*1.7+seed)*Math.cos(X*.9-Z*2.1+seed*2);q.setY(i,h/2-jag*k*(.6+.4*Math.abs(Math.sin((X+Z)*.7+seed))))}}
    // texture coordinates after the top is broken, so the stone courses keep their size instead of squeezing into waves
    for(let i=0;i<q.count;i++){const X=q.getX(i),Y=q.getY(i),Z=q.getZ(i),ax=Math.abs(n.getX(i)),ay=Math.abs(n.getY(i));uv.setXY(i,(ax>.5?Z:X)/2.4,(ay>.5?Z:Y+h/2)/2.4)}
    g.computeVertexNormals();const m=new T.Mesh(g,material);m.position.set(RX+x,L+h/2,RZ+z);m.castShadow=m.receiveShadow=true;(part?towerGroups[part]:always).add(m);wallSolids(part,x,z,w,d,h-jag*.5);return m}
   function wallSolids(part,x,z,w,d,top){const len=Math.max(w,d),along=w>=d;for(let t=-len/2+.4;t<=len/2-.3;t+=.8)solid(part,{x:RX+x+(along?t:0),z:RZ+z+(along?0:t),r:Math.min(w,d)/2+.02,base:0,top})}
   // a straight wall with a wall-walk parapet and merlons (restored)
   function battlement(part,x,z,w,h,d){box(part,'stone',w,h,d,x,h/2,z);const along=w>=d,len=along?w:d,n=Math.max(1,Math.floor(len/.9));
    const th=along?d:w;for(let i=0;i<n;i++){const t=-len/2+(i+.5)*len/n;if(i%2)continue;box(part,'stone',along?len/n*.92:th+.04,.6,along?th+.04:len/n*.92,x+(along?t:0),h+.3,z+(along?0:t))}
    box(part,'stone',w+(along?.06:.14),.1,d+(along?.14:.06),x,h-.02,z);wallSolids(part,x,z,w,d,h)}
   function ring(r0,r1,h,seg=28){const shp=new T.Shape();shp.absarc(0,0,r1,0,Math.PI*2,false);const hole=new T.Path();hole.absarc(0,0,r0,0,Math.PI*2,true);shp.holes.push(hole);
    const g=new T.ExtrudeGeometry(shp,{depth:h,bevelEnabled:false,curveSegments:seg,steps:4});g.rotateX(-Math.PI/2);const q=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;
    for(let i=0;i<q.count;i++){const x=q.getX(i),y=q.getY(i),z=q.getZ(i),a=Math.atan2(z,x);if(Math.abs(n.getY(i))>.5)uv.setXY(i,x/2.4,z/2.4);else uv.setXY(i,a*r1/2.4,y/2.4)}return g}

   // RUIN (stages 0-2): a broken round tower, crumbling fieldstone walls and a brick gateway stump
   {const g=ring(1.45,2.05,6.4),q=g.attributes.position;for(let i=0;i<q.count;i++){const y=q.getY(i);if(y>4.79){const a=Math.atan2(q.getZ(i),q.getX(i)),k=.5+.5*Math.sin(a*3+.7)+.3*Math.sin(a*7),cut=6.4-2.1*Math.max(0,Math.min(1.2,k));q.setY(i,y>6.39?cut:Math.min(y,cut-.3))}}
    {const n=g.attributes.normal,uv=g.attributes.uv;for(let i=0;i<q.count;i++)if(Math.abs(n.getY(i))<=.5)uv.setY(i,q.getY(i)/2.4)}
    g.computeVertexNormals();const m=new T.Mesh(g,wallMat);m.position.set(TX,L,TZ);m.castShadow=m.receiveShadow=true;towerGroups.ruin.add(m);solid('ruin',{x:TX,z:TZ,r:2.1,base:0,top:5})}
   broken('ruin',-3.75,1.1,.9,3.4,4.4,1.1,wallMat,1);broken('ruin',.55,-3.45,6.2,4.2,.9,1.6,wallMat,2);broken('ruin',3.95,-1.1,.9,1.7,3.4,.9,wallMat,3);broken('ruin',-2.6,3.0,1.6,1.1,.85,.6,wallMat,4);
   broken('ruin',-.95,2.8,1.0,4.1,1.0,.35,brickMat,5);broken('ruin',2.15,2.8,1.0,4.6,1.0,.5,brickMat,6);broken('ruin',.6,2.8,2.1,.75,1.0,.25,brickMat,7).position.y=L+3.62;
   // the old door and the statue stay through every stage
   {const into=g=>m=>{if(m){m.removeFromParent();g.add(m)}};scanProp('castle_door',RX+.6,0,RZ+2.85,0,[1.03,1.0,1.0])?.then?.(into(towerGroups.ruin));solid('ruin',{x:RX+.6,z:RZ+2.85,w:1.05,d:.2,base:0,top:3});scanProp('castle_door',RX-.38,0,RZ+1.78,-Math.PI/2,[1.03,1.0,1.0])?.then?.(into(towerGroups.restored));solid('restored',{x:RX-.38,z:RZ+1.78,w:.12,d:1.05,base:0,top:3})}
   broken(null,.6,-1.2,1.15,.7,1.15,0,brickMat,8);scanProp('statue',RX+.6,.7,RZ-1.2,.3,1.08);solid(null,{x:RX+.6,z:RZ-1.2,r:.75,base:0,top:2.6});
   // rubble where the walls came down (gone once the site is cleared)
   Promise.all(['stone_a','stone_b','stone_c'].map(Models.load)).then(rocks=>[[3.4,1.3,.55],[4.4,.6,.4],[3.0,2.2,.35],[-1.6,-3.0,.45],[1.8,-2.5,.5],[-3.9,3.8,.42],[-4.7,-.6,.6],[2.9,-4.4,.38],[4.6,-2.9,.5],[-.9,-4.4,.36],[2.2,-1.9,.3],[1.2,1.8,.32]].forEach(([x,z,s3],i)=>{
    const r=rocks[i%3],m=new T.Mesh(r.geometry,r.material);m.position.set(RX+x,L+s3*.25,RZ+z);m.scale.set(s3*1.1,s3*.8,s3);m.rotation.y=x*z;m.castShadow=m.receiveShadow=true;towerGroups.rubble.add(m)})).catch(()=>{});
   for(const [x,z,s3] of [[3.4,1.3,.55],[4.4,.6,.4],[-1.6,-3.0,.45],[1.8,-2.5,.5],[-3.9,3.8,.42],[-4.7,-.6,.6],[2.9,-4.4,.38],[4.6,-2.9,.5]])solid('rubble',{x:RX+x,z:RZ+z,r:s3*.8,base:0,top:s3*.7});

   // SURVEY (stage 1): stakes with marking tape around the ruin and Linde's plan on a little table
   {const stakes=[[-6.2,4.8],[5.2,4.8],[5.2,-5.2],[-1.0,-5.2],[-6.2,-1.0]];stakes.forEach(([x,z])=>{box('survey','wood',.07,1.15,.07,x,.57,z);box('survey','dark',.1,.06,.1,x,1.12,z)});
    for(let i=0;i<stakes.length;i++){const [x0,z0]=stakes[i],[x1,z1]=stakes[(i+1)%stakes.length],len=Math.hypot(x1-x0,z1-z0),ry=-Math.atan2(z1-z0,x1-x0);
     for(let k=0;k<Math.floor(len/.5);k++){const t=(k+.5)/Math.floor(len/.5);box('survey',k%2?'dark':'brick',len/Math.floor(len/.5)*.98,.05,.012,x0+(x1-x0)*t,.95,z0+(z1-z0)*t,ry)}}
    const c=document.createElement('canvas');c.width=256;c.height=192;const d=c.getContext('2d');d.fillStyle='#e8d9b5';d.fillRect(0,0,256,192);for(let i=0;i<900;i++){d.fillStyle=`rgba(120,90,50,${Math.random()*.08})`;d.fillRect(Math.random()*256,Math.random()*192,3,3)}
    d.strokeStyle='#4a3524';d.lineWidth=3;d.beginPath();d.arc(70,120,34,0,7);d.stroke();d.strokeRect(70,40,150,110);d.setLineDash([6,5]);d.strokeStyle='#8c2f28';d.beginPath();d.moveTo(104,150);d.lineTo(220,150);d.lineTo(220,40);d.stroke();d.setLineDash([]);d.fillStyle='#4a3524';d.font='bold 18px serif';d.fillText('Wachttoren',120,30);
    const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const plan=new T.Mesh(new T.PlaneGeometry(.62,.46),new T.MeshStandardMaterial({map:tex,roughness:1}));plan.rotation.set(-Math.PI/2,0,.25);plan.position.set(RX+2.6,L+.555,RZ+5.4);towerGroups.survey.add(plan);
    scanProp('small_table',RX+2.6,0,RZ+5.4,.25,[1,1,1.25]).then?.(m=>{if(m){m.removeFromParent();towerGroups.survey.add(m)}});solid('survey',{x:RX+2.6,z:RZ+5.4,r:.55,base:0,top:.55})}

   // CLEARED (stage 2): the usable stone is stacked neatly, fresh timber waits by the gate
   for(let k=0;k<3;k++)for(let j=0;j<2;j++)for(let i=0;i<3;i++)if(!(k===2&&i===2))box('cleared','stone',.62,.38,.44,5.6+i*.66,.19+k*.39,1.2+j*.48,(i+k)*.04);
   for(let k=0;k<3;k++)for(let i=0;i<3-k;i++)box('cleared','wood',.24,.24,3.2,5.8+i*.27+k*.135,.12+k*.22,-2.2);
   solid('cleared',{x:RX+6.26,z:RZ+1.44,w:1.1,d:.55,base:0,top:1.17});solid('cleared',{x:RX+6.1,z:RZ-2.2,w:.45,d:1.65,base:0,top:.62});
   scanProp('sf_ladder',RX+5.2,0,RZ+3.3,.5,1)?.then?.(m=>{if(m){m.removeFromParent();towerGroups.cleared.add(m)}});solid('cleared',{x:RX+5.2,z:RZ+3.3,r:.55,base:0,top:1.85});

   // RESTORED (stage 3+): the round tower rebuilt to full height with a crenellated top, the walls closed
   // and capped with battlements, the gate piers raised into a small gatehouse
   const TOP=6.6,landing=1.62;
   {const m=new T.Mesh(ring(1.45,2.05,TOP),wallMat);m.position.set(TX,L,TZ);m.castShadow=m.receiveShadow=true;towerGroups.restored.add(m);
    const floor=new T.Mesh(new T.CircleGeometry(1.47,28),new T.MeshStandardMaterial({map:(()=>{const t=loadSurface('paving.jpg');t.repeat.set(.8,.8);return t})(),color:0xcfc6b6,roughness:.95}));floor.rotation.x=-Math.PI/2;floor.position.set(TX,L+TOP+.01,TZ);towerGroups.restored.add(floor);
    solid('restored',{x:TX,z:TZ,r:1.95,base:0,top:TOP});
    for(let i=0;i<16;i++){const a=(i+.5)/16*Math.PI*2;if(Math.abs(Math.atan2(Math.sin(a-landing),Math.cos(a-landing)))<.36)continue;const x=Math.cos(a)*1.76-3.2,z=Math.sin(a)*1.76-2.6;
     box('restored','stone',.6,.62,.66,x,TOP+.31,z,-a);if(i%2)box('restored','stone',.6,.55,.66,x,TOP+.9,z,-a);solid('restored',{x:RX+x,z:RZ+z,r:.3,base:TOP,top:TOP+1.2})}
    for(const [a,y] of [[1.2,2.2],[.2,3.9],[2.4,4.1],[3.6,5.6],[5.1,2.8]])box('restored','dark',.16,.85,.3,Math.cos(a)*2.04-3.2,y,Math.sin(a)*2.04-2.6,-a)}
   battlement('restored',-3.75,1.3,.9,4.4,4.0);battlement('restored',.55,-3.45,6.2,4.6,.9);battlement('restored',3.95,-.3,.9,4.6,6.3);battlement('restored',-2.4,2.8,2.0,4.4,.9);battlement('restored',3.15,2.8,.8,4.6,.9);
   for(const x of [-.95,2.15]){box('restored','brick',1.0,5.2,1.0,x,2.6,2.8);solid('restored',{x:RX+x,z:RZ+2.8,w:.55,d:.55,base:0,top:5.2});for(const [dx,dz] of [[-.3,-.3],[.3,.3],[-.3,.3],[.3,-.3]])if((dx+dz)%2===0||dx>0)box('restored','brick',.32,.45,.32,x+dx,5.42,2.8+dz)}
   box('restored','brick',2.2,1.05,1.0,.6,4.1,2.8);box('restored','stone',3.3,.1,1.12,.6,4.66,2.8);

   // SCAFFOLD (stages 3-4): poles and boards on the outside of the tower while the stair goes in
   // scanned timber (Sketchfab "Free Wooden Scaffolding Set", CC-BY): posts, cross braces and decks of three planks
   {const posts=[],planks=[],up=new T.Vector3(0,1,0),M=(px,py,pz,quat,sx,sy,sz)=>new T.Matrix4().compose(new T.Vector3(RX+px,L+py,RZ+pz),quat,new T.Vector3(sx,sy,sz));
    const P=[2.3,3.0,3.7,4.4].map(a=>[Math.cos(a)*2.75-3.2,Math.sin(a)*2.75-2.6]);
    P.forEach(([x,z],i)=>{posts.push(M(x,3.6,z,new T.Quaternion().setFromEuler(new T.Euler(0,i*1.3,0)),.17,7.2,.17));solid('scaffold',{x:RX+x,z:RZ+z,r:.1,base:0,top:7.2})});
    for(let i=0;i<3;i++)[[.3,2.2],[2.2,4.4],[4.4,6.4]].forEach(([y0,y1],k)=>{const [ax,az]=P[i],[bx,bz]=P[i+1],f=(i+k)%2,p0=new T.Vector3(ax,f?y1:y0,az),d=new T.Vector3(bx,f?y0:y1,bz).sub(p0),len=d.length();
     posts.push(M((ax+bx)/2,(y0+y1)/2,(az+bz)/2,new T.Quaternion().setFromUnitVectors(up,d.normalize()),.09,len,.09))});
    for(const y of [2.2,4.4,6.4])for(const a of [2.65,3.35,4.05]){const ry=-a+Math.PI/2,x=Math.cos(a)*2.85-3.2,z=Math.sin(a)*2.85-2.6;
     [-.145,0,.145].forEach((o,k)=>{const j=Math.sin(a*7+y*3+k*2.1);planks.push(M(x+Math.sin(ry)*o,y+.02*j,z+Math.cos(ry)*o,new T.Quaternion().setFromEuler(new T.Euler(0,ry+.03*j,0)),1.95+.12*j,.05,.135))})}
    const inst=(geo,mat,list)=>{const m=new T.InstancedMesh(geo,mat,list.length);list.forEach((q,i)=>m.setMatrixAt(i,q));m.castShadow=m.receiveShadow=true;m.computeBoundingSphere();towerGroups.scaffold.add(m)};
    Promise.all(['sf_scaf_log','sf_scaf_plank'].map(n=>Models.load(n))).then(([lg,pl])=>{inst(lg.geometry,lg.material,posts);inst(pl.geometry,pl.material,planks)})
     .catch(()=>{const b=new T.BoxGeometry();inst(b,woodMat,posts);inst(b,woodMat,planks)});
    // a scanned step ladder (Sketchfab "Old Wooden Ladder", CC-BY) at the foot of the scaffolding
    const into=g=>m=>{if(m){m.removeFromParent();g.add(m)}};scanProp('sf_ladder',RX-5.7,0,RZ+.9,2.1,1)?.then?.(into(towerGroups.scaffold));solid('scaffold',{x:RX-5.7,z:RZ+.9,r:.55,base:0,top:1.85})}

   // STAIRS (stage 4+): a straight timber stair along the inside of the south wall, then a stair that winds
   // up round the tower to a landing through the parapet. Walkable: see tower.stairs below.
   const S1={x0:3.4,x1:.05,z0:-3.0,z1:-2.1,h0:.25,h1:3.4},S2={r0:2.32,r1:3.25,a0:0,a1:landing,h0:3.4,h1:TOP};
   const h1At=x=>S1.h0+(S1.x0-x)/(S1.x0-S1.x1)*(S1.h1-S1.h0),h2At=a=>S2.h0+(a-S2.a0)/(S2.a1-S2.a0)*(S2.h1-S2.h0);
   {const n=14;for(let i=0;i<n;i++){const x=S1.x0-(i+.5)*(S1.x0-S1.x1)/n;box('stairs','wood',.3,.07,.86,x,h1At(x)-.035,(S1.z0+S1.z1)/2)}
    const run=Math.hypot(S1.x0-S1.x1,S1.h1-S1.h0),ang=Math.atan2(S1.h1-S1.h0,S1.x0-S1.x1);for(const z of [S1.z0+.04,S1.z1-.04])box('stairs','wood',run,.24,.07,(S1.x0+S1.x1)/2,(S1.h0+S1.h1)/2-.14,z,0,-ang);
    for(let x=S1.x0-.5;x>S1.x1;x-=1.4){box('stairs','wood',.1,h1At(x),.1,x,h1At(x)/2,S1.z1-.05);box('stairs','wood',.06,1.0,.06,x,h1At(x)+.5,S1.z1-.04)}
    box('stairs','wood',run,.07,.07,(S1.x0+S1.x1)/2,(S1.h0+S1.h1)/2+1.0,S1.z1-.04,0,-ang)}
   {const n=16;for(let i=0;i<n;i++){const a=S2.a0+(i+.5)/n*(S2.a1-S2.a0),r=(S2.r0+S2.r1)/2-.06,x=Math.cos(a)*r-3.2,z=Math.sin(a)*r-2.6;box('stairs','wood',S2.r1-2.06,.08,.36,x,h2At(a)-.04,z,-a)}
    for(let i=0;i<=8;i++){const a=S2.a0+i/8*(S2.a1-S2.a0),x=Math.cos(a)*S2.r1-3.2,z=Math.sin(a)*S2.r1-2.6,h=h2At(a);box('stairs','wood',.1,h,.1,x,h/2,z);box('stairs','wood',.06,1.0,.06,x,h+.5,z);
     if(i<8){const b=S2.a0+(i+1)/8*(S2.a1-S2.a0),x2=Math.cos(b)*S2.r1-3.2,z2=Math.sin(b)*S2.r1-2.6,hb=h2At(b),len=Math.hypot(x2-x,z2-z,hb-h);
      box('stairs','wood',Math.hypot(x2-x,z2-z)+.04,.07,.07,(x+x2)/2,(h+hb)/2+1.0,(z+z2)/2,-Math.atan2(z2-z,x2-x),Math.atan2(hb-h,Math.hypot(x2-x,z2-z)))}}
    const lx=Math.cos(landing)*2.05-3.2,lz=Math.sin(landing)*2.05-2.6;box('stairs','wood',1.9,.1,1.0,lx,TOP-.05,lz,-landing)}

   // ROOF (stage 5): a timber lookout with a conical tiled roof, a flag and the sealed map in a chest
   {const g=towerGroups.roof;for(let i=0;i<6;i++){const a=i/6*Math.PI*2+.26;box('roof','wood',.16,1.95,.16,Math.cos(a)*1.22-3.2,TOP+.97,Math.sin(a)*1.22-2.6)}
    for(let i=0;i<6;i++){const a=(i+.5)/6*Math.PI*2+.26;box('roof','wood',1.3,.16,.16,Math.cos(a)*1.06-3.2,TOP+1.95,Math.sin(a)*1.06-2.6,-a+Math.PI/2)}
    const cone=new T.Mesh(new T.ConeGeometry(2.3,2.0,16,1,true),tiles.userData.surface.clone());cone.material.side=T.DoubleSide;cone.position.set(TX,L+TOP+2.95,TZ);cone.castShadow=true;g.add(cone);
    const pole=new T.Mesh(new T.CylinderGeometry(.035,.045,1.6,8),new T.MeshStandardMaterial({color:0x4a3a2a,roughness:.8}));pole.position.set(TX,L+TOP+4.6,TZ);g.add(pole);
    const fc=document.createElement('canvas');fc.width=128;fc.height=80;const f=fc.getContext('2d');f.fillStyle='#2f5d63';f.fillRect(0,0,128,80);f.fillStyle='#e7c46a';f.beginPath();f.moveTo(40,40);f.lineTo(64,14);f.lineTo(88,40);f.lineTo(64,66);f.fill();
    const ft=new T.CanvasTexture(fc);ft.colorSpace=T.SRGBColorSpace;const flag=new T.Mesh(new T.PlaneGeometry(.95,.6,8,1),new T.MeshStandardMaterial({map:ft,side:T.DoubleSide,roughness:.9}));flag.position.set(TX+.5,L+TOP+5.05,TZ);g.add(flag);towerFlag=flag;
    lantern(TX,L+TOP+1.6,TZ,g);scanProp('chest',TX+.55,TOP,TZ-.35,.6,.9).then?.(m=>{if(m){m.removeFromParent();g.add(m)}});solid('roof',{x:TX+.55,z:TZ-.35,r:.45,base:TOP,top:TOP+.5})}
   flushKits();
   tower={stairs(x,z,s,y){if(towerProgress(s)<4)return -100;const lx=x-RX,lz=z-RZ;let h=-100;
     if(lx<=S1.x0+.15&&lx>=S1.x1-.1&&lz>=S1.z0&&lz<=S1.z1)h=h1At(Math.max(S1.x1,Math.min(S1.x0,lx)));
     const dx=lx+3.2,dz=lz+2.6,r=Math.hypot(dx,dz),a=Math.atan2(dz,dx);if(r>=S2.r0-.1&&r<=S2.r1+.05&&a>=S2.a0-.08&&a<=S2.a1+.12)h=Math.max(h,h2At(Math.max(S2.a0,Math.min(S2.a1,a))));
     if(Math.abs(Math.atan2(Math.sin(a-landing),Math.cos(a-landing)))<.36&&r>=1.4&&r<S2.r0)h=Math.max(h,TOP);
     return h>-50&&y>=L+h-.7?L+h:-100},
    block(x,z,s,y){y-=L;if(towerProgress(s)<4||y<.9)return false;const lx=x-RX,lz=z-RZ,dx=lx+3.2,dz=lz+2.6,r=Math.hypot(dx,dz),a=Math.atan2(dz,dx);
     if(lx<S1.x0-.2&&lx>S1.x1+.9&&lz>S1.z1-.05&&lz<S1.z1+1.2&&y>h1At(lx)-.4)return true;
     if(a>S2.a0+.05&&a<S2.a1&&r>S2.r1-.05&&r<S2.r1+1.4&&y>h2At(a)-.4)return true;return false}};
  }
  for(let i=0;i<26;i++)tree(den,5,10);for(let i=0;i<9;i++)boulder(den,0x8f9184,.7,1.5);tufts(den,60);

  // Molenhoeve: a windmill, a barn, a well and two fenced fields.
  trail(farm,[g0(farm),[-45,-59.2],[-52,-58.6],[-58,-57.2],[-63,-58.8],[-64.6,-61.9]]);
  mill(-68,-62);farmRotor=rotors[rotors.length-1];
  // rubble and broken sail lattice at the foot of the mill, cleared when you mend its foot (level 2, first part)
  millDebris=group(-68,0,-62);for(const [x,z,r,k] of [[2,2.4,.4,1],[-1.4,2.8,1.2,.8],[.9,3.3,2.1,.7],[2.6,1.4,.3,.9]])shape(stoneGeo,0x9d9384,x,.22*k,z,.6*k,.42*k,.5*k,r,0,0,millDebris);
  for(const [x,z,r,t] of [[-.4,3.6,.5,.25],[1.6,3.0,1.9,-.2],[-2.2,2.0,1.1,.35]])shape(cube,0x8a6a48,x,.12,z,.13,.09,2.3,r,t,0,millDebris);solids.add({x:-68,z:-62,r:2.6,base:0,top:9});keepOut(-68,-62,4.2);
  hut(-50,-67,6,1,true);keepOut(-50,-67,4.8);tradeSign(-52.88,3.55,-64.4,0,'BOERDERIJ','boer');if(scanReady){scanProp('sf_ladder',-45.9,0,-64.4,.9,1);solids.add({x:-45.9,z:-64.4,r:.55,base:0,top:1.85});keepOut(-45.9,-64.4,1)}
  {const wx=-62,wz=-54,ring=new T.CylinderGeometry(1,1,1,24,1,true);ring.userData.surface=stoneTri?Object.assign(stoneTri.clone(),{side:T.DoubleSide}):new T.MeshStandardMaterial({map:masonry.userData.surface.map,color:0xd8cfbf,roughness:.95,side:T.DoubleSide});if(stoneTri){ring.userData.surface.onBeforeCompile=stoneTri.onBeforeCompile;ring.userData.surface.customProgramCacheKey=stoneTri.customProgramCacheKey;ring.userData.surface.color.set(0xd8cfbf)}
   // fieldstone well: an open stone ring with a capstone rim, dark water, a timber frame with a shingle roof, a crank, rope and bucket
   shape(ring,0xffffff,wx,.45,wz,.85,.9,.85);shape(ring,0xffffff,wx,.45,wz,.66,.9,.66);shape(new T.TorusGeometry(.76,.11,6,24),0xcfc4b0,wx,.92,wz,1,1,1,0,0,Math.PI/2);shape(cyl,0x1c2a30,wx,.55,wz,.66,.02,.66);
   for(const o of [-.78,.78])shape(beam,0xffffff,wx+o,1.45,wz,.12,1.9,.12);shape(beam,0xffffff,wx,2.36,wz,1.9,.1,.12);
   for(const s of [-1,1])shape(tiles,0xffffff,wx,2.6,wz+s*.4,2.1,.06,.95,0,0,s*.62);shape(beam,0xffffff,wx,2.86,wz,2.15,.08,.08);
   shape(cyl,0x6b4f3a,wx,1.78,wz,.09,1.45,.09,0,0,Math.PI/2);shape(beam,0x3a3a3c,wx+.86,1.7,wz+.12,.04,.04,.3);cord(wx,1.78,wz,wx,1.12,wz,.012,0x8a7350);
   shape(cyl,0x7a5a3c,wx,1.0,wz,.13,.2,.13);shape(new T.TorusGeometry(.13,.012,4,16),0x3a3a3c,wx,1.08,wz,1,1,1,0,0,Math.PI/2);solids.add({x:wx,z:wz,r:.95,base:0,top:2.9});keepOut(wx,wz,1.8)}
  const straw=canvasTex(256,256,c=>{c.fillStyle='#c4a256';c.fillRect(0,0,256,256);for(let i=0;i<1400;i++){const x=Math.random()*256,y=Math.random()*256,l=6+Math.random()*16,a=1.25+Math.random()*.6;c.strokeStyle=['#e3c779','#a8833f','#d6b768','#8f6d33'][i%4];c.lineWidth=.8+Math.random();c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);c.stroke()}});straw.wrapS=straw.wrapT=T.RepeatWrapping;
  const soilMat=triplanar(new T.MeshStandardMaterial({map:loadSurface('path.jpg'),roughness:1}),{scale:1/1.4,moss:0,bounce:0,desat:.25}),soilBox=withSurface(cube.clone(),soilMat),soilRidge=withSurface(cyl.clone(),soilMat);
  const strawMat=new T.MeshStandardMaterial({map:straw,roughness:1}),hayProfile=[[0,0],[1.18,0],[1.38,.18],[1.45,.5],[1.42,.95],[1.36,1.3],[1.25,1.7],[1.08,2.08],[.86,2.42],[.6,2.7],[.34,2.88],[.12,2.98],[0,3.0]],hayGeo=new T.LatheGeometry(hayProfile.map(([r,y])=>new T.Vector2(r,y)),56);
  // (1.23) a hand-built rick: the lathe is roughened with noise (lumps, a slight lean, a ragged skirt) instead of a smooth egg
  {const q=hayGeo.attributes.position;for(let i=0;i<q.count;i++){const x=q.getX(i),y=q.getY(i),z=q.getZ(i),rr=Math.hypot(x,z);if(rr<1e-4)continue;
    const n=fbm3(x*1.7,y*1.9,z*1.7),skirt=y<.25?.06*Math.sin(Math.atan2(z,x)*23):0,k=1+.09*n+skirt+(y<.6?.03:0);q.setXYZ(i,x*k+.05*y,y*(1+.03*n),z*k)}hayGeo.computeVertexNormals()}
  hayGeo.userData.surface=strawMat;
  const baleGeo=new T.CylinderGeometry(1,1,1,28);baleGeo.userData.surface=strawMat;
  const wheatGeo=plantGeo((pos,idx)=>{for(let k=0;k<9;k++){const a=k*2.4,r0=.03+.09*((k*7)%5)/5,x=Math.cos(a)*r0,z=Math.sin(a)*r0,h=.72+.12*((k*3)%4)/3,lean=.05*Math.cos(a*3);
    for(const [ox,oz] of [[.006,0],[0,.006]]){const b=pos.length/3;pos.push(x-ox,0,z-oz,x+ox,0,z+oz,x+lean+ox,h,z+oz,x+lean-ox,h,z-oz);idx.push(b,b+1,b+2,b,b+2,b+3)}
    leafSet(pos,idx,x+lean,h-.03,z,a,1.32,.14,.04)}},new T.MeshStandardMaterial({color:0xffffff,side:T.DoubleSide,roughness:.8}));
  // fruit trees: the same limb structure, low and spreading, with a green crown (1.21.1)
  function appleTree(x,z,h){lastPine=null;appleTrees.push({x,z,h,y:liftAt(x,z)});limbTree(x,z,h,[0x46682c,0x52733a,0x3a5a28],.95,.2);
   for(let k=0;k<12;k++){const a=k*2.4+z,e=.1+(k%4)*.2,r=1.25*Math.cos(e);shape(appleGeo,k%3?0xb3262a:0xc9572c,x+Math.cos(a)*r,h*.62+Math.sin(e)*.8,z+Math.sin(a)*r,.07,.07,.07)}}
  // (1.23) tilled soil (triplanar earth) with rounded ridges; plants stand a little off the line, vary in size and leave gaps
  function field(x0,x1,z0,z1,crop,stone=false,gate=0){const cx=(x0+x1)/2,cz=(z0+z1)/2,gx=cx+gate;shape(soilBox,0xd2bea4,cx,.04,cz,x1-x0,.08,z1-z0);
   for(let z=z0+.5;z<z1-.3;z+=.8){shape(soilRidge,0xe2d0b6,cx,.08,z,.12,x1-x0-.4,.24,0,Math.PI/2);for(let x=x0+.45;x<x1-.3;x+=crop?.42:.7){const j=Math.sin(x*12.9+z*7.3),j2=Math.sin(x*4.1-z*9.7),j3=Math.sin(x*31.7+z*3.3);if(j3>.86)continue;const px=x+j2*.07,pz=z+j*.08,sc=.82+.3*(j2*.5+.5);crop?shape(wheatGeo,j>0?0xd9b862:0xc9a552,px,.16,pz,sc,(.85+.15*j)*sc,sc,j*3):(shape(leafGeo,j>0?0x5d8f4c:0x6b9a52,px,.14,pz,1.7*sc,1.05*sc,1.7*sc,j*3+j2),shape(ball,0x9cc37a,px,.23,pz,.1*sc,.09*sc,.1*sc))}}
   // a scanned dry-stone wall (Sketchfab, CC-BY) around the vegetable plot; post-and-rail fence elsewhere or as fallback
   // both fields have a gate in the side facing the farm path (z0); it stands open, swung into the field
   const fence=()=>{for(let x=x0;x<=x1+.01;x+=2){for(const z of [z0,z1])if(z!==z0||Math.abs(x-gx)>.9)shape(beam,0xffffff,x,.55,z,.1,1.1,.1)}for(let z=z0;z<=z1+.01;z+=2){for(const x of [x0,x1])shape(beam,0xffffff,x,.55,z,.1,1.1,.1)}
    for(const px of [gx-.75,gx+.75])shape(beam,0xffffff,px,.6,z0,.12,1.2,.12);
    for(const y of [.45,.85]){shape(beam,0xffffff,cx,y,z1,x1-x0,.07,.05);for(const [a,b] of [[x0,gx-.75],[gx+.75,x1]])shape(beam,0xffffff,(a+b)/2,y,z0,b-a,.07,.05);for(const x of [x0,x1])shape(beam,0xffffff,x,y,cz,.05,.07,z1-z0)}
    for(const y of [.4,.9])shape(beam,0xffffff,gx-.7,y,z0+.74,.05,.07,1.4);for(let k=0;k<4;k++)shape(beam,0xffffff,gx-.7,.65,z0+.18+k*.38,.05,.62,.07)};
   if(stone&&scanReady){const fi=75*Math.PI/180;scanProp('sf_gate',gx-.715+.715*Math.cos(fi),0,z0+.715*Math.sin(fi),-fi,[1.1,.82,1.1]);solids.add({x:gx-.6,z:z0+.45,r:.14,base:0,top:1.5});solids.add({x:gx-.53,z:z0+.95,r:.14,base:0,top:1.5});for(const sx of [-1,1])shape(masonry,0xcfc5b4,gx+sx*.88,.62,z0,.36,1.24,.5);
    for(const [ax,az,bx,bz,ry] of [[x0,z0,gx-1.3,z0,Math.PI],[gx+1.3,z0,x1,z0,Math.PI],[x0,z1,x1,z1,0],[x0,z0,x0,z1,-Math.PI/2],[x1,z0,x1,z1,Math.PI/2]]){const len=Math.hypot(bx-ax,bz-az)+.5,n=Math.ceil(len/2.4);
     for(let i=0;i<n;i++){const t=(i+.5)/n,j=Math.sin(i*7.1+ax),f=(t*len-.25)/(len-.5);scanProp('sf_drywall',ax+(bx-ax)*f,-.12,az+(bz-az)*f,ry,[len/n/34.5*1.04,.07+.006*j,.048])}}}
   else fence();
   // collision follows the fence or wall only, so you can walk in through the gate and between the crops
   {const gw=stone&&scanReady?.68:.7,th=stone&&scanReady?.3:.1;for(const [a,b] of [[x0-.1,gx-gw],[gx+gw,x1+.1]])solids.add({x:(a+b)/2,z:z0,w:(b-a)/2,d:th,base:0,top:1.1});
    solids.add({x:cx,z:z1,w:(x1-x0)/2+.1,d:th,base:0,top:1.1});for(const x of [x0,x1])solids.add({x,z:cz,w:th,d:(z1-z0)/2+.1,base:0,top:1.1})}
   keepOut(cx,cz,Math.hypot(x1-x0,z1-z0)/2+.6)}
  field(-66,-56,-52,-45,true,false,2.2);field(-53,-46,-53,-47,false,true);
  // farm clutter (scanned): soil and manure sacks, a watering can, a spade, a basket of apples, a tub by the well, a picnic table
  if(scanReady){
   for(const [x,z,ry,dy] of [[-45.3,-52.3,.3,0],[-44.8,-51.6,-.5,0],[-45.05,-51.95,1.3,.38]])scanProp('compost_bag',x,dy,z,ry,1);solids.add({x:-45.05,z:-51.95,r:.7,base:0,top:.8});keepOut(-45.05,-51.95,1.2);
   scanProp('watering_can',-46.9,0,-46.35,.4,1.6);solids.add({x:-46.9,z:-46.35,r:.3,base:0,top:.32});keepOut(-46.9,-46.35,.6);
   scanProp('spade',-55.45,0,-46.2,.9,1);solids.add({x:-55.45,z:-46.2,r:.1,base:0,top:1.1});keepOut(-55.45,-46.2,.5);
   scanProp('basket',-46.6,0,-63.9,.2,1.5);for(let k=0;k<7;k++){const a=k*.9;shape(ball,k%3?0xb3262a:0xc9572c,-46.6+Math.cos(a)*.17,.17+(k%2)*.03,-63.9+Math.sin(a)*.12,.06,.06,.06)}solids.add({x:-46.6,z:-63.9,r:.32,base:0,top:.25});keepOut(-46.6,-63.9,.7);
   scanProp('bucket2',-60.75,0,-55.15,.6,.75);solids.add({x:-60.75,z:-55.15,r:.25,base:0,top:.3});
   scanProp('picnic_table',-60,0,-70,.3,1);solids.add({x:-60,z:-70,r:1.25,base:0,top:.78});keepOut(-60,-70,2);
  }
  {const hx=-44.5,hz=-64.5;shape(hayGeo,0xffffff,hx,0,hz,1,1,1,hx);for(const [y,rr] of [[.62,1.43],[1.5,1.3]])shape(new T.TorusGeometry(rr,.035,5,40),0x6b5636,hx,y,hz,1,1,1,0,0,Math.PI/2);{let hs=91;const hr=()=>(hs=(hs*16807)%2147483647)/2147483647;for(let i=0;i<46;i++){const a=hr()*6.28,d=1.25+hr()*.9;shape(cube,i%3?0xc9a64e:0xb08b3c,hx+Math.cos(a)*d,.02,hz+Math.sin(a)*d,.02,.012,.35+hr()*.3,hr()*3.14)}}solids.add({x:hx,z:hz,r:1.35,base:0,top:2.9});keepOut(hx,hz,2)
   for(let i=0;i<3;i++)shape(baleGeo,0xffffff,-57+i*1.3,.45,-63.6,.45,.9,.45,0,0,Math.PI/2);solids.add({x:-55.7,z:-63.6,w:2,d:.5,base:0,top:.9});keepOut(-55.7,-63.6,2)}
  lamp(-54,-56.6,0,null,1);solids.add({x:-54,z:-56.6,r:.22,base:0,top:3.2});keepOut(-54,-56.6,.8);
  for(let i=0;i<6;i++)scatter(farm,1,(x,z)=>{if(!free(farm,x,z,2.4))return false;const h=4+((x*7+z*3)%1+1)%1*1.2;appleTree(x,z,h);solids.add({x,z,r:.3,base:0,top:h});solids.add({x,z,r:1.7,base:h*.45,top:h*1.1});keepOut(x,z,2.4);return true});for(let i=0;i<8;i++)tree(farm,5,8);for(let i=0;i<6;i++)boulder(farm,0x9d9b84,.6,1.1);tufts(farm,40);

  // Steengroeve: a limestone quarry face, a derrick crane, stacked blocks, a stone shed and a cart.
  trail(quarry,[g0(quarry),[45,-76.5],[51,-79],[55.5,-80.5],[58,-84]]);
  {const cx=55,cz=-87.5;shape(beam,0xffffff,cx,4,cz,.34,8,.34);shape(cyl,iron,cx,.5,cz,.55,.3,.55);cord(cx,1.2,cz,cx+4.6,6.4,cz-1.4,.13,0x7a5a3e);
   cord(cx,7.9,cz,cx+4.6,6.4,cz-1.4,.035,0x3a3a3c);for(const [gx,gz] of [[-3.2,2.6],[-3.4,-2.8],[2.6,3.2]])cord(cx,7.8,cz,cx+gx,.05,cz+gz,.025,0x5a5048);
   craneHook=group(cx+4.6,0,cz-1.4);craneHook.userData={rope:shape(rope,0x3a3a3c,0,3.4,0,.025,5.9,.025,0,0,0,craneHook),block:shape(masonry,0xd5cfc0,0,.4,0,1.1,.8,.8,.3,0,0,craneHook),live:false};shape(cyl,0x3a3a3c,cx+.7,.7,cz,.3,.9,.3,0,Math.PI/2);
   solids.add({x:cx,z:cz,r:.6,base:0,top:8});keepOut(cx,cz,1.6);keepOut(cx+4.6,cz-1.4,1.2)}
  // the quarry face: three cut terraces of pale limestone stepping up towards the rim, rubble at the foot
  {const cliff=withSurface(cube.clone(),stoneTri||new T.MeshStandardMaterial({map:masonry.userData.surface.map,color:0xf4eedf,roughness:.95}));
   for(let tier=0;tier<3;tier++){const d=10.3+tier*2.1,h=1.25+tier*1.3;let k=0;for(let a=-1.2;a<=1.2;a+=.16){k++;const x=quarry.x+Math.cos(a)*d,z=quarry.z+Math.sin(a)*d;if((k+tier*3)%9===0||clear.some(([a2,b2,r2])=>Math.hypot(x-a2,z-b2)<r2+1.1))continue;
     const j=Math.sin(a*23+tier*5),hh=h+.3*j;shape(stoneGeo,0xffffff,x,hh*.42,z,d*.1+.55,hh*.62,1.25,-a-Math.PI/2+j*.3,.05*j,.04*j);solids.add({x,z,r:1.2,base:0,top:hh})}}
   for(let i=0;i<18;i++){const a=-1.2+i*.14,d=9.6+.5*Math.sin(i*3.1),x=quarry.x+Math.cos(a)*d,z=quarry.z+Math.sin(a)*d,s=.35+.3*Math.abs(Math.sin(i*1.7));if(clear.some(([a2,b2,r2])=>Math.hypot(x-a2,z-b2)<r2+.4))continue;shape(stoneGeo,0xffffff,x,s*.3,z,s,s*.7,s,i)}
   keepOut(quarry.x+11,quarry.z,6)}
  workshop(47,-84,4.4,true);keepOut(47,-84,3.8);tradeSign(49.1,2.95,-82.07,0,'STEENHOUWER','steen');
  {const bx=52.8,bz=-84.2;for(let i=0;i<3;i++)for(let j=0;j<2;j++)shape(masonry,0xdad4c4,bx+(i-1)*1.12,.38+j*.76,bz,1.05,.74,.9,.02*Math.sin(i+j*3));shape(masonry,0xdad4c4,bx,1.9,bz,1.05,.74,.9,.2);
   solids.add({x:bx,z:bz,w:1.75,d:.5,base:0,top:2.3});keepOut(bx,bz,2.2)}
  // (1.25) the stone cart: a hand-built two-wheeled cart (crafts.js) loaded with cut blocks and three scanned stones
  {const kx=59.5,kz=-76.5,ry=.5;
   if(typeof Crafts!=='undefined'){const g=group(kx,0,kz),cart=Crafts.stoneCart(),fy=.62;g.rotation.y=ry;g.add(cart);
    const blk=new T.MeshStandardMaterial({map:loadSurface('rock-grey.jpg'),color:0xf2ece0,roughness:.9});for(const [x,z,r,w,h,d] of [[-.42,.16,.12,.5,.27,.34],[.18,-.2,-.1,.42,.24,.3],[-.2,-.18,.5,.36,.22,.28]]){const b=new T.Mesh(cube,blk);b.scale.set(w,h,d);b.position.set(x,fy+h/2+(x>0?0:.002),z);b.rotation.y=r;b.castShadow=b.receiveShadow=true;g.add(b)}
    if(scanReady)Promise.all(['stone_a','stone_b','stone_c'].map(Models.load)).then(rocks=>[[.5,.2,.34,0],[.58,-.18,.3,1],[-.12,.22,.26,2]].forEach(([x,z,size,i],k)=>{const r=rocks[i];r.geometry.computeBoundingBox();const bb=r.geometry.boundingBox,sz=new T.Vector3();bb.getSize(sz);const sc=size/Math.max(sz.x,sz.y,sz.z),m=new T.Mesh(r.geometry,r.material);
     m.scale.setScalar(sc);m.position.set(x,fy-bb.min.y*sc-.01,z);m.rotation.y=k*2.1;m.castShadow=m.receiveShadow=true;g.add(m)})).catch(()=>{});
    solids.add({x:kx,z:kz,r:1.0,base:0,top:1.25});solids.add({x:kx+1.5*Math.cos(ry),z:kz-1.5*Math.sin(ry),r:.45,base:0,top:.65});keepOut(kx,kz,1.8);keepOut(kx+1.5*Math.cos(ry),kz-1.5*Math.sin(ry),1)}
   else{shape(cube,0x5a4632,kx,.75,kz,1.5,.7,.95,ry);for(const o of [-.5,.5])for(const s of [-1,1]){shape(wheel,iron,kx+o*Math.cos(ry)+s*.5*Math.sin(ry),.32,kz-o*Math.sin(ry)+s*.5*Math.cos(ry),.3,.3,.6,ry)}
    for(let i=0;i<4;i++)shape(stoneGeo,0xc4bfb0,kx+(i%2-.5)*.5,1.15,kz+(i>>1)*.4-.2,.32,.24,.3,i);solids.add({x:kx,z:kz,r:1.0,base:0,top:1.3});keepOut(kx,kz,1.6)}}
  lamp(50.5,-77.2,0,null,1);solids.add({x:50.5,z:-77.2,r:.22,base:0,top:3.2});keepOut(50.5,-77.2,.8);
  for(let i=0;i<4;i++)tree(quarry,5,7.5);for(let i=0;i<14;i++)boulder(quarry,0xb9b4a6,.45,1.2);tufts(quarry,24);

  // Valkenrots: a high rock with a domed lookout, a telescope, benches and crags.
  trail(peakI,[g0(peakI),[44,-126.4],[49,-127.2],[53.4,-128]]);
  // A classical rotunda: three stepped stone rings, six fluted columns with moulded bases and capitals,
  // a corniced ring beam, a ribbed copper dome, and balustrades on the four sides without a path.
  {const px=57.2,pz=-128.4,rr=2.5,stone=new T.MeshStandardMaterial({map:loadSurface('rock-grey.jpg'),color:0xf1ebe0,roughness:.62});
   const lathe=(pts,seg,flute)=>{const g=new T.LatheGeometry(pts.map(([r,y])=>new T.Vector2(r,y)),seg);if(flute){const q=g.attributes.position;for(let i=0;i<q.count;i++){const x=q.getX(i),y=q.getY(i),z=q.getZ(i);if(y>flute[0]&&y<flute[1]){const a=Math.atan2(z,x),k=1-.07*Math.pow(.5+.5*Math.cos(a*16),2);q.setX(i,x*k);q.setZ(i,z*k)}}}g.computeVertexNormals();g.userData.surface=stone;return g};
   const H=2.9,column=lathe([[0,0],[.33,0],[.33,.07],[.29,.1],[.3,.16],[.25,.21],[.215,.25],[.215,.3],[.205,1.2],[.19,H-.36],[.185,H-.3],[.2,H-.26],[.215,H-.2],[.25,H-.15],[.3,H-.11],[.31,H-.11],[.31,H],[0,H]],48,[.31,H-.29]);
   const baluster=lathe([[0,0],[.07,0],[.07,.06],[.05,.09],[.085,.26],[.05,.44],[.04,.5],[.06,.54],[.06,.6],[0,.6]],12);
   const ring=(r0,r1,h,seg=56)=>{const g=new T.CylinderGeometry(r1,r0,h,seg);g.userData.surface=stone;return g};
   for(const [r,y,h] of [[rr+1.05,.1,.2],[rr+.8,.3,.2],[rr+.55,.45,.12]])shape(ring(r,r,h),0xd9d1c2,px,y,pz,1,1,1);
   {const floor=new T.CircleGeometry(rr+.5,48);floor.rotateX(-Math.PI/2);floor.userData.surface=new T.MeshStandardMaterial({map:(()=>{const m=loadSurface('paving.jpg');m.repeat.set(1.6,1.6);return m})(),color:0xe0d8c8,roughness:.9});shape(floor,0xffffff,px,.515,pz,1,1,1)}
   for(let k=0;k<6;k++){const a=k*Math.PI/3+.52,cx2=px+Math.cos(a)*rr,cz2=pz+Math.sin(a)*rr;shape(column,0xffffff,cx2,.51,cz2,1,1,1,a);solids.add({x:cx2,z:cz2,r:.3,base:0,top:4})}
   const top=.51+H;shape(ring(rr+.36,rr+.36,.34),0xe9e2d4,px,top+.17,pz,1,1,1);shape(ring(rr+.5,rr+.42,.1),0xdcd3c3,px,top+.39,pz,1,1,1);shape(ring(rr+.42,rr+.36,.08),0xdcd3c3,px,top+.04,pz,1,1,1);
   const dome=new T.SphereGeometry(1,48,16,0,Math.PI*2,0,Math.PI/2);{const q=dome.attributes.position;for(let i=0;i<q.count;i++){const x=q.getX(i),y=q.getY(i),z=q.getZ(i),a=Math.atan2(z,x),k=1+.025*Math.pow(Math.max(0,Math.cos(a*8)),24)*(1-y*.6);q.setX(i,x*k);q.setZ(i,z*k)}dome.computeVertexNormals()}
   dome.userData.surface=new T.MeshStandardMaterial({color:0x6f9f8f,metalness:.45,roughness:.42});shape(dome,0xffffff,px,top+.44,pz,rr+.3,1.8,rr+.3);
   shape(cyl,0xe3d6bd,px,top+2.24,pz,.32,.12,.32);shape(ball,brass,px,top+2.42,pz,.18,.18,.18);shape(cyl,brass,px,top+2.85,pz,.03,.8,.03);
   for(const g of [60,120,240,300]){const a=g*Math.PI/180,bx=px+Math.cos(a)*rr*.866,bz=pz+Math.sin(a)*rr*.866,ry=-a+Math.PI/2,len=rr-.42;
    shape(masonry,0xd9d1c2,bx,.6,bz,len,.12,.3,ry);shape(masonry,0xe5ddd0,bx,1.33,bz,len+.1,.1,.32,ry);
    for(let j=0;j<6;j++){const t=(j+.5)/6-.5,c=Math.cos(ry),s2=Math.sin(ry);shape(baluster,0xffffff,bx+c*t*len,.66,bz-s2*t*len,1,1,1)}
    solids.add({x:bx,z:bz,r:.6,base:0,top:1.4});solids.add({x:bx+Math.cos(ry)*len*.33,z:bz-Math.sin(ry)*len*.33,r:.45,base:0,top:1.4});solids.add({x:bx-Math.cos(ry)*len*.33,z:bz+Math.sin(ry)*len*.33,r:.45,base:0,top:1.4})}
   // (1.25) the lookout's telescope: a brass refractor on an oak tripod (crafts.js) instead of a bare brass cylinder
   if(typeof Crafts!=='undefined'){const g=group(px+.2,.515,pz);g.add(Crafts.telescope(.62));solids.add({x:px+.2,z:pz,r:.42,base:.5,top:1.95})}
   else{shape(cyl,brass,px+.6,1.55,pz,.13,1.6,.13,0,-.75);for(const a of [0,2.1,4.2])cord(px+.2,1.2,pz,px+.2+Math.cos(a)*.55,.5,pz+Math.sin(a)*.55,.025,0x4a3a2a)}
   solids.add({x:px,z:pz,r:rr+1.05,base:0,top:.5});keepOut(px,pz,rr+1.8)}
  // the signal fire: an iron brazier on a stone plinth, lit at the end of level 2
  {const fx=63,fz=-128,bowl=new T.CylinderGeometry(.72,.42,.42,18,1,true);bowl.userData.surface=new T.MeshStandardMaterial({color:0x3a3a3c,side:T.DoubleSide,metalness:.6,roughness:.5});
   const pit=scanReady;if(pit){scanProp('firepit',fx,0,fz,.4,1.05);for(let k=0;k<5;k++){const a=k*1.26;shape(cyl,0x6a4a30,fx+Math.cos(a)*.2,.22,fz+Math.sin(a)*.2,.06,.75,.06,a,1.1)}}
   else{shape(masonry,0xcfc1a8,fx,.45,fz,1.1,.9,1.1);shape(bowl,0xffffff,fx,1.12,fz,1,1,1);for(let k=0;k<3;k++){const a=k*2.09;shape(cyl,0x92583f,fx+Math.cos(a)*.18,1.05,fz+Math.sin(a)*.18,.08,.7,.08,a,.9)}}
   signalFire=group(fx,pit?.12:1.2,fz);const fm=new T.MeshBasicMaterial({color:0xffb347,transparent:true,opacity:.8,blending:T.AdditiveBlending,depthWrite:false});
   for(let k=0;k<4;k++){const f=new T.Mesh(new T.ConeGeometry(.32-k*.05,1.1+k*.25,10,1,true),fm);f.position.set(Math.cos(k*1.7)*.1,.45+k*.12,Math.sin(k*1.7)*.1);signalFire.add(f)}
   const fl=new T.PointLight(0xff9a40,14,26,1.6);fl.position.y=1;signalFire.add(fl);signalFire.visible=false;solids.add({x:fx,z:fz,r:.85,base:0,top:pit?.45:1.6});keepOut(fx,fz,1.8)}
  for(let i=0;i<9;i++){const a=-1.1+i*.27,d=peakI.r-2.2,x=peakI.x+Math.cos(a)*d,z=peakI.z+Math.sin(a)*d,s=1.6+1.1*Math.abs(Math.sin(i*2.7));if(!free(peakI,x,z,0))continue;shape(stoneGeo,0xa7a397,x,s*.5,z,s,s*1.5,s,a);solids.add({x,z,r:s*.8,base:0,top:s*1.6});keepOut(x,z,s)}
  bench(51,-131.2,.3);bench(53.5,-123.4,Math.PI-.2);keepOut(51,-131.2,1.2);keepOut(53.5,-123.4,1.2);
  lamp(46.5,-128.4,0,null,1);solids.add({x:46.5,z:-128.4,r:.22,base:0,top:3.2});keepOut(46.5,-128.4,.8);
  for(let i=0;i<10;i++)tree(peakI,4.5,7);for(let i=0;i<6;i++)boulder(peakI,0xa7a397,.6,1.3);tufts(peakI,30);

  // Distant hamlets floating higher up, each with a cottage and a falling stream.
  function cottage(x,z,y,w){const d=w*.8,hg=w*.7,top=y+.4+hg,rise=w*.42,dk=0xffffff,fz=z+d/2;gableGeo.userData.surface??=plasterBox.userData.surface;
   // half-timbered cottage: stone plinth, framed plaster walls, plastered gables under a tiled roof, a door, framed windows with flower boxes and a chimney
   shape(masonry,0xcfc1a8,x,y+.2,z,w+.25,.4,d+.25);shape(plasterBox,0xf3e4cc,x,y+.4+hg/2,z,w,hg,d);shape(gableGeo,0xf3e4cc,x,top+rise/3,z,w,rise/1.5,d/1.732);
   for(const sz of [-1,1]){for(const sx of [-1,-.33,.33,1])shape(beam,dk,x+sx*w/2,y+.4+hg/2,z+sz*(d/2+.03),.13,hg,.07);for(const yy of [.46,top-y-.05])shape(beam,dk,x,y+yy,z+sz*(d/2+.03),w+.1,.11,.07)}
   for(const s of [-1,1])for(const oz of [-d/2,0,d/2])shape(beam,dk,x+s*(w/2+.03),y+.4+hg/2,z+oz,.07,hg,.12);
   for(const s of [-1,1])shape(tiles,0xffffff,x,top+rise/2,z+s*d*.29,w+.6,.14,d*.68,0,0,s*.7);shape(beam,dk,x,top+rise+.05,z,w+.65,.12,.14);
   shape(cube,0x5d3f2a,x+w*.18,y+.4+.78,fz+.05,.62,1.56,.06);for(const s of [-1,1])shape(beam,dk,x+w*.18+s*.36,y+.4+.8,fz+.07,.09,1.62,.08);
   for(const wx of [x-w*.24,x+w*.42]){if(wx>x+w*.38&&w<3)continue;shape(glass,0xffffff,wx,y+.4+hg*.58,fz+.02,.5,.55,.04);shape(beam,dk,wx,y+.4+hg*.58,fz+.05,.6,.06,.06);shape(beam,dk,wx,y+.4+hg*.58,fz+.05,.06,.65,.06);
    shape(planks,0x7a5536,wx,y+.4+hg*.58-.36,fz+.13,.62,.14,.2);shape(leafGeo,0x4f7d32,wx,y+.4+hg*.58-.3,fz+.13,.8,.8,.8);shape(flowerGeo,[0xe2475b,0xf6c443,0xd45a9b][Math.abs(Math.round(wx))%3],wx,y+.4+hg*.58-.3,fz+.13,.8,.8,.8)}
   shape(masonry,0xcfc1a8,x-w*.3,top+rise*.75,z-d*.15,.45,rise*1.1,.45);shape(masonry,0xb9ae99,x-w*.3,top+rise*1.33,z-d*.15,.55,.12,.55)}
  for(const [x,z,y,r] of [[-112,-30,14,9],[118,-40,18,10],[-96,-150,22,8],[104,-170,12,9],[-130,40,10,8],[96,48,20,8],[0,-205,24,11],[-40,-200,8,7]]){const s=seed;island(x,z,r,land[(x>0)+1],r*1.2,y);seed=s;cottage(x+r*.2,z,y,3.2);for(let j=0;j<3;j++)pine(x-r*.45+j*1.6,z+r*.3-j*.9,4+j,y);
   }
  function decorRope(A,B){const ex=B.x-A.x,ez=B.z-A.z,d=Math.hypot(ex,ez),dx=ex/d,dz=ez/d,a=[A.x+dx*A.r*.97,A.y,A.z+dz*A.r*.97],b=[B.x-dx*B.r*.97,B.y,B.z-dz*B.r*.97],L=Math.hypot(b[0]-a[0],b[2]-a[2]),sag=L*.06,nx=dz,nz=-dx;liftOff=true;
   const at=(t,v,dy)=>{const u=t/L;return [a[0]+dx*t+nx*v,a[1]+(b[1]-a[1])*u-sag*Math.sin(Math.PI*u)+dy,a[2]+dz*t+nz*v]};
   for(let t=.2;t<L;t+=.45){const [x,y,z]=at(t,0,0);shape(planks,0xd8c6a6,x,y,z,1.9,.08,.26,Math.atan2(dx,dz))}
   for(const v of [-.95,.95])for(const dy of [0,1.05]){for(let t=0;t<L-.01;t+=L/12){const p=at(t,v,dy),q=at(Math.min(L,t+L/12),v,dy);cord(p[0],p[1],p[2],q[0],q[1],q[2],.04,0x8f7350)}}liftOff=false}
  const far=[];
  for(const [x,z,y,r,home] of [[-138,-48,17,12,1],[146,-62,21,13,1],[-30,-228,27,12,1],[124,70,22,11,1],[-205,20,45,22,0],[212,-12,55,20,0],[-152,-235,48,24,1],[142,-255,36,26,0],[30,-305,62,30,1],[-62,152,26,22,0],[-230,-120,34,26,1],[235,-150,46,24,0]]){
   const s2=seed;island(x,z,r,land[(x>0)+1],r*1.3,y);seed=s2;far.push({x,z,y,r});for(let j=0;j<Math.round(r/2.2);j++){const a=j*2.4+x,d=r*(.25+.5*((j*7)%5)/5);pine(x+Math.cos(a)*d,z+Math.sin(a)*d,4+(j%4)*1.3,y)}if(home){cottage(x-r*.15,z+r*.1,y,3.4);if(r>20)cottage(x+r*.3,z-r*.25,y,3)}}
  const hamlets=[[-112,-30,14,9],[118,-40,18,10],[0,-205,24,11],[96,48,20,8]].map(([x,z,y,r])=>({x,z,y,r}));
  hamlets.forEach((H,i)=>decorRope(H,far[i]));decorRope(far[2],far[8]);decorRope(far[6],far[10]);
  seed=keep}
 const cloudGeo=new T.PlaneGeometry();
 cloudGeo.userData.surface=new T.MeshBasicMaterial({map:loadSurface('mist.png'),transparent:true,depthWrite:false,side:T.DoubleSide,opacity:.66});
 // 1.22 (PR #16): the mist banks turn to face the camera (so you never see a flat card edge-on) and thin out when you
 // come close, which reads as soft volume instead of paper cut-outs.
 cloudGeo.userData.surface.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying float vNear;').replace('#include <project_vertex>',`
  vec4 mvPosition=vec4(0.,0.,0.,1.);
  #ifdef USE_INSTANCING
   mvPosition=instanceMatrix*mvPosition;vec2 bsz=vec2(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz));
  #else
   vec2 bsz=vec2(1.);
  #endif
  mvPosition=modelViewMatrix*mvPosition;mvPosition.xy+=position.xy*bsz;vNear=smoothstep(10.,38.,-mvPosition.z);gl_Position=projectionMatrix*mvPosition;`);
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying float vNear;').replace('#include <opaque_fragment>','diffuseColor.a*=vNear;\n#include <opaque_fragment>')};
 // Upright mist banks hang well below the islands and never right under one: a bank in front of an island's rock
 // underside looked like a hole in the rock (the "see-through mountains"). Same random sequence as before, so
 // everything placed after this keeps its spot; a bank too close to an island is pushed outward instead.
 for(let i=0;i<100;i++){let x=(rnd()-.5)*310,z=70-rnd()*315,y=-30-rnd()*10;const w=35+rnd()*34,h=9+rnd()*12,ry=(rnd()-.5)*1.4;
  for(const I of islands){const dx=x-I.x,dz=z-I.z,d=Math.hypot(dx,dz)||1,need=I.r+16+w*.3;if(d<need){x=I.x+dx/d*need;z=I.z+dz/d*need}}
  shape(cloudGeo,0xffffff,x,y,z,w,h,1,ry)}
 if(context){const sea=Nature.rng(808),sheet=new T.PlaneGeometry(1,1);sheet.rotateX(-Math.PI/2);
  const cloudFloor=new T.InstancedMesh(sheet,new T.MeshBasicMaterial({map:loadSurface('mist.png'),transparent:true,depthWrite:false,opacity:.9}),90),o=new T.Object3D(),tone=new T.Color();
  for(let i=0;i<90;i++){const s=55+sea()*95;o.position.set((sea()-.5)*380,-15-sea()*13,70-sea()*340);o.rotation.set(0,sea()*6.28,0);o.scale.set(s,1,s*(.5+sea()*.4));o.updateMatrix();cloudFloor.setMatrixAt(i,o.matrix);
   cloudFloor.setColorAt(i,tone.set(0xf6dcc0).lerp(new T.Color(0xb9c8d2),sea()*.8))}
  cloudFloor.renderOrder=-1;scene.add(cloudFloor)}
 const portPads=[];for(let j=0;j<2;j++){let z=j===0?-21:-81;flush();const n0=scene.children.length;shape(cube,wood,0,.04,z,5,.32,5);flush();portPads.push(scene.children.slice(n0));pennants(0,z+1.5,5.5);ports.push(z)}
 // ---- Observatory: a dressed-stone drum with arched windows and a door, a ribbed verdigris dome with an open
 // shutter slit and a brass telescope pointing out of it, a walkway ring, and an armillary sphere in the garden.
 {const ox=-9,oz=-125,R=4.2,drum=new T.CylinderGeometry(1,1,1,40);drum.userData.surface=masonry.userData.surface;
  const domeGeo=new T.SphereGeometry(1,40,16,0,Math.PI*2,0,Math.PI/2);domeGeo.userData.surface=new T.MeshStandardMaterial({color:0x76a594,metalness:.45,roughness:.4});
  const slitGeo=new T.SphereGeometry(1,6,14,Math.PI-.17,.34,0,Math.PI/2);slitGeo.userData.surface=new T.MeshStandardMaterial({color:0x151b20,roughness:.9});
  const rib=new T.TorusGeometry(1,.014,5,48,Math.PI),ring=new T.TorusGeometry(R+.62,.035,5,64),arch=new T.TorusGeometry(.72,.13,6,18,Math.PI);
  shape(drum,0xb9af9d,ox,.35,oz,R+.45,.7,R+.45);shape(drum,0xebe1d1,ox,2.95,oz,R,4.6,R);shape(cyl,0xd9ccb5,ox,5.35,oz,R+.36,.36,R+.36);shape(cyl,0xc9bca5,ox,1.05,oz,R+.06,.16,R+.06);
  shape(domeGeo,0xffffff,ox,5.5,oz,R+.05,R*.92,R+.05);shape(slitGeo,0xffffff,ox,5.5,oz,R+.09,R*.92+.04,R+.09);
  for(let k=0;k<8;k++)shape(rib,0x5a8a7b,ox,5.5,oz,R+.1,R*.92+.05,R+.1,k*Math.PI/8);
  for(const s of [-1,1])shape(rib,0x40695e,ox,5.5,oz,R+.13,R*.92+.08,R+.13,s*.17,0,0);
  shape(ball,brass,ox,5.5+R*.92+.1,oz,.16,.16,.16);
  shape(ring,brass,ox,6.15,oz,1,1,1,0,0,Math.PI/2);for(let k=0;k<20;k++){const a=k*Math.PI/10;shape(cyl,brass,ox+Math.cos(a)*(R+.62),5.85,oz+Math.sin(a)*(R+.62),.035,.62,.035)}
  // telescope: a long brass-banded tube through the slit
  // (1.22) tapered tube with a dew shield and lens, brass bands, a focuser with knobs and an eyepiece, a finder scope,
  // and trunnions on which the tube turns
  {const tx=ox+1.7,ty=7.05,dx=.766,dy=.643,at=(k,o=0)=>[tx+dx*k-dy*o,ty+dy*k+dx*o];
   shape(teleTube,0x2f3a3d,tx,ty,oz,1,4.4,1,0,-.87);{const [x,y]=at(2.4);shape(cyl,0x23292b,x,y,oz,.45,.5,.45,0,-.87)}{const [x,y]=at(2.2);shape(cyl,0x8fb0bf,x,y,oz,.36,.02,.36,0,-.87)}
   for(const k of [-1.9,0,2.1]){const [x,y]=at(k);shape(cyl,brass,x,y,oz,.41,.16,.41,0,-.87)}
   {const [x,y]=at(-2.35);shape(cyl,brass,x,y,oz,.12,.4,.12,0,-.87)}{const [x,y]=at(-2.62);shape(cyl,0x1d1d1f,x,y,oz,.075,.26,.075,0,-.87)}
   {const [x,y]=at(-2.3);shape(cyl,brass,x,y,oz,.035,.46,.035,0,0,Math.PI/2);for(const s2 of [-1,1])shape(ball,brass,x,y,oz+s2*.24,.05,.05,.05)}
   {const [x,y]=at(.6,.52);shape(cyl,0x2f3a3d,x,y,oz,.075,1.3,.075,0,-.87);for(const k of [.2,1.0]){const [a,b]=at(k,.42);shape(cube,brass,a,b,oz,.06,.06,.06)}}
   shape(cyl,brass,tx,ty,oz,.16,.95,.16,0,0,Math.PI/2)}
  // door with a stone arch and steps, arched windows around the drum
  {const dxp=ox+R+.04;shape(cube,0x1a1410,dxp,1.95,oz,.06,2.5,1.3);shape(cube,0x6e4a30,dxp+.04,1.85,oz,.06,2.3,1.16);shape(arch,0xcfc4b0,dxp+.06,3.1,oz,1,1,1,Math.PI/2);
   for(const s of [-1,1])shape(masonry,0xcfc4b0,dxp+.08,1.85,oz+s*.78,.2,2.5,.26);shape(masonry,0xc9bea9,dxp+.55,.12,oz,1,.24,2.2);shape(masonry,0xc9bea9,dxp+.3,.36,oz,.6,.24,1.9);lantern(dxp+.35,3.0,oz+1.15)}
  for(const a of [1.05,2.1,3.14,4.19,5.24]){const c=Math.cos(a),s=Math.sin(a),x=ox+c*(R+.03),z=oz+s*(R+.03),ry=Math.atan2(c,s);shape(glass,0xffffff,x,3.2,z,.62,1.15,.05,ry);shape(new T.TorusGeometry(.38,.07,5,14,Math.PI),0xcfc4b0,x+c*.03,3.78,z+s*.03,1,1,1,ry);shape(masonry,0xcfc4b0,x+c*.05,2.58,z+s*.05,.9,.12,.14,ry)}
  solids.add({x:ox,z:oz,r:R+.5,base:0,top:10.2});
  // armillary sphere on a pedestal
  {const ax=-12,az=-115;shape(cyl,0xd6ccba,ax,.55,az,.36,1.1,.36);shape(cyl,0xd6ccba,ax,1.15,az,.5,.12,.5);
   const proc=()=>{for(const [ry,rx] of [[0,Math.PI/2],[0,0],[Math.PI/2,0],[.4,.9]])shape(wheel,brass,ax,1.95,az,.7,.7,.4,ry,0,rx);shape(cyl,brass,ax,1.95,az,.03,1.9,.03,0,.65);shape(ball,0xd8b45a,ax,1.95,az,.12,.12,.12)};
   if(scanReady)scanProp('sf_armillary',ax,1.21,az,.6,2.9,null,proc);else proc();solids.add({x:ax,z:az,r:.6,base:0,top:2.7})}
 }
 // ---- The star beacon. Since 1.19 the scanned lighthouse "Lighthouse" by Fabio (CC BY 4.0) stands on the octagonal plinth,
 // at 1.35x so its lantern room (14.8 m) towers over the plaza; the star crystal sits in that lantern room. Without scans
 // (or if the model fails to load) the drawn tower of pale dressed stone with copper bands and a verdigris cupola is built.
 // The model has no door: a small stone porch with a 2.95 m door, like the other doors in the world, leads into it.
 const BX=0,BZ=-130,lamp9=liftAt(BX,BZ),LS=1.35,LR=scanReady?1.74:2.05;let beaconAt=null,lightTower=null;
 solids.add({x:BX,z:BZ,r:2.8,base:0,top:scanReady?18:14});
 {const taper=new T.CylinderGeometry(1.45,2.05,1,36);taper.userData.surface=masonry.userData.surface;
  const oct=new T.CylinderGeometry(1,1,1,8);oct.userData.surface=masonry.userData.surface;
  shape(oct,0xc2b7a2,BX,.4,BZ,2.8,.8,2.8,Math.PI/8);
  const drawn=()=>{shape(taper,0xf3ebdc,BX,.8+4.3,BZ,1,8.6,1);
   for(const y of [3.4,6.6])shape(cyl,0x5f8f80,BX,y,BZ,2.05-(y-.8)/8.6*.6+.05,.3,2.05-(y-.8)/8.6*.6+.05);
   for(let k=0;k<16;k++){const a=k*Math.PI/8;shape(cube,0xd9ccb5,BX+Math.cos(a)*1.55,9.05,BZ+Math.sin(a)*1.55,.4,.5,.22,-a)}
   shape(cyl,0xd9ccb5,BX,9.45,BZ,2.3,.3,2.3);shape(new T.TorusGeometry(2.15,.045,5,48),brass,BX,10.5,BZ,1,1,1,0,0,Math.PI/2);shape(new T.TorusGeometry(2.15,.03,5,48),brass,BX,10.05,BZ,1,1,1,0,0,Math.PI/2);
   for(let k=0;k<18;k++){const a=k*Math.PI/9;shape(cyl,0x2f3a3d,BX+Math.cos(a)*2.15,10.05,BZ+Math.sin(a)*2.15,.04,.92,.04)}
   shape(cyl,0x2f3a3d,BX,9.85,BZ,1.32,.5,1.32);for(let k=0;k<8;k++){const a=k*Math.PI/4+Math.PI/8;shape(cube,0x2f3a3d,BX+Math.cos(a)*1.24,11.15,BZ+Math.sin(a)*1.24,.09,2.1,.09)}
   shape(cyl,0x2f3a3d,BX,12.25,BZ,1.38,.14,1.38);
   const cup=new T.SphereGeometry(1,28,10,0,Math.PI*2,0,Math.PI/2);cup.userData.surface=new T.MeshStandardMaterial({color:0x76a594,metalness:.45,roughness:.4});shape(cup,0xffffff,BX,12.3,BZ,1.42,1.05,1.42);
   shape(ball,brass,BX,13.42,BZ,.2,.2,.2);shape(cone,brass,BX,14.05,BZ,.07,1,.07);shape(cube,brass,BX+.25,14.0,BZ,.5,.18,.02);
   for(const [a,y] of [[.6,4.6],[2.4,6.2],[-1.2,7.8],[1.57,7.9]]){const r=2.05-(y-.8)/8.6*.6;shape(glass,0xffffff,BX+Math.sin(a)*(r+.02),y,BZ+Math.cos(a)*(r+.02),.36,.7,.05,a)}
   if(beaconAt)beaconAt(11.15,false)};
  if(scanReady)scanProp('sf_lighthouse',BX,.8,BZ,0,LS,null,drawn)?.then(m=>{if(m)lightTower=m});else drawn();
  // the entrance: a stone porch built against the tower with an arched oak door and a lantern on either side
  const PZ=BZ+LR+.32;
  shape(masonry,0xd8d0c0,BX,.8+1.75,PZ,2.0,3.5,.95);shape(masonry,0xc9bea9,BX,.8+3.6,PZ+.05,2.3,.22,1.15);
  shape(cube,0x1a1410,BX,.8+1.5,PZ+.48,1.3,3.0,.04);shape(cube,0x6e4a30,BX,.8+1.45,PZ+.5,1.15,2.9,.05);
  shape(new T.TorusGeometry(.66,.11,6,16,Math.PI),0xcfc4b0,BX,.8+2.9,PZ+.5,1,1,1);
  shape(masonry,0xc9bea9,BX,.95,PZ+.85,1.7,.3,.7);
  lantern(BX+1.3,3.1,PZ+.62);lantern(BX-1.3,3.1,PZ+.62)}
 const beacon=group(BX,0,BZ);
 const LH=scanReady?.8+10.4*LS:11.15,core=shape(iso,0xffcb61,0,LH,0,scanReady?.42:.5,scanReady?.62:.85,scanReady?.42:.5,0,0,0,beacon);core.material=new T.MeshStandardMaterial({color:0xffdc8a,emissive:0xffb03a,emissiveIntensity:1.1,roughness:.2,metalness:.1});
 const beaconGlass=new T.Mesh(new T.CylinderGeometry(1.2,1.2,2.05,24,1,true),new T.MeshStandardMaterial({color:0xe2f1f3,transparent:true,opacity:.22,roughness:.05,metalness:.3,depthWrite:false,side:T.DoubleSide}));beaconGlass.position.y=LH;beaconGlass.visible=!scanReady;beacon.add(beaconGlass);
 const beaconLight=new T.PointLight(0xffcf7a,3,22,1.6);beaconLight.position.set(0,LH+.05,0);beacon.add(beaconLight);
 const glowTex=(fade)=>canvasTex(64,256,c=>{const gr=c.createLinearGradient(0,0,0,256);fade?(gr.addColorStop(0,'rgba(255,240,200,1)'),gr.addColorStop(1,'rgba(255,240,200,0)')):(gr.addColorStop(0,'rgba(255,240,200,0)'),gr.addColorStop(.8,'rgba(255,240,200,.7)'),gr.addColorStop(1,'rgba(255,240,200,1)'));c.fillStyle=gr;c.fillRect(0,0,64,256)});
 // (1.22) The beams are soft light, not glass: brightest where you look straight into the shaft and fading to nothing
 // at its silhouette, without fog (the fog tint turned a far beam into a flat blue wedge) and without writing alpha, so
 // over the painted sky they add light instead of covering it with an opaque patch.
 const beamMat=fade=>new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.CustomBlending,blendEquation:T.AddEquation,blendSrc:T.SrcAlphaFactor,blendDst:T.OneFactor,blendSrcAlpha:T.ZeroFactor,blendDstAlpha:T.OneFactor,
  uniforms:{fade:{value:fade?1:0}},
  vertexShader:'varying vec2 vUv;varying float vEdge;void main(){vUv=uv;vec4 mv=modelViewMatrix*vec4(position,1.);vec3 n=normalize(normalMatrix*normal);vEdge=abs(dot(n,normalize(-mv.xyz)));gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform float fade;varying vec2 vUv;varying float vEdge;void main(){float v=vUv.y,g=fade>.5?v:(v>.2?.7*(1.-v)/.8:.7+.3*(.2-v)/.2);float a=clamp(max(g,0.)*pow(clamp(vEdge,1e-4,1.),1.8)*.42,0.,1.);gl_FragColor=vec4(1.,.886,.627,a);}'});
 const beaconBeam=new T.Mesh(new T.CylinderGeometry(2.6,.6,70,24,1,true),beamMat(false));beaconBeam.position.set(BX,lamp9+LH+35,BZ);scene.add(beaconBeam);
 const sweep=new T.Group();sweep.position.set(BX,lamp9+LH,BZ);scene.add(sweep);
 // the drawn fallback tower has its lantern room lower: move crystal, glass, light and beams down if it is built after all
 beaconAt=(h)=>{core.position.y=beaconGlass.position.y=h;core.scale.set(.5,.85,.5);beaconGlass.visible=true;beaconLight.position.y=h+.05;beaconBeam.position.y=lamp9+h+35;sweep.position.y=lamp9+h};
 for(const s of [-1,1]){const m=new T.Mesh(new T.CylinderGeometry(.35,3.4,32,20,1,true),beamMat(true));m.rotation.z=s*Math.PI/2;m.position.x=s*16;sweep.add(m)}
 // a round paved plaza with a brass compass rose around the beacon
 {const L=lamp9,pl=new T.Mesh(new T.CircleGeometry(6,48),new T.MeshStandardMaterial({map:(()=>{const m=loadSurface('paving.jpg');m.repeat.set(3,3);return m})(),color:0xd9d0c0,roughness:.95,polygonOffset:true,polygonOffsetFactor:-3}));
  pl.rotation.x=-Math.PI/2;pl.position.set(BX,L+.07,BZ);pl.receiveShadow=true;scene.add(pl);
  shape(new T.TorusGeometry(5.2,.05,4,64),brass,BX,.09,BZ,1,1,1,0,0,Math.PI/2);for(let k=0;k<8;k++)shape(cube,brass,BX,.085,BZ,k%2?.06:.1,.02,k%2?7.4:10.2,k*Math.PI/4)}
 flush();
 const bridgeGroups=[];
 const plank=surfaced(cube.clone(),'board'),ropePlank=surfaced(cube.clone(),'board'),ropeRail=new T.CylinderGeometry(1,1,1,7);
 ropePlank.userData.dress=[['sf_plank_a','sf_plank_b','sf_plank_c','sf_plank_d'],true,0xf2e9dc,1];ropeRail.userData={dress:[['sf_rope'],false,0xeadfca,1]};
 // ---- Bridges: stone abutments with portal pillars and lanterns, a timber deck on steel stringers,
 // riveted Warren trusses with an oak handrail, and a shallow steel arch underneath.
 {const steel=0x47605c,steelDark=0x2e3c3a;
  for(const b of bridges){liftOff=true;rotOrder='YXZ';
   const yaw=Math.atan2(b.dx,b.dz),nx=b.dz,nz=-b.dx,m=(b.yb-b.ya)/b.len,pitch=-Math.atan(m),L=b.len;
   const at=(t,v,dy=0)=>{const tt=Math.max(0,Math.min(L,t));return [b.ax+b.dx*t+nx*v,b.ya+m*tt+dy-b.sag*Math.sin(Math.PI*tt/L),b.az+b.dz*t+nz*v]};
   const box=(geo,color,t,v,dy,sx,sy,sz,tilt=true)=>{const [x,y,z]=at(t,v,dy);shape(geo,color,x,y,z,sx,sy,sz,yaw,0,tilt?pitch:0)};
   const bar=(t1,v1,y1,t2,v2,y2,r,color,geo)=>{const p=at(t1,v1,y1),q=at(t2,v2,y2);cord(p[0],p[1],p[2],q[0],q[1],q[2],r,color,geo)};
   // Built in three parts (1.20): 0 the stone (abutments, pillars, posts), 1 the load-bearing structure, 2 the deck
   // and railings. Each part is flushed into its own batch so a half-built bridge can show what has been laid.
   const parts=[];const cut=()=>{const k=scene.children.length;flush();parts.push(scene.children.slice(k))};flush();
   if(b.rope){const sgd=t=>-b.sag*Math.PI/L*Math.cos(Math.PI*Math.max(0,Math.min(1,t/L)));
    for(const [t,dir] of [[-.55,-1],[L+.55,1]])for(const v of [-1.25,1.25]){const [x,y,z]=at(t,v,0);shape(cyl,0x5a4230,x,y+.8,z,.16,1.8,.16);for(const yy of [.62,1.14])shape(new T.TorusGeometry(.17,.045,5,12),0x9b7b52,x,y+yy,z,1,1,1,0,0,Math.PI/2);
     const [ax2,ay2,az2]=at(t+dir*1.7,v*1.35,-.12);cord(x,y+1.55,z,ax2,ay2,az2,.032,0x9b7b52);lantern(x,y+1.95,z);solids.add({x,z,r:.26,base:-.2,top:2.1,stage:b.stage})}
    cut();
    for(const v of [-1.03,1.03]){for(const dy of [.02,.6,1.12]){const K=Math.ceil(L/1.1);for(let i=0;i<K;i++)bar(i*L/K,v,dy,(i+1)*L/K,v,dy,dy>1?.05:.035,0x9b7b52,ropeRail)}for(let t=0;t<=L+.01;t+=1.1)bar(t,v,.02,t,v,1.12,.022,0x8a6c47)}
    cut();
    const n=Math.ceil((L+2.4)/.33);for(let i=0;i<n;i++){const t=-1.2+(i+.5)*(L+2.4)/n,j=Math.sin(i*12.9);const [x,y,z]=at(t,.03*j,.1);shape(ropePlank,0xe0cfb0,x,y,z,2.15+.12*j,.09,.25,yaw+.035*j,0,(t>0&&t<L)?-Math.atan(m+sgd(t)):0)}
    cut();
   }else{
   const t0=-2.2,t1=L+2.2,n=Math.ceil((t1-t0)/.4);
   // portal pillars with lanterns, and abutments under both ends
   for(const t of [-.45,L+.45])for(const v of [-2.32,2.32]){box(masonry,0xd7ccb7,t,v,1.0,.7,2.1,.7,false);box(masonry,0xe6dcc8,t,v,2.12,.86,.16,.86,false);box(masonry,0xcfc1a8,t,v,.06,.9,.12,.9,false);const [x,y,z]=at(t,v,2.56);lantern(x,y,z);solids.add({x,z,r:.48,base:-.2,top:2.9,stage:b.stage})}
   for(const [t,dir] of [[-.3,-1],[L+.3,1]])[[4.8,.7,1.3,0],[3.9,.9,1.1,.35],[2.8,1.0,.9,.7]].reduce((y,[w2,h2,d2,inset])=>{box(masonry,0xcfc1a8,t+dir*inset,0,y-h2/2,w2,h2,d2,false);return y-h2},-.05);
   cut();
   for(const v of [-1.45,1.45])box(cube,steelDark,L/2,v,-.24,.2,.42,L+1.2);
   for(let t=.8;t<L-.4;t+=1.6)box(cube,steelDark,t,0,-.42,3.3,.14,.16);
   const N=Math.max(4,Math.round(L/2.1)),seg=L/N;
   for(const v of [-1.96,1.96]){box(cube,steel,L/2,v,.14,.16,.24,L+.2);box(cube,steel,L/2,v,1.3,.15,.15,L+.2);
    for(let i=0;i<=N;i++){box(cube,steel,i*seg,v,.72,.14,1.2,.14,false);box(cube,steelDark,i*seg,v,.16,.05,.34,.34,false)}
    for(let i=0;i<N;i++)bar(i*seg,v,i%2?1.25:.22,(i+1)*seg,v,i%2?.22:1.25,.05,steel);
    bar(0,v,.74,L,v,.74,.03,steel)}
   // steel arch with struts underneath
   if(L>9){const K=14,dy=t=>-.6-1.9*(1-Math.sin(Math.PI*Math.max(0,Math.min(1,t/L))));
    for(const v of [-1.45,1.45]){for(let i=0;i<K;i++){const a=.2+(L-.4)*i/K,c=.2+(L-.4)*(i+1)/K;bar(a,v,dy(a),c,v,dy(c),.15,steel)}
     for(let i=1;i<N;i++){const t=i*seg;if(dy(t)<-.75)bar(t,v,dy(t),t,v,-.44,.06,steelDark)}}
    for(let i=1;i<N;i+=2){const t=i*seg;bar(t,-1.45,dy(t),t,1.45,dy(t),.06,steelDark)}}
   cut();
   for(let i=0;i<n;i++){const t=t0+(i+.5)*(t1-t0)/n;box(plank,0xf3e3c9,t,.02*Math.sin(i*7),.055,3.66+.08*Math.sin(i*17),.24,(t1-t0)/n-.025,t>0&&t<L)}
   for(const v of [-1.84,1.84])box(beam,0xffffff,L/2,v,.25,.12,.16,L);
   for(const v of [-1.96,1.96])box(beam,0xffffff,L/2,v,1.42,.22,.09,L+.3);
   // a lantern on a post at mid span on both sides
   for(const v of [-1.96,1.96]){box(cube,steel,L/2,v,1.7,.1,.5,.1,false);const [x,y,z]=at(L/2,v,2.12);lantern(x,y,z)}
   cut();
   }
   liftOff=false;rotOrder='XYZ';
   bridgeGroups.push({stage:b.stage,list:parts.flat(),parts})}}
 // Each door opens into a furnished walkable room in a separate part of the scene.
 // Interior floors: oak boards in the houses, flagstones in the smithy. Every room has its own trade.
 const floorTex=(file,n)=>{const m=loadSurface(file);m.repeat.set(n,n);return m};
 // Interior floors (audit PR #17): staggered oak boards with real joints and large stone flags, each with a normal map
 // for the seams. The old floors reused the shingle-like wall boards and the outdoor crazy paving and read as slate roofs.
 const floorNor=(file,n)=>{const m=floorTex(file,n);m.colorSpace=T.NoColorSpace;return m};
 const oakFloorMat=n=>new T.MeshStandardMaterial({map:floorTex('floor_oak.jpg',n),normalMap:floorNor('floor_oak_nor.jpg',n),normalScale:new T.Vector2(.8,.8),color:0xe8c9a4,roughness:.72});
 const woodFloor=withSurface(cube.clone(),oakFloorMat(3));
 const stoneFloor=withSurface(cube.clone(),new T.MeshStandardMaterial({map:floorTex('floor_flag.jpg',2.2),normalMap:floorNor('floor_flag_nor.jpg',2.2),color:0xe6dccb,roughness:.9}));
 const goods=createGoods();
 let fseed=4021;const frnd=()=>(fseed=(fseed*16807)%2147483647)/2147483647;
 function parchment(kind){const c=document.createElement('canvas');c.width=512;c.height=360;const g=c.getContext('2d');
  const grd=g.createRadialGradient(256,180,40,256,180,330);grd.addColorStop(0,'#eadbb4');grd.addColorStop(1,'#b89a66');g.fillStyle=grd;g.fillRect(0,0,512,360);
  for(let i=0;i<900;i++){g.fillStyle=`rgba(110,80,40,${frnd()*.06})`;g.fillRect(frnd()*512,frnd()*360,1+frnd()*3,1+frnd()*3)}
  g.strokeStyle='rgba(70,48,24,.85)';g.lineWidth=2.2;g.fillStyle='rgba(120,140,90,.35)';
  const isl=kind?[[150,120,60],[330,210,80],[420,90,40],[220,270,45]]:[[256,90,52],[250,190,48],[256,290,50]];
  for(const [x,y,r] of isl){g.beginPath();for(let k=0;k<=24;k++){const a=k/24*6.283,rr=r*(.78+.3*Math.sin(a*3+x)*.6+.12*Math.sin(a*7+y));g.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr*.7)}g.closePath();g.fill();g.stroke()}
  g.setLineDash([6,6]);g.beginPath();g.moveTo(isl[0][0],isl[0][1]);for(const [x,y] of isl.slice(1))g.lineTo(x,y);g.stroke();g.setLineDash([]);
  g.translate(452,300);g.strokeStyle='rgba(70,48,24,.9)';for(let k=0;k<8;k++){g.rotate(Math.PI/4);g.beginPath();g.moveTo(0,0);g.lineTo(0,k%2?-18:-34);g.stroke()}
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t}
 const mapPaper=[0,1].map(k=>new T.MeshStandardMaterial({map:parchment(k),roughness:.95,side:T.DoubleSide}));
 const flame=new T.MeshStandardMaterial({color:0xffd28a,emissive:0xffa040,emissiveIntensity:3});
 const quench=new T.MeshStandardMaterial({color:0x1d2a2c,roughness:.08,metalness:.3});
 const clay=0xa65a38,leatherC=0x5b3b25,ironC=0x3a3a3c,parchC=0xd9c49a,green=0x5c7d3a;
 // Windows look out on the real village: a small camera behind the house renders into the glass.
 const portalTarget=context?new T.WebGLRenderTarget(384,224,{type:T.HalfFloatType}):null,portalCam=new T.PerspectiveCamera(58,384/224,.3,420);
 const portalGlass=new T.MeshBasicMaterial({map:portalTarget?portalTarget.texture:null,color:portalTarget?0xffffff:0x9fb8c0,toneMapped:false});let portalTick=0;
 // The doorway shows the real street in front of the house, so an open door never looks out on nothing.
 const doorTarget=context?new T.WebGLRenderTarget(192,432,{type:T.HalfFloatType}):null,doorCam=new T.PerspectiveCamera(64,192/432*1.55,.3,420);
 const doorView=new T.MeshBasicMaterial({map:doorTarget?doorTarget.texture:null,color:doorTarget?0xffffff:0xa9c3cb,toneMapped:false});
 // Woven rugs: border in the house colour, a band pattern and wool noise.
 // (1.23) every resident has an own rug: diamonds (0), a striped rag rug (1), a medallion (2) or a check (3) in their colours
 function rugMaterial(color,style=0){const c=document.createElement('canvas');c.width=256;c.height=192;const g=c.getContext('2d'),base=new T.Color(color),css=(k,l=0)=>{const q=base.clone().offsetHSL(0,0,l);return `rgb(${Math.min(255,q.r*255*k)|0},${Math.min(255,q.g*255*k)|0},${Math.min(255,q.b*255*k)|0})`};
  g.fillStyle=css(.62);g.fillRect(0,0,256,192);g.fillStyle='#9c8257';g.fillRect(14,14,228,164);g.fillStyle=css(1.0,.06);g.fillRect(20,20,216,152);
  if(style===1){const tones=[css(1.15,.1),'#cdb88a',css(.7),'#6d8a8a','#b5643c',css(1.3,.16),'#e2d2a8'];for(let y=20,k=0;y<172;k++){const h=6+((k*7)%5)*3;g.fillStyle=tones[k%tones.length];g.fillRect(20,y,216,h);y+=h}}
  else if(style===2){g.fillStyle=css(.6);g.beginPath();g.ellipse(128,96,70,46,0,0,7);g.fill();g.fillStyle='#c9a86a';g.beginPath();g.ellipse(128,96,46,28,0,0,7);g.fill();g.fillStyle=css(1.1,.08);g.beginPath();g.ellipse(128,96,26,15,0,0,7);g.fill();for(const [x,y] of [[40,40],[216,40],[40,152],[216,152]]){g.fillStyle='#c9a86a';g.beginPath();g.ellipse(x,y,12,9,0,0,7);g.fill()}}
  else if(style===3){for(let y=20;y<172;y+=19)for(let x=20;x<236;x+=27){if(((x-20)/27+(y-20)/19)%2<1){g.fillStyle=css(.72);g.fillRect(x,y,27,19)}}}
  else for(let y=40;y<150;y+=26){g.fillStyle=css(.62);g.fillRect(30,y,196,6);for(let x=38;x<222;x+=20){g.fillStyle='rgba(214,190,140,.55)';g.beginPath();g.moveTo(x,y+3);g.lineTo(x+5,y-1);g.lineTo(x+10,y+3);g.lineTo(x+5,y+7);g.fill()}}
  for(let i=0;i<5000;i++){g.fillStyle=`rgba(${Math.random()<.5?0:255},${Math.random()<.5?20:240},20,${Math.random()*.06})`;g.fillRect(Math.random()*256,Math.random()*192,1,2)}
  for(let x=0;x<256;x+=4){g.fillStyle='#d8c497';g.fillRect(x,0,2,6);g.fillRect(x,186,2,6)}
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return new T.MeshStandardMaterial({map:t,roughness:1})}
 const rooms=villageHomes.map((house,i)=>{
  const x=410+i*24,z=0,room=group(x,0,z),rects=[],build=(geo,color,x,y,z,w,h,d,ry=0,rz=0,rx=0)=>shape(geo,color,x,y,z,w,h,d,ry,rz,rx,room);
  const solid=(x,z,w,d)=>rects.push({x,z,w,d});
  // a terracotta pot (Poly Haven planter_pot_clay) with soil and a herb; a dried herb bundle on a string
  const potHerb=(x,y,z,s,k)=>{const proc=()=>build(cyl,0xb4673d,x,y+.11*s,z,.13*s,.22*s,.13*s);if(scanReady)scanProp('sf_pot',x,y,z,k*1.7,s,room,proc);else proc();
   build(cyl,0x3b2a1e,x,y+.195*s,z,.112*s,.02,.112*s);mesh(herbGeo,herbMats[k%4],x,y+.2*s,z,s*1.15,s*(1+.25*((k*7)%3)/2),s*1.15,k*1.3)};
  // books standing on the shelves of the scanned bookcase: spines in leather colours, a gap or a leaning book now and then
  const shelfBooks=(cx,y0,cz,sx)=>{for(const [y,hmax] of [[.39,.25],[.67,.25],[.95,.28],[1.27,.34],[1.66,.36]]){let xx=cx-.6*sx;while(xx<cx+.58*sx){const w=.03+frnd()*.04,h=hmax*(.72+frnd()*.28),col=[0x7a2e24,0x2f4a5e,0x5d5a2c,0x6b4a2a,0x3d2f45,0xa08a5c,0x4a3a2a][Math.floor(frnd()*7)];
    if(frnd()<.07){xx+=.1+frnd()*.08;continue}const lean=frnd()<.08?.2:0;build(cube,col,xx+w/2,y0+y+h/2,cz,w,h,.2+frnd()*.05,0,lean);if(frnd()<.5)build(cube,0xc9a24a,xx+w/2,y0+y+h*.82,cz+.105,w*1.02,.012,.012);xx+=w+.006}}};
  const herbBundle=(x,y,z,k)=>{build(cyl,0x8a7350,x,y+.2,z,.008,.4,.008);build(cyl,0x8a6a48,x,y-.005,z,.022,.04,.022);mesh(herbBundleGeo,driedMats[k%4],x,y,z,1,1,1,k*1.1)};
  const mesh=(geo,material,x,y,z,sx=1,sy=1,sz=1,ry=0,rx=0,rz=0)=>{const m=new T.Mesh(geo,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.rotation.set(rx,ry,rz);m.castShadow=m.receiveShadow=true;room.add(m);return m};
  const look={linde:[0x2f6272,2,0xe9e4d4],bram:[0x5d6c37,0,0xf2dcb4],mara:[0x7c2c22,1],tomas:[0x5f7a3a,1,0xe4e7cd],wies:[0x9c4a26,3,0xf4e1c0],vandalen:[0x6c1f2c,2,0xefe0c6],gerrit:[0x8c6a40,3,0xd9c39c],anke:[0xb4583a,1,0xf6ead0],joost:[0x5a5852,0]}[house.key]||[house.color,0,0xf3e6cf];
  const stoneRoom=i===2||house.stone;build(stoneRoom?stoneFloor:woodFloor,0xffffff,0,-.14,0,10,.28,10);
  const wall=stoneRoom?surfaced(cube.clone(),'masonry'):withSurface(cube.clone(),new T.MeshStandardMaterial({map:plasterMap.clone(),color:look[2]||0xf3e6cf,roughness:.95}));wall.userData.surface.map.repeat.set(stoneRoom?4:3,stoneRoom?2:1.4);wall.userData.surface.map.needsUpdate=true;
  const H=house.manor?8.8:4.6;if(house.manor)wall.userData.surface.map.repeat.set(3,2.6);
  build(wall,0xefdfbc,0,H/2,-5,10.3,H,.22);
  for(const side of [-1,1]){
   build(wall,0xe1cfaa,side*5,H/2,0,.22,H,10);
   for(const zz of [-4.8,0,4.8])build(beam,wood,side*4.84,(H-.2)/2,zz,.19,H-.2,.22);
   build(beam,wood,side*4.84,3.55,0,.21,.21,10);
  }
  build(beam,wood,0,3.75,-4.82,10,.21,.20);for(const xx of [-3,0,3])build(beam,wood,xx,4.32,0,.24,.26,10);
  // closed room: front wall with a real door, and a plank ceiling
  for(const side of [-1,1])build(wall,0xe1cfaa,side*2.9,H/2,5,4.4,H,.22);build(wall,0xe1cfaa,0,(H+3.1)/2,5,1.6,H-3.1,.22);
  for(const sx of [-1,1])build(beam,wood,sx*.72,1.5,4.86,.14,3.05,.16);build(beam,wood,0,3.05,4.86,1.6,.18,.17);build(beam,wood,0,3.75,4.82,10,.21,.2);
  const roomDoor=hingedDoor(room,-.625,0,4.92,0,1.25,2.95,0x6e4a30);mesh(new T.PlaneGeometry(1.45,3.1),doorView,0,1.55,5.14,1,1,1,Math.PI);
  build(withSurface(cube.clone(),oakFloorMat(3)),0xffffff,0,H+.12,0,10.3,.18,10.3);
  // window with light coming in
  mesh(new T.PlaneGeometry(2.45,1.45),portalGlass,-2,2.6,-4.87);
  for(const xx of [-3.24,-2,-.76])build(beam,wood,xx,2.6,-4.75,.11,1.58,.12);
  for(const yy of [1.85,2.6,3.35])build(beam,wood,-2,yy,-4.75,2.59,.09,.12);
  build(beam,wood,-2,1.8,-4.66,2.8,.1,.3);
  mesh(new T.PlaneGeometry(3.2,2.4),rugMaterial(look[0],look[1]),.3,.03,.9,1,1,1,0,-Math.PI/2);build(plank,0xefcf94,0,.035,4.05,1.85,.06,.78);
  lantern(0,3.4,-1.2,room);
  const lamp=new T.PointLight(0xffb36a,9,11,1.6);lamp.position.set(0,3.0,-1.2);room.add(lamp);
  const accent=new T.PointLight(0xff8a3a,0,8,1.8);room.add(accent);
  const legs=(cx,cy,cz,w,d,h=cy)=>{for(const sx of [-1,1])for(const sz of [-1,1])build(beam,wood,cx+sx*(w/2-.09),h/2,cz+sz*(d/2-.09),.12,h,.12)};
  const table=(cx,cz,w,d,h=.92,color=0xb88a5a)=>{const proc=()=>{build(beam,color,cx,h,cz,w,.1,d);legs(cx,h,cz,w,d,h-.05)};if(scanReady)scanProp('long_table',cx,0,cz,0,[w/1.8,(h+.05)/.55,d/.66],room,proc);else proc();solid(cx,cz,w,d)};
  const barrel=(cx,cz,h=1,r=.42,top=null)=>{const proc=()=>{build(cyl,0x7a5232,cx,h/2,cz,r,h,r);for(const yy of [.18,.5,.82])build(wheel,ironC,cx,h*yy,cz,r*1.02,r*1.02,r*1.6,0,0,Math.PI/2)};if(scanReady)scanProp('wine_barrel',cx,0,cz,cx*1.3,[r*2/.74,h/.87,r*2/.75],room,proc);else proc();if(top)mesh(cyl,top,cx,h-.04,cz,r*.9,.02,r*.9);solid(cx,cz,r*2,r*2)};
  let stations;
  if(house.key==='linde'){
   table(-1.3,-1.9,2.6,1.5);
   mesh(new T.PlaneGeometry(1.2,.85),mapPaper[0],-1.6,.98,-1.9,1,1,1,.12,-Math.PI/2);mesh(new T.PlaneGeometry(.9,.65),mapPaper[1],-.6,.985,-2.1,1,1,1,-.3,-Math.PI/2);
   build(cyl,0xb48a3c,-.35,1.0,-1.5,.12,.025,.12);build(cyl,0x222020,-2.3,1.02,-1.5,.06,.1,.06);build(cone,0xf4ead6,-2.26,1.12,-1.5,.012,.24,.012,0,.4);
   build(cyl,0xefe6cf,-2.4,1.06,-2.4,.04,.18,.04);mesh(ball,flame,-2.4,1.19,-2.4,.025,.05,.025);
   for(let r=0;r<3;r++)build(cyl,parchC,-2.1+r*.12,1.01,-2.45,.05,.62,.05,0,0,Math.PI/2);
   // bookshelf
   const bx=2.6,bz=-4.55;
   if(scanReady){for(const sx of [-.69,.69]){scanProp('sf_bookshelf',bx+sx,0,bz,0,1,room);shelfBooks(bx+sx,0,bz+.03,1)}}
   else{for(const sx of [-1.4,1.4])build(beam,0x6e4a2e,bx+sx,1.5,bz,.1,3,.5);build(beam,0x6e4a2e,bx,3.0,bz,2.9,.1,.5);build(beam,0x5a3d26,bx,1.5,bz-.24,2.8,3,.04);
    for(let k=0;k<5;k++){const y=.15+k*.68;build(beam,0x6e4a2e,bx,y,bz,2.8,.06,.48);let xx=bx-1.3;while(xx<bx+1.25){const w=.06+frnd()*.07,h=.36+frnd()*.2,col=[0x7a2e24,0x2f4a5e,0x5d5a2c,0x6b4a2a,0x3d2f45,0xa08a5c][Math.floor(frnd()*6)];if(frnd()<.12){xx+=.15;continue}build(cube,col,xx+w/2,y+.03+h/2,bz+.02,w,h,.3,0,frnd()<.1?.18:0);xx+=w+.012}}}
   solid(bx,bz,2.8,.65);
   // globe
   build(cyl,0x6e4a2e,3.8,.4,-1.2,.05,.8,.05);for(const a of [0,2.1,4.2])build(beam,0x6e4a2e,3.8+.22*Math.sin(a),.12,-1.2+.22*Math.cos(a),.05,.08,.4,a);
   const globe=mesh(ball,new T.MeshStandardMaterial({map:mapPaper[1].map,color:0x9fc0c4,roughness:.6}),3.8,1.15,-1.2,.36,.36,.36);build(wheel,0xb48a3c,3.8,1.15,-1.2,.4,.4,.4,0,.4);solid(3.8,-1.2,.8,.8);
   // wall maps, chest, barrel of rolled maps
   mesh(new T.PlaneGeometry(1.6,1.1),mapPaper[1],-4.85,2.4,-2.4,1,1,1,Math.PI/2);mesh(new T.PlaneGeometry(1.3,.95),mapPaper[0],-4.85,2.3,.6,1,1,1,Math.PI/2);
   build(beam,0x6e4a2e,-4.85,2.4,-2.4,.04,1.2,1.7);build(beam,0x6e4a2e,-4.85,2.3,.6,.04,1.05,1.4);
   build(beam,0x7a5232,-4.1,.35,1.9,.66,.7,1.1);for(const zz of [1.5,2.3])build(cube,ironC,-4.1,.35,zz,.7,.72,.05);solid(-4.1,1.9,.75,1.15);
   barrel(-3.9,-3.8,.9,.36);for(let k=0;k<6;k++)build(cyl,parchC,-3.9+(frnd()-.5)*.35,1.05,-3.8+(frnd()-.5)*.35,.05,.8,.05,0,(frnd()-.5)*.3,(frnd()-.5)*.3);
   stations=[{x:-1.3,z:-.8,h:0,clip:'work'},{x:2.4,z:-3.6,h:0,clip:'take'},{x:3.05,z:-.45,face:[3.8,-1.2],clip:'look'},{x:-2,z:-3.9,h:0,clip:'look2'}];
  }
  if(house.key==='bram'){
   table(1.4,-4.25,3.5,1.0,.95,0xa77b4f);build(beam,0x8a6040,1.4,.32,-4.25,3.3,.06,.9);for(let k=0;k<4;k++)build(plank,0xffffff,1.4,.4+k*.07,-4.25,3.1,.06,.25+k*.05);
   build(cube,ironC,-.05,1.12,-4.0,.32,.24,.3);build(cube,ironC,-.05,1.12,-3.78,.1,.1,.3);
   build(cube,0x9a6a40,1.3,1.03,-4.1,.5,.1,.15);build(ball,0x7a4a2a,1.1,1.12,-4.1,.05,.05,.05);build(cube,0x7a4a2a,1.47,1.15,-4.1,.1,.16,.04,0,.35);build(cube,ironC,1.32,1.13,-4.1,.03,.13,.12,0,-.6);
   build(cyl,0x6e4a2e,2.3,1.1,-4.0,.06,.3,.06,0,0,Math.PI/2);build(cube,0x6e4a2e,2.45,1.1,-4.0,.16,.18,.22);
   for(let k=0;k<4;k++)build(cube,ironC,2.7+k*.12,1.02,-4.3,.02,.02,.26);
   build(beam,0x6e4a2e,1.4,2.35,-4.84,3.4,1.4,.06);
   build(sawBlade,0xffffff,.12,2.25,-4.8,1,1,1);build(cube,0x7a4a2a,.04,2.42,-4.78,.18,.26,.04);build(cube,0x2a1c10,.04,2.45,-4.76,.08,.11,.02);
   if(scanReady){scanProp('sf_hammer',.55,.965,-3.85,.7,1.05,room);scanProp('axe',3.05,1.75,-4.74,0,1.05,room)}
   for(let k=0;k<3;k++){build(cyl,0x8a6040,1.4+k*.35,2.25,-4.78,.03,.5,.03);build(cube,ironC,1.4+k*.35,2.52,-4.77,.16,.08,.08)}
   build(cube,ironC,2.6,2.55,-4.78,.04,.5,.02);build(cube,ironC,2.79,2.32,-4.78,.4,.04,.02);
   // plank rack
   for(const zz of [-3,-1.2,.6])build(beam,0x6e4a2e,-4.55,1.4,zz,.12,2.8,.12);
   for(let k=0;k<6;k++)build(plank,0xffffff,-4.42,.35+k*.18+(k>2?.6:0),-1.2,.32,.07,3.7);
   for(let k=0;k<3;k++)build(plank,0xffffff,-4.1+k*.06,1.25,2.2+k*.25,.24,2.5,.06,0,.22);
   solid(-4.35,-1.2,.9,3.9);solid(-4.0,2.4,.6,.9);
   // sawhorses with a board being cut
   for(const zz of [-2.1,-1.1]){for(const sx of [-1,1])build(beam,0x8a6040,-1.8+sx*.28,.4,zz,.08,.85,.08,0,sx*.3);build(beam,0x8a6040,-1.8,.82,zz,.2,.08,.14)}
   build(plank,0xffffff,-1.8,.9,-1.6,.36,.06,2.2);build(cube,0xc8c8c4,-1.55,.97,-1.3,.34,.012,.1);solid(-1.8,-1.6,.9,2.3);
   // offcuts barrel, half-built chair, shavings
   barrel(3.9,-1.1,.8,.38);for(let k=0;k<5;k++)build(plank,0xffffff,3.9+(frnd()-.5)*.3,.95,-1.1+(frnd()-.5)*.3,.08,.55,.08,frnd()*3,(frnd()-.5)*.4);
   build(beam,0xa77b4f,3.6,.48,1.2,.5,.05,.5);for(const sx of [-1,1])for(const sz of [-1,1])build(beam,0xa77b4f,3.6+sx*.2,.24,1.2+sz*.2,.05,.48,.05);build(beam,0xa77b4f,3.6,.8,1.43,.5,.6,.05);solid(3.6,1.2,.6,.6);
   for(let k=0;k<26;k++)build(cube,0xe0c08a,(frnd()-.3)*3.5,.012,-3+frnd()*1.6,.05+frnd()*.08,.01,.02+frnd()*.03,frnd()*3);
   stations=[{x:1.3,z:-3.3,h:0,clip:'work'},{x:-1.8,z:-.35,h:0,clip:'work2'},{x:-3.35,z:-1.1,face:[-4.4,-1.1],clip:'take'},{x:3.0,z:-.3,face:[3.9,-1.1],clip:'look'}];
  }
  if(house.key==='mara'){
   // forge with hood and chimney
   build(masonry,0x9a8a7a,-2.6,.5,-4.2,2.0,1.0,1.4);build(ember,0xffffff,-2.6,1.03,-4.15,1.1,.07,.8);
   for(let k=0;k<14;k++)build(stoneGeo,0x2a2522,-2.6+(frnd()-.5)*1,1.07,-4.15+(frnd()-.5)*.7,.08,.05,.08,frnd()*3);
   build(masonry,0x8c7f72,-2.6,2.55,-4.3,2.2,.9,1.3);build(masonry,0x8c7f72,-2.6,3.55,-4.55,1.0,1.4,.8);
   build(cube,leatherC,-1.25,.72,-4.35,.7,.28,.5,0,.12);build(cube,0x6e4a2e,-.85,.72,-4.35,.4,.05,.12);solid(-2.6,-4.2,2.1,1.5);solid(-1.25,-4.35,.8,.6);
   accent.position.set(-2.6,1.5,-3.6);accent.intensity=7;
   // anvil on a stump
   {const proc=()=>{build(cyl,0x6b4a2e,0,.28,-1.6,.36,.56,.36);mesh(cyl,new T.MeshStandardMaterial({map:loadSurface('sawn-rings.jpg'),roughness:1}),0,.565,-1.6,.35,.01,.35);
    build(cube,ironC,0,.62,-1.6,.22,.12,.3);build(cube,ironC,0,.75,-1.6,.18,.14,.22);build(cube,0x4a4a4e,0,.87,-1.6,.26,.1,.58);build(cone,0x4a4a4e,0,.87,-1.98,.1,.3,.1,0,0,-Math.PI/2);
    build(cyl,0x6e4a2e,.35,.95,-1.45,.025,.36,.025,0,0,Math.PI/2);build(cube,ironC,.53,.95,-1.45,.08,.09,.14)};
    if(scanReady){scanProp('sf_anvil',0,0,-1.6,Math.PI/2,1.08,room,proc);scanProp('sf_hammer',.12,.885,-1.42,2.2,1,room)}else proc();solid(0,-1.6,.85,1.0)}
   // quench barrel, tool rack, bench with work in progress, grindstone, coal
   barrel(-4.0,-2.0,.9,.42,quench);
   build(beam,0x6e4a2e,4.84,2.2,-2.4,.06,1.2,2.4);for(let k=0;k<5;k++){build(cyl,ironC,4.76,2.15,-3.3+k*.45,.02,.8,.02,0,.08);build(cube,ironC,4.76,2.6,-3.3+k*.45,.05,.1,.12)}
   table(3.4,-3.9,2.2,1.0,.9,0x8a6040);for(let k=0;k<4;k++)build(wheel,ironC,2.8+k*.3,.97,-3.8,.1,.1,.1,0,0,Math.PI/2);if(scanReady)scanProp('sf_tongs',3.95,.95,-3.95,1.25,[.36,.36,.36],room);else for(let k=0;k<3;k++)build(cube,0x8b8b8e,3.9+k*.04,.99+k*.06,-4.05,.32,.06,.1);
   {const proc=()=>{build(cyl,0x9e968a,3.9,.62,-.6,.42,.12,.42,0,Math.PI/2);build(beam,0x6e4a2e,3.9,.3,-.6,.2,.6,.6)};if(scanReady)scanProp('sf_grindstone',3.95,0,-.6,0,.75,room,proc);else proc();solid(3.95,-.6,.6,1.0)}
   for(let k=0;k<10;k++)build(stoneGeo,0x1e1c1b,-4.2+frnd()*.6,.08+frnd()*.12,1.4+frnd()*.8,.18,.13,.18,frnd()*3);solid(-3.9,1.8,.8,1.0);
   stations=[{x:0,z:-.72,h:0,clip:'work2'},{x:-2.6,z:-3.05,h:0,clip:'work'},{x:3.3,z:-2.95,h:0,clip:'take'},{x:-3.15,z:-1.25,face:[-4,-2],clip:'look'}];
  }
  if(house.key==='tomas'){
   table(1.2,-4.25,3.2,.9,.9,0x8a6a48);
   for(let k=0;k<7;k++)potHerb(-.1+k*.43,.93,-4.2,.86+.08*(k%2),k);
   build(cyl,0x7d8a86,2.65,1.07,-3.95,.12,.26,.12);build(cyl,0x7d8a86,2.83,1.13,-3.95,.02,.3,.02,0,-1.0);
   for(const yy of [1.1,1.8,2.5]){build(beam,0x6e4a2e,-4.6,yy,-.6,.42,.05,3);for(let k=0;k<7;k++){const zz=-1.9+k*.42;if(frnd()<.25)continue;if(frnd()<.5)build(cyl,0xb7c7b4,-4.6,yy+.15,zz,.1,.26,.1);else build(cube,[0xc9a96a,0x8a5a3a,0xd8c49a][k%3],-4.6,yy+.11,zz,.16,.2,.06)}}
   solid(-4.6,-.6,.55,3.1);
   for(let k=0;k<6;k++)herbBundle(-2.5,3.62,-3.2+k*.55,k);
   build(beam,0x6e4a2e,-2.5,4.05,-1.8,.1,.1,3.6);
   for(const [cx,cz,kind,k] of [[3.9,-.6,'apple',0],[3.9,.6,'cabbage',0]]){build(beam,0x8a6a48,cx,.12,cz,.86,.24,.9);goods.crate(room,cx,.24,cz,kind,k,.8,.8);solid(cx,cz,.9,1.0)}
   goods.sack(room,-3.9,0,2.2,.95);goods.sack(room,-3.35,0,2.65,.85,true);goods.basket(room,-2.8,0,2.1,.9,false);solid(-3.6,2.4,1.4,1.1);
   stations=[{x:1.1,z:-3.35,h:0,clip:'work'},{x:-3.6,z:-.5,face:[-4.6,-.5],clip:'take'},{x:3.05,z:0,face:[3.9,0],clip:'take'},{x:-2.4,z:-2.3,h:0,clip:'look2'}];
  }
  if(house.key==='gerrit'){
   // woodsman's lodge: stone hearth, log rack, workbench with axes, a bunk with a wool blanket
   {const proc=()=>{build(masonry,0xc9bea9,-4.3,1.2,-2.2,.9,2.4,2.3);build(masonry,0xb9ae99,-4.3,2.75,-2.2,.7,.7,1.6);build(cube,0x1b1410,-3.86,.7,-2.2,.06,1.1,1.3);
    for(let k=0;k<3;k++)build(cyl,0x92583f,-4.05,.22+k*.05,-2.5+k*.3,.1,.9,.1,0,Math.PI/2*.9)};
    if(scanReady)scanProp('sf_fireplace',-4.22,0,-2.2,Math.PI/2,.84,room,proc);else proc();mesh(ball,flame,-4.0,.4,-2.2,.26,.3,.2);solid(-4.3,-2.2,1,2.4)}
   for(let r2=0;r2<4;r2++)for(let k=0;k<5-r2%2;k++)build(cyl,0x92583f,4.3,.2+r2*.38,-3.8+k*.42+(r2%2)*.21,.18,1.1,.18,0,0,Math.PI/2);solid(4.3,-3,1.2,2.3);
   table(1.4,-4.1,2.6,.9);build(beam,0x4a3426,.7,1.0,-4.0,.06,.07,.8,0,0,0);build(cube,0x8a9397,.7,1.0,-3.55,.26,.06,.16);build(beam,0x4a3426,1.5,1.0,-4.1,.06,.07,.8);build(cube,0x8a9397,1.5,1.0,-3.65,.3,.06,.2);
   build(cube,0x9aa3a6,2.3,.99,-4.2,.9,.02,.22);for(let k=0;k<6;k++)build(cube,0xd9bc8a,2.0+k*.12,.97,-3.85,.06,.01,.03,k);
   {const bx=-3.2,bz=2.6;for(const sz of [-1,1])build(beam,0x6e4a2e,bx,.34,bz+sz*.5,2.12,.14,.07);for(const [px,ph] of [[-1.06,1.0],[1.06,.66]])for(const sz of [-1,1])build(beam,0x5e3e26,bx+px,ph/2,bz+sz*.5,.09,ph,.09);
    build(planks,0x7a5536,bx-1.06,.72,bz,.05,.5,.95);build(planks,0x7a5536,bx+1.06,.5,bz,.05,.26,.95);for(let k=0;k<6;k++)build(beam,0x8a6a48,bx-.85+k*.34,.39,bz,.07,.03,.96);
    build(cube,0xd8ccae,bx-.02,.5,bz,2.0,.17,.9);build(cube,0x6f4a32,bx+.38,.6,bz,1.26,.05,1.0);for(const sz of [-1,1])build(cube,0x6f4a32,bx+.38,.46,bz+sz*.505,1.26,.28,.02);build(cube,0x8d6a44,bx+.38,.632,bz,1.26,.012,1.01);
    build(ball,0xeee4cc,bx-.72,.62,bz,.3,.08,.38)}if(scanReady)scanProp('pw_chair',-3.25,0,-.55,-Math.PI/2,1,room);solid(-3.2,2.6,2.1,1.0);
   for(const [x2,y2] of [[-1.2,2.4],[-.4,2.3]])build(beam,0x4a3426,x2,y2,-4.86,.07,.9,.05,0,0,.5);
   stations=[{x:1.4,z:-3.25,h:0,clip:'work'},{x:3.4,z:-1.2,face:[4.3,-1.2],clip:'take'},{x:-3.2,z:-.6,face:[-4.3,-2.2],clip:'look2'}];
  }
  if(house.key==='anke'){
   // farm kitchen: long table with bread and cheese, an oven, a butter churn, milk cans, sacks and crates
   if(scanReady){scanProp('pw_table',-2.3,0,-3.7,0,1,room);solid(-2.3,-3.7,2.45,1.0);scanProp('pw_chair',-3.9,0,-3.7,Math.PI/2,1,room);scanProp('pw_chair',-.7,0,-3.65,-Math.PI/2,1,room);solid(-3.9,-3.7,.6,.6);solid(-.7,-3.65,.6,.6)}else table(-2.3,-3.7,2.8,1.0,.9,0x8a6a48);goods.loaf(room,-3.2,.95,-3.7,.6);goods.cheese(room,-2.4,.95,-3.6,.55,true);goods.basket(room,-1.4,.95,-3.75,.7);goods.jar(room,-1.0,.95,-3.4,0,.5);
   // bread oven: a brick dome on a stone base, an arched mouth with embers, the iron door leaning beside it, a flue
   {const os=(g,rx,ry)=>{if(scanReady&&typeof Models!=='undefined'){const [map,nor]=[Models.texture('wallslate_diff.jpg',true).clone(),Models.texture('wallslate_nor.jpg').clone()];for(const t of [map,nor]){t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(rx,ry);t.needsUpdate=true}g.userData={surface:new T.MeshStandardMaterial({map,normalMap:nor,roughness:.92})}}else g.userData={surface:masonry.userData.surface};return g};build(os(cube.clone(),2.4,1.1),0xcfc4b0,3.7,.45,-4.1,1.9,.9,1.2);build(os(ovenDome,3.4,1.2),0xd09a74,3.7,.9,-4.2,.92,.86,.62)}build(halfDisc,0xffffff,3.7,.9,-3.57,.34,.34,1);
   build(wheel,0xb6a48c,3.7,.9,-3.56,.38,.38,.6,0,0,0);mesh(ball,flame,3.7,.96,-3.75,.22,.1,.14);build(cube,0x2b2926,4.42,.62,-3.46,.46,.44,.035,.35);build(cyl,0x8a7f72,3.7,2.45,-4.42,.14,2.3,.14);solid(3.7,-4.1,2.0,1.2);
   // butter churn: tapered staves with three iron hoops, a lid and the dasher with its cross handle
   build(churnBody,0x9a7552,4.1,.5,-1.6,1,1,1);for(const yy of [.14,.5,.86]){const r=.272-.07*yy;build(wheel,0x3a3a3c,4.1,yy,-1.6,r,r,.5,0,0,Math.PI/2)}
   build(cyl,0x8a6a48,4.1,1.02,-1.6,.215,.04,.215);build(cyl,0x6e4a2e,4.1,1.36,-1.6,.025,.7,.025);build(cube,0x6e4a2e,4.1,1.7,-1.6,.3,.04,.04);solid(4.1,-1.6,.6,.6);
   // milk cans with a shoulder, neck, lid and two handles
   for(let k=0;k<3;k++){const cx=3.0+k*.45;build(milkCan,0xffffff,cx,0,-2.6,1,1,1,k*.7);for(const sx of [-1,1])build(hoop,0x9aa0a4,cx+sx*.15,.5,-2.6,.06,.06,.05,Math.PI/2);build(ball,0x9aa0a4,cx,.75,-2.6,.035,.03,.035)}solid(3.45,-2.6,1.4,.4);
   for(const [cx,cz,kind,k] of [[-4.0,.6,'apple',0],[-4.0,1.6,'pear',1]]){build(beam,0x8a6a48,cx,.12,cz,.86,.24,.9);goods.crate(room,cx,.24,cz,kind,k,.8,.8);solid(cx,cz,.9,1.0)}
   goods.sack(room,3.9,0,2.3,.95);goods.sack(room,3.3,0,2.7,.85,true);solid(3.6,2.5,1.4,1.1);
   for(let k=0;k<6;k++)herbBundle(-.8,3.62,-3.0+k*.5,k+1);build(beam,0x6e4a2e,-.8,4.05,-1.75,.1,.1,3.4);
   if(scanReady)scanProp('sf_brasspot',-1.9,.95,-3.85,.5,1,room);for(let k=0;k<3;k++)potHerb(-4.55,1.82,-2.4+k*.45,.8,k+2);build(beam,0x6e4a2e,-4.6,1.8,-1.95,.35,.05,1.5);
   stations=[{x:-2.3,z:-2.75,h:0,clip:'work'},{x:3.7,z:-2.9,h:0,clip:'look'},{x:-3.0,z:1.1,face:[-4,1.1],clip:'take'}];
  }
  if(house.key==='joost'){
   // stonemason's shed: a heavy stone bench with chisels, a half-carved statue, a grindstone and stacked blocks
   build(masonry,0xd5cfc0,1.4,.45,-4.0,2.6,.9,1.0);build(masonry,0xe3ddcf,1.4,.95,-4.0,2.7,.1,1.1);solid(1.4,-4,2.7,1.1);
   for(let k=0;k<4;k++)build(cube,0x8a9397,.6+k*.22,1.02,-3.7,.03,.02,.28,0,0,0);build(cyl,0x6e4a2e,2.3,1.08,-3.8,.12,.3,.12,0,Math.PI/2);build(cube,0xcfc8b8,1.8,1.12,-4.1,.5,.3,.4,.2);
   // a half-finished statue: the scanned figure rises out of a rough block, chisel and mallet on the block, chips below
   build(masonry,0xcfc8b8,-2.6,.35,-3.4,1.1,.7,1.1);build(stoneGeo,0xe0dacb,-2.6,1.12,-3.4,.62,.55,.5,.4);
   scanProp('statue',-2.6,.82,-3.4,.4,.98,room,()=>{build(masonry,0xe0dacb,-2.6,1.2,-3.4,.8,1.0,.7);build(cyl,0xe8e2d3,-2.6,2.0,-3.4,.28,.7,.24);build(ball,0xe8e2d3,-2.6,2.55,-3.4,.2,.24,.2)});
   build(cube,0x8a9397,-2.05,1.42,-3.1,.03,.03,.26,.6);build(cyl,0x6e4a2e,-2.08,1.47,-3.32,.07,.22,.07,.6,0,Math.PI/2);
   for(let k=0;k<7;k++)build(stoneGeo,0xe0dacb,-2.6+Math.cos(k*2.3)*(.75+k*.06),.05,-3.4+Math.sin(k*2.3)*(.7+k*.05),.07+.02*(k%3),.04,.06,k);solid(-2.6,-3.4,1.2,1.2);
   build(cyl,0xa8a296,4.0,1.0,-1.4,.6,.18,.6,0,0,Math.PI/2);for(const zz of [-1.75,-1.05])build(beam,0x6e4a2e,4.0,.5,zz,.12,1.0,.12);build(beam,0x6e4a2e,4.0,1.0,-1.4,.06,.06,.9,0,0,0);build(cyl,0x7a5232,3.4,.3,-1.4,.3,.6,.3);solid(3.9,-1.4,1.3,1.2);
   for(let k=0;k<3;k++)for(let j=0;j<2-(k>1);j++)build(masonry,0xd8d2c4,-4.1+j*.0,.3+k*.6,1.2+j*.9,.8,.58,.85,(k+j)*.1);solid(-4.1,1.6,.9,1.9);
   build(beam,0x6e4a2e,4.55,1.6,1.6,.25,.05,2.4);for(let k=0;k<5;k++)build(stoneGeo,0xffffff,4.55,1.72,.6+k*.45,.12,.1,.12,k);
   stations=[{x:1.4,z:-3.15,h:0,clip:'work'},{x:-1.6,z:-3.0,face:[-2.6,-3.4],clip:'look2'},{x:3.0,z:-.4,face:[4,-1.4],clip:'take'}];
  }
  if(house.key==='wies'){
   // counter with scales, till, a cut cheese and eggs; shelves of real goods; sacks, crates and cloth
   build(beam,0x8a5a34,0,.52,-1.6,5.2,1.04,.8);build(beam,0xa77b4f,0,1.08,-1.6,5.5,.08,1.0);solid(0,-1.6,5.4,.95);
   build(cyl,0xb48a3c,-1.6,1.15,-1.55,.05,.12,.05);build(cube,0xb48a3c,-1.6,1.42,-1.55,.7,.03,.03);for(const s of [-1,1]){build(cyl,0xb48a3c,-1.6+s*.33,1.3,-1.55,.12,.02,.12);build(cyl,0xb48a3c,-1.6+s*.33,1.37,-1.55,.005,.14,.005)}
   build(cube,0x5a3b22,1.4,1.25,-1.65,.6,.28,.4);goods.coins(room,.55,1.12,-1.35,7);goods.coins(room,.68,1.12,-1.42,4);
   build(beam,0x9a7048,-.55,1.135,-1.55,.7,.03,.45);goods.cheese(room,-.55,1.15,-1.55,.55,true);goods.basket(room,2.15,1.12,-1.5,.8);goods.candles(room,-2.35,1.12,-1.75);
   build(cube,0x5a2a1e,.2,1.14,-1.9,.42,.05,.3);build(cube,0xe8dcc0,.2,1.17,-1.9,.38,.01,.27);
   for(let k=0;k<4;k++){const sx=.9+k*.95;build(beam,0x6e4a2e,sx-.47,1.6,-4.6,.08,3.2,.45)}build(beam,0x6e4a2e,3.75,1.6,-4.6,.08,3.2,.45);
   const rows=[.4,1.15,1.9,2.65];for(const y of rows)build(beam,0x6e4a2e,2.3,y,-4.6,3.0,.05,.45);
   for(let k=0;k<4;k++)goods.jug(room,1.05+k*.75,rows[0]+.03,-4.55,.62);
   for(let k=0;k<7;k++)goods.jar(room,1.0+k*.4,rows[1]+.03,-4.55,k,.36);
   for(let k=0;k<3;k++)goods.loaf(room,1.15+k*.82,rows[2]+.03+.03,-4.55,.38,.15*(k-1));for(let k=0;k<2;k++)goods.boule(room,1.55+k*.82,rows[2]+.03,-4.5,.3);
   goods.cheese(room,1.25,rows[3]+.03,-4.55,.62);goods.cheese(room,1.25,rows[3]+.22,-4.55,.55);for(let k=0;k<5;k++)goods.bottle(room,2.05+k*.33,rows[3]+.03,-4.55,k,.6);
   goods.folded(room,1.3,3.2,-4.6,0,3);goods.folded(room,2.3,3.2,-4.6,2,2);goods.folded(room,3.2,3.2,-4.6,1,3);
   solid(2.3,-4.6,3.2,.6);
   for(const [bx,bz] of [[-4.2,-3.6],[-3.4,-4.2]])barrel(bx,bz,.9,.38);
   goods.sack(room,-4.1,0,-2.4,.95,true);goods.sack(room,-4.15,0,-1.5,.9);goods.sack(room,-3.5,0,-2.0,.82);solid(-3.9,-2.0,1.3,1.6);
   goods.sack(room,-4.1,0,1.3,.95);goods.sack(room,-3.5,0,1.75,.85,true);solid(-3.8,1.5,1.3,1.2);
   for(const [cx,cz,kind,k] of [[4.0,-.7,'apple',0],[4.0,.3,'apple',1],[4.0,1.3,'pear',0],[4.0,2.3,'cabbage',0]]){build(beam,0x6e4a2e,cx,.18,cz,.86,.36,.78);goods.crate(room,cx,.36,cz,kind,k,.8,.68)}solid(4.0,.8,.9,4.0);
   build(beam,0x8a5a34,-2.2,.45,3.6,1.6,.06,.7);for(const sx of [-1,1])for(const sz of [-1,1])build(beam,0x6e4a2e,-2.2+sx*.7,.22,3.6+sz*.28,.06,.44,.06);for(let k=0;k<4;k++)goods.bolt(room,-2.2,.48+Math.floor(k/2)*.24,3.45+(k%2)*.3,k,Math.PI/2);solid(-2.2,3.6,1.7,.8);
   build(beam,0x6e4a2e,-.2,4.05,-3.2,4.0,.08,.08);for(let k=0;k<5;k++)herbBundle(-2+k*.9,3.62,-3.2,k);
   stations=[{x:0,z:-2.55,face:[0,0],clip:'idle'},{x:2.2,z:-3.75,h:0,clip:'take'},{x:-.9,z:-2.6,face:[-1.6,-1.6],clip:'work'}];
  }
  if(house.manor){
   // ground floor: fireplace, dining table, armchairs, clock; stairs up to a gallery library
   {const proc=()=>{build(masonry,0xb9ab98,1.6,1.3,-4.6,2.6,2.6,.6);build(beam,0x5a3d26,1.6,2.65,-4.4,3.0,.16,.75);build(masonry,0xb9ab98,1.6,3.6,-4.7,1.6,2.0,.4);
    for(let k=0;k<3;k++)build(cyl,0x8a6a4a,1.3+k*.3,.32,-4.25,.06,.5,.06,0,0,Math.PI/2);mesh(new T.PlaneGeometry(1.1,.8),mapPaper[1],1.6,3.5,-4.48,1,1,1,0);build(beam,0x5a3d26,1.6,3.5,-4.5,1.25,.95,.04)};
    if(scanReady)scanProp('sf_fireplace',1.6,0,-4.3,0,1.02,room,proc);else proc();build(ember,0xffffff,1.6,.4,-4.45,1.0,.42,.06);solid(1.6,-4.5,2.8,.9)}
   accent.position.set(1.6,1.1,-3.6);accent.intensity=5;
   table(-2.4,-1.2,2.4,1.2,.85,0x6e4a2e);for(const s of [-1,1])for(const t of [-.6,.6]){build(beam,0x6e4a2e,-2.4+t,.45,-1.2+s*.95,.45,.06,.45);build(beam,0x6e4a2e,-2.4+t,.85,-1.2+s*1.15,.45,.8,.06)}
   build(cyl,0xefe6cf,-2.4,.98,-1.2,.05,.2,.05);mesh(ball,flame,-2.4,1.12,-1.2,.025,.05,.025);
   for(const sx of [-.3,3.3]){build(beam,0x7a2e24,sx,.42,-2.6,.9,.3,.85);build(beam,0x7a2e24,sx,.85,-3.0,.9,.7,.18);for(const s of [-1,1])build(beam,0x7a2e24,sx+s*.4,.6,-2.6,.12,.45,.85);solid(sx,-2.7,1.0,1.0)}
   build(beam,0x4a3426,-4.55,1.3,1.8,.4,2.6,.5);build(cyl,0xe8dcc0,-4.32,2.0,1.8,.16,.02,.16,0,0,Math.PI/2);solid(-4.55,1.8,.5,.6);
   mesh(new T.PlaneGeometry(1.4,1),mapPaper[0],-4.88,2.6,-1.5,1,1,1,Math.PI/2);
   // stairs along the right wall, from the front up to the gallery
   const steps=14;for(let k=0;k<steps;k++){const z0=3.6-(k+.5)*4.6/steps,y=4.2*(k+1)/steps;build(beam,0x7a5232,4.32,y-.06,z0,.95,.12,4.6/steps+.02);build(beam,0x5a3d26,4.32,y/2,z0,.9,y,.05)}
   for(let k=0;k<=steps;k++){const z0=3.6-(k+.5)*4.6/steps,y=4.2*(k+1)/steps;if(k<steps)build(beam,0x5a3d26,3.86,y+.48,z0,.05,.96,.05)}for(const [zz,yy] of [[3.45,.3],[-.95,4.2]])build(beam,0x4a3020,3.86,yy+.6,zz,.14,1.2,.14);
   build(beam,0x5a3d26,3.86,2.1+1,1.3,.1,.08,6.3,0,0,Math.atan2(4.2,4.6));
   // gallery floor with railing
   build(withSurface(cube.clone(),oakFloorMat(2)),0xffffff,0,4.1,-3,9.78,.2,4);
   build(beam,0x5a3d26,-.45,3.95,-1.02,9.1,.12,.16);for(let k=0;k<22;k++)build(beam,0x5a3d26,-4.8+k*.41,4.65,-1.05,.05,.9,.05);build(beam,0x5a3d26,-.45,5.12,-1.05,9.1,.08,.12);
   for(const xx of [-4.0,-.8,2.4])build(beam,wood,xx,2.0,-1.05,.2,4.0,.2);solid(-4,-1.05,.3,.3);solid(-.8,-1.05,.3,.3);solid(2.4,-1.05,.3,.3);
   // gallery: library and a reading corner
   for(const bx of [.6,2.8]){if(scanReady){for(const sx of [-.535,.535]){scanProp('sf_bookshelf',bx+sx,4.2,-4.55,0,[.78,1,1],room);shelfBooks(bx+sx,4.2,-4.52,.78)}continue}
    for(const sx of [-1.05,1.05])build(beam,0x5a3d26,bx+sx,5.8,-4.6,.08,3.2,.45);for(let k=0;k<5;k++){const y=4.35+k*.62;build(beam,0x5a3d26,bx,y,-4.6,2.15,.05,.45);let xx=bx-1;while(xx<bx+.95){const wdt=.06+frnd()*.06,hh=.34+frnd()*.18;build(cube,[0x7a2e24,0x2f4a5e,0x5d5a2c,0x6b4a2a,0x3d2f45][Math.floor(frnd()*5)],xx+wdt/2,y+.03+hh/2,-4.58,wdt,hh,.28);xx+=wdt+.01}}}
   build(beam,0x6e4a2e,-2.6,4.98,-3.6,1.6,.08,.8);for(const sx of [-1,1])for(const sz of [-1,1])build(beam,0x6e4a2e,-2.6+sx*.7,4.59,-3.6+sz*.3,.08,.78,.08);build(cyl,0xefe6cf,-2.9,5.1,-3.6,.05,.2,.05);mesh(ball,flame,-2.9,5.24,-3.6,.025,.05,.025);mesh(new T.PlaneGeometry(.7,.5),mapPaper[0],-2.4,5.0,-3.6,1,1,1,.2,-Math.PI/2);
   mesh(new T.PlaneGeometry(2.45,1.45),portalGlass,-2,6.7,-4.87);for(const xx of [-3.24,-2,-.76])build(beam,wood,xx,6.7,-4.75,.11,1.58,.12);
   const up=new T.PointLight(0xffc27a,6,9,1.6);up.position.set(0,7.6,-3);room.add(up);lantern(0,7.9,-3,room);
   stations=[{x:1.6,z:-3.4,h:0,clip:'look'},{x:-2.4,z:-.05,h:0,clip:'take'},{x:-1.6,z:1.4,face:[-4.5,1.8],clip:'idle2'}];
  }
  for(const st of stations)if(st.face)st.h=Math.atan2(-(st.face[0]-st.x),-(st.face[1]-st.z));
  room.visible=false;
  roomDoor.room=true;
  const ceil=(lx,z,y)=>house.manor?(y<3&&z<-.9?3.95:8.5):4.5;
  // manor: stairs along the right wall (x 3.85..4.8, z 3.6 up to -1.0) and a gallery behind z -1 at 4.2
  const floorAt=house.manor?(lx,z,y)=>{let f=0;if(lx>3.8&&lx<4.85&&z<3.7&&z>-1.3){const h=4.2*Math.max(0,Math.min(1,(3.6-z)/4.6));if(y>=h-.55)f=Math.max(f,h)}if(z<-.95&&y>=3.6)f=Math.max(f,4.2);return f}:()=>0;
  // the banister along the open side of the stairs runs from floor to handrail: you can't step off, fall off or walk under it
  const blockAt=house.manor?(lx,z,y,r)=>{if(z>-.95&&z<3.05&&Math.abs(lx-3.8)<r-.1)return true;
   if(lx>3.8&&z<3.6+r&&z>-1.2){const h=4.2*Math.max(0,Math.min(1,(3.6-z)/4.6));if(h>.5&&y<h-.55)return true}
   if(y>3&&z>-1.05-r&&!(lx>3.75&&lx<4.9))return true;return false}:()=>false;
  return {house,x,z,room,rects,stations,lamp,accent,ceil,floorAt,blockAt,door:roomDoor,exit:{x,z:4.05},npc:{x:x+.55,z:-1.83},actor:null,life:null}
 });
 function renderPortal(){
  if(!portalTarget||!inside)return;const h=inside.house,back=h.z-({mara:4.4,bram:3.9,wies:4.9,vandalen:7.0}[h.key]??4.6);
  const L=liftAt(h.x,h.z);portalCam.position.set(h.x+(h.key==='bram'?.9:h.key==='mara'?1.0:0),2.6+L,back);portalCam.lookAt(portalCam.position.x-1.2,2.2+L,back-10);
  const auto=renderer.shadowMap.autoUpdate;renderer.shadowMap.autoUpdate=false;inside.room.visible=false;
  renderer.setRenderTarget(portalTarget);renderer.render(scene,portalCam);
  if(inside.door.open>.02){doorCam.position.set(h.x,2.0+L,h.z+.45);doorCam.lookAt(h.x,1.7+L,h.z+10);renderer.setRenderTarget(doorTarget);renderer.render(scene,doorCam)}
  renderer.setRenderTarget(null);
  inside.room.visible=true;renderer.shadowMap.autoUpdate=auto}
 const residents={linde:{gender:'f',height:2.62},bram:{gender:'m',height:2.78},mara:{gender:'f',height:2.66},tomas:{gender:'m',height:2.74},wies:{gender:'f',height:2.6},gerrit:{gender:'m',height:2.8},anke:{gender:'f',height:2.62},joost:{gender:'m',height:2.74},vandalen:{gender:'m',height:2.78}};
 let inside=null;
 function enterRoom(room){
  if(inside)inside.room.visible=false;
  inside=room;if(!room)return;room.room.visible=true;room.entered=performance.now()/1000;
  if(!room.actor){
   room.actor=context?Rig.person(room.room,room.house.key,residents[room.house.key]):embodiedPerson(room.room,room.house.key);room.actor.root.position.set(.55,0,-1.83);room.actor.root.rotation.y=Math.PI;
   room.actor.ready.catch(()=>console.error('Bewoner kon niet laden'))
  }
  const st=room.stations[0];room.life={x:st.x,z:st.z,h:st.h,mode:'work',station:0,until:0,greet:performance.now()/1000+.7,path:[],attend:0,talk:0};
  room.npc.x=room.x+st.x;room.npc.z=st.z
 }
 // Residents keep busy: they work at a station, stroll to the next one, greet you when you come in,
 // turn to you when you are close and gesture while you talk with them.
 function roomFree(r){return (x,z)=>Math.abs(x)<4.4&&Math.abs(z)<4.4&&!r.rects.some(q=>Math.abs(x-q.x)<q.w/2+.32&&Math.abs(z-q.z)<q.d/2+.32)}
 function plan(r,v,st){const route=Nav.path(v.x,v.z,st.x,st.z,roomFree(r),{cell:.25,margin:4})||[st];route[route.length-1]=st;return route}
 function segmentFree(r,x0,z0,x1,z1){for(let k=1;k<=12;k++){const f=k/12,x=x0+(x1-x0)*f,z=z0+(z1-z0)*f;if(r.rects.some(q=>Math.abs(x-q.x)<q.w/2+.3&&Math.abs(z-q.z)<q.d/2+.3))return false}return true}
 function resident(r,t,dt,p){
  const a=r.actor,v=r.life;if(!a?.mixer||!v)return;
  const px=p.x-r.x,pz=p.z,near=Math.hypot(px-v.x,pz-v.z),talking=document.getElementById('panel')?.open;
  const face=h=>{v.h+=Math.atan2(Math.sin(h-v.h),Math.cos(h-v.h))*(1-Math.exp(-6*dt))};
  const toPlayer=Math.atan2(-(px-v.x),-(pz-v.z));
  if(talking||near<3.1||t<v.greet+2.6){v.attend=t}
  if(v.greet&&t>v.greet){v.greet=0;v.mode='attend';v.path=[];a.once('wave',a.state==='slow'?'idle':'idle',{fade:.3})}
  if(t-v.attend<4.5&&v.mode!=='walkback'){
   if(v.mode==='walk'){v.mode='attend';v.path=[]}
   if(v.mode!=='attend'){v.mode='attend'}
   face(toPlayer);a.look(new T.Vector3(p.x,p.y+2.25,p.z));
   if(talking){if(!['talk1','talk2','talk3','wave'].includes(a.state)){v.talk=(v.talk+1)%3;a.once(['talk1','talk2','talk3'][v.talk],'listen',{fade:.5})}}
   else if(a.state!=='wave'&&!['idle','listen','nod'].includes(a.state))a.play(near<3.1?'listen':'idle',{fade:.5});
  }else{
   a.look(null);
   if(v.mode==='attend'){v.mode='walk';const next=v.station;const st=r.stations[next];v.path=plan(r,v,st);v.target=next}
   if(v.mode==='work'&&t>v.until){let next=(v.station+1+Math.floor(frnd()*(r.stations.length-1)))%r.stations.length;const st=r.stations[next];v.path=plan(r,v,st);v.mode='walk';v.target=next}
   if(v.mode==='walk'){
    const goal=v.path[0],dx=goal.x-v.x,dz=goal.z-v.z,d=Math.hypot(dx,dz),speed=a.clips.slow.userData.speed*a.scale;
    if(d<.06){v.path.shift();if(!v.path.length){v.mode='arrive';v.station=v.target}}
    else{const step=Math.min(d,speed*dt),nx=v.x+dx/d*step,nz=v.z+dz/d*step;
     if(Math.hypot(px-nx,pz-nz)<.8){a.play('idle',{fade:.3})}
     else{v.x=nx;v.z=nz;face(Math.atan2(-dx,-dz));a.play('slow',{fade:.3})}}
   }
   if(v.mode==='arrive'){const st=r.stations[v.station];face(st.h);if(Math.abs(Math.atan2(Math.sin(st.h-v.h),Math.cos(st.h-v.h)))<.12){v.mode='work';v.until=t+7+frnd()*7;a.play(st.clip,{fade:.5,restart:true})}else a.play('idle',{fade:.3})}
  }
  a.root.position.set(v.x,0,v.z);a.root.rotation.y=v.h;r.npc.x=r.x+v.x;r.npc.z=v.z;a.update(dt)
 }

 // Where people may stand: on land, clear of solids (other walkers do not count here).
 const walkable=(x,z,s)=>{const g=ground(x,z,s),L=liftAt(x,z);return g>L-1&&g<L+.6&&!blocked(x,z,s,g,.34,1.9)};
 const walkers=context?createWalkers(scene,{free:walkable,lift:liftAt}):null;
 const fauna=context?createFauna(scene,{ground:(x,z,s)=>ground(x,z,s),blocked:(x,z,s,y,r,h)=>blocked(x,z,s,y,r,h),walkable,lift:liftAt}):null;solids.add({x:12.5,z:11.5,r:.6,base:0,top:.8});
 const hero=expeditionPilot(scene,!!context),shadow=new T.Mesh(new T.PlaneGeometry(1.46,.94),new T.MeshBasicMaterial({map:loadSurface("footshadow.png"),transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;scene.add(shadow);
 const nodes=[[-5,7,'hout'],[5,-1,'hout'],[-5,-9,'steen'],[6,-15,'steen'],[-6,-47,'hout'],[5,-54,'steen'],[-5,-66,'hout'],[5,-73,'steen'],[-5,-104,'steen'],[6,-114,'hout'],[-5,-120,'steen'],[7,-132,'hout'],[-52,14,'hout'],[-67,13,'hout'],[-71.5,-7,'hout'],[-52,-3,'steen'],[-58,-69,'hout'],[-63,-70,'steen'],[62,-86,'steen'],[52,-90,'steen'],[64,-74,'steen'],[60,-121,'steen'],[49,-134,'hout']].map(([x,z,type],i)=>{
  solids.add(type==='hout'?{x,z,w:.83,d:1.12,base:0,top:1.48,harvest:i}:{x,z,r:1.16,base:0,top:1.74,harvest:i});
  const g=group(x,0,z);
  if(type==='hout'){const barkParts=[],endParts=[];
   [[-.5,.25,.25],[0,.25,.27],[.5,.25,.24],[-.26,.69,.24],[.25,.68,.23],[0,1.09,.22]].forEach(([lx,ly,r0],j)=>{
    const len=1.72+((j*37)%5)*.08,ry=((j*7)%5-2)*.03,lz=((j*13)%3-1)*.06,bump=(a,h)=>1+.05*Math.cos(5*a+j)+.03*Math.sin(9*a+h*1.3)+.015*Math.cos(13*a);
    const place=geo=>geo.rotateY(ry).translate(lx,ly,lz);
    const trunk=new T.CylinderGeometry(r0*.94,r0,len,18,6,true);Nature.displace(trunk,v=>{const k=bump(Math.atan2(v.z,v.x),v.y);v.x*=k;v.z*=k});trunk.rotateX(Math.PI/2);barkParts.push({geo:place(trunk),color:0xffffff});
    for(const side of [-1,1]){const rad=r0*(side>0?.94:1),cap=new T.CircleGeometry(rad,18);Nature.displace(cap,v=>{const k=bump(Math.atan2(-v.y*side,v.x),side*len/2);v.x*=k;v.y*=k});
     cap.rotateY(side>0?0:Math.PI).translate(0,0,side*len/2);endParts.push({geo:place(cap),color:0xffffff});
     const rim=new T.TorusGeometry(rad*.99,.03,5,24);rim.translate(0,0,side*len/2);barkParts.push({geo:place(rim),color:0x8a7a6a})}});
   const bk=new T.Mesh(Nature.merge(barkParts),barkPile),ec=new T.Mesh(Nature.merge(endParts),cutEnd);for(const m of [bk,ec]){m.castShadow=m.receiveShadow=true;g.add(m)}
   // A stump with an axe stays behind after the pile is gone.
   const sx=x+1.35,sz=z+.5,sl=liftAt(sx,sz),s1=shape(cyl,0x8a6a50,sx,.25+sl,sz,.32,.5,.32,0,0,0,scene),s2=shape(cyl,0xffffff,sx,.505+sl,sz,.3,.01,.3,0,0,0,scene);s1.material=bark;s2.material=cutEnd;stumpSpots.push([sx,sl,sz,s1,s2]);
   shape(cyl,0x7a5a3a,sx+.05,.75,sz,.025,.62,.025,0,.55,0);shape(cube,0x5a5e62,sx-.1,.52,sz,.24,.12,.04,0,.55,0);solids.add({x:sx,z:sz,r:.36,base:0,top:.5})
  }else{const rocks=[];
   [[0,.45,0,.62],[.62,.32,.35,.45],[-.55,.3,.28,.42],[.2,.28,-.6,.4],[-.35,.86,-.1,.36],[.45,.26,-.25,.3]].forEach(([rx,ry,rz,size],j)=>{
    const g2=new T.IcosahedronGeometry(1,2);Nature.displace(g2,v=>{v.multiplyScalar(1+.22*Math.sin(v.x*3.1+j)*Math.sin(v.z*2.7+j*2)+.12*Math.sin(v.y*5+j));v.y*=.78});
    g2.scale(size,size,size).rotateY(j*1.3).translate(rx,ry,rz);rocks.push({geo:g2,color:j%2?0xb7c0c4:0x9aa6ac})});
   const blk=new T.BoxGeometry(.55,.36,.42);blk.rotateY(.4).translate(.7,.18,-.62);rocks.push({geo:blk,color:0xc9c2b4});
   const m=new T.Mesh(Nature.merge(rocks),quarryRock);m.castShadow=m.receiveShadow=true;g.add(m)}
  const marker=shape(wheel,0xffc65a,0,2.4,0,.29,.29,.29,0,0,0,g);return {g,x,z,type,i,marker}});
 const probe={stage:9,harvest:{},builds:[]};
 const grassAreas=(count,r)=>{const out=[];for(let k=0;k<islands.length;k++){const {x,z,r:R,lift}=islands[k];let made=0,tries=0;const quota=k<3?count/3:count/12;
  while(made<quota&&tries++<count*7){const a=r()*Math.PI*2,d=Math.sqrt(r())*(R-.7),px=x+Math.cos(a)*d,pz=z+Math.sin(a)*d;
   const patch=Math.max(0,Math.min(1,(fbm3(px/7.5,k*3.1,pz/7.5)+.12)/.45));if(r()>.22+.78*patch)continue;
   if((k<3?nearPaving(px,pz,k,-.15):false)||nearTrail(px,pz,-.1)||k>=3&&mountainH(px,pz)>.04||solids.blocked(px,pz,probe,lift,.18,.5)||Math.abs(px)<2.9&&[-21,-81].some(q=>Math.abs(pz-q)<2.9))continue;out.push([px,pz,lift,.78+.62*patch]);made++}}
  {let made=0,tries=0;while(made<count/9&&tries++<count*2){const a=r()*Math.PI*2,d=Math.sqrt(r())*(lobe.r-.7),px=lobe.x+Math.cos(a)*d,pz=lobe.z+Math.sin(a)*d;if(Math.hypot(px,pz)<24.5||mountainH(px,pz)>.04||brookDist(px,pz)<.9||solids.blocked(px,pz,probe,0,.18,.5))continue;out.push([px,pz]);made++}}
  return out};
 const meadow=context?Nature.grass(scene,grassAreas,24000,77):[];
 const life=context?Nature.life(scene,{chimneys,glades:[[-15,11],[16,-6],[-14,-52],[15,-66],[12,-108]],valley:[0,LIFT[1],-61]}):null;
 const gates=[[-7,-112],[7,-120],[0,-126]].map(([x,z])=>{let g=group(x,2.85,z);shape(wheel,0xffad39,0,0,0,1.7,1.7,1.7,0,0,0,g);return {g,x,z}});
 const sail=group(0,2.55,0,hero.root);
 for(let side of [-1,1]){shape(iso,side===1?red:0xffbc65,side*1.17,.16,.1,1.57,.19,.89,side*.22,side*.15,0,sail);shape(cube,wood,side*.54,-.39,0,.09,1.2,.1,0,-side*.56,0,sail)}
 if(context&&typeof Models!=='undefined')Models.load('sf_flyer').then(r=>{const m=new T.Mesh(r.geometry,r.material);m.scale.setScalar(.15);m.rotation.y=Math.PI/2;m.position.y=-.45;m.castShadow=true;for(const c of [...sail.children])c.visible=false;sail.add(m)}).catch(()=>{});
 sail.visible=false;
 const flags=[];const builds=group(0,0,0);function construction(x,z,y,type,parent=builds){let g=group(x,y,z,parent);
 if(type==='blok'){shape(cube,0xc18d5c,0,.56,0,2,1.12,2,0,0,0,g);for(let s of [-1,1])for(let d of [-1,1])shape(cube,wood,s*.9,.56,d*.9,.24,1.16,.24,0,0,0,g);shape(cube,cream,0,.56,1.01,2.1,.16,.09,0,.43,0,g)}
 else if(type==='bloembak'){shape(planks,0x8a5a34,0,.27,0,1.0,.5,.5,0,0,0,g);shape(cube,0x3b2a1e,0,.5,0,.92,.06,.42,0,0,0,g);const tones=[0xe2475b,0xf6c443,0xf4f0f2,0xd45a9b];for(let i=0;i<3;i++){const px=-.3+i*.3;shape(leafGeo,0x4f7d32,px,.52,0,1.05,1.05,1.05,i*2,0,0,g);shape(flowerGeo,tones[i%4],px,.52,0,1.05,1.05,1.05,i*2,0,0,g)}}
 else if(type==='bankje'){shape(planks,0xb08d67,0,.48,0,1.3,.08,.42,0,0,0,g);shape(planks,0xb08d67,0,.85,-.2,1.3,.3,.06,0,0,0,g);for(const s of [-1,1]){shape(beam,oak,s*.55,.24,0,.08,.48,.38,0,0,0,g);shape(beam,oak,s*.55,.66,-.2,.08,.4,.06,0,0,0,g)}}
 else if(type==='vlag'){shape(cyl,0x6b5a48,0,1.7,0,.05,3.4,.05,0,0,0,g);shape(ball,0xb69765,0,3.45,0,.08,.08,.08,0,0,0,g);const f=new T.Mesh(new T.PlaneGeometry(1.1,.7,8,1),new T.MeshStandardMaterial({map:canvasTex(128,80,c=>{c.fillStyle='#2f5d63';c.fillRect(0,0,128,80);c.fillStyle='#e7c46a';c.beginPath();c.moveTo(40,40);c.lineTo(64,16);c.lineTo(88,40);c.lineTo(64,64);c.fill()}),side:T.DoubleSide,roughness:.9}));f.position.set(.58,3.0,0);f.castShadow=true;g.add(f);flags.push(f)}
 // the workbench (1.20): a heavy plank top on four square legs with a shelf, a vice and a hammer lying ready
 else if(type==='werkbank'){shape(planks,0xb08d67,0,.98,0,1.9,.12,.85,0,0,0,g);for(const sx of [-1,1])for(const sz of [-1,1])shape(beam,oak,sx*.82,.47,sz*.33,.13,.94,.13,0,0,0,g);
  shape(planks,0x9c7a56,0,.28,0,1.66,.06,.7,0,0,0,g);for(const sz of [-1,1])shape(beam,oak,0,.62,sz*.33,1.6,.08,.08,0,0,0,g);
  shape(cube,0x3a3a3c,-.78,1.1,.42,.26,.16,.14,0,0,0,g);shape(cyl,0x3a3a3c,-.78,1.1,.56,.025,.36,.025,0,0,Math.PI/2,g);shape(cube,0x8a6a48,.35,1.07,.1,.7,.05,.14,.2,0,0,g);
  if(scanReady&&parent!==scene)scanProp('sf_hammer',-.25,1.04,-.12,1.1,.8,g);else{shape(cube,0x3a3a3c,-.25,1.08,-.12,.09,.08,.2,0,0,0,g);shape(cyl,0x8a6a48,-.25,1.06,.1,.02,.38,.02,0,0,Math.PI/2,g)}}
 else {lamp(0,0,0,g)}return g}
 // ---- Level 4 · Mijn huis. The player's own 8 x 6 m half-timbered house on an approved plot (HouseDesigner plan,
 // ConstructionCampaign stages). Drawn per completed stage, with the stages still to come as a pale ghost; the walls
 // block, the door is walkable, the roof lifts off while you are inside, furniture uses the scanned props.
 const HOUSE_ID='mijn-huis',HY0=.4,HWH=2.7,HTOP=HY0+HWH;
 let houseNow=null,houseMats=null,houseKey='',houseGhostKey='';
 const houseRoot=new T.Group();scene.add(houseRoot);
 function houseMaterials(){if(houseMats)return houseMats;
  const std=o=>new T.MeshStandardMaterial(o);
  const scanned=(name,color)=>scanReady?std({map:Models.texture(name+'_diff.jpg',true),normalMap:Models.texture(name+'_nor.jpg'),color,roughness:.92}):null;
  let tile=null;if(scanReady){tile=[Models.texture('rooftiles_diff.jpg',true).clone(),Models.texture('rooftiles_nor.jpg').clone()];for(const x of tile){x.center.set(0,0);x.rotation=0;x.repeat.set(1,1);x.wrapS=x.wrapT=T.RepeatWrapping;x.needsUpdate=true}}
  const clay=c=>tile?std({map:tile[0],normalMap:tile[1],color:c,roughness:.8,side:T.DoubleSide}):std({map:tileMap,color:c,roughness:.88,side:T.DoubleSide});
  const surf=(file,color,rough=.9)=>{const t=loadSurface(file);t.wrapS=t.wrapT=T.RepeatWrapping;return std({map:t,color,roughness:rough})};
  houseMats={plaster:std({map:plasterMap,roughness:.96}),brick:scanned('brickruin',0xe6dcd2)||std({color:0x9a5a42,roughness:.9}),stone:scanned('wallslate',0xd9d4cc)||masonry.userData.surface,
   oak:std({map:oakMap,color:0xd2b08a,roughness:.82}),dark_oak:std({map:oakMap,color:0x6a4a34,roughness:.82}),weathered:std({map:oakMap,color:0xaaa59c,roughness:.92}),
   clay_red:clay(0xf2e2d4),clay_brown:clay(0xa98872),slate:(()=>{const m=surf('slate.jpg',0xb9bec4,.85);m.side=T.DoubleSide;return m})(),
   oak_planks:surf('board.jpg',0xd9c2a0,.85),stone_tiles:surf('paving.jpg',0xd8d0c4,.92),found:masonry.userData.surface,glass:glass.userData.surface,iron:std({color:0x2b2926,roughness:.6,metalness:.5}),
   canvas:std({color:0xd9ccb0,roughness:.95}),wool:std({color:0x8c2f28,roughness:.95}),
   ghost:new T.MeshStandardMaterial({color:0x8fd8ff,emissive:0x1d5a78,transparent:true,opacity:.28,depthWrite:false,roughness:.5}),
   mark:new T.MeshBasicMaterial({color:0xffd36a,transparent:true,opacity:.8,depthWrite:false})};
  return houseMats}
 // collect boxes and custom geometry per material, then merge into one mesh per material
 function houseKit(){const kits=new Map(),add=(mat,g)=>{if(!kits.has(mat))kits.set(mat,[]);kits.get(mat).push({geo:g,color:0xffffff})};
  function box(mat,w,h,d,x,y,z,ry=0,rz=0,rx=0,S=2.4){const g=new T.BoxGeometry(w,h,d),q=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;
   for(let i=0;i<q.count;i++){const X=q.getX(i),Y=q.getY(i),Z=q.getZ(i),ax=Math.abs(n.getX(i)),ay=Math.abs(n.getY(i));uv.setXY(i,((ax>.5?Z:X)+x*.37+z*.21)/S,((ay>.5?Z:Y)+y)/S)}
   g.applyMatrix4(new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(rx,ry,rz,'YXZ')),new T.Vector3(1,1,1)));add(mat,g)}
  // a beam from p to q (local coordinates), its long axis along the line
  function beam(mat,p,q,w,h){const d=new T.Vector3(q[0]-p[0],q[1]-p[1],q[2]-p[2]),len=d.length(),g=new T.BoxGeometry(w,len,h);
   const uv=g.attributes.uv,pos=g.attributes.position;for(let i=0;i<pos.count;i++)uv.setXY(i,(pos.getX(i)+pos.getZ(i))/2.4,pos.getY(i)/2.4);
   g.applyMatrix4(new T.Matrix4().compose(new T.Vector3((p[0]+q[0])/2,(p[1]+q[1])/2,(p[2]+q[2])/2),new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),d.normalize()),new T.Vector3(1,1,1)));add(mat,g)}
  // a flat polygon (3 or 4 points) facing both ways, texture coordinates along edge e and its in-plane normal
  function face(mat,pts,S=1.6,both=true){const P=pts.map(p=>new T.Vector3(...p)),e=P[1].clone().sub(P[0]).normalize(),nrm=P[1].clone().sub(P[0]).cross(P[2].clone().sub(P[0])).normalize(),g=nrm.clone().cross(e).normalize();
   const tri=P.length===4?[[0,1,2],[0,2,3]]:[[0,1,2]],v=[],uvs=[];for(const t of tri)for(const flip of both?[false,true]:[false]){const o=flip?[t[0],t[2],t[1]]:t;for(const k of o){const q=P[k];v.push(q.x,q.y,q.z);const r=q.clone().sub(P[0]);uvs.push(r.dot(e)/S,r.dot(g)/S)}}
   const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(v,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));geo.computeVertexNormals();add(mat,geo)}
  function build(parent,ghost){for(const [mat,list] of kits){const m=new T.Mesh(Nature.merge(list),ghost?houseMats.ghost:mat);m.castShadow=!ghost;m.receiveShadow=!ghost;m.renderOrder=ghost?2:0;parent.add(m)}}
  return {box,beam,face,build}}
 // sides of the house in local coordinates: outward normal n, tangent t (left to right seen from outside), wall line c
 const HSIDES={front:{n:[0,1],t:[1,0],c:2.9,len:7.8,ry:0},back:{n:[0,-1],t:[-1,0],c:2.9,len:7.8,ry:Math.PI},left:{n:[-1,0],t:[0,1],c:3.9,len:5.8,ry:-Math.PI/2},right:{n:[1,0],t:[0,-1],c:3.9,len:5.8,ry:Math.PI/2}};
 const hAt=(sd,u,o=0)=>[sd.n[0]*(sd.c+o)+sd.t[0]*u,sd.n[1]*(sd.c+o)+sd.t[1]*u];
 const slotU=(sd,slot)=>({left:-1,center:0,right:1})[slot]*sd.len/3;
 const FURN={table:{model:'long_table',h:.78,scale:(w,d)=>[w/1.8,.83/.55,d/.66]},chair:{model:'stool',h:.45,scale:(w,d)=>[w/.42,1,d/.44]},bench:{model:'settle',h:.89,scale:(w,d)=>[w/1.16,1,d/.5]},
  chest:{model:'chest',h:.5,rot:Math.PI/2,scale:(w,d)=>[d/.53,1.05,w/1.16]},bed:{h:.6},bookcase:{model:'sf_bookshelf',h:1.8,scale:(w,d)=>[w/1.374,1.8/2.06,d/.58]}};
 // build stage k of design d into kit K; collision rectangles go into col (local, with bottom and top)
 function houseStage(k,d,K,col,M,extra){const tm=M[d.timber],fm=M[d.facade];
  const doorSd=HSIDES[d.door.side],kindOf=(side,slot)=>d.door.side===side&&d.door.slot===slot?'door':d.windows.some(w=>w.side===side&&w.slot===slot)?'window':'solid';
  if(k===1){K.box(M.found,8.4,HY0,6.4,0,HY0/2,0);const [sx,sz]=hAt(doorSd,0,.65);K.box(M.found,1.7,.2,.7,sx,.1,sz,doorSd.ry);col.step={x:sx,z:sz,ry:doorSd.ry}}
  if(k===2){for(const side in HSIDES){const sd=HSIDES[side];
    for(const u of [-sd.len/2,-sd.len/6,sd.len/6,sd.len/2]){if(side==='left'||side==='right'){if(Math.abs(u)>sd.len/2-.01)continue}const [x,z]=hAt(sd,u);K.box(tm,.24,HWH,.24,x,HY0+HWH/2,z,sd.ry);col.posts.push([x,z,.15])}
    // sill (cut at the door) and top plate
    const gap=side===d.door.side?[-.75,.75]:null;for(const [a,b] of gap?[[-sd.len/2,gap[0]],[gap[1],sd.len/2]]:[[-sd.len/2,sd.len/2]]){const [x,z]=hAt(sd,(a+b)/2);K.box(tm,b-a+.24,.18,.24,x,HY0+.09,z,sd.ry)}
    {const [x,z]=hAt(sd,0);K.box(tm,sd.len+.24,.18,.26,x,HTOP-.09,z,sd.ry)}}}
  if(k===3){for(const side in HSIDES){const sd=HSIDES[side],pw=sd.len/3-.24;
    for(const slot of ['left','center','right']){const u0=slotU(sd,slot),kind=kindOf(side,slot),y0=HY0+.18,y1=HTOP-.18,P=(u,y,o=0)=>{const [x,z]=hAt(sd,u,o);return [x,y,z]};
     const panel=(u,w,ya,yb)=>{if(w<=.01||yb-ya<=.01)return;const [x,,z]=P(u,0);K.box(fm,w,yb-ya,.16,x,(ya+yb)/2,z,sd.ry)};
     if(kind==='solid'){panel(u0,pw,y0,y1);if(d.facade==='plaster'){const [x,,z]=P(u0,0,.09);K.box(tm,pw,.14,.06,x,HY0+1.4,z,sd.ry);const dir=(slot==='left'?1:-1)*(side==='back'||side==='left'?-1:1),a=P(u0-dir*pw/2,y0,.09),b=P(u0+dir*pw/2,HY0+1.33,.09);K.beam(tm,a,b,.13,.06);const c2=P(u0-dir*pw/2,HY0+1.47,.09),d2=P(u0+dir*pw/2,y1,.09);K.beam(tm,c2,d2,.13,.06)}}
     else if(kind==='window'){const ow=.9,oh=1.1,sy=HY0+.95;panel(u0,pw,y0,sy);panel(u0,pw,sy+oh,y1);const sw=(pw-ow)/2;panel(u0-ow/2-sw/2,sw,sy,sy+oh);panel(u0+ow/2+sw/2,sw,sy,sy+oh);
      {const [x,y,z]=P(u0,sy+oh/2,-.02);K.box(M.glass,ow,oh,.04,x,y,z,sd.ry)}{const [x,y,z]=P(u0,sy-.04,.12);K.box(tm,ow+.3,.07,.26,x,y,z,sd.ry)}
      extra.push({kind:'window',pos:P(u0,sy+oh/2,.03),ry:sd.ry,size:[ow+.18,oh+.18,.14]})}
     else{const ow=1.3,oh=2.25;const sw=(pw-ow)/2;panel(u0-ow/2-sw/2,sw,y0,y1);panel(u0+ow/2+sw/2,sw,y0,y1);panel(u0,ow,HY0+oh,y1);
      for(const s2 of [-1,1]){const [x,,z]=P(u0+s2*(ow/2+.05),0,.02);K.box(tm,.12,oh+.05,.22,x,HY0+(oh+.05)/2,z,sd.ry)}{const [x,,z]=P(u0,0,.02);K.box(tm,ow+.34,.16,.24,x,HY0+oh+.08,z,sd.ry)}
      // the door stands open, swung inside against the wall
      const th=1.38,h=[u0-ow/2+.04,-.08],dir=[Math.cos(th),-Math.sin(th)],cu=h[0]+dir[0]*.6,co=h[1]+dir[1]*.6,[x,,z]=P(cu,0,co),wx=sd.t[0]*dir[0]+sd.n[0]*dir[1],wz=sd.t[1]*dir[0]+sd.n[1]*dir[1],ry=Math.atan2(-wz,wx);
      K.box(tm,1.2,2.18,.06,x,HY0+1.1,z,ry);for(const yy of [.45,1.75])K.box(M.iron,1.05,.07,.075,x,HY0+yy,z,ry)}}
    // wall collision: one rectangle per side, cut at the door
    const gap=side===d.door.side?[-.7,.7]:null;for(const [a,b] of gap?[[-sd.len/2-.12,gap[0]],[gap[1],sd.len/2+.12]]:[[-sd.len/2-.12,sd.len/2+.12]]){const [x,z]=hAt(sd,(a+b)/2);const along=Math.abs(sd.t[0])>.5;col.walls.push({x,z,w:along?(b-a)/2:.12,d:along?.12:(b-a)/2,bot:HY0,top:HTOP})}}}
  if(k===4){const rm=M[d.roofMaterial],tan=Math.tan(38*Math.PI/180),ex=4.35,ez=3.45,ye=HTOP-.45*tan,yr=HTOP+3*tan,rx=d.roof==='hip'?ex-ez:ex,roof=[];
   const A=[-ex,ye,ez],B=[ex,ye,ez],C=[rx,yr,0],D=[-rx,yr,0],E=[-ex,ye,-ez],F=[ex,ye,-ez];
   K.face(rm,[A,B,C,D]);K.face(rm,[F,E,D,C]);
   if(d.roof==='hip'){K.face(rm,[E,A,D],1.6);K.face(rm,[B,F,C],1.6);for(const [p,q] of [[A,D],[B,C],[E,D],[F,C]])K.beam(tm,p,q,.16,.12)}
   else for(const sx of [-1,1]){const x=sx*3.95;K.face(fm,[[x,HTOP-.02,-3],[x,HTOP-.02,3],[x,yr-.08,0]],2.4);for(const [p,q] of [[[sx*ex,ye,ez],[sx*ex,yr,0]],[[sx*ex,ye,-ez],[sx*ex,yr,0]]])K.beam(tm,p,q,.2,.06);
    if(d.facade==='plaster'){K.beam(tm,[x+sx*.04,HTOP,0],[x+sx*.04,yr-.1,0],.14,.06);K.beam(tm,[x+sx*.04,HTOP+.05,-2.2],[x+sx*.04,HTOP+1.6,0],.12,.06);K.beam(tm,[x+sx*.04,HTOP+.05,2.2],[x+sx*.04,HTOP+1.6,0],.12,.06)}}
   K.beam(tm,D,C,.18,.18);for(const [p,q] of [[A,B],[E,F]])K.beam(tm,[p[0],p[1]-.08,p[2]],[q[0],q[1]-.08,q[2]],.06,.2);
   K.box(M.found,.62,2.1,.62,2.1,yr-.75,-1.25);K.box(M.found,.78,.14,.78,2.1,yr+.33,-1.25)}
  if(k===5){K.box(M[d.floor],7.56,.04,5.56,0,HY0+.02,0,0,0,0,d.floor==='oak_planks'?1.3:1.8);
   for(const f of d.furniture){const spec=HouseDesigner.FURNITURE[f.type],ry=-f.rotation*Math.PI/180,fx=FURN[f.type]||{h:.8};col.furn.push({x:f.x,z:f.z,w:spec.width/2,d:spec.depth/2,ry,bot:HY0,top:HY0+fx.h});
    if(f.type==='bed'){const c=Math.cos(ry),s2=Math.sin(ry),at=(u,v)=>[f.x+u*c+v*s2,f.z-u*s2+v*c];const [x,z]=at(0,0);K.box(tm,2.0,.32,1.1,x,HY0+.2,z,ry);K.box(M.canvas,1.86,.16,.98,x,HY0+.44,z,ry);
     const [bx,bz]=at(.25,0);K.box(M.wool,1.3,.06,1.0,bx,HY0+.54,bz,ry);const [px,pz]=at(-.72,0);K.box(M.canvas,.36,.12,.7,px,HY0+.58,pz,ry);const [hx,hz]=at(-.98,0);K.box(tm,.08,.95,1.1,hx,HY0+.5,hz,ry)}
    else if(f.type==='bookcase'){const c=Math.cos(ry),s2=Math.sin(ry),at=(u,v)=>[f.x+u*c+v*s2,f.z-u*s2+v*c],tones=[M.wool,M.canvas,M.dark_oak,M.iron];
     // the scanned worn bookcase (Poly Haven) when available, with books on its four lower shelves
     if(scanReady){extra.push({kind:'furniture',f,ry,spec});for(const [j,y] of [[0,.33],[1,.58],[2,.82],[3,1.1]]){let u=-.5;for(let b=0;b<12&&u<.48;b++){const w=.035+((b*7+j*3)%4)*.012,h=.15+((b*5+j)%3)*.03,[x,z]=at(u+w/2,.02);K.box(tones[(b+j)%4],w,h,.18,x,HY0+.04+y+h/2,z,ry);u+=w+.008}}}
     else{for(const u of [-.57,.57]){const [x,z]=at(u,0);K.box(tm,.06,1.8,.45,x,HY0+.9,z,ry)}
     for(let j=0;j<5;j++){const [x,z]=at(0,0);K.box(tm,1.2,.05,.45,x,HY0+.03+j*.43,z,ry)}{const [x,z]=at(0,-.2);K.box(tm,1.2,1.8,.03,x,HY0+.9,z,ry)}
     for(let j=0;j<4;j++){let u=-.5;for(let b=0;b<9&&u<.5;b++){const w=.06+((b*7+j*3)%4)*.02,h=.26+((b*5+j)%3)*.04,[x,z]=at(u+w/2,0);K.box(tones[(b+j)%4],w,h,.3,x,HY0+.08+j*.43+h/2,z,ry);u+=w+.012}}}}
    else extra.push({kind:'furniture',f,ry,spec})}}}
 // rebuild the house group for design d with `done` stages built and, when ghost is set, the rest as a pale preview
 function houseDraw(d,done,ghost){houseRoot.clear();if(!d){houseNow=null;return}
  const M=houseMaterials(),g=new T.Group(),a=d.rotation*Math.PI/180,base=liftAt(d.x,d.z)+mountainH(d.x,d.z);g.position.set(d.x,base,d.z);g.rotation.y=-a;houseRoot.add(g);
  const col={walls:[],posts:[],furn:[],step:null},stages=[];
  for(let k=1;k<=5;k++){const K=houseKit(),extra=[],sg=new T.Group();g.add(sg);stages.push(sg);const real=k<=done;if(!real&&!ghost)continue;
   houseStage(k,d,K,real?col:{walls:[],posts:[],furn:[],step:null},M,extra);K.build(sg,!real);
   if(real&&scanReady)for(const e of extra){
    if(e.kind==='window')Models.load('sf_window').then(r=>{if(houseNow?.group!==g)return;const m=new T.Mesh(r.geometry,r.material);m.position.set(...e.pos);m.rotation.y=e.ry;m.scale.set(...e.size);m.castShadow=true;sg.add(m)}).catch(()=>{});
    if(e.kind==='furniture'){const fx=FURN[e.f.type];if(fx&&fx.model)Models.load(fx.model).then(r=>{if(houseNow?.group!==g)return;const m=new T.Mesh(r.geometry,r.material);m.position.set(e.f.x,HY0+.04,e.f.z);m.rotation.y=e.ry+(fx.rot||0);m.scale.set(...fx.scale(e.spec.width,e.spec.depth));m.castShadow=m.receiveShadow=true;sg.add(m)}).catch(()=>{})}}}
  houseNow={d,done,group:g,roof:stages[3],base,col,a};
  if(done<5&&ghost){// footprint outline and an arrow at the entrance while designing
   const K=houseKit();for(const [w,h,x,z] of [[8.2,.08,0,3.05],[8.2,.08,0,-3.05],[.08,6.2,4.05,0],[.08,6.2,-4.05,0]])K.box(M.mark,w,.04,h,x,.03,z);
   const sd=HSIDES[d.door.side],[sx,sz]=hAt(sd,0,1.35);K.box(M.mark,.5,.04,.9,sx,.03,sz,sd.ry);K.build(g,false);g.children[g.children.length-1].material=M.mark}}
 function houseSync(s,ghostDesign){
  const p=(s&&Array.isArray(s.constructionProjects)?s.constructionProjects:[]).find(o=>o.id===HOUSE_ID),d=s?.constructionDesigns?.[HOUSE_ID];
  if(ghostDesign){const key='g'+JSON.stringify(ghostDesign);if(key!==houseKey){houseKey=key;houseDraw(ghostDesign,p&&d?p.completed:0,true)}return}
  const done=p&&d?p.completed:0,key=d?JSON.stringify(d)+':'+done:'none';if(key===houseKey)return;houseKey=key;houseDraw(d||null,done,!!d&&done<5)}
 // local coordinates of a world point relative to the house
 function houseLocal(x,z){const h=houseNow,c=Math.cos(h.a),sn=Math.sin(h.a),dx=x-h.d.x,dz=z-h.d.z;return [dx*c+dz*sn,-dx*sn+dz*c]}
 const house={
  block(x,z,y,r){const h=houseNow;if(!h||h.done<1)return false;const [lx,lz]=houseLocal(x,z);if(Math.abs(lx)>5.5||Math.abs(lz)>4.5)return false;const yy=y-h.base;
   const hit=(q,px,pz)=>{const dx=Math.max(0,Math.abs(px-q.x)-q.w),dz=Math.max(0,Math.abs(pz-q.z)-q.d);return dx*dx+dz*dz<r*r};
   if(yy<HTOP&&yy+1.6>HY0){for(const q of h.col.walls)if(hit(q,lx,lz))return true;if(h.done===2)for(const [px,pz,pr] of h.col.posts)if(Math.hypot(lx-px,lz-pz)<pr+r)return true}
   for(const q of h.col.furn){if(yy>=q.top-.05||yy+1.6<=q.bot)continue;const c=Math.cos(-q.ry),sn=Math.sin(-q.ry),u=(lx-q.x)*c+(lz-q.z)*sn,v=-(lx-q.x)*sn+(lz-q.z)*c;if(hit({x:0,z:0,w:q.w,d:q.d},u,v))return true}
   return false},
  floor(x,z,y){const h=houseNow;if(!h||h.done<1)return -100;const [lx,lz]=houseLocal(x,z),yy=y-h.base;let f=-100;
   if(Math.abs(lx)<=4.2&&Math.abs(lz)<=3.2&&yy>=HY0-.6)f=h.base+HY0;
   const st=h.col.step;if(st){const c=Math.cos(-st.ry),sn=Math.sin(-st.ry),u=(lx-st.x)*c+(lz-st.z)*sn,v=-(lx-st.x)*sn+(lz-st.z)*c;if(Math.abs(u)<=.85&&Math.abs(v)<=.35&&yy>=-.5)f=Math.max(f,h.base+.2)}
   return f},
  inside(x,z,y){const h=houseNow;if(!h||h.done<4)return false;const [lx,lz]=houseLocal(x,z);return Math.abs(lx)<3.95&&Math.abs(lz)<2.95&&y-h.base<HTOP}};
 // can this design stand here? sampled over the footprint plus a margin and in front of the door
 function siteCheck(c,s){const d=c.design,a=d.rotation*Math.PI/180,co=Math.cos(a),si=Math.sin(a),st={stage:6,harvest:{},builds:s?.builds||[]};
  const terrain=(x,z)=>islands.some(i=>Math.hypot(x-i.x,z-i.z)<i.r-1.4)||Math.hypot(x-lobe.x,z-lobe.z)<lobe.r-1.4?liftAt(x,z)+mountainH(x,z):-100;
  let lo=1e9,hi=-1e9;
  for(let u=-4.6;u<=4.61;u+=.4)for(let v=-3.6;v<=3.61;v+=.4){const x=d.x+u*co-v*si,z=d.z+u*si+v*co,h=terrain(x,z);
   if(h<-50)return {valid:false,reason:'het huis steekt over de rand van het eiland'};lo=Math.min(lo,h);hi=Math.max(hi,h);
   if(nearTrail(x,z,0))return {valid:false,reason:'er loopt een pad over de bouwplek'};
   if(solids.blocked(x,z,st,h+.05,.1,2.2))return {valid:false,reason:'er staat iets op de bouwplek'}}
  if(hi-lo>.35)return {valid:false,reason:'de grond is hier te scheef'};
  const e=c.door,h=terrain(e.x,e.z);if(h<-50||Math.abs(h-lo)>.5||solids.blocked(e.x,e.z,st,h+.05,.35,2.2))return {valid:false,reason:'de voordeur komt niet vrij uit'};
  return {valid:true}}
 let houseLastS=null,houseGhostDesign=null;
 function sync(s){houseLastS=s;houseSync(s,houseGhostDesign);flags.length=0;{const tn=towerProgress(s);for(const k in towerGroups)towerGroups[k].visible=towerShow[k](tn)}portPads.forEach((list,i)=>list.forEach(m=>m.visible=s.stage<=i));{// parts laid so far for the mission in progress (1.20): a bridge shows its stone, then its frame, then the whole span
  const built=s.parts&&s.parts.m===s.stage?s.parts.n:0;
  bridgeGroups.forEach(b=>{const full=s.stage>=b.stage,n=b.stage===s.stage+1?built:0;b.parts.forEach((list,i)=>list.forEach(g=>g.visible=full||n>i))});
  // the Molenhoeve mill: rubble at its foot until the foot is mended, then the stocks and lattice, the sails last
  if(farmRotor){const whole=s.stage>=4,n=s.stage===3?built:0;farmRotor.visible=whole||n>=2;farmRotor.traverse(o=>{if(o.name==='sail')o.visible=whole});if(millDebris)millDebris.visible=!whole&&n<1}}beaconBeam.visible=sweep.visible=s.stage>=3;beaconLight.intensity=s.stage>=3?16:3;core.material.emissiveIntensity=s.stage>=3?2.4:1.1;if(lightTower)[].concat(lightTower.material).forEach(m=>{if(m.emissiveMap)m.emissiveIntensity=s.stage>=3?2.6:.15});if(farmRotor)farmRotor.userData.stopped=s.stage<4;if(craneHook)craneHook.userData.live=s.stage>=5;if(signalFire)signalFire.visible=s.stage>=6;builds.clear();s.builds.forEach(b=>construction(b.x,b.z,b.y,b.type));gates.forEach((o,i)=>o.g.visible=s.stage===2&&!s.rings.includes(i))}
 let camFree=null,camY=null,camLift=null;
 function ground(x,z,s,y=100){if(inside)return inside.floorAt(x-inside.x,z,y);const L=liftAt(x,z);let h=islands.some(i=>Math.hypot(x-i.x,z-i.z)<i.r-.35)||Math.hypot(x-lobe.x,z-lobe.z)<lobe.r-.35?L+mountainH(x,z):-100;
 for(const b of bridges){if(b.stage>s.stage)continue;const o=onBridge(b,x,z,2.3);if(o&&o.v<b.hw-.02)h=Math.max(h,o.y+.19)}
 if(tower)h=Math.max(h,tower.stairs(x,z,s,y));
 h=Math.max(h,house.floor(x,z,y));
 return Math.max(h,solids.floor(x,z,s,y))}
 function blocked(x,z,s,y,r=.355,height=2.68){
  if(inside){const lx=x-inside.x,up=y>3;return Math.abs(lx)>4.75-r||Math.abs(z)>4.73-r||!up&&Math.hypot(x-inside.npc.x,z-inside.npc.z)<r+.27||!up&&inside.rects.some(q=>Math.abs(lx-q.x)<q.w/2+r&&Math.abs(z-q.z)<q.d/2+r)||inside.blockAt(lx,z,y,r)}
  {const yy=y-liftAt(x,z);if(yy<-.16&&yy> -16&&(islands.some(i=>Math.hypot(x-i.x,z-i.z)<i.r-.32)||Math.hypot(x-lobe.x,z-lobe.z)<lobe.r-.32))return true}
  for(const b of bridges){if(b.stage>(s?.stage??3))continue;const o=onBridge(b,x,z,.3);if(o&&o.v>b.hw-r&&o.v<b.hw+.9&&y-o.y>-1&&y-o.y<1.7)return true}
  if(r>=.3&&height>2&&walkers?.blocks(x,z,r))return true;
  if(tower&&tower.block(x,z,s,y))return true;
  if(house.block(x,z,y,r))return true;
  return solids.blocked(x,z,s,y,r,height)
 }
 function animate(t,s,p,view,start,dt){swingBunting(t);if(houseNow&&houseNow.done>=4)houseNow.roof.visible=start||!house.inside(p.x,p.z,p.y);if(towerFlag&&towerFlag.parent?.visible){const q=towerFlag.geometry.attributes.position;for(let i=0;i<q.count;i++){const x=q.getX(i)+.475;q.setZ(i,Math.sin(t*5-x*5)*.08*x)}q.needsUpdate=true}rotors.forEach((v,i)=>{if(!v.userData.stopped)v.rotation.z=t*(i?.48:.61)});if(craneHook){const u=craneHook.userData,up=u.live?2.2+1.7*Math.sin(t*.45):.4;u.block.position.y=up;u.rope.position.y=(up+.4+6.35)/2;u.rope.scale.y=6.35-(up+.4)}
  if(signalFire?.visible)signalFire.children.forEach((c,i)=>{if(c.isMesh){c.scale.y=1+.25*Math.sin(t*9+i*2);c.rotation.y=t*(1+i*.3)}else c.intensity=12+4*Math.sin(t*13)});clouds.forEach(([g,y,k])=>g.position.y=y+Math.sin(t*k)*.52);falls.forEach(([f,y],i)=>f.position.y=y+.28*Math.sin(t*3+i));core.rotation.y=t;if(sweep.visible)sweep.rotation.y=t*.7;
  nodes.forEach(n=>{const was=n.g.visible;n.g.visible=!(s.harvest[n.i]>Date.now());n.g.scale.setScalar(.62+.095*(s.yield?.[n.i]??4));if(was&&!n.g.visible&&!start&&life)life.burst(n.x,2.1,n.z,n.type==='hout'?0xffcf6a:0x9fe3ff);n.marker.rotation.y=t;n.marker.position.y=2.25+.17*Math.sin(t*2+n.i)});
  for(const d of doors){let near;
   if(d.room){const r=inside&&inside.door===d?inside:null;near=!!r&&(Math.hypot(p.x-r.x-d.x,p.z-d.z)<1.9||t<r.entered+1.3)}
   else near=!inside&&!start&&Math.hypot(p.x-d.x,p.z-d.z)<2.7;
   d.open+=((near?1:0)-d.open)*(1-Math.exp(-(near?5:2.5)*Math.min(dt,.1)));d.pivot.rotation.y=d.ry+d.open*(d.out?-1.42:1.42)}
  for(const a of airships){const th=a.phase+t*.012,x=a.center.x+Math.cos(th)*a.rx,z=a.center.z+Math.sin(th)*a.rz;a.g.position.set(x,a.y+Math.sin(t*.35)*.9,z);a.g.rotation.set(Math.sin(t*.27)*.025,Math.atan2(Math.sin(th)*a.rx,-Math.cos(th)*a.rz),Math.sin(t*.31)*.03);for(const pr of a.props)pr.rotation.z=t*14}
  {const f=gondola.userData.f,c=cableAt(f),a=cableTop(cableA),b=cableTop(cableB);gondola.position.copy(c);gondola.rotation.y=Math.atan2(b.x-a.x,b.z-a.z)}
  cascadeUniforms.time.value=t;for(const [m,s,o] of mists){m.material.opacity=.32+.16*Math.sin(t*.5+o);const k=1+.08*Math.sin(t*.4+o);m.scale.set(s*k,s*.6*k,1)}
  // All streams share one flow texture: scroll each texture once per frame, not once per mesh (PR #8).
  {const moved=new Set();for(const f of torrents){const map=f.material?.map;if(!map||moved.has(map))continue;moved.add(map);map.offset.y=(map.offset.y-dt*(f.geometry.type==='PlaneGeometry'?1.6:.9))%1}}
  for(const f of flags){const q=f.geometry.attributes.position;for(let i=0;i<q.count;i++){const x=q.getX(i)+.55;q.setZ(i,Math.sin(t*5-x*4)*.09*x)}q.needsUpdate=true}
  fauna?.update(t,dt,start?{x:0,y:0,z:13}:p,s,inside);walkers?.update(t,dt,start?{x:0,y:0,z:13}:p,inside,s);
  sail.visible=!start&&!!p.glide;const portrait=start?{x:0,y:0,z:13,heading:Math.PI+.32+.13*Math.sin(t*.37),on:true,speed:0,walk:0}:p;hero.pose(t,portrait,dt,view.yaw);
  shadow.position.set(portrait.x,Math.max(ground(portrait.x,portrait.z,s,portrait.y),-.6)+.082,portrait.z);
  let a=view.yaw,dist=view.dist,height=view.height;
  // view.look (right mouse button) tilts the camera: down behind the player, the aim up towards the sky
  const look=start?0:Math.max(-.15,Math.min(1,view.look||0));
  // (1.22) the camera follows the player's height through a short damper, so ridges, rocks and steps underfoot no
  // longer shake the whole picture; big changes (a jump, a ride, a respawn) are followed at once
  camY=start||camY==null||dt>=1||Math.abs(p.y-camY)>2.5?p.y:camY+(p.y-camY)*(1-Math.exp(-dt*9));const py=start?p.y:camY;
  let target=start?new T.Vector3(cam.aspect<.85?-.48:-1.65,1.58,12.5):new T.Vector3(p.x,py+1.35+Math.max(0,look)*4.2,p.z);
  let eye=start?new T.Vector3(-1+.14*Math.sin(t*.22),1.95,17.5):new T.Vector3(p.x+Math.sin(a)*dist,py+height*(1-.78*Math.max(0,look))-Math.min(0,look)*3,p.z+Math.cos(a)*dist);
  if(inside){target.set(p.x,p.y+1.65,p.z);const dd=Math.min(dist,4.2);{const ex=Math.max(inside.x-4.45,Math.min(inside.x+4.45,p.x+Math.sin(a)*dd)),ez=Math.max(-4.45,Math.min(4.45,p.z+Math.cos(a)*dd));eye.set(ex,Math.min(inside.ceil(ex-inside.x,ez,p.y)-.4,p.y+2.35),ez)}if(inside.actor.mixer||inside.actor.update)resident(inside,t,Math.min(dt,.1),p);else{inside.actor.root.rotation.y=Math.atan2(inside.npc.x-p.x,inside.npc.z-p.z);inside.actor.blend([])}if(inside.accent.intensity)inside.accent.intensity=6+1.6*Math.sin(t*9)*Math.sin(t*3.7)}
  // 1.22: the free distance is measured along the direction to the wanted eye (not along the lagging camera), with a
  // margin around the lens so the near plane never cuts into a slope, a rock or a wall; it shrinks quickly and grows
  // back slowly. Before, the camera was snapped in after its smooth move out every frame, which made it shake against
  // walls, and it could end up inside mountains and rocks.
  let aim=null;
  if(!start&&!inside){
   const want=eye.clone().sub(target),wd=want.length();want.normalize();
   const near=canopies.filter(o=>Math.abs(o.x-target.x)<16&&Math.abs(o.z-target.z)<16);
   const terrain=(x,z)=>{const L=liftAt(x,z);return islands.some(i=>Math.hypot(x-i.x,z-i.z)<i.r+.6)||Math.hypot(x-lobe.x,z-lobe.z)<lobe.r+.6?L+mountainH(x,z):-100};
   // (1.24.1) margin to a mountain measured square to the slope (about 0.38 m), not as a fixed height above the
   // highest point within half a metre: on a steep face that old margin was two metres and left the camera no room
   const slopeNear=q=>{const h0=terrain(q.x,q.z),hs=[terrain(q.x+.35,q.z),terrain(q.x-.35,q.z),terrain(q.x,q.z+.35),terrain(q.x,q.z-.35)];
    if(h0<-50)return hs.some(h=>h>-50&&q.y<h+.45);const v=hs.map(h=>h<-50?h0:h),k=Math.hypot(v[0]-v[1],v[2]-v[3])/.7;return (q.y-h0)/Math.sqrt(1+k*k)<.38};
   const hit=q=>q.y<ground(q.x,q.z,s,q.y+.5)+.5||slopeNear(q)||blocked(q.x,q.z,s,q.y-.35,.42,.7)||
    rotorDiscs.some(o=>Math.abs(q.z-o.z)<.9&&Math.hypot(q.x-o.x,q.y-o.y)<o.r+.3)||near.some(o=>{const k=(q.y-o.y)/o.h;return k>.12&&k<1&&Math.hypot(q.x-o.x,q.z-o.z)<o.r*(1-k)+.4});
   // (1.24.1) Steep slope, rock or wall right behind you: the camera no longer squeezes into it (it used to keep at
   // least 1.1 m, even inside a mountain). It rises over your head, up to nearly straight above, until it finds
   // room, and looks down at you from there. It never stops past the first obstacle along its line, it pulls in at
   // once and only glides back out slowly, and if its glide would still cut through a slope it jumps to the free spot.
   // hit() keeps a safety margin around the lens; solid() is the real surface. Right against a cliff the margin starts
   // at your head, so there the camera may come into the margin (never past the surface) and you see from your head.
   const solid=q=>q.y<ground(q.x,q.z,s,q.y+.5)||q.y<terrain(q.x,q.z)+.06||blocked(q.x,q.z,s,q.y-.1,.12,.2);
   const march=dir=>{for(let d=.3;d<=wd;d+=.17)if(hit(target.clone().addScaledVector(dir,d))){if(d-.4>=.9)return d-.4;let e=.05;for(;e<=wd;e+=.05)if(solid(target.clone().addScaledVector(dir,e)))break;return Math.max(.12,Math.min(Math.max(1.1,d-.4),e-.25))}return wd};
   const hz=Math.hypot(want.x,want.z)||1e-6,el=Math.atan2(want.y,hz),room=Math.min(wd,1.9),tilt=e=>{const c=Math.cos(e);return new T.Vector3(want.x/hz*c,Math.sin(e),want.z/hz*c)};
   let free=march(want),lift=0;
   if(free<room){let best=free;for(let e=el+.15;e<1.5;e+=.15){const f=march(tilt(e));if(f>best+.2){best=f;lift=e-el}if(f>=room)break}}
   camLift=camLift==null||dt>=1?lift:camLift+(lift-camLift)*(1-Math.exp(-dt*(lift>camLift?16:2.2)));
   // the higher it rises, the closer it stays, so you look down at yourself rather than at the island from the sky
   if(camLift>.01){want.copy(tilt(Math.min(1.5,el+camLift)));free=Math.min(march(want),wd*(1-.45*Math.min(1,camLift)))}
   camFree=camFree==null||dt>=1?free:camFree+(free-camFree)*(1-Math.exp(-dt*(free<camFree?22:2.5)));
   const goal=target.clone().addScaledVector(want,Math.min(wd,camFree,free));
   if(camLift<.01&&camFree<3){const up=goal.clone();up.y=Math.max(up.y,target.y+(3-camFree)*.9+.4);if(!hit(up))goal.copy(up)}
   cam.position.lerp(goal,dt>=1?1:1-Math.exp(-dt*10));
   const lim=goal.distanceTo(target),off=cam.position.clone().sub(target),od=off.length();if(od>lim+.05)cam.position.copy(target).addScaledVector(off.normalize(),lim);
   if(solid(cam.position))cam.position.copy(goal);
   // squeezed in so far that you would look into your own head: hide the explorer and look ahead from the head
   hero.root.visible=cam.position.distanceTo(target)>.95;if(!hero.root.visible)aim=new T.Vector3(target.x-Math.sin(a)*4,target.y-.25,target.z-Math.cos(a)*4);
  }else{cam.position.lerp(eye,dt>=1?1:1-Math.exp(-dt*10));hero.root.visible=true}
  cam.lookAt(aim||target);if(!start)fellSync(s);firLod(cam.position);
  if(inside&&(portalTick++%(inside.door.open>.02?3:6)===0||dt>=1))renderPortal();
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
 // Realistic firs (LOLIPOP, "Realistic fir trees pack", CC BY 4.0): three tall and three medium trees, each in three
 // levels of detail. Near the camera the full tree, further on the lighter one and beyond 80 m a billboard; the
 // instances are re-sorted whenever the camera has moved a couple of metres. Trees sway with the shared wind.
 let firSet=null;const firAt=new T.Vector3(1e9,0,0);
 function plantFirs(){const names=[];for(let v=1;v<=6;v++)for(const l of [1,2,3])names.push('fir'+v+'_l'+l);
  Promise.all(names.map(Models.load)).then(list=>{const H=[9.31,9.24,8.1,4.43,4.16,6.61],Q=new T.Quaternion(),S=new T.Vector3(),P=new T.Vector3(),Y=new T.Vector3(0,1,0),sets=[[],[],[],[],[],[]],mats=new Set();
   pines.forEach((t,pi)=>{const k=(t.h>=5?0:3)+t.v,sc=t.h*FIR/H[k];P.set(t.x,t.y-.05,t.z);Q.setFromAxisAngle(Y,t.ry);S.set(sc,sc*(.94+.12*((t.v*7+Math.abs(Math.round(t.x)))%5)/4),sc);sets[k].push({x:t.x,y:t.y,z:t.z,id:'t'+pi,m:new T.Matrix4().compose(P,Q,S)})});
   firSet=sets.map((trees,k)=>{if(!trees.length)return null;return {trees,tiers:[0,1,2].map(l=>{const r=list[k*3+l],mesh=new T.InstancedMesh(r.geometry,r.material,trees.length);
     mesh.count=0;mesh.visible=false;mesh.castShadow=l<2;mesh.receiveShadow=true;mesh.frustumCulled=false;scene.add(mesh);for(const m of [].concat(r.material))mats.add(m);return mesh})}}).filter(Boolean);
   mats.forEach(m=>{if(!m.userData.swayed){m.userData.swayed=true;Nature.sway(m,.0016)}});
   scene.traverse(o=>{if(o.isInstancedMesh&&(o.geometry===pineTrunk||conifers.includes(o.geometry)))o.visible=false});firAt.set(1e9,0,0)
  }).catch(e=>console.warn('firs',e))}
 // felled firs: hidden from the LOD sets, a scanned stump in their place until s.harvest says they have grown back
 const felled=new Set(),stumps=new Map();let felledAt=0;
 function fellSync(s,force){const now=Date.now();if(!force&&now-felledAt<800)return;felledAt=now;let changed=false;
  pines.forEach((t,pi)=>{const id='t'+pi,down=s.harvest?.[id]>now;if(down===felled.has(id))return;changed=true;
   if(down){felled.add(id);const st=new T.Group();st.position.set(t.x,t.y-.03,t.z);scene.add(st);stumps.set(id,st);
    if(scanReady)Models.load('stump').then(r=>{const m=new T.Mesh(r.geometry,r.material);m.scale.setScalar(.5+t.h*.05);m.rotation.y=pi;m.castShadow=m.receiveShadow=true;st.add(m)}).catch(()=>{});
    else{const m=new T.Mesh(cyl,new T.MeshStandardMaterial({color:0x6b5446}));m.scale.set(.3,.35,.3);m.position.y=.17;st.add(m)}}
   else{felled.delete(id);const st=stumps.get(id);if(st){scene.remove(st);stumps.delete(id)}}});
  if(changed)firAt.set(1e9,0,0)}
 function firLod(c){if(!firSet||firAt.distanceToSquared(c)<6)return;firAt.copy(c);
  for(const {trees,tiers} of firSet){const n=[0,0,0];for(const t of trees){if(felled.has(t.id))continue;const d=Math.hypot(t.x-c.x,t.z-c.z,(t.y-c.y)*.5),l=d<24?0:d<80?1:2;tiers[l].setMatrixAt(n[l]++,t.m)}
   tiers.forEach((m,l)=>{m.count=n[l];m.visible=n[l]>0;m.instanceMatrix.needsUpdate=true})}}
 // (1.23) Scanned rock (Poly Haven Rock Face 02 and Rock Moss Set 01, CC0) on the walkable islands, instanced per model.
 // Rock faces stand in the upper cliff wall facing outwards: big ones beside and under every bridge head (that is
 // where you look at the cliffs from), a ring of medium ones below the turf and a lower ring of light ones. Mossy
 // stones break up the grass rim, except at bridge heads, paths and where two islands meet.
 function scanInstances(name,list,{shadow=true,tint=null}={}){if(!scanReady||!list.length)return;Models.load(name).then(r=>{const mat=tint?r.material.clone():r.material;if(tint)mat.color.setRGB(...tint);if(/rockface/.test(name))mat.side=T.DoubleSide;
  const m=new T.InstancedMesh(r.geometry,mat,list.length),o=new T.Object3D();
  list.forEach((q,j)=>{o.position.set(q[0],q[1],q[2]);o.rotation.set(q[4]||0,q[3]||0,q[5]||0,'YXZ');o.scale.set(q[6],q[7]??q[6],q[8]??q[6]);o.updateMatrix();m.setMatrixAt(j,o.matrix)});
  m.castShadow=shadow;m.receiveShadow=true;m.computeBoundingSphere();scene.add(m)}).catch(e=>console.warn('scan',name,e))}
 {const walk=[...islands,{x:lobe.x,z:lobe.z,r:lobe.r,lift:0,lobe:true}],heads=[];let rs=4242;const rr=()=>(rs=(rs*16807)%2147483647)/2147483647;
  bridges.forEach(b=>{heads.push({I:b.from,x:b.ax,z:b.az,hw:b.hw,y:b.ya});heads.push({I:b.to,x:b.bx,z:b.bz,hw:b.hw,y:b.yb})});
  const inside=(x,z,self)=>walk.some(J=>J!==self&&Math.hypot(x-J.x,z-J.z)<J.r-.3);
  const nearHead=(I,a,m)=>heads.some(H=>H.I===I&&Math.abs(Math.atan2(Math.sin(a-Math.atan2(H.z-I.z,H.x-I.x)),Math.cos(a-Math.atan2(H.z-I.z,H.x-I.x))))*I.r<H.hw+m);
  const hi=[],mid=[],lo=[],moss=[[],[],[],[],[],[]],face=(I,a,top,sc,rad,list)=>{const ca=Math.cos(a),sa=Math.sin(a),px=I.x+ca*rad,pz=I.z+sa*rad;
   list.push([px,top-4.73*sc,pz,Math.atan2(ca,sa)+(rr()-.5)*.3,(rr()-.5)*.12,(rr()-.5)*.1,sc*(.95+rr()*.15),sc,sc])};
  heads.forEach(H=>{const I=H.I,a0=Math.atan2(H.z-I.z,H.x-I.x);for(const sg of [-1,1]){const a=a0+sg*(H.hw+3.4)/I.r;face(I,a,I.lift-.4,1.3+rr()*.25,I.r*1.0-1.9,hi)}
   face(I,a0,H.y-2.2,1.15,I.r*.98-1.6,mid)});
  walk.forEach(I=>{const D=(I.r*.95)*1.22,tier2=I.lift-.3-Math.pow(.2,1.12)*(D-.3);
   for(let a=rr()*.4;a<Math.PI*2;a+=18/I.r){if(nearHead(I,a,4.5))continue;const x=I.x+Math.cos(a)*I.r,z=I.z+Math.sin(a)*I.r;if(inside(x,z,I))continue;face(I,a,I.lift-.35-rr()*.4,1.05+rr()*.35,I.r-1.7,mid)}
   for(let a=9/I.r+rr()*.3;a<Math.PI*2;a+=26/I.r){const x=I.x+Math.cos(a)*I.r,z=I.z+Math.sin(a)*I.r;if(inside(x,z,I)||nearHead(I,a,1))continue;face(I,a,tier2+1.5,1.1+rr()*.4,I.r*.96-1.8,lo)}
   for(let a=rr();a<Math.PI*2;a+=(5.6+rr()*3.6)/I.r){const ca=Math.cos(a),sa=Math.sin(a),x=I.x+ca*I.r,z=I.z+sa*I.r;
    if(nearHead(I,a,2.5)||inside(x,z,I)||nearTrail(x,z,1.6))continue;const k=Math.floor(rr()*6),sc=.42+rr()*.5,rad=I.r*(1+.004*Math.sin(a*9))-.35-rr()*.5;
    moss[k].push([I.x+ca*rad,I.lift-.55-sc*.35,I.z+sa*rad,rr()*6.28,(rr()-.5)*.3,(rr()-.5)*.3,sc,sc*(.8+rr()*.4),sc])}});
  const rockTint=[.92,.9,.88];scanInstances('rockface',hi,{tint:rockTint});scanInstances('rockface_mid',mid,{tint:rockTint});scanInstances('rockface_lo',lo,{shadow:false,tint:rockTint});
  moss.forEach((list,k)=>scanInstances('rmoss_'+(k+1),list));
  window.__cliffCounts={hi:hi.length,mid:mid.length,lo:lo.length,moss:moss.reduce((n,l)=>n+l.length,0)}}
 if(context&&typeof Models!=='undefined'){Models.setAnisotropy(Math.min(4,renderer.capabilities.getMaxAnisotropy()));Models.load('sf_bookshelf').then(r=>r.material.color.setHex(0xa8876a)).catch(()=>{});dressStones(stoneMeshes,['stone_a','stone_b','stone_c'],true);dressStones(hangMeshes,['stone_lo','stone_lo2'],false,0xb6b0a6,1.1,triplanar(new T.MeshStandardMaterial({map:Models.texture('cliff_diff.jpg',true),normalMap:Models.texture('cliff_nor.jpg'),normalScale:new T.Vector2(1.35,1.35),roughness:.93,color:new T.Color(1.5,1.47,1.45)}),{scale:1/2.2}));dressCrags();dressStumps();plantFirs()}
 return {burst:(x,y,z,c)=>life&&life.burst(x,y,z,c),liftAt,bridges,airships,fauna,walkers,cable:{a:cableA,b:cableB,at:cableAt,gondola,stations:[stationA,stationB]},scarf:c=>hero.scarf(c),hold:n=>hero.hold?.(n),heroVisible:()=>hero.root.visible,rooms,enterRoom,outfit:hero.outfit,rig:()=>hero.rig?.(),appleTrees,trees:pines.map((t,i)=>({i:'t'+i,type:'hout',kind:'tree',x:t.x,z:t.z,y:t.y,max:2,regrow:300000})),rocks:rocks.map((r,i)=>({i:'r'+i,type:'steen',kind:'rock',x:r.x,z:r.z,y:r.y,r:r.r,max:2,regrow:180000})),fellSync,reach:hero.reach,equip:hero.equip,ceiling:solids.ceiling,housePlots,siteCheck,houseGhost:d=>{houseGhostDesign=d||null;houseSync(houseLastS,houseGhostDesign)},houseLocal:(x,z)=>houseNow?houseLocal(x,z):null,animate,resize,ground,blocked,sync,nodes,islands,gates,ports,construction,scene,cam}
}
