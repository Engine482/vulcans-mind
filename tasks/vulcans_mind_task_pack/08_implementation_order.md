# 08. Recommended implementation order — Vulcan’s Mind

## Принцип

Спершу виправити те, що найбільше псує демо: мобільний UX, input, sources UI, welcome, неправильна відповідь про проєкти. Потім — покращувати intelligence layer.

Не починати з повного streaming, model routing або великої RAG-міграції, якщо це затягує спринт.

## Phase 1 — UI/UX стабілізація, P0

### 1. Input bar

- Замінити кнопку «Надіслати» на іконку.
- Прибрати постійний лічильник `0/1500`.
- Додати near-limit indicator.
- Переконатися, що input має font-size ≥ 16px.

### 2. Header

- Замінити trash icon на reset/history icon.
- Додати правильний aria-label / tooltip.

### 3. Sources UI

- Повністю приховати блок «ДЖЕРЕЛА».
- Не показувати source cards.
- Не показувати broken project note links.

### 4. Welcome + examples

- Оновити welcome message.
- Додати короткий disclaimer.
- Зробити seed list прикладів питань.
- Показувати тільки 3 випадкові приклади.
- Прибирати приклади після першого user message.

## Phase 2 — Mobile Safari fixes, P0

### 1. Layout structure

- Перевірити modal/chat container.
- Забезпечити єдиний messages scroll container.
- Header і input bar мають бути поза scroll або правильно sticky всередині modal.

### 2. Viewport units

- Замінити проблемне `100vh` на `100dvh` із fallback.
- Перевірити safe-area-inset-bottom.

### 3. Scroll logic

- Auto-scroll тільки якщо користувач near bottom.
- Після user send — scroll to bottom.
- Якщо користувач читає старі повідомлення — не примушувати scroll вниз.

### 4. Manual QA

- iPhone Safari.
- Desktop responsive.
- Android Chrome, якщо доступний.

## Phase 3 — Correctness / knowledge fixes, P0-P1

### 1. Canonical project/profile doc

Створити або оновити:

```text
vulcan_profile_and_projects.md
```

Мінімально включити:

- хто такий Володимир «Вулкан» Моторний у публічному контексті;
- «Люстерко»;
- Vulcan’s Mind;
- за рішенням — «Іменуй мене»;
- підтримувані теми;
- межі відповідей.

### 2. Виправити питання про проєкти

Перевірити, що запити:

```text
Над якими проєктами працює Вулкан?
Які проєкти у Володимира?
Що робить Вулкан?
```

дають правильну відповідь, а не out-of-scope.

### 3. Prompt rewrite

Оновити system/behavior prompt згідно з `05_intelligence_rag_tasks.md`.

## Phase 4 — Conversation polish, P1

### 1. Typing indicator

- Додати typing indicator.
- Прибрати текст «Шукаю в базі джерел…».

### 2. Fake streaming/typewriter

- Реалізувати chunk-based typewriter.
- Обмежити максимальну тривалість анімації.
- Переконатися, що reset/error зупиняють анімацію.

### 3. Fallback variants

- Додати варіативні fallback templates.
- Розділити generic out-of-scope, medical, personal unknown, news/current events, technical adjacent.

## Phase 5 — RAG expansion, P1

### 1. Curated docs

Додати/оновити власні нотатки:

```text
lusterko_public_project_note.md
vulcans_mind_public_project_note.md
ai_rag_design_note.md
military_context_digital_tools_note.md
mental_health_boundaries_note.md
```

### 2. Research summaries

Для ключових статей додати abstracts + structured summaries.

### 3. Golden answers

Додати `golden_answers.yaml/json` або еквівалент.

## Phase 6 — Config / future-proofing, P1-P2

### 1. Model env vars

Винести назви моделей у env vars:

```env
VM_DEFAULT_MODEL=...
VM_FALLBACK_MODEL=...
VM_EMBEDDING_MODEL=...
```

### 2. Не реалізовувати зараз без потреби

Не робити в цьому спринті, якщо це затягує роботу:

- справжній SSE streaming;
- складний model routing;
- повноцінні inline citations;
- ingestion повних PDF;
- темну/світлу theme switcher систему.

## Definition of Done

Спринт можна вважати завершеним, якщо:

1. На iPhone Safari чат не zoom-in при input focus.
2. Можна нормально скролити історію після кількох повідомлень.
3. Sources UI більше не відволікає.
4. Welcome і приклади питань виглядають живіше.
5. На питання про проєкти бот відповідає коректно.
6. Out-of-scope fallback не виглядає дешево.
7. Є typing indicator і fake streaming/typewriter.
8. Загальне враження: це вже не сирий віджет, а презентаційний AI-чат на особистому сайті.
