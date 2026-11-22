"use strict";
// Loader for the game's compact .mdl models (converted from Poly Haven CC0 scans).
// Models.load(name) resolves to {geometry, material}; textures are shared and loaded once.
const Models = (() => {
  const T = THREE, cache = new Map(), textures = new Map(), loader = new T.TextureLoader();
  let anisotropy = 4;
  function texture(file, color) {
    if (textures.has(file)) return textures.get(file);
    const t = loader.load('models/' + file);
    t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = anisotropy; t.flipY = false;
    if (color) t.colorSpace = T.SRGBColorSpace;
    textures.set(file, t); return t;
  }
  function material(m) {
    const o = { roughness: 1, metalness: m.arm ? 1 : 0 };
    if (m.diff) o.map = texture(m.diff, true);
    if (m.nor) { o.normalMap = texture(m.nor); o.normalScale = new T.Vector2(1, 1); }
    if (m.arm) { const t = texture(m.arm); o.roughnessMap = t; o.metalnessMap = t; if (m.ao !== false) { o.aoMap = t; o.aoMapIntensity = .85; } }
    if (m.emi) { o.emissiveMap = texture(m.emi, true); o.emissive = new T.Color(...(m.emissive || [1, 1, 1])); o.emissiveIntensity = 1.6; }
    if (m.alpha === 'MASK') { o.alphaTest = m.cutoff ?? .5; o.side = T.DoubleSide; }
    if (m.alpha === 'BLEND') { o.transparent = true; o.depthWrite = false; o.opacity = .55; }
    if (m.double) o.side = T.DoubleSide;
    return new T.MeshStandardMaterial(o);
  }
  function parse(buf) {
    const dv = new DataView(buf), len = dv.getUint32(4, true), head = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 8, len))), base = 8 + len;
    const g = new T.BufferGeometry(), groups = head.groups;
    const vTotal = groups.reduce((s, e) => s + e.v, 0), iTotal = groups.reduce((s, e) => s + e.i, 0);
    const pos = new Float32Array(vTotal * 3), nor = new Int8Array(vTotal * 3), uv = new Float32Array(vTotal * 2), idx = vTotal > 65535 ? new Uint32Array(iTotal) : new Uint16Array(iTotal);
    let v0 = 0, i0 = 0;
    groups.forEach((e, k) => {
      pos.set(new Float32Array(buf, base + e.pos, e.v * 3), v0 * 3);
      nor.set(new Int8Array(buf, base + e.nor, e.v * 3), v0 * 3);
      uv.set(new Float32Array(buf, base + e.uv, e.v * 2), v0 * 2);
      const src = e.big ? new Uint32Array(buf, base + e.idx, e.i) : new Uint16Array(buf, base + e.idx, e.i);
      for (let j = 0; j < e.i; j++) idx[i0 + j] = src[j] + v0;
      g.addGroup(i0, e.i, k); v0 += e.v; i0 += e.i;
    });
    g.setAttribute('position', new T.BufferAttribute(pos, 3));
    g.setAttribute('normal', new T.BufferAttribute(nor, 3, true));
    g.setAttribute('uv', new T.BufferAttribute(uv, 2));
    g.setIndex(new T.BufferAttribute(idx, 1));
    g.computeBoundingBox(); g.computeBoundingSphere();
    const mats = head.mats.map(material);
    if (mats.length === 1) g.clearGroups();
    return { geometry: g, material: mats.length === 1 ? mats[0] : mats };
  }
  function load(name) {
    if (!cache.has(name)) cache.set(name, fetch('models/' + name + '.mdl').then(r => { if (!r.ok) throw new Error(name + ' ' + r.status); return r.arrayBuffer(); }).then(parse));
    return cache.get(name);
  }
  return { load, texture, setAnisotropy: a => { anisotropy = a; } };
})();
