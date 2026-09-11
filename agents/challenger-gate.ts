import * as fs from 'node:fs';
import type { ATSGateResult } from '../src/enhancements/types.js' with { 'resolution-mode': 'import' };

export type GateResult = ATSGateResult;

export const STOP_WORDS = new Set([
  // General English stop words
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'need', 'must', 'we', 'you',
  'they', 'our', 'your', 'this', 'that', 'these', 'those', 'it', 'its',
  'from', 'as', 'into', 'through', 'during', 'about', 'against', 'between',
  'across', 'than', 'more', 'such', 'other', 'some',
  // Corporate & JD filler words (low signal)
  'experience', 'proven', 'track', 'record', 'ability', 'skills', 'strong',
  'working', 'work', 'knowledge', 'environment', 'role', 'team', 'years',
  'candidate', 'looking', 'responsible', 'responsibilities', 'requirements',
  'qualification', 'qualifications', 'opportunity', 'seeking', 'preferred',
  'required', 'successful', 'degree', 'bachelor', 'master', 'field', 'related',
  'overview', 'job', 'description', 'ideal', 'join', 'joining', 'company',
  'platform', 'business', 'system', 'systems', 'solution', 'solutions',
  'expert', 'experts', 'senior', 'junior', 'lead', 'principal', 'head', 'manager',
  'director', 'needed', 'needs', 'building', 'build', 'help', 'drive',
]);

export const SHORT_TECH_TERMS = new Set([
  'ai', 'ml', 'bi', 'ui', 'ux', 'db', 'r', 'c#', 'go', 'qa', 'ci', 'cd',
]);

export const MULTI_WORD_TERMS = [
  'machine learning', 'data science', 'deep learning', 'natural language processing',
  'computer vision', 'data engineering', 'data analytics', 'business intelligence',
  'predictive modeling', 'statistical analysis', 'a/b testing', 'power bi',
  'data visualization', 'data warehousing', 'etl pipelines', 'data modeling',
  'generative ai', 'prompt engineering', 'agentic ai', 'large language models',
  'cloud finops', 'product management', 'project management', 'supply chain',
  'demand planning', 'revenue operations', 'growth strategy', 'operations strategy',
  'cross functional', 'stakeholder management', 'board reporting', 'regulatory reporting',
  'cost optimization', 'process automation', 'scale enterprise', 'time series',
  'rest api', 'sql server', 'azure openai',
];

/**
 * Recursively extract leaf string values from an object, ignoring JSON key names.
 */
export function extractLeafText(obj: unknown): string {
  if (typeof obj === 'string') return obj;
  if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
  if (Array.isArray(obj)) return obj.map(extractLeafText).join(' ');
  if (obj !== null && typeof obj === 'object') {
    return Object.values(obj).map(extractLeafText).join(' ');
  }
  return '';
}

