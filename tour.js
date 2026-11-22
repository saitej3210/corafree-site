(function(){
if(!window.THREE)return;
/* ======= easy settings ======= */
const SLOTS=['Now','7:00 PM','9:00 PM'];
const BOOKED=[[4,7],[1,3,6],[2,5,7]];   // booked table numbers per time slot
const TB=[
 {n:1,s:2,w:'Terrace',plan:[78,92]},
 {n:2,s:4,w:'Terrace',plan:[22,92]},
 {n:3,s:2,w:'Window side',plan:[20,68]},
 {n:4,s:4,w:'Terracotta wall side',plan:[78,60]},
 {n:5,s:2,w:'Window side',plan:[26,46]},
 {n:6,s:2,w:'Centre aisle',plan:[56,34]},
 {n:7,s:4,w:"Chef's table (best view)",plan:[64,18]}];
/* ============================== */
const PI=Math.PI,clamp=(x,a,b)=>Math.min(b,Math.max(a,x)),rnd=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.random()*a.length|0];
const ST=document.getElementById('tables'),view=document.getElementById('view'),card=document.getElementById('tcard'),intro=document.getElementById('tintro'),map=document.getElementById('map');
const mobile=matchMedia('(max-width:820px)').matches;

/* ---------- renderer / scene ---------- */
const R=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
R.setPixelRatio(Math.min(devicePixelRatio||1,mobile?1.5:2));
R.outputEncoding=THREE.sRGBEncoding;R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=1.0;
R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
const AN=Math.min(8,R.capabilities.getMaxAnisotropy());
const cv=R.domElement;cv.style.cssText='position:absolute;inset:0;width:100%;height:100%;display:block';view.appendChild(cv);
const S=new THREE.Scene();S.background=new THREE.Color(0x20170f);S.fog=new THREE.Fog(0x20170f,13,28);
const C=new THREE.PerspectiveCamera(50,1,.1,50);
/* cinematic finish: vignette + fine film grain (pure CSS, no cost) */
{const v=document.createElement('div');v.style.cssText="position:absolute;inset:0;pointer-events:none;z-index:1;background:radial-gradient(ellipse at 50% 45%,transparent 55%,rgba(8,4,2,.5) 100%)";view.appendChild(v);
 const gr=document.createElement('div');gr.style.cssText="position:absolute;inset:0;pointer-events:none;z-index:1;opacity:.07;mix-blend-mode:overlay;background-image:url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";view.appendChild(gr)}

/* ---------- helpers ---------- */
const mulberry=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const canvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
const toTex=(c,rx,ry,srgb)=>{const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rx,ry);t.encoding=srgb?THREE.sRGBEncoding:THREE.LinearEncoding;t.anisotropy=AN;return t};
const tex=(w,h,fn,rx=1,ry=1)=>{const c=canvas(w,h);fn(c.getContext('2d'),w,h);return toTex(c,rx,ry,true)};
/* height canvas -> normal map (Sobel) */
function normalFrom(hc,s){const w=hc.width,h=hc.height,d=hc.getContext('2d').getImageData(0,0,w,h).data,o=canvas(w,h),og=o.getContext('2d'),od=og.createImageData(w,h);
 const H=(x,y)=>d[(((y+h)%h)*w+((x+w)%w))*4]/255;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const dx=(H(x+1,y)-H(x-1,y))*s,dy=(H(x,y+1)-H(x,y-1))*s,l=Math.hypot(dx,dy,1),i=(y*w+x)*4;od.data[i]=(-dx/l*.5+.5)*255;od.data[i+1]=(dy/l*.5+.5)*255;od.data[i+2]=(1/l*.5+.5)*255;od.data[i+3]=255}
 og.putImageData(od,0,0);return o}
/* paint(g,w,h,rand,pass)  pass 'c' = colour, 'h' = height. returns {map,normalMap} */
function pbr(w,h,paint,rx,ry,ns=3,seed=1){const cc=canvas(w,h),hc=canvas(w,h);paint(cc.getContext('2d'),w,h,mulberry(seed),'c');paint(hc.getContext('2d'),w,h,mulberry(seed),'h');
 return{map:toTex(cc,rx,ry,true),normalMap:toTex(normalFrom(hc,ns),rx,ry,false)}}
const M=(c,r=.75,m=0)=>{const o=new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});o.envMapIntensity=.5;return o};
const Bx=(w,h,d)=>new THREE.BoxGeometry(w,h,d),Cy=(a,b,h,s=32)=>new THREE.CylinderGeometry(a,b,h,s),Sp=(r,s=16)=>new THREE.SphereGeometry(r,s,s*.75|0);
const LP=(pts,seg=40)=>new THREE.LatheGeometry(pts.map(p=>new THREE.Vector2(p[0],p[1])),seg);
const GC={};const geo=(k,f)=>GC[k]||(GC[k]=f());
const add=(p,g,m,x=0,y=0,z=0,sh=true)=>{const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=sh;p.add(o);return o};
const tube=(pts,r,seg=24,rad=8)=>new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p))),seg,r,rad,false);

/* ---------- textures (all procedural, PBR) ---------- */
/* wide oak planks, staggered joints, grain, knots, tiny gaps */
const FL=pbr(1024,1024,(g,w,h,r,p)=>{const rows=10,ph=h/rows;g.fillStyle=p=='c'?'#2b1c12':'#000';g.fillRect(0,0,w,h);
 for(let i=0;i<rows;i++){let x=-r()*400;const segs=[];while(x<w){const l=420+r()*520;segs.push([x,l]);x+=l}
  segs.forEach(([x0,l],si)=>{const b=r(),y0=i*ph,hue=24+b*6,sat=24+b*10,lig=24+b*9;
   if(p=='c'){g.fillStyle=`hsl(${hue},${sat}%,${lig}%)`;g.fillRect(x0+1.5,y0+1.5,l-3,ph-3);
    for(let k=0;k<90;k++){const yy=y0+3+r()*(ph-6),a=r()*.16;g.strokeStyle=r()>.35?`rgba(45,22,8,${a})`:`rgba(210,160,100,${a*.7})`;g.lineWidth=.5+r()*1.4;g.beginPath();g.moveTo(x0,yy);g.bezierCurveTo(x0+l*.3,yy+(r()-.5)*5,x0+l*.65,yy+(r()-.5)*5,x0+l,yy+(r()-.5)*3);g.stroke()}
    if(r()>.78){const kx=x0+30+r()*(l-60),ky=y0+ph*.3+r()*ph*.4;for(let q=4;q>0;q--){g.strokeStyle=`rgba(35,15,5,${.16})`;g.lineWidth=1.2;g.beginPath();g.ellipse(kx,ky,q*5.5,q*2.4,0,0,7);g.stroke()}}
    const sh=g.createLinearGradient(0,y0,0,y0+ph);sh.addColorStop(0,'rgba(0,0,0,.18)');sh.addColorStop(.12,'rgba(0,0,0,0)');sh.addColorStop(.9,'rgba(0,0,0,0)');sh.addColorStop(1,'rgba(0,0,0,.25)');g.fillStyle=sh;g.fillRect(x0+1.5,y0+1.5,l-3,ph-3)}
   else{g.fillStyle='#b9b9b9';g.fillRect(x0+1.5,y0+1.5,l-3,ph-3);for(let k=0;k<110;k++){const yy=y0+3+r()*(ph-6);g.strokeStyle=`rgba(0,0,0,${.12+r()*.2})`;g.lineWidth=.6+r()*1.2;g.beginPath();g.moveTo(x0,yy);g.lineTo(x0+l,yy+(r()-.5)*4);g.stroke()}}})}},14/2.4,14/2.4,4,11);
