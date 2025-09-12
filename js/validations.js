/* ===== Config correo permitido ===== */
const EMAIL_ALLOWED = /^[^@\s]+@(?:duoc\.cl|profesor\.duoc\.cl|gmail\.com)$/i;

/* ===== Helpers UI ===== */
function setError(input, msg){
  const help = input.parentElement.querySelector(".error");
  if(help) help.textContent = msg || "";
  input.classList.toggle("invalid", !!msg);
}
function clearErrors(form){
  form.querySelectorAll(".error").forEach(e => e.textContent = "");
  form.querySelectorAll(".invalid").forEach(e => e.classList.remove("invalid"));
}

/* ===== Auth LocalStorage (solo para entrega) ===== */
const AUTH_KEY = "usuariosAuth";     // [{correo, pass, nombre}]
const SESSION_KEY = "currentUser";   // {correo, nombre}

function getAuthUsers(){ return JSON.parse(localStorage.getItem(AUTH_KEY)) || []; }
function setAuthUsers(arr){ localStorage.setItem(AUTH_KEY, JSON.stringify(arr)); }
function setSession(user){ localStorage.setItem(SESSION_KEY, JSON.stringify(user)); }
function getSession(){ return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); }

/* ===== Registro ===== */
function setupRegistro(){
  const f = document.getElementById("form-registro");
  if(!f) return;
  f.addEventListener("submit", (e)=>{
    e.preventDefault(); clearErrors(f);
    let ok = true;

    if(!f.nombre.value || f.nombre.value.length > 50){ setError(f.nombre,"Nombre requerido (máx 50)."); ok=false; }
    if(!f.apellidos.value || f.apellidos.value.length > 100){ setError(f.apellidos,"Apellidos requeridos (máx 100)."); ok=false; }
    if(!f.correo.value || f.correo.value.length > 100 || !EMAIL_ALLOWED.test(f.correo.value)){ setError(f.correo,"Correo inválido (duoc.cl, profesor.duoc.cl, gmail.com)."); ok=false; }
    if(!f.pass.value || f.pass.value.length < 4 || f.pass.value.length > 10){ setError(f.pass,"Contraseña 4 a 10 caracteres."); ok=false; }
    if(!ok) return;

    const users = getAuthUsers();
    if (users.some(u => u.correo.toLowerCase() === f.correo.value.toLowerCase())) {
      setError(f.correo, "Este correo ya está registrado.");
      return;
    }
    users.push({ correo: f.correo.value.trim(), pass: f.pass.value, nombre: f.nombre.value.trim() });
    setAuthUsers(users);

    alert("Registro exitoso. Ahora puedes iniciar sesión.");
    f.reset();
  });
}

/* ===== Login → redirige a Admin ===== */
function setupLogin(){
  const f = document.getElementById("form-login");
  if(!f) return;
  f.addEventListener("submit", (e)=>{
    e.preventDefault(); clearErrors(f);
    let ok = true;

    if(!f.correo.value || f.correo.value.length > 100 || !EMAIL_ALLOWED.test(f.correo.value)){ setError(f.correo,"Correo inválido."); ok=false; }
    if(!f.pass.value || f.pass.value.length < 4 || f.pass.value.length > 10){ setError(f.pass,"Contraseña 4 a 10 caracteres."); ok=false; }
    if(!ok) return;

    const users = getAuthUsers();
    const u = users.find(x => x.correo.toLowerCase() === f.correo.value.toLowerCase() && x.pass === f.pass.value);
    if(!u){ setError(f.correo,"Credenciales incorrectas."); setError(f.pass,""); return; }

    setSession({ correo: u.correo, nombre: u.nombre });
    location.href = "admin/index.html";
  });
}

/* ===== Contacto ===== */
function setupContacto(){
  const f = document.getElementById("form-contacto");
  if(!f) return;
  f.addEventListener("submit",(e)=>{
    e.preventDefault(); clearErrors(f);
    let ok = true;

    if(!f.nombre.value || f.nombre.value.length > 100){ setError(f.nombre,"Nombre requerido (máx 100)."); ok=false; }
    if(!f.correo.value || f.correo.value.length > 100 || !EMAIL_ALLOWED.test(f.correo.value)){ setError(f.correo,"Correo inválido."); ok=false; }
    if(!f.comentario.value || f.comentario.value.length > 500){ setError(f.comentario,"Comentario requerido (máx 500)."); ok=false; }

    if(ok){
      alert("Mensaje enviado (demo).");
      f.reset();
    }
  });
}

/* ===== Boot ===== */
document.addEventListener("DOMContentLoaded", ()=>{
  setupRegistro();
  setupLogin();
  setupContacto();
});
