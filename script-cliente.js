import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    initializeFirestore,
    collection,
    onSnapshot,
    query,
    orderBy,
    doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyA5BXWwtk7LsDCXmjYhz5LOIv5tz6U1N_A",
    authDomain: "gracia-accesorios.firebaseapp.com",
    projectId: "gracia-accesorios",
    storageBucket: "gracia-accesorios.firebasestorage.app",
    messagingSenderId: "843057510032",
    appId: "1:843057510032:web:148405f256ffd62b5a8a15"
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, { experimentalForceLongPolling: true });

const grid = document.getElementById("productGrid");
const categoryContainer = document.getElementById("categoryFilter");
const cuerpoPagina = document.getElementById("cuerpoPagina");
const tematicaBannerExtra = document.getElementById("tematicaBannerExtra");
const decoracionesDistribuidas = document.getElementById("decoracionesDistribuidas");
const brandLogoImg = document.getElementById("brandLogoImg");
const faviconLogo = document.getElementById("faviconLogo");
const modal = document.getElementById("imageModal");
const modalImg = document.getElementById("imgModalExpanded");
const modalClose = document.getElementById("modalClose");

function volverAlInicio() {
    window.scrollTo({ top: 0, behavior: "smooth" });
}

history.replaceState({ inicio: true }, "", window.location.href);
history.pushState({ catalogo: true }, "", window.location.href);

window.addEventListener("popstate", () => {
    if (modal && modal.style.display === "flex") {
        modal.style.display = "none";
        history.pushState({ catalogo: true }, "", window.location.href);
        return;
    }
    if (window.scrollY > 80 || categoriaActual !== "todos" || limiteVisible > 24) {
        if (categoriaActual !== "todos" || limiteVisible > 24) {
            categoriaActual = "todos";
            limiteVisible = 24;
            actualizarBotonesCategorias();
            renderizarProductos("todos");
        }
        volverAlInicio();
        history.pushState({ catalogo: true }, "", window.location.href);
    } else {
        history.back();
    }
});

if (modalClose && modal) {
    modalClose.addEventListener("click", () => {
        modal.style.display = "none";
    });
    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
        }
    });
}

onSnapshot(doc(db, "configuracion", "tematica"), (docSnap) => {
    if (docSnap.exists()) {
        aplicarTematica(docSnap.data().tematica || "normal");
    } else {
        aplicarTematica("normal");
    }
}, (error) => {
    console.error("Error al leer temática:", error);
});

function aplicarTematica(tipo) {
    if (cuerpoPagina) cuerpoPagina.className = "";
    if (tematicaBannerExtra) tematicaBannerExtra.innerHTML = "";
    if (decoracionesDistribuidas) decoracionesDistribuidas.innerHTML = "";

    if (tipo === "navidad") {
        if (cuerpoPagina) cuerpoPagina.classList.add("theme-navidad");
        if (brandLogoImg) brandLogoImg.src = "IMG_7080.PNG";
        if (faviconLogo) faviconLogo.href = "IMG_7080.PNG";
    } else if (tipo === "independencia") {
        if (cuerpoPagina) cuerpoPagina.classList.add("theme-independencia");
        if (brandLogoImg) brandLogoImg.src = "logo-azul.jpg";
        if (faviconLogo) faviconLogo.href = "logo-azul.jpg";
        if (tematicaBannerExtra) {
            tematicaBannerExtra.innerHTML = `
                <div style="background: #ffffff; text-align: center; padding: 10px; border-top: 3px solid #1e3a8a;">
                    <img src="IMG_7082.JPG.jpeg" alt="Bandera Costa Rica" style="max-height: 130px; width: auto; max-width: 100%; border-radius: 8px;">
                </div>
            `;
        }
        if (decoracionesDistribuidas) {
            decoracionesDistribuidas.innerHTML = `
                <img src="baila.jpg" class="decoracion-lateral" style="bottom: 20px; left: 15px; width: 100px;">
                <img src="IMG_7082.JPG.jpeg" class="decoracion-lateral" style="top: 340px; right: 15px; width: 120px;">
                <img src="baila.jpg" class="decoracion-lateral" style="top: 340px; left: 15px; width: 95px;">
            `;
        }
    } else if (tipo === "san-valentin") {
        if (cuerpoPagina) cuerpoPagina.classList.add("theme-san-valentin");
        if (brandLogoImg) brandLogoImg.src = "rosa-negro.jpg";
        if (faviconLogo) faviconLogo.href = "rosa-negro.jpg";
    } else {
        if (brandLogoImg) brandLogoImg.src = "LOGO.PNG";
        if (faviconLogo) faviconLogo.href = "LOGO.PNG";
    }
}

let productosCache = [];
let categoriasCache = [];
let categoriaActual = "todos";
let limiteVisible = 24;

