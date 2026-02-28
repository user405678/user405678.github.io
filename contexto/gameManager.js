// gameManager.js
// Generic game lifecycle & utilities for single or multi-winner stream games

// ----------------------------
// 🔹 Lifecycle
// ----------------------------
function initGame() {
    console.log("Initializing game...");
  
    hideWinningModal();
    hideInstructionPopup();
    clearMessage();
  
    if (getInstructionActive()) {
      showInstructionPopup(
        getInstructionText(),
        getInstructionGif(),
        getInstructionDuration()
      );
    }
  
    if (getTtsRoundStartEnabled()) {
      const texts = String(getTtsRoundStartTexts() || "").split(";");
      const candidates = texts.map(s => s.trim()).filter(Boolean);
      if (candidates.length) {
        const randomText = candidates[Math.floor(Math.random() * candidates.length)];
        speakText(randomText);
      }
    }
  }

function startRound() {
    showMessage("Round Started");
}

function endRound(result, winners = [], answer = "") {

    if (result === "win") {
        const url = getWinningSoundUrl();
        playSound(url);
        showWinningModal(winners, answer);

        if (getTtsGameWonEnabled()) {
        const texts = String(getTtsGameWonTexts() || "").split(";");
        const candidates = texts.map(s => s.trim()).filter(Boolean);
        if (candidates.length) {
            const randomText = candidates[Math.floor(Math.random() * candidates.length)];
            speakText(randomText);
        }
        }

    // 🔗 Update the floating leaderboard with winners
    try {
      if (Array.isArray(winners) && winners.length && window.Leaderboard?.updateLeaderboard) {
        const userScores = {};
        
        winners.forEach(w => {
          const uniqueId = w.uniqueId 
          const username = w.name 
          const user = { uniqueId, username, photoUrl: w.photo };
          userScores[uniqueId] = { user, count: 1 };
        });
        window.Leaderboard.updateLeaderboard(userScores);
        if (window.updateFloatingLeaderboard) window.updateFloatingLeaderboard();
      }
    } catch (e) {
      console.warn("Failed to update leaderboard:", e);
    }
    } 
    else if (result === "loss") {
        showMessage(`The word was ${answer}`, "error");
    }
    setTimeout(() => {
        hideWinningModal();
        initGame();
        if (window.Contexto?.initNextRound) window.Contexto.initNextRound();
    }, (getWinningModalDuration() || 5) * 1000);
}

function nextGame() {
    initGame();
    startRound();
}

// ----------------------------
// 🔹 UI Helpers
// ----------------------------
function showMessage(text, type = "info") {
    const msg = document.getElementById("message");
    if (!msg) return;
    msg.innerText = text;
    msg.style.color = type === "error" ? "red" : "#fff";
}

function clearMessage() {
    const msg = document.getElementById("message");
    if (msg) msg.innerText = "";
}

function showWinningModal(winners, word) {
    const overlay = document.getElementById("winning-overlay");
    const singleWinner = document.getElementById("single-winner");
    const multipleWinners = document.getElementById("multiple-winners");
    const titleEl = document.getElementById("winning-title");

    if (!overlay) return;

    if (titleEl) {
        if (winners && winners.length > 0) {
            const name = winners[0].name || "Player";
            titleEl.innerText = `🏆 '${name}' won with '${word}'`;
        } else {
            titleEl.innerText = `🏆 Winner with ${word}`;
        }
    }

    if (winners.length === 1) {
        // Show single winner
        singleWinner.style.display = "flex";
        multipleWinners.style.display = "none";
        document.getElementById("winner-photo").src = winners[0].photo;
    } else if (winners.length > 1) {
        // Show multiple winners
        singleWinner.style.display = "none";
        multipleWinners.style.display = "flex";
        multipleWinners.innerHTML = "";

        winners.forEach(w => {
            const div = document.createElement("div");
            div.className = "multi-winner";
            div.innerHTML = `
                <img class="multi-winner-photo" src="${w.photo}" alt="${w.name}" />
            `;
            multipleWinners.appendChild(div);
        });
    } else {
        // No winners
        singleWinner.style.display = "none";
        multipleWinners.style.display = "none";
    }

    overlay.classList.add("show");

    // Start confetti for the duration of the modal
    const durationMs = Math.max(1000, (getWinningModalDuration() || 5) * 1000);
    startConfetti(durationMs);
}

function hideWinningModal() {
    const overlay = document.getElementById("winning-overlay");
    if (overlay) overlay.classList.remove("show");
    stopConfetti();
}

function showInstructionPopup(text, gifUrl, durationSec = 3) {
    const popup = document.getElementById("instruction-popup");
    const textDisplay = document.getElementById("instruction-popup-text-display");
    const gifDisplay = document.getElementById("instruction-popup-gif-display");

    if (!popup) return;

    textDisplay.innerText = text;
    if (gifUrl) {
        gifDisplay.src = gifUrl;
        gifDisplay.style.display = "block";
    } else {
        gifDisplay.style.display = "none";
    }

    popup.classList.add("show");

    setTimeout(() => {
        popup.classList.remove("show");
    }, durationSec * 1000);
}

function hideInstructionPopup() {
    const popup = document.getElementById("instruction-popup");
    if (popup) popup.classList.remove("show");
}

