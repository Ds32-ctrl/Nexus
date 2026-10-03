// src/js/modules/library.js

const SUPABASE_URL = 'https://sirytqfdlbgkcuvkquiq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpcnl0cWZkbGJna2N1dmtxdWlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5NjQwOTMsImV4cCI6MjEwNjU0MDA5M30.rv2TLpBL8_qMq_qlENS031H0neDbDJ_iQr48ohcUp-g';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', async () => {

    let userId = 'default-user-id';
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) userId = session.user.id;
    } catch (e) {
        console.warn("Modo local activado para Biblioteca.");
    }

    // ==========================================
    // UI CONTROLLER (Toasts Locales)
    // ==========================================
    const UIController = {
        showToast(message, type = 'success') {
            const container = document.getElementById('toast-container');
            if (!container) return;

            const icons = {
                success: '<i class="ph-fill ph-check-circle text-emerald-400 text-xl"></i>',
                info: '<i class="ph-fill ph-info text-blue-400 text-xl"></i>',
                warning: '<i class="ph-fill ph-warning-circle text-amber-400 text-xl"></i>'
            };
            const borders = {
                success: 'border-emerald-500/20',
                info: 'border-blue-500/20',
                warning: 'border-amber-500/20'
            };

            const toast = document.createElement('div');
            toast.className = `flex items-center gap-3 px-4 py-3 rounded-2xl glass border ${borders[type]} transform translate-y-10 opacity-0 transition-all duration-300 shadow-lg pointer-events-auto`;
            toast.innerHTML = `${icons[type]} <p class="text-sm font-medium text-white">${message}</p>`;

            container.appendChild(toast);
            
            requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.remove('translate-y-10', 'opacity-0')));
            setTimeout(() => {
                toast.classList.add('translate-y-10', 'opacity-0');
                setTimeout(() => toast.remove(), 300);
            }, 3500);
        }
    };

    // ==========================================
    // ESTADO Y MOCK DATA DE LA BIBLIOTECA
    // ==========================================
    let library = [
        { id: 1, title: 'Clean Architecture', author: 'Robert C. Martin', type: 'book', current: 145, total: 432, completed: false },
        { id: 2, title: 'Python Backend Mastery', author: 'Platzi', type: 'course', current: 12, total: 30, completed: false },
        { id: 3, title: 'Hábitos Atómicos', author: 'James Clear', type: 'book', current: 320, total: 320, completed: true },
        { id: 4, title: 'Padre Rico Padre Pobre', author: 'Robert Kiyosaki', type: 'book', current: 280, total: 280, completed: true }
    ];

    const libContainer = document.getElementById('library-container');
    const compContainer = document.getElementById('completed-container');
    const statCompleted = document.getElementById('stat-completed');
    const statPages = document.getElementById('stat-pages');

    const typeIcons = {
        book: { icon: 'ph-book-open', label: 'Págs' },
        course: { icon: 'ph-graduation-cap', label: 'Clases' },
        article: { icon: 'ph-file-text', label: 'Págs' }
    };

    // ==========================================
    // RENDERIZADO
    // ==========================================
    function renderLibrary() {
        if (!libContainer || !compContainer) return;
        
        libContainer.innerHTML = '';
        compContainer.innerHTML = '';

        let completedCount = 0;
        let totalPagesRead = 0;

        const inProgress = library.filter(r => !r.completed);
        const completed = library.filter(r => r.completed);

        // Stats Calculation
        library.forEach(r => {
            if (r.type === 'book') totalPagesRead += r.current;
            if (r.completed) completedCount++;
        });

        statCompleted.textContent = completedCount;
        statPages.textContent = totalPagesRead.toLocaleString();

        // Render In Progress
        if (inProgress.length === 0) {
            libContainer.innerHTML = `<p class="text-gray-500 text-sm text-center py-8 col-span-full">No tienes recursos en progreso.</p>`;
        } else {
            inProgress.forEach(res => {
                const config = typeIcons[res.type] || typeIcons.book;
                const percentage = Math.round((res.current / res.total) * 100) || 0;

                const cardHtml = `
                    <div class="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-amber-500/30 transition-colors relative group">
                        <div class="flex gap-4 mb-4">
                            <div class="w-12 h-16 rounded-md bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                                <i class="ph-fill ${config.icon} text-2xl text-amber-400"></i>
                            </div>
                            <div class="flex-1 overflow-hidden">
                                <h3 class="text-white font-semibold text-sm truncate" title="${res.title}">${res.title}</h3>
                                <p class="text-gray-400 text-xs truncate">${res.author}</p>
                            </div>
                            <button class="btn-update-progress h-8 w-8 rounded-lg bg-white/5 hover:bg-amber-500 hover:text-white text-gray-400 transition-colors flex items-center justify-center" data-id="${res.id}" title="Actualizar">
                                <i class="ph-bold ph-pencil-simple"></i>
                            </button>
                        </div>
                        
                        <div>
                            <div class="flex justify-between items-end mb-1.5">
                                <span class="text-xs font-medium text-white">${percentage}%</span>
                                <span class="text-xs text-gray-500">${res.current} / ${res.total} ${config.label}</span>
                            </div>
                            <div class="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                                <div class="h-full bg-gradient-to-r from-amber-500 to-orange-500 w-[${percentage}%]" style="width: ${percentage}%"></div>
                            </div>
                        </div>
                    </div>
                `;
                libContainer.insertAdjacentHTML('beforeend', cardHtml);
            });
        }

        // Render Completed Mini-Cards
        if (completed.length === 0) {
            compContainer.innerHTML = `<p class="text-gray-500 text-sm text-center py-4">Aún no hay logros.</p>`;
        } else {
            completed.sort((a,b) => b.id - a.id).forEach(res => {
                const config = typeIcons[res.type] || typeIcons.book;
                const compHtml = `
                    <div class="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 group relative overflow-hidden">
                        <div class="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div class="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20 relative z-10">
                            <i class="ph-fill ph-check-circle"></i>
                        </div>
                        <div class="overflow-hidden relative z-10 flex-1">
                            <p class="text-sm font-semibold text-white truncate">${res.title}</p>
                            <p class="text-xs text-gray-500">${res.author}</p>
                        </div>
                        <button class="delete-resource opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all p-1 relative z-10" data-id="${res.id}">
                            <i class="ph-fill ph-trash text-base"></i>
                        </button>
                    </div>
                `;
                compContainer.insertAdjacentHTML('beforeend', compHtml);
            });
        }

        attachCardEvents();
    }

    // ==========================================
    // EVENTOS Y MODALES
    // ==========================================
    const resModal = document.getElementById('resource-modal');
    const resContent = document.getElementById('resource-modal-content');
    const progModal = document.getElementById('progress-modal');
    const progContent = document.getElementById('progress-modal-content');
    
    let currentUpdateId = null;

    function attachCardEvents() {
        // Abrir modal de progreso
        document.querySelectorAll('.btn-update-progress').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                const resource = library.find(r => r.id === id);
                if (!resource) return;

                currentUpdateId = id;
                document.getElementById('progress-book-title').textContent = resource.title;
                document.getElementById('progress-current').value = resource.current;
                document.getElementById('progress-max').textContent = resource.total;

                progModal.classList.remove('hidden');
                setTimeout(() => {
                    progModal.classList.remove('opacity-0');
                    progContent.classList.remove('scale-95');
                    document.getElementById('progress-current').focus();
                }, 10);
            });
        });

        // Eliminar completados
        document.querySelectorAll('.delete-resource').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                library = library.filter(r => r.id !== id);
                renderLibrary();
                UIController.showToast('Recurso eliminado de tu historial', 'info');
            });
        });
    }

    // Modal Crear Recurso
    document.getElementById('btn-add-resource')?.addEventListener('click', () => {
        resModal.classList.remove('hidden');
        setTimeout(() => {
            resModal.classList.remove('opacity-0');
            resContent.classList.remove('scale-95');
            document.getElementById('res-title').focus();
        }, 10);
    });

    document.getElementById('btn-cancel-resource')?.addEventListener('click', () => {
        resModal.classList.add('opacity-0');
        resContent.classList.add('scale-95');
        setTimeout(() => { resModal.classList.add('hidden'); document.getElementById('form-resource').reset(); }, 300);
    });

    document.getElementById('form-resource')?.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newRes = {
            id: Date.now(),
            title: document.getElementById('res-title').value.trim(),
            author: document.getElementById('res-author').value.trim(),
            type: document.getElementById('res-type').value,
            current: 0,
            total: parseInt(document.getElementById('res-total').value),
            completed: false
        };

        library.push(newRes);
        renderLibrary();
        document.getElementById('btn-cancel-resource').click();
        UIController.showToast('Recurso añadido a tu biblioteca', 'success');
    });

    // Modal Actualizar Progreso
    document.getElementById('btn-cancel-progress')?.addEventListener('click', () => {
        progModal.classList.add('opacity-0');
        progContent.classList.add('scale-95');
        setTimeout(() => progModal.classList.add('hidden'), 300);
        currentUpdateId = null;
    });

    document.getElementById('btn-save-progress')?.addEventListener('click', () => {
        if (!currentUpdateId) return;
        
        const newProgress = parseInt(document.getElementById('progress-current').value);
        const resourceIndex = library.findIndex(r => r.id === currentUpdateId);
        
        if (resourceIndex > -1 && newProgress >= 0) {
            library[resourceIndex].current = Math.min(newProgress, library[resourceIndex].total);
            
            // Verificar si lo completó
            if (library[resourceIndex].current === library[resourceIndex].total) {
                library[resourceIndex].completed = true;
                UIController.showToast(`¡Felicidades! Has completado ${library[resourceIndex].title}`, 'success');
            } else {
                UIController.showToast('Progreso actualizado', 'info');
            }
            
            renderLibrary();
        }
        
        document.getElementById('btn-cancel-progress').click();
    });

    // Inicializar Render
    renderLibrary();
});