"use strict";
/* StudyQuest standalone modular house designer; no renderer or global game dependencies. */
const HouseDesigner=(function HouseDesignerModule(){
  "use strict";
  const WIDTH=8, DEPTH=6, SIDES=["front","back","left","right"], SLOTS=["left","center","right"];
  const CHOICES={facade:["plaster","brick","stone"],timber:["oak","dark_oak","weathered"],roof:["gable","hip"],roofMaterial:["clay_red","clay_brown","slate"],floor:["oak_planks","stone_tiles"]};
  const FURNITURE=Object.freeze({bench:{width:1.5,depth:.55,cost:{planken:2}},table:{width:1.8,depth:.9,cost:{hout:1,planken:2}},chair:{width:.65,depth:.65,cost:{planken:1}},bed:{width:2,depth:1.1,cost:{hout:1,planken:3}},chest:{width:1.2,depth:.65,cost:{hout:2}},bookcase:{width:1.2,depth:.45,cost:{hout:2,planken:2}}});
  const assert=(b,s)=>{if(!b)throw Error(s)}, finite=n=>typeof n==="number"&&Number.isFinite(n), angle=n=>[0,90,180,270].includes(n), clone=o=>JSON.parse(JSON.stringify(o));
  function valid(d){
    const e=[];if(!d||typeof d!=="object")return{valid:false,errors:["design-required"]};
    if(d.version!==1)e.push("version");
    for(const k of ["projectId","plotId"])if(typeof d[k]!=="string"||!/^[a-zA-Z0-9_-]{1,64}$/.test(d[k]))e.push(k);
    if(!finite(d.x)||!finite(d.z)||!angle(d.rotation))e.push("position");
    for(const [k,choices]of Object.entries(CHOICES))if(!choices.includes(d[k]))e.push(k);
    if(!d.door||!["front","back"].includes(d.door.side)||d.door.slot!=="center")e.push("door");
    if(!Array.isArray(d.windows)||d.windows.length>8)e.push("windows");
    else{const keys=new Set();for(const w of d.windows){if(!w||!SIDES.includes(w.side)||!SLOTS.includes(w.slot)){e.push("window-slot");continue}const key=w.side+":"+w.slot;if(keys.has(key))e.push("duplicate-window");if(d.door&&w.side===d.door.side&&w.slot===d.door.slot)e.push("window-at-door");keys.add(key)}}
    if(!Array.isArray(d.furniture)||d.furniture.length>40)e.push("furniture");
    else {const ids=new Set();for(const f of d.furniture){if(!f||typeof f.id!=="string"||ids.has(f.id)||!FURNITURE[f.type]||!finite(f.x)||!finite(f.z)||!angle(f.rotation))e.push("furniture-item");if(f)ids.add(f.id)}}
    return{valid:e.length===0,errors:e};
  }
  function create(o){
    o=o||{};
    const d={version:1,projectId:o.projectId,plotId:o.plotId,x:o.x,z:o.z,rotation:o.rotation??0,revision:0,facade:o.facade||"plaster",timber:o.timber||"dark_oak",roof:o.roof||"gable",roofMaterial:o.roofMaterial||"clay_red",floor:o.floor||"oak_planks",door:{side:"front",slot:"center"},windows:[{side:"front",slot:"left"},{side:"front",slot:"right"},{side:"back",slot:"left"},{side:"back",slot:"right"}],furniture:[]};
    const result=valid(d);assert(result.valid,result.errors.join(","));return d;
  }
  function edit(d,patch,completed=0){
    assert(valid(d).valid,"existing-design-invalid");
    assert(patch&&typeof patch==="object"&&Object.keys(patch).length>0,"empty-patch");
    assert(Number.isInteger(completed)&&completed>=0&&completed<=5,"invalid-stage");
    const allowed=["x","z","rotation","facade","timber","roof","roofMaterial","floor","door","windows"];
    for(const k of Object.keys(patch)){
      assert(allowed.includes(k),"protected-or-unknown-field:"+k);
      if(["x","z","rotation"].includes(k)&&completed>=1)throw Error("foundation-locked");
      if(["facade","timber","door","windows"].includes(k)&&completed>=3)throw Error("walls-locked");
      if(["roof","roofMaterial"].includes(k)&&completed>=4)throw Error("roof-locked");
      if(k==="floor"&&completed>=5)throw Error("interior-locked");
    }
    const n={...clone(d),...clone(patch),revision:d.revision+1},r=valid(n);assert(r.valid,r.errors.join(","));return n;
  }
  function door(d,side,completed=0){return edit(d,{door:{side,slot:"center"},windows:d.windows.filter(w=>!(w.side===side&&w.slot==="center"))},completed)}
  function addWindow(d,side,slot,completed=0){return edit(d,{windows:[...d.windows,{side,slot}]},completed)}
  function removeWindow(d,side,slot,completed=0){return edit(d,{windows:d.windows.filter(w=>w.side!==side||w.slot!==slot)},completed)}
  function localToWorld(d,x,z){const a=d.rotation*Math.PI/180,c=Math.cos(a),s=Math.sin(a);return{x:d.x+x*c-z*s,z:d.z+x*s+z*c}}
  function corners(r){assert([r.x,r.z,r.width,r.depth,r.rotation??0].every(finite)&&r.width>0&&r.depth>0,"invalid-rectangle");const a=(r.rotation||0)*Math.PI/180,c=Math.cos(a),s=Math.sin(a);return[[-r.width/2,-r.depth/2],[r.width/2,-r.depth/2],[r.width/2,r.depth/2],[-r.width/2,r.depth/2]].map(([x,z])=>({x:r.x+x*c-z*s,z:r.z+x*s+z*c}))}
  function rect(d,margin=0){return{x:d.x,z:d.z,width:WIDTH+2*margin,depth:DEPTH+2*margin,rotation:d.rotation}}
  function overlaps(a,b){const A=corners(a),B=corners(b);for(const C of [A,B])for(let i=0;i<4;i++){const v={x:C[(i+1)%4].x-C[i].x,z:C[(i+1)%4].z-C[i].z},axis={x:-v.z,z:v.x},p=A.map(x=>x.x*axis.x+x.z*axis.z),q=B.map(x=>x.x*axis.x+x.z*axis.z);if(Math.max(...p)<=Math.min(...q)||Math.max(...q)<=Math.min(...p))return false}return true}
  function circleOverlaps(r,o){const a=-r.rotation*Math.PI/180,c=Math.cos(a),s=Math.sin(a),dx=o.x-r.x,dz=o.z-r.z,x=dx*c-dz*s,z=dx*s+dz*c,cx=Math.max(-r.width/2,Math.min(r.width/2,x)),cz=Math.max(-r.depth/2,Math.min(r.depth/2,z));return(x-cx)**2+(z-cz)**2<o.radius**2}
  function insidePlot(d,p,clearance){const a=-(p.rotation||0)*Math.PI/180,c=Math.cos(a),s=Math.sin(a);return corners(rect(d)).every(v=>{const dx=v.x-p.x,dz=v.z-p.z,x=dx*c-dz*s,z=dx*s+dz*c;return Math.abs(x)<=p.width/2-clearance+1e-8&&Math.abs(z)<=p.depth/2-clearance+1e-8})}
  function doorPosition(d){return{...localToWorld(d,0,d.door.side==="front"?DEPTH/2+1:-DEPTH/2-1),direction:(d.rotation+(d.door.side==="front"?0:180))%360}}
  function checkSite(d,context){
    const v=valid(d);if(!v.valid)return{ok:false,errors:v.errors};
    if(!context||!context.plot)return{ok:false,errors:["plot-required"]};
    const e=[],p=context.plot;
    try{corners({x:p.x,z:p.z,width:p.width,depth:p.depth,rotation:p.rotation||0})}catch{return{ok:false,errors:["invalid-plot"]}}
    const clearance=context.clearance??1,margin=context.obstacleClearance??.6;
    if(!finite(clearance)||clearance<0||!finite(margin)||margin<0)return{ok:false,errors:["invalid-clearance"]};
    if(p.id!==d.plotId)e.push("wrong-plot");
    if(!insidePlot(d,p,clearance))e.push("outside-plot");
    for(const o of context.obstacles||[]){
      if(o.id===d.projectId)continue;
      try{let blocked;
        if(finite(o.radius)){assert(finite(o.x)&&finite(o.z)&&o.radius>=0,"invalid-circle");blocked=circleOverlaps(rect(d,margin),o)}
        else blocked=overlaps(rect(d,margin),o);
        if(blocked){e.push("blocked:"+(o.id||"obstacle"));break}
      }catch{e.push("invalid-obstacle");break}
    }
    if(typeof context.worldCheck!=="function")e.push("world-check-required");
    else{try{const c=context.worldCheck({design:d,footprint:corners(rect(d)),door:doorPosition(d)});if(c!==true&&!(c&&c.valid===true))e.push("world-rejected"+(c&&c.reason?":"+c.reason:""))}catch{e.push("world-check-error")}}
    return{ok:e.length===0,errors:e,footprint:corners(rect(d)),entrance:doorPosition(d)};
  }
  function visualPlan(d,complete=5){
    assert(valid(d).valid,"invalid-design");assert(Number.isInteger(complete)&&complete>=0&&complete<=5,"invalid-completion");
    const parts=[{id:"foundation",stage:1,role:"foundation",footprint:{width:WIDTH,depth:DEPTH}},{id:"timber_frame",stage:2,role:"frame",timber:d.timber}];
    for(const side of SIDES)for(const slot of SLOTS){const kind=d.door.side===side&&d.door.slot===slot?"door":d.windows.some(w=>w.side===side&&w.slot===slot)?"window":"solid";parts.push({id:"wall:"+side+":"+slot,stage:3,role:kind==="solid"?"wall_panel":kind==="window"?"window_opening":"door_opening",side,slot,facade:d.facade,timber:d.timber})}
    parts.push({id:"roof",stage:4,role:"roof",shape:d.roof,material:d.roofMaterial},{id:"interior_floor",stage:5,role:"interior_floor",material:d.floor});
    for(const f of d.furniture)parts.push({id:"furniture:"+f.id,stage:5,role:"furniture",...f});
    return{footprint:rect(d),entrance:doorPosition(d),visible:parts.filter(p=>p.stage<=complete),preview:parts.filter(p=>p.stage>complete)};
  }
  function furniturePlace(d,item,completed=5){
    assert(valid(d).valid,"invalid-design");assert(completed===5,"house-not-finished");assert(item&&typeof item.id==="string"&&/^[a-zA-Z0-9_-]{1,64}$/.test(item.id)&&FURNITURE[item.type],"invalid-furniture");
    assert(finite(item.x)&&finite(item.z)&&angle(item.rotation),"invalid-placement");
    assert(item.x*2===Math.round(item.x*2)&&item.z*2===Math.round(item.z*2),"not-on-grid");
    assert(!d.furniture.some(f=>f.id===item.id)&&d.furniture.length<40,"duplicate-or-limit");
    const spec=FURNITURE[item.type],r={x:item.x,z:item.z,width:spec.width,depth:spec.depth,rotation:item.rotation};
    assert(corners(r).every(p=>Math.abs(p.x)<=WIDTH/2-.25&&Math.abs(p.z)<=DEPTH/2-.25),"outside-interior");
    const hall={x:0,z:d.door.side==="front"?2.05:-2.05,width:1.35,depth:1.9,rotation:0};
    assert(!overlaps(r,hall),"blocking-door");
    for(const f of d.furniture){const a=FURNITURE[f.type];assert(!overlaps(r,{x:f.x,z:f.z,width:a.width+.2,depth:a.depth+.2,rotation:f.rotation}),"overlap-furniture")}
    return{...clone(d),furniture:[...d.furniture,{id:item.id,type:item.type,x:item.x,z:item.z,rotation:item.rotation}],revision:d.revision+1};
  }
  function furnitureMove(d,id,location){const f=d.furniture.find(f=>f.id===id);assert(f,"unknown-furniture");const temp={...clone(d),furniture:d.furniture.filter(o=>o.id!==id)};const n=furniturePlace(temp,{...f,...location,id});n.revision=d.revision+1;return n}
  function furnitureRemove(d,id){assert(valid(d).valid&&d.furniture.some(f=>f.id===id),"unknown-furniture");return{...clone(d),furniture:d.furniture.filter(f=>f.id!==id),revision:d.revision+1}}
  return{WIDTH,DEPTH,FURNITURE,CHOICES,create,valid,edit,door,addWindow,removeWindow,localToWorld,checkSite,visualPlan,furniturePlace,furnitureMove,furnitureRemove,overlaps};
})();
if(typeof module!=="undefined"&&module.exports)module.exports=HouseDesigner;
