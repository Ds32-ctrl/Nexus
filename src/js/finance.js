// src/js/modules/finance.js

// Supabase Init (Usando la misma lógica del dashboard)
const SUPABASE_URL = 'https://sirytqfdlbgkcuvkquiq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpcnl0cWZkbGJna2N1dmtxdWlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5NjQwOTMsImV4cCI6MjEwNjU0MDA5M30.rv2TLpBL8_qMq_qlENS031H0neDbDJ_iQr48ohcUp-g';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', async () => {

    let userId = 'default-user-id';
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) userId = session.user.id;
    } catch (e) {
        console.warn("Modo local activado.");
    }

    // ==========================================
    // UI CONTROLLER (Toasts Locales)
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
    // GESTIÓN FINANCIERA (ESTADO Y DATOS MOCK)
    // ==========================================
    let transactions = [
        { id: 1, type: 'expense', amount: 45.50, description: 'Cena en restaurante', category: 'food', date: new Date().toISOString() },
        { id: 2, type: 'income', amount: 1200.00, description: 'Pago Proyecto Web', category: 'freelance', date: new Date(Date.now() - 86400000).toISOString() },
        { id: 3, type: 'expense', amount: 15.99, description: 'Netflix', category: 'shopping', date: new Date(Date.now() - 172800000).toISOString() },
        { id: 4, type: 'expense', amount: 25.00, description: 'Uber', category: 'transport', date: new Date(Date.now() - 259200000).toISOString() }
    ];

    let baseNetWorth = 13136.49; // Balance base antes de aplicar transacciones de la lista

    // DOM Elements
    const txContainer = document.getElementById('transactions-container');
    const elTotalNetWorth = document.getElementById('total-net-worth');
    const elTotalIncome = document.getElementById('total-income');
    const elTotalExpenses = document.getElementById('total-expenses');
    
    // Configuración de UI por categoría
    const categoryConfig = {
        food: { icon: 'ph-hamburger', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
        shopping: { icon: 'ph-shopping-bag', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
        transport: { icon: 'ph-car', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
        freelance: { icon: 'ph-laptop', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
        health: { icon: 'ph-heartbeat', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
        other: { icon: 'ph-dots-three', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' }
    };

    function formatDate(isoString) {
        const date = new Date(isoString);
        const hoy = new Date();
        if (date.toDateString() === hoy.toDateString()) return 'Hoy';
        const ayer = new Date(hoy); ayer.setDate(ayer.getDate() - 1);
        if (date.toDateString() === ayer.toDateString()) return 'Ayer';
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    }

    function calculateAndRenderSummary() {
        let currentIncome = 0;
        let currentExpense = 0;

        transactions.forEach(tx => {
            if (tx.type === 'income') currentIncome += tx.amount;
            if (tx.type === 'expense') currentExpense += tx.amount;
        });

        const currentNetWorth = baseNetWorth + currentIncome - currentExpense;

        elTotalNetWorth.textContent = `$${currentNetWorth.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        elTotalIncome.textContent = `+$${currentIncome.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        elTotalExpenses.textContent = `-$${currentExpense.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }

    function renderTransactions() {
        if (!txContainer) return;
        txContainer.innerHTML = '';

        if (transactions.length === 0) {
            txContainer.innerHTML = `<p class="text-gray-500 text-sm text-center py-8">Aún no hay transacciones este mes.</p>`;
            return;
        }

        // Ordenar por fecha (más reciente primero)
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        transactions.forEach(tx => {
            const isIncome = tx.type === 'income';
            const amountColor = isIncome ? 'text-emerald-400' : 'text-white';
            const amountPrefix = isIncome ? '+' : '-';
            const config = categoryConfig[tx.category] || categoryConfig['other'];

            const html = `
                <div class="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group relative overflow-hidden">
                    <div class="flex items-center gap-4 relative z-10">
                        <div class="w-12 h-12 rounded-xl flex items-center justify-center border ${config.color}">
                            <i class="ph-fill ${config.icon} text-xl"></i>
                        </div>
                        <div>
                            <p class="text-sm font-semibold text-white">${tx.description}</p>
                            <p class="text-xs text-gray-500 mt-0.5">${formatDate(tx.date)}</p>
                        </div>
                    </div>
                    <div class="flex flex-col items-end relative z-10">
                        <span class="text-sm font-bold ${amountColor}">${amountPrefix}$${tx.amount.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                        <button class="delete-tx text-xs text-red-400 opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex items-center gap-1" data-id="${tx.id}">
                            <i class="ph ph-trash"></i> Eliminar
                        </button>
                    </div>
                </div>
            `;
            txContainer.insertAdjacentHTML('beforeend', html);
        });

        // Eventos para eliminar transacciones
        document.querySelectorAll('.delete-tx').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                transactions = transactions.filter(t => t.id !== id);
                renderTransactions();
                calculateAndRenderSummary();
                UIController.showToast('Transacción eliminada', 'info');
                // Aquí iría el borrado en Supabase
            });
        });
    }

    // Inicializar Vista
    calculateAndRenderSummary();
    renderTransactions();

    // ==========================================
    // MODAL DE TRANSACCIONES
    // ==========================================
    const modal = document.getElementById('transaction-modal');
    const modalContent = document.getElementById('transaction-modal-content');
    const btnNewTx = document.getElementById('btn-new-transaction');
    const btnCancelTx = document.getElementById('btn-cancel-tx');
    const formTx = document.getElementById('form-transaction');

    function openModal() {
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
            formTx.reset(); // Limpiar formulario al cerrar
        }, 300);
    }

    btnNewTx?.addEventListener('click', openModal);
    btnCancelTx?.addEventListener('click', closeModal);

    formTx?.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const type = document.querySelector('input[name="tx-type"]:checked').value;
        const amount = parseFloat(document.getElementById('tx-amount').value);
        const description = document.getElementById('tx-description').value.trim();
        const category = document.getElementById('tx-category').value;

        if (!amount || amount <= 0 || !description) {
            UIController.showToast('Por favor, ingresa un monto válido y una descripción.', 'warning');
            return;
        }

        const newTx = {
            id: Date.now(),
            type,
            amount,
            description,
            category,
            date: new Date().toISOString()
        };

        // En un entorno real, guardaríamos en Supabase aquí
        transactions.push(newTx);
        
        renderTransactions();
        calculateAndRenderSummary();
        closeModal();
        UIController.showToast(type === 'income' ? 'Ingreso registrado correctamente' : 'Gasto registrado correctamente', 'success');
    });

    // Acción extra: Exportar
    document.getElementById('btn-export')?.addEventListener('click', () => {
        UIController.showToast('Generando archivo CSV... (Mockup)', 'info');
    });
});