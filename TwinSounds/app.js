import wordPairs from './data.js';

class TwinSounds {
    constructor() {
        // Game state
        this.score = {
            correct: 0,
            incorrect: 0,
            streak: 0,
            highestStreak: 0,
            sameWordRounds: 0
        };
        this.availablePairs = [...Array(wordPairs.en.length).keys()];
        this.currentRound = null;
        this.choicesCount = 0;

        // UI elements
        this.correctCount = document.getElementById('correct-count');
        this.errorCount = document.getElementById('error-count');
        this.streakCount = document.getElementById('streak-count');
        this.pairsCount = document.getElementById('pairs-count');
        this.playAudio1Slow = document.getElementById('play-audio1-slow');
        this.playAudio1Normal = document.getElementById('play-audio1-normal');
        this.playAudio2Slow = document.getElementById('play-audio2-slow');
        this.playAudio2Normal = document.getElementById('play-audio2-normal');
        this.wordsDisplay = document.querySelector('.words-display');
        this.word1Element = document.getElementById('word1');
        this.word2Element = document.getElementById('word2');
        this.sameWordBtn = document.getElementById('same-word');
        this.differentWordsBtn = document.getElementById('different-words');
        
        // Audio elements
        this.audio1 = new Audio();
        this.audio2 = new Audio();
        this.correctSound = new Audio('correct.mp3');
        this.errorSound = new Audio('error.mp3');

        // Modal elements
        this.progressModal = document.getElementById('progress-modal');
        this.modalCorrect = document.getElementById('modal-correct');
        this.modalErrors = document.getElementById('modal-errors');
        this.modalStreak = document.getElementById('modal-streak');
        this.modalPairs = document.getElementById('modal-pairs');
        this.continueBtn = document.getElementById('continue-btn');
        this.restartBtn = document.getElementById('restart-btn');

        this.init();
    }

    init() {
        // Load saved state if exists
        this.loadState();
        
        // Setup event listeners
        this.playAudio1Slow.addEventListener('click', () => this.playAudio(1, true));
        this.playAudio1Normal.addEventListener('click', () => this.playAudio(1, false));
        this.playAudio2Slow.addEventListener('click', () => this.playAudio(2, true));
        this.playAudio2Normal.addEventListener('click', () => this.playAudio(2, false));
        this.sameWordBtn.addEventListener('click', () => this.checkAnswer(true));
        this.differentWordsBtn.addEventListener('click', () => this.checkAnswer(false));
        this.continueBtn.addEventListener('click', () => this.continueGame());
        this.restartBtn.addEventListener('click', () => this.restartGame());

        // Start first round
        this.loadNewRound();
        this.updateUI();
    }

    loadState() {
        const savedState = localStorage.getItem('twinSounds.state');
        if (savedState) {
            const state = JSON.parse(savedState);
            this.score = state.score;
            this.availablePairs = state.availablePairs;
            this.updateUI();
        }
    }

    saveState() {
        const state = {
            score: this.score,
            availablePairs: this.availablePairs
        };
        localStorage.setItem('twinSounds.state', JSON.stringify(state));
    }

    loadNewRound() {
        // Reset UI state
        this.wordsDisplay.classList.add('hidden');
        this.enableButtons(true);
        
        // Seleciona um par aleatório do conjunto disponível
        const indexA = Math.floor(Math.random() * this.availablePairs.length);
        const pairIndex = this.availablePairs[indexA];
        const selectedPair = wordPairs.en[pairIndex];
        
        // Escolhe aleatoriamente sound1 ou sound2 para cada botão
        const useSound1ForAudio1 = Math.random() < 0.5;
        const useSound1ForAudio2 = Math.random() < 0.5;
        
        this.currentRound = {
            currentPair: selectedPair,
            audio1: useSound1ForAudio1 ? selectedPair.sound1 : selectedPair.sound2,
            audio2: useSound1ForAudio2 ? selectedPair.sound1 : selectedPair.sound2,
            word1: useSound1ForAudio1 ? selectedPair.word1 : selectedPair.word2,
            word2: useSound1ForAudio2 ? selectedPair.word1 : selectedPair.word2,
            areSame: useSound1ForAudio1 === useSound1ForAudio2
        };

        // Prepare audio elements
        this.audio1.src = this.currentRound.audio1;
        this.audio2.src = this.currentRound.audio2;

        // Update pairs count
        this.pairsCount.textContent = this.availablePairs.length;
    }

