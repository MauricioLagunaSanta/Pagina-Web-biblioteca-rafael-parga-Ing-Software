// --- 1. REFERENCIAS AL DOM ---
const loginForm = document.getElementById('login-form');
const loginSection = document.getElementById('login-section');
const catalogSection = document.getElementById('catalog-section');
const misPrestamosSection = document.getElementById('mis-prestamos-section');

const btnMisPrestamos = document.getElementById('btn-mis-prestamos');
const btnVolverCatalogo = document.getElementById('btn-volver-catalogo');
const btnLogout = document.getElementById('btn-logout');

const gridPrestamosGuardados = document.getElementById('grid-prestamos-guardados');
const mensajeVacio = document.getElementById('mensaje-vacio');
const botonesPrestamo = document.querySelectorAll('.btn-prestamo');

// --- 2. FUNCIONES DE FECHA ---
// Formatea la fecha para el input type="datetime-local" (YYYY-MM-DDTHH:mm)
function formatToLocalISO(date) {
    const tzoffset = date.getTimezoneOffset() * 60000; 
    return new Date(date.getTime() - tzoffset).toISOString().slice(0, 16);
}

// Formatea la fecha para que se vea bonita en pantalla
function formatFriendlyDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleString('es-CO', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
}

// --- 3. LÓGICA DE NAVEGACIÓN ---
loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    loginSection.classList.add('hidden');
    catalogSection.classList.remove('hidden');
});

btnLogout.addEventListener('click', function() {
    catalogSection.classList.add('hidden');
    misPrestamosSection.classList.add('hidden');
    loginSection.classList.remove('hidden');
    loginForm.reset();
});

btnMisPrestamos.addEventListener('click', function() {
    catalogSection.classList.add('hidden');
    misPrestamosSection.classList.remove('hidden');
    cargarMisPrestamos();
});

btnVolverCatalogo.addEventListener('click', function() {
    misPrestamosSection.classList.add('hidden');
    catalogSection.classList.remove('hidden');
});

// --- 4. SOLICITAR PRÉSTAMO (Máx 15 días, Mín 2 horas) ---
botonesPrestamo.forEach(boton => {
    boton.addEventListener('click', function() {
        const card = this.closest('.book-card');
        const idLibro = card.getAttribute('data-id');
        const titulo = card.querySelector('h3').textContent;
        const imagen = card.querySelector('img').src;
        const autor = card.querySelector('.author').textContent;

        // Calcular límites de tiempo
        const now = new Date();
        const minDate = new Date(now.getTime() + 2 * 60 * 60 * 1000); // Mínimo: ahora + 2 horas
        const maxDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000); // Máximo: ahora + 15 días

        const minStr = formatToLocalISO(minDate);
        const maxStr = formatToLocalISO(maxDate);

        Swal.fire({
            title: 'Configurar Préstamo',
            html: `
                <p>Libro: <strong>${titulo}</strong></p>
                <p style="font-size: 0.9rem; color: #8b9bb4; margin-bottom: 15px;">
                    Selecciona cuándo devolverás el libro.<br>
                    (Mínimo 2 horas, Máximo 15 días)
                </p>
                <input type="datetime-local" id="fecha-devolucion" class="swal2-input" style="width: 85%;" min="${minStr}" max="${maxStr}">
            `,
            background: '#15224a',
            color: '#e0e6ed',
            showCancelButton: true,
            confirmButtonColor: '#610094',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Confirmar Préstamo',
            cancelButtonText: 'Cancelar',
            preConfirm: () => {
                const fechaSeleccionada = document.getElementById('fecha-devolucion').value;
                if (!fechaSeleccionada) {
                    Swal.showValidationMessage('Debes seleccionar una fecha y hora');
                    return false;
                }
                const selected = new Date(fechaSeleccionada);
                if (selected < minDate) {
                    Swal.showValidationMessage('El tiempo mínimo de préstamo es de 2 horas.');
                    return false;
                }
                if (selected > maxDate) {
                    Swal.showValidationMessage('El tiempo máximo de préstamo es de 15 días.');
                    return false;
                }
                return fechaSeleccionada;
            }
        }).then((result) => {
            if (result.isConfirmed) {
                // Guardar en la "Base de datos" (LocalStorage)
                let prestamos = JSON.parse(localStorage.getItem('librosBiblioteca')) || [];
                
                // Evitar duplicados
                if(!prestamos.find(l => l.id === idLibro)) {
                    prestamos.push({
                        id: idLibro,
                        titulo: titulo,
                        imagen: imagen,
                        autor: autor,
                        fechaDevolucion: result.value
                    });
                    localStorage.setItem('librosBiblioteca', JSON.stringify(prestamos));
                }

                // Cambiar estado visual del botón (Usando 1 sola palomilla)
                this.innerHTML = '<i class="fa-solid fa-check"></i> PRÉSTAMO REGISTRADO';
                this.classList.remove('btn-primary');
                this.classList.add('btn-secondary');
                this.disabled = true;

                const statusBadge = card.querySelector('.status');
                statusBadge.textContent = "Prestado (En tu cuenta)";
                statusBadge.classList.remove('available');
                statusBadge.classList.add('unavailable');

                Swal.fire({
                    title: '¡Registrado!',
                    text: 'El libro está en tu cuenta. Pasa por la biblioteca a recogerlo.',
                    icon: 'success',
                    background: '#15224a',
                    color: '#e0e6ed',
                    confirmButtonColor: '#610094'
                });
            }
        });
    });
});

