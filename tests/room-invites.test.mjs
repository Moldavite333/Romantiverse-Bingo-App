import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRoomCode,parseRoomInvite,roomInviteUrl} from '../src/engine/roomInvites.mjs';

test('direct room invitations open the same room without exposing a session token',()=>{
 const link=roomInviteUrl('https://example.org/Romantiverse-Bingo-App/?token=private#invite=old','ab12cd3');
 assert.equal(link,'https://example.org/Romantiverse-Bingo-App/?room=AB12CD3');
 assert.equal(parseRoomInvite(new URL(link).search),'AB12CD3');
 assert.equal(link.includes('private'),false);
 assert.equal(link.includes('invite=old'),false);
});
test('room code links accept lowercase but reject malformed, repeated or missing codes',()=>{
 assert.equal(normalizeRoomCode(' ab12cd3 '),'AB12CD3');
 for(const input of ['','abc','ABCDEFGH','ABC DEF','ABC%123','ABC/123',null,42]){
  assert.equal(normalizeRoomCode(input),null);
 }
 for(const search of ['','?room=ABC','?room=ABC12345','?room=ABC1234&room=XYZ1234','?room=ABC%20123']){
  assert.equal(parseRoomInvite(search),null);
 }
 assert.equal(parseRoomInvite('?room=abc1234'),'ABC1234');
});
test('invite URL builder rejects invalid codes and unsafe schemes',()=>{
 assert.throws(()=>roomInviteUrl('https://example.org/app/','invalid-room'));
 assert.throws(()=>roomInviteUrl('javascript:alert(1)','ABC1234'));
});
