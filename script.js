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
    inyectarLibrosNuevos();
    actualizarInterfazCatalogo();
}

function inyectarLibrosNuevos() {
    const nuevosLibros = JSON.parse(localStorage.getItem('librosNuevos')) || [];
    const grid = document.querySelector('.book-grid') || document.getElementById('main-catalog-grid');
    if (!grid) return;
    
    nuevosLibros.forEach(libro => {
        if(!document.querySelector(`.book-card[data-id="${libro.id}"]`)) {
            grid.innerHTML += `
                <div class="book-card" data-id="${libro.id}">
                    <div class="book-image-container"><img src="${libro.imagen}" class="book-cover-img" alt="Portada"></div>
                    <h3>${libro.titulo}</h3>
                    <p class="author">${libro.autor}</p>
                    <div class="book-details" style="display:none;">
                        <p><strong>ISBN:</strong> ${libro.isbn}</p>
                        <p><strong>Ubicación:</strong> ${libro.ubicacion}</p>
                    </div>
                    <p class="inventario-info" style="font-size: 0.8rem; margin-bottom: 10px; color: var(--text-muted);">
                        <strong>Ejemplares:</strong> <span class="stock-count">${libro.stock}</span>/${libro.stockMax}
                    </p>
                    <span class="status available">Disponible</span>
                    <button class="btn btn-primary btn-prestamo">Solicitar Préstamo</button>
                </div>
            `;
        }
    });
}

