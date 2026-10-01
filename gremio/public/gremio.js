(function(){
var W='5491160121797',S={items:[],ses:null,minimo:0,q:'',cat:'',n:60},cart={};
function $(i){return document.getElementById(i)}
function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
function money(n){return '$ '+Math.round(n).toLocaleString('es-AR')}
function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')}
var bg=document.querySelector('.burger'),nv=document.querySelector('.nav');if(bg&&nv)bg.onclick=function(){nv.classList.toggle('open')};

function auth(){var a=$('gauth');a.innerHTML='';
 if(S.ses){var w=el('div','who');w.appendChild(document.createTextNode('Hola, '));w.appendChild(el('b',null,S.ses.nombre||S.ses.email));w.appendChild(document.createTextNode(' · Perfil '+S.ses.etiqueta+' · precios sin IVA'));a.appendChild(w);var b=el('button','btn btn-line btn-sm','Salir');b.onclick=function(){fetch('/api/logout',{method:'POST'}).then(function(){cart={};load()})};a.appendChild(b);return}
 var f=el('div','f');
 var d1=el('div');d1.appendChild(el('label',null,'Mail'));var e=el('input');e.id='lm';e.type='email';e.autocomplete='username';d1.appendChild(e);
 var d2=el('div');d2.appendChild(el('label',null,'Código de acceso'));var c=el('input');c.id='lc';c.type='password';c.autocomplete='current-password';d2.appendChild(c);
 var b2=el('button','btn btn-blue btn-sm','Ingresar para ver precios');var m=el('div','err');m.id='lerr';
 function go(){m.textContent='';b2.disabled=true;fetch('/api/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:e.value,codigo:c.value})}).then(function(r){return r.json().then(function(j){return{ok:r.ok,j:j}})}).then(function(x){b2.disabled=false;if(!x.ok){m.textContent=x.j.error||'No pudimos ingresar.';return}load()}).catch(function(){b2.disabled=false;m.textContent='Error de conexión.'})}
 b2.onclick=go;c.onkeydown=function(k){if(k.key==='Enter')go()};
 f.appendChild(d1);f.appendChild(d2);f.appendChild(b2);a.appendChild(f);a.appendChild(m)}

function cats(){var s=$('gcat'),m={};S.items.forEach(function(i){m[i.cat]=(m[i.cat]||0)+1});s.innerHTML='';var o=el('option',null,'Todas las categorías ('+S.items.length+')');o.value='';s.appendChild(o);Object.keys(m).forEach(function(k){var o=el('option',null,k+' ('+m[k]+')');o.value=k;s.appendChild(o)});s.value=S.cat}
function list(){var q=norm(S.q).split(/\s+/).filter(Boolean);return S.items.filter(function(i){if(S.cat&&i.cat!==S.cat)return false;if(!q.length)return true;var h=norm(i.c+' '+i.d+' '+i.g+' '+i.cat);return q.every(function(t){return h.indexOf(t)>-1})})}
function render(){var L=list(),it=$('gitems');it.innerHTML='';$('gcount').textContent=L.length+' producto'+(L.length===1?'':'s');
 L.slice(0,S.n).forEach(function(p){var d=el('div','gr-it'),info=el('div','info');info.appendChild(el('b',null,p.c));if(p.g)info.appendChild(el('em',null,' · '+p.g));info.appendChild(el('small',null,p.d));d.appendChild(info);
  var side=el('div','side');
  if(p.e==='sin_stock'){side.appendChild(el('span','gr-tag off','Sin stock'))}
  else{
   if(p.p!=null){var pr=el('div','gr-price',money(p.p));pr.appendChild(el('small',null,' + IVA'));side.appendChild(pr)}else if(p.e==='consultar'){side.appendChild(el('span','gr-tag','Consultar precio'))}else{side.appendChild(el('span','gr-lock','Ingresá para ver el precio'))}
   var q=el('div','gr-q'),m=el('button',null,'−'),n=el('span',null,String(cart[p.c]?cart[p.c].q:0)),pl=el('button',null,'+');m.setAttribute('aria-label','Menos');pl.setAttribute('aria-label','Más');m.onclick=function(){set(p,-1)};pl.onclick=function(){set(p,1)};q.appendChild(m);q.appendChild(n);q.appendChild(pl);side.appendChild(q)}
  d.appendChild(side);it.appendChild(d)});
 if(!L.length)it.appendChild(el('p','empty','No encontramos productos con ese filtro.'));
 $('gmore').hidden=L.length<=S.n;draw()}
function set(p,n){var c=cart[p.c]||{p:p,q:0};c.p=p;c.q=Math.max(0,c.q+n);if(c.q)cart[p.c]=c;else delete cart[p.c];render()}
function total(){var t=0,all=true;Object.keys(cart).forEach(function(k){var c=cart[k];if(c.p.p!=null)t+=c.p.p*c.q;else all=false});return{t:t,all:all}}
function draw(){var ul=$('gcart'),ks=Object.keys(cart);ul.innerHTML='';if(!ks.length)ul.appendChild(el('li','empty','Todavía no agregaste productos.'));
 ks.forEach(function(k){var c=cart[k],li=el('li');li.appendChild(el('span',null,c.q+' × '+c.p.c));if(c.p.p!=null)li.appendChild(el('span',null,money(c.p.p*c.q)));ul.appendChild(li)});
 var T=$('gtotal');T.innerHTML='';if(S.ses&&ks.length){var r=total(),l=el('div','l');l.appendChild(el('span',null,'Total sin IVA'));l.appendChild(el('span','t',money(r.t)));T.appendChild(l);if(!r.all)T.appendChild(el('div','warn','Algunos ítems no tienen precio: se cotizan aparte.'));else if(S.minimo&&r.t<S.minimo)T.appendChild(el('div','warn','Compra mínima '+money(S.minimo)+' + IVA. Faltan '+money(S.minimo-r.t)+'.'))}}
function txt(){var g=function(i){return $(i).value.trim()},r=total(),lines=Object.keys(cart).map(function(k){var c=cart[k];return '• '+c.q+' × '+c.p.c+' — '+c.p.d.slice(0,70)+(c.p.p!=null?' ('+money(c.p.p)+' c/u)':'')});
 return 'Pedido de gremio'+(S.ses?' ('+S.ses.etiqueta+' · '+S.ses.email+')':'')+'\nNombre: '+g('g1')+(g('g2')?'\nEmpresa: '+g('g2'):'')+'\nCUIT: '+g('g3')+'\nWhatsApp: '+g('g4')+'\n\nProductos:\n'+lines.join('\n')+(S.ses&&r.t?'\n\nTotal estimado sin IVA: '+money(r.t):'')+(g('g5')?'\n\nComentarios: '+g('g5'):'')}
function ok(){var bad=[];['g1','g3','g4'].forEach(function(i){var e=$(i),b=!e.value.trim();e.classList.toggle('err',b);if(b)bad.push(i)});var m='';if(!Object.keys(cart).length)m='Agregá al menos un producto. ';if(bad.length)m+='Completá nombre, CUIT y WhatsApp.';$('gmsg').textContent=m;return !m}
$('gwa').onclick=function(){if(ok())window.open('https://wa.me/'+W+'?text='+encodeURIComponent(txt()),'_blank')};
$('gmail').onclick=function(){if(ok())location.href='mailto:gremio@ratiohyperion.com.ar?subject='+encodeURIComponent('Pedido de gremio')+'&body='+encodeURIComponent(txt())};
$('awa').onclick=function(){var g=function(i){return $(i).value.trim()},bad=false;['a1','a3','a4'].forEach(function(i){var e=$(i),b=!g(i);e.classList.toggle('err',b);if(b)bad=true});$('amsg').textContent=bad?'Completá nombre, CUIT y WhatsApp.':'';if(bad)return;window.open('https://wa.me/'+W+'?text='+encodeURIComponent('Hola, soy '+g('a1')+(g('a2')?' ('+g('a2')+')':'')+'. CUIT '+g('a3')+'. Quiero solicitar acceso al sitio del gremio. Mi WhatsApp: '+g('a4')),'_blank')};
document.addEventListener('input',function(e){if(e.target.classList&&e.target.classList.contains('err')&&e.target.value.trim())e.target.classList.remove('err')});
var tm;$('gq').oninput=function(){clearTimeout(tm);var v=this.value;tm=setTimeout(function(){S.q=v;S.n=60;render()},150)};
$('gcat').onchange=function(){S.cat=this.value;S.n=60;render()};
$('gmore').onclick=function(){S.n+=60;render()};
function load(){fetch('/api/catalogo',{credentials:'same-origin'}).then(function(r){return r.json()}).then(function(d){if(d.error)throw new Error(d.error);S.items=d.items;S.ses=d.sesion;S.minimo=d.minimo;$('gdemo').hidden=!d.demo;
  Object.keys(cart).forEach(function(k){var f=d.items.filter(function(i){return i.c===k})[0];if(f)cart[k].p=f;else delete cart[k]});
  auth();cats();render()}).catch(function(e){$('gitems').innerHTML='';$('gitems').appendChild(el('p','empty','No pudimos cargar el catálogo. Escribinos por WhatsApp.'))})}
load();
})();
