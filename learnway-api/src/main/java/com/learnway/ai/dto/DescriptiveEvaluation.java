package com.learnway.ai.dto;

import java.util.List;

public record DescriptiveEvaluation(
        int score,
        boolean passed,
        String feedback,
        List<String> strengths,
        List<String> improvements,
        String complementaryTip
) {
}
