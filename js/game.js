(() => {
        // Lazy Firebase — only initialized when entering Online mode
        const FIREBASE_CONFIG = {
            apiKey: "AIzaSyDLfe9pFWxU0K-BXKeSPXXMd3fwMEvGelw",
            authDomain: "tic-tac-toe-dd488.firebaseapp.com",
            databaseURL: "https://tic-tac-toe-dd488-default-rtdb.asia-southeast1.firebasedatabase.app",
            projectId: "tic-tac-toe-dd488",
            storageBucket: "tic-tac-toe-dd488.firebasestorage.app",
            messagingSenderId: "366226840426",
            appId: "1:366226840426:web:32f9a7ab26cb4fa0466313"
        };
        let db = null;
        let uid = null;
        function loadScript(src) {
            return new Promise((resolve, reject) => {
                const s = document.createElement('script');
                s.src = src;
                s.onload = resolve;
                s.onerror = () => reject(new Error('Failed to load ' + src));
                document.head.appendChild(s);
            });
        }
        function initFirebase() {
            if (db && uid) return Promise.resolve(db);
            if (!navigator.onLine) return Promise.reject(new Error('offline'));
            const base = 'https://www.gstatic.com/firebasejs/10.12.0/';
            const ready = (window.firebase && firebase.database && firebase.auth)
                ? Promise.resolve()
                : loadScript(base + 'firebase-app-compat.js').then(() =>
                    Promise.all([
                        loadScript(base + 'firebase-auth-compat.js'),
                        loadScript(base + 'firebase-database-compat.js')
                    ])
                  ).then(() => {
                    if (!(window.firebase && firebase.database && firebase.auth)) {
                        throw new Error('Failed to load Firebase');
                    }
                  });
            return ready.then(() => {
                if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
                const auth = firebase.auth();
                const signedIn = auth.currentUser
                    ? Promise.resolve(auth.currentUser)
                    : auth.signInAnonymously().then(cred => cred.user);
                return signedIn.then(user => {
                    if (!user || !user.uid) throw new Error('Auth failed');
                    uid = user.uid;
                    db = firebase.database();
                    return db;
                });
            });
        }
        function showOnlineError(msg) { const el = $('online-error'); if (el) { el.textContent = msg; el.classList.remove('hidden'); } }

        function onlineWarn(err, fallback) {
            console.warn('[ttt]', fallback, err);
        }
        function onlineWrite(promise, label) {
            return promise.catch(err => {
                console.error('[ttt] ' + label + ':', err && err.code, err);
                showOnlineError(label + ' failed' + (err && err.code ? ' (' + err.code + ')' : ''));
                throw err;
            });
        }


        const EMOJI_CATS = [
            { name:'Faces', icon:'😂', emojis:['😂','🤣','😭','😍','😊','😁','😅','😆','😘','🥺','🤗','😉','😏','😔','😌','😎','🤔','😇','😋','😢','😜','🥰','😩','🤭','😱'] },
            { name:'Animals', icon:'🐼', emojis:['🐶','🐱','🐻','🦊','🐼','🐸','🦁','🐰','🐯','🐮','🐷','🐵','🐔','🐧','🦄','🐍','🐙','🐳','🐬','🦅','🐴','🐑','🐠','🐨','🦘'] },
            { name:'Cars', icon:'🚗', emojis:['🚗','✈️','🚕','🚲','🚙','🚂','🚄','🚢','🚑','🚒','🚓','🏎️','🚐','🚛','🚚','🚜','🚣','🚤','🚇','🚈','🚉','🚅','🚃','🚆','🚁'] },
            { name:'Nature', icon:'🌈', emojis:['🌸','🌹','🌻','🌺','🌼','🌷','💐','🌿','🍀','🌳','🌲','🌴','🌵','🍄','🌾','🌱','🌞','🌝','🌙','⭐','🌈','☀️','🌤️','🌧️','❄️'] }
        ];
        const EMOJIS = EMOJI_CATS.flatMap(c => c.emojis);
        const WIN_LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

        let picks = [null, null]; // [p1, p2]
        let pickStep = 0;
        let photos = [null, null];
        let emojis = [null, null];
        // Device ID — persists across sessions to identify your rooms
        let deviceId;
        try { deviceId = localStorage.getItem('ttt-device-id'); } catch(e) {}
        if (!deviceId) { deviceId = Math.random().toString(36).substring(2, 10); try { localStorage.setItem('ttt-device-id', deviceId); } catch(e) {} }
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let isOnline = false;
        let vsComputer = false;
        let aiDifficulty = 'medium'; // easy, medium, hard
        let roomCode = null, playerIndex = null, roomRef = null;
        let gameListener = null, joinListener = null, cleanupListener = null, opponentListener = null, connectedListener = null, onlineStarted = false, opponentLeaveTimer = null;
        let onlinePickData = { emoji: null, photo: null };
        let moveInProgress = false;
        let opponentLeft = false;
        let firstTurn = 0; // Alternates who goes first each game
        let selectedMode = null; // 'local', 'computer', 'online'
        const state = { board: Array(9).fill(null), turn: 0, gameOver: false, scores: [0,0,0] };
        let streak = 0;
        try { streak = parseInt(localStorage.getItem('ttt-streak') || '0', 10); } catch(e) {}
        function saveScores() { if (vsComputer) { try { localStorage.setItem('ttt-streak', streak); } catch(e) {} } }

        const $ = id => document.getElementById(id);
        const showScreen = id => { document.querySelectorAll('.screen:not(.hidden)').forEach(s => s.classList.add('hidden')); $(id).classList.remove('hidden'); $(id).focus(); };
        const boardEl = $('board'), boardWrap = $('board-wrap');
                        const resultOverlay = $('result-overlay'), resultBig = $('result-big'), resultText = $('result-text');
        const winCanvas = $('win-canvas'), winCtx = winCanvas.getContext('2d');
        const pickHeader = $('pick-header'), drawScore = $('draw-score'), ariaAnnouncer = $('aria-announcer');
        const cells = [];

        // Sound
        const ax = new (window.AudioContext || window.webkitAudioContext)();
        function resumeAudio() { if (ax.state === 'suspended') ax.resume(); }
        document.addEventListener('click', resumeAudio, { once: true });
        document.addEventListener('touchstart', resumeAudio, { once: true });
        function note(freq, dur, type, vol, sweep) { try { resumeAudio(); const t=ax.currentTime, o=ax.createOscillator(), g=ax.createGain(); o.type=type||'sine'; o.frequency.setValueAtTime(freq,t); if(sweep) o.frequency.exponentialRampToValueAtTime(sweep,t+dur); g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol||0.1,t+0.005); g.gain.setValueAtTime(vol||0.1,t+dur*0.3); g.gain.exponentialRampToValueAtTime(0.001,t+dur); o.connect(g); g.connect(ax.destination); o.start(t); o.stop(t+dur); } catch(e) {} }
        function sndPlace() { note(900,0.08,'sine',0.06,500); note(600,0.06,'triangle',0.04); }
        function sndWin() { const v=0.08; note(523,0.15,'sine',v); note(523,0.15,'triangle',v*0.5); setTimeout(()=>{note(659,0.15,'sine',v);note(659,0.15,'triangle',v*0.5);},100); setTimeout(()=>{note(784,0.3,'sine',v);note(784,0.3,'triangle',v*0.5);note(1047,0.3,'sine',v*0.3);},200); }
        function sndDraw() { note(440,0.15,'triangle',0.06); setTimeout(()=>note(370,0.25,'triangle',0.05),120); }

        // Helpers
        function hasPhoto(i) { return photos[i]!==null; }
        function hasEmoji(i) { return emojis[i]!==null; }
        function safePhotoSrc(src) {
            return (src && typeof src === 'string' && /^data:image\/(jpeg|jpg|png|webp);/i.test(src)) ? src : '';
        }
        function safeEmoji(e) { return (typeof e === 'string' && e.length <= 8 && !/[<>&"']/.test(e)) ? e : '❓'; }
        function genCode() {
            return TTT.roomCodeFromBytes(crypto.getRandomValues(new Uint8Array(8)));
        }

        // ===== AI =====
        function aiBestMove(board, aiPlayer) {
            return TTT.aiBestMove(board, aiPlayer, aiDifficulty);
        }

        // ===== LOCAL PICKER =====
        function buildGrid(gridId, onPick, emojis) {
            const grid = $(gridId); grid.innerHTML = '';
            const COLS = 5;
            const list = emojis || EMOJIS;
            list.forEach((e, i) => {
                const btn = document.createElement('button');
                btn.className = 'e'; btn.textContent = e; btn.setAttribute('aria-label', 'Select '+e);
                btn.tabIndex = i === 0 ? 0 : -1;
                btn.addEventListener('click', () => onPick(e, btn));
                btn.addEventListener('focus', () => {
                    grid.querySelectorAll('.e').forEach((b, j) => b.tabIndex = j === i ? 0 : -1);
                });
                btn.addEventListener('keydown', ev => {
                    const btns = grid.querySelectorAll('.e');
                    let t = -1;
                    if (ev.key === 'ArrowRight' && i % COLS < COLS - 1) t = i + 1;
                    else if (ev.key === 'ArrowLeft' && i % COLS > 0) t = i - 1;
                    else if (ev.key === 'ArrowDown' && i + COLS < list.length) t = i + COLS;
                    else if (ev.key === 'ArrowUp' && i - COLS >= 0) t = i - COLS;
                    if (t >= 0 && btns[t]) { ev.preventDefault(); btns[t].focus(); }
                });
                grid.appendChild(btn);
            });
        }
        function buildCatTabs(containerId, onPick, prefix) {
            const p = prefix || '';
            const gridId = p ? p + '-emoji-grid' : 'emoji-grid';
            const photoId = p ? p + '-photo-wrap' : 'photo-wrap';
            const uploadId = p ? p + '-upload-area' : 'upload-area';
            const container = $(containerId); container.innerHTML = '';
            function selectTab(tab) {
                container.querySelectorAll('.cat-tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
                tab.classList.add('active');
                tab.setAttribute('aria-selected', 'true');
            }
            EMOJI_CATS.forEach((cat, idx) => {
                const tab = document.createElement('button');
                tab.className = 'cat-tab' + (idx === 0 ? ' active' : '');
                tab.setAttribute('role', 'tab');
                tab.setAttribute('aria-selected', idx === 0 ? 'true' : 'false');
                tab.innerHTML = `<span class="cat-icon">${cat.icon}</span><span class="cat-name">${cat.name}</span>`;
                tab.addEventListener('click', () => {
                    selectTab(tab);
                    $(photoId).style.display = 'none';
                    $(gridId).style.display = '';
                    buildGrid(gridId, onPick, cat.emojis);
                });
                container.appendChild(tab);
            });
            // Photo tab
            const photoTab = document.createElement('button');
            photoTab.className = 'cat-tab';
            photoTab.setAttribute('role', 'tab');
            photoTab.setAttribute('aria-selected', 'false');
            photoTab.innerHTML = '<span class="cat-icon">📷</span><span class="cat-name">Photo</span>';
            photoTab.addEventListener('click', () => {
                selectTab(photoTab);
                $(gridId).style.display = 'none';
                $(photoId).style.display = '';
            });
            container.appendChild(photoTab);
            // Arrow key navigation for tabs
            container.addEventListener('keydown', e => {
                const tabs = [...container.querySelectorAll('.cat-tab')];
                const idx = tabs.indexOf(document.activeElement);
                if (idx < 0) return;
                let next = -1;
                if (e.key === 'ArrowRight') next = (idx + 1) % tabs.length;
                else if (e.key === 'ArrowLeft') next = (idx - 1 + tabs.length) % tabs.length;
                if (next >= 0) { e.preventDefault(); tabs[next].click(); tabs[next].focus(); }
            });
            // Build default grid (first category)
            buildGrid(gridId, onPick, EMOJI_CATS[0].emojis);
        }


        function renderAvatarCard(opts) {
            const icon = opts.icon;
            const status = opts.status;
            const ready = opts.ready;
            if (opts.photo) {
                const sp = safePhotoSrc(opts.photo);
                icon.innerHTML = sp
                    ? `<img src="${sp}" style="width:100%;height:100%;object-fit:cover;border-radius:5px;transform:scaleX(-1);" alt="">`
                    : '👤';
            } else if (opts.emoji) {
                icon.textContent = opts.emoji;
            } else {
                icon.textContent = '👤';
            }
            if (opts.statusText) {
                status.textContent = opts.statusText;
                status.className = 'rp-status' + (opts.readyState ? ' ready' : '');
            }
            if (opts.readyState) ready.classList.add('ready');
            else ready.classList.remove('ready');
            if (opts.active) ready.classList.add('active');
            else if (opts.active === false) ready.classList.remove('active');
            if (opts.label) {
                const lab = ready.querySelector('.rp-label');
                if (lab) lab.textContent = opts.label;
            }
        }

        function updatePickerUI() {
            // Update ready player boxes
            [0,1].forEach(i => {
                const icon = $(i===0?'pick-p1-icon':'pick-p2-icon');
                const status = $(i===0?'pick-p1-status':'pick-p2-status');
                const ready = $(i===0?'p1-ready':'p2-ready');
                // Update P2 label for Computer mode
                if(i===1 && selectedMode==='computer') {
                    ready.querySelector('.rp-label').textContent = 'Computer';
                } else if(i===1) {
                    ready.querySelector('.rp-label').textContent = 'P2';
                }
                const has = photos[i] || picks[i];
                renderAvatarCard({
                    icon, status, ready,
                    photo: photos[i],
                    emoji: photos[i] ? null : picks[i],
                    statusText: has ? '✓ Ready' : (i === 0 ? 'Pick your avatar' : 'Waiting'),
                    readyState: !!has,
                    active: pickStep === i
                });
            });

            // Mark used emojis
            document.querySelectorAll('#emoji-grid .e').forEach(btn => {
                const isP1Emoji = picks[0] && btn.textContent === picks[0];
                const isP2Emoji = picks[1] && btn.textContent === picks[1];
                btn.classList.toggle('sel', isP1Emoji || isP2Emoji);
                // Mark as "used" if selected by the OTHER player, or if both have selected
                btn.classList.toggle('used', (isP1Emoji && pickStep === 1) || (isP2Emoji && pickStep === 0) || (picks[0] && picks[1] && (isP1Emoji || isP2Emoji)));
            });

            if (pickStep === 0 && !picks[0] && !photos[0]) {
                pickHeader.textContent = 'Player 1 — pick your avatar';
                pickHeader.className = 'pick-header active';
            } else if (pickStep === 0 && selectedMode === 'computer') {
                pickHeader.textContent = 'Ready to play!';
                pickHeader.className = 'pick-header active';
            } else if (!picks[1]) {
                pickHeader.textContent = selectedMode === 'computer' ? 'Computer — pick their avatar' : 'Player 2 — pick your avatar';
                pickHeader.className = 'pick-header active';
                // Reset to first category tab for P2
                const firstTab = $('cat-tabs').querySelector('.cat-tab');
                if (firstTab) firstTab.click();
            } else {
                pickHeader.textContent = 'Ready to play!';
                pickHeader.className = 'pick-header active';
            }

            // Update Start Game button based on selected mode
            const startBtn = document.getElementById('start-game-btn');
            const p1Ready = !!(picks[0] || photos[0]);
            const p2Ready = !!(picks[1] || photos[1]);
            if (selectedMode === 'local' || selectedMode === 'computer') {
                startBtn.disabled = !(p1Ready && p2Ready);
            } else {
                startBtn.disabled = true;
            }
        }

        const emojiPickHandler = (e, btn) => {
            // Toggle: if clicking same emoji, deselect it
            if (picks[0] === e) {
                picks[0] = null; emojis[0] = null; photos[0] = null; pickStep = 0;
                updatePickerUI();
                return;
            }
            if (picks[1] === e) {
                picks[1] = null; emojis[1] = null; photos[1] = null;
                updatePickerUI();
                return;
            }
            if ((pickStep === 0 && picks[1] === e) || (pickStep === 1 && picks[0] === e)) return;

            picks[pickStep] = e; emojis[pickStep] = e; photos[pickStep] = null;
            btn.classList.add('just-picked');
            setTimeout(() => btn.classList.remove('just-picked'), 250);
            updatePickerUI();
            // Reset to first tab for P2 pick
            if (pickStep === 0) {
                pickStep = 1;
                setTimeout(() => {
                    const firstTab = $('cat-tabs').querySelector('.cat-tab');
                    if (firstTab) firstTab.click();
                    updatePickerUI();
                }, 300);
            }
        };
        buildCatTabs('cat-tabs', emojiPickHandler);

        // Title screen buttons
        function showPicker(mode) {
            selectedMode = mode;
            showScreen('picker');
            const modeLabel = $('picker-mode-label');
            if (mode === 'local') { modeLabel.textContent = 'Local — same device'; }
            else if (mode === 'computer') { modeLabel.textContent = 'vs Computer'; }
            // Reset picker state
            picks=[null,null]; emojis=[null,null]; photos=[null,null]; pickStep=0;
            $('photo-wrap').style.display = 'none';
            $('emoji-grid').style.display = '';
            const firstTab = $('cat-tabs').querySelector('.cat-tab');
            if (firstTab) firstTab.click();
            updatePickerUI();
        }
        $('title-local-btn').addEventListener('click', () => { showPicker('local'); });
        $('title-ai-btn').addEventListener('click', () => { showPicker('computer'); });
        $('title-online-btn').addEventListener('click', () => {
            selectedMode = 'online';
            showScreen('online-screen');
            $('online-error').classList.add('hidden');
            onlinePickData = { emoji: null, photo: null };
            buildOnlineGrids();
            updateOnlinePickerUI();
            initFirebase().catch(() => showOnlineError('You need an internet connection to play online.'));
        });

        // Picker close button
        $('picker-close-btn').addEventListener('click', () => {
            showScreen('title-screen');
            selectedMode = null;
        });

        // Start Game button (from avatar picker)
        $('start-game-btn').addEventListener('click', () => {
            if (selectedMode === 'local') {
                if (!picks[0] || !picks[1]) return;
                if(navigator.vibrate)navigator.vibrate(10);
                if(gameListener&&roomRef){roomRef.off('value',gameListener);gameListener=null;}
                if(joinListener&&roomRef){roomRef.child('players/1').off('value',joinListener);joinListener=null;}
                roomRef=null; roomCode=null; playerIndex=null;
                isOnline = false; vsComputer = false;
                $('diff-chip').style.display='none';
                $('p2-game-box').querySelector('.gt-label').textContent = 'P2';
                showScreen('game-screen');
                resetBoard();
            } else if (selectedMode === 'computer') {
                if (!picks[0] || !picks[1]) return;
                if(navigator.vibrate)navigator.vibrate(10);
                vsComputer = true;
                isOnline = false;
                roomRef = null; roomCode = null; playerIndex = null;
                pickStep = 0;
                showScreen('game-screen');
                $('diff-chip').style.display = 'flex';
                $('p2-game-box').querySelector('.gt-label').textContent = 'Computer';
                firstTurn = 0; // Human always goes first in computer mode
                resetBoard();
            }
        });

        // Difficulty chip
        document.querySelectorAll('#diff-chip .diff-chip-item').forEach(btn => {
            btn.addEventListener('click', () => {
                aiDifficulty = btn.dataset.diff;
                document.querySelectorAll('#diff-chip .diff-chip-item').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
                btn.classList.add('active');
                btn.setAttribute('aria-pressed', 'true');
            });
        });

        updatePickerUI();

        // Upload photo
        function processPhoto(file, canvasId, onDone) {
            if (!file) return;
            if (file.size > 10 * 1024 * 1024) { showOnlineError('Photo must be under 10 MB'); return; }
            const reader = new FileReader();
            reader.onload = () => {
                const img = new Image();
                img.onload = () => {
                    const canvas = $(canvasId);
                    canvas.width = 128; canvas.height = 128;
                    const ctx = canvas.getContext('2d');
                    const s = Math.min(img.width, img.height);
                    ctx.drawImage(img, (img.width-s)/2, (img.height-s)/2, s, s, 0, 0, 128, 128);
                    // Always JPEG 0.6 — keep avatar payloads tiny (~3–8KB)
                    let data = canvas.toDataURL('image/jpeg', 0.6);
                    if (!safePhotoSrc(data) || data.length > 12000) {
                        showOnlineError('Photo could not be compressed enough. Try a smaller image.');
                        return;
                    }
                    onDone(data);
                };
                img.onerror = () => showOnlineError('Could not read that image.');
                img.src = reader.result;
            };
            reader.readAsDataURL(file);
        }
        function wireUpload(areaId, inputId, canvasId, onDone) {
            $(areaId).addEventListener('click', () => { $(inputId).click(); });
            $(areaId).addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $(inputId).click(); } });
            $(inputId).addEventListener('change', (e) => { processPhoto(e.target.files[0], canvasId, onDone); e.target.value = ''; });
        }
        wireUpload('upload-area', 'photo-upload', 'snap-canvas', (photo) => {
            photos[pickStep] = photo; emojis[pickStep] = null; picks[pickStep] = '📸';
            updatePickerUI();
            if (pickStep === 0) { pickStep = 1; setTimeout(updatePickerUI, 300); }
        });
        wireUpload('online-upload-area', 'online-photo-upload', 'online-snap-canvas', (photo) => {
            onlinePickData = { emoji: null, photo };
            document.querySelectorAll('#online-emoji-grid .e').forEach(b=>b.classList.remove('sel'));
            updateOnlinePickerUI();
        });

        $('online-close-btn').addEventListener('click', () => {
            showScreen('title-screen');
            selectedMode = null;
            picks = [null, null]; emojis = [null, null]; photos = [null, null]; pickStep = 0;
            onlinePickData = { emoji: null, photo: null };
            hostPickData = null;
            $('create-btn').style.display = '';
            $('create-btn').textContent = 'Create Room'; $('create-btn').disabled = true;
            $('join-btn').style.display = 'none';
            $('online-header').textContent = 'Player 1 — pick your avatar';
            history.replaceState(null, '', location.pathname);
        });

        // ===== ONLINE =====
        function buildOnlineGrids() {
            const onPick = (e, btn) => {
                document.querySelectorAll('#online-emoji-grid .e').forEach(b=>b.classList.remove('sel'));
                btn.classList.add('sel');
                onlinePickData = { emoji: e, photo: null };
                updateOnlinePickerUI();
            };
            buildCatTabs('online-cat-tabs', onPick, 'online');
        }


        // Host P1 data (set from Firebase for invite links, null for create flow)
        let hostPickData = null;

        function updateOnlinePickerUI() {
            // P1 box — show host data if joining, else show local pick
            const p1Icon = $('online-pick-p1-icon');
            const p1Status = $('online-pick-p1-status');
            const p1Ready = $('online-p1-ready');
            const p1Data = hostPickData || onlinePickData;
            renderAvatarCard({
                icon: p1Icon, status: p1Status, ready: p1Ready,
                photo: p1Data.photo,
                emoji: p1Data.photo ? null : p1Data.emoji,
                statusText: (p1Data.photo || p1Data.emoji) ? '✓ Ready' : 'Pick your avatar',
                readyState: !!(p1Data.photo || p1Data.emoji)
            });

            // P2 box — only when joining (hostPickData is set)
            const p2Icon = $('online-pick-p2-icon');
            const p2Status = $('online-pick-p2-status');
            const p2Ready = $('online-p2-ready');
            if (hostPickData) {
                renderAvatarCard({
                    icon: p2Icon, status: p2Status, ready: p2Ready,
                    photo: onlinePickData.photo,
                    emoji: onlinePickData.photo ? null : onlinePickData.emoji,
                    statusText: (onlinePickData.photo || onlinePickData.emoji) ? '✓ Ready' : 'Pick your avatar',
                    readyState: !!(onlinePickData.photo || onlinePickData.emoji),
                    active: true
                });
                p1Ready.classList.remove('active');
            }

            $('create-btn').disabled = !onlinePickData.emoji && !onlinePickData.photo;
            $('join-btn').disabled = !onlinePickData.emoji && !onlinePickData.photo;
        }

        // Create room
        $('create-btn').addEventListener('click', () => {
            if(navigator.vibrate)navigator.vibrate(10);
            const btn=$('create-btn'); btn.innerHTML='<span class="spinner"></span>Creating…'; btn.disabled=true;
            isOnline=true; vsComputer=false; onlineStarted=false;
            roomCode = genCode(); playerIndex=0;
            const myEmoji = onlinePickData.emoji || EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
            const myPhoto = onlinePickData.photo;
            if (myPhoto) {
                emojis=[null,null]; photos=[myPhoto,null];
            } else {
                emojis=[myEmoji,null]; photos=[null,null];
            }
            initFirebase().then(d => { db = d;
            if (!uid) throw new Error('AUTH_DISABLED — enable Anonymous Auth in Firebase Console');
            roomRef = db.ref('rooms/'+roomCode);

            // If P1 disconnects before P2 joins, mark as disconnected (cleanup listener handles removal)
            roomRef.child('players/0').onDisconnect().update({disconnected:true, uid}).catch(()=>{});

            // Single set() — parent write rule cascades. Never include null keys (null = delete).
            const seat = { disconnected: false, uid };
            if (myPhoto) seat.photo = myPhoto; else seat.emoji = myEmoji;

            roomRef.set({
                players: { 0: seat },
                board: {},
                turn: 0,
                scores: { 0: 0, 1: 0, 2: 0 },
                gameOver: false,
                created: Date.now(),
                host: uid,
                status: 'waiting'
            }).then(() => {
                // Listen for player 2 joining
                joinListener = roomRef.child('players/1').on('value', snap => {
                    const p2=snap.val();
                    if(p2 && !onlineStarted) {
                        onlineStarted=true;
                        if(p2.photo){photos[1]=p2.photo;emojis[1]=null;}else{emojis[1]=p2.emoji;photos[1]=null;}
                        roomRef.child('players/1').off('value',joinListener); joinListener=null;
                        // P2 joined — both mark as disconnected on disconnect
                        roomRef.onDisconnect().cancel();
                        roomRef.child('players/0').onDisconnect().update({disconnected:true, uid}).catch(()=>{});
                        roomRef.child('players/1').onDisconnect().update({disconnected:true, uid}).catch(()=>{});
                        startOnlineGame();
                    }
                });

                showScreen('waiting-screen');
                // Store invite URL for copy
                window._inviteUrl = location.origin+location.pathname+'?room='+roomCode;
                // Show nudge after 30s
                setTimeout(() => {
                    if ($('waiting-screen').classList.contains('hidden') === false) {
                        $('waiting-text').textContent = 'Still waiting — share the link!';
                    }
                }, 30000);
            }).catch(err => {
                console.error('Create failed:', err && err.code, err);
                const code = (err && err.code) || '';
                let msg = 'Failed: ' + ((err && err.message) || err);
                if (code === 'PERMISSION_DENIED') {
                    msg = 'Permission denied. Check: (1) Anonymous Auth is ON, (2) rules published from firebase-rules.md, (3) this page is the build with signInAnonymously.';
                } else if (String(err && err.message || err).indexOf('AUTH_DISABLED') !== -1) {
                    msg = 'Enable Anonymous Auth in Firebase Console → Authentication → Sign-in method.';
                }
                $('online-error').textContent = msg;
                $('online-error').classList.remove('hidden');
                btn.innerHTML='Create Room'; btn.disabled=false;
                isOnline = false;
            });
            }).catch(err => {
                console.error('Create init failed:', err);
                btn.innerHTML='Create Room'; btn.disabled=false; isOnline = false;
                showOnlineError(String(err && err.message || err).indexOf('AUTH_DISABLED') !== -1
                    ? 'Enable Anonymous Auth in Firebase Console → Authentication → Sign-in method.'
                    : 'You need an internet connection to play online.');
            });
        });

        $('copy-invite-btn').addEventListener('click', () => {
            const url = window._inviteUrl;
            if (!url) return;
            const btn = $('copy-invite-btn');
            const showCopied = () => {
                btn.textContent = '✅ Link Copied!';
                btn.classList.remove('btn-primary');
                btn.classList.add('btn-success');
                setTimeout(() => {
                    btn.textContent = '📋 Copy Invite Link';
                    btn.classList.remove('btn-success');
                    btn.classList.add('btn-primary');
                }, 2000);
            };
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(url).then(showCopied).catch(() => { fallbackCopy(url); showCopied(); });
            } else {
                fallbackCopy(url); showCopied();
            }
        });
        function fallbackCopy(text) {
            const ta = document.createElement('textarea'); ta.value = text;
            ta.style.position = 'fixed'; ta.style.left = '-9999px';
            document.body.appendChild(ta); ta.select();
            try { document.execCommand('copy'); } catch(e) {}
            document.body.removeChild(ta);
        }

        $('cancel-btn').addEventListener('click', () => {
            if(joinListener && roomRef){roomRef.child('players/1').off('value',joinListener);joinListener=null;}
            if(roomRef){roomRef.onDisconnect().cancel();roomRef.remove().catch(()=>{});}
            roomRef=null; roomCode=null;
            showScreen('online-screen');
            $('create-btn').textContent='Create Room'; $('create-btn').disabled=true;
            updateOnlinePickerUI();
        });

        // Start online game
        function startOnlineGame() {
            try{sessionStorage.setItem('ttt-session',JSON.stringify({roomCode,playerIndex}));}catch(e){}
            showScreen('game-screen');
            resetBoard();
            onlineWrite(roomRef.update({status:'playing',startedAt:Date.now()}), 'Start game');

            if(gameListener && roomRef) roomRef.off('value',gameListener);
            if(cleanupListener && roomRef) roomRef.child('players').off('value',cleanupListener);
            if(opponentListener && roomRef) roomRef.child(`players/${1-playerIndex}`).off('value',opponentListener);

            opponentLeaveTimer = null;
            opponentListener = snap => {
                const p=snap.val();
                const gone=!p||p.disconnected===true;
                if(gone&&!state.gameOver&&onlineStarted){
                    // Grace period: wait 10s before declaring opponent left
                    if(opponentLeaveTimer) return;
                    opponentLeaveTimer = setTimeout(() => {
                        opponentLeaveTimer = null;
                        if(state.gameOver) return;
                        state.gameOver=true;
                        opponentLeft=true;
                        // Record win for remaining player
                        state.scores[playerIndex]++;
                        updateScores();
                        if(roomRef) onlineWrite(roomRef.update({gameOver:true, scores:{0:state.scores[0],1:state.scores[1],2:state.scores[2]}}), 'Record win');
                        resultBig.textContent='🏆';
                        resultText.textContent='You win!';
                        $('result-line').textContent='Opponent left';
                        $('leave-btn').textContent='New Game';
                        resultOverlay.classList.add('show');
                    }, 10000);
                } else if(!gone && opponentLeaveTimer) {
                    // Opponent reconnected within grace period
                    clearTimeout(opponentLeaveTimer);
                    opponentLeaveTimer = null;
                }
            };
            roomRef.child(`players/${1-playerIndex}`).on('value', opponentListener);

            // Clean up room when both players disconnect, or stale rooms
            let cleanupTimers = [];
            cleanupListener = snap => {
                const d = snap.val();
                if (!d) return;
                const p0 = d[0], p1 = d[1];
                // Both disconnected
                if (p0 && p1 && p0.disconnected === true && p1.disconnected === true) {
                    const t = setTimeout(() => {
                        roomRef.once('value', s => {
                            const v = s.val();
                            if (v && v.players && v.players[0] && v.players[1] && v.players[0].disconnected === true && v.players[1].disconnected === true) {
                                roomRef.remove().catch(()=>{});
                            }
                        });
                    }, 5000);
                    cleanupTimers.push(t);
                }
                // P1 disconnected, P2 never joined (stale room)
                if (p0 && p0.disconnected === true && !p1) {
                    const t = setTimeout(() => {
                        roomRef.once('value', s => {
                            const v = s.val();
                            if (v && v.players && v.players[0] && v.players[0].disconnected === true && !v.players[1]) {
                                roomRef.remove().catch(()=>{});
                            }
                        });
                    }, 2000);
                    cleanupTimers.push(t);
                }
            };
            roomRef.child('players').on('value', cleanupListener);

            // Reset disconnected flag on reconnect + banner
            if(connectedListener) db.ref('.info/connected').off('value', connectedListener);
            connectedListener = snap => {
                const connected = snap.val() === true;
                $('network-banner').classList.toggle('hidden', connected);
                if(connected && roomRef && playerIndex!==null) {
                    roomRef.child('players/'+playerIndex).update({disconnected:false, uid}).catch(()=>{});
                    roomRef.child('players/'+playerIndex).onDisconnect().update({disconnected:true, uid}).catch(()=>{});
                }
            };
            db.ref('.info/connected').on('value', connectedListener);

            gameListener = roomRef.on('value', snap => {
                const d=snap.val();
                if(!d){if(!state.gameOver)setTimeout(()=>leaveGame(),1500);return;}
                if(moveInProgress)return;
                const rb=d.board, nb=Array(9).fill(null);
                if(rb&&typeof rb==='object'){for(let i=0;i<9;i++)if(rb[i]!=null)nb[i]=rb[i];}
                const prevBoard = state.board.slice();
                state.board=nb; state.turn=d.turn!=null?d.turn:0;
                const rs=d.scores; state.scores=[0,0,0];
                if(rs&&typeof rs==='object'){if(rs[0]!=null)state.scores[0]=rs[0];if(rs[1]!=null)state.scores[1]=rs[1];if(rs[2]!=null)state.scores[2]=rs[2];}
                if(d.players&&d.players[0]){if(d.players[0].emoji){emojis[0]=d.players[0].emoji;photos[0]=null;}else if(d.players[0].photo){photos[0]=d.players[0].photo;emojis[0]=null;}}
                if(d.players&&d.players[1]){if(d.players[1].emoji){emojis[1]=d.players[1].emoji;photos[1]=null;}else if(d.players[1].photo){photos[1]=d.players[1].photo;emojis[1]=null;}}
                renderBoard(); updateTurn(); updateScores();
                // Play sound for opponent's new placement
                for(let i=0;i<9;i++){if(nb[i]!==null&&prevBoard[i]===null&&nb[i]!==playerIndex){sndPlace();break;}}
                if(d.gameOver&&!state.gameOver){
                    let w=null,wl=null;
                    for(const[a,b,c]of WIN_LINES){if(state.board[a]!==null&&state.board[a]===state.board[b]&&state.board[a]===state.board[c]){w=state.board[a];wl=[a,b,c];break;}}
                    endGame(w,wl);
                }
            });
        }

        // ===== BOARD =====
        function resetBoard() {
            state.board=Array(9).fill(null);state.turn=firstTurn;state.gameOver=false;lastWinLine=null;
            boardEl.innerHTML='<div class="board-lines"><div class="v"></div><div class="v"></div><div class="h"></div><div class="h"></div></div>';
            cells.length=0;
            for(let i=0;i<9;i++){
                const cell=document.createElement('button');cell.className='cell';cell.setAttribute('role','gridcell');cell.setAttribute('aria-label','Row '+Math.floor(i/3+1)+' Column '+(i%3+1)+', empty');
                const img=document.createElement('img');img.alt='';img.style.display='none';
                const ce=document.createElement('span');ce.className='ce';ce.style.display='none';
                cell.appendChild(img);cell.appendChild(ce);
                cell.tabIndex = i===0 ? 0 : -1;
                cell.addEventListener('click',()=>handleClick(i));
                cell.addEventListener('focus', () => { cells.forEach((c,j)=>c.tabIndex=j===i?0:-1); });
                cell.addEventListener('keydown', e => {
                    let t=-1;
                    if(e.key==='ArrowUp'&&i>=3) t=i-3;
                    else if(e.key==='ArrowDown'&&i<6) t=i+3;
                    else if(e.key==='ArrowLeft'&&i%3>0) t=i-1;
                    else if(e.key==='ArrowRight'&&i%3<2) t=i+1;
                    if(t>=0&&cells[t]){e.preventDefault();cells[t].focus();}
                });
                boardEl.appendChild(cell);cells.push(cell);
            }
            resultOverlay.classList.remove('show');clearWinLine();renderBoard();updateTurn();updateScores();updateStreakDisplay();
        }

        function renderBoard() {
            cells.forEach((cell,i)=>{
                const v=state.board[i],img=cell.querySelector('img'),ce=cell.querySelector('.ce');
                const row=Math.floor(i/3)+1,col=i%3+1;
                if(v!==null){
                    cell.classList.add('m');
                    cell.classList.remove('threat');
                    const label='Player '+(v+1)+' ('+(emojis[v]||'photo')+')';
                    cell.setAttribute('aria-label','Row '+row+' Column '+col+', '+label);
                    if(hasPhoto(v)){const sp=safePhotoSrc(photos[v]);if(sp){img.src=sp;img.style.display='';img.style.opacity='1';img.style.transform='scale(1) scaleX(-1)';ce.style.display='none';img.alt=label;}}
                    else if(hasEmoji(v)){ce.textContent=emojis[v];ce.style.display='';ce.style.opacity='1';ce.style.transform='scale(1)';img.style.display='none';}
                }else{cell.classList.remove('m','win','threat');img.style.display='none';ce.style.display='none';cell.setAttribute('aria-label','Row '+row+' Column '+col+', empty');}
            });
            updateThreats();
        }
        function updateThreats() {
            if (state.gameOver) return;
            for (const [a,b,c] of WIN_LINES) {
                const va=state.board[a], vb=state.board[b], vc=state.board[c];
                if (va !== null && va === vb && vc === null && cells[c]) cells[c].classList.add('threat');
                else if (va !== null && va === vc && vb === null && cells[b]) cells[b].classList.add('threat');
                else if (vb !== null && vb === vc && va === null && cells[a]) cells[a].classList.add('threat');
            }
        }

        function updatePlayerBoxes() {
            [0,1].forEach(i => {
                const icon = $(i===0 ? 'p1-icon' : 'p2-icon');
                const score = $(i===0 ? 'p1-score' : 'p2-score');
                const box = $(i===0 ? 'p1-game-box' : 'p2-game-box');
                if (photos[i]) {
                    icon.innerHTML = `<img src="${safePhotoSrc(photos[i])}" alt="">`;
                } else if (emojis[i]) {
                    icon.textContent = emojis[i];
                }
                score.textContent = state.scores[i];
                box.className = 'game-tab' + (state.turn === i ? ' active' : '');
            });
            drawScore.textContent = state.scores[2];
        }
        function updateTurn(){updatePlayerBoxes();setTimeout(()=>{ariaAnnouncer.textContent='Player '+(state.turn+1)+"'s turn";},350);}
        function announce(text){ariaAnnouncer.textContent='';setTimeout(()=>{ariaAnnouncer.textContent=text;},50);}
        function updateScores(){updatePlayerBoxes();if(!isOnline)saveScores();}
        function updateStreakDisplay(){const el=$('streak-display');if(!el)return;el.textContent=vsComputer&&streak>1?`${streak}🔥 streak`:'';}

        const boardFromStore = TTT.boardFromStore;
        const scoresFromStore = TTT.scoresFromStore;
        const findWin = TTT.findWin;
        const boardToStore = TTT.boardToStore;

        // Online: DB is the referee — abort if cell taken, not your turn, or game over.
        function commitOnlineMove(i) {
            const myIndex = playerIndex;
            if (myIndex === null || !roomRef) return;
            moveInProgress = true;
            roomRef.transaction(room => {
                if (!room || room.gameOver) return; // abort
                const raw = (room.board && typeof room.board === 'object') ? room.board : {};
                if (raw[i] != null) return; // abort — cell taken
                const turn = room.turn != null ? room.turn : 0;
                if (turn !== myIndex) return; // abort — not your turn
                const nextBoard = {};
                for (let k = 0; k < 9; k++) if (raw[k] != null) nextBoard[k] = raw[k];
                nextBoard[i] = myIndex;
                const b = boardFromStore(nextBoard);
                const { w } = findWin(b);
                const draw = w === null && b.every(c => c !== null);
                const scores = scoresFromStore(room.scores);
                if (w !== null) scores[w]++;
                else if (draw) scores[2]++;
                const next = {};
                for (const k in room) next[k] = room[k];
                next.board = nextBoard;
                next.turn = (w !== null || draw) ? turn : 1 - turn;
                next.scores = { 0: scores[0], 1: scores[1], 2: scores[2] };
                next.gameOver = w !== null || draw;
                return next;
            }, (err, committed, snap) => {
                moveInProgress = false;
                if (err) {
                    console.error('Move failed:', err);
                    showOnlineError('Move failed — try again');
                    return;
                }
                if (!committed) {
                    showOnlineError('Move rejected — cell taken or not your turn');
                    return;
                }
                sndPlace();
                const row = Math.floor(i / 3) + 1, col = i % 3 + 1;
                announce('Player ' + (myIndex + 1) + ' placed at row ' + row + ' column ' + col);
                if (navigator.vibrate) navigator.vibrate(10);
                const room = snap.val() || {};
                state.board = boardFromStore(room.board);
                state.turn = room.turn != null ? room.turn : 0;
                state.scores = scoresFromStore(room.scores);
                const { w, wl } = findWin(state.board);
                const draw = w === null && state.board.every(c => c !== null);
                renderBoard();
                if (w !== null) endGame(w, wl);
                else if (draw) endGame(null);
                else updateTurn();
            }, false);
        }

        function handleClick(i) {
            if(state.gameOver||state.board[i]!==null)return;
            if(moveInProgress)return; // Lock board until Firebase confirms move
            // In vs Computer mode, block clicks during AI's turn
            if(vsComputer && state.turn !== 0) return;
            if(playerIndex!==null&&state.turn!==playerIndex){
                // Wrong turn feedback
                cells[i].classList.add('shake');
                note(200,0.15,'sine',0.05);
                if(navigator.vibrate)navigator.vibrate([30,20,30]);
                setTimeout(()=>cells[i].classList.remove('shake'),300);
                return;
            }
            // Online: transaction checks cell empty + turn + gameOver atomically
            if(roomRef){ commitOnlineMove(i); return; }
            const cur=state.turn; state.board[i]=cur; sndPlace();
            const row=Math.floor(i/3)+1, col=i%3+1;
            announce('Player '+(cur+1)+' placed at row '+row+' column '+col);
            if(navigator.vibrate)navigator.vibrate(10);
            let w=null,wl=null;
            for(const[a,b,c]of WIN_LINES){if(state.board[a]!==null&&state.board[a]===state.board[b]&&state.board[a]===state.board[c]){w=state.board[a];wl=[a,b,c];break;}}
            const draw=w===null&&state.board.every(c=>c!==null);
            if(w!==null)state.scores[w]++;else if(draw)state.scores[2]++;
            renderBoard();
            if(w!==null)endGame(w,wl);else if(draw)endGame(null);else{state.turn=1-cur;updateTurn();}
            // Trigger AI move after human's turn
            if(vsComputer && !state.gameOver && state.turn===1) {
                setTimeout(aiMakeMove, 400);
            }
        }

        function aiMakeMove() {
            if(state.gameOver || state.turn !== 1) return;
            const move = aiBestMove(state.board.slice(), 1);
            if(move < 0) return;
            state.board[move] = 1;
            sndPlace();
            const row=Math.floor(move/3)+1, col=move%3+1;
            announce('Computer placed at row '+row+' column '+col);
            if(navigator.vibrate)navigator.vibrate(10);
            let w=null,wl=null;
            for(const[a,b,c]of WIN_LINES){if(state.board[a]!==null&&state.board[a]===state.board[b]&&state.board[a]===state.board[c]){w=state.board[a];wl=[a,b,c];break;}}
            const draw=w===null&&state.board.every(c=>c!==null);
            if(w!==null)state.scores[w]++;else if(draw)state.scores[2]++;
            renderBoard();
            if(w!==null)endGame(w,wl);else if(draw)endGame(null);else{state.turn=0;updateTurn();}
        }

        let lastWinLine=null;
        function fireConfetti() {
            if(prefersReducedMotion) return;
            const c=document.createElement('canvas');c.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:300';document.body.appendChild(c);
            const ctx=c.getContext('2d'),dpr=devicePixelRatio||1;let W,H;
            function resize(){W=innerWidth;H=innerHeight;c.width=W*dpr;c.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);}resize();
            const colors=['#4ecdc4','#ff6b6b','#ffe66d','#a29bfe','#fd79a8','#00b894'];
            const ps=Array.from({length:120},()=>({x:W/2+(Math.random()-0.5)*140,y:H*0.4,vx:(Math.random()-0.5)*14,vy:-Math.random()*16-4,r:Math.random()*4+2,c:colors[Math.floor(Math.random()*colors.length)],rot:Math.random()*360,rv:(Math.random()-0.5)*8,life:1}));
            let frame=0;
            function draw(){
                ctx.clearRect(0,0,W,H);frame++;
                let alive=false;
                ps.forEach(p=>{
                    if(p.life<=0)return;alive=true;
                    p.x+=p.vx;p.y+=p.vy;p.vy+=0.35;p.rot+=p.rv;p.life-=0.012;p.vx*=0.99;
                    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot*Math.PI/180);ctx.globalAlpha=p.life;
                    ctx.fillStyle=p.c;ctx.fillRect(-p.r,-p.r*0.6,p.r*2,p.r*1.2);
                    ctx.restore();
                });
                if(alive&&frame<180)requestAnimationFrame(draw);else c.remove();
            }
            requestAnimationFrame(draw);
        }
        function getWinLineName(wl) {
            if(!wl) return '';
            const lines = {'0,1,2':'Top row','3,4,5':'Middle row','6,7,8':'Bottom row','0,3,6':'Left column','1,4,7':'Centre column','2,5,8':'Right column','0,4,8':'Diagonal','2,4,6':'Diagonal'};
            return lines[wl.join(',')] || '';
        }
        function endGame(w,wl) {
            if(state.gameOver) return;
            state.gameOver=true;lastWinLine=wl;
            if(!vsComputer) firstTurn=1-firstTurn; // Alternate who goes first (local/online only)
            if(w!==null&&wl){wl.forEach(i=>cells[i].classList.add('win'));drawWinLine(wl);sndWin();fireConfetti();if(navigator.vibrate)navigator.vibrate([50,30,50]);boardWrap.classList.add('pulse');setTimeout(()=>boardWrap.classList.remove('pulse'),400);
                resultBig.innerHTML='';
                if(hasPhoto(w)){const img=document.createElement('img');img.src=safePhotoSrc(photos[w]);img.alt='';resultBig.appendChild(img);}
                else{const sp=document.createElement('span');sp.style.fontSize='2.5rem';sp.textContent=safeEmoji(emojis[w]);resultBig.appendChild(sp);}
                resultText.textContent=`Player ${w+1} wins`;
                $('result-line').textContent=getWinLineName(wl);
                announce('Player '+(w+1)+' wins!');
            }else{sndDraw();if(navigator.vibrate)navigator.vibrate(100);resultBig.innerHTML='<span style="font-size:2.5rem">🤝</span>';resultText.textContent='Draw';$('result-line').textContent='';announce('Draw');}
            if (vsComputer) { if (w === 0) streak++; else streak = 0; updateStreakDisplay(); }
            updateScores();
            setTimeout(()=>resultOverlay.classList.add('show'),w!==null?1000:300);

        }

        // Win line
        function drawWinLine(wl) {
            if(prefersReducedMotion)return;
            const rect=boardWrap.getBoundingClientRect(),dpr=devicePixelRatio||1;
            winCanvas.width=rect.width*dpr;winCanvas.height=rect.height*dpr;
            winCanvas.style.width=rect.width+'px';winCanvas.style.height=rect.height+'px';
            winCtx.setTransform(dpr,0,0,dpr,0,0);
            const cw=rect.width/3,ch=rect.height/3;
            const[a,,c]=wl;
            const x1=(a%3)*cw+cw/2,y1=Math.floor(a/3)*ch+ch/2,x2=(c%3)*cw+cw/2,y2=Math.floor(c/3)*ch+ch/2;
            // Generate hand-drawn control points
            const dx=x2-x1,dy=y2-y1,len=Math.sqrt(dx*dx+dy*dy);
            const nx=-dy/len,ny=dx/len; // normal vector
            const segs=8,pts=[{x:x1,y:y1}];
            for(let i=1;i<segs;i++){
                const t=i/segs;
                pts.push({x:x1+dx*t+nx*(Math.random()-0.5)*6,y:y1+dy*t+ny*(Math.random()-0.5)*6});
            }
            pts.push({x:x2,y:y2});
            // Pre-compute bezier segments
            const curves=[];
            for(let i=0;i<pts.length-1;i++){
                const p0=pts[i],p1=pts[i+1];
                const mx=(p0.x+p1.x)/2+(Math.random()-0.5)*4,my=(p0.y+p1.y)/2+(Math.random()-0.5)*4;
                curves.push({sx:p0.x,sy:p0.y,cpx:mx,cpy:my,ex:p1.x,ey:p1.y});
            }
            const t=performance.now();
            function anim(n){
                const p=Math.min((n-t)/400,1),e=1-Math.pow(1-p,3);
                winCtx.clearRect(0,0,rect.width,rect.height);
                winCtx.strokeStyle=getComputedStyle(document.documentElement).getPropertyValue('--text').trim()||'#1a1a1a';winCtx.lineCap='round';winCtx.lineJoin='round';
                // Draw two passes for hand-drawn thickness variation
                for(let pass=0;pass<2;pass++){
                    winCtx.beginPath();winCtx.moveTo(x1,y1);
                    const drawTo=e*curves.length;
                    for(let i=0;i<Math.min(Math.ceil(drawTo),curves.length);i++){
                        const cr=curves[i],segP=Math.min(1,drawTo-i);
                        const cp={x:cr.sx+(cr.cpx-cr.sx)*segP,y:cr.sy+(cr.cpy-cr.sy)*segP};
                        const ep={x:cr.sx+(cr.ex-cr.sx)*segP,y:cr.sy+(cr.ey-cr.sy)*segP};
                        winCtx.quadraticCurveTo(cp.x+(pass?1:-1),cp.y+(pass?-1:1),ep.x,ep.y);
                    }
                    winCtx.lineWidth=pass?3.5:4.5;winCtx.globalAlpha=pass?0.4:0.85;
                    winCtx.stroke();
                }
                winCtx.globalAlpha=1;
                if(p<1)requestAnimationFrame(anim);
            }
            requestAnimationFrame(anim);
        }
        function clearWinLine(){winCtx.clearRect(0,0,winCanvas.width,winCanvas.height);}
        let resizeRaf=null;addEventListener('resize',()=>{if(!resizeRaf&&lastWinLine&&state.gameOver){resizeRaf=requestAnimationFrame(()=>{drawWinLine(lastWinLine);resizeRaf=null;});}});

        // Leave
        function continueGame() {
            if (opponentLeft) { opponentLeft=false; $('leave-btn').textContent='Play Again'; leaveGame(); showScreen('online-screen'); return; }
            $('leave-btn').textContent='Play Again';
            resultOverlay.classList.remove('show');
            clearWinLine();
            state.gameOver = false;
            if (roomRef) {
                onlineWrite(roomRef.update({ board: {}, turn: firstTurn, gameOver: false, scores: { 0: state.scores[0], 1: state.scores[1], 2: state.scores[2] } }), 'Reset board');
            }
            resetBoard();
            // If AI goes first after reset
            if(vsComputer && state.turn === 1) {
                setTimeout(aiMakeMove, 400);
            }
        }

        function leaveGame() {
            if(joinListener&&roomRef){roomRef.child('players/1').off('value',joinListener);joinListener=null;}
            if(gameListener&&roomRef){roomRef.off('value',gameListener);gameListener=null;}
            if(cleanupListener&&roomRef){roomRef.child('players').off('value',cleanupListener);cleanupListener=null;}
            if(opponentListener&&roomRef){roomRef.child(`players/${1-playerIndex}`).off('value',opponentListener);opponentListener=null;}
            else if(roomRef&&playerIndex!==null)roomRef.child(`players/${1-playerIndex}`).off();
            if(connectedListener){db.ref('.info/connected').off('value',connectedListener);connectedListener=null;}
            if(opponentLeaveTimer){clearTimeout(opponentLeaveTimer);opponentLeaveTimer=null;}
            if(roomRef){
                roomRef.onDisconnect().cancel();
                // Update status and duration before leaving
                onlineWrite(roomRef.update({status:'finished',endedAt:Date.now()}), 'Finish game').catch(()=>{});
                if(playerIndex===0){
                    // Host: mark disconnected, then remove room after short delay
                    roomRef.child('players/0').update({disconnected:true, uid}).then(()=>{
                        setTimeout(()=>{ roomRef.remove().catch(()=>{}); }, 2000);
                    }).catch(()=>{});
                } else {
                    // Guest: mark disconnected, then remove room after delay
                    roomRef.child('players/1').update({disconnected:true, uid}).then(()=>{
                        setTimeout(()=>{ roomRef.remove().catch(()=>{}); }, 5000);
                    }).catch(()=>{});
                }
            }
            try{sessionStorage.removeItem('ttt-session');}catch(e){}
            roomRef=null;roomCode=null;playerIndex=null;onlineStarted=false;isOnline=false;vsComputer=false;opponentLeft=false;selectedMode=null;
            $('diff-chip').style.display='none';
            // Reset P2 game tab
            $('p2-game-box').querySelector('.gt-label').textContent = 'P2';
            resultOverlay.classList.remove('show'); showScreen('title-screen');
            picks=[null,null];emojis=[null,null];photos=[null,null];pickStep=0;
            updatePickerUI();
        }
        window.addEventListener('beforeunload', e => { if(isOnline && roomRef && !state.gameOver) { e.preventDefault(); e.returnValue = ''; } });
        $('leave-btn').addEventListener('click',continueGame);
        $('menu-btn').addEventListener('click',leaveGame);
        $('game-close-btn').addEventListener('click',leaveGame);
        // Focus trap for result overlay
        resultOverlay.addEventListener('keydown', e => {
            if(e.key==='Escape'){e.preventDefault();if(isOnline&&!state.gameOver)return;leaveGame();return;}
            if(e.key!=='Tab')return;
            const btns=resultOverlay.querySelectorAll('button:not([style*="display:none"])');
            if(!btns.length)return;
            const first=btns[0],last=btns[btns.length-1];
            if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
            else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
        });

        // Auto-focus first button when result overlay appears
        new MutationObserver(() => {
            if (resultOverlay.classList.contains('show')) {
                setTimeout(() => {
                    const btn = resultOverlay.querySelector('button:not([style*="display:none"])');
                    if (btn) btn.focus();
                }, 250);
            } else {
                // Return focus to board when overlay closes
                if (cells[0]) cells[0].focus();
            }
        }).observe(resultOverlay, { attributes: true, attributeFilter: ['class'] });


        // ===== SESSION RECOVERY =====
        try {
            const saved = JSON.parse(sessionStorage.getItem('ttt-session'));
            if (saved && saved.roomCode && saved.playerIndex !== null && navigator.onLine) {
                roomCode = saved.roomCode; playerIndex = saved.playerIndex; isOnline = true; vsComputer = false;
                initFirebase().then(d => { db = d;
                roomRef = db.ref('rooms/' + roomCode);
                roomRef.once('value', snap => {
                    if (snap.exists() && snap.val().players && snap.val().players[playerIndex]) {
                        const d = snap.val();
                        // Restore game state before showing the board (avoids empty-board flash)
                        if(d.players[0]){if(d.players[0].emoji)emojis[0]=d.players[0].emoji;if(d.players[0].photo)photos[0]=d.players[0].photo;}
                        if(d.players[1]){if(d.players[1].emoji)emojis[1]=d.players[1].emoji;if(d.players[1].photo)photos[1]=d.players[1].photo;}
                        state.board = boardFromStore(d.board);
                        state.turn = d.turn != null ? d.turn : 0;
                        state.scores = scoresFromStore(d.scores);
                        state.gameOver = !!d.gameOver;
                        onlineStarted = true;
                        showScreen('game-screen');
                        startOnlineGame();
                        renderBoard(); updateTurn(); updateScores();
                    } else {
                        sessionStorage.removeItem('ttt-session');
                        roomRef = null; roomCode = null; playerIndex = null; isOnline = false;
                    }
                }).catch(() => {
                    sessionStorage.removeItem('ttt-session');
                    roomRef = null; roomCode = null; playerIndex = null; isOnline = false;
                });
                }).catch(() => { sessionStorage.removeItem('ttt-session'); roomRef = null; roomCode = null; playerIndex = null; isOnline = false; });
            }
        } catch(e) { sessionStorage.removeItem('ttt-session'); }

        // ===== INVITE LINK (join flow) =====
        const urlParams = new URLSearchParams(location.search);
        const inviteCode = urlParams.get('room');

        if (inviteCode) {
            showScreen('online-screen');
            $('create-btn').style.display = 'none';
            $('join-btn').style.display = '';
            $('online-header').textContent = 'Player 2 — pick your avatar';
            buildOnlineGrids();

            initFirebase().then(d => { db = d;
            // Fetch P1's data from Firebase
            const inviteRef = db.ref('rooms/' + inviteCode.toUpperCase());
            let inviteData = null;
            inviteRef.once('value').then(snap => {
                if (!snap.exists()) {
                    $('online-error').textContent = 'Room not found. It may have expired.';
                    $('online-error').classList.remove('hidden');
                    return;
                }
                const data = snap.val();
                if (!data.players || !data.players[0]) {
                    $('online-error').textContent = 'Invalid room.';
                    $('online-error').classList.remove('hidden');
                    return;
                }
                if (data.players[0].disconnected === true || data.status === 'finished') {
                    $('online-error').textContent = 'Host has left. Try another room.';
                    $('online-error').classList.remove('hidden');
                    return;
                }
                if (data.players[1] && data.players[1].disconnected !== true) {
                    $('online-error').textContent = 'Room is full. Another player is already in.';
                    $('online-error').classList.remove('hidden');
                    $('join-btn').disabled = true;
                    return;
                }

                // Show P1's emoji/photo
                inviteData = data;
                const p1 = data.players[0];
                hostPickData = { emoji: p1.emoji || null, photo: p1.photo || null };
                updateOnlinePickerUI();
            }).catch(err => {
                $('online-error').textContent = 'Failed to load room: ' + err.message;
                $('online-error').classList.remove('hidden');
            });
            }).catch(() => showOnlineError('You need an internet connection to play online.'));
        }

        // Join Room button
        $('join-btn').addEventListener('click', () => {
            if(navigator.vibrate)navigator.vibrate(10);
            const btn = $('join-btn'); btn.innerHTML = '<span class="spinner"></span>Joining…'; btn.disabled = true;
            const code = inviteCode.toUpperCase();
            const myEmoji = onlinePickData.emoji || EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
            const myPhoto = onlinePickData.photo;

            initFirebase().then(d => { db = d;
            const joinRef = db.ref('rooms/' + code);
            joinRef.once('value').then(snap => {
                if (!snap.exists()) {
                    $('online-error').textContent = 'Room not found. It may have expired.';
                    $('online-error').classList.remove('hidden');
                    btn.innerHTML = 'Join Room'; btn.disabled = false;
                    return null;
                }
                const data = snap.val();
                if (!data.players || !data.players[0]) {
                    $('online-error').textContent = 'Invalid room.';
                    $('online-error').classList.remove('hidden');
                    btn.innerHTML = 'Join Room'; btn.disabled = false;
                    return null;
                }
                if (data.players[0].disconnected === true || data.status === 'finished') {
                    $('online-error').textContent = 'Host has left. Try another room.';
                    $('online-error').classList.remove('hidden');
                    btn.innerHTML = 'Join Room'; btn.disabled = false;
                    return null;
                }
                if (data.players[1] && data.players[1].disconnected !== true) {
                    $('online-error').textContent = 'Room is full. Another player is already in.';
                    $('online-error').classList.remove('hidden');
                    btn.innerHTML = 'Join Room'; btn.disabled = false;
                    return null;
                }

                // Check emoji collision
                const hostEmoji = data.players[0].emoji;
                if (hostEmoji && !myPhoto && myEmoji === hostEmoji) {
                    $('online-error').textContent = 'That emoji is taken. Pick another one.';
                    $('online-error').classList.remove('hidden');
                    btn.innerHTML = 'Join Room'; btn.disabled = false;
                    return null;
                }

                isOnline = true; vsComputer = false;
                roomCode = code;
                playerIndex = 1;
                roomRef = joinRef;
                if (myPhoto) {
                    emojis = [null, null]; photos = [null, myPhoto];
                } else {
                    emojis = [null, myEmoji]; photos = [null, null];
                }
                // Read host data
                if (data.players[0].emoji) emojis[0] = data.players[0].emoji;
                if (data.players[0].photo) photos[0] = data.players[0].photo;

                // Omit nulls — Firebase treats them as deletes
                const seat1 = { disconnected: false, uid };
                if (myPhoto) seat1.photo = myPhoto; else seat1.emoji = myEmoji;
                return roomRef.child('players/1').set(seat1).then(() => {
                    roomRef.child('players/1').onDisconnect().update({disconnected:true, uid}).catch(()=>{});
                    startOnlineGame();
                });
            }).catch(err => {
                console.error('Join failed:', err);
                $('online-error').textContent = 'Failed: ' + err.message;
                $('online-error').classList.remove('hidden');
                btn.innerHTML = 'Join Room'; btn.disabled = false;
                isOnline = false;
            });
            }).catch(() => { btn.innerHTML = 'Join Room'; btn.disabled = false; showOnlineError('You need an internet connection to play online.'); });
        });


        // Dark mode toggle
        const themeToggle = $('theme-toggle');
        function toggleTheme() {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            try { localStorage.setItem('theme', next); } catch(e) {}
            themeToggle.textContent = next === 'dark' ? '☀️ Light' : '🌙 Dark';
            // Redraw win line with new theme color
            if (lastWinLine && state.gameOver) drawWinLine(lastWinLine);
        }

        let savedTheme = null;
        try { savedTheme = localStorage.getItem('theme'); } catch(e) {}
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = savedTheme || (systemDark ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', initialTheme);
        themeToggle.textContent = initialTheme === 'dark' ? '☀️ Light' : '🌙 Dark';

        themeToggle.addEventListener('click', toggleTheme);

    })();
