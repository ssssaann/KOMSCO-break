// Relative positions and silhouettes follow the seven supplied reference images.
// Dimensions are compressed game units, not survey coordinates.
export const CAMPUS={
  name:'대전 본사 캠퍼스',address:'대전광역시 유성구 과학로 80-67',
  buildings:[
    {name:'나래관',style:'narae',x:-5,z:0,width:24,depth:7.5,floors:3,layers:16,color:'#e4dfd0',roof:'#9eb5a1',sign:'KOMSCO'},
    {name:'기술연구원',style:'research',x:-5,z:-14,width:24,depth:6,floors:3,layers:15,color:'#d8d7c7',roof:'#82a58a'},
    {name:'유리 연결통로',style:'bridge',x:-5,z:-7,width:3,depth:7.5,floors:2,layers:8,color:'#679caa',roof:'#a5c6c8',hideLabel:true},
    {name:'화폐박물관',style:'museum',x:21,z:-1,width:12,depth:10.5,floors:2,layers:12,color:'#d5cbb4',roof:'#668675'},
    {name:'키움관',style:'kiwum',x:-18,z:18,width:12,depth:10.5,floors:4,layers:19,color:'#e3e1d7',roof:'#acb9b0'},
    {name:'서측 부속동',style:'annex',x:-26,z:1,width:6,depth:7.5,floors:2,layers:9,color:'#dcdccc',roof:'#7f9d80'},
    {name:'북측 체육시설',style:'gym',x:17,z:-23,width:12,depth:6,floors:1,layers:8,color:'#d4d4c3',roof:'#6c9280'},
  ],
};
export const WEAPONS=[
  {id:'bomb',name:'폭탄',radius:5.5,terrain:2,color:'#ef8750',hint:'가까운 블록을 한 번에 펑!',delay:0},
  {id:'bat',name:'방망이',radius:2.8,terrain:1,color:'#ca9b67',hint:'작은 범위를 정확하게, 홈런!',delay:0},
  {id:'laser',name:'레이저',radius:1.7,terrain:3,color:'#ed655d',hint:'하늘에서 바닥까지 관통하는 한 줄기',delay:0},
  {id:'meteor',name:'운석',radius:9,terrain:4,color:'#f59d4b',hint:'우주에서 날아오는 묵직한 한 방',delay:.7},
  {id:'quake',name:'지진',radius:13,terrain:2,color:'#a19c62',hint:'지반부터 흔들어 연쇄 붕괴!',delay:.4},
  {id:'nuke',name:'핵폭탄',radius:23,terrain:6,color:'#e8b95a',hint:'커다란 버섯구름과 압도적인 충격파',delay:.8},
];
export function createCampus(){
  const blocks=[];
  const add=(x,y,z,color,options={})=>{const b={id:blocks.length,x,y,z,color,kind:'building',building:-1,sx:.745,sy:.395,sz:.745,...options};blocks.push(b);return b.id;};
  CAMPUS.buildings.forEach((b,bi)=>{
    const nx=Math.round(b.width/.75),nz=Math.round(b.depth/.75),structural=[],height=.475+b.layers*.4;
    for(let ix=0;ix<nx;ix++)for(let iz=0;iz<nz;iz++)for(let iy=0;iy<b.layers;iy++){
      const edge=ix===0||ix===nx-1||iz===0||iz===nz-1,floor=iy===0||iy===b.layers-1||iy%5===0;
      if(!edge&&!floor&&!(ix%6===0&&iz%5===0))continue;
      let hex=b.color;
      const front=iz===nz-1,stripe=(front||iz===0)?ix%2===1:iz%2===1;
      if(b.style==='bridge')hex=edge?'#7aaaba':'#9dbfc2';
      else if(b.style==='museum')hex=edge&&iy>7&&stripe?'#455d5b':b.color;
      else if(edge&&stripe&&iy>1&&iy<b.layers-2)hex=iy%5===0?'#536772':b.style==='kiwum'?'#457e9e':'#2b4b5c';
      if(iy===b.layers-1)hex=b.roof;
      const x=b.x+(ix+.5)*.75-b.width/2,z=b.z+(iz+.5)*.75-b.depth/2;
      structural.push(add(x,.475+iy*.4,z,hex,{building:bi,detail:edge&&stripe?'window':'structure'}));
    }
    const feature=(x,y,z,sx,sy,sz,hex,options={})=>{
      let support=structural[0],nearest=Infinity;
      for(const id of structural){const s=blocks[id],d=(s.x-x)**2+(s.y-y)**2+(s.z-z)**2;if(d<nearest){nearest=d;support=id;}}
      return add(x,y,z,hex,{building:bi,sx,sy,sz,support,detail:'facade',...options});
    };
    const front=b.z+b.depth/2;
    if(['narae','research','kiwum'].includes(b.style)){
      for(let x=-b.width/2+.375;x<b.width/2;x+=.75){feature(b.x+x,height,b.z-b.depth/2,.74,.36,.2,b.color);feature(b.x+x,height,front,.74,.36,.2,b.color);}
      for(const x of [-b.width/2,b.width/2])for(let z=-b.depth/2+.375;z<b.depth/2;z+=.75)feature(b.x+x,height,b.z+z,.2,.36,.74,b.color);
      for(let x=-1.5;x<=1.5;x+=.75){feature(b.x+x,1.1,front+.04,.70,1.5,.16,'#284655',{detail:'entrance'});feature(b.x+x,2.1,front+.85,.74,.18,1.8,'#8c9692',{detail:'canopy'});}
      for(const x of [-2,2])feature(b.x+x,1.2,front+1.2,.2,1.8,.2,b.color,{detail:'entrance-column'});
      for(let step=0;step<3;step++)for(let x=-2.25;x<=2.25;x+=.75)feature(b.x+x,.38+step*.12,front+2.1-step*.45,.74,.2,.5,'#c9c9ba',{detail:'stairs'});
      for(const dx of [-b.width*.26,b.width*.22]){
        feature(b.x+dx,height+.48,b.z,2.1,.8,1.7,'#d4d8cc',{detail:'rooftop-equipment'});
        for(let j=-1;j<=1;j++)feature(b.x+dx+j*.55,height+.94,b.z,.43,.12,1.3,'#8b9d98');
      }
      if(b.style==='narae')for(const dz of [-1.7,1.3])for(let dx=-9;dx<=9;dx+=.75)feature(b.x+dx,height+.28,b.z+dz,.71,.12,1.35,'#355c6d',{rx:-.12,detail:'solar-panel'});
      if(b.style==='research')for(let dx=-8;dx<=8;dx+=4)feature(b.x+dx,height+.6,b.z,1.2,.8,1.2,'#d1d5c5',{shape:'cylinder',detail:'roof-vent'});
      if(b.style==='kiwum'){
        for(let dx=-5.6;dx<4.8;dx+=.75){feature(b.x+dx,1.1,front+.6,.7,1.4,.15,'#39718b',{detail:'ground-glazing'});feature(b.x+dx,2.25,front+.8,.74,.2,1.5,'#dcded2');feature(b.x+dx,6.2,front+.8,.74,.2,1.5,'#dcded2');}
        for(let dx=-5.7;dx<4.5;dx+=1.05){feature(b.x+dx,4.2,front+1.35,.15,3.8,.65,'#e8e7dc',{detail:'vertical-fin'});feature(b.x+dx,.95,front+1.35,.17,1.35,.17,'#d8dcce',{detail:'pilotis'});}
        feature(b.x+1.5,height+.8,b.z,1.7,1.5,1.7,'#83a8b5',{detail:'glass-roof-tower'});
      }
    }
    if(b.style==='bridge')for(let z=-3.5;z<=3.5;z+=.75)feature(b.x,height+.12,b.z+z,2.95,.16,.08,'#d0ddd5',{detail:'glass-mullion'});
    if(b.style==='museum'){
      for(let tier=0;tier<4;tier++){
        const width=b.width+1.6-tier*1.15,depth=b.depth+1.6-tier*1.15;
        for(let x=-width/2+.375;x<width/2;x+=.75)for(let z=-depth/2+.375;z<depth/2;z+=.75){
          if(tier>0&&Math.abs(x)<width/2-.9&&Math.abs(z)<depth/2-.9)continue;
          feature(b.x+x,height+tier*.24,b.z+z,.74,.24,.74,tier===0?'#e1ddcd':b.roof,{detail:tier===0?'museum-eaves':'hipped-roof'});
        }
      }
      feature(b.x,height+.95,b.z,2,.6,1.7,'#98b5b9',{detail:'skylight'});
      for(let dx=-1.1;dx<=1.1;dx+=.55)feature(b.x+dx,1.4,front+.05,.5,2,.17,'#263d42',{detail:'museum-door'});
      for(let dx=-4.3;dx<=4.3;dx+=1.25){if(Math.abs(dx)<1.9)continue;feature(b.x+dx,1.9,front+.08,.65,.1,.65,'#7d8276',{shape:'cylinder',rx:Math.PI/2,detail:'round-window-rim'});feature(b.x+dx,1.9,front+.15,.46,.12,.46,'#263d42',{shape:'cylinder',rx:Math.PI/2,detail:'round-window'});}
      for(const [dx,dy,size] of [[-1.3,3.7,1.2],[0,3.2,1.4],[1.5,3.9,1.05]]){
        feature(b.x+dx,dy,front+.12,size,.16,size,'#b9b69b',{shape:'cylinder',rx:Math.PI/2,detail:'coin-relief'});
        feature(b.x+dx,dy,front+.24,size*.84,size*.84,.25,'#eee8cf',{shape:'torus',detail:'coin-ring'});
        feature(b.x+dx,dy,front+.26,size*.23,size*.23,.1,'#8b927d',{detail:'coin-centre'});
      }
      for(let step=0;step<5;step++)for(let dx=-2.5;dx<2.6;dx+=.75)feature(b.x+dx,.32+step*.1,front+2.3-step*.37,.74,.15,.45,'#c4c5b7',{detail:'museum-stairs'});
    }
  });
  let treeIndex=0;
  const tree=(x,z,type='deciduous',size=1)=>{
    const index=treeIndex++,trunk=add(x,1.12,z,'#8a7259',{kind:'tree',sx:.32,sy:1.65,sz:.32,treeIndex:index,detail:'trunk'});
    if(type==='evergreen')for(let j=0;j<3;j++)add(x,2+j*.7*size,z,'#49785b',{kind:'tree',shape:'cone',sx:(2.6-j*.55)*size,sy:1.9*size,sz:(2.6-j*.55)*size,foliage:type,treeIndex:index,support:trunk});
    else for(const [dx,dy,dz,s] of [[0,1.3,0,2.3],[-.65,.65,.3,1.8],[.65,.8,-.3,1.8],[.1,.6,.7,1.7]])add(x+dx*size,1.6+dy*size,z+dz*size,'#8da46d',{kind:'tree',shape:'sphere',sx:s*size,sy:s*.8*size,sz:s*size,foliage:type,treeIndex:index,support:trunk});
  };
  for(let x=-29;x<=28;x+=3)tree(x,25.7,'blossom',1.05);
  for(let z=19;z>=-16;z-=3.3)tree(29.5,z,'blossom',1);
  for(let x=-29;x<=27;x+=4.7)tree(x,-26,'deciduous',.9);
  for(let z=-22;z<=21;z+=4.5)tree(-30,z,'evergreen',.9);
  for(const [x,z] of [[-18,-7],[-13,-7],[2,-7],[8,-7],[-19,6],[-13,6],[3,6],[8,4],[13,14],[20,13],[24,18],[-8,17],[-6,22],[17,-13],[23,-13]])tree(x,z,'evergreen',.72);
  for(const [x,z] of [[-20,-20],[-12,-20],[1,-20],[7,-20],[16,7],[23,8],[-7,12],[5,19]])tree(x,z,'deciduous',.9);
  const terrain=[];
  for(let x=-32;x<32;x+=2)for(let z=-28;z<28;z+=2){
    const road=(z>=8&&z<=12)||(x>=10&&x<=12)||(x>=-24&&x<=-22)||(x>=-2&&x<=0&&z>=8)||(z>=-22&&z<=-20);
    const parking=x<-12&&x>-24&&z<-7&&z>-20,courtyard=x>-19&&x<8&&z>-4&&z<8,path=z>=24||x>=28;
    const water=(z>=26&&x>=0)||(x>=30&&z>=0);
    const color=water?'#7fa9ac':road?'#aeb7b1':parking?'#b8beb5':courtyard?'#d9d9cb':path?'#d5ccb9':'#9ab77e';
    terrain.push({id:terrain.length,x:x+1,z:z+1,color,road,surface:water?'water':road?'road':parking?'parking':courtyard?'paving':path?'path':'grass'});
  }
  return {blocks,terrain};
}
