// src/js/modules/deepWork.js

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // SISTEMA DE TOASTS LOCAL
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
    // LÓGICA DEL TEMPORIZADOR AVANZADO
    // ==========================================
    const timerDisplay = document.getElementById('main-timer-display');
    const timerCircle = document.getElementById('main-timer-circle');
    const btnStart = document.getElementById('btn-main-start');
    const btnStop = document.getElementById('btn-main-stop');
    const statusText = document.getElementById('timer-status-text');
    const modeButtons = document.querySelectorAll('.timer-mode-btn');
    
    // Circunferencia para r=90 es 2 * pi * 90 ≈ 565.48
    const CIRCUMFERENCE = 565.48; 
    let timerInterval;
    let isRunning = false;
    let currentModeTime = 45 * 60; // Por defecto 45 min
    let timeLeft = currentModeTime;
    let currentModeColor = '#6366f1'; // Indigo

    function formatTime(seconds) {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    function updateVisuals() {
        timerDisplay.textContent = formatTime(timeLeft);
        const offset = CIRCUMFERENCE - ((timeLeft / currentModeTime) * CIRCUMFERENCE);
        timerCircle.style.strokeDashoffset = offset;
    }

    function setMode(minutes, btnElement) {
        if (isRunning) {
            UIController.showToast('Pausa el temporizador antes de cambiar de modo', 'warning');
            return;
        }

        modeButtons.forEach(btn => {
            btn.classList.remove('active', 'bg-indigo-500', 'bg-emerald-500', 'text-white', 'shadow-lg');
            btn.classList.add('text-gray-400');
            btn.style.boxShadow = 'none';
        });

        currentModeTime = minutes * 60;
        timeLeft = currentModeTime;
        
        let themeColor = 'bg-indigo-500';
        let shadowColor = 'shadow-[0_0_20px_rgba(99,102,241,0.4)]';
        currentModeColor = '#6366f1';
        
        if (minutes === 5) { // Modo Descanso
            themeColor = 'bg-emerald-500';
            shadowColor = 'shadow-[0_0_20px_rgba(16,185,129,0.4)]';
            currentModeColor = '#10b981';
            statusText.textContent = 'PAUSA ACTIVA';
            statusText.className = 'text-sm uppercase tracking-[0.3em] text-emerald-400 mt-2 font-medium';
        } else {
            statusText.textContent = minutes === 25 ? 'POMODORO' : 'ENFOQUE TOTAL';
            statusText.className = 'text-sm uppercase tracking-[0.3em] text-indigo-400 mt-2 font-medium';
        }

        btnElement.classList.remove('text-gray-400');
        btnElement.classList.add('active', themeColor, 'text-white');
        btnElement.style.boxShadow = shadowColor.match(/\[(.*?)\]/)[1]; // Extraer color de sombra
        
        timerCircle.style.stroke = currentModeColor;
        timerCircle.style.strokeDashoffset = 0; // Reset visual
        updateVisuals();
    }

    function startTimer() {
        if (isRunning) return;
        isRunning = true;
        
        btnStart.innerHTML = '<i class="ph-fill ph-pause"></i> Pausar Sesión';
        btnStart.classList.replace('bg-indigo-500', 'bg-orange-500');
        btnStart.classList.replace('hover:bg-indigo-600', 'hover:bg-orange-600');
        btnStart.style.boxShadow = '0 0 30px rgba(249, 115, 22, 0.4)'; // Orange glow

        const endTime = Date.now() + (timeLeft * 1000);
        
        timerInterval = setInterval(() => {
            const secondsLeft = Math.round((endTime - Date.now()) / 1000);
            
            if (secondsLeft <= 0) {
                clearInterval(timerInterval);
                isRunning = false;
                timeLeft = currentModeTime;
                updateVisuals();
                resetStartButton();
                playSoundAlert();
                UIController.showToast('¡Bloque finalizado! Tiempo de cambiar de ritmo.', 'success');
            } else {
                timeLeft = secondsLeft;
                updateVisuals();
            }
        }, 1000);
    }

    function pauseTimer() {
        clearInterval(timerInterval);
        isRunning = false;
        btnStart.innerHTML = '<i class="ph-fill ph-play"></i> Continuar';
    }

    function resetStartButton() {
        btnStart.innerHTML = '<i class="ph-fill ph-play"></i> Iniciar Sesión';
        btnStart.classList.replace('bg-orange-500', 'bg-indigo-500');
        btnStart.classList.replace('hover:bg-orange-600', 'hover:bg-indigo-600');
        btnStart.style.boxShadow = '0 0 30px rgba(99, 102, 241, 0.4)';
    }

    function playSoundAlert() {
        // En un entorno real cargaríamos un archivo de audio real
        // const audio = new Audio('../assets/chime.mp3'); audio.play();
    }

    // Event Listeners del Temporizador
    btnStart.addEventListener('click', () => isRunning ? pauseTimer() : startTimer());
    
    btnStop.addEventListener('click', () => {
        clearInterval(timerInterval);
        isRunning = false;
        timeLeft = currentModeTime;
        updateVisuals();
        resetStartButton();
        UIController.showToast('Temporizador reiniciado', 'info');
    });

    modeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const mins = parseInt(e.target.dataset.time);
            setMode(mins, e.target);
        });
    });

    // ==========================================
    // SISTEMA DE DISTRACCIONES
    // ==========================================
    const btnLogDistraction = document.getElementById('btn-log-distraction');
    const distractionCountEl = document.getElementById('distraction-count');
    let distractions = 0;

    btnLogDistraction.addEventListener('click', () => {
        if (!isRunning) {
            UIController.showToast('Inicia la sesión para registrar distracciones', 'info');
            return;
        }
        distractions++;
        distractionCountEl.textContent = distractions;
        
        // Animación visual rápida
        btnLogDistraction.classList.add('text-orange-500', 'border-orange-500/50');
        setTimeout(() => btnLogDistraction.classList.remove('text-orange-500', 'border-orange-500/50'), 300);
        
        UIController.showToast('Distracción registrada. ¡Vuelve al enfoque!', 'warning');
    });

    // ==========================================
    // SIMULADOR DE AUDIO AMBIENTAL (Mockup UI)
    // ==========================================
    const soundButtons = document.querySelectorAll('.sound-btn');
    
    soundButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const currentBtn = e.currentTarget;
            const icon = currentBtn.querySelector('.ph-play-circle, .ph-pause-circle');
            
            // Pausar todos los demás
            soundButtons.forEach(otherBtn => {
                if (otherBtn !== currentBtn) {
                    otherBtn.classList.remove('border-blue-500/50', 'bg-blue-500/10');
                    const otherIcon = otherBtn.querySelector('.ph-pause-circle');
                    if (otherIcon) otherIcon.className = 'ph-fill ph-play-circle text-xl text-gray-500 group-hover:text-blue-400';
                }
            });

            // Toggle play/pause state visual
            const isPlaying = icon.classList.contains('ph-pause-circle');
            
            if (isPlaying) {
                currentBtn.classList.remove('border-blue-500/50', 'bg-blue-500/10');
                icon.className = 'ph-fill ph-play-circle text-xl text-gray-500 group-hover:text-blue-400';
            } else {
                currentBtn.classList.add('border-blue-500/50', 'bg-blue-500/10');
                icon.className = 'ph-fill ph-pause-circle text-xl text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)] rounded-full';
                UIController.showToast('Reproduciendo paisaje sonoro', 'info');
            }
        });
    });

    // Inicialización
    updateVisuals();
});