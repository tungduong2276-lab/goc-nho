import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {WORLD_FEATURES,featureOf,featureFromHash,worldUrl,validWorldMessage} from '../../src/world-features.mjs';
test('every former top-level feature has a world destination, without needing the old navigation',()=>{
 const html=readFileSync('index.html','utf8'),nav=html.slice(html.indexOf('const NAVG='),html.indexOf('const TABNAME='));
 const tabs=[...nav.matchAll(/tabs:\[([^\]]+)\]/g)].flatMap(m=>JSON.parse('['+m[1]+']')).filter(t=>t!=='nha');
 for(const tab of tabs)assert.ok(featureOf(tab),tab);
 for(const id of ['gifts','pet','dates','badges','settings'])assert.ok(featureOf(id),id);
 assert.equal(new Set(WORLD_FEATURES.map(f=>f.id)).size,WORLD_FEATURES.length);
 for(const f of WORLD_FEATURES)if(f.id!=='settings')assert.ok(['san','nha'].includes(f.scene)&&f.object&&f.place);
});
test('only known deep links are accepted; the house link opens the world, not the old overview',()=>{
 assert.equal(featureFromHash('#nha'),null);assert.equal(featureFromHash('#cac-mua').id,'khu-vuon');
 for(const bad of ['__proto__','constructor','<script>','../settings','https://evil.example'])assert.equal(featureOf(bad),null);
 assert.equal(featureFromHash('#thu').id,'thu');
});
test('the hosted world stays local until the authenticated parent has resolved the couple and avatar',()=>{
 const local=worldUrl('https://example.test/goc-nho/index.html#thu',{who:'em',cloud:false});
 assert.equal(local.pathname,'/goc-nho/nha3d/index.html');assert.equal(local.searchParams.get('me'),'em');assert.equal(local.searchParams.get('cloud'),'0');assert.equal(local.hash,'');
 const online=worldUrl('https://example.test/goc-nho/',{who:'anh',cloud:true});assert.equal(online.searchParams.get('cloud'),'1');
 assert.equal(worldUrl('https://example.test/',{who:'forged'}).searchParams.has('me'),false);
});
test('messages from another frame or origin cannot open account or data entry tools',()=>{
 const frame={},origin='https://example.test';
 assert.ok(validWorldMessage({source:frame,origin,data:{type:'gocnho:open',id:'settings'}},frame,origin));
 assert.ok(!validWorldMessage({source:{},origin,data:{type:'gocnho:open'}},frame,origin));
 assert.ok(!validWorldMessage({source:frame,origin:'https://evil.test',data:{}},frame,origin));
 assert.ok(!validWorldMessage({source:frame,origin,data:null},frame,origin));
});
