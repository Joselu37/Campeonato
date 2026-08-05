// ==========================================
// 1. CONFIGURACIÓN DE FIREBASE (¡MUY IMPORTANTE!)
// ==========================================
// Reemplaza esto con los datos de tu proyecto de Firebase
const firebaseConfig = {
    apiKey: "// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCt22KpsfZXQkHaxYyFEyLWxYPZ2FkRg74",
  authDomain: "torneo-comunicaciones.firebaseapp.com",
  databaseURL: "https://torneo-comunicaciones-default-rtdb.firebaseio.com",
  projectId: "torneo-comunicaciones",
  storageBucket: "torneo-comunicaciones.firebasestorage.app",
  messagingSenderId: "200377825369",
  appId: "1:200377825369:web:52343353d747100cc19948"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);",
    authDomain: "PEGAR_AQUI_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://PEGAR_AQUI_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "PEGAR_AQUI_PROJECT_ID",
    storageBucket: "PEGAR_AQUI_PROJECT_ID.appspot.com",
    messagingSenderId: "PEGAR_AQUI_SENDER_ID",
    appId: "PEGAR_AQUI_APP_ID"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ==========================================
// 2. ESTADO GLOBAL Y SINCRONIZACIÓN
// ==========================================
let torneoData = {
    equipos: {},
    partidos: {},
    sponsors: {}
};

// Escuchar cambios en la base de datos en TIEMPO REAL
db.ref('torneo').on('value', (snapshot) => {
    if (snapshot.exists()) {
        torneoData = snapshot.val();
        if(!torneoData.equipos) torneoData.equipos = {};
        if(!torneoData.partidos) torneoData.partidos = {};
        if(!torneoData.sponsors) torneoData.sponsors = {};
    } else {
        // Si la base de datos está vacía, cargar sponsors por defecto
        cargarSponsorsPorDefecto();
    }
    renderizarTodo();
}, (error) => {
    console.error("Error de Firebase. ¿Pusiste los datos de configuración?", error);
    document.getElementById('lista-partidos-publico').innerHTML = `
        <div class="bg-red-100 text-red-700 p-4 rounded text-center font-bold">
            ¡Falta configurar Firebase! Abre app.js y pega tus credenciales.
        </div>
    `;
});

// ==========================================
// 3. FUNCIONES DE INTERFAZ (TABS)
// ==========================================
function cambiarTab(tab) {
    document.getElementById('view-fixture').classList.add('hidden');
    document.getElementById('view-sponsors').classList.add('hidden');
    document.getElementById('view-admin').classList.add('hidden');
    
    document.getElementById('tab-fixture').classList.remove('active');
    document.getElementById('tab-sponsors').classList.remove('active');
    document.getElementById('tab-admin').classList.remove('active');

    if (tab === 'admin') {
        document.getElementById('view-admin').classList.remove('hidden');
        document.getElementById('tab-admin').classList.add('active');
    } else {
        document.getElementById(`view-${tab}`).classList.remove('hidden');
        document.getElementById(`tab-${tab}`).classList.add('active');
    }
}

window.intentarLogin = function() {
    const pin = prompt("Ingrese PIN de Administrador:");
    if (pin === "2024") {
        cambiarTab('admin');
    } else if (pin !== null) {
        alert("PIN Incorrecto");
    }
}

window.cerrarAdmin = function() {
    cambiarTab('fixture');
}

// ==========================================
// 4. MOTOR DE RENDERIZADO (DIBUJAR PANTALLA)
// ==========================================
function renderizarTodo() {
    renderFixturePublico();
    renderSponsorsPublico();
    renderAdminEquipos();
    renderAdminSponsors();
    renderAdminPartidos();
}

function formatearFecha(fechaStr) {
    const partes = fechaStr.split('-');
    if(partes.length !== 3) return fechaStr;
    return `${partes[2]}/${partes[1]}`; // Devuelve DD/MM
}