export class ChallengerGate {
  /**
   * Extract multi-word terms and single-word keywords from JD text, excluding stop words.
   * Supports 2-letter technical terms (AI, ML, BI, R, DB, Go).
   */
  extractJdKeywords(jdText: string): string[] {
    const normalized = jdText.toLowerCase().replace(/-/g, ' ');
    const keywords: string[] = [];

    // 1. Extract multi-word terms
    for (const term of MULTI_WORD_TERMS) {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (regex.test(normalized) || normalized.includes(term)) {
        if (!keywords.includes(term)) {
          keywords.push(term);
        }
      }
    }

    // Mask extracted multi-word terms to avoid double-counting single words
    let maskedText = normalized;
    for (const term of keywords) {
      maskedText = maskedText.replaceAll(term, ' ');
    }

    // 2. Extract single words
    const words = maskedText.match(/[a-z0-9+#.]+/g) ?? [];
    for (let word of words) {
      word = word.replace(/^[.,;:!?()"\']+|[.,;:!?()"\']+$|^\.+|\.+$|^\++|\++$/g, '');
      if (!word) continue;

      const isShortTech = SHORT_TECH_TERMS.has(word);
      const isLongEnough = word.length >= 3;
      const isNotStopWord = !STOP_WORDS.has(word);

      if ((isLongEnough || isShortTech) && isNotStopWord && !keywords.includes(word)) {
        keywords.push(word);
      }
    }

    return [...new Set(keywords)];
  }

  /**
   * Calculate keyword coverage ratio against text content.
   */
  calculateKeywordCoverage(jdKeywords: string[], configText: string): number {
    if (jdKeywords.length === 0) return 0;
    const lowerConfig = configText.toLowerCase().replace(/-/g, ' ');
    let matched = 0;

    for (const keyword of jdKeywords) {
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (regex.test(lowerConfig) || lowerConfig.includes(keyword.toLowerCase())) {
        matched++;
      }
    }

    return matched / jdKeywords.length;
  }

  /**
   * Assess composite ATS score based on 60% keywords + 20% metric density (target 10) + 20% bold metric density (target 6).
   */
  assessGateScore(
    keywordCoverage: number,
    totalMetrics: number,
    boldMetrics: number
  ): ATSGateResult {
    const keywordScore = keywordCoverage * 60;
    const metricDensityScore = Math.min(totalMetrics / 10, 1) * 20;
    const boldMetricDensityScore = Math.min(boldMetrics / 6, 1) * 20;
    const atsEstimate = Math.round(keywordScore + metricDensityScore + boldMetricDensityScore);
    const pass = atsEstimate >= 85;

    const suggestions: string[] = [];
    if (!pass) {
      suggestions.push(`ATS estimate ${atsEstimate}% is below 85% threshold.`);
      if (keywordCoverage < 0.85) {
        suggestions.push('Low keyword coverage. Integrate missing JD keywords into WHY_I_FIT and ROLE_PILLARS.');
      }
      if (totalMetrics < 10) {
        suggestions.push(`Low metric density (${totalMetrics}/10 target metrics). Add quantifiable achievements from proof bank.`);
      }
      if (boldMetrics < 6) {
        suggestions.push(`Low bold metric count (${boldMetrics}/6 target bold metrics). Enclose major numbers in **bold** asterisks.`);
      }
    }

    return {
      pass,
      atsEstimate,
      keywordCoverage: Number(keywordCoverage.toFixed(3)),
      missingKeywords: [],
      suggestions,
      metricDensityScore: Number(metricDensityScore.toFixed(1)),
      boldMetricDensityScore: Number(boldMetricDensityScore.toFixed(1)),
    };
  }

  /**
   * Evaluate config input (file path string or parsed object) against JD text.
   */
  evaluateConfig(
    configInput: string | Record<string, unknown>,
    jdText: string
  ): ATSGateResult {
    let configObj: Record<string, unknown>;

    if (typeof configInput === 'string') {
      if (!fs.existsSync(configInput)) {
        return {
          pass: false,
          atsEstimate: 0,
          keywordCoverage: 0,
          missingKeywords: [],
          suggestions: [`Config file not found at path: ${configInput}`],
          metricDensityScore: 0,
          boldMetricDensityScore: 0,
        };
      }
      const raw = fs.readFileSync(configInput, 'utf-8');
      configObj = JSON.parse(raw) as Record<string, unknown>;
    } else {
      configObj = configInput;
    }

    const contentText = extractLeafText(configObj);
    const jdKeywords = this.extractJdKeywords(jdText);
    const coverage = this.calculateKeywordCoverage(jdKeywords, contentText);

    // Total metrics regex matching numbers with %, +, currency symbols, units, or quantifiers
    const metricMatches = contentText.match(/(?:\b\d+(?:\.\d+)?%|\b\d+(?:\.\d+)?\+|\b(?:Rs\.?|INR|\$|€|£)\s*\d+(?:\.\d+)?\s*(?:Cr|L|k|M|B)?\+?|\b\d+(?:\.\d+)?\s*(?:Cr|L|k|M|B|K)\+?|\b\d+\s*(?:days?|mins?|hours?|x)\b)/gi) ?? [];

    // Bold metric extraction matching bold spans containing digits: /\*\*[^*]*\d+[^*]*\*\*/g
    const boldMatches = contentText.match(/\*\*[^*]*\d+[^*]*\*\*/g) ?? [];

    const result = this.assessGateScore(coverage, metricMatches.length, boldMatches.length);

    // Identify missing keywords
    const lowerContent = contentText.toLowerCase().replace(/-/g, ' ');
    const missing = jdKeywords.filter(kw => {
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      return !regex.test(lowerContent) && !lowerContent.includes(kw.toLowerCase());
    });
    result.missingKeywords = missing.slice(0, 10);

    // SPEC.md Rule 2 check: check for forbidden hyphens or em-dashes in leaf text content
    if (/[-—]/.test(contentText)) {
      result.suggestions.push('WARNING: Config content contains hyphens or dashes violating SPEC.md Rule 2.');
    }

    return result;
  }
}
