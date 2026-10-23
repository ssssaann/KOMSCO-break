import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CAMPUS, WEAPONS, createCampus } from './campus.js';
import { Game } from './game.js';
import './style.css';

const $=id=>document.getElementById(id);
const svg=body=>`<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
const icons={
  bomb:svg('<path d="M25 12c0-6 5-7 7-5" stroke="#6b7568" stroke-width="2"/><path d="m29 5 3-3m1 7 4-1" stroke="#ee9b50" stroke-width="2" stroke-linecap="round"/><path d="m21 10 7 4-3 5-7-4z" fill="#a9aaa0"/><circle cx="17" cy="25" r="12" fill="#56635c"/><path d="M10 24c0-4 2-6 5-7" stroke="#95a294" stroke-width="2.5" stroke-linecap="round"/>'),
  bat:svg('<path d="m8 33 9-10 2 2-9 10z" fill="#947b5b"/><path d="M16 24c-2-2 1-5 4-9L29 4c2-2 7 2 5 5L24 22c-3 4-5 5-8 2" fill="#c79f72"/><path d="M21 20 32 6" stroke="#e4cba5" stroke-width="2"/><path d="m6 34 4 3" stroke="#6f7e6b" stroke-width="3" stroke-linecap="round"/>'),
  laser:svg('<path d="m4 13 17 2 5 6-6 5-16-2z" fill="#738b7a"/><path d="m10 24-2 10h6l4-9" fill="#526958"/><path d="M24 21h12" stroke="#f06553" stroke-width="3" stroke-linecap="round"/><path d="m31 14 5-4m-4 17 4 4" stroke="#ec9e82" stroke-width="1.5"/><path d="M7 17h10" stroke="#b6c5b0" stroke-width="2"/>'),
  meteor:svg('<path d="m11 23 6-17 2 9L31 1l-5 20 10-7-9 18" fill="#efb467"/><path d="m19 25 8-13-1 12 6-2-8 11" fill="#f5d099"/><circle cx="14" cy="29" r="10" fill="#9a8066"/><path d="m8 27 5-5 7 3-1 9-8 1z" fill="#b49a78"/><path d="m8 27 6 3 5-5m-5 5-3 5" stroke="#8e7661" stroke-width="1.5"/>'),
  quake:svg('<path d="M3 30 10 20l7 4 7-13 13 19-15 4-9-3-10 3z" fill="#a5ad82"/><path d="m23 12-7 12 6 1-6 10" stroke="#f8f8ed" stroke-width="2.5"/><path d="m5 17-2-4m10 1-1-5m21 9 3-4" stroke="#899a73" stroke-width="2" stroke-linecap="round"/>'),
  nuke:svg('<path d="M20 3c-8 0-15 5-15 11 0 5 5 7 11 7l-2 10h12l-3-10c7 0 12-2 12-7C35 8 28 3 20 3" fill="#d8b66d"/><path d="M9 13c1-4 6-6 11-6" stroke="#f0d595" stroke-width="2.5" stroke-linecap="round"/><ellipse cx="20" cy="33" rx="15" ry="4" fill="#a9a17b"/><path d="m16 21-1 9m8-9 2 9" stroke="#bf9b57" stroke-width="2"/>'),
};
const soundIcon=on=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M11 5 6 9H3v6h3l5 4z"/>${on?'<path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>':'<path d="m16 9 5 6m0-6-5 6"/>'}</svg>`;

let weapon=WEAPONS[0],busy=false,sound=false,audio,toastTimeout,best=0;
try{best=Number(localStorage.getItem('komsco-best'))||0;}catch{/* Storage can be disabled in private browsers. */}
$('sound').innerHTML=soundIcon(sound);
for(const [i,w] of WEAPONS.entries()){
  const button=document.createElement('button');
  button.className=`weapon${i===0?' active':''}`;
  button.dataset.weapon=w.id;button.setAttribute('aria-pressed',String(i===0));
  button.title=`${w.name} (${i+1}) · ${w.hint}`;
  button.innerHTML=`<kbd>${i+1}</kbd>${icons[w.id]}<strong>${w.name}</strong>`;
  button.addEventListener('click',()=>selectWeapon(w));$('weapons').append(button);
}
function selectWeapon(w){weapon=w;document.querySelectorAll('.weapon').forEach(b=>{const active=b.dataset.weapon===w.id;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});$('hint-text').textContent=`${w.name} 장착 완료 · ${w.hint}`;if(aim)aim.material.color.set(w.color);}
function toast(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>$('toast').classList.remove('visible'),2600);}

