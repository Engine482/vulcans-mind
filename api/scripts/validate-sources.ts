import { readFile, access } from "node:fs/promises";
import { dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import {
  SourcesFileSchema,
  TopicsFileSchema,
  type Source,
  type Topic,
} from "../src/kb/schema.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const KB_DIR = resolve(__dirname, "../../knowledge");
const NOTES_DIR = resolve(KB_DIR, "notes/volodymyr_projects_context");
const REQUIRED_NOTES = [
  "vulcans_mind_project_note.md",
  "lusterko_project_note.md",
  "imenuy_mene_project_note.md",
];

type Issue = { file: string; level: "error" | "warn"; message: string };

async function loadJson<T>(path: string): Promise<T> {
  const raw = await readFile(path, "utf8");
  return JSON.parse(raw) as T;
}

async function loadYaml<T>(path: string): Promise<T> {
  const raw = await readFile(path, "utf8");
  return parseYaml(raw) as T;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export type ValidationReport = {
  ok: boolean;
  errors: Issue[];
  warnings: Issue[];
  summary: {
    topics: number;
    approved: number;
    rejected: number;
    deferred: number;
    perTopic: Record<string, number>;
  };
};

export async function validate(kbDir = KB_DIR, notesDir = NOTES_DIR): Promise<ValidationReport> {
  const issues: Issue[] = [];
  const push = (level: "error" | "warn", file: string, message: string): void => {
    issues.push({ file: relative(kbDir, file), level, message });
  };

  // 1. topics.yaml
  const topicsPath = resolve(kbDir, "topics.yaml");
  let topics: Topic[] = [];
  try {
    const parsed = TopicsFileSchema.parse(await loadYaml(topicsPath));
    topics = parsed.topics;
  } catch (err) {
    push("error", topicsPath, `topics.yaml invalid: ${asMsg(err)}`);
  }
  const topicIds = new Set(topics.map((t) => t.id));

  // 2. source files: status must match the file name
  const fileToStatus: Record<string, "approved" | "rejected" | "deferred"> = {
    "sources.seed.json": "approved",
    "sources.rejected.json": "rejected",
    "sources.deferred.json": "deferred",
  };

  const allSources: Source[] = [];
  const seenIds = new Set<string>();
  const seenDoi = new Set<string>();
  const seenUrl = new Set<string>();

  for (const [fname, expectedStatus] of Object.entries(fileToStatus)) {
    const path = resolve(kbDir, fname);
    if (!(await fileExists(path))) {
      push("error", path, `${fname} missing`);
      continue;
    }
    let parsed: Source[] = [];
    try {
      parsed = SourcesFileSchema.parse(await loadJson(path));
    } catch (err) {
      push("error", path, `parse failed: ${asMsg(err)}`);
      continue;
    }
    for (const s of parsed) {
      if (seenIds.has(s.id)) {
        push("error", path, `duplicate source id: ${s.id}`);
      } else {
        seenIds.add(s.id);
      }
      if (s.status !== expectedStatus) {
        push("error", path, `source ${s.id} has status="${s.status}" but is in ${fname}`);
      }
      if (s.topic !== "out_of_scope" && !topicIds.has(s.topic)) {
        push("error", path, `source ${s.id} references unknown topic "${s.topic}"`);
      }
      if (s.status === "approved") {
        if (s.doi) {
          if (seenDoi.has(s.doi)) push("error", path, `duplicate DOI in approved: ${s.doi}`);
          else seenDoi.add(s.doi);
        }
        if (s.url) {
          if (seenUrl.has(s.url)) push("error", path, `duplicate URL in approved: ${s.url}`);
          else seenUrl.add(s.url);
        }
        if (s.copyrightStatus === "restricted") {
          push(
            "error",
            path,
            `approved source ${s.id} has copyrightStatus="restricted"; must be deferred or rejected`,
          );
        }
      }
      allSources.push(s);
    }
  }

  // 3. Required project notes
  for (const note of REQUIRED_NOTES) {
    const p = resolve(notesDir, note);
    if (!(await fileExists(p))) {
      push("error", p, `required project note missing: ${note}`);
    }
  }

  // 4. Per-topic counts (warnings, not errors — KB is built up over sprints)
  const approved = allSources.filter((s) => s.status === "approved");
  const perTopic: Record<string, number> = {};
  for (const t of topics) perTopic[t.id] = 0;
  for (const s of approved) {
    if (perTopic[s.topic] !== undefined) perTopic[s.topic] = (perTopic[s.topic] ?? 0) + 1;
  }
  for (const t of topics) {
    const n = perTopic[t.id] ?? 0;
    if (n < t.target_sources_min) {
      push(
        "warn",
        topicsPath,
        `topic "${t.id}": ${n} approved < min ${t.target_sources_min}`,
      );
    } else if (n > t.target_sources_max) {
      push(
        "error",
        topicsPath,
        `topic "${t.id}": ${n} approved > max ${t.target_sources_max}`,
      );
    }
  }

  // 5. Global cap (P0 says max 60)
  const GLOBAL_MAX = 60;
  if (approved.length > GLOBAL_MAX) {
    push("error", topicsPath, `total approved sources ${approved.length} > P0 cap ${GLOBAL_MAX}`);
  }

  const errors = issues.filter((i) => i.level === "error");
  const warnings = issues.filter((i) => i.level === "warn");
  return {
    ok: errors.length === 0,
    errors,
    warnings,
    summary: {
      topics: topics.length,
      approved: approved.length,
      rejected: allSources.filter((s) => s.status === "rejected").length,
      deferred: allSources.filter((s) => s.status === "deferred").length,
      perTopic,
    },
  };
}

function asMsg(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function format(report: ValidationReport): string {
  const lines: string[] = [];
  const { summary } = report;
  lines.push(
    `topics=${summary.topics} approved=${summary.approved} rejected=${summary.rejected} deferred=${summary.deferred}`,
  );
  for (const [topic, n] of Object.entries(summary.perTopic)) {
    lines.push(`  - ${topic}: ${n}`);
  }
  for (const w of report.warnings) lines.push(`WARN  ${w.file}: ${w.message}`);
  for (const e of report.errors) lines.push(`ERROR ${e.file}: ${e.message}`);
  lines.push(report.ok ? "OK" : `FAIL (${report.errors.length} errors)`);
  return lines.join("\n");
}

const isDirectInvocation = process.argv[1] === fileURLToPath(import.meta.url);
if (isDirectInvocation) {
  validate()
    .then((report) => {
      console.warn(format(report));
      process.exit(report.ok ? 0 : 1);
    })
    .catch((err) => {
      console.error(`[validate-sources] failed: ${asMsg(err)}`);
      process.exit(2);
    });
}
