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

// 3. Lógica para los botones de "Solicitar Préstamo"
const botonesPrestamo = document.querySelectorAll('.btn-prestamo');

botonesPrestamo.forEach(boton => {
    boton.addEventListener('click', function() {
        // Al hacer clic en un libro disponible
        const confirmacion = confirm("¿Deseas solicitar el préstamo de este ejemplar? Recuerda que tienes X días para devolverlo según las reglas de negocio.");
        
        if(confirmacion) {
            // Cambiar el estado visual del botón
            this.textContent = "Préstamo Registrado";
            this.classList.remove('btn-primary');
            this.classList.add('btn-secondary');
            this.disabled = true;
            
            // Cambiar el badge de estado
            const statusBadge = this.previousElementSibling;
            statusBadge.textContent = "Prestado (En tu cuenta)";
            statusBadge.classList.remove('available');
            statusBadge.classList.add('unavailable');
            
            alert("El préstamo ha sido registrado exitosamente. Podrás pasar por la biblioteca a recoger el ejemplar físico.");
        }
    });
});