// src/js/modules/networking.js

const SUPABASE_URL = 'https://sirytqfdlbgkcuvkquiq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpcnl0cWZkbGJna2N1dmtxdWlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5NjQwOTMsImV4cCI6MjEwNjU0MDA5M30.rv2TLpBL8_qMq_qlENS031H0neDbDJ_iQr48ohcUp-g';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', async () => {

    let userId = 'default-user-id';
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) userId = session.user.id;
    } catch (e) {
        console.warn("Modo local activado para Networking.");
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
    // ESTADO Y MOCK DATA DE NETWORKING
    // ==========================================
    let contacts = [
        { id: 1, name: 'David G.', role: 'CTO', company: 'TechNova', category: 'mentor', last_contact: new Date(Date.now() - 40 * 86400000).toISOString() }, // 40 días
        { id: 2, name: 'Laura Martínez', role: 'UX Designer', company: 'Freelance', category: 'collaborator', last_contact: new Date(Date.now() - 5 * 86400000).toISOString() }, // 5 días
        { id: 3, name: 'Carlos Ruiz', role: 'Software Engineer', company: 'Stripe', category: 'peer', last_contact: new Date(Date.now() - 15 * 86400000).toISOString() }, // 15 días
        { id: 4, name: 'Elena Torres', role: 'Angel Investor', company: 'Capital Seed', category: 'client', last_contact: new Date(Date.now() - 45 * 86400000).toISOString() } // 45 días
    ];

    let currentFilter = 'all';
    let searchQuery = '';

    const contactsContainer = document.getElementById('contacts-container');
    const keepInTouchContainer = document.getElementById('keep-in-touch-container');
    const statNetwork = document.getElementById('stat-network');
    const statCollabs = document.getElementById('stat-collabs');

    const catConfig = {
        mentor: { icon: 'ph-brain', color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'Mentor' },
        peer: { icon: 'ph-users-three', color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Par' },
        collaborator: { icon: 'ph-lightning', color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Colaborador' },
        client: { icon: 'ph-briefcase', color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Cliente/Inversor' }
    };

    // ==========================================
    // FUNCIONES DE APOYO
    // ==========================================
    function getDaysSince(isoString) {
        const diffTime = Math.abs(new Date() - new Date(isoString));
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    function getInitials(name) {
        const parts = name.split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name.substring(0, 2).toUpperCase();
    }

    // ==========================================
    // RENDERIZADO
    // ==========================================
    function renderContacts() {
        if (!contactsContainer) return;
        contactsContainer.innerHTML = '';

        // Filtrado
        let filtered = contacts;
        if (currentFilter !== 'all') {
            filtered = filtered.filter(c => c.category === currentFilter);
        }
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(c => c.name.toLowerCase().includes(query) || c.role.toLowerCase().includes(query) || c.company.toLowerCase().includes(query));
        }

        // Stats updates
        if (statNetwork) statNetwork.textContent = contacts.length;
        if (statCollabs) statCollabs.textContent = contacts.filter(c => c.category === 'collaborator').length;

        if (filtered.length === 0) {
            contactsContainer.innerHTML = `<p class="text-gray-500 text-sm text-center py-8 col-span-full">No se encontraron contactos.</p>`;
        } else {
            // Ordenar alfabéticamente
            filtered.sort((a, b) => a.name.localeCompare(b.name)).forEach(c => {
                const config = catConfig[c.category];
                const days = getDaysSince(c.last_contact);
                const statusColor = days > 30 ? 'bg-orange-500' : 'bg-emerald-500';

                const cardHtml = `
                    <div class="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-blue-500/30 hover:bg-white/10 transition-colors relative group">
                        <div class="flex items-start gap-4">
                            <div class="w-12 h-12 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 border border-white/10 flex items-center justify-center text-white font-bold shrink-0 relative">
                                ${getInitials(c.name)}
                                <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full ${statusColor} border-2 border-[#1a1a1a]"></span>
                            </div>
                            
                            <div class="flex-1 overflow-hidden">
                                <h3 class="text-white font-semibold text-sm truncate">${c.name}</h3>
                                <p class="text-gray-400 text-xs truncate mb-2">${c.role} at ${c.company}</p>
                                
                                <div class="flex items-center gap-2">
                                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${config.bg} ${config.color} text-[10px] font-semibold uppercase tracking-wider border border-white/5">
                                        <i class="ph-fill ${config.icon}"></i> ${config.label}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div class="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                            <span class="text-[10px] text-gray-500">Último contacto: hace ${days} días</span>
                            <button class="btn-touch px-3 py-1.5 rounded-lg bg-white/5 hover:bg-blue-500/20 text-gray-400 hover:text-blue-400 text-xs font-medium transition-colors border border-transparent hover:border-blue-500/30" data-id="${c.id}">
                                Ping
                            </button>
                        </div>
                    </div>
                `;
                contactsContainer.insertAdjacentHTML('beforeend', cardHtml);
            });
        }

        renderKeepInTouch();
        attachCardEvents();
    }

    function renderKeepInTouch() {
        if (!keepInTouchContainer) return;
        keepInTouchContainer.innerHTML = '';

        // Filtrar contactos con más de 30 días sin interacción
        const neglected = contacts.filter(c => getDaysSince(c.last_contact) >= 30).sort((a,b) => getDaysSince(b.last_contact) - getDaysSince(a.last_contact));

        if (neglected.length === 0) {
            keepInTouchContainer.innerHTML = `
                <div class="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <i class="ph-fill ph-check-circle text-emerald-400 text-xl mb-1"></i>
                    <p class="text-xs text-emerald-400 font-medium">Relaciones al día. ¡Excelente trabajo!</p>
                </div>
            `;
            return;
        }

        neglected.forEach(c => {
            const days = getDaysSince(c.last_contact);
            const html = `
                <div class="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 group">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs text-white font-bold">${getInitials(c.name)}</div>
                        <div>
                            <p class="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">${c.name}</p>
                            <p class="text-[10px] text-orange-400"><i class="ph-fill ph-warning-circle"></i> Hace ${days} días</p>
                        </div>
                    </div>
                    <button class="btn-touch text-gray-500 hover:text-blue-400 p-1 transition-colors" data-id="${c.id}" title="Marcar contacto hoy">
                        <i class="ph-fill ph-paper-plane-right text-lg"></i>
                    </button>
                </div>
            `;
            keepInTouchContainer.insertAdjacentHTML('beforeend', html);
        });
    }

    function attachCardEvents() {
        document.querySelectorAll('.btn-touch').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                const index = contacts.findIndex(c => c.id === id);
                if (index > -1) {
                    contacts[index].last_contact = new Date().toISOString();
                    UIController.showToast(`Interacción con ${contacts[index].name} registrada.`, 'success');
                    renderContacts();
                }
            });
        });
    }

    // ==========================================
    // INTERACTIVIDAD UI (Filtros y Búsqueda)
    // ==========================================
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => {
                b.classList.remove('active', 'bg-blue-500/20', 'text-blue-400', 'border-blue-500/30');
                b.classList.add('bg-white/5', 'text-gray-300', 'border-white/10');
            });
            
            const target = e.currentTarget;
            target.classList.remove('bg-white/5', 'text-gray-300', 'border-white/10');
            target.classList.add('active', 'bg-blue-500/20', 'text-blue-400', 'border-blue-500/30');
            
            currentFilter = target.dataset.filter;
            renderContacts();
        });
    });

    document.getElementById('search-contact')?.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderContacts();
    });

    // ==========================================
    // MODAL: NUEVO CONTACTO
    // ==========================================
    const contactModal = document.getElementById('contact-modal');
    const contactContent = document.getElementById('contact-modal-content');
    
    document.getElementById('btn-add-contact')?.addEventListener('click', () => {
        contactModal.classList.remove('hidden');
        setTimeout(() => {
            contactModal.classList.remove('opacity-0');
            contactContent.classList.remove('scale-95');
            document.getElementById('contact-name').focus();
        }, 10);
    });

    document.getElementById('btn-cancel-contact')?.addEventListener('click', () => {
        contactModal.classList.add('opacity-0');
        contactContent.classList.add('scale-95');
        setTimeout(() => { contactModal.classList.add('hidden'); document.getElementById('form-contact').reset(); }, 300);
    });

    document.getElementById('form-contact')?.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newContact = {
            id: Date.now(),
            name: document.getElementById('contact-name').value.trim(),
            role: document.getElementById('contact-role').value.trim(),
            category: document.getElementById('contact-category').value,
            company: document.getElementById('contact-company').value.trim() || 'Independiente',
            last_contact: new Date().toISOString() // Asumimos que si lo agregas, interactuaste hoy
        };

        contacts.push(newContact);
        renderContacts();
        document.getElementById('btn-cancel-contact').click();
        UIController.showToast('Nuevo contacto estratégico añadido', 'success');
    });

    // Init View
    renderContacts();
});