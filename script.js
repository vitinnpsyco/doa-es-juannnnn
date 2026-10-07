/* ELEMENTOS PRINCIPAIS */

const body = document.body;
const nav = document.getElementById("nav");
const themeToggle = document.getElementById("themeToggle");
const themeRipple = document.getElementById("themeRipple");
const customValue = document.getElementById("customValue");
const donateButton = document.getElementById("donateButton");
const cursorGlow = document.querySelector(".cursor-glow");

document.querySelectorAll(".hero-title-line, .wave-title > span").forEach((line) => {
    let letterIndex = 0;
    const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
    const textNodes = [];

    while (walker.nextNode()) {
        textNodes.push(walker.currentNode);
    }

    textNodes.forEach((textNode) => {
        const parts = textNode.textContent.split(/(\s+)/);

        textNode.replaceWith(...parts.map((part) => {
            if (/^\s+$/.test(part)) {
                return document.createTextNode(part);
            }

            const word = document.createElement("span");
            word.className = "hero-title-word";
            word.replaceChildren(...Array.from(part).map((character) => {
                const letter = document.createElement("span");
                letter.className = "hero-title-letter";
                letter.textContent = character;
                letter.style.setProperty("--letter-index", letterIndex++);
                return letter;
            }));
            return word;
        }));
    });
});


/* TEMA CLARO / ESCURO */

let savedTheme = null;

try {
    savedTheme = localStorage.getItem("theme");
} catch {
    savedTheme = null;
}

if (savedTheme === "light") {
    body.classList.add("light");
}

if (themeToggle) {
    themeToggle.addEventListener("click", () => {
        body.classList.toggle("light");
        const isLight = body.classList.contains("light");

        try {
            localStorage.setItem("theme", isLight ? "light" : "dark");
        } catch {
        }

        if (themeRipple && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            const toggleBounds = themeToggle.getBoundingClientRect();
            const originX = toggleBounds.left + toggleBounds.width / 2;
            const originY = toggleBounds.top + toggleBounds.height / 2;
            const farthestCorner = Math.hypot(
                Math.max(originX, window.innerWidth - originX),
                Math.max(originY, window.innerHeight - originY)
            );
            const ring = themeRipple.querySelector(".theme-ripple-ring");

            themeRipple.dataset.theme = isLight ? "light" : "dark";
            themeRipple.style.setProperty("--ripple-x", `${originX}px`);
            themeRipple.style.setProperty("--ripple-y", `${originY}px`);
            themeRipple.getAnimations().forEach((animation) => animation.cancel());
            ring?.getAnimations().forEach((animation) => animation.cancel());

            themeRipple.animate(
                [
                    { opacity: 0, clipPath: `circle(0px at ${originX}px ${originY}px)`, visibility: "visible" },
                    { opacity: .78, clipPath: `circle(${farthestCorner * .22}px at ${originX}px ${originY}px)`, offset: .14 },
                    { opacity: .32, clipPath: `circle(${farthestCorner * .68}px at ${originX}px ${originY}px)`, offset: .48 },
                    { opacity: 0, clipPath: `circle(${farthestCorner}px at ${originX}px ${originY}px)`, visibility: "hidden" }
                ],
                { duration: 560, easing: "cubic-bezier(.22, .61, .36, 1)" }
            );

            ring?.animate(
                [
                    { opacity: 0, transform: "translate(-50%, -50%) scale(.2)" },
                    { opacity: .62, transform: "translate(-50%, -50%) scale(.8)", offset: .16 },
                    { opacity: .22, offset: .52 },
                    { opacity: 0, transform: `translate(-50%, -50%) scale(${farthestCorner / 60})` }
                ],
                { duration: 620, easing: "cubic-bezier(.22, .61, .36, 1)" }
            );
        }
    });
}

/* NAVEGAÇÃO AO ROLAR */

function updateNav() {
    nav.classList.toggle("scrolled", window.scrollY > 40);
}

window.addEventListener("scroll", updateNav, { passive: true });
updateNav();

/* BRILHO QUE SEGUE O CURSOR */

if (cursorGlow) {
    window.addEventListener("pointermove", (event) => {
        cursorGlow.style.left = event.clientX + "px";
        cursorGlow.style.top = event.clientY + "px";
    });
}

/* ANIMAÇÕES DE ENTRADA */

const revealElements = document.querySelectorAll(".reveal");

if (typeof IntersectionObserver === "function") {
    const revealObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                entry.target.classList.toggle("show", entry.isIntersecting);
            });
        },
        { threshold: 0.12 }
    );

    revealElements.forEach((element) => revealObserver.observe(element));
    document.documentElement.classList.add("js");
} else {
    revealElements.forEach((element) => element.classList.add("show"));
}

/* CONTADOR */

const counter = document.querySelector(".counter");
let counterStarted = false;

