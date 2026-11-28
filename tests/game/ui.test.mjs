// Desktop checks: subjects per child, management mode only for the parent, the toolbar, the atlas with the Wolkenkruin.
import {installHelpers} from './helpers.mjs';
export default async function(pg,{ok}){
 ok(await pg.evaluate(()=>!document.getElementById('history')&&!!document.getElementById('floorGerman')&&document.getElementById('floorGerman').hidden),'landing: history removed, Floor German hidden for Niek');
 await pg.evaluate(()=>{localStorage.clear();document.getElementById('start').click()});await pg.waitForTimeout(5000);await installHelpers(pg);
 ok(await pg.evaluate(()=>['','kaart','tree'].map(k=>subject(k)).join()==='nl,nl,nl'),'Niek gets Dutch in the game');
 ok(await pg.evaluate(()=>{askOne(subject(),{kicker:'T',title:'T'},()=>({head:'x',buttons:[['Sluiten',closePanel,true]]}));const q=document.querySelector('.question')?.textContent;closePanel();return dutchBanks.Niek.some(b=>b[1]===q)}),'a game question for Niek comes from the Dutch bank');
 ok(await pg.evaluate(()=>{document.querySelector('[data-profile="Floor"]').click();const yes=subject()==='de'&&!document.getElementById('floorGerman').hidden&&German.bank.length===260;document.querySelector('[data-profile="Niek"]').click();return yes}),'Floor has 260 German questions and her German button, Niek retains Dutch');
 // management mode: no pincode hash in the page; only the parent (according to the server) may open it
 let r=await pg.evaluate(async()=>{const src=[...document.scripts].map(s=>s.src).filter(Boolean);let txt='';for(const u of src)txt+=await (await fetch(u)).text();
  const real=window.fetch,as=who=>window.fetch=async(u,o)=>/whoami/.test(u)?new Response(JSON.stringify({who}),{status:200}):real(u,o);
  as('Niek');await adminOpen();const kid=admin.on;closePanel();as('Ouder');await adminOpen();const parent=admin.on;closePanel();admin.on=false;window.fetch=real;
  return {hash:/[0-9a-f]{64}/.test(txt.replace(/sha256|SHA-256/g,'')),kid,parent}});
 ok(!r.kid&&r.parent,'management mode: refused for a child, open for the parent');ok(!r.hash,'no 64-character hash in any game script');
 // toolbar: the three hand tools, the right one goes into the hand
 r=await pg.evaluate(()=>{for(const k of HAND)s.tools[k]=true;s.hand=null;toolbarSig='';updateHUD();const n=document.querySelectorAll('#toolbar button').length;holdTool('zaag',true);const h=s.hand;holdTool('zaag',true);return {n,h,after:s.hand}});
 ok(r.n===3&&r.h==='zaag'&&r.after===null,'toolbar: three tools, pressing again puts the saw away');
 // atlas: level 5 on the map with the Wolkenkruin inset
 r=await pg.evaluate(()=>{s.stage=6;s.level=5;$('mapbtn').click();const c=$('atlas'),g=c.getContext('2d').getImageData(0,0,c.width,60).data;let lilac=0;for(let i=0;i<g.length;i+=4)if(Math.abs(g[i]-0xdc)<12&&Math.abs(g[i+1]-0xd6)<12&&Math.abs(g[i+2]-0xe8)<12)lilac++;const t=$('content').textContent;closePanel();return {h:c.height,lilac,l5:/Level 5/.test(t)}});
 ok(r.h===470&&r.lilac>50&&r.l5,'atlas: Wolkenkruin inset at the top and level 5 in the list')}
