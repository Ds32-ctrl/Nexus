// 1. Configuración de Supabase
const supabaseUrl = '[https://sirytqfdlbgkcuvkquiq.supabase.co](https://sirytqfdlbgkcuvkquiq.supabase.co)';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpcnl0cWZkbGJna2N1dmtxdWlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5NjQwOTMsImV4cCI6MjEwNjU0MDA5M30.rv2TLpBL8_qMq_qlENS031H0neDbDJ_iQr48ohcUp-g';

const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// 2. Lógica de Login y Registro
const authForm = document.getElementById('authForm');
const toggleAuthMode = document.getElementById('toggleAuthMode');
let isLoginMode = true; // Por defecto empezamos en modo Login

// Cambiar entre Login y Registro
if (toggleAuthMode) {
    toggleAuthMode.addEventListener('click', (e) => {
        e.preventDefault();
        isLoginMode = !isLoginMode;
        
        const nameGroup = document.getElementById('nameGroup');
        const submitBtn = document.getElementById('submitBtn');
        const formTitle = document.getElementById('formTitle');
        const formSubtitle = document.getElementById('formSubtitle');

        if (isLoginMode) {
            nameGroup.style.display = 'none';
            document.getElementById('fullName').removeAttribute('required');
            submitBtn.innerText = 'Iniciar Protocolo';
            formTitle.innerHTML = 'Acceso <span class="gradient-text">Nexus</span>';
            formSubtitle.innerText = 'Autenticación requerida para acceder al sistema.';
            toggleAuthMode.innerHTML = '¿No tienes acceso? <span style="color: var(--primary-color);">Solicitar credenciales.</span>';
        } else {
            nameGroup.style.display = 'block';
            document.getElementById('fullName').setAttribute('required', 'true');
            submitBtn.innerText = 'Registrar Operador';
            formTitle.innerHTML = 'Registro <span class="gradient-text">Nexus</span>';
            formSubtitle.innerText = 'Inicializando nuevo entorno de alto rendimiento.';
            toggleAuthMode.innerHTML = '¿Ya tienes acceso? <span style="color: var(--primary-color);">Iniciar sesión.</span>';
        }
    });
}

// Manejar el envío del formulario
if (authForm) {
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const fullName = document.getElementById('fullName').value;
        const submitBtn = document.getElementById('submitBtn');
        
        const originalText = submitBtn.innerText;
        submitBtn.innerText = 'Procesando...';
        submitBtn.disabled = true;

        try {
            if (isLoginMode) {
                // Modo: Iniciar Sesión
                const { error } = await supabase.auth.signInWithPassword({
                    email: email,
                    password: password,
                });
                if (error) throw error;
                window.location.href = 'dashboard.html';
            } else {
                // Modo: Registro
                const { data, error } = await supabase.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        data: {
                            full_name: fullName // Se guarda en el meta_data del usuario
                        }
                    }
                });
                
                if (error) throw error;
                
                // Nota: Supabase requiere confirmación de email por defecto. 
                // Si ves un error sobre verificar el correo, ve a Supabase > Authentication > Providers > Email y desactiva "Confirm email".
                if (data.user && data.user.identities && data.user.identities.length === 0) {
                     alert("Ese correo ya está registrado. Intenta iniciar sesión.");
                } else {
                     alert("¡Registro exitoso! Ya puedes acceder a Nexus.");
                     // Forzar cambio a modo login
                     toggleAuthMode.click();
                }
            }
        } catch (error) {
            alert('Error en el sistema: ' + error.message);
            console.error(error);
        } finally {
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        }
    });
}

// 3. Proteger Rutas y Logout (Se mantiene igual)
const logoutBtn = document.getElementById('logoutBtn');

if (window.location.pathname.includes('dashboard.html')) {
    checkUser();
}

async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
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