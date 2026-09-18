// --- 1. REFERENCIAS AL DOM ---
const loginForm = document.getElementById('login-form');
const loginSection = document.getElementById('login-section');
const catalogSection = document.getElementById('catalog-section');
const misPrestamosSection = document.getElementById('mis-prestamos-section');
const librarianSection = document.getElementById('librarian-section');

const btnMisPrestamos = document.getElementById('btn-mis-prestamos');
const btnVolverCatalogo = document.getElementById('btn-volver-catalogo');
const btnsLogout = document.querySelectorAll('.btn-logout-general');

// --- 2. BASE DE DATOS VIRTUAL ---
const inventarioInicial = {
    '1': 5, '2': 5, '3': 0, '4': 5, '5': 5, '6': 5
};

function inicializarSistema() {
    if (!localStorage.getItem('inventarioGlobal')) {
        localStorage.setItem('inventarioGlobal', JSON.stringify(inventarioInicial));
    }
    // Inyectar libros creados por el bibliotecario al DOM antes de actualizar interfaz
    inyectarLibrosNuevos();
    actualizarInterfazCatalogo();
}

function inyectarLibrosNuevos() {
    const nuevosLibros = JSON.parse(localStorage.getItem('librosNuevos')) || [];
    const grid = document.getElementById('main-catalog-grid');
    
    nuevosLibros.forEach(libro => {
        // Evitar duplicados si ya está en el HTML
        if(!document.querySelector(`.book-card[data-id="${libro.id}"]`)) {
            grid.innerHTML += `
                <div class="book-card" data-id="${libro.id}">
                    <div class="book-image-container"><img src="${libro.imagen}" class="book-cover-img"></div>
                    <h3>${libro.titulo}</h3>
                    <p class="author">${libro.autor}</p>
                    <div class="book-details">
                        <p><strong><i class="fa-solid fa-barcode"></i> ISBN:</strong> ${libro.isbn}</p>
                        <p><strong><i class="fa-solid fa-location-dot"></i> Ubicación:</strong> ${libro.ubicacion}</p>
                        <p class="inventario-info"><strong><i class="fa-solid fa-boxes-stacked"></i> Ejemplares:</strong> <span class="stock-count">${libro.stock}</span>/${libro.stockMax}</p>
                    </div>
                    <span class="status available">Disponible</span>
                    <button class="btn btn-primary btn-prestamo"><i class="fa-solid fa-book-bookmark"></i> Solicitar Préstamo</button>
                </div>
            `;
        }
    });
}

function actualizarInterfazCatalogo() {
    let inventario = JSON.parse(localStorage.getItem('inventarioGlobal'));
    let misPrestamos = JSON.parse(localStorage.getItem('librosBiblioteca')) || [];

    document.querySelectorAll('.book-card').forEach(card => {
        const id = card.getAttribute('data-id');
        const stockActual = inventario[id];
        const spanStock = card.querySelector('.stock-count');
        const infoInventario = card.querySelector('.inventario-info');
        const boton = card.querySelector('.btn-prestamo');
        const statusBadge = card.querySelector('.status');

        if(spanStock) spanStock.textContent = stockActual;

        const yaPrestado = misPrestamos.find(l => l.id === id);

        if (yaPrestado) {
            boton.innerHTML = '<i class="fa-solid fa-check"></i> PRÉSTAMO REGISTRADO';
            boton.className = 'btn btn-secondary btn-prestamo';
            boton.disabled = true;
            statusBadge.textContent = "Prestado";
            statusBadge.className = 'status unavailable';
            if(infoInventario) infoInventario.classList.remove('inventario-agotado');
        } else if (stockActual === 0) {
            boton.innerHTML = '<i class="fa-solid fa-ban"></i> AGOTADO';
            boton.className = 'btn btn-secondary btn-prestamo';
            boton.disabled = true;
            statusBadge.textContent = "Sin Ejemplares";
            statusBadge.className = 'status unavailable';
            if(infoInventario) infoInventario.classList.add('inventario-agotado');
        } else {
            boton.innerHTML = '<i class="fa-solid fa-book-bookmark"></i> Solicitar Préstamo';
            boton.className = 'btn btn-primary btn-prestamo';
            boton.disabled = false;
            statusBadge.textContent = "Disponible";
            statusBadge.className = 'status available';
            if(infoInventario) infoInventario.classList.remove('inventario-agotado');
        }
    });
}

