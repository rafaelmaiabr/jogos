import { wordPairs } from './data.js';

// Estado do jogo
let gameState = {
    currentLevel: 1,
    remainingPairs: [],
    selectedBlock: null,
    selectedSide: null,
    timeLeft: 20,
    correctCount: 0,
    errorCount: 0,
    streakCount: 0,
    highestStreak: 0,  // Nova variável para armazenar a maior sequência
    timerInterval: null,
    isGameStarted: false,
    playerName: ''
};

// Criando elementos de áudio
const correctSound = new Audio('good.mp3');
const errorSound = new Audio('error.mp3');

// Função para tocar sons
const playSound = (isCorrect) => {
    if (isCorrect) {
        correctSound.currentTime = 0;
        correctSound.play();
    } else {
        errorSound.currentTime = 0;
        errorSound.play();
    }
};

// Funções de gerenciamento do LocalStorage
const saveState = () => {
    localStorage.setItem('mnemoGame.level', gameState.currentLevel);
    localStorage.setItem('mnemoGame.remaining', JSON.stringify(gameState.remainingPairs));
};

const saveGameHistory = () => {
    const gameResult = {
        playerName: gameState.playerName,
        date: new Date().toLocaleString(),
        correctCount: gameState.correctCount,
        errorCount: gameState.errorCount,
        streakCount: gameState.highestStreak,  // Usa highestStreak em vez de streakCount
        level: gameState.currentLevel
    };

    // Carregar histórico existente
    let history = JSON.parse(localStorage.getItem('mnemoGame.history') || '[]');
    
    // Adicionar nova entrada
    history.unshift(gameResult);
    
    // Manter apenas as últimas 20 partidas
    if (history.length > 20) {
        history = history.slice(0, 20);
    }
    
    // Salvar histórico atualizado
    localStorage.setItem('mnemoGame.history', JSON.stringify(history));
    
    // Salvar última partida separadamente
    localStorage.setItem('mnemoGame.lastGame', JSON.stringify(gameResult));
    
    // Atualizar a exibição do histórico
    updateHistoryDisplay();
};

