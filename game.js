// Игра "Детектив Требований: Дело Монолит"

// Состояние игры
const gameState = {
    score: {
        act1: 0,
        act2: 0,
        act3: 0
    },
    crosswordSolved: false,
    logicSolved: false,
    stickers: [],
    boardChecked: false,
    budgetSolved: false,
    matrixSolved: false,
    quizAnswers: {
        q1: false,
        q2: false,
        q3: false,
        q4: false
    }
};

// Данные для стикеров
const stickerData = [
    { id: 1, text: 'Окупаемость за полгода', zone: 'mandatory', firstAttempt: true },
    { id: 2, text: 'Никаких валютных подписок', zone: 'mandatory', firstAttempt: true },
    { id: 3, text: 'Бюджет минимальный', zone: 'mandatory', firstAttempt: true },
    { id: 4, text: 'ИИ-генерация писем', zone: 'wishes', firstAttempt: true },
    { id: 5, text: '20 кастомных полей', zone: 'wishes', firstAttempt: true },
    { id: 6, text: 'Данные только на своём сервере', zone: 'mandatory', firstAttempt: true },
    { id: 7, text: 'Сервер слабый (2 Гб ОЗУ)', zone: 'mandatory', firstAttempt: true },
    { id: 8, text: 'Срок: 4 месяца', zone: 'mandatory', firstAttempt: true, damaged: true },
    { id: 9, text: 'Бюджет не позволяет 20 полей', zone: 'mandatory', firstAttempt: true }
];

// Правильные ответы для матрицы
const matrixAnswers = {
    arkady: { v: 'high', i: 'low' },
    semyn: { v: 'high', i: 'high' },
    lenochka: { v: 'low', i: 'high' }
};

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    initIntro();
    initCrossword();
    initDragAndDrop();
});

// Экран приветствия
function initIntro() {
    const startBtn = document.getElementById('start-btn');
    startBtn.addEventListener('click', () => {
        const name = document.getElementById('detective-name').value || 'Детектив N13';
        localStorage.setItem('detectiveName', name);
        switchScreen('act1-screen');
    });
}

// Переключение экранов
function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

// ========== АКТ 1: КРОССВОРД ==========
function initCrossword() {
    const inputs = document.querySelectorAll('.crossword-grid input');
    
    // Автопереход между ячейками
    inputs.forEach(input => {
        input.addEventListener('input', (e) => {
            const col = parseInt(e.target.dataset.col);
            const row = parseInt(e.target.dataset.row);
            if (col < 4 && e.target.value) {
                const next = document.querySelector(`input[data-row="${row}"][data-col="${col + 1}"]`);
                if (next) next.focus();
            }
        });
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value) {
                const col = parseInt(e.target.dataset.col);
                const row = parseInt(e.target.dataset.row);
                if (col > 0) {
                    const prev = document.querySelector(`input[data-row="${row}"][data-col="${col - 1}"]`);
                    if (prev) prev.focus();
                }
            }
        });
    });
}

function checkCrossword() {
    if (gameState.crosswordSolved) return;
    
    // Проверяем ключевое слово по вертикали (колонка 0): ДЕЛО
    const keyLetters = [];
    for (let row = 0; row < 4; row++) {
        const input = document.querySelector(`input[data-row="${row}"][data-col="0"]`);
        keyLetters.push(input.value.toUpperCase());
    }
    
    const keyWord = keyLetters.join('');
    
    // Также проверяем горизонтальные слова
    const rows = [
        ['Д', 'О', 'С', 'К', 'А'],
        ['Е', 'С', 'Л', 'И', ''],
        ['Л', 'И', 'Ц', 'О', ''],
        ['О', 'П', 'Р', 'О', 'С']
    ];
    
    let allCorrect = true;
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 5; col++) {
            const input = document.querySelector(`input[data-row="${row}"][data-col="${col}"]`);
            const expected = rows[row][col] || '';
            if (input.value.toUpperCase() !== expected) {
                allCorrect = false;
            }
        }
    }
    
    const feedback = document.getElementById('crossword-feedback');
    if (keyWord === 'ДЕЛО' && allCorrect) {
        feedback.textContent = '✓ ВЕРНО! Ключевое слово: ДЕЛО';
        feedback.className = 'feedback success';
        gameState.score.act1 = 1;
        gameState.crosswordSolved = true;
        updateScore('act1-score', gameState.score.act1);
        
        setTimeout(() => {
            document.getElementById('card-crossword').classList.add('hidden');
            document.getElementById('card-logic').classList.remove('hidden');
        }, 1500);
    } else {
        feedback.textContent = '✗ Неверно. Проверьте ключевое слово по вертикали.';
        feedback.className = 'feedback error';
    }
}