const qProducts = query(collection(db, "jewelry"), orderBy("creado", "desc"));
onSnapshot(qProducts, (snapshot) => {
    productosCache = [];
    snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.activo !== false) {
            productosCache.push({ id: doc.id, ...data });
        }
    });
    renderizarProductos(categoriaActual);
}, (error) => {
    console.error("Error al leer productos:", error);
});

onSnapshot(collection(db, "categories"), (snapshot) => {
    categoriasCache = [];
    snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.nombre) {
            categoriasCache.push(data.nombre.trim().toLowerCase());
        }
    });
    actualizarBotonesCategorias();
}, (error) => {
    console.error("Error al leer categorías:", error);
});

function actualizarBotonesCategorias() {
    if (!categoryContainer) return;

    let html = `<button class="cat-btn ${categoriaActual === 'todos' ? 'active' : ''}" data-category="todos">✨ Ver Todo</button>`;

    categoriasCache.forEach(cat => {
        const nombreVisual = cat.charAt(0).toUpperCase() + cat.slice(1);
        html += `<button class="cat-btn ${categoriaActual === cat ? 'active' : ''}" data-category="${cat}">${nombreVisual}</button>`;
    });

    categoryContainer.innerHTML = html;

    categoryContainer.querySelectorAll(".cat-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            categoryContainer.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            categoriaActual = btn.getAttribute("data-category");
            limiteVisible = 24;
            renderizarProductos(categoriaActual);
        });
    });
}

function esProductoNuevo(creado) {
    if (!creado) return false;

    let fechaCreacionMs = null;

    if (typeof creado.toDate === "function") {
        fechaCreacionMs = creado.toDate().getTime();
    } else if (typeof creado.seconds === "number") {
        fechaCreacionMs = creado.seconds * 1000;
    } else if (typeof creado === "number") {
        fechaCreacionMs = creado;
    } else {
        const parsed = Date.parse(creado);
        if (!isNaN(parsed)) fechaCreacionMs = parsed;
    }

    if (!fechaCreacionMs) return false;

    const cuatroDiasMs = 4 * 24 * 60 * 60 * 1000;
    const diferencia = Date.now() - fechaCreacionMs;

    return diferencia >= 0 && diferencia < cuatroDiasMs;
}

function renderizarProductos(categoriaFiltro) {
    if (!grid) return;

    const filtrados = productosCache.filter(p =>
        categoriaFiltro === "todos" || (p.categoria && p.categoria.trim().toLowerCase() === categoriaFiltro)
    );

    if (filtrados.length === 0) {
        grid.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 40px 0;">No hay productos disponibles en esta categoría.</p>`;
        return;
    }

    const productosAMostrar = filtrados.slice(0, limiteVisible);

    let contenidoHtml = productosAMostrar.map(p => {
        const etiquetaNuevo = esProductoNuevo(p.creado)
            ? `<span class="badge-nuevo">Nuevo</span>`
            : "";

        return `
            <div class="product-card" data-category="${p.categoria}">
                <div class="product-img-container">
                    ${etiquetaNuevo}
                    <img src="${p.imagenUrl}" alt="${p.nombre}" class="zoomable-img" loading="lazy">
                </div>
                <div class="product-info">
                    <div>
                        <div class="product-category-tag">${p.categoria}</div>
                        <h3 class="product-title">${p.nombre}</h3>
                    </div>
                    <div class="product-price-box">
                        ₡${(p.precio || 0).toLocaleString()}
                    </div>
                </div>
            </div>
        `;
    }).join("");

    contenidoHtml += `<div style="grid-column: 1 / -1; display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 12px; padding: 20px 0;">`;
    if (limiteVisible < filtrados.length) {
        contenidoHtml += `
            <button id="btnCargarMas" style="background: var(--gold); color: #000; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 0.9rem;">
                Cargar más productos (${filtrados.length - limiteVisible} restantes)
            </button>
        `;
    }
    contenidoHtml += `
        <button id="btnVolverInicio" style="background: transparent; color: var(--pink-accent); border: 1px solid var(--pink-accent); padding: 12px 24px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 0.9rem;">
            ⬆️ Volver al inicio
        </button>
    </div>`;

    grid.innerHTML = contenidoHtml;

    const btnMas = document.getElementById("btnCargarMas");
    if (btnMas) {
        btnMas.addEventListener("click", () => {
            limiteVisible += 24;
            renderizarProductos(categoriaActual);
        });
    }

    const btnInicio = document.getElementById("btnVolverInicio");
    if (btnInicio) {
        btnInicio.addEventListener("click", volverAlInicio);
    }

    grid.querySelectorAll(".zoomable-img").forEach(img => {
        img.addEventListener("click", () => {
            if (modal && modalImg) {
                modal.style.display = "flex";
                modalImg.src = img.src;
            }
        });
    });
}