if (counter && typeof IntersectionObserver === "function") {

    const counterObserver = new IntersectionObserver((entries) => {

        if (entries[0].isIntersecting && !counterStarted) {

            counterStarted = true;

            const target = Number(counter.dataset.target);
            const duration = 1600;
            const start = performance.now();

            function animate(time) {

                const progress = Math.min((time - start) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);

                counter.textContent = Math.floor(target * eased);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            }

            requestAnimationFrame(animate);
        }
    });

    counterObserver.observe(counter);
} else if (counter) {
    const target = Number(counter.dataset.target);
    counter.textContent = Number.isFinite(target) ? String(target) : "0";
}

/* VALORES DE DOAÇÃO */

const valueButtons = document.querySelectorAll(".value");

valueButtons.forEach((button) => {

    button.addEventListener("click", () => {

        valueButtons.forEach((item) => {
            item.classList.remove("active");
            item.setAttribute("aria-pressed", "false");
        });

        button.classList.add("active");
        button.setAttribute("aria-pressed", "true");

        if (customValue) {
            customValue.value = button.dataset.value;
            customValue.focus();
        }
    });
});

if (customValue) {
    customValue.addEventListener("input", () => {
        valueButtons.forEach((button) => {
            button.classList.remove("active");
            button.setAttribute("aria-pressed", "false");
        });
    });
}

/* BOTÃO DO WHATSAPP (DOAÇÃO) */

if (donateButton) {

    donateButton.addEventListener("click", () => {

        const value = Number(customValue.value);

        if (!Number.isFinite(value) || value <= 0 || value > 100000) {

            customValue.focus();
            customValue.style.borderColor = "#ff6262";

            setTimeout(() => {
                customValue.style.borderColor = "";
            }, 1200);

            return;
        }

        const formatted = value.toFixed(2).replace(".", ",");

        const message =
            `Olá! Quero contribuir com R$ ${formatted}. Como faço para participar?`;

        const whatsapp =
            "https://wa.me/5551997711016?text=" + encodeURIComponent(message);

        window.open(whatsapp, "_blank", "noopener,noreferrer");
    });
}

/* EFEITO MAGNÉTICO NOS BOTÕES */

const magneticButtons = document.querySelectorAll(".magnetic");

magneticButtons.forEach((button) => {

    button.addEventListener("pointermove", (event) => {

        const rect = button.getBoundingClientRect();

        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;

        button.style.transform = `translate(${x * .08}px, ${y * .08}px)`;
    });

    button.addEventListener("pointerleave", () => {
        button.style.transform = "";
    });
});

/* INCLINAÇÃO (TILT) DA IMAGEM DO HERO */

const heroImage = document.querySelector(".hero-image");

if (heroImage) {

    heroImage.addEventListener("pointermove", (event) => {

        const rect = heroImage.getBoundingClientRect();

        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;

        const rotateY = (x - .5) * 8;
        const rotateX = (y - .5) * -8;

        heroImage.style.transform = `
            perspective(1200px)
            rotateX(${rotateX}deg)
            rotateY(${rotateY}deg)
            scale(1.01)
        `;
    });

    heroImage.addEventListener("pointerleave", () => {
        heroImage.style.transform = "rotateY(-5deg)";
    });
}

/* CARDS SEGUINDO O MOUSE */

document.querySelectorAll(".info-card").forEach((card) => {

    card.addEventListener("pointermove", (event) => {

        const rect = card.getBoundingClientRect();

        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = (y - centerY) / 35;
        const rotateY = (centerX - x) / 35;

        card.style.transform = `
            translateY(-12px)
            rotateX(${rotateX}deg)
            rotateY(${rotateY}deg)
        `;
    });

    card.addEventListener("pointerleave", () => {
        card.style.transform = "";
    });
});

/* PARALLAX DO HERO */

const heroVisual = document.getElementById("heroVisual");

window.addEventListener("scroll", () => {

    if (window.innerWidth <= 850) return;
    if (!heroVisual) return;

    const movement = Math.min(window.scrollY * .10, 60);

    heroVisual.style.marginTop = movement + "px";

}, { passive: true });

/* PLAYER DE VÍDEO: LINHA DO TEMPO E TELA CHEIA */

const siteVideo = document.getElementById("siteVideo");
const videoFrame = document.querySelector(".video-frame");
const videoPlayCenter = document.getElementById("videoPlayCenter");
const videoMuteToggle = document.getElementById("videoMuteToggle");
const videoFullscreen = document.getElementById("videoFullscreen");
const videoProgressWrap = document.getElementById("videoProgressWrap");
const videoProgressBar = document.getElementById("videoProgressBar");
const videoThumb = document.getElementById("videoThumb");

function updateVideoMuteUI() {

    if (!siteVideo || !videoMuteToggle) return;

    const isMuted = siteVideo.muted;
    const label = isMuted ? "Ativar som do vídeo" : "Silenciar vídeo";

    videoMuteToggle.classList.toggle("is-muted", isMuted);
    videoMuteToggle.setAttribute("aria-label", label);
    videoMuteToggle.setAttribute("title", label);
    videoMuteToggle.setAttribute("aria-pressed", String(isMuted));
}

if (siteVideo) {
    siteVideo.muted = false;
    siteVideo.volume = 1;
    updateVideoMuteUI();
}

