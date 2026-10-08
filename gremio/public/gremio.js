(function(){
var W='5491158862827',S={items:[],minimo:0,act:'',q:'',cat:'',n:20,desc:0,gen:false,num:null},cart={};
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
   var cq=cart[p.c]?cart[p.c].q:0;
   if(!cq){var ad=el('button','btn btn-blue gr-add','Agregar');ad.type='button';ad.onclick=function(){set(p,1)};side.appendChild(ad)}
   else{var q=el('div','gr-q'),m=el('button',null,'−'),n=el('span',null,String(cq)),pl=el('button',null,'+');m.type=pl.type='button';m.setAttribute('aria-label','Menos');pl.setAttribute('aria-label','Más');m.onclick=function(){set(p,-1)};pl.onclick=function(){set(p,1)};q.appendChild(m);q.appendChild(n);q.appendChild(pl);side.appendChild(q)}}
  d.appendChild(side);it.appendChild(d)});
 if(!L.length)it.appendChild(el('p','empty','No encontramos productos con ese filtro.'));
 var gm=$('gmore');gm.hidden=L.length<=S.n;gm.textContent='Ver más ('+Math.min(20,L.length-S.n)+' de '+(L.length-S.n)+' restantes)';draw()}
var LS='rhg_cart';
function save(){try{var o={};Object.keys(cart).forEach(function(k){o[k]=cart[k].q});localStorage.setItem(LS,JSON.stringify(o))}catch(e){}}
function restore(){try{var o=JSON.parse(localStorage.getItem(LS)||'{}'),by={};S.items.forEach(function(p){by[p.c]=p});Object.keys(o).forEach(function(k){var q=Math.floor(o[k]);if(by[k]&&q>0&&by[k].e!=='sin_stock')cart[k]={p:by[k],q:q}})}catch(e){}}
function reset(){S.gen=false;S.num=null;$('gmsg').textContent=''}
function set(p,n){reset();var c=cart[p.c]||{p:p,q:0};c.p=p;c.q=Math.max(0,c.q+n);if(c.q)cart[p.c]=c;else delete cart[p.c];save();render()}
function total(){var t=0,all=true;Object.keys(cart).forEach(function(k){var c=cart[k];if(c.p.p!=null)t+=c.p.p*c.q;else all=false});var dm=Math.round(t*(S.desc||0));return{t:t,all:all,d:S.desc||0,dm:dm,n:t-dm}}
function pct(d){return (Math.round(d*1000)/10).toString().replace('.',',')+'%'}
function draw(){var ul=$('gcart'),ks=Object.keys(cart);ul.innerHTML='';if(!ks.length)ul.appendChild(el('li','empty','Todavía no agregaste productos.'));
 ks.forEach(function(k){var c=cart[k],li=el('li');li.appendChild(el('span',null,c.q+' × '+c.p.c));if(c.p.p!=null)li.appendChild(el('span',null,money(c.p.p*c.q)));var lq=el('span','gr-lq'),mm=el('button',null,'−'),pp=el('button',null,'+');mm.type=pp.type='button';mm.setAttribute('aria-label','Menos');pp.setAttribute('aria-label','Más');mm.onclick=function(){set(c.p,-1)};pp.onclick=function(){set(c.p,1)};lq.appendChild(mm);lq.appendChild(pp);li.appendChild(lq);ul.appendChild(li)});
 var B=$('gbar');if(B){var u=0;ks.forEach(function(k){u+=cart[k].q});B.innerHTML='';B.hidden=!ks.length;if(ks.length){B.appendChild(el('span',null,'Ver pedido ('+u+')'));B.appendChild(el('b',null,money(total().n)))}}
 var T=$('gtotal');T.innerHTML='';var bajoMinimo=false;if(ks.length){var r=total(),l=el('div','l');if(r.d>0&&r.all){var l1=el('div','l');l1.appendChild(el('span',null,'Subtotal sin IVA'));l1.appendChild(el('span',null,money(r.t)));T.appendChild(l1);var l2=el('div','l');l2.appendChild(el('span',null,'Descuento '+pct(r.d)));l2.appendChild(el('span',null,'− '+money(r.dm)));T.appendChild(l2)}l.appendChild(el('span',null,'Total sin IVA'));l.appendChild(el('span','t',money(r.d>0&&r.all?r.n:r.t)));T.appendChild(l);if(!r.all)T.appendChild(el('div','warn','Algunos ítems no tienen precio: se cotizan aparte.'));else if(S.minimo&&r.t<S.minimo){bajoMinimo=true;T.appendChild(el('div','warn','Compra mínima '+money(S.minimo)+' + IVA. Faltan '+money(S.minimo-r.t)+'.'))}}
 $('gcot').disabled=bajoMinimo||!ks.length;$('gwa').disabled=!S.gen||!ks.length;}