document.addEventListener('DOMContentLoaded', inicializarSistema);

// --- 3. LÓGICA DE NAVEGACIÓN Y LOGIN ---
loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const rol = document.getElementById('rol').value;
    const credencial = document.getElementById('codigo').value;
    
    loginSection.classList.add('hidden');
    
    if(rol === 'estudiante') {
        catalogSection.classList.remove('hidden');
        localStorage.setItem('usuarioActual', credencial);
        actualizarInterfazCatalogo();
    } else {
        librarianSection.classList.remove('hidden');
        cargarPanelBibliotecario();
    }
});

btnsLogout.forEach(btn => {
    btn.addEventListener('click', function() {
        catalogSection.classList.add('hidden');
        misPrestamosSection.classList.add('hidden');
        librarianSection.classList.add('hidden');
        loginSection.classList.remove('hidden');
        loginForm.reset();
    });
});

btnMisPrestamos.addEventListener('click', function() {
    catalogSection.classList.add('hidden');
    misPrestamosSection.classList.remove('hidden');
    cargarMisPrestamos();
});

btnVolverCatalogo.addEventListener('click', function() {
    misPrestamosSection.classList.add('hidden');
    catalogSection.classList.remove('hidden');
    actualizarInterfazCatalogo();
});

// --- 4. FUNCIONES DE FECHA ---
function formatToLocalISO(date) {
    const tzoffset = date.getTimezoneOffset() * 60000; 
    return new Date(date.getTime() - tzoffset).toISOString().slice(0, 16);
}
function formatFriendlyDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function esHorarioHabil(fecha) {
    const dia = fecha.getDay(); 
    const minDia = fecha.getHours() * 60 + fecha.getMinutes();
    if (dia === 0 || dia === 6) return { valido: false, mensaje: 'Fines de semana no hay servicio.' };
    if (minDia < (8*60+30) || minDia > (18*60+30)) return { valido: false, mensaje: 'Horario: 8:30am a 6:30pm.' };
    return { valido: true };
}
function obtenerSiguienteHorarioHabil(fechaBase) {
    let min = new Date(fechaBase);
    let dia = min.getDay(), hora = min.getHours(), minutos = min.getMinutes();
    let minActual = hora * 60 + minutos;
    if (dia === 6) { min.setDate(min.getDate() + 2); min.setHours(8, 30, 0, 0); } 
    else if (dia === 0) { min.setDate(min.getDate() + 1); min.setHours(8, 30, 0, 0); } 
    else {
        if (minActual < (8*60+30)) { min.setHours(8, 30, 0, 0); } 
        else if (minActual > (18*60+30)) {
            min.setDate(min.getDate() + (dia === 5 ? 3 : 1));
            min.setHours(8, 30, 0, 0);
        }
    }
    return min;
}

