// Main JavaScript for Ideal Finance Landing Page

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeAnimations();
    initializeLoanCalculator();
    initializeTestimonialSlider();
    initializeScrollEffects();
    initializeMobileMenu();
    initializeHeroParticles();
});

// Initialize animations
function initializeAnimations() {
    // Typed.js for hero text
    if (document.getElementById('typed-text')) {
        new Typed('#typed-text', {
            strings: ['Microfinance', 'Entrepreneurship', 'Growth', 'Success'],
            typeSpeed: 100,
            backSpeed: 50,
            backDelay: 2000,
            loop: true,
            showCursor: true,
            cursorChar: '|'
        });
    }

    // Animate statistics counters when they come into view
    const counters = document.querySelectorAll('.animate-counter');
    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px 0px -100px 0px'
    };

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                counterObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    counters.forEach(counter => {
        counterObserver.observe(counter);
    });
}

// Animate counter numbers
function animateCounter(element) {
    const target = parseInt(element.getAttribute('data-target'));
    const duration = 2000; // 2 seconds
    const increment = target / (duration / 16); // 60fps
    let current = 0;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current).toLocaleString();
    }, 16);
}

// Initialize loan calculator
function initializeLoanCalculator() {
    const loanAmountSlider = document.getElementById('loanAmount');
    const loanTermSlider = document.getElementById('loanTerm');
    const interestRateSlider = document.getElementById('interestRate');
    
    const loanAmountValue = document.getElementById('loanAmountValue');
    const loanTermValue = document.getElementById('loanTermValue');
    const interestRateValue = document.getElementById('interestRateValue');
    
    const monthlyPayment = document.getElementById('monthlyPayment');
    const totalPayment = document.getElementById('totalPayment');
    const totalInterest = document.getElementById('totalInterest');
    const finalInterestRate = document.getElementById('finalInterestRate');

    if (!loanAmountSlider) return;

    function updateCalculator() {
        const principal = parseFloat(loanAmountSlider.value);
        const term = parseInt(loanTermSlider.value);
        const annualRate = parseFloat(interestRateSlider.value) / 100;
        
        // Update display values
        loanAmountValue.textContent = `ZMW ${principal.toLocaleString()}`;
        loanTermValue.textContent = `${term} months`;
        interestRateValue.textContent = `${(annualRate * 100).toFixed(1)}%`;
        
        // Calculate monthly payment using standard loan formula
        const monthlyRate = annualRate / 12;
        const monthlyPaymentAmount = principal * (monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1);
        const totalPaymentAmount = monthlyPaymentAmount * term;
        const totalInterestAmount = totalPaymentAmount - principal;
        
        // Update results
        monthlyPayment.textContent = `ZMW ${monthlyPaymentAmount.toFixed(2)}`;
        totalPayment.textContent = `ZMW ${totalPaymentAmount.toFixed(2)}`;
        totalInterest.textContent = `ZMW ${totalInterestAmount.toFixed(2)}`;
        finalInterestRate.textContent = `${(annualRate * 100).toFixed(1)}% per annum`;
    }

    // Add event listeners
    loanAmountSlider.addEventListener('input', updateCalculator);
    loanTermSlider.addEventListener('input', updateCalculator);
    interestRateSlider.addEventListener('input', updateCalculator);
    
    // Initial calculation
    updateCalculator();

    // Apply loan button
    const applyLoanBtn = document.getElementById('applyLoanBtn');
    if (applyLoanBtn) {
        applyLoanBtn.addEventListener('click', function() {
            // Store loan parameters in localStorage for the portal
            const loanData = {
                amount: loanAmountSlider.value,
                term: loanTermSlider.value,
                rate: interestRateSlider.value,
                monthlyPayment: monthlyPayment.textContent,
                totalPayment: totalPayment.textContent
            };
            localStorage.setItem('loanApplication', JSON.stringify(loanData));
            window.location.href = 'portal.html';
        });
    }
}

// Initialize testimonial slider
function initializeTestimonialSlider() {
    if (document.getElementById('testimonial-slider')) {
        new Splide('#testimonial-slider', {
            type: 'loop',
            perPage: 1,
            autoplay: true,
            interval: 5000,
            pauseOnHover: true,
            arrows: false,
            pagination: true,
            gap: '2rem'
        }).mount();
    }
}

// Initialize scroll effects
function initializeScrollEffects() {
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add scroll-based animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe cards and sections for scroll animations
    document.querySelectorAll('.card-hover, .loan-calculator, .stat-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        scrollObserver.observe(el);
    });
}

