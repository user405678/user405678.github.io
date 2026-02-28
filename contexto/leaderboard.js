// leaderboard.js
// Handles floating leaderboard: scoring, rendering, drag, pagination

// --- Leaderboard data helpers ---
function getLeaderboard() {
    try {
      return JSON.parse(localStorage.getItem("gameLeaderboard") || "{}");
    } catch (e) {
      return {};
    }
  }
  
  function updateLeaderboard(userScores) {
    const leaderboard = getLeaderboard();
  
    Object.values(userScores).forEach(userScore => {
      const user = userScore.user;
      const points = userScore.count;
      const userId = user.uniqueId;
      const username = user.username;

      if (!leaderboard[userId]) {
        leaderboard[userId] = {
          totalPoints: 0,
          username,
          photoUrl: user.photoUrl,
          gamesPlayed: 0
        };
      }
  
      leaderboard[userId].totalPoints += points;
      leaderboard[userId].gamesPlayed++;
      leaderboard[userId].username = username;
      leaderboard[userId].photoUrl = user.photoUrl;
    });
  
    localStorage.setItem("gameLeaderboard", JSON.stringify(leaderboard));
    return leaderboard;
  }
  
  function getTopLeaderboardUsers(limit = 10) {
    const leaderboard = getLeaderboard();
    return Object.entries(leaderboard)
      .map(([userId, data]) => ({ userId, ...data }))
      .filter(user => user.totalPoints > 0)
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, limit);
  }
  
  function clearLeaderboard() {
    localStorage.removeItem("gameLeaderboard");
    showToast("Leaderboard cleared!");
    updateFloatingLeaderboard();
    location.reload();
  }
  
  // --- Floating leaderboard DOM refs ---
  const floatingLeaderboard = document.getElementById("floatingLeaderboard");
  const leaderboardHeader = document.getElementById("leaderboardHeader");
const toggleFloatingLeaderboard = document.getElementById("toggleFloatingLeaderboard");
const toggleLeaderboardOpacity = document.getElementById("toggleLeaderboardOpacity");
  const floatingLeaderboardBody = document.getElementById("floatingLeaderboardBody");
const toggleLeaderboardHeight = document.getElementById("toggleLeaderboardHeight");
  const prevLeaderboardPage = document.getElementById("prevLeaderboardPage");
  const nextLeaderboardPage = document.getElementById("nextLeaderboardPage");
  const leaderboardPageInfo = document.getElementById("leaderboardPageInfo");
  
  let currentLeaderboardPage = 1;
  const leaderboardItemsPerPage = 10;
  
  // --- Drag-and-drop ---
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };
  
  if (leaderboardHeader) {
    leaderboardHeader.addEventListener("mousedown", e => {
      if (
        e.target === toggleFloatingLeaderboard ||
        e.target === prevLeaderboardPage ||
        e.target === nextLeaderboardPage
      )
        return;
      isDragging = true;
      const rect = floatingLeaderboard.getBoundingClientRect();
      dragOffset.x = e.clientX - rect.left;
      dragOffset.y = e.clientY - rect.top;
      document.addEventListener("mousemove", dragLeaderboard);
      document.addEventListener("mouseup", stopDragLeaderboard);
    });
  }
  
  function dragLeaderboard(e) {
    if (!isDragging) return;
    const x = e.clientX - dragOffset.x;
    const y = e.clientY - dragOffset.y;
  
    const maxX = window.innerWidth - floatingLeaderboard.offsetWidth;
    const maxY = window.innerHeight - floatingLeaderboard.offsetHeight;
  
    floatingLeaderboard.style.left = Math.min(Math.max(0, x), maxX) + "px";
    floatingLeaderboard.style.top = Math.min(Math.max(0, y), maxY) + "px";
    floatingLeaderboard.style.right = "auto";
    floatingLeaderboard.style.bottom = "auto";
  }
  
  function stopDragLeaderboard() {
    isDragging = false;
    document.removeEventListener("mousemove", dragLeaderboard);
    document.removeEventListener("mouseup", stopDragLeaderboard);
  }
  
  // --- Minimize/maximize ---
  if (toggleFloatingLeaderboard && floatingLeaderboardBody) {
    toggleFloatingLeaderboard.addEventListener("click", function () {
      if (floatingLeaderboardBody.classList.contains("collapsed")) {
        floatingLeaderboardBody.classList.remove("collapsed");
        toggleFloatingLeaderboard.textContent = "−";
      } else {
        floatingLeaderboardBody.classList.add("collapsed");
        toggleFloatingLeaderboard.textContent = "+";
      }
    });
  }

// Opacity toggle (not persisted)
if (toggleLeaderboardOpacity && floatingLeaderboard) {
  toggleLeaderboardOpacity.addEventListener("click", function () {
    floatingLeaderboard.classList.toggle("opacity-50");
  });
}

