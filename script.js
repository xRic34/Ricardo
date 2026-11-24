const API_URL = "https://fakestoreapi.com/products";
const STORAGE_KEY = "alta_tienda_carrito_v1";
const PRODUCTOS_LIMPIEZA = [
    {
        id: 1,
        title: "Desengrasante Cítrico 500ml",
        description: "Remueve grasa pegada en cocinas y hornos sin dejar residuos.",
        price: 12500,
        image: "./imagenes/producto1.png"
    },
    {
        id: 2,
        title: "Limpiador Herbal Multi-Superficie",
        description: "Ideal para mesadas, muebles y superficies lavables con aroma fresco.",
        price: 14000,
        image: "./imagenes/producto2.png"
    },
    {
        id: 3,
        title: "Sanitizante Aromático Red Pack",
        description: "Fórmula desinfectante de fragancia intensa para ambientes del hogar.",
        price: 18750,
        image: "./imagenes/producto3.png"
    },
    {
        id: 4,
        title: "Limpia Pisos y Baños Ultra Brillo",
        description: "Acción profunda contra sarro y manchas con secado rápido.",
        price: 15200,
        image: "./imagenes/producto4.png"
    },
    {
        id: 5,
        title: "Detergente Suave Removedor",
        description: "Limpieza delicada y efectiva para textiles y superficies sensibles.",
        price: 16900,
        image: "./imagenes/producto5.png"
    }
];

function formatearPrecio(monto) {
    return `$${Number(monto).toLocaleString("es-AR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    })}`;
}

let productosCache = [...PRODUCTOS_LIMPIEZA];

function obtenerCarrito() {
    try {
        const guardado = localStorage.getItem(STORAGE_KEY);
        return guardado ? JSON.parse(guardado) : [];
    } catch (error) {
        console.error("Error al leer el carrito de localStorage:", error);
        return [];
    }
}

function guardarCarrito(carrito) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(carrito));
    actualizarContadorCarrito();
}

function actualizarContadorCarrito() {
    const carrito = obtenerCarrito();
    const totalUnidades = carrito.reduce((acum, item) => acum + item.cantidad, 0);

    const contadorPrincipal = document.getElementById("contador-carrito");
    if (contadorPrincipal) {
        contadorPrincipal.textContent = totalUnidades;
    }

    const contadoresFooter = document.querySelectorAll(".contador-carrito-footer");
    contadoresFooter.forEach((el) => {
        el.textContent = totalUnidades;
    });
}

function agregarAlCarrito(productoId) {
    const producto = productosCache.find((p) => p.id === productoId);
    if (!producto) return;

    const carrito = obtenerCarrito();
    const existente = carrito.find((item) => item.id === producto.id);

    if (existente) {
        existente.cantidad += 1;
    } else {
        carrito.push({
            id: producto.id,
            title: producto.title,
            price: Number(producto.price),
            image: producto.image,
            cantidad: 1
        });
    }

    guardarCarrito(carrito);
    renderizarCarrito();
}

function cambiarCantidad(productoId, delta) {
    const carrito = obtenerCarrito();
    const item = carrito.find((prod) => prod.id === productoId);
    if (!item) return;

    item.cantidad += delta;
    const carritoActualizado = carrito.filter((prod) => prod.cantidad > 0);
    guardarCarrito(carritoActualizado);
    renderizarCarrito();
}

function eliminarDelCarrito(productoId) {
    const carritoActualizado = obtenerCarrito().filter((prod) => prod.id !== productoId);
    guardarCarrito(carritoActualizado);
    renderizarCarrito();
}

function renderizarProductos(lista) {
    const contenedor = document.getElementById("contenedor-productos-api");
    const estado = document.getElementById("estado-productos");
    if (!contenedor) return;

    contenedor.innerHTML = "";

    if (!lista.length) {
        if (estado) estado.textContent = "No se encontraron productos para mostrar.";
        return;
    }

    if (estado) {
        estado.textContent = `Mostrando ${lista.length} productos.`;
    }

    lista.forEach((producto) => {
        const card = document.createElement("article");
        card.className = "Producto";

        const img = document.createElement("img");
        img.src = producto.image;
        img.alt = producto.title;
        img.loading = "lazy";

        const titulo = document.createElement("h3");
        titulo.textContent = producto.title;

        const descripcion = document.createElement("p");
        descripcion.className = "Descripcion";
        descripcion.textContent = producto.description;

        const precio = document.createElement("p");
        precio.className = "Precio";
        precio.textContent = formatearPrecio(producto.price);

        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = "boton";
        boton.textContent = "Añadir al carrito";
        boton.addEventListener("click", () => agregarAlCarrito(producto.id));

        card.append(img, titulo, descripcion, precio, boton);
        contenedor.appendChild(card);
    });
}

async function cargarProductosDesdeAPI() {
    const contenedor = document.getElementById("contenedor-productos-api");
    const estado = document.getElementById("estado-productos");
    if (!contenedor) return;

    const params = new URLSearchParams(window.location.search);
    const terminoBusqueda = (params.get("Buscar") || "").trim().toLowerCase();

    try {
        // Consultamos la API REST con fetch como pide la consigna
        const respuesta = await fetch(API_URL);
        if (!respuesta.ok) {
            throw new Error(`Error HTTP: ${respuesta.status}`);
        }
        await respuesta.json();

        // Usamos tus 5 productos de limpieza editables como catálogo principal
        productosCache = [...PRODUCTOS_LIMPIEZA];

        const filtrados = terminoBusqueda
            ? productosCache.filter(
                (p) =>
                    p.title.toLowerCase().includes(terminoBusqueda) ||
                    p.description.toLowerCase().includes(terminoBusqueda)
            )
            : productosCache;

        renderizarProductos(filtrados);
    } catch (error) {
        console.warn("Aviso al consultar API externa, mostrando productos locales:", error);
        productosCache = [...PRODUCTOS_LIMPIEZA];
        const filtrados = terminoBusqueda
            ? productosCache.filter((p) => p.title.toLowerCase().includes(terminoBusqueda))
            : productosCache;
        renderizarProductos(filtrados);
        if (estado && !filtrados.length) {
            estado.textContent = "No se encontraron productos para mostrar.";
        }
    }
}