// --- 5. SOLICITAR PRÉSTAMO (ESTUDIANTE) ---
document.querySelector('#main-catalog-grid').addEventListener('click', function(e) {
    const boton = e.target.closest('.btn-prestamo');
    if (boton && !boton.disabled) {
        const card = boton.closest('.book-card');
        const idLibro = card.getAttribute('data-id');
        const titulo = card.querySelector('h3').textContent;
        const imagen = card.querySelector('img').src;
        const usuario = localStorage.getItem('usuarioActual') || 'Estudiante Generico';

        const now = new Date();
        let minDate = obtenerSiguienteHorarioHabil(new Date(now.getTime() + 2 * 60 * 60 * 1000)); 
        const maxDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000); 

        Swal.fire({
            title: 'Configurar Préstamo',
            html: `<p><strong>${titulo}</strong></p><input type="datetime-local" id="fecha-devolucion" class="swal2-input" style="width: 85%;" min="${formatToLocalISO(minDate)}" max="${formatToLocalISO(maxDate)}">`,
            background: '#15224a', color: '#e0e6ed', showCancelButton: true, confirmButtonColor: '#610094',
            preConfirm: () => {
                const f = document.getElementById('fecha-devolucion').value;
                if (!f || !esHorarioHabil(new Date(f)).valido) { Swal.showValidationMessage('Fecha inválida o fuera de horario'); return false; }
                return f;
            }
        }).then((result) => {
            if (result.isConfirmed) {
                let prestamos = JSON.parse(localStorage.getItem('librosBiblioteca')) || [];
                prestamos.push({ id: idLibro, titulo: titulo, imagen: imagen, fechaDevolucion: result.value, estudiante: usuario });
                localStorage.setItem('librosBiblioteca', JSON.stringify(prestamos));

                let inventario = JSON.parse(localStorage.getItem('inventarioGlobal'));
                inventario[idLibro] -= 1;
                localStorage.setItem('inventarioGlobal', JSON.stringify(inventario));

                actualizarInterfazCatalogo();
                Swal.fire({ title: '¡Registrado!', icon: 'success', background: '#15224a', color: '#e0e6ed', confirmButtonColor: '#610094' });
            }
        });
    }
});

// --- 6. RENDERIZAR "MIS PRÉSTAMOS" (ESTUDIANTE) ---
function cargarMisPrestamos() {
    let prestamos = JSON.parse(localStorage.getItem('librosBiblioteca')) || [];
    const grid = document.getElementById('grid-prestamos-guardados');
    grid.innerHTML = "";
    
    // Filtrar solo los del usuario actual (Simulación)
    const usuario = localStorage.getItem('usuarioActual');
    let misLibros = prestamos.filter(l => l.estudiante === usuario);

    if (misLibros.length === 0) {
        document.getElementById('mensaje-vacio').classList.remove('hidden');
    } else {
        document.getElementById('mensaje-vacio').classList.add('hidden');
        misLibros.forEach(libro => {
            grid.innerHTML += `
                <div class="book-card" data-id="${libro.id}">
                    <div class="book-image-container"><img src="${libro.imagen}" class="book-cover-img"></div>
                    <h3>${libro.titulo}</h3>
                    <div class="fecha-destacada">
                        <p style="color: var(--text-muted); font-size: 0.85rem;">Devolución:</p>
                        <p><strong>${formatFriendlyDate(libro.fechaDevolucion)}</strong></p>
                    </div>
                </div>
            `;
        });
    }
}

// --- 7. PANEL BIBLIOTECARIO (ADMIN) ---
function cargarPanelBibliotecario() {
    let prestamos = JSON.parse(localStorage.getItem('librosBiblioteca')) || [];
    const tbody = document.getElementById('tabla-prestamos-admin');
    tbody.innerHTML = "";

    if (prestamos.length === 0) {
        tbody.innerHTML = "<tr><td colspan='5' style='text-align:center;'>No hay préstamos activos</td></tr>";
    } else {
        prestamos.forEach((p, index) => {
            tbody.innerHTML += `
                <tr>
                    <td>${p.id}</td>
                    <td>${p.titulo}</td>
                    <td>${p.estudiante}</td>
                    <td>${formatFriendlyDate(p.fechaDevolucion)}</td>
                    <td><button class="btn-success" onclick="procesarDevolucion(${index}, '${p.id}')"><i class="fa-solid fa-check-double"></i> Recibir</button></td>
                </tr>
            `;
        });
    }
}

window.procesarDevolucion = function(indexPrestamo, idLibro) {
    Swal.fire({
        title: '¿Confirmar Devolución Física?',
        text: "El inventario aumentará y el préstamo se cerrará.",
        icon: 'warning',
        background: '#15224a', color: '#e0e6ed',
        showCancelButton: true, confirmButtonColor: '#4CAF50', cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, recibir libro'
    }).then((result) => {
        if (result.isConfirmed) {
            let prestamos = JSON.parse(localStorage.getItem('librosBiblioteca')) || [];
            prestamos.splice(indexPrestamo, 1);
            localStorage.setItem('librosBiblioteca', JSON.stringify(prestamos));

            let inventario = JSON.parse(localStorage.getItem('inventarioGlobal'));
            inventario[idLibro] += 1;
            localStorage.setItem('inventarioGlobal', JSON.stringify(inventario));

            cargarPanelBibliotecario();
            Swal.fire({title:'Completado', text:'Libro devuelto al estante.', icon:'success', background: '#15224a', color: '#e0e6ed'});
        }
    });
};

