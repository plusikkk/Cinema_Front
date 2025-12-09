document.addEventListener("DOMContentLoaded", function () {
    const canvas = document.getElementById("dustCanvas");
    const ctx = canvas.getContext("2d");
    let width, height;
    let particles = [];

    // Налаштування частинок
    const PARTICLE_COUNT = 150;
    const MAX_SIZE = 2.5;
    const MIN_SIZE = 0.5;

    function resize() {
        width = canvas.offsetWidth;
        height = canvas.offsetHeight;
        canvas.width = width;
        canvas.height = height;
        initParticles();
    }

    function initParticles() {
        particles = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                size: Math.random() * (MAX_SIZE - MIN_SIZE) + MIN_SIZE,
                // Дуже повільний рух
                speedX: (Math.random() - 0.5) * 0.2,
                speedY: (Math.random() - 0.5) * 0.2 + 0.1,
                alpha: Math.random() * 0.5 + 0.1,
                pulseSpeed: Math.random() * 0.02 + 0.005
            });
        }
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);

        particles.forEach(p => {
            p.x += p.speedX;
            p.y += p.speedY;

            p.alpha += p.pulseSpeed;
            if (p.alpha > 0.6 || p.alpha < 0.1) {
                p.pulseSpeed = -p.pulseSpeed;
            }

            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = 0;
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 250, 230, ${p.alpha})`;
            ctx.fill();
        });

        requestAnimationFrame(animate);
    }

    window.addEventListener("resize", () => setTimeout(resize, 100));
    resize();
    animate();
});