const BR=pbr(512,512,(g,w,h,r,p)=>{g.fillStyle=p=='c'?'#b8b0a4':'#161616';g.fillRect(0,0,w,h);const bw=w/6,bh=h/24;
 for(let row=0;row<24;row++)for(let c=-1;c<7;c++){const x=c*bw+(row%2?bw/2:0)+2,y=row*bh+2,b=r();
  if(p=='c'){g.fillStyle=`hsl(${9+b*12},${34+b*18}%,${27+b*18}%)`;g.fillRect(x,y,bw-4,bh-4);for(let k=0;k<60;k++){g.fillStyle=`rgba(${r()>.5?'40,15,8':'230,170,130'},${r()*.12})`;g.fillRect(x+r()*(bw-6),y+r()*(bh-6),1+r()*3,1+r()*2)}
   const gr=g.createLinearGradient(0,y,0,y+bh);gr.addColorStop(0,'rgba(255,220,180,.12)');gr.addColorStop(1,'rgba(0,0,0,.18)');g.fillStyle=gr;g.fillRect(x,y,bw-4,bh-4)}
  else{g.fillStyle=`rgb(${190+b*50|0},${190+b*50|0},${190+b*50|0})`;g.fillRect(x,y,bw-4,bh-4);for(let k=0;k<50;k++){g.fillStyle=`rgba(0,0,0,${r()*.3})`;g.fillRect(x+r()*(bw-6),y+r()*(bh-6),2+r()*4,1+r()*2)}}}},14/1.29,3.6/1.8,2.2,5);
const PL=pbr(512,512,(g,w,h,r,p)=>{g.fillStyle=p=='c'?'#e3d3b8':'#808080';g.fillRect(0,0,w,h);
 for(let i=0;i<260;i++){const x=r()*w,y=r()*h,rad=10+r()*55,v=r();g.fillStyle=p=='c'?`rgba(${v>.5?'255,244,222':'150,120,86'},${.03+r()*.05})`:`rgba(${v>.5?255:0},${v>.5?255:0},${v>.5?255:0},${.03+r()*.05})`;g.beginPath();g.arc(x,y,rad,0,7);g.fill();
  if(x<rad){g.beginPath();g.arc(x+w,y,rad,0,7);g.fill()}if(y<rad){g.beginPath();g.arc(x,y+h,rad,0,7);g.fill()}}
 for(let i=0;i<9000;i++){const v=r()*255|0;g.fillStyle=`rgba(${v},${v},${v},${p=='c'?.05:.12})`;g.fillRect(r()*w,r()*h,1.5,1.5)}},6,1.8,.9);
const OAK=pbr(512,512,(g,w,h,r,p)=>{g.fillStyle=p=='c'?'#a47446':'#999';g.fillRect(0,0,w,h);
 for(let i=0;i<w/6;i++){const y=r()*h,a=.05+r()*.14;g.strokeStyle=p=='c'?(r()>.4?`rgba(70,38,14,${a})`:`rgba(230,190,130,${a*.8})`):`rgba(0,0,0,${a*1.5})`;g.lineWidth=.6+r()*2;g.beginPath();g.moveTo(0,y);g.bezierCurveTo(w*.3,y+(r()-.5)*14,w*.65,y+(r()-.5)*14,w,y+(r()-.5)*5);g.stroke()}
 for(let k=0;k<2;k++){const cx=r()*w,cy=r()*h;for(let q=7;q>0;q--){g.strokeStyle=p=='c'?`rgba(60,30,10,.11)`:'rgba(0,0,0,.1)';g.lineWidth=1.1;g.beginPath();g.ellipse(cx,cy,q*13,q*3.4,0,0,7);g.stroke()}}},1,1,1.3,7);
const MB=pbr(512,512,(g,w,h,r,p)=>{g.fillStyle=p=='c'?'#ebe7df':'#999';g.fillRect(0,0,w,h);
 for(let i=0;i<22;i++){let x=r()*w,y=r()*h;g.strokeStyle=p=='c'?`rgba(${90+r()*40|0},${90+r()*40|0},${95+r()*40|0},${.06+r()*.16})`:'rgba(0,0,0,.08)';g.lineWidth=.5+r()*2.2;g.beginPath();g.moveTo(x,y);for(let s=0;s<7;s++){x+=(r()-.3)*90;y+=(r()-.5)*90;g.lineTo(x,y)}g.stroke()}},1.2,.35,.3);