// ========== АКТ 1: ЛОГИЧЕСКАЯ ЗАДАЧА ==========
function checkLogicCode() {
    if (gameState.logicSolved) return;
    
    const code = document.getElementById('logic-code').value;
    const feedback = document.getElementById('logic-feedback');
    
    if (code === '829') {
        feedback.textContent = '✓ КОД ПРИНЯТ! Доступ разрешён.';
        feedback.className = 'feedback success';
        gameState.score.act1 = 2;
        gameState.logicSolved = true;
        updateScore('act1-score', gameState.score.act1);
        
        setTimeout(() => {
            document.getElementById('act1-next').classList.remove('hidden');
        }, 1000);
    } else {
        feedback.textContent = '✗ Неверный код. Подумайте ещё.';
        feedback.className = 'feedback error';
    }
}

// ========== ПЕРЕХОД К АКТУ 2 ==========
function goToAct2() {
    switchScreen('act2-screen');
    initStickers();
}

// ========== АКТ 2: СТИКЕРЫ ==========
function initStickers() {
    const pool = document.getElementById('stickers-pool');
    pool.innerHTML = '';
    
    stickerData.forEach(sticker => {
        const el = document.createElement('div');
        el.className = `sticker ${sticker.damaged ? 'damaged' : ''}`;
        el.textContent = sticker.text;
        el.dataset.id = sticker.id;
        el.dataset.zone = sticker.zone;
        el.style.setProperty('--rotation', `${Math.random() * 6 - 3}deg`);
        el.draggable = true;
        
        el.addEventListener('dragstart', handleDragStart);
        el.addEventListener('dragend', handleDragEnd);
        
        // Клик для создания стикера из фразы
        el.addEventListener('click', () => {
            if (!el.parentElement.classList.contains('stickers-container')) {
                pool.appendChild(el);
            }
        });
        
        pool.appendChild(el);
    });
    
    // Обработчики кликов на фразах
    document.querySelectorAll('.clickable-phrase').forEach(phrase => {
        phrase.addEventListener('click', (e) => {
            const phraseText = e.target.dataset.phrase;
            const sticker = stickerData.find(s => s.text.includes(phraseText) || phraseText.includes(s.text));
            
            if (sticker) {
                const stickerEl = document.querySelector(`.sticker[data-id="${sticker.id}"]`);
                if (stickerEl && !document.getElementById('stickers-pool').contains(stickerEl)) {
                    document.getElementById('stickers-pool').appendChild(stickerEl);
                }
            } else {
                alert('Это просто деталь интерьера');
            }
        });
    });
    
    // Настройка зон для drop
    document.querySelectorAll('.zone-slots').forEach(slot => {
        slot.addEventListener('dragover', handleDragOver);
        slot.addEventListener('drop', handleDrop);
    });
}

let draggedElement = null;

