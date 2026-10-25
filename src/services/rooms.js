import {catalogConfigured} from './catalog.js';
import {postRoomAction} from './roomTransport.mjs';
const URL=import.meta.env.VITE_SUPABASE_URL||'https://yxpamyibhclilgdhgsjd.supabase.co';
export async function roomRequest(payload){
  if(!catalogConfigured)throw Error('Game service unavailable');
  return postRoomAction(URL+'/functions/v1/game-room',payload);
}
