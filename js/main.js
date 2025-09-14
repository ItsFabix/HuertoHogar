// ===== Claves de LocalStorage =====
const LS_KEY_PROD = "productosAdmin";
const LS_KEY_CART = "carrito";

// ===== Semilla de productos  =====
function seedFromProductsFile() {
  const actual = JSON.parse(localStorage.getItem(LS_KEY_PROD) || "[]");
  if (actual && actual.length) return;
  if (Array.isArray(window.PRODUCTS) && window.PRODUCTS.length) {
    localStorage.setItem(LS_KEY_PROD, JSON.stringify(window.PRODUCTS));
  }
}

// ===== Helpers de catálogo y carrito =====
function getProductos(){ return JSON.parse(localStorage.getItem(LS_KEY_PROD) || "[]"); }
function getCarrito(){ return JSON.parse(localStorage.getItem(LS_KEY_CART) || "[]"); }
function setCarrito(arr){ localStorage.setItem(LS_KEY_CART, JSON.stringify(arr)); }

// ===== Toast (notificación no bloqueante) =====
function ensureToastContainer(){
  let c = document.getElementById("toast-container");
  if(!c){
    c = document.createElement("div");
    c.id = "toast-container";
    document.body.appendChild(c);
  }
  return c;
}
function showToast(msg){
  const cont = ensureToastContainer();
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  cont.appendChild(el);
  setTimeout(()=> el.remove(), 2600);
}

// ===== Contador del carrito (icono 🛒) =====
function updateCartCount(){
  const el = document.getElementById("cart-count");
  if(!el) return;
  const total = getCarrito().reduce((s,i)=> s + (i.cantidad || 0), 0);
  el.textContent = total;
}

// ===== Añadir al carrito =====
function agregarAlCarrito(codigo){
  const prods = getProductos();
  const p = prods.find(x=>x.codigo===codigo);
  if(!p) return alert("Producto no encontrado.");

  let cart = getCarrito();
  const i = cart.findIndex(x=>x.codigo===codigo);
  if (i >= 0) cart[i].cantidad += 1;
  else cart.push({ codigo:p.codigo, nombre:p.nombre, precio:p.precio, cantidad:1 });
  setCarrito(cart);

  if (typeof showToast === "function") showToast(`Añadido al carrito: ${p.nombre} 🛒`);
  updateCartCount();
}

// ===== Categorías =====
const norm = s => (s || "").toString().trim().toLowerCase();

function obtenerCategoriasDesde(data){
  const map = new Map(); // clave normalizada -> etiqueta original
  for (const p of data || []) {
    const raw = (p.categoria || "").toString().trim();
    const key = norm(raw);
    if (key && !map.has(key)) map.set(key, raw);
  }
  return Array.from(map.values()).sort((a,b)=> a.localeCompare(b,'es'));
}

function poblarCategorias(data){
  const sel = document.getElementById("fCategoria");
  if (!sel) return;
  const opts = obtenerCategoriasDesde(data)
    .map(cat => `<option value="${cat}">${cat}</option>`).join("");
  sel.innerHTML = `<option value="">Todas las categorías</option>${opts}`;
}

// ===== Render de catálogo con filtros =====
function renderProductos(containerId="lista-productos"){
  const cont = document.getElementById(containerId);
  if (!cont) return;

  const data = getProductos();
  if (!data.length){ cont.innerHTML = "<p>No hay productos.</p>"; return; }

  poblarCategorias(data);

  const selCat = document.getElementById("fCategoria");
  const inpQ   = document.getElementById("fBuscar");

  function pintar(lista){
    cont.innerHTML = "";
    lista.forEach(p=>{
      const card = document.createElement("article");
      card.className = "card";
      card.innerHTML = `
        <img class="card-img" src="${p.imagen || 'img/productos/placeholder.jpg'}" alt="${p.nombre}">
        <h3>${p.nombre}</h3>
        <p class="precio">$${Number(p.precio).toLocaleString("es-CL")}</p>
        <p class="cat">${p.categoria || ''}</p>
        <div class="acciones">
          <a class="btn" href="detalle-producto.html?id=${encodeURIComponent(p.codigo)}">Ver detalle</a>
          <button class="btn" data-add="${p.codigo}">Añadir</button>
        </div>
      `;
      cont.appendChild(card);
    });
    cont.querySelectorAll("[data-add]").forEach(b=>{
      b.addEventListener("click", ()=> agregarAlCarrito(b.dataset.add));
    });
  }

  function aplicar(){
    const cat = selCat?.value || "";
    const q   = norm(inpQ?.value || "");
    let lista = data.slice();               

    if (cat) {
      const ncat = norm(cat);
      lista = lista.filter(p => norm(p.categoria) === ncat);
    }
    if (q) {
      lista = lista.filter(p =>
        norm(p.nombre).includes(q) ||
        norm(p.descripcion).includes(q)
      );
    }
    pintar(lista);
  }

  pintar(data);
  selCat?.addEventListener("change", aplicar);
  inpQ?.addEventListener("input", aplicar);
}

// ===== Destacados del Home (primeros N del catálogo) =====
  function renderDestacados(containerId="destacados", cantidad=6){
    const cont = document.getElementById(containerId);
    if (!cont) return;

    const data = getProductos();
    if (!data.length){
      cont.innerHTML = "<p>No hay productos destacados.</p>";
      return;
    }

    const lista = data.slice(0, cantidad);
    cont.innerHTML = "";
    lista.forEach(p=>{
      const card = document.createElement("article");
      card.className = "card";
      card.innerHTML = `
        <img class="card-img" src="${p.imagen || 'img/productos/placeholder.jpg'}" alt="${p.nombre}">
        <h3>${p.nombre}</h3>
        <p class="precio">$${Number(p.precio).toLocaleString("es-CL")}</p>
        <div class="acciones">
          <a class="btn" href="detalle-producto.html?id=${encodeURIComponent(p.codigo)}">Ver</a>
          <button class="btn" data-add="${p.codigo}">Añadir</button>
        </div>
      `;
      cont.appendChild(card);
    });

    cont.querySelectorAll("[data-add]").forEach(b=>{
      b.addEventListener("click", ()=> agregarAlCarrito(b.dataset.add));
    });
  }

  // ===== Boot =====
  document.addEventListener("DOMContentLoaded", ()=>{
    seedFromProductsFile();

    if (document.getElementById("lista-productos")) renderProductos("lista-productos");
    if (document.getElementById("destacados")) renderDestacados("destacados", 6);

    updateCartCount(); // siempre sincroniza el badge al cargar
  });