const campus=createCampus(),game=new Game(campus);
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer,scene,camera,controls,blocksMesh,groundMesh,aim;
const dummy=new THREE.Object3D(),color=new THREE.Color();
const effects=[],particles=[],signs=[];
const cubeGeometry=new THREE.BoxGeometry(1,1,1);
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
let pointerStart=null,hover=null,shake=0,pending=null,last=performance.now(),elapsed=0;

try{init();updateUI();animate();$('loading').remove();}catch(error){
  console.error(error);$('loading').innerHTML='<strong>3D 화면을 시작하지 못했어요.</strong><small>브라우저의 하드웨어 가속을 켜고 새로고침해 주세요.</small><button class="primary-button" onclick="location.reload()" style="width:160px">다시 시도</button>';
}

function init(){
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.setClearColor('#e9eee3');renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
  $('scene').append(renderer.domElement);
  scene=new THREE.Scene();scene.fog=new THREE.Fog('#e9eee3',140,260);
  camera=new THREE.OrthographicCamera(-70,70,40,-40,.1,400);
  camera.position.set(65,70,80);
  controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,0,0);
  controls.enableDamping=true;controls.dampingFactor=.08;controls.enablePan=false;
  controls.minPolarAngle=.25;controls.maxPolarAngle=1.18;controls.minZoom=.65;controls.maxZoom=2.5;controls.rotateSpeed=.55;
  scene.add(new THREE.HemisphereLight('#fff7df','#a1b396',2.7));
  const sun=new THREE.DirectionalLight('#fff4dc',3.1);sun.position.set(-35,65,30);sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-58,right:58,top:58,bottom:-58,near:1,far:180});
  sun.shadow.normalBias=.06;sun.shadow.bias=-.00015;sun.shadow.radius=3;scene.add(sun);
  const backdrop=new THREE.Mesh(new THREE.PlaneGeometry(500,500),new THREE.MeshStandardMaterial({color:'#e5ebdc',roughness:1}));backdrop.rotation.x=-Math.PI/2;backdrop.position.y=-3.5;backdrop.receiveShadow=true;scene.add(backdrop);
  const soil=new THREE.Mesh(new THREE.BoxGeometry(65,1.5,57),new THREE.MeshStandardMaterial({color:'#b0b89d',roughness:1}));soil.position.y=-2.2;soil.receiveShadow=true;soil.castShadow=true;scene.add(soil);
  const lower=new THREE.Mesh(new THREE.BoxGeometry(63.5,.8,55.5),new THREE.MeshStandardMaterial({color:'#a7ad91',roughness:1}));lower.position.y=-2.6;scene.add(lower);
  groundMesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1.99,.65,1.99),new THREE.MeshStandardMaterial({roughness:1}),campus.terrain.length);
  groundMesh.receiveShadow=true;groundMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(groundMesh);
  blocksMesh=new THREE.InstancedMesh(cubeGeometry,new THREE.MeshStandardMaterial({roughness:.85}),campus.blocks.length);
  blocksMesh.castShadow=true;blocksMesh.receiveShadow=true;blocksMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(blocksMesh);syncWorld();blocksMesh.computeBoundingSphere();groundMesh.computeBoundingSphere();
  addDecorations();
  aim=new THREE.Mesh(new THREE.RingGeometry(weapon.radius-.07,weapon.radius,80),new THREE.MeshBasicMaterial({color:weapon.color,transparent:true,opacity:.65,depthWrite:false,side:THREE.DoubleSide}));
  aim.rotation.x=-Math.PI/2;aim.visible=false;aim.renderOrder=3;scene.add(aim);
  window.addEventListener('resize',resize);resize();
  renderer.domElement.addEventListener('pointerdown',event=>{if(event.isPrimary)pointerStart={x:event.clientX,y:event.clientY,id:event.pointerId,moved:false};else if(pointerStart)pointerStart.moved=true;});
  renderer.domElement.addEventListener('pointermove',event=>{
    if(pointerStart&&Math.hypot(event.clientX-pointerStart.x,event.clientY-pointerStart.y)>7)pointerStart.moved=true;
    hover=pick(event);if(hover&&!busy){aim.visible=true;aim.position.set(hover.x,.42,hover.z);}else aim.visible=false;
  });
  renderer.domElement.addEventListener('pointerleave',()=>{aim.visible=false;});
  renderer.domElement.addEventListener('pointercancel',()=>{pointerStart=null;});
  renderer.domElement.addEventListener('pointerup',event=>{
    const start=pointerStart;if(!start||event.pointerId!==start.id)return;pointerStart=null;
    if(event.button!==0||start.moved||Math.hypot(event.clientX-start.x,event.clientY-start.y)>7)return;
    const point=pick(event);if(point)fire(point);
  });
}

