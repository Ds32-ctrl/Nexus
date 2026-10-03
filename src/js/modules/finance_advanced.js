// src/js/modules/finance_advanced.js

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1 & 2. BASE DE DATOS LOCAL (Tu estructura)
    // Aquí es donde tú insertarás tus datos. He mapeado los valores de tu pizarra y cuaderno.
    // ==========================================
    const DB = {
        incomes: [
            { id: 1, type: 'Fijo', owner: 'Daniel', description: 'Salario / Contrato Fijo', amount: 1000000 },
            { id: 2, type: 'Fijo', owner: 'Daya', description: 'Salario Fijo', amount: 1000000 },
            { id: 3, type: 'Variable', owner: 'Daniel', description: 'Ingresos Extra (Proyecto A)', amount: 300000 },
            { id: 4, type: 'Variable', owner: 'Daya', description: 'Ingresos Extra (Ventas)', amount: 200000 }
        ],
        expenses: [
            // Gastos Fijos (Basados en la foto del cuaderno y pizarra)
            { id: 1, type: 'Fijo', category: 'Vivienda', description: 'Arriendo', amount: 750000 },
            { id: 2, type: 'Fijo', category: 'Servicios', description: 'Agua, Luz, Gas, Internet', amount: 230000 }, // 70k+80k+30k+50k
            { id: 3, type: 'Fijo', category: 'Alimentación', description: 'Mercado Comida (Daniel & Daya)', amount: 565000 },
            { id: 4, type: 'Fijo', category: 'Aseo', description: 'Aseo General y Personal', amount: 165000 },
            { id: 5, type: 'Fijo', category: 'Ahorro', description: 'Fondo de Emergencia (Daya)', amount: 122500 },
            { id: 6, type: 'Fijo', category: 'Ahorro', description: 'Fondo de Emergencia (Daniel)', amount: 122500 },
            // Gastos Variables
            { id: 7, type: 'Variable', category: 'Ocio', description: 'Salidas y Comidas fuera', amount: 300000 },
            { id: 8, type: 'Variable', category: 'Transporte', description: 'Transporte Mensual', amount: 140000 },
            { id: 9, type: 'Variable', category: 'Imprevistos', description: 'Cosas varias', amount: 195000 }
        ],
        goals: [
            { id: 1, type: 'Necesario', title: 'Completar Fondo de Emergencia (6 Meses)', target: 6000000, current: 1500000 },
            { id: 2, type: 'Interés', title: 'Equipamiento Workspace', target: 2000000, current: 400000 }
        ],
        schedule: [
            { id: 1, type: 'Constante', activity: 'Desarrollo Core / Trabajo Fijo', hoursPerWeek: 40, expectedReturn: 'Estabilidad y Flujo Base' },
            { id: 2, type: 'Interés', activity: 'Estudio Financiero & Coding Extra', hoursPerWeek: 15, expectedReturn: 'Aumento de Ingresos Variables en 6 meses' }
        ]
    };

    // Formateador de moneda
    const currency = (num) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(num);

    // ==========================================
    // MOTOR ALGORÍTMICO (Cálculos de Desarrollo)
    // ==========================================
    function processFinancialModel() {
        let totalIncomeFijo = 0, totalIncomeVar = 0;
        let totalExpenseFijo = 0, totalExpenseVar = 0;
        let categoryTotals = {};

        // Procesar Ingresos
        DB.incomes.forEach(inc => {
            if (inc.type === 'Fijo') totalIncomeFijo += inc.amount;
            else totalIncomeVar += inc.amount;
        });

        // Procesar Gastos
        DB.expenses.forEach(exp => {
            // No contar el ahorro/fondo de emergencia como "gasto perdido", pero sí como salida de caja
            if (exp.type === 'Fijo') totalExpenseFijo += exp.amount;
            else totalExpenseVar += exp.amount;

            if (!categoryTotals[exp.category]) categoryTotals[exp.category] = 0;
            categoryTotals[exp.category] += exp.amount;
        });

        const totalIncome = totalIncomeFijo + totalIncomeVar;
        const totalExpense = totalExpenseFijo + totalExpenseVar;
        const freeCashFlow = totalIncome - totalExpense;
        
        // Identificar el ahorro real (Fondos de emergencia en gastos fijos)
        const totalSavings = (categoryTotals['Ahorro'] || 0) + (freeCashFlow > 0 ? freeCashFlow : 0);
        const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;

        // Actualizar KPIs en la UI
        document.getElementById('kpi-ingresos').textContent = currency(totalIncome);
        document.getElementById('kpi-gastos').textContent = currency(totalExpense);
        document.getElementById('kpi-flujo').textContent = currency(freeCashFlow);
        
        const tasaEl = document.getElementById('kpi-tasa');
        const tasaBar = document.getElementById('kpi-tasa-bar');
        tasaEl.textContent = `${savingsRate.toFixed(1)}%`;
        tasaBar.style.width = `${Math.min(savingsRate, 100)}%`;
        
        if (savingsRate >= 20) tasaEl.className = 'text-2xl font-bold text-emerald-400';
        else if (savingsRate >= 10) tasaEl.className = 'text-2xl font-bold text-yellow-400';
        else tasaEl.className = 'text-2xl font-bold text-red-400';

        renderInsights(totalIncome, totalExpenseFijo, totalExpenseVar, savingsRate);
        renderCharts(categoryTotals);
        renderLists();
    }

    // ==========================================
    // 5. DIAGNÓSTICO DEL PLAN FINANCIERO
    // ==========================================
    function renderInsights(totalIncome, fixedExp, varExp, savingsRate) {
        const container = document.getElementById('algorithmic-insights');
        let html = '';

        // Regla 50/30/20
        const needsPct = ((fixedExp / totalIncome) * 100).toFixed(1);
        const wantsPct = ((varExp / totalIncome) * 100).toFixed(1);
        
        html += `
            <div class="p-4 rounded-xl bg-black/20 border border-white/5">
                <p class="text-sm font-bold text-white mb-2">Evaluación Regla 50/30/20</p>
                <div class="flex justify-between text-xs mb-1">
                    <span class="${needsPct <= 50 ? 'text-emerald-400' : 'text-red-400'}">Fijos (Necesidades): ${needsPct}%</span>
                    <span class="text-gray-500">Ideal: 50%</span>
                </div>
                <div class="flex justify-between text-xs mb-1">
                    <span class="${wantsPct <= 30 ? 'text-emerald-400' : 'text-yellow-400'}">Variables (Deseos): ${wantsPct}%</span>
                    <span class="text-gray-500">Ideal: 30%</span>
                </div>
                <div class="flex justify-between text-xs">
                    <span class="${savingsRate >= 20 ? 'text-emerald-400' : 'text-red-400'}">Ahorro/Inversión: ${savingsRate.toFixed(1)}%</span>
                    <span class="text-gray-500">Ideal: 20%</span>
                </div>
            </div>
        `;

        // Advertencias del algoritmo
        if (needsPct > 60) {
            html += `<div class="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300">
                <i class="ph-bold ph-warning"></i> <strong>Alerta de Liquidez:</strong> Tus gastos fijos superan el 60%. Eres vulnerable a reducciones de ingresos variables. Prioriza reducir arriendo o servicios.
            </div>`;
        } else {
            html += `<div class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                <i class="ph-bold ph-check-circle"></i> <strong>Salud Operativa:</strong> Tu estructura de costos fijos está controlada.
            </div>`;
        }

        container.innerHTML = html;
    }

    // ==========================================
    // RENDERIZADO DE TABLAS HTML
    // ==========================================
    function renderLists() {
        // Ingresos
        const incHtml = DB.incomes.map(i => `
            <div class="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                <div>
                    <p class="text-sm font-medium text-white">${i.description} <span class="text-[10px] bg-white/10 px-2 py-0.5 rounded ml-2">${i.owner}</span></p>
                    <p class="text-xs ${i.type === 'Fijo' ? 'text-emerald-400' : 'text-blue-400'}">${i.type}</p>
                </div>
                <span class="font-bold text-white">${currency(i.amount)}</span>
            </div>
        `).join('');
        document.getElementById('incomes-container').innerHTML = incHtml;

        // Costos
        const expHtml = DB.expenses.map(e => `
            <div class="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                <div>
                    <p class="text-sm font-medium text-white">${e.description}</p>
                    <p class="text-xs text-gray-500">${e.category} | <span class="${e.type === 'Fijo' ? 'text-red-400' : 'text-orange-400'}">${e.type}</span></p>
                </div>
                <span class="font-bold text-white">${currency(e.amount)}</span>
            </div>
        `).join('');
        document.getElementById('expenses-container').innerHTML = expHtml;

        // Metas
        const goalHtml = DB.goals.map(g => {
            const pct = (g.current / g.target) * 100;
            return `
            <div class="p-3 rounded-xl bg-white/5 border border-white/5">
                <div class="flex justify-between items-center mb-2">
                    <p class="text-sm font-medium text-white">${g.title}</p>
                    <span class="text-xs text-gray-400">${g.type}</span>
                </div>
                <div class="w-full h-1.5 bg-black/50 rounded-full overflow-hidden mb-1">
                    <div class="h-full bg-blue-500" style="width: ${pct}%"></div>
                </div>
                <div class="flex justify-between text-xs text-gray-400">
                    <span>${currency(g.current)}</span>
                    <span>Meta: ${currency(g.target)}</span>
                </div>
            </div>
        `}).join('');
        document.getElementById('goals-container').innerHTML = goalHtml;

        // Horario
        const schedHtml = DB.schedule.map(s => `
            <div class="p-3 rounded-xl bg-white/5 border border-white/5">
                <div class="flex justify-between items-center mb-1">
                    <p class="text-sm font-medium text-white">${s.activity}</p>
                    <span class="text-sm font-bold text-orange-400">${s.hoursPerWeek}h/sem</span>
                </div>
                <p class="text-xs text-gray-500"><strong>Retorno esperado:</strong> ${s.expectedReturn}</p>
            </div>
        `).join('');
        document.getElementById('schedule-container').innerHTML = schedHtml;
    }

    // ==========================================
    // GRÁFICAS (Chart.js)
    // ==========================================
    let expensesChartInstance = null;
    function renderCharts(categoryTotals) {
        const ctx = document.getElementById('expensesChart').getContext('2d');
        
        if (expensesChartInstance) expensesChartInstance.destroy();

        // Extraer categorías limpiando "Ahorro" si quieres ver solo gasto real
        const labels = Object.keys(categoryTotals);
        const data = Object.values(categoryTotals);

        expensesChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        'rgba(16, 185, 129, 0.8)', // Emerald
                        'rgba(59, 130, 246, 0.8)', // Blue
                        'rgba(249, 115, 22, 0.8)', // Orange
                        'rgba(139, 92, 246, 0.8)', // Purple
                        'rgba(239, 68, 68, 0.8)',  // Red
                        'rgba(107, 114, 128, 0.8)' // Gray
                    ],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: '#9CA3AF', font: { family: 'Inter', size: 11 } }
                    }
                }
            }
        });
    }

    // Inicializar Motor
    processFinancialModel();
});