function actualizarInterfazCatalogo() {
    let inventario = JSON.parse(localStorage.getItem('inventarioGlobal')) || inventarioInicial;
    let prestamos = JSON.parse(localStorage.getItem('librosBiblioteca')) || [];
    const usuarioActual = localStorage.getItem('usuarioActual');
    
    // Filtrar solo los préstamos del usuario actual
    let misPrestamos = prestamos.filter(l => l.estudiante === usuarioActual);

    document.querySelectorAll('.book-card').forEach((card, index) => {
        // Aseguramos que cada tarjeta tenga un ID aunque no esté en el HTML
        let id = card.getAttribute('data-id');
        if (!id) {
            id = (index + 1).toString();
            card.setAttribute('data-id', id);
        }

        const stockActual = inventario[id] !== undefined ? inventario[id] : 5;
        const spanStock = card.querySelector('.stock-count');
        const boton = card.querySelector('.btn-prestamo');
        const statusBadge = card.querySelector('.status');

        if(spanStock) spanStock.textContent = stockActual;

        const yaPrestado = misPrestamos.find(l => l.id === id);

        if (yaPrestado) {
            if(boton) {
                boton.innerHTML = 'PRÉSTAMO REGISTRADO';
                boton.className = 'btn btn-secondary btn-prestamo';
                boton.disabled = true;
            }
            if(statusBadge) {
                statusBadge.textContent = "Prestado";
                statusBadge.className = 'status unavailable';
            }
        } else if (stockActual === 0) {
            if(boton) {
                boton.innerHTML = 'AGOTADO';
                boton.className = 'btn btn-secondary btn-prestamo';
                boton.disabled = true;
            }
            if(statusBadge) {
                statusBadge.textContent = "Sin Ejemplares";
                statusBadge.className = 'status unavailable';
            }
        } else {
            if(boton) {
                boton.innerHTML = 'Solicitar Préstamo';
                boton.className = 'btn btn-primary btn-prestamo';
                boton.disabled = false;
            }
            if(statusBadge) {
                statusBadge.textContent = "Disponible";
                statusBadge.className = 'status available';
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', inicializarSistema);

// --- 3. LÓGICA DE NAVEGACIÓN Y LOGIN ---
if(loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Capturar los datos del formulario
        const credencial = document.getElementById('codigo').value;
        const rolSelect = document.getElementById('rol');
        // Si por alguna razón no encuentra el select, asume estudiante por defecto
        const rol = rolSelect ? rolSelect.value : 'estudiante'; 
        
        // Ocultar siempre el login al intentar ingresar
        if(loginSection) loginSection.classList.add('hidden');
        
        // Redirigir según el rol seleccionado
        if(rol === 'estudiante') {
            if(catalogSection) catalogSection.classList.remove('hidden');
            localStorage.setItem('usuarioActual', credencial);
            actualizarInterfazCatalogo();
        } else {
            // Entorno de Bibliotecario / Personal
            if(librarianSection) librarianSection.classList.remove('hidden');
            if(typeof cargarPanelBibliotecario === 'function') {
                cargarPanelBibliotecario();
            }
        }
    });
}

btnsLogout.forEach(btn => {
    btn.addEventListener('click', function() {
        if(catalogSection) catalogSection.classList.add('hidden');
        if(misPrestamosSection) misPrestamosSection.classList.add('hidden');
        if(librarianSection) librarianSection.classList.add('hidden');
        if(loginSection) loginSection.classList.remove('hidden');
        if(loginForm) loginForm.reset();
        localStorage.removeItem('usuarioActual');
    });
});

if (btnMisPrestamos) {
    btnMisPrestamos.addEventListener('click', function() {
        if(catalogSection) catalogSection.classList.add('hidden');
        if(misPrestamosSection) misPrestamosSection.classList.remove('hidden');
        cargarMisPrestamos();
    });
}

if (btnVolverCatalogo) {
    btnVolverCatalogo.addEventListener('click', function() {
        if(misPrestamosSection) misPrestamosSection.classList.add('hidden');
        if(catalogSection) catalogSection.classList.remove('hidden');
        actualizarInterfazCatalogo();
    });
}

// --- 4. FUNCIONES DE FECHA ---
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
document.body.addEventListener('click', function(e) {
    const boton = e.target.closest('.btn-prestamo');
    
    if (boton && !boton.disabled) {
        const card = boton.closest('.book-card');
        
        const idLibro = card.getAttribute('data-id'); 
        const tituloElement = card.querySelector('h3');
        const titulo = tituloElement ? tituloElement.textContent : 'Libro sin título';
        
        const imgElement = card.querySelector('img');
        const imagen = imgElement ? imgElement.src : '';
        
        const authorElement = card.querySelector('p.author') || card.querySelector('p'); 
        const autor = authorElement ? authorElement.textContent : 'Autor Desconocido';
        
        const usuario = localStorage.getItem('usuarioActual') || 'Estudiante';

        const now = new Date();
        let minDate = obtenerSiguienteHorarioHabil(new Date(now.getTime() + 2 * 60 * 60 * 1000)); 
        const maxDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000); 

        const formatToLocalISO = (date) => {
            const tzOffset = (new Date()).getTimezoneOffset() * 60000;
            return (new Date(date - tzOffset)).toISOString().slice(0, 16);
        };

        Swal.fire({
            title: 'Configurar Préstamo',
            html: `<p style="margin-bottom: 15px;"><strong>${titulo}</strong></p>
                   <input type="datetime-local" id="fecha-devolucion" class="swal2-input" style="width: 85%;" min="${formatToLocalISO(minDate)}" max="${formatToLocalISO(maxDate)}">`,
            background: '#15224a', color: '#e0e6ed', showCancelButton: true, confirmButtonColor: '#610094',
            confirmButtonText: 'Apartar Libro',
            cancelButtonText: 'Cancelar',
            preConfirm: () => {
                const f = document.getElementById('fecha-devolucion').value;
                if (!f) { Swal.showValidationMessage('Selecciona una fecha válida'); return false; }
                return f;
            }
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    title: 'Validando inventario...',
                    html: 'Conectando con la base de datos de la biblioteca.',
                    timer: 1500,
                    timerProgressBar: true,
                    background: '#15224a', color: '#e0e6ed',
                    didOpen: () => { Swal.showLoading(); }
                }).then(() => {
                    let prestamos = JSON.parse(localStorage.getItem('librosBiblioteca')) || [];
                    
                    const yaExiste = prestamos.find(l => l.titulo === titulo && l.estudiante === usuario);
                    if (!yaExiste) {
                        prestamos.push({
                            id: idLibro,
                            titulo: titulo,
                            imagen: imagen,
                            autor: autor,
                            fechaDevolucion: result.value,
                            estudiante: usuario 
                        });
                        localStorage.setItem('librosBiblioteca', JSON.stringify(prestamos));
                        
                        // Descuenta del inventario global
                        let inventario = JSON.parse(localStorage.getItem('inventarioGlobal')) || inventarioInicial;
                        if(inventario[idLibro] > 0) {
                            inventario[idLibro] -= 1;
                            localStorage.setItem('inventarioGlobal', JSON.stringify(inventario));
                        }
                    }

                    actualizarInterfazCatalogo();

                    const fechaElegida = new Date(result.value);
                    const opcionesFecha = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
                    let fechaFormateada = fechaElegida.toLocaleDateString('es-ES', opcionesFecha);
                    fechaFormateada = fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1);

                    // AQUÍ SE REINCORPORA EL DISEÑO EXACTO DE LA ANIMACIÓN
                    Swal.fire({ 
                        title: '¡Confirmado con ÉXITO!', 
                        icon: 'success', 
                        html: `
                            <div style="text-align: center; margin-top: 10px;">
                                <p style="font-size: 1.05rem; margin-bottom: 15px;">Tu préstamo ha sido registrado en el sistema.</p>
                                <div style="background: rgba(97, 0, 148, 0.2); padding: 15px; border-radius: 8px; border: 1px solid #610094; margin-bottom: 15px;">
                                    <i class="fa-solid fa-calendar-check" style="color: #4CAF50; font-size: 2rem; margin-bottom: 10px;"></i>
                                    <p style="margin: 0; font-size: 0.95rem; color: #b3c2d6;">
                                        Debes devolver el ejemplar máximo el:<br>
                                        <b style="color: #e0e6ed; font-size: 1.1rem; display: block; margin-top: 8px;">${fechaFormateada}</b>
                                    </p>
                                </div>
                                <p style="margin: 0; font-size: 0.85rem; color: #8b9bb4;">
                                    * Recuerda pasar a recogerlo pronto dentro del horario hábil.
                                </p>
                            </div>
                        `,
                        background: '#15224a', 
                        color: '#e0e6ed', 
                        confirmButtonColor: '#4CAF50', 
                        confirmButtonText: 'OK', 
                        allowOutsideClick: false 
                    });
                });
            }
        });
    }
});

