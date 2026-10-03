// src/js/auth.js

// 1. Inicializar Supabase (Asegúrate de poner tus credenciales reales aquí)
const supabaseUrl = 'https://sirytqfdlbgkcuvkquiq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpcnl0cWZkbGJna2N1dmtxdWlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5NjQwOTMsImV4cCI6MjEwNjU0MDA5M30.rv2TLpBL8_qMq_qlENS031H0neDbDJ_iQr48ohcUp-g';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Manejar el inicio de sesión
window.handleLogin = async function(e) {
    e.preventDefault();
    
    // Referencias a los inputs del DOM
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const loginBtn = document.querySelector('button[type="submit"]');
    
    if(!loginBtn) return;
    
    // Estado de carga visual
    const originalBtnText = loginBtn.innerHTML;
    loginBtn.innerHTML = '<i class="ph ph-spinner animate-spin text-xl"></i> Verificando...';
    loginBtn.disabled = true;

    try {
        // 1. Autenticar al usuario en Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (authError) throw authError;

        // 2. Obtener el perfil del usuario desde public.profiles
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role, is_approved')
            .eq('id', authData.user.id)
            .single();

        if (profileError) throw profileError;

        // 3. Verificar si la cuenta está aprobada
        if (!profile.is_approved) {
            await supabase.auth.signOut();
            throw new Error("Tu cuenta está pendiente de aprobación por un administrador.");
        }

        // 4. Redirección basada en el rol
        if (profile.role === 'admin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'dashboard.html';
        }

    } catch (error) {
        // Manejo de errores
        console.error("Error de autenticación:", error);
        alert(error.message || "Credenciales incorrectas.");
        
        // Restaurar el botón
        loginBtn.innerHTML = originalBtnText;
        loginBtn.disabled = false;
    }
};

// Manejar el registro de nuevos usuarios
document.getElementById('registerForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const name = document.getElementById('regName').value;
    const profession = document.getElementById('regProfession').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const regBtn = this.querySelector('button[type="submit"]');

    const originalBtnText = regBtn.innerHTML;
    regBtn.innerHTML = '<i class="ph ph-spinner animate-spin text-xl"></i> Enviando...';
    regBtn.disabled = true;

    try {
        // Crear usuario en Auth
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
        });

        if (error) throw error;

        // Insertar perfil en public.profiles (por defecto is_approved = false)
        const { error: insertError } = await supabase
            .from('profiles')
            .insert([
                { 
                    id: data.user.id, 
                    full_name: name, 
                    profession: profession,
                    role: 'user',
                    is_approved: false 
                }
            ]);

        if (insertError) throw insertError;

        alert("Solicitud enviada con éxito. Un administrador debe aprobar tu cuenta.");
        window.location.reload();

    } catch (error) {
        console.error("Error en registro:", error);
        alert(error.message);
        regBtn.innerHTML = originalBtnText;
        regBtn.disabled = false;
    }
});

// Lógica de Logout
window.logout = async function() {
    await supabase.auth.signOut();
    window.location.href = '../../index.html';
};