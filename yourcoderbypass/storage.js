// storage.js
// Centralized localStorage manager for Wordle on Stream

const STORAGE_KEYS = {
    // Game settings
    LANGUAGE: "language",
    PLAY_MODE: "tiktok",
    REQUIRED_GUESSES: "requiredGuesses",
    WORD_LENGTH: "wordLength",
    ROW_COUNT: "rowCount",
    BOARD_WIDTH: "boardWidth",
    KEYBOARD_VISIBILITY_OFF: "keyboardVisibilityOff",
    STREAK_VISIBILITY: "streakVisibility",

    // Simulation
    SIMULATE_GUESSES: "simulateGuesses",
    SIMULATE_GROUP_GUESSES: "simulateGroupGuesses",
    SIMULATE_GROUP_LOSS: "simulateGroupLoss",
    STACK_HEIGHT: "stackHeight",

    // Winning popup
    WINNING_SOUND_URL: "winningSoundUrl",
    WINNING_MODAL_DURATION: "winningModalDuration",

    // Instruction popup
    INSTRUCTION_ACTIVE: "instructionPopupActive",
    INSTRUCTION_DURATION: "instructionPopupDuration",
    INSTRUCTION_TEXT: "instructionPopupText",
    INSTRUCTION_GIF: "instructionPopupGif",

    // Text-to-Speech
    TTS_ENABLED: "ttsEnabled",
    TTS_VOICE: "ttsVoice",
    TTS_VOLUME: "ttsVolume",
    TTS_RATE: "ttsRate",
    TTS_READ_WORDS: "ttsReadWords",
    TTS_ROUND_START_ENABLED: "ttsRoundStartEnabled",
    TTS_ROUND_START_TEXTS: "ttsRoundStartTexts",
    TTS_GAME_WON_ENABLED: "ttsGameWonEnabled",
    TTS_GAME_WON_TEXTS: "ttsGameWonTexts",
    TTS_GAMEPLAY_ENABLED: "ttsGameplayEnabled",
    TTS_GAMEPLAY_INTERVAL: "ttsGameplayInterval",
    TTS_GAMEPLAY_TEXTS: "ttsGameplayTexts",

    // Statistics
    GAMES_PLAYED: "gamesPlayed",
    GAMES_WON: "gamesWon",
    CURRENT_STREAK: "currentStreak",
    MAX_STREAK: "maxStreak",

    // Profile
    PROFILE_IMAGE: "profileImage",
    PROFILE_USERNAME: "profileUsername",
    // Display
    DARK_MODE: "contextoDarkMode",
    // Game integrations
    HINT_GIFT_NAME: "contextoHintGiftName",
    // Automated word list
    AUTOMATED_WORD_LIST: "automatedWordList"
};

