package com.learnway.content;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnway.common.exception.ResourceNotFoundException;
import com.learnway.content.dto.*;
import com.learnway.content.entity.*;
import com.learnway.content.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class ContentService {

    /** Minimum characters required to submit a descriptive answer (per spec). */
    public static final int DESCRIPTIVE_MIN_CHARS = 50;

    private final TopicRepository topicRepository;
    private final SubtopicRepository subtopicRepository;
    private final LessonRepository lessonRepository;
    private final LessonQuestionRepository questionRepository;
    private final QuestionOptionRepository optionRepository;
    private final CodeChallengeRepository codeChallengeRepository;
    private final ObjectMapper objectMapper;

    public ContentService(TopicRepository topicRepository,
                          SubtopicRepository subtopicRepository,
                          LessonRepository lessonRepository,
                          LessonQuestionRepository questionRepository,
                          QuestionOptionRepository optionRepository,
                          CodeChallengeRepository codeChallengeRepository,
                          ObjectMapper objectMapper) {
        this.topicRepository = topicRepository;
        this.subtopicRepository = subtopicRepository;
        this.lessonRepository = lessonRepository;
        this.questionRepository = questionRepository;
        this.optionRepository = optionRepository;
        this.codeChallengeRepository = codeChallengeRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<TopicDto> listTopics() {
        return topicRepository.findAllByActiveTrueOrderByOrderIndexAsc().stream()
                .map(TopicDto::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SubtopicDto> listSubtopics(UUID topicId) {
        if (!topicRepository.existsById(topicId)) {
            throw new ResourceNotFoundException("Topic", topicId);
        }
        return subtopicRepository.findByTopicIdOrderByOrderIndexAsc(topicId).stream()
                .map(s -> SubtopicDto.from(s, lessonRepository.countBySubtopicId(s.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<LessonSummaryDto> listLessons(UUID subtopicId) {
        if (!subtopicRepository.existsById(subtopicId)) {
            throw new ResourceNotFoundException("Subtopic", subtopicId);
        }
        return lessonRepository.findBySubtopicIdOrderByOrderIndexAsc(subtopicId).stream()
                .map(l -> LessonSummaryDto.from(l, questionRepository.countByLessonId(l.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public LessonDetailDto getLessonDetail(UUID lessonId) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson", lessonId));

        List<QuestionDto> questions = questionRepository.findByLessonIdOrderByOrderIndexAsc(lessonId).stream()
                .map(this::toQuestionDto)
                .toList();

        return new LessonDetailDto(
                lesson.getId(),
                lesson.getSubtopic().getId(),
                lesson.getTitle(),
                lesson.getTheoryContent(),
                lesson.getXpReward(),
                lesson.getDifficultyLevel(),
                lesson.getEstimatedMinutes(),
                questions);
    }

    public Lesson requireLesson(UUID lessonId) {
        return lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson", lessonId));
    }

    private QuestionDto toQuestionDto(LessonQuestion q) {
        List<QuestionDto.OptionPublicDto> options = null;
        QuestionDto.CodeChallengePublicDto codeChallenge = null;
        Integer minChars = null;

        switch (q.getQuestionType()) {
            case MULTIPLE_CHOICE -> options = optionRepository.findByQuestionIdOrderByOrderIndexAsc(q.getId()).stream()
                    .map(o -> new QuestionDto.OptionPublicDto(o.getId(), o.getOptionText(), o.getOrderIndex()))
                    .toList();
            case CODE_CHALLENGE -> codeChallenge = codeChallengeRepository.findByQuestionId(q.getId())
                    .map(this::toPublicChallenge)
                    .orElse(null);
            case DESCRIPTIVE -> minChars = DESCRIPTIVE_MIN_CHARS;
        }

        return new QuestionDto(q.getId(), q.getQuestionType(), q.getQuestionText(), q.getTheoryHint(),
                q.getOrderIndex(), q.getXpReward(), q.getDifficultyLevel(), options, codeChallenge, minChars);
    }

    /** Builds the client-safe challenge view, exposing test-case inputs but hiding expected outputs and the solution. */
    private QuestionDto.CodeChallengePublicDto toPublicChallenge(CodeChallenge c) {
        List<QuestionDto.VisibleTestCase> visible = new ArrayList<>();
        if (c.getTestCases() != null && !c.getTestCases().isBlank()) {
            try {
                JsonNode array = objectMapper.readTree(c.getTestCases());
                if (array.isArray()) {
                    for (JsonNode node : array) {
                        JsonNode input = node.get("input");
                        visible.add(new QuestionDto.VisibleTestCase(input != null ? input.asText() : ""));
                    }
                }
            } catch (Exception ignored) {
                // malformed JSON: simply return no visible cases
            }
        }
        return new QuestionDto.CodeChallengePublicDto(c.getInitialCode(), c.getLanguage(), visible);
    }
}
