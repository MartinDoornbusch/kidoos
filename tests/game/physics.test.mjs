// Walking, camera and collision in Windhaven, taken over from the old browser check (src/checks/route.js) and brought in
// line with the controls since 1.22 (forward and back along your own heading, left and right turn): walking and turning, solid façades, trunks, crates and piles, the camera pulling in before a wall, the
// keyboard, chopping at a woodpile with the axe in hand, a self-built block you bump into and can jump onto.
import {installHelpers} from './helpers.mjs';
export default async function(pg,{ok}){
 await pg.evaluate(()=>{localStorage.clear();document.getElementById('start').click()});await pg.waitForTimeout(5000);await installHelpers(pg);
 const out=await pg.evaluate(()=>{const res=[],pass=(c,l)=>res.push([!!c,l]),near=(a,b)=>Math.abs(a-b)<.45;
  function walk(x,z,reach=.24){const sp=.5,id=(a,b)=>a+'/'+b,first={x:Math.round(p.x/sp)*sp,z:Math.round(p.z/sp)*sp},frontier=[first],seen=new Set(),dist=n=>Math.hypot(n.x-x,n.z-z);let end;
   while(frontier.length&&seen.size<36000){const n=frontier.pop();if(dist(n)<=reach){end=n;break}const next=[];
    for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const a=n.x+dx*sp,b=n.z+dz*sp,k=id(a,b);if(seen.has(k)||Math.abs(a)>26||b>26||b< -146)continue;seen.add(k);const h=world.ground(a,b,s,.25);if(h<-.5||world.blocked(a,b,s,h,.47))continue;next.push({x:a,z:b,parent:n})}
    next.sort((a,b)=>dist(b)-dist(a));frontier.push(...next)}
   if(!end)throw Error('geen looproute naar '+[x,z]);const path=[];for(let n=end;n;n=n.parent)path.push(n);
   for(const n of path.reverse()){let t=0;while(Math.hypot(n.x-p.x,n.z-p.z)>.085&&t++<120){const dx=n.x-p.x,dz=n.z-p.z;p.heading=Math.atan2(-dx,-dz);joyX=0;joyZ=Math.hypot(dx,dz)<.2?-.5:-1;move(.018)}if(t>=120)throw Error('blokkade op '+[p.x,p.z].map(a=>a.toFixed(2)))}
   joyX=joyZ=0;updateHUD()}
  function driveFrom(x,z,key,sec,doJump=false){Object.assign(p,{x,z,y:0,vy:0,on:true,glide:false,heading:0});resetSteering();keys.add(key);keys.add('shift');if(doJump)jump();for(let i=0;i<sec*100;i++)move(.01);keys.clear()}
  try{
   const pose={...p};
   // forward walks along your own heading, back walks backwards, left and right turn on the spot; the camera follows
   for(const h of [0,1.19]){Object.assign(p,pose,{heading:h});view.yaw=h;resetSteering();joyX=0;joyZ=-1;for(let i=0;i<60;i++){move(.01);followCamera(.01)}
    const fx=-Math.sin(h),fz=-Math.cos(h),along=(p.x-pose.x)*fx+(p.z-pose.z)*fz,drift=Math.abs((p.x-pose.x)*fz-(p.z-pose.z)*fx);pass(along>.5&&drift<.05&&Math.cos(view.yaw-p.heading)>.98,'forward follows your heading '+h+' and the camera stays behind');
    Object.assign(p,pose,{heading:h});resetSteering();joyZ=1;for(let i=0;i<40;i++)move(.01);pass((p.x-pose.x)*fx+(p.z-pose.z)*fz<-.2,'back walks backwards at heading '+h);
    Object.assign(p,pose,{heading:h});resetSteering();joyZ=0;joyX=1;for(let i=0;i<30;i++)move(.01);const turned=Math.atan2(Math.sin(p.heading-h),Math.cos(p.heading-h));pass(turned< -.3&&Math.hypot(p.x-pose.x,p.z-pose.z)<.05,'right turns on the spot at heading '+h);joyX=0}
   joyX=joyZ=0;resetSteering();view.yaw=0;Object.assign(p,pose);
   driveFrom(-8,9.5,'w',.55,true);pass(p.z>7.4,'sprint and jump stop at the façade');
   keys.add('a');driveFrom(-6.6,6,'w',.22,true);pass(p.x>-7.1&&p.z<5,'a sideways jump slides along the façade');
   const saved={...view};Object.assign(p,{x:-8,z:8.1,y:0,heading:0});view.yaw=Math.PI;world.animate(0,s,p,view,false,1);pass(world.cam.position.z>7.35,'the camera pulls in before the façade');Object.assign(view,saved);
   driveFrom(5.6,8.4,'w',.4);pass(p.z>7.1,'a tree trunk stops the explorer ('+p.z.toFixed(2)+')');
   driveFrom(6,17,'w',.75);pass(p.z>15.2,'harbour crates stop the explorer');
   driveFrom(-5,10,'w',.5);pass(p.z>8.4,'a woodpile blocks before you gather it');
   pass(world.blocked(-9,-11,s,4.7)&&world.blocked(-9,-125,s,4.7),'mill and observatory stay solid up high');
   pass(world.blocked(0,-130,s,0)&&world.blocked(-5,4,s,0),'beacon and gate posts are solid');
   Object.assign(p,pose);{const z=p.z;window.dispatchEvent(new KeyboardEvent('keydown',{key:'w',code:'KeyW'}));move(.1);window.dispatchEvent(new KeyboardEvent('keyup',{key:'w',code:'KeyW'}));pass(p.z<z,'the W key moves the explorer')}
   s.tools.bijl=true;s.hand='bijl';world.hold('bijl');const h0=s.hout;walk(-5,7,2.5);updateHUD();const lbl=$('act').textContent;act();__answer();closePanel();pass(s.hout===h0+1,'a right answer at the woodpile, axe in hand, is a clean stroke: +1 wood ('+lbl+')');
   s.hout=Math.max(s.hout,2);walk(0,12);p.heading=0;$('build').click();$('crate').click();$('act').click();const n=s.builds.length;pass(n===1,'a free building block is placed');
   const b=s.builds[0];walk(b.x,b.z+1.6,.26);joyZ=-1;for(let j=0;j<12;j++)move(.025);joyZ=0;pass(p.z>b.z+1.2,'you bump into your own block');
   jump();joyZ=-1;for(let j=0;j<15;j++)move(.025);joyZ=0;for(let j=0;j<35;j++)move(.025);pass(near(p.y,1.12),'and can jump onto it')
  }catch(e){res.push([false,'scenario: '+e.message])}
  return res});
 for(const [c,l] of out)ok(c,l)}
