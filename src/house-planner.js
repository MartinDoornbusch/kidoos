"use strict";
/* Safe orchestration between ConstructionCampaign and HouseDesigner. No game globals mutated. */
const HousePlanner=(function HousePlannerFactory(H,C){
  "use strict";
  const copy=o=>JSON.parse(JSON.stringify(o)),store=s=>s&&s.constructionDesigns&&typeof s.constructionDesigns==="object"&&!Array.isArray(s.constructionDesigns)?s.constructionDesigns:{};
  const storage=s=>Array.isArray(s.houseFurnitureStorage)?s.houseFurnitureStorage:[];
  const okSave=(s,id,d,extra={})=>({...s,constructionDesigns:{...store(s),[id]:d},...extra});
  function get(s,id){
    const d=store(s)[id];if(!d)return{ok:false,reason:"design-not-found"};
    const p=C.state(s,id);if(!p.ok)return p;
    return{ok:true,design:d,project:p.project,progress:p.progress,plan:H.visualPlan(d,p.progress.current),status:p};
  }
  function begin(s,d,context){
    if(!s||typeof s!=="object"||!H.valid(d).valid)return{ok:false,reason:"invalid-input"};
    if(Object.prototype.hasOwnProperty.call(store(s),d.projectId))return{ok:false,reason:"design-already-exists"};
    const site=H.checkSite(d,context);if(!site.ok)return{ok:false,reason:"invalid-site",errors:site.errors};
    const created=C.start(s,{id:d.projectId,plotId:d.plotId,blueprintId:"vakwerkhuis",x:d.x,z:d.z,rotation:d.rotation});
    if(!created.ok)return created;
    const next=okSave(created.save,d.projectId,copy(d));
    return{ok:true,save:next,design:d,project:created.project,site};
  }
  function change(s,id,patch,context){
    const old=get(s,id);if(!old.ok)return old;
    let next;
    try{next=H.edit(old.design,patch,old.progress.current)}catch(err){return{ok:false,reason:"invalid-edit",message:err.message}}
    if(Object.keys(patch).some(k=>["x","z","rotation","door"].includes(k))){
      const site=H.checkSite(next,context);
      if(!site.ok)return{ok:false,reason:"invalid-site",errors:site.errors};
    }
    let projects=s.constructionProjects;
    if(Object.keys(patch).some(k=>["x","z","rotation"].includes(k)))
      projects=projects.map(p=>p.id===id?{...p,x:next.x,z:next.z,rotation:next.rotation}:p);
    return{ok:true,save:okSave({...s,constructionProjects:projects},id,next),design:next};
  }
  function placeFurniture(s,id,item){
    const data=get(s,id);
    if(!data.ok)return data;
    if(!data.progress.finished)return{ok:false,reason:"house-not-complete"};
    const spec=H.FURNITURE[item&&item.type];
    if(!spec)return{ok:false,reason:"unknown-furniture"};
    const inStorage=storage(s).find(f=>f.id===item.id);
    if(inStorage&&inStorage.type!==item.type)return{ok:false,reason:"stored-type-mismatch"};
    if(Object.entries(store(s)).some(([houseId,d])=>d.furniture&&d.furniture.some(f=>f.id===item.id)))
      return{ok:false,reason:"furniture-id-in-use"};
    let next;
    try{next=H.furniturePlace(data.design,item,data.progress.current)}catch(err){return{ok:false,reason:"invalid-furniture-placement",message:err.message}}
    const inventory={hout:Number(s.hout)||0,steen:Number(s.steen)||0,planken:Number(s.planken)||0};
    if(!inStorage&&Object.entries(spec.cost).some(([m,n])=>inventory[m]<n))
      return{ok:false,reason:"needs-materials",cost:spec.cost};
    if(!inStorage)for(const [m,n]of Object.entries(spec.cost))inventory[m]-=n;
    const nextStorage=inStorage?storage(s).filter(f=>f.id!==item.id):storage(s);
    return{ok:true,save:okSave({...s,...inventory,houseFurnitureStorage:nextStorage},id,next),cost:inStorage?{}:copy(spec.cost),reused:!!inStorage};
  }
  function moveFurniture(s,id,itemId,position){
    const data=get(s,id);if(!data.ok)return data;
    if(!data.progress.finished)return{ok:false,reason:"house-not-complete"};
    try{const n=H.furnitureMove(data.design,itemId,position);return{ok:true,save:okSave(s,id,n)}}catch(err){return{ok:false,reason:"invalid-furniture-move",message:err.message}}
  }
  function storeFurniture(s,id,itemId){
    const data=get(s,id);if(!data.ok)return data;
    if(!data.progress.finished)return{ok:false,reason:"house-not-complete"};
    const item=data.design.furniture.find(f=>f.id===itemId);
    if(!item)return{ok:false,reason:"furniture-not-found"};
    if(storage(s).some(f=>f.id===itemId))return{ok:false,reason:"already-stored"};
    let next;try{next=H.furnitureRemove(data.design,itemId)}catch(err){return{ok:false,reason:"invalid-removal",message:err.message}}
    return{ok:true,save:okSave({...s,houseFurnitureStorage:[...storage(s),{id:item.id,type:item.type}]},id,next)};
  }
  return{begin,get,change,placeFurniture,moveFurniture,storeFurniture};
})(typeof HouseDesigner!=="undefined"?HouseDesigner:require("./house-designer.js"),typeof ConstructionCampaign!=="undefined"?ConstructionCampaign:require("./construction-campaign.js"));
if(typeof module!=="undefined"&&module.exports)module.exports=HousePlanner;
