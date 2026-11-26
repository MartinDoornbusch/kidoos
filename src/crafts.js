"use strict";
// (1.25) Hand-built props with real joinery instead of primitive stand-ins: the stone cart in the quarry and the brass
// telescope on the Valkenrots. Every part is a board, a tube, a ring or a lathe profile with its size in metres. Parts
// that share a material are merged into one mesh (one draw call per material), and wood gets UVs at true scale with
// the grain running along each part's long side, so boards, spokes and legs read as sawn oak instead of a flat colour.
const Crafts=(()=>{
 const T=THREE,tex={};
 const surf=(file,nor)=>{if(!tex[file]){const t=loadSurface(file);if(nor)t.colorSpace=T.NoColorSpace;tex[file]=t}return tex[file]};
 let mats=null;
 function M(){if(mats)return mats;
  const oak=(color,rough)=>new T.MeshStandardMaterial({map:surf('timber_oak.jpg'),normalMap:surf('timber_oak_nor.jpg',true),normalScale:new T.Vector2(1.1,1.1),roughness:rough,color});
  mats={bark:new T.MeshStandardMaterial({map:surf('timber_oak.jpg'),normalMap:surf('timber_oak_nor.jpg',true),color:0x5a4a4e,roughness:.8}),glow:new T.MeshStandardMaterial({color:0xffe2a0,emissive:0xffb050,emissiveIntensity:3}),crystal:new T.MeshStandardMaterial({color:0xa8ecff,emissive:0x3fc6ff,emissiveIntensity:1.5,metalness:.1,roughness:.12,transparent:true,opacity:.92}),crystalB:new T.MeshStandardMaterial({color:0xd8b8ff,emissive:0x9a5cff,emissiveIntensity:1.4,metalness:.1,roughness:.12,transparent:true,opacity:.92}),wood:oak(0xd8c9b2,.86),paleWood:oak(0xfff0d8,.88),darkWood:oak(0x9a7656,.62),
   iron:new T.MeshStandardMaterial({color:0x35322e,metalness:.65,roughness:.52}),
   brass:new T.MeshStandardMaterial({color:0xcca865,metalness:.92,roughness:.28}),
   bronze:new T.MeshStandardMaterial({color:0x8a6638,metalness:.88,roughness:.34}),
   black:new T.MeshStandardMaterial({color:0x17191b,metalness:.25,roughness:.42}),
   glass:new T.MeshStandardMaterial({color:0x2c4f63,metalness:.55,roughness:.03,envMapIntensity:1.8})};
  return mats}
 // wood texture: .3 m across the grain, 1.6 m along it
 const GU=.3,GV=1.6;let seed=1;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
 function woodUV(g,dims){const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv,L=dims.indexOf(Math.max(...dims)),ou=rnd()*4,ov=rnd()*4;
  for(let i=0;i<p.count;i++){const c=[p.getX(i),p.getY(i),p.getZ(i)],an=[Math.abs(n.getX(i)),Math.abs(n.getY(i)),Math.abs(n.getZ(i))],N=an.indexOf(Math.max(...an)),ax=[0,1,2].filter(a=>a!==N);
   let u,v;if(ax.includes(L)){const o=ax.find(a=>a!==L);u=c[o]/GU;v=c[L]/GV}else{u=c[ax[0]]/GU;v=c[ax[1]]/GU}uv.setXY(i,u+ou,v+ov)}
  uv.needsUpdate=true;return g}
 const board=(sx,sy,sz)=>woodUV(new T.BoxGeometry(sx,sy,sz),[sx,sy,sz]);
 // a tapered round part along its own y axis: r0 at the bottom (-y), r1 at the top
 function rod(r0,r1,h,seg=10){const g=new T.CylinderGeometry(r1,r0,h,seg),uv=g.attributes.uv,ou=rnd()*4,ov=rnd()*4,C=2*Math.PI*Math.max(r0,r1);
  for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*C/GU+ou,uv.getY(i)*h/GV+ov);return g}
 // a flat ring in the xy plane, depth along +z; wood UVs follow the circumference (seam triangles unwrapped)
 function ring(ro,ri,d,seg=48){const s=new T.Shape();s.absarc(0,0,ro,0,Math.PI*2,false);const h=new T.Path();h.absarc(0,0,ri,0,Math.PI*2,true);s.holes.push(h);
  let g=new T.ExtrudeGeometry(s,{depth:d,bevelEnabled:false,curveSegments:seg});if(g.index)g=g.toNonIndexed();const p=g.attributes.position,uv=g.attributes.uv;
  for(let t=0;t<p.count;t+=3){const a=[0,1,2].map(j=>Math.atan2(p.getY(t+j),p.getX(t+j))),wrap=Math.max(...a)-Math.min(...a)>Math.PI;
   for(let j=0;j<3;j++){const i=t+j,aa=wrap&&a[j]<0?a[j]+Math.PI*2:a[j];uv.setXY(i,(Math.hypot(p.getX(i),p.getY(i))+p.getZ(i))/GU*1.4,aa*ro/GV)}}
  return g}
 const lathe=(pts,seg=24)=>new T.LatheGeometry(pts.map(([r,y])=>new T.Vector2(r,y)),seg);
 const E=new T.Euler(),Qa=new T.Quaternion(),S1=new T.Vector3(1,1,1),Y=new T.Vector3(0,1,0);
 const mx=(x,y,z,rx=0,ry=0,rz=0)=>new T.Matrix4().compose(new T.Vector3(x,y,z),Qa.clone().setFromEuler(E.set(rx,ry,rz)),S1);
 // a y-axis part placed from point a to point b
 const span=(a,b)=>{const d=new T.Vector3().subVectors(b,a),L=d.length();return [L,new T.Matrix4().compose(new T.Vector3().addVectors(a,b).multiplyScalar(.5),new T.Quaternion().setFromUnitVectors(Y,d.normalize()),S1)]};
 function merge(list){const geos=list.map(([g,m])=>{const q=g.index?g.toNonIndexed():g.clone();q.applyMatrix4(m);return q});
  let n=0;for(const q of geos)n+=q.attributes.position.count;const pos=new Float32Array(n*3),nor=new Float32Array(n*3),uv=new Float32Array(n*2);let o=0;
  for(const q of geos){pos.set(q.attributes.position.array,o*3);nor.set(q.attributes.normal.array,o*3);if(q.attributes.uv)uv.set(q.attributes.uv.array,o*2);o+=q.attributes.position.count}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(pos,3));g.setAttribute('normal',new T.BufferAttribute(nor,3));g.setAttribute('uv',new T.BufferAttribute(uv,2));g.computeBoundingSphere();return g}
 function kit(){const parts=new Map();return {add(mat,g,m){if(!parts.has(mat))parts.set(mat,[]);parts.get(mat).push([g,m])},
  build(group){let tris=0;for(const [mat,list] of parts){const geo=merge(list),mesh=new T.Mesh(geo,M()[mat]);tris+=geo.attributes.position.count/3;mesh.castShadow=mesh.receiveShadow=true;mesh.name='craft-'+mat;group.add(mesh)}group.userData.tris=tris;return group}}}

 // A spoked cart wheel in the xy plane: turned hub with iron bands, ten tapered spokes, an oak felloe and an iron tyre.
 function wheel(k,x,y,z,R){
  k.add('wood',ring(R-.03,R-.088,.07),mx(x,y,z-.035));k.add('iron',ring(R,R-.03,.078,56),mx(x,y,z-.039));
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2+.2;k.add('iron',new T.CylinderGeometry(.009,.009,.012,6),mx(x+Math.cos(a)*(R-.015),y+Math.sin(a)*(R-.015),z+.04,Math.PI/2))}
  k.add('darkWood',lathe([[0,-.11],[.06,-.11],[.078,-.085],[.09,-.03],[.092,0],[.088,.04],[.07,.09],[.045,.12],[.03,.135],[0,.135]],20),mx(x,y,z,Math.PI/2*(z<0?-1:1)));
  for(const t of [-.055,.06])k.add('iron',new T.TorusGeometry(.091,.007,6,22),mx(x,y,z+t));
  const r0=.085,r1=R-.085,L=r1-r0;for(let i=0;i<10;i++){const a=i/10*Math.PI*2+.15,rm=(r0+r1)/2;k.add('wood',rod(.023,.016,L,8),mx(x+Math.cos(a)*rm,y+Math.sin(a)*rm,z,0,0,a-Math.PI/2))}}

 // Two-wheeled quarry cart: sills running on into the handles, a six-plank floor, stake-and-board sides, a tailgate,
 // an iron axle, two legs under the handles so it stands level, and iron bolts at every stake.
 function stoneCart(){seed=11;const k=kit(),R=.46,W=.64,fy=.62,bolt=()=>new T.CylinderGeometry(.013,.013,.014,8);
  for(const z of [-.32,.32]){k.add('wood',board(1.74,.09,.08),mx(.04,fy-.08,z));k.add('wood',rod(.034,.029,1.2,10),mx(1.5,fy-.08,z,0,0,-Math.PI/2));k.add('darkWood',rod(.036,.036,.16,10),mx(1.98,fy-.08,z,0,0,-Math.PI/2))}
  k.add('wood',board(.16,.11,1.18),mx(0,fy-.18,0));k.add('iron',rod(.032,.032,2*W+.16,12),mx(0,R,0,Math.PI/2));
  for(let i=0;i<6;i++)k.add('wood',board(1.68,.035,.152),mx(.04,fy-.017,-.42+i*.168,0,(rnd()-.5)*.012));
  for(const s of [-1,1]){for(const y of [fy+.085,fy+.255])k.add('wood',board(1.62,.15,.034),mx(.04,y,s*.5,0,(rnd()-.5)*.01));
   for(const x of [-.78,-.27,.3,.86]){k.add('wood',board(.058,.5,.058),mx(x,fy+.12,s*.546));for(const y of [fy+.085,fy+.255])k.add('iron',bolt(),mx(x,y,s*.58,Math.PI/2))}
   k.add('wood',board(.05,.05,.16),mx(.86,fy-.06,s*.44))}
  for(const y of [fy+.085,fy+.255])k.add('wood',board(.034,.15,1.03),mx(-.81,y,0));k.add('wood',board(.034,.15,1.03),mx(.89,fy+.085,0,0,0,.08));
  for(const [x,s] of [[-.81,1],[-.81,-1],[.89,1],[.89,-1]]){k.add('iron',new T.BoxGeometry(.12,.04,.008),mx(x-Math.sign(x)*.05,fy+.2,s*.519));k.add('iron',new T.BoxGeometry(.008,.04,.12),mx(x+Math.sign(x)*.02,fy+.2,s*.46))}
  for(const s of [-1,1]){const leg=span(new T.Vector3(1.66,0,s*.36),new T.Vector3(1.62,fy-.08,s*.32));k.add('wood',rod(.028,.032,leg[0],8),leg[1]);k.add('iron',new T.CylinderGeometry(.034,.034,.03,10),mx(1.66,.015,s*.36))}
  k.add('wood',board(.05,.05,.7),mx(1.64,.28,0));
  for(const s of [-1,1])wheel(k,0,R,s*W,R);
  return k.build(new T.Group())}

 // Brass refractor on a wooden surveyor's tripod: tapered tube with a dew shield and bronze bands, objective lens,
 // focuser with knurled knobs, draw tube and eyepiece, a finder scope on two brackets, a yoke with trunnions, and three
 // oak legs with brass shoes and spreader rods. It points out at azimuth +x, `el` radians above the horizon.
 function telescope(el=.6){seed=29;const k=kit(),H=1.14,piv=new T.Vector3(0,H+.13,0);
  const feet=[0,1,2].map(i=>{const a=i*Math.PI*2/3+Math.PI/3;return new T.Vector3(Math.cos(a)*.48,0,Math.sin(a)*.48)}),tops=feet.map(f=>new T.Vector3(f.x*.13,H-.05,f.z*.13));
  for(let i=0;i<3;i++){const [L,m]=span(feet[i],tops[i]);k.add('darkWood',rod(.019,.03,L,10),m);k.add('brass',new T.CylinderGeometry(.022,.016,.06,10),mx(feet[i].x,.03,feet[i].z));
   const on=tops[i].clone().lerp(feet[i],.42),[L2,m2]=span(new T.Vector3(0,H-.33,0),on);k.add('brass',rod(.007,.007,L2,6),m2);k.add('brass',new T.CylinderGeometry(.012,.012,.03,8),mx(on.x,on.y,on.z))}
  k.add('brass',new T.CylinderGeometry(.075,.085,.05,24),mx(0,H-.025,0));k.add('darkWood',rod(.03,.03,.3,12),mx(0,H-.2,0));k.add('brass',new T.CylinderGeometry(.04,.04,.03,16),mx(0,H-.35,0));
  k.add('brass',new T.CylinderGeometry(.045,.05,.05,20),mx(0,H+.025,0));for(const z of [-.085,.085])k.add('brass',new T.BoxGeometry(.06,.16,.014),mx(0,H+.1,z));
  k.add('bronze',new T.CylinderGeometry(.014,.014,.22,10),mx(piv.x,piv.y,0,Math.PI/2));for(const z of [-.11,.11])k.add('brass',new T.CylinderGeometry(.022,.022,.016,12),mx(0,piv.y,z,Math.PI/2));
  const tube=new T.Matrix4().compose(piv,new T.Quaternion().setFromEuler(E.set(0,0,el-Math.PI/2)),S1),at=(m)=>new T.Matrix4().multiplyMatrices(tube,m);
  k.add('brass',lathe([[0,-.44],[.046,-.44],[.056,-.43],[.056,-.4],[.052,-.39],[.054,.48],[.06,.5],[.074,.52],[.075,.76],[.07,.77],[.068,.765],[.068,.57],[.0,.57]],36),at(mx(0,0,0)));
  for(const y of [-.4,-.18,.12,.4])k.add('bronze',new T.CylinderGeometry(.0585,.0585,.02,36,1,true),at(mx(0,y,0)));
  k.add('bronze',new T.CylinderGeometry(.078,.078,.02,36,1,true),at(mx(0,.755,0)));k.add('glass',new T.CylinderGeometry(.067,.067,.006,36),at(mx(0,.575,0)));
  k.add('brass',lathe([[0,-.63],[.024,-.63],[.03,-.615],[.03,-.6],[.026,-.59],[.026,-.43],[0,-.43]],20),at(mx(0,0,0)));
  k.add('black',lathe([[0,-.74],[.019,-.74],[.024,-.735],[.024,-.715],[.02,-.71],[.02,-.63],[0,-.63]],20),at(mx(0,0,0)));
  k.add('brass',new T.CylinderGeometry(.01,.01,.16,10),at(mx(.0,-.46,0,Math.PI/2)));for(const z of [-.08,.08])k.add('bronze',new T.CylinderGeometry(.02,.02,.022,14),at(mx(0,-.46,z,Math.PI/2)));
  k.add('brass',new T.CylinderGeometry(.03,.034,.05,16),at(mx(.04,-.46,0,0,0,Math.PI/2)));
  k.add('brass',lathe([[0,-.06],[.012,-.06],[.012,.22],[.016,.23],[.017,.27],[0,.27]],16),at(mx(-.1,0,0)));k.add('black',new T.CylinderGeometry(.009,.009,.02,10),at(mx(-.1,-.07,0)));
  for(const y of [.02,.2]){k.add('brass',new T.BoxGeometry(.05,.012,.012),at(mx(-.075,y,0)));k.add('brass',new T.TorusGeometry(.015,.003,6,14),at(mx(-.1,y,0,Math.PI/2)))}
  return k.build(new T.Group())}
 // Built once, shared by every copy: a player may put down dozens of blocks.
 const cache=new Map();
 function shared(name,make){if(!cache.has(name)){const g=make();g.updateMatrixWorld(true);cache.set(name,g.children.map(m=>[m.geometry,m.material]))}
  const g=new T.Group();for(const [geo,mat] of cache.get(name)){const m=new T.Mesh(geo,mat);m.castShadow=m.receiveShadow=true;g.add(m)}return g}

 // The building block (2 x 1.12 x 2 m, stackable and climbable): an oak frame with four corner posts, four boards a
 // side with a diagonal brace, a deck of seven planks on top and iron corner brackets.
 function block(){return shared('block',()=>{seed=41;const k=kit(),H=1.12,P=.16;
  for(const sx of [-1,1])for(const sz of [-1,1])k.add('darkWood',board(P,H,P),mx(sx*(1-P/2),H/2,sz*(1-P/2)));
  for(const s of [-1,1])for(let i=0;i<4;i++){const y=.03+i*.265+.125;k.add('paleWood',board(2-2*P+.02,.25,.05),mx(0,y,s*.955,0,(rnd()-.5)*.006));k.add('paleWood',board(.05,.25,2-2*P+.02),mx(s*.955,y,0,0,(rnd()-.5)*.006))}
  for(const s of [-1,1]){const d=Math.atan2(H-.2,2-2*P-.1);k.add('paleWood',board(Math.hypot(2-2*P-.1,H-.2),.11,.03),mx(0,H/2,s*.99,0,0,s*d));k.add('paleWood',board(.03,.11,Math.hypot(2-2*P-.1,H-.2)),mx(s*.99,H/2,0,-s*d,0,0))}
  for(let i=0;i<7;i++)k.add('paleWood',board(2,.045,.27),mx(0,H-.0225,-1+.143+i*.2857,0,0,(rnd()-.5)*.004));
  for(const sx of [-1,1])for(const sz of [-1,1])for(const y of [.1,H-.12]){k.add('iron',new T.BoxGeometry(.22,.08,.012),mx(sx*(1-.11),y,sz*1.006));k.add('iron',new T.BoxGeometry(.012,.08,.22),mx(sx*1.006,y,sz*(1-.11)))}
  return k.build(new T.Group())})}

 // A garden bench: three seat slats, two back slats leaning back, legs with stretchers and armrests.
 function bench(){return shared('bench',()=>{seed=53;const k=kit();
  for(let i=0;i<3;i++)k.add('wood',board(1.3,.035,.13),mx(0,.46,.12-i*.145));
  for(const y of [.66,.82])k.add('wood',board(1.3,.11,.03),mx(0,y,-.25+(y-.6)*.12,-.14,0,0));
  for(const sx of [-1,1]){const x=sx*.58;k.add('darkWood',board(.06,.44,.06),mx(x,.22,.15));
   const [L,m]=span(new T.Vector3(x,0,-.2),new T.Vector3(x,.9,-.27));k.add('darkWood',rod(.03,.028,L,6),m);
   k.add('darkWood',board(.06,.04,.48),mx(x,.66,-.04));k.add('darkWood',board(.05,.18,.05),mx(x,.56,.15));
   k.add('darkWood',board(.04,.05,.34),mx(x,.12,-.02))}
  k.add('darkWood',board(1.12,.05,.04),mx(0,.12,-.02));k.add('iron',new T.BoxGeometry(1.12,.02,.02),mx(0,.44,-.02));
  return k.build(new T.Group())})}

 // A planter: a plank box with corner posts and a rim, filled with soil; the plants are added by the world.
 function planter(){return shared('planter',()=>{seed=61;const k=kit(),L=1.0,W=.5,H=.48;
  for(const sx of [-1,1])for(const sz of [-1,1])k.add('darkWood',board(.06,H,.06),mx(sx*(L/2-.03),H/2,sz*(W/2-.03)));
  for(let i=0;i<2;i++){const y=.03+i*.215+.1;for(const s of [-1,1]){k.add('wood',board(L-.1,.2,.025),mx(0,y,s*(W/2-.012)));k.add('wood',board(.025,.2,W-.1),mx(s*(L/2-.012),y,0))}}
  for(const s of [-1,1]){k.add('darkWood',board(L+.04,.03,.06),mx(0,H+.015,s*(W/2-.01)));k.add('darkWood',board(.06,.03,W+.04),mx(s*(L/2-.01),H+.015,0))}
  k.add('soil',new T.BoxGeometry(L-.06,.04,W-.06),mx(0,H-.04,0));
  return k.build(new T.Group())})}
 // (1.26, level 5) The airship dock: a timber mooring mast with a ladder and a ring at the top, and a plank landing
 // stage on posts. The mast's foot stands at the origin; the stage reaches out along -z (towards the ship).
 function mast(H=9){seed=71;const k=kit(),b=.62,t=.26;
  for(const sx of [-1,1])for(const sz of [-1,1]){const [L,m]=span(new T.Vector3(sx*b,0,sz*b),new T.Vector3(sx*t,H,sz*t));k.add('darkWood',rod(.09,.07,L,8),m)}
  for(let i=0;i<5;i++){const y0=.4+i*1.7,y1=y0+1.7,w0=b+(t-b)*y0/H,w1=b+(t-b)*y1/H;for(const [ax,az,bx,bz] of [[-1,-1,1,-1],[1,-1,1,1],[1,1,-1,1],[-1,1,-1,-1]]){const f=i%2,[L,m]=span(new T.Vector3(ax*w0,f?y1:y0,az*w0),new T.Vector3(bx*w1,f?y0:y1,bz*w1));k.add('wood',rod(.035,.035,L,6),m)}
   for(const [ax,az,bx,bz] of [[-1,-1,1,-1],[1,-1,1,1],[1,1,-1,1],[-1,1,-1,-1]]){const [L,m]=span(new T.Vector3(ax*w0,y0,az*w0),new T.Vector3(bx*w0,y0,bz*w0));k.add('wood',rod(.04,.04,L,6),m)}}
  for(const sx of [-1,1]){const [L,m]=span(new T.Vector3(sx*.22,0,-b-.12),new T.Vector3(sx*.18,H-.6,-t-.1));k.add('wood',rod(.03,.03,L,6),m)}
  for(let y=.35;y<H-.7;y+=.32){const w=b+(t-b)*y/H,z=-w-.12+(b-w)*0;k.add('wood',rod(.022,.022,.44,6),mx(0,y,-(b+(t-b)*y/H)-.12+.0,0,0,Math.PI/2))}
  k.add('darkWood',board(.9,.12,.9),mx(0,H+.06,0));k.add('iron',new T.TorusGeometry(.32,.045,8,24),mx(0,H+.5,0,0,0,0));k.add('iron',rod(.04,.04,.4,8),mx(0,H+.22,0));
  k.add('brass',new T.CylinderGeometry(.11,.11,.22,12),mx(0,H+.95,0));k.add('glow',new T.SphereGeometry(.09,12,8),mx(0,H+.95,0));
  return k.build(new T.Group())}
 function landing(w=4.2,d=4.6){seed=73;const k=kit();
  for(let i=0;i<Math.round(w/.22);i++){const x=-w/2+.11+i*.22;k.add('paleWood',board(.2,.05,d),mx(x,.32,-d/2+.1,0,(rnd()-.5)*.01))}
  for(const x of [-w/2+.15,0,w/2-.15])k.add('darkWood',board(.14,.14,d),mx(x,.22,-d/2+.1));
  for(const x of [-w/2+.15,w/2-.15])for(const z of [.1,-d/2+.1,-d+.2]){k.add('darkWood',rod(.08,.08,1.2,8),mx(x,-.3,z));k.add('darkWood',rod(.06,.06,1.1,8),mx(x,.85,z))}
  for(const x of [-w/2+.15,w/2-.15])k.add('wood',board(.07,.07,d),mx(x,1.32,-d/2+.1));
  return k.build(new T.Group())}
 // Sawhorses, the bare keel with its ribs (stage 2), and the planked gondola hull with windows and a rail (stage 3).
 function trestle(k,x,z){for(const s of [-1,1]){const [L,m]=span(new T.Vector3(x-.35,0,z+s*.5),new T.Vector3(x,.85,z+s*.5));k.add('darkWood',rod(.04,.04,L,6),m);const [L2,m2]=span(new T.Vector3(x+.35,0,z+s*.5),new T.Vector3(x,.85,z+s*.5));k.add('darkWood',rod(.04,.04,L2,6),m2)}k.add('wood',board(.12,.1,1.3),mx(x,.9,z))}
 const ribPts=(w,h,n=9)=>Array.from({length:n},(_,i)=>{const a=Math.PI*(i/(n-1));return new T.Vector3(Math.cos(a)*w/2,h-Math.sin(a)*h*.95,0)});
 function keel(){seed=79;const k=kit(),Lk=8.2;for(const x of [-3,0,3])trestle(k,x,0);
  k.add('darkWood',board(Lk,.16,.22),mx(0,1.03,0));k.add('darkWood',board(.2,1.1,.2),mx(-Lk/2,1.5,0,0,0,.3));
  for(let i=0;i<9;i++){const x=-3.6+i*.9,pts=ribPts(1.9,1.3);for(let j=1;j<pts.length;j++){const a=pts[j-1].clone().add(new T.Vector3(x,.98,0)),b=pts[j].clone().add(new T.Vector3(x,.98,0));const [L,m]=span(new T.Vector3(a.x,a.y,a.z+a.x-x),new T.Vector3(b.x,b.y,b.z+b.x-x));}
   for(let j=1;j<pts.length;j++){const a=new T.Vector3(x,1.0+pts[j-1].y,pts[j-1].x),b=new T.Vector3(x,1.0+pts[j].y,pts[j].x),[L,m]=span(a,b);k.add('wood',rod(.045,.045,L,6),m)}}
  for(const s of [-1,1])k.add('wood',board(Lk-.6,.07,.07),mx(0,2.28,s*.95));
  return k.build(new T.Group())}
 function gondola(){seed=83;const k=kit(),Lg=8.2,W=1.9,H=1.3;for(const x of [-3,0,3])trestle(k,x,0);
  const y0=.98;k.add('darkWood',board(Lg,.16,.24),mx(0,y0+.05,0));
  for(const s of [-1,1])for(let i=0;i<6;i++){const y=y0+.12+i*.21;k.add('paleWood',board(Lg-.2,.2,.04),mx(0,y+.1,s*(W/2-.02)))}
  for(const s of [-1,1])k.add('paleWood',board(.04,H,W),mx(s*(Lg/2-.1),y0+.12+H/2,0));
  k.add('paleWood',board(Lg-.2,.05,W),mx(0,y0+.15,0));
  for(const s of [-1,1])for(let i=0;i<7;i++){const x=-3+i*1;k.add('glass',new T.BoxGeometry(.5,.38,.02),mx(x,y0+.12+H*.62,s*(W/2+.005)));k.add('darkWood',board(.6,.05,.05),mx(x,y0+.12+H*.62+.22,s*(W/2+.02)));k.add('darkWood',board(.6,.05,.05),mx(x,y0+.12+H*.62-.22,s*(W/2+.02)))}
  for(const s of [-1,1]){k.add('brass',rod(.025,.025,Lg-.3,8),mx(0,y0+H+.5,s*(W/2-.05),0,0,Math.PI/2));for(let i=0;i<9;i++)k.add('brass',rod(.02,.02,.48,6),mx(-3.8+i*.95,y0+H+.33,s*(W/2-.05)))}
  return k.build(new T.Group())}
 // The crystal tree at the heart of the Wolkenkruin: a twisted dark trunk that splits into branches, each ending in a
 // cluster of tall glowing crystals. Returns the group; the crystals are one mesh, so the world can pulse their glow.
 function crystalTree(){seed=97;const k=kit(),pts=[];for(let i=0;i<=14;i++){const y=i/14*4.2;pts.push([.55*(1-i/14)**1.4+.16+.08*Math.sin(i*1.7),y])}
  const trunk=lathe(pts,18),q=trunk.attributes.position;for(let i=0;i<q.count;i++){const y=q.getY(i),a=y*.9,c=Math.cos(a),s=Math.sin(a),x=q.getX(i),z=q.getZ(i);q.setX(i,x*c-z*s+.25*Math.sin(y*1.3));q.setZ(i,x*s+z*c)}trunk.computeVertexNormals();k.add('bark',trunk,mx(0,0,0));
  const tips=[];for(let i=0;i<7;i++){const a=i/7*Math.PI*2+.3,base=new T.Vector3(.12*Math.cos(a),3.2+(i%3)*.35,.12*Math.sin(a)),tip=new T.Vector3(Math.cos(a)*(1.6+(i%2)*.6),4.6+(i%3)*.5,Math.sin(a)*(1.6+(i%2)*.6));const [L,m]=span(base,tip);k.add('bark',rod(.11,.05,L,8),m);tips.push(tip)}
  tips.push(new T.Vector3(0,5.2,0));
  for(const [ti,tp] of tips.entries())for(let j=0;j<6;j++){const g=new T.OctahedronGeometry(1,0);g.scale(.11+.05*rnd(),.38+.35*rnd(),.11+.05*rnd());const d=new T.Vector3(rnd()-.5,.9+rnd()*.6,rnd()-.5).normalize(),pos=tp.clone().addScaledVector(d,.2+rnd()*.3);
   k.add(j%3===2?'crystalB':'crystal',g,new T.Matrix4().compose(pos,new T.Quaternion().setFromUnitVectors(Y,d),S1))}
  return k.build(new T.Group())}
 const soilMat=()=>M().soil||(M().soil=new T.MeshStandardMaterial({color:0x3a2a1c,roughness:1}));soilMat();
 return {stoneCart,telescope,block,bench,planter,mast,landing,keel,gondola,crystalTree,mats:M}
})();