// Initialize mobile menu
function initializeMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });

        // Close mobile menu when clicking on a link
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function() {
                mobileMenu.classList.add('hidden');
            });
        });
    }
}

// Initialize hero particles background
function initializeHeroParticles() {
    const heroParticles = document.getElementById('hero-particles');
    if (!heroParticles) return;

    // Create p5.js sketch for particle background
    const sketch = (p) => {
        let particles = [];
        let numParticles = 50;

        p.setup = function() {
            const canvas = p.createCanvas(heroParticles.offsetWidth, heroParticles.offsetHeight);
            canvas.parent('hero-particles');
            
            // Create particles
            for (let i = 0; i < numParticles; i++) {
                particles.push({
                    x: p.random(p.width),
                    y: p.random(p.height),
                    size: p.random(2, 6),
                    speedX: p.random(-0.5, 0.5),
                    speedY: p.random(-0.5, 0.5),
                    opacity: p.random(0.1, 0.3)
                });
            }
        };

        p.draw = function() {
            p.clear();
            
            // Update and draw particles
            particles.forEach(particle => {
                // Update position
                particle.x += particle.speedX;
                particle.y += particle.speedY;
                
                // Wrap around edges
                if (particle.x < 0) particle.x = p.width;
                if (particle.x > p.width) particle.x = 0;
                if (particle.y < 0) particle.y = p.height;
                if (particle.y > p.height) particle.y = 0;
                
                // Draw particle
                p.fill(255, 255, 255, particle.opacity * 255);
                p.noStroke();
                p.circle(particle.x, particle.y, particle.size);
            });
            
            // Draw connections between nearby particles
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dist = p.dist(particles[i].x, particles[i].y, particles[j].x, particles[j].y);
                    if (dist < 100) {
                        const alpha = p.map(dist, 0, 100, 0.1, 0);
                        p.stroke(255, 255, 255, alpha * 255);
                        p.strokeWeight(1);
                        p.line(particles[i].x, particles[i].y, particles[j].x, particles[j].y);
                    }
                }
            }
        };

        p.windowResized = function() {
            p.resizeCanvas(heroParticles.offsetWidth, heroParticles.offsetHeight);
        };
    };

    // Only initialize if p5.js is available
    if (typeof p5 !== 'undefined') {
        new p5(sketch);
    }
}

// Utility functions
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transition-all duration-300 transform translate-x-full`;
    
    // Set colors based on type
    switch (type) {
        case 'success':
            notification.className += ' bg-green-500 text-white';
            break;
        case 'error':
            notification.className += ' bg-red-500 text-white';
            break;
        case 'warning':
            notification.className += ' bg-yellow-500 text-white';
            break;
        default:
            notification.className += ' bg-blue-500 text-white';
    }
    
    notification.innerHTML = `
        <div class="flex items-center">
            <span class="flex-1">${message}</span>
            <button class="ml-4 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                </svg>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }, 5000);
}

// Handle form submissions and interactions
document.addEventListener('click', function(e) {
    // Handle service card clicks
    if (e.target.closest('.card-hover')) {
        const card = e.target.closest('.card-hover');
        
        // Add click animation
        anime({
            targets: card,
            scale: [1, 0.98, 1],
            duration: 200,
            easing: 'easeInOutQuad'
        });
    }
    
    // Handle button clicks
    if (e.target.matches('.btn-primary') || e.target.closest('.btn-primary')) {
        const button = e.target.matches('.btn-primary') ? e.target : e.target.closest('.btn-primary');
        
        // Add ripple effect
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: scale(0);
            pointer-events: none;
        `;
        
        button.style.position = 'relative';
        button.style.overflow = 'hidden';
        button.appendChild(ripple);
        
        anime({
            targets: ripple,
            scale: [0, 1],
            opacity: [1, 0],
            duration: 600,
            easing: 'easeOutExpo',
            complete: () => ripple.remove()
        });
    }
});

// Handle window resize
window.addEventListener('resize', function() {
    // Recalculate hero particles if needed
    const heroParticles = document.getElementById('hero-particles');
    if (heroParticles && window.p5Instance) {
        window.p5Instance.resizeCanvas(heroParticles.offsetWidth, heroParticles.offsetHeight);
    }
});

// Export functions for use in other files
window.IdealFinance = {
    showNotification,
    animateCounter
};