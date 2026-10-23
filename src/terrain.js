export const MAX_TERRAIN_DEPTH = 12;
export const DEPTH_STEP = .7;
export const GROUND_LEVEL = .275;
export const TERRAIN_BOTTOM = -9.2;
export const STRATA = [
  { top: GROUND_LEVEL, bottom: -2.2, color: '#a28a63' },
  { top: -2.2, bottom: -5.3, color: '#bd9c70' },
  { top: -5.3, bottom: TERRAIN_BOTTOM, color: '#817d70' },
];

export const surfaceHeight = depth => GROUND_LEVEL-depth*DEPTH_STEP;
export function terrainLayers(depth) {
  const capBottom=surfaceHeight(depth)-.18;
  return STRATA.map(layer=>{
    const top=Math.max(layer.bottom,Math.min(layer.top,capBottom));
    return {y:(top+layer.bottom)/2,height:top-layer.bottom,color:layer.color};
  });
}
