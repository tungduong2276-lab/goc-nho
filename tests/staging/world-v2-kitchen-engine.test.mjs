import {test} from 'node:test';
import assert from 'node:assert/strict';
import {INGREDIENTS,DISHES,MODES,newKitchenSession,roundPlan,kitchenAction,totalScore} from '../../src/living-world-kitchen-engine.mjs';

function resolveRound(game) {
  const plan=roundPlan(game.rounds[game.round]);
  game=kitchenAction(game,{type:'handoff'});
  for(const step of plan.steps) {
    game=kitchenAction(game,{type:'heat',value:step.heat});
    game=kitchenAction(game,{type:'ingredient',value:step.ingredient});
  }
  return game;
}
test('has twelve distinct plausible recipes, modifiers, icons and bounded ingredient choices',()=>{
  assert.equal(DISHES.length,12);
  assert.equal(new Set(DISHES.map(d=>d.id)).size,12);
  assert.equal(MODES.length,4);
  const all=new Set(INGREDIENTS.map(i=>i.id));
  for(const dish of DISHES){
    assert.ok(dish.name.length>5&&dish.icon);
    assert.equal(dish.ingredients.length,3);
    assert.ok(dish.ingredients.every(id=>all.has(id)));
    assert.equal(new Set(dish.ingredients).size,3);
    assert.ok([1,2,3].includes(dish.heat));
  }
});
test('same seed reproduces the same pair of distinct dishes and shuffled decoys',()=>{
  assert.deepEqual(newKitchenSession(704),newKitchenSession(704));
  const games=new Set();
  for(let seed=1;seed<=40;seed++){
    const g=newKitchenSession(seed);
    assert.equal(g.rounds.length,2);
    assert.notEqual(g.rounds[0].dish,g.rounds[1].dish);
    for(const round of g.rounds){
      assert.equal(round.choices.length,7);
      assert.equal(new Set(round.choices).size,7);
      assert.ok(roundPlan(round).steps.every(s=>round.choices.includes(s.ingredient)));
    }
    games.add(JSON.stringify(g.rounds));
  }
  assert.ok(games.size>20,'replay must have meaningful variety');
});
test('both partners can succeed through communication, change heat and complete two rounds',()=>{
  const input=newKitchenSession(12345);
  let state=resolveRound(input);
  assert.equal(input.phase,'brief','pure reducer must not mutate initial state');
  assert.equal(state.phase,'result');
  assert.equal(state.prepared.success,true);
  assert.equal(state.prepared.score,100);
  state=kitchenAction(state,{type:'next'});
  assert.equal(state.round,1);
  assert.equal(state.phase,'brief');
  state=resolveRound(state);
  assert.equal(state.phase,'result');
  state=kitchenAction(state,{type:'finish'});
  assert.equal(state.phase,'done');
  assert.equal(state.results.length,2);
  assert.equal(totalScore(state),200);
});
test('wrong ingredient or wrong heat adds one controlled mistake; three errors end round safely',()=>{
  let g=newKitchenSession(883);
  const round=g.rounds[0],plan=roundPlan(round);
  g=kitchenAction(g,{type:'handoff'});
  const wrong=round.choices.find(id=>id!==plan.steps[0].ingredient);
  for(let i=0;i<3;i++)g=kitchenAction(g,{type:'ingredient',value:wrong});
  assert.equal(g.phase,'result');
  assert.equal(g.prepared.success,false);
  assert.equal(g.prepared.score,0);
  assert.equal(g.mistakes,3);
  assert.equal(g.results.length,1);
  g=kitchenAction(g,{type:'next'});
  assert.equal(g.phase,'brief');
  assert.equal(g.round,1);
  g=resolveRound(g);
  assert.equal(g.phase,'result');
  assert.equal(totalScore(g),100);
});
test('invalid and stale actions are ignored without advancing the session',()=>{
  let g=newKitchenSession(1);
  assert.equal(kitchenAction(g,{type:'ingredient',value:'trung'}),g);
  assert.equal(kitchenAction(g,{type:'next'}),g);
  g=kitchenAction(g,{type:'handoff'});
  assert.equal(kitchenAction(g,{type:'heat',value:8}),g);
  assert.equal(kitchenAction(g,{type:'heat',value:1.1}),g);
  assert.equal(kitchenAction(g,{type:'ingredient',value:'hacker'}),g);
  assert.equal(kitchenAction(g,{type:'finish'}),g);
  assert.equal(g.progress,0);
});
test('reverse, zigzag and shuffled rules change cooking order or heat, not just text',()=>{
  const sample={dish:'may-hong'};
  const normal=roundPlan({...sample,mode:'normal'}).steps;
  const reverse=roundPlan({...sample,mode:'reverse'}).steps;
  const shuffle=roundPlan({...sample,mode:'shuffle'}).steps;
  const zigzag=roundPlan({...sample,mode:'zigzag'}).steps;
  assert.deepEqual(reverse.map(s=>s.ingredient),normal.map(s=>s.ingredient).reverse());
  assert.notDeepEqual(shuffle.map(s=>s.ingredient),normal.map(s=>s.ingredient));
  assert.ok(new Set(zigzag.map(s=>s.heat)).size>=2);
  assert.equal(roundPlan({dish:'invalid',mode:'normal'}),null);
});
