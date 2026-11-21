// A small depth-buffered rasterizer for browsers without a hardware WebGL context.
// Geometry, animation, perspective camera and game physics are shared with Three.js.
function softwareRenderer(canvas){
 const ctx=canvas.getContext('2d'),cache=new WeakMap(),instances=new WeakMap(),geometries=new WeakMap(),T=THREE;
 let w,h,frame,pixels,depth,last=-1;const vp=new T.Matrix4(),matrix=new T.Matrix4(),instance=new T.Matrix4(),color=new T.Color(),fog=[178,217,226];
 function setSize(width,height){const scale=Math.min(1,840/Math.max(width,height));w=canvas.width=Math.max(1,Math.floor(width*scale));h=canvas.height=Math.max(1,Math.floor(height*scale));frame=ctx.createImageData(w,h);pixels=new Uint32Array(frame.data.buffer);depth=new Float32Array(w*h)}
 function geometry(g){if(geometries.has(g))return geometries.get(g);let pos=g.attributes.position.array,idx=g.index?.array||Array.from({length:pos.length/3},(_,i)=>i);let geo={pos,idx,colors:g.attributes.color?.array};geometries.set(g,geo);return geo}
 const srgb=new Uint8Array(4097);
 for(let i=0;i<srgb.length;i++){let v=i/4096;srgb[i]=Math.round(255*(v<=.00313?12.92*v:1.055*Math.pow(v,1/2.4)-.055))}
 function cssByte(v){return srgb[Math.min(4096,Math.max(0,Math.round(v*4096)))]}
 const maps=new WeakMap();
 function textureData(map){
  if(!map?.image?.naturalWidth)return null;
  if(!maps.has(map)){const cvs=document.createElement('canvas');cvs.width=cvs.height=512;const c=cvs.getContext('2d',{willReadFrequently:true});
   c.drawImage(map.image,0,0,512,512);maps.set(map,new Uint32Array(c.getImageData(0,0,512,512).data.buffer))}
  return maps.get(map)
 }
 function bake(g,m,c,material){let {pos,idx,colors}=geometry(g),verts=new Float32Array(pos.length),e=m.elements;
  for(let i=0;i<pos.length;i+=3){let x=pos[i],y=pos[i+1],z=pos[i+2];verts[i]=e[0]*x+e[4]*y+e[8]*z+e[12];verts[i+1]=e[1]*x+e[5]*y+e[9]*z+e[13];verts[i+2]=e[2]*x+e[6]*y+e[10]*z+e[14]}
  let shades=new Uint8Array(idx.length);for(let i=0;i<idx.length;i+=3){let a=idx[i]*3,b=idx[i+1]*3,d=idx[i+2]*3,ux=verts[b]-verts[a],uy=verts[b+1]-verts[a+1],uz=verts[b+2]-verts[a+2],vx=verts[d]-verts[a],vy=verts[d+1]-verts[a+1],vz=verts[d+2]-verts[a+2],nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;
  let sun=Math.max(0,(-.46*nx+.8*ny+.39*nz)/(Math.hypot(nx,ny,nz)||1)),light=.68+.57*sun;
  shades[i]=cssByte((colors?colors[a]:c.r)*light*1.04);shades[i+1]=cssByte((colors?colors[a+1]:c.g)*light);shades[i+2]=cssByte((colors?colors[a+2]:c.b)*(.75+.43*sun))}
  return {verts,idx,shades,map:material.map,uv:g.attributes.uv?.array,screen:new Float32Array(pos.length),double:material.side===T.DoubleSide}
 }
 function draw(mesh){const tex=textureData(mesh.map),uv=mesh.uv;if(mesh.map&&!tex)return;let {verts,idx,shades,screen,double}=mesh,e=vp.elements,mask=15;
  for(let i=0;i<verts.length;i+=3){let x=verts[i],y=verts[i+1],z=verts[i+2],d=e[3]*x+e[7]*y+e[11]*z+e[15],inv=1/d;
   let sx=(.5+.5*(e[0]*x+e[4]*y+e[8]*z+e[12])*inv)*w,sy=(.5-.5*(e[1]*x+e[5]*y+e[9]*z+e[13])*inv)*h;screen[i]=sx;screen[i+1]=sy;screen[i+2]=inv;mask&=d>.12?((sx<0?1:0)|(sx>w?2:0)|(sy<0?4:0)|(sy>h?8:0)):0}
  if(mask)return;
  for(let i=0;i<idx.length;i+=3){let a=idx[i]*3,b=idx[i+1]*3,c=idx[i+2]*3,az=screen[a+2],bz=screen[b+2],cz=screen[c+2];let points=null;
   let ua=0,ub=0,uc=0,va=0,vb=0,vc=0;
   if(tex&&uv){ua=uv[idx[i]*2];ub=uv[idx[i+1]*2];uc=uv[idx[i+2]*2];va=uv[idx[i]*2+1];vb=uv[idx[i+1]*2+1];vc=uv[idx[i+2]*2+1]}
   if(Math.min(az,bz,cz)<=0||Math.max(az,bz,cz)>8){if(Math.max(az,bz,cz)<0)continue;const original=[[screen[a],screen[a+1],az,ua,va],[screen[b],screen[b+1],bz,ub,vb],[screen[c],screen[c+1],cz,uc,vc]];points=[];
    for(let k=0;k<3;k++){let v=original[k],u=original[(k+1)%3],dv=1/v[2],du=1/u[2],inside=dv>=.125;if(inside)points.push(v);
     if(inside!==(du>=.125)){let t=(.125-dv)/(du-dv);points.push([(v[0]*dv*(1-t)+u[0]*du*t)*8,(v[1]*dv*(1-t)+u[1]*du*t)*8,8,v[3]+t*(u[3]-v[3]),v[4]+t*(u[4]-v[4])])}}}
   for(let k=1;k<(points?points.length-1:2);k++){let ax=screen[a],ay=screen[a+1],bx=screen[b],by=screen[b+1],cx=screen[c],cy=screen[c+1];
    if(points){[ax,ay,az,ua,va]=points[0];[bx,by,bz,ub,vb]=points[k];[cx,cy,cz,uc,vc]=points[k+1]}let ux=bx-ax,uy=by-ay,vx=cx-ax,vy=cy-ay,ar=ux*vy-uy*vx;if(!double&&ar>0||Math.abs(ar)<.05)continue;
   let xmin=Math.max(0,Math.ceil(Math.min(ax,bx,cx)-.5)),xmax=Math.min(w-1,Math.floor(Math.max(ax,bx,cx)-.5)),ymin=Math.max(0,Math.ceil(Math.min(ay,by,cy)-.5)),ymax=Math.min(h-1,Math.floor(Math.max(ay,by,cy)-.5));if(xmax<xmin||ymax<ymin)continue;
   let fogged=1-Math.exp(-Math.pow(.006*3/(az+bz+cz),2)),rr=shades[i]+(fog[0]-shades[i])*fogged,gg=shades[i+1]+(fog[1]-shades[i+1])*fogged,bb=shades[i+2]+(fog[2]-shades[i+2])*fogged,packed=(255<<24)|(bb<<16)|(gg<<8)|rr;
   const u0=ua*az,u1=ub*bz-u0,u2=uc*cz-u0,v0=va*az,v1=vb*bz-v0,v2=vc*cz-v0;
   let dx1=vy/ar,dy1=-vx/ar,dx2=-uy/ar,dy2=ux/ar;
   for(let y=ymin;y<=ymax;y++){let t=(xmin+.5-ax)*dx1+(y+.5-ay)*dy1,u=(xmin+.5-ax)*dx2+(y+.5-ay)*dy2,offset=y*w+xmin;
   for(let x=xmin;x<=xmax;x++,offset++,t+=dx1,u+=dx2){if(t<0||u<0||t+u>1)continue;let z=az+t*(bz-az)+u*(cz-az);if(z>depth[offset]){
    if(tex&&uv){const ix=Math.floor(512*(u0+t*u1+u*u2)/z)&511,frac=(v0+t*v1+u*v2)/z,iy=Math.floor(512*(mesh.map.flipY?1-frac:frac))&511;
    const col=tex[(iy<<9)+ix],r=(col&255)*rr/255,g=((col>>>8)&255)*gg/255,b=((col>>>16)&255)*bb/255;
    const alpha=col>>>24;
    if(alpha<86){if(alpha>0 && mesh.map.image.src?.includes('footshadow')){const old=pixels[offset],f=alpha/255;pixels[offset]=(255<<24)|((b*f+((old>>>16)&255)*(1-f))<<16)|((g*f+((old>>>8)&255)*(1-f))<<8)|(r*f+(old&255)*(1-f))}continue;}depth[offset]=z;pixels[offset]=(255<<24)|((b+(fog[2]-b)*fogged)<<16)|((g+(fog[1]-g)*fogged)<<8)|(r+(fog[0]-r)*fogged)}
    else {depth[offset]=z;pixels[offset]=packed}}}}
  }}
 }
 function render(scene,cam){let now=performance.now();if(now-last<40)return;last=now;depth.fill(0);pixels.fill(0);scene.updateMatrixWorld();cam.updateMatrixWorld();vp.multiplyMatrices(cam.projectionMatrix,cam.matrixWorldInverse);
 scene.traverseVisible(o=>{if(!o.isMesh)return;if(o.isInstancedMesh){let list=instances.get(o);if(!list){list=[];for(let n=0;n<o.count;n++){o.getMatrixAt(n,instance);o.getColorAt(n,color);matrix.multiplyMatrices(o.matrixWorld,instance);list.push(bake(o.geometry,matrix,color,o.material))}instances.set(o,list)}for(let a of list)draw(a)}
 else {let entry=cache.get(o);if(!entry||entry.version!==o.geometry.attributes.position.version||!entry.matrix.equals(o.matrixWorld)||entry.color!==o.material.color.getHex()){entry={version:o.geometry.attributes.position.version,color:o.material.color.getHex(),matrix:o.matrixWorld.clone(),baked:bake(o.geometry,o.matrixWorld,o.material.color,o.material)};cache.set(o,entry)}draw(entry.baked)}});
 ctx.putImageData(frame,0,0)}
 return {setSize,render,setPixelRatio(){}}
}