const WS=pbr(512,512,(g,w,h,r,p)=>{g.fillStyle=p=='c'?'#a9b7a3':'#888';g.fillRect(0,0,w,h);for(let i=0;i<5000;i++){const v=r()*255|0;g.fillStyle=`rgba(${v},${v},${v},.05)`;g.fillRect(r()*w,r()*h,2,2)}},1,1,.6);
const winT=tex(512,512,(g,w,h)=>{const r=g.createLinearGradient(0,0,0,h);r.addColorStop(0,'#fffaf0');r.addColorStop(.55,'#ffe9b8');r.addColorStop(1,'#d8c88a');g.fillStyle=r;g.fillRect(0,0,w,h);g.filter='blur(22px)';for(let i=0;i<20;i++){g.fillStyle=`rgba(${50+rnd(0,40)|0},${95+rnd(0,50)|0},${40+rnd(0,25)|0},${rnd(.45,.9)})`;g.beginPath();g.arc(rnd(0,w),rnd(h*.5,h*1.1),rnd(26,70),0,7);g.fill()}g.fillStyle='rgba(255,255,240,.5)';g.beginPath();g.arc(w*.7,h*.2,60,0,7);g.fill()});
const glowT=tex(64,64,g=>{const r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,225,160,1)');r.addColorStop(1,'rgba(255,170,80,0)');g.fillStyle=r;g.fillRect(0,0,64,64)});
const signT=tex(1024,256,(g,w,h)=>{g.font='italic 110px Fraunces,Georgia,serif';g.textAlign='center';g.textBaseline='middle';g.shadowColor='#ff8a4a';g.shadowBlur=36;g.fillStyle='#ffe9cf';g.fillText('Corafrée Café',w/2,h/2)});
const blobT=tex(64,64,g=>{const r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(0,0,0,.65)');r.addColorStop(.5,'rgba(0,0,0,.28)');r.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=r;g.fillRect(0,0,64,64)});
const beamT=tex(64,256,(g,w,h)=>{const r=g.createLinearGradient(0,h,0,0);r.addColorStop(0,'rgba(255,225,170,.45)');r.addColorStop(1,'rgba(255,225,170,0)');g.fillStyle=r;g.fillRect(0,0,w,h);const m=g.createLinearGradient(0,0,w,0);m.addColorStop(0,'rgba(0,0,0,1)');m.addColorStop(.5,'rgba(0,0,0,0)');m.addColorStop(1,'rgba(0,0,0,1)');g.globalCompositeOperation='destination-out';g.fillStyle=m;g.fillRect(0,0,w,h)});
const cloth=pbr(256,256,(g,w,h,r,p)=>{g.fillStyle=p=='c'?'#e9decb':'#888';g.fillRect(0,0,w,h);for(let i=0;i<w;i+=2){g.fillStyle=p=='c'?`rgba(120,100,70,${r()*.1})`:`rgba(0,0,0,${r()*.25})`;g.fillRect(i,0,1,h);g.fillRect(0,i,w,1)}},3,3,1);
const rugT=pbr(512,320,(g,w,h,r,p)=>{const c=p=='c';g.fillStyle=c?'#5a2a22':'#777';g.fillRect(0,0,w,h);
 const band=(y,hh,col)=>{g.fillStyle=c?col:'#888';g.fillRect(0,y,w,hh)};band(10,12,'#b9a98a');band(h-22,12,'#b9a98a');band(28,6,'#2a3340');band(h-34,6,'#2a3340');
 for(let x=0;x<w;x+=40){g.fillStyle=c?'#2a3340':'#aaa';g.beginPath();g.moveTo(x+20,52);g.lineTo(x+36,h/2);g.lineTo(x+20,h-52);g.lineTo(x+4,h/2);g.closePath();g.fill();g.fillStyle=c?'#8a7050':'#999';g.beginPath();g.moveTo(x+20,h/2-22);g.lineTo(x+28,h/2);g.lineTo(x+20,h/2+22);g.lineTo(x+12,h/2);g.closePath();g.fill()}
 for(let i=0;i<h;i+=2){g.fillStyle=`rgba(0,0,0,${r()*.12})`;g.fillRect(0,i,w,1)}for(let i=0;i<7000;i++){g.fillStyle=`rgba(${r()>.5?255:0},${r()>.5?255:0},${r()>.5?255:0},.05)`;g.fillRect(r()*w,r()*h,1.5,1.5)}},1,1,1.2,5);
const chalkT=tex(512,640,(g,w,h)=>{g.fillStyle='#1b211d';g.fillRect(0,0,w,h);for(let i=0;i<40;i++){g.fillStyle=`rgba(255,255,255,${rnd(.01,.035)})`;g.beginPath();g.ellipse(rnd(0,w),rnd(0,h),rnd(30,120),rnd(10,40),rnd(0,3),0,7);g.fill()}g.fillStyle='rgba(240,235,222,.93)';g.textAlign='center';g.font='italic 58px Georgia,serif';g.fillText('Today',w/2,90);g.strokeStyle='rgba(240,235,222,.8)';g.lineWidth=2;g.beginPath();g.moveTo(150,115);g.lineTo(362,115);g.stroke();g.font='28px Georgia,serif';['Fettuccine Alfredo  349','Smash House Burger  299','Pepperoni Rush  499','Garlic Bread Crown  199','Cold Coffee  149','Molten Choco Lava  189'].forEach((t,i)=>g.fillText(t,w/2,180+i*70))});
const leafT=tex(128,256,(g,w,h)=>{g.beginPath();g.moveTo(w/2,4);g.bezierCurveTo(w*1.05,h*.3,w*.9,h*.8,w/2,h-4);g.bezierCurveTo(w*.1,h*.8,-w*.05,h*.3,w/2,4);const gr=g.createLinearGradient(0,0,w,0);gr.addColorStop(0,'#2e6a2a');gr.addColorStop(.5,'#4b9540');gr.addColorStop(1,'#2a6126');g.fillStyle=gr;g.fill();g.strokeStyle='rgba(200,235,170,.55)';g.lineWidth=2;g.beginPath();g.moveTo(w/2,6);g.lineTo(w/2,h-8);g.stroke();for(let i=1;i<9;i++){g.lineWidth=1;g.strokeStyle='rgba(200,235,170,.22)';g.beginPath();g.moveTo(w/2,i*h/10+10);g.lineTo(w*.12,i*h/10-14);g.moveTo(w/2,i*h/10+10);g.lineTo(w*.88,i*h/10-14);g.stroke()}});
const artT=n=>tex(256,320,(g,w,h)=>{const P=[['#d9a05b','#b8431f','#2f4a3b','#efe3cc'],['#27384f','#e0b25f','#c9794a','#f1e8d6'],['#7d9a7a','#f1e8d6','#8d3b2f','#2a1c12']][n%3];g.fillStyle=P[3];g.fillRect(0,0,w,h);g.fillStyle=P[0];g.beginPath();g.arc(w*.5,h*.38,70,0,7);g.fill();g.fillStyle=P[1];g.fillRect(0,h*.62,w,h*.38);g.fillStyle=P[2];g.beginPath();g.moveTo(0,h*.62);g.quadraticCurveTo(w*.3,h*.4,w*.62,h*.62);g.fill();g.fillStyle=P[2];g.fillRect(w*.7,h*.45,22,h*.2);g.fillStyle=P[0];g.fillRect(w*.15,h*.72,w*.7,12)});
const AG=(function(){const c=canvas(32,32),g=c.getContext('2d');return null})();

/* ---------- shared materials ---------- */
const wood=M(0x3b2a1e,.55),woodL=M(0x8a6238,.5),metal=M(0x1c1c1e,.42,.85),brass=M(0xb08a4a,.3,1),steel=M(0xd5d6da,.22,1),ceramic=M(0xf6f1e8,.18),
 plaster=new THREE.MeshStandardMaterial({color:0xe4d6bf,roughness:.95,map:PL.map,normalMap:PL.normalMap,normalScale:new THREE.Vector2(.5,.5),envMapIntensity:.3}),
 panelM=new THREE.MeshStandardMaterial({color:0x6f8a73,roughness:.5,map:WS.map,normalMap:WS.normalMap,envMapIntensity:.5}),
 topM=new THREE.MeshPhysicalMaterial({map:OAK.map,normalMap:OAK.normalMap,normalScale:new THREE.Vector2(.6,.6),roughness:.42,clearcoat:.45,clearcoatRoughness:.3,envMapIntensity:.8}),
 edgeM=new THREE.MeshStandardMaterial({color:0x3f2815,map:OAK.map,roughness:.5,envMapIntensity:.5}),
 chairW=new THREE.MeshStandardMaterial({color:0x4a2d1a,map:OAK.map,normalMap:OAK.normalMap,roughness:.4,envMapIntensity:.7}),
 leather=new THREE.MeshStandardMaterial({color:0x3a1c10,roughness:.5,normalMap:cloth.normalMap,normalScale:new THREE.Vector2(.7,.7),envMapIntensity:.8}),
 linen=new THREE.MeshStandardMaterial({color:0xf0e9dc,roughness:.95,map:cloth.map,normalMap:cloth.normalMap,side:THREE.DoubleSide}),
 glassM=new THREE.MeshPhysicalMaterial({color:0xffffff,roughness:.02,transparent:true,opacity:.2,clearcoat:1,clearcoatRoughness:0,envMapIntensity:2.2,depthWrite:false,side:THREE.DoubleSide}),
 flameM=new THREE.MeshBasicMaterial({color:0xffc060}),bulbM=new THREE.MeshBasicMaterial({color:0xfff1c9}),
 shadeM=new THREE.MeshStandardMaterial({color:0x7d3a1e,roughness:.38,metalness:.7,side:THREE.DoubleSide,envMapIntensity:1}),
 shadeIn=new THREE.MeshBasicMaterial({color:0xffcf8a,side:THREE.BackSide}),
 soil=M(0x2b1d14,1);
const blobMat=new THREE.MeshBasicMaterial({map:blobT,transparent:true,opacity:.55,depthWrite:false});
const blob=(x,z,r,o)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(r*2,r*2),blobMat);m.rotation.x=-PI/2;m.position.set(x,.008,z);S.add(m);return m};
const glowM=o=>new THREE.SpriteMaterial({map:glowT,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:o||.8});

/* ---------- room (14 x 14 x 3.6) ---------- */
const wall=(w,h,x,y,z,ry,m)=>{const o=new THREE.Mesh(new THREE.PlaneGeometry(w,h),m);o.position.set(x,y,z);o.rotation.y=ry;o.receiveShadow=true;S.add(o);return o};
const fl=new THREE.Mesh(new THREE.PlaneGeometry(14,14),new THREE.MeshStandardMaterial({map:FL.map,normalMap:FL.normalMap,normalScale:new THREE.Vector2(.8,.8),roughness:.5,metalness:.02,envMapIntensity:.9}));fl.rotation.x=-PI/2;fl.receiveShadow=true;S.add(fl);
/* rug */
{const rg=new THREE.Mesh(new THREE.PlaneGeometry(6.4,4),new THREE.MeshStandardMaterial({map:rugT.map,normalMap:rugT.normalMap,roughness:1}));rg.rotation.x=-PI/2;rg.position.set(.3,.004,-1.2);rg.receiveShadow=true;S.add(rg)}
/* ceiling + beams */
const ce=new THREE.Mesh(new THREE.PlaneGeometry(14,14),M(0x2e2118,.95));ce.rotation.x=PI/2;ce.position.y=3.6;S.add(ce);
const beamM=new THREE.MeshStandardMaterial({color:0x4a3322,map:OAK.map,normalMap:OAK.normalMap,roughness:.65});
for(let z=-6;z<=6;z+=3)add(S,Bx(14,.22,.28),beamM,0,3.49,z,false);
wall(14,3.6,0,1.8,-7,0,plaster);wall(14,3.6,0,1.8,7,PI,plaster);wall(14,3.6,-7,1.8,0,PI/2,plaster);
wall(14,3.6,7,1.8,0,-PI/2,new THREE.MeshStandardMaterial({map:BR.map,normalMap:BR.normalMap,normalScale:new THREE.Vector2(1.1,1.1),roughness:.88,envMapIntensity:.3}));
/* wainscot: shaker panels + cap rail + skirting on back/left/front walls */
const skirt=M(0x2a1d14,.5);
function wains(len,cx,cz,ry){const g=new THREE.Group();g.position.set(cx,0,cz);g.rotation.y=ry;S.add(g);
 add(g,Bx(len,1.05,.03),panelM,0,.525,.015,false);add(g,Bx(len,.1,.05),skirt,0,.05,.03,false);add(g,Bx(len,.05,.07),woodL,0,1.06,.035,false);
 const n=Math.floor(len/.9);for(let i=0;i<n;i++){const x=-len/2+(i+.5)*len/n,pw=len/n-.16;
  [[pw,.05,.03,0,.2],[pw,.05,.03,0,.9],[.05,.7,.03,-pw/2+.025,.55],[.05,.7,.03,pw/2-.025,.55]].forEach(a=>add(g,Bx(a[0],a[1],a[2]),panelM,x+a[3],a[4],.04,false))}
 return g}
wains(14,0,-7,0);wains(14,-7,0,PI/2);wains(14,0,7,PI);
add(S,Bx(.05,.12,14),skirt,6.96,.06,0,false);
/* windows with proper frames, sills, drapes */
const winMat=new THREE.MeshBasicMaterial({map:winT,toneMapped:false});
[-4.2,-.2,3.8].forEach(z=>{wall(2.4,1.9,-6.97,1.95,z,PI/2,winMat);
 [[.1,.1,2.5,0,.98,0],[.1,.1,2.5,0,-.98,0],[.1,1.96,.1,0,0,-1.25],[.1,1.96,.1,0,0,1.25],[.05,1.9,.05,0,0,0],[.05,.04,2.4,0,0,0],[.05,.04,2.4,0,.48,0],[.05,.04,2.4,0,-.48,0],[.05,1.9,.04,0,0,-.6],[.05,1.9,.04,0,0,.6]].forEach(a=>add(S,Bx(a[0],a[1],a[2]),M(0xe9e1d2,.5),-6.93+a[3],1.95+a[4],z+a[5],false));
 add(S,Bx(.24,.05,2.7),M(0xe9e1d2,.4),-6.84,.98,z,false);
 /* herbs on the sill */
 add(S,LP([[.001,0],[.045,0],[.055,.09],[.06,.1]],14),M(0xb8683a,.8),-6.84,1.01,z-.5,false);add(S,Cy(.05,.05,.01,12),soil,-6.84,1.105,z-.5,false);
 for(let k=0;k<7;k++){const lf=add(S,Sp(.035,8),M(pick([0x3f7d34,0x56933f]),.6),-6.84+rnd(-.02,.02),1.15+rnd(0,.07),z-.5+rnd(-.03,.03),false);lf.scale.set(1,.5,1)}
 [-1.45,1.45].forEach(s=>{const cg=new THREE.PlaneGeometry(.62,2.5,18,1),pa=cg.attributes.position;for(let i=0;i<pa.count;i++)pa.setZ(i,Math.sin(pa.getX(i)*34)*.045);cg.computeVertexNormals();
  const c=new THREE.Mesh(cg,new THREE.MeshStandardMaterial({color:0xe3d5b9,roughness:1,map:cloth.map,side:THREE.DoubleSide,transparent:true,opacity:.97}));c.position.set(-6.86,1.95,z+s*(s>0?.92:.92)*1.02);c.rotation.y=PI/2;c.castShadow=true;S.add(c)});
 add(S,Cy(.016,.016,3.3,8),brass,-6.82,3.2,z,false).rotation.x=PI/2});
/* back bar */
const counter=new THREE.Group();S.add(counter);
add(counter,Bx(6,1.1,.8),M(0x2c1d13,.55),-2,.55,-6.2);
for(let i=0;i<28;i++)add(counter,Bx(.1,.98,.03),M(0x4a3020,.5),-4.9+i*.2,.52,-5.78,false);
add(counter,new THREE.BoxGeometry(6.2,.05,.95),new THREE.MeshStandardMaterial({map:MB.map,normalMap:MB.normalMap,roughness:.18,envMapIntensity:1}),-2,1.125,-6.2);
add(counter,Bx(6.2,.04,.04),brass,-2,.12,-5.74,false);
for(let i=0;i<4;i++){const s=new THREE.Group();s.position.set(-4+i*1.3,0,-5.0);S.add(s);
 add(s,LP([[.001,.72],[.2,.72],[.215,.735],[.21,.77],[.17,.785],[.001,.79]],28),leather,0,0,0);add(s,Cy(.024,.03,.7,12),metal,0,.36,0);add(s,Cy(.17,.19,.025,24),metal,0,.012,0);add(s,new THREE.TorusGeometry(.14,.01,8,28),brass,0,.26,0).rotation.x=PI/2;blob(-4+i*1.3,-5,.4,.4)}
/* espresso machine */
{const g=new THREE.Group();g.position.set(-3.4,1.15,-6.25);S.add(g);add(g,Bx(.72,.4,.5),steel,0,.2,0);add(g,Bx(.74,.03,.52),metal,0,.41,0);add(g,Bx(.6,.025,.3),metal,0,.015,.2);
 [-.2,.2].forEach(x=>{add(g,Cy(.04,.04,.06,16),steel,x,.03,.27);add(g,Cy(.015,.015,.14,8),metal,x,.03,.34).rotation.x=PI/2;add(g,Bx(.012,.1,.012),metal,x+.12,.18,.32)});
 add(g,Cy(.05,.04,.07,16),ceramic,-.2,.45,0);add(g,Cy(.05,.04,.07,16),ceramic,-.05,.45,0);add(g,Bx(.5,.012,.4),steel,0,.15,.3,false);
 add(g,Cy(.09,.12,.3,20),metal,.55,.15,0);add(g,Cy(.1,.07,.12,20),glassM,.55,.36,0);
 for(let i=0;i<10;i++)add(g,Sp(.012,6),M(0x2a1a10,.4),.55+rnd(-.04,.04),.38+rnd(0,.04),rnd(-.04,.04),false)}
/* shelves, bottles, jars, books */
const bottleG=geo('bot',()=>LP([[.001,0],[.04,0],[.045,.02],[.045,.16],[.03,.2],[.015,.24],[.016,.29],[.02,.295],[.001,.295]],14));
[1.9,2.5].forEach((y,j)=>{add(S,Bx(5.6,.045,.3),woodL,-2,y,-6.8,false);add(S,Bx(.04,.18,.26),brass,-4.7,y-.12,-6.8,false);add(S,Bx(.04,.18,.26),brass,.7,y-.12,-6.8,false);
 for(let i=0;i<14;i++){const x=-4.65+i*.38+rnd(-.03,.03);if(j==0&&i%5==4){for(let k=0;k<4;k++)add(S,Bx(.04,.2+rnd(0,.08),.17),M(pick([0x8a2b24,0x27415f,0xc9a05a,0x2f4a3b,0xe9dcc2]),.7),x-.05+k*.045,y+.12+(k%2)*.01,-6.8,false);continue}
  const col=pick([0x3f6b4a,0x6b4a2a,0x1e3a5a,0x9a5a2a,0xe9dcc2]),m=new THREE.MeshPhysicalMaterial({color:col,roughness:.12,clearcoat:1,transparent:true,opacity:.88,envMapIntensity:1.5});
  add(S,bottleG,m,x,y+.02,-6.8+rnd(-.03,.03),false).scale.setScalar(.8+rnd(0,.5));add(S,Cy(.04,.04,.075,12),M(0xe9dcc2,.6),x+.0,y+.06,-6.8,false).scale.set(.5,.3,.5)}});
const sign=new THREE.Mesh(new THREE.PlaneGeometry(3,.75),new THREE.MeshBasicMaterial({map:signT,transparent:true,toneMapped:false}));sign.position.set(-2,3.1,-6.93);S.add(sign);
/* framed art */
[[3.2,0],[4.4,1],[5.6,2]].forEach(([x,n])=>{add(S,Bx(.82,1.02,.05),woodL,x,2,-6.95,false);add(S,Bx(.74,.94,.01),M(0xf1e8d6,.9),x,2,-6.92,false);add(S,new THREE.PlaneGeometry(.58,.78),new THREE.MeshStandardMaterial({map:artT(n),roughness:.8}),x,2,-6.91,false)});
/* plants: alpha-cut leaf cards, terracotta lathe pots */
const potG=geo('pot',()=>LP([[.001,0],[.14,0],[.19,.35],[.215,.36],[.215,.4],[.19,.4],[.19,.37],[.001,.37]],28));
const potM=new THREE.MeshStandardMaterial({color:0xb4623a,roughness:.85,map:PL.map,envMapIntensity:.3,side:THREE.DoubleSide});
const leafM=new THREE.MeshStandardMaterial({map:leafT,alphaTest:.5,side:THREE.DoubleSide,roughness:.55,envMapIntensity:.4});
const leafG=geo('leaf',()=>{const g=new THREE.PlaneGeometry(.16,.34);g.translate(0,.17,0);return g});
[[-6.3,-6.2],[6.3,-6.2],[6.4,5.5],[-6.4,5.8],[5.5,-6.3]].forEach(([x,z],pi)=>{add(S,potG,potM,x,0,z);add(S,Cy(.19,.19,.01,16),soil,x,.385,z,false);blob(x,z,.75,.6);
 const rr=mulberry(pi+3);for(let i=0;i<46;i++){const a=rr()*PI*2,tilt=.25+rr()*.9,sc=.9+rr()*1.0,lf=new THREE.Mesh(leafG,leafM);lf.position.set(x+Math.cos(a)*.04,.4+rr()*.18,z+Math.sin(a)*.04);lf.rotation.set(0,-a+PI/2,0);lf.rotateX(tilt);lf.scale.setScalar(sc);lf.castShadow=true;S.add(lf)}});
/* chalkboard */
add(S,Bx(1.34,1.64,.05),woodL,1.9,2.25,-6.95,false);add(S,new THREE.PlaneGeometry(1.2,1.5),new THREE.MeshStandardMaterial({map:chalkT,roughness:.95}),1.9,2.25,-6.92,false);
/* pastry case */
{const g=new THREE.Group();g.position.set(.2,1.15,-6.2);S.add(g);add(g,Bx(1.3,.04,.55),metal,0,0,0,false);
 [.14,.3].forEach((y,j)=>{add(g,Bx(1.2,.012,.45),glassM,0,y,0,false);
  for(let i=0;i<5;i++){const x=-.48+i*.24;
   if(j==0){add(g,Cy(.075,.075,.05,24),M(0xf1e2c4,.5),x,.04,0);add(g,Cy(.075,.075,.012,24),M(0x4a2a1c,.4),x,.07,0);add(g,Cy(.075,.075,.045,24),M(0xf1e2c4,.5),x,.1,0);add(g,Cy(.075,.075,.01,24),M(0xc2402a,.35),x,.127,0);add(g,Sp(.014,8),M(0xa02020,.3),x,.14,0,false)}
   else{const c=add(g,new THREE.TorusGeometry(.04,.02,10,18,PI*1.3),M(0xc98a3d,.5),x,.34,0);c.rotation.set(-PI/2,0,i*.4);c.scale.set(1,1,1.1);add(g,new THREE.TorusGeometry(.025,.014,8,14,PI),M(0xc98a3d,.5),x,.33,.12).rotation.x=PI/2}}});
 add(g,Bx(1.3,.012,.55),glassM,0,.42,0,false);[-.65,.65].forEach(x=>add(g,Bx(.012,.42,.55),glassM,x,.21,0,false));add(g,Bx(1.3,.012,.012),brass,0,.42,.275,false)}
/* a few cups + saucers on the bar */
const cupG=geo('cup',()=>LP([[.001,0],[.025,0],[.03,.004],[.048,.06],[.05,.07],[.047,.07],[.028,.014],[.001,.012]],24)),saucG=geo('sauc',()=>LP([[.001,0],[.045,0],[.07,.012],[.075,.016],[.072,.016],[.045,.006],[.001,.005]],24)),handleG=geo('hand',()=>new THREE.TorusGeometry(.018,.005,8,14,PI*1.5));
for(let i=0;i<4;i++){const x=-1.6+i*.35;add(S,saucG,ceramic,x,1.15,-6.0);add(S,cupG,ceramic,x,1.162,-6.0);const h=add(S,handleG,ceramic,x+.05,1.19,-6.0);h.rotation.z=-PI*.75}
blob(-2,-6,3.2,.35);
/* wall sconces on brick */
[-4,-1,2,5].forEach(z=>{add(S,Bx(.04,.2,.06),brass,6.96,2.3,z);add(S,Cy(.012,.012,.14,6),brass,6.88,2.3,z).rotation.z=PI/2;add(S,LP([[.03,.18],[.06,.12],[.1,.04],[.12,0]],20),shadeM,6.7,2.3,z,false);add(S,Sp(.04),bulbM,6.74,2.3,z,false);const g=new THREE.Sprite(glowM(.55));g.scale.set(.7,.7,1);g.position.set(6.7,2.3,z);S.add(g)});
/* sun beams + dust */
const BD=new THREE.Vector3(1,-.62,-.2).normalize(),BX=new THREE.Vector3(0,0,1),BZ=new THREE.Vector3().crossVectors(BX,BD).normalize(),BM=new THREE.Matrix4().makeBasis(BX,BD,BZ);
[-4.2,-.2,3.8].forEach(z=>[0,1].forEach(j=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(2.2-j*.7,4.5),new THREE.MeshBasicMaterial({map:beamT,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:.4-j*.15,side:THREE.DoubleSide,fog:false}));m.setRotationFromMatrix(BM);m.position.set(-6.8+BD.x*2.25,2.4+BD.y*2.25,z+BD.z*2.25);S.add(m)}));
const DN=140,dg=new THREE.BufferGeometry(),dp=new Float32Array(DN*3);for(let i=0;i<DN;i++){dp[i*3]=rnd(-6.5,-1);dp[i*3+1]=rnd(.3,2.8);dp[i*3+2]=rnd(-6,6)}
dg.setAttribute('position',new THREE.BufferAttribute(dp,3));S.add(new THREE.Points(dg,new THREE.PointsMaterial({map:glowT,size:.05,transparent:true,opacity:.55,blending:THREE.AdditiveBlending,depthWrite:false})));