// --- Generic helpers ---
function saveItem(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function getItem(key, defaultValue = null) {
    const val = localStorage.getItem(key);
    return val !== null ? JSON.parse(val) : defaultValue;
}

function removeItem(key) {
    localStorage.removeItem(key);
}

function clearAllStorage() {
    localStorage.clear();
}

// --- Settings ---
function saveLanguage(lang) { saveItem(STORAGE_KEYS.LANGUAGE, lang); }
function getLanguage() { return getItem(STORAGE_KEYS.LANGUAGE, "en"); }

function savePlayMode(mode) { saveItem(STORAGE_KEYS.PLAY_MODE, mode); }
function getPlayMode() { return getItem(STORAGE_KEYS.PLAY_MODE, "tiktok"); }

function saveWordLength(len) { saveItem(STORAGE_KEYS.WORD_LENGTH, len); }
function getWordLength() { return getItem(STORAGE_KEYS.WORD_LENGTH, 5); }

function saveRowCount(rows) { saveItem(STORAGE_KEYS.ROW_COUNT, rows); }
function getRowCount() { return getItem(STORAGE_KEYS.ROW_COUNT, 6); }

function saveBoardWidth(width) { saveItem(STORAGE_KEYS.BOARD_WIDTH, width); }
function getBoardWidth() { return getItem(STORAGE_KEYS.BOARD_WIDTH, 350); }

function saveKeyboardVisibilityOff(val) { saveItem(STORAGE_KEYS.KEYBOARD_VISIBILITY_OFF, val); }
function getKeyboardVisibilityOff() { return getItem(STORAGE_KEYS.KEYBOARD_VISIBILITY_OFF, false); }

function saveStreakVisibility(val) { saveItem(STORAGE_KEYS.STREAK_VISIBILITY, val); }
function getStreakVisibility() { return getItem(STORAGE_KEYS.STREAK_VISIBILITY, true); }

// --- Simulation ---
function saveSimulateGuesses(val) { saveItem(STORAGE_KEYS.SIMULATE_GUESSES, val); }
function getSimulateGuesses() { return getItem(STORAGE_KEYS.SIMULATE_GUESSES, false); }

function saveSimulateGroupGuesses(val) { saveItem(STORAGE_KEYS.SIMULATE_GROUP_GUESSES, val); }
function getSimulateGroupGuesses() { return getItem(STORAGE_KEYS.SIMULATE_GROUP_GUESSES, false); }

function saveSimulateGroupLoss(val) { saveItem(STORAGE_KEYS.SIMULATE_GROUP_LOSS, val); }
function getSimulateGroupLoss() { return getItem(STORAGE_KEYS.SIMULATE_GROUP_LOSS, false); }

function saveStackHeight(px) { saveItem(STORAGE_KEYS.STACK_HEIGHT, px); }
function getStackHeight() { return getItem(STORAGE_KEYS.STACK_HEIGHT, 220); }

// --- Winning popup ---
function saveWinningSoundUrl(url) { saveItem(STORAGE_KEYS.WINNING_SOUND_URL, url); }
function getWinningSoundUrl() { return getItem(STORAGE_KEYS.WINNING_SOUND_URL, ""); }

function saveWinningModalDuration(sec) { saveItem(STORAGE_KEYS.WINNING_MODAL_DURATION, sec); }
function getWinningModalDuration() { return getItem(STORAGE_KEYS.WINNING_MODAL_DURATION, 5); }

// --- Instruction popup ---
function saveInstructionActive(val) { saveItem(STORAGE_KEYS.INSTRUCTION_ACTIVE, val); }
function getInstructionActive() { return getItem(STORAGE_KEYS.INSTRUCTION_ACTIVE, false); }

function saveInstructionDuration(sec) { saveItem(STORAGE_KEYS.INSTRUCTION_DURATION, sec); }
function getInstructionDuration() { return getItem(STORAGE_KEYS.INSTRUCTION_DURATION, 3); }

function saveInstructionText(txt) { saveItem(STORAGE_KEYS.INSTRUCTION_TEXT, txt); }
function getInstructionText() { return getItem(STORAGE_KEYS.INSTRUCTION_TEXT, "Guess the word to win!"); }

function saveInstructionGif(url) { saveItem(STORAGE_KEYS.INSTRUCTION_GIF, url); }
function getInstructionGif() { return getItem(STORAGE_KEYS.INSTRUCTION_GIF, ""); }

// --- TTS ---
function saveTtsEnabled(val) { saveItem(STORAGE_KEYS.TTS_ENABLED, val); }
function getTtsEnabled() { return getItem(STORAGE_KEYS.TTS_ENABLED, false); }

function saveTtsVoice(voice) { saveItem(STORAGE_KEYS.TTS_VOICE, voice); }
function getTtsVoice() { return getItem(STORAGE_KEYS.TTS_VOICE, ""); }

function saveTtsVolume(vol) { saveItem(STORAGE_KEYS.TTS_VOLUME, vol); }
function getTtsVolume() { return getItem(STORAGE_KEYS.TTS_VOLUME, 50); }

function saveTtsRate(rate) { saveItem(STORAGE_KEYS.TTS_RATE, rate); }
function getTtsRate() { return getItem(STORAGE_KEYS.TTS_RATE, 10); }

function saveTtsReadWords(val) { saveItem(STORAGE_KEYS.TTS_READ_WORDS, val); }
function getTtsReadWords() { return getItem(STORAGE_KEYS.TTS_READ_WORDS, false); }

function saveTtsRoundStartEnabled(val) { saveItem(STORAGE_KEYS.TTS_ROUND_START_ENABLED, val); }
function getTtsRoundStartEnabled() { return getItem(STORAGE_KEYS.TTS_ROUND_START_ENABLED, false); }

function saveTtsRoundStartTexts(txts) { saveItem(STORAGE_KEYS.TTS_ROUND_START_TEXTS, txts); }
function getTtsRoundStartTexts() { return getItem(STORAGE_KEYS.TTS_ROUND_START_TEXTS, "Welcome to Wordle!"); }

function saveTtsGameWonEnabled(val) { saveItem(STORAGE_KEYS.TTS_GAME_WON_ENABLED, val); }
function getTtsGameWonEnabled() { return getItem(STORAGE_KEYS.TTS_GAME_WON_ENABLED, false); }

function saveTtsGameWonTexts(txts) { saveItem(STORAGE_KEYS.TTS_GAME_WON_TEXTS, txts); }
function getTtsGameWonTexts() { return getItem(STORAGE_KEYS.TTS_GAME_WON_TEXTS, "Congratulations!"); }

function saveTtsGameplayEnabled(val) { saveItem(STORAGE_KEYS.TTS_GAMEPLAY_ENABLED, val); }
function getTtsGameplayEnabled() { return getItem(STORAGE_KEYS.TTS_GAMEPLAY_ENABLED, false); }

function saveTtsGameplayInterval(sec) { saveItem(STORAGE_KEYS.TTS_GAMEPLAY_INTERVAL, sec); }
function getTtsGameplayInterval() { return getItem(STORAGE_KEYS.TTS_GAMEPLAY_INTERVAL, 30); }

function saveTtsGameplayTexts(txts) { saveItem(STORAGE_KEYS.TTS_GAMEPLAY_TEXTS, txts); }
function getTtsGameplayTexts() { return getItem(STORAGE_KEYS.TTS_GAMEPLAY_TEXTS, "Keep going!"); }

// --- Statistics ---
function saveGamesPlayed(val) { saveItem(STORAGE_KEYS.GAMES_PLAYED, val); }
function getGamesPlayed() { return getItem(STORAGE_KEYS.GAMES_PLAYED, 0); }

function saveGamesWon(val) { saveItem(STORAGE_KEYS.GAMES_WON, val); }
function getGamesWon() { return getItem(STORAGE_KEYS.GAMES_WON, 0); }

function saveCurrentStreak(val) { saveItem(STORAGE_KEYS.CURRENT_STREAK, val); }
function getCurrentStreak() { return getItem(STORAGE_KEYS.CURRENT_STREAK, 0); }

function saveMaxStreak(val) { saveItem(STORAGE_KEYS.MAX_STREAK, val); }
function getMaxStreak() { return getItem(STORAGE_KEYS.MAX_STREAK, 0); }

function clearStatistics() {
    removeItem(STORAGE_KEYS.GAMES_PLAYED);
    removeItem(STORAGE_KEYS.GAMES_WON);
    removeItem(STORAGE_KEYS.CURRENT_STREAK);
    removeItem(STORAGE_KEYS.MAX_STREAK);
}

// --- Profile ---
function saveProfileImage(url) { saveItem(STORAGE_KEYS.PROFILE_IMAGE, url); }
function getProfileImage() { return getItem(STORAGE_KEYS.PROFILE_IMAGE, ""); }

function saveProfileUsername(name) { saveItem(STORAGE_KEYS.PROFILE_USERNAME, name); }
function getProfileUsername() { return getItem(STORAGE_KEYS.PROFILE_USERNAME, "Host"); }

// --- Display ---
function saveDarkModeEnabled(val) { saveItem(STORAGE_KEYS.DARK_MODE, !!val); }
function getDarkModeEnabled() { return getItem(STORAGE_KEYS.DARK_MODE, false); }

// --- Game integrations ---
function saveHintGiftName(value) { saveItem(STORAGE_KEYS.HINT_GIFT_NAME, String(value || "")); }
function getHintGiftName() { return getItem(STORAGE_KEYS.HINT_GIFT_NAME, ""); }

// --- Automated word list ---
function saveAutomatedWordList(wordsArray) { saveItem(STORAGE_KEYS.AUTOMATED_WORD_LIST, wordsArray); }
function getAutomatedWordList() { return getItem(STORAGE_KEYS.AUTOMATED_WORD_LIST, []); }
function clearAutomatedWordList() { removeItem(STORAGE_KEYS.AUTOMATED_WORD_LIST); }
