/**
 * Espelho TypeScript dos DTOs da learnway-api.
 * Jackson está com default-property-inclusion: non_null — campos ausentes
 * chegam como undefined, por isso os opcionais.
 */

export type QuestionType = 'MULTIPLE_CHOICE' | 'DESCRIPTIVE' | 'CODE_CHALLENGE';
export type LessonStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
export type UrgencyLevel = 'OVERDUE' | 'DUE_TODAY' | 'NORMAL';
export type NodeStatus = 'LOCKED' | 'AVAILABLE' | 'COMPLETED' | 'REVIEW';

// ---------- auth ----------

export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string;
  xpTotal: number;
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  streakDays: number;
  dailyGoalMinutes: number;
  lastActivityDate?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  violations?: { field: string; message: string }[];
}

// ---------- conteúdo ----------

export interface Topic {
  id: string;
  slug: string;
  title: string;
  description?: string;
  icon?: string;
  colorHex?: string;
  orderIndex: number;
}

export interface Subtopic {
  id: string;
  topicId: string;
  slug: string;
  title: string;
  description?: string;
  orderIndex: number;
  prerequisiteSubtopicId?: string;
  lessonCount: number;
}

export interface LessonSummary {
  id: string;
  subtopicId: string;
  title: string;
  xpReward: number;
  difficultyLevel?: number;
  orderIndex: number;
  estimatedMinutes: number;
  questionCount: number;
}

export interface QuestionOption {
  id: string;
  optionText: string;
  orderIndex: number;
}

export interface CodeChallengePublic {
  initialCode?: string;
  language: string;
  testCases?: { input: string }[];
}

export interface Question {
  id: string;
  type: QuestionType;
  questionText: string;
  theoryHint?: string;
  orderIndex: number;
  xpReward: number;
  difficultyLevel?: number;
  options?: QuestionOption[];
  codeChallenge?: CodeChallengePublic;
  minChars?: number;
}

export interface LessonDetail {
  id: string;
  subtopicId: string;
  title: string;
  theoryContent: string;
  xpReward: number;
  difficultyLevel?: number;
  estimatedMinutes: number;
  questions: Question[];
}

// ---------- progresso / trilha ----------

export interface LessonNode {
  id: string;
  title: string;
  orderIndex: number;
  difficultyLevel?: number;
  xpReward: number;
  status: NodeStatus;
  scorePercentage?: number;
  crystalUrgency?: UrgencyLevel;
}

export interface SubtopicNode {
  id: string;
  slug: string;
  title: string;
  orderIndex: number;
  locked: boolean;
  prerequisiteSubtopicId?: string;
  lessons: LessonNode[];
}

export interface TopicNode {
  id: string;
  slug: string;
  title: string;
  icon?: string;
  colorHex?: string;
  orderIndex: number;
  completedLessons: number;
  totalLessons: number;
  subtopics: SubtopicNode[];
}

export interface Trail {
  topics: TopicNode[];
}

export interface LessonProgress {
  lessonId: string;
  status: LessonStatus;
  scorePercentage?: number;
  attempts: number;
  xpEarned: number;
  completedAt?: string;
}

export interface CompleteLessonResult {
  lessonId: string;
  status: LessonStatus;
  scorePercentage?: number;
  xpEarned: number;
  firstCompletion: boolean;
  nextReviewAt?: string;
  newAchievements?: Achievement[];
}

export interface AnswerRequest {
  selectedOptionId?: string;
  answerText?: string;
  code?: string;
  timeSpentSeconds?: number;
}

export interface OptionFeedback {
  id: string;
  text: string;
  correct: boolean;
  explanation?: string;
  selected: boolean;
}

export interface AnswerResult {
  questionId: string;
  type: QuestionType;
  correct: boolean;
  score: number;
  xpEarned: number;
  selectedOptionId?: string;
  correctOptionId?: string;
  options?: OptionFeedback[];
  descriptiveEvaluation?: DescriptiveEvaluation;
  codeEvaluation?: CodeEvaluation;
  newAchievements?: Achievement[];
}

// ---------- IA ----------

export interface DescriptiveEvaluation {
  score: number;
  passed: boolean;
  feedback: string;
  strengths?: string[];
  improvements?: string[];
  complementaryTip?: string;
}

