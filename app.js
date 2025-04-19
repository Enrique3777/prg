let db;
let bancoEditando = null;
let usuarioEditando = null;

function abrirBD() {
  const request = indexedDB.open("camaraCompensacionDB", 1);
  request.onupgradeneeded = (e) => {
    db = e.target.result;
    if (!db.objectStoreNames.contains("bancos"))
      db.createObjectStore("bancos", { keyPath: "id", autoIncrement: true });
    if (!db.objectStoreNames.contains("usuarios"))
      db.createObjectStore("usuarios", { keyPath: "id", autoIncrement: true });
    if (!db.objectStoreNames.contains("transferencias"))
      db.createObjectStore("transferencias", { keyPath: "id", autoIncrement: true });
  };
  request.onsuccess = (e) => {
    db = e.target.result;
    cargarDatos();
  };
}

function mostrarSeccion(seccion) {
  document.querySelectorAll(".seccion").forEach(s => s.classList.add("d-none"));
  document.getElementById("seccion-" + seccion).classList.remove("d-none");
  cargarDatos();
}

function guardarBanco() {
  const nombre = document.getElementById("nombreBanco").value.trim();
  if (!nombre) return alert("Ingresa un nombre válido");
  const tx = db.transaction("bancos", "readwrite");
  const store = tx.objectStore("bancos");
  if (bancoEditando !== null) {
    store.put({ id: bancoEditando, nombre });
    bancoEditando = null;
  } else {
    store.add({ nombre });
  }
  tx.oncomplete = () => {
    document.getElementById("nombreBanco").value = "";
    cargarDatos();
  };
}

function guardarUsuario() {
  const nombre = document.getElementById("nombreUsuario").value.trim();
  const banco_id = parseInt(document.getElementById("bancoUsuario").value);
  if (!nombre || isNaN(banco_id)) return alert("Completa todos los campos");
  const tx = db.transaction("usuarios", "readwrite");
  const store = tx.objectStore("usuarios");
  if (usuarioEditando !== null) {
    store.put({ id: usuarioEditando, nombre, banco_id });
    usuarioEditando = null;
  } else {
    store.add({ nombre, banco_id });
  }
  tx.oncomplete = () => {
    document.getElementById("nombreUsuario").value = "";
    cargarDatos();
  };
}

function realizarTransferencia() {
  const origen = parseInt(document.getElementById("usuarioOrigen").value);
  const destino = parseInt(document.getElementById("usuarioDestino").value);
  const monto = parseFloat(document.getElementById("montoTransferencia").value);
  if (isNaN(origen) || isNaN(destino) || isNaN(monto)) return alert("Datos inválidos");
  const tx = db.transaction("transferencias", "readwrite");
  tx.objectStore("transferencias").add({ origen, destino, monto });
  tx.oncomplete = cargarDatos;
}

function cargarDatos() {
  const bancos = {}, usuarios = {};
  const tx1 = db.transaction("bancos", "readonly").objectStore("bancos");
  tx1.getAll().onsuccess = e => {
    const data = e.target.result;
    document.getElementById("tabla-bancos").innerHTML = data.map(b =>
      `<tr><td>${b.id}</td><td>${b.nombre}</td>
      <td><button onclick="editarBanco(${b.id})" class="btn btn-warning btn-sm">Editar</button>
      <button onclick="eliminarBanco(${b.id})" class="btn btn-danger btn-sm">Eliminar</button></td></tr>`
    ).join("");
    const select = document.getElementById("bancoUsuario");
    select.innerHTML = '<option value="">Selecciona un banco</option>' + data.map(b =>
      `<option value="${b.id}">${b.nombre}</option>`).join("");
    data.forEach(b => bancos[b.id] = b.nombre);
  };

  const tx2 = db.transaction("usuarios", "readonly").objectStore("usuarios");
  tx2.getAll().onsuccess = e => {
    const data = e.target.result;
    document.getElementById("tabla-usuarios").innerHTML = data.map(u =>
      `<tr><td>${u.id}</td><td>${u.nombre}</td><td>${bancos[u.banco_id] || "-"}</td>
      <td><button onclick="editarUsuario(${u.id})" class="btn btn-warning btn-sm">Editar</button>
      <button onclick="eliminarUsuario(${u.id})" class="btn btn-danger btn-sm">Eliminar</button></td></tr>`
    ).join("");
    document.getElementById("usuarioOrigen").innerHTML =
    document.getElementById("usuarioDestino").innerHTML =
      data.map(u => `<option value="${u.id}">${u.nombre}</option>`).join("");
    data.forEach(u => usuarios[u.id] = u.nombre);
  };

  const tx3 = db.transaction("transferencias", "readonly").objectStore("transferencias");
  tx3.getAll().onsuccess = e => {
    const data = e.target.result;
    document.getElementById("tabla-transferencias").innerHTML = data.map(t =>
      `<tr><td>${t.id}</td><td>${t.origen}</td><td>${t.destino}</td><td>${t.monto}</td></tr>`
    ).join("");
  };
}

function editarBanco(id) {
  const tx = db.transaction("bancos", "readonly");
  const store = tx.objectStore("bancos");
  store.get(id).onsuccess = e => {
    const banco = e.target.result;
    document.getElementById("nombreBanco").value = banco.nombre;
    bancoEditando = banco.id;
  };
}

function eliminarBanco(id) {
  if (confirm("¿Eliminar banco?")) {
    const tx = db.transaction("bancos", "readwrite");
    tx.objectStore("bancos").delete(id);
    tx.oncomplete = cargarDatos;
  }
}

function editarUsuario(id) {
  const tx = db.transaction("usuarios", "readonly");
  const store = tx.objectStore("usuarios");
  store.get(id).onsuccess = e => {
    const usuario = e.target.result;
    document.getElementById("nombreUsuario").value = usuario.nombre;
    document.getElementById("bancoUsuario").value = usuario.banco_id;
    usuarioEditando = usuario.id;
  };
}

function eliminarUsuario(id) {
  if (confirm("¿Eliminar usuario?")) {
    const tx = db.transaction("usuarios", "readwrite");
    tx.objectStore("usuarios").delete(id);
    tx.oncomplete = cargarDatos;
  }
}
