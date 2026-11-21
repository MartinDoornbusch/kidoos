"use strict";
// Living scenery: 3D trees and plants that sway in the wind, grass, drifting light and pickup sparks.
const Nature=(()=>{
 const T=THREE,wind={value:0};
 function rng(seed){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}}
 const wave=(x,y,z,s)=>Math.sin(x*1.7+s)*Math.sin(z*1.3+s*1.9)*.5+Math.sin(y*2.1+x*.8+s*2.7)*.5;

 // Anything above its local base bends with the wind; instances drift out of phase by position.
 function sway(material,amount){
  material.onBeforeCompile=s=>{s.uniforms.uWind=wind;
   s.vertexShader='uniform float uWind;\n'+s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
    #ifdef USE_INSTANCING
     vec2 root=vec2(instanceMatrix[3][0],instanceMatrix[3][2]);
    #else
     vec2 root=vec2(modelMatrix[3][0],modelMatrix[3][2]);
    #endif
    float lift=max(position.y,0.0),phase=uWind*1.6+root.x*.37+root.y*.29,gust=.6+.4*sin(uWind*.41+root.x*.05+root.y*.03);
    transformed.x+=(sin(phase)*.8+sin(phase*2.7)*.2)*lift*lift*${amount.toFixed(3)}*gust;
    transformed.z+=cos(phase*.83)*lift*lift*${(amount*.5).toFixed(3)}*gust;`)};
  material.customProgramCacheKey=()=>'sway'+amount;return material}

 function displace(geo,fn){const p=geo.attributes.position,v=new T.Vector3();for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);fn(v);p.setXYZ(i,v.x,v.y,v.z)}geo.computeVertexNormals();return geo}
 // Bakes parts into one geometry with per-vertex colour, so a whole tree is one instanced draw.
 function merge(parts){const pos=[],nor=[],col=[],uvs=[],c=new T.Color();
  for(const {geo,color,up,uvScale=[1,1]} of parts){const g=geo.index?geo.toNonIndexed():geo,p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;
   for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);pos.push(x,y,z);uvs.push(uv?uv.getX(i)*uvScale[0]:0,uv?uv.getY(i)*uvScale[1]:0);
    if(up)nor.push(0,1,0);else nor.push(n.getX(i),n.getY(i),n.getZ(i));
    if(typeof color==='function')c.copy(color(x,y,z));else c.set(color);col.push(c.r,c.g,c.b)}}
  const out=new T.BufferGeometry();out.setAttribute('position',new T.Float32BufferAttribute(pos,3));out.setAttribute('normal',new T.Float32BufferAttribute(nor,3));out.setAttribute('color',new T.Float32BufferAttribute(col,3));out.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));
  out.computeBoundingSphere();return out}
 const mix=(a,b,t)=>new T.Color(a).lerp(new T.Color(b),Math.max(0,Math.min(1,t)));

 // Layered fir with drooping, ragged branch tiers. Height 1, base radius about .5.
 function firGeometry(seed){const parts=[],s=seed*1.37;
  const trunk=new T.CylinderGeometry(.03,.075,.5,8);trunk.translate(0,.25,0);parts.push({geo:trunk,color:0x3a2a20});
  const tiers=8;
  for(let k=0;k<tiers;k++){const t=k/(tiers-1),rad=.5*(1-t*.86)+.035,hgt=.25-.1*t,y=.12+t*.72;
   const cone=new T.ConeGeometry(rad,hgt,18,3);cone.translate(0,y+hgt/2,0);
   displace(cone,v=>{const dx=v.x,dz=v.z,d=Math.hypot(dx,dz)/rad,a=Math.atan2(dz,dx);
    const ragged=1+.24*Math.max(0,Math.sin(a*9+k*2.1+s))+.08*Math.sin(a*17+s);
    v.x=dx*ragged;v.z=dz*ragged;v.y-=d*d*.11+wave(v.x*5,v.y*3,v.z*5,s+k)*.025});
   parts.push({geo:cone,uvScale:[Math.round(4+rad*10),1.2],color:(x,y,z)=>{const d=Math.hypot(x,z)/rad,h=.85+.3*(Math.sin(x*91+z*57+y*33)*.5+.5);return mix(0x31402c,0x8fa878,d*.85+t*.15).multiplyScalar(h)}})}
  const tip=new T.ConeGeometry(.04,.14,6);tip.translate(0,.93,0);parts.push({geo:tip,uvScale:[2,1],color:0x8fa878});
  return merge(parts)}

 // Blossom tree: twisted trunk, a few limbs and soft pink canopy clusters.
 function blossomGeometry(seed){const r=rng(seed*977+11),parts=[];
  const trunk=new T.CylinderGeometry(.045,.085,.52,8,4);trunk.translate(0,.26,0);
  displace(trunk,v=>{v.x+=Math.sin(v.y*5+seed)*.03;v.z+=Math.cos(v.y*4+seed)*.02});parts.push({geo:trunk,color:0x5a4238});
  const blobs=[];
  for(let i=0;i<4;i++){const a=i*1.7+seed,limb=new T.CylinderGeometry(.018,.035,.36,6);limb.translate(0,.18,0);
   limb.rotateZ(.75+r()*.3);limb.rotateY(a);limb.translate(0,.42,0);parts.push({geo:limb,color:0x5f463a});
   blobs.push([Math.cos(a)*.28,.68+r()*.12,-Math.sin(a)*.28,.2+r()*.06])}
  blobs.push([0,.86,0,.27],[.08,.62,.1,.17]);
  for(const [x,y,z,rad] of blobs){const g=new T.IcosahedronGeometry(rad,2);
   displace(g,v=>{const k=1+.22*wave(v.x*9,v.y*9,v.z*9,seed+x*10);v.multiplyScalar(k);v.y*=.8});g.translate(x,y,z);
   parts.push({geo:g,color:(px,py,pz)=>mix(0xa8506c,0xffc4d8,(py-y+rad)/(rad*2)*.85+(r()*.15))})}
  return merge(parts)}

 // Wildflower tuft: curved blades plus a few flower heads.
 function tuftGeometry(seed,petal){const r=rng(seed*331+7),parts=[];
  for(let i=0;i<9;i++){const h=.55+r()*.45,blade=new T.PlaneGeometry(.05,h,1,3);blade.translate(0,h/2,0);
   const lean=.15+r()*.35,a=r()*Math.PI*2;
   displace(blade,v=>{const t=v.y/h;v.x*=1-t*.85;v.z+=t*t*lean});blade.rotateY(a);
   parts.push({geo:blade,up:true,color:(x,y)=>mix(0x3c4a1f,0x9aa548,y/h)})}
  for(let i=0;i<4;i++){const a=r()*Math.PI*2,d=r()*.16,h=.65+r()*.35,stem=new T.CylinderGeometry(.007,.01,h,4);stem.translate(Math.cos(a)*d,h/2,Math.sin(a)*d);
   parts.push({geo:stem,color:0x55652a});
   const head=new T.IcosahedronGeometry(.055+r()*.03,1);head.scale(1,.55,1);head.translate(Math.cos(a)*d,h,Math.sin(a)*d);
   parts.push({geo:head,color:(x,y)=>mix(petal,0xfff3cf,(y-h+.03)*8)})}
  return merge(parts)}

 // One clump of grass blades; normals point up so blades light like the ground they grow from.
 function clumpGeometry(seed){const r=rng(seed+5),parts=[];
  for(let i=0;i<4;i++){const h=.7+r()*.3,blade=new T.PlaneGeometry(.1,h,1,2);blade.translate(0,h/2,0);const lean=.1+r()*.3,a=r()*Math.PI*2,ox=(r()-.5)*.2,oz=(r()-.5)*.2;
   displace(blade,v=>{const t=v.y/h;v.x*=1-t*.9;v.z+=t*t*lean});blade.rotateY(a);blade.translate(ox,0,oz);
   parts.push({geo:blade,up:true,color:(x,y)=>mix(0x4a5226,0xb3ad66,y/h)})}
  return merge(parts)}

 function needles(){const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d'),r=rng(19);
  g.fillStyle='#1c2a18';g.fillRect(0,0,256,256);
  for(let i=0;i<5200;i++){const x=r()*256,y=r()*256,l=5+r()*13,a=Math.PI/2+(r()-.5)*.9,v=r();
   g.strokeStyle=`hsl(${95+v*35},${30+v*25}%,${10+v*30}%)`;g.lineWidth=1+r()*1.4;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*l*.35,y+Math.sin(a)*l);g.stroke()}
  const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.anisotropy=4;return tex}
 const plantMaterial=sway(new T.MeshStandardMaterial({vertexColors:true,roughness:.9,side:T.DoubleSide}),.35);
 const treeMaterial=sway(new T.MeshStandardMaterial({vertexColors:true,roughness:.92,map:needles()}),.045);
 const blossomMaterial=sway(new T.MeshStandardMaterial({vertexColors:true,roughness:.8}),.04);

 // Grass in tiles, so tiles behind the camera or far away are skipped.
 function grass(scene,area,count,seed){const r=rng(seed),geo=clumpGeometry(seed),tiles=new Map(),m=new T.Object3D(),tint=new T.Color();
  for(const [x,z] of area(count,r)){const key=Math.floor(x/12)+','+Math.floor(z/12);if(!tiles.has(key))tiles.set(key,[]);tiles.get(key).push([x,z])}
  const meshes=[];
  for(const list of tiles.values()){const mesh=new T.InstancedMesh(geo,plantMaterial,list.length);
   list.forEach(([x,z],i)=>{const s=.14+r()*.2;m.position.set(x,0,z);m.rotation.set(0,r()*6.28,0);m.scale.set(s*1.2,s*(.8+r()*.6),s*1.2);m.updateMatrix();mesh.setMatrixAt(i,m.matrix);
    mesh.setColorAt(i,tint.setHSL(.13+r()*.06,.22+r()*.16,.5+r()*.14))});
   mesh.receiveShadow=true;mesh.computeBoundingSphere();scene.add(mesh);meshes.push(mesh)}
  return meshes}

 // Soft round sprites drawn in the shader; no texture needed.
 const spriteFrag=`varying vec3 vColor;varying float vAlpha;void main(){vec2 c=gl_PointCoord-.5;float d=length(c);float a=smoothstep(.5,.0,d);gl_FragColor=vec4(vColor,a*a*vAlpha);}`;
 function points(count,attrs,vertex,uniforms,additive){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(count*3),3));
  for(const [name,size,fill] of attrs){const a=new Float32Array(count*size);for(let i=0;i<count;i++)for(let k=0;k<size;k++)a[i*size+k]=fill(i,k);g.setAttribute(name,new T.BufferAttribute(a,size))}
  const mat=new T.ShaderMaterial({uniforms:{uTime:{value:0},uScale:{value:600},...uniforms},vertexShader:vertex,fragmentShader:spriteFrag,transparent:true,depthWrite:false,blending:additive?T.AdditiveBlending:T.NormalBlending});
  const o=new T.Points(g,mat);o.frustumCulled=false;return o}

 function life(scene,{chimneys,glades,valley}){
  const r=rng(4242),all=[];
  // Drifting pollen that follows the player.
  const motes=points(420,[['seed',3,()=>r()]],`uniform float uTime,uScale;uniform vec3 uCenter;attribute vec3 seed;varying vec3 vColor;varying float vAlpha;
   void main(){vec3 size=vec3(44.,10.,44.);vec3 p=seed*size+vec3(sin(uTime*.21+seed.y*40.)*1.4,uTime*.18+sin(uTime*.5+seed.x*30.)*.4,cos(uTime*.17+seed.z*20.)*1.4);
    p=mod(p-uCenter+size*.5,size)-size*.5+uCenter;p.y=uCenter.y-1.5+mod(p.y-uCenter.y+1.5,size.y);
    vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;float tw=.55+.45*sin(uTime*2.+seed.x*60.);
    gl_PointSize=uScale*.05*(.6+seed.z)/-mv.z;vColor=vec3(1.,.86,.55)*1.6;vAlpha=tw*smoothstep(1.5,5.,-mv.z)*smoothstep(42.,14.,-mv.z)*.8;}`,{uCenter:{value:new T.Vector3()}},true);
  scene.add(motes);all.push(motes);
  // Fireflies in sheltered spots.
  const flies=points(glades.length*14,[['seed',4,(i,k)=>k===3?Math.floor(i/14):r()]],`uniform float uTime,uScale;uniform vec3 uSpots[${glades.length}];attribute vec4 seed;varying vec3 vColor;varying float vAlpha;
   void main(){vec3 o=uSpots[int(seed.w)];float t=uTime*.35+seed.x*30.;vec3 p=o+vec3(sin(t)*2.6*seed.y+cos(t*.7)*1.2,.4+seed.z*1.6+sin(t*1.3)*.3,cos(t*.8)*2.6*seed.x+sin(t*.5)*1.1);
    vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;float blink=pow(max(0.,sin(uTime*1.7+seed.y*40.)),3.);
    gl_PointSize=uScale*.11/-mv.z;vColor=vec3(1.,.95,.45)*2.4;vAlpha=blink;}`,{uSpots:{value:glades.map(([x,z])=>new T.Vector3(x,0,z))}},true);
  scene.add(flies);all.push(flies);
  // Chimney smoke: each puff rises, widens and fades, then starts again.
  const per=26,smoke=points(chimneys.length*per,[['seed',4,(i,k)=>k===3?Math.floor(i/per):k===0?(i%per)/per:r()]],`uniform float uTime,uScale;uniform vec3 uFlue[${chimneys.length}];attribute vec4 seed;varying vec3 vColor;varying float vAlpha;
   void main(){float age=fract(uTime*.09+seed.x);vec3 p=uFlue[int(seed.w)]+vec3(age*2.4+sin(age*6.+seed.y*20.)*.35*age,age*6.5,sin(age*4.+seed.z*20.)*.4*age);
    vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=uScale*(.45+age*2.2)/-mv.z;
    vColor=mix(vec3(.55,.52,.5),vec3(.93,.9,.86),age);vAlpha=smoothstep(0.,.08,age)*(1.-age)*.62;}`,{uFlue:{value:chimneys.map(c=>new T.Vector3(...c))}},false);
  scene.add(smoke);all.push(smoke);
  // Petals drifting down through the blossom valley.
  const petals=points(220,[['seed',3,()=>r()]],`uniform float uTime,uScale;uniform vec3 uValley;attribute vec3 seed;varying vec3 vColor;varying float vAlpha;
   void main(){float fall=fract(uTime*.035+seed.y);vec3 p=uValley+vec3((seed.x-.5)*40.+sin(uTime*.6+seed.z*30.)*1.5+fall*6.,9.-fall*10.,(seed.z-.5)*40.+cos(uTime*.5+seed.x*20.));
    vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=uScale*.07/-mv.z;vColor=vec3(1.,.72,.82);vAlpha=smoothstep(0.,.1,fall)*smoothstep(1.,.85,fall)*.9;}`,{uValley:{value:new T.Vector3(...valley)}},false);
  scene.add(petals);all.push(petals);
  // Pickup sparks: a small pool that bursts from a point and falls back.
  const pool=96,sparks=points(pool,[['seed',3,()=>r()]],`uniform float uTime,uScale,uStart;uniform vec3 uFrom,uTint;attribute vec3 seed;varying vec3 vColor;varying float vAlpha;
   void main(){float a=uTime-uStart;float ang=seed.x*6.2832;vec3 v=vec3(cos(ang)*(1.5+seed.y*2.5),2.5+seed.z*4.,sin(ang)*(1.5+seed.y*2.5));
    vec3 p=uFrom+v*a+vec3(0.,-6.*a*a,0.);vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
    gl_PointSize=uScale*.09*(1.-a/1.3)/-mv.z;vColor=uTint*2.2;vAlpha=a<0.||a>1.3?0.:1.-a/1.3;}`,{uStart:{value:-10},uFrom:{value:new T.Vector3()},uTint:{value:new T.Color(1,.78,.32)}},true);
  scene.add(sparks);
  const flash=new T.Mesh(new T.RingGeometry(.8,1,40),new T.MeshBasicMaterial({color:0xffd27a,transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide}));flash.visible=false;scene.add(flash);
  let flashAt=-10;
  return {
   burst(x,y,z,color=0xffd27a){sparks.material.uniforms.uFrom.value.set(x,y,z);sparks.material.uniforms.uTint.value.set(color);sparks.material.uniforms.uStart.value=sparks.material.uniforms.uTime.value;
    flash.position.set(x,y,z);flash.material.color.set(color);flashAt=sparks.material.uniforms.uTime.value},
   update(t,center,cam,height){wind.value=t;const scale=height*.5/Math.tan(cam.fov*Math.PI/360);
    for(const o of [...all,sparks]){o.material.uniforms.uTime.value=t;o.material.uniforms.uScale.value=scale}
    motes.material.uniforms.uCenter.value.copy(center);
    const a=t-flashAt;flash.visible=a>=0&&a<.6;if(flash.visible){const k=1+a*5;flash.scale.set(k,k,k);flash.quaternion.copy(cam.quaternion);flash.material.opacity=1-a/.6}}
  }}
 return {wind,sway,rng,displace,merge,firGeometry,blossomGeometry,tuftGeometry,plantMaterial,treeMaterial,blossomMaterial,grass,life}
})();
