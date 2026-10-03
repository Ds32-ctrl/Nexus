// src/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    // Referencias al DOM
    const navbar = document.getElementById('navbar');

    // Efecto de Scroll para el Navbar
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 20) {
                navbar.classList.add('bg-black/40', 'backdrop-blur-xl', 'shadow-lg');
                navbar.classList.remove('border-b-0');
            } else {
                navbar.classList.remove('bg-black/40', 'backdrop-blur-xl', 'shadow-lg');
                navbar.classList.add('border-b-0');
            }
        });
    }

    // Intersection Observer para las animaciones al hacer scroll (Fade-in)
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target); // Deja de observar una vez que es visible
            }
        });
    }, observerOptions);

    // Aplicar el observador a todas las secciones con la clase .fade-in-section
    const fadeSections = document.querySelectorAll('.fade-in-section');
    fadeSections.forEach((section) => {
        observer.observe(section);
    });
});