// --- 6. RENDERIZAR "MIS PRÉSTAMOS" (ESTUDIANTE) ---
function cargarMisPrestamos() {
    const gridPrestamosGuardados = document.getElementById('grid-prestamos-guardados') || document.querySelector('.mis-prestamos-grid');
    const mensajeVacio = document.getElementById('mensaje-vacio');
    
    let prestamos = JSON.parse(localStorage.getItem('librosBiblioteca')) || [];
    const usuarioActual = localStorage.getItem('usuarioActual');
    let misLibros = prestamos.filter(l => l.estudiante === usuarioActual);
    
    if (gridPrestamosGuardados) gridPrestamosGuardados.innerHTML = ""; 

    if (misLibros.length === 0) {
        if (mensajeVacio) mensajeVacio.classList.remove('hidden');
    } else {
        if (mensajeVacio) mensajeVacio.classList.add('hidden');
        
        misLibros.forEach(libro => {
            const fechaOpciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            let fechaFormateada = new Date(libro.fechaDevolucion).toLocaleDateString('es-ES', fechaOpciones);
            fechaFormateada = fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1);

            const html = `
                <div class="book-card" style="border: 1px solid #610094; padding: 1.5rem; border-radius: 8px; background-color: var(--secondary-blue);">
                    <div class="book-image-container" style="text-align: center; margin-bottom: 15px;">
                        <img src="${libro.imagen}" alt="Portada" style="max-height: 180px; border-radius: 4px;">
                    </div>
                    <h3 style="margin-bottom: 0.5rem; height: 40px;">${libro.titulo}</h3>
                    <p class="author" style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 15px;">${libro.autor}</p>
                    
                    <div style="background: rgba(97, 0, 148, 0.2); padding: 10px; border-radius: 8px; margin-bottom: 15px;">
                        <p style="color: #b3c2d6; font-size: 0.8rem; text-transform: uppercase; margin-bottom: 5px;">Devolución programada:</p>
                        <p style="color: #e0e6ed; font-size: 0.95rem;"><strong>${fechaFormateada}</strong></p>
                    </div>
                    
                    <!-- NUEVO BOTÓN: DEVOLVER ANTES -->
                    <button class="btn btn-secondary" onclick="devolverLibroEstudiante('${libro.id}')" style="width: 100%; border-color: #F44336; color: #F44336; transition: 0.3s;">
                        Devolver Antes
                    </button>
                </div>
            `;
            if (gridPrestamosGuardados) gridPrestamosGuardados.innerHTML += html;
        });
    }
}
// --- 7. FUNCIÓN PARA REPROGRAMAR DEVOLUCIÓN (ESTUDIANTE) ---
window.devolverLibroEstudiante = function(idLibro) {
    let prestamos = JSON.parse(localStorage.getItem('librosBiblioteca')) || [];
    const usuarioActual = localStorage.getItem('usuarioActual');
    
    // Buscar el libro específico
    const index = prestamos.findIndex(l => l.id === idLibro && l.estudiante === usuarioActual);
    if (index === -1) return;

    const libroPrestado = prestamos[index];
    const fechaMaximaActual = new Date(libroPrestado.fechaDevolucion);
    const now = new Date();
    
    // Formateador seguro a prueba de zonas horarias
    const formatToLocalISO = (d) => {
        const tzOffset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    };

    const maxStr = formatToLocalISO(fechaMaximaActual);
    const minStr = formatToLocalISO(now);

    Swal.fire({
        title: 'Reprogramar Devolución',
        html: `
            <p style="margin-bottom: 15px;">Selecciona la nueva fecha para entregar:<br><strong>${libroPrestado.titulo}</strong></p>
            <input type="datetime-local" id="nueva-fecha-devolucion" class="swal2-input" style="width: 85%;" min="${minStr}" max="${maxStr}">
            <p style="margin-top: 15px; font-size: 0.85rem; color: #8b9bb4;">* Lunes a Viernes de 8:30 am a 6:30 pm.</p>
        `,
        background: '#15224a', color: '#e0e6ed',
        showCancelButton: true, confirmButtonColor: '#610094', cancelButtonColor: '#3F0071',
        confirmButtonText: 'Actualizar Fecha',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            const f = document.getElementById('nueva-fecha-devolucion').value;
            
            if (!f) { 
                Swal.showValidationMessage('Debes seleccionar una fecha.'); 
                return false; 
            }

            try {
                // Parseo nativo directo a la hora del computador
                const fechaSeleccionada = new Date(f);
                
                // 1. Validar que no sea mayor a la fecha que ya tenía apartada
                if (fechaSeleccionada.getTime() > fechaMaximaActual.getTime()) {
                    Swal.showValidationMessage('La fecha debe ser antes de tu límite original.');
                    return false;
                }
                
                // 2. Validar que no haya elegido una fecha pasada
                if (fechaSeleccionada.getTime() < now.getTime()) {
                    Swal.showValidationMessage('No puedes elegir una fecha en el pasado.');
                    return false;
                }

                // 3. Validación estricta del horario hábil (Lun-Vie, 8:30 a 18:30)
                const dia = fechaSeleccionada.getDay();
                const minDia = fechaSeleccionada.getHours() * 60 + fechaSeleccionada.getMinutes();
                
                if (dia === 0 || dia === 6) {
                    Swal.showValidationMessage('No hay servicio los fines de semana.');
                    return false;
                }
                if (minDia < (8 * 60 + 30) || minDia > (18 * 60 + 30)) {
                    Swal.showValidationMessage('Fuera de horario (Solo de 8:30 am a 6:30 pm).');
                    return false;
                }

                return f;
            } catch (error) {
                Swal.showValidationMessage('Ocurrió un error leyendo la fecha.');
                return false;
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            // Guardar la nueva fecha en el almacenamiento local
            prestamos[index].fechaDevolucion = result.value;
            localStorage.setItem('librosBiblioteca', JSON.stringify(prestamos));
            
            // Refrescar la pantalla de "Mis Préstamos"
            if (typeof cargarMisPrestamos === 'function') {
                cargarMisPrestamos();
            }

            // Crear el mensaje de confirmación bonito
            const fechaElegida = new Date(result.value);
            const opcionesFecha = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            let fechaFormateada = fechaElegida.toLocaleDateString('es-CO', opcionesFecha);
            fechaFormateada = fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1);

            Swal.fire({
                title: '¡Fecha Actualizada!',
                icon: 'success',
                html: `
                    <div style="text-align: center; margin-top: 10px;">
                        <p style="font-size: 1.05rem; margin-bottom: 15px;">Tu devolución ha sido reprogramada exitosamente.</p>
                        <div style="background: rgba(97, 0, 148, 0.2); padding: 15px; border-radius: 8px; border: 1px solid #610094; margin-bottom: 15px;">
                            <p style="margin: 0; font-size: 0.95rem; color: #b3c2d6;">
                                Nueva fecha máxima de entrega:<br>
                                <b style="color: #e0e6ed; font-size: 1.1rem; display: block; margin-top: 8px;">${fechaFormateada}</b>
                            </p>
                        </div>
                    </div>
                `,
                background: '#15224a', color: '#e0e6ed', confirmButtonColor: '#4CAF50', confirmButtonText: 'OK'
            });
        }
    });
};


