// src/js/dashboard.js

document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. SISTEMA DE MICRO RESOLUCIONES (TAREAS)
    // ==========================================
    const taskCheckboxes = document.querySelectorAll('input[type="checkbox"]');
    const progressBar = document.querySelector('.bg-gradient-to-r.from-purple-500');
    const progressText = document.querySelector('.text-sm.text-gray-400');

    function updateProgress() {
        const totalTasks = taskCheckboxes.length;
        const completedTasks = document.querySelectorAll('input[type="checkbox"]:checked').length;
        
        // Calcular porcentaje
        const percentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
        
        // Actualizar barra visual
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }
        
        // Actualizar texto
        if (progressText && progressText.textContent.includes('Progreso:')) {
            progressText.textContent = `Progreso: ${percentage}%`;
        }
    }

    // Escuchar cambios en los checkboxes
    taskCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            // El elemento p principal que contiene el texto de la tarea
            const titleElement = e.target.nextElementSibling.querySelector('p:first-child');
            
            if (isChecked) {
                titleElement.classList.remove('text-white', 'group-hover:text-purple-300');
                titleElement.classList.add('text-gray-500', 'line-through');
            } else {
                titleElement.classList.remove('text-gray-500', 'line-through');
                titleElement.classList.add('text-white', 'group-hover:text-purple-300');
            }
            
            updateProgress();
        });
    });

    // Inicializar progreso al cargar
    updateProgress();


    // ==========================================
    // 2. TEMPORIZADOR DE DEEP WORK
    // ==========================================
    const timerDisplay = document.querySelector('.text-3xl.font-bold.tracking-tighter');
    const startBtn = document.querySelector('.bg-indigo-500.hover\\:bg-indigo-600');
    const stopBtn = document.querySelector('.glass.hover\\:bg-white\\/5');
    const timerCircle = document.querySelector('.transition-all.duration-1000'); // El SVG Circle
    
    let timerInterval;
    const WORK_TIME = 45 * 60; // 45 minutos en segundos
    let timeLeft = WORK_TIME;
    let isRunning = false;
    const circleCircumference = 283; // Valor del stroke-dasharray

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    function updateTimerDisplay() {
        if (timerDisplay) {
            timerDisplay.textContent = formatTime(timeLeft);
        }
        
        // Actualizar el círculo SVG
        if (timerCircle) {
            // Calculamos cuánto ha avanzado (0 a 1)
            const timeFraction = timeLeft / WORK_TIME;
            // Calculamos el offset (283 = vacío, 0 = lleno, pero en nuestro caso queremos que se vaya vaciando)
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

        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();

            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                isRunning = false;
                timeLeft = WORK_TIME;
                updateTimerDisplay();
                resetStartButton();
                alert('¡Sesión de Deep Work completada! Es hora de un descanso.');
            }
        }, 1000);
    }

    function pauseTimer() {
        clearInterval(timerInterval);
        isRunning = false;
        if (startBtn) {
            startBtn.textContent = 'Reanudar';
            startBtn.classList.remove('bg-orange-500', 'hover:bg-orange-600', 'shadow-[0_0_20px_rgba(249,115,22,0.3)]');
            startBtn.classList.add('bg-indigo-500', 'hover:bg-indigo-600');
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

    // Inicializar vista del temporizador
    updateTimerDisplay();


    // ==========================================
    // 3. REGISTRO DE ESTADO DE ÁNIMO (MOOD TRACKER)
    // ==========================================
    // Seleccionamos los botones del mood tracker por su estructura
    const moodContainer = document.querySelector('.space-y-4 .flex.gap-2');
    
    if (moodContainer) {
        const moodButtons = moodContainer.querySelectorAll('button');
        
        moodButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Primero reseteamos todos a estado inactivo (escala de grises)
                moodButtons.forEach(b => {
                    b.classList.add('grayscale');
                    b.classList.replace('bg-green-500/20', 'bg-white/5');
                    b.classList.replace('border-green-500/30', 'border-white/10');
                    b.classList.replace('text-green-400', 'text-white');
                    
                    b.classList.replace('bg-blue-500/20', 'bg-white/5');
                    b.classList.replace('border-blue-500/30', 'border-white/10');
                    b.classList.replace('text-blue-400', 'text-white');
                });

                // Activamos el clickeado quitando la escala de grises
                btn.classList.remove('grayscale');
                
                // Aquí podrías añadir una lógica para colorear según el emoji
                // Por defecto le damos un estilo activo genérico
                btn.classList.replace('bg-white/5', 'bg-indigo-500/20');
                btn.classList.replace('border-white/10', 'border-indigo-500/30');
            });
        });
    }
});