function handleDragStart(e) {
    draggedElement = this;
    this.classList.add('dragging');
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    draggedElement = null;
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDrop(e) {
    e.preventDefault();
    const zone = this.closest('.zone');
    if (zone && draggedElement) {
        this.appendChild(draggedElement);
    }
}

// ========== АКТ 2: ПРОВЕРКА ДОСКИ ==========
function checkBoard() {
    if (gameState.boardChecked) return;
    
    const zones = {
        mandatory: document.querySelector('.zone.mandatory .zone-slots'),
        wishes: document.querySelector('.zone.wishes .zone-slots'),
        trash: document.querySelector('.zone.trash .zone-slots')
    };
    
    let correctCount = 0;
    let totalPlaced = 0;
    
    stickerData.forEach(sticker => {
        const stickerEl = document.querySelector(`.sticker[data-id="${sticker.id}"]`);
        if (!stickerEl) return;
        
        const parentZone = stickerEl.closest('.zone');
        if (!parentZone) return;
        
        totalPlaced++;
        const actualZone = parentZone.dataset.zone;
        
        if (actualZone === sticker.zone) {
            if (sticker.firstAttempt) {
                correctCount++;
            }
        } else {
            // Возвращаем стикер в пул
            document.getElementById('stickers-pool').appendChild(stickerEl);
            sticker.firstAttempt = false;
        }
    });
    
    const feedback = document.getElementById('board-feedback');
    
    if (correctCount >= 7 && totalPlaced >= 8) {
        feedback.textContent = `✓ Отлично! ${correctCount} требований классифицировано верно.`;
        feedback.className = 'feedback success';
        gameState.score.act2 += Math.min(correctCount, 3);
        gameState.boardChecked = true;
        updateScore('act2-score', gameState.score.act2);
        
        // Показываем карточку с бюджетом
        setTimeout(() => {
            document.getElementById('card-budget').classList.remove('hidden');
        }, 1500);
    } else {
        feedback.textContent = `✗ Есть ошибки. Некоторые стикеры возвращены. Верно: ${correctCount}`;
        feedback.className = 'feedback error';
    }
}

// ========== АКТ 2: БЮДЖЕТ ==========
function checkBudget() {
    if (gameState.budgetSolved) return;
    
    const months = parseInt(document.getElementById('budget-months').value);
    const ram = parseInt(document.getElementById('budget-ram').value);
    const tabs = parseInt(document.getElementById('budget-tabs').value);
    
    const feedback = document.getElementById('budget-feedback');
    
    if (months === 4 && ram === 2 && tabs === 2) {
        feedback.textContent = '✓ ДАННЫЕ ВОССТАНОВЛЕНЫ! Код: 422';
        feedback.className = 'feedback success';
        gameState.score.act2 += 1;
        gameState.budgetSolved = true;
        updateScore('act2-score', gameState.score.act2);
        
        // Добавляем 9-й стикер
        addNewSticker();
        
        setTimeout(() => {
            document.getElementById('mvp-calculator').classList.remove('hidden');
        }, 1500);
    } else {
        feedback.textContent = '✗ Неверные данные. Проверьте улики.';
        feedback.className = 'feedback error';
    }
}

function addNewSticker() {
    const pool = document.getElementById('stickers-pool');
    const sticker = document.createElement('div');
    sticker.className = 'sticker';
    sticker.textContent = 'Бюджет не позволяет 20 полей';
    sticker.dataset.id = 9;
    sticker.dataset.zone = 'mandatory';
    sticker.style.setProperty('--rotation', `${Math.random() * 6 - 3}deg`);
    sticker.draggable = true;
    sticker.addEventListener('dragstart', handleDragStart);
    sticker.addEventListener('dragend', handleDragEnd);
    pool.appendChild(sticker);
}

// ========== АКТ 2: MVP КАЛЬКУЛЯТОР ==========
const mvpFeatures = document.querySelectorAll('.feature');
mvpFeatures.forEach(feature => {
    feature.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('feature', feature.dataset.feature);
    });
});

