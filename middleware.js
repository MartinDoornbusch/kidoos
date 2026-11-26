// Front-door gate: every page, script, model and API call needs a valid login cookie. Without it, pages go to the
// login page and API calls get 401. The login page, its background, the font, the login and logout calls stay open.
import {whoFrom} from './api/_auth.js';
export const config={matcher:['/((?!login.html|art/archipel.jpg|vendor/display.ttf|api/login|api/logout|favicon.ico).*)']};
export default function middleware(request){
 if(whoFrom(request))return;
 const url=new URL(request.url);
 if(url.pathname.startsWith('/api/'))return new Response(JSON.stringify({error:'login'}),{status:401,headers:{'content-type':'application/json','cache-control':'no-store'}});
 const to=new URL('/login.html',url);
 return new Response(null,{status:302,headers:{location:to.pathname,'cache-control':'no-store'}})}
