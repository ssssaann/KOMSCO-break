// Public exterior-inspired miniature; coordinates are game units, not survey data.
export const CAMPUS = {
  name: '대전 본사 캠퍼스',
  address: '대전광역시 유성구 과학로 80-67',
  buildings: [
    { name: '본관', x: -8, z: -7, width: 22, depth: 6, floors: 6, color: '#e6e5d9', roof: '#bcc9be', sign: 'KOMSCO' },
    { name: '본관 서관', x: -18, z: -1, width: 5, depth: 8, floors: 6, color: '#e5e2d3', roof: '#bcc9be' },
    { name: '본관 동관', x: 2, z: -1, width: 5, depth: 8, floors: 6, color: '#e5e2d3', roof: '#bcc9be' },
    { name: '기술연구원', x: 18, z: -14, width: 12, depth: 7, floors: 5, color: '#d9dfd7', roof: '#91a89b' },
    { name: '별관', x: 20, z: 0, width: 10, depth: 6, floors: 4, color: '#e4dfcf', roof: '#c1c9ae' },
    { name: '화폐박물관', x: -18, z: 16, width: 13, depth: 7, floors: 3, color: '#e8d9bd', roof: '#a87d61' },
    { name: '직원식당', x: 17, z: 17, width: 10, depth: 7, floors: 3, color: '#e2dbc9', roof: '#a7b8a1' },
  ],
};

export const WEAPONS = [
  { id: 'bomb', name: '폭탄', radius: 5.5, terrain: 2, color: '#ef8750', hint: '가까운 블록을 한 번에 펑!', delay: 0 },
  { id: 'bat', name: '방망이', radius: 2.8, terrain: 1, color: '#ca9b67', hint: '작은 범위를 정확하게, 홈런!', delay: 0 },
  { id: 'laser', name: '레이저', radius: 1.7, terrain: 3, color: '#ed655d', hint: '하늘에서 바닥까지 관통하는 한 줄기', delay: 0 },
  { id: 'meteor', name: '운석', radius: 9, terrain: 4, color: '#f59d4b', hint: '우주에서 날아오는 묵직한 한 방', delay: .7 },
  { id: 'quake', name: '지진', radius: 13, terrain: 2, color: '#a19c62', hint: '지반부터 흔들어 연쇄 붕괴!', delay: .4 },
  { id: 'nuke', name: '핵폭탄', radius: 23, terrain: 6, color: '#e8b95a', hint: '커다란 버섯구름과 압도적인 충격파', delay: .8 },
];

export function createCampus() {
  const blocks = [];
  const add = (x,y,z,color,kind='building',building=-1) => blocks.push({id:blocks.length,x,y,z,color,kind,building});
  CAMPUS.buildings.forEach((b,bi) => {
    for(let x=0;x<b.width;x++) for(let z=0;z<b.depth;z++) for(let y=0;y<b.floors;y++) {
      const edge=x===0||x===b.width-1||z===0||z===b.depth-1;
      const roof=y===b.floors-1;
      const window=edge&&!roof&&y%2===1&&x%3!==0;
      add(b.x+x-b.width/2+.5,y*.9+.75,b.z+z-b.depth/2+.5,roof?b.roof:window?'#76999c':b.color,'building',bi);
    }
    // Shallow raised rooftop plant boxes / equipment are destructible too.
    for(let x=0;x<Math.floor(b.width/5);x++) add(b.x-b.width/3+x*3,b.floors*.9+.75,b.z,'#91a5a0','building',bi);
  });
  const trees = [
    [-29,-22],[-24,-24],[-17,-24],[-10,-24],[-3,-24],[5,-24],[12,-24],[22,-24],[29,-21],
    [-30,-15],[-30,-7],[-30,1],[-30,9],[-29,23],[-22,25],[-14,26],[-6,25],[3,25],[10,26],[24,25],[30,18],[30,9],[30,2],
    [-22,7],[-16,7],[-10,7],[-4,7],[4,8],[8,16],[7,-16],[-23,-15],
  ];
  trees.forEach(([x,z],i)=>{
    add(x,.8,z,'#9e8160','tree');add(x,1.7,z,'#9e8160','tree');
    const shade=['#7e9e68','#8ca776','#afbd8b','#76966c'][i%4];
    for(let y=0;y<3;y++) for(let dx=-1;dx<=1;dx++) for(let dz=-1;dz<=1;dz++){
      if(y===2&&(dx||dz))continue;
      add(x+dx*.85,2.6+y*.8,z+dz*.85,shade,'tree');
    }
  });
  const terrain=[];
  for(let x=-32;x<32;x+=2) for(let z=-28;z<28;z+=2) {
    const road=(z>9&&z<14)||(x>6&&x<12)||(z>-19&&z<-15);
    const parking=x>11&&z>3&&z<10;
    const courtyard=x>-20&&x<5&&z>-4&&z<6;
    const color=road?'#c7cbbf':parking?'#b5bfb3':courtyard?'#d5d9c9':(Math.floor(x+z)%4===0?'#b4c7a2':'#adc39b');
    terrain.push({id:terrain.length,x:x+1,z:z+1,color,road});
  }
  return {blocks,terrain};
}
