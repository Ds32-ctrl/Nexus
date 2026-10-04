// src/js/modules/finance_advanced.js

import { supabase } from '../auth.js'; // Asumiendo que exportas la instancia de Supabase desde auth.js

document.addEventListener('DOMContentLoaded', async () => {

    let userId = null;
    const { data: { session } } = await supabase.auth.getSession();
    if (session && session.user) {
        userId = session.user.id;
    } else {
        alert("Error de autenticación. Inicia sesión para usar el control financiero.");
        return;
    }

    // Estado local sincronizado con Supabase
    let DB = {
        transactions: [],
        goals: [],
        schedule: []
    };

    const formatCurrency = (num) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(num);

    const UIController = {
        showToast(message, type = 'success') {
            const container = document.getElementById('toast-container');
            if (!container) return;
            const icons = {
                success: '<i class="ph-fill ph-check-circle text-emerald-400 text-xl"></i>',
                warning: '<i class="ph-fill ph-warning-circle text-orange-400 text-xl"></i>',
                info: '<i class="ph-fill ph-info text-blue-400 text-xl"></i>'
            };
            const borders = { success: 'border-emerald-500/20', warning: 'border-orange-500/20', info: 'border-blue-500/20' };

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
    // 1. CARGA DESDE SUPABASE
    // ==========================================
    async function loadRealData() {
        try {
            const [txRes, goalsRes, schedRes] = await Promise.all([
                supabase.from('finance_transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
                supabase.from('finance_goals').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
                supabase.from('finance_schedule').select('*').eq('user_id', userId).order('created_at', { ascending: false })
            ]);

            if (txRes.error) throw txRes.error;
            
            DB.transactions = txRes.data || [];
            DB.goals = goalsRes.data || [];
            DB.schedule = schedRes.data || [];

            calculateEngine();
        } catch (error) {
            UIController.showToast('Error cargando los datos financieros.', 'warning');
            console.error(error);
        }
    }

    // ==========================================
    // 2. MOTOR ALGORÍTMICO
    // ==========================================
    function calculateEngine() {
        let metrics = {
            incomeTotal: 0,
            expenseTotal: 0,
            expenseFixed: 0,
            expenseVar: 0,
            savingsAllocated: 0, 
            categoryTotals: {}
        };

        DB.transactions.forEach(tx => {
            const amount = parseFloat(tx.amount);
            if (tx.type === 'income') {
                metrics.incomeTotal += amount;
            } else if (tx.type === 'expense') {
                metrics.expenseTotal += amount;
                
                if (tx.nature === 'Fijo') metrics.expenseFixed += amount;
                else metrics.expenseVar += amount;

                if (tx.category === 'Ahorro') metrics.savingsAllocated += amount;

                if (!metrics.categoryTotals[tx.category]) metrics.categoryTotals[tx.category] = 0;
                metrics.categoryTotals[tx.category] += amount;
            }
        });

        const freeCashFlow = metrics.incomeTotal - metrics.expenseTotal;
        const realSavings = metrics.savingsAllocated + (freeCashFlow > 0 ? freeCashFlow : 0);
        const savingsRate = metrics.incomeTotal > 0 ? (realSavings / metrics.incomeTotal) * 100 : 0;

        const pureFixedExpenses = metrics.expenseFixed - metrics.savingsAllocated;
        const needsRatio = metrics.incomeTotal > 0 ? (pureFixedExpenses / metrics.incomeTotal) * 100 : 0;
        const wantsRatio = metrics.incomeTotal > 0 ? (metrics.expenseVar / metrics.incomeTotal) * 100 : 0;

        const annualFixedExpense = pureFixedExpenses * 12;
        const fiNumber = annualFixedExpense * 25; // Regla 4%

        let liquidCapital = DB.goals.reduce((acc, goal) => acc + parseFloat(goal.current_amount), 0);
        liquidCapital += freeCashFlow > 0 ? freeCashFlow : 0;
        const runwayMonths = pureFixedExpenses > 0 ? (liquidCapital / pureFixedExpenses) : 0;

        renderKPIs(freeCashFlow, metrics, savingsRate, needsRatio, wantsRatio, fiNumber, runwayMonths);
        renderLists();
        renderChart(metrics.categoryTotals);
    }

    // ==========================================
    // 3. RENDERIZADO AL DOM
    // ==========================================
    function renderKPIs(fcf, metrics, savingsRate, needsRatio, wantsRatio, fiNumber, runwayMonths) {
        document.getElementById('kpi-fcf').textContent = formatCurrency(fcf);
        document.getElementById('kpi-fcf').className = fcf >= 0 ? 'text-4xl font-bold text-emerald-400 tracking-tighter' : 'text-4xl font-bold text-red-400 tracking-tighter';
        
        document.getElementById('kpi-total-income').textContent = formatCurrency(metrics.incomeTotal);
        document.getElementById('kpi-total-expense').textContent = formatCurrency(metrics.expenseTotal);

        document.getElementById('kpi-savings-rate').textContent = `${savingsRate.toFixed(1)}%`;
        const barSavings = document.getElementById('kpi-savings-bar');
        barSavings.style.width = `${Math.min(savingsRate, 100)}%`;
        barSavings.className = savingsRate >= 20 ? 'h-full bg-emerald-500 transition-all' : (savingsRate >= 10 ? 'h-full bg-yellow-500 transition-all' : 'h-full bg-red-500 transition-all');

        document.getElementById('kpi-rule-needs').textContent = `${needsRatio.toFixed(1)}%`;
        document.getElementById('bar-needs').style.width = `${Math.min(needsRatio, 100)}%`;
        document.getElementById('bar-needs').className = needsRatio <= 50 ? 'h-full bg-blue-500 transition-all' : 'h-full bg-red-500 transition-all';

        document.getElementById('kpi-rule-wants').textContent = `${wantsRatio.toFixed(1)}%`;
        document.getElementById('bar-wants').style.width = `${Math.min(wantsRatio, 100)}%`;
        document.getElementById('bar-wants').className = wantsRatio <= 30 ? 'h-full bg-orange-500 transition-all' : 'h-full bg-red-500 transition-all';

        document.getElementById('kpi-runway').textContent = `${runwayMonths.toFixed(1)} Meses`;
        document.getElementById('kpi-fi-number').textContent = formatCurrency(fiNumber);
    }

    function renderLists() {
        const listIncomes = document.getElementById('list-incomes');
        const listExpenses = document.getElementById('list-expenses');
        const listGoals = document.getElementById('list-goals');
        const listSchedule = document.getElementById('list-schedule');

        const incomes = DB.transactions.filter(tx => tx.type === 'income');
        document.getElementById('lbl-total-incomes').textContent = `${incomes.length} Registros`;
        listIncomes.innerHTML = incomes.length === 0 ? `<div class="flex flex-col items-center justify-center h-full opacity-50"><p class="text-xs text-gray-400">Sin ingresos.</p></div>` : incomes.map(i => `
            <div class="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5 hover:border-emerald-500/30 group">
                <div class="flex-1">
                    <p class="text-sm font-medium text-white">${i.description} <span class="text-[10px] bg-white/10 text-gray-300 px-2 py-0.5 rounded ml-2">${i.owner}</span></p>
                    <p class="text-xs text-gray-500">${i.category} | <span class="${i.nature === 'Fijo' ? 'text-emerald-400' : 'text-blue-400'}">${i.nature}</span></p>
                </div>
                <div class="text-right">
                    <span class="block font-bold text-emerald-400">${formatCurrency(i.amount)}</span>
                    <button class="delete-btn text-[10px] text-red-400 opacity-0 group-hover:opacity-100 uppercase" data-id="${i.id}" data-table="finance_transactions">Eliminar</button>
                </div>
            </div>
        `).join('');

        const expenses = DB.transactions.filter(tx => tx.type === 'expense');
        document.getElementById('lbl-total-expenses').textContent = `${expenses.length} Registros`;
        listExpenses.innerHTML = expenses.length === 0 ? `<div class="flex flex-col items-center justify-center h-full opacity-50"><p class="text-xs text-gray-400">Sin gastos.</p></div>` : expenses.map(e => `
            <div class="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5 hover:border-red-500/30 group">
                <div class="flex-1">
                    <p class="text-sm font-medium text-white">${e.description} <span class="text-[10px] bg-white/10 text-gray-300 px-2 py-0.5 rounded ml-2">${e.owner}</span></p>
                    <p class="text-xs text-gray-500">${e.category} | <span class="${e.nature === 'Fijo' ? 'text-red-400' : 'text-orange-400'}">${e.nature}</span></p>
                </div>
                <div class="text-right">
                    <span class="block font-bold text-white">${formatCurrency(e.amount)}</span>
                    <button class="delete-btn text-[10px] text-red-400 opacity-0 group-hover:opacity-100 uppercase" data-id="${e.id}" data-table="finance_transactions">Eliminar</button>
                </div>
            </div>
        `).join('');

        listGoals.innerHTML = DB.goals.length === 0 ? `<div class="flex flex-col items-center justify-center h-full opacity-50"><p class="text-xs text-gray-400">Sin metas.</p></div>` : DB.goals.map(g => {
            const pct = (g.current_amount / g.target_amount) * 100;
            return `
            <div class="p-4 rounded-xl bg-white/5 border border-white/5 group relative">
                <button class="delete-btn absolute top-3 right-3 text-red-400 opacity-0 group-hover:opacity-100" data-id="${g.id}" data-table="finance_goals"><i class="ph-fill ph-trash"></i></button>
                <div class="flex justify-between items-center mb-2 pr-6">
                    <p class="text-sm font-medium text-white">${g.title}</p>
                    <span class="text-[10px] px-2 py-1 rounded-md bg-blue-500/20 text-blue-400 uppercase">${g.type}</span>
                </div>
                <div class="w-full h-1.5 bg-black/50 rounded-full overflow-hidden mb-2">
                    <div class="h-full bg-gradient-to-r from-blue-500 to-indigo-500" style="width: ${pct}%"></div>
                </div>
                <div class="flex justify-between text-xs text-gray-400 font-mono">
                    <span>Act: ${formatCurrency(g.current_amount)}</span>
                    <span>Meta: ${formatCurrency(g.target_amount)}</span>
                </div>
            </div>
        `}).join('');

        listSchedule.innerHTML = DB.schedule.length === 0 ? `<div class="flex flex-col items-center justify-center h-full opacity-50"><p class="text-xs text-gray-400">Sin horarios.</p></div>` : DB.schedule.map(s => `
            <div class="p-3 rounded-xl bg-white/5 border-l-2 ${s.type === 'Constante' ? 'border-orange-500' : 'border-purple-500'} group relative">
                <button class="delete-btn absolute top-3 right-3 text-red-400 opacity-0 group-hover:opacity-100" data-id="${s.id}" data-table="finance_schedule"><i class="ph-fill ph-trash"></i></button>
                <p class="text-sm font-semibold text-white pr-6">${s.activity}</p>
                <div class="flex items-center gap-2 mb-2 mt-1">
                    <span class="text-xs font-bold text-gray-300 bg-white/10 px-2 py-0.5 rounded">${s.hours_per_week}h/sem</span>
                    <span class="text-[10px] text-gray-500 uppercase">${s.type}</span>
                </div>
                <p class="text-[11px] text-gray-400 leading-tight"><strong>Retorno:</strong> ${s.expected_return}</p>
            </div>
        `).join('');

        attachDeleteEvents();
    }

    // ==========================================
    // ELIMINACIÓN Y GRAFICACIÓN
    // ==========================================
    function attachDeleteEvents() {
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                const table = e.currentTarget.dataset.table;
                
                try {
                    await supabase.from(table).delete().eq('id', id);
                    UIController.showToast('Registro eliminado', 'info');
                    loadRealData(); // Recargar DB y recalcular
                } catch (error) {
                    UIController.showToast('Error al eliminar', 'warning');
                }
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
                    borderWidth: 0, hoverOffset: 4
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false, cutout: '75%',
                plugins: {
                    legend: { position: 'right', labels: { color: '#9CA3AF', font: { family: 'Inter', size: 12 }, padding: 15 } },
                    tooltip: { callbacks: { label: (ctx) => ctx.label !== 'Sin Datos' ? ` ${formatCurrency(ctx.raw)}` : ' Sin Datos' } }
                }
            }
        });
    }

    // ==========================================
    // GESTIÓN DEL MODAL Y FORMULARIOS (CREACIÓN)
    // ==========================================
    const financeModal = document.getElementById('finance-modal');
    const modalContent = document.getElementById('finance-modal-content');
    
    document.getElementById('btn-open-finance-modal')?.addEventListener('click', () => {
        financeModal.classList.remove('hidden');
        setTimeout(() => { financeModal.classList.remove('opacity-0'); modalContent.classList.remove('scale-95'); }, 10);
    });

    document.getElementById('btn-close-finance-modal')?.addEventListener('click', () => {
        financeModal.classList.add('opacity-0'); modalContent.classList.add('scale-95');
        setTimeout(() => financeModal.classList.add('hidden'), 300);
    });

    const tabs = document.querySelectorAll('.tab-btn');
    const forms = document.querySelectorAll('.modal-form');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            tabs.forEach(t => { t.classList.remove('bg-white/10', 'text-white', 'shadow-sm'); t.classList.add('text-gray-400'); });
            e.currentTarget.classList.remove('text-gray-400'); e.currentTarget.classList.add('bg-white/10', 'text-white', 'shadow-sm');
            forms.forEach(f => f.classList.add('hidden'));
            document.getElementById(e.currentTarget.dataset.target).classList.remove('hidden');
        });
    });

    // Guardar Transacción
    document.getElementById('form-tx')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            user_id: userId,
            type: document.querySelector('input[name="ftx-type"]:checked').value,
            nature: document.getElementById('ftx-nature').value,
            category: document.getElementById('ftx-category').value,
            owner: document.getElementById('ftx-owner').value.trim() || 'General',
            description: document.getElementById('ftx-desc').value.trim(),
            amount: parseFloat(document.getElementById('ftx-amount').value)
        };
        
        await supabase.from('finance_transactions').insert([payload]);
        e.target.reset(); document.getElementById('btn-close-finance-modal').click();
        UIController.showToast('Transacción registrada', 'success');
        loadRealData();
    });

    // Guardar Meta
    document.getElementById('form-goal')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            user_id: userId,
            type: document.querySelector('input[name="fg-type"]:checked').value,
            title: document.getElementById('fg-title').value.trim(),
            target_amount: parseFloat(document.getElementById('fg-target').value),
            current_amount: parseFloat(document.getElementById('fg-current').value) || 0
        };
        await supabase.from('finance_goals').insert([payload]);
        e.target.reset(); document.getElementById('btn-close-finance-modal').click();
        UIController.showToast('Proyecto proyectado', 'success');
        loadRealData();
    });

    // Guardar Horario
    document.getElementById('form-schedule')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            user_id: userId,
            type: document.querySelector('input[name="fs-type"]:checked').value,
            activity: document.getElementById('fs-activity').value.trim(),
            hours_per_week: parseFloat(document.getElementById('fs-hours').value),
            expected_return: document.getElementById('fs-return').value.trim()
        };
        await supabase.from('finance_schedule').insert([payload]);
        e.target.reset(); document.getElementById('btn-close-finance-modal').click();
        UIController.showToast('Horario añadido', 'success');
        loadRealData();
    });

    // Arranque Inicial
    loadRealData();
});