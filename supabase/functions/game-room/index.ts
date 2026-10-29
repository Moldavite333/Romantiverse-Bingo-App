const BASE=Deno.env.get('SUPABASE_URL')||'';
const SERVICE=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
const allowed=['https://moldavite333.github.io','http://localhost:5173','http://127.0.0.1:5173'];
const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const cheese=['First meeting','A misunderstanding','The almost-kiss','An old flame reappears','Career versus love dilemma','A romantic gesture','The entire town gets involved','A relative gives unsolicited love advice','Someone overhears the wrong half of a conversation','A romantic deadline approaches','Two people are forced to spend time together','A romantic realization','An inconvenient romantic rival','A sentimental family heirloom','Someone changes their mind','A surprise visitor','A stranger knows exactly what to say','An emotional reunion','A secret is discovered','Love is confessed in public','An awkward date','A coincidence','A dramatic exit','A surprise announcement','A major change of plans','An interruption','Someone learns the true meaning of life','A big-city person returns home','Someone arrives at the last possible moment','A beloved business must be saved'];
const themes={Romance:['Second chance at love','Unexpected reunion','First dance','A shared meal','A surprise invitation','A meaningful gift','A romantic confession','A heartfelt apology','A secret crush','A chance encounter','An unexpected phone call','A thoughtful surprise','A missed connection','An emotional goodbye','A long-awaited kiss','A change of heart','A difficult choice','A romantic getaway','A special celebration','A meaningful photograph','An awkward introduction','An unexpected date','A moment of honesty','A supportive friend','A chance to start over','An important letter','A shared tradition','A happy ending'],Christmas:['Hot cocoa','A town Christmas tree lighting','A snowstorm','Mistletoe','Christmas cookies','A holiday fundraiser','Christmas market','Christmas Eve deadline','Tree decorating','Magical snowfall','Holiday parade','A Christmas wish','A Christmas carol','An ugly sweater','A last-minute gift','Cozy fireplace','Holiday baking contest','A Christmas miracle','A sleigh ride','A family tradition','Christmas lights','Tree farm','A festive party','A holiday reunion','A Christmas kiss','A snowball fight','A Christmas ornament','A surprise present'],Fall:['Pumpkin patch','Apple cider','Hayride','Autumn leaves','Harvest festival','Flannel shirt','Bonfire','Pie contest','Corn maze','Pumpkin carving','Family orchard','Apple picking','Cozy sweater','Fall decorations','Small-town fair','Farm stand','Harvest dance','Autumn sunset','Pumpkin spice','Festival deadline','Scarecrow','Barn party','Leaf-peeping','Unexpected storm','Fall tradition','Apple pie','A fall romance','Crisp autumn morning'],Horror:['Ignored warning','Unlocked door','Creepy basement','Someone splits up','Flashlight fails','Jump scare','Power outage','Mysterious noise','No cell signal','Ominous reflection','Car will not start','False alarm','Strange symbol','Locked room','Terrifying phone call','Old diary','Runs upstairs','Suspicious stranger','Unexplained footsteps','Sudden scream','Door slams','Eerie photograph','Moving shadow','Probably nothing','Final survivor','An ominous warning','A creepy doll','Abandoned house']};
// Romance-only public launch. Preserve archived horror card definitions for a future app.
const launchThemes=new Set(['Romance','Christmas','Fall']);
const isLaunchRoom=(season,collection)=>launchThemes.has(season)&&String(collection||'').trim().toLowerCase()!=='horror';
const h=(origin)=>({'Content-Type':'application/json','Access-Control-Allow-Origin':allowed.includes(origin)?origin:allowed[0],'Vary':'Origin','Access-Control-Allow-Headers':'content-type,apikey,authorization','Access-Control-Allow-Methods':'POST,OPTIONS','Cache-Control':'no-store'});
const reply=(data,status=200,origin='')=>new Response(JSON.stringify(data),{status,headers:h(origin)});
const rand=(len)=>{const b=crypto.getRandomValues(new Uint8Array(len));return Array.from(b,x=>chars[x%chars.length]).join('')};
const token=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('');
const hash=async(t)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t)))).map(x=>x.toString(16).padStart(2,'0')).join('');
const shuffle=(items)=>{const a=[...items];for(let i=a.length-1;i>0;i--){const b=crypto.getRandomValues(new Uint32Array(1))[0]%(i+1);[a[i],a[b]]=[a[b],a[i]]}return a};
const card=(season)=>{const a=shuffle(cheese).slice(0,12).map((label,i)=>({id:'cheese-'+i,label,category:'cheese'}));const b=shuffle(themes[season]).slice(0,12).map((label,i)=>({id:'season-'+i,label,category:'seasonal'}));const c=shuffle([...a,...b]);c.splice(12,0,{id:'free',label:'FREE SPACE',category:'free'});return c};
const safePoster=value=>{if(typeof value!=='string')return null;try{const url=new URL(value);if(url.protocol!=='https:'||url.username||url.password||url.port)return null;if(url.hostname==='image.tmdb.org'&&/^\/t\/p\/(?:w\d+|original)\/[A-Za-z0-9_.-]+$/.test(url.pathname))return url.href;if(url.hostname==='upload.wikimedia.org'&&url.pathname.startsWith('/wikipedia/commons/'))return url.href}catch{}return null};
const query=async(table,method='GET',params='',body)=>{const r=await fetch(BASE+'/rest/v1/'+table+params,{method,headers:{apikey:SERVICE,Authorization:'Bearer '+SERVICE,'Content-Type':'application/json',Prefer:'return=representation'},body:body===undefined?undefined:JSON.stringify(body)});if(!r.ok)throw Error('Storage error '+r.status);return r.json()};
const lines=[...Array.from({length:5},(_,r)=>Array.from({length:5},(_,c)=>r*5+c)),...Array.from({length:5},(_,c)=>Array.from({length:5},(_,r)=>r*5+c)),[0,6,12,18,24],[4,8,12,16,20]];
const score=(marks,free)=>{const set=new Set(marks);if(free)set.add(12);const n=lines.filter(l=>l.every(i=>set.has(i))).length;return {lines:n,bingo:n>0,blackout:set.size===25}};
const cleanRoom=(r,players)=>({code:r.code,movie_title:r.movie_title,movie_collection:r.movie_collection||'Unspecified',poster_url:r.poster_url||null,release_year:r.release_year||null,season:r.season,mode:r.mode,status:r.status,players:players.map(p=>({id:p.id,name:p.name,lines:score(p.marked,p.free_center).lines,marked:p.marked.length}))});
Deno.serve(async req=>{
const origin=req.headers.get('origin')||'';
if(req.method==='OPTIONS')return new Response(null,{status:204,headers:h(origin)});
if(req.method!=='POST')return reply({error:'POST required'},405,origin);
if(!BASE||!SERVICE)return reply({error:'Server not configured'},503,origin);
if(Number(req.headers.get('content-length')||0)>4096)return reply({error:'Request too large'},413,origin);
try{
const x=await req.json();const action=String(x.action||'');
if(!['create','preview','join','state','start','mark','finish'].includes(action))return reply({error:'Invalid action'},400,origin);
if(action==='create'){
const name=String(x.name||'').trim().slice(0,32),movie=String(x.movie_title||'').trim().slice(0,200),season=String(x.season||''),mode=String(x.mode||'classic');
const movieCollection=String(x.movie_collection||'Unspecified').trim().slice(0,40)||'Unspecified';
const posterUrl=safePoster(x.poster_url);
const releaseYear=Number.isInteger(x.release_year)&&x.release_year>=1900&&x.release_year<=2100?x.release_year:null;
if(!name||!movie||!isLaunchRoom(season,movieCollection)||!['classic','chase','blackout','marathon'].includes(mode))return reply({error:'Invalid room details'},400,origin);
const secret=token(),digest=await hash(secret),playerId=crypto.randomUUID();
let room;for(let i=0;i<4;i++){try{room=(await query('live_rooms','POST','?select=*',{code:rand(7),movie_title:movie,movie_collection:movieCollection,poster_url:posterUrl,release_year:releaseYear,season,mode,host_player_id:playerId}))[0];break}catch(e){if(i===3)throw e}}
const player=(await query('live_players','POST','?select=*',{id:playerId,room_id:room.id,name,token_hash:digest,card:card(season),marked:[12],free_center:true}))[0];
return reply({room:cleanRoom(room,[player]),player_id:player.id,token:secret,card:player.card,marked:player.marked,revision:player.revision},200,origin)
}
const code=String(x.code||'').toUpperCase();if(!/^[A-Z2-9]{7}$/.test(code))return reply({error:'Invalid room code'},400,origin);
const rooms=await query('live_rooms','GET','?code=eq.'+encodeURIComponent(code)+'&select=*');const room=rooms[0];
if(!room||new Date(room.expires_at).getTime()<Date.now())return reply({error:'Room not found or expired'},404,origin);
// Do not expose or admit new players to legacy horror rooms; authenticated
// existing players can still finish their games without losing saved state.
if((action==='preview'||action==='join')&&!isLaunchRoom(room.season,room.movie_collection))
  return reply({error:'This game is not available in Romantiverse Bingo'},400,origin);
if(action==='preview')return reply({room:cleanRoom(room,[])},200,origin);
if(action==='join'){
if(room.status!=='lobby')return reply({error:'Game already started'},409,origin);
const name=String(x.name||'').trim().slice(0,32);if(!name)return reply({error:'Nickname required'},400,origin);
const existing=await query('live_players','GET','?room_id=eq.'+room.id+'&select=id');if(existing.length>=12)return reply({error:'Room is full'},409,origin);
const secret=token(),player=(await query('live_players','POST','?select=*',{room_id:room.id,name,token_hash:await hash(secret),card:card(room.season),marked:[12],free_center:true}))[0];
const players=await query('live_players','GET','?room_id=eq.'+room.id+'&select=*');
return reply({room:cleanRoom(room,players),player_id:player.id,token:secret,card:player.card,marked:player.marked,revision:player.revision},200,origin)
}
const secret=String(x.token||'');if(!/^[0-9a-f]{64}$/.test(secret))return reply({error:'Session token required'},401,origin);
const players=await query('live_players','GET','?room_id=eq.'+room.id+'&select=*');
const digest=await hash(secret);const player=players.find(p=>p.token_hash===digest);
if(!player)return reply({error:'Invalid player session'},401,origin);
const base={room:cleanRoom(room,players),player_id:player.id,card:player.card,marked:player.marked,revision:player.revision,score:score(player.marked,player.free_center)};
if(action==='state')return reply(base,200,origin);
if(action==='start'||action==='finish'){
if(room.host_player_id!==player.id)return reply({error:'Only the host can control the room'},403,origin);
if(action==='start'&&room.status!=='lobby')return reply({error:'Game already started'},409,origin);
if(action==='finish'&&room.status!=='playing')return reply({error:'Game is not active'},409,origin);
const status=action==='start'?'playing':'finished';
await query('live_rooms','PATCH','?id=eq.'+room.id+'&status=eq.'+room.status,{status,...(status==='playing'?{started_at:new Date().toISOString()}:{})});
return reply({...base,room:{...base.room,status}},200,origin)
}
if(action==='mark'){
if(room.status!=='playing')return reply({error:'Wait for the host to start'},409,origin);
const index=Number(x.index);if(!Number.isInteger(index)||index<0||index>24||index===12)return reply({error:'Invalid square'},400,origin);
const expected=Number(x.revision);if(!Number.isInteger(expected)||expected!==player.revision)return reply({error:'Outdated card revision',current:base},409,origin);
const next=new Set(player.marked);next.has(index)?next.delete(index):next.add(index);const marked=[...next].sort((a,b)=>a-b);
const updated=await query('live_players','PATCH','?id=eq.'+player.id+'&revision=eq.'+expected+'&select=*',{marked,revision:expected+1});
if(!updated.length)return reply({error:'Concurrent update; refresh room'},409,origin);
return reply({...base,marked,revision:expected+1,score:score(marked,true)},200,origin)
}
return reply({error:'Unsupported action'},400,origin)
}catch(e){return reply({error:'Room request could not be completed'},500,origin)}
});