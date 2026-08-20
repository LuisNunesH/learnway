package com.learnway.content;

import com.learnway.content.dto.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@Tag(name = "Content", description = "Trilhas, subtópicos e lições")
public class ContentController {

    private final ContentService contentService;

    public ContentController(ContentService contentService) {
        this.contentService = contentService;
    }

    @GetMapping("/topics")
    @Operation(summary = "Lista todas as trilhas ativas")
    public List<TopicDto> topics() {
        return contentService.listTopics();
    }

    @GetMapping("/topics/{topicId}/subtopics")
    @Operation(summary = "Subtópicos de uma trilha")
    public List<SubtopicDto> subtopics(@PathVariable UUID topicId) {
        return contentService.listSubtopics(topicId);
    }

    @GetMapping("/subtopics/{subtopicId}/lessons")
    @Operation(summary = "Lições de um subtópico")
    public List<LessonSummaryDto> lessons(@PathVariable UUID subtopicId) {
        return contentService.listLessons(subtopicId);
    }

    @GetMapping("/lessons/{lessonId}")
    @Operation(summary = "Detalhe da lição: teoria + questões (sem gabarito)")
    public LessonDetailDto lesson(@PathVariable UUID lessonId) {
        return contentService.getLessonDetail(lessonId);
    }
}
