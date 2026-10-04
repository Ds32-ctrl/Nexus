// src/js/modules/finance_advanced.js
import { supabase } from './supabaseClient.js';

document.addEventListener('DOMContentLoaded', async () => {
    // ==========================================
    // 1. ESTADO GLOBAL Y REFERENCIAS
    // ==========================================
    let currentUser = null;
    let chartInstance = null; // <-- CORRECCIÓN: Movido a la cima
    let DB = {
        transactions: [],
        goals: [],
        schedule: []
    };

    const formatCurrency = (num) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(num);
    const sanitize = (str) => str ? str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)) : '';

    // ==========================================
    // 2. CONTROLADORES UI Y MODALES
    // ==========================================
    const UIController = {
        showToast(message, type = 'success') {
            const container = document.getElementById('toast-container');
            if (!container) return;

            const icons = {
                success: '<i class="ph-fill ph-check-circle text-emerald-400 text-xl"></i>',
                warning: '<i class="ph-fill ph-warning-circle text-orange-400 text-xl"></i>',
                error: '<i class="ph-fill ph-x-circle text-red-400 text-xl"></i>',
                info: '<i class="ph-fill ph-info text-blue-400 text-xl"></i>'
            };
            const borders = {
                success: 'border-emerald-500/20',
                warning: 'border-orange-500/20',
                error: 'border-red-500/20',
                info: 'border-blue-500/20'
            };

            const toast = document.createElement('div');
            toast.className = `flex items-center gap-3 px-4 py-3 rounded-2xl glass border ${borders[type]} transform translate-y-10 opacity-0 transition-all duration-300 shadow-lg pointer-events-auto bg-black/80 z-[300]`;
            toast.innerHTML = `${icons[type]} <p class="text-sm font-medium text-white">${sanitize(message)}</p>`;

            container.appendChild(toast);
            requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.remove('translate-y-10', 'opacity-0')));
            setTimeout(() => {
                toast.classList.add('translate-y-10', 'opacity-0');
                setTimeout(() => toast.remove(), 300);
            }, 4000);
        }
    };

    const modal = document.getElementById('finance-modal');
    const modalContent = document.getElementById('finance-modal-content');
    const actionText = document.getElementById('modal-action-text');

    const formIdMap = {
        'form-tx': 'ftx-id',
        'form-goal': 'fg-id',
        'form-schedule': 'fs-id'
    };

    function openModal(targetTab = 'form-tx', isEdit = false) {
        actionText.textContent = isEdit ? 'Editar Registro' : 'Entrada de Datos';
        
        document.querySelectorAll('.tab-btn').forEach(btn => {
            if(btn.dataset.target === targetTab) {
                btn.classList.add('bg-white/10', 'text-white', 'shadow-sm');
                btn.classList.remove('text-gray-400');
            } else {
                btn.classList.remove('bg-white/10', 'text-white', 'shadow-sm');
                btn.classList.add('text-gray-400');
            }
        });

        document.querySelectorAll('.modal-form').forEach(f => f.classList.add('hidden'));
        document.getElementById(targetTab).classList.remove('hidden');

        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            modalContent.classList.remove('scale-95');
        }, 10);
    }

    function closeModal() {
        modal.classList.add('opacity-0');
        modalContent.classList.add('scale-95');
        setTimeout(() => {
            modal.classList.add('hidden');
            document.getElementById('form-tx').reset();
            document.getElementById('form-goal').reset();
            document.getElementById('form-schedule').reset();
            document.getElementById('ftx-id').value = '';
            document.getElementById('fg-id').value = '';
            document.getElementById('fs-id').value = '';
        }, 300);
    }

    // ==========================================
    // 3. FUNCIONES CORE Y RENDERIZADO
    // ==========================================
    function calculateEngine() {
        const periodFilter = document.getElementById('chart-period-filter')?.value || 'all';
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        let metrics = {
            incomeTotal: 0,
            expenseTotal: 0,
            expenseFixed: 0,
            expenseVar: 0,
            savingsAllocated: 0,
            categoryTotals: {}
        };

        DB.transactions.forEach(tx => {
            const txDate = new Date(tx.created_at);
            const isCurrentMonth = txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
            
            if (periodFilter === 'current' && !isCurrentMonth) return;

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
        const realSavings = metrics.savingsAllocated + freeCashFlow;
        const savingsRate = metrics.incomeTotal > 0 ? (realSavings / metrics.incomeTotal) * 100 : 0;

        const pureFixedExpenses = metrics.expenseFixed - metrics.savingsAllocated;
        const needsRatio = metrics.incomeTotal > 0 ? (pureFixedExpenses / metrics.incomeTotal) * 100 : 0;
        const wantsRatio = metrics.incomeTotal > 0 ? (metrics.expenseVar / metrics.incomeTotal) * 100 : 0;

        const annualFixedExpense = pureFixedExpenses > 0 ? pureFixedExpenses * 12 : 0;
        const fiNumber = annualFixedExpense * 25;

        let liquidCapital = DB.goals.reduce((acc, goal) => acc + parseFloat(goal.current_amount), 0);
        const runwayMonths = pureFixedExpenses > 0 ? (liquidCapital / pureFixedExpenses) : 0;

        renderKPIs(freeCashFlow, metrics, savingsRate, needsRatio, wantsRatio, fiNumber, runwayMonths);
        renderLists();
        renderChart(metrics.categoryTotals);
    }

    function renderKPIs(fcf, metrics, savingsRate, needsRatio, wantsRatio, fiNumber, runwayMonths) {
        const kpiFcf = document.getElementById('kpi-fcf');
        kpiFcf.textContent = formatCurrency(fcf);
        kpiFcf.className = fcf >= 0 ? 'text-4xl font-bold text-emerald-400 tracking-tighter relative z-10' : 'text-4xl font-bold text-red-400 tracking-tighter relative z-10';
        
        document.getElementById('kpi-total-income').textContent = formatCurrency(metrics.incomeTotal);
        document.getElementById('kpi-total-expense').textContent = formatCurrency(metrics.expenseTotal);

        document.getElementById('kpi-savings-rate').textContent = `${Math.max(0, savingsRate).toFixed(1)}%`;
        document.getElementById('kpi-savings-bar').style.width = `${Math.max(0, Math.min(savingsRate, 100))}%`;
        document.getElementById('kpi-savings-bar').className = savingsRate >= 20 ? 'h-full bg-emerald-500 transition-all duration-1000' : (savingsRate >= 10 ? 'h-full bg-yellow-500 transition-all duration-1000' : 'h-full bg-red-500 transition-all duration-1000');

        document.getElementById('kpi-rule-needs').textContent = `${needsRatio.toFixed(1)}%`;
        document.getElementById('bar-needs').style.width = `${Math.min(needsRatio, 100)}%`;
        document.getElementById('bar-needs').className = needsRatio <= 50 ? 'h-full bg-blue-500 transition-all duration-1000' : 'h-full bg-red-500 transition-all duration-1000';

        document.getElementById('kpi-rule-wants').textContent = `${wantsRatio.toFixed(1)}%`;
        document.getElementById('bar-wants').style.width = `${Math.min(wantsRatio, 100)}%`;
        document.getElementById('bar-wants').className = wantsRatio <= 30 ? 'h-full bg-orange-500 transition-all duration-1000' : 'h-full bg-red-500 transition-all duration-1000';

        document.getElementById('kpi-runway').textContent = `${runwayMonths.toFixed(1)} Meses`;
        document.getElementById('kpi-fi-number').textContent = formatCurrency(fiNumber);
    }

    function renderLists() {
        const periodFilter = document.getElementById('chart-period-filter')?.value || 'all';
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const filteredTx = periodFilter === 'all' 
            ? DB.transactions 
            : DB.transactions.filter(tx => new Date(tx.created_at).getMonth() === currentMonth && new Date(tx.created_at).getFullYear() === currentYear);

        const incomes = filteredTx.filter(tx => tx.type === 'income');
        const expenses = filteredTx.filter(tx => tx.type === 'expense');

        document.getElementById('lbl-total-incomes').textContent = `${incomes.length} Registros`;
        document.getElementById('lbl-total-expenses').textContent = `${expenses.length} Registros`;

        const listIncomes = document.getElementById('list-incomes');
        if (incomes.length === 0) {
            listIncomes.innerHTML = `<div class="flex flex-col items-center justify-center h-full opacity-50"><i class="ph-thin ph-receipt text-4xl text-gray-500 mb-2"></i><p class="text-xs text-gray-400 text-center">Sin ingresos en el periodo.</p></div>`;
        } else {
            listIncomes.innerHTML = incomes.map(i => `
                <div class="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5 hover:border-emerald-500/30 transition-colors group relative cursor-pointer edit-btn" data-id="${i.id}" data-type="tx">
                    <div class="flex-1">
                        <p class="text-sm font-medium text-white">${sanitize(i.description)} <span class="text-[10px] bg-white/10 text-gray-300 px-2 py-0.5 rounded ml-2">${sanitize(i.owner)}</span></p>
                        <p class="text-xs text-gray-500">${sanitize(i.category)} | <span class="${i.nature === 'Fijo' ? 'text-emerald-400' : 'text-blue-400'}">${i.nature}</span></p>
                    </div>
                    <div class="text-right flex flex-col items-end">
                        <span class="block font-bold text-emerald-400">${formatCurrency(i.amount)}</span>
                        <button class="delete-btn text-[10px] text-red-400 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider" data-id="${i.id}" data-table="finance_transactions">Eliminar</button>
                    </div>
                </div>
            `).join('');
        }

        const listExpenses = document.getElementById('list-expenses');
        if (expenses.length === 0) {
            listExpenses.innerHTML = `<div class="flex flex-col items-center justify-center h-full opacity-50"><i class="ph-thin ph-shopping-cart text-4xl text-gray-500 mb-2"></i><p class="text-xs text-gray-400 text-center">Sin gastos en el periodo.</p></div>`;
        } else {
            listExpenses.innerHTML = expenses.map(e => `
                <div class="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5 hover:border-red-500/30 transition-colors group relative cursor-pointer edit-btn" data-id="${e.id}" data-type="tx">
                    <div class="flex-1">
                        <p class="text-sm font-medium text-white">${sanitize(e.description)} <span class="text-[10px] bg-white/10 text-gray-300 px-2 py-0.5 rounded ml-2">${sanitize(e.owner)}</span></p>
                        <p class="text-xs text-gray-500">${sanitize(e.category)} | <span class="${e.nature === 'Fijo' ? 'text-red-400' : 'text-orange-400'}">${e.nature}</span></p>
                    </div>
                    <div class="text-right flex flex-col items-end">
                        <span class="block font-bold text-white">${formatCurrency(e.amount)}</span>
                        <button class="delete-btn text-[10px] text-red-400 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider" data-id="${e.id}" data-table="finance_transactions">Eliminar</button>
                    </div>
                </div>
            `).join('');
        }

        const listGoals = document.getElementById('list-goals');
        if (DB.goals.length === 0) {
            listGoals.innerHTML = `<div class="flex flex-col items-center justify-center h-full opacity-50"><p class="text-xs text-gray-400 text-center">Sin fondos o proyectos.</p></div>`;
        } else {
            listGoals.innerHTML = DB.goals.map(g => {
                const pct = Math.min((g.current_amount / g.target_amount) * 100, 100);
                return `
                <div class="p-4 rounded-xl bg-white/5 border border-white/5 group relative cursor-pointer edit-btn" data-id="${g.id}" data-type="goal">
                    <div class="flex justify-between items-center mb-2">
                        <p class="text-sm font-medium text-white">${sanitize(g.title)}</p>
                        <div class="flex gap-2 items-center">
                            <span class="text-[10px] px-2 py-1 rounded-md bg-blue-500/20 text-blue-400 uppercase">${g.type}</span>
                            <button class="delete-btn text-gray-500 hover:text-red-400 transition-colors z-10" data-id="${g.id}" data-table="finance_goals"><i class="ph-fill ph-trash"></i></button>
                        </div>
                    </div>
                    <div class="w-full h-1.5 bg-black/50 rounded-full overflow-hidden mb-2">
                        <div class="h-full bg-gradient-to-r from-blue-500 to-indigo-500" style="width: ${pct}%"></div>
                    </div>
                    <div class="flex justify-between text-xs text-gray-400 font-mono">
                        <span>Actual: ${formatCurrency(g.current_amount)}</span>
                        <span>Meta: ${formatCurrency(g.target_amount)}</span>
                    </div>
                </div>
            `}).join('');
        }

        const listSchedule = document.getElementById('list-schedule');
        if (DB.schedule.length === 0) {
            listSchedule.innerHTML = `<div class="flex flex-col items-center justify-center h-full opacity-50"><p class="text-xs text-gray-400 text-center">Sin agenda registrada.</p></div>`;
        } else {
            listSchedule.innerHTML = DB.schedule.map(s => `
                <div class="p-3 rounded-xl bg-white/5 border-l-2 ${s.type === 'Constante' ? 'border-orange-500' : 'border-purple-500'} group relative cursor-pointer edit-btn" data-id="${s.id}" data-type="schedule">
                    <button class="delete-btn absolute top-3 right-3 text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 z-10" data-id="${s.id}" data-table="finance_schedule"><i class="ph-fill ph-trash"></i></button>
                    <div class="flex items-start mb-1 pr-6">
                        <p class="text-sm font-semibold text-white">${sanitize(s.activity)}</p>
                    </div>
                    <div class="flex items-center gap-2 mb-2">
                        <span class="text-xs font-bold text-gray-300 bg-white/10 px-2 py-0.5 rounded">${s.hours_per_week}h / semana</span>
                        <span class="text-[10px] text-gray-500 uppercase">${s.type}</span>
                    </div>
                    <p class="text-[11px] text-gray-400 leading-tight"><strong>Retorno:</strong> ${sanitize(s.expected_return)}</p>
                </div>
            `).join('');
        }

        // Re-adjuntar eventos estáticos a los nuevos elementos del DOM
        attachDynamicEvents();
    }

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
    // 4. EVENTOS DEL DOM (SÍNCRONOS)
    // ==========================================
    document.getElementById('btn-open-finance-modal')?.addEventListener('click', () => openModal('form-tx'));
    document.getElementById('btn-add-goal')?.addEventListener('click', () => openModal('form-goal'));
    document.getElementById('btn-add-schedule')?.addEventListener('click', () => openModal('form-schedule'));
    document.getElementById('btn-close-finance-modal')?.addEventListener('click', closeModal);
    document.getElementById('chart-period-filter')?.addEventListener('change', calculateEngine);

    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const target = e.currentTarget.dataset.target;
            const hiddenInputId = formIdMap[target];
            const isEdit = !!document.getElementById(hiddenInputId).value;
            openModal(target, isEdit);
        });
    });

    function attachDynamicEvents() {
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation(); 
                if(!confirm('¿Estás seguro de eliminar este registro?')) return;
                
                const table = e.currentTarget.dataset.table;
                const id = e.currentTarget.dataset.id;
                
                try {
                    const { error } = await supabase.from(table).delete().eq('id', id);
                    if (error) throw error;
                    
                    if (table === 'finance_transactions') DB.transactions = DB.transactions.filter(t => t.id !== id);
                    if (table === 'finance_goals') DB.goals = DB.goals.filter(g => g.id !== id);
                    if (table === 'finance_schedule') DB.schedule = DB.schedule.filter(s => s.id !== id);
                    
                    calculateEngine();
                    UIController.showToast('Registro eliminado con éxito.', 'info');
                } catch (error) {
                    UIController.showToast('Error eliminando: ' + error.message, 'error');
                }
            });
        });

        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (e.target.closest('.delete-btn')) return;
                
                const id = e.currentTarget.dataset.id;
                const type = e.currentTarget.dataset.type;

                if (type === 'tx') {
                    const record = DB.transactions.find(t => t.id === id);
                    document.getElementById('ftx-id').value = record.id;
                    document.querySelector(`input[name="ftx-type"][value="${record.type}"]`).checked = true;
                    document.getElementById('ftx-date').value = record.created_at.split('T')[0];
                    document.getElementById('ftx-amount').value = record.amount;
                    document.getElementById('ftx-nature').value = record.nature;
                    document.getElementById('ftx-category').value = record.category;
                    document.getElementById('ftx-owner').value = record.owner || '';
                    document.getElementById('ftx-desc').value = record.description;
                    openModal('form-tx', true);
                } else if (type === 'goal') {
                    const record = DB.goals.find(g => g.id === id);
                    document.getElementById('fg-id').value = record.id;
                    document.querySelector(`input[name="fg-type"][value="${record.type}"]`).checked = true;
                    document.getElementById('fg-title').value = record.title;
                    document.getElementById('fg-target').value = record.target_amount;
                    document.getElementById('fg-current').value = record.current_amount;
                    openModal('form-goal', true);
                } else if (type === 'schedule') {
                    const record = DB.schedule.find(s => s.id === id);
                    document.getElementById('fs-id').value = record.id;
                    document.querySelector(`input[name="fs-type"][value="${record.type}"]`).checked = true;
                    document.getElementById('fs-activity').value = record.activity;
                    document.getElementById('fs-hours').value = record.hours_per_week;
                    document.getElementById('fs-return').value = record.expected_return;
                    openModal('form-schedule', true);
                }
            });
        });
    }

    // Formularios
    document.getElementById('form-tx').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUser) return UIController.showToast('No autorizado', 'error');

        const id = document.getElementById('ftx-id').value;
        let dateValue = document.getElementById('ftx-date').value;
        const createdAt = dateValue ? new Date(dateValue + 'T12:00:00Z').toISOString() : new Date().toISOString();

        const payload = {
            user_id: currentUser.id,
            type: document.querySelector('input[name="ftx-type"]:checked').value,
            nature: document.getElementById('ftx-nature').value,
            category: document.getElementById('ftx-category').value,
            owner: document.getElementById('ftx-owner').value.trim() || 'General',
            description: document.getElementById('ftx-desc').value.trim(),
            amount: parseFloat(document.getElementById('ftx-amount').value),
            created_at: createdAt
        };

        try {
            if (id) {
                const { error } = await supabase.from('finance_transactions').update(payload).eq('id', id);
                if (error) throw error;
                UIController.showToast('Transacción actualizada.');
            } else {
                const { error } = await supabase.from('finance_transactions').insert([payload]);
                if (error) throw error;
                UIController.showToast('Transacción registrada.');
            }
            closeModal();
            await fetchEcosystemData();
        } catch (error) {
            UIController.showToast(error.message, 'error');
        }
    });

    document.getElementById('form-goal').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUser) return UIController.showToast('No autorizado', 'error');

        const id = document.getElementById('fg-id').value;
        const payload = {
            user_id: currentUser.id,
            type: document.querySelector('input[name="fg-type"]:checked').value,
            title: document.getElementById('fg-title').value.trim(),
            target_amount: parseFloat(document.getElementById('fg-target').value),
            current_amount: parseFloat(document.getElementById('fg-current').value) || 0
        };

        try {
            if (id) await supabase.from('finance_goals').update(payload).eq('id', id);
            else await supabase.from('finance_goals').insert([payload]);
            closeModal();
            await fetchEcosystemData();
            UIController.showToast('Meta guardada.');
        } catch (error) {
            UIController.showToast(error.message, 'error');
        }
    });

    document.getElementById('form-schedule').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUser) return UIController.showToast('No autorizado', 'error');

        const id = document.getElementById('fs-id').value;
        const payload = {
            user_id: currentUser.id,
            type: document.querySelector('input[name="fs-type"]:checked').value,
            activity: document.getElementById('fs-activity').value.trim(),
            hours_per_week: parseFloat(document.getElementById('fs-hours').value),
            expected_return: document.getElementById('fs-return').value.trim()
        };

        try {
            if (id) await supabase.from('finance_schedule').update(payload).eq('id', id);
            else await supabase.from('finance_schedule').insert([payload]);
            closeModal();
            await fetchEcosystemData();
            UIController.showToast('Horario actualizado.');
        } catch (error) {
            UIController.showToast(error.message, 'error');
        }
    });

    // ==========================================
    // 5. INICIALIZACIÓN ASÍNCRONA (AL FINAL)
    // ==========================================
    async function fetchEcosystemData() {
        try {
            const [txRes, goalsRes, schedRes] = await Promise.all([
                supabase.from('finance_transactions').select('*').order('created_at', { ascending: false }),
                supabase.from('finance_goals').select('*').order('created_at', { ascending: true }),
                supabase.from('finance_schedule').select('*').order('created_at', { ascending: true })
            ]);

            if (txRes.error) throw txRes.error;
            if (goalsRes.error) throw goalsRes.error;
            if (schedRes.error) throw schedRes.error;

            DB.transactions = txRes.data;
            DB.goals = goalsRes.data;
            DB.schedule = schedRes.data;

            calculateEngine();
        } catch (error) {
            UIController.showToast('Error obteniendo datos: ' + error.message, 'error');
        }
    }

    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
            UIController.showToast('Sin sesión activa. Los datos no se guardarán.', 'warning');
            return;
        }
        currentUser = session.user;
        await fetchEcosystemData();
    } catch(err) {
        console.error('Fallo en la carga inicial:', err);
    }
});