// --- 9. INYECCIÓN DE DATOS DE PRUEBA (BORRAR EN PRODUCCIÓN) ---
(function inyectarPrestamosDePrueba() {
    let prestamosActuales = JSON.parse(localStorage.getItem('librosBiblioteca')) || [];
    
    // Solo inyectar si la base de datos está vacía para no duplicarlos cada vez que recargas
    if (prestamosActuales.length === 0) {
        const prestamosFalsos = [
            { 
                id: '1', 
                titulo: 'Fundamentos de Programación', 
                autor: 'Luis Joyanes Aguilar', 
                imagen: 'https://via.placeholder.com/150x200', 
                fechaDevolucion: '2026-09-23T10:30', 
                estudiante: '11111' 
            },
            { 
                id: '2', 
                titulo: 'Design Patterns', 
                autor: 'Gamma, Helm, Johnson, Vlissides', 
                imagen: 'https://via.placeholder.com/150x200', 
                fechaDevolucion: '2026-09-24T14:15', 
                estudiante: '22222' 
            },
            { 
                id: '3', 
                titulo: 'Ingeniería de Software: Un Enfoque Práctico', 
                autor: 'Roger S. Pressman', 
                imagen: 'https://via.placeholder.com/150x200', 
                fechaDevolucion: '2026-09-25T09:00', 
                estudiante: '33333' 
            },
            { 
                id: '4', 
                titulo: 'La Odisea', 
                autor: 'Homero', 
                imagen: 'https://via.placeholder.com/150x200', 
                fechaDevolucion: '2026-09-26T16:45', 
                estudiante: '44444' 
            },
            { 
                id: '5', 
                titulo: 'Cien Años de Soledad', 
                autor: 'Gabriel García Márquez', 
                imagen: 'https://via.placeholder.com/150x200', 
                fechaDevolucion: '2026-09-28T11:20', 
                estudiante: '55555' 
            }
        ];
        
        // Guardamos los 5 préstamos en el almacenamiento local
        localStorage.setItem('librosBiblioteca', JSON.stringify(prestamosFalsos));
        
        // Descontamos 1 ejemplar de cada uno en el inventario global para que sea realista
        let inventario = JSON.parse(localStorage.getItem('inventarioGlobal'));
        if (inventario) {
            ['1', '2', '3', '4', '5'].forEach(id => {
                if (inventario[id] > 0) inventario[id] -= 1;
            });
            localStorage.setItem('inventarioGlobal', JSON.stringify(inventario));
        }
    }
})();

