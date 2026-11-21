(function(){
const MENU=[['🍕','Pepperoni Rush','Pizza','Crisp crust, spicy pepperoni, stretchy mozzarella.',499,'Bestseller'],['🧀','Smoky Paneer Tikka','Pizza','Tandoor-charred paneer on a smoky tomato base.',479,'Veg'],['🥖','Garlic Bread Crown','Sides','Golden, buttery, pull-apart garlic bread.',199,'Veg'],['🍝','Fettuccine Alfredo','Pasta','Fresh egg fettuccine in silky parmesan cream.',349,'Chef pick'],['🍔','Smash House Burger','Burgers','Brioche, cheddar and a juicy smashed beef patty.',299,'Popular'],['🍋','Fresh Lime Soda','Drinks','Sweet, salted or mixed. Always chilled.',199,'Veg'],['☕','Cold Coffee','Drinks','Slow-brewed beans over ice with cream.',149,'Veg'],['🍫','Molten Choco Lava','Dessert','Warm cake, gooey centre, vanilla scoop.',189,'Veg']];
const cats=['All',...new Set(MENU.map(m=>m[2]))];
const ml=document.getElementById('mlist');
if(ml){ml.innerHTML='<h2>From the menu</h2><p>Made when you order it. Tap a category to filter.</p><div class="tabs" style="margin-top:20px"></div><div class="dishes"></div>';
 const tabs=ml.querySelector('.tabs'),grid=ml.querySelector('.dishes');
 const draw=c=>{grid.innerHTML=MENU.filter(m=>c=='All'||m[2]==c).map(m=>`<article class="dish rise in"><div class="em">${m[0]}</div><h3>${m[1]}</h3><p>${m[3]}</p><div class="pr">₹${m[4]}<small>${m[5]}</small></div></article>`).join('');tabs.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.c==c))};
 tabs.innerHTML=cats.map(c=>`<button data-c="${c}">${c}</button>`).join('');tabs.onclick=e=>{const b=e.target.closest('button');if(b)draw(b.dataset.c)};draw('All')}
const ab=document.getElementById('about');
if(ab)ab.insertAdjacentHTML('beforeend','<div class="stats"><div><b>9am–11pm</b><span>Open every day</span></div><div><b>7 tables</b><span>Reserve before you walk in</span></div><div><b>Fresh</b><span>Cooked to order, never reheated</span></div></div>');
const bk=document.getElementById('book');
if(bk)bk.insertAdjacentHTML('beforebegin','<div class="sec" id="reviews"><h2>What guests say</h2><div class="rv"><figure><div class="st">★★★★★</div><blockquote>The Alfredo is the best in the city. Booked our table in ten seconds.</blockquote><figcaption>Priya, Banjara Hills</figcaption></figure><figure><div class="st">★★★★★</div><blockquote>Loved picking the exact table from the walkthrough. No waiting at all.</blockquote><figcaption>Rahul, Gachibowli</figcaption></figure><figure><div class="st">★★★★☆</div><blockquote>Warm light, great burgers, and the lava cake is dangerous.</blockquote><figcaption>Anu, Jubilee Hills</figcaption></figure></div></div>');
const vs=document.getElementById('visit');
if(vs)vs.innerHTML='<h2>Visit us</h2><div class="visit"><div><b>Address</b>Your address here</div><div><b>Hours</b>Open daily, 9am to 11pm</div><div><b>Call or WhatsApp</b>+91 00000 00000</div></div>';
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.15});
document.querySelectorAll('.sec h2,.stats,.rv figure,.visit div,#bf').forEach(e=>{e.classList.add('rise');io.observe(e)});
const bf=document.getElementById('bf'),msg=document.getElementById('msg');
if(bf)bf.addEventListener('submit',()=>{msg.textContent='Booking request sent. We will confirm by call or WhatsApp shortly.'});
})();
(function(){const h=document.querySelector('.hero h1'),p=document.querySelector('.hero p');if(!h||!p)return;
let i=0;h.innerHTML=['Corafrée','Café'].map(w=>[...w].map(c=>`<span class="l" style="--i:${i++}">${c}</span>`).join('')).join('<br>');
p.innerHTML=['Walk in.','Take a seat.','Your table is waiting.'].map((t,j)=>`<span style="--j:${j}">${t}</span>`).join('')})();
(function(){const n=document.querySelector('nav');if(!n)return;const b=document.createElement('button');b.id='tm';b.setAttribute('aria-label','Switch light or dark mode');
const set=()=>b.textContent=document.documentElement.dataset.theme=='light'?'☾':'☀';set();b.onclick=()=>{tg();set()};n.appendChild(b)})();
