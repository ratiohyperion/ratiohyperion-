(function(){
var KEY='rh_cart:',W='5491160121797';
function load(){try{var n=window.name;if(n.indexOf(KEY)===0)return JSON.parse(n.slice(KEY.length))}catch(e){}return[]}
function save(){try{window.name=KEY+JSON.stringify(cart)}catch(e){}}
var cart=load();
function $(i){return document.getElementById(i)}
// inject cart button on pages whose header lacks it
if(!$('cartbtn')){var h=document.querySelector('.hdr .wrap'),b=document.querySelector('.hdr .btn-blue');
 if(h&&b){var c=document.createElement('button');c.className='cartbtn';c.id='cartbtn';c.innerHTML='<svg viewBox="0 0 24 24"><path d="M3 5h2l2.2 10.5a2 2 0 0 0 2 1.5h7.6a2 2 0 0 0 2-1.5L20 8H6"/><circle cx="10" cy="20" r="1.3"/><circle cx="17" cy="20" r="1.3"/></svg><span>Mi consulta</span><i id="cartn">0</i>';h.insertBefore(c,b);}
 var nv=document.querySelector('.hdr .nav');if(nv)nv.id='nav';var bg=document.querySelector('.burger');if(bg)bg.id='burger';}
if(!$('drawer')){var d=document.createElement('div');d.className='drawer';d.id='drawer';d.innerHTML='<div class="dr-in"><div class="dr-h"><b>Mi consulta</b><button id="drx" aria-label="Cerrar">✕</button></div><p class="dr-s">Elegí las soluciones que te interesan y te armamos la propuesta. Sin precios, sin compromiso.</p><ul id="drlist"></ul><div id="dract"><div class="dr-form"><div><label for="c1">Nombre y apellido *</label><input id="c1" autocomplete="name" placeholder="Ej.: María Gómez"></div><div><label for="c2">WhatsApp o email de contacto *</label><input id="c2" autocomplete="email" placeholder="11 5555 5555 o tu@email.com"></div><div><label for="c3">Empresa o consorcio</label><input id="c3" placeholder="Opcional"></div><div><label for="c4">Tipo de cliente</label><select id="c4"><option>Administración de consorcio</option><option>Empresa / industria</option><option>Comercio</option><option>Gremio / instalador</option><option>Particular</option></select></div><div><label for="c5">Comentarios</label><textarea id="c5" rows="3" placeholder="Dirección, plazos, dudas…"></textarea></div></div><p class="dr-msg" id="drmsg"></p><button class="btn btn-wa" id="drwa">Enviar por WhatsApp</button><button class="btn btn-line" id="drmail">Enviar por mail</button><button class="lnk" id="drclr">Vaciar consulta</button></div></div>';document.body.appendChild(d);}
function buildText(){var g=function(i){return ($(i)||{}).value||''};return 'Hola, soy '+g('c1').trim()+(g('c3').trim()?' ('+g('c3').trim()+')':'')+' · '+g('c4')+'.\nContacto: '+g('c2').trim()+'\nQuiero pedir una propuesta para:\n'+cart.map(function(s){return '• '+s}).join('\n')+(g('c5').trim()?'\nComentarios: '+g('c5').trim():'')}
function valid(){var ok=true;['c1','c2'].forEach(function(i){var e=$(i);var bad=!e.value.trim();e.classList.toggle('err',bad);if(bad)ok=false});$('drmsg').textContent=ok?'':'Completá tu nombre y un medio de contacto para poder responderte.';return ok}
function mailFor(){return cart.some(function(x){return /^Servicios/.test(x)})&&!cart.some(function(x){return !/^Servicios/.test(x)})?'servicios@ratiohyperion.com.ar':'proyectos@ratiohyperion.com.ar'}
function render(){
 $('cartn').textContent=cart.length;
 var ul=$('drlist');ul.innerHTML='';
 if(!cart.length){ul.innerHTML='<li class="empty" style="border:0;font-weight:400">Todavía no agregaste nada. Usá “+ Agregar a mi consulta” en cada solución.</li>';$('dract').style.display='none'}
 else{$('dract').style.display='grid';cart.forEach(function(s,i){var li=document.createElement('li');li.textContent=s;var x=document.createElement('button');x.textContent='✕';x.setAttribute('aria-label','Quitar');x.onclick=function(){cart.splice(i,1);save();render()};li.appendChild(x);ul.appendChild(li)});
 }
 document.querySelectorAll('.addbtn').forEach(function(b){var on=cart.indexOf(b.dataset.sol)>-1;b.classList.toggle('on',on);b.textContent=on?'✓ En mi consulta':'+ Agregar a mi consulta'});
}
document.addEventListener('click',function(e){
 var a=e.target.closest('.addbtn');if(a){var s=a.dataset.sol,i=cart.indexOf(s);if(i>-1)cart.splice(i,1);else cart.push(s);save();render();return}
 if(e.target.closest('#cartbtn')){$('drawer').classList.add('open');return}
 if(e.target.id==='drx'||e.target.id==='drawer'){$('drawer').classList.remove('open')}
 if(e.target.id==='drwa'&&valid()){window.open('https://wa.me/'+W+'?text='+encodeURIComponent(buildText()),'_blank');return}
 if(e.target.id==='drmail'&&valid()){window.location.href='mailto:'+mailFor()+'?subject='+encodeURIComponent('Consulta desde la web')+'&body='+encodeURIComponent(buildText());return}
 if(e.target.id==='drclr'){cart=[];save();render()}
 if(e.target.closest('#burger')){var n=document.getElementById('nav')||document.querySelector('.nav');n.classList.toggle('open')}
});
document.addEventListener('keydown',function(e){if(e.key==='Escape')$('drawer').classList.remove('open')});
var f=$('cform');if(f)f.addEventListener('submit',function(e){e.preventDefault();$('fok').hidden=false});
document.addEventListener('input',function(e){if(e.target.classList.contains('err')&&e.target.value.trim())e.target.classList.remove('err')});
render();
})();