function renderFixturePublico() {
    const contenedor = document.getElementById('lista-partidos-publico');
    contenedor.innerHTML = '';
    
    const partidos = Object.entries(torneoData.partidos).map(([id, data]) => ({id, ...data}));
    // Ordenar por fecha y hora
    partidos.sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));

    if (partidos.length === 0) {
        contenedor.innerHTML = '<p class="text-center text-gray-500 py-10">No hay partidos programados aún.</p>';
        return;
    }

    partidos.forEach(p => {
        const equipo1 = torneoData.equipos[p.equipo1] ? torneoData.equipos[p.equipo1].nombre : 'Equipo Borrado';
        const equipo2 = torneoData.equipos[p.equipo2] ? torneoData.equipos[p.equipo2].nombre : 'Equipo Borrado';
        
        let resultadoHTML = '';
        if (p.estado === 'finalizado') {
            resultadoHTML = `<div class="bg-black text-yellow-400 font-black text-xl px-4 py-2 rounded shadow-inner mx-2">${p.goles1} - ${p.goles2}</div>`;
        } else {
            resultadoHTML = `<div class="bg-gray-200 text-gray-500 font-bold text-sm px-3 py-1 rounded mx-2 border border-gray-300">VS</div>`;
        }

        contenedor.innerHTML += `
            <div class="bg-white rounded-xl shadow-md p-4 mb-4 border-l-4 ${p.estado === 'finalizado' ? 'border-gray-800' : 'border-yellow-400'}">
                <div class="flex justify-between text-xs text-gray-500 font-bold mb-3 uppercase tracking-wider border-b pb-2">
                    <span><i class="far fa-calendar-alt"></i> ${formatearFecha(p.fecha)}</span>
                    <span><i class="far fa-clock"></i> ${p.hora} hs</span>
                    <span class="${p.estado === 'finalizado' ? 'text-green-600' : 'text-yellow-600'}">${p.estado === 'finalizado' ? 'FINALIZADO' : 'PENDIENTE'}</span>
                </div>
                <div class="flex justify-between items-center mt-2">
                    <span class="font-bold w-2/5 text-right text-sm md:text-base break-words">${equipo1}</span>
                    ${resultadoHTML}
                    <span class="font-bold w-2/5 text-left text-sm md:text-base break-words">${equipo2}</span>
                </div>
            </div>
        `;
    });
}

function renderSponsorsPublico() {
    const contenedor = document.getElementById('lista-sponsors-publico');
    contenedor.innerHTML = '';
    const sponsors = Object.values(torneoData.sponsors);
    
    sponsors.forEach(s => {
        contenedor.innerHTML += `
            <a href="${s.url !== '' ? s.url : '#'}" target="_blank" class="bg-white p-4 rounded-xl shadow flex flex-col items-center justify-center hover:bg-gray-50 transition">
                <img src="${s.img}" alt="${s.nombre}" class="h-16 object-contain mb-2">
                <span class="text-xs font-bold text-gray-600">${s.nombre}</span>
            </a>
        `;
    });
}

// ==========================================
// 5. FUNCIONES ADMINISTRATIVAS (CRUD)
// ==========================================

// --- EQUIPOS ---
window.agregarEquipo = function() {
    const nombre = document.getElementById('nuevo-equipo').value.trim();
    if (!nombre) return;
    const id = 'eq_' + Date.now();
    db.ref('torneo/equipos/' + id).set({ nombre: nombre });
    document.getElementById('nuevo-equipo').value = '';
}
window.eliminarEquipo = function(id) {
    if(confirm("¿Seguro que deseas eliminar este equipo?")) {
        db.ref('torneo/equipos/' + id).remove();
    }
}
function renderAdminEquipos() {
    const ul = document.getElementById('lista-equipos-admin');
    const select1 = document.getElementById('equipo-local');
    const select2 = document.getElementById('equipo-visitante');
    
    ul.innerHTML = '';
    select1.innerHTML = '<option value="">Local...</option>';
    select2.innerHTML = '<option value="">Visitante...</option>';

    Object.entries(torneoData.equipos).forEach(([id, eq]) => {
        ul.innerHTML += `<li class="flex justify-between items-center bg-gray-700 p-2 rounded">
            <span>${eq.nombre}</span>
            <button onclick="eliminarEquipo('${id}')" class="text-red-400 hover:text-red-300"><i class="fas fa-trash"></i></button>
        </li>`;
        select1.innerHTML += `<option value="${id}">${eq.nombre}</option>`;
        select2.innerHTML += `<option value="${id}">${eq.nombre}</option>`;
    });
}

// --- PARTIDOS ---
window.agregarPartido = function() {
    const fecha = document.getElementById('fecha-partido').value;
    const hora = document.getElementById('hora-partido').value;
    const eq1 = document.getElementById('equipo-local').value;
    const eq2 = document.getElementById('equipo-visitante').value;

    if(!fecha || !hora || !eq1 || !eq2) {
        alert("Completa todos los campos (Fecha, Hora, Local y Visitante)");
        return;
    }
    if(eq1 === eq2) {
        alert("Un equipo no puede jugar contra sí mismo.");
        return;
    }

    const id = 'partido_' + Date.now();
    db.ref('torneo/partidos/' + id).set({
        fecha: fecha,
        hora: hora,
        equipo1: eq1,
        equipo2: eq2,
        estado: 'pendiente', // pendiente o finalizado
        goles1: 0,
        goles2: 0
    });
}

window.guardarResultado = function(id) {
    const goles1 = document.getElementById(`goles1_${id}`).value;
    const goles2 = document.getElementById(`goles2_${id}`).value;
    
    if(goles1 === '' || goles2 === '') {
        alert("Ingresa los goles de ambos equipos."); return;
    }

    db.ref('torneo/partidos/' + id).update({
        estado: 'finalizado',
        goles1: parseInt(goles1),
        goles2: parseInt(goles2)
    });
}

window.marcarPendiente = function(id) {
    db.ref('torneo/partidos/' + id).update({ estado: 'pendiente', goles1: 0, goles2: 0 });
}

