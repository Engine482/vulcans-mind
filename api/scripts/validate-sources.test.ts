import { describe, it, expect, beforeEach } from "vitest";
import { mkdtemp, writeFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { validate } from "./validate-sources.js";

const TOPICS_YAML = `topics:
  - id: rag_llm_chatbots
    name: RAG and chatbots
    priority: 1
    target_sources_min: 0
    target_sources_max: 5
    description: RAG topic.
    allowed_subtopics: []
    excluded_subtopics: []
  - id: ai_automation
    name: AI automation
    priority: 1
    target_sources_min: 0
    target_sources_max: 2
    description: Automation.
    allowed_subtopics: []
    excluded_subtopics: []
`;

const validApproved = [
  {
    id: "rag-foundational-2020",
    title: "Retrieval-Augmented Generation",
    authors: "Lewis et al.",
    year: 2020,
    topic: "rag_llm_chatbots",
    sourceType: "research_article",
    url: "https://arxiv.org/abs/2005.11401",
    language: "en",
    status: "approved",
    copyrightStatus: "open_access",
  },
];

async function makeKb(opts: {
  topics?: string;
  approved?: unknown;
  rejected?: unknown;
  deferred?: unknown;
  notes?: string[];
}): Promise<{ kb: string; notes: string }> {
  const root = await mkdtemp(join(tmpdir(), "vm-kb-"));
  const kb = root;
  const notesDir = join(kb, "notes/volodymyr_projects_context");
  await mkdir(notesDir, { recursive: true });
  await writeFile(join(kb, "topics.yaml"), opts.topics ?? TOPICS_YAML);
  await writeFile(join(kb, "sources.seed.json"), JSON.stringify(opts.approved ?? []));
  await writeFile(join(kb, "sources.rejected.json"), JSON.stringify(opts.rejected ?? []));
  await writeFile(join(kb, "sources.deferred.json"), JSON.stringify(opts.deferred ?? []));
  const noteNames = opts.notes ?? [
    "vulcans_mind_project_note.md",
    "lusterko_project_note.md",
    "imenuy_mene_project_note.md",
  ];
  for (const n of noteNames) await writeFile(join(notesDir, n), "# note\n");
  return { kb, notes: notesDir };
}

let toCleanup: string[] = [];
beforeEach(() => {
  toCleanup = [];
});

afterEach(async () => {
  for (const p of toCleanup) await rm(p, { recursive: true, force: true });
});

import { afterEach } from "vitest";

describe("validate-sources", () => {
  it("accepts a minimal valid KB", async () => {
    const { kb, notes } = await makeKb({ approved: validApproved });
    toCleanup.push(kb);
    const r = await validate(kb, notes);
    expect(r.ok).toBe(true);
    expect(r.errors).toHaveLength(0);
    expect(r.summary.approved).toBe(1);
  });

  it("flags duplicate ids across files", async () => {
    const dup = [
      { ...validApproved[0]!, status: "rejected", topic: "rag_llm_chatbots" },
    ];
    const { kb, notes } = await makeKb({ approved: validApproved, rejected: dup });
    toCleanup.push(kb);
    const r = await validate(kb, notes);
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => /duplicate source id/.test(e.message))).toBe(true);
  });

  it("flags status/file mismatch", async () => {
    const wrongStatus = [{ ...validApproved[0]!, status: "deferred" }];
    const { kb, notes } = await makeKb({ approved: wrongStatus });
    toCleanup.push(kb);
    const r = await validate(kb, notes);
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => /status="deferred" but is in sources.seed/.test(e.message))).toBe(
      true,
    );
  });

  it("flags unknown topic", async () => {
    const bad = [{ ...validApproved[0]!, topic: "nonexistent_topic" }];
    const { kb, notes } = await makeKb({ approved: bad });
    toCleanup.push(kb);
    const r = await validate(kb, notes);
    expect(r.errors.some((e) => /unknown topic "nonexistent_topic"/.test(e.message))).toBe(true);
  });

  it("flags duplicate DOI in approved set", async () => {
    const a1 = { ...validApproved[0]!, doi: "10.1000/x" };
    const a2 = {
      ...validApproved[0]!,
      id: "another-id",
      url: "https://example.com/2",
      doi: "10.1000/x",
    };
    const { kb, notes } = await makeKb({ approved: [a1, a2] });
    toCleanup.push(kb);
    const r = await validate(kb, notes);
    expect(r.errors.some((e) => /duplicate DOI in approved/.test(e.message))).toBe(true);
  });

  it("flags missing required project notes", async () => {
    const { kb, notes } = await makeKb({
      approved: validApproved,
      notes: ["vulcans_mind_project_note.md"],
    });
    toCleanup.push(kb);
    const r = await validate(kb, notes);
    expect(r.errors.some((e) => /lusterko_project_note.md/.test(e.message))).toBe(true);
    expect(r.errors.some((e) => /imenuy_mene_project_note.md/.test(e.message))).toBe(true);
  });

  it("rejects approved sources with restricted copyright", async () => {
    const bad = [{ ...validApproved[0]!, copyrightStatus: "restricted" }];
    const { kb, notes } = await makeKb({ approved: bad });
    toCleanup.push(kb);
    const r = await validate(kb, notes);
    expect(r.errors.some((e) => /copyrightStatus="restricted"/.test(e.message))).toBe(true);
  });

  it("flags topic count exceeding max", async () => {
    const many = [
      { ...validApproved[0]!, id: "src-1", url: "https://example.com/1" },
      { ...validApproved[0]!, id: "src-2", url: "https://example.com/2" },
      { ...validApproved[0]!, id: "src-3", url: "https://example.com/3" },
      { ...validApproved[0]!, id: "src-4", url: "https://example.com/4" },
      { ...validApproved[0]!, id: "src-5", url: "https://example.com/5" },
      { ...validApproved[0]!, id: "src-6", url: "https://example.com/6" },
    ];
    const { kb, notes } = await makeKb({ approved: many });
    toCleanup.push(kb);
    const r = await validate(kb, notes);
    expect(r.errors.some((e) => /> max 5/.test(e.message))).toBe(true);
  });
});
