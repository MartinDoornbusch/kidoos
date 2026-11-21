"use strict";
// Cinematic finish: the scene renders into an HDR buffer, bright parts bloom,
// then one pass tone-maps, grades (cool shadows, warm light), vignettes and adds a trace of grain.
function createFX(renderer,scene,cam){
 const T=THREE,gl=renderer.getContext();
 if(typeof WebGL2RenderingContext==='undefined'||!(gl instanceof WebGL2RenderingContext))return null;
 const hdr=renderer.extensions.has('EXT_color_buffer_float')||renderer.extensions.has('EXT_color_buffer_half_float');
 const type=hdr?T.HalfFloatType:T.UnsignedByteType;
 const target=(samples)=>new T.WebGLRenderTarget(1,1,{type,samples,depthBuffer:samples>0,colorSpace:T.LinearSRGBColorSpace});
 const main=target(4),half=target(0),blurA=[target(0),target(0)],blurB=[target(0),target(0)];
 const quadScene=new T.Scene(),quadCam=new T.OrthographicCamera(-1,1,1,-1,0,1),quad=new T.Mesh(new T.PlaneGeometry(2,2));quadScene.add(quad);
 const vert='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
 const shader=(uniforms,frag)=>new T.ShaderMaterial({uniforms,vertexShader:vert,fragmentShader:frag,depthTest:false,depthWrite:false});
 const bright=shader({tDiffuse:{value:null},threshold:{value:hdr?1.05:.78}},
  `uniform sampler2D tDiffuse;uniform float threshold;varying vec2 vUv;void main(){vec3 c=texture2D(tDiffuse,vUv).rgb;float l=max(c.r,max(c.g,c.b));float k=smoothstep(threshold,threshold*1.7+.15,l);gl_FragColor=vec4(c*k,1.);}`);
 const blur=shader({tDiffuse:{value:null},dir:{value:new T.Vector2()}},
  `uniform sampler2D tDiffuse;uniform vec2 dir;varying vec2 vUv;void main(){vec3 s=texture2D(tDiffuse,vUv).rgb*.227;
   s+=(texture2D(tDiffuse,vUv+dir*1.385).rgb+texture2D(tDiffuse,vUv-dir*1.385).rgb)*.316;
   s+=(texture2D(tDiffuse,vUv+dir*3.231).rgb+texture2D(tDiffuse,vUv-dir*3.231).rgb)*.07;gl_FragColor=vec4(s,1.);}`);
 const finish=shader({tScene:{value:null},tBloomA:{value:null},tBloomB:{value:null},exposure:{value:1},bloom:{value:.55},time:{value:0},res:{value:new T.Vector2()},useBloom:{value:1}},
  `uniform sampler2D tScene,tBloomA,tBloomB;uniform float exposure,bloom,time,useBloom;uniform vec2 res;varying vec2 vUv;
   vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
   vec3 srgb(vec3 c){return mix(c*12.92,1.055*pow(c,vec3(1./2.4))-.055,step(.0031308,c));}
   void main(){vec3 c=texture2D(tScene,vUv).rgb;
    c+=useBloom*bloom*(texture2D(tBloomA,vUv).rgb*.55+texture2D(tBloomB,vUv).rgb*.75);
    c*=exposure;float l=dot(c,vec3(.2126,.7152,.0722));
    c=mix(c*vec3(.9,.98,1.1),c*vec3(1.08,1.,.88),smoothstep(.02,.75,l));
    c=max(mix(vec3(l),c,1.12),0.);c=aces(c);
    vec2 d=(vUv-.5)*vec2(res.x/res.y,1.);c*=mix(.72,1.,smoothstep(1.05,.35,length(d)));
    c=srgb(c);float n=fract(sin(dot(vUv*res+fract(time)*61.,vec2(12.9898,78.233)))*43758.5453);
    gl_FragColor=vec4(c+(n-.5)*.012,1.);}`);
 function pass(material,out){quad.material=material;renderer.setRenderTarget(out);renderer.render(quadScene,quadCam)}
 let w=1,h=1,useBloom=true;
 function setSize(width,height){w=Math.max(1,width);h=Math.max(1,height);main.setSize(w,h);half.setSize(w>>1,h>>1);
  blurA.forEach(t=>t.setSize(w>>2,h>>2));blurB.forEach(t=>t.setSize(w>>3,h>>3));finish.uniforms.res.value.set(w,h)}
 function chain(src,[a,b]){blur.uniforms.tDiffuse.value=src;blur.uniforms.dir.value.set(1/a.width,0);pass(blur,a);
  blur.uniforms.tDiffuse.value=a.texture;blur.uniforms.dir.value.set(0,1/a.height);pass(blur,b);return b.texture}
 function render(t){
  renderer.setRenderTarget(main);renderer.render(scene,cam);
  if(useBloom){bright.uniforms.tDiffuse.value=main.texture;pass(bright,half);
   const a=chain(half.texture,blurA),b=chain(a,blurB);finish.uniforms.tBloomA.value=a;finish.uniforms.tBloomB.value=b}
  finish.uniforms.useBloom.value=useBloom?1:0;finish.uniforms.tScene.value=main.texture;finish.uniforms.time.value=t;pass(finish,null)}
 return {render,setSize,uniforms:finish.uniforms,set bloom(v){useBloom=v},get bloom(){return useBloom}}
}
