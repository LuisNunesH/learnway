package com.learnway.ai.dto;

import java.util.List;

public record CodeEvaluation(
        boolean passed,
        int score,
        List<TestResult> testResults,
        String codeReview,
        String bestPracticesFeedback,
        String suggestedImprovement
) {
    public record TestResult(String testCase, boolean passed) {}
}
