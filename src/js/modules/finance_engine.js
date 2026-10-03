// src/js/modules/finance_engine.js

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. BASE DE DATOS (CAMPOS VACÍOS PARA TU INGRESO)
    // ==========================================
    const DB = {
        // Formato: { id, type: 'Estable'|'Variable', owner: 'Nombre', description: 'String', amount: Number }
        incomes: [],
        
        // Formato: { id, type: 'Estable'|'Variable', category: 'Vivienda|Alimentación|etc', description: 'String', amount: Number }
        expenses: [],
        
        // Formato: { id, type: 'Necesario'|'Interés', title: 'String', target: Number, current: Number }
        goals: [],
        
        // Formato: { id, type: 'Constante'|'Interés', activity: 'String', hoursPerWeek: Number, expectedReturn: 'String' }
        schedule: []
    };

    // Utilidad de formato de moneda
    const formatCurrency = (num) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(num);

    // ==========================================
    // 2. MOTOR ALGORÍTMICO FINANCIERO
    // ==========================================
    function processFinancialEngine() {
        let metrics = {
            incStable: 0, incVar: 0, 
            expStable: 0, expVar: 0,
            categoryTotals: {}
        };

        // Procesar Ingresos
        DB.incomes.forEach(inc => {
            if (inc.type === 'Estable') metrics.incStable += inc.amount;
            else metrics.incVar += inc.amount;
        });

        // Procesar Gastos y Costos
        DB.expenses.forEach(exp => {
            if (exp.type === 'Estable') metrics.expStable += exp.amount;
            else metrics.expVar += exp.amount;

            if (!metrics.categoryTotals[exp.category]) metrics.categoryTotals[exp.category] = 0;
            metrics.categoryTotals[exp.category] += exp.amount;
        });

        // Cálculos Macro
        const totalIncome = metrics.incStable + metrics.incVar;
        const totalExpense = metrics.expStable + metrics.expVar;
        const freeCashFlow = totalIncome - totalExpense;
        
        // Prevención de división por cero
        const savingsRate = totalIncome > 0 ? (freeCashFlow / totalIncome) * 100 : 0;
        const needsRatio = totalIncome > 0 ? (metrics.expStable / totalIncome) * 100 : 0;
        const wantsRatio = totalIncome > 0 ? (metrics.expVar / totalIncome) * 100 : 0;

        // Proyecciones (Libertad Financiera)
        const annualExpenses = totalExpense * 12;
        const fiNumber = annualExpenses * 25; // Regla del 4%
        const runwayMonths = metrics.expStable > 0 ? (freeCashFlow * 12) / metrics.expStable : 0; // Meses de vida si inviertes el FCF anual

        renderDashboards(totalIncome, totalExpense, freeCashFlow, savingsRate, needsRatio, wantsRatio, fiNumber, runwayMonths, metrics.categoryTotals);
        renderLists();
    }

    // ==========================================
    // 3. RENDERIZADO DE INTERFAZ
    // ==========================================
    function renderDashboards(totalInc, totalExp, fcf, saveRt, needsRt, wantsRt, fiNumber, runway, categories) {
        document.getElementById('kpi-cashflow').textContent = formatCurrency(fcf);
        document.getElementById('kpi-cashflow').className = fcf >= 0 ? 'text-5xl font-bold text-emerald-400 tracking-tighter' : 'text-5xl font-bold text-red-400 tracking-tighter';
        document.getElementById('kpi-savings-rate').textContent = `${saveRt.toFixed(1)}%`;

        document.getElementById('total-income-lbl').textContent = formatCurrency(totalInc);
        document.getElementById('total-expense-lbl').textContent = formatCurrency(totalExp);

        // Insights Algorítmicos (Plan de Desarrollo)
        const insightsHtml = `
            <div class="bg-black/30 border border-white/5 p-4 rounded-2xl">
                <p class="text-xs text-gray-500 uppercase tracking-widest mb-1">Regla 50/30/20</p>
                <div class="flex justify-between text-sm mb-1"><span class="text-gray-300">Estables (Necesidad):</span> <span class="${needsRt <= 50 ? 'text-emerald-400' : 'text-red-400'} font-bold">${needsRt.toFixed(1)}%</span></div>
                <div class="flex justify-between text-sm"><span class="text-gray-300">Variables (Deseo):</span> <span class="${wantsRt <= 30 ? 'text-emerald-400' : 'text-yellow-400'} font-bold">${wantsRt.toFixed(1)}%</span></div>
            </div>
            <div class="bg-black/30 border border-white/5 p-4 rounded-2xl">
                <p class="text-xs text-gray-500 uppercase tracking-widest mb-1">Métrica de Libertad</p>
                <p class="text-lg font-bold text-white mb-1">${formatCurrency(fiNumber)}</p>
                <p class="text-[10px] text-gray-400">Capital necesario para retiro (Regla 4%)</p>
            </div>
            <div class="bg-black/30 border border-white/5 p-4 rounded-2xl">
                <p class="text-xs text-gray-500 uppercase tracking-widest mb-1">Runway Operativo</p>
                <p class="text-lg font-bold text-white mb-1">${runway.toFixed(1)} Meses</p>
                <p class="text-[10px] text-gray-400">Basado en tu flujo de caja vs costos fijos</p>
            </div>
        `;
        document.getElementById('algorithmic-insights').innerHTML = insightsHtml;

        renderChart(categories);
    }

    function renderLists() {
        // 1. Ingresos
        const incHtml = DB.incomes.length ? DB.incomes.map(i => `
            <div class="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5 hover:border-emerald-500/30 transition-colors">
                <div>
                    <p class="text-sm font-medium text-white">${i.description} <span class="text-[10px] bg-white/10 px-2 py-0.5 rounded ml-2">${i.owner}</span></p>
                    <p class="text-xs ${i.type === 'Estable' ? 'text-emerald-400' : 'text-blue-400'}">${i.type}</p>
                </div>
                <span class="font-bold text-emerald-400">${formatCurrency(i.amount)}</span>
            </div>
        `).join('') : '<p class="text-xs text-gray-500 py-4 text-center">Sin ingresos registrados.</p>';
        document.getElementById('incomes-container').innerHTML = incHtml;

        // 2. Gastos
        const expHtml = DB.expenses.length ? DB.expenses.map(e => `
            <div class="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5 hover:border-red-500/30 transition-colors">
                <div>
                    <p class="text-sm font-medium text-white">${e.description}</p>
                    <p class="text-xs text-gray-500">${e.category} | <span class="${e.type === 'Estable' ? 'text-red-400' : 'text-orange-400'}">${e.type}</span></p>
                </div>
                <span class="font-bold text-white">${formatCurrency(e.amount)}</span>
            </div>
        `).join('') : '<p class="text-xs text-gray-500 py-4 text-center">Sin gastos registrados.</p>';
        document.getElementById('expenses-container').innerHTML = expHtml;

        // 3. Metas
        const goalsHtml = DB.goals.length ? DB.goals.map(g => {
            const pct = (g.current / g.target) * 100;
            return `
            <div class="p-4 rounded-xl bg-white/5 border border-white/5">
                <div class="flex justify-between items-center mb-2">
                    <p class="text-sm font-medium text-white">${g.title}</p>
                    <span class="text-[10px] px-2 py-1 rounded-md bg-blue-500/20 text-blue-400 uppercase">${g.type}</span>
                </div>
                <div class="w-full h-1.5 bg-black/50 rounded-full overflow-hidden mb-2">
                    <div class="h-full bg-gradient-to-r from-blue-500 to-indigo-500" style="width: ${pct}%"></div>
                </div>
                <div class="flex justify-between text-xs text-gray-400 font-mono">
                    <span>${formatCurrency(g.current)}</span>
                    <span>${formatCurrency(g.target)}</span>
                </div>
            </div>
        `}).join('') : '<p class="text-xs text-gray-500 py-4 text-center">Establece tu primer objetivo.</p>';
        document.getElementById('goals-container').innerHTML = goalsHtml;

        // 4. Horario
        const schedHtml = DB.schedule.length ? DB.schedule.map(s => `
            <div class="p-3 rounded-xl bg-white/5 border-l-2 ${s.type === 'Constante' ? 'border-orange-500' : 'border-purple-500'}">
                <div class="flex justify-between items-start mb-1">
                    <p class="text-sm font-semibold text-white">${s.activity}</p>
                    <span class="text-xs font-bold text-gray-400">${s.hoursPerWeek}h/sem</span>
                </div>
                <p class="text-[11px] text-gray-500 leading-tight"><strong>Retorno:</strong> ${s.expectedReturn}</p>
            </div>
        `).join('') : '<p class="text-xs text-gray-500 py-4 text-center">Sin actividades programadas.</p>';
        document.getElementById('schedule-container').innerHTML = schedHtml;
    }

    // ==========================================
    // 4. CHART.JS (Visualización de Costos)
    // ==========================================
    let chartInstance = null;
    function renderChart(categories) {
        const ctx = document.getElementById('financeChart');
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
                    backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#6b7280'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%',
                plugins: {
                    legend: { position: 'right', labels: { color: '#9CA3AF', font: { family: 'Inter', size: 12 } } },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label !== 'Sin Datos') {
                                    label += ': ' + formatCurrency(context.raw);
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    // Inicializar Motor
    processFinancialEngine();
});