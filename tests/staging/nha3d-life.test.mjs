import test from "node:test";
import assert from "node:assert/strict";
import { applyLife, sanitizeLife, FOOD, RECIPES } from "../../nha3d/life.mjs";
import { SPECIES, newPlant, water, status, HOUR } from "../../nha3d/garden.mjs";

test("nông sản thật và giỏ khởi đầu cùng dùng một bảng nguyên liệu",()=>{
  for(const key of Object.keys(FOOD).filter(k=>!["trung","trungvit","ca"].includes(k))) assert.ok(SPECIES[key],key);
  const s=sanitizeLife(null);
  assert.ok(s.stock.xalach>=2);
  assert.ok(s.stock.dau>=3);
  assert.ok(Object.keys(RECIPES).length>=5);
  for(const recipe of Object.values(RECIPES))for(const key of Object.keys(recipe.need))assert.ok(FOOD[key],key);
});

test("hai người hoàn thành món ăn chung, trừ nguyên liệu đúng một lần",()=>{
  let s=sanitizeLife(null), t=1000000000;
  const before=s.stock.xalach;
  let a=applyLife(s,{type:"prepareCook",recipe:"salad"},"anh",t);
  assert.equal(a.ok,true);
  const same=applyLife(a.next,{type:"finishCook"},"anh",t+1000);
  assert.equal(same.ok,false,"người chuẩn bị không nhận công thay người kia");
  const b=applyLife(a.next,{type:"finishCook"},"em",t+2000);
  assert.equal(b.ok,true);
  assert.equal(b.next.stock.xalach,before-2);
  assert.equal(b.next.meals[0].with,"em");
  assert.equal(b.next.pending,null);
  assert.equal(applyLife(b.next,{type:"finishCook"},"anh",t+3000).ok,false);
  assert.equal(applyLife(b.next,{type:"eat",index:0},"em",t+4000).next.meals.length,0);
});

test("gà, vịt, cá và thú cưng dùng đồ thật, có thời gian nghỉ",()=>{
  let s=sanitizeLife(null),t=1000000000;
  const hen=applyLife(s,{type:"feedHen"},"anh",t);assert.equal(hen.ok,true);
  assert.equal(hen.next.stock.trung,2);
  assert.equal(applyLife(hen.next,{type:"feedHen"},"em",t+1000).ok,false);
  const ca=applyLife(hen.next,{type:"catchFish"},"em",t);
  assert.equal(ca.ok,true);
  assert.equal(applyLife(ca.next,{type:"catchFish"},"anh",t+1000).ok,false);
  const po=applyLife(ca.next,{type:"stockFish"},"anh",t+2000);
  assert.equal(po.ok,true);assert.equal(po.next.fish.count,3);
  const pet=applyLife(po.next,{type:"feedPet"},"anh",t+3000);
  assert.equal(pet.ok,true);assert.ok(pet.next.pet.fedAt>0);
  assert.equal(applyLife(pet.next,{type:"adoptPet",pet:"other"},"em",t).ok,false);
});

test("kho không chấp nhận bơm số lượng/loài bất hợp lệ và chặn tài liệu hỏng",()=>{
  const s=sanitizeLife({v:1,stock:{xalach:1e9,ca:-3,admin:99},pet:{name:"X".repeat(100),kind:"evil"}});
  assert.equal(s.stock.xalach,999);assert.equal(s.stock.ca,0);assert.equal(s.pet.name.length,24);
  assert.equal(s.pet.kind,"meo");assert.equal("admin" in s.stock,false);
  for(const op of [{type:"harvest",sp:"bad",amount:2},{type:"harvest",sp:"xalach",amount:9999},{type:"god"}])
    assert.equal(applyLife(s,op,"anh").ok,false);
  assert.equal(applyLife(s,{type:"harvest",sp:"carot",amount:3},"em").next.stock.carot,3);
});

test("cây rau củ vẫn cần chăm đúng giờ và loài hoa cũ không trở thành thức ăn",()=>{
  const t=1000000000, plant=water(newPlant("carot","anh",t),"anh",t);
  assert.equal(status(plant,t+12*HOUR).ripe,false);
  assert.equal(status(plant,t+24*HOUR).ripe,true);
  assert.equal("tulip" in FOOD,false);
});
