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
    
    // Simular carga de validación de usuario y multas
    btnSubmit.textContent = 'Validando usuario...';
    btnSubmit.style.opacity = '0.7';
    btnSubmit.disabled = true;
    
    setTimeout(() => {
        if(codigo.length < 4) {
            // Error si el código es muy corto
            msgElement.style.display = 'block';
            msgElement.className = 'error-msg';
            msgElement.textContent = 'Código no válido.';
            btnSubmit.textContent = 'Ingresar al Sistema';
            btnSubmit.style.opacity = '1';
            btnSubmit.disabled = false;
        } else {
            // Éxito: Ocultar login y mostrar catálogo
            loginSection.classList.add('hidden');
            catalogSection.classList.remove('hidden');
            
            // Limpiar formulario para cuando vuelva a salir
            loginForm.reset();
            btnSubmit.textContent = 'Ingresar al Sistema';
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

botonesPrestamo.forEach(boton => {
    boton.addEventListener('click', function() {
        // Disparamos la alerta moderna de SweetAlert2
        Swal.fire({
            title: '¿Solicitar préstamo?',
            text: "Recuerda que tienes un plazo estándar para devolverlo físico según el reglamento.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#610094', // Tu color morado
            cancelButtonColor: '#08122c',  // Tu color azul
            confirmButtonText: 'Sí, solicitar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                // Si el usuario acepta, cambiamos el estado visual
                this.innerHTML = '<i class="fa-solid fa-check"></i> Préstamo Registrado';
                this.classList.remove('btn-primary');
                this.classList.add('btn-secondary');
                this.disabled = true;
                
                const statusBadge = this.previousElementSibling;
                statusBadge.textContent = "Prestado (En tu cuenta)";
                statusBadge.classList.remove('available');
                statusBadge.classList.add('unavailable');
                
                // Mensaje de éxito
                Swal.fire(
                    '¡Aprobado!',
                    'El préstamo fue registrado. Pasa por la biblioteca a recoger el ejemplar físico.',
                    'success'
                )
            }
        })
    });
});