// --- 5. RENDERIZAR "MIS PRÉSTAMOS" ---
function cargarMisPrestamos() {
    let prestamos = JSON.parse(localStorage.getItem('librosBiblioteca')) || [];
    gridPrestamosGuardados.innerHTML = "";

    if (prestamos.length === 0) {
        mensajeVacio.classList.remove('hidden');
    } else {
        mensajeVacio.classList.add('hidden');
        
        prestamos.forEach(libro => {
            const html = `
                <div class="book-card">
                    <div class="book-image-container">
                        <img src="${libro.imagen}" alt="Portada" class="book-cover-img">
                    </div>
                    <h3>${libro.titulo}</h3>
                    <p class="author">${libro.autor}</p>
                    
                    <div class="fecha-destacada">
                        <p style="color: var(--text-muted); font-size: 0.85rem; text-transform: uppercase;">Devolución programada:</p>
                        <p><strong><i class="fa-regular fa-calendar-check"></i> ${formatFriendlyDate(libro.fechaDevolucion)}</strong></p>
                    </div>

                    <button class="btn btn-edit-time" onclick="editarTiempo('${libro.id}')">
                        <i class="fa-solid fa-pen-to-square"></i> Devolver más rápido
                    </button>
                </div>
            `;
            gridPrestamosGuardados.innerHTML += html;
        });
    }
}

// --- 6. EDITAR TIEMPO (Acortar fecha) ---
// Usamos window. para que sea accesible desde el onclick del HTML inyectado
window.editarTiempo = function(idLibro) {
    let prestamos = JSON.parse(localStorage.getItem('librosBiblioteca')) || [];
    let index = prestamos.findIndex(l => l.id === idLibro);
    
    if (index === -1) return;
    let libro = prestamos[index];

    const now = new Date();
    const minDate = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 horas mínimo
    const maxDate = new Date(libro.fechaDevolucion); // Límite máximo: la fecha que ya tenía

    // Si el tiempo mínimo (ahora + 2h) ya supera su fecha de entrega actual, no puede acortar más
    if (minDate >= maxDate) {
        Swal.fire({
            title: 'No es posible editar',
            text: 'Faltan menos de 2 horas para tu fecha límite actual. Ya no puedes acortar más el plazo de entrega.',
            icon: 'warning',
            background: '#15224a',
            color: '#e0e6ed',
            confirmButtonColor: '#610094'
        });
        return;
    }

    const minStr = formatToLocalISO(minDate);
    const maxStr = formatToLocalISO(maxDate);

    Swal.fire({
        title: 'Adelantar Devolución',
        html: `
            <p style="font-size: 0.9rem; margin-bottom: 15px;">Solo puedes elegir una fecha anterior a la programada actualmente.</p>
            <input type="datetime-local" id="nueva-fecha" class="swal2-input" style="width: 85%;" min="${minStr}" max="${maxStr}">
        `,
        background: '#15224a',
        color: '#e0e6ed',
        showCancelButton: true,
        confirmButtonColor: '#610094',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Actualizar',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            const nuevaF = document.getElementById('nueva-fecha').value;
            if (!nuevaF) {
                Swal.showValidationMessage('Selecciona una nueva fecha');
                return false;
            }
            const selected = new Date(nuevaF);
            if (selected < minDate) {
                Swal.showValidationMessage('El mínimo sigue siendo 2 horas.');
                return false;
            }
            if (selected > maxDate) {
                Swal.showValidationMessage('No puedes extender el tiempo, solo adelantarlo.');
                return false;
            }
            return nuevaF;
        }
    }).then((result) => {
        if (result.isConfirmed) {
            // Actualizar el array y guardar
            prestamos[index].fechaDevolucion = result.value;
            localStorage.setItem('librosBiblioteca', JSON.stringify(prestamos));
            
            // Recargar la vista
            cargarMisPrestamos();
            
            Swal.fire({
                title: '¡Actualizado!',
                text: 'Has adelantado tu fecha de devolución.',
                icon: 'success',
                background: '#15224a',
                color: '#e0e6ed',
                confirmButtonColor: '#610094'
            });
        }
    });
};