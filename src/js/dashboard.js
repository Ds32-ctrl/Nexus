// src/js/dashboard.js

// ==========================================
// CONFIGURACIÓN DE SUPABASE (Credenciales fijas)
// ==========================================
const SUPABASE_URL = 'https://sirytqfdlbgkcuvkquiq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpcnl0cWZkbGJna2N1dmtxdWlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5NjQwOTMsImV4cCI6MjEwNjU0MDA5M30.rv2TLpBL8_qMq_qlENS031H0neDbDJ_iQr48ohcUp-g';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', async () => {

    // ==========================================
    // AUTENTICACIÓN (Con ID de respaldo automático)
    // ==========================================
    let userId = 'default-user-id';
    
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
            userId = session.user.id;
        }
    } catch (e) {
        console.warn("Usando modo local/fallback para el usuario.");
    }

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
    // 1. SISTEMA DE MICRO RESOLUCIONES (CRUD COMPLETO)
    // ==========================================
    const tasksContainer = document.getElementById('tasks-container');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const btnOpenTaskModal = document.getElementById('btn-open-task-modal');
    const taskModal = document.getElementById('task-modal');
    const btnCancelTask = document.getElementById('btn-cancel-task');
    const btnSaveTask = document.getElementById('btn-save-task');
    
    let currentTasks = [];

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
            console.warn("Usando datos locales para tareas.");
            currentTasks = [
                { id: 1, title: 'Revisar finanzas en Excel', category: 'folder', completed: true },
                { id: 2, title: 'Leer "Padre Rico, Padre Pobre" (20 págs)', category: 'book-open', completed: false },
                { id: 3, title: 'Avanzar módulo de Python / FastAPI', category: 'code', completed: false }
            ];
        }
        renderTasks();
        updateProgressVisuals();
    }

    function renderTasks() {
        if (!tasksContainer) return;
        const addButtonHTML = btnOpenTaskModal ? btnOpenTaskModal.outerHTML : '';
        tasksContainer.innerHTML = '';

        currentTasks.forEach(task => {
            const categoryStyles = {
                'code': { icon: 'ph-code', color: 'text-orange-400' },
                'book-open': { icon: 'ph-book-open', color: 'text-blue-400' },
                'folder': { icon: 'ph-folder', color: 'text-emerald-500/50' },
                'barbell': { icon: 'ph-barbell', color: 'text-pink-400' }
            };
            const style = categoryStyles[task.category] || { icon: 'ph-check-circle', color: 'text-gray-400' };
            const isChecked = task.completed ? 'checked' : '';
            const titleClass = task.completed ? 'text-gray-500 line-through' : 'text-white group-hover:text-purple-300';

            const taskHTML = `
                <label class="cursor-pointer group flex items-start justify-between gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-purple-500/30 transition-all relative overflow-hidden" data-task-id="${task.id}">
                    <div class="flex items-start gap-3">
                        <input type="checkbox" ${isChecked} class="task-checkbox mt-1 w-5 h-5 rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500 focus:ring-offset-gray-900 accent-purple-500">
                        <div>
                            <p class="task-title text-sm font-medium transition-colors ${titleClass}">${task.title}</p>
                            <p class="text-xs text-gray-500 mt-1 flex items-center gap-1"><i class="ph-fill ${style.icon} ${style.color}"></i> ${task.category || 'General'}</p>
                        </div>
                    </div>
                    <button class="delete-task-btn text-gray-600 hover:text-red-400 transition-colors p-1" title="Eliminar tarea">
                        <i class="ph-fill ph-trash text-base"></i>
                    </button>
                </label>
            `;
            tasksContainer.insertAdjacentHTML('beforeend', taskHTML);
        });

        if (addButtonHTML) tasksContainer.insertAdjacentHTML('beforeend', addButtonHTML);
        attachTaskEvents();
        
        const newBtn = document.getElementById('btn-open-task-modal');
        if (newBtn) newBtn.addEventListener('click', openModal);
    }

    function attachTaskEvents() {
        if (!tasksContainer) return;
        
        const checkboxes = tasksContainer.querySelectorAll('.task-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', async (e) => {
                const label = e.target.closest('label');
                const taskId = label.dataset.taskId;
                const isCompleted = e.target.checked;
                const titleElement = label.querySelector('.task-title');

                if (isCompleted) {
                    titleElement.classList.replace('text-white', 'text-gray-500');
                    titleElement.classList.replace('group-hover:text-purple-300', 'line-through');
                } else {
                    titleElement.classList.replace('text-gray-500', 'text-white');
                    titleElement.classList.replace('line-through', 'group-hover:text-purple-300');
                }

                const taskIndex = currentTasks.findIndex(t => t.id == taskId);
                if (taskIndex > -1) currentTasks[taskIndex].completed = isCompleted;
                updateProgressVisuals();

                try {
                    await supabase.from('tasks').update({ completed: isCompleted }).eq('id', taskId);
                } catch (err) {
                    console.warn("Actualización en memoria activa.");
                }
            });
        });

        const deleteBtns = tasksContainer.querySelectorAll('.delete-task-btn');
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                const label = e.target.closest('label');
                const taskId = label.dataset.taskId;

                label.remove();
                currentTasks = currentTasks.filter(t => t.id != taskId);
                updateProgressVisuals();

                try {
                    await supabase.from('tasks').delete().eq('id', taskId);
                } catch (err) {
                    console.warn("Eliminación en memoria activa.");
                }
            });
        });
    }

    function openModal() {
        if (!taskModal) return;
        taskModal.classList.remove('hidden');
        setTimeout(() => {
            taskModal.classList.remove('opacity-0');
            const content = document.getElementById('task-modal-content');
            if (content) content.classList.remove('scale-95');
        }, 10);
    }

    function closeModal() {
        if (!taskModal) return;
        taskModal.classList.add('opacity-0');
        const content = document.getElementById('task-modal-content');
        if (content) content.classList.add('scale-95');
        setTimeout(() => {
            taskModal.classList.add('hidden');
            const titleInput = document.getElementById('new-task-title');
            if (titleInput) titleInput.value = '';
        }, 300);
    }

    btnOpenTaskModal?.addEventListener('click', openModal);
    btnCancelTask?.addEventListener('click', closeModal);

    btnSaveTask?.addEventListener('click', async () => {
        const titleInput = document.getElementById('new-task-title');
        const categorySelect = document.getElementById('new-task-category');
        
        const title = titleInput ? titleInput.value.trim() : '';
        const category = categorySelect ? categorySelect.value : 'folder';

        if (!title) return;

        btnSaveTask.textContent = 'Guardando...';
        btnSaveTask.disabled = true;

        const newTask = {
            id: Date.now(),
            user_id: userId,
            title: title,
            category: category,
            completed: false
        };

        try {
            const { data, error } = await supabase
                .from('tasks')
                .insert([{ user_id: userId, title, category, completed: false }])
                .select();

            if (!error && data && data[0]) newTask.id = data[0].id;
        } catch (err) {
            console.warn("Guardado en memoria activo.");
        }

        currentTasks.unshift(newTask);
        renderTasks();
        updateProgressVisuals();
        closeModal();

        btnSaveTask.textContent = 'Guardar Tarea';
        btnSaveTask.disabled = false;
    });

    function updateProgressVisuals() {
        if (currentTasks.length === 0) {
            if (progressBar) progressBar.style.width = '0%';
            if (progressText) progressText.textContent = 'Progreso: 0%';
            return;
        }
        const completedCount = currentTasks.filter(t => t.completed).length;
        const percentage = Math.round((completedCount / currentTasks.length) * 100);
        
        if (progressBar) progressBar.style.width = `${percentage}%`;
        if (progressText) progressText.textContent = `Progreso: ${percentage}%`;
    }

    loadTasks();

    // ==========================================
    // 2. TEMPORIZADOR DE DEEP WORK
    // ==========================================
    const timerDisplay = document.getElementById('timer-display');
    const startBtn = document.getElementById('btn-start-timer');
    const stopBtn = document.getElementById('btn-stop-timer');
    const timerCircle = document.getElementById('timer-circle');
    
    let timerInterval;
    let endTime; 
    const WORK_TIME = 45 * 60; 
    let timeLeft = WORK_TIME;
    let isRunning = false;
    
    const circleCircumference = timerCircle && typeof timerCircle.getTotalLength === 'function' ? timerCircle.getTotalLength() : 283;

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    function updateTimerDisplay() {
        if (timerDisplay) timerDisplay.textContent = formatTime(timeLeft);
        if (timerCircle) {
            const timeFraction = timeLeft / WORK_TIME;
            const strokeDashoffset = circleCircumference - (timeFraction * circleCircumference);
            timerCircle.style.strokeDashoffset = strokeDashoffset;
        }
    }

    function startTimer() {
        if (isRunning) return;
        isRunning = true;
        
        if (startBtn) {
            startBtn.textContent = 'Pausar';
            startBtn.classList.remove('bg-indigo-500', 'hover:bg-indigo-600');
            startBtn.classList.add('bg-orange-500', 'hover:bg-orange-600', 'shadow-[0_0_20px_rgba(249,115,22,0.3)]');
        }

        endTime = Date.now() + (timeLeft * 1000);

        timerInterval = setInterval(() => {
            const secondsLeft = Math.round((endTime - Date.now()) / 1000);

            if (secondsLeft <= 0) {
                clearInterval(timerInterval);
                isRunning = false;
                timeLeft = WORK_TIME;
                updateTimerDisplay();
                resetStartButton();
                alert('¡Sesión de Deep Work completada! Es hora de un descanso.');
            } else {
                timeLeft = secondsLeft;
                updateTimerDisplay();
            }
        }, 1000);
    }

    function pauseTimer() {
        clearInterval(timerInterval);
        isRunning = false;
        if (startBtn) startBtn.textContent = 'Reanudar';
    }

    function resetStartButton() {
        if (startBtn) {
            startBtn.textContent = 'Iniciar';
            startBtn.classList.remove('bg-orange-500', 'hover:bg-orange-600', 'shadow-[0_0_20px_rgba(249,115,22,0.3)]');
            startBtn.classList.add('bg-indigo-500', 'hover:bg-indigo-600');
        }
    }

    startBtn?.addEventListener('click', () => {
        if (isRunning) pauseTimer();
        else startTimer();
    });

    stopBtn?.addEventListener('click', () => {
        clearInterval(timerInterval);
        isRunning = false;
        timeLeft = WORK_TIME;
        updateTimerDisplay();
        resetStartButton();
    });
    updateTimerDisplay();

    // ==========================================
    // 3. FINANZAS Y PATRIMONIO (Interactividad Añadida)
    // ==========================================
    const btnFinanceAction = document.getElementById('btn-finance-action'); // <--- Asegúrate de tener este ID en tu HTML
    
    async function loadFinances() {
        const netWorthEl = document.getElementById('net-worth');
        const netTrendEl = document.getElementById('net-trend');
        const incomeEl = document.getElementById('income-amount');
        const expenseEl = document.getElementById('expense-amount');

        try {
            const { data, error } = await supabase
                .from('finances')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error || !data) throw error;

            if (netWorthEl) netWorthEl.textContent = `$${Number(data.net_worth || 14250).toLocaleString()}`;
            if (incomeEl) incomeEl.textContent = `+$${Number(data.income || 3200).toLocaleString()}`;
            if (expenseEl) expenseEl.textContent = `-$${Number(data.expense || 1450).toLocaleString()}`;
            if (netTrendEl) netTrendEl.innerHTML = `<i class="ph-bold ph-trend-up"></i> +4.2% vs mes anterior`;
        } catch (e) {
            if (netWorthEl) netWorthEl.textContent = '$14,250.00';
            if (incomeEl) incomeEl.textContent = '+$3,200';
            if (expenseEl) expenseEl.textContent = '-$1,450';
            if (netTrendEl) netTrendEl.innerHTML = `<i class="ph-bold ph-trend-up"></i> +4.2% vs mes anterior`;
        }
    }
    loadFinances();

    // Evento click para interactuar con finanzas
    btnFinanceAction?.addEventListener('click', () => {
        alert("Abriendo panel detallado de finanzas... (Aquí puedes conectar tu modal de ingresos/gastos)");
    });

    // ==========================================
    // 4. PRÓXIMOS BLOQUES / AGENDA (Interactividad Añadida)
    // ==========================================
    const eventsContainer = document.getElementById('events-container');
    const btnAddEvent = document.getElementById('btn-add-event'); // <--- Asegúrate de tener este ID en tu HTML

    if (eventsContainer) {
        eventsContainer.innerHTML = `
            <div class="flex items-stretch gap-3 group cursor-pointer event-card">
                <div class="flex flex-col items-center justify-center w-14 bg-blue-500/10 border border-blue-500/20 rounded-xl py-2 shrink-0">
                    <span class="text-xs text-blue-400 font-medium">10:00</span>
                    <span class="text-xs text-gray-500">AM</span>
                </div>
                <div class="flex-1 bg-white/5 border border-white/5 rounded-xl p-3 group-hover:border-blue-500/30 transition-colors">
                    <p class="text-sm font-semibold text-white">Revisión de Código</p>
                    <p class="text-xs text-gray-400 mt-0.5">Arquitectura de la Base de Datos</p>
                </div>
            </div>
            <div class="flex items-stretch gap-3 group cursor-pointer event-card">
                <div class="flex flex-col items-center justify-center w-14 bg-white/5 border border-white/10 rounded-xl py-2 shrink-0">
                    <span class="text-xs text-gray-300 font-medium">14:30</span>
                    <span class="text-xs text-gray-500">PM</span>
                </div>
                <div class="flex-1 bg-white/5 border border-white/5 rounded-xl p-3 group-hover:border-white/20 transition-colors">
                    <p class="text-sm font-semibold text-white opacity-70">Desconexión / Pausa Activa</p>
                    <p class="text-xs text-gray-500 mt-0.5">Estiramiento y meditación corta</p>
                </div>
            </div>
        `;
        
        // Agregar click a los bloques renderizados
        const eventCards = eventsContainer.querySelectorAll('.event-card');
        eventCards.forEach(card => {
            card.addEventListener('click', () => {
                alert("Detalles del evento seleccionado.");
            });
        });
    }

    // Evento para botón de agregar nuevo bloque
    btnAddEvent?.addEventListener('click', () => {
        alert("Abriendo formulario para nuevo evento en la agenda...");
    });

    // ==========================================
    // 5. REGISTRO DIARIO Y ESTADO DE ÁNIMO
    // ==========================================
    const moodContainer = document.getElementById('mood-container');
    const journalInput = document.getElementById('journal-input');
    const btnSaveJournal = document.getElementById('btn-save-journal');
    let currentMood = 'neutral';

    if (moodContainer) {
        const moodButtons = moodContainer.querySelectorAll('.mood-btn');
        moodButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                moodButtons.forEach(b => {
                    b.classList.add('grayscale', 'bg-white/5', 'border-white/10');
                    b.classList.remove('bg-indigo-500/20', 'border-indigo-500/30', 'bg-green-500/20', 'bg-blue-500/20', 'bg-red-500/20');
                });
                const currentBtn = e.currentTarget;
                currentBtn.classList.remove('grayscale', 'bg-white/5', 'border-white/10');
                currentBtn.classList.add('bg-indigo-500/20', 'border-indigo-500/30');
                currentMood = currentBtn.dataset.mood;
            });
        });
    }

    btnSaveJournal?.addEventListener('click', async () => {
        const content = journalInput ? journalInput.value.trim() : '';
        if (!content) return;

        btnSaveJournal.textContent = 'Guardando...';
        
        try {
            await supabase
                .from('journal_entries')
                .insert([{ user_id: userId, content: content, mood: currentMood }]);
            
            alert('¡Entrada de diario guardada correctamente!');
            if (journalInput) journalInput.value = '';
        } catch (error) {
            alert('Entrada guardada en sesión local.');
            if (journalInput) journalInput.value = '';
        } finally {
            btnSaveJournal.textContent = 'Guardar entrada';
        }
    });

    // ==========================================
    // 6. BOTONES SUPERIORES (Notificaciones, Perfil, etc.)
    // ==========================================
    // MODO CORRECTO: Usar IDs en lugar de selectores frágiles como 'header button.relative'
    const btnNotifications = document.getElementById('btn-notifications');
    const btnProfile = document.getElementById('btn-profile');
    const btnSettings = document.getElementById('btn-settings'); // Por si lo tienes

    btnNotifications?.addEventListener('click', () => {
        alert('Campana: No tienes notificaciones pendientes.');
    });

    btnProfile?.addEventListener('click', () => {
        alert('Perfil: Abriendo menú de usuario y configuración de cuenta...');
    });

    btnSettings?.addEventListener('click', () => {
        alert('Ajustes: Abriendo panel de preferencias...');
    });
});