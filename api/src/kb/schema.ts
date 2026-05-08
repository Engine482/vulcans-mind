import { z } from "zod";

export const TopicSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9_]*$/),
  name: z.string().min(1),
  priority: z.number().int().min(1).max(5),
  target_sources_min: z.number().int().nonnegative(),
  target_sources_max: z.number().int().positive(),
  description: z.string().min(1),
  allowed_subtopics: z.array(z.string()).default([]),
  excluded_subtopics: z.array(z.string()).default([]),
});
export type Topic = z.infer<typeof TopicSchema>;

export const TopicsFileSchema = z.object({
  topics: z.array(TopicSchema).min(1),
});

export const SOURCE_TYPES = [
  "research_article",
  "systematic_review",
  "meta_analysis",
  "guideline",
  "official_documentation",
  "book_chapter",
  "preprint",
  "review",
  "white_paper",
  "project_note",
  "open_dataset",
  "open_textbook",
] as const;

export const SOURCE_STATUSES = ["approved", "rejected", "deferred"] as const;

export const COPYRIGHT_STATUSES = [
  "open_access",
  "permissive_license",
  "metadata_only",
  "abstract_only",
  "owned_by_author",
  "fair_use_excerpt",
  "restricted",
] as const;

export const SourceSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9][a-z0-9_-]{2,80}$/, {
      message: "id must be lowercase slug 3–81 chars: [a-z0-9_-]",
    }),
    title: z.string().min(3).max(500),
    authors: z.string().min(1).max(500).optional(),
    year: z.number().int().min(1900).max(2100).optional(),
    topic: z.string().min(1),
    sourceType: z.enum(SOURCE_TYPES),
    url: z.string().url().optional(),
    doi: z
      .string()
      .regex(/^10\.\d{4,9}\/\S+$/, { message: "doi must look like 10.xxxx/yyyy" })
      .optional(),
    abstract: z.string().max(4000).optional(),
    summary: z.string().max(4000).optional(),
    publisher: z.string().max(200).optional(),
    language: z.string().min(2).max(10).default("en"),
    status: z.enum(SOURCE_STATUSES),
    relevanceScore: z.number().min(0).max(1).optional(),
    qualityNotes: z.string().max(1000).optional(),
    copyrightStatus: z.enum(COPYRIGHT_STATUSES),
  })
  .refine((s) => s.url !== undefined || s.doi !== undefined || s.sourceType === "project_note", {
    message: "either url or doi is required (except for project_note)",
    path: ["url"],
  });

export type Source = z.infer<typeof SourceSchema>;

export const SourcesFileSchema = z.array(SourceSchema);
