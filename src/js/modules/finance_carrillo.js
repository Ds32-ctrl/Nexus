// src/js/modules/finance_carrillo.js

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. BASE DE DATOS CONTABLE: MODELO CARRILLO
    // Basado en fuentes documentales (image_d6ec1c, image_d6ec3a, image_d6ec01)
    // ==========================================
    const financialEngine = {
        
        // 1. Ingresos
        incomes: {
            fixed: [
                { source: 'Daniel (Base)', amount: 1000000 },
                { source: 'Daya (Base)', amount: 1000000 }
            ],
            variable: [
                { source: 'Daza (Var 1)', amount: 300000 },
                { source: 'Daza (Var 2)', amount: 200000 }
            ]
        },

        // 2. Costos y Gastos (Libro Mayor)
        ledger: [
            // Costos Fijos Estructurales (Compartidos)
            { code: '5101', name: 'Arriendo', category: 'Fijo', daniel: 400000, daya: 400000, total: 800000 },
            { code: '5102', name: 'Recibos (Gas, Agua, Luz, Net)', category: 'Fijo', daniel: 112500, daya: 117500, total: 230000 },
            
            // Desglose Contable: 51 - COMIDA (Total 565,000)
            { code: '5110', name: 'Alimentación (Aceite)', category: 'Fijo', type: 'comida', total: 40000 },
            { code: '5111', name: 'Alimentación (Arroz)', category: 'Fijo', type: 'comida', total: 60000 },
            { code: '5112', name: 'Alimentación (Café)', category: 'Fijo', type: 'comida', total: 25000 },
            { code: '5113', name: 'Alimentación (Granos)', category: 'Fijo', type: 'comida', total: 30000 },
            { code: '5114', name: 'Alimentación (Sopa)', category: 'Fijo', type: 'comida', total: 15000 },
            { code: '5115', name: 'Alimentación (Huevos)', category: 'Fijo', type: 'comida', total: 45000 },
            { code: '5116', name: 'Alimentación (Verduras)', category: 'Fijo', type: 'comida', total: 150000 },
            { code: '5117', name: 'Alimentación (Cosas Varias)', category: 'Fijo', type: 'comida', total: 50000 },
            { code: '5118', name: 'Alimentación (Carnes)', category: 'Fijo', type: 'comida', total: 150000 },
            
            // Desglose Contable: 52 - ASEO (Total 165,000)
            { code: '5210', name: 'Aseo (Jabón Personal)', category: 'Fijo', type: 'aseo', total: 20000 },
            { code: '5211', name: 'Aseo (Crema Dental)', category: 'Fijo', type: 'aseo', total: 40000 },
            { code: '5212', name: 'Aseo (Jabón Polvo)', category: 'Fijo', type: 'aseo', total: 30000 },
            { code: '5213', name: 'Aseo (Suavizante)', category: 'Fijo', type: 'aseo', total: 20000 },
            { code: '5214', name: 'Aseo (Olores)', category: 'Fijo', type: 'aseo', total: 15000 },
            { code: '5215', name: 'Aseo (Límpido)', category: 'Fijo', type: 'aseo', total: 4000 },
            { code: '5216', name: 'Aseo (Bolsas Aseo)', category: 'Fijo', type: 'aseo', total: 10000 },
            { code: '5217', name: 'Aseo (Lavaloza)', category: 'Fijo', type: 'aseo', total: 8000 },
            { code: '5218', name: 'Aseo (Vinagre Limpieza)', category: 'Fijo', type: 'aseo', total: 4000 },
            { code: '5219', name: 'Aseo (Pastillas Tanque)', category: 'Fijo', type: 'aseo', total: 14000 },

            // Gastos Individuales y Subcuentas
            { code: '5301', name: 'Subcuenta Daniel (-8,000)', category: 'Variable', daniel: 8000, daya: 0, total: 8000 },
            { code: '5302', name: 'Subcuenta Daniel (-14,000)', category: 'Variable', daniel: 14000, daya: 0, total: 14000 },
            { code: '5303', name: 'Subcuenta Daniel (-2,500)', category: 'Variable', daniel: 2500, daya: 0, total: 2500 },
            { code: '5304', name: 'Subcuenta Daniel (-32,000)', category: 'Variable', daniel: 32000, daya: 0, total: 32000 },
            { code: '5305', name: 'Ajuste Negativo (Daniel)', category: 'Variable', daniel: 122500, daya: 0, total: 122500 }
        ]
    };

    // ==========================================
    // 2. ALGORITMOS DE CÁLCULO CONTABLE
    // ==========================================
    function processCarrilloModel() {
        // Ingresos
        let totalIncomeFixed = financialEngine.incomes.fixed.reduce((acc, curr) => acc + curr.amount, 0);
        let totalIncomeVar = financialEngine.incomes.variable.reduce((acc, curr) => acc + curr.amount, 0);
        let totalIncome = totalIncomeFixed + totalIncomeVar;

        // Gastos
        let totalExpFixed = 0;
        let totalExpVar = 0;
        let totalComida = 0;
        let totalAseo = 0;

        financialEngine.ledger.forEach(entry => {
            if (entry.category === 'Fijo') totalExpFixed += entry.total;
            if (entry.category === 'Variable') totalExpVar += entry.total;
            
            if (entry.type === 'comida') totalComida += entry.total;
            if (entry.type === 'aseo') totalAseo += entry.total;
        });

        let totalExpenses = totalExpFixed + totalExpVar;
        let freeCashFlow = totalIncome - totalExpenses;
        let margin = ((freeCashFlow / totalIncome) * 100).toFixed(1);

        // Actualizar UI - Tarjetas Superiores
        document.getElementById('carrillo-total-income').textContent = `$${totalIncome.toLocaleString('es-CO')}`;
        document.getElementById('income-breakdown').textContent = `Fijos: $${totalIncomeFixed.toLocaleString('es-CO')} | Var: $${totalIncomeVar.toLocaleString('es-CO')}`;
        
        document.getElementById('carrillo-total-expenses').textContent = `$${totalExpenses.toLocaleString('es-CO')}`;
        document.getElementById('expense-breakdown').textContent = `Fijos: $${totalExpFixed.toLocaleString('es-CO')} | Var: $${totalExpVar.toLocaleString('es-CO')}`;

        const cashEl = document.getElementById('carrillo-free-cash');
        cashEl.textContent = `$${freeCashFlow.toLocaleString('es-CO')}`;
        cashEl.className = freeCashFlow >= 0 ? 'text-3xl font-bold text-emerald-400 tracking-tight' : 'text-3xl font-bold text-red-400 tracking-tight';
        
        document.getElementById('margin-percentage').textContent = `Margen Operativo: ${margin}%`;

        // Renderizar Libro Diario
        renderLedgerTable('all', totalComida, totalAseo);
    }

    // ==========================================
    // 3. RENDERIZADO DINÁMICO DEL LIBRO MAYOR
    // ==========================================
    function renderLedgerTable(filterType, totalComida, totalAseo) {
        const tbody = document.getElementById('ledger-body');
        tbody.innerHTML = '';

        let itemsToRender = [];

        if (filterType === 'all') {
            // Mostrar Cuentas Principales y Agrupaciones Consolidadas
            financialEngine.ledger.forEach(item => {
                if (!item.type) itemsToRender.push(item); // Mostrar Arriendo, Servicios, Variables
            });
            
            // Agrupar Consolidado de Comida (Daniel y Daya aportan 282,500 c/u)
            itemsToRender.push({
                code: '511X', name: 'Alimentación (Agrupado)', category: 'Fijo', 
                daniel: 282500, daya: 282500, total: totalComida
            });

            // Agrupar Consolidado de Aseo (Daniel y Daya aportan 82,500 c/u)
            itemsToRender.push({
                code: '521X', name: 'Aseo e Higiene (Agrupado)', category: 'Fijo', 
                daniel: 82500, daya: 82500, total: totalAseo
            });

        } else {
            // Mostrar Desglose Específico (Comida o Aseo)
            itemsToRender = financialEngine.ledger.filter(item => item.type === filterType);
        }

        // Ordenar por código
        itemsToRender.sort((a, b) => a.code.localeCompare(b.code));

        itemsToRender.forEach(row => {
            const valDaniel = row.daniel ? `$${row.daniel.toLocaleString('es-CO')}` : '-';
            const valDaya = row.daya ? `$${row.daya.toLocaleString('es-CO')}` : '-';
            const typeBadge = row.category === 'Fijo' 
                ? '<span class="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded text-[10px] uppercase border border-blue-500/20">Fijo</span>'
                : '<span class="bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded text-[10px] uppercase border border-orange-500/20">Variable</span>';

            const tr = document.createElement('tr');
            tr.className = 'border-b border-white/5 hover:bg-white/5 transition-colors group';
            tr.innerHTML = `
                <td class="py-3 px-4 font-mono text-gray-500 text-xs">${row.code}</td>
                <td class="py-3 px-4 text-white">${row.name}</td>
                <td class="py-3 px-4">${typeBadge}</td>
                <td class="py-3 px-4 text-right text-gray-400 font-mono text-xs">${valDaniel}</td>
                <td class="py-3 px-4 text-right text-gray-400 font-mono text-xs">${valDaya}</td>
                <td class="py-3 px-4 text-right font-bold text-emerald-400 font-mono text-sm">$${row.total.toLocaleString('es-CO')}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Filtros UI
    document.querySelectorAll('.btn-filter-ledger').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.btn-filter-ledger').forEach(b => {
                b.classList.remove('active', 'bg-white/10', 'text-white');
                b.classList.add('text-gray-400');
            });
            const target = e.currentTarget;
            target.classList.add('active', 'bg-white/10', 'text-white');
            target.classList.remove('text-gray-400');
            
            // Recalcular para obtener los totales consolidados
            let totalComida = 0, totalAseo = 0;
            financialEngine.ledger.forEach(entry => {
                if (entry.type === 'comida') totalComida += entry.total;
                if (entry.type === 'aseo') totalAseo += entry.total;
            });

            renderLedgerTable(target.dataset.target, totalComida, totalAseo);
        });
    });

    // Ejecutar Motor
    processCarrilloModel();
});