// Agregar nuevo libro (Bibliotecario)
document.getElementById('btn-agregar-libro-modal').addEventListener('click', function() {
    Swal.fire({
        title: 'Registrar Nuevo Libro',
        html: `
            <input id="n-titulo" class="swal2-input" placeholder="Título del libro">
            <input id="n-autor" class="swal2-input" placeholder="Autor">
            <input id="n-isbn" class="swal2-input" placeholder="ISBN">
            <input id="n-stock" type="number" class="swal2-input" placeholder="Cantidad Ejemplares" min="1">
        `,
        background: '#15224a', color: '#e0e6ed', showCancelButton: true, confirmButtonColor: '#4CAF50',
        preConfirm: () => {
            return {
                titulo: document.getElementById('n-titulo').value,
                autor: document.getElementById('n-autor').value,
                isbn: document.getElementById('n-isbn').value,
                stock: parseInt(document.getElementById('n-stock').value)
            }
        }
    }).then((result) => {
        if (result.isConfirmed && result.value.titulo) {
            let nuevosLibros = JSON.parse(localStorage.getItem('librosNuevos')) || [];
            let inventario = JSON.parse(localStorage.getItem('inventarioGlobal'));
            
            // Generar ID único
            const nuevoId = 'nuevo-' + Date.now();
            
            const nuevoLibroObj = {
                id: nuevoId,
                titulo: result.value.titulo,
                autor: result.value.autor,
                isbn: result.value.isbn,
                ubicacion: 'Estante D Nuevo',
                imagen: 'https://via.placeholder.com/150x200/08122c/e0e6ed?text=Nueva+Portada', // Placeholder
                stock: result.value.stock,
                stockMax: result.value.stock
            };

            nuevosLibros.push(nuevoLibroObj);
            localStorage.setItem('librosNuevos', JSON.stringify(nuevosLibros));
            
            inventario[nuevoId] = result.value.stock;
            localStorage.setItem('inventarioGlobal', JSON.stringify(inventario));
            
            Swal.fire({title:'Libro Agregado', icon:'success', background: '#15224a', color: '#e0e6ed'});
            
            // Inyectar inmediatamente para que esté listo cuando entre un estudiante
            inyectarLibrosNuevos();
        }
    });
});

// --- 8. ANIMACIÓN SMART HEADER (SCROLL Y MOUSE) ---
const header = document.querySelector('header');
let ultimoScrollY = window.scrollY;
let temporizadorMouse;

// Detectar dirección del scroll (Celular y PC)
window.addEventListener('scroll', () => {
    if (window.scrollY === 0) {
        // Si está en el tope de la página, siempre se muestra
        header.classList.remove('header-oculto');
    } else if (window.scrollY > ultimoScrollY) {
        // Si desliza hacia abajo, se oculta para dar espacio de lectura
        header.classList.add('header-oculto');
    } else {
        // Si desliza hacia arriba, vuelve a aparecer
        header.classList.remove('header-oculto');
    }
    ultimoScrollY = window.scrollY;
});

// Detectar movimiento del mouse (Principalmente para PC)
window.addEventListener('mousemove', () => {
    // Si mueve el mouse, aparece inmediatamente
    header.classList.remove('header-oculto');
    
    // Reiniciar el contador de inactividad
    clearTimeout(temporizadorMouse);
    
    // Si el usuario deja el mouse quieto por 2.5 segundos, se oculta
    // (Solo se oculta si no está en la parte más alta de la página)
    temporizadorMouse = setTimeout(() => {
        if (window.scrollY > 50) {
            header.classList.add('header-oculto');
        }
    }, 2500);
});