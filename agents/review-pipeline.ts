export interface ReviewScores {
    achievementDensity: number;
    metricQuality: number;
    businessImpact: number;
    leadership: number;
    narrative: number;
    evidence: number;
    readability: number;
    ats: number;
    differentiation: number;
    confidence: number;
    totalScore: number;
}

export interface ReviewFeedback {
    scores: ReviewScores;
    critique: string;
    revisionInstructions: string[];
}

export class DualAgentReviewPipeline {
    
    /**
     * Executes the review pipeline over a generated Resume and Cover Letter artifact.
     * Automatically triggers a revision if the score is below the threshold.
     */
    public async evaluateAndRevise(
        opportunityId: string, 
        resumeContent: string, 
        config: any
    ): Promise<{ finalContent: string, finalConfig: any, attempts: number }> {
        
        let currentContent = resumeContent;
        let currentConfig = config;
        let attempts = 0;
        const MAX_ATTEMPTS = 3;
        const PASSING_SCORE = 90;

        while (attempts < MAX_ATTEMPTS) {
            attempts++;
            console.log(`[Review Pipeline] Attempt ${attempts} for Opportunity: ${opportunityId}`);

            const feedback = await this.runReviewAgents(currentContent, currentConfig);
            
            console.log(`[Review Pipeline] Score: ${feedback.scores.totalScore}/100`);

            if (feedback.scores.totalScore >= PASSING_SCORE) {
                console.log(`[Review Pipeline] Passed with score ${feedback.scores.totalScore}. No further revisions needed.`);
                return { finalContent: currentContent, finalConfig: currentConfig, attempts };
            }

            console.log(`[Review Pipeline] Score below ${PASSING_SCORE}. Triggering Revision Agent.`);
            const revision = await this.runRevisionAgent(currentContent, currentConfig, feedback);
            
            currentContent = revision.newContent;
            currentConfig = revision.newConfig;
        }

        console.log(`[Review Pipeline] Max attempts reached (${MAX_ATTEMPTS}). Returning best effort.`);
        return { finalContent: currentContent, finalConfig: currentConfig, attempts };
    }

    private async runReviewAgents(content: string, config: any): Promise<ReviewFeedback> {
        // Mock dual-agent consensus logic
        // E.g., Agent 1: Hiring Manager, Agent 2: Executive/ATS Reviewer
        
        // Simulating a score
        const score = Math.floor(Math.random() * 15) + 80; // 80 - 94
        
        return {
            scores: {
                achievementDensity: 85,
                metricQuality: 90,
                businessImpact: 80,
                leadership: 85,
                narrative: 90,
                evidence: 95,
                readability: 88,
                ats: 92,
                differentiation: 85,
                confidence: 90,
                totalScore: score
            },
            critique: "The metrics are strong, but the narrative lacks differentiation in the summary section. ATS keywords are well represented.",
            revisionInstructions: [
                "Improve the WHY_I_FIT section to explicitly state the unfair advantage.",
                "Ensure bullet lengths strictly adhere to the 105-character single-line rule."
            ]
        };
    }

    private async runRevisionAgent(
        content: string, 
        config: any, 
        feedback: ReviewFeedback
    ): Promise<{ newContent: string, newConfig: any }> {
        // In a real implementation, the LLM takes the feedback and rewrites the partial_config
        console.log("[Revision Agent] Applying feedback...");
        
        // Mock revision
        return {
            newContent: content + "\n<!-- Revised based on feedback -->",
            newConfig: { ...config, revised: true }
        };
    }
}