function txt(numero){var g=function(i){return $(i).value.trim()},r=total(),lines=Object.keys(cart).map(function(k){var c=cart[k];return '• '+c.q+' × '+(c.p.m?'['+c.p.m+'] ':'')+c.p.c+' — '+c.p.d.slice(0,70)+(c.p.p!=null?' ('+money(c.p.p)+' c/u)':'')});
 return 'Pedido de gremio'+(numero?'\nCotización N° '+numero:'')+'\nNombre: '+g('g1')+(g('g2')?'\nEmpresa: '+g('g2'):'')+'\nCUIT: '+g('g3')+'\nWhatsApp: '+g('g4')+'\n\nProductos:\n'+lines.join('\n')+(r.t?(r.d>0&&r.all?'\n\nSubtotal sin IVA: '+money(r.t)+'\nDescuento gremio ('+pct(r.d)+'): − '+money(r.dm)+'\nTotal estimado sin IVA: '+money(r.n):'\n\nTotal estimado sin IVA: '+money(r.t)):'')+(g('g5')?'\n\nComentarios: '+g('g5'):'')}
function ok(){var bad=[];['g1','g3','g4'].forEach(function(i){var e=$(i),b=!e.value.trim();e.classList.toggle('err',b);if(b)bad.push(i)});var m='';if(!Object.keys(cart).length)m='Agregá al menos un producto. ';if(bad.length)m+='Completá nombre, CUIT y WhatsApp.';$('gmsg').textContent=m;return !m}
var enviando=false;
$('gcot').onclick=function(){if(enviando||!ok())return;enviando=true;var btn=$('gcot'),old=btn.textContent;btn.disabled=true;btn.textContent='Generando cotización…';$('gwa').disabled=true;
 post('/api/pedido',{items:Object.keys(cart).map(function(k){return{cod:k,qty:cart[k].q}})}).then(function(d){
  S.gen=true;S.num=(d&&d.numero)||null;
  $('gmsg').textContent=S.num?'Cotización N° '+S.num+' generada. Te la enviamos por mail (revisá spam). Ahora enviá el pedido por WhatsApp.':(d&&d.aviso==='limite'?'Alcanzaste el máximo de cotizaciones automáticas de hoy. Igual podés enviar tu pedido por WhatsApp.':'No pudimos generar el número de cotización ahora. Igual podés enviar tu pedido por WhatsApp.');
 },function(){S.gen=true;S.num=null;$('gmsg').textContent='No pudimos generar la cotización. Igual podés enviar tu pedido por WhatsApp.'}).then(function(){enviando=false;btn.textContent=old;draw()})};
