// src/js/modules/aph.js

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // UI CONTROLLER (Toasts & Modals)
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
            const borders = { success: 'border-emerald-500/20', info: 'border-blue-500/20', warning: 'border-orange-500/20' };

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
    // DATOS MOCK: CATÁLOGO Y PROGRESO
    // ==========================================
    // En producción, esto vendría de Supabase
    const catalogRaw = [
        { node_key: 'dev_fisico', parent_key: 'origen', label: 'Desarrollo Físico', max_level: 10, desc: 'Fuerza, resistencia y salud metabólica.' },
        { node_key: 'dev_cognitivo', parent_key: 'origen', label: 'Desarrollo Cognitivo', max_level: 10, desc: 'Enfoque, retención de información y lógica.' },
        { node_key: 'dev_financiero', parent_key: 'origen', label: 'Desarrollo Financiero', max_level: 10, desc: 'Gestión de capital, ingresos e inversiones.' },
        
        { node_key: 'fuerza', parent_key: 'dev_fisico', label: 'Levantamiento Base', max_level: 5, desc: 'Incremento de RM en compuestos básicos.' },
        { node_key: 'cardio', parent_key: 'dev_fisico', label: 'Resistencia VO2', max_level: 5, desc: 'Capacidad pulmonar y resistencia cardiovascular.' },
        
        { node_key: 'deep_work', parent_key: 'dev_cognitivo', label: 'Enfoque Profundo', max_level: 10, desc: 'Capacidad de mantener atención ininterrumpida.' },
        { node_key: 'coding', parent_key: 'dev_cognitivo', label: 'Lógica Computacional', max_level: 20, desc: 'Arquitectura de software y algoritmos.' },
        
        { node_key: 'ahorro', parent_key: 'dev_financiero', label: 'Tasa de Ahorro', max_level: 10, desc: 'Optimización de gastos fijos.' },
        { node_key: 'inversion', parent_key: 'dev_financiero', label: 'Renta Variable', max_level: 5, desc: 'Análisis de mercado y gestión de riesgo.' },
        
        { node_key: 'backend', parent_key: 'coding', label: 'Backend Ops', max_level: 10, desc: 'Bases de datos y servidores.' },
        { node_key: 'frontend', parent_key: 'coding', label: 'Frontend UI/UX', max_level: 10, desc: 'Interfaces fluidas y Glassmorphism.' }
    ];

    const userProgress = {
        'dev_fisico': { level: 4, unlocked: true },
        'fuerza': { level: 2, unlocked: true },
        'dev_cognitivo': { level: 10, unlocked: true }, // Maxed
        'coding': { level: 15, unlocked: true },
        'deep_work': { level: 8, unlocked: true },
        'backend': { level: 5, unlocked: true },
        'frontend': { level: 10, unlocked: true }, // Maxed
        'dev_financiero': { level: 3, unlocked: true },
        'ahorro': { level: 1, unlocked: true }
    };

    // ==========================================
    // ALGORITMO RADIAL PROPORCIONAL (Traducción de PHP a JS)
    // ==========================================
    const treeHierarchy = {};
    const catalog = {};
    
    // Agrupar
    catalogRaw.forEach(item => {
        if (!item.node_key) return;
        const parent = item.parent_key || 'origen';
        if (parent !== item.node_key) {
            if (!treeHierarchy[parent]) treeHierarchy[parent] = [];
            treeHierarchy[parent].push(item);
        }
        catalog[item.node_key] = item;
    });

    const weights = {};
    const dynamicCoords = { 'origen': { x: 0, y: 0 } };

    // Calcular Pesos
    function computeWeight(nodeKey, visited = {}) {
        if (visited[nodeKey]) return weights[nodeKey] || 1;
        visited[nodeKey] = true;

        if (!treeHierarchy[nodeKey] || treeHierarchy[nodeKey].length === 0) {
            weights[nodeKey] = 1;
            return 1;
        }

        let sum = 0;
        treeHierarchy[nodeKey].forEach(child => {
            sum += computeWeight(child.node_key, visited);
        });
        weights[nodeKey] = sum;
        return sum;
    }
    computeWeight('origen');

    // Distribuir Coordenadas Radiales
    function calculateProportionalRadial(nodeKey, depth, startAngle, endAngle, visited = {}) {
        if (visited[nodeKey]) return;
        visited[nodeKey] = true;

        if (!treeHierarchy[nodeKey]) return;

        const children = treeHierarchy[nodeKey];
        let totalWeight = weights[nodeKey] || 1;
        if (totalWeight <= 0) totalWeight = 1;

        let currentAngle = startAngle;

        children.forEach(child => {
            const childKey = child.node_key;
            const childWeight = weights[childKey] || 1;
            
            const sliceAngle = (childWeight / totalWeight) * (endAngle - startAngle);
            const nodeAngle = currentAngle + (sliceAngle / 2);
            
            // Distancia entre capas: 350px
            const radius = depth === 1 ? 350 : 350 + ((depth - 1) * 350);
            
            dynamicCoords[childKey] = {
                x: Math.cos(nodeAngle) * radius,
                y: Math.sin(nodeAngle) * radius
            };

            calculateProportionalRadial(childKey, depth + 1, currentAngle, currentAngle + sliceAngle, visited);
            currentAngle += sliceAngle;
        });
    }
    calculateProportionalRadial('origen', 1, 0, 2 * Math.PI);

    // ==========================================
    // CONSTRUIR NODOS Y ESTADOS
    // ==========================================
    const nodes = {
        'origen': {
            id: 'origen', label: 'Origen', x: 0, y: 0, level: 10, max: 10, 
            status: 'maxed', desc: 'El núcleo de tu sistema operativo personal.'
        }
    };

    Object.keys(catalog).forEach(key => {
        const item = catalog[key];
        const prog = userProgress[key];
        nodes[key] = {
            id: key,
            label: item.label,
            x: dynamicCoords[key]?.x || 0,
            y: dynamicCoords[key]?.y || 0,
            level: prog ? prog.level : 0,
            max: item.max_level,
            db_unlocked: prog ? prog.unlocked : false,
            parent: item.parent_key || 'origen',
            desc: item.desc
        };
    });

    // Calcular Estado (Locked, Unlocked, Maxed)
    Object.keys(nodes).forEach(key => {
        if (key === 'origen') return;
        const node = nodes[key];
        const parentNode = nodes[node.parent];
        
        const parentLevel = parentNode ? parentNode.level : 0;
        const parentMax = parentNode ? parentNode.max : 1;
        const isParentMaxed = (node.parent === 'origen' || parentLevel >= parentMax);

        if (node.level >= node.max) {
            node.status = 'maxed';
        } else if (node.level > 0 || node.db_unlocked || isParentMaxed) {
            node.status = 'unlocked';
        } else {
            node.status = 'locked';
        }
    });

    // ==========================================
    // RENDERIZAR EN EL CANVAS
    // ==========================================
    const svgContainer = document.getElementById('svg-connections');
    const nodesContainer = document.getElementById('nodes-container');
    
    function renderTree() {
        let svgHTML = '';
        let nodesHTML = '';

        Object.values(nodes).forEach(node => {
            // Dibujar línea si tiene padre
            if (node.parent && nodes[node.parent]) {
                const parent = nodes[node.parent];
                
                // Estilos de la línea según el estado
                let strokeColor = 'rgba(255,255,255,0.1)';
                let strokeWidth = '2';
                let dash = '5,5';
                
                if (node.status === 'maxed') { strokeColor = '#8b5cf6'; strokeWidth = '3'; dash = '0'; } // Purple
                else if (node.status === 'unlocked') { strokeColor = '#fcd34d'; strokeWidth = '2'; dash = '0'; } // Gold
                
                svgHTML += `<path class='tree-link' d='M ${parent.x + 5000} ${parent.y + 5000} L ${node.x + 5000} ${node.y + 5000}' stroke='${strokeColor}' stroke-width='${strokeWidth}' stroke-dasharray='${dash}' fill='none'></path>`;
            }

            // Dibujar Nodo HTML
            if (node.id === 'origen') {
                nodesHTML += `
                    <div class="node core w-36 h-36 bg-indigo-600 rounded-full flex flex-col items-center justify-center border-4 border-black shadow-[0_0_40px_rgba(79,70,229,0.5)] cursor-pointer" style="left: ${node.x}px; top: ${node.y}px;" data-id="${node.id}">
                        <span class="text-[10px] uppercase font-bold text-indigo-200 tracking-widest">Núcleo</span>
                        <strong class="font-orbitron text-2xl text-white font-black">APH</strong>
                    </div>
                `;
            } else {
                let cardStyle = '';
                let textStyle = '';
                let levelStyle = '';

                if (node.status === 'locked') {
                    cardStyle = 'bg-[#111] border-white/5 opacity-50 grayscale pointer-events-none locked-node';
                    textStyle = 'text-gray-500';
                    levelStyle = 'text-gray-600';
                } else if (node.status === 'maxed') {
                    cardStyle = 'bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)] hover:bg-indigo-500/20';
                    textStyle = 'text-white';
                    levelStyle = 'text-indigo-400';
                } else {
                    // Unlocked
                    cardStyle = 'bg-white/5 border-yellow-500/30 shadow-[0_0_10px_rgba(252,211,77,0.1)] hover:bg-white/10 hover:border-yellow-500/50';
                    textStyle = 'text-gray-200';
                    levelStyle = 'text-yellow-400';
                }

                nodesHTML += `
                    <div class="node glass-card w-40 min-h-[90px] rounded-2xl border flex flex-col items-center justify-center p-3 text-center cursor-pointer ${cardStyle}" style="left: ${node.x}px; top: ${node.y}px;" data-id="${node.id}">
                        <div class="font-orbitron text-lg font-bold mb-1 ${levelStyle}">${node.level}/${node.max}</div>
                        <div class="text-[11px] font-bold uppercase tracking-wider leading-tight ${textStyle}">${node.label}</div>
                    </div>
                `;
            }
        });

        svgContainer.innerHTML = svgHTML;
        nodesContainer.innerHTML = nodesHTML;
        
        attachNodeEvents();
    }

    // ==========================================
    // PAN & ZOOM SYSTEM
    // ==========================================
    const viewport = document.getElementById('viewport');
    const canvas = document.getElementById('canvas');
    let scale = 0.55;
    let panning = false;
    let pointX = 0;
    let pointY = 0;
    let start = { x: 0, y: 0 };

    function setTransform() { 
        canvas.style.transform = `translate(${pointX}px, ${pointY}px) scale(${scale})`; 
    }
    
    // Centrar inicialmente
    pointX = viewport.clientWidth / 2;
    pointY = viewport.clientHeight / 2;
    setTransform();

    viewport.onmousedown = (e) => {
        if(e.target.closest('.node') || e.target.closest('button')) return; 
        start = { x: e.clientX - pointX, y: e.clientY - pointY };
        panning = true;
    };
    viewport.onmouseup = () => panning = false;
    viewport.onmouseleave = () => panning = false;
    viewport.onmousemove = (e) => {
        if (!panning) return;
        pointX = (e.clientX - start.x);
        pointY = (e.clientY - start.y);
        setTransform();
    };
    viewport.onwheel = (e) => {
        e.preventDefault();
        let xs = (e.clientX - pointX) / scale;
        let ys = (e.clientY - pointY) / scale;
        let delta = (e.wheelDelta ? e.wheelDelta : -e.deltaY);
        (delta > 0) ? (scale *= 1.1) : (scale /= 1.1);
        scale = Math.max(0.1, Math.min(scale, 3.0)); 
        pointX = e.clientX - xs * scale;
        pointY = e.clientY - ys * scale;
        setTransform();
    };

    // Funciones globales para botones UI
    window.aphZoomIn = () => { scale = Math.min(scale * 1.2, 3.0); setTransform(); };
    window.aphZoomOut = () => { scale = Math.max(scale / 1.2, 0.1); setTransform(); };
    window.aphResetView = () => { scale = 0.55; pointX = viewport.clientWidth/2; pointY = viewport.clientHeight/2; setTransform(); };

    // Ocultar Ramas Bloqueadas
    let hideLocked = false;
    document.getElementById('btn-toggle-locked')?.addEventListener('click', (e) => {
        hideLocked = !hideLocked;
        const icon = e.currentTarget.querySelector('i');
        if (hideLocked) {
            icon.className = 'ph-fill ph-eye-slash';
            document.querySelectorAll('.locked-node').forEach(el => el.style.opacity = '0');
            // Ocultar lineas de nodos bloqueados es más complejo sin reconstruir, 
            // por ahora difuminamos los nodos.
        } else {
            icon.className = 'ph-fill ph-eye';
            document.querySelectorAll('.locked-node').forEach(el => el.style.opacity = '0.5');
        }
    });

    // ==========================================
    // MODAL DE HABILIDADES
    // ==========================================
    const skillModal = document.getElementById('skill-modal');
    const skillContent = document.getElementById('skill-modal-content');
    let selectedNodeId = null;

    function attachNodeEvents() {
        document.querySelectorAll('.node').forEach(el => {
            if (el.classList.contains('locked-node')) return;
            
            el.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                openSkillModal(nodes[id]);
            });
        });
    }

    function openSkillModal(node) {
        selectedNodeId = node.id;
        
        // Setup UI base en Status
        const titleEl = document.getElementById('modal-skill-title');
        const parentEl = document.getElementById('modal-skill-parent');
        const statusEl = document.getElementById('modal-skill-status');
        const levelEl = document.getElementById('modal-skill-level');
        const descEl = document.getElementById('modal-skill-desc');
        const btnUpgrade = document.getElementById('btn-upgrade-skill');
        const ringEl = document.getElementById('modal-level-ring');
        const iconEl = document.getElementById('modal-level-icon');
        const glowEl = document.getElementById('modal-glow');

        titleEl.textContent = node.label;
        parentEl.textContent = node.id === 'origen' ? 'Sistema Base' : `Rama: ${nodes[node.parent]?.label || 'Origen'}`;
        descEl.textContent = node.desc || 'Entrena esta habilidad para expandir tus capacidades en esta área.';
        levelEl.innerHTML = `${node.level}<span class="text-gray-600 text-lg">/${node.max}</span>`;

        // Reset classes
        statusEl.className = 'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 inline-block ';
        btnUpgrade.className = 'w-full py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ';
        ringEl.className = 'w-16 h-16 rounded-full border-4 flex items-center justify-center ';

        if (node.status === 'maxed' || node.id === 'origen') {
            statusEl.textContent = 'MÁXIMO NIVEL';
            statusEl.classList.add('bg-indigo-500/20', 'text-indigo-400');
            ringEl.classList.add('border-indigo-500', 'bg-indigo-500/10', 'text-indigo-400', 'shadow-[0_0_15px_rgba(99,102,241,0.3)]');
            iconEl.className = 'ph-fill ph-crown text-2xl';
            btnUpgrade.classList.add('bg-white/5', 'text-gray-400', 'cursor-not-allowed');
            btnUpgrade.innerHTML = '<i class="ph-bold ph-check-circle"></i> Maestría Alcanzada';
            glowEl.className = 'absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl -mt-10 -mr-10 pointer-events-none opacity-20 bg-indigo-500';
        } else {
            statusEl.textContent = 'EN PROGRESO';
            statusEl.classList.add('bg-yellow-500/20', 'text-yellow-400');
            ringEl.classList.add('border-yellow-500', 'bg-yellow-500/10', 'text-yellow-400');
            iconEl.className = 'ph-fill ph-trend-up text-2xl';
            btnUpgrade.classList.add('bg-indigo-500', 'hover:bg-indigo-600', 'text-white', 'shadow-[0_0_20px_rgba(99,102,241,0.3)]');
            btnUpgrade.innerHTML = '<i class="ph-bold ph-arrow-fat-up"></i> Entrenar Habilidad';
            glowEl.className = 'absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl -mt-10 -mr-10 pointer-events-none opacity-20 bg-yellow-500';
        }

        skillModal.classList.remove('hidden');
        setTimeout(() => {
            skillModal.classList.remove('opacity-0');
            skillContent.classList.remove('scale-95');
        }, 10);
    }

    document.getElementById('btn-close-skill')?.addEventListener('click', () => {
        skillModal.classList.add('opacity-0');
        skillContent.classList.add('scale-95');
        setTimeout(() => skillModal.classList.add('hidden'), 300);
        selectedNodeId = null;
    });

    document.getElementById('btn-upgrade-skill')?.addEventListener('click', () => {
        if (!selectedNodeId) return;
        const node = nodes[selectedNodeId];
        
        if (node.status === 'maxed' || node.id === 'origen') {
            UIController.showToast('Esta habilidad ya está al máximo nivel.', 'info');
            return;
        }

        // Simular subida de nivel
        node.level++;
        if (node.level >= node.max) node.status = 'maxed';
        
        // Volver a renderizar árbol
        renderTree();
        
        // Cerrar y notificar
        document.getElementById('btn-close-skill').click();
        UIController.showToast(`¡Nivel de ${node.label} aumentado a ${node.level}!`, 'success');
        
        // Aquí iría el update a Supabase:
        // supabase.from('user_skills').upsert({ user_id: userId, node_key: node.id, current_level: node.level })
    });

    // Inicializar
    renderTree();
});