import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CAMPUS,createCampus} from '../src/campus.js';
import {SEASONS,blockColor,terrainColor} from '../src/seasons.js';
import {Game} from '../src/game.js';

test('reference landmarks have their defining destructible architectural features',()=>{
  const {blocks}=createCampus();
  const required={narae:['solar-panel','canopy','entrance-column'],research:['roof-vent'],bridge:['glass-mullion'],kiwum:['vertical-fin','pilotis','glass-roof-tower'],museum:['museum-eaves','hipped-roof','coin-relief','round-window','skylight']};
  for(const [style,details] of Object.entries(required)){
    const building=CAMPUS.buildings.findIndex(b=>b.style===style);
    for(const detail of details)assert.ok(blocks.some(b=>b.building===building&&b.detail===detail),`${style}: ${detail}`);
  }
  const narae=CAMPUS.buildings.find(b=>b.style==='narae'),research=CAMPUS.buildings.find(b=>b.style==='research'),museum=CAMPUS.buildings.find(b=>b.style==='museum'),kiwum=CAMPUS.buildings.find(b=>b.style==='kiwum');
  assert.ok(research.z<narae.z&&museum.x>narae.x&&kiwum.z>narae.z);
});

test('all detailed blocks have stable IDs, finite dimensions, supported geometry and valid anchors',()=>{
  const {blocks}=createCampus();
  const shapes=new Set(['box','sphere','cone','cylinder','torus']);
  blocks.forEach((b,i)=>{
    assert.equal(b.id,i);assert.ok([b.x,b.y,b.z,b.sx,b.sy,b.sz].every(Number.isFinite));
    assert.ok(b.sx>0&&b.sy>0&&b.sz>0);assert.ok(shapes.has(b.shape||'box'));
    if(b.support!==undefined)assert.ok(b.support>=0&&b.support<b.id);
  });
  assert.deepEqual(createCampus().blocks,blocks);
});

test('season palettes change blossoms and lawns without recoloring architecture or excavation',()=>{
  const {blocks,terrain}=createCampus();
  const blossom=blocks.find(b=>b.foliage==='blossom'),trunk=blocks.find(b=>b.detail==='trunk'),building=blocks.find(b=>b.kind==='building'),grass=terrain.find(t=>t.surface==='grass');
  assert.deepEqual(Object.keys(SEASONS),['spring','autumn']);
  assert.notEqual(blockColor(blossom,'spring'),blockColor(blossom,'autumn'));
  assert.equal(blockColor(trunk,'spring'),blockColor(trunk,'autumn'));
  assert.equal(blockColor(building,'spring'),blockColor(building,'autumn'));
  assert.notEqual(terrainColor(grass,0,'spring'),terrainColor(grass,0,'autumn'));
  for(const depth of [1,6,12])assert.equal(terrainColor(grass,depth,'spring'),terrainColor(grass,depth,'autumn'));
});

test('canopies, coins, roof equipment and crowns collapse when their anchors are destroyed and undo restores them',()=>{
  const campus=createCampus();
  for(const detail of ['canopy','coin-relief','rooftop-equipment','trunk']){
    const game=new Game(campus),feature=campus.blocks.find(b=>b.detail===detail),anchor=campus.blocks[feature.support??feature.id];
    game.attack('laser',anchor);assert.equal(game.destroyed[feature.id],1,detail);
    game.undo();assert.equal(game.destroyed[feature.id],0,detail);
  }
});
