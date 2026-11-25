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
  mats={wood:oak(0xd8c9b2,.86),darkWood:oak(0x9a7656,.62),
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
 return {stoneCart,telescope}
})();
