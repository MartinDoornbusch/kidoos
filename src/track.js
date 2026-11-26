"use strict";
// Practice and play time per profile. Kept on this device and, on every device where somebody is logged in (1.26.1),
// sent every few minutes to the family overview. Only active time counts: a minute without any
// key, tap or click stops the clock, and a hidden tab never counts.
const Track=(()=>{
 const KEY=p=>'studyquest.stats.'+p,LINK='studyquest.sync';
 let profile=null,data=null,lastInput=performance.now(),dirty=false,lastSync=0,savedAt=0;
 const pad=n=>String(n).padStart(2,'0'),today=()=>{const d=new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())};
 const blank=()=>({v:1,days:{},skills:{},sessions:[]});
 for(const e of ['keydown','pointerdown','touchstart','input','wheel'])addEventListener(e,()=>{lastInput=performance.now()},{passive:true});
 function load(p){profile=p;try{data=JSON.parse(localStorage.getItem(KEY(p)))||blank()}catch{data=blank()}}
 function save(){if(!profile||!data)return;savedAt=Date.now();try{localStorage.setItem(KEY(profile),JSON.stringify(data))}catch{}}
 const day=()=>data.days[today()]??={play:0,practice:0,subj:{}};
 function session(){const now=Date.now(),last=data.sessions[data.sessions.length-1];if(last&&now-last.end<10*60e3){last.end=now;return last}
  const fresh={start:now,end:now,play:0,practice:0,q:0,ok:0};data.sessions.push(fresh);if(data.sessions.length>80)data.sessions.shift();return fresh}
 function tick(dt,practising){if(!data||document.hidden||performance.now()-lastInput>60e3)return;const d=day(),se=session();
  if(practising){d.practice+=dt;se.practice+=dt}else{d.play+=dt;se.play+=dt}dirty=true;if(Date.now()-savedAt>15e3)save()}
 function answer(subject,skill,ok){if(!data)return;lastInput=performance.now();const d=day(),se=session(),a=d.subj[subject]??=[0,0];a[1]++;if(ok)a[0]++;se.q++;if(ok)se.ok++;
  const g=data.skills[subject]??={},sk=g[skill||subject]??=[0,0];sk[1]++;if(ok)sk[0]++;dirty=true;save()}
 const link=()=>{try{return JSON.parse(localStorage.getItem(LINK))}catch{return null}};
 const post=(url,body,keepalive=false)=>fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),keepalive});
 // game() builds a small snapshot of the save; it is only called when a sync is actually due.
 // (1.26.1) a device on which somebody is logged in syncs without linking: the server knows who it is from the cookie
 const loggedIn=()=>/(?:^|;\s*)sq_who=(Niek|Floor|Ouder)/.test(document.cookie);
 function device(){let l=link();if(!l&&loggedIn()){l={device:Array.from(crypto.getRandomValues(new Uint8Array(8)),b=>b.toString(16).padStart(2,'0')).join(''),at:Date.now()};localStorage.setItem(LINK,JSON.stringify(l))}return l}
 async function sync(game,force=false){const l=device();if(!l||!data||!profile)return false;if(!force&&(!dirty||Date.now()-lastSync<120e3))return false;
  lastSync=Date.now();dirty=false;save();try{const r=await post('/api/sync',{token:l.token,device:l.device,kid:profile,game:game(),stats:data},document.hidden);if(!r.ok)throw Error(r.status);return true}catch{dirty=true;return false}}
 async function overview(){const r=await post('/api/overview',{});if(!r.ok)throw Error(r.status===403?'ouder':r.status===503?'opslag':'netwerk');return r.json()}
 const minutesToday=()=>Math.round((data?.days[today()]?.practice||0)/60);
 return {load,save,tick,answer,sync,unlink:()=>localStorage.removeItem(LINK),linked:()=>!!link(),overview,minutesToday,today}
})();
