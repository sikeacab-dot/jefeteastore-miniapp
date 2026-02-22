const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const apiKey = (process.env.GROQ_API_KEY || '').trim();

// Load context from products
function getStoreContext() {
    try {
        const productsFile = path.join(__dirname, '..', 'products.js');
        if (fs.existsSync(productsFile)) {
            const content = fs.readFileSync(productsFile, 'utf8');
            const match = content.match(/=\s*(\[[\s\S]*\])/);
            if (match) {
                const products = JSON.parse(match[1]);
                return "Ассортимент Zen Tea: " + products.slice(0, 15).map(p => `${p.name} (${p.price}грн)`).join(', ');
            }
        }
    } catch (e) { console.log('Context error'); }
    return "Магазин чая Zen Tea";
}

const context = getStoreContext();

app.post('/api/chat', async (req, res) => {
    try {
        const { message, history } = req.body;
        console.log(`User: ${message}`);

        // Prepare messages for Groq (System + History + New Message)
        const messages = [
            {
                role: "system",
                content: `Ти — персональний чайний консультант преміального магазину "JEFE TEASTORE".
                
                ТВОЯ МЕТА: Допомогти гостю обрати ідеальний чай та пояснити, як зробити замовлення.

                ПРАВИЛА ТА ОБМЕЖЕННЯ:
                1. ТІЛЬКИ ЧАЙ: Обговорюй лише чай. Ніколи не пропонуй солодощі, посуд чи інші товари, яких немає в нашому каталозі.
                2. ЦІНИ: Називай ціну товару ТІЛЬКИ якщо клієнт прямо запитав "Скільки коштує?" або "Яка ціна?". В інших випадках просто описуй смак та ефект.
                3. ЗАМОВЛЕННЯ: Ти НЕ оформлюєш замовлення. Завжди направляй клієнта до каталогу: "Ви можете знайти цей чай у нашому каталозі вище та натиснути кнопку 'Купити'".

                ПЛАН СПІЛКУВАННЯ:
                1. Привітання: Запитай про вподобання (енергія чи релакс).
                2. Консультація: Запропонуй 1-2 позиції з нашого списку. Поясни смак.
                3. Заклик до дії: Запитай, чи хоче клієнт спробувати цей сорт у нашому меню.
                
                МОВА: Чиста УКРАЇНСЬКА. Лаконічно (2-3 речення). Тільки кирилиця.

                НАШ АКТУАЛЬНИЙ КАТАЛОГ:
                ${context}`
            },
            ...(history || []),
            { role: "user", content: message }
        ];

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: messages,
                temperature: 0, // Робимо відповіді максимально точними і не випадковими
                top_p: 1,
                max_tokens: 500
            })
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        const reply = data.choices[0].message.content;
        console.log(`AI: ${reply.substring(0, 50)}...`);
        res.json({ reply });
    } catch (error) {
        console.error('Groq Error:', error.message);
        res.status(500).json({ error: "AI Error: " + error.message });
    }
});

app.listen(3001, () => {
    console.log('====================================');
    console.log('GROQ AI SERVER ACTIVE ON PORT 3001');
    console.log('====================================');
});