/* ---------- lights ---------- */
S.add(new THREE.HemisphereLight(0xffeedd,0x4a3624,.36));
const sun=new THREE.DirectionalLight(0xffd9a0,1.15);sun.position.set(-9,6,2);sun.castShadow=true;sun.shadow.mapSize.set(mobile?1024:4096,mobile?1024:4096);
Object.assign(sun.shadow.camera,{left:-8,right:8,top:8,bottom:-8,near:1,far:24});sun.shadow.bias=-.0004;sun.shadow.normalBias=.02;S.add(sun);
const pendG=geo('pend',()=>LP([[.035,.27],[.05,.25],[.09,.2],[.17,.11],[.25,.04],[.285,0]],36)),pendGi=geo('pendi',()=>LP([[.03,.265],[.045,.245],[.085,.195],[.163,.108],[.24,.04],[.273,.004]],36));
function pendant(x,z){add(S,Cy(.004,.004,1.3,6),metal,x,2.95,z,false);add(S,Cy(.04,.05,.04,12),metal,x,3.6,z,false);add(S,pendG,shadeM,x,1.95,z,false);add(S,pendGi,shadeIn,x,1.95,z,false);add(S,Cy(.03,.03,.04,10),brass,x,2.16,z,false);add(S,Sp(.045,14),bulbM,x,2.02,z,false);
 const s=new THREE.Sprite(glowM(.45));s.scale.set(.7,.7,1);s.position.set(x,1.98,z);S.add(s);
 const L=new THREE.SpotLight(0xffc98a,1.7,6.5,.95,.75,1.4);L.position.set(x,1.96,z);L.target.position.set(x,.75,z);S.add(L,L.target);
 const pool=new THREE.Mesh(new THREE.PlaneGeometry(2.4,2.4),new THREE.MeshBasicMaterial({map:glowT,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:.08}));pool.rotation.x=-PI/2;pool.position.set(x,.012,z);S.add(pool)}

