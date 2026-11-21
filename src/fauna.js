"use strict";
// Animals around the village (Microsoft Rocketbox animal models, MIT). The models have a skeleton
// but no clips, so gaits, pecking and wing beats are posed procedurally each frame.
const Fauna={
 // Trot: diagonal leg pairs swing together; knees fold on the forward swing.
 dogGait(a,phase,amount,lift=1){
  const legs=[['L_UpperArm','L_Forearm',0],['R_Thigh','R_Calf',0],['R_UpperArm','R_Forearm',Math.PI],['L_Thigh','L_Calf',Math.PI]];
  for(const [upper,lower,off] of legs){const s=Math.sin(phase+off),front=upper.includes('Arm');
   a.bend(upper,1,0,0,-.5*s*amount);a.bend(lower,1,0,0,(front?-1:1)*.75*Math.max(0,s)*amount*lift)}
 },
 dogTail(a,t,speed,up=.25){for(const [b,k] of [['Tail',.4],['Tail1',.7],['Tail2',1],['Tail3',1]])a.bend(b,0,1,0,Math.sin(t*speed)*.32*k);a.bend('Tail',1,0,0,-up)},
 dogHead(a,yaw,pitch){a.bend('Neck1',0,1,0,yaw*.4);a.bend('Neck2',0,1,0,yaw*.3);a.bend('Head',0,1,0,yaw*.3);a.bend('Head',1,0,0,-pitch)},
 // Sitting: hips drop, hind legs fold under, front legs stay straight.
 dogSit(a,k){a.bend('Root',1,0,0,-.5*k);for(const s of ['L','R']){a.bend(s+'_Thigh',1,0,0,-.7*k);a.bend(s+'_Calf',1,0,0,2.5*k);a.bend(s+'_Foot',1,0,0,-1.5*k);a.bend(s+'_UpperArm',1,0,0,.5*k);a.bend(s+'_Forearm',1,0,0,-.05*k)}a.bend('Neck',1,0,0,.25*k);a.body.position.y=-.11*k},
 // Lying: everything folds, the body rests on the ground, the head stays up.
 dogLie(a,k){for(const s of ['L','R']){a.bend(s+'_Thigh',1,0,0,-1.15*k);a.bend(s+'_Calf',1,0,0,2.4*k);a.bend(s+'_Foot',1,0,0,-1.1*k);a.bend(s+'_UpperArm',1,0,0,-1.25*k);a.bend(s+'_Forearm',1,0,0,1.0*k);a.bend(s+'_Hand',1,0,0,1.2*k)}},
 chickenWalk(a,phase,amount){for(const [s,off] of [['L',0],['R',Math.PI]]){const v=Math.sin(phase+off);a.bend(s+'_Thigh',1,0,0,-.5*v*amount);a.bend(s+'_Calf',1,0,0,.6*Math.max(0,v)*amount)}},
 chickenPeck(a,k,yaw){a.bend('Neck',0,1,0,yaw);a.bend('Neck',1,0,0,.9*k);a.bend('Neck1',1,0,0,.5*k);a.bend('Head',1,0,0,.3*k)},
 // Wings: spread from the folded bind pose, then beat around the body's long axis.
 sparrowWings(a,beat,spread){for(const [s,dir] of [['L',1],['R',-1]]){a.bend(s+'_UpperArm',0,0,1,dir*(-1.35*spread+beat));a.bend(s+'_UpperArm',0,1,0,dir*.5*spread);a.bend(s+'_Forearm',0,1,0,-dir*.9*spread);a.bend(s+'_Hand',0,1,0,-dir*.4*spread)}},
};
function createFauna(scene,{ground,blocked}){
 const T=THREE,list=[],rnd=(()=>{let v=917;return()=>(v=(v*16807)%2147483647)/2147483647})();
 const dog=Rig.creature(scene,'beagle',{height:1.08}),pal={x:-3,z:15,h:0,speed:0,phase:0,target:null,wait:0,sit:0,friend:false,yaw:0};
 const guard=Rig.creature(scene,'shepherd',{height:1.42}),guardAt={x:13.7,z:10.3,h:-1.2};
 const hens=[0,1,2,3].map(i=>({a:Rig.creature(scene,'chicken',{height:.68}),x:14.8+i*.7,z:-57+i*.5,h:rnd()*6,phase:rnd()*6,peck:0,target:null,wait:rnd()*3}));
 const birds=[0,1,2,3,4,5].map(i=>({a:Rig.creature(scene,'sparrow',{height:.26}),r:9+rnd()*7,y:7+rnd()*5,w:.32+rnd()*.12,o:rnd()*6.28,cx:rnd()*6-3,cz:rnd()*10-2}));
 const all=[dog,guard,...hens.map(h=>h.a),...birds.map(b=>b.a)];
 all.forEach(a=>a.ready.then(()=>a.body.traverse(o=>{if(o.isSkinnedMesh){o.castShadow=true;o.receiveShadow=false}})).catch(()=>{}));
 const ok=a=>a.list&&a.list.length;
 function wanderTarget(s){for(let k=0;k<20;k++){const a=rnd()*6.28,r=4+rnd()*15,x=Math.cos(a)*r,z=Math.sin(a)*r*.9+2;if(!blocked(x,z,s,0,.45,1))return {x,z}}return {x:0,z:12}}
 function update(t,dt,p,s,inside){
  dt=Math.min(dt,.1);
  // --- the village dog: wanders, comes to say hello, follows a friend, sits when you stand still
  if(ok(dog)){
   const dx=p.x-pal.x,dz=p.z-pal.z,dp=Math.hypot(dx,dz),near=!inside&&dp<9&&Math.abs(p.z)<40,follow=!inside&&(pal.friend||near)&&dp>2.4;
   let goal=null,want=0;
   if(follow){goal={x:p.x-dx/dp*2,z:p.z-dz/dp*2};want=dp>7?6.2:dp>4?3.6:1.7;pal.target=null}
   else if(!near){if(!pal.target||Math.hypot(pal.target.x-pal.x,pal.target.z-pal.z)<.6){pal.wait-=dt;if(pal.wait<=0){pal.target=wanderTarget(s);pal.wait=3+rnd()*6}}if(pal.target&&pal.wait<=0){goal=pal.target;want=1.6}}
   if(goal&&Math.hypot(goal.x-pal.x,goal.z-pal.z)>.3){const h=Math.atan2(-(goal.x-pal.x),-(goal.z-pal.z));pal.h+=Math.atan2(Math.sin(h-pal.h),Math.cos(h-pal.h))*(1-Math.exp(-5*dt))}else want=0;
   pal.speed+=(want-pal.speed)*(1-Math.exp(-4*dt));
   const nx=pal.x-Math.sin(pal.h)*pal.speed*dt,nz=pal.z-Math.cos(pal.h)*pal.speed*dt;
   if(pal.speed>.05){if(!blocked(nx,nz,s,0,.32,.9)&&ground(nx,nz,s)>-1){pal.x=nx;pal.z=nz}else{pal.target=null;pal.wait=0;pal.h+=1.2}}
   pal.phase+=dt*(pal.speed>3?11:7.5)*Math.min(1,pal.speed/1.2+.0001);
   const resting=pal.speed<.08&&near;pal.sit+=((resting?1:0)-pal.sit)*(1-Math.exp(-2.2*dt));
   dog.reset();const m=Math.min(1,pal.speed/1.4);
   Fauna.dogSit(dog,pal.sit);Fauna.dogGait(dog,pal.phase,m*(1-pal.sit));
   const look=near?Math.max(-1,Math.min(1,Math.atan2(Math.sin(Math.atan2(-dx,-dz)-pal.h),Math.cos(Math.atan2(-dx,-dz)-pal.h)))):Math.sin(t*.4)*.3;
   pal.yaw+=(look-pal.yaw)*(1-Math.exp(-4*dt));Fauna.dogHead(dog,pal.yaw,near?-.15:0);Fauna.dogTail(dog,t,near?14:5,near?.45:.2);
   dog.root.position.set(pal.x,Math.max(0,ground(pal.x,pal.z,s))+Math.abs(Math.sin(pal.phase))*.03*m,pal.z);dog.root.rotation.y=pal.h;dog.root.visible=!inside
  }
  // --- the smithy's guard dog lies by the door and watches you
  if(ok(guard)){guard.reset();Fauna.dogLie(guard,1);const dx=p.x-guardAt.x,dz=p.z-guardAt.z,d=Math.hypot(dx,dz);
   const want=d<10?Math.max(-1.1,Math.min(1.1,Math.atan2(Math.sin(Math.atan2(-dx,-dz)-guardAt.h),Math.cos(Math.atan2(-dx,-dz)-guardAt.h)))):Math.sin(t*.25)*.4;
   guardAt.yaw=(guardAt.yaw||0)+(want-(guardAt.yaw||0))*(1-Math.exp(-3*dt));Fauna.dogHead(guard,guardAt.yaw,-.05+.04*Math.sin(t*1.3));Fauna.dogTail(guard,t,d<5?9:1.5,-.1);
   guard.root.position.set(guardAt.x,-.28,guardAt.z);guard.root.rotation.y=guardAt.h;guard.body.scale.y=guard.scale*(1+.012*Math.sin(t*1.7));guard.root.visible=!inside}
  // --- hens scratch and peck around the field house
  for(const hen of hens){const a=hen.a;if(!ok(a))continue;
   let speed=0;if(hen.target){const dx=hen.target.x-hen.x,dz=hen.target.z-hen.z,d=Math.hypot(dx,dz);if(d<.15)hen.target=null;else{const h=Math.atan2(-dx,-dz);hen.h+=Math.atan2(Math.sin(h-hen.h),Math.cos(h-hen.h))*(1-Math.exp(-8*dt));speed=.9;hen.x-=Math.sin(hen.h)*speed*dt;hen.z-=Math.cos(hen.h)*speed*dt}}
   else{hen.wait-=dt;if(hen.wait<0){hen.target={x:13.5+rnd()*4.5,z:-58.5+rnd()*4};hen.wait=1.5+rnd()*4}}
   const fleeing=Math.hypot(p.x-hen.x,p.z-hen.z)<1.6;if(fleeing&&!hen.target){hen.target={x:hen.x+(hen.x-p.x)*1.5,z:hen.z+(hen.z-p.z)*1.5};hen.wait=1}
   hen.phase+=dt*speed*11;hen.peck=speed?0:Math.max(0,Math.sin(t*2.3+hen.wait*3))**6;
   a.reset();Fauna.chickenWalk(a,hen.phase,speed?1:0);Fauna.chickenPeck(a,hen.peck,Math.sin(t*.7+hen.x)*.4);
   a.root.position.set(hen.x,Math.abs(Math.sin(hen.phase))*.02,hen.z);a.root.rotation.y=hen.h;a.root.visible=!inside}
  // --- sparrows circle above the village, beating and gliding
  for(const b of birds){const a=b.a;if(!ok(a))continue;const ang=t*b.w+b.o,x=b.cx+Math.cos(ang)*b.r,z=b.cz+Math.sin(ang)*b.r*.75,y=b.y+Math.sin(t*.9+b.o)*.8;
   const glide=Math.sin(t*.8+b.o*3)>.35;a.reset();Fauna.sparrowWings(a,glide?.08:Math.sin(t*22+b.o)*.75,1);
   a.root.position.set(x,y,z);a.root.rotation.set(0,Math.atan2(Math.sin(ang)*b.r,-Math.cos(ang)*b.r*.75),-.3);a.root.visible=!inside}
 }
 return {update,befriend(){pal.friend=true},dog:pal,guardAt}
}
