import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ROOM_NAV,pointInPolygon,walkable,clearSegment,walkPath,walkDistance} from '../../src/living-world-nav.mjs';

test('all seven known spaces use explicit floor polygons and finite walk geometry',()=>{
  assert.equal(Object.keys(ROOM_NAV).length,7);
  for(const [room,def] of Object.entries(ROOM_NAV)) {
    assert.ok(def.floor.length>=3,room);
    for(const p of def.floor)assert.ok(p.every(Number.isFinite),room);
    assert.equal(walkable(room,[-10,0]),false);
    assert.equal(walkable(room,[585,1100]),false);
  }
});
test('open kitchen floor admits direct movement',()=>{
  const a=[420,715],b=[580,810];
  assert.equal(walkable('bep',a),true);
  assert.equal(walkable('bep',b),true);
  assert.deepEqual(walkPath('bep',a,b),[a,b]);
});
test('kitchen counter blocks straight-line walk and A* avoids the blocked area',()=>{
  const a=[744,580],b=[800,783];
  assert.equal(walkable('bep',a),true);
  assert.equal(walkable('bep',b),true);
  assert.equal(clearSegment('bep',a,b),false);
  const route=walkPath('bep',a,b);
  assert.ok(route?.length>2,JSON.stringify(route));
  assert.deepEqual(route[0],a);
  assert.deepEqual(route.at(-1),b);
  for(let i=1;i<route.length;i++)assert.equal(clearSegment('bep',route[i-1],route[i]),true);
  assert.ok(walkDistance(route)>Math.hypot(b[0]-a[0],b[1]-a[1]));
});
test('garden central planter is an obstacle, never a place to stand',()=>{
  assert.equal(walkable('khu-vuon',[585,600]),false);
  assert.equal(walkable('khu-vuon',[711,688]),true);
  const a=[711,688],b=[435,675];
  assert.equal(clearSegment('khu-vuon',a,b),false);
  const route=walkPath('khu-vuon',a,b);
  assert.ok(route?.length>2);
  for(let i=1;i<route.length;i++)assert.ok(clearSegment('khu-vuon',route[i-1],route[i]));
});
test('rejects tapping scenery, outside the stage, nan, or blocked spots',()=>{
  assert.equal(walkPath('bep',[585,598],[600,1100]),null);
  assert.equal(walkPath('bep',[585,598],[815,685]),null);
  assert.equal(walkPath('unknown',[585,598],[600,700]),null);
  assert.equal(pointInPolygon([NaN,25],ROOM_NAV.bep.floor),false);
  assert.equal(walkPath('bep',[Infinity,0],[500,650]),null);
});
test('unchanged travel target is valid and path distance never negative',()=>{
  const p=[585,598];
  assert.deepEqual(walkPath('bep',p,p),[p,p]);
  assert.equal(walkDistance(null),0);
  assert.equal(walkDistance([p,p]),0);
});
