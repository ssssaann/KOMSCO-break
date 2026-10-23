import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCampus, WEAPONS } from '../src/campus.js';
import { Game } from '../src/game.js';

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
  const score=game.score,history=game.history.length;
  const repeat=game.attack('nuke',{x:0,y:1,z:0});assert.equal(repeat.points,0);assert.equal(game.score,score);assert.equal(game.history.length,history);
});
test('terrain depth scores only new damage and remains reversible',()=>{
  const game=new Game({blocks:[],terrain:[{id:0,x:0,z:0}]});
  assert.equal(game.attack('bomb',{x:0,y:0,z:0}).points,5);
  assert.equal(game.attack('meteor',{x:0,y:0,z:0}).points,5);
  assert.equal(game.depths[0],2);assert.equal(game.damage,100);
  game.undo();assert.equal(game.depths[0],1);assert.equal(game.score,5);
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
