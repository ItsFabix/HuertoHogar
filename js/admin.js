const LS_KEY_PROD = "productosAdmin";
const LS_KEY_USR  = "usuariosAdmin";

/* ===== Guard de sesión ===== */
(function guard(){
  const me = JSON.parse(localStorage.getItem("currentUser") || "null");
  if(!me){ location.href = "../login.html"; }
})();

/* ===== Utilidades ===== */
const getJSON = (k)=> JSON.parse(localStorage.getItem(k)) || [];
const setJSON = (k,v)=> localStorage.setItem(k, JSON.stringify(v));

/* Sembrar catálogo si está vacío */
(function seedIfEmpty(){
  const actual = getJSON(LS_KEY_PROD);
  if (!actual.length && window.PRODUCTS?.length) {
    setJSON(LS_KEY_PROD, window.PRODUCTS);
  }
})();

/* ===== Navegación por sidebar ===== */
function showView(id){
  document.querySelectorAll(".view").forEach(v=> v.classList.remove("active"));
  document.querySelector(id)?.classList.add("active");
  document.querySelectorAll("[data-view-link]").forEach(a=> a.classList.remove("active"));
  const link = document.querySelector(`[data-view-link][href="${id}"]`);
  link?.classList.add("active");
  window.scrollTo({ top: 0 });
}
function bindSidebar(){
  document.querySelectorAll("[data-view-link]").forEach(a=>{
    a.onclick = (e)=>{
      e.preventDefault();
      showView(a.getAttribute("href"));
    };
  });
}

/* ===== Productos ===== */
function drawProductos(){
  const list = document.getElementById("lista-productos-admin");
  const data = getJSON(LS_KEY_PROD);
  list.innerHTML = `
    <div class="thead">
      <span>Código</span><span>Nombre</span><span>Precio</span><span>Stock</span><span>Categoría</span><span>Acciones</span>
    </div>
    ${data.map((p,i)=>`
      <div class="trow">
        <span>${p.codigo}</span>
        <span>${p.nombre}</span>
        <span>$${Number(p.precio).toLocaleString("es-CL")}</span>
        <span>${p.stock}</span>
        <span>${p.categoria||""}</span>
        <span>
          <button data-edit="${i}">Editar</button>
          <button data-del="${i}">Eliminar</button>
        </span>
      </div>
    `).join("")}
  `;
  list.querySelectorAll("[data-edit]").forEach(b=> b.onclick=()=> openProdForm(+b.dataset.edit));
  list.querySelectorAll("[data-del]").forEach(b=> b.onclick=()=>{
    const i = +b.dataset.del; const arr = getJSON(LS_KEY_PROD);
    arr.splice(i,1); setJSON(LS_KEY_PROD, arr); drawProductos();
  });
}
function openProdForm(index=-1){
  const f = document.getElementById("form-prod");
  const t = document.getElementById("form-prod-title");
  f.reset(); f.hidden = false;
  const arr = getJSON(LS_KEY_PROD);
  if(index>=0){
    const p = arr[index]; t.textContent = "Editar producto";
    ["codigo","nombre","precio","stock","stockCritico","categoria","imagen","descripcion"]
      .forEach(k=> f[k].value = p[k] ?? "");
    f.dataset.index = index;
  } else {
    t.textContent = "Nuevo producto";
    delete f.dataset.index;
  }
}
function setErr(el,msg){ el.parentElement.querySelector(".error").textContent = msg||""; el.classList.toggle("invalid", !!msg); }
function validateProd(f){
  let ok = true;
  const precio = parseFloat(f.precio.value);
  const stock  = parseInt(f.stock.value,10);
  const stockC = f.stockCritico.value==="" ? null : parseInt(f.stockCritico.value,10);
  if(!f.codigo.value || f.codigo.value.length<3){ setErr(f.codigo,"Mín 3 chars"); ok=false; }
  if(!f.nombre.value || f.nombre.value.length>100){ setErr(f.nombre,"Req, máx 100"); ok=false; }
  if(isNaN(precio) || precio<0){ setErr(f.precio,"Min 0 (FREE)"); ok=false; }
  if(!Number.isInteger(stock) || stock<0){ setErr(f.stock,"Entero ≥ 0"); ok=false; }
  if(f.descripcion.value.length>500){ setErr(f.descripcion,"Máx 500"); ok=false; }
  if(!f.categoria.value){ setErr(f.categoria,"Seleccione"); ok=false; }
  if(stockC!==null && (!Number.isInteger(stockC) || stockC<0)){ setErr(f.stockCritico,"Entero ≥ 0"); ok=false; }
  return ok;
}
function submitProd(e){
  e.preventDefault();
  const f = e.currentTarget;
  f.querySelectorAll(".error").forEach(s=> s.textContent="");
  f.querySelectorAll(".invalid").forEach(s=> s.classList.remove("invalid"));
  if(!validateProd(f)) return;

  const rec = {
    codigo: f.codigo.value.trim(),
    nombre: f.nombre.value.trim(),
    precio: parseFloat(f.precio.value),
    stock: parseInt(f.stock.value,10),
    stockCritico: f.stockCritico.value==="" ? null : parseInt(f.stockCritico.value,10),
    categoria: f.categoria.value,
    imagen: f.imagen.value.trim(),
    descripcion: f.descripcion.value.trim()
  };
  const arr = getJSON(LS_KEY_PROD);
  const idx = f.dataset.index ? +f.dataset.index : -1;
  if(idx>=0) arr[idx] = rec; else arr.push(rec);
  setJSON(LS_KEY_PROD, arr);
  f.hidden = true; drawProductos(); alert("Producto guardado.");
}

