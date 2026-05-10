# Vulcan’s Mind — пакет задач для доведення чат-бота до презентаційної версії

## Мета пакета

Довести поточну версію Vulcan’s Mind до стану, придатного для показу на `motornyi.com`: прибрати сирість інтерфейсу, стабілізувати мобільну поведінку, зробити відповіді живішими, покращити базу знань і підготувати архітектуру до подальшого розвитку без зайвого переписування.

## Ключове продуктове рішення

Не копіювати ChatGPT iOS один-в-один. Взяти патерн чистого conversational UI: нейтральна сіра/асфальтова тема, мінімум декоративного шуму, компактний input bar, чітка ієрархія повідомлень, нормальна поведінка на iOS Safari.

## Пріоритети

### P0 — критично для демо

1. Переробити візуальний стиль у нейтральну сіру/асфальтову тему.
2. Виправити input bar: іконка відправки замість тексту, прибрати постійний лічильник символів.
3. Виправити iOS Safari zoom/keyboard/scroll баги.
4. Прибрати великий блок джерел із UI.
5. Переписати welcome message і приклади питань.
6. Показувати тільки 3 випадкові приклади питань до першого повідомлення.
7. Виправити відповідь на питання про проєкти Вулкана.
8. Замінити fallback для out-of-scope питань на живіший і варіативний.

### P1 — якість відповідей

1. Переписати system prompt / behavior prompt.
2. Додати canonical knowledge documents про Володимира, «Люстерко», Vulcan’s Mind і, за потреби, «Іменуй мене».
3. Додати curated RAG documents: власні нотатки, abstracts, структуровані summaries.
4. Додати synthetic QA / golden answers.
5. Додати fake streaming/typewriter + typing indicator.

### P2 — подальше покращення

1. Справжній streaming через SSE або інший стабільний механізм.
2. Inline citations у тексті відповідей.
3. Model routing/fallback.
4. Темна тема, якщо не буде реалізована одразу.
5. Аналітика питань, де бот не впорався.

## Склад пакета

- `01_product_decisions.md` — зафіксовані продуктові рішення.
- `02_ui_design_tasks.md` — дизайн і компоненти інтерфейсу.
- `03_mobile_safari_fix_tasks.md` — iOS Safari, клавіатура, zoom, scroll.
- `04_conversation_ux_tasks.md` — welcome, приклади питань, input, fallback, джерела.
- `05_intelligence_rag_tasks.md` — RAG, canonical docs, synthetic QA, prompt.
- `06_streaming_tasks.md` — typing indicator і fake streaming/typewriter.
- `07_acceptance_checklist.md` — фінальний чекліст приймання.
- `08_implementation_order.md` — рекомендований порядок виконання.
