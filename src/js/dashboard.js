// 1. Configuración de Supabase
const supabaseUrl = 'https://sirytqfdlbgkcuvkquiq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpcnl0cWZkbGJna2N1dmtxdWlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5NjQwOTMsImV4cCI6MjEwNjU0MDA5M30.rv2TLpBL8_qMq_qlENS031H0neDbDJ_iQr48ohcUp-g';

const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// 2. Inicialización del Dashboard
document.addEventListener('DOMContentLoaded', async () => {
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
        document.getElementById('userProfession').innerText = "Error cargando perfil. Contacte al administrador.";
        return;
    }

    // Llenar interfaz principal
    document.getElementById('userName').innerText = profile.full_name.split(' ')[0]; // Extrae solo el primer nombre
    document.getElementById('userProfession').innerText = profile.profession || 'Operador Nexus';

    // 3. Lógica de Administrador
    if (profile.role === 'admin') {
        document.getElementById('adminPanel').style.display = 'block';
        document.getElementById('roleBadge').style.display = 'inline-block';
        loadAdminData();
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
        pendingList.innerHTML = '<p class="text-muted">Error al conectar con la base de datos.</p>';
        return;
    }

    // Filtrar usuarios
    const pendingUsers = allUsers.filter(u => u.is_approved === false);
    const activeUsers = allUsers.filter(u => u.is_approved === true && u.role !== 'admin'); // No mostrarte a ti mismo en la lista

    // Renderizar Pendientes
    if (pendingUsers.length === 0) {
        pendingList.innerHTML = '<p class="text-muted">No hay solicitudes pendientes.</p>';
    } else {
        pendingList.innerHTML = pendingUsers.map(u => `
            <div class="user-item">
                <div class="user-info">
                    <h4>${u.full_name}</h4>
                    <span>${u.profession}</span>
                </div>
                <button class="admin-btn btn-approve" onclick="toggleUserStatus('${u.id}', true)">Aprobar</button>
            </div>
        `).join('');
    }

    // Renderizar Activos
    if (activeUsers.length === 0) {
        activeList.innerHTML = '<p class="text-muted">No hay operadores activos en la red.</p>';
    } else {
        activeList.innerHTML = activeUsers.map(u => `
            <div class="user-item">
                <div class="user-info">
                    <h4>${u.full_name}</h4>
                    <span>${u.profession}</span>
                </div>
                <button class="admin-btn btn-revoke" onclick="toggleUserStatus('${u.id}', false)">Revocar</button>
            </div>
        `).join('');
    }
}

// Función global para Aprobar/Revocar accesos desde el HTML
window.toggleUserStatus = async function(userId, status) {
    // Actualizamos el estado en la base de datos
    const { error } = await supabaseClient
        .from('profiles')
        .update({ is_approved: status })
        .eq('id', userId);

    if (error) {
        alert('Error en la operación: ' + error.message);
    } else {
        const actionStr = status ? "aprobado" : "revocado";
        alert(`Acceso ${actionStr} con éxito.`);
        loadAdminData(); // Recargar las listas visuales
    }
}

// 4. Lógica de Cerrar Sesión
document.getElementById('logoutBtn').addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    window.location.href = 'login.html';
});