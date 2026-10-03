// src/js/auth.js

// 1. Inicializar Supabase
// Cambiamos el nombre a 'supabaseClient' para evitar el conflicto con la variable global del CDN
const supabaseUrl = 'https://sirytqfdlbgkcuvkquiq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpcnl0cWZkbGJna2N1dmtxdWlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5NjQwOTMsImV4cCI6MjEwNjU0MDA5M30.rv2TLpBL8_qMq_qlENS031H0neDbDJ_iQr48ohcUp-g';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// 2. Manejar el inicio de sesión
document.getElementById('loginForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Referencias a los inputs
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    // Buscar el botón ESPECÍFICAMENTE dentro de este formulario
    const loginBtn = this.querySelector('button[type="submit"]');
    
    if(!loginBtn) return;
    
    // Estado de carga visual
    const originalBtnText = loginBtn.innerHTML;
    loginBtn.innerHTML = '<i class="ph ph-spinner animate-spin text-xl"></i> Verificando...';
    loginBtn.disabled = true;

    try {
        // A. Autenticar al usuario en Supabase Auth
        const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (authError) throw authError;

        // B. Obtener el perfil del usuario desde public.profiles
        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('role, is_approved')
            .eq('id', authData.user.id)
            .single();

        // Si la política SQL (RLS) falta, el error saltará aquí
        if (profileError) throw new Error("No se pudo obtener el perfil. Verifica las políticas de Supabase.");

        // C. Verificar si la cuenta está aprobada
        if (!profile.is_approved) {
            await supabaseClient.auth.signOut();
            throw new Error("Tu cuenta está pendiente de aprobación por un administrador.");
        }

        // D. Redirección basada en el rol
        if (profile.role === 'admin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'dashboard.html';
        }

    } catch (error) {
        console.error("Error de autenticación:", error);
        alert(error.message || "Credenciales incorrectas.");
        
        // Restaurar el botón
        loginBtn.innerHTML = originalBtnText;
        loginBtn.disabled = false;
    }
});

// 3. Manejar el registro de nuevos usuarios
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
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
        });

        if (error) throw error;

        const { error: insertError } = await supabaseClient
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

// 4. Lógica de Logout
window.logout = async function() {
    if(supabaseClient) {
        await supabaseClient.auth.signOut();
    }
    window.location.href = '../../index.html';
};