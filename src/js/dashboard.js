const supabaseUrl = 'https://sirytqfdlbgkcuvkquiq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpcnl0cWZkbGJna2N1dmtxdWlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5NjQwOTMsImV4cCI6MjEwNjU0MDA5M30.rv2TLpBL8_qMq_qlENS031H0neDbDJ_iQr48ohcUp-g';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        if (authError || !user) return window.location.href = 'login.html';

        const { data: profile } = await supabaseClient.from('profiles').select('*').eq('id', user.id).single();
        
        // Aislar ruta: Si ES admin, lo envía directamente al centro de control
        if (profile && profile.role === 'admin') {
            return window.location.href = 'admin.html';
        }

        if (profile) {
            const fullName = profile.full_name || 'Operador';
            document.getElementById('userName').innerText = fullName.split(' ')[0];
            document.getElementById('userProfession').innerText = profile.profession || 'Operador Nexus';
        }
    } catch (err) {
        console.error("Fallo general en la inicialización:", err);
    }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    window.location.href = 'login.html';
});