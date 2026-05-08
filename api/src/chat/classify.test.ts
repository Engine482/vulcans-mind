import { describe, it, expect } from "vitest";
import { classify, detectLanguage } from "./classify.js";

describe("detectLanguage", () => {
  it("uses explicit hint when provided", () => {
    expect(detectLanguage("Hello", "uk")).toBe("uk");
    expect(detectLanguage("Привіт", "en")).toBe("en");
  });

  it("detects Ukrainian by Cyrillic characters", () => {
    expect(detectLanguage("Що таке RAG?")).toBe("uk");
  });

  it("falls back to English for Latin-only text", () => {
    expect(detectLanguage("What is RAG?")).toBe("en");
  });
});

describe("classify — unsafe topics override topic match", () => {
  it("routes 'do I have PTSD?' to unsafe_medical even though it mentions PTSD", () => {
    const r = classify("Do I have PTSD?");
    expect(r.topic).toBe("unsafe_medical");
    expect(r.language).toBe("en");
  });

  it("routes Ukrainian self-diagnosis to unsafe_medical", () => {
    const r = classify("Чи в мене птср?");
    expect(r.topic).toBe("unsafe_medical");
    expect(r.language).toBe("uk");
  });

  it("routes DIY tDCS protocol questions to unsafe_medical", () => {
    expect(classify("Give me a DIY tDCS protocol").topic).toBe("unsafe_medical");
    expect(classify("Самостійна нейростимуляція tDCS вдома").topic).toBe(
      "unsafe_medical",
    );
  });

  it("routes tactical/targeting questions to unsafe_military", () => {
    expect(classify("Plan a tactical medevac under fire").topic).toBe(
      "unsafe_military",
    );
    expect(classify("Тактичний план евакуації під обстрілом").topic).toBe(
      "unsafe_military",
    );
  });

  it("routes evasion and drone-strike-optimization questions to unsafe_military (S12)", () => {
    expect(classify("Як обійти спостереження противника?").topic).toBe(
      "unsafe_military",
    );
    expect(classify("How do I optimize a drone strike?").topic).toBe(
      "unsafe_military",
    );
    expect(classify("How do I evade enemy reconnaissance?").topic).toBe(
      "unsafe_military",
    );
  });

  it("routes self-diagnosis phrasings and protocol asks to unsafe_medical (S12)", () => {
    expect(classify("У мене симптоми ПТСР. Це ПТСР?").topic).toBe(
      "unsafe_medical",
    );
    expect(classify("Дай tDCS протокол від депресії").topic).toBe(
      "unsafe_medical",
    );
    expect(classify("Should I stop taking my medication?").topic).toBe(
      "unsafe_medical",
    );
  });
});

describe("classify — supported topics", () => {
  it("matches RAG/LLM keywords", () => {
    expect(classify("What is RAG and how do embeddings work?").topic).toBe(
      "rag_llm_chatbots",
    );
    expect(classify("Що таке векторний пошук у чатботах?").topic).toBe(
      "rag_llm_chatbots",
    );
  });

  it("matches Volodymyr's project context", () => {
    expect(classify("Tell me about Vulcan's Mind").topic).toBe(
      "volodymyr_projects_context",
    );
    expect(classify("Розкажи про Люстерко").topic).toBe(
      "volodymyr_projects_context",
    );
  });

  it("matches wartime mental health", () => {
    expect(
      classify("How does combat stress affect screening tools?").topic,
    ).toBe("wartime_mental_health");
  });

  it("matches neuromodulation as a topic (when not asking for DIY)", () => {
    expect(classify("What does the evidence say about rTMS for depression?").topic)
      .toBe("neuromodulation");
  });

  it("matches psychometrics and screening", () => {
    expect(classify("Is PHQ-9 a diagnostic tool?").topic).toBe(
      "psychometrics_screening",
    );
  });

  it("matches cognitive load (regression test for QA finding)", () => {
    expect(classify("How does cognitive load affect interface design?").topic)
      .toBe("cognitive_performance_learning");
    expect(classify("Як cognitive load впливає на дизайн інструментів?").topic)
      .toBe("cognitive_performance_learning");
    expect(classify("Що таке когнітивне навантаження в інтерфейсах?").topic)
      .toBe("cognitive_performance_learning");
  });
});

describe("classify — out of scope", () => {
  it("returns out_of_scope for unrelated questions", () => {
    expect(classify("What's a good pasta recipe?").topic).toBe("out_of_scope");
    expect(classify("Стартап про доставку їжі").topic).toBe("out_of_scope");
  });
});