const updateHistoryDisplay = () => {
    // Atualizar informações da última partida
    const lastGame = JSON.parse(localStorage.getItem('mnemoGame.lastGame') || '{}');
    if (lastGame.playerName) {
        document.getElementById('last-player').textContent = lastGame.playerName;
        document.getElementById('last-date').textContent = lastGame.date;
        document.getElementById('last-score').textContent = `${lastGame.correctCount} acertos`;
    }

    // Atualizar tabela de histórico
    const history = JSON.parse(localStorage.getItem('mnemoGame.history') || '[]');
    const tbody = document.getElementById('history-tbody');
    tbody.innerHTML = '';

    history.forEach(game => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${game.date}</td>
            <td>${game.correctCount}</td>
            <td>${game.errorCount}</td>
            <td>${game.streakCount}</td>
            <td>${game.level}</td>
        `;
        tbody.appendChild(row);
    });
};

// Configurar o formulário de nome do usuário
const setupUserForm = () => {
    const userNameInput = document.getElementById('user-name');
    const startButton = document.getElementById('start-btn');

    // Carregar nome do usuário do localStorage se existir
    const savedName = localStorage.getItem('mnemoGame.playerName');
    if (savedName) {
        userNameInput.value = savedName;
        startButton.disabled = false;
    }

    userNameInput.addEventListener('input', (e) => {
        const name = e.target.value.trim();
        startButton.disabled = name.length < 3;
        if (name.length >= 3) {
            localStorage.setItem('mnemoGame.playerName', name);
        }
    });
};

const loadState = () => {
    const level = parseInt(localStorage.getItem('mnemoGame.level')) || 1;
    const remaining = JSON.parse(localStorage.getItem('mnemoGame.remaining')) || [];
    return { level, remaining };
};

// Função para embaralhar array
const shuffle = array => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

// Inicializa o temporizador
const startTimer = () => {
    clearInterval(gameState.timerInterval);
    const timerElement = document.getElementById('timer');
    
    gameState.timerInterval = setInterval(() => {
        gameState.timeLeft--;
        timerElement.textContent = gameState.timeLeft;
        
        // Adiciona aviso visual quando o tempo estiver acabando
        if (gameState.timeLeft <= 5) {
            timerElement.parentElement.classList.add('warning');
        }
        
        if (gameState.timeLeft <= 0) {
            endGame();
        }
    }, 1000);
};

// Finaliza o jogo quando o tempo acabar
const endGame = () => {
    clearInterval(gameState.timerInterval);
    
    // Salvar resultado do jogo no histórico
    saveGameHistory();
    
    // Esconde o conteúdo do jogo
    const gameContent = document.getElementById('game-content');
    gameContent.classList.add('hidden');
    
    // Atualiza e mostra o modal
    const finalScoreContent = document.getElementById('final-score-content');
    finalScoreContent.innerHTML = `
        <p>Jogador: ${gameState.playerName}</p>
        <p>Acertos: ${gameState.correctCount}</p>
        <p>Erros: ${gameState.errorCount}</p>
        <p>Maior Sequência: ${gameState.highestStreak}</p>
        <p>Nível Alcançado: ${gameState.currentLevel}</p>
    `;
    
    const modal = document.getElementById('end-game-modal');
    modal.classList.remove('hidden');
    
    // Reseta o estado do jogo
    localStorage.removeItem('mnemoGame.level');
    localStorage.removeItem('mnemoGame.remaining');
    
    gameState = {
        currentLevel: 1,
        remainingPairs: [],
        selectedBlock: null,
        selectedSide: null,
        timeLeft: 20,
        correctCount: 0,
        errorCount: 0,
        streakCount: 0,
        highestStreak: 0,
        timerInterval: null,
        isGameStarted: false,
        playerName: gameState.playerName
    };
};

// Reseta o jogo
const resetGame = () => {
    gameState = {
        currentLevel: 1,
        remainingPairs: generatePairsForLevel(1),
        selectedBlock: null,
        selectedSide: null,
        timeLeft: 20,
        correctCount: 0,
        errorCount: 0,
        streakCount: 0,
        highestStreak: 0,
        timerInterval: null,
        isGameStarted: false,
        playerName: gameState.playerName
    };
    updateCounters();
    document.getElementById('current-level').textContent = 1;
    document.getElementById('timer').textContent = 20;
    document.getElementById('timer').parentElement.classList.remove('warning');
    renderRound();
    startTimer();
};

// Atualiza os contadores na interface
const updateCounters = () => {
    document.getElementById('correct-count').textContent = gameState.correctCount;
    document.getElementById('error-count').textContent = gameState.errorCount;
    document.getElementById('streak-count').textContent = gameState.streakCount;
};

// Modifica a função initGame para não iniciar automaticamente
const initGame = () => {
    const savedState = loadState();
    gameState.currentLevel = savedState.level;
    gameState.remainingPairs = savedState.remaining.length ? savedState.remaining : generatePairsForLevel(savedState.level);
    document.getElementById('current-level').textContent = gameState.currentLevel;
    renderRound();
    startTimer();
    updateCounters();
};

// Gera pares para o nível atual
const generatePairsForLevel = (level) => {
    const pairsCount = 30 + (level - 1) * 15;
    return shuffle([...Array(Math.min(pairsCount, wordPairs.length)).keys()]);
};

// Renderiza uma nova rodada
const renderRound = () => {
    const leftColumn = document.getElementById('left-column');
    const rightColumn = document.getElementById('right-column');
    leftColumn.innerHTML = '';
    rightColumn.innerHTML = '';

    const pairsForRound = gameState.remainingPairs.slice(0, 5);
    const shuffledRight = shuffle([...pairsForRound]);

    pairsForRound.forEach(index => {
        const leftBlock = createWordBlock(wordPairs[index].pt, index, 'left');
        leftColumn.appendChild(leftBlock);
    });

    shuffledRight.forEach(index => {
        const rightBlock = createWordBlock(wordPairs[index].en, index, 'right');
        rightColumn.appendChild(rightBlock);
    });
};

// Substitui um par acertado por um novo par
const replaceMatchedPair = (leftIndex, rightIndex) => {
    const leftColumn = document.getElementById('left-column');
    const rightColumn = document.getElementById('right-column');
    
    // Pega o próximo par disponível dos pares restantes
    const nextPairIndex = gameState.remainingPairs[5]; // Pega o próximo após os 5 atuais
    
    if (nextPairIndex !== undefined) {
        // Cria os novos blocos
        const newLeftBlock = createWordBlock(wordPairs[nextPairIndex].pt, nextPairIndex, 'left');
        const newRightBlock = createWordBlock(wordPairs[nextPairIndex].en, nextPairIndex, 'right');
        
        // Encontra os elementos a serem substituídos
        const leftBlocks = leftColumn.children;
        const rightBlocks = rightColumn.children;
        
        // Encontra as posições dos blocos acertados
        let leftPos = Array.from(leftBlocks).findIndex(block => block.dataset.index === leftIndex.toString());
        let rightPos = Array.from(rightBlocks).findIndex(block => block.dataset.index === rightIndex.toString());
        
        // Substitui os blocos mantendo a posição
        if (leftPos !== -1) {
            leftColumn.replaceChild(newLeftBlock, leftBlocks[leftPos]);
        }
        if (rightPos !== -1) {
            rightColumn.replaceChild(newRightBlock, rightBlocks[rightPos]);
        }
    }
};

// Cria um bloco de palavra
const createWordBlock = (text, index, side) => {
    const block = document.createElement('div');
    block.className = 'word-block';
    block.textContent = text;
    block.dataset.index = index;
    block.addEventListener('click', () => handleClick(block, side));
    return block;
};

// Manipula o clique nos blocos
const handleClick = (block, side) => {
    // Se clicou no mesmo bloco que já estava selecionado, desmarca
    if (gameState.selectedBlock === block) {
        block.classList.remove('selected');
        gameState.selectedBlock = null;
        gameState.selectedSide = null;
        return;
    }

    // Se não há bloco selecionado ou clicou no mesmo lado
    if (!gameState.selectedBlock || side === gameState.selectedSide) {
        // Remove seleção anterior se existir
        const prevSelected = document.querySelector('.word-block.selected');
        if (prevSelected) prevSelected.classList.remove('selected');
        
        // Seleciona o novo bloco
        block.classList.add('selected');
        gameState.selectedBlock = block;
        gameState.selectedSide = side;
    } else {
        // Há um bloco selecionado do outro lado, verifica o match
        checkMatch(
            side === 'left' ? block : gameState.selectedBlock,
            side === 'right' ? block : gameState.selectedBlock
        );
    }
};

// Verifica se os pares combinam
const checkMatch = (leftBlock, rightBlock) => {
    const isMatch = leftBlock.dataset.index === rightBlock.dataset.index;
    
    if (isMatch) {
        playSound(true);
        leftBlock.classList.add('correct');
        rightBlock.classList.add('correct');
        
        gameState.correctCount++;
        gameState.streakCount++;
        // Atualiza a maior sequência se necessário
        gameState.highestStreak = Math.max(gameState.highestStreak, gameState.streakCount);
        gameState.timeLeft += 2;
        
        gameState.selectedBlock = null;
        gameState.selectedSide = null;
        
        setTimeout(() => {
            // Remove o par dos remainingPairs
            const index = parseInt(leftBlock.dataset.index);
            gameState.remainingPairs = gameState.remainingPairs.filter(i => i !== index);
            
            // Verifica se precisa avançar de nível
            if (gameState.remainingPairs.length === 0) {
                gameState.currentLevel++;
                gameState.remainingPairs = generatePairsForLevel(gameState.currentLevel);
                document.getElementById('current-level').textContent = gameState.currentLevel;
            }
            
            // Sempre renderiza uma nova rodada após um acerto
            renderRound();
            updateCounters();
            saveState();
        }, 500);
    } else {
        playSound(false);
        leftBlock.classList.add('incorrect');
        rightBlock.classList.add('incorrect');
        
        gameState.errorCount++;
        gameState.streakCount = 0;
        gameState.timeLeft = Math.max(0, gameState.timeLeft - 1);
        
        setTimeout(() => {
            leftBlock.classList.remove('incorrect', 'selected');
            rightBlock.classList.remove('incorrect');
            gameState.selectedBlock = null;
            gameState.selectedSide = null;
            updateCounters();
        }, 500);
    }
};

// Inicia a contagem regressiva e o jogo
const startGameWithCountdown = () => {
    const playerName = document.getElementById('user-name').value.trim();
    if (playerName.length < 3) return;

    gameState.playerName = playerName;
    document.getElementById('current-player').textContent = playerName;

    const startScreen = document.getElementById('start-screen');
    const gameContent = document.getElementById('game-content');
    const countdownElement = document.getElementById('countdown');
    const startButton = document.getElementById('start-btn');
    
    startButton.style.display = 'none';
    let count = 3;

    const updateCountdown = () => {
        countdownElement.textContent = count;
        countdownElement.style.animation = 'countdown 1s';
        
        // Reset da animação
        countdownElement.addEventListener('animationend', () => {
            countdownElement.style.animation = 'none';
            setTimeout(() => {
                countdownElement.style.animation = '';
            }, 10);
        });
    };

    updateCountdown();

    const countdownInterval = setInterval(() => {
        count--;
        
        if (count > 0) {
            updateCountdown();
        } else {
            clearInterval(countdownInterval);
            startScreen.classList.add('hidden');
            gameContent.classList.remove('hidden');
            initGame();
            gameState.isGameStarted = true;
        }
    }, 1000);
};

// Adiciona handlers para os botões do modal
document.getElementById('new-game-btn').addEventListener('click', () => {
    const modal = document.getElementById('end-game-modal');
    const startScreen = document.getElementById('start-screen');
    
    modal.classList.add('hidden');
    startScreen.classList.remove('hidden');
    document.getElementById('start-btn').style.display = 'block';
    updateHistoryDisplay();
});

document.getElementById('close-modal-btn').addEventListener('click', () => {
    const modal = document.getElementById('end-game-modal');
    const startScreen = document.getElementById('start-screen');
    
    modal.classList.add('hidden');
    startScreen.classList.remove('hidden');
    document.getElementById('start-btn').style.display = 'block';
    updateHistoryDisplay();
});

// Reinicia o jogo
document.getElementById('restart-btn').addEventListener('click', () => {
    localStorage.removeItem('mnemoGame.level');
    localStorage.removeItem('mnemoGame.remaining');
    location.reload(); // Recarrega a página para voltar à tela inicial
});

// Adiciona o evento de início do jogo
document.getElementById('start-btn').addEventListener('click', startGameWithCountdown);

// Inicializa o histórico ao carregar a página
window.addEventListener('load', () => {
    const gameContent = document.getElementById('game-content');
    gameContent.classList.add('hidden');
    setupUserForm();
    updateHistoryDisplay();
});