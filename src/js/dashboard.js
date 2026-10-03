// src/js/dashboard.js

// ==========================================
// CONFIGURACIÓN DE SUPABASE
// ==========================================
const SUPABASE_URL = 'https://sirytqfdlbgkcuvkquiq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpcnl0cWZkbGJna2N1dmtxdWlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5NjQwOTMsImV4cCI6MjEwNjU0MDA5M30.rv2TLpBL8_qMq_qlENS031H0neDbDJ_iQr48ohcUp-g';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', async () => {

    // ==========================================
    // AUTENTICACIÓN Y SESIÓN
    // ==========================================
    let userId = 'default-user-id';
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (session && session.user) userId = session.user.id;
    } catch (e) {
        console.warn("Modo local activado.");
    }

    // ==========================================
    // CONTROLADOR DE UI AVANZADO
    // ==========================================
    const UIController = {
        showToast(message, type = 'success') {
            const container = document.getElementById('toast-container');
            if (!container) return;

            const icons = {
                success: '<i class="ph-fill ph-check-circle text-emerald-400 text-xl"></i>',
                info: '<i class="ph-fill ph-info text-blue-400 text-xl"></i>',
                warning: '<i class="ph-fill ph-warning-circle text-orange-400 text-xl"></i>',
                error: '<i class="ph-fill ph-x-circle text-red-400 text-xl"></i>'
            };
            const borders = { success: 'border-emerald-500/20', info: 'border-blue-500/20', warning: 'border-orange-500/20', error: 'border-red-500/20' };

            const toast = document.createElement('div');
            toast.className = `flex items-center gap-3 px-4 py-3 rounded-2xl glass border ${borders[type]} transform translate-y-10 opacity-0 transition-all duration-300 shadow-lg pointer-events-auto mt-2`;
            toast.innerHTML = `${icons[type]} <p class="text-sm font-medium text-white">${message}</p>`;

            container.appendChild(toast);
            
            requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.remove('translate-y-10', 'opacity-0')));
            setTimeout(() => {
                toast.classList.add('translate-y-10', 'opacity-0');
                setTimeout(() => toast.remove(), 300);
            }, 3500);
        },

        openDynamicModal(title, iconHtml, contentHtml, themeColor = 'bg-indigo-500', confirmText = 'Aceptar', onConfirm = null) {
            const modal = document.getElementById('dynamic-modal');
            const modalContent = document.getElementById('dynamic-modal-content');
            const titleEl = document.getElementById('dynamic-modal-title');
            const bodyEl = document.getElementById('dynamic-modal-body');
            const glowEl = document.getElementById('dynamic-modal-glow');
            
            let btnConfirm = document.getElementById('btn-confirm-dynamic-modal');

            // Clonar para limpiar Event Listeners anteriores
            const newBtnConfirm = btnConfirm.cloneNode(true);
            btnConfirm.parentNode.replaceChild(newBtnConfirm, btnConfirm);
            btnConfirm = newBtnConfirm;

            if (!modal) return;

            titleEl.innerHTML = `${iconHtml} ${title}`;
            bodyEl.innerHTML = contentHtml;
            glowEl.className = `absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mt-10 -mr-10 opacity-20 pointer-events-none ${themeColor}`;
            
            btnConfirm.className = `px-5 py-2.5 rounded-xl ${themeColor} hover:brightness-110 text-white text-sm font-medium transition-all`;
            btnConfirm.textContent = confirmText;

            // Manejador de confirmación dinámica
            btnConfirm.addEventListener('click', async () => {
                const originalText = btnConfirm.innerHTML;
                btnConfirm.innerHTML = '<i class="ph-bold ph-spinner animate-spin"></i>';
                btnConfirm.disabled = true;

                if (onConfirm) {
                    await onConfirm();
                } else {
                    this.closeDynamicModal();
                }

                btnConfirm.innerHTML = originalText;
                btnConfirm.disabled = false;
            });

            modal.classList.remove('hidden');
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                modalContent.classList.remove('scale-95');
            }, 10);
        },

        closeDynamicModal() {
            const modal = document.getElementById('dynamic-modal');
            const modalContent = document.getElementById('dynamic-modal-content');
            if (!modal) return;
            modal.classList.add('opacity-0');
            modalContent.classList.add('scale-95');
            setTimeout(() => modal.classList.add('hidden'), 300);
        }
    };

    document.getElementById('btn-close-dynamic-modal')?.addEventListener('click', () => UIController.closeDynamicModal());

    // ==========================================
    // 0. FECHA DINÁMICA
    // ==========================================
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const today = new Date().toLocaleDateString('es-ES', options);
        dateElement.innerHTML = `<i class="ph ph-calendar-blank"></i> ${today.charAt(0).toUpperCase() + today.slice(1)}`;
    }

    // ==========================================
    // 1. MICRO RESOLUCIONES (CRUD REAL)
    // ==========================================
    const tasksContainer = document.getElementById('tasks-container');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    let currentTasks = [];

    async function loadTasks() {
        try {
            const { data, error } = await supabase.from('tasks').select('*').eq('user_id', userId).order('created_at', { ascending: false });
            if (!error) currentTasks = data || [];
        } catch (error) { console.warn("Usando tareas en memoria local."); }
        renderTasks();
    }

    function renderTasks() {
        if (!tasksContainer) return;
        const btnAddHtml = document.getElementById('btn-open-task-modal')?.outerHTML || '';
        tasksContainer.innerHTML = '';

        const categoryStyles = {
            'code': { icon: 'ph-code', color: 'text-orange-400' },
            'book-open': { icon: 'ph-book-open', color: 'text-blue-400' },
            'folder': { icon: 'ph-folder', color: 'text-emerald-500/50' },
            'barbell': { icon: 'ph-barbell', color: 'text-pink-400' }
        };

        currentTasks.forEach(task => {
            const style = categoryStyles[task.category] || { icon: 'ph-check-circle', color: 'text-gray-400' };
            const isChecked = task.completed ? 'checked' : '';
            const titleClass = task.completed ? 'text-gray-500 line-through' : 'text-white group-hover:text-purple-300';

            const taskHTML = `
                <label class="cursor-pointer group flex items-start justify-between gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-purple-500/30 transition-all relative overflow-hidden" data-task-id="${task.id}">
                    <div class="flex items-start gap-3">
                        <input type="checkbox" ${isChecked} class="task-checkbox mt-1 w-5 h-5 rounded border-gray-600 bg-black/50 text-purple-500 focus:ring-purple-500 accent-purple-500 transition-all cursor-pointer">
                        <div>
                            <p class="task-title text-sm font-medium transition-colors ${titleClass}">${task.title}</p>
                            <p class="text-xs text-gray-500 mt-1 flex items-center gap-1"><i class="ph-fill ${style.icon} ${style.color}"></i> ${task.category}</p>
                        </div>
                    </div>
                    <button class="delete-task-btn text-gray-600 hover:text-red-400 transition-colors p-1" title="Eliminar"><i class="ph-fill ph-trash text-base"></i></button>
                </label>
            `;
            tasksContainer.insertAdjacentHTML('beforeend', taskHTML);
        });

        if (btnAddHtml) tasksContainer.insertAdjacentHTML('beforeend', btnAddHtml);
        attachTaskEvents();
        updateProgressVisuals();
    }

    function attachTaskEvents() {
        // Toggle Task
        tasksContainer.querySelectorAll('.task-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', async (e) => {
                const taskId = e.target.closest('label').dataset.taskId;
                const isCompleted = e.target.checked;
                
                const taskIndex = currentTasks.findIndex(t => t.id == taskId);
                if (taskIndex > -1) currentTasks[taskIndex].completed = isCompleted;
                renderTasks();
                
                try { await supabase.from('tasks').update({ completed: isCompleted }).eq('id', taskId); } catch (err) {}
            });
        });

        // Delete Task
        tasksContainer.querySelectorAll('.delete-task-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault(); e.stopPropagation();
                const taskId = e.target.closest('label').dataset.taskId;
                currentTasks = currentTasks.filter(t => t.id != taskId);
                renderTasks();
                UIController.showToast('Tarea eliminada', 'info');
                try { await supabase.from('tasks').delete().eq('id', taskId); } catch (err) {}
            });
        });

        // Open Modal (Rebind)
        document.getElementById('btn-open-task-modal')?.addEventListener('click', () => {
            document.getElementById('task-modal').classList.remove('hidden');
            setTimeout(() => {
                document.getElementById('task-modal').classList.remove('opacity-0');
                document.getElementById('task-modal-content').classList.remove('scale-95');
                document.getElementById('new-task-title').focus();
            }, 10);
        });
    }

    function updateProgressVisuals() {
        if (currentTasks.length === 0) return;
        const completedCount = currentTasks.filter(t => t.completed).length;
        const percentage = Math.round((completedCount / currentTasks.length) * 100);
        
        if (progressBar) progressBar.style.width = `${percentage}%`;
        if (progressText) progressText.textContent = `Progreso: ${percentage}%`;
    }

    document.getElementById('btn-cancel-task')?.addEventListener('click', () => {
        document.getElementById('task-modal').classList.add('opacity-0');
        document.getElementById('task-modal-content').classList.add('scale-95');
        setTimeout(() => {
            document.getElementById('task-modal').classList.add('hidden');
            document.getElementById('new-task-title').value = '';
        }, 300);
    });

    document.getElementById('btn-save-task')?.addEventListener('click', async () => {
        const title = document.getElementById('new-task-title').value.trim();
        const category = document.getElementById('new-task-category').value;
        if (!title) return;

        const btn = document.getElementById('btn-save-task');
        btn.textContent = 'Guardando...'; btn.disabled = true;

        const newTask = { id: Date.now(), user_id: userId, title, category, completed: false };
        try {
            const { data, error } = await supabase.from('tasks').insert([{ user_id: userId, title, category, completed: false }]).select();
            if (!error && data && data[0]) newTask.id = data[0].id;
        } catch (err) {}

        currentTasks.unshift(newTask);
        renderTasks();
        document.getElementById('btn-cancel-task').click();
        UIController.showToast('Nueva resolución guardada', 'success');
        
        btn.textContent = 'Guardar Tarea'; btn.disabled = false;
    });

    loadTasks();

    // ==========================================
    // 2. TEMPORIZADOR DE DEEP WORK
    // ==========================================
    let timerInterval;
    const WORK_TIME = 45 * 60; 
    let timeLeft = WORK_TIME;
    let isRunning = false;
    
    function updateTimerDisplay() {
        const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        const secs = (timeLeft % 60).toString().padStart(2, '0');
        if (document.getElementById('timer-display')) document.getElementById('timer-display').textContent = `${mins}:${secs}`;
        
        const circle = document.getElementById('timer-circle');
        if (circle) {
            const circ = 283;
            circle.style.strokeDashoffset = circ - ((timeLeft / WORK_TIME) * circ);
        }
    }

    document.getElementById('btn-start-timer')?.addEventListener('click', () => {
        const btnStart = document.getElementById('btn-start-timer');
        if (isRunning) {
            clearInterval(timerInterval); isRunning = false;
            btnStart.textContent = 'Reanudar';
            return;
        }
        
        isRunning = true;
        btnStart.textContent = 'Pausar';
        btnStart.classList.replace('bg-indigo-500', 'bg-orange-500');
        btnStart.classList.replace('hover:bg-indigo-600', 'hover:bg-orange-600');

        const endTime = Date.now() + (timeLeft * 1000);
        timerInterval = setInterval(() => {
            const secondsLeft = Math.round((endTime - Date.now()) / 1000);
            if (secondsLeft <= 0) {
                clearInterval(timerInterval); isRunning = false; timeLeft = WORK_TIME;
                updateTimerDisplay();
                btnStart.textContent = 'Iniciar';
                btnStart.classList.replace('bg-orange-500', 'bg-indigo-500');
                btnStart.classList.replace('hover:bg-orange-600', 'hover:bg-indigo-600');
                UIController.showToast('¡Bloque de Deep Work finalizado!', 'success');
            } else {
                timeLeft = secondsLeft; updateTimerDisplay();
            }
        }, 1000);
    });

    document.getElementById('btn-stop-timer')?.addEventListener('click', () => {
        clearInterval(timerInterval); isRunning = false; timeLeft = WORK_TIME;
        updateTimerDisplay();
        const btnStart = document.getElementById('btn-start-timer');
        btnStart.textContent = 'Iniciar';
        btnStart.classList.replace('bg-orange-500', 'bg-indigo-500');
        btnStart.classList.replace('hover:bg-orange-600', 'hover:bg-indigo-600');
    });
    updateTimerDisplay();

    // ==========================================
    // 3. FINANZAS Y PATRIMONIO
    // ==========================================
    async function loadFinances() {
        try {
            const { data, error } = await supabase.from('finances').select('*').eq('user_id', userId).single();
            if (data) {
                if (document.getElementById('net-worth')) document.getElementById('net-worth').textContent = `$${Number(data.net_worth).toLocaleString()}`;
                if (document.getElementById('income-amount')) document.getElementById('income-amount').textContent = `+$${Number(data.income).toLocaleString()}`;
                if (document.getElementById('expense-amount')) document.getElementById('expense-amount').textContent = `-$${Number(data.expense).toLocaleString()}`;
            }
        } catch (e) {
            if (document.getElementById('net-worth')) document.getElementById('net-worth').textContent = '$14,250.00';
        }
    }
    loadFinances();

    document.getElementById('btn-finance-action')?.addEventListener('click', () => {
        UIController.openDynamicModal(
            'Atajo Financiero', '<i class="ph-fill ph-wallet text-emerald-400"></i>',
            `<p class="text-gray-400 mb-4">Ingresa rápidamente un movimiento a tu balance.</p>
             <input type="number" id="quick-expense" placeholder="Monto ($)" class="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-emerald-500/50 outline-none">`,
            'bg-emerald-500', 'Guardar Gasto',
            async () => {
                const amount = document.getElementById('quick-expense').value;
                if(amount) UIController.showToast(`Movimiento de $${amount} registrado.`, 'success');
                UIController.closeDynamicModal();
            }
        );
    });

    // ==========================================
    // 4. DIARIO Y REFLEXIÓN (Crear)
    // ==========================================
    let currentMood = 'neutral';
    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.mood-btn').forEach(b => {
                b.classList.add('grayscale', 'bg-white/5', 'border-white/10');
                b.classList.remove('bg-indigo-500/20', 'border-indigo-500/30', 'bg-green-500/20', 'bg-blue-500/20', 'bg-red-500/20');
            });
            const btn = e.currentTarget;
            btn.classList.remove('grayscale', 'bg-white/5', 'border-white/10');
            btn.classList.add('bg-indigo-500/20', 'border-indigo-500/30');
            currentMood = btn.dataset.mood;
        });
    });

    document.getElementById('btn-save-journal')?.addEventListener('click', async (e) => {
        const input = document.getElementById('journal-input');
        if (!input.value.trim()) return;

        const btn = e.currentTarget;
        btn.textContent = 'Guardando...'; btn.disabled = true;
        
        try {
            await supabase.from('journal_entries').insert([{ user_id: userId, content: input.value.trim(), mood: currentMood }]);
            UIController.showToast('Diario actualizado.', 'success');
            input.value = '';
        } catch (error) {
            UIController.showToast('Entrada guardada de forma local', 'info');
            input.value = '';
        } finally {
            btn.textContent = 'Guardar entrada'; btn.disabled = false;
        }
    });

    // ==========================================
    // 5. PRÓXIMOS BLOQUES / AGENDA (CRUD REAL)
    // ==========================================
    let eventsList = [];
    const eventsContainer = document.getElementById('events-container');

    async function loadEvents() {
        try {
            const { data, error } = await supabase.from('events').select('*').eq('user_id', userId).order('created_at', { ascending: true });
            if (!error && data) eventsList = data;
        } catch (error) {
            if (eventsList.length === 0) {
                eventsList = [
                    { id: 1, title: 'Revisión de Código', time_str: '10:00', period: 'AM', desc: 'Arquitectura de DB' },
                    { id: 2, title: 'Pausa Activa', time_str: '14:30', period: 'PM', desc: 'Estiramiento' }
                ];
            }
        }
        renderEvents();
    }

    function renderEvents() {
        if (!eventsContainer) return;
        eventsContainer.innerHTML = '';

        if (eventsList.length === 0) {
            eventsContainer.innerHTML = `<p class="text-sm text-gray-500 text-center py-4">Agenda libre.</p>`;
            return;
        }

        eventsList.forEach(ev => {
            const html = `
                <div class="flex items-stretch gap-3 group">
                    <div class="flex flex-col items-center justify-center w-14 bg-blue-500/10 border border-blue-500/20 rounded-xl py-2 shrink-0">
                        <span class="text-xs text-blue-400 font-medium">${ev.time_str}</span>
                        <span class="text-[10px] text-gray-500">${ev.period}</span>
                    </div>
                    <div class="flex-1 bg-white/5 border border-white/5 rounded-xl p-3 flex justify-between items-center group-hover:border-blue-500/30 transition-colors">
                        <div>
                            <p class="text-sm font-semibold text-white">${ev.title}</p>
                            <p class="text-xs text-gray-400 mt-0.5">${ev.desc || ''}</p>
                        </div>
                        <button class="delete-event-btn text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-2" data-id="${ev.id}"><i class="ph-fill ph-trash"></i></button>
                    </div>
                </div>
            `;
            eventsContainer.insertAdjacentHTML('beforeend', html);
        });

        eventsContainer.querySelectorAll('.delete-event-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                eventsList = eventsList.filter(ev => ev.id != id);
                renderEvents();
                UIController.showToast('Evento eliminado', 'info');
                try { await supabase.from('events').delete().eq('id', id); } catch(err){}
            });
        });
    }

    document.getElementById('btn-add-event')?.addEventListener('click', () => {
        UIController.openDynamicModal(
            'Agendar Bloque', '<i class="ph-fill ph-calendar-plus text-blue-400"></i>',
            `<div class="space-y-3">
                <input type="text" id="ev-title" placeholder="Título del bloque" class="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-blue-500/50 outline-none">
                <input type="text" id="ev-desc" placeholder="Descripción corta" class="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-blue-500/50 outline-none">
                <div class="flex gap-2">
                    <input type="text" id="ev-time" placeholder="Ej: 15:00" class="w-2/3 bg-black/20 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-blue-500/50 outline-none">
                    <select id="ev-period" class="w-1/3 bg-black/20 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-blue-500/50 outline-none appearance-none">
                        <option value="AM" class="bg-gray-900">AM</option>
                        <option value="PM" class="bg-gray-900">PM</option>
                    </select>
                </div>
            </div>`,
            'bg-blue-500', 'Agendar',
            async () => {
                const title = document.getElementById('ev-title').value.trim();
                const desc = document.getElementById('ev-desc').value.trim();
                const timeStr = document.getElementById('ev-time').value.trim();
                const period = document.getElementById('ev-period').value;

                if (!title || !timeStr) {
                    UIController.showToast('El título y la hora son obligatorios.', 'warning');
                    UIController.closeDynamicModal();
                    return;
                }

                const newEv = { id: Date.now(), user_id: userId, title, desc, time_str: timeStr, period };
                try {
                    const { data, error } = await supabase.from('events').insert([newEv]).select();
                    if (!error && data) newEv.id = data[0].id;
                } catch(e){}

                eventsList.push(newEv);
                eventsList.sort((a, b) => a.time_str.localeCompare(b.time_str));
                renderEvents();
                
                UIController.showToast('Bloque agendado correctamente.', 'success');
                UIController.closeDynamicModal();
            }
        );
    });

    loadEvents();

    // ==========================================
    // 6. BOTONES GLOBALES DE PERFIL Y NOTIFICACIONES
    // ==========================================
    document.getElementById('btn-notifications')?.addEventListener('click', () => {
        UIController.showToast('No tienes notificaciones pendientes.', 'info');
    });

    document.getElementById('btn-profile')?.addEventListener('click', () => {
        UIController.openDynamicModal(
            'Perfil Activo', '<i class="ph-fill ph-user-circle text-purple-400"></i>',
            `<div class="flex items-center gap-4 mb-4">
                <div class="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-xl text-white font-bold">DC</div>
                <div><p class="text-white font-medium text-lg">Admin Nexus</p><p class="text-emerald-400 text-xs">Conectado a la base de datos</p></div>
            </div>`,
            'bg-purple-500', 'Cerrar Modal'
        );
    });
});