export interface CodeEvaluation {
  passed: boolean;
  score: number;
  testResults?: { testCase: string; passed: boolean }[];
  codeReview?: string;
  bestPracticesFeedback?: string;
  suggestedImprovement?: string;
}

export interface AskResponse {
  answer: string;
}

/** Fala já trocada num chat com a IA, reenviada para dar continuidade à conversa. */
export interface AiChatTurn {
  role: 'user' | 'ai';
  text: string;
}

export type StatementVerdict = 'CORRECT' | 'PARTIALLY_CORRECT' | 'INCORRECT';

export interface StatementValidation {
  verdict: StatementVerdict;
  explanation: string;
}

// ---------- revisão (SM-2) ----------

export interface ReviewDue {
  lessonId: string;
  lessonTitle: string;
  subtopicTitle: string;
  topicTitle: string;
  topicColorHex?: string;
  nextReviewAt: string;
  urgencyLevel: UrgencyLevel;
  intervalDays: number;
  repetitions: number;
}

export interface ReviewStats {
  totalScheduled: number;
  crystalsToReview: number;
  overdue: number;
  dueToday: number;
  nextReviewAt?: string;
}

export interface ReviewResult {
  lessonId: string;
  quality: number;
  intervalDays: number;
  repetitions: number;
  easeFactor: number;
  nextReviewAt: string;
  urgencyLevel: UrgencyLevel;
  xpEarned: number;
  newAchievements?: Achievement[];
}

// ---------- flashcards (SM-2 por carta) ----------

export interface FlashcardDeck {
  lessonId: string;
  lessonTitle: string;
  subtopicTitle: string;
  topicTitle: string;
  topicColorHex?: string;
  totalCards: number;
  newCards: number;
  dueCards: number;
  nextReviewAt?: string;
}

export interface FlashcardDue {
  flashcardId: string;
  lessonId: string;
  lessonTitle: string;
  topicTitle: string;
  topicColorHex?: string;
  frontText: string;
  backText: string;
  isNew: boolean;
  intervalDays: number;
  repetitions: number;
  nextReviewAt?: string;
}

export interface FlashcardGradeResult {
  flashcardId: string;
  quality: number;
  intervalDays: number;
  repetitions: number;
  easeFactor: number;
  nextReviewAt: string;
  xpEarned: number;
  newAchievements?: Achievement[];
}

export interface FlashcardStats {
  totalCards: number;
  newCards: number;
  dueCards: number;
  nextReviewAt?: string;
}

// ---------- anotações de teoria ----------

export interface TheoryNote {
  articleId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// ---------- sessões ----------

export interface StudySession {
  id: string;
  startedAt: string;
  endedAt?: string;
  durationMinutes?: number;
  /** Tempo de estudo real, sem o que se passou fora da tela. */
  activeSeconds: number;
  /** O cronômetro está congelado porque o usuário saiu da tela. */
  paused: boolean;
}

export interface SessionStats {
  totalMinutes: number;
  weekMinutes: number;
  todayMinutes: number;
  dailyGoalMinutes: number;
  activeSessionStartedAt?: string;
  activeSessionSeconds: number;
  weekly: { date: string; minutes: number }[];
}

// ---------- atividade / calendário ----------

export interface CalendarDay {
  date: string;      // yyyy-MM-dd
  loggedIn: boolean;
  activities: number;
}

// ---------- gamificação ----------

export interface Achievement {
  id: string;
  slug: string;
  title: string;
  description?: string;
  icon?: string;
  xpBonus: number;
  earned: boolean;
  earnedAt?: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl?: string;
  xpThisWeek: number;
  level: number;
  topOfWeek: boolean;
  currentUser: boolean;
}

// ---------- perfil ----------

export interface Profile {
  user: User;
  totalStudyMinutes: number;
  lessonsCompleted: number;
  achievementsEarned: number;
  achievements: Achievement[];
  accuracyByType: { type: QuestionType; total: number; correct: number; accuracyPercent: number }[];
  xpHistory: { date: string; xp: number }[];
  studyHeatmap: { date: string; minutes: number }[];
  lessonsByTopic: { topicTitle: string; colorHex?: string; completed: number; total: number }[];
}
