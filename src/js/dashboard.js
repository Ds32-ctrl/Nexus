// 1. Configuración de Supabase
const supabaseUrl = 'https://sirytqfdlbgkcuvkquiq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpcnl0cWZkbGJna2N1dmtxdWlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5NjQwOTMsImV4cCI6MjEwNjU0MDA5M30.rv2TLpBL8_qMq_qlENS031H0neDbDJ_iQr48ohcUp-g';

const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// 2. Inicialización del Dashboard
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Verificar si hay sesión activa
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        
        if (authError || !user) {
            window.location.href = 'login.html';
            return;
        }

        // Obtener datos del perfil del usuario logueado
        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            console.error("Error cargando perfil:", profileError);
            document.getElementById('userProfession').innerText = "Error cargando perfil.";
            return;
        }

        // Llenar interfaz principal de forma segura (previene error de null)
        const fullName = profile.full_name || 'Operador';
        document.getElementById('userName').innerText = fullName.split(' ')[0];
        document.getElementById('userProfession').innerText = profile.profession || 'Operador Nexus';

        // 3. Lógica de Administrador
        if (profile.role === 'admin') {
            document.getElementById('adminPanel').style.display = 'block';
            document.getElementById('roleBadge').style.display = 'inline-block';
            loadAdminData();
        }
    } catch (err) {
        console.error("Fallo general en la inicialización:", err);
    }
});

// Función para cargar los usuarios en el panel de Comandancia
async function loadAdminData() {
    const pendingList = document.getElementById('pendingList');
    const activeList = document.getElementById('activeList');

    const { data: allUsers, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error(error);
        pendingList.innerHTML = '<p style="color: #ef4444;">Error de permisos (RLS) en la base de datos.</p>';
        return;
    }

    // Filtrar usuarios
    const pendingUsers = allUsers.filter(u => u.is_approved === false);
    const activeUsers = allUsers.filter(u => u.is_approved === true && u.role !== 'admin'); 

    // Renderizar Pendientes
    if (pendingUsers.length === 0) {
        pendingList.innerHTML = '<p style="color: #8b949e; margin-top: 1rem;">No hay solicitudes pendientes.</p>';
    } else {
        pendingList.innerHTML = pendingUsers.map(u => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; margin-bottom: 10px;">
                <div>
                    <h4 style="margin: 0; color: #e6edf3; font-size: 1rem;">${u.full_name || 'Sin Nombre'}</h4>
                    <span style="font-size: 0.85rem; color: #8b949e;">${u.profession || 'Sin especificar'}</span>
                </div>
                <button style="background: #238636; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: 600;" onclick="toggleUserStatus('${u.id}', true)">Aprobar</button>
            </div>
        `).join('');
    }

    // Renderizar Activos
    if (activeUsers.length === 0) {
        activeList.innerHTML = '<p style="color: #8b949e; margin-top: 1rem;">No hay otros operadores activos en la red.</p>';
    } else {
        activeList.innerHTML = activeUsers.map(u => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; margin-bottom: 10px;">
                <div>
                    <h4 style="margin: 0; color: #e6edf3; font-size: 1rem;">${u.full_name || 'Sin Nombre'}</h4>
                    <span style="font-size: 0.85rem; color: #8b949e;">${u.profession || 'Sin especificar'}</span>
                </div>
                <button style="background: transparent; color: #f85149; border: 1px solid #f85149; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: 600;" onclick="toggleUserStatus('${u.id}', false)">Revocar</button>
            </div>
        `).join('');
    }
}

// Función global para Aprobar/Revocar accesos
window.toggleUserStatus = async function(userId, status) {
    const { error } = await supabaseClient
        .from('profiles')
        .update({ is_approved: status })
        .eq('id', userId);

    if (error) {
        alert('Error en la operación: ' + error.message);
    } else {
        const actionStr = status ? "aprobado" : "revocado";
        alert(`Acceso ${actionStr} con éxito.`);
        loadAdminData(); // Recargar las listas visuales al instante
    }
}

// 4. Lógica de Cerrar Sesión
document.getElementById('logoutBtn').addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    window.location.href = 'login.html';
});