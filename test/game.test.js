import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCampus, WEAPONS } from '../src/campus.js';
import { Game } from '../src/game.js';
import { MAX_TERRAIN_DEPTH, surfaceHeight, terrainLayers, TERRAIN_BOTTOM } from '../src/terrain.js';

test('each weapon destroys blocks, awards points and precisely restores the state on undo',()=>{
  for(const weapon of WEAPONS){
    const game=new Game(createCampus());const before=game.snapshot();
    const result=game.attack(weapon.id,{x:-8,y:1,z:-7});
    assert.ok(result.removed.length>0,weapon.id);assert.ok(game.score>0,weapon.id);
    assert.equal(new Set(result.removed).size,result.removed.length);
    assert.equal(game.history.length,1);assert.ok(game.undo());assert.deepEqual(game.snapshot(),before);
  }
});
test('a broken support collapses upper blocks outside the blast radius',()=>{
  const blocks=Array.from({length:12},(_,id)=>({id,x:0,y:id,z:0,kind:'building',building:0}));
  const game=new Game({blocks,terrain:[]});
  const result=game.attack('bat',{x:0,y:0,z:0});
  assert.equal(result.removed.length,12);assert.equal(game.score,120);
});
test('empty hits and repeated destruction never farm score or fill undo history',()=>{
  const game=new Game(createCampus());
  const empty=game.attack('bomb',{x:200,y:0,z:200});assert.equal(empty.points,0);assert.equal(game.history.length,0);
  game.attack('nuke',{x:0,y:1,z:0});
  for(let i=0;i<MAX_TERRAIN_DEPTH;i++)game.attack('nuke',{x:0,y:1,z:0});
  const score=game.score,history=game.history.length;
  const repeat=game.attack('nuke',{x:0,y:1,z:0});assert.equal(repeat.points,0);assert.equal(game.score,score);assert.equal(game.history.length,history);
});
test('terrain depth scores only new damage and remains reversible',()=>{
  const game=new Game({blocks:[],terrain:[{id:0,x:0,z:0}]});
  assert.equal(game.attack('bomb',{x:0,y:0,z:0}).points,10);
  assert.equal(game.attack('meteor',{x:0,y:0,z:0}).points,20);
  assert.equal(game.depths[0],6);assert.equal(game.damage,50);
  game.undo();assert.equal(game.depths[0],2);assert.equal(game.score,10);
});

test('repeat hits excavate deeper, capped at bedrock without duplicate points',()=>{
  const game=new Game({blocks:[],terrain:[{id:0,x:0,z:0}]});
  for(let i=0;i<8;i++)game.attack('laser',{x:0,y:surfaceHeight(game.depths[0]),z:0});
  assert.equal(game.depths[0],MAX_TERRAIN_DEPTH);assert.equal(game.score,MAX_TERRAIN_DEPTH*5);assert.equal(game.damage,100);
  assert.equal(game.history.length,4);game.undo();assert.equal(game.depths[0],9);assert.equal(game.score,45);
});

test('craters have a deeper centre and excavation undermines buildings',()=>{
  const game=new Game({blocks:[{id:0,x:0,y:.75,z:0,kind:'building',building:0}],terrain:[{id:0,x:0,z:0},{id:1,x:6.5,z:0},{id:2,x:10,z:0}]});
  game.attack('meteor',{x:0,y:-5,z:0});
  assert.ok(game.depths[0]>game.depths[1]);assert.equal(game.depths[2],0);
  assert.equal(game.destroyed[0],1,'removing foundation collapses buildings above the blast');
  game.undo();assert.equal(game.destroyed[0],0);assert.deepEqual([...game.depths],[0,0,0]);
});

test('strata continuously fill the column up to the excavated surface',()=>{
  for(let depth=0;depth<=MAX_TERRAIN_DEPTH;depth++){
    const layers=terrainLayers(depth).filter(layer=>layer.height>0);
    assert.ok(layers.every(layer=>layer.height>=0));
    assert.ok(Math.abs(layers[0].y+layers[0].height/2-(surfaceHeight(depth)-.18))<1e-8);
    assert.ok(Math.abs(layers.at(-1).y-layers.at(-1).height/2-TERRAIN_BOTTOM)<1e-8);
    for(let i=1;i<layers.length;i++)assert.ok(Math.abs(layers[i-1].y-layers[i-1].height/2-(layers[i].y+layers[i].height/2))<1e-8);
  }
});
test('full restoration is itself undoable, including score and terrain',()=>{
  const game=new Game(createCampus());game.attack('meteor',{x:-8,y:1,z:-7});const broken=game.snapshot();
  assert.ok(game.reset());assert.equal(game.score,0);assert.equal(game.destroyedCount,0);assert.equal(game.damage,0);
  game.undo();assert.deepEqual(game.snapshot(),broken);game.undo();assert.equal(game.score,0);
});
test('history is capped and invalid attacks cannot mutate state',()=>{
  const game=new Game(createCampus());
  for(let i=0;i<40;i++){game.attack('bomb',{x:-8,y:1,z:-7});game.reset();}
  assert.equal(game.history.length,30);const snapshot=game.snapshot();
  assert.throws(()=>game.attack('missing',{x:0,y:0,z:0}));assert.throws(()=>game.attack('bomb',{x:NaN,y:0,z:0}));assert.deepEqual(game.snapshot(),snapshot);
});