/* ===== Usuarios ===== */
const EMAIL_ALLOWED = /^[^@\s]+@(?:duoc\.cl|profesor\.duoc\.cl|gmail\.com)$/i;
function validarRUN(run){
  const s = run.replace(/\s+/g,"").toUpperCase();
  if(!/^[0-9]{7,8}[0-9K]$/.test(s)) return false;
  const cuerpo = s.slice(0,-1), dv = s.slice(-1);
  let suma=0, mul=2;
  for(let i=cuerpo.length-1;i>=0;i--){ suma += parseInt(cuerpo[i],10)*mul; mul = (mul===7)?2:mul+1; }
  const res = 11 - (suma % 11);
  const dvCalc = (res===11) ? "0" : (res===10 ? "K" : String(res));
  return dv === dvCalc;
}
function bindRegCom(f){
  const r = f.region, c = f.comuna;
  r.innerHTML = "<option value=''>Seleccione</option>" + (window.REGIONES||[])
    .map(x=> `<option>${x.nombre}</option>`).join("");
  r.onchange = ()=>{
    const sel = (window.REGIONES||[]).find(x=> x.nombre===r.value);
    c.innerHTML = "<option value=''>Seleccione</option>" + (sel?.comunas||[])
      .map(y=> `<option>${y}</option>`).join("");
  };
}
function drawUsuarios(){
  const list = document.getElementById("lista-usuarios");
  const data = getJSON(LS_KEY_USR);
  list.innerHTML = `
    <div class="thead">
      <span>RUN</span><span>Nombre</span><span>Correo</span><span>Tipo</span><span>Reg/Comuna</span><span>Acciones</span>
    </div>
    ${data.map((u,i)=>`
      <div class="trow">
        <span>${u.run}</span>
        <span>${u.nombre} ${u.apellidos}</span>
        <span>${u.correo}</span>
        <span>${u.tipo}</span>
        <span>${u.region} / ${u.comuna}</span>
        <span>
          <button data-editu="${i}">Editar</button>
          <button data-delu="${i}">Eliminar</button>
        </span>
      </div>
    `).join("")}
  `;
  list.querySelectorAll("[data-editu]").forEach(b=> b.onclick=()=> openUserForm(+b.dataset.editu));
  list.querySelectorAll("[data-delu]").forEach(b=> b.onclick=()=>{
    const i=+b.dataset.delu; const arr=getJSON(LS_KEY_USR);
    arr.splice(i,1); setJSON(LS_KEY_USR, arr); drawUsuarios();
  });
}
function openUserForm(index=-1){
  const f = document.getElementById("form-usr");
  const t = document.getElementById("form-usr-title");
  f.reset(); f.hidden = false; bindRegCom(f);
  const arr = getJSON(LS_KEY_USR);
  if(index>=0){
    const u = arr[index]; t.textContent = "Editar usuario";
    ["run","correo","nombre","apellidos","tipo","direccion"].forEach(k=> f[k].value = u[k] || "");
    f.region.value = u.region || ""; f.region.onchange(); f.comuna.value = u.comuna || "";
    f.nacimiento.value = u.nacimiento || "";
    f.dataset.index = index;
  } else {
    t.textContent = "Nuevo usuario";
    delete f.dataset.index;
  }
}
function validateUser(f){
  let ok = true;
  const err = (el,msg)=>{ setErr(el,msg); if(msg) ok=false; };
  f.querySelectorAll(".error").forEach(s=> s.textContent="");
  f.querySelectorAll(".invalid").forEach(s=> s.classList.remove("invalid"));

  if(!f.run.value || !/^[0-9Kk]{7,9}$/.test(f.run.value) || !validarRUN(f.run.value)) err(f.run,"RUN inválido");
  if(!f.correo.value || f.correo.value.length>100 || !EMAIL_ALLOWED.test(f.correo.value)) err(f.correo,"Correo no permitido");
  if(!f.nombre.value || f.nombre.value.length>50) err(f.nombre,"Nombre máx 50");
  if(!f.apellidos.value || f.apellidos.value.length>100) err(f.apellidos,"Apellidos máx 100");
  if(!f.tipo.value) err(f.tipo,"Seleccione tipo");
  if(!f.region.value) err(f.region,"Seleccione región");
  if(!f.comuna.value) err(f.comuna,"Seleccione comuna");
  if(!f.direccion.value || f.direccion.value.length>300) err(f.direccion,"Dirección máx 300");
  return ok;
}
function submitUser(e){
  e.preventDefault();
  const f = e.currentTarget;
  if(!validateUser(f)) return;

  const rec = {
    run: f.run.value.trim().toUpperCase(),
    correo: f.correo.value.trim(),
    nombre: f.nombre.value.trim(),
    apellidos: f.apellidos.value.trim(),
    tipo: f.tipo.value,
    nacimiento: f.nacimiento.value,
    region: f.region.value,
    comuna: f.comuna.value,
    direccion: f.direccion.value.trim()
  };
  const arr = getJSON(LS_KEY_USR);
  const idx = f.dataset.index ? +f.dataset.index : -1;
  if(idx>=0) arr[idx] = rec; else arr.push(rec);
  setJSON(LS_KEY_USR, arr);
  f.hidden = true; drawUsuarios(); alert("Usuario guardado.");
}