// --- 10. RENDERIZAR DATOS EN LA TABLA DEL BIBLIOTECARIO ---
window.cargarPanelBibliotecario = function() {
    const prestamos = JSON.parse(localStorage.getItem('librosBiblioteca')) || [];
    
    // Buscar la tabla dentro del panel. Si no tiene tbody, se lo creamos.
    const tabla = document.querySelector('table');
    if (!tabla) return; // Si no hay tabla en el HTML, cancelamos

    let tbody = document.querySelector('table tbody');
    if (!tbody) {
        tbody = document.createElement('tbody');
        tabla.appendChild(tbody);
    } else {
        tbody.innerHTML = ''; // Limpiamos para que no se dupliquen al recargar
    }

    // Si la base de datos está vacía
    if (prestamos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #8b9bb4;">No hay préstamos activos pendientes de devolución.</td></tr>';
        return;
    }

    // Recorrer los datos inyectados y crear una fila (tr) por cada uno
    prestamos.forEach(prestamo => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = "1px solid #1a2756"; // Línea separadora
        
        // Formatear la fecha para que se vea legible
        const fecha = new Date(prestamo.fechaDevolucion);
        const fechaFormateada = fecha.toLocaleDateString('es-CO') + ' - ' + fecha.toLocaleTimeString('es-CO', {hour: '2-digit', minute:'2-digit'});

        tr.innerHTML = `
            <td style="padding: 12px; text-align: center; font-weight: bold; color: #4CAF50;">${prestamo.id}</td>
            <td style="padding: 12px; color: #e0e6ed;">${prestamo.titulo}</td>
            <td style="padding: 12px; text-align: center; color: #b3c2d6;">${prestamo.estudiante}</td>
            <td style="padding: 12px; text-align: center; color: #b3c2d6;">${fechaFormateada}</td>
            <td style="padding: 12px; text-align: center;">
                <button class="btn btn-primary" style="padding: 6px 12px; font-size: 0.85rem;" onclick="recibirLibroFisico('${prestamo.id}', '${prestamo.estudiante}')">
                    <i class="fa-solid fa-check"></i> Recibir
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
};

// --- 11. FUNCIÓN PARA PROCESAR LA DEVOLUCIÓN FÍSICA ---
window.recibirLibroFisico = function(idLibro, estudiante) {
    Swal.fire({
        title: '¿Confirmar recepción?',
        text: "Al recibirlo, se descontará de la cuenta del estudiante y volverá al inventario.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#4CAF50',
        cancelButtonColor: '#F44336',
        confirmButtonText: 'Sí, recibir libro',
        cancelButtonText: 'Cancelar',
        background: '#15224a', color: '#e0e6ed'
    }).then((result) => {
        if (result.isConfirmed) {
            // 1. Leer los préstamos actuales
            let prestamos = JSON.parse(localStorage.getItem('librosBiblioteca')) || [];
            
            // 2. Filtrar para eliminar el que acabamos de recibir
            prestamos = prestamos.filter(p => !(p.id === idLibro && p.estudiante === estudiante));
            localStorage.setItem('librosBiblioteca', JSON.stringify(prestamos));
            
            // 3. Volver a sumar el libro al inventario disponible
            let inventario = JSON.parse(localStorage.getItem('inventarioGlobal')) || {};
            if(inventario[idLibro] !== undefined) {
                inventario[idLibro] += 1;
                localStorage.setItem('inventarioGlobal', JSON.stringify(inventario));
            }

            // 4. Actualizar la tabla en vivo sin recargar la página
            cargarPanelBibliotecario();

            Swal.fire({
                title: '¡Recibido!',
                text: 'El libro ha sido ingresado al sistema exitosamente.',
                icon: 'success',
                background: '#15224a', color: '#e0e6ed', confirmButtonColor: '#610094'
            });
        }
    });
};