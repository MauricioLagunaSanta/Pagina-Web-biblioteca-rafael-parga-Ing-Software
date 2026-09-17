// Referencias a los elementos del DOM
const loginForm = document.getElementById('login-form');
const btnSubmit = document.querySelector('#login-form .btn-primary');
const msgElement = document.getElementById('login-message');
const loginSection = document.getElementById('login-section');
const catalogSection = document.getElementById('catalog-section');
const misPrestamosSection = document.getElementById('mis-prestamos-section');
const btnLogout = document.getElementById('btn-logout');
const btnMisPrestamos = document.getElementById('btn-mis-prestamos');
const btnVolverCatalogo = document.getElementById('btn-volver-catalogo');
const gridPrestamosGuardados = document.getElementById('grid-prestamos-guardados');
const mensajeVacio = document.getElementById('mensaje-vacio');

// 1. Lógica del sistema de login
loginForm.addEventListener('submit', function(event) {
    event.preventDefault();
    const codigo = document.getElementById('codigo').value;
    
    btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Validando usuario...';
    btnSubmit.style.opacity = '0.7';
    btnSubmit.disabled = true;
    
    setTimeout(() => {
        if(codigo.length < 4) {
            msgElement.style.display = 'block';
            msgElement.className = 'error-msg';
            msgElement.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Código no válido.';
            
            btnSubmit.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Ingresar al Sistema';
            btnSubmit.style.opacity = '1';
            btnSubmit.disabled = false;
        } else {
            loginSection.classList.add('hidden');
            catalogSection.classList.remove('hidden');
            loginForm.reset();
            btnSubmit.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Ingresar al Sistema';
            btnSubmit.style.opacity = '1';
            btnSubmit.disabled = false;
            msgElement.style.display = 'none';
        }
    }, 1500);
});

// 2. Navegación
btnLogout.addEventListener('click', function() {
    catalogSection.classList.add('hidden');
    misPrestamosSection.classList.add('hidden');
    loginSection.classList.remove('hidden');
});

btnMisPrestamos.addEventListener('click', function() {
    catalogSection.classList.add('hidden');
    misPrestamosSection.classList.remove('hidden');
    cargarPrestamos(); // Cargamos los datos de la "base de datos"
});

btnVolverCatalogo.addEventListener('click', function() {
    misPrestamosSection.classList.add('hidden');
    catalogSection.classList.remove('hidden');
});

// 3. Lógica para Guardar en "Base de Datos" (Local Storage)
const botonesPrestamo = document.querySelectorAll('.btn-prestamo');

botonesPrestamo.forEach(boton => {
    boton.addEventListener('click', (event) => {
        
        Swal.fire({
            title: '¿Solicitar préstamo?',
            text: "Recuerda que el plazo estándar es de 7 días según el reglamento.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#610094', 
            cancelButtonColor: '#08122c',  
            confirmButtonText: '<i class="fa-solid fa-check"></i> Sí, solicitar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                // Capturar datos de la tarjeta del libro a la que se le dio clic
                const tarjeta = event.target.closest('.book-card');
                const idLibro = tarjeta.getAttribute('data-id');
                const titulo = tarjeta.querySelector('h3').innerText;
                const autor = tarjeta.querySelector('.author').innerText;
                const imagenSrc = tarjeta.querySelector('.book-cover-img').src;

                // Calcular fecha de devolución (hoy + 7 días)
                const fechaHoy = new Date();
                fechaHoy.setDate(fechaHoy.getDate() + 7);
                const fechaDevolucion = fechaHoy.toLocaleDateString('es-CO');

                // Crear objeto libro
                const libroPrestado = {
                    id: idLibro,
                    titulo: titulo,
                    autor: autor,
                    imagen: imagenSrc,
                    devolucion: fechaDevolucion
                };

                // Traer libros anteriores del servidor virtual (localStorage)
                let misLibros = JSON.parse(localStorage.getItem('librosBiblioteca')) || [];
                
                // Evitar guardar el mismo libro dos veces
                const yaExiste = misLibros.find(libro => libro.id === idLibro);
                if(!yaExiste) {
                    misLibros.push(libroPrestado);
                    localStorage.setItem('librosBiblioteca', JSON.stringify(misLibros));
                }

                // Actualizar interfaz del catálogo
                boton.innerHTML = '<i class="fa-solid fa-check-double"></i> Préstamo Registrado';
                boton.classList.remove('btn-primary');
                boton.classList.add('btn-secondary');
                boton.disabled = true;
                
                const statusBadge = boton.previousElementSibling;
                if(statusBadge) {
                    statusBadge.innerHTML = '<i class="fa-solid fa-user-clock"></i> En tu cuenta';
                    statusBadge.classList.remove('available');
                    statusBadge.classList.add('unavailable');
                }
                
                Swal.fire(
                    '¡Préstamo Registrado!',
                    'El libro ha sido guardado en "Mis Préstamos".',
                    'success'
                );
            }
        });
    });
});

// 4. Función para leer la "Base de Datos" y pintar los libros
function cargarPrestamos() {
    const misLibros = JSON.parse(localStorage.getItem('librosBiblioteca')) || [];
    
    // Limpiamos la grilla antes de dibujar
    gridPrestamosGuardados.innerHTML = '';

    if(misLibros.length === 0) {
        mensajeVacio.classList.remove('hidden');
    } else {
        mensajeVacio.classList.add('hidden');
        
        // Dibujamos cada libro guardado
        misLibros.forEach(libro => {
            const libroHTML = `
                <div class="book-card">
                    <div class="book-image-container">
                        <img src="${libro.imagen}" alt="Portada" class="book-cover-img">
                    </div>
                    <h3>${libro.titulo}</h3>
                    <p class="author">${libro.autor}</p>
                    
                    <div class="fecha-devolucion">
                        <i class="fa-solid fa-calendar-day"></i> Devolución: ${libro.devolucion}
                    </div>
                    
                    <button class="btn btn-secondary" disabled><i class="fa-solid fa-clock"></i> Préstamo Activo</button>
                </div>
            `;
            gridPrestamosGuardados.innerHTML += libroHTML;
        });
    }
}

// Inicializar la validación visual si el libro ya estaba prestado en sesiones anteriores
document.addEventListener('DOMContentLoaded', () => {
    const misLibros = JSON.parse(localStorage.getItem('librosBiblioteca')) || [];
    
    misLibros.forEach(libroGuardado => {
        const tarjeta = document.querySelector(`.book-card[data-id="${libroGuardado.id}"]`);
        if(tarjeta) {
            const boton = tarjeta.querySelector('.btn-prestamo');
            const statusBadge = tarjeta.querySelector('.status');
            
            if(boton && statusBadge) {
                boton.innerHTML = '<i class="fa-solid fa-check-double"></i> Préstamo Registrado';
                boton.classList.remove('btn-primary');
                boton.classList.add('btn-secondary');
                boton.disabled = true;
                
                statusBadge.innerHTML = '<i class="fa-solid fa-user-clock"></i> En tu cuenta';
                statusBadge.classList.remove('available');
                statusBadge.classList.add('unavailable');
            }
        }
    });
});