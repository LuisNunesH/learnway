import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from './api.config';
import {
  Achievement, AiChatTurn, AnswerRequest, AnswerResult, AskResponse, CalendarDay, CodeEvaluation,
  CompleteLessonResult, DescriptiveEvaluation, FlashcardDeck, FlashcardDue,
  FlashcardGradeResult, FlashcardStats, LeaderboardEntry, LessonDetail,
  LessonProgress, LessonSummary, Profile, ReviewDue, ReviewResult, ReviewStats,
  SessionStats, StatementValidation, StudySession, Subtopic, TheoryNote, Topic, Trail,
} from './models';

/** Fachada única sobre os endpoints REST da learnway-api. */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  // ---------- conteúdo ----------
  topics(): Observable<Topic[]> { return this.http.get<Topic[]>(`${API_URL}/topics`); }
  subtopics(topicId: string): Observable<Subtopic[]> { return this.http.get<Subtopic[]>(`${API_URL}/topics/${topicId}/subtopics`); }
  lessons(subtopicId: string): Observable<LessonSummary[]> { return this.http.get<LessonSummary[]>(`${API_URL}/subtopics/${subtopicId}/lessons`); }
  lesson(lessonId: string): Observable<LessonDetail> { return this.http.get<LessonDetail>(`${API_URL}/lessons/${lessonId}`); }

  // ---------- progresso ----------
  trail(): Observable<Trail> { return this.http.get<Trail>(`${API_URL}/progress/trail`); }
  startLesson(lessonId: string): Observable<LessonProgress> { return this.http.post<LessonProgress>(`${API_URL}/progress/lesson/${lessonId}/start`, {}); }
  completeLesson(lessonId: string): Observable<CompleteLessonResult> { return this.http.post<CompleteLessonResult>(`${API_URL}/progress/lesson/${lessonId}/complete`, {}); }
  answerQuestion(questionId: string, body: AnswerRequest): Observable<AnswerResult> { return this.http.post<AnswerResult>(`${API_URL}/progress/question/${questionId}/answer`, body); }

  // ---------- revisões ----------
  reviewsDue(): Observable<ReviewDue[]> { return this.http.get<ReviewDue[]>(`${API_URL}/reviews/due`); }
  completeReview(lessonId: string, quality: number): Observable<ReviewResult> { return this.http.post<ReviewResult>(`${API_URL}/reviews/${lessonId}/complete`, { quality }); }
  reviewStats(): Observable<ReviewStats> { return this.http.get<ReviewStats>(`${API_URL}/reviews/stats`); }

  // ---------- flashcards ----------
  flashcardDecks(): Observable<FlashcardDeck[]> { return this.http.get<FlashcardDeck[]>(`${API_URL}/flashcards/decks`); }
  flashcardsDue(lessonId?: string): Observable<FlashcardDue[]> {
    return this.http.get<FlashcardDue[]>(`${API_URL}/flashcards/due`, { params: lessonId ? { lessonId } : {} });
  }
  gradeFlashcard(flashcardId: string, quality: number): Observable<FlashcardGradeResult> {
    return this.http.post<FlashcardGradeResult>(`${API_URL}/flashcards/${flashcardId}/grade`, { quality });
  }
  flashcardStats(): Observable<FlashcardStats> { return this.http.get<FlashcardStats>(`${API_URL}/flashcards/stats`); }

  // ---------- anotações de teoria ----------
  theoryNotes(): Observable<TheoryNote[]> { return this.http.get<TheoryNote[]>(`${API_URL}/theory-notes`); }
  saveTheoryNote(articleId: string, content: string): Observable<TheoryNote> {
    return this.http.put<TheoryNote>(`${API_URL}/theory-notes/${articleId}`, { content });
  }
  deleteTheoryNote(articleId: string): Observable<void> { return this.http.delete<void>(`${API_URL}/theory-notes/${articleId}`); }

  // ---------- sessões ----------
  startSession(): Observable<StudySession> { return this.http.post<StudySession>(`${API_URL}/sessions/start`, {}); }
  heartbeatSession(): Observable<StudySession> { return this.http.post<StudySession>(`${API_URL}/sessions/heartbeat`, {}); }
  endSession(): Observable<StudySession> { return this.http.post<StudySession>(`${API_URL}/sessions/end`, {}); }
  sessionStats(): Observable<SessionStats> { return this.http.get<SessionStats>(`${API_URL}/sessions/stats`); }

  // ---------- atividade / calendário ----------
  activityVisit(): Observable<void> { return this.http.post<void>(`${API_URL}/activity/visit`, {}); }
  activityCalendar(year: number, month: number): Observable<CalendarDay[]> {
    return this.http.get<CalendarDay[]>(`${API_URL}/activity/calendar`, { params: { year, month } });
  }

  // ---------- IA ----------
  evaluateDescriptive(questionId: string, answer: string): Observable<DescriptiveEvaluation> {
    return this.http.post<DescriptiveEvaluation>(`${API_URL}/ai/evaluate-descriptive`, { questionId, answer });
  }
  evaluateCode(questionId: string, code: string): Observable<CodeEvaluation> {
    return this.http.post<CodeEvaluation>(`${API_URL}/ai/evaluate-code`, { questionId, code });
  }
  askAi(lessonId: string, question: string): Observable<AskResponse> {
    return this.http.post<AskResponse>(`${API_URL}/ai/ask`, { lessonId, question });
  }
  validateStatement(articleTitle: string, articleContent: string, statement: string): Observable<StatementValidation> {
    return this.http.post<StatementValidation>(`${API_URL}/ai/validate-statement`, { articleTitle, articleContent, statement });
  }
  askTheory(articleTitle: string, articleContent: string, question: string, history: AiChatTurn[]): Observable<AskResponse> {
    return this.http.post<AskResponse>(`${API_URL}/ai/ask-theory`, { articleTitle, articleContent, question, history });
  }

  // ---------- gamificação / perfil ----------
  weeklyLeaderboard(): Observable<LeaderboardEntry[]> { return this.http.get<LeaderboardEntry[]>(`${API_URL}/leaderboard/weekly`); }
  achievements(): Observable<Achievement[]> { return this.http.get<Achievement[]>(`${API_URL}/achievements`); }
  myAchievements(): Observable<Achievement[]> { return this.http.get<Achievement[]>(`${API_URL}/achievements/my`); }
  profile(): Observable<Profile> { return this.http.get<Profile>(`${API_URL}/users/profile/me`); }
}