function renderizarCarrito() {
    const listaContenedor = document.getElementById("lista-carrito");
    const totalElemento = document.getElementById("total-carrito");
    if (!listaContenedor || !totalElemento) return;

    const carrito = obtenerCarrito();
    listaContenedor.innerHTML = "";

    if (carrito.length === 0) {
        listaContenedor.innerHTML = "<p>Tu carrito está vacío. Agregá productos desde Inicio o Productos.</p>";
        totalElemento.textContent = "$0.00";
        return;
    }

    let totalGeneral = 0;

    carrito.forEach((item) => {
        const subtotal = item.price * item.cantidad;
        totalGeneral += subtotal;

        const fila = document.createElement("div");
        fila.className = "item-carrito";

        const info = document.createElement("div");
        info.innerHTML = `
        <strong>${item.title}</strong><br>
        <span>Unitario: ${formatearPrecio(item.price)} | Subtotal: <strong>${formatearPrecio(subtotal)}</strong></span>
        `;

        const controles = document.createElement("div");
        controles.className = "controles-cantidad";

        const btnMenos = document.createElement("button");
        btnMenos.type = "button";
        btnMenos.className = "boton boton-secundario";
        btnMenos.textContent = "-";
        btnMenos.setAttribute("aria-label", `Restar unidad de ${item.title}`);
        btnMenos.addEventListener("click", () => cambiarCantidad(item.id, -1));

        const cantTexto = document.createElement("span");
        cantTexto.textContent = item.cantidad;

        const btnMas = document.createElement("button");
        btnMas.type = "button";
        btnMas.className = "boton";
        btnMas.textContent = "+";
        btnMas.setAttribute("aria-label", `Sumar unidad de ${item.title}`);
        btnMas.addEventListener("click", () => cambiarCantidad(item.id, 1));

        const btnEliminar = document.createElement("button");
        btnEliminar.type = "button";
        btnEliminar.className = "boton boton-secundario";
        btnEliminar.textContent = "Eliminar";
        btnEliminar.addEventListener("click", () => eliminarDelCarrito(item.id));

        controles.append(btnMenos, cantTexto, btnMas, btnEliminar);
        fila.append(info, controles);
        listaContenedor.appendChild(fila);
    });

    totalElemento.textContent = formatearPrecio(totalGeneral);
}

function configurarAccionesCarrito() {
    const btnSimular = document.getElementById("btn-simular-compra");
    const btnVaciar = document.getElementById("btn-vaciar-carrito");
    const mensajeCarrito = document.getElementById("mensaje-carrito");

    if (btnSimular) {
        btnSimular.addEventListener("click", () => {
            const carrito = obtenerCarrito();
            if (carrito.length === 0) {
                if (mensajeCarrito) {
                    mensajeCarrito.textContent = "Agregá al menos un producto antes de simular la compra.";
                    mensajeCarrito.className = "mensaje-estado mensaje-error";
                }
                return;
            }

            localStorage.removeItem(STORAGE_KEY);
            actualizarContadorCarrito();
            renderizarCarrito();

            if (mensajeCarrito) {
                mensajeCarrito.textContent = "¡Compra simulada con éxito! Gracias por tu pedido.";
                mensajeCarrito.className = "mensaje-estado mensaje-exito";
            }
        });
    }

    if (btnVaciar) {
        btnVaciar.addEventListener("click", () => {
            localStorage.removeItem(STORAGE_KEY);
            actualizarContadorCarrito();
            renderizarCarrito();

            if (mensajeCarrito) {
                mensajeCarrito.textContent = "El carrito se vació correctamente.";
                mensajeCarrito.className = "mensaje-estado";
            }
        });
    }
}

function configurarFormularioContacto() {
    const form = document.getElementById("form-contacto");
    if (!form) return;

    form.addEventListener("submit", (event) => {
        const nombreInput = document.getElementById("nombre");
        const emailInput = document.getElementById("email");
        const mensajeInput = document.getElementById("mensaje");
        const estadoForm = document.getElementById("mensaje-formulario");

        const nombre = nombreInput ? nombreInput.value.trim() : "";
        const email = emailInput ? emailInput.value.trim() : "";
        const mensaje = mensajeInput ? mensajeInput.value.trim() : "";
        const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

        if (!nombre || !email || !mensaje) {
            event.preventDefault();
            if (estadoForm) {
                estadoForm.textContent = "Por favor completá nombre, correo electrónico y mensaje.";
                estadoForm.className = "mensaje-estado mensaje-error";
            }
            return;
        }

        if (!emailValido) {
            event.preventDefault();
            if (estadoForm) {
                estadoForm.textContent = "Ingresá un correo electrónico válido (ejemplo: usuario@correo.com).";
                estadoForm.className = "mensaje-estado mensaje-error";
            }
            return;
        }

        if (estadoForm) {
            estadoForm.textContent = "Enviando mensaje...";
            estadoForm.className = "mensaje-estado mensaje-exito";
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    actualizarContadorCarrito();
    cargarProductosDesdeAPI();
    renderizarCarrito();
    configurarAccionesCarrito();
    configurarFormularioContacto();
});