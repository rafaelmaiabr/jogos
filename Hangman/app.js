import words from './data.js';

class HangmanGame {
    constructor() {
        this.word = '';
        this.hint = '';
        this.remainingGuesses = 10;
        this.guessedLetters = new Set();
        this.drawElements = ['base', 'pole', 'top', 'rope', 'head', 'body', 'left-arm', 'right-arm', 'left-leg', 'right-leg'];
        this.wrongGuesses = 0;
        this.currentDifficulty = 'medium'; // default difficulty
        
        this.wordDisplay = document.querySelector('.word-display');
        this.keyboard = document.querySelector('.keyboard');
        this.hintText = document.querySelector('.hint span');
        this.remainingGuessesText = document.querySelector('.remaining-guesses span');
        this.wrongLettersText = document.querySelector('.wrong-letters span');
        this.newGameBtn = document.querySelector('.new-game-btn');
        this.difficultyBtns = document.querySelectorAll('.difficulty-btn');
        
        // Adicionar sons
        this.correctSound = new Audio('correct.mp3');
        this.errorSound = new Audio('error.mp3');
        
        this.init();
    }

    init() {
        this.setupKeyboard();
        this.setupDifficultyButtons();
        this.newGameBtn.addEventListener('click', () => this.startNewGame());
        this.startNewGame();
    }

    setupDifficultyButtons() {
        this.difficultyBtns.forEach(btn => {
            if (btn.dataset.difficulty === this.currentDifficulty) {
                btn.classList.add('selected');
            }
            btn.addEventListener('click', () => {
                // Remove selected class from all buttons
                this.difficultyBtns.forEach(b => b.classList.remove('selected'));
                // Add selected class to clicked button
                btn.classList.add('selected');
                this.currentDifficulty = btn.dataset.difficulty;
                this.startNewGame();
            });
        });
    }

    setupKeyboard() {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        this.keyboard.innerHTML = ''; // Clear existing keyboard
        letters.forEach(letter => {
            const button = document.createElement('button');
            button.textContent = letter;
            button.classList.add('key');
            button.addEventListener('click', () => this.handleGuess(letter));
            this.keyboard.appendChild(button);
        });
    }

    startNewGame() {
        // Get words for current difficulty
        const difficultyWords = words[this.currentDifficulty];
        const randomWord = difficultyWords[Math.floor(Math.random() * difficultyWords.length)];
        this.word = randomWord.word;
        this.hint = randomWord.hint;
        
        // Set guesses based on difficulty
        switch(this.currentDifficulty) {
            case 'easy':
                this.remainingGuesses = 12;
                break;
            case 'medium':
                this.remainingGuesses = 10;
                break;
            case 'hard':
                this.remainingGuesses = 8;
                break;
        }

        this.guessedLetters.clear();
        this.wrongGuesses = 0;

        // Reset UI
        this.hintText.textContent = this.hint;
        this.remainingGuessesText.textContent = this.remainingGuesses;
        this.wrongLettersText.textContent = '';
        this.updateWordDisplay();
        this.resetDrawing();
        this.resetKeyboard();
    }

    updateWordDisplay() {
        this.wordDisplay.innerHTML = '';
        [...this.word].forEach(letter => {
            const letterElement = document.createElement('div');
            letterElement.classList.add('letter');
            letterElement.textContent = this.guessedLetters.has(letter) ? letter : '';
            this.wordDisplay.appendChild(letterElement);
        });
    }

    handleGuess(letter) {
        if (this.guessedLetters.has(letter)) return;

        this.guessedLetters.add(letter);
        const button = [...this.keyboard.children].find(btn => btn.textContent === letter);

        if (this.word.includes(letter)) {
            button.classList.add('correct');
            this.correctSound.play(); // Tocar som de acerto
            this.updateWordDisplay();
            // Adiciona confetes quando acerta uma letra
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff']
            });
            this.checkWin();
        } else {
            button.classList.add('wrong');
            this.errorSound.play(); // Tocar som de erro
            this.wrongGuesses++;
            this.remainingGuesses--;
            this.remainingGuessesText.textContent = this.remainingGuesses;
            this.updateWrongLetters();
            this.updateDrawing();
            this.checkLoss();
        }

        button.disabled = true;
    }

    updateWrongLetters() {
        const wrongLetters = [...this.guessedLetters].filter(letter => !this.word.includes(letter));
        this.wrongLettersText.textContent = wrongLetters.join(', ');
    }

    updateDrawing() {
        if (this.wrongGuesses <= this.drawElements.length) {
            const element = document.querySelector(`.${this.drawElements[this.wrongGuesses - 1]}`);
            element.classList.add('show');
        }
    }

    resetDrawing() {
        this.drawElements.forEach(element => {
            document.querySelector(`.${element}`).classList.remove('show');
        });
    }

    resetKeyboard() {
        [...this.keyboard.children].forEach(button => {
            button.classList.remove('correct', 'wrong');
            button.disabled = false;
        });
    }

    checkWin() {
        const isWin = [...this.word].every(letter => this.guessedLetters.has(letter));
        if (isWin) {
            setTimeout(() => {
                // Explosão de confetes na vitória
                const end = Date.now() + (3 * 1000);
                const colors = ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff'];

                (function frame() {
                    confetti({
                        particleCount: 7,
                        angle: 60,
                        spread: 55,
                        origin: { x: 0 },
                        colors: colors
                    });
                    confetti({
                        particleCount: 7,
                        angle: 120,
                        spread: 55,
                        origin: { x: 1 },
                        colors: colors
                    });

                    if (Date.now() < end) {
                        requestAnimationFrame(frame);
                    }
                }());

                alert(`Congratulations! You won on ${this.currentDifficulty} difficulty!`);
                this.startNewGame();
            }, 500);
        }
    }

    checkLoss() {
        if (this.remainingGuesses === 0) {
            setTimeout(() => {
                alert(`Game Over! The word was: ${this.word}\nDifficulty: ${this.currentDifficulty}`);
                this.startNewGame();
            }, 500);
        }
    }
}

// Start the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new HangmanGame();
});