import { WEAPONS } from './campus.js';

export class Game {
  constructor(campus) {
    this.blocks=campus.blocks;
    this.terrain=campus.terrain;
    this.destroyed=new Uint8Array(this.blocks.length);
    this.depths=new Uint8Array(this.terrain.length);
    this.score=0;
    this.history=[];
    this.columns=new Map();
    for(const b of this.blocks){
      const key=`${b.x}:${b.z}:${b.building}`;
      if(!this.columns.has(key))this.columns.set(key,[]);
      this.columns.get(key).push(b.id);
    }
    for(const ids of this.columns.values())ids.sort((a,b)=>this.blocks[a].y-this.blocks[b].y);
  }
  snapshot(){return {destroyed:this.destroyed.slice(),depths:this.depths.slice(),score:this.score};}
  remember(){this.history.push(this.snapshot());if(this.history.length>30)this.history.shift();}
  attack(id,point){
    const weapon=WEAPONS.find(w=>w.id===id);
    if(!weapon||![point.x,point.y,point.z].every(Number.isFinite))throw new Error('Invalid attack');
    const removed=[];const changed=[];
    for(const b of this.blocks){
      if(this.destroyed[b.id])continue;
      const dx=b.x-point.x,dz=b.z-point.z,dy=(b.y-point.y)*.8;
      const distance=(id==='laser'||id==='quake')?Math.hypot(dx,dz):Math.hypot(dx,dy,dz);
      if(distance<=weapon.radius)removed.push(b.id);
    }
    if(weapon.terrain) for(const t of this.terrain){
      if(Math.hypot(t.x-point.x,t.z-point.z)<weapon.radius*.8&&this.depths[t.id]<weapon.terrain)changed.push(t.id);
    }
    if(!removed.length&&!changed.length)return {removed:[],changed:[],points:0,bonus:false};
    this.remember();
    const justDestroyed=new Set(removed);
    // Every vertical column loses its unsupported blocks after its lower support is removed.
    for(const ids of this.columns.values()){
      let unsupported=false;
      for(const i of ids){
        if(justDestroyed.has(i)){unsupported=true;continue;}
        if(unsupported&&!this.destroyed[i])justDestroyed.add(i);
      }
    }
    let base=0;
    for(const i of justDestroyed){this.destroyed[i]=1;base+=this.blocks[i].kind==='building'?10:3;}
    for(const i of changed){base+=(weapon.terrain-this.depths[i])*5;this.depths[i]=weapon.terrain;}
    const bonus=justDestroyed.size>=40;
    const points=Math.round(base*(bonus?1.25:1));
    this.score+=points;
    return {removed:[...justDestroyed],changed,points,bonus};
  }
  undo(){const previous=this.history.pop();if(!previous)return false;this.destroyed=previous.destroyed;this.depths=previous.depths;this.score=previous.score;return true;}
  reset(){if(!this.score)return false;this.remember();this.destroyed.fill(0);this.depths.fill(0);this.score=0;return true;}
  get destroyedCount(){return this.destroyed.reduce((sum,n)=>sum+n,0);}
  get damage(){const total=this.blocks.length+this.terrain.length*2;return (this.destroyedCount+this.depths.reduce((a,b)=>a+b,0))/total*100;}
}
