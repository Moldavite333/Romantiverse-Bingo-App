// Public read-only Supabase catalog; safe to use in a static client.
// The publishable key is configured via Vite env, never a service-role key.
const URL=(import.meta.env.VITE_SUPABASE_URL || 'https://yxpamyibhclilgdhgsjd.supabase.co');
const KEY=(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_VuLwAjFpSDCXpz7IfZtJjA_o5_-NzOa');
export const catalogConfigured=Boolean(URL&&KEY);
export async function searchCatalog(query='',{season,limit=30,signal}={}){
if(!catalogConfigured)return {items:[],source:'not-configured'};
const params=new URLSearchParams({select:'id,title,release_year,season,synopsis,poster_url,source_name,verification_status,is_demo',order:'title.asc',limit:String(Math.min(100,Math.max(1,limit)))});
if(query.trim())params.set('title','ilike.*'+query.trim().replace(/[*,().]/g,'')+'*');
if(season&&season!=='All')params.set('season','eq.'+season);
const res=await fetch(URL+'/rest/v1/movies?'+params,{headers:{apikey:KEY,Accept:'application/json'},signal});
if(!res.ok)throw Error('Movie catalog is unavailable ('+res.status+').');
return {items:await res.json(),source:'supabase'};
}
export async function loadCuratedTropes({signal}={}){
if(!catalogConfigured)return [];
const res=await fetch(URL+'/rest/v1/tropes?select=id,label,category,season,definition,observable_trigger,ambiguity_risk&enabled=eq.true&order=id.asc',{headers:{apikey:KEY,Accept:'application/json'},signal});
if(!res.ok)throw Error('Trope catalog unavailable');
return res.json();
}

export async function analyzeOnServer(movie,{signal}={}){
if(!catalogConfigured)throw Error('Analysis service not configured');
const res=await fetch(URL+'/functions/v1/analyze-movie',{method:'POST',headers:{'Content-Type':'application/json',apikey:KEY},body:JSON.stringify({title:movie.title,season:movie.season,synopsis:movie.synopsis||''}),signal});
if(!res.ok)throw Error('Movie analysis unavailable ('+res.status+').');
return res.json();
}

export async function supabaseRpc(name,payload){
 if(!catalogConfigured)throw Error('Leaderboard service unavailable');
 if(!['cheese_tray_top','cheese_tray_submit'].includes(name))throw Error('Unsupported action');
 const response=await fetch(URL+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify(payload)});
 const data=await response.json();
 if(!response.ok)throw Error(data?.message||'Leaderboard request failed');
 return data;
}
