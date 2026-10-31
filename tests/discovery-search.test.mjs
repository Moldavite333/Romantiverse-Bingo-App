import test from 'node:test';
import assert from 'node:assert/strict';
import {readDiscoverySearch} from '../src/engine/discoverySearch.mjs';

test('homepage search links prefill the public movie catalog',()=>{
 assert.equal(readDiscoverySearch('?search=A+Christmas+Village'),'A Christmas Village');
 assert.equal(readDiscoverySearch('?search=Caf%C3%A9+No%C3%ABl+2024'),'Café Noël 2024');
 assert.equal(readDiscoverySearch('?search=  '),'');
});
test('room links and malformed or duplicate search parameters do not trigger discovery',()=>{
 assert.equal(readDiscoverySearch('?room=ABCDEF2'),'');
 assert.equal(readDiscoverySearch('?search=first&search=second'),'');
 assert.equal(readDiscoverySearch('?search=%00Hello%0AWorld'),'Hello World');
 assert.equal(readDiscoverySearch('?search='+encodeURIComponent('x'.repeat(180))).length,120);
});
