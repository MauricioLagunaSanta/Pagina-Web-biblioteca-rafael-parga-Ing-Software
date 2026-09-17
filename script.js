// Referencias a los elementos del DOM
const loginForm = document.getElementById('login-form');
const btnSubmit = document.querySelector('#login-form .btn-primary');
const msgElement = document.getElementById('login-message');
const loginSection = document.getElementById('login-section');
const catalogSection = document.getElementById('catalog-section');
const btnLogout = document.getElementById('btn-logout');

// 1. Lógica del sistema de login (Simulación)
loginForm.addEventListener('submit', function(event) {
    event.preventDefault();

    const codigo = document.getElementById('codigo').value;
    
    // Usamos innerHTML para poner un ícono de carga animado sin dañar el diseño
    btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Validando usuario...';
    btnSubmit.style.opacity = '0.7';
    btnSubmit.disabled = true;
    
    setTimeout(() => {
        if(codigo.length < 4) {
            // Error si el código es muy corto
            msgElement.style.display = 'block';
            msgElement.className = 'error-msg';
            msgElement.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Código no válido.';
            
            // Restauramos el botón con su ícono original
            btnSubmit.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Ingresar al Sistema';
            btnSubmit.style.opacity = '1';
            btnSubmit.disabled = false;
        } else {
            // Éxito: Validamos que no tenga multas pendientes y abrimos catálogo
            loginSection.classList.add('hidden');
            catalogSection.classList.remove('hidden');
            
            // Limpiar formulario para cuando cierre sesión
            loginForm.reset();
            btnSubmit.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Ingresar al Sistema';
            btnSubmit.style.opacity = '1';
            btnSubmit.disabled = false;
            msgElement.style.display = 'none';
        }
    }, 1500);
});

// 2. Lógica para Cerrar Sesión
btnLogout.addEventListener('click', function() {
    catalogSection.classList.add('hidden');
    loginSection.classList.remove('hidden');
});

// 3. Lógica para los botones de "Solicitar Préstamo" usando SweetAlert2
const botonesPrestamo = document.querySelectorAll('.btn-prestamo');

// Cambiamos a función de flecha para no perder la referencia del botón
botonesPrestamo.forEach(boton => {
    boton.addEventListener('click', () => {
        
        // Disparamos la alerta moderna de SweetAlert2
        Swal.fire({
            title: '¿Solicitar préstamo?',
            text: "Recuerda que tienes un plazo estándar de X días para devolverlo físico según las reglas de negocio.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#610094', // Tu color morado
            cancelButtonColor: '#08122c',  // Tu color azul oscuro
            confirmButtonText: '<i class="fa-solid fa-check"></i> Sí, solicitar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                // Usamos 'boton.innerHTML' en lugar de 'this' para evitar errores
                boton.innerHTML = '<i class="fa-solid fa-check-double"></i> Préstamo Registrado';
                boton.classList.remove('btn-primary');
                boton.classList.add('btn-secondary');
                boton.disabled = true;
                
                const statusBadge = boton.previousElementSibling;
                if(statusBadge) {
                    statusBadge.innerHTML = '<i class="fa-solid fa-user-clock"></i> Prestado (En tu cuenta)';
                    statusBadge.classList.remove('available');
                    statusBadge.classList.add('unavailable');
                }
                
                // Mensaje de éxito
                Swal.fire(
                    '¡Préstamo Registrado!',
                    'El sistema actualizó el inventario. Pasa por la biblioteca a recoger el ejemplar físico.',
                    'success'
                );
            }
        });
    });
});