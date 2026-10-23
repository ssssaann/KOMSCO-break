// Palette changes preserve geometry, block IDs and undo history.
export const SEASONS={
  spring:{name:'봄',caption:'벚꽃이 피는 대전 캠퍼스',sky:'#e8efe8',backdrop:'#e2ebdf',sunlight:'#fff5e7',grass:['#88b575','#9bc783'],foliage:['#f6dce5','#fff0f2','#eac3d7','#f5e5ed'],deciduous:['#80a75c','#9cb96b','#6d9c58'],evergreen:'#487c5d',hill:'#799a6e',particle:'#f4cede'},
  autumn:{name:'가을',caption:'단풍으로 물든 대전 캠퍼스',sky:'#f0eade',backdrop:'#e9e2cf',sunlight:'#ffddb0',grass:['#b4ae74','#c4ba83'],foliage:['#cb6b3d','#df943e','#b8583e','#e2b84e'],deciduous:['#b75f38','#d3a044','#ad733e'],evergreen:'#527857',hill:'#9c8a58',particle:'#cb8a45'},
};
export function blockColor(block,season){
  const p=SEASONS[season]||SEASONS.spring,i=block.treeIndex||0;
  if(block.foliage==='blossom')return p.foliage[i%p.foliage.length];
  if(block.foliage==='deciduous')return p.deciduous[i%p.deciduous.length];
  if(block.foliage==='evergreen')return p.evergreen;
  return block.color;
}
export function terrainColor(tile,depth,season){
  if(depth>=8)return '#77766b';if(depth>=4)return '#a48b68';if(depth)return '#b49a75';
  const p=SEASONS[season]||SEASONS.spring;return tile.surface==='grass'?p.grass[tile.id%2]:tile.color;
}
