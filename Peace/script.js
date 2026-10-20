document.addEventListener('DOMContentLoaded', () => {
    // --- Анимация заставки ---
    const splash = document.getElementById('splash-screen');
    const mainContent = document.getElementById('main-content');

    setTimeout(() => {
        splash.classList.add('hidden');
        mainContent.classList.remove('hidden');
    }, 2000); // Логотип висит 2 секунды

    // --- Переключение тем ---
    const themeToggle = document.getElementById('theme-toggle');
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);

    themeToggle.addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const newTheme = isDark ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });

    // --- Логика Капчи (Пазл) ---
    const puzzleContainer = document.getElementById('puzzle');
    const refreshBtn = document.getElementById('refresh-captcha');
    let isCaptchaSolved = false;

    // Порядок правильной сборки (0, 1, 2, 3)
    const correctOrder = [0, 1, 2, 3];
    let currentOrder = [];

    function initCaptcha() {
        isCaptchaSolved = false;
        puzzleContainer.innerHTML = '';
        
        // Генерируем массив [0, 1, 2, 3] и перемешиваем
        currentOrder = [...correctOrder].sort(() => Math.random() - 0.5);

        currentOrder.forEach((pieceIndex, index) => {
            const piece = document.createElement('div');
            piece.classList.add('puzzle-piece', `pos-${pieceIndex}`);
            piece.draggable = true;
            piece.dataset.originalIndex = pieceIndex;
            piece.dataset.currentIndex = index;
            
            // Обработчики Drag & Drop
            piece.addEventListener('dragstart', handleDragStart);
            piece.addEventListener('dragover', handleDragOver);
            piece.addEventListener('drop', handleDrop);
            
            puzzleContainer.appendChild(piece);
        });
    }

    let draggedPiece = null;

    function handleDragStart(e) {
        draggedPiece = this;
        e.dataTransfer.effectAllowed = 'move';
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    function handleDrop(e) {
        e.preventDefault();
        if (draggedPiece !== this) {
            // Меняем местами классы позиций
            const tempClass = draggedPiece.className;
            draggedPiece.className = this.className;
            this.className = tempClass;

            // Меняем dataset индексы
            const tempIndex = draggedPiece.dataset.originalIndex;
            draggedPiece.dataset.originalIndex = this.dataset.originalIndex;
            this.dataset.originalIndex = tempIndex;

            checkCaptcha();
        }
    }

    function checkCaptcha() {
        const pieces = document.querySelectorAll('.puzzle-piece');
        let solved = true;
        pieces.forEach((piece, index) => {
            if (parseInt(piece.dataset.originalIndex) !== index) {
                solved = false;
            }
        });
        isCaptchaSolved = solved;
    }

    refreshBtn.addEventListener('click', initCaptcha);
    initCaptcha(); // Первая инициализация

    // --- Отправка формы ---
    const form = document.getElementById('login-form');
    const messageBox = document.getElementById('message-box');
    const submitBtn = document.getElementById('submit-btn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        messageBox.className = 'message hidden';

        // Отправка на сервер (Flask API)
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: username,
                    password: password,
                    captcha_solved: isCaptchaSolved
                })
            });

            const data = await response.json();

            if (response.ok) {
                messageBox.textContent = data.message;
                messageBox.classList.add('success');
                messageBox.classList.remove('hidden');
                // Перенаправление на дашборд (в реальном приложении)
                setTimeout(() => alert("Успешный вход! Роль: " + data.role), 1000);
            } else {
                messageBox.textContent = data.message;
                messageBox.classList.add('error');
                messageBox.classList.remove('hidden');
                
                // Если капча не собрана, обновляем её визуально
                if (!isCaptchaSolved) {
                    alert("Капча собрана неверно!");
                }
                
                // Обновляем пазл при ошибке для безопасности
                initCaptcha();
            }
        } catch (error) {
            messageBox.textContent = "Ошибка соединения с сервером.";
            messageBox.classList.add('error');
            messageBox.classList.remove('hidden');
        }
    });
});