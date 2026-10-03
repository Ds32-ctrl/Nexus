export function initResolutions() {
    const taskCheckboxes = document.querySelectorAll('input[type="checkbox"]');
    const progressBar = document.querySelector('.bg-gradient-to-r.from-purple-500');
    const progressText = document.querySelector('.text-sm.text-gray-400');

    function updateProgress() {
        const totalTasks = taskCheckboxes.length;
        if (totalTasks === 0) return;

        const completedTasks = document.querySelectorAll('input[type="checkbox"]:checked').length;
        const percentage = Math.round((completedTasks / totalTasks) * 100);
        
        if (progressBar) progressBar.style.width = `${percentage}%`;
        
        if (progressText && progressText.textContent.includes('Progreso:')) {
            progressText.textContent = `Progreso: ${percentage}%`;
        }
    }

    taskCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            const titleElement = e.target.nextElementSibling.querySelector('p:first-child');
            
            if (isChecked) {
                titleElement.classList.remove('text-white', 'group-hover:text-purple-300');
                titleElement.classList.add('text-gray-500', 'line-through');
            } else {
                titleElement.classList.remove('text-gray-500', 'line-through');
                titleElement.classList.add('text-white', 'group-hover:text-purple-300');
            }
            updateProgress();
        });
    });

    updateProgress();
}