function resize(){
  const {width,height}=$('scene').getBoundingClientRect();
  const aspect=width/height;
  const vertical=width<650?Math.max(84,84/aspect):72;
  camera.left=-vertical*aspect/2;camera.right=vertical*aspect/2;camera.top=vertical/2;camera.bottom=-vertical/2;
  camera.updateProjectionMatrix();renderer.setSize(width,height);
}
function syncWorld(){
  for(const b of campus.blocks){dummy.position.set(b.x,b.y,b.z);dummy.rotation.set(0,0,0);const s=game.destroyed[b.id]?0:1;dummy.scale.set(.96*s,.86*s,.96*s);dummy.updateMatrix();blocksMesh.setMatrixAt(b.id,dummy.matrix);blocksMesh.setColorAt(b.id,color.set(b.color));}
  for(const t of campus.terrain){const depth=game.depths[t.id];dummy.position.set(t.x,-.05-depth*.57,t.z);dummy.scale.set(1,1,1);dummy.rotation.set(0,0,0);dummy.updateMatrix();groundMesh.setMatrixAt(t.id,dummy.matrix);groundMesh.setColorAt(t.id,color.set(depth===2?'#8d8068':depth===1?'#a69b7a':t.color));}
  blocksMesh.instanceMatrix.needsUpdate=true;blocksMesh.instanceColor.needsUpdate=true;groundMesh.instanceMatrix.needsUpdate=true;groundMesh.instanceColor.needsUpdate=true;
  for(const sign of signs){const b=CAMPUS.buildings[sign.userData.building];const remaining=campus.blocks.filter(block=>block.building===sign.userData.building&&!game.destroyed[block.id]).length;sign.visible=remaining>b.width*b.depth*.3;}
}

