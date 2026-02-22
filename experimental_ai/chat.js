const Chat = {
    init() {
        const h = document.createElement('div');
        h.innerHTML = `
            <div class="chat-widget">
                <button class="chat-btn" onclick="Chat.toggle()">🍃</button>
                <div class="chat-win" id="chatWin">
                    <div class="chat-head">Чайний помічник <span style="cursor:pointer" onclick="Chat.toggle()">×</span></div>
                    <div class="chat-msgs" id="chatMsgs"><div class="msg bot">Привіт! Чим можу допомогти?</div></div>
                    <div class="chat-in">
                        <input type="text" id="chatInput" placeholder="Пишіть сюди..." onkeypress="if(event.key==='Enter') Chat.send()">
                        <button onclick="Chat.send()">></button>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(h);
        console.log('AI Chat Assistant Initialized');
    },
    toggle() {
        const w = document.getElementById('chatWin');
        w.classList.toggle('show');
    },
    history: [],
    async send() {
        const i = document.getElementById('chatInput');
        const m = i.value.trim();
        if (!m) return;

        this.add(m, 'user');
        i.value = '';

        try {
            const r = await fetch('http://localhost:3001/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: m,
                    history: this.history
                })
            });
            const d = await r.json();
            if (d.reply) {
                this.add(d.reply, 'bot');
                // Update history
                this.history.push({ role: 'user', content: m });
                this.history.push({ role: 'assistant', content: d.reply });
            } else {
                this.add('Сервер ответил ошибкой: ' + (d.error || 'неизвестно'), 'bot');
            }
        } catch (e) {
            this.add('Ошибка соединения (проверьте, запущен ли сервер)', 'bot');
        }
    },
    add(t, r) {
        const c = document.getElementById('chatMsgs');
        const d = document.createElement('div');
        d.className = `msg ${r}`;
        d.textContent = t;
        c.appendChild(d);
        c.scrollTop = c.scrollHeight;
    }
};
document.addEventListener('DOMContentLoaded', () => Chat.init());
