# 06. Typing indicator and fake streaming/typewriter — Vulcan’s Mind

## Мета

Покращити відчуття якості відповіді без складного реального streaming на цьому етапі.

Поточна поведінка «шукаю в базі джерел» → пауза → миттєво весь текст виглядає дешево. Потрібно зробити відчуття живого діалогу.

## Обране рішення

На цьому етапі реалізувати:

1. typing indicator під час очікування відповіді від backend;
2. fake streaming / typewriter effect після отримання готової відповіді.

Справжній SSE streaming залишити на майбутній P2, якщо не буде дуже просто реалізувати без ризику для стабільності.

## P1.1 — Typing indicator

### Завдання

Після відправки повідомлення користувачем показати assistant typing state.

### Варіанти тексту

Перевага: без тексту, тільки animated dots у стилі assistant bubble.

Якщо потрібен текст:

```text
Vulcan’s Mind думає…
```

Не використовувати:

```text
Шукаю в базі джерел...
```

бо це звучить технічно і підкреслює внутрішню механіку.

### Поведінка

- User надсилає повідомлення.
- Send button переходить у disabled/loading state.
- У messages area зʼявляється assistant typing bubble.
- Коли відповідь отримана — typing bubble замінюється на typewriter-rendered відповідь.

## P1.2 — Typewriter effect

### Завдання

Показувати відповідь поступово, ніби вона генерується.

### Вимоги

- Не надто повільно.
- Не блокувати scroll.
- Не ламати markdown rendering.
- Не змушувати користувача чекати довгу відповідь занадто довго.

### Рекомендована швидкість

- 30–60 символів/сек для коротких відповідей;
- швидше для довгих відповідей;
- або chunk-based reveal по словах/фразах.

### Практичний варіант

Для простоти можна показувати відповідь частинами по 3–8 слів.

Pseudo-logic:

```js
const words = answer.split(' ')
let index = 0
const interval = setInterval(() => {
  index += getChunkSize(answer.length)
  setVisibleText(words.slice(0, index).join(' '))
  if (index >= words.length) clearInterval(interval)
}, 40)
```

### Для довгих відповідей

Якщо відповідь дуже довга, не розтягувати анімацію надовго. Можна:

- прискорювати reveal;
- показувати перший абзац поступово, решту швидше;
- мати max animation duration 4–6 секунд.

## P1.3 — Markdown rendering

### Потенційна проблема

Якщо typewriter рендерить markdown посимвольно, можуть тимчасово ламатися списки, bold, links.

### Рішення

Бажано reveal не посимвольно, а chunk-based:

- по словах;
- по реченнях;
- або по markdown-safe chunks.

Якщо це складно, на першому етапі допустимо:

- typewriter для plain text;
- після завершення — render markdown повністю.

## P1.4 — Cancel / reset behavior

### Завдання

Переконатися, що reset/new chat зупиняє typing/typewriter.

### Acceptance criteria

- Якщо користувач натискає reset під час typing — інтервал/таймер очищується.
- Якщо приходить нова відповідь — не продовжує друкуватися стара.
- Якщо request падає з error — typing indicator зникає і показується error state.

## P1.5 — Scroll behavior із typewriter

### Вимоги

- Якщо користувач біля низу — під час typewriter чат плавно тримається внизу.
- Якщо користувач скролить вгору — не примушувати його назад донизу.
- Typewriter не має створювати Safari scroll bug.

## P2 — Real streaming

Залишити як майбутнє завдання.

### Потенційна реалізація

- SSE endpoint на backend;
- frontend EventSource або fetch streaming;
- progressive markdown rendering;
- proper cancellation;
- fallback до non-streaming відповіді при помилці.

### Не робити зараз

Не переписувати архітектуру заради streaming, якщо це ризикує зламати стабільність демо.
