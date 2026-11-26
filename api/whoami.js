// (1.26.1) Who is logged in on this device, read from the signed cookie. The game asks this before it opens the
// parent's management mode, so that mode no longer needs a pincode (or its hash) in the browser.
import {whoFrom} from './_auth.js';
export default function handler(req,res){res.setHeader('cache-control','no-store');res.status(200).json({who:whoFrom(req)})}
