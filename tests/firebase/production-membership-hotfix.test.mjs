import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc, deleteDoc, getDoc, deleteField } from 'firebase/firestore';

const address = process.env.FIRESTORE_EMULATOR_HOST || '';
if (!/^(127\.0\.0\.1|localhost):[0-9]+$/.test(address)) {
  throw new Error('Membership regression requires a loopback Firestore Emulator');
}
const [host, port] = address.split(':');
const A = 'fixture-alice', B = 'fixture-bob', E = 'fixture-outsider';
const path = 'couples/fixture-membership';
const observed = readFileSync('tests/firebase/fixtures/production-observed-20261114.rules', 'utf8');
const candidate = readFileSync('tests/firebase/fixtures/production-membership-hotfix.rules', 'utf8');

test('reviewed candidate matches repository policy and excludes the parent from nested access', () => {
  assert.equal(candidate, readFileSync('firestore.rules', 'utf8'));
  assert.match(candidate, /match \/\{collection\}\/\{document=\*\*\}/);
  assert.notEqual(candidate, observed);
});

for (const [label, rules, vulnerable] of [
  ['observed production (synthetic reproduction only)', observed, true],
  ['membership-compatible candidate', candidate, false],
  ['repository main policy', readFileSync('firestore.rules', 'utf8'), false],
]) {
  test(`${label}: parent membership boundary and legacy access`, async t => {
    const env = await initializeTestEnvironment({
      projectId: 'demo-goc-nho-safety', firestore: { host, port: Number(port), rules },
    });
    const client = uid => uid ? env.authenticatedContext(uid).firestore() : env.unauthenticatedContext().firestore();
    const ref = (uid, p = path) => doc(client(uid), p);
    async function seed(members = [A, B]) {
      await env.clearFirestore();
      await env.withSecurityRulesDisabled(async ctx => {
        const db = ctx.firestore();
        await setDoc(doc(db, path), { members, roles: { [A]: 0 }, code: 'FIXTURE-ONLY', title: 'keep' });
        await setDoc(doc(db, path + '/notes/n1/replies/r1'), { body: 'synthetic' });
      });
    }
    try {
      const attacks = [
        ['add third member', () => updateDoc(ref(A), { members: [A, B, E] })],
        ['replace partner with outsider', () => updateDoc(ref(A), { members: [A, E] })],
        ['remove partner and change code', () => updateDoc(ref(A), { members: [A], code: 'TAKEN' })],
        ['replace entire root document', () => setDoc(ref(A), { members: [A, B, E], code: 'TAKEN' })],
        ['delete root document', () => deleteDoc(ref(A))],
      ];
      for (const [name, attack] of attacks) {
        await t.test(name, async () => {
          await seed();
          await (vulnerable ? assertSucceeds(attack()) : assertFails(attack()));
          if (!vulnerable) {
            const unchanged = (await assertSucceeds(getDoc(ref(B)))).data();
            assert.deepEqual(unchanged.members, [A, B]);
            assert.equal(unchanged.code, 'FIXTURE-ONLY');
          }
        });
      }
      await t.test('metadata and deep nested CRUD remain available to members', async () => {
        await seed();
        await assertSucceeds(updateDoc(ref(A), { title: 'new' }));
        const nested = path + '/notes/n1/replies/r1';
        assert.equal((await assertSucceeds(getDoc(ref(B, nested)))).data().body, 'synthetic');
        await assertSucceeds(setDoc(ref(B, nested), { body: 'updated' }));
        await assertSucceeds(deleteDoc(ref(A, nested)));
        await assertFails(getDoc(ref(E)));
        await assertFails(updateDoc(ref(E), { title: 'hijack' }));
        await assertFails(getDoc(ref(null)));
      });
      await t.test('create house and second-partner join still work', async () => {
        await seed([A]);
        await assertSucceeds(updateDoc(ref(B), { members: [A, B] }));
        await assertFails(updateDoc(ref(E), { members: [A, B, E] }));
        await assertSucceeds(setDoc(ref(A, 'couples/fixture-new'), { members: [A], code: 'NEW', roles: {} }));
      });
      await t.test('app leave, remove-partner and role-repair writes remain available', async () => {
        await seed();
        await assertSucceeds(updateDoc(ref(B), { ['roles.' + B]: 1 }));
        await assertSucceeds(updateDoc(ref(B), { members: [A], ['roles.' + B]: deleteField() }));
        assert.deepEqual((await assertSucceeds(getDoc(ref(A)))).data().members, [A]);
        await seed();
        await assertSucceeds(updateDoc(ref(A), { members: [A], ['roles.' + B]: deleteField() }));
        await seed([A]);
        const codePath = 'codes/FIXTURE-ONLY';
        await env.withSecurityRulesDisabled(async ctx => {
          await setDoc(doc(ctx.firestore(), codePath), { cid: 'fixture-membership' });
        });
        await assertFails(deleteDoc(ref(E, codePath)));
        await (vulnerable ? assertFails(deleteDoc(ref(A, codePath))) : assertSucceeds(deleteDoc(ref(A, codePath))));
        await assertSucceeds(updateDoc(ref(A), { members: [], ['roles.' + A]: deleteField() }));
      });
    } finally {
      await env.cleanup();
    }
  });
}