function addBox(x,y,z,sx,sy,sz,hex){const mesh=new THREE.Mesh(cubeGeometry,new THREE.MeshStandardMaterial({color:hex,roughness:.9}));mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);return mesh;}
function makeText(text,width,height,fontSize,hex='#3d6157',bg=null){
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');
  if(bg){ctx.fillStyle=bg;ctx.beginPath();ctx.roundRect(0,0,width,height,12);ctx.fill();}
  ctx.font=`700 ${fontSize}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=hex;ctx.fillText(text,width/2,height/2);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
function addDecorations(){
  // Parking markings, entry road and cars form a miniature foreground.
  for(let x=13;x<28;x+=3){const stripe=addBox(x,.29,5.5,.06,.035,4.7,'#eef0dc');stripe.castShadow=false;}
  for(let x=-30;x<32;x+=5){const line=addBox(x,.29,11.9,2,.025,.09,'#e9e5c5');line.castShadow=false;}
  // Cars are built as breakable scenery so they cannot float over a crater.
  for(const [x,z,hex] of [[14.5,5.6,'#e8e3d7'],[20.5,5.6,'#799397'],[26.5,5.6,'#c9a378']]){
    const car=addBox(x,.65,z,1.25,.65,2.15,hex);const top=addBox(x,1.1,z,1.1,.45,1.1,'#849c9b');
    car.userData.scenery=true;top.userData.scenery=true;
  }
  CAMPUS.buildings.forEach((b,i)=>{
    const texture=makeText(i===0?'KOMSCO':b.name,384,88,i===0?57:39,i===0?'#31798a':'#556650',i===0?null:'#f6f8eedf');
    const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false,opacity:.95}));
    sprite.position.set(b.x,b.floors*.9+3,b.z);sprite.scale.set(i===0?10:8,i===0?2.3:1.83,1);sprite.userData.building=i;
    // Wing names are represented by the main building label to keep the scene quiet.
    if(i!==1&&i!==2){scene.add(sprite);signs.push(sprite);}
  });
}
function pick(event){
  const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
  raycaster.setFromCamera(pointer,camera);
  const hits=raycaster.intersectObjects([blocksMesh,groundMesh],false);
  for(const hit of hits){if(hit.object===blocksMesh&&game.destroyed[hit.instanceId])continue;return hit.point.clone();}
  return null;
}

function fire(point){
  if(busy)return;
  busy=true;aim.visible=false;const w=weapon;
  $('hint-text').textContent=`${w.name} ${w.delay?'다가오는 중…':'발사!'} `;
  // Action runs on the animation clock, so restoring/undoing can cancel it completely.
  pending={remaining:w.delay,weapon:w,point:point.clone()};
  if(w.id==='meteor'){
    const mesh=new THREE.Mesh(new THREE.IcosahedronGeometry(2.1,1),new THREE.MeshStandardMaterial({color:'#6b5948',emissive:'#f36a1c',emissiveIntensity:.7,flatShading:true}));
    scene.add(mesh);effects.push({mesh,kind:'meteor',age:0,life:w.delay,point:point.clone()});
  }
  if(w.id==='nuke'){const mesh=new THREE.Mesh(new THREE.SphereGeometry(.65,12,8),new THREE.MeshStandardMaterial({color:'#59684e'}));scene.add(mesh);effects.push({mesh,kind:'drop',age:0,life:w.delay,point:point.clone()});}
  if(w.id==='quake'){shake=reducedMotion?0:.32;soundEffect('quake');}
}
function impact(w,point){
  const result=game.attack(w.id,point);
  if(!result.points){toast('여긴 이미 시원하게 비웠어요. 다른 곳을 노려보세요.');finishAttack();return;}
  syncWorld();clearScenery();updateUI();
  if(!reducedMotion)shake=w.id==='nuke'?.85:w.id==='quake'?.55:w.id==='meteor'?.5:.17;
  soundEffect(w.id);
  for(const id of result.removed.slice(0,reducedMotion?24:230)){
    const b=campus.blocks[id];spawnDebris(b,point,w);
  }
  spawnRing(point,w.radius,w.color,w.id==='nuke'?1.5:.7);
  if(w.id==='laser'){
    const beam=new THREE.Mesh(new THREE.CylinderGeometry(.35,.35,42,12),new THREE.MeshBasicMaterial({color:'#ff7158',transparent:true,opacity:.9}));beam.position.set(point.x,21,point.z);scene.add(beam);effects.push({mesh:beam,kind:'beam',age:0,life:.38});
  }else if(w.id==='bat'){
    const bat=new THREE.Mesh(new THREE.CapsuleGeometry(.4,6,4,8),new THREE.MeshStandardMaterial({color:'#bd935e'}));bat.position.copy(point).add(new THREE.Vector3(0,3,0));bat.rotation.z=-1;scene.add(bat);effects.push({mesh:bat,kind:'bat',age:0,life:.35});
  }else if(w.id==='nuke'){
    cloud(point);flash(.7);
  }else{
    const blast=new THREE.Mesh(new THREE.SphereGeometry(1,20,12),new THREE.MeshBasicMaterial({color:w.color,transparent:true,opacity:.6,depthWrite:false}));blast.position.copy(point);scene.add(blast);effects.push({mesh:blast,kind:'blast',age:0,life:.5,radius:w.radius*.7});
  }
  const projected=point.clone().project(camera),rect=renderer.domElement.getBoundingClientRect();
  const popup=$('score-popup');popup.textContent=`+${result.points.toLocaleString()}${result.bonus?' COMBO!':''}`;popup.style.left=`${(projected.x+1)/2*rect.width}px`;popup.style.top=`${(-projected.y+1)/2*rect.height}px`;popup.classList.remove('animate');void popup.offsetWidth;popup.classList.add('animate');
  if(result.bonus)toast(`${result.removed.length}블록 연쇄 파괴! 보너스 +25%`);
  finishAttack();
}
function finishAttack(){pending=null;busy=false;$('hint-text').textContent=`${weapon.name} 장착 완료 · ${weapon.hint}`;}
function clearScenery(){scene.traverse(obj=>{if(obj.userData.scenery){const tile=campus.terrain.find(t=>Math.abs(t.x-obj.position.x)<=1&&Math.abs(t.z-obj.position.z)<=1);obj.visible=!tile||game.depths[tile.id]===0;}});}

function spawnDebris(b,point,w){
  if(particles.length>=450)return;
  const mesh=new THREE.Mesh(cubeGeometry,new THREE.MeshStandardMaterial({color:b.color,roughness:1}));mesh.scale.setScalar(.35+Math.random()*.38);mesh.position.set(b.x,b.y,b.z);scene.add(mesh);
  const direction=new THREE.Vector3(b.x-point.x,0,b.z-point.z).normalize();const power=w.id==='nuke'?12:6;
  particles.push({mesh,v:new THREE.Vector3(direction.x*(2+Math.random()*power),3+Math.random()*10,direction.z*(2+Math.random()*power)),spin:new THREE.Vector3(Math.random()*4,Math.random()*5,Math.random()*4),life:2+Math.random()*1.8,age:0});
}
function spawnRing(point,radius,hex,life){
  const mesh=new THREE.Mesh(new THREE.RingGeometry(.94,1,80),new THREE.MeshBasicMaterial({color:hex,transparent:true,opacity:.8,depthWrite:false,side:THREE.DoubleSide}));mesh.rotation.x=-Math.PI/2;mesh.position.set(point.x,.5,point.z);scene.add(mesh);effects.push({mesh,kind:'ring',age:0,life,radius});
}
function cloud(point){
  for(let i=0;i<10;i++){
    const mesh=new THREE.Mesh(new THREE.IcosahedronGeometry(1,2),new THREE.MeshStandardMaterial({color:i<4?'#c6a66e':'#e6ba76',transparent:true,opacity:.85,roughness:1,flatShading:true}));
    const angle=i/6*Math.PI*2;
    mesh.position.set(point.x+(i<4?0:Math.cos(angle)*5),i<4?i*2+1:11+Math.sin(i)*1.5,point.z+(i<4?0:Math.sin(angle)*5));
    scene.add(mesh);effects.push({mesh,kind:'cloud',age:0,life:3.4,radius:i<4?2.3:4.8});
  }
}
function flash(strength){if(reducedMotion)return;$('hit-flash').animate([{opacity:0},{opacity:strength,offset:.14},{opacity:0}],{duration:750});}
function disposeEffect(effect){scene.remove(effect.mesh);if(effect.mesh.geometry!==cubeGeometry)effect.mesh.geometry.dispose();effect.mesh.material.dispose();}
function clearEffects(){pending=null;busy=false;shake=0;for(const e of [...effects,...particles])disposeEffect(e);effects.length=0;particles.length=0;$('score-popup').classList.remove('animate');finishAttack();}
function updateUI(){
  $('score').textContent=game.score.toLocaleString();$('damage').innerHTML=`${game.damage.toFixed(1)}<span>%</span>`;$('damage-bar').style.width=`${game.damage}%`;$('blocks').textContent=game.destroyedCount.toLocaleString();
  if(game.score>best){best=game.score;try{localStorage.setItem('komsco-best',String(best));}catch{/* Session still works without localStorage. */}}
  $('best').textContent=best.toLocaleString();$('undo').disabled=!game.history.length;
}
function soundEffect(id){
  if(!sound)return;
  try{
    audio??=new AudioContext();if(audio.state==='suspended')audio.resume();
    const duration=id==='nuke'?1.2:id==='quake'?.8:.35;
    const buffer=audio.createBuffer(1,Math.ceil(audio.sampleRate*duration),audio.sampleRate);const data=buffer.getChannelData(0);
    for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length);
    const src=audio.createBufferSource();src.buffer=buffer;const filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=id==='laser'?3200:450;
    const gain=audio.createGain();gain.gain.setValueAtTime(.22,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);src.connect(filter).connect(gain).connect(audio.destination);src.start();
    const osc=audio.createOscillator();osc.type=id==='laser'?'sawtooth':'sine';osc.frequency.setValueAtTime(id==='laser'?850:100,audio.currentTime);osc.frequency.exponentialRampToValueAtTime(id==='laser'?120:28,audio.currentTime+duration);osc.connect(gain);osc.start();osc.stop(audio.currentTime+duration);
  }catch{sound=false;$('sound').innerHTML=soundIcon(false);}
}
function animate(){
  requestAnimationFrame(animate);const now=performance.now(),dt=Math.min((now-last)/1000,.05);last=now;elapsed+=dt;
  controls.update();
  if(pending){pending.remaining-=dt;if(pending.remaining<=0){const action=pending;pending=null;impact(action.weapon,action.point);}}
  if(aim.visible){const scale=weapon.radius/WEAPONS[0].radius;aim.scale.setScalar(scale*(1+Math.sin(elapsed*3)*.02));}
  for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.age+=dt;p.v.y-=19*dt;p.mesh.position.addScaledVector(p.v,dt);p.mesh.rotation.x+=p.spin.x*dt;p.mesh.rotation.y+=p.spin.y*dt;
    if(p.mesh.position.y<.25){p.mesh.position.y=.25;p.v.y=Math.abs(p.v.y)*.25;p.v.x*=.9;p.v.z*=.9;}
    if(p.age>p.life-.5)p.mesh.scale.multiplyScalar(Math.max(0,1-dt*5));if(p.age>=p.life){disposeEffect(p);particles.splice(i,1);}
  }
  for(let i=effects.length-1;i>=0;i--){const e=effects[i];e.age+=dt;const t=Math.min(e.age/e.life,1);
    if(e.kind==='ring'){e.mesh.scale.setScalar(1+t*e.radius*1.4);e.mesh.material.opacity=(1-t)*.65;}
    if(e.kind==='blast'){e.mesh.scale.setScalar(.3+t*e.radius);e.mesh.material.opacity=(1-t)*.5;}
    if(e.kind==='beam'){e.mesh.scale.x=e.mesh.scale.z=1-t;e.mesh.material.opacity=1-t;}
    if(e.kind==='bat'){e.mesh.rotation.z=-1+t*2.8;e.mesh.position.y-=dt*5;}
    if(e.kind==='cloud'){e.mesh.scale.setScalar(e.radius*Math.min(1,t*5));e.mesh.position.y+=dt*1.2;e.mesh.material.opacity=.8*(1-t);}
    if(e.kind==='meteor'){e.mesh.position.copy(e.point).add(new THREE.Vector3(30*(1-t),50*(1-t),-15*(1-t)));e.mesh.rotation.x+=dt*5;}
    if(e.kind==='drop'){e.mesh.position.copy(e.point).add(new THREE.Vector3(0,40*(1-t),0));e.mesh.scale.set(1,2.5,1);}
    if(t>=1){disposeEffect(e);effects.splice(i,1);}
  }
  const original=camera.position.clone();if(shake>.005){camera.position.x+=(Math.random()-.5)*shake;camera.position.y+=(Math.random()-.5)*shake;shake*=Math.pow(.025,dt);}
  renderer.render(scene,camera);camera.position.copy(original);
}

function undo(){clearEffects();if(game.undo()){syncWorld();clearScenery();updateUI();toast('한 번 되돌렸어요. 점수와 지형도 제자리로!');}else toast('아직 되돌릴 행동이 없어요.');}
function restore(){clearEffects();if(game.reset()){syncWorld();clearScenery();updateUI();toast('캠퍼스 복구 완료. 다시 시작해볼까요?');}else toast('이미 말끔한 캠퍼스예요.');}
$('undo').addEventListener('click',undo);$('restore').addEventListener('click',restore);
$('sound').addEventListener('click',()=>{sound=!sound;$('sound').innerHTML=soundIcon(sound);$('sound').setAttribute('aria-label',`소리 ${sound?'끄기':'켜기'}`);$('sound').title=`소리 ${sound?'끄기':'켜기'}`;if(sound)soundEffect('bat');});
$('help').addEventListener('click',()=>$('help-dialog').showModal());$('close-help').addEventListener('click',()=>$('help-dialog').close());$('start-play').addEventListener('click',()=>$('help-dialog').close());
$('help-dialog').addEventListener('click',e=>{if(e.target===$('help-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
$('view-reset').addEventListener('click',()=>{camera.position.set(65,70,80);controls.target.set(0,0,0);camera.zoom=1;camera.updateProjectionMatrix();controls.update();});
for(const [id,multiplier] of [['zoom-in',1.2],['zoom-out',1/1.2]])$(id).addEventListener('click',()=>{camera.zoom=THREE.MathUtils.clamp(camera.zoom*multiplier,.65,2.5);camera.updateProjectionMatrix();});
window.addEventListener('keydown',event=>{
  if($('help-dialog').open||/INPUT|TEXTAREA|SELECT/.test(event.target.tagName))return;
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();undo();return;}
  if(event.ctrlKey||event.metaKey||event.altKey)return;
  if(/^[1-6]$/.test(event.key))selectWeapon(WEAPONS[Number(event.key)-1]);
  if(event.key.toLowerCase()==='r')restore();
});
document.addEventListener('visibilitychange',()=>{last=performance.now();});