/* ---------- furniture ---------- */
const rail=(r,y,a0,a1,tr,n=14)=>{const p=[];for(let i=0;i<=n;i++){const th=PI+a0+(a1-a0)*i/n;p.push([r*Math.sin(th),y,r*Math.cos(th)])}return tube(p,tr,24,8)};
const chSeat=geo('chs',()=>LP([[.001,0],[.19,0],[.205,.006],[.208,.022],[.2,.032],[.001,.032]],32)),chCush=geo('chc',()=>LP([[.001,0],[.17,0],[.186,.012],[.18,.028],[.12,.036],[.001,.038]],32)),
 chLeg=geo('chl',()=>new THREE.CylinderGeometry(.017,.011,.43,10)),chPost=geo('chp',()=>new THREE.CylinderGeometry(.013,.016,.4,10)),
 chTop=geo('cht',()=>rail(.205,.82,-.76,.76,.016)),chLow=geo('chlo',()=>rail(.205,.66,-.76,.76,.012)),chSp=geo('chsp',()=>new THREE.CylinderGeometry(.007,.007,.16,6)),
 chRing=geo('chr',()=>new THREE.TorusGeometry(.15,.008,6,32));
function chair(){const g=new THREE.Group();add(g,chSeat,chairW,0,.43,0);add(g,chCush,leather,0,.462,0);
 [[-1,1],[1,1]].forEach(([a,b])=>{const l=add(g,chLeg,chairW,a*.14,.215,b*.14);l.rotation.z=-a*.07;l.rotation.x=b*.07});
 [-1,1].forEach(a=>{const p=add(g,chPost,chairW,a*.146,.62,-.15);p.rotation.x=-.1;p.rotation.z=-a*.03;const l=add(g,chLeg,chairW,a*.145,.215,-.145);l.rotation.z=-a*.06;l.rotation.x=-.06});
 add(g,chTop,chairW,0,0,0);add(g,chLow,chairW,0,0,0);[-.33,0,.33].forEach(k=>{const th=PI+k,s=add(g,chSp,chairW,.205*Math.sin(th),.74,.205*Math.cos(th));s.rotation.y=0});
 add(g,chRing,chairW,0,.2,0).rotation.x=PI/2;
 const bl=new THREE.Mesh(new THREE.PlaneGeometry(1.0,1.0),blobMat);bl.rotation.x=-PI/2;bl.position.y=.006;g.add(bl);return g}
