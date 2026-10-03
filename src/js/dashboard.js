// src/js/dashboard.js

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 0. FECHA DINÁMICA (NUEVO)
    // ==========================================
    const dateElement = document.getElementById('current-date') || document.querySelector('header p.text-gray-400');
    
    if (dateElement) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const today = new Date().toLocaleDateString('es-ES', options);
        // Capitaliza la primera letra y renderiza
        dateElement.innerHTML = `<i class="ph ph-calendar-blank"></i> ${today.charAt(0).toUpperCase() + today.slice(1)}`;
    }

    // ==========================================
    // 1. SISTEMA DE MICRO RESOLUCIONES (TAREAS)
    // ==========================================
    const taskCheckboxes = document.querySelectorAll('.task-checkbox, input[type="checkbox"]');
    const progressBar = document.getElementById('progress-bar') || document.querySelector('.bg-gradient-to-r.from-purple-500');
    const progressText = document.getElementById('progress-text') || document.querySelector('.text-sm.text-gray-400');

    function updateProgress() {
        const totalTasks = taskCheckboxes.length;
        if (totalTasks === 0) return;

        // Contar checkboxes marcados
        let completedTasks = 0;
        taskCheckboxes.forEach(cb => {
            if (cb.checked) completedTasks++;
        });
        
        // Calcular porcentaje
        const percentage = Math.round((completedTasks / totalTasks) * 100);
        
        // Actualizar barra visual
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }
        
        // Actualizar texto
        if (progressText && progressText.textContent.includes('Progreso')) {
            progressText.textContent = `Progreso: ${percentage}%`;
        }
    }

    // Escuchar cambios en los checkboxes
    taskCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            
            // Búsqueda robusta del título de la tarea (no se rompe si cambias el HTML)
            const labelContainer = e.target.closest('label');
            let titleElement;
            
            if (labelContainer) {
                titleElement = labelContainer.querySelector('.task-title') || labelContainer.querySelector('p:first-child');
            } else {
                titleElement = e.target.nextElementSibling.querySelector('p:first-child');
            }
            
            if (titleElement) {
                if (isChecked) {
                    titleElement.classList.remove('text-white', 'group-hover:text-purple-300');
                    titleElement.classList.add('text-gray-500', 'line-through');
                } else {
                    titleElement.classList.remove('text-gray-500', 'line-through');
                    titleElement.classList.add('text-white', 'group-hover:text-purple-300');
                }
            }
            
            updateProgress();
        });
    });

    // Inicializar progreso al cargar
    updateProgress();


    // ==========================================
    // 2. TEMPORIZADOR DE DEEP WORK (PRECISIÓN MEJORADA)
    // ==========================================
    const timerDisplay = document.getElementById('timer-display') || document.querySelector('.text-3xl.font-bold.tracking-tighter');
    const startBtn = document.getElementById('btn-start-timer') || document.querySelector('.bg-indigo-500.hover\\:bg-indigo-600');
    const stopBtn = document.getElementById('btn-stop-timer') || document.querySelector('.glass.hover\\:bg-white\\/5');
    const timerCircle = document.getElementById('timer-circle') || document.querySelector('.transition-all.duration-1000');
    
    let timerInterval;
    let endTime; // Nueva variable para calcular el tiempo real
    const WORK_TIME = 45 * 60; // 45 minutos en segundos
    let timeLeft = WORK_TIME;
    let isRunning = false;
    
    // Obtener la circunferencia real dinámicamente si es posible, sino usar 283
    const circleCircumference = timerCircle && typeof timerCircle.getTotalLength === 'function' 
                                ? timerCircle.getTotalLength() 
                                : 283;

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    function updateTimerDisplay() {
        if (timerDisplay) {
            timerDisplay.textContent = formatTime(timeLeft);
        }
        
        if (timerCircle) {
            const timeFraction = timeLeft / WORK_TIME;
            const strokeDashoffset = circleCircumference - (timeFraction * circleCircumference);
            timerCircle.style.strokeDashoffset = strokeDashoffset;
        }
    }

    function startTimer() {
        if (isRunning) return;
        isRunning = true;
        
        // Cambiar el estilo del botón
        if (startBtn) {
            startBtn.textContent = 'Pausar';
            startBtn.classList.remove('bg-indigo-500', 'hover:bg-indigo-600');
            startBtn.classList.add('bg-orange-500', 'hover:bg-orange-600', 'shadow-[0_0_20px_rgba(249,115,22,0.3)]');
        }

        // Lógica precisa usando marcas de tiempo (Date.now)
        endTime = Date.now() + (timeLeft * 1000);

        timerInterval = setInterval(() => {
            // Calcula los segundos restantes reales (no se retrasa si cambias de pestaña)
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
        resetStartButton();
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
            if (isRunning) {
                pauseTimer();
            } else {
                startTimer();
            }
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

    // Inicializar vista del temporizador al cargar
    updateTimerDisplay();


    // ==========================================
    // 3. REGISTRO DE ESTADO DE ÁNIMO (MOOD TRACKER)
    // ==========================================
    const moodContainer = document.querySelector('.space-y-4 .flex.gap-2');
    
    if (moodContainer) {
        const moodButtons = moodContainer.querySelectorAll('.mood-btn, button');
        
        moodButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Limpiar todos los botones
                moodButtons.forEach(b => {
                    b.classList.add('grayscale');
                    // Remover colores activos anteriores
                    b.classList.remove('bg-indigo-500/20', 'border-indigo-500/30', 'bg-green-500/20', 'bg-blue-500/20', 'border-green-500/30', 'border-blue-500/30', 'text-green-400', 'text-blue-400');
                    // Restaurar estado inactivo
                    b.classList.add('bg-white/5', 'border-white/10');
                    b.setAttribute('data-active', 'false');
                });

                // Activar únicamente el botón clickeado
                const currentBtn = e.currentTarget;
                currentBtn.classList.remove('grayscale', 'bg-white/5', 'border-white/10');
                
                // Color activo estándar
                currentBtn.classList.add('bg-indigo-500/20', 'border-indigo-500/30');
                currentBtn.setAttribute('data-active', 'true');
            });
        });
    }
});