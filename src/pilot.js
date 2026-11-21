// A jointed flight suit. Local -Z is forward and the sole plane is Y = 0.
function makePilot(scene) {
  const T = THREE;
  const oval = new T.SphereGeometry(1, 16, 10);
  const box = new T.BoxGeometry();
  const tube = new T.CylinderGeometry(1, 1, 1, 16);
  const ring = new T.TorusGeometry(1, .105, 6, 22);
  const palette = {
    suit: 0x176b78, armor: 0xe6e6d4, trim: 0xf2ad4d, scarf: 0xd85a3f,
    navy: 0x263a50, rubber: 0x23333c, seam: 0x526674, visor: 0x125366,
    glow: 0x84ecdf, skin: 0xc38b6b, hair: 0x463533
  };
  const materials = {};
  for (const [key,color] of Object.entries(palette)) {
    materials[key] = new T.MeshStandardMaterial({color, roughness:key==='visor'?.18:.65, metalness:key==='trim'?.32:.05});
  }
  function joint(parent,x=0,y=0,z=0) {
    const g=new T.Group();parent.add(g);g.position.set(x,y,z);return g;
  }
  function part(parent,geo,material,x,y,z,w,h,d) {
    const m=new T.Mesh(geo,materials[material]);parent.add(m);m.position.set(x,y,z);m.scale.set(w,h,d);return m;
  }
  function shell(parent,material,profile,x,y,z,depth) {
    const geo=new T.LatheGeometry(profile.map(([radius,height])=>new T.Vector2(radius,height)),20);
    return part(parent,geo,material,x,y,z,1,1,depth);
  }
  const root=joint(scene),body=joint(root),chest=joint(body,0,1.05),head=joint(chest,0,.86);
  shell(chest,'suit',[[.06,-.05],[.32,0],[.37,.25],[.5,.57],[.43,.68],[.19,.79],[.04,.78]],0,0,0,.72);
  part(chest,oval,'armor',0,.54,-.22,.39,.24,.12);
  part(chest,box,'scarf',0,.54,-.345,.13,.19,.022).rotation.z=-.55;
  part(chest,oval,'navy',0,.085,0,.37,.105,.275);
  part(chest,box,'trim',0,.08,-.275,.16,.115,.06);
  part(head,oval,'skin',0,.28,-.025,.36,.41,.34);
  // Flight helmet with central stripe, continuous panoramic visor and ear cups.
  part(head,oval,'armor',0,.40,.035,.445,.46,.405);
  part(head,oval,'scarf',0,.43,.049,.12,.449,.399);
  part(head,oval,'rubber',0,.37,-.205,.436,.253,.26);
  part(head,oval,'visor',0,.385,-.235,.416,.211,.254);
  part(head,oval,'glow',-.16,.438,-.446,.139,.023,.027).rotation.z=.12;
  part(head,oval,'glow',.21,.428,-.427,.057,.017,.02);
  part(head,oval,'navy',0,.134,-.23,.25,.095,.14);
  const pack=joint(chest,0,.39,.26);
  part(pack,oval,'navy',0,0,.045,.369,.424,.20);
  part(pack,oval,'armor',0,.01,.17,.293,.336,.16);
  // Concentric turbine rings and moving impeller, visible in third-person.
  const rotor=joint(pack,0,.045,.325);
  part(rotor,oval,'rubber',0,0,0,.21,.21,.028);
  part(pack,ring,'trim',0,.045,.327,.228,.228,.16);
  part(pack,ring,'glow',0,.045,.34,.171,.171,.09);
  for(let i=0;i<6;i++){
    const blade=joint(rotor);blade.rotation.z=i*Math.PI/3;
    part(blade,oval,'seam',.042,.089,.033,.052,.106,.017).rotation.z=-.54;
  }
  part(rotor,oval,'trim',0,0,.06,.052,.052,.022);
  const scarf=joint(chest,-.26,.75,.12);
  part(chest,oval,'scarf',0,.768,-.005,.30,.14,.25);
  part(scarf,oval,'scarf',-.045,-.12,.13,.12,.24,.06).rotation.x=-.61;
  const tail=joint(scarf,-.05,-.29,.22);
  part(tail,oval,'scarf',0,-.16,0,.108,.23,.052);
  const legs=[],arms=[];
  for(const side of [-1,1]){
    part(head,oval,'navy',side*.402,.33,.03,.084,.193,.163);
    part(head,oval,'trim',side*.456,.33,.025,.047,.132,.115);
    part(head,oval,'armor',side*.483,.334,.02,.028,.086,.077);
    part(chest,oval,'navy',side*.279,.42,-.23,.071,.31,.065).rotation.z=-side*.20;
    part(chest,box,'trim',side*.27,.42,-.29,.124,.075,.04);
    part(pack,oval,'suit',side*.298,-.08,.10,.103,.31,.13);
    const hip=joint(body,side*.203,.998),knee=joint(hip,0,-.425),ankle=joint(knee,0,-.39);
    part(hip,oval,'navy',0,-.19,0,.187,.29,.189);
    part(hip,oval,'suit',side*.11,-.185,.008,.104,.213,.151);
    part(knee,oval,'rubber',0,.014,0,.162,.142,.141);
    part(knee,oval,'armor',0,-.02,-.111,.147,.13,.095);
    part(knee,oval,'navy',0,-.212,.006,.14,.24,.151);
    part(ankle,oval,'scarf',0,.072,0,.16,.068,.16);
    part(ankle,oval,'rubber',0,-.023,-.064,.185,.142,.25);
    part(ankle,oval,'seam',0,-.116,-.07,.19,.062,.256);
    const shoulder=joint(chest,side*.445,.6),elbow=joint(shoulder,side*.038,-.31);
    part(shoulder,oval,'suit',0,-.15,0,.144,.22,.151);
    part(shoulder,oval,'armor',side*.027,-.035,0,.183,.142,.177);
    part(elbow,oval,'navy',0,0,0,.124,.121,.122);
    part(elbow,oval,'suit',0,-.163,0,.123,.186,.132);
    part(elbow,tube,'trim',0,-.254,0,.122,.075,.13);
    part(elbow,oval,'rubber',0,-.35,-.022,.133,.143,.135);
    legs.push({hip,knee,ankle,side});arms.push({shoulder,elbow,side});
  }
  const antenna=joint(head,.35,.45,.025);
  part(antenna,tube,'navy',.075,.248,.026,.021,.43,.021).rotation.z=-.26;
  part(antenna,oval,'trim',.13,.477,.026,.035,.049,.035);
  const fins=joint(head);
  for(const side of [-1,1]){
    const blade=part(fins,oval,'suit',side*.382,.52,.19,.086,.232,.095);
    blade.rotation.x=.67;blade.rotation.z=-side*.26;
    const tip=part(fins,oval,'trim',side*.417,.659,.288,.057,.1,.055);
    tip.rotation.x=.67;
  }
  let selected,blend=0,harvestTime=-10;
  function outfit(name){
    if(name===selected)return;selected=name;
    const nova=name==='Nova';antenna.visible=!nova;fins.visible=nova;
    for(const [key,value] of Object.entries({suit:nova?0x625194:palette.suit,scarf:nova?0x46b9ad:palette.scarf,trim:nova?0xf1b978:palette.trim})){
      materials[key].color.setHex(value);
    }
  }
  function pose(t,p,dt){
    const gait=p.speed||0,air=!p.on,glide=!!p.glide;
    blend+=(gait-blend)*(1-Math.exp(-14*dt));
    const phase=p.walk||0,step=Math.sin(phase),breath=Math.sin(t*2.3);
    root.position.set(p.x,p.y,p.z);
    const turn=Math.atan2(Math.sin(p.heading-root.rotation.y),Math.cos(p.heading-root.rotation.y));
    root.rotation.y+=turn*(dt>=1?1:1-Math.exp(-17*dt));
    body.position.y=.019*breath+(air?0:Math.abs(Math.cos(phase))*.054*blend);
    chest.rotation.set(glide?-.28:-.105*blend,step*.14*blend,step*.04*blend);
    head.rotation.set(-chest.rotation.x*.35,Math.sin(t*1.15)*.07*(1-blend)-chest.rotation.y*.5,0);
    rotor.rotation.z=-t*(glide?15:3.2);
    const reach=Math.max(0,1-(t-harvestTime)/.45);
    for(const {hip,knee,ankle,side} of legs){
      const swing=side*step;
      hip.rotation.x=air?(glide?.29:-.45+side*.18):swing*.80*blend;
      knee.rotation.x=air?(glide?.48:.94):.075+Math.max(0,-swing)*.91*blend;
      ankle.rotation.x=-knee.rotation.x*.46;
    }
    for(const {shoulder,elbow,side} of arms){
      shoulder.rotation.set(air?-.27:-side*step*.64*blend-(side===1?reach:0),0,side*(glide?1.25:air?.53:.10));
      elbow.rotation.x=-.27-.40*blend-.22*Math.max(0,side*step)*blend;
    }
    scarf.rotation.x=-.20-.78*blend-(glide?.51:0)+.11*Math.sin(t*6);
    tail.rotation.set(-.23+.15*Math.sin(t*7),0,.16*Math.sin(t*5.2));
  }
  outfit("Flint");
  return {root,outfit,pose,reach(){harvestTime=performance.now()/1000}};
}
