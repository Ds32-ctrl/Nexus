// src/js/admin.js

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Navegación por pestañas (Tab Switching)
    const tabButtons = document.querySelectorAll('.admin-tab-btn');
    const sections = document.querySelectorAll('.admin-section');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Desactivar todos los botones
            tabButtons.forEach(btn => {
                btn.classList.remove('bg-red-500/10', 'text-red-400', 'border-red-500/20');
                btn.classList.add('text-gray-400', 'border-transparent');
            });

            // Activar el botón clickeado
            button.classList.add('bg-red-500/10', 'text-red-400', 'border-red-500/20');
            button.classList.remove('text-gray-400', 'border-transparent');

            // Ocultar todas las secciones
            sections.forEach(sec => {
                sec.classList.add('hidden');
                sec.classList.remove('is-visible');
            });

            // Mostrar la sección correspondiente
            const targetId = button.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.remove('hidden');
                // Pequeño timeout para permitir que el display:block se aplique antes de animar la opacidad
                setTimeout(() => {
                    targetSection.classList.add('is-visible');
                }, 50);
            }
        });
    });

    // 2. Renderizado de Datos Mock (Gestión de Usuarios)
    const mockUsers = [
        { id: 1, name: 'Daniel Carrillo', email: 'admin@nexus.os', role: 'Super Admin', status: 'Activo' },
        { id: 2, name: 'Usuario Prueba', email: 'test@nexus.os', role: 'Estándar', status: 'Activo' },
        { id: 3, name: 'Invitado_092', email: 'invitado@nexus.os', role: 'Invitado', status: 'Suspendido' }
    ];

    const tbody = document.getElementById('user-table-body');
    
    if (tbody) {
        mockUsers.forEach(user => {
            const statusColor = user.status === 'Activo' ? 'text-green-400 bg-green-500/10 border-green-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20';
            
            const tr = document.createElement('tr');
            tr.className = 'border-b border-white/5 hover:bg-white/5 transition-colors group';
            tr.innerHTML = `
                <td class="py-4 px-4">
                    <p class="font-medium text-white">${user.name}</p>
                    <p class="text-xs text-gray-500">${user.email}</p>
                </td>
                <td class="py-4 px-4 text-gray-300">${user.role}</td>
                <td class="py-4 px-4">
                    <span class="px-2.5 py-1 rounded-md border text-xs font-medium ${statusColor}">
                        ${user.status}
                    </span>
                </td>
                <td class="py-4 px-4 text-right">
                    <button class="text-gray-500 hover:text-white transition-colors mr-2" title="Editar" onclick="editUser(${user.id})">
                        <i class="ph ph-pencil-simple text-lg"></i>
                    </button>
                    <button class="text-gray-500 hover:text-red-400 transition-colors" title="Eliminar" onclick="deleteUser(${user.id})">
                        <i class="ph ph-trash text-lg"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

});

// Funciones globales para las acciones de la tabla
window.editUser = function(id) {
    alert(`Abriendo configuración para el usuario ID: ${id}`);
};

window.deleteUser = function(id) {
    if(confirm(`¿Estás seguro de que deseas suspender/eliminar al usuario ID: ${id}?`)) {
        alert('Usuario eliminado del sistema local.');
    }
};