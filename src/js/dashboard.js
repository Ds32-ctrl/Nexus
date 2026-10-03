const supabaseUrl = 'https://sirytqfdlbgkcuvkquiq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpcnl0cWZkbGJna2N1dmtxdWlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5NjQwOTMsImV4cCI6MjEwNjU0MDA5M30.rv2TLpBL8_qMq_qlENS031H0neDbDJ_iQr48ohcUp-g';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', initDashboard);

async function initDashboard() {
    // Verificar sesión
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Obtener datos del perfil
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error || !profile) {
        console.error(error);
        return;
    }

    // Llenar datos en el HTML
    document.getElementById('userName').innerText = profile.full_name.split(' ')[0]; // Primer nombre
    document.getElementById('userProfession').innerText = profile.profession || 'Operador Nexus';

    // Si es Administrador, mostrar panel de control y cargar solicitudes
    if (profile.role === 'admin') {
        document.getElementById('adminPanel').style.display = 'block';
        loadPendingRequests();
    }
}

// Función exclusiva para el Administrador
async function loadPendingRequests() {
    const { data: pendingUsers, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_approved', false);

    const listContainer = document.getElementById('pendingRequestsList');
    
    if (error) {
        listContainer.innerHTML = '<p>Error al cargar solicitudes.</p>';
        return;
    }

    if (pendingUsers.length === 0) {
        listContainer.innerHTML = '<p style="color: var(--text-muted);">No hay solicitudes pendientes.</p>';
        return;
    }

    let html = '';
    pendingUsers.forEach(u => {
        html += `
            <div style="background: var(--bg-color); padding: 1rem; border-radius: 8px; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center; border: 1px solid var(--border-color);">
                <div>
                    <h4 style="margin: 0; color: var(--primary-color);">${u.full_name}</h4>
                    <span style="font-size: 0.85rem; color: var(--text-muted);">${u.profession}</span>
                </div>
                <button onclick="approveUser('${u.id}')" class="btn btn-outline" style="width: auto; padding: 0.5rem 1rem; border-color: var(--accent); color: var(--accent);">
                    Aprobar Acceso
                </button>
            </div>
        `;
    });
    listContainer.innerHTML = html;
}

// Aprobar usuario (Global para que el HTML pueda llamarla)
window.approveUser = async function(userId) {
    const { error } = await supabase
        .from('profiles')
        .update({ is_approved: true })
        .eq('id', userId);

    if (error) {
        alert('Error al aprobar: ' + error.message);
    } else {
        alert('Usuario aprobado con éxito.');
        loadPendingRequests(); // Recargar la lista
    }
}

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
});