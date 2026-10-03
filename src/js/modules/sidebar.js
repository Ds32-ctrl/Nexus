// src/js/modules/sidebar.js

document.addEventListener('DOMContentLoaded', () => {
    const sidebarContainer = document.getElementById('sidebar-container');
    if (!sidebarContainer) return;

    // Detectar en qué página estamos
    const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';

    // Configuración de todos los módulos con sus estilos específicos
    const mainModules = [
        { url: 'dashboard.html', icon: 'ph-squares-four', label: 'Command Center', theme: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
        { url: 'aph.html', icon: 'ph-brain', label: 'Potencial Humano (APH)', theme: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
        { url: 'zen-habits.html', icon: 'ph-chart-polar', label: 'ZenHabit Analytics', theme: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
        { url: 'deep-work.html', icon: 'ph-timer', label: 'Deep Work', theme: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
        { url: 'resolutions.html', icon: 'ph-check-square-offset', label: 'Micro Resoluciones', theme: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
        { url: 'finance.html', icon: 'ph-wallet', label: 'Control Financiero', theme: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
        { url: 'journal.html', icon: 'ph-book-open-text', label: 'Diario & Reflexión', theme: 'bg-pink-500/10 text-pink-400 border-pink-500/20' }
    ];

    const growthModules = [
        { url: 'library.html', icon: 'ph-books', label: 'Biblioteca', theme: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
        { url: 'networking.html', icon: 'ph-users-three', label: 'Networking', theme: 'bg-blue-500/10 text-blue-400 border-blue-500/20' }
    ];

    // Función para crear cada enlace dinámicamente
    const createLink = (item) => {
        const isActive = currentPage === item.url || (currentPage === '' && item.url === 'dashboard.html');
        
        if (isActive) {
            return `
                <a href="${item.url}" class="flex items-center gap-3 px-3 py-2.5 rounded-xl ${item.theme} border group transition-all">
                    <i class="ph-fill ${item.icon} text-xl group-hover:scale-110 transition-transform"></i>
                    <span class="hidden lg:block font-medium">${item.label}</span>
                </a>
            `;
        } else {
            return `
                <a href="${item.url}" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 border border-transparent transition-all group">
                    <i class="ph ${item.icon} text-xl group-hover:scale-110 transition-transform"></i>
                    <span class="hidden lg:block font-medium">${item.label}</span>
                </a>
            `;
        }
    };

    // Plantilla HTML del Sidebar
    const sidebarHTML = `
        <aside class="w-20 lg:w-64 glass border-r border-white/5 flex flex-col justify-between h-screen sticky top-0 z-40 transition-all duration-300">
            <div class="flex flex-col h-full overflow-hidden">
                <!-- Logo -->
                <div class="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-white/5 shrink-0">
                    <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
                        <i class="ph-bold ph-infinity text-white text-xl"></i>
                    </div>
                    <span class="hidden lg:block font-bold text-xl tracking-tight text-white ml-3">Nexus<span class="text-indigo-400">OS</span></span>
                </div>
                
                <!-- Navegación con Scroll Oculto -->
                <nav class="mt-6 px-2 lg:px-4 space-y-1 flex-1 overflow-y-auto custom-scrollbar">
                    <p class="hidden lg:block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">Módulos Activos</p>
                    ${mainModules.map(createLink).join('')}
                    
                    <div class="h-px w-full bg-white/5 my-4"></div>
                    
                    <p class="hidden lg:block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">Crecimiento</p>
                    ${growthModules.map(createLink).join('')}
                </nav>
            </div>
            
            <!-- Footer del Sidebar -->
            <div class="p-4 border-t border-white/5 space-y-2 shrink-0 bg-[#050505]/50 backdrop-blur-md">
                <button id="global-btn-settings" class="w-full flex items-center justify-center lg:justify-start gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                    <i class="ph ph-gear text-xl"></i>
                    <span class="hidden lg:block font-medium">Configuración</span>
                </button>
                <a href="login.html" onclick="if(window.logout) window.logout();" class="w-full flex items-center justify-center lg:justify-start gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <i class="ph ph-sign-out text-xl"></i>
                    <span class="hidden lg:block font-medium">Desconectar</span>
                </a>
            </div>
        </aside>
    `;

    // Inyectar el HTML en el contenedor
    sidebarContainer.innerHTML = sidebarHTML;
});