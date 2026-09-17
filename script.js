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