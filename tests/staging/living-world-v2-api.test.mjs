import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const code=readFileSync(new URL('../../src/living-world-v2.js',import.meta.url),'utf8');

test('staging fridge heart toggle uses Firestore instance transaction, not a nonexistent nested firestore field',()=>{
  assert.match(code,/await DB\.runTransaction\(async function\(tx\)/);
  assert.doesNotMatch(code,/DB\.firestore\.runTransaction/);
  assert.match(code,/const snap=await tx\.get\(ref\)/);
  assert.match(code,/tx\.update\(ref,\{hearts:arr\}\)/);
});
test('preview remains opt-in and protects real production Firebase from V2 writes',()=>{
  assert.match(code,/params\.get\("world2"\) !== "1"/);
  assert.match(code,/window\.FIREBASE_CONFIG\.projectId === "goc-nho-staging-2026"/);
  assert.match(code,/function staging\(\)/);
});
test('kitchen fridge shortcut opens inline dialog without changing hash',()=>{
  assert.match(code,/const link=event\.target\.closest\?\.\('#v-bep a\[href="#tu-lanh"\]'\)/);
  assert.match(code,/event\.preventDefault\(\);openFridge\(\)/);
});
