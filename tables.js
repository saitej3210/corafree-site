(function(){
const ST=document.getElementById('tables'),world=document.getElementById('world'),card=document.getElementById('tcard'),intro=document.getElementById('tintro'),map=document.getElementById('map');
const FY=130,W=1400,D=1600;
const TB=[{n:1,x:-380,z:-350,s:2,w:'Window side',f:1},{n:2,x:330,z:-420,s:4,w:'Centre',f:0},{n:3,x:-340,z:-750,s:2,w:'Near the terracotta wall',f:1},{n:4,x:360,z:-800,s:4,w:'Window side',f:1},{n:5,x:-300,z:-1120,s:4,w:'Back corner',f:0},{n:6,x:330,z:-1150,s:2,w:'Window side',f:1}];
const bbs=[];
function mk(parent,cls,css,html){const e=document.createElement('div');e.className=cls;e.style.cssText=css||'';if(html)e.innerHTML=html;parent.appendChild(e);return e}
const q=(w,h,tr,bg,extra)=>`width:${w}px;height:${h}px;transform:${tr};background:${bg};${extra||''}`;
const disc=(p,d,y,bg,extra)=>mk(p,'a disc',q(d,d,`translate3d(${-d/2}px,${y-d/2}px,0) rotateX(90deg)`,bg,extra));
// room
mk(world,'a fl',q(W,D,`translate3d(${-W/2}px,${FY}px,${-1400}px) rotateX(90deg)`,'')).style.transformOrigin='0 0';
mk(world,'a wl',q(W,D,`translate3d(${-W/2}px,${FY-430}px,${-1400}px) rotateX(90deg)`,'#e3d5c0')).style.transformOrigin='0 0';
mk(world,'a bk',q(W,430,`translate3d(${-W/2}px,${FY-430}px,-1400px)`,'')).style.transformOrigin='0 0';
const L=mk(world,'a wl',q(D,430,`translate3d(${-W/2}px,${FY-430}px,200px) rotateY(90deg)`,''));L.style.transformOrigin='0 0';
const R=mk(world,'a wl',q(D,430,`translate3d(${W/2}px,${FY-430}px,-1400px) rotateY(-90deg)`,''));R.style.transformOrigin='0 0';
[[-1250,.1],[-850,.35],[-450,.6],[-50,.85]].forEach(([z])=>{const w=mk(world,'a win',q(260,230,`translate3d(${W/2-2}px,${FY-340}px,${z-130}px) rotateY(-90deg)`,''));w.style.transformOrigin='0 0';
 const w2=mk(world,'a win',q(260,230,`translate3d(${-W/2+2}px,${FY-340}px,${z+130}px) rotateY(90deg)`,''));w2.style.transformOrigin='0 0';});
[-300,300].forEach(x=>mk(world,'a',q(220,14,`translate3d(${x-110}px,${FY-250}px,-1398px)`,'#e9d9c0','box-shadow:0 0 14px #ffcf8a')));
// tables
TB.forEach(t=>{
 const g=mk(world,'a',`transform:translate3d(${t.x}px,${FY}px,${t.z}px)`);t.g=g;
 disc(g,170,-1,'rgba(0,0,0,.28)','filter:blur(6px)');
 [0,90].forEach(r=>mk(g,'a',q(16,74,`translate3d(-8px,-75px,0) rotateY(${r}deg)`,'#5a3a26')));
 disc(g,130,-75,'radial-gradient(#fffaf0,#e8dcc8)','border:3px solid #cdbca1');
 const ang=t.s==2?[-90,90]:[0,90,180,270];
 ang.forEach(a=>{const c=mk(g,'a',`transform:rotateY(${a}deg) translate3d(0,0,100px)`);
  mk(c,'a',q(8,45,'translate3d(-4px,-45px,0)','#6b4128'));
  disc(c,46,-45,'#b4532a');
  mk(c,'a',q(46,42,'translate3d(-23px,-88px,22px)','#9d4620'));});
 if(!t.f){[[-28,10],[26,-14]].forEach(([x,z])=>{const p=mk(g,'a',`transform:translate3d(${x}px,0,${z}px)`);disc(p,36,-76,'#fff','box-shadow:inset 0 0 0 5px #eee');disc(p,14,-80,'#5a3a26')});}
 else disc(g,40,-77,'radial-gradient(rgba(242,196,141,.9),transparent 70%)');
 const b=mk(g,'a bb');bbs.push([b,`translate3d(0,-175px,0)`]);mk(b,`lab ${t.f?'free':'bkd'}`,'',`Table ${t.n} · ${t.f?'Free':'Booked'}`);
 const lt=mk(g,'a bb');bbs.push([lt,'translate3d(0,-300px,0)']);mk(lt,'glow');
 const ln=mk(g,'a bb');bbs.push([ln,'translate3d(0,-345px,0)']);mk(ln,'','position:absolute;width:2px;height:90px;background:#3b2a1e;transform:translate(-50%,-50%)');
});
[[-640,-950],[640,-1350],[-640,-1350]].forEach(([x,z])=>{const b=mk(world,'a bb',`transform:translate3d(${x}px,${FY}px,${z}px)`);bbs.push([b,`translate3d(${x}px,${FY}px,${z}px)`]);
 mk(b,'','position:absolute;width:30px;height:45px;background:#8a5a3a;transform:translate(-50%,-25px)');
 [[0,-70,70],[-24,-48,50],[24,-52,54]].forEach(([dx,dy,s])=>mk(b,'leaf',`left:${dx}px;top:${dy}px;width:${s}px;height:${s}px`));});
// waypoints
const wp=[{x:0,y:-70,z:180,yaw:0,pitch:7}];
TB.forEach(t=>{const cx=t.x*.3,cy=-30,cz=t.z+340,dx=t.x-cx,dz=cz-t.z,dy=FY-75-cy;
 wp.push({x:cx,y:cy,z:cz,yaw:Math.atan2(dx,dz)*180/Math.PI,pitch:Math.atan2(dy,Math.hypot(dx,dz))*180/Math.PI})});
const N=wp.length-1;
// minimap
TB.forEach(t=>{const b=mk(map,t.f?'free':'bkd','',t.n);b.style.left=(50+t.x/1400*100)+'%';b.style.top=(100+t.z/1600*100*-1+0)+'px';t.m=b;
 b.style.top=((-t.z-150)/1500*88+8)+'%';b.className=t.f?'free':'bkd';b.onclick=()=>{const top=ST.offsetTop+(t.n/N)*(ST.offsetHeight-innerHeight);scrollTo({top,behavior:'smooth'})}});
const lerp=(a,b,t)=>a+(b-a)*t,ease=t=>t*t*(3-2*t);
let cur=0,tgt=0,shown=-1;
function measure(){const r=ST.getBoundingClientRect();tgt=Math.min(1,Math.max(0,-r.top/(ST.offsetHeight-innerHeight)))}
addEventListener('scroll',measure,{passive:true});addEventListener('resize',measure);
function show(i){if(i===shown)return;shown=i;TB.forEach((t,k)=>t.m.classList.toggle('cur',k===i-1));
 if(i<1){card.classList.remove('on');return}
 const t=TB[i-1];card.innerHTML=`<h2>Table ${t.n}</h2><span class="st ${t.f?'free':'bkd'}">${t.f?'Free right now':'Booked'}</span><p>${t.s} seats · ${t.w}</p>`+(t.f?`<button class="btn" data-t="${t.n}">Reserve this table</button>`:`<p style="margin-top:8px">Try another table — scroll on.</p>`);card.classList.add('on')}
card.addEventListener('click',e=>{const b=e.target.closest('[data-t]');if(b){const s=document.getElementById('tsel');if(s)s.value=b.dataset.t;document.getElementById('book').scrollIntoView({behavior:'smooth'})}});
function loop(){
 cur+=(tgt-cur)*.1;const u=cur*N,i=Math.min(N-1,Math.floor(u)),f=u-i,H=.45;
 const k=ease(Math.min(1,Math.max(0,(f-H)/(1-H))));
 const a=wp[i],b=wp[i+1],c={};for(const p in a)c[p]=lerp(a[p],b[p],k);
 const P=innerWidth<700?650:900;
 const view=world.parentNode;view.style.perspective=P+'px';
 world.style.transform=`translateZ(${P}px) rotateX(${-c.pitch}deg) rotateY(${c.yaw}deg) translate3d(${-c.x}px,${-c.y}px,${-c.z}px)`;
 bbs.forEach(([e,t])=>{e.style.transform=`${t} rotateY(${-c.yaw}deg) rotateX(${c.pitch}deg)`});
 intro.style.opacity=Math.max(0,1-cur*N/.45);intro.style.visibility=cur*N>.45?'hidden':'visible';
 const near=f<.4?i:(f>.9?i+1:-1);show(cur*N<.3?0:(near<0?shown:near));
 requestAnimationFrame(loop)}
measure();loop();
})();
