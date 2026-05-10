# 03. Mobile Safari / iOS layout fixes — Vulcan’s Mind

## Мета

Виправити проблеми мобільного UX у Safari на iOS:

- zoom-in при фокусі на полі вводу;
- стрибки layout при відкритті клавіатури;
- неможливість нормально проскролити чат після кількох питань;
- overlay проблеми input bar / кнопки / нижньої панелі Safari.

Це P0, бо якщо користувач не може прочитати останню відповідь або інтерфейс стрибає, бот непридатний для демо.

## P0.1 — Забрати Safari zoom-in на input

### Причина

iOS Safari автоматично масштабує сторінку, якщо input/textarea має font-size менше 16px.

### Завдання

Переконатися, що всі interactive text inputs у чаті мають `font-size: 16px` або більше.

### Мінімальна CSS-вимога

```css
.vm-chat-input,
.vm-chat-input textarea,
.vm-chat-input input {
  font-size: 16px;
}
```

### Не робити без потреби

Не починати з жорсткого `user-scalable=no`, бо це погана accessibility-практика і може створити інші проблеми. Спочатку вирішити через font-size і layout.

## P0.2 — Використати сучасні viewport units

### Поточна типова проблема

`100vh` на iOS Safari часто працює погано, бо не враховує динамічні browser bars і клавіатуру.

### Завдання

Перевірити layout modal/chat container і замінити небезпечне використання `100vh` на `100dvh` / `100svh` / fallback.

### Рекомендований підхід

```css
.vm-chat-modal {
  height: 100dvh;
  max-height: 100dvh;
}

@supports not (height: 100dvh) {
  .vm-chat-modal {
    height: 100vh;
    max-height: 100vh;
  }
}
```

Якщо чат не full-screen, а bottom modal, все одно потрібно перевірити, що internal scroll area має коректну висоту з урахуванням header і input bar.

## P0.3 — Єдиний scroll container для повідомлень

### Проблема

Nested scroll + fixed input + body overflow lock часто ламають scroll в iOS Safari.

### Завдання

Переробити структуру так, щоб:

- modal container мав column layout;
- header не брав участі у scroll;
- messages area був єдиним scroll container;
- input bar був sticky/fixed всередині modal, а не поверх body;
- body scroll lock не ламав inner scroll.

### Рекомендована структура

```html
<div class="vm-chat-modal">
  <header class="vm-chat-header">...</header>
  <main class="vm-chat-messages">...</main>
  <form class="vm-chat-inputbar">...</form>
</div>
```

```css
.vm-chat-modal {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.vm-chat-header {
  flex: 0 0 auto;
}

.vm-chat-messages {
  flex: 1 1 auto;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}

.vm-chat-inputbar {
  flex: 0 0 auto;
}
```

## P0.4 — Scroll behavior після відповіді

### Завдання

Auto-scroll донизу має спрацьовувати тільки якщо користувач уже був близько до низу.

### Логіка

- Якщо користувач знаходиться біля останніх повідомлень — після нової відповіді scroll to bottom.
- Якщо користувач вручну скролить вгору — не стрибати вниз примусово.
- Після відправки нового повідомлення користувачем — scroll to bottom.

### Acceptance criteria

- Після 5–7 питань у Safari можна проскролити вгору і прочитати попередні відповіді.
- Під час генерації/появи відповіді чат не блокує scroll.
- Input bar не перекриває останній рядок відповіді.

## P0.5 — Safe area і нижня панель Safari

### Завдання

Додати коректну підтримку safe-area-inset-bottom.

### CSS-приклад

```css
.vm-chat-inputbar {
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
}
```

Якщо modal не full-screen, перевірити, що bottom padding не створює зайвий величезний відступ на desktop.

## P0.6 — Keyboard behavior

### Завдання

Перевірити поведінку при відкритій клавіатурі на iOS Safari:

- input залишається видимим;
- останнє повідомлення не перекривається;
- можна скролити messages area;
- layout не стрибає при кожному focus/blur.

### Тестові пристрої

Мінімум:

- iPhone Safari;
- iPhone Chrome, якщо доступно;
- Android Chrome;
- desktop responsive mode.

## P0.7 — Regression checklist

Після змін перевірити:

- відкриття чату;
- закриття чату;
- reset/new chat;
- відправку першого повідомлення;
- відправку кількох повідомлень поспіль;
- довге повідомлення асистента;
- scroll вгору після 5+ повідомлень;
- focus input при відкритій клавіатурі;
- повернення з клавіатури назад до перегляду чату.
