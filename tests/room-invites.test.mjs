import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRoomCode,parseRoomInvite,roomInviteUrl} from '../src/engine/roomInvites.mjs';

test('direct room invitations open the same room without exposing a session token',()=>{
 const link=roomInviteUrl('https://example.org/Romantiverse-Bingo-App/?token=private#invite=old','ab23cd4');
 assert.equal(link,'https://example.org/Romantiverse-Bingo-App/?room=AB23CD4');
 assert.equal(parseRoomInvite(new URL(link).search),'AB23CD4');
 assert.equal(link.includes('private'),false);
 assert.equal(link.includes('invite=old'),false);
});
test('room code links accept lowercase but reject malformed, repeated or missing codes',()=>{
 assert.equal(normalizeRoomCode(' ab23cd4 '),'AB23CD4');
 for(const input of ['','abc','ABCDEFGH','ABC DEF','ABC%123','ABC/123','ABC1000','ABC0111',null,42]){
  assert.equal(normalizeRoomCode(input),null);
 }
 for(const search of ['','?room=ABC','?room=ABC23455','?room=ABC2345&room=XYZ1234','?room=ABC%20123','?room=ABC1000','?room=ABC0111']){
  assert.equal(parseRoomInvite(search),null);
 }
 assert.equal(parseRoomInvite('?room=abc2345'),'ABC2345');
});
test('invite URL builder rejects invalid codes and unsafe schemes',()=>{
 assert.throws(()=>roomInviteUrl('https://example.org/app/','invalid-room'));
 assert.throws(()=>roomInviteUrl('javascript:alert(1)','ABC2345'));
});
