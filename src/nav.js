"use strict";
// Small grid pathfinder for people and animals: A* over 0.5-unit cells around start and goal,
// then string-pulled so the walk looks natural instead of zigzagging from cell to cell.
const Nav={
 path(sx,sz,gx,gz,free,{cell=.5,margin=8,limit=24000}={}){
  if(Nav.clear(sx,sz,gx,gz,free))return [{x:gx,z:gz}];
  const goal=Nav.nearestFree(gx,gz,free,cell);if(!goal)return null;
  const x0=Math.min(sx,goal.x)-margin,z0=Math.min(sz,goal.z)-margin,W=Math.ceil((Math.abs(sx-goal.x)+2*margin)/cell)+1,H=Math.ceil((Math.abs(sz-goal.z)+2*margin)/cell)+1;
  const id=(i,j)=>j*W+i,ci=x=>Math.round((x-x0)/cell),cj=z=>Math.round((z-z0)/cell),wx=i=>x0+i*cell,wz=j=>z0+j*cell;
  const known=new Int8Array(W*H),g=new Float32Array(W*H).fill(Infinity),from=new Int32Array(W*H).fill(-1),open=[];
  const ok=(i,j)=>{if(i<0||j<0||i>=W||j>=H)return false;const k=id(i,j);if(!known[k])known[k]=free(wx(i),wz(j))?1:2;return known[k]===1};
  const si=ci(sx),sj=cj(sz),ti=ci(goal.x),tj=cj(goal.z),h=(i,j)=>Math.hypot(i-ti,j-tj);
  g[id(si,sj)]=0;open.push([h(si,sj),si,sj]);let found=false,steps=0;
  while(open.length&&steps++<limit){
   let best=0;for(let k=1;k<open.length;k++)if(open[k][0]<open[best][0])best=k;
   const [,i,j]=open[best];open[best]=open[open.length-1];open.pop();
   if(i===ti&&j===tj){found=true;break}
   for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const ni=i+di,nj=j+dj;
    if(!ok(ni,nj)||di&&dj&&(!ok(i+di,j)||!ok(i,j+dj)))continue;
    const c=g[id(i,j)]+(di&&dj?1.414:1);if(c<g[id(ni,nj)]){g[id(ni,nj)]=c;from[id(ni,nj)]=id(i,j);open.push([c+h(ni,nj),ni,nj])}}
  }
  if(!found)return null;
  const cells=[];for(let k=id(ti,tj);k>=0;k=from[k])cells.push({x:wx(k%W),z:wz(Math.floor(k/W))});cells.reverse();cells[cells.length-1]={x:goal.x,z:goal.z};
  // string pulling: keep only the corners we cannot see past
  const out=[];let a={x:sx,z:sz},k=0;
  while(k<cells.length-1){let far=k+1;for(let m=cells.length-1;m>k+1;m--)if(Nav.clear(a.x,a.z,cells[m].x,cells[m].z,free)){far=m;break}out.push(cells[far]);a=cells[far];k=far}
  if(!out.length)out.push(cells[cells.length-1]);return out
 },
 clear(x0,z0,x1,z1,free){const n=Math.max(2,Math.ceil(Math.hypot(x1-x0,z1-z0)/.22));for(let k=1;k<=n;k++){const f=k/n;if(!free(x0+(x1-x0)*f,z0+(z1-z0)*f))return false}return true},
 nearestFree(x,z,free,cell=.5){if(free(x,z))return {x,z};for(let r=cell;r<3;r+=cell)for(let a=0;a<6.28;a+=.4){const px=x+Math.cos(a)*r,pz=z+Math.sin(a)*r;if(free(px,pz))return {x:px,z:pz}}return null}
};
