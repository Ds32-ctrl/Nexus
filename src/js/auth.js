// 1. Configuración de Supabase
const supabaseUrl = 'https://TU_PROJECT_URL.supabase.co'; // <--- REEMPLAZA ESTO
const supabaseKey = 'TU_ANON_KEY'; // <--- REEMPLAZA ESTO

// Inicializamos el cliente
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// 2. Lógica del formulario de Login
const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Evita que la página se recargue
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const loginBtn = document.getElementById('loginBtn');
        
        // Efecto visual de carga
        const originalText = loginBtn.innerText;
        loginBtn.innerText = 'Autenticando...';
        loginBtn.disabled = true;

        try {
            // Llamada a Supabase para iniciar sesión
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) throw error;

            // Si es exitoso, redirigimos al dashboard
            window.location.href = 'dashboard.html';
        } catch (error) {
            alert('Error en la autenticación: ' + error.message);
            console.error(error);
        } finally {
            loginBtn.innerText = originalText;
            loginBtn.disabled = false;
        }
    });
}

// 3. Proteger el Dashboard y Lógica de Logout
const logoutBtn = document.getElementById('logoutBtn');

// Verificamos si hay sesión activa solo si estamos en el dashboard
if (window.location.pathname.includes('dashboard.html')) {
    checkUser();
}

async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Si no hay usuario, devolver al login como medida de seguridad
    if (!user) {
        window.location.href = 'login.html';
    }
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        const { error } = await supabase.auth.signOut();
        if (!error) {
            window.location.href = 'login.html';
        }
    });
}