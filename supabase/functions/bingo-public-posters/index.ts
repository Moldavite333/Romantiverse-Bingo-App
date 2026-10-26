import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

// Public, read-only poster projection for the standalone Romantiverse Bingo app.
// The source catalog is public GitHub JSON. No private Cheese Louise HQ data is read.
// The existing Cheese Louise resolve-movie-poster function does all provider matching.
const CATALOG='https://raw.githubusercontent.com/Moldavite333/Romantiverse-Bingo-App/main/public/catalog/movies.json';
const SUPABASE_URL=Deno.env.get('SUPABASE_URL')||'';
const SERVICE_KEY=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
const ANON_JWT=Deno.env.get('SUPABASE_ANON_KEY')||'';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'content-type, apikey, authorization'};
const jsonHeaders={...cors,'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age=60, stale-while-revalidate=120'};
const now=()=>new Date().toISOString();
const timeout=(ms:number)=>AbortSignal.timeout(ms);
const clean=(v:unknown)=>String(v??'').trim().replace(/\s+/g,' ');
const keyOf=(m:{title:string;release_year:number})=>m.release_year+'|'+m.title;
const approved=(value:unknown)=>{
  if(typeof value!=='string')return null;
  try{
    const u=new URL(value);
    return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&u.hostname==='image.tmdb.org'&&
      /^\/t\/p\/(?:w\d+|original)\/[A-Za-z0-9_.-]+$/.test(u.pathname)?u.href:null;
  }catch{return null;}
};
const serviceHeaders={'apikey':SERVICE_KEY,'Authorization':'Bearer '+SERVICE_KEY,'Content-Type':'application/json'};
async function service(path:string,init:RequestInit={}){
  const response=await fetch(SUPABASE_URL+'/rest/v1/'+path,{...init,headers:{...serviceHeaders,...init.headers},signal:timeout(15000)});
  if(!response.ok)throw Error('Poster cache database returned '+response.status);
  if(response.status===204)return null;
  const text=await response.text();
  return text?JSON.parse(text):null;
}
async function cached(){
  const rows=await service('bingo_poster_cache?select=title,release_year,poster_url,poster_source,match_score,checked_at&limit=200');
  if(!Array.isArray(rows))throw Error('Poster cache returned invalid data');
  return rows;
}
async function claim(){
  return await service('rpc/claim_bingo_poster_refresh',{method:'POST',body:'{}'})===true;
}
async function updateControl(error:string|null){
  await service('bingo_poster_sync_control?id=eq.1',{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({
    next_refresh_at:new Date(Date.now()+(error?30*60*1000:24*60*60*1000)).toISOString(),
    ...(error?{last_error:error.slice(0,300)}:{last_error:null,last_success_at:now()})
  })});
}
async function refresh(){
  try{
    const response=await fetch(CATALOG,{headers:{Accept:'application/json'},signal:timeout(20000),cache:'no-store'});
    if(!response.ok)throw Error('Public Bingo catalog returned '+response.status);
    const data=await response.json();
    if(data?.version!==1||!Array.isArray(data.movies)||data.movies.length>500)throw Error('Invalid public Bingo catalog');
    const seen=new Set<string>();
    const candidates:{title:string;release_year:number}[]=[];
    for(const item of data.movies){
      const title=clean(item?.title),release_year=item?.release_year;
      if(item?.is_demo===true||!title||title.length>250||!Number.isInteger(release_year)||release_year<1900||release_year>2100)continue;
      const key=release_year+'|'+title.toLowerCase();
      if(seen.has(key))continue;
      seen.add(key);candidates.push({title,release_year});
    }
    if(!candidates.length)throw Error('Public Bingo catalog has no eligible titles');
    const previous=await cached();
    const byKey=new Map(previous.map((row:any)=>[keyOf(row),row]));
    const due=candidates.filter(movie=>{
      const row:any=byKey.get(keyOf(movie));
      if(!row?.checked_at)return true;
      const age=Date.now()-new Date(row.checked_at).getTime();
      return !Number.isFinite(age)||age>(approved(row.poster_url)?7*86400000:86400000);
    });
    let matched=0;
    for(let i=0;i<due.length;i+=8){
      const batch=due.slice(i,i+8);
      const body={movies:batch.map(m=>({key:keyOf(m),title:m.title,year:m.release_year}))};
      const response=await fetch(SUPABASE_URL+'/functions/v1/resolve-movie-poster',{
        method:'POST',headers:{apikey:ANON_JWT,Authorization:'Bearer '+ANON_JWT,'Content-Type':'application/json'},
        body:JSON.stringify(body),signal:timeout(100000)
      });
      if(!response.ok)throw Error('Existing poster resolver returned '+response.status);
      const resolved=await response.json();
      if(!Array.isArray(resolved?.results))throw Error('Existing poster resolver returned invalid results');
      const byResolved=new Map(resolved.results.map((r:any)=>[String(r?.key),r]));
      const rows=batch.map(movie=>{
        const r:any=byResolved.get(keyOf(movie));
        const poster=r?.verified===true&&Number(r?.matched_year)===movie.release_year?approved(r.poster_url):null;
        if(poster)matched++;
        return {title:movie.title,release_year:movie.release_year,poster_url:poster,
          poster_source:poster&&r?.poster_source==='tmdb'?'tmdb':null,
          match_score:Number.isInteger(r?.match_score)?Math.min(100,Math.max(0,r.match_score)):null,checked_at:now()};
      });
      await service('bingo_poster_cache?on_conflict=title,release_year',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(rows)});
    }
    await updateControl(null);
    console.log('Bingo poster refresh: '+candidates.length+' public titles; '+due.length+' checked; '+matched+' new matches.');
  }catch(error){
    const message=error instanceof Error?error.message:String(error);
    console.error('Bingo poster refresh failed:',message);
    try{await updateControl(message)}catch(e){console.error('Could not record Bingo poster refresh error',e)}
  }
}
Deno.serve(async req=>{
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
  if(req.method!=='GET')return new Response(JSON.stringify({error:'GET only'}),{status:405,headers:jsonHeaders});
  if(!SUPABASE_URL||!SERVICE_KEY||!ANON_JWT)return new Response(JSON.stringify({error:'Poster cache not configured'}),{status:503,headers:jsonHeaders});
  try{
    const rows=await cached();
    // Atomic 15-minute claim prevents anonymous traffic from repeatedly triggering TMDB.
    if(await claim())EdgeRuntime.waitUntil(refresh());
    const movies=rows.filter((r:any)=>approved(r.poster_url)).map((r:any)=>({
      title:r.title,release_year:r.release_year,poster_url:approved(r.poster_url),
      poster_source:r.poster_source,match_score:r.match_score
    }));
    return new Response(JSON.stringify({version:1,movies}),{status:200,headers:jsonHeaders});
  }catch(error){
    console.error('Public Bingo poster cache unavailable',error);
    return new Response(JSON.stringify({error:'Poster feed temporarily unavailable'}),{status:503,headers:{...jsonHeaders,'Cache-Control':'no-store'}});
  }
});