// Height toggle (not persisted): toggles between 290px max-height and no max-height
if (toggleLeaderboardHeight && floatingLeaderboardBody) {
  toggleLeaderboardHeight.addEventListener("click", function () {
    const current = window.getComputedStyle(floatingLeaderboardBody).getPropertyValue('max-height');
    if (!current || current === 'none') {
      floatingLeaderboardBody.style.maxHeight = '290px';
      floatingLeaderboardBody.style.overflowY = 'auto';
    } else {
      floatingLeaderboardBody.style.maxHeight = 'none';
      floatingLeaderboardBody.style.overflowY = 'visible';
    }
  });
}
  
  // --- Pagination ---
  if (prevLeaderboardPage) {
    prevLeaderboardPage.addEventListener("click", function () {
      if (currentLeaderboardPage > 1) {
        currentLeaderboardPage--;
        updateFloatingLeaderboard();
      }
    });
  }
  
  if (nextLeaderboardPage) {
    nextLeaderboardPage.addEventListener("click", function () {
      const allUsers = getTopLeaderboardUsers(1000);
      const totalPages = Math.ceil(allUsers.length / leaderboardItemsPerPage);
      if (currentLeaderboardPage < totalPages) {
        currentLeaderboardPage++;
        updateFloatingLeaderboard();
      }
    });
  }
  
  // --- Rendering ---
  function updateFloatingLeaderboard() {
    const leaderboardList = document.getElementById("leaderboardList");
    if (!leaderboardList) return;
  
    const allUsers = getTopLeaderboardUsers(1000);
    const totalPages = Math.ceil(allUsers.length / leaderboardItemsPerPage);
  
    if (currentLeaderboardPage > totalPages && totalPages > 0) {
      currentLeaderboardPage = totalPages;
    }
    if (currentLeaderboardPage < 1) {
      currentLeaderboardPage = 1;
    }
  
    if (leaderboardPageInfo) {
      leaderboardPageInfo.textContent = `${currentLeaderboardPage}/${Math.max(1, totalPages)}`;
    }
  
    if (prevLeaderboardPage) prevLeaderboardPage.disabled = currentLeaderboardPage <= 1;
    if (nextLeaderboardPage) nextLeaderboardPage.disabled = currentLeaderboardPage >= totalPages || totalPages === 0;
  
    if (allUsers.length === 0) {
      leaderboardList.innerHTML = '<div class="leaderboard-empty">No players yet</div>';
    } else {
      const startIndex = (currentLeaderboardPage - 1) * leaderboardItemsPerPage;
      const endIndex = startIndex + leaderboardItemsPerPage;
      const pageUsers = allUsers.slice(startIndex, endIndex);
  
      leaderboardList.innerHTML = "";
      pageUsers.forEach((user, index) => {
        const globalIndex = startIndex + index + 1;
        const item = document.createElement("div");
        item.className = "leaderboard-item";
        item.innerHTML = `
          <div class="leaderboard-user">
            <span class="leaderboard-rank">${globalIndex}.</span>
            <img class="leaderboard-img" src="${user.photoUrl ||
              "https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg"}" alt="User" />
            <span class="leaderboard-username">${user.username}</span>
          </div>
          <span class="leaderboard-points">${user.totalPoints}</span>
        `;
        leaderboardList.appendChild(item);
      });
    }
  }
  
  // Initialize
  updateFloatingLeaderboard();
  
  // Expose globally
  window.updateFloatingLeaderboard = updateFloatingLeaderboard;
  window.Leaderboard = { getLeaderboard, updateLeaderboard, getTopLeaderboardUsers, clearLeaderboard };
  
// Leaderboard announcement toast
(function() {
  const TOAST_STORAGE_KEY = 'contextoLeaderboardToastDismissed';
  const toast = document.getElementById('leaderboardToast');
  const closeBtn = document.getElementById('closeToast');
  
  if (!toast) return;
  
  // Check if user has already dismissed the toast
  const wasDismissed = localStorage.getItem(TOAST_STORAGE_KEY);
  
  if (!wasDismissed) {
    // Show toast after a short delay
    setTimeout(() => {
      toast.classList.add('show');
    }, 1000);
  }
  
  // Close button handler
  if (closeBtn) {
    closeBtn.addEventListener('click', function() {
      toast.classList.remove('show');
      localStorage.setItem(TOAST_STORAGE_KEY, 'true');
    });
  }
  
  // Close on background click
  toast.addEventListener('click', function(e) {
    if (e.target === toast) {
      toast.classList.remove('show');
      localStorage.setItem(TOAST_STORAGE_KEY, 'true');
    }
  });
})();
