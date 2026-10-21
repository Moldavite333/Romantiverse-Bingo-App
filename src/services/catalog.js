// Public read-only Supabase catalog; safe to use in a static client.
// The publishable key is configured via Vite env, never a service-role key.
const URL=import.meta.env.VITE_SUPABASE_URL;
const KEY=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
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
