import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const workflow=readFileSync(".github/workflows/garden-browser.yml","utf8");
const packer=readFileSync("scripts/pack-house-map.py","utf8");

test("house overview renders are recomputed and compared to tracked assets without an automated git push",()=>{
 const render=workflow.indexOf("      - name: Render and validate updated 3D house geometry");
 const check=workflow.indexOf("      - name: Reject unsynchronized committed house map renders and interaction metadata");
 const app=workflow.indexOf("      - name: Test app and house navigation");
 assert.ok(render>=0&&check>render&&app>check,"source render and exact-commit verification precede app test");
 const section=workflow.slice(render,app);
 assert.match(section,/node _xuong-3d\/run\.cjs map\.js out_house bando/);
 assert.match(section,/python3 scripts\/pack-house-map\.py/);
 assert.match(section,/git diff --exit-code -- assets\/3d\/ban_do_sang\.webp assets\/3d\/ban_do_ngay\.webp assets\/3d\/ban_do_chieu\.webp assets\/3d\/ban_do_dem\.webp assets\/3d\/scene\.json/);
 assert.match(section,/git ls-files --others --exclude-standard assets\/3d\//);
 assert.doesNotMatch(workflow,/git push origin HEAD:feature\/spacious-house-weather-botany/);
 assert.doesNotMatch(workflow,/Commit validated house renders to PR branch/);
});
test("source packer writes only map output files and preserves all six room metadata structures",()=>{
 assert.match(packer,/for time in \("sang", "ngay", "chieu", "dem"\)/);
 assert.match(packer,/scene\["map"\] = meta/);
 assert.doesNotMatch(packer,/scene\["rooms"\]\s*=/);
 assert.doesNotMatch(packer,/scene\["room"\]\s*=/);
 for(const light of ["sang","ngay","chieu","dem"])
  assert.ok(packer.includes('"WEBP"')&&packer.includes('ban_do_{time}.webp'),"map uses deterministic WebP backgrounds");
});
