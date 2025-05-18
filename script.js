// script.js

(() => {
  // Elemen DOM utama
  const inputEl = document.getElementById('calc-input');
  const resultEl = document.getElementById('calc-result');
  const errorNotif = document.getElementById('error-notification');

  // Tombol
  const btnReset = document.getElementById('btn-reset');
  const btnDel = document.getElementById('btn-del');
  const btnEqual = document.getElementById('btn-equal');
  const btnUndo = document.getElementById('btn-undo');
  const btnRedo = document.getElementById('btn-redo');

  // Panel & tombol panel
  const historyPanel = document.getElementById('history-panel');
  const btnHistory = document.getElementById('btn-history');
  const historyList = document.getElementById('history-list');
  const btnClearHistory = document.getElementById('btn-clear-history');
  const btnCloseHistory = document.getElementById('btn-close-history');

  const themePanel = document.getElementById('theme-panel');
  const btnTheme = document.getElementById('btn-theme');
  const btnCloseTheme = document.getElementById('btn-close-theme');
  const themeSwatches = themePanel.querySelectorAll('.theme-swatch');

  const timerPanel = document.getElementById('timer-panel');
  const btnTimer = document.getElementById('btn-timer');
  const btnCloseTimer = document.getElementById('btn-close-timer');
  const timerHours = document.getElementById('timer-hours');
  const timerMinutes = document.getElementById('timer-minutes');
  const timerSeconds = document.getElementById('timer-seconds');
  const timerStart = document.getElementById('timer-start');
  const timerPause = document.getElementById('timer-pause');
  const timerReset = document.getElementById('timer-reset');
  const timerDisplay = document.getElementById('timer-display');

  const btnVoice = document.getElementById('btn-voice');

  // Tombol angka dan operator
  const btnNums = document.querySelectorAll('.btn-num');
  const btnOps = document.querySelectorAll('.btn-op');

  // Data untuk undo/redo
  let undoStack = [];
  let redoStack = [];

  // Data riwayat
  let history = [];

  // Timer state
  let timerInterval = null;
  let timerTimeLeft = 0;
  let timerRunning = false;

  // Tema default
  let currentTheme = 'light';

  // --- Fungsi Util ---

  // Simpan state input untuk undo stack
  function saveState() {
    undoStack.push(inputEl.value);
    if (undoStack.length > 100) undoStack.shift();
    // Reset redo saat ada perubahan baru
    redoStack = [];
    updateUndoRedoButtons();
  }

  // Update enable/disable undo/redo buttons
  function updateUndoRedoButtons() {
    btnUndo.disabled = undoStack.length === 0;
    btnRedo.disabled = redoStack.length === 0;
  }

  // Tampilkan error notifikasi
  function showError(msg) {
    errorNotif.textContent = msg;
    errorNotif.hidden = false;
    setTimeout(() => {
      errorNotif.hidden = true;
    }, 4000);
  }

  // Evaluasi ekspresi kalkulator (replace koma, ganti simbol)
  function evaluateExpression(expr) {
    try {
      // Ganti koma dengan titik desimal
      const sanitized = expr.replace(/,/g, '.')
        // Ganti simbol matematika visual dengan operator JS
        .replace(/÷/g, '/')
        .replace(/×/g, '*')
        .replace(/−/g, '-')
        // Hilangkan karakter selain angka, operator, titik, dan kurung
        .replace(/[^\d+\-*/().]/g, '');

      // Jangan eval langsung jika kosong
      if (!sanitized) return '';

      // Gunakan Function safer daripada eval
      const fn = new Function('return ' + sanitized);
      let val = fn();

      // Jika hasil NaN atau Infinity, error
      if (typeof val !== 'number' || !isFinite(val)) {
        throw new Error('Hasil tidak valid');
      }

      // Format hasil: 10 desimal maksimal, hapus trailing nol
      val = +val.toFixed(10);

      return val.toString();
    } catch (e) {
      throw new Error('Angka tidak valid');
    }
  }

  // Update hasil kalkulasi secara realtime
  function updateResult() {
    const expr = inputEl.value;
    if (!expr.trim()) {
      resultEl.textContent = '';
      return;
    }

    try {
      const res = evaluateExpression(expr);
      resultEl.textContent = res;
    } catch {
      resultEl.textContent = '';
    }
  }

  // Tambah ke riwayat dan simpan ke localStorage
  function addHistory(expression, result) {
    const item = { expression, result, timestamp: Date.now() };
    history.unshift(item);
    if (history.length > 50) history.pop();
    saveHistory();
    renderHistory();
  }

  // Render list riwayat
  function renderHistory() {
    historyList.innerHTML = '';
    if (history.length === 0) {
      historyList.innerHTML = `<li><em>Riwayat kosong</em></li>`;
      return;
    }
    history.forEach(({ expression, result, timestamp }, i) => {
      const li = document.createElement('li');
      li.tabIndex = 0;
      li.role = 'listitem';
      li.className = 'history-item';
      li.title = `Klik untuk pakai ulang ekspresi`;
      li.textContent = `${expression} = ${result}`;
      li.dataset.expr = expression;
      historyList.appendChild(li);
    });
  }

  // Simpan riwayat ke localStorage
  function saveHistory() {
    localStorage.setItem('calc_history', JSON.stringify(history));
  }

  // Muat riwayat dari localStorage
  function loadHistory() {
    const stored = localStorage.getItem('calc_history');
    if (stored) {
      try {
        history = JSON.parse(stored);
      } catch {
        history = [];
      }
    }
  }

  // Simpan tema ke localStorage
  function saveTheme() {
    localStorage.setItem('calc_theme', currentTheme);
  }

  // Muat tema dari localStorage
  function loadTheme() {
    const stored = localStorage.getItem('calc_theme');
    if (stored) currentTheme = stored;
    applyTheme(currentTheme);
  }

  // Terapkan tema ke body
  function applyTheme(theme) {
    document.body.dataset.theme = theme;
    currentTheme = theme;
    saveTheme();
  }

  // --- Fungsi Event Handler ---

  // Klik tombol angka
  btnNums.forEach(btn => {
    btn.addEventListener('click', () => {
      saveState();
      inputEl.value += btn.dataset.num;
      updateResult();
      inputEl.focus();
    });
  });

  // Klik tombol operator
  btnOps.forEach(btn => {
    btn.addEventListener('click', () => {
      saveState();
      inputEl.value += btn.dataset.op;
      updateResult();
      inputEl.focus();
    });
  });

  // Klik tombol reset (AC)
  btnReset.addEventListener('click', () => {
    saveState();
    inputEl.value = '';
    updateResult();
    inputEl.focus();
  });

  // Klik tombol delete (Del)
  btnDel.addEventListener('click', () => {
    saveState();
    inputEl.value = inputEl.value.slice(0, -1);
    updateResult();
    inputEl.focus();
  });

  // Klik tombol equal (=)
  btnEqual.addEventListener('click', () => {
    if (!inputEl.value.trim()) return;
    try {
      const res = evaluateExpression(inputEl.value);
      addHistory(inputEl.value, res);
      inputEl.value = res;
      updateResult();
      saveState();
    } catch (e) {
      showError(e.message);
    }
    inputEl.focus();
  });

  // Undo
  btnUndo.addEventListener('click', () => {
    if (undoStack.length === 0) return;
    redoStack.push(inputEl.value);
    inputEl.value = undoStack.pop();
    updateResult();
    updateUndoRedoButtons();
    inputEl.focus();
  });

  // Redo
  btnRedo.addEventListener('click', () => {
    if (redoStack.length === 0) return;
    undoStack.push(inputEl.value);
    inputEl.value = redoStack.pop();
    updateResult();
    updateUndoRedoButtons();
    inputEl.focus();
  });

  // Keyboard shortcuts
  // window.addEventListener('keydown', (e) => {
//   if (e.target === inputEl) {
//     if (e.key === 'Enter') {
//       e.preventDefault();
//       btnEqual.click();
//     } else if (e.key === 'Backspace') {
//       // Del sudah native di input
//       saveState();
//     } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
//       e.preventDefault();
//       btnUndo.click();
//     } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
//       e.preventDefault();
//       btnRedo.click();
//     }
//   }

//   // Tutup panel dengan Escape
//   if (e.key === 'Escape') {
//     closeAllPanels();
//   }
// });


  // Buka/tutup panel riwayat
  btnHistory.addEventListener('click', () => {
    togglePanel(historyPanel);
  });

  btnCloseHistory.addEventListener('click', () => {
    hidePanel(historyPanel);
  });

  btnClearHistory.addEventListener('click', () => {
    history = [];
    saveHistory();
    renderHistory();
  });

  // Klik riwayat untuk pakai ulang ekspresi
  historyList.addEventListener('click', (e) => {
    if (e.target.matches('.history-item')) {
      saveState();
      inputEl.value = e.target.dataset.expr;
      updateResult();
      inputEl.focus();
    }
  });

  // Buka/tutup panel tema
  btnTheme.addEventListener('click', () => {
    togglePanel(themePanel);
  });
  btnCloseTheme.addEventListener('click', () => {
    hidePanel(themePanel);
  });

  // Pilih tema
  themeSwatches.forEach(btn => {
    btn.addEventListener('click', () => {
      applyTheme(btn.dataset.theme);
    });
  });

  // Buka/tutup panel timer
  btnTimer.addEventListener('click', () => {
    togglePanel(timerPanel);
  });
  btnCloseTimer.addEventListener('click', () => {
    hidePanel(timerPanel);
  });

  // Timer fungsi
  function formatTime(seconds) {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  function updateTimerDisplay() {
    timerDisplay.textContent = formatTime(timerTimeLeft);
  }

  function timerTick() {
    if (timerTimeLeft <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      timerRunning = false;
      timerStart.disabled = false;
      timerPause.disabled = true;
      timerReset.disabled = false;
      timerDisplay.textContent = "Waktu Habis!";
      notifyTimerEnd();
      return;
    }
    timerTimeLeft--;
    updateTimerDisplay();
  }

  // Mulai timer
  timerStart.addEventListener('click', () => {
    if (timerRunning) return;

    // Hitung total detik dari input
    let h = parseInt(timerHours.value) || 0;
    let m = parseInt(timerMinutes.value) || 0;
    let s = parseInt(timerSeconds.value) || 0;
    timerTimeLeft = h * 3600 + m * 60 + s;

    if (timerTimeLeft <= 0) {
      showError('Harap masukkan waktu timer lebih dari 0');
      return;
    }

    timerRunning = true;
    timerStart.disabled = true;
    timerPause.disabled = false;
    timerReset.disabled = false;

    updateTimerDisplay();
    timerInterval = setInterval(timerTick, 1000);
  });

  // Jeda timer
  timerPause.addEventListener('click', () => {
    if (!timerRunning) return;
    clearInterval(timerInterval);
    timerInterval = null;
    timerRunning = false;
    timerStart.disabled = false;
    timerPause.disabled = true;
  });

  // Reset timer
  timerReset.addEventListener('click', () => {
    clearInterval(timerInterval);
    timerInterval = null;
    timerRunning = false;
    timerStart.disabled = false;
    timerPause.disabled = true;
    timerReset.disabled = true;
    timerTimeLeft = 0;
    updateTimerDisplay();
  });

  // Notifikasi timer selesai
  function notifyTimerEnd() {
    // Visual alert: ubah warna teks sejenak
    timerDisplay.style.color = 'red';
    setTimeout(() => {
      timerDisplay.style.color = '';
    }, 3000);

    // Suara alert (beep)
    try {
      const ctx = new AudioContext();
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = 1000;
      o.connect(ctx.destination);
      o.start();
      setTimeout(() => {
        o.stop();
        ctx.close();
      }, 500);
    } catch {
      // Audio API mungkin tidak didukung
    }
  }

  // Ganti semua fungsi ini di script.js

function togglePanel(panel) {
  closeAllPanels();
  panel.classList.add('active');
  panel.hidden = false;
}

function hidePanel(panel) {
  panel.classList.remove('active');
  panel.hidden = true;
}

function closeAllPanels() {
  [historyPanel, themePanel, timerPanel].forEach(p => {
    if (!p.hidden) {
      p.classList.remove('active');
      p.hidden = true;
    }
  });
}


  // --- Voice Input ---

  let recognition = null;
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'id-ID';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase().trim();

      // Konversi kata ke simbol matematika
      const replaced = transcript
        .replace(/dibagi/g, '/')
        .replace(/bagi/g, '/')
        .replace(/kali/g, '*')
        .replace(/dikali/g, '*')
        .replace(/tambah/g, '+')
        .replace(/plus/g, '+')
        .replace(/ples/g, '+')
        .replace(/ditambah/g, '+')
        .replace(/kurang/g, '-')
        .replace(/minus/g, '-')
        .replace(/mines/g, '-')
        .replace(/dikurangi/g, '-')
        .replace(/modulo/g, '%')
        .replace(/persen/g, '%')
        .replace(/persen/g, '%')
        .replace(/koma/g, ',')
        .replace(/ /g, '');

      // Tambah ke input
      saveState();
      inputEl.value += replaced;
      updateResult();
      inputEl.focus();
    };

    recognition.onerror = (e) => {
      showError('Error input suara: ' + e.error);
    };
  } else {
    btnVoice.disabled = true;
    btnVoice.title = 'Browser tidak mendukung input suara';
  }

  btnVoice.addEventListener('click', () => {
    if (!recognition) return;
    try {
      recognition.start();
    } catch {
      showError('Tidak dapat memulai input suara sekarang.');
    }
  });

  // --- Inisialisasi ---

  // Muat riwayat
  loadHistory();
  renderHistory();

  // Muat tema
  loadTheme();

  // Update hasil awal
  updateResult();

  // Disable undo/redo jika kosong
  updateUndoRedoButtons();

  // Timer display init
  updateTimerDisplay();
  timerPause.disabled = true;
  timerReset.disabled = true;

  // Simpan ekspresi terakhir
  function saveLastExpression() {
    localStorage.setItem('last_expression', inputEl.value);
  }

  // Muat ekspresi terakhir saat load
  function loadLastExpression() {
    const last = localStorage.getItem('last_expression');
    if (last) {
      inputEl.value = last;
      updateResult();
    }
  }

  // Panggil saat input berubah dan saat unload
  inputEl.addEventListener('input', saveLastExpression);
  window.addEventListener('beforeunload', saveLastExpression);

  // Tambahkan ini ke inisialisasi terakhir
  loadLastExpression();

})();