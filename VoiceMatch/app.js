import phrases from './data.js';

class VoiceMatch {
    constructor() {
        this.currentPhrase = null;
        this.score = {
            correct: 0,
            incorrect: 0,
            streak: 0
        };

        // UI elements
        this.playButton = document.getElementById('play-audio');
        this.optionsContainer = document.querySelector('.options-container');
        this.nextButton = document.getElementById('next-phrase');
        this.correctCount = document.getElementById('correct-count');
        this.errorCount = document.getElementById('error-count');
        this.streakCount = document.getElementById('streak-count');

        // Speech synthesis
        this.synthesis = window.speechSynthesis;
        this.voice = null;

        this.init();
    }

    async init() {
        // Initialize speech synthesis
        await this.setupVoice();
        
        // Event listeners
        this.playButton.addEventListener('click', () => this.playAudio());
        this.nextButton.addEventListener('click', () => this.loadNewPhrase());
        
        // Start game
        this.loadNewPhrase();
    }

    async setupVoice() {
        // Wait for voices to be loaded
        if (speechSynthesis.getVoices().length === 0) {
            await new Promise(resolve => {
                speechSynthesis.addEventListener('voiceschanged', resolve, { once: true });
            });
        }

        // Get English voice
        const voices = speechSynthesis.getVoices();
        this.voice = voices.find(voice => voice.lang.startsWith('en')) || voices[0];
    }

    playAudio() {
        if (!this.currentPhrase) return;

        // Cancel any ongoing speech
        this.synthesis.cancel();

        // Create and configure utterance
        const utterance = new SpeechSynthesisUtterance(this.currentPhrase.correct);
        utterance.voice = this.voice;
        utterance.rate = 0.9; // Slightly slower for better comprehension
        utterance.pitch = 1;

        // Play the audio
        this.synthesis.speak(utterance);
    }

    loadNewPhrase() {
        // Get random phrase
        const randomIndex = Math.floor(Math.random() * phrases.length);
        this.currentPhrase = phrases[randomIndex];

        // Clear previous options
        this.optionsContainer.innerHTML = '';

        // Shuffle options
        const shuffledOptions = [...this.currentPhrase.options].sort(() => Math.random() - 0.5);

        // Create option buttons
        shuffledOptions.forEach(option => {
            const button = document.createElement('button');
            button.className = 'option-btn';
            button.textContent = option;
            button.addEventListener('click', () => this.checkAnswer(option));
            this.optionsContainer.appendChild(button);
        });

        // Reset button states
        this.nextButton.disabled = true;
        this.enableAllOptions();
    }

    checkAnswer(selectedOption) {
        const isCorrect = selectedOption === this.currentPhrase.correct;
        const buttons = this.optionsContainer.querySelectorAll('.option-btn');
        
        // Find and mark the selected button
        buttons.forEach(button => {
            if (button.textContent === selectedOption) {
                button.classList.add(isCorrect ? 'correct' : 'incorrect');
                if (isCorrect) {
                    // Adiciona a tradução abaixo do texto
                    button.innerHTML = `${selectedOption}<div class="translation">${this.currentPhrase.translation}</div>`;
                }
            }
            if (!isCorrect && button.textContent === this.currentPhrase.correct) {
                button.classList.add('correct');
                // Mostra a tradução na opção correta também
                button.innerHTML = `${this.currentPhrase.correct}<div class="translation">${this.currentPhrase.translation}</div>`;
            }
            button.disabled = true;
        });

        // Update score
        if (isCorrect) {
            this.score.correct++;
            this.score.streak++;
        } else {
            this.score.incorrect++;
            this.score.streak = 0;
        }

        // Update UI
        this.correctCount.textContent = this.score.correct;
        this.errorCount.textContent = this.score.incorrect;
        this.streakCount.textContent = this.score.streak;

        // Enable next button
        this.nextButton.disabled = false;
    }

    enableAllOptions() {
        const buttons = this.optionsContainer.querySelectorAll('.option-btn');
        buttons.forEach(button => {
            button.disabled = false;
            button.classList.remove('correct', 'incorrect');
        });
    }
}

// Start the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new VoiceMatch();
});