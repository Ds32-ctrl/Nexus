// src/js/modules/journal.js

// Supabase Init
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
    // ESTADO Y MOCK DATA DEL DIARIO
    // ==========================================
    let currentMood = null;
    
    // Configuración visual de estados de ánimo
    const moodConfig = {
        excellent: { icon: '😄', label: 'Excelente', color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/50' },
        good: { icon: '🙂', label: 'Bien', color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/50' },
        neutral: { icon: '😐', label: 'Neutral', color: 'text-gray-400', bg: 'bg-gray-500/20', border: 'border-gray-500/50' },
        bad: { icon: '😫', label: 'Mal', color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/50' }
    };

    let journalEntries = [
        { 
            id: 1, 
            mood: 'good', 
            content: 'Hoy logré avanzar mucho en la estructura de NexusOS. Me siento motivado porque el diseño de Glassmorphism está quedando increíble. Sin embargo, me costó un poco organizar el tiempo por la tarde.', 
            date: new Date().toISOString() 
        },
        { 
            id: 2, 
            mood: 'excellent', 
            content: 'Día súper productivo. Terminé las integraciones de Supabase y arreglé los modales para que no se usen los alert() nativos. Me siento orgulloso del resultado visual.', 
            date: new Date(Date.now() - 86400000).toISOString() 
        },
        { 
            id: 3, 
            mood: 'neutral', 
            content: 'Día tranquilo. Me enfoqué en leer y no programé tanto. Necesitaba un descanso mental para evitar el burnout.', 
            date: new Date(Date.now() - 172800000).toISOString() 
        }
    ];

    const timelineContainer = document.getElementById('journal-timeline');
    const inputContent = document.getElementById('journal-content');
    const btnSaveEntry = document.getElementById('btn-save-entry');
    const moodButtons = document.querySelectorAll('.mood-btn');
    const totalEntriesEl = document.getElementById('total-entries-count');

    // ==========================================
    // LÓGICA DE SELECCIÓN DE ÁNIMO
    // ==========================================
    moodButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const btnMood = e.currentTarget.dataset.mood;
            const config = moodConfig[btnMood];

            // Resetear todos
            moodButtons.forEach(b => {
                b.classList.add('grayscale', 'border-white/10', 'bg-white/5');
                b.classList.remove('grayscale-0', 'ring-2', 'ring-offset-2', 'ring-offset-[#050505]', 'bg-green-500/20', 'bg-blue-500/20', 'bg-gray-500/20', 'bg-red-500/20');
            });

            // Activar el seleccionado
            e.currentTarget.classList.remove('grayscale', 'border-white/10');
            e.currentTarget.classList.add('grayscale-0', config.bg);
            
            currentMood = btnMood;
        });
    });

    // Función para formatear fechas amigables
    function formatDateTime(isoString) {
        const date = new Date(isoString);
        const optionsDate = { weekday: 'long', day: 'numeric', month: 'long' };
        const optionsTime = { hour: '2-digit', minute: '2-digit' };
        
        let dateStr = date.toLocaleDateString('es-ES', optionsDate);
        dateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
        const timeStr = date.toLocaleTimeString('es-ES', optionsTime);
        
        return { dateStr, timeStr };
    }

    // ==========================================
    // RENDERIZAR LA LÍNEA DE TIEMPO
    // ==========================================
    function renderTimeline() {
        if (!timelineContainer) return;

        // Mantener la línea vertical
        timelineContainer.innerHTML = '<div class="absolute left-[15px] top-4 bottom-4 w-px bg-white/10 z-0"></div>';

        if (journalEntries.length === 0) {
            timelineContainer.innerHTML += `<p class="text-gray-500 text-sm text-center py-8 relative z-10">Tu diario está vacío. Escribe tu primera reflexión.</p>`;
            if (totalEntriesEl) totalEntriesEl.textContent = '0';
            return;
        }

        if (totalEntriesEl) totalEntriesEl.textContent = journalEntries.length;

        // Ordenar por más reciente
        journalEntries.sort((a, b) => new Date(b.date) - new Date(a.date));

        journalEntries.forEach(entry => {
            const config = moodConfig[entry.mood] || moodConfig['neutral'];
            const { dateStr, timeStr } = formatDateTime(entry.date);
            
            // Truncar texto largo para la vista previa
            const isLong = entry.content.length > 150;
            const previewText = isLong ? entry.content.substring(0, 150) + '...' : entry.content;

            const entryHtml = `
                <div class="relative pl-12 group z-10" data-id="${entry.id}">
                    <!-- Nodo en la línea de tiempo -->
                    <div class="absolute left-0 top-1.5 w-8 h-8 rounded-full ${config.bg} border border-white/10 flex items-center justify-center text-sm shadow-lg z-10 transition-transform group-hover:scale-110">
                        ${config.icon}
                    </div>
                    
                    <!-- Tarjeta de la entrada -->
                    <div class="bg-white/5 border border-white/5 rounded-2xl p-4 hover:border-white/10 hover:bg-white/10 transition-all cursor-pointer open-entry-btn">
                        <div class="flex justify-between items-start mb-2">
                            <div>
                                <span class="text-white font-medium text-sm">${dateStr}</span>
                                <span class="text-gray-500 text-xs ml-2">${timeStr}</span>
                            </div>
                            <span class="text-xs font-medium px-2 py-1 rounded-md bg-[#050505]/50 ${config.color} border border-white/5">
                                ${config.label}
                            </span>
                        </div>
                        <p class="text-gray-300 text-sm leading-relaxed">${previewText}</p>
                        ${isLong ? '<p class="text-pink-400 text-xs mt-2 font-medium">Leer más...</p>' : ''}
                    </div>
                </div>
            `;
            timelineContainer.insertAdjacentHTML('beforeend', entryHtml);
        });

        attachTimelineEvents();
    }

    // ==========================================
    // MODAL PARA LEER ENTRADA COMPLETA
    // ==========================================
    const viewModal = document.getElementById('view-entry-modal');
    const viewContent = document.getElementById('view-entry-content');
    let currentSelectedId = null;

    function attachTimelineEvents() {
        document.querySelectorAll('.open-entry-btn').forEach(card => {
            card.addEventListener('click', (e) => {
                const parent = e.target.closest('[data-id]');
                const id = parseInt(parent.dataset.id);
                const entry = journalEntries.find(t => t.id === id);
                
                if (entry) openEntryModal(entry);
            });
        });
    }

    function openEntryModal(entry) {
        currentSelectedId = entry.id;
        const config = moodConfig[entry.mood] || moodConfig['neutral'];
        const { dateStr, timeStr } = formatDateTime(entry.date);

        document.getElementById('modal-entry-date').textContent = `${dateStr} a las ${timeStr}`;
        document.getElementById('modal-entry-mood').innerHTML = `<span class="text-lg">${config.icon}</span> Me sentí <strong class="${config.color}">${config.label.toLowerCase()}</strong>`;
        document.getElementById('modal-entry-text').textContent = entry.content;

        viewModal.classList.remove('hidden');
        setTimeout(() => {
            viewModal.classList.remove('opacity-0');
            viewContent.classList.remove('scale-95');
        }, 10);
    }

    document.getElementById('btn-close-entry')?.addEventListener('click', () => {
        viewModal.classList.add('opacity-0');
        viewContent.classList.add('scale-95');
        setTimeout(() => viewModal.classList.add('hidden'), 300);
        currentSelectedId = null;
    });

    document.getElementById('btn-delete-entry')?.addEventListener('click', async () => {
        if (!currentSelectedId) return;

        journalEntries = journalEntries.filter(e => e.id !== currentSelectedId);
        renderTimeline();
        
        document.getElementById('btn-close-entry').click();
        UIController.showToast('Entrada eliminada correctamente', 'info');
        
        try { 
            await supabase.from('journal_entries').delete().eq('id', currentSelectedId); 
        } catch (err) {}
    });

    // ==========================================
    // GUARDAR NUEVA ENTRADA
    // ==========================================
    btnSaveEntry?.addEventListener('click', async () => {
        const content = inputContent.value.trim();

        if (!currentMood) {
            UIController.showToast('Por favor, selecciona cómo te sientes hoy.', 'warning');
            return;
        }

        if (!content) {
            UIController.showToast('Tu diario está vacío. Escribe algunas palabras.', 'warning');
            return;
        }

        btnSaveEntry.innerHTML = '<i class="ph-bold ph-spinner animate-spin"></i> Guardando...';
        btnSaveEntry.disabled = true;

        const newEntry = {
            id: Date.now(),
            user_id: userId,
            mood: currentMood,
            content: content,
            date: new Date().toISOString()
        };

        try {
            const { data, error } = await supabase.from('journal_entries').insert([{ 
                user_id: userId, 
                content: content, 
                mood: currentMood 
            }]).select();
            
            if (!error && data && data[0]) newEntry.id = data[0].id;
        } catch (err) {
            console.warn("Guardado local, fallo de conexión BD.");
        }

        journalEntries.unshift(newEntry);
        renderTimeline();
        
        // Reset UI
        inputContent.value = '';
        currentMood = null;
        moodButtons.forEach(b => {
            b.classList.add('grayscale', 'border-white/10', 'bg-white/5');
            b.classList.remove('grayscale-0', 'ring-2', 'bg-green-500/20', 'bg-blue-500/20', 'bg-gray-500/20', 'bg-red-500/20');
        });

        UIController.showToast('¡Reflexión guardada con éxito!', 'success');
        
        btnSaveEntry.innerHTML = '<i class="ph-bold ph-paper-plane-right"></i> Guardar';
        btnSaveEntry.disabled = false;
    });

    // Init View
    renderTimeline();
});