    async playAudio(number, isSlowMode) {
        const audio = number === 1 ? this.audio1 : this.audio2;
        const slowButton = number === 1 ? this.playAudio1Slow : this.playAudio2Slow;
        const normalButton = number === 1 ? this.playAudio1Normal : this.playAudio2Normal;
        const word = number === 1 ? this.currentRound.word1 : this.currentRound.word2;
        
        // Set playback speed based on mode
        audio.playbackRate = isSlowMode ? 0.7 : 1.0;
        
        // Disable both buttons for this audio group
        slowButton.disabled = true;
        normalButton.disabled = true;
        
        try {
            await audio.play();
            // Re-enable buttons after playback
            slowButton.disabled = false;
            normalButton.disabled = false;
        } catch (error) {
            console.error('Error playing audio:', error);
            slowButton.disabled = false;
            normalButton.disabled = false;
        }
    }

    checkAnswer(answeredSame) {
        const isActuallySame = this.currentRound.areSame;
        const isCorrect = answeredSame === isActuallySame;
        const selectedButton = answeredSame ? this.sameWordBtn : this.differentWordsBtn;
        
        // Disable buttons and show words
        this.enableButtons(false);
        this.revealWords();
        
        // Update score
        if (isCorrect) {
            this.score.correct++;
            this.score.streak++;
            this.score.highestStreak = Math.max(this.score.highestStreak, this.score.streak);
            selectedButton.classList.add('correct');
            this.correctSound.play();
            
            // Add 5 more pairs on correct answer
            this.addNewPairs(5);
        } else {
            this.score.incorrect++;
            this.score.streak = 0;
            selectedButton.classList.add('wrong');
            this.errorSound.play();
        }
        
        this.updateUI();
        this.saveState();
        
        // Check if we should show progress modal
        this.choicesCount++;
        if (this.choicesCount % 10 === 0) {
            setTimeout(() => this.showProgressModal(), 1500);
        } else {
            setTimeout(() => this.loadNewRound(), 1500);
        }
    }

    revealWords() {
        this.word1Element.textContent = this.currentRound.word1;
        this.word2Element.textContent = this.currentRound.word2;
        this.wordsDisplay.classList.remove('hidden');
    }

    enableButtons(enabled) {
        this.playAudio1Slow.disabled = !enabled;
        this.playAudio1Normal.disabled = !enabled;
        this.playAudio2Slow.disabled = !enabled;
        this.playAudio2Normal.disabled = !enabled;
        this.sameWordBtn.disabled = !enabled;
        this.differentWordsBtn.disabled = !enabled;
        
        if (enabled) {
            this.sameWordBtn.classList.remove('correct', 'wrong');
            this.differentWordsBtn.classList.remove('correct', 'wrong');
        }
    }

    addNewPairs(count) {
        // Only add new pairs if we haven't used all available pairs
        if (this.availablePairs.length < wordPairs.en.length) {
            const unusedPairs = [...Array(wordPairs.en.length).keys()]
                .filter(i => !this.availablePairs.includes(i));
            
            for (let i = 0; i < count && unusedPairs.length > 0; i++) {
                const randomIndex = Math.floor(Math.random() * unusedPairs.length);
                this.availablePairs.push(unusedPairs[randomIndex]);
                unusedPairs.splice(randomIndex, 1);
            }
        }
    }

    showProgressModal() {
        this.modalCorrect.textContent = this.score.correct;
        this.modalErrors.textContent = this.score.incorrect;
        this.modalStreak.textContent = this.score.highestStreak;
        this.modalPairs.textContent = this.availablePairs.length;
        this.progressModal.classList.remove('hidden');
    }

    continueGame() {
        this.progressModal.classList.add('hidden');
        this.loadNewRound();
    }

    restartGame() {
        // Reset game state
        this.score = {
            correct: 0,
            incorrect: 0,
            streak: 0,
            highestStreak: 0,
            sameWordRounds: 0
        };
        this.availablePairs = [...Array(20).keys()];
        this.choicesCount = 0;
        
        // Clear localStorage
        localStorage.removeItem('twinSounds.state');
        
        // Hide modal and start new round
        this.progressModal.classList.add('hidden');
        this.loadNewRound();
        this.updateUI();
    }

    updateUI() {
        this.correctCount.textContent = this.score.correct;
        this.errorCount.textContent = this.score.incorrect;
        this.streakCount.textContent = this.score.streak;
        this.pairsCount.textContent = this.availablePairs.length;
    }
}

// Start the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TwinSounds();
});