import {supabaseRpc} from './catalog.js';
export async function loadCheeseTray(period='week'){return supabaseRpc('cheese_tray_top',{p_period:period,p_limit:10})}
export async function submitCheeseTray({playerId,nickname,movie,marked,free}){return supabaseRpc('cheese_tray_submit',{p_device:playerId,p_nickname:nickname,p_movie_key:String(movie.id||movie.title),p_movie_title:movie.title,p_marked:marked,p_free:free})}
