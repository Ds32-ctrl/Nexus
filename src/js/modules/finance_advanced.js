// src/js/modules/finance_advanced.js

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. BASE DE DATOS (VACÍA POR DEFECTO)
    // El usuario es el único responsable de alimentar el ecosistema.
    // ==========================================
    let DB = {
        transactions: [], // Formato: { id, type: 'income'|'expense', nature: 'Fijo'|'Variable', amount, category, owner, desc, date }
        goals: [],        // Formato: { id, type: 'Necesario'|'Interés', title, target, current }
        schedule: []      // Formato: { id, type: 'Constante'|'Interés', activity, hours, expectedReturn }
    };

    // Utilidades de formato
    const formatCurrency = (num) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(num);
    const generateId = () => Date.now() + Math.floor(Math.random() * 1000);

    // ==========================================
    // 2. CONTROLADOR DE INTERFAZ (UI & Toasts)
    // ==========================================
    const UIController = {
        showToast(message, type = 'success') {
            const container = document.getElementById('toast-container');
            if (!container) return;

            const icons = {
                success: '<i class="ph-fill ph-check-circle text-emerald-400 text-xl"></i>',
                warning: '<i class="ph-fill ph-warning-circle text-orange-400 text-xl"></i>',
                info: '<i class="ph-fill ph-info text-blue-400 text-xl"></i>'
            };
            const borders = {
                success: 'border-emerald-500/20',
                warning: 'border-orange-500/20',
                info: 'border-blue-500/20'
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
    // 3. MOTOR ALGORÍTMICO Y MATEMÁTICO
    // ==========================================
    function calculateEngine() {
        let metrics = {
            incomeTotal: 0,
            expenseTotal: 0,
            expenseFixed: 0,
            expenseVar: 0,
            savingsAllocated: 0, // Dinero enviado a categorías de ahorro
            categoryTotals: {}
        };

        // 1. Clasificación de Transacciones
        DB.transactions.forEach(tx => {
            if (tx.type === 'income') {
                metrics.incomeTotal += tx.amount;
            } else if (tx.type === 'expense') {
                metrics.expenseTotal += tx.amount;
                
                if (tx.nature === 'Fijo') metrics.expenseFixed += tx.amount;
                else metrics.expenseVar += tx.amount;

                if (tx.category === 'Ahorro') metrics.savingsAllocated += tx.amount;

                // Para la gráfica
                if (!metrics.categoryTotals[tx.category]) metrics.categoryTotals[tx.category] = 0;
                metrics.categoryTotals[tx.category] += tx.amount;
            }
        });

        // 2. Cálculos de Flujo
        const freeCashFlow = metrics.incomeTotal - metrics.expenseTotal;
        
        // La tasa de ahorro real suma lo explícitamente ahorrado + el flujo libre positivo
        const realSavings = metrics.savingsAllocated + (freeCashFlow > 0 ? freeCashFlow : 0);
        const savingsRate = metrics.incomeTotal > 0 ? (realSavings / metrics.incomeTotal) * 100 : 0;

        // 3. Regla 50/30/20 (Proporciones sobre el ingreso total)
        // Descontamos el 'Ahorro' de los gastos fijos para no penalizar la regla del 50%
        const pureFixedExpenses = metrics.expenseFixed - metrics.savingsAllocated;
        const needsRatio = metrics.incomeTotal > 0 ? (pureFixedExpenses / metrics.incomeTotal) * 100 : 0;
        const wantsRatio = metrics.incomeTotal > 0 ? (metrics.expenseVar / metrics.incomeTotal) * 100 : 0;

        // 4. Métrica de Libertad Financiera (Regla del 4%)
        // Multiplicar los gastos fijos anualizados por 25
        const annualFixedExpense = pureFixedExpenses * 12;
        const fiNumber = annualFixedExpense * 25;

        // 5. Runway Operativo (Meses de supervivencia)
        // Capital líquido = Suma del 'current' de los objetivos + FCF actual
        let liquidCapital = DB.goals.reduce((acc, goal) => acc + goal.current, 0);
        liquidCapital += freeCashFlow > 0 ? freeCashFlow : 0;
        const runwayMonths = pureFixedExpenses > 0 ? (liquidCapital / pureFixedExpenses) : 0;

        // Renderizar todo
        renderKPIs(freeCashFlow, metrics, savingsRate, needsRatio, wantsRatio, fiNumber, runwayMonths);
        renderLists();
        renderChart(metrics.categoryTotals);
    }

    // ==========================================
    // 4. RENDERIZADO DE INTERFAZ (DOM)
    // ==========================================
    function renderKPIs(fcf, metrics, savingsRate, needsRatio, wantsRatio, fiNumber, runwayMonths) {
        // Flujo y Totales
        const kpiFcf = document.getElementById('kpi-fcf');
        kpiFcf.textContent = formatCurrency(fcf);
        kpiFcf.className = fcf >= 0 ? 'text-4xl font-bold text-emerald-400 tracking-tighter relative z-10' : 'text-4xl font-bold text-red-400 tracking-tighter relative z-10';
        
        document.getElementById('kpi-total-income').textContent = formatCurrency(metrics.incomeTotal);
        document.getElementById('kpi-total-expense').textContent = formatCurrency(metrics.expenseTotal);

        // Tasa de Ahorro
        document.getElementById('kpi-savings-rate').textContent = `${savingsRate.toFixed(1)}%`;
        const barSavings = document.getElementById('kpi-savings-bar');
        barSavings.style.width = `${Math.min(savingsRate, 100)}%`;
        barSavings.className = savingsRate >= 20 ? 'h-full bg-emerald-500 transition-all duration-1000' : (savingsRate >= 10 ? 'h-full bg-yellow-500 transition-all duration-1000' : 'h-full bg-red-500 transition-all duration-1000');

        // Regla 50/30/20
        document.getElementById('kpi-rule-needs').textContent = `${needsRatio.toFixed(1)}%`;
        document.getElementById('bar-needs').style.width = `${Math.min(needsRatio, 100)}%`;
        document.getElementById('bar-needs').className = needsRatio <= 50 ? 'h-full bg-blue-500 transition-all duration-1000' : 'h-full bg-red-500 transition-all duration-1000';

        document.getElementById('kpi-rule-wants').textContent = `${wantsRatio.toFixed(1)}%`;
        document.getElementById('bar-wants').style.width = `${Math.min(wantsRatio, 100)}%`;
        document.getElementById('bar-wants').className = wantsRatio <= 30 ? 'h-full bg-orange-500 transition-all duration-1000' : 'h-full bg-red-500 transition-all duration-1000';

        // Libertad y Runway
        document.getElementById('kpi-runway').textContent = `${runwayMonths.toFixed(1)} Meses`;
        document.getElementById('kpi-fi-number').textContent = formatCurrency(fiNumber);
    }

    function renderLists() {
        const listIncomes = document.getElementById('list-incomes');
        const listExpenses = document.getElementById('list-expenses');
        const listGoals = document.getElementById('list-goals');
        const listSchedule = document.getElementById('list-schedule');

        // Incomes
        const incomes = DB.transactions.filter(tx => tx.type === 'income');
        document.getElementById('lbl-total-incomes').textContent = `${incomes.length} Registros`;
        if (incomes.length === 0) {
            listIncomes.innerHTML = `<div class="flex flex-col items-center justify-center h-full opacity-50"><i class="ph-thin ph-receipt text-4xl text-gray-500 mb-2"></i><p class="text-xs text-gray-400 text-center">Sin ingresos registrados.</p></div>`;
        } else {
            listIncomes.innerHTML = incomes.map(i => `
                <div class="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5 hover:border-emerald-500/30 transition-colors group relative">
                    <div class="flex-1">
                        <p class="text-sm font-medium text-white">${i.desc} <span class="text-[10px] bg-white/10 text-gray-300 px-2 py-0.5 rounded ml-2">${i.owner}</span></p>
                        <p class="text-xs text-gray-500">${i.category} | <span class="${i.nature === 'Fijo' ? 'text-emerald-400' : 'text-blue-400'}">${i.nature}</span></p>
                    </div>
                    <div class="text-right">
                        <span class="block font-bold text-emerald-400">${formatCurrency(i.amount)}</span>
                        <button class="delete-btn text-[10px] text-red-400 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider" data-id="${i.id}" data-type="tx">Eliminar</button>
                    </div>
                </div>
            `).join('');
        }

        // Expenses
        const expenses = DB.transactions.filter(tx => tx.type === 'expense');
        document.getElementById('lbl-total-expenses').textContent = `${expenses.length} Registros`;
        if (expenses.length === 0) {
            listExpenses.innerHTML = `<div class="flex flex-col items-center justify-center h-full opacity-50"><i class="ph-thin ph-shopping-cart text-4xl text-gray-500 mb-2"></i><p class="text-xs text-gray-400 text-center">Sin gastos registrados.</p></div>`;
        } else {
            listExpenses.innerHTML = expenses.map(e => `
                <div class="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5 hover:border-red-500/30 transition-colors group relative">
                    <div class="flex-1">
                        <p class="text-sm font-medium text-white">${e.desc} <span class="text-[10px] bg-white/10 text-gray-300 px-2 py-0.5 rounded ml-2">${e.owner}</span></p>
                        <p class="text-xs text-gray-500">${e.category} | <span class="${e.nature === 'Fijo' ? 'text-red-400' : 'text-orange-400'}">${e.nature}</span></p>
                    </div>
                    <div class="text-right">
                        <span class="block font-bold text-white">${formatCurrency(e.amount)}</span>
                        <button class="delete-btn text-[10px] text-red-400 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider" data-id="${e.id}" data-type="tx">Eliminar</button>
                    </div>
                </div>
            `).join('');
        }

        // Goals
        if (DB.goals.length === 0) {
            listGoals.innerHTML = `<div class="flex flex-col items-center justify-center h-full opacity-50"><p class="text-xs text-gray-400 text-center">Define tus fondos de emergencia o proyectos.</p></div>`;
        } else {
            listGoals.innerHTML = DB.goals.map(g => {
                const pct = (g.current / g.target) * 100;
                return `
                <div class="p-4 rounded-xl bg-white/5 border border-white/5 group">
                    <div class="flex justify-between items-center mb-2">
                        <p class="text-sm font-medium text-white">${g.title}</p>
                        <div class="flex gap-2 items-center">
                            <span class="text-[10px] px-2 py-1 rounded-md bg-blue-500/20 text-blue-400 uppercase">${g.type}</span>
                            <button class="delete-btn text-gray-500 hover:text-red-400 transition-colors" data-id="${g.id}" data-type="goal"><i class="ph-fill ph-trash"></i></button>
                        </div>
                    </div>
                    <div class="w-full h-1.5 bg-black/50 rounded-full overflow-hidden mb-2">
                        <div class="h-full bg-gradient-to-r from-blue-500 to-indigo-500" style="width: ${pct}%"></div>
                    </div>
                    <div class="flex justify-between text-xs text-gray-400 font-mono">
                        <span>Actual: ${formatCurrency(g.current)}</span>
                        <span>Meta: ${formatCurrency(g.target)}</span>
                    </div>
                </div>
            `}).join('');
        }

        // Schedule
        if (DB.schedule.length === 0) {
            listSchedule.innerHTML = `<div class="flex flex-col items-center justify-center h-full opacity-50"><p class="text-xs text-gray-400 text-center">Registra actividades constantes o de interés.</p></div>`;
        } else {
            listSchedule.innerHTML = DB.schedule.map(s => `
                <div class="p-3 rounded-xl bg-white/5 border-l-2 ${s.type === 'Constante' ? 'border-orange-500' : 'border-purple-500'} group relative">
                    <button class="delete-btn absolute top-3 right-3 text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100" data-id="${s.id}" data-type="schedule"><i class="ph-fill ph-trash"></i></button>
                    <div class="flex items-start mb-1 pr-6">
                        <p class="text-sm font-semibold text-white">${s.activity}</p>
                    </div>
                    <div class="flex items-center gap-2 mb-2">
                        <span class="text-xs font-bold text-gray-300 bg-white/10 px-2 py-0.5 rounded">${s.hoursPerWeek}h / semana</span>
                        <span class="text-[10px] text-gray-500 uppercase">${s.type}</span>
                    </div>
                    <p class="text-[11px] text-gray-400 leading-tight"><strong>Retorno:</strong> ${s.expectedReturn}</p>
                </div>
            `).join('');
        }

        attachDeleteEvents();
    }

    // ==========================================
    // 5. LÓGICA DE ELIMINACIÓN Y GRAFICACIÓN
    // ==========================================
    function attachDeleteEvents() {
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                const type = e.currentTarget.dataset.type;

                if (type === 'tx') DB.transactions = DB.transactions.filter(t => t.id !== id);
                if (type === 'goal') DB.goals = DB.goals.filter(g => g.id !== id);
                if (type === 'schedule') DB.schedule = DB.schedule.filter(s => s.id !== id);

                calculateEngine();
                UIController.showToast('Registro eliminado exitosamente.', 'info');
            });
        });
    }

    let chartInstance = null;
    function renderChart(categories) {
        const ctx = document.getElementById('financeMainChart');
        if (!ctx) return;

        if (chartInstance) chartInstance.destroy();

        const labels = Object.keys(categories).length ? Object.keys(categories) : ['Sin Datos'];
        const data = Object.values(categories).length ? Object.values(categories) : [1];

        chartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#6b7280', '#ec4899', '#14b8a6'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%',
                plugins: {
                    legend: { position: 'right', labels: { color: '#9CA3AF', font: { family: 'Inter', size: 12 }, padding: 15 } },
                    tooltip: { callbacks: { label: (ctx) => ctx.label !== 'Sin Datos' ? ` ${formatCurrency(ctx.raw)}` : ' Sin Datos' } }
                }
            }
        });
    }

    // ==========================================
    // 6. GESTIÓN DEL MODAL Y FORMULARIOS
    // ==========================================
    const financeModal = document.getElementById('finance-modal');
    const modalContent = document.getElementById('finance-modal-content');
    
    // Abrir / Cerrar Modal
    document.getElementById('btn-open-finance-modal')?.addEventListener('click', () => {
        financeModal.classList.remove('hidden');
        setTimeout(() => {
            financeModal.classList.remove('opacity-0');
            modalContent.classList.remove('scale-95');
        }, 10);
    });

    document.getElementById('btn-close-finance-modal')?.addEventListener('click', () => {
        financeModal.classList.add('opacity-0');
        modalContent.classList.add('scale-95');
        setTimeout(() => financeModal.classList.add('hidden'), 300);
    });

    // Pestañas del Modal
    const tabs = document.querySelectorAll('.tab-btn');
    const forms = document.querySelectorAll('.modal-form');

    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            tabs.forEach(t => { t.classList.remove('bg-white/10', 'text-white', 'shadow-sm'); t.classList.add('text-gray-400'); });
            e.currentTarget.classList.remove('text-gray-400');
            e.currentTarget.classList.add('bg-white/10', 'text-white', 'shadow-sm');

            forms.forEach(f => f.classList.add('hidden'));
            document.getElementById(e.currentTarget.dataset.target).classList.remove('hidden');
        });
    });

    // Submit Transacción
    document.getElementById('form-tx')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const type = document.querySelector('input[name="ftx-type"]:checked').value;
        const amount = parseFloat(document.getElementById('ftx-amount').value);
        if (isNaN(amount) || amount <= 0) return UIController.showToast('Monto inválido.', 'warning');

        DB.transactions.push({
            id: generateId(),
            type: type,
            nature: document.getElementById('ftx-nature').value,
            category: document.getElementById('ftx-category').value,
            owner: document.getElementById('ftx-owner').value.trim() || 'General',
            desc: document.getElementById('ftx-desc').value.trim(),
            amount: amount,
            date: new Date().toISOString()
        });

        calculateEngine();
        e.target.reset();
        document.getElementById('btn-close-finance-modal').click();
        UIController.showToast('Transacción registrada y procesada en el motor.', 'success');
    });

    // Submit Meta / Proyecto
    document.getElementById('form-goal')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const target = parseFloat(document.getElementById('fg-target').value);
        const current = parseFloat(document.getElementById('fg-current').value) || 0;
        
        DB.goals.push({
            id: generateId(),
            type: document.querySelector('input[name="fg-type"]:checked').value,
            title: document.getElementById('fg-title').value.trim(),
            target: target,
            current: current
        });

        calculateEngine();
        e.target.reset();
        document.getElementById('btn-close-finance-modal').click();
        UIController.showToast('Proyecto registrado y capital proyectado.', 'success');
    });

    // Submit Horario
    document.getElementById('form-schedule')?.addEventListener('submit', (e) => {
        e.preventDefault();
        DB.schedule.push({
            id: generateId(),
            type: document.querySelector('input[name="fs-type"]:checked').value,
            activity: document.getElementById('fs-activity').value.trim(),
            hoursPerWeek: parseFloat(document.getElementById('fs-hours').value),
            expectedReturn: document.getElementById('fs-return').value.trim()
        });

        calculateEngine();
        e.target.reset();
        document.getElementById('btn-close-finance-modal').click();
        UIController.showToast('Horario estratégico añadido.', 'success');
    });

    // Inicializar Motor Vacío
    calculateEngine();
});