if (videoMuteToggle && siteVideo) {
    videoMuteToggle.addEventListener("click", () => {
        siteVideo.muted = !siteVideo.muted;
        updateVideoMuteUI();
    });
}

/* REPRODUZIR E PAUSAR */

function toggleVideo() {

    if (!siteVideo) return;

    if (siteVideo.paused) {
        siteVideo.play().catch(() => {});
    } else {
        siteVideo.pause();
    }
}

if (videoPlayCenter) videoPlayCenter.addEventListener("click", toggleVideo);
if (siteVideo) siteVideo.addEventListener("click", toggleVideo);

/* ATUALIZAR LINHA DO TEMPO */

let rafId = null;
let isDragging = false;

function updateProgress() {

    if (!siteVideo || !videoProgressBar) return;

    const duration = siteVideo.duration;

    if (!Number.isFinite(duration) || duration <= 0) return;

    const percent = Math.min(100, Math.max(0, (siteVideo.currentTime / duration) * 100));

    videoProgressBar.style.width = percent + "%";

    if (videoThumb) {
        videoThumb.style.left = percent + "%";
    }
}

function progressLoop() {
    updateProgress();
    rafId = requestAnimationFrame(progressLoop);
}

function startLoop() {
    if (rafId === null) rafId = requestAnimationFrame(progressLoop);
}

function stopLoop() {

    if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
    }

    updateProgress();
}

/* ESTADO DO VÍDEO */

function setPlayingUI(isPlaying) {

    if (videoFrame) videoFrame.classList.toggle("playing", isPlaying);

    if (videoPlayCenter) videoPlayCenter.classList.toggle("hidden", isPlaying);
}

if (siteVideo) {

    siteVideo.addEventListener("play", () => {

        setPlayingUI(true);
        startLoop();

    });

    const onStop = () => {

        setPlayingUI(false);
        stopLoop();

    };

    siteVideo.addEventListener("pause", onStop);
    siteVideo.addEventListener("ended", onStop);

    siteVideo.addEventListener("timeupdate", updateProgress);
    siteVideo.addEventListener("loadedmetadata", updateProgress);
    siteVideo.addEventListener("durationchange", updateProgress);
    siteVideo.addEventListener("seeked", updateProgress);
    siteVideo.addEventListener("seeking", updateProgress);
}

/* CONTROLES DA LINHA DO TEMPO */

function seekFromEvent(event) {

    if (!siteVideo || !videoProgressWrap) return;

    const duration = siteVideo.duration;

    if (!Number.isFinite(duration) || duration <= 0) return;

    const track = videoProgressWrap.querySelector(".video-progress");
    const rect = track.getBoundingClientRect();

    let position = (event.clientX - rect.left) / rect.width;
    position = Math.min(1, Math.max(0, position));

    siteVideo.currentTime = position * duration;

    // atualiza o visual na hora
    if (videoProgressBar) videoProgressBar.style.width = (position * 100) + "%";
    if (videoThumb) videoThumb.style.left = (position * 100) + "%";
}

if (videoProgressWrap) {

    videoProgressWrap.addEventListener("pointerdown", (event) => {

        isDragging = true;
        videoProgressWrap.classList.add("dragging");

        try {
            videoProgressWrap.setPointerCapture(event.pointerId);
        } catch (e) {}

        seekFromEvent(event);
    });

    videoProgressWrap.addEventListener("pointermove", (event) => {
        if (isDragging) seekFromEvent(event);
    });

    const endDrag = (event) => {

        if (!isDragging) return;

        isDragging = false;
        videoProgressWrap.classList.remove("dragging");

        try {
            videoProgressWrap.releasePointerCapture(event.pointerId);
        } catch (e) {}
    };

    videoProgressWrap.addEventListener("pointerup", endDrag);
    videoProgressWrap.addEventListener("pointercancel", endDrag);
}

/* TELA CHEIA */

if (videoFullscreen) {

    videoFullscreen.addEventListener("click", async () => {

        if (!siteVideo || !videoFrame) return;

        try {

            if (document.fullscreenElement) {
                await document.exitFullscreen();
                return;
            }

            if (videoFrame.requestFullscreen) {
                await videoFrame.requestFullscreen();
            } else if (videoFrame.webkitRequestFullscreen) {
                videoFrame.webkitRequestFullscreen();
            } else if (siteVideo.webkitEnterFullscreen) {
                // iPhone / Safari
                siteVideo.webkitEnterFullscreen();
            }

        } catch (error) {
            console.log("Não foi possível ativar a tela cheia do vídeo.");
        }
    });
}

document.addEventListener("fullscreenchange", () => {

    if (!videoFrame) return;

    const isFullscreen = Boolean(document.fullscreenElement);
    const fullscreenLabel = isFullscreen
        ? "Sair da tela cheia do vídeo"
        : "Ativar tela cheia do vídeo";

    videoFrame.classList.toggle("fullscreen-active", isFullscreen);

    if (videoFullscreen) {
        videoFullscreen.setAttribute("aria-label", fullscreenLabel);
        videoFullscreen.setAttribute("title", fullscreenLabel);
    }
});