const scales = document.querySelectorAll('.scale');
scales.forEach(scale => {
    scale.addEventListener('dragover', (e) => e.preventDefault());
    scale.addEventListener('drop', (e) => {
        e.preventDefault();
        const feature = e.dataTransfer.getData('feature');
        const scaleId = scale.id;
        
        // ИИ и 20 полей ломают шкалы
        if ((feature === 'ai' || feature === 'fields') && scaleId !== 'scale-resources') {
            const fill = scale.querySelector('.scale-fill');
            fill.classList.add('overload');
            fill.style.width = '100%';
            
            const feedback = document.getElementById('mvp-feedback');
            feedback.textContent = '⚠ ВНИМАНИЕ: Эта функция перегружает систему!';
            feedback.className = 'feedback error';
        }
    });
});

// ========== ПЕРЕХОД К АКТУ 3 ==========
function goToAct3() {
    switchScreen('act3-screen');
    gameState.score.act2 = Math.min(gameState.score.act2, 4);
    updateScore('act2-score', gameState.score.act2);
}

// ========== АКТ 3: МАТРИЦА ==========
let draggedStakeholder = null;

document.querySelectorAll('.stakeholder').forEach(sh => {
    sh.addEventListener('dragstart', (e) => {
        draggedStakeholder = sh;
        e.dataTransfer.setData('name', sh.dataset.name);
    });
});

document.querySelectorAll('.matrix-quadrant').forEach(q => {
    q.addEventListener('dragover', (e) => e.preventDefault());
    q.addEventListener('drop', (e) => {
        e.preventDefault();
        const name = e.dataTransfer.getData('name');
        const quadrant = e.target.closest('.matrix-quadrant');
        
        if (quadrant && draggedStakeholder) {
            quadrant.appendChild(draggedStakeholder);
            draggedStakeholder.classList.add('placed');
        }
    });
});

function checkMatrix() {
    if (gameState.matrixSolved) return;
    
    let correct = 0;
    
    Object.entries(matrixAnswers).forEach(([name, answer]) => {
        const stakeholder = document.querySelector(`.stakeholder[data-name="${name}"]`);
        if (!stakeholder) return;
        
        const quadrant = stakeholder.closest('.matrix-quadrant');
        if (!quadrant) return;
        
        if (quadrant.dataset.v === answer.v && quadrant.dataset.i === answer.i) {
            correct++;
        }
    });
    
    const feedback = document.getElementById('matrix-feedback');
    
    if (correct === 3) {
        feedback.textContent = '✓ МАТРИЦА ВЕРНА! Все стейкхолдеры на своих местах.';
        feedback.className = 'feedback success';
        gameState.score.act3 = 1;
        gameState.matrixSolved = true;
        updateScore('act3-score', gameState.score.act3);
        
        setTimeout(() => {
            document.getElementById('quiz-container').classList.remove('hidden');
        }, 1500);
    } else {
        feedback.textContent = `✗ Ошибки. Верно размещено: ${correct}/3`;
        feedback.className = 'feedback error';
    }
}

// ========== АКТ 3: ВИКТОРИНА ==========
function checkQ1() {
    if (gameState.quizAnswers.q1) return;
    
    const checkboxes = document.querySelectorAll('input[name="q1"]:checked');
    const answers = Array.from(checkboxes).map(cb => cb.value);
    
    // Правильные: Б, Г, Д (b, g, d)
    const correct = ['b', 'g', 'd'];
    const isCorrect = answers.length === 3 && answers.every(a => correct.includes(a));
    
    const feedback = document.getElementById('q1-feedback');
    
    if (isCorrect) {
        feedback.textContent = '✓ ВЕРНО! Сервер, сроки и бюджет — критические ограничения.';
        feedback.className = 'feedback success';
        gameState.score.act3 += 1;
        gameState.quizAnswers.q1 = true;
        updateScore('act3-score', gameState.score.act3);
        
        setTimeout(() => {
            document.getElementById('q1').classList.add('hidden');
            document.getElementById('q2').classList.remove('hidden');
        }, 1500);
    } else {
        feedback.textContent = '✗ Неверно. Подумайте о технических и бюджетных ограничениях.';
        feedback.className = 'feedback error';
    }
}

