export function initJournal() {
    const moodContainer = document.querySelector('.space-y-4 .flex.gap-2');
    
    if (moodContainer) {
        const moodButtons = moodContainer.querySelectorAll('button');
        
        moodButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Resetear todos
                moodButtons.forEach(b => {
                    b.classList.add('grayscale');
                    b.classList.replace('bg-green-500/20', 'bg-white/5');
                    b.classList.replace('border-green-500/30', 'border-white/10');
                    b.classList.replace('text-green-400', 'text-white');
                    b.classList.replace('bg-blue-500/20', 'bg-white/5');
                    b.classList.replace('border-blue-500/30', 'border-white/10');
                    b.classList.replace('text-blue-400', 'text-white');
                    b.classList.replace('bg-indigo-500/20', 'bg-white/5');
                    b.classList.replace('border-indigo-500/30', 'border-white/10');
                });

                // Activar el seleccionado
                btn.classList.remove('grayscale');
                btn.classList.replace('bg-white/5', 'bg-indigo-500/20');
                btn.classList.replace('border-white/10', 'border-indigo-500/30');
            });
        });
    }
}