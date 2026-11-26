// Shared helpers for the family overview. Progress lives in a private Vercel Blob store:
// one JSON file per child per device (progress/<kind>/<apparaat>.json), so devices never overwrite each other.
import crypto from 'node:crypto';
import {put,get,list} from '@vercel/blob';

// The device token is derived from the store's own server-side secret, so no extra secret is needed.
const secret=()=>process.env.BLOB_READ_WRITE_TOKEN||'';
export const configured=()=>!!secret();
export const deviceToken=()=>crypto.createHmac('sha256',secret()).update('skybound-device-v1').digest('hex');
export function tokenOk(t){if(typeof t!=='string'||!configured())return false;const a=Buffer.from(t),b=Buffer.from(deviceToken());return a.length===b.length&&crypto.timingSafeEqual(a,b)}
export const sleep=ms=>new Promise(r=>setTimeout(r,ms));
// Storage calls go through this object so tests can swap in an in-memory store.
export const store={
 async read(pathname){const r=await get(pathname,{access:'private',useCache:false});if(!r||r.statusCode!==200)return null;return JSON.parse(await new Response(r.stream).text())},
 write:(pathname,obj)=>put(pathname,JSON.stringify(obj),{access:'private',allowOverwrite:true,addRandomSuffix:false,contentType:'application/json'}),
 async paths(prefix){const out=[];let cursor;do{const r=await list({prefix,cursor});out.push(...r.blobs.map(b=>b.pathname));cursor=r.hasMore?r.cursor:undefined}while(cursor);return out}
};
export const KIDS=['Niek','Floor'];
