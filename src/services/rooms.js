import {catalogConfigured} from './catalog.js';
const URL=import.meta.env.VITE_SUPABASE_URL||'https://yxpamyibhclilgdhgsjd.supabase.co';
export async function roomRequest(payload){
if(!catalogConfigured)throw Error('Game service unavailable');
const res=await fetch(URL+'/functions/v1/game-room',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
let data;try{data=await res.json()}catch{throw Error('Could not read the room response')}
if(!res.ok)throw Error(data.error||'Room request failed');
return data;
}
