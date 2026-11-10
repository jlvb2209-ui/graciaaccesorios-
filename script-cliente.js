import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    initializeFirestore,
    collection,
    onSnapshot,
    query,
    orderBy
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

// Elementos del Modal de Imagen
const modal = document.getElementById("imageModal");
const modalImg = document.getElementById("imgModalExpanded");
const modalClose = document.getElementById("modalClose");

modalClose.addEventListener("click", () => {
    modal.style.display = "none";
});

modal.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.style.display = "none";
    }
});

let productosCache = [];
let categoriasCache = [];
let categoriaActual = "todos";
let limiteVisible = 24; // Cantidad inicial de productos a mostrar para garantizar velocidad de carga

// Cargar productos ordenados desde Firebase de forma eficiente
const qProducts = query(collection(db, "jewelry"), orderBy("creado", "desc"));
onSnapshot(qProducts, (snapshot) => {
    productosCache = [];
    snapshot.forEach((doc) => {
        productosCache.push({ id: doc.id, ...doc.data() });
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
            limiteVisible = 24; // Reiniciar el límite al cambiar de categoría
            renderizarProductos(categoriaActual);
        });
    });
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

    // Tomamos solo una porción de los productos para aligerar la carga visual inmediata
    const productosAMostrar = filtrados.slice(0, limiteVisible);
    
    let contenidoHtml = productosAMostrar.map(p => `
        <div class="product-card" data-category="${p.categoria}">
            <div class="product-img-container">
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
    `).join("");

    // Si hay más productos por mostrar, añadimos un botón elegante de "Cargar más"
    if (limiteVisible < filtrados.length) {
        contenidoHtml += `
            <div style="grid-column: 1 / -1; text-align: center; padding: 20px 0;">
                <button id="btnCargarMas" style="background: var(--gold); color: #000; border: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 0.9rem;">
                    Cargar más productos (${filtrados.length - limiteVisible} restantes)
                </button>
            </div>
        `;
    }
    
    grid.innerHTML = contenidoHtml;

    // Vincular evento al botón de cargar más si existe
    const btnMas = document.getElementById("btnCargarMas");
    if (btnMas) {
        btnMas.addEventListener("click", () => {
            limiteVisible += 24; // Incrementa el bloque visible
            renderizarProductos(categoriaActual);
        });
    }

    // Activar eventos de clic para ampliar las imágenes
    grid.querySelectorAll(".zoomable-img").forEach(img => {
        img.addEventListener("click", () => {
            modal.style.display = "flex";
            modalImg.src = img.src;
        });
    });
}
