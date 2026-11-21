"use strict";
// Villagers out on the paths: they stroll a route, pause, greet you and step aside for you.
function createWalkers(scene,{free}){
 const T=THREE,P=(z,k=0,dx=0)=>({x:mainPathX(z,k)+dx,z});
 const plan=[
  {id:'jet',name:'Jet',gender:'f',height:2.64,route:[P(17,0,.6),P(8,0,.5),{x:-6.5,z:9.4},{x:-9.6,z:9.6},P(4,0,-.4),P(-9,0,.5),P(-15,0,.4),P(-2,0,-.5)],
   lines:['Hoi! Bram zoekt nog iemand die zijn bijl wil verdienen.','Zag je de hond? Hij heet Bolle en is dol op koekjes.','Linde tekent de mooiste kaarten van de archipel.']},
  {id:'henk',name:'Henk',gender:'m',height:2.76,route:[{x:6,z:11.2},{x:9.9,z:11.0},{x:12.6,z:12.4},P(14,0,1),P(1,0,.6),P(-6,0,1),P(6,0,.9)],
   lines:['Goedemiddag! Mara smeedt het beste gereedschap van het eiland.','Wie hard werkt, kan in de handelspost veel munten verdienen.','Pas op bij de rand, het is een flinke val naar de wolken.']},
  {id:'daan',name:'Daan',gender:'m',height:2.74,route:[P(-47,1,.6),P(-55,1,.5),{x:11.6,z:-55.6},P(-62,1,-.4),P(-72,1,.5),P(-66,1,-.6)],
   lines:['Welkom in de Bloesemvallei! Tomas weet alles van touw.','Het hout uit deze vallei is extra stevig.','Op de Sterrenwacht staat het baken. Daar heb je een sterrenkaart voor nodig.']}
 ];
 const walkers=plan.map(c=>{const a=Rig.person(scene,c.id,{gender:c.gender,height:c.height});const st=c.route[0];
  return {...c,a,x:st.x,z:st.z,h:0,leg:1,wait:2+Math.random()*3,greeted:0,line:0,mode:'walk',path:null}});
 let onGreet=null;
 function update(t,dt,p,inside,s){const ok=(x,z)=>free(x,z,s);
  dt=Math.min(dt,.1);
  for(const w of walkers){const a=w.a;a.root.visible=!inside;if(!a.mixer||inside)continue;
   const dx=p.x-w.x,dz=p.z-w.z,d=Math.hypot(dx,dz),toPlayer=Math.atan2(-dx,-dz);
   const turn=h=>{w.h+=Math.atan2(Math.sin(h-w.h),Math.cos(h-w.h))*(1-Math.exp(-5*dt))};
   if(d<3.6){
    // somebody to talk to: stop, face them, wave the first time
    turn(toPlayer);a.look(new T.Vector3(p.x,p.y+2.2,p.z));
    if(t-w.greeted>40){w.greeted=t;a.once('wave','listen',{fade:.3});onGreet?.(w.name,w.lines[w.line++%w.lines.length])}
    else if(!['wave','listen','nod','talk1'].includes(a.state))a.play('listen',{fade:.4});
   }else{
    a.look(null);
    // walk the route leg by leg; each leg is planned around crates, rocks, piles and builds
    if(!w.path&&w.wait<=0){const goal=w.route[w.leg];w.path=Nav.path(w.x,w.z,goal.x,goal.z,ok)||[];if(!w.path.length){w.leg=(w.leg+1)%w.route.length;w.path=null}}
    const goal=w.path&&w.path[0];
    if(w.wait>0){w.wait-=dt;if(!['idle','look','look2','idle2'].includes(a.state))a.play(Math.random()<.5?'look':'idle',{fade:.5})}
    else if(!goal){w.path=null;w.leg=(w.leg+1)%w.route.length;w.wait=Math.random()<.45?2+Math.random()*5:0}
    else{const gx=goal.x-w.x,gz=goal.z-w.z,gd=Math.hypot(gx,gz);
     if(gd<.15)w.path.shift();
     else{const speed=a.clips.slow.userData.speed*a.scale,step=Math.min(gd,speed*dt),nx=w.x+gx/gd*step,nz=w.z+gz/gd*step;
      if(ok(nx,nz)){w.x=nx;w.z=nz;turn(Math.atan2(-gx,-gz));a.play('slow',{fade:.35})}
      else{w.path=null;w.wait=.6;a.play('idle',{fade:.3})}}}
   }
   a.root.position.set(w.x,0,w.z);a.root.rotation.y=w.h;a.update(dt)
  }
 }
 // Walkers are solid: the player bumps into them instead of walking through.
 function blocks(x,z,r){return walkers.some(w=>w.a.root.visible&&Math.hypot(x-w.x,z-w.z)<r+.3)}
 return {update,blocks,list:walkers,set onGreet(f){onGreet=f}}
}