/* tableware (shared geometry) */
const plateG=geo('plate',()=>LP([[.001,0],[.075,0],[.078,.004],[.12,.02],[.15,.032],[.153,.036],[.149,.036],[.115,.026],[.075,.012],[.001,.01]],40)),
 tglassG=geo('tg',()=>LP([[.001,0],[.026,0],[.03,.004],[.038,.1],[.037,.105],[.034,.1],[.025,.008],[.001,.007]],24)),
 waterG=geo('wat',()=>LP([[.001,.008],[.024,.008],[.034,.07],[.001,.07]],20)),
 vaseG=geo('vase',()=>LP([[.001,0],[.04,0],[.06,.05],[.04,.12],[.03,.16],[.036,.17],[.032,.17],[.026,.16],[.036,.12],[.056,.05],[.037,.004],[.001,.004]],24)),
 candG=geo('cand',()=>LP([[.001,0],[.03,0],[.034,.004],[.036,.045],[.033,.047],[.03,.006],[.001,.005]],20)),
 shakerG=geo('shk',()=>LP([[.001,0],[.02,0],[.024,.01],[.02,.05],[.014,.062],[.001,.066]],16)),
 petalG=geo('pet',()=>{const s=new THREE.SphereGeometry(.014,8,6);s.scale(1,.45,1.5);s.translate(0,0,.016);return s}),
 coffeeG=geo('cof',()=>new THREE.CylinderGeometry(.042,.042,.002,20)),
 sesameG=geo('ses',()=>{const s=new THREE.SphereGeometry(.004,5,4);s.scale(1,.5,1.6);return s}),
 pepG=geo('pep',()=>new THREE.CylinderGeometry(.03,.03,.004,14)),
 cheeseG=geo('chz',()=>new THREE.BoxGeometry(.11,.004,.11));
const pastaTubes=geo('pasta',()=>{const r=mulberry(11),a=[];for(let i=0;i<26;i++){const p=[];let ang=r()*7,rad=.01+r()*.06,y=.014+r()*.02;for(let k=0;k<8;k++){ang+=.7+r()*.7;rad=clamp(rad+(r()-.5)*.05,.012,.085);y+=r()*.008;p.push([Math.cos(ang)*rad,y+(k%2)*.006,Math.sin(ang)*rad])}a.push(tube(p,.0034,22,5))}return a});
const pastaM=new THREE.MeshStandardMaterial({color:0xefd79b,roughness:.38,envMapIntensity:.6}),
 breadM=new THREE.MeshStandardMaterial({color:0xcf8d3c,roughness:.5,envMapIntensity:.5}),
 pattyM=M(0x4a2b19,.7),cheeseM=M(0xf0a82a,.35),lettM=M(0x5da33f,.5),tomM=M(0xc23a2a,.35),
 pizzaM=M(0xefc46a,.5),crustM=M(0xc98a45,.7),pepM=M(0xa5301f,.45),basilM=M(0x2f7a2c,.5),coffeeM=M(0x3a2214,.2),foamM=M(0xe8d2ae,.8),
 waterM=new THREE.MeshStandardMaterial({color:0xcfe6f4,roughness:.05,transparent:true,opacity:.25,depthWrite:false});
function food(p,kind){
 if(kind==0){pastaTubes.forEach(gm=>add(p,gm,pastaM,0,0,0,false));for(let i=0;i<14;i++)add(p,Sp(.003,4),M(0x1a1410,.9),rnd(-.05,.05),.05+rnd(0,.01),rnd(-.05,.05),false);
  const b=add(p,Sp(.022,10),basilM,.02,.058,.01,false);b.scale.set(1.2,.25,.8);b.rotation.y=.6;const b2=add(p,Sp(.018,10),basilM,-.012,.05,.02,false);b2.scale.set(1.1,.25,.7);b2.rotation.y=-.5}
 else if(kind==1){add(p,LP([[.001,.012],[.07,.012],[.08,.03],[.075,.042],[.001,.042]],24),breadM,0,0,0,false);add(p,Cy(.074,.074,.026,24),pattyM,0,.056,0,false);const c=add(p,cheeseG,cheeseM,0,.074,0,false);c.rotation.y=.8;
  const lt=add(p,new THREE.TorusGeometry(.07,.014,8,24),lettM,0,.082,0,false);lt.rotation.x=PI/2;lt.scale.set(1,1,.5);add(p,Cy(.068,.068,.014,22),tomM,0,.094,0,false);
  const top=add(p,new THREE.SphereGeometry(.082,24,12,0,PI*2,0,PI/2),breadM,0,.1,0,false);top.scale.y=.7;const rr=mulberry(5);for(let i=0;i<26;i++){const th=rr()*PI*2,ph=rr()*1.15,s=add(p,sesameG,M(0xf1e2bd,.5),.082*Math.sin(ph)*Math.cos(th),.1+.082*.7*Math.cos(ph),.082*Math.sin(ph)*Math.sin(th),false);s.rotation.y=-th;s.rotation.z=ph}}
 else{add(p,Cy(.122,.122,.014,32),crustM,0,.02,0,false);add(p,Cy(.108,.108,.006,32),pizzaM,0,.027,0,false);const rr=mulberry(9);for(let i=0;i<9;i++){const a=i*2.4,d=.02+rr()*.075;add(p,pepG,pepM,Math.cos(a)*d,.032,Math.sin(a)*d,false)}for(let i=0;i<4;i++){const b=add(p,Sp(.01,6),basilM,rnd(-.06,.06),.035,rnd(-.06,.06),false);b.scale.set(1.2,.2,.8)}
  add(p,new THREE.TorusGeometry(.115,.01,6,36),crustM,0,.03,0,false).rotation.x=PI/2}}
