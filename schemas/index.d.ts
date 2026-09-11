import { z } from "zod";

export declare const ExperienceTypeEnum: z.ZodEnum<[
  "full-time",
  "part-time",
  "contract",
  "independent",
  "internship"
]>;

export declare const ExperienceItemSchema: z.ZodObject<{
  id: z.ZodString;
  title: z.ZodString;
  organization: z.ZodString;
  dates: z.ZodString;
  type: typeof ExperienceTypeEnum;
  label: z.ZodOptional<z.ZodString>;
  intro: z.ZodOptional<z.ZodString>;
  minBullets: z.ZodOptional<z.ZodNumber>;
  bullets: z.ZodArray<z.ZodString>;
}>;

export declare const ProjectItemSchema: z.ZodObject<{
  id: z.ZodString;
  title: z.ZodString;
  type: z.ZodOptional<z.ZodString>;
  label: z.ZodOptional<z.ZodString>;
  intro: z.ZodOptional<z.ZodString>;
  bullets: z.ZodArray<z.ZodString>;
}>;

export declare const configSchema: z.ZodObject<any>;

export declare function validateConfig(config: unknown, isStrict?: boolean): Record<string, unknown>;