$('gwa').onclick=function(){if(!S.gen||!ok())return;window.open('https://wa.me/'+W+'?text='+encodeURIComponent(txt(S.num)),'_blank')};
var gvac=$('gvaciar');if(gvac)gvac.onclick=function(){if(Object.keys(cart).length&&confirm('¿Vaciar el carrito?')){cart={};save();reset();render()}};
$('awa').onclick=function(){var g=function(i){return $(i).value.trim()},bad=false;['a1','a3','a4'].forEach(function(i){var e=$(i),b=!g(i);e.classList.toggle('err',b);if(b)bad=true});$('amsg').textContent=bad?'Completá nombre, CUIT y WhatsApp.':'';if(bad)return;window.open('https://wa.me/'+W+'?text='+encodeURIComponent('Hola, soy '+g('a1')+(g('a2')?' ('+g('a2')+')':'')+'. CUIT '+g('a3')+'. Quiero solicitar acceso al sitio del gremio. Mi WhatsApp: '+g('a4')),'_blank')};
document.addEventListener('input',function(e){if(e.target.classList&&e.target.classList.contains('err')&&e.target.value.trim())e.target.classList.remove('err')});
var tm;$('gq').oninput=function(){clearTimeout(tm);var v=this.value;tm=setTimeout(function(){S.q=v;S.n=20;render()},150)};
$('gcat').onchange=function(){S.cat=this.value;S.n=20;render()};
$('gmore').onclick=function(){S.n+=20;render()};
function post(u,b){return fetch(u,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(b||{})}).then(function(r){return r.json().catch(function(){return{}}).then(function(d){d._s=r.status;return d})})}
function show(id){['axlogin','axreg','axforg','axreset'].forEach(function(f){$(f).hidden=f!==id});$('axt1').classList.toggle('on',id==='axlogin'||id==='axforg'||id==='axreset');$('axt2').classList.toggle('on',id==='axreg')}
function note(t,bad){var n=$('axnote');n.hidden=!t;n.textContent=t||'';n.className='gr-axnote'+(bad?' bad':'')}
function busy(f,on){var b=f.querySelector('button[type=submit]');if(b){b.disabled=on;b.style.opacity=on?'.6':''}}
function submit(f,m,fn){$(f).onsubmit=function(e){e.preventDefault();var msg=$(m);msg.textContent='';var form=$(f);busy(form,true);fn(msg).then(function(){busy(form,false)},function(){busy(form,false);msg.textContent='No pudimos conectar. Reintentá en un momento.'})}}
function showAuth(){
 $('authbox').hidden=false;$('ggrid').hidden=true;var u=document.querySelector('.gr-upd');if(u)u.hidden=true;var a=$('acceso');if(a)a.hidden=true;
 var ha=document.querySelector('.hero-cta a[href="#acceso"]');if(ha){ha.href='#pedido';ha.textContent='Ingresar o registrarme'}
 var q=new URLSearchParams(location.search);
 if(q.get('reset')){show('axreset')}else if(q.get('aviso')==='login'){note('Ingresá o creá tu cuenta para ver la lista de precios.')}else if(q.get('aviso')==='enlace'){note('El enlace venció o ya se usó. Ingresá, o pedí uno nuevo con "Olvidé mi contraseña".',true)}
 $('axt1').onclick=function(){note('');show('axlogin')};$('axt2').onclick=function(){note('');show('axreg')};
 $('axforgot').onclick=function(e){e.preventDefault();note('');show('axforg')};$('axback').onclick=function(e){e.preventDefault();show('axlogin')};
 submit('axlogin','axm1',function(m){var em=$('lg_email').value.trim(),pw=$('lg_pw').value;if(!em||!pw){m.textContent='Ingresá tu mail y contraseña.';return Promise.resolve()}return post('/api/login',{email:em,password:pw}).then(function(d){if(d.ok){history.replaceState(null,'','/');location.reload()}else m.textContent=d.error||'No se pudo ingresar.'})});
 submit('axreg','axm2',function(m){var g=function(i){return $(i).value.trim()};if(!g('rg_nombre')||!g('rg_cuit')||!g('rg_whatsapp')||!g('rg_email')||!$('rg_pw').value){m.textContent='Completá los campos con *.';return Promise.resolve()}
  return post('/api/registro',{nombre:g('rg_nombre'),empresa:g('rg_empresa'),cuit:g('rg_cuit'),whatsapp:g('rg_whatsapp'),email:g('rg_email'),password:$('rg_pw').value,web:$('rg_web').value}).then(function(d){if(d.ok){show('axlogin');$('lg_email').value=g('rg_email');note('¡Listo! Te enviamos un mail a '+g('rg_email')+' para confirmar tu cuenta. Revisá también la carpeta de spam. Al confirmar entrás automáticamente.')}else m.textContent=d.error||'No se pudo crear la cuenta.'})});
 submit('axforg','axm3',function(m){var em=$('fg_email').value.trim();if(!em){m.textContent='Ingresá tu mail.';return Promise.resolve()}return post('/api/olvide',{email:em}).then(function(d){if(d.ok){show('axlogin');note('Si ese mail está registrado, te enviamos un enlace para elegir una nueva contraseña (vale 1 hora).')}else m.textContent=d.error||'No se pudo enviar.'})});
 submit('axreset','axm4',function(m){return post('/api/reset',{token:q.get('reset'),password:$('rs_pw').value}).then(function(d){if(d.ok){history.replaceState(null,'','/');location.reload()}else m.textContent=d.error||'No se pudo guardar.'})});
}
function who(){fetch('/api/me').then(function(r){return r.ok?r.json():null}).then(function(d){if(!d||!d.user)return;var a=$('acceso');if(a)a.hidden=true;var ha=document.querySelector('.hero-cta a[href="#acceso"]');if(ha)ha.style.display='none';
 var u=d.user,b=$('userbar'),ok=new URLSearchParams(location.search).get('aviso')==='verificado';
 b.hidden=false;b.className='gr-userbar'+(ok?' ok':'');b.innerHTML='';var t=el('span');t.appendChild(document.createTextNode(ok?'¡Mail confirmado! ':'Hola, '));t.appendChild(el('b',null,u.nombre));b.appendChild(t);var x=el('button',null,'Salir');x.type='button';x.onclick=function(){post('/api/logout').then(function(){location.reload()})};b.appendChild(x);
 if(ok)history.replaceState(null,'','/');
 [['g1',u.nombre],['g2',u.empresa],['g3',u.cuit],['g4',u.whatsapp]].forEach(function(p){var e=$(p[0]);if(e&&!e.value&&p[1])e.value=p[1]});
 fetch('/api/descuento').then(function(r){return r.ok?r.json():null}).then(function(x){if(x&&x.descuento>0){S.desc=x.descuento;draw()}}).catch(function(){})}).catch(function(){})}
function load(){fetch('/api/catalogo').then(function(r){if(r.status===401){showAuth();return}return r.json().then(function(d){if(d.error)throw new Error(d.error);S.items=d.items;S.minimo=d.minimo;$('gupd').textContent=d.actualizado?'Lista actualizada: '+d.actualizado:'';cats();restore();render();who()})}).catch(function(){$('gitems').innerHTML='';$('gitems').appendChild(el('p','empty','No pudimos cargar la lista en este momento. Escribinos por WhatsApp.'))})}
var gb=$('gbar'),ct=document.querySelector('.gr-cart');
if(gb&&ct){gb.onclick=function(){ct.scrollIntoView({behavior:'smooth',block:'start'})};
 if(typeof window.IntersectionObserver==='function'){new IntersectionObserver(function(en){document.body.classList.toggle('cart-below',!en[0].isIntersecting)},{threshold:0.05}).observe(ct)}else{document.body.classList.add('cart-below')}}
load();
})();
