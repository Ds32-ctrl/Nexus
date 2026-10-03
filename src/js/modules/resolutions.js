// src/js/modules/resolutions.js

// Supabase Init
const SUPABASE_URL = 'https://sirytqfdlbgkcuvkquiq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpcnl0cWZkbGJna2N1dmtxdWlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5NjQwOTMsImV4cCI6MjEwNjU0MDA5M30.rv2TLpBL8_qMq_qlENS031H0neDbDJ_iQr48ohcUp-g';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', async () => {

    let userId = 'default-user-id';
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) userId = session.user.id;
    } catch (e) {
        console.warn("Modo local activado.");
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
                warning: '<i class="ph-fill ph-warning-circle text-orange-400 text-xl"></i>'
            };
            const borders = {
                success: 'border-emerald-500/20',
                info: 'border-blue-500/20',
                warning: 'border-orange-500/20'
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
    // ESTADO Y DOM ELEMENTS
    // ==========================================
    const tasksContainer = document.getElementById('tasks-container');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    
    // Modal elements
    const taskModal = document.getElementById('task-modal');
    const taskModalContent = document.getElementById('task-modal-content');
    const btnOpenModal = document.getElementById('btn-open-task-modal');
    const btnCancelModal = document.getElementById('btn-cancel-task');
    const btnSaveModal = document.getElementById('btn-save-task');
    
    let currentTasks = [];

    // ==========================================
    // LÓGICA PRINCIPAL DE RESOLUCIONES
    // ==========================================
    async function loadTasks() {
        try {
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
                
            if (error) throw error;
            currentTasks = data || [];
        } catch (error) {
            // Mock data si falla DB
            currentTasks = [
                { id: 1, title: 'Revisar finanzas en Excel', category: 'folder', completed: true },
                { id: 2, title: 'Leer "Padre Rico, Padre Pobre" (20 págs)', category: 'book-open', completed: false },
                { id: 3, title: 'Avanzar módulo de Python / FastAPI', category: 'code', completed: false },
                { id: 4, title: 'Rutina de pesas (Tren superior)', category: 'barbell', completed: true }
            ];
        }
        renderTasks();
        updateVisuals();
    }

    function renderTasks() {
        if (!tasksContainer) return;
        tasksContainer.innerHTML = '';

        if (currentTasks.length === 0) {
            tasksContainer.innerHTML = `<div class="flex flex-col items-center justify-center py-10 opacity-50"><i class="ph ph-check-square-offset text-4xl mb-3 text-purple-400"></i><p class="text-white text-sm">No tienes resoluciones activas.</p></div>`;
            return;
        }

        const categoryStyles = {
            'code': { icon: 'ph-code', color: 'text-orange-400', bg: 'bg-orange-500/10' },
            'book-open': { icon: 'ph-book-open', color: 'text-blue-400', bg: 'bg-blue-500/10' },
            'folder': { icon: 'ph-folder', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            'barbell': { icon: 'ph-barbell', color: 'text-pink-400', bg: 'bg-pink-500/10' }
        };

        currentTasks.forEach(task => {
            const style = categoryStyles[task.category] || { icon: 'ph-check-circle', color: 'text-gray-400', bg: 'bg-gray-500/10' };
            const isChecked = task.completed ? 'checked' : '';
            const titleClass = task.completed ? 'text-gray-500 line-through' : 'text-white group-hover:text-purple-300';
            const cardBg = task.completed ? 'bg-white/5 opacity-70 border-white/5' : 'bg-white/5 border-white/10 hover:border-purple-500/30 hover:bg-white/10';

            const taskHTML = `
                <label class="cursor-pointer group flex items-center justify-between p-4 rounded-2xl ${cardBg} transition-all relative overflow-hidden" data-task-id="${task.id}">
                    <div class="flex items-center gap-4">
                        <div class="relative flex items-center justify-center">
                            <input type="checkbox" ${isChecked} class="task-checkbox peer appearance-none w-6 h-6 rounded-lg border border-gray-500 bg-black/30 checked:bg-purple-500 checked:border-purple-500 transition-colors cursor-pointer">
                            <i class="ph-bold ph-check absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none text-sm transition-opacity"></i>
                        </div>
                        
                        <div>
                            <p class="task-title text-base font-medium transition-colors ${titleClass}">${task.title}</p>
                            <span class="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md ${style.bg} ${style.color} text-[10px] font-semibold uppercase tracking-wider">
                                <i class="ph-fill ${style.icon}"></i> ${task.category}
                            </span>
                        </div>
                    </div>
                    
                    <button class="delete-task-btn text-gray-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100" title="Eliminar resolución">
                        <i class="ph-fill ph-trash text-lg"></i>
                    </button>
                </label>
            `;
            tasksContainer.insertAdjacentHTML('beforeend', taskHTML);
        });

        attachTaskEvents();
    }

    function attachTaskEvents() {
        tasksContainer.querySelectorAll('.task-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', async (e) => {
                const label = e.target.closest('label');
                const taskId = label.dataset.taskId;
                const isCompleted = e.target.checked;
                
                const taskIndex = currentTasks.findIndex(t => t.id == taskId);
                if (taskIndex > -1) currentTasks[taskIndex].completed = isCompleted;
                
                renderTasks();
                updateVisuals();
                
                if (isCompleted) {
                    UIController.showToast('¡Resolución completada! Sigue así.', 'success');
                }
                
                try { await supabase.from('tasks').update({ completed: isCompleted }).eq('id', taskId); } catch (err) {}
            });
        });

        tasksContainer.querySelectorAll('.delete-task-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault(); e.stopPropagation();
                const taskId = e.target.closest('label').dataset.taskId;
                
                currentTasks = currentTasks.filter(t => t.id != taskId);
                renderTasks();
                updateVisuals();
                UIController.showToast('Resolución eliminada del plan.', 'info');
                
                try { await supabase.from('tasks').delete().eq('id', taskId); } catch (err) {}
            });
        });
    }

    // ==========================================
    // ACTUALIZACIÓN DE ESTADÍSTICAS Y VISUALES
    // ==========================================
    function updateVisuals() {
        // 1. Progress Bar
        if (currentTasks.length === 0) {
            if (progressBar) progressBar.style.width = '0%';
            if (progressText) progressText.textContent = '0% Completado';
        } else {
            const completedCount = currentTasks.filter(t => t.completed).length;
            const percentage = Math.round((completedCount / currentTasks.length) * 100);
            
            if (progressBar) progressBar.style.width = `${percentage}%`;
            if (progressText) progressText.textContent = `${percentage}% Completado`;
            
            // Animación de texto si llega al 100%
            if (percentage === 100) {
                progressText.classList.replace('text-purple-400', 'text-emerald-400');
                progressText.classList.replace('bg-purple-500/10', 'bg-emerald-500/10');
                progressText.classList.replace('border-purple-500/20', 'border-emerald-500/20');
            } else {
                progressText.classList.replace('text-emerald-400', 'text-purple-400');
                progressText.classList.replace('bg-emerald-500/10', 'bg-purple-500/10');
                progressText.classList.replace('border-emerald-500/20', 'border-purple-500/20');
            }
        }

        // 2. Widget de Distribución
        const stats = { code: 0, 'book-open': 0, health: 0, folder: 0 };
        currentTasks.forEach(t => {
            if (t.category === 'code') stats.code++;
            else if (t.category === 'book-open') stats['book-open']++;
            else if (t.category === 'barbell') stats.health++;
            else stats.folder++;
        });

        if (document.getElementById('stat-code')) document.getElementById('stat-code').textContent = stats.code;
        if (document.getElementById('stat-book')) document.getElementById('stat-book').textContent = stats['book-open'];
        if (document.getElementById('stat-health')) document.getElementById('stat-health').textContent = stats.health;
        if (document.getElementById('stat-folder')) document.getElementById('stat-folder').textContent = stats.folder;
    }

    // ==========================================
    // CONTROL DEL MODAL
    // ==========================================
    function openModal() {
        taskModal.classList.remove('hidden');
        setTimeout(() => {
            taskModal.classList.remove('opacity-0');
            taskModalContent.classList.remove('scale-95');
            document.getElementById('new-task-title').focus();
        }, 10);
    }

    function closeModal() {
        taskModal.classList.add('opacity-0');
        taskModalContent.classList.add('scale-95');
        setTimeout(() => {
            taskModal.classList.add('hidden');
            document.getElementById('new-task-title').value = '';
        }, 300);
    }

    btnOpenModal?.addEventListener('click', openModal);
    btnCancelModal?.addEventListener('click', closeModal);

    btnSaveModal?.addEventListener('click', async () => {
        const titleInput = document.getElementById('new-task-title');
        const title = titleInput.value.trim();
        const category = document.getElementById('new-task-category').value;
        
        if (!title) {
            UIController.showToast('Por favor, describe la acción atómica.', 'warning');
            return;
        }

        btnSaveModal.innerHTML = '<i class="ph-bold ph-spinner animate-spin"></i> Guardando...';
        btnSaveModal.disabled = true;

        const newTask = { id: Date.now(), user_id: userId, title, category, completed: false };
        
        try {
            const { data, error } = await supabase.from('tasks').insert([{ user_id: userId, title, category, completed: false }]).select();
            if (!error && data && data[0]) newTask.id = data[0].id;
        } catch (err) {}

        currentTasks.unshift(newTask);
        renderTasks();
        updateVisuals();
        closeModal();
        UIController.showToast('Micro resolución agregada a tu plan.', 'success');

        btnSaveModal.innerHTML = 'Guardar Tarea';
        btnSaveModal.disabled = false;
    });

    // Cargar datos al iniciar
    loadTasks();
});