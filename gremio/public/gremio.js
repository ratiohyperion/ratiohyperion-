(function(){
var W='5491158862827',S={items:[],minimo:0,act:'',q:'',cat:'',n:60},cart={};
function $(i){return document.getElementById(i)}
function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
function money(n){return '$ '+Math.round(n).toLocaleString('es-AR')}
function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')}
var bg=document.querySelector('.burger'),nv=document.querySelector('.nav');if(bg&&nv)bg.onclick=function(){nv.classList.toggle('open')};

function cats(){var s=$('gcat'),m={};S.items.forEach(function(i){m[i.cat]=(m[i.cat]||0)+1});s.innerHTML='';var o=el('option',null,'Todas las categorías ('+S.items.length+')');o.value='';s.appendChild(o);Object.keys(m).forEach(function(k){var o=el('option',null,k+' ('+m[k]+')');o.value=k;s.appendChild(o)});s.value=S.cat}
function list(){var q=norm(S.q).split(/\s+/).filter(Boolean);return S.items.filter(function(i){if(S.cat&&i.cat!==S.cat)return false;if(!q.length)return true;var h=norm(i.c+' '+i.d+' '+i.g+' '+i.cat+' '+(i.m||''));return q.every(function(t){return h.indexOf(t)>-1})})}
function render(){var L=list(),it=$('gitems');it.innerHTML='';$('gcount').textContent=L.length+' producto'+(L.length===1?'':'s');
 L.slice(0,S.n).forEach(function(p){var d=el('div','gr-it'),info=el('div','info');info.appendChild(el('b',null,p.c));if(p.m||p.g)info.appendChild(el('em',null,' · '+[p.m,p.g].filter(Boolean).join(' · ')));info.appendChild(el('small',null,p.d));d.appendChild(info);
  var side=el('div','side');
  if(p.e==='sin_stock'){side.appendChild(el('span','gr-tag off','Sin stock'))}
  else{
   if(p.p!=null){var pr=el('div','gr-price',money(p.p));pr.appendChild(el('small',null,' + IVA'));side.appendChild(pr)}else if(p.e==='consultar'){side.appendChild(el('span','gr-tag','Consultar precio'))}else{side.appendChild(el('span','gr-tag','Consultar precio'))}
   var q=el('div','gr-q'),m=el('button',null,'−'),n=el('span',null,String(cart[p.c]?cart[p.c].q:0)),pl=el('button',null,'+');m.setAttribute('aria-label','Menos');pl.setAttribute('aria-label','Más');m.onclick=function(){set(p,-1)};pl.onclick=function(){set(p,1)};q.appendChild(m);q.appendChild(n);q.appendChild(pl);side.appendChild(q)}
  d.appendChild(side);it.appendChild(d)});
 if(!L.length)it.appendChild(el('p','empty','No encontramos productos con ese filtro.'));
 $('gmore').hidden=L.length<=S.n;draw()}
function set(p,n){var c=cart[p.c]||{p:p,q:0};c.p=p;c.q=Math.max(0,c.q+n);if(c.q)cart[p.c]=c;else delete cart[p.c];render()}
function total(){var t=0,all=true;Object.keys(cart).forEach(function(k){var c=cart[k];if(c.p.p!=null)t+=c.p.p*c.q;else all=false});return{t:t,all:all}}
function draw(){var ul=$('gcart'),ks=Object.keys(cart);ul.innerHTML='';if(!ks.length)ul.appendChild(el('li','empty','Todavía no agregaste productos.'));
 ks.forEach(function(k){var c=cart[k],li=el('li');li.appendChild(el('span',null,c.q+' × '+c.p.c));if(c.p.p!=null)li.appendChild(el('span',null,money(c.p.p*c.q)));var lq=el('span','gr-lq'),mm=el('button',null,'−'),pp=el('button',null,'+');mm.type=pp.type='button';mm.setAttribute('aria-label','Menos');pp.setAttribute('aria-label','Más');mm.onclick=function(){set(c.p,-1)};pp.onclick=function(){set(c.p,1)};lq.appendChild(mm);lq.appendChild(pp);li.appendChild(lq);ul.appendChild(li)});
 var B=$('gbar');if(B){var u=0;ks.forEach(function(k){u+=cart[k].q});B.innerHTML='';B.hidden=!ks.length;if(ks.length){B.appendChild(el('span',null,'Ver pedido ('+u+')'));B.appendChild(el('b',null,money(total().t)))}}
 var T=$('gtotal');T.innerHTML='';if(ks.length){var r=total(),l=el('div','l');l.appendChild(el('span',null,'Total sin IVA'));l.appendChild(el('span','t',money(r.t)));T.appendChild(l);if(!r.all)T.appendChild(el('div','warn','Algunos ítems no tienen precio: se cotizan aparte.'));else if(S.minimo&&r.t<S.minimo)T.appendChild(el('div','warn','Compra mínima '+money(S.minimo)+' + IVA. Faltan '+money(S.minimo-r.t)+'.'))}}
function txt(){var g=function(i){return $(i).value.trim()},r=total(),lines=Object.keys(cart).map(function(k){var c=cart[k];return '• '+c.q+' × '+(c.p.m?'['+c.p.m+'] ':'')+c.p.c+' — '+c.p.d.slice(0,70)+(c.p.p!=null?' ('+money(c.p.p)+' c/u)':'')});
 return 'Pedido de gremio'+'\nNombre: '+g('g1')+(g('g2')?'\nEmpresa: '+g('g2'):'')+'\nCUIT: '+g('g3')+'\nWhatsApp: '+g('g4')+'\n\nProductos:\n'+lines.join('\n')+(r.t?'\n\nTotal estimado sin IVA: '+money(r.t):'')+(g('g5')?'\n\nComentarios: '+g('g5'):'')}
function ok(){var bad=[];['g1','g3','g4'].forEach(function(i){var e=$(i),b=!e.value.trim();e.classList.toggle('err',b);if(b)bad.push(i)});var m='';if(!Object.keys(cart).length)m='Agregá al menos un producto. ';if(bad.length)m+='Completá nombre, CUIT y WhatsApp.';$('gmsg').textContent=m;return !m}
$('gwa').onclick=function(){if(ok())window.open('https://wa.me/'+W+'?text='+encodeURIComponent(txt()),'_blank')};
$('awa').onclick=function(){var g=function(i){return $(i).value.trim()},bad=false;['a1','a3','a4'].forEach(function(i){var e=$(i),b=!g(i);e.classList.toggle('err',b);if(b)bad=true});$('amsg').textContent=bad?'Completá nombre, CUIT y WhatsApp.':'';if(bad)return;window.open('https://wa.me/'+W+'?text='+encodeURIComponent('Hola, soy '+g('a1')+(g('a2')?' ('+g('a2')+')':'')+'. CUIT '+g('a3')+'. Quiero solicitar acceso al sitio del gremio. Mi WhatsApp: '+g('a4')),'_blank')};
document.addEventListener('input',function(e){if(e.target.classList&&e.target.classList.contains('err')&&e.target.value.trim())e.target.classList.remove('err')});
var tm;$('gq').oninput=function(){clearTimeout(tm);var v=this.value;tm=setTimeout(function(){S.q=v;S.n=60;render()},150)};
$('gcat').onchange=function(){S.cat=this.value;S.n=60;render()};
$('gmore').onclick=function(){S.n+=60;render()};
function load(){fetch('/api/catalogo').then(function(r){return r.json()}).then(function(d){if(d.error)throw new Error(d.error);S.items=d.items;S.minimo=d.minimo;$('gupd').textContent=d.actualizado?'Lista actualizada: '+d.actualizado:'';cats();render()}).catch(function(){$('gitems').innerHTML='';$('gitems').appendChild(el('p','empty','No pudimos cargar la lista en este momento. Escribinos por WhatsApp.'))})}
var gb=$('gbar'),gc=document.querySelector('.gr-cart');if(gb&&gc){gb.onclick=function(){gc.scrollIntoView({behavior:'smooth',block:'start'})};if(window.IntersectionObserver){new IntersectionObserver(function(es){var e=es[0];document.body.classList.toggle('cart-below',!e.isIntersecting&&e.boundingClientRect.top>0)}).observe(gc)}else document.body.classList.add('cart-below')}
load();
})();
