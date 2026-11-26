// Logs out on this device: clears the login cookies and goes back to the login page.
import {logoutCookies} from './_auth.js';
export default function handler(req,res){res.setHeader('cache-control','no-store');res.setHeader('set-cookie',logoutCookies());res.statusCode=302;res.setHeader('location','/login.html');res.end()}
