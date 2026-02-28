// contextoGame.js
// Contexto gameplay logic safely namespaced for use by GameManager

let allowHintsThisRound = true; // globally visible so gift handler can check

(function () {
    // ============================================================
    // 🧠 GAME STATE
    // ============================================================
    let gameData = null;
    let guesses = [];
    let targetWord = "";
    let mostRecentGuessLemma = null;
    let dictionary = null;
    let spellcheckEnabled = true;
    let allowDuplicates = true;
    let suggestedWord = "";
    let winnerDeclared = false; // prevent multiple winners per round
    const numberOfGames = 1100;
    const API_BASE_URL = "https://ccbackend2.com";
    const API_BASE_BACKUP_URL = "https://ccbackend.com";
    const FALLBACK_WORDS = [
        "motorcycle", "pharmacist", "dictionary", "cherry", "foam", "cleaver", "perjury", "scallop",
        "basement", "flu", "atlas", "vampire", "cobbler", "garage", "disinfectant", "mill", "raisin",
        "flame", "beetle", "airbag", "pony", "lever", "pool", "marshmallow", "wool", "cabin",
        "waterfall", "cage", "oyster", "spool", "florist", "sphere", "plum", "geometry", "fury",
        "porcelain", "yam", "treadmill", "laboratory", "notebook", "tadpole", "acid", "lie", "omelet",
        "dust", "igloo", "nun", "toaster", "dessert", "pill", "screwdriver", "literature", "porridge",
        "raccoon", "bucket", "lighthouse", "alley", "protractor", "lighter", "lentil", "envy",
        "seagull", "bride", "oven", "bamboo", "shoelace", "receipt", "faucet", "shelf", "limousine",
        "charger", "tray", "bookstore", "rope", "registry", "bungalow", "umbrella", "costume",
        "lawyer", "cucumber", "enemy", "tongue", "makeup", "hose", "cliff", "ice", "rocket", "butter",
        "mayor", "pink", "boot", "waiter", "shale", "myth", "reptile", "joystick", "villain",
        "fishbowl", "knee", "lollipop", "pianist"
    ];

    // Centralized API fetch with failover to backup base URL
    // The primary request is limited to 5 seconds; on timeout (or other failure)
    // the backup endpoint is used (also limited to 5 seconds).
    // If both fail, falls back to a random word from FALLBACK_WORDS list.
    async function apiFetch(path, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5_000); // 5 seconds

        try {
            const primaryResponse = await fetch(`${API_BASE_URL}${path}`, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!primaryResponse.ok) {
                throw new Error(`Primary API error: ${primaryResponse.status}`);
            }
            return primaryResponse;
        } catch (primaryError) {
            clearTimeout(timeoutId);
            console.warn("Primary API failed or timed out, falling back to backup:", primaryError);

            // Try backup API with 5-second timeout
            const backupController = new AbortController();
            const backupTimeoutId = setTimeout(() => backupController.abort(), 4_000); // 4 seconds

            try {
                const backupResponse = await fetch(`${API_BASE_BACKUP_URL}${path}`, {
                    ...options,
                    signal: backupController.signal
                });
                clearTimeout(backupTimeoutId);

                if (!backupResponse.ok) {
                    throw new Error(`Backup API error: ${backupResponse.status}`);
                }
                return backupResponse;
            } catch (backupError) {
                clearTimeout(backupTimeoutId);
                console.warn("Backup API failed or timed out, falling back to random word:", backupError);

                // Fallback to random word from the list
                const randomWord = FALLBACK_WORDS[Math.floor(Math.random() * FALLBACK_WORDS.length)];
                const fallbackUrl = `https://www.runchatcapture.com/scripts/contexto_results/contexto-${randomWord}.json`;
                console.log(`Attempting fallback to: ${fallbackUrl}`);
                
                const fallbackResponse = await fetch(fallbackUrl, options);
                if (!fallbackResponse.ok) {
                    throw new Error(`Fallback API error: ${fallbackResponse.status}`);
                }
                return fallbackResponse;
            }
        }
    }

    // ============================================================
    // 🎨 DOM ELEMENTS
    // ============================================================
    const wordInput = document.getElementById("wordInput");
    const guessesContainer = document.getElementById("guessesContainer");
    const lastGuessContainer = document.getElementById("lastGuess");
    const menuButton = document.getElementById("menuButton");
    const menuOverlay = document.getElementById("menuOverlay");
    const selectGameOverlay = document.getElementById("selectGameOverlay");
    const howToPlayOverlay = document.getElementById("howToPlayOverlay");
    const congratsOverlay = document.getElementById("congratsOverlay");
    const selectGameOption = document.getElementById("selectGame");
    const playAgain = document.getElementById("playAgain");
    const closeSelectGame = document.getElementById("closeSelectGame");
    const closeHowToPlay = document.getElementById("closeHowToPlay");
    const guessCountDisplay = document.getElementById("guessCount");
    const loadingElement = document.getElementById("loading");
    const errorMessageElement = document.getElementById("errorMessage");
    const customWordInput = document.getElementById("customWordInput");
    const createCustomGameButton = document.getElementById("createCustomGame");
    
    const gameCreationUI = document.getElementById("gameCreationUI");
    const wordCheckUI = document.getElementById("wordCheckUI");
    const suggestedWordDisplay = document.getElementById("suggestedWordDisplay");
    const successMessageUI = document.getElementById("successMessageUI");
    const loadingGame = document.getElementById("loadingGame");
    const backToInput = document.getElementById("backToInput");
    const acceptSimilarWord = document.getElementById("acceptSimilarWord");
    const continueToGame = document.getElementById("continueToGame");
    const spellcheckToggle = document.getElementById("spellcheckToggle");
    const dupesToggle = document.getElementById("dupesToggle");
    const darkToggle = document.getElementById("contextoDarkToggle");
    const lastWord = document.getElementById("lastWord");

    // Secret word input is not shown to audience, keep as text

    // ============================================================
    // ⚙️ INITIALIZATION
    // ============================================================
    async function initDictionary() {
        try {
            const response = await fetch('https://cdn.jsdelivr.net/npm/word-list-json@1.0.0/words.json');
            const words = await response.json();
            dictionary = new Set(words.map((word) => word.toLowerCase()));
        } catch (error) {
            console.error("Failed to load dictionary:", error);
            dictionary = null;
        }
    }

    async function contextoInitGame(gameIndex = null) {
        guesses = [];
        mostRecentGuessLemma = null;
        allowHintsThisRound = true;
        guessesContainer.innerHTML = "";
        lastGuessContainer.style.display = "none";
        loadingElement.style.display = "block";
        errorMessageElement.style.display = "none";

        if (gameIndex === null) {
            gameIndex = Math.floor(Math.random() * (numberOfGames + 1));
        }

        try {
            const response = await apiFetch(`/game?index=${gameIndex}`);
            
            if (!response.ok) {
                throw new Error("Failed to fetch game data from game endpoint");
            }

            gameData = await response.json();
            const targetWordObj = gameData.results.find((item) => parseInt(item.rank) === 1);
            targetWord = targetWordObj ? targetWordObj.lemma : "unknown";
            winnerDeclared = false;
            if (window.SettingsPanel) window.SettingsPanel.setCurrentAnswer(targetWord);

            loadingElement.style.display = "none";
            updateGuessCount(0);
        } catch (error) {
            console.error("Error fetching game data:", error);
            errorMessageElement.textContent = "Failed to load game data. Please check your connection.";
            errorMessageElement.style.display = "block";
            loadingElement.style.display = "none";
        }
    }

    async function initCustomGame(word) {
        guesses = [];
        mostRecentGuessLemma = null;
        allowHintsThisRound = true;
        guessesContainer.innerHTML = "";
        lastGuessContainer.style.display = "none";
        loadingElement.style.display = "block";
        errorMessageElement.style.display = "none";

        try {
            if (gameData && targetWord === word) {
                loadingElement.style.display = "none";
                updateGuessCount(0);
                return true;
            }

            const response = await apiFetch(`/rank?word=${word}`);
            if (!response.ok) throw new Error("Failed to generate custom game");

            gameData = await response.json();
            targetWord = word;
            winnerDeclared = false;
            window.SettingsPanel.setCurrentAnswer(word);

            loadingElement.style.display = "none";
            updateGuessCount(0);
            return true;
        } catch (error) {
            console.error("Error creating custom game:", error);
            const panelError = document.getElementById("customGameError");
            if (panelError) {
                loadingGame.style.display = "none";
                wordCheckUI.style.display = "none";
                successMessageUI.style.display = "none";
                gameCreationUI.style.display = "block";
                panelError.textContent = "Failed to create custom game. Please try another word.";
                panelError.style.display = "block";
                const input = document.getElementById("customWordInput");
                if (input) input.focus();
            }
            return false;
        }
    }

    // ============================================================
    // 🎯 AUTOMATED WORD LIST
    // ============================================================
    async function getNextAutomatedWord() {
        try {
            let wordList = typeof getAutomatedWordList === 'function' ? getAutomatedWordList() : [];
            
            if (!Array.isArray(wordList) || wordList.length === 0) {
                return null;
            }

            // Get the first word from the list
            const word = wordList[0].toLowerCase().trim();
            
            if (!word) {
                // Remove empty word and try next
                wordList.shift();
                if (typeof saveAutomatedWordList === 'function') {
                    saveAutomatedWordList(wordList);
                }
                return getNextAutomatedWord(); // Recursive call
            }

            // Validate the word with the API
            try {
                const response = await apiFetch(`/rank?word=${word}`);
                const data = await response.json();

                // Check for vocabulary error in response
                if (data.error && data.error.toLowerCase().includes("not in vocabulary")) {
                    console.log(`Word '${word}' not in vocabulary, skipping...`);
                    // Remove invalid word and try next
                    wordList.shift();
                    if (typeof saveAutomatedWordList === 'function') {
                        saveAutomatedWordList(wordList);
                    }
                    return getNextAutomatedWord(); // Recursive call
                }

                // Check if rank 1 lemma exists and matches
                const rank1Word = data.results?.find((item) => parseInt(item.rank) === 1);
                const actualLemma = rank1Word ? rank1Word.lemma : null;

                if (!actualLemma) {
                    console.log(`Word '${word}' has no rank 1 result, skipping...`);
                    wordList.shift();
                    if (typeof saveAutomatedWordList === 'function') {
                        saveAutomatedWordList(wordList);
                    }
                    return getNextAutomatedWord(); // Recursive call
                }

                // Word is valid, remove it from the list and return both word and data
                wordList.shift();
                if (typeof saveAutomatedWordList === 'function') {
                    saveAutomatedWordList(wordList);
                }
                
                // Return object with lemma and pre-fetched data
                return { 
                    requestedWord: word, 
                    actualLemma: actualLemma,
                    gameData: data 
                };

            } catch (error) {
                console.error(`Error validating word '${word}':`, error);
                
                // Check if it's a 404 or vocabulary error
                if (error.message && (error.message.includes('404') || error.message.includes('not in vocabulary'))) {
                    console.log(`Word '${word}' returned 404, skipping...`);
                }
                
                // Remove problematic word and try next
                wordList.shift();
                if (typeof saveAutomatedWordList === 'function') {
                    saveAutomatedWordList(wordList);
                }
                return getNextAutomatedWord(); // Recursive call
            }

        } catch (error) {
            console.error("Error in getNextAutomatedWord:", error);
            return null;
        }
    }

    async function initNextRound() {
        // Clear UI first (before showing loading)
        guesses = [];
        mostRecentGuessLemma = null;
        allowHintsThisRound = true;
        guessesContainer.innerHTML = "";
        lastGuessContainer.style.display = "none";
        loadingElement.style.display = "block";
        errorMessageElement.style.display = "none";
        
        try {
            const nextWordData = await getNextAutomatedWord();
            
            if (nextWordData) {
                // Use word from automated list with pre-fetched data
                console.log(`Starting automated game with word: ${nextWordData.requestedWord} (lemma: ${nextWordData.actualLemma})`);
                
                // Set game data
                gameData = nextWordData.gameData;
                targetWord = nextWordData.actualLemma; // Use actual lemma, not requested word
                winnerDeclared = false;
                
                if (window.SettingsPanel) {
                    window.SettingsPanel.setCurrentAnswer(nextWordData.actualLemma);
                }
                
                loadingElement.style.display = "none";
                updateGuessCount(0);
                
                // Update status UI
                if (typeof window.updateAutomatedListStatus === 'function') {
                    window.updateAutomatedListStatus();
                }
            } else {
                // No words in list, use random game
                console.log("No automated words, starting random game");
                await contextoInitGame();
                
                // Update status UI
                if (typeof window.updateAutomatedListStatus === 'function') {
                    window.updateAutomatedListStatus();
                }
            }
        } catch (error) {
            console.error("Error in initNextRound:", error);
            loadingElement.style.display = "none";
            // Fallback to random game
            await contextoInitGame();
        }
    }

    // ============================================================
    // 🔤 GAME LOGIC
    // ============================================================
    function findWordRank(word) {
        word = word.toLowerCase().trim();

        if (!gameData || !gameData.results) {
            return { lemma: word, rank: 10000 + Math.floor(Math.random() * 1000), word };
        }

        const matchedItem = gameData.results.find(
            (item) => item.word?.toLowerCase() === word || item.lemma?.toLowerCase() === word
        );

        if (matchedItem) {
            return { lemma: matchedItem.lemma, rank: parseInt(matchedItem.rank), word };
        }

        return { lemma: word, rank: 10000 + Math.floor(Math.random() * 1000), word };
    }

    async function checkSpelling(word) {
        if (!spellcheckEnabled) return true;
        word = word.toLowerCase();

        if (dictionary && dictionary.has(word)) return true;
        try {
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
            return response.ok;
        } catch (error) {
            console.error("Spellcheck failed:", error);
            return true;
        }
    }
    //In this function, I'm trying to pass the user's comment as the word to be guessed.
    //I also need to pass the user's photo and username to the other functions within submitWord.
    async function submitWord(user) {
        if (winnerDeclared) return;
        let word = user.comment;
        if (!word || word.trim() === "" || !gameData) return;

        word = word.toLowerCase().trim().split(" ")[0];
        word = word.replace(/[^a-zA-Z]/g, "");

        try {
            // const isValidWord = await checkSpelling(word);
            // if (!isValidWord) {
            //     errorMessageElement.textContent = "Not a valid English word";
            //     errorMessageElement.style.display = "block";
            //     return;
            // }

            const result = findWordRank(word);
            // attach attribution for UI overlays
            if (user && (user.nickname || user.username || user.uniqueId || user.photoUrl)) {
                result.attribution = {
                    name: user.nickname || user.username || user.uniqueId || "",
                    photo: user.photoUrl || ""
                };
            }
            errorMessageElement.style.display = "none";

            const alreadyGuessed = guesses.some(
                (g) => g.lemma.toLowerCase() === result.lemma.toLowerCase()
            );

            mostRecentGuessLemma = result.lemma;
            updateLastGuess(result);

            // if (!allowDuplicates && alreadyGuessed) {
            //     errorMessageElement.textContent = "Word already guessed";
            //     errorMessageElement.style.display = "block";
            //     return;
            // }

            if (!alreadyGuessed) {
                guesses.push(result);
                guesses.sort((a, b) => a.rank - b.rank);
                if (guesses.length > 50) guesses = guesses.slice(0, 50);
                updateGuessCount(Number(document.getElementById("guessCount").textContent) + 1);
            }

            renderPreviousGuesses();
            wordInput.value = "";

            if (result.rank === 1) {
                if (winnerDeclared) return;
                winnerDeclared = true;
                
                // Send winner data to MongoDB (silent, non-blocking)
                try {
                    if (window.MongoDBService) {
                        const guessCount = Number(document.getElementById("guessCount")?.textContent) || 0;
                        const winnerData = {
                            timestamp: new Date().toISOString(),
                            answer: result.lemma,
                            guessCount: guessCount,
                            nickname: user.nickname || user.username || null,
                            uniqueId: user.uniqueId || null,
                            photoUrl: user.photoUrl || null,
                            tikfinityUsername: user.tikfinityUsername || null,
                            followStatus: user.followStatus || null,
                            gameType: "contexto"
                        };
                        window.MongoDBService.sendWinnerToMongoDB(winnerData)
                            .then(() => {}) // Silent success
                            .catch(() => {}); // Silent failure
                    }
                } catch (e) {
                    // Completely silent
                }
                
                if (lastWord) lastWord.textContent = result.lemma;
                if (window.GameManager) {
                    window.GameManager.endRound("win", [{ name: user.nickname, photo: user.photoUrl, uniqueId: user.uniqueId }], result.lemma);
                } else {
                    congratsOverlay.style.display = "flex";
                }
            }
        } catch (error) {
            console.error("Error submitting word:", error);
            errorMessageElement.textContent = "An error occurred. Please try again later.";
            errorMessageElement.style.display = "block";
        }
    }

    function updateLastGuess(guess) {
        
        if (!guess) {
            lastGuessContainer.style.display = "none";
            return;
        }

        lastGuessContainer.style.display = "flex";
        let bgClass = "";
        if (guess.rank < 300) bgClass = "blue-bg";
        else if (guess.rank <= 1500) bgClass = "yellow-bg";
        else bgClass = "red-bg";

        const progressWidth = Math.max(1, 100 - guess.rank / 30);
        lastGuessContainer.className = "last-guess " + bgClass;
        const attribHtml = (guess.attribution && (guess.attribution.name || guess.attribution.photo)) ? `
            <span class="guess-attrib">
                ${guess.attribution.photo ? `<img class=\"guess-attrib-photo\" src=\"${guess.attribution.photo}\" alt=\"${guess.attribution.name}\"/>` : ""}
                ${guess.attribution.name ? `<span class=\"guess-attrib-name\">${guess.attribution.name}</span>` : ""}
            </span>
        ` : "";

        lastGuessContainer.innerHTML = `
            <div class="progress-bar" style="width:${progressWidth}%"></div>
            <span>${guess.lemma}</span>
            ${attribHtml}
            <span>${guess.rank}</span>`;
    }

    function renderPreviousGuesses() {
        guessesContainer.innerHTML = "";
        guesses.forEach((guess) => {
            const guessElement = document.createElement("div");
            guessElement.classList.add("guess-item");

            if (guess.lemma.toLowerCase() === mostRecentGuessLemma.toLowerCase()) {
                guessElement.classList.add("guess-recent");
            }

            if (guess.rank < 300) guessElement.classList.add("blue-bg");
            else if (guess.rank <= 1500) guessElement.classList.add("yellow-bg");
            else guessElement.classList.add("red-bg");

            const progressWidth = Math.max(1, 100 - guess.rank / 30);
            const attribHtml = (guess.attribution && (guess.attribution.name || guess.attribution.photo)) ? `
                <span class="guess-attrib">
                    ${guess.attribution.photo ? `<img class=\"guess-attrib-photo\" src=\"${guess.attribution.photo}\" alt=\"${guess.attribution.name}\"/>` : ""}
                    ${guess.attribution.name ? `<span class=\"guess-attrib-name\">${guess.attribution.name}</span>` : ""}
                </span>
            ` : "";

            guessElement.innerHTML = `
                <div class="progress-bar" style="width:${progressWidth}%"></div>
                <span>${guess.lemma}</span>
                ${attribHtml}
                <span>${guess.rank}</span>`;
            guessesContainer.appendChild(guessElement);
        });
    }

    function updateGuessCount(c) {
        guessCountDisplay.textContent = c;
    }

    // ============================================================
    // 🧩 EVENT LISTENERS
    // ============================================================
    wordInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") submitWord({
            comment: wordInput.value,
            username: "host",
            nickname: "host",
            uniqueId: "host",
            photoUrl: "https://www.runchatcapture.com/assets/imgs/interactive_contexto_logo.png"
        });
    });

    menuButton.addEventListener("click", () => (menuOverlay.style.display = "flex"));
    menuOverlay.addEventListener("click", (e) => { if (e.target === menuOverlay) menuOverlay.style.display = "none"; });
    if (selectGameOption) {
        selectGameOption.addEventListener("click", () => {
            menuOverlay.style.display = "none";
            if (window.SettingsPanel?.openSettingsPanel) window.SettingsPanel.openSettingsPanel();
            if (window.SettingsPanel?.expandGameSettingsSection) window.SettingsPanel.expandGameSettingsSection();
            const input = document.getElementById("customWordInput");
            if (input) input.focus();
        });
    }
    playAgain.addEventListener("click", () => {
        congratsOverlay.style.display = "none";
        if (window.SettingsPanel?.openSettingsPanel) window.SettingsPanel.openSettingsPanel();
        if (window.SettingsPanel?.expandGameSettingsSection) window.SettingsPanel.expandGameSettingsSection();
        const input = document.getElementById("customWordInput");
        if (input) input.focus();
    });
    if (closeSelectGame) closeSelectGame.addEventListener("click", () => {
        const overlay = document.getElementById("selectGameOverlay");
        if (overlay) overlay.style.display = "none";
    });
    if (closeHowToPlay) closeHowToPlay.addEventListener("click", () => (howToPlayOverlay.style.display = "none"));
    howToPlayOverlay.addEventListener("click", (e) => { if (e.target === howToPlayOverlay) howToPlayOverlay.style.display = "none"; });
    congratsOverlay.addEventListener("click", (e) => { if (e.target === congratsOverlay) congratsOverlay.style.display = "none"; });
    if (selectGameOverlay) selectGameOverlay.addEventListener("click", (e) => { if (e.target === selectGameOverlay) selectGameOverlay.style.display = "none"; });

    document.getElementById("randomGame").addEventListener("click", () => {
        const overlay = document.getElementById("selectGameOverlay");
        if (overlay) overlay.style.display = "none";
        const newRandomIndex = Math.floor(Math.random() * (numberOfGames + 1));
        contextoInitGame(newRandomIndex);
    });

    // removed eye toggle

    createCustomGameButton.addEventListener("click", () => {
        const customWord = customWordInput.value.trim();
        if (customWord) {
            gameCreationUI.style.display = "block";
            wordCheckUI.style.display = "none";
            successMessageUI.style.display = "none";
            loadingGame.style.display = "flex";
            checkCustomWordValidity(customWord);
        }
    });

    customWordInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            const customWord = customWordInput.value.trim();
            if (customWord) {
                gameCreationUI.style.display = "block";
                wordCheckUI.style.display = "none";
                successMessageUI.style.display = "none";
                loadingGame.style.display = "flex";
                checkCustomWordValidity(customWord);
            }
        }
    });

    async function checkCustomWordValidity(word) {
        try {
            const response = await apiFetch(`/rank?word=${word}`);
            if (!response.ok) throw new Error("Failed to generate custom game");
            const data = await response.json();

            const rank1Word = data.results.find((item) => parseInt(item.rank) === 1);
            if (!rank1Word || rank1Word.lemma.toLowerCase() !== word.toLowerCase()) {
                suggestedWord = rank1Word ? rank1Word.lemma : data.results[0]?.lemma || word;
                gameData = data;
                loadingGame.style.display = "none";
                gameCreationUI.style.display = "none";
                wordCheckUI.style.display = "block";
                const panelError = document.getElementById("customGameError");
                if (panelError) {
                    panelError.style.display = "none";
                } 
                if (suggestedWordDisplay) suggestedWordDisplay.textContent = suggestedWord;
            } else {
                loadingGame.style.display = "none";
                gameCreationUI.style.display = "none";
                successMessageUI.style.display = "block";
                const panelError = document.getElementById("customGameError");
                if (panelError) {
                    panelError.style.display = "none";
                } 
                gameData = data;
                targetWord = word;
                window.SettingsPanel.setCurrentAnswer(word);
            }
        } catch (error) {
            console.error("Error creating custom game:", error);
            loadingGame.style.display = "none";
            const panelError = document.getElementById("customGameError");
            if (panelError) {
                panelError.textContent = "Failed to create custom game. Please try another word.";
                panelError.style.display = "block";
                const input = document.getElementById("customWordInput");
                if (input) input.focus();
            } 
        }
    }

    backToInput.addEventListener("click", () => {
        wordCheckUI.style.display = "none";
        gameCreationUI.style.display = "block";
    });

    acceptSimilarWord.addEventListener("click", () => {
        wordCheckUI.style.display = "none";
        guesses = [];
        mostRecentGuessLemma = null;
        guessesContainer.innerHTML = "";
        lastGuessContainer.style.display = "none";
        targetWord = suggestedWord;
        window.SettingsPanel.setCurrentAnswer(suggestedWord);
        updateGuessCount(0);
        gameCreationUI.style.display = "block";
        customWordInput.value = "";
        loadingElement.style.display = "none";
    });

    continueToGame.addEventListener("click", () => {
        guesses = [];
        mostRecentGuessLemma = null;
        guessesContainer.innerHTML = "";
        lastGuessContainer.style.display = "none";
        updateGuessCount(0);
        loadingGame.style.display = "none";
        gameCreationUI.style.display = "block";
        successMessageUI.style.display = "none";
        customWordInput.value = "";
        loadingElement.style.display = "none";
    });

    document.getElementById("howToPlay").addEventListener("click", () => {
        menuOverlay.style.display = "none";
        howToPlayOverlay.style.display = "flex";
    });

    document.getElementById("hintOption").addEventListener("click", () => {
        menuOverlay.style.display = "none";

        const hasGuesses = Array.isArray(guesses) && guesses.length > 0;
        const lowestRank = hasGuesses ? Math.min(...guesses.map(g => Number(g.rank))) : null;

        // Do not provide hints when the best guess is rank 2 or better
        if (lowestRank != null && lowestRank <= 2) {
            return;
        }

        let targetRank;
        if (lowestRank != null && lowestRank < 300) {
            // Never hint ranks below 3
            targetRank = Math.max(2, lowestRank - 1);
        } else {
            targetRank = 300;
        }

        let hintItem = gameData.results.find(item => parseInt(item.rank) === targetRank);
        if (!hintItem) {
            for (let r = targetRank - 1; r >= 3; r--) {
                hintItem = gameData.results.find(item => parseInt(item.rank) === r);
                if (hintItem) break;
            }
        }

        if (hintItem) {
            submitWord({
                comment: hintItem.lemma,
                username: "host",
                nickname: "host",
                uniqueId: "host",
                photoUrl: "https://www.runchatcapture.com/assets/imgs/interactive_contexto_logo.png"
            });
            return;
        }
    });

    document.getElementById("giveUp").addEventListener("click", () => {
        menuOverlay.style.display = "none";
        if (gameData && gameData.results) {
            const winningWord = gameData.results.find((item) => parseInt(item.rank) === 1);
            if (winningWord) submitWord({
                comment: winningWord.lemma,
                username: "host",
                nickname: "host",
                uniqueId: "host",
                photoUrl: "https://www.runchatcapture.com/assets/imgs/interactive_contexto_logo.png"
            });
            else console.log("The target word was: " + targetWord);
        } else console.log("The target word was: " + targetWord);
    });

    spellcheckToggle.addEventListener("click", () => {
        spellcheckEnabled = !spellcheckEnabled;
        spellcheckToggle.src = spellcheckEnabled
            ? "https://www.runchatcapture.com/assets/imgs/spellcheck.png"
            : "https://www.runchatcapture.com/assets/imgs/nospellcheck.png";
    });

    dupesToggle.addEventListener("click", () => {
        allowDuplicates = !allowDuplicates;
        dupesToggle.src = allowDuplicates
            ? "https://www.runchatcapture.com/assets/imgs/acceptdupes.png"
            : "https://www.runchatcapture.com/assets/imgs/blockdupes.png";
    });

    if (darkToggle) {
        const container = document.querySelector('.contexto');
        darkToggle.addEventListener('change', () => {
            
            if (!container) return;
            if (darkToggle.checked) {
                container.classList.add('contexto-dark');
                if (typeof saveDarkModeEnabled === 'function') saveDarkModeEnabled(true);
            } else {
                container.classList.remove('contexto-dark');
                if (typeof saveDarkModeEnabled === 'function') saveDarkModeEnabled(false);
            }
        });
        darkToggle.checked = getDarkModeEnabled();
        if (darkToggle.checked) {
            container.classList.add('contexto-dark');
        }
    } 

    // ============================================================
    // 🌐 EXPOSE PUBLIC API
    // ============================================================
    window.Contexto = {
        initGame: contextoInitGame,
        initCustomGame,
        initNextRound,
        getNextAutomatedWord,
        submitWord,
        findWordRank,
        checkSpelling,
        updateLastGuess,
        renderPreviousGuesses,
        updateGuessCount,
        getState: () => ({ targetWord, guesses, gameData }),
        processGift,
        guesses,
        targetWord,
        gameData
    };

    initDictionary();
})();

// Helper: find the first rank between startRank and maxRank (inclusive)
// that is NOT yet guessed and exists in rankToItem.
function findNextEmptyRank(startRank, maxRank, guesses, rankToItem) {
    const guessedRanks = new Set((guesses || []).map(g => Number(g.rank)));
    for (let r = startRank; r <= maxRank; r++) {
        if (!guessedRanks.has(r) && rankToItem[r]) {
            return r;
        }
    }
    return null;
}

// Process gifts routed from GameManager. If gift name matches saved hint gift, submit next-best words.
function processGift(user) {
    try {
        if (!allowHintsThisRound) return;
        const savedName = typeof getHintGiftName === 'function' ? (getHintGiftName() || '').trim().toLowerCase() : '';
        const incoming = String(user?.giftName || '').trim().toLowerCase();
        const count = Number(user?.giftCount) || 0;
        if (!savedName || !incoming || incoming !== savedName) return;
        const state = window.Contexto.getState();
        const data = state.gameData;
        if (!data || !Array.isArray(data.results) || data.results.length === 0) return;

        // Determine current best rank from guesses
        const currentGuesses = state.guesses || [];
        let lowestRank = Math.min(...currentGuesses.map(g => Number(g.rank)));
        if (lowestRank > 2) {
            let targetFrom = isFinite(lowestRank) ? Math.max(1, lowestRank - 1) : 300;

            // Build a map rank -> lemma for fast lookup
            const rankToItem = {};
            data.results.forEach(it => { const r = parseInt(it.rank); if (!isNaN(r)) rankToItem[r] = it; });

            let submitted = 0;
            let r = targetFrom;
            while (submitted < count && r >= 2) {
                if (rankToItem[r]) {
                    const lemma = rankToItem[r].lemma;
                    // submit as if this user commented the word
                    window.Contexto.submitWord({
                        comment: lemma,
                        nickname: user?.nickname,
                        username: user?.username,
                        uniqueId: user?.uniqueId,
                        photoUrl: user?.photoUrl
                    });
                    submitted++;
                }
                r--;
            }
        } else if (lowestRank === 2) {
            const rankToItem = {};
            data.results.forEach(it => { const r = parseInt(it.rank); if (!isNaN(r)) rankToItem[r] = it; });
            // Each submission should dynamically find the next available (unguessed) rank,
            // starting at 2 and scanning upward every time.
            let submitted = 0;
            while (submitted < count) {
                const liveState = window.Contexto.getState();
                const liveGuesses = liveState.guesses || [];

                const targetFrom = findNextEmptyRank(2, 300, liveGuesses, rankToItem);
                if (targetFrom == null) break; // nothing left in the range

                const item = rankToItem[targetFrom];
                if (!item) break;

                window.Contexto.submitWord({
                    comment: item.lemma,
                    nickname: user?.nickname,
                    username: user?.username,
                    uniqueId: user?.uniqueId,
                    photoUrl: user?.photoUrl
                });

                submitted++;
            }
        }
    } catch (e) {
        console.warn('processGift failed:', e);
    }
}
