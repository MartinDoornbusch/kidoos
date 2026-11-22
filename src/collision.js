// Static and state-dependent solids share the same spatial index.
// Each query intersects a vertical cylinder against circles or rounded box footprints.
function createSolids(){
 const cells=new Map(),cellSize=6;
 function add(o){
  const w=o.w??o.r,d=o.d??o.r;
  for(let i=Math.floor((o.x-w)/cellSize);i<=Math.floor((o.x+w)/cellSize);i++){
   for(let j=Math.floor((o.z-d)/cellSize);j<=Math.floor((o.z+d)/cellSize);j++){
    const key=i+','+j;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(o);
   }
  }
 }
 function overlaps(o,x,z,r){
  if(o.r!=null)return (x-o.x)**2+(z-o.z)**2<(o.r+r)**2;
  const dx=Math.max(0,Math.abs(x-o.x)-o.w),dz=Math.max(0,Math.abs(z-o.z)-o.d);
  return dx*dx+dz*dz<r*r;
 }
 function query(x,z,r,s,visit){
  for(let i=Math.floor((x-r)/cellSize);i<=Math.floor((x+r)/cellSize);i++){
   for(let j=Math.floor((z-r)/cellSize);j<=Math.floor((z+r)/cellSize);j++){
    for(const o of cells.get(i+','+j)||[]){
     if(o.stage>s.stage||o.when&&!o.when(s)||o.harvest!=null&&s.harvest[o.harvest]>Date.now())continue;
     if(overlaps(o,x,z,r)&&visit(o))return true;
    }
   }
  }
  for(const b of s.builds){
   const o=b.type==='blok'?{...b,w:1,d:1,base:b.y,top:b.y+1.12}:b.type==='bankje'?{...b,w:.6,d:.28,base:b.y,top:b.y+.6}:b.type==='bloembak'?{...b,r:.48,base:b.y,top:b.y+.62}:{...b,r:b.type==='vlag'?.12:.24,base:b.y,top:b.y+3.4};
   if(overlaps(o,x,z,r)&&visit(o))return true;
  }
  return false;
 }
 function blocked(x,z,s,y,r=.355,height=2.68){
  return query(x,z,r,s,o=>y<o.top-.025&&y+height>o.base+.025);
 }
 function floor(x,z,s,y){
  let result=-100;query(x,z,.29,s,o=>{if(y>=o.top-.045)result=Math.max(result,o.top)});return result;
 }
 function ceiling(x,z,s,y,height){
  let result=Infinity;query(x,z,.35,s,o=>{if(o.base>=y+height-.025)result=Math.min(result,o.base)});return result;
 }
 return {add,blocked,floor,ceiling}
}
