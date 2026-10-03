// src/js/dashboard.js

// ==========================================
// CONFIGURACIÓN DE SUPABASE
// ==========================================
const SUPABASE_URL = 'https://sirytqfdlbgkcuvkquiq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpcnl0cWZkbGJna2N1dmtxdWlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5NjQwOTMsImV4cCI6MjEwNjU0MDA5M30.rv2TLpBL8_qMq_qlENS031H0neDbDJ_iQr48ohcUp-g';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', async () => {

    // ==========================================
    // VERIFICACIÓN DE AUTENTICACIÓN
    // ==========================================
    const { data: { session } } = await supabase.auth.getSession();
    
    let userId = session?.user?.id;
    if (!userId) {
        console.warn("No hay sesión activa. Usando modo local/prueba para que los botones funcionen.");
        userId = 'usuario-prueba-local'; // Fallback para que la UI no se bloquee
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
    // 1. SISTEMA DE MICRO RESOLUCIONES (CRUD CON SUPABASE)
    // ==========================================
    const tasksContainer = document.getElementById('tasks-container');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const taskModal = document.getElementById('task-modal');
    const btnCancelTask = document.getElementById('btn-cancel-task');
    const btnSaveTask = document.getElementById('btn-save-task');
    
    let currentTasks = [];

    // --- A. Leer (Read) Tareas desde Supabase ---
    async function loadTasks() {
        if (userId === 'usuario-prueba-local') return; // No intentar cargar si es modo prueba

        try {
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            currentTasks = data || [];
            renderTasks();
            updateProgressVisuals();
        } catch (error) {
            console.error("Error cargando tareas:", error);
        }
    }

    // --- B. Renderizar Tareas en el DOM ---
    function renderTasks() {
        if (!tasksContainer) return;

        // Guardar el HTML del botón de añadir antes de limpiar
        const addButtonElement = document.getElementById('btn-open-task-modal');
        const addButtonHTML = addButtonElement ? addButtonElement.outerHTML : `
            <button id="btn-open-task-modal" class="flex items-center justify-center gap-2 p-4 rounded-2xl border border-dashed border-white/20 text-gray-400 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all h-full min-h-[80px]">
                <i class="ph ph-plus"></i> Nueva Resolución
            </button>`;

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
                            <p class="text-xs text-gray-500 mt-1 flex items-center gap-1"><i class="ph-fill ${style.icon} ${style.color}"></i> ${task.category}</p>
                        </div>
                    </div>
                    <button class="delete-task-btn text-gray-600 hover:text-red-400 transition-colors z-10" title="Eliminar tarea">
                        <i class="ph-fill ph-trash"></i>
                    </button>
                </label>
            `;
            tasksContainer.insertAdjacentHTML('beforeend', taskHTML);
        });

        // Re-insertar el botón al final
        tasksContainer.insertAdjacentHTML('beforeend', addButtonHTML);
    }

    // --- C. Eventos Delegados para Actualizar, Eliminar y Abrir Modal ---
    if (tasksContainer) {
        tasksContainer.addEventListener('click', async (e) => {
            // 1. Abrir Modal (Nueva Resolución)
            const btnOpen = e.target.closest('#btn-open-task-modal');
            if (btnOpen) {
                openModal();
                return;
            }

            // 2. Eliminar Tarea
            const btnDelete = e.target.closest('.delete-task-btn');
            if (btnDelete) {
                e.preventDefault();
                const label = btnDelete.closest('label');
                const taskId = label.dataset.taskId;

                // Actualizar UI inmediatamente
                label.remove();
                currentTasks = currentTasks.filter(t => t.id != taskId);
                updateProgressVisuals();

                // Eliminar en Supabase (si no es modo prueba)
                if (userId !== 'usuario-prueba-local') {
                    try {
                        await supabase.from('tasks').delete().eq('id', taskId);
                    } catch (error) {
                        console.error("Error eliminando tarea:", error);
                    }
                }
                return;
            }
        });

        // 3. Marcar Checkbox (Usamos change event)
        tasksContainer.addEventListener('change', async (e) => {
            if (e.target.classList.contains('task-checkbox')) {
                const label = e.target.closest('label');
                const taskId = label.dataset.taskId;
                const isCompleted = e.target.checked;
                const titleElement = label.querySelector('.task-title');

                // Actualizar UI
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

                // Actualizar en Supabase
                if (userId !== 'usuario-prueba-local') {
                    try {
                        await supabase.from('tasks').update({ completed: isCompleted }).eq('id', taskId);
                    } catch (error) {
                        console.error("Error actualizando tarea:", error);
                    }
                }
            }
        });
    }

    // --- D. Lógica del Modal ---
    function openModal() {
        if (!taskModal) return;
        taskModal.classList.remove('hidden');
        setTimeout(() => {
            taskModal.classList.remove('opacity-0');
            document.getElementById('task-modal-content')?.classList.remove('scale-95');
        }, 10);
    }

    function closeModal() {
        if (!taskModal) return;
        taskModal.classList.add('opacity-0');
        document.getElementById('task-modal-content')?.classList.add('scale-95');
        setTimeout(() => {
            taskModal.classList.add('hidden');
            const titleInput = document.getElementById('new-task-title');
            if (titleInput) titleInput.value = '';
        }, 300);
    }

    btnCancelTask?.addEventListener('click', closeModal);

    btnSaveTask?.addEventListener('click', async () => {
        const titleInput = document.getElementById('new-task-title');
        const categorySelect = document.getElementById('new-task-category');
        
        const title = titleInput.value.trim();
        const category = categorySelect.value;

        if (!title) return;

        btnSaveTask.textContent = 'Guardando...';
        btnSaveTask.disabled = true;

        if (userId === 'usuario-prueba-local') {
            // Modo local simulado
            const newTask = { id: Date.now(), title, category, completed: false };
            currentTasks.unshift(newTask);
            renderTasks();
            updateProgressVisuals();
            closeModal();
            btnSaveTask.textContent = 'Guardar Tarea';
            btnSaveTask.disabled = false;
            return;
        }

        try {
            const { data, error } = await supabase
                .from('tasks')
                .insert([{ user_id: userId, title: title, category: category, completed: false }])
                .select(); 

            if (error) throw error;

            if (data && data.length > 0) {
                currentTasks.unshift(data[0]);
                renderTasks();
                updateProgressVisuals();
            }
            closeModal();
        } catch (error) {
            console.error("Error creando tarea:", error);
            alert("No se pudo crear la tarea.");
        } finally {
            btnSaveTask.textContent = 'Guardar Tarea';
            btnSaveTask.disabled = false;
        }
    });

    // --- E. Lógica Barra de Progreso ---
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

    // Inicializar tareas
    loadTasks();
    updateProgressVisuals(); // Asegurar que inicie en 0% visualmente
    
    // ==========================================
    // 2. TEMPORIZADOR DE DEEP WORK
    // ==========================================
    const timerDisplay = document.getElementById('timer-display');
    const startBtn = document.getElementById('btn-start-timer');
    const stopBtn = document.getElementById('btn-stop-timer');
    const timerCircle = document.getElementById('timer-circle');
    
    let timerInterval;
    let endTime; 
    const WORK_TIME = 45 * 60; // 45 minutos
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
        if (startBtn) {
            startBtn.textContent = 'Reanudar';
        }
    }

    function resetStartButton() {
        if (startBtn) {
            startBtn.textContent = 'Iniciar';
            startBtn.classList.remove('bg-orange-500', 'hover:bg-orange-600', 'shadow-[0_0_20px_rgba(249,115,22,0.3)]');
            startBtn.classList.add('bg-indigo-500', 'hover:bg-indigo-600');
        }
    }

    if (startBtn) {
        startBtn.addEventListener('click', () => {
            if (isRunning) pauseTimer();
            else startTimer();
        });
    }

    if (stopBtn) {
        stopBtn.addEventListener('click', () => {
            clearInterval(timerInterval);
            isRunning = false;
            timeLeft = WORK_TIME;
            updateTimerDisplay();
            resetStartButton();
        });
    }
    updateTimerDisplay();


    // ==========================================
    // 3. REGISTRO DIARIO Y ESTADO DE ÁNIMO
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
                    b.classList.remove('bg-indigo-500/20', 'border-indigo-500/30');
                });

                const currentBtn = e.currentTarget;
                currentBtn.classList.remove('grayscale', 'bg-white/5', 'border-white/10');
                currentBtn.classList.add('bg-indigo-500/20', 'border-indigo-500/30'); 
                currentMood = currentBtn.dataset.mood;
            });
        });
    }

    if (btnSaveJournal) {
        btnSaveJournal.addEventListener('click', async () => {
            const content = journalInput.value.trim();
            if (!content) return;

            btnSaveJournal.textContent = 'Guardando...';
            btnSaveJournal.disabled = true;
            
            if (userId === 'usuario-prueba-local') {
                alert('Entrada guardada correctamente (Modo Local).');
                journalInput.value = '';
                btnSaveJournal.textContent = 'Guardar entrada';
                btnSaveJournal.disabled = false;
                return;
            }

            try {
                const { error } = await supabase
                    .from('journal_entries')
                    .insert([{ user_id: userId, content: content, mood: currentMood }]);

                if (error) throw error;
                
                alert('Entrada guardada correctamente.');
                journalInput.value = ''; 
            } catch (error) {
                console.error("Error guardando entrada de diario:", error);
                alert("Hubo un error al guardar la entrada.");
            } finally {
                btnSaveJournal.textContent = 'Guardar entrada';
                btnSaveJournal.disabled = false;
            }
        });
    }
});