export function initDeepWork() {
    const timerDisplay = document.querySelector('.text-3xl.font-bold.tracking-tighter');
    const startBtn = document.querySelector('.bg-indigo-500.hover\\:bg-indigo-600');
    const stopBtn = document.querySelector('.glass.hover\\:bg-white\\/5');
    const timerCircle = document.querySelector('.transition-all.duration-1000');
    
    if (!timerDisplay || !startBtn) return;

    let timerInterval;
    const WORK_TIME = 45 * 60; // 45 minutos
    let timeLeft = WORK_TIME;
    let isRunning = false;
    const circleCircumference = 283; 

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    function updateTimerDisplay() {
        timerDisplay.textContent = formatTime(timeLeft);
        if (timerCircle) {
            const timeFraction = timeLeft / WORK_TIME;
            const strokeDashoffset = circleCircumference - (timeFraction * circleCircumference);
            timerCircle.style.strokeDashoffset = strokeDashoffset;
        }
    }

    function startTimer() {
        if (isRunning) return;
        isRunning = true;
        
        startBtn.textContent = 'Pausar';
        startBtn.classList.remove('bg-indigo-500', 'hover:bg-indigo-600');
        startBtn.classList.add('bg-orange-500', 'hover:bg-orange-600', 'shadow-[0_0_20px_rgba(249,115,22,0.3)]');

        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();

            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                isRunning = false;
                timeLeft = WORK_TIME;
                updateTimerDisplay();
                resetStartButton();
                alert('¡Sesión de Deep Work completada! Inicia tu desconexión.');
            }
        }, 1000);
    }

    function pauseTimer() {
        clearInterval(timerInterval);
        isRunning = false;
        resetStartButton();
        startBtn.textContent = 'Reanudar';
    }

    function resetStartButton() {
        startBtn.textContent = 'Iniciar';
        startBtn.classList.remove('bg-orange-500', 'hover:bg-orange-600', 'shadow-[0_0_20px_rgba(249,115,22,0.3)]');
        startBtn.classList.add('bg-indigo-500', 'hover:bg-indigo-600');
    }

    startBtn.addEventListener('click', () => {
        if (isRunning) pauseTimer();
        else startTimer();
    });

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
}