/* ===== Boot ===== */
document.addEventListener("DOMContentLoaded", ()=>{
  bindSidebar();
  showView("#view-dashboard");

  // saludo + user en sidebar
  const me = JSON.parse(localStorage.getItem("currentUser") || "null");
  const h = document.getElementById("admin-greeting");
  if (me && h) h.textContent = `¡HOLA ${me.nombre || "Administrador"}!`;
  const sbUser = document.getElementById("sb-user");
  if (me && sbUser) sbUser.textContent = me.nombre || "Administrador";

  // logout
  const btnLogout = document.getElementById("logout");
  if (btnLogout) {
    btnLogout.onclick = ()=>{
      localStorage.removeItem("currentUser");
      location.href = "../login.html";
    };
  }

  // botones y render
  document.getElementById("btnNuevoProd").onclick = ()=> openProdForm(-1);
  document.getElementById("cancel-prod").onclick = ()=> document.getElementById("form-prod").hidden = true;
  document.getElementById("form-prod").addEventListener("submit", submitProd);

  document.getElementById("btnNuevoUsr").onclick = ()=> openUserForm(-1);
  document.getElementById("cancel-usr").onclick = ()=> document.getElementById("form-usr").hidden = true;
  document.getElementById("form-usr").addEventListener("submit", submitUser);

  drawProductos();
  drawUsuarios();
});