// ----------------------------
// 🔹 Sound & TTS
// ----------------------------
function playSound(url) {
    if (!url) return;
    const audio = new Audio(url);
    audio.play().catch(err => console.warn("Sound play failed:", err));
}

function speakText(text) {
    if (!getTtsEnabled()) return;
    const utterance = new SpeechSynthesisUtterance(text);
    const vol = Number(getTtsVolume() ?? 50);
    const rateRaw = Number(getTtsRate() ?? 10);
    utterance.volume = Math.max(0, Math.min(1, vol / 100));
    utterance.rate = Math.max(0.1, Math.min(2.0, rateRaw / 10));
  
    const desiredName = getTtsVoice();
    const voices = window.speechSynthesis?.getVoices?.() || [];
    if (desiredName) {
      const v = voices.find(v => v.name === desiredName);
      if (v) utterance.voice = v;
    }
    try {
      speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis failed:", e);
    }
  }
  
// Simple confetti implementation using canvas
let confettiCanvas, confettiCtx, confettiTimer;
function startConfetti(durationMs) {
    try {
        stopConfetti();
        confettiCanvas = document.createElement('canvas');
        confettiCanvas.id = 'confetti-canvas';
        confettiCanvas.style.position = 'fixed';
        confettiCanvas.style.pointerEvents = 'none';
        confettiCanvas.style.zIndex = '1100';
        document.body.appendChild(confettiCanvas);

        function updateBounds() {
            const container = document.querySelector('.container');
            if (container) {
                const rect = container.getBoundingClientRect();
                confettiCanvas.style.left = rect.left + 'px';
                confettiCanvas.style.top = rect.top + 'px';
                confettiCanvas.style.width = rect.width + 'px';
                confettiCanvas.style.height = rect.height + 'px';
                confettiCanvas.width = Math.max(1, Math.floor(rect.width));
                confettiCanvas.height = Math.max(1, Math.floor(rect.height));
            } else {
                confettiCanvas.style.left = '0px';
                confettiCanvas.style.top = '0px';
                confettiCanvas.style.width = '100%';
                confettiCanvas.style.height = '100%';
                confettiCanvas.width = window.innerWidth;
                confettiCanvas.height = window.innerHeight;
            }
        }
        updateBounds();
        confettiCtx = confettiCanvas.getContext('2d');

        const pieces = Array.from({ length: 280 }).map(() => ({
            x: Math.random() * confettiCanvas.width,
            y: Math.random() * -confettiCanvas.height,
            size: 4 + Math.random() * 6, // square side length
            color: `hsl(${Math.random()*360},90%,60%)`,
            speed: 2 + Math.random() * 4,
            angle: Math.random() * Math.PI * 2,
            rot: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.1
        }));

        function draw() {
            if (!confettiCtx) return;
            confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
            pieces.forEach(p => {
                p.y += p.speed;
                p.x += Math.sin(p.angle += 0.03);
                p.rot += p.rotSpeed;
                if (p.y - p.size > confettiCanvas.height) {
                    p.y = -10;
                    p.x = Math.random() * confettiCanvas.width;
                }
                confettiCtx.save();
                confettiCtx.translate(p.x, p.y);
                confettiCtx.rotate(p.rot);
                confettiCtx.fillStyle = p.color;
                const half = p.size / 2;
                confettiCtx.fillRect(-half, -half, p.size, p.size);
                confettiCtx.restore();
            });
            confettiTimer = requestAnimationFrame(draw);
        }
        draw();

        setTimeout(stopConfetti, durationMs);
        const onResizeScroll = () => { if (confettiCanvas) updateBounds(); };
        window.addEventListener('resize', onResizeScroll);
        window.addEventListener('scroll', onResizeScroll, { passive: true });
    } catch (e) {
        console.warn('Confetti start failed:', e);
    }
}

function stopConfetti() {
    try {
        if (confettiTimer) cancelAnimationFrame(confettiTimer);
        confettiTimer = null;
        if (confettiCanvas && confettiCanvas.parentNode) confettiCanvas.parentNode.removeChild(confettiCanvas);
        confettiCanvas = null;
        confettiCtx = null;
    } catch {}
}


function handleRealComment(user) {
    // Forward TikTok comment as a guess to Contexto
    try {
        if (window.Contexto?.submitWord) {
            window.Contexto.submitWord(user);
        }
    } catch (e) {
        console.warn("Failed to forward comment to game:", e);
    }
}

function handleRealGift(user) {
    try {
        if (window.Contexto?.processGift) {
            window.Contexto.processGift(user);
        }
    } catch (e) {
        console.warn("Failed to forward gift to game:", e);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // Load persisted settings and start the first round if you want
    initGame();
    if (window.Contexto?.initNextRound) window.Contexto.initNextRound();
    // Optionally: startRound();
});

// ----------------------------
// 🔹 Expose globally
// ----------------------------
window.GameManager = {
    initGame,
    startRound,
    endRound,
    nextGame,
    showMessage,
    clearMessage,
    showWinningModal,
    hideWinningModal,
    showInstructionPopup,
    hideInstructionPopup,
    playSound,
    speakText,
    handleRealComment,
    handleRealGift
};