function checkQ2() {
    if (gameState.quizAnswers.q2) return;
    
    const radio = document.querySelector('input[name="q2"]:checked');
    
    const feedback = document.getElementById('q2-feedback');
    
    if (radio && radio.value === 'b') {
        feedback.textContent = '✓ ВЕРНО! Слабый сервер + сжатые сроки = блокер.';
        feedback.className = 'feedback success';
        gameState.score.act3 += 1;
        gameState.quizAnswers.q2 = true;
        updateScore('act3-score', gameState.score.act3);
        
        setTimeout(() => {
            document.getElementById('q2').classList.add('hidden');
            document.getElementById('q3').classList.remove('hidden');
        }, 1500);
    } else {
        feedback.textContent = '✗ Неверно. Ищите комбинацию ограничений.';
        feedback.className = 'feedback error';
    }
}

function checkQ3() {
    if (gameState.quizAnswers.q3) return;
    
    const radio = document.querySelector('input[name="q3"]:checked');
    
    const feedback = document.getElementById('q3-feedback');
    
    if (radio && radio.value === 'c') {
        feedback.textContent = '✓ ВЕРНО! Баланс интересов — ключ к успеху.';
        feedback.className = 'feedback success';
        gameState.score.act3 += 1;
        gameState.quizAnswers.q3 = true;
        updateScore('act3-score', gameState.score.act3);
        
        setTimeout(() => {
            document.getElementById('q3').classList.add('hidden');
            document.getElementById('q4').classList.remove('hidden');
        }, 1500);
    } else {
        feedback.textContent = '✗ Неверно. Нужен компромисс.';
        feedback.className = 'feedback error';
    }
}

function checkQ4() {
    if (gameState.quizAnswers.q4) return;
    
    const radio = document.querySelector('input[name="q4"]:checked');
    
    const feedback = document.getElementById('q4-feedback');
    
    if (radio && radio.value === 'b') {
        feedback.textContent = '✓ ВЕРНО! Локальная CRM за 3 месяца — оптимальное MVP.';
        feedback.className = 'feedback success';
        gameState.score.act3 += 1;
        gameState.quizAnswers.q4 = true;
        updateScore('act3-score', gameState.score.act3);
        
        setTimeout(() => {
            document.getElementById('act3-next').classList.remove('hidden');
        }, 1500);
    } else {
        feedback.textContent = '✗ Неверно. Учитывайте бюджет и сроки.';
        feedback.className = 'feedback error';
    }
}

// ========== РЕЗУЛЬТАТЫ ==========
function showResults() {
    // Ограничиваем максимальные баллы
    gameState.score.act1 = Math.min(gameState.score.act1, 2);
    gameState.score.act2 = Math.min(gameState.score.act2, 4);
    gameState.score.act3 = Math.min(gameState.score.act3, 5);
    
    const total = gameState.score.act1 + gameState.score.act2 + gameState.score.act3;
    
    document.getElementById('final-score').textContent = total;
    document.getElementById('score-act1').textContent = gameState.score.act1;
    document.getElementById('score-act2').textContent = gameState.score.act2;
    document.getElementById('score-act3').textContent = gameState.score.act3;
    
    const name = localStorage.getItem('detectiveName') || 'Детектив N13';
    document.getElementById('result-name').textContent = name;
    
    let grade = 'Junior / Саботажник';
    if (total >= 9) {
        grade = 'Senior Analyst';
    } else if (total >= 5) {
        grade = 'Middle Analyst';
    }
    
    document.getElementById('final-grade').textContent = grade;
    
    switchScreen('results-screen');
}

// Утилита для обновления счета
function updateScore(elementId, value) {
    document.getElementById(elementId).textContent = value;
}
