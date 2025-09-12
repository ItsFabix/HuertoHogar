const LS_KEY_CART = "carrito";

/* ===== Helpers de almacenamiento ===== */
function getCarrito(){
  try {
    const raw = localStorage.getItem(LS_KEY_CART);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch(e){ return []; }
}
function setCarrito(arr){
  localStorage.setItem(LS_KEY_CART, JSON.stringify(Array.isArray(arr) ? arr : []));
}

/* ===== Migración de posibles claves antiguas ===== */
(function normalizeCartKey(){
  const legacyKeys = ["cart", "carro", "miCarrito"];
  if (!localStorage.getItem(LS_KEY_CART)) {
    for (const k of legacyKeys) {
      const v = localStorage.getItem(k);
      if (v) { localStorage.setItem(LS_KEY_CART, v); localStorage.removeItem(k); break; }
    }
  }
})();

/* ===== Asegura que existan contenedores mínimos ===== */
function ensureCartDOM(){
  let main = document.querySelector("main.container") || document.querySelector("main");
  if (!main) {
    main = document.createElement("main");
    main.className = "container";
    document.body.appendChild(main);
  }
  let vacio = document.getElementById("carrito-vacio");
  let box   = document.getElementById("carrito");
  let total = document.getElementById("total");

  if (!vacio) {
    vacio = document.createElement("p");
    vacio.id = "carrito-vacio";
    vacio.textContent = "Tu carrito está vacío.";
    main.appendChild(vacio);
  }
  if (!box) {
    box = document.createElement("div");
    box.id = "carrito";
    main.appendChild(box);
  }
  if (!total) {
    total = document.createElement("p");
    total.id = "total";
    total.className = "precio";
    total.style.marginTop = "12px";
    main.appendChild(total);
  }
  return { box, total, vacio };
}

/* ===== Render del carrito ===== */
function renderCarrito(){
  const { box, total, vacio } = ensureCartDOM();
  let cart = getCarrito();

  if(!cart.length){
    box.innerHTML = "";
    total.textContent = "";
    vacio.style.display = "block";
    if (typeof updateCartCount === "function") updateCartCount();
    return;
  } else {
    vacio.style.display = "none";
  }

  box.innerHTML = "";
  cart.forEach((item,idx)=>{
    const row = document.createElement("div");
    row.className = "row-cart";
    row.innerHTML = `
      <span>${item.nombre}</span>
      <span>$${Number(item.precio).toLocaleString("es-CL")}</span>
      <div class="qty">
        <button data-dec="${idx}">–</button>
        <b>${item.cantidad}</b>
        <button data-inc="${idx}">+</button>
      </div>
      <span>$${Number(item.precio * item.cantidad).toLocaleString("es-CL")}</span>
      <button data-del="${idx}">Eliminar</button>
    `;
    box.appendChild(row);
  });

  const suma = cart.reduce((s,p)=> s + (Number(p.precio)||0) * (Number(p.cantidad)||0), 0);
  total.textContent = "Total: $" + suma.toLocaleString("es-CL");

  // acciones
  box.querySelectorAll("[data-inc]").forEach(b=>{
    b.onclick = ()=>{
      let c = getCarrito(); const i = +b.dataset.inc;
      c[i].cantidad += 1; setCarrito(c); renderCarrito();
    };
  });
  box.querySelectorAll("[data-dec]").forEach(b=>{
    b.onclick = ()=>{
      let c = getCarrito(); const i = +b.dataset.dec;
      c[i].cantidad -= 1; if(c[i].cantidad<=0) c.splice(i,1);
      setCarrito(c); renderCarrito();
    };
  });
  box.querySelectorAll("[data-del]").forEach(b=>{
    b.onclick = ()=>{
      let c = getCarrito(); c.splice(+b.dataset.del,1);
      setCarrito(c); renderCarrito();
    };
  });

  if (typeof updateCartCount === "function") updateCartCount();
}

/* ===== Arranque robusto ===== */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderCarrito);
} else {
  renderCarrito();
}
