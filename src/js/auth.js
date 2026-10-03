// 1. Configuración de Supabase
const supabaseUrl = 'https://sirytqfdlbgkcuvkquiq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpcnl0cWZkbGJna2N1dmtxdWlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5NjQwOTMsImV4cCI6MjEwNjU0MDA5M30.rv2TLpBL8_qMq_qlENS031H0neDbDJ_iQr48ohcUp-g';

const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// 2. Lógica de Login
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const loginBtn = document.getElementById('loginBtn');
        
        const originalText = loginBtn.innerText;
        loginBtn.innerText = 'Verificando credenciales...';
        loginBtn.disabled = true;

        try {
            // Iniciar sesión en auth
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
            if (authError) throw authError;

            // Verificar si el perfil está aprobado en la base de datos
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('is_approved, role')
                .eq('id', authData.user.id)
                .single();

            if (profileError) throw profileError;

            if (profile.is_approved === true) {
                // Aprobado: Entrar al sistema
                window.location.href = 'dashboard.html';
            } else {
                // Bloqueado: Cerrar sesión inmediatamente y avisar
                await supabase.auth.signOut();
                alert("ACCESO DENEGADO: Tu cuenta está en revisión. Espera la aprobación del Administrador de Nexus.");
            }
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            loginBtn.innerText = originalText;
            loginBtn.disabled = false;
        }
    });
}

// 3. Lógica de Registro (Solicitar Acceso)
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        const fullName = document.getElementById('regName').value;
        const profession = document.getElementById('regProfession').value;
        const regBtn = document.getElementById('regBtn');
        
        const originalText = regBtn.innerText;
        regBtn.innerText = 'Generando Solicitud...';
        regBtn.disabled = true;

        try {
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: fullName,
                        profession: profession
                    }
                }
            });
            
            if (error) throw error;
            
            alert("SOLICITUD ENVIADA EXITOSAMENTE. El administrador debe aprobar tu acceso para que puedas iniciar sesión.");
            // Cambiar a la pestaña de login visualmente
            switchTab('login');
            registerForm.reset();
            
        } catch (error) {
            alert('Error en el registro: ' + error.message);
        } finally {
            regBtn.innerText = originalText;
            regBtn.disabled = false;
        }
    });
}