function coffee(g,x,z,ry,latte){const q=new THREE.Group();q.position.set(x,.775,z);q.rotation.y=ry;g.add(q);add(q,saucG,ceramic,0,0,0);add(q,cupG,ceramic,0,.012,0);const h=add(q,handleG,ceramic,.05,.045,0);h.rotation.z=-PI*.75;add(q,coffeeG,latte?foamM:coffeeM,0,.074,0,false);return q}
function napkin(g,a,rr){const q=new THREE.Group();q.position.set(Math.sin(a)*.34,.777,Math.cos(a)*.34);q.rotation.y=a+PI+.05;g.add(q);
 add(q,Bx(.12,.005,.1),linen,-.14,.0,0,false);add(q,Bx(.01,.003,.17),steel,-.2,.006,-.02,false);add(q,Bx(.01,.003,.09),steel,-.17,.006,.01,false);add(q,Bx(.01,.003,.14),steel,.12,.006,0,false);return q}
const reservedTex={};
function tent(label){const t=reservedTex[label]||(reservedTex[label]=tex(256,160,(g,w,h)=>{g.fillStyle='#f4efe6';g.fillRect(0,0,w,h);g.strokeStyle='#b8431f';g.lineWidth=5;g.strokeRect(8,8,w-16,h-16);g.fillStyle='#b8431f';g.textAlign='center';g.font='600 38px Georgia,serif';g.fillText('RESERVED',w/2,70);g.fillStyle='#3b2a1e';g.font='30px Georgia,serif';g.fillText(label,w/2,116)}));
 const m=new THREE.Mesh(new THREE.PlaneGeometry(.17,.106),new THREE.MeshStandardMaterial({map:t,roughness:.8,side:THREE.DoubleSide}));m.rotation.x=-.25;m.castShadow=true;return m}
function flowers(g,x,z,seed){const q=new THREE.Group();q.position.set(x,.775,z);g.add(q);const rr=mulberry(seed);add(q,vaseG,glassM,0,0,0,false);add(q,Cy(.036,.036,.07,16),waterM,0,.04,0,false);
 for(let i=0;i<7;i++){const a=i*.9,lean=.05+rr()*.07,top=[Math.cos(a)*lean,.17+rr()*.11,Math.sin(a)*lean];add(q,tube([[0,.02,0],[top[0]*.4,.09,top[2]*.4],top],.0025,8,4),basilM,0,0,0,false);
  const cols=[0xf4eadb,0xf0b090,0xe8806a,0xf4eadb,0xf2c24e],bc=cols[i%5],hd=new THREE.Group();hd.position.set(...top);q.add(hd);for(let k=0;k<7;k++){const pt=add(hd,petalG,M(bc,.7),0,0,0,false);pt.rotation.y=k*PI*2/7;pt.rotation.x=-.5}add(hd,Sp(.008,6),M(0xd9a23a,.6),0,.004,0,false)}
 for(let i=0;i<5;i++){const lf=add(q,Sp(.02,6),basilM,Math.cos(i*1.3)*.03,.14+i*.02,Math.sin(i*1.3)*.03,false);lf.scale.set(1.3,.2,.8);lf.rotation.y=i}}
function candle(g,x,z,lit,st){const q=new THREE.Group();q.position.set(x,.775,z);g.add(q);add(q,candG,glassM,0,0,0,false);add(q,Cy(.026,.026,.012,16),M(0xf4efe6,.6),0,.012,0,false);
 if(lit){const fl=add(q,new THREE.SphereGeometry(.007,8,6),flameM,0,.03,0,false);fl.scale.set(.8,2,.8);const s=new THREE.Sprite(glowM(.7));s.scale.set(.28,.28,1);s.position.y=.04;q.add(s)}}
const steamT=tex(64,64,g=>{const r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,255,255,.55)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,64,64)});
const jacketM=new THREE.MeshStandardMaterial({color:0x2f3a33,roughness:.95,side:THREE.DoubleSide,map:cloth.map,normalMap:cloth.normalMap});
function jacket(c){const gm=new THREE.PlaneGeometry(.42,.5,10,14),pa=gm.attributes.position;for(let i=0;i<pa.count;i++){const x=pa.getX(i),y=pa.getY(i),t=(y+.25)/.5;pa.setZ(i,Math.sin(x*18+y*5)*.018+(t<.45?.03*(.45-t)*6:0));}gm.computeVertexNormals();
 const j=new THREE.Mesh(gm,jacketM);j.position.set(0,.76,-.225);j.rotation.x=-.06;j.castShadow=true;c.add(j);const j2=new THREE.Mesh(gm,jacketM);j2.position.set(0,.76,-.185);j2.castShadow=true;c.add(j2);add(c,Bx(.42,.014,.06),jacketM,0,.455,-.205,false)}
function bag(g,x,z,col){const b=add(g,Sp(.13,16),M(col,.55),x,.14,z);b.scale.set(1.15,.85,.55);b.rotation.y=.5;const h=add(g,new THREE.TorusGeometry(.07,.01,6,16,PI),M(0x2a1c12,.6),x,.22,z);h.rotation.y=.5;blob(g.position.x+x,g.position.z+z,.28,.5)}

function dress(t){const g=t.dyn;while(g.children.length)g.remove(g.children[0]);t.steam=[];
 const f=isFree(t),occ=!f&&st.slot==0,res=!f&&!occ,A=t.s==4?[0,1,2,3].map(i=>i*PI/2+PI/4):[PI/2,3*PI/2],rr=mulberry(t.n*977+st.slot*31+7);
 A.forEach((a,i)=>{const r=occ?.74+rr()*.14:.6,c=chair();c.position.set(Math.sin(a)*r,0,Math.cos(a)*r);c.rotation.y=a+PI+(occ?(rr()-.5)*.35:0);g.add(c);
  
  napkin(g,a,rr);
  const gl=new THREE.Group();gl.position.set(Math.sin(a-.45)*.34,.775,Math.cos(a-.45)*.34);g.add(gl);add(gl,tglassG,glassM,0,0,0,false);if(occ||rr()>.4)add(gl,waterG,waterM,0,0,0,false);
  if(occ){const p=new THREE.Group();p.position.set(Math.sin(a)*.2,.775,Math.cos(a)*.2);p.rotation.y=rr()*6;g.add(p);add(p,plateG,ceramic,0,0,0);food(p,(t.n+i)%3);
   if(i%2==0){const q=coffee(g,Math.sin(a+.7)*.38,Math.cos(a+.7)*.38,a,i==0);const s=new THREE.Sprite(new THREE.SpriteMaterial({map:steamT,transparent:true,opacity:.35,depthWrite:false}));s.scale.set(.1,.14,1);s.position.set(q.position.x,.9,q.position.z);g.add(s);t.steam.push({s,x:s.position.x,z:s.position.z,o:rr()*6})}}});
 if(f){flowers(g,0,0,t.n*13);const m=add(g,Bx(.07,.1,.006),M(0xf4efe6,.8),.19,.825,.02);m.rotation.x=-.2;m.rotation.y=-.4;add(g,Bx(.07,.02,.03),woodL,.19,.785,.02,false);[-.16,-.2].forEach((x,k)=>add(g,shakerG,k?M(0xf4efe6,.2):glassM,x*.9,.775,-.13*(k?1:-1),false))}
 else if(occ){candle(g,0,0,true);[[.08,.1],[.11,.05]].forEach((q,k)=>add(g,shakerG,glassM,q[0],.775,q[1],false));add(g,Bx(.07,.008,.145),M(0x151518,.2,.3),-.14,.779,.12).rotation.y=.4;
  if(t.n%2)bag(g,A.length>2?-.95:-.7,.5,0x8a4a28);add(g,Sp(.01,6),flameM,0,-9,0,false)}
 else{const c=tent(SLOTS[st.slot]);c.position.set(0,.835,0);g.add(c);add(g,Bx(.18,.012,.05),M(0xf4efe6,.7),0,.78,.03,false);candle(g,.2,.1,false);add(g,shakerG,glassM,-.2,.775,.1,false)}}

/* ---------- tables ---------- */
const topG=geo('top',()=>new THREE.CylinderGeometry(.56,.56,.04,64)),tedge=geo('tedge',()=>new THREE.TorusGeometry(.56,.012,10,64)),
 apron=geo('apr',()=>Cy(.42,.38,.07,32)),
 pedG=geo('ped',()=>LP([[.001,0],[.3,0],[.335,.012],[.34,.03],[.3,.05],[.1,.07],[.06,.1],[.052,.14],[.05,.2],[.07,.215],[.05,.23],[.046,.3],[.046,.55],[.06,.575],[.05,.6],[.08,.66],[.2,.7],[.001,.7]],40));
