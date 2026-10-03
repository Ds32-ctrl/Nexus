// src/js/modules/zenHabits.js

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // UI CONTROLLER (Toasts Locales)
    // ==========================================
    const UIController = {
        showToast(message, type = 'success') {
            const container = document.getElementById('toast-container');
            if (!container) return;

            const icons = {
                success: '<i class="ph-fill ph-check-circle text-emerald-400 text-xl"></i>',
                info: '<i class="ph-fill ph-info text-cyan-400 text-xl"></i>',
                warning: '<i class="ph-fill ph-warning-circle text-orange-400 text-xl"></i>'
            };
            const borders = {
                success: 'border-emerald-500/20',
                info: 'border-cyan-500/20',
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
    // 1. ZEN SCORE (Animación de Vitalidad)
    // ==========================================
    const zenScoreDisplay = document.getElementById('zen-score-display');
    const zenScoreCircle = document.getElementById('zen-score-circle');
    
    // Circunferencia del SVG (r=54) -> 2 * PI * 54 = 339.29
    const CIRCUMFERENCE = 339.29;
    
    function animateZenScore(targetScore) {
        let current = 0;
        const duration = 1500; // ms
        const interval = 20;
        const step = targetScore / (duration / interval);

        const counter = setInterval(() => {
            current += step;
            if (current >= targetScore) {
                current = targetScore;
                clearInterval(counter);
            }
            zenScoreDisplay.textContent = Math.round(current);
        }, interval);

        // Animar el SVG
        setTimeout(() => {
            const offset = CIRCUMFERENCE - ((targetScore / 100) * CIRCUMFERENCE);
            zenScoreCircle.style.strokeDashoffset = offset;
        }, 100);
    }

    // ==========================================
    // 2. INSIGHTS (Reflexiones Amigables)
    // ==========================================
    const insightsContainer = document.getElementById('insights-container');
    
    const insightsData = [
        {
            icon: 'ph-moon-stars',
            color: 'text-indigo-400',
            bg: 'bg-indigo-500/10',
            border: 'border-indigo-500/20',
            title: 'Recuperación Óptima',
            text: 'Tus métricas de descanso indican que estás respetando tus pausas. Un cerebro descansado resuelve problemas complejos más rápido. Sigue así.'
        },
        {
            icon: 'ph-plant',
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20',
            title: 'Consistencia Constante',
            text: 'Has mantenido el ritmo de tus Micro Resoluciones un 85% de la semana. No busques perfección, busca presentarte cada día.'
        },
        {
            icon: 'ph-drop-half-bottom',
            color: 'text-cyan-400',
            bg: 'bg-cyan-500/10',
            border: 'border-cyan-500/20',
            title: 'Fluir Sin Esfuerzo',
            text: 'Tu promedio de Deep Work está equilibrado. Recuerda que trabajar en estados de flujo no debe sentirse como una batalla. Ríndete al proceso.'
        }
    ];

    function renderInsights() {
        if (!insightsContainer) return;
        insightsContainer.innerHTML = '';
        
        insightsData.forEach(insight => {
            const html = `
                <div class="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <div class="w-10 h-10 rounded-xl ${insight.bg} ${insight.border} border flex items-center justify-center mb-3">
                        <i class="ph-fill ${insight.icon} ${insight.color} text-xl"></i>
                    </div>
                    <h3 class="text-sm font-semibold text-white mb-1">${insight.title}</h3>
                    <p class="text-xs text-gray-400 leading-relaxed">${insight.text}</p>
                </div>
            `;
            insightsContainer.insertAdjacentHTML('beforeend', html);
        });
    }

    // ==========================================
    // 3. JARDÍN DE HÁBITOS (Heatmap Generator)
    // ==========================================
    const heatmapContainer = document.getElementById('heatmap-container');

    function generateHeatmap() {
        if (!heatmapContainer) return;
        
        // Simular ~13 semanas (90 días aprox)
        const weeks = 20; 
        const daysPerWeek = 7;
        let html = '';

        for (let w = 0; w < weeks; w++) {
            html += `<div class="flex flex-col gap-1.5">`;
            for (let d = 0; d < daysPerWeek; d++) {
                
                // Generar un nivel de intensidad aleatorio (0 a 3)
                // Ponderado hacia el 0 y 1 para que se vea orgánico (no todos los días estamos a tope)
                const rand = Math.random();
                let level = 0;
                if (rand > 0.4) level = 1;
                if (rand > 0.7) level = 2;
                if (rand > 0.9) level = 3;

                // Si estamos en la última semana, dejar los días futuros vacíos (mock)
                if (w === weeks - 1 && d > 4) level = 0;

                // Clases de Tailwind según el nivel
                let bgClass = 'bg-white/5 border border-white/10'; // Nivel 0 (Descanso)
                
                if (level === 1) bgClass = 'bg-cyan-500/20 border border-cyan-500/20';
                if (level === 2) bgClass = 'bg-cyan-500/50 border border-cyan-500/30';
                if (level === 3) bgClass = 'bg-cyan-400 border border-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]';

                html += `
                    <div class="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[4px] transition-colors cursor-pointer hover:border-white ${bgClass}" title="Nivel de flujo: ${level}"></div>
                `;
            }
            html += `</div>`;
        }

        heatmapContainer.innerHTML = html;
    }

    // ==========================================
    // INICIALIZACIÓN DE LA VISTA
    // ==========================================
    
    // Retrasar ligeramente la animación para que se vea fluida al cargar la página
    setTimeout(() => {
        animateZenScore(84); // Puntaje Mockup (84/100)
    }, 300);
    
    renderInsights();
    generateHeatmap();

    // Evento para el botón de sincronizar
    document.getElementById('btn-sync-data')?.addEventListener('click', (e) => {
        const btn = e.currentTarget;
        const icon = btn.querySelector('i');
        
        icon.classList.add('animate-spin');
        btn.disabled = true;
        
        // Simular petición
        setTimeout(() => {
            icon.classList.remove('animate-spin');
            btn.disabled = false;
            UIController.showToast('El jardín está sincronizado y en balance.', 'info');
            
            // Volver a animar para dar feedback visual
            zenScoreCircle.style.strokeDashoffset = CIRCUMFERENCE;
            setTimeout(() => animateZenScore(86), 100);
            
            generateHeatmap(); // Regenerar mapa con un patrón ligeramente distinto
        }, 1200);
    });
});