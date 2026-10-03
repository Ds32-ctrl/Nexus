const supabaseUrl = 'https://sirytqfdlbgkcuvkquiq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpcnl0cWZkbGJna2N1dmtxdWlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5NjQwOTMsImV4cCI6MjEwNjU0MDA5M30.rv2TLpBL8_qMq_qlENS031H0neDbDJ_iQr48ohcUp-g';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        if (authError || !user) return window.location.href = 'login.html';

        const { data: profile } = await supabaseClient.from('profiles').select('role').eq('id', user.id).single();
        
        // Aislar ruta: Si no es admin, lo expulsa al dashboard normal
        if (!profile || profile.role !== 'admin') {
            return window.location.href = 'dashboard.html';
        }

        loadAdminData();
    } catch (err) {
        console.error("Fallo de seguridad:", err);
    }
});

async function loadAdminData() {
    const { data: allUsers, error } = await supabaseClient.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) return console.error(error);

    const pendingUsers = allUsers.filter(u => u.is_approved === false);
    const activeUsers = allUsers.filter(u => u.is_approved === true && u.role !== 'admin');

    // Actualizar Telemetría
    document.getElementById('metricTotal').innerText = activeUsers.length;
    document.getElementById('metricPending').innerText = pendingUsers.length;

    // Renderizar Pendientes
    const pendingList = document.getElementById('pendingList');
    pendingList.innerHTML = pendingUsers.length === 0 ? '<p class="text-muted">Red limpia. No hay solicitudes pendientes.</p>' : 
        pendingUsers.map(u => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; margin-bottom: 12px;">
                <div>
                    <h4 style="margin: 0 0 4px 0; color: #e6edf3;">${u.full_name}</h4>
                    <span style="font-size: 0.85rem; color: #8b949e;">${u.profession}</span>
                </div>
                <button style="background: #238636; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600;" onclick="updateUser('${u.id}', {is_approved: true})">Aprobar Acceso</button>
            </div>
        `).join('');

    // Renderizar Activos con opciones avanzadas
    const activeList = document.getElementById('activeList');
    activeList.innerHTML = activeUsers.length === 0 ? '<p class="text-muted">No hay otros operadores en la red.</p>' : 
        activeUsers.map(u => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; margin-bottom: 12px;">
                <div>
                    <h4 style="margin: 0 0 4px 0; color: #e6edf3;">${u.full_name}</h4>
                    <span style="font-size: 0.85rem; color: #8b949e;">${u.profession}</span>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button style="background: transparent; color: #58a6ff; border: 1px solid #58a6ff; padding: 6px 12px; border-radius: 6px; cursor: pointer;" onclick="updateUser('${u.id}', {role: 'admin'})">Hacer Admin</button>
                    <button style="background: transparent; color: #f85149; border: 1px solid #f85149; padding: 6px 12px; border-radius: 6px; cursor: pointer;" onclick="updateUser('${u.id}', {is_approved: false})">Revocar</button>
                </div>
            </div>
        `).join('');
}

window.updateUser = async function(userId, updates) {
    const { error } = await supabaseClient.from('profiles').update(updates).eq('id', userId);
    if (error) return alert('Error en la operación: ' + error.message);
    loadAdminData();
}

document.getElementById('logoutBtn').addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    window.location.href = 'login.html';
});