window.eliminarPartido = function(id) {
    if(confirm("¿Eliminar este partido del fixture?")) {
        db.ref('torneo/partidos/' + id).remove();
    }
}

function renderAdminPartidos() {
    const contenedor = document.getElementById('lista-partidos-admin');
    contenedor.innerHTML = '';
    
    const partidos = Object.entries(torneoData.partidos).map(([id, data]) => ({id, ...data}));
    partidos.sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora)); // Más nuevos arriba

    partidos.forEach(p => {
        const equipo1 = torneoData.equipos[p.equipo1] ? torneoData.equipos[p.equipo1].nombre : '???';
        const equipo2 = torneoData.equipos[p.equipo2] ? torneoData.equipos[p.equipo2].nombre : '???';
        
        let controlesHTML = '';
        if (p.estado === 'pendiente') {
            controlesHTML = `
                <div class="flex items-center gap-2 mt-2 bg-gray-600 p-2 rounded">
                    <input type="number" id="goles1_${p.id}" placeholder="Goles L" class="w-16 text-black p-1 text-center font-bold rounded">
                    <span class="text-sm">vs</span>
                    <input type="number" id="goles2_${p.id}" placeholder="Goles V" class="w-16 text-black p-1 text-center font-bold rounded">
                    <button onclick="guardarResultado('${p.id}')" class="bg-green-500 text-white px-3 py-1 rounded text-sm font-bold ml-auto hover:bg-green-600">Finalizar</button>
                </div>
            `;
        } else {
            controlesHTML = `
                <div class="flex items-center justify-between mt-2 bg-gray-900 p-2 rounded border border-gray-600">
                    <span class="font-bold text-yellow-400">Resultado: ${p.goles1} - ${p.goles2}</span>
                    <button onclick="marcarPendiente('${p.id}')" class="bg-gray-500 text-white px-3 py-1 rounded text-xs hover:bg-gray-400">Reabrir Partido</button>
                </div>
            `;
        }

        contenedor.innerHTML += `
            <div class="bg-gray-700 p-3 rounded-lg border-l-4 ${p.estado === 'finalizado' ? 'border-green-500' : 'border-yellow-500'}">
                <div class="flex justify-between items-center mb-1 border-b border-gray-600 pb-1">
                    <span class="text-xs text-gray-300">${formatearFecha(p.fecha)} - ${p.hora}hs</span>
                    <button onclick="eliminarPartido('${p.id}')" class="text-red-400 hover:text-red-300 text-sm" title="Eliminar Partido"><i class="fas fa-times"></i></button>
                </div>
                <div class="font-bold text-sm">${equipo1} vs ${equipo2}</div>
                ${controlesHTML}
            </div>
        `;
    });
}

// --- SPONSORS ---
window.agregarSponsor = function() {
    const nombre = document.getElementById('sponsor-nombre').value;
    const img = document.getElementById('sponsor-img').value;
    const url = document.getElementById('sponsor-url').value;

    if(!nombre || !img) { alert("Nombre e Imagen son obligatorios"); return; }

    const id = 'sp_' + Date.now();
    db.ref('torneo/sponsors/' + id).set({ nombre, img, url });
    
    document.getElementById('sponsor-nombre').value = '';
    document.getElementById('sponsor-img').value = '';
    document.getElementById('sponsor-url').value = '';
}
window.eliminarSponsor = function(id) {
    if(confirm("¿Eliminar este auspiciante?")) { db.ref('torneo/sponsors/' + id).remove(); }
}
function renderAdminSponsors() {
    const ul = document.getElementById('lista-sponsors-admin');
    ul.innerHTML = '';
    Object.entries(torneoData.sponsors).forEach(([id, s]) => {
        ul.innerHTML += `
            <li class="flex justify-between items-center bg-gray-700 p-2 rounded">
                <div class="flex items-center gap-2 overflow-hidden">
                    <img src="${s.img}" class="h-6 bg-white rounded p-1">
                    <span class="truncate">${s.nombre}</span>
                </div>
                <button onclick="eliminarSponsor('${id}')" class="text-red-400 ml-2"><i class="fas fa-trash"></i></button>
            </li>
        `;
    });
}

function cargarSponsorsPorDefecto() {
    const defaults = {
        'sp_1': { nombre: 'Gobierno de Corrientes', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Escudo_de_la_Provincia_de_Corrientes.svg/1200px-Escudo_de_la_Provincia_de_Corrientes.svg.png', url: 'https://www.corrientes.gob.ar/' },
        'sp_2': { nombre: 'Banco de Corrientes', img: 'https://www.bancodecorrientes.com.ar/assets/img/logo-banco.png', url: 'https://www.bancodecorrientes.com.ar/' },
        'sp_3': { nombre: 'Taragüí', img: 'https://taragui.com/wp-content/uploads/2021/05/logo-taragui.svg', url: 'https://www.taragui.com/' }
    };
    db.ref('torneo/sponsors').set(defaults);
}