TB.forEach(t=>{t.x=(t.plan[0]-50)*.12;t.z=(t.plan[1]-50)*.1;t.p3=new THREE.Vector3(t.x,.8,t.z);
 const g=new THREE.Group();g.position.set(t.x,0,t.z);S.add(g);
 add(g,topG,[edgeM,topM,edgeM],0,.76,0);add(g,tedge,edgeM,0,.78,0).rotation.x=PI/2;add(g,tedge,edgeM,0,.74,0).rotation.x=PI/2;add(g,apron,edgeM,0,.7,0);
 add(g,pedG,metal,0,0,0);blob(t.x,t.z,1.15,.6);
 t.dyn=new THREE.Group();g.add(t.dyn);pendant(t.x,t.z);
 const l=document.createElement('div');l.className='tl';l.innerHTML='<i></i><span></span>';l.style.opacity=0;l.style.pointerEvents='none';view.appendChild(l);t.l=l});

/* ---------- UI (filters, mini-map, card) ---------- */
const ops=document.createElement('div');ops.id='opts';ST.querySelector('.stage').appendChild(ops);
const st={slot:0,seats:0,free:false};
ops.innerHTML=`<div>${SLOTS.map((s,i)=>`<button data-k="slot" data-v="${i}">${s}</button>`).join('')}</div><div><button data-k="seats" data-v="0">Any size</button><button data-k="seats" data-v="2">2 seats</button><button data-k="seats" data-v="4">4 seats</button><button data-k="free" data-v="1">Free only</button></div>`;
const isFree=t=>!BOOKED[st.slot].includes(t.n);
const stat=t=>isFree(t)?'Free':(st.slot==0?'Occupied now':'Reserved');
let W=0,H=0,list=[],wp=[],shown=-2;
const V=(x,y,z)=>new THREE.Vector3(x,y,z),over={p:V(0,3.1,6.8),l:V(0,.9,-2.5)};
function pose(t){const back=W<H?3.6:2.7;return{p:V(t.x*.5,1.7,Math.min(t.z+back,6.8)),l:V(t.x,.8,t.z)}}
function rebuild(){list=TB.filter(t=>(!st.seats||t.s==st.seats)&&(!st.free||isFree(t)));wp=[over].concat(list.map(pose));
 TB.forEach(t=>{const f=isFree(t),on=list.includes(t);t.on=on;dress(t);t.l.className='tl '+(f?'free':'bkd')+(on?'':' dim');t.l.querySelector('span').textContent=`Table ${t.n} · ${stat(t)}`;if(t.m)t.m.className=(f?'free':'bkd')+(on?'':' dim')});
 shown=-2;ops.querySelectorAll('button').forEach(b=>{const k=b.dataset.k,v=+b.dataset.v;b.classList.toggle('on',k=='free'?st.free:st[k]==v)})}
function size(){W=view.clientWidth;H=view.clientHeight;R.setSize(W,H,false);C.aspect=W/H;C.fov=W<H?68:50;C.updateProjectionMatrix();rebuild();meas()}
TB.forEach(t=>{const b=document.createElement('div');b.textContent=t.n;b.style.left=t.plan[0]+'%';b.style.top=t.plan[1]+'%';b.onclick=()=>{const i=list.indexOf(t)+1;if(i)scrollTo({top:ST.offsetTop+(i/(wp.length-1))*(ST.offsetHeight-ST.querySelector('.stage').offsetHeight),behavior:'smooth'})};map.appendChild(b);t.m=b});
ops.onclick=e=>{const b=e.target.closest('button');if(!b)return;const k=b.dataset.k,v=+b.dataset.v;if(k=='free')st.free=!st.free;else st[k]=v;rebuild()};
const sel=document.getElementById('tsel');if(sel)sel.innerHTML=TB.map(t=>`<option value="${t.n}">Table ${t.n} · ${t.s} seats · ${t.w}</option>`).join('');
card.addEventListener('click',e=>{const b=e.target.closest('[data-t]');if(b){if(sel)sel.value=b.dataset.t;const ts=document.getElementById('tslot');if(ts)ts.value=st.slot;document.getElementById('book').scrollIntoView({behavior:'smooth'})}});
function show(i){if(i===shown)return;shown=i;TB.forEach(t=>t.m.classList.remove('cur'));if(i>0)list[i-1].m.classList.add('cur');
 if(i<1){card.classList.remove('on');return}const t=list[i-1],f=isFree(t);
 card.innerHTML=`<h2>Table ${t.n}</h2><span class="st ${f?'free':'bkd'}">${stat(t)} · ${SLOTS[st.slot]}</span><p>${t.s} seats · ${t.w}</p>`+(f?`<button class="btn" data-t="${t.n}">Reserve this table</button>`:`<p style="margin-top:8px">${st.slot==0?'Guests are dining here right now.':'Reserved for this time.'} Try another slot or keep scrolling.</p>`);card.classList.add('on')}

/* ---------- scroll-driven camera ---------- */
let cur=0,tgt=0,vis=true;
function meas(){const r=ST.getBoundingClientRect();tgt=clamp(-r.top/(ST.offsetHeight-ST.querySelector('.stage').offsetHeight),0,1)}
addEventListener('scroll',meas,{passive:true});let lw=innerWidth;addEventListener('resize',()=>{if(innerWidth!==lw){lw=innerWidth;size()}else meas()});
new IntersectionObserver(e=>vis=e[0].isIntersecting).observe(ST);
const ease=t=>t*t*(3-2*t),L=V(0,0,0),P=V(0,0,0);
size();
{const rt=new THREE.WebGLCubeRenderTarget(256,{format:THREE.RGBAFormat,generateMipmaps:true,minFilter:THREE.LinearMipmapLinearFilter}),cc=new THREE.CubeCamera(.1,40,rt);cc.position.set(0,1.6,0);cc.update(R,S);S.environment=new THREE.PMREMGenerator(R).fromCubemap(rt.texture).texture}
(function loop(tm){requestAnimationFrame(loop);if(!vis)return;tm/=1000;cur+=(tgt-cur)*.08;
 const N=Math.max(1,wp.length-1),u=cur*N,i=Math.min(N-1,Math.floor(u)),f=u-i,k=ease(clamp((f-.4)/.6,0,1)),a=wp[i],b=wp[Math.min(wp.length-1,i+1)];
 C.position.lerpVectors(a.p,b.p,k);L.lerpVectors(a.l,b.l,k);C.position.x+=Math.sin(tm*.4)*.02;C.position.y+=Math.sin(tm*.6)*.015;C.lookAt(L);
 for(let i=0;i<DN;i++){dp[i*3+1]+=Math.sin(tm*.7+i)*.0007;dp[i*3]+=.0006;if(dp[i*3]>-1)dp[i*3]=-6.5}dg.attributes.position.needsUpdate=true;
 TB.forEach(t=>t.steam&&t.steam.forEach(q=>{const ph=(tm*.35+q.o)%1;q.s.position.y=.87+ph*.14;q.s.position.x=q.x+Math.sin(tm*2+q.o)*.008;q.s.material.opacity=.32*Math.sin(ph*PI);q.s.scale.set(.06+ph*.08,.09+ph*.1,1)}));
 R.render(S,C);
 TB.forEach(t=>{P.set(t.x,1.55,t.z).project(C);const on=P.z<1&&Math.abs(P.x)<1.1&&Math.abs(P.y)<1.1,d=C.position.distanceTo(t.p3);
  t.l.style.opacity=on?(t.on?clamp(1.7-d/4,.15,1):.1):0;t.l.style.left=(P.x*.5+.5)*W+'px';t.l.style.top=(-P.y*.5+.5)*H+'px'});
 const o=Math.max(0,1-u/.4);intro.style.opacity=o;intro.style.visibility=o?'visible':'hidden';
 const near=f<.4?i:(f>.9?i+1:-1);show(u<.3||wp.length<2?0:(near<0?shown:near))
})(0);
})();
