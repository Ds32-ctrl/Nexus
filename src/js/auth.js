// src/js/auth.js

// Elementos del DOM
const loginModal = document.getElementById('login-modal');
const loginCard = document.getElementById('login-card');
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');

// Abrir Modal
window.openLoginModal = function() {
    if(loginModal && loginCard) {
        loginModal.classList.remove('opacity-0', 'pointer-events-none');
        loginCard.classList.remove('scale-95');
        loginCard.classList.add('scale-100');
        if(loginError) loginError.classList.add('hidden'); // Resetear error
    }
};

// Cerrar Modal
window.closeLoginModal = function() {
    if(loginModal && loginCard) {
        loginModal.classList.add('opacity-0', 'pointer-events-none');
        loginCard.classList.remove('scale-100');
        loginCard.classList.add('scale-95');
    }
};

// Cerrar modal con la tecla Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && loginModal && !loginModal.classList.contains('opacity-0')) {
        closeLoginModal();
    }
});

// Manejar el envío del formulario
window.handleLogin = function(e) {
    e.preventDefault();
    
    if(!loginBtn) return;
    
    // Estado de carga del botón
    const originalBtnText = loginBtn.innerHTML;
    loginBtn.innerHTML = '<i class="ph ph-spinner animate-spin text-xl"></i> Verificando...';
    loginBtn.disabled = true;

    // Simular llamada a la API
    setTimeout(() => {
        closeLoginModal();
        
        // Redirigir a la vista modular del Dashboard
        window.location.href = 'src/views/dashboard.html';
        
        // Restaurar el botón en caso de que el usuario presione "Atrás" en el navegador
        setTimeout(() => {
            loginBtn.innerHTML = originalBtnText;
            loginBtn.disabled = false;
        }, 500);

    }, 1200);
};

// Lógica de Logout (Esta función será llamada desde dashboard.html)
window.logout = function() {
    // Como el dashboard está en src/views/, subimos dos niveles para volver al index
    window.location.href = '../../index.html';
};