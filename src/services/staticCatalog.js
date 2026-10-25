// Static-first catalog: no login, Supabase, API subscription, or runtime billing.
const BASE=import.meta.env.BASE_URL||'/';
export async function loadStaticCatalog({signal}={}){
 const res=await fetch(BASE+'catalog/movies.json',{signal,cache:'no-cache'});
 if(!res.ok)throw Error('Catalog file unavailable ('+res.status+')');
 const body=await res.json();
 if(body?.version!==1||!Array.isArray(body.movies))throw Error('Unsupported catalog format');
 const items=body.movies.filter(m=>typeof m.title==='string'&&m.title.trim()&&['Christmas','Fall','Horror','Unspecified'].includes(m.season)).map(m=>({...m,is_demo:false}));
 return {items,source:'bundled-static',updatedAt:body.updated_at};
}
