"use strict";
// Shop goods modelled after the real thing: lathe-turned fruit, jars, bottles and jugs, crusty bread,
// cheese wheels with a cut wedge, burlap sacks, fabric bolts and woven baskets. Textures are painted
// on canvases at start-up, so nothing extra has to be downloaded.
function createGoods(){
 const T=THREE,cache=new Map(),once=(k,f)=>cache.has(k)?cache.get(k):(cache.set(k,f()),cache.get(k));
 let seed=811;const r=()=>(seed=(seed*16807)%2147483647)/2147483647;
 function paint(w,h,draw,repeat){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;if(repeat){t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(...repeat)}return t}
 const lathe=(pts,n=20)=>new T.LatheGeometry(pts.map(([x,y])=>new T.Vector2(x,y)),n);
 const std=(o)=>new T.MeshStandardMaterial(o);
 // ---- textures
 const skin=(base,blush)=>paint(128,128,(g,w,h)=>{g.fillStyle=base;g.fillRect(0,0,w,h);for(let i=0;i<90;i++){g.strokeStyle=blush;g.globalAlpha=.08+r()*.18;g.lineWidth=1+r()*3;const x=r()*w;g.beginPath();g.moveTo(x,0);g.bezierCurveTo(x+r()*8-4,h*.3,x+r()*8-4,h*.7,x+r()*6-3,h);g.stroke()}
  g.globalAlpha=1;for(let i=0;i<160;i++){g.fillStyle=`rgba(255,240,200,${.15+r()*.25})`;g.fillRect(r()*w,r()*h,1.2,1.2)}});
 const crust=()=>paint(256,128,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#c9883e');gr.addColorStop(.5,'#a8652a');gr.addColorStop(1,'#7d4a20');g.fillStyle=gr;g.fillRect(0,0,w,h);
  for(let i=0;i<900;i++){g.fillStyle=`rgba(${90+r()*80|0},${50+r()*40|0},20,${r()*.25})`;g.fillRect(r()*w,r()*h,2,2)}g.strokeStyle='rgba(240,215,160,.8)';g.lineWidth=7;for(let i=0;i<4;i++){g.beginPath();g.moveTo(40+i*55,20);g.lineTo(70+i*55,h-20);g.stroke()}
  for(let i=0;i<500;i++){g.fillStyle=`rgba(250,245,230,${r()*.5})`;g.fillRect(r()*w,r()*h,1.5,1.5)}});
 const rind=()=>paint(128,64,(g,w,h)=>{g.fillStyle='#d9a441';g.fillRect(0,0,w,h);for(let i=0;i<300;i++){g.fillStyle=`rgba(160,100,30,${r()*.25})`;g.fillRect(r()*w,r()*h,2,2)}g.fillStyle='rgba(120,70,20,.35)';g.fillRect(0,0,w,3);g.fillRect(0,h-3,w,3)});
 const paste=()=>paint(64,64,(g,w,h)=>{g.fillStyle='#f2d98a';g.fillRect(0,0,w,h);for(let i=0;i<40;i++){g.fillStyle='rgba(210,170,80,.5)';g.beginPath();g.arc(r()*w,r()*h,1+r()*2.5,0,7);g.fill()}});
 const gingham=(col)=>paint(64,64,(g,w,h)=>{g.fillStyle='#f4efe4';g.fillRect(0,0,w,h);g.fillStyle=col;g.globalAlpha=.55;for(let i=0;i<w;i+=16){g.fillRect(i,0,8,h);g.fillRect(0,i,w,8)}},[2,2]);
 const burlap=()=>paint(128,128,(g,w,h)=>{g.fillStyle='#a68a5c';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=3)for(let x=0;x<w;x+=3){g.fillStyle=`rgba(${(x+y)%6?70:200},${(x+y)%6?55:170},30,${.18+r()*.2})`;g.fillRect(x,y,2,2)}},[3,3]);
 const woven=()=>paint(128,64,(g,w,h)=>{g.fillStyle='#8f6a3c';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=8)for(let x=0;x<w;x+=16){const o=(y/8)%2?8:0;g.fillStyle='#c79a5b';g.fillRect(x+o,y+1,12,6);g.fillStyle='rgba(60,40,20,.5)';g.fillRect(x+o+12,y,2,8)}},[4,2]);
 const fabric=(a,b,kind)=>paint(128,128,(g,w,h)=>{g.fillStyle=a;g.fillRect(0,0,w,h);g.fillStyle=b;if(kind===0)for(let x=0;x<w;x+=16)g.fillRect(x,0,6,h);else if(kind===1){g.globalAlpha=.6;for(let i=0;i<w;i+=20){g.fillRect(i,0,8,h);g.fillRect(0,i,w,8)}}else for(let i=0;i<40;i++){const x=r()*w,y=r()*h;for(let k=0;k<5;k++){g.beginPath();g.arc(x+Math.cos(k*1.26)*4,y+Math.sin(k*1.26)*4,3,0,7);g.fill()}}},[1,3]);
 const label=(txt,col)=>paint(128,64,(g,w,h)=>{g.fillStyle='#efe3c3';g.fillRect(0,0,w,h);g.strokeStyle=col;g.lineWidth=4;g.strokeRect(4,4,w-8,h-8);g.fillStyle='#3a2a1a';g.font='bold 22px Georgia, serif';g.textAlign='center';g.textBaseline='middle';g.fillText(txt,w/2,h/2)});
 const glaze=()=>paint(64,128,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#6e4a2a');gr.addColorStop(.38,'#7d5631');gr.addColorStop(.42,'#e6d6b4');gr.addColorStop(1,'#d9c8a2');g.fillStyle=gr;g.fillRect(0,0,w,h)});
 // ---- geometry
 const G={
  apple:()=>once('g-apple',()=>lathe([[0,.02],[.18,0],[.38,.05],[.48,.2],[.5,.42],[.46,.68],[.36,.86],[.2,.93],[.07,.88],[0,.84]],18)),
  pear:()=>once('g-pear',()=>lathe([[0,0],[.22,.01],[.38,.08],[.45,.22],[.42,.38],[.31,.55],[.22,.7],[.17,.82],[.1,.94],[0,.96]],18)),
  stem:()=>once('g-stem',()=>new T.CylinderGeometry(.012,.02,.14,5)),
  jarGlass:()=>once('g-jar',()=>lathe([[0,0],[.3,0],[.33,.04],[.34,.58],[.29,.68],[.26,.7],[.26,.78]],20)),
  bottle:()=>once('g-bottle',()=>lathe([[0,0],[.14,0],[.15,.02],[.15,.52],[.12,.62],[.055,.72],[.045,.92],[.055,.95],[0,.95]],16)),
  jug:()=>once('g-jug',()=>lathe([[0,0],[.2,0],[.25,.12],[.27,.33],[.21,.53],[.12,.62],[.12,.7],[.15,.73],[.13,.74]],18)),
  sack:()=>once('g-sack',()=>{const g=lathe([[0,0],[.36,.02],[.45,.18],[.46,.42],[.38,.6],[.17,.72],[.13,.8],[.2,.9],[.16,.95],[0,.93]],22);const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),a=Math.atan2(z,x),k=1+.06*Math.sin(a*5+y*9)+.04*Math.sin(a*11-y*14);p.setXYZ(i,x*k,y,z*k)}g.computeVertexNormals();return g}),
  loaf:()=>once('g-loaf',()=>{const g=new T.SphereGeometry(.5,24,14);const p=g.attributes.position;for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i),z=p.getZ(i);y=y<0?y*.25:y*.55;p.setXYZ(i,x*1.5,y,z*.85)}g.computeVertexNormals();return g}),
  boule:()=>once('g-boule',()=>{const g=new T.SphereGeometry(.5,24,14);const p=g.attributes.position;for(let i=0;i<p.count;i++){let y=p.getY(i);p.setY(i,y<0?y*.25:y*.75)}g.computeVertexNormals();return g}),
  wheel:()=>once('g-wheel',()=>lathe([[0,0],[.44,0],[.5,.04],[.51,.15],[.5,.26],[.44,.3],[0,.3]],32)),
  egg:()=>once('g-egg',()=>lathe([[0,0],[.2,.03],[.27,.15],[.25,.3],[.16,.42],[0,.46]],12)),
  basket:()=>once('g-basket',()=>lathe([[.27,0],[.3,.02],[.34,.22],[.37,.28]],24)),
  cabbage:()=>once('g-cabbage',()=>{const g=new T.IcosahedronGeometry(.5,3);const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),k=1+.08*Math.sin(x*14+y*9)*Math.cos(z*12);p.setXYZ(i,x*k,y*k*.9,z*k)}g.computeVertexNormals();return g}),
  bolt:()=>once('g-bolt',()=>new T.CylinderGeometry(.12,.12,.9,18)),
  coin:()=>once('g-coin',()=>new T.CylinderGeometry(.06,.06,.012,14)),
  box:()=>once('g-box',()=>new T.BoxGeometry(1,1,1)),
  ring:()=>once('g-ring',()=>new T.TorusGeometry(1,.06,6,24)),
  candle:()=>once('g-candle',()=>new T.CylinderGeometry(.03,.034,.42,8))
 };
 const M={
  apple:k=>once('m-apple'+k,()=>std({map:skin(['#b3241f','#c9a52c','#6f9a2f'][k],['#f2c04a','#d1491f','#c6d45a'][k]),roughness:.45})),
  pear:()=>once('m-pear',()=>std({map:skin('#b7b443','#d48a3a'),roughness:.6})),
  stem:()=>once('m-stem',()=>std({color:0x4b3420,roughness:.9})),
  glass:()=>once('m-glass',()=>std({color:0xd8ece8,transparent:true,opacity:.32,roughness:.05,metalness:.1,depthWrite:false})),
  jam:k=>once('m-jam'+k,()=>std({color:[0x6e0f1a,0xc5641a,0x3c1838,0xd89a22][k],roughness:.3})),
  cloth:k=>once('m-cloth'+k,()=>std({map:gingham(['#b02a2a','#2a5ab0','#2f7a3a'][k]),roughness:.95,side:T.DoubleSide})),
  bottle:k=>once('m-bottle'+k,()=>std({color:[0x1f4a2a,0x4a2a12,0x2a3c52][k],roughness:.15,metalness:.2,transparent:true,opacity:.92})),
  cork:()=>once('m-cork',()=>std({color:0xb08a5a,roughness:1})),
  label:k=>once('m-label'+k,()=>std({map:label(['Appelstroop','Honing','Bessen','Peren'][k],['#7a2a1a','#b58a1a','#4a2a5a','#6a7a2a'][k]),roughness:.9})),
  crust:()=>once('m-crust',()=>std({map:crust(),roughness:.85})),
  rind:()=>once('m-rind',()=>std({map:rind(),roughness:.55})),
  paste:()=>once('m-paste',()=>std({map:paste(),roughness:.7})),
  burlap:()=>once('m-burlap',()=>std({map:burlap(),roughness:1})),
  twine:()=>once('m-twine',()=>std({color:0x9c8458,roughness:1})),
  woven:()=>once('m-woven',()=>std({map:woven(),roughness:.95,side:T.DoubleSide})),
  egg:()=>once('m-egg',()=>std({color:0xe9d8bc,roughness:.6})),
  cabbage:()=>once('m-cabbage',()=>std({color:0x8fb35a,roughness:.7,map:skin('#97b866','#c9dc9a')})),
  fabric:k=>once('m-fabric'+k,()=>std({map:fabric(...[['#7a2e2e','#e3c27a',0],['#2e4a6e','#d9d2c0',1],['#3e5a34','#e8b0c0',2],['#6e5a2e','#2a2a2a',0]][k]),roughness:.95})),
  jug:()=>once('m-jug',()=>std({map:glaze(),roughness:.35})),
  wood:()=>once('m-wood',()=>std({color:0x9a7048,roughness:.85})),
  coin:()=>once('m-coin',()=>std({color:0xd8b450,metalness:.9,roughness:.3})),
  wax:()=>once('m-wax',()=>std({color:0xf1e6c8,roughness:.6}))
 };
 const put=(parent,geo,mat,x,y,z,s=1,ry=0,rx=0,rz=0,sy=s,sz=s)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.scale.set(s,sy,sz);m.rotation.set(rx,ry,rz);m.castShadow=m.receiveShadow=true;parent.add(m);return m};
 // ---- items (all sizes in game units; y is the surface the item stands on)
 const make={
  apple(p,x,y,z,k=0,s=.16){const a=put(p,G.apple(),M.apple(k),x,y,z,s,r()*6,(r()-.5)*.4,(r()-.5)*.4);put(p,G.stem(),M.stem(),x,y+s*.95,z,s,0,.3,0);return a},
  pear(p,x,y,z,s=.2){put(p,G.pear(),M.pear(),x,y,z,s,r()*6,(r()-.5)*.3);put(p,G.stem(),M.stem(),x,y+s*1.02,z,s,0,.4,0)},
  // a heap of fruit in a crate of separate slats
  crate(p,x,y,z,kind='apple',k=0,w=.8,d=.6){const h=.34;for(const s of [-1,1]){put(p,G.box(),M.wood(),x,y+h/2,z+s*d/2,1,0,0,0,h,.03).scale.set(w,h,.03);put(p,G.box(),M.wood(),x+s*w/2,y+h/2,z,1,0,0,0,h,d).scale.set(.03,h,d)}
   put(p,G.box(),M.wood(),x,y+.02,z,1).scale.set(w,.03,d);
   const n=kind==='cabbage'?4:14;for(let i=0;i<n;i++){const fx=x+(r()-.5)*(w-.18),fz=z+(r()-.5)*(d-.16),fy=y+h*.55+(i>n*.55?.11:0)+r()*.04;
    if(kind==='pear')make.pear(p,fx,fy,fz,.17);else if(kind==='cabbage')put(p,G.cabbage(),M.cabbage(),x+((i%2)-.5)*w*.45,y+h*.7,z+(Math.floor(i/2)-.5)*d*.45,.22,r()*6);else make.apple(p,fx,fy,fz,k,.14)}},
  jar(p,x,y,z,k=0,s=.36){put(p,G.jarGlass(),M.glass(),x,y,z,s);put(p,new T.CylinderGeometry(.3,.3,.55,18),M.jam(k%4),x,y+s*.3,z,s);
   const cap=put(p,new T.CylinderGeometry(.32,.42,.16,18,1,true),M.cloth(k%3),x,y+s*.74,z,s);put(p,new T.CircleGeometry(.32,18),M.cloth(k%3),x,y+s*.8,z,s,0,-Math.PI/2);put(p,G.ring(),M.twine(),x,y+s*.7,z,s*.27,0,Math.PI/2,0,s*.27,s*.27);
   put(p,new T.CylinderGeometry(.341,.341,.22,18,1,true,-.7,1.4),M.label(k%4),x,y+s*.3,z,s)},
  bottle(p,x,y,z,k=0,s=.55){put(p,G.bottle(),M.bottle(k%3),x,y,z,s);put(p,new T.CylinderGeometry(.045,.04,.08,8),M.cork(),x,y+s*.97,z,s)},
  jug(p,x,y,z,s=.6){put(p,G.jug(),M.jug(),x,y,z,s,r()*6);put(p,new T.TorusGeometry(.12,.025,6,12,Math.PI),M.jug(),x+s*.22,y+s*.47,z,s,0,0,-Math.PI/2)},
  loaf(p,x,y,z,s=.36,ry=0){put(p,G.loaf(),M.crust(),x,y,z,s,ry)},
  boule(p,x,y,z,s=.34){put(p,G.boule(),M.crust(),x,y,z,s,r()*6)},
  cheese(p,x,y,z,s=.6,cut=false){if(!cut){put(p,G.wheel(),M.rind(),x,y,z,s);return}
   const g=new T.CylinderGeometry(.5,.5,.3,32,1,false,.6,Math.PI*2-.9);put(p,g,M.rind(),x,y+s*.15,z,s);
   const face=once('m-paste2',()=>{const m=M.paste().clone();m.side=T.DoubleSide;return m});
   for(const a of [.6,.6+Math.PI*2-.9])put(p,new T.PlaneGeometry(.5,.3),face,x+Math.sin(a)*s*.25,y+s*.15,z+Math.cos(a)*s*.25,s,a+Math.PI/2)},
  sack(p,x,y,z,s=.9,spill=false){put(p,G.sack(),M.burlap(),x,y,z,s,r()*6);put(p,G.ring(),M.twine(),x,y+s*.82,z,s*.14,0,Math.PI/2,0,s*.14,s*.14);
   if(spill)for(let i=0;i<40;i++)put(p,G.box(),M.cork(),x+s*.4+r()*.35,y+.01,z+(r()-.5)*.4,.025,r()*6)},
  bolt(p,x,y,z,k=0,ry=0){put(p,G.bolt(),M.fabric(k%4),x,y+.12,z,1,ry,0,Math.PI/2);put(p,new T.CylinderGeometry(.04,.04,.94,8),M.wood(),x,y+.12,z,1,ry,0,Math.PI/2)},
  folded(p,x,y,z,k=0,n=3){for(let i=0;i<n;i++)put(p,G.box(),M.fabric((k+i)%4),x,y+.04+i*.075,z,1,(r()-.5)*.1).scale.set(.42,.07,.32)},
  basket(p,x,y,z,s=.9,eggs=true){put(p,G.basket(),M.woven(),x,y,z,s);put(p,G.ring(),M.woven(),x,y+s*.28,z,s*.37,0,Math.PI/2,0,s*.37,s*.37);put(p,new T.TorusGeometry(.33,.025,6,16,Math.PI),M.woven(),x,y+s*.28,z,s,0);
   if(eggs)for(let i=0;i<9;i++){const a=i*2.4,rr=i?.1+.08*(i%3):0;put(p,G.egg(),M.egg(),x+Math.cos(a)*rr*s,y+s*.06+(i>5?.06:0),z+Math.sin(a)*rr*s,.24*s,r()*6,.3+r()*.8,r()*.6)}},
  coins(p,x,y,z,n=6){for(let i=0;i<n;i++)put(p,G.coin(),M.coin(),x+(r()-.5)*.02,y+.006+i*.013,z+(r()-.5)*.02,1)},
  candles(p,x,y,z){for(let i=0;i<5;i++)put(p,G.candle(),M.wax(),x+(i%3-1)*.07,y+.21,z+(i>2?.06:0),1,0,0,(r()-.5)*.1);put(p,G.ring(),M.twine(),x,y+.2,z+.03,.12,0,Math.PI/2,0,.12,.12)}
 };
 return make
}
