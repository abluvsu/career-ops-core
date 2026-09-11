import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { ChallengerGate, extractLeafText } from './challenger-gate.js';

describe('ChallengerGate', () => {
  const gate = new ChallengerGate();

  describe('extractJdKeywords', () => {
    it('should extract single-word and multi-word keywords', () => {
      const jd = 'We need a Senior Data Scientist proficient in Python, SQL, machine learning, and Tableau.';
      const keywords = gate.extractJdKeywords(jd);
      expect(keywords).toContain('python');
      expect(keywords).toContain('sql');
      expect(keywords).toContain('machine learning');
      expect(keywords).toContain('tableau');
    });

    it('should extract 2-letter technical terms (AI, ML, BI, R, DB, Go)', () => {
      const jd = 'Looking for experts in AI, ML, BI, R, DB, and Go for high performance computing.';
      const keywords = gate.extractJdKeywords(jd);
      expect(keywords).toContain('ai');
      expect(keywords).toContain('ml');
      expect(keywords).toContain('bi');
      expect(keywords).toContain('r');
      expect(keywords).toContain('db');
      expect(keywords).toContain('go');
    });

    it('should exclude stop words and low-signal filler words', () => {
      const jd = 'The candidate will be responsible for strong experience in working with Python and SQL.';
      const keywords = gate.extractJdKeywords(jd);
      expect(keywords).toContain('python');
      expect(keywords).toContain('sql');
      expect(keywords).not.toContain('responsible');
      expect(keywords).not.toContain('experience');
      expect(keywords).not.toContain('working');
      expect(keywords).not.toContain('the');
      expect(keywords).not.toContain('with');
    });
  });

  describe('calculateKeywordCoverage', () => {
    it('should calculate keyword coverage ratio accurately', () => {
      const keywords = ['python', 'sql', 'machine learning', 'tableau', 'spark'];
      const text = 'Built automated python and sql pipelines for machine learning model deployment using tableau dashboards.';
      const coverage = gate.calculateKeywordCoverage(keywords, text);
      expect(coverage).toBeCloseTo(0.8, 1);
    });

    it('should return 0 when keyword array is empty', () => {
      expect(gate.calculateKeywordCoverage([], 'some random text')).toBe(0);
    });
  });

  describe('assessGateScore', () => {
    it('should calculate composite ATS score (60% keywords + 20% metrics + 20% bold metrics)', () => {
      const result = gate.assessGateScore(1.0, 10, 6);
      expect(result.atsEstimate).toBe(100);
      expect(result.pass).toBe(true);
    });

    it('should strictly enforce the 85% threshold boundary (84% fails, 85% passes)', () => {
      // 84% score: keywordCoverage = 0.8 (48), totalMetrics = 9 (18), boldMetrics = 5.4 (18) -> total = 84
      const failResult = gate.assessGateScore(0.8, 9, 5.4);
      expect(failResult.atsEstimate).toBe(84);
      expect(failResult.pass).toBe(false);
      expect(failResult.suggestions.length).toBeGreaterThan(0);

      // 85% score: keywordCoverage = 0.85 (51), totalMetrics = 8.5 (17), boldMetrics = 5.1 (17) -> total = 85
      const passResult = gate.assessGateScore(0.85, 8.5, 5.1);
      expect(passResult.atsEstimate).toBe(85);
      expect(passResult.pass).toBe(true);
    });
  });

  describe('extractLeafText', () => {
    it('should recursively extract leaf string values ignoring object keys', () => {
      const config = {
        SUMMARY: 'Data Science Leader',
        ROLE_PILLARS: [
          { title: 'AI Engineering', bullets: ['Built Python ML pipelines for **30% lift**'] },
        ],
      };
      const text = extractLeafText(config);
      expect(text).not.toContain('SUMMARY');
      expect(text).not.toContain('ROLE_PILLARS');
      expect(text).toContain('Data Science Leader');
      expect(text).toContain('Built Python ML pipelines for **30% lift**');
    });
  });

  describe('evaluateConfig', () => {
    it('should evaluate an in-memory config object', () => {
      const config = {
        WHY_I_FIT: 'Delivered machine learning solutions using Python, SQL, and Tableau yielding **30% conversion lift** across **800+ campaigns**.',
        ROLE_PILLARS: [
          'Led **Rs 5 Cr+** annual savings with **10+ pipelines** processed in **7 days** for **32K records**.',
          'Automated **15 mins** reporting with **99.85%** accuracy across **5 teams** and **20+ clients**.',
        ],
      };
      const jd = 'Seeking expert in machine learning, Python, SQL, Tableau, and Spark.';
      const result = gate.evaluateConfig(config, jd);
      expect(result.pass).toBe(true);
      expect(result.atsEstimate).toBeGreaterThanOrEqual(85);
      expect(result.missingKeywords).toContain('spark');
    });

    it('should evaluate a config file path string', () => {
      const tempPath = path.join(__dirname, 'temp_test_config.json');
      const configObj = {
        WHY_I_FIT: 'Delivered machine learning solutions using Python, SQL, and Tableau yielding **30% conversion lift** across **800+ campaigns**.',
        ROLE_PILLARS: [
          'Led **Rs 5 Cr+** annual savings with **10+ pipelines** processed in **7 days** for **32K records**.',
          'Automated **15 mins** reporting with **99.85%** accuracy across **5 teams** and **20+ clients**.',
        ],
      };
      fs.writeFileSync(tempPath, JSON.stringify(configObj));

      try {
        const jd = 'Seeking expert in machine learning, Python, SQL, Tableau, and Spark.';
        const result = gate.evaluateConfig(tempPath, jd);
        expect(result.pass).toBe(true);
        expect(result.atsEstimate).toBeGreaterThanOrEqual(85);
      } finally {
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
      }
    });

    it('should detect SPEC.md Rule 2 forbidden hyphens/dashes in config content', () => {
      const config = {
        WHY_I_FIT: 'Data-driven manager with cross-functional leadership experience.',
      };
      const jd = 'Looking for data driven manager.';
      const result = gate.evaluateConfig(config, jd);
      expect(result.suggestions.some(s => s.includes('SPEC.md Rule 2'))).toBe(true);
    });

    it('should handle non-existent file path gracefully', () => {
      const result = gate.evaluateConfig('non_existent_file_path_12345.json', 'Python SQL');
      expect(result.pass).toBe(false);
      expect(result.atsEstimate).toBe(0);
      expect(result.suggestions[0]).toContain('Config file not found');
    });
  });
});
