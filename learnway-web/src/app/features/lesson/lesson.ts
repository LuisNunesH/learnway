import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { PresenceService } from '../../core/presence.service';
import { StudySessionService } from '../../core/study-session.service';
import { ToastService } from '../../core/toast.service';
import { Achievement, AnswerResult, CompleteLessonResult, LessonDetail, Question } from '../../core/models';
import { Icon } from '../../shared/icon';
import { MarkdownPipe } from '../../shared/markdown.pipe';
import { Difficulty, ProgressBar, Spinner } from '../../shared/widgets';
import { AiChat } from './ai-chat';
import { AiChatSessionService } from './ai-chat-session.service';
import { CodeEditor } from './code-editor';

type Phase = 'loading' | 'theory' | 'question' | 'summary';
type Verdict = 'correct' | 'partial' | 'wrong';

interface ConfettiPiece { x: string; y: string; r: string; color: string; delay: string; left: string; }

// Cores do confete (não seguem estado de avaliação) — os cinco matizes do
// sistema mais um degrau da rampa. Via token, para o confete cair em vermelho
// e tinta clara no tema escuro em vez de sumir contra o nanquim.
const CONFETTI_COLORS = [
  'var(--lw-accent)', 'var(--lw-eval-correct)', 'var(--lw-streak)',
  'var(--lw-level)', 'var(--lw-ink)', 'var(--lw-ramp-2)',
];

@Component({
  selector: 'lw-lesson',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DecimalPipe, FormsModule, RouterLink, Icon, MarkdownPipe, Difficulty, ProgressBar, Spinner, AiChat, CodeEditor],
  template: `
    <div class="page page--lesson">
      @if (phase() === 'loading') {
        <div class="skeleton" style="height: 44px; width: 60%; margin-bottom: 18px"></div>
        <div class="skeleton" style="height: 480px"></div>
      }

      <!-- ══════════ TEORIA ══════════ -->
      @if (phase() === 'theory' && lesson(); as l) {
        <header class="head anim-fade-up">
          <a routerLink="/trilha" class="iconbtn" title="Voltar à trilha"><lw-icon name="arrow-left" [size]="18" /></a>
          <div class="head__info">
            <span class="lw-label">Lição</span>
            <h1>{{ l.title }}</h1>
            <div class="head__meta">
              <lw-difficulty [level]="l.difficultyLevel" />
              <span class="chip"><lw-icon name="clock" [size]="12" /> ~{{ l.estimatedMinutes }} min</span>
              <span class="chip"><lw-icon name="zap" [size]="12" /> +{{ l.xpReward }} XP</span>
              <span class="chip"><lw-icon name="book-open" [size]="12" /> {{ l.questions.length }} questõe{{ l.questions.length === 1 ? '' : 's' }}</span>
            </div>
          </div>
          <button class="btn btn--ghost" (click)="chatOpen.set(true)">
            <lw-icon name="bot" [size]="16" /> Aprofundar com IA
          </button>
        </header>

        <article class="card theory anim-fade-up">
          <div class="md" [innerHTML]="l.theoryContent | markdown"></div>
        </article>

        <footer class="foot anim-fade-up">
          <p class="muted">Leu tudo? A teoria vem sempre antes da prática.</p>
          @if (l.questions.length > 0) {
            <button class="btn btn--primary btn--lg" (click)="startQuestions()">
              Iniciar questões <lw-icon name="arrow-right" [size]="17" />
            </button>
          } @else {
            <button class="btn btn--primary btn--lg" (click)="finishLesson()" [disabled]="submitting()">
              @if (submitting()) { <lw-spinner /> } Concluir lição
            </button>
          }
        </footer>
      }

      <!-- ══════════ QUESTÕES ══════════ -->
      @if (phase() === 'question' && currentQuestion(); as q) {
        <header class="qbar anim-fade-up">
          <button class="iconbtn" (click)="phase.set('theory')" title="Rever a teoria">
            <lw-icon name="book-open" [size]="18" />
          </button>
          <lw-progress [value]="questionProgress()" [height]="8" style="flex: 1" />
          <span class="qbar__count mono">{{ currentIndex() + 1 }}/{{ lesson()?.questions?.length }}</span>
          <button class="btn btn--ghost btn--sm" (click)="chatOpen.set(true)">
            <lw-icon name="bot" [size]="15" /><span class="hide-sm"> IA</span>
          </button>
        </header>

        <section class="card question anim-fade-up"
                 [class.anim-shake]="shakeIt()" [class.anim-pulse]="pulseIt()"
                 [class.question--pending]="submitting() && q.type !== 'MULTIPLE_CHOICE'">
          <div class="question__type">
            @switch (q.type) {
              @case ('MULTIPLE_CHOICE') { <span class="chip"><lw-icon name="check" [size]="12" /> Múltipla escolha</span> }
              @case ('DESCRIPTIVE') { <span class="chip"><lw-icon name="pen" [size]="12" /> Resposta descritiva · IA</span> }
              @case ('CODE_CHALLENGE') { <span class="chip"><lw-icon name="code" [size]="12" /> Desafio de código · IA</span> }
            }
            <span class="chip"><lw-icon name="zap" [size]="12" /> +{{ q.xpReward }} XP</span>
          </div>

          <h2 class="question__text">{{ q.questionText }}</h2>

          @if (q.theoryHint) {
            <div class="hintbox">
              <button class="hintbox__toggle" (click)="hintOpen.set(!hintOpen())">
                <lw-icon name="sparkles" [size]="14" /> {{ hintOpen() ? 'Esconder dica' : 'Ver dica' }}
              </button>
              @if (hintOpen()) { <p class="hintbox__body anim-fade-up">{{ q.theoryHint }}</p> }
            </div>
          }

          <!-- múltipla escolha -->
          @if (q.type === 'MULTIPLE_CHOICE') {
            <div class="options">
              @for (opt of feedback()?.options ?? optionsOf(q); track opt.id) {
                <button class="option"
                        [class.option--selected]="!feedback() && selectedOptionId() === opt.id"
                        [class.option--correct]="feedback() && isCorrectOption(opt.id)"
                        [class.option--wrong]="feedback() && isWrongSelected(opt.id)"
                        [disabled]="!!feedback() || submitting()"
                        (click)="selectedOptionId.set(opt.id)">
                  <span class="option__mark">
                    @if (feedback() && isCorrectOption(opt.id)) { <lw-icon name="check" [size]="15" /> }
                    @else if (feedback() && isWrongSelected(opt.id)) { <lw-icon name="x" [size]="15" /> }
                    @else { {{ letter($index) }} }
                  </span>
                  <span class="option__body">
                    {{ optionText(opt) }}
                    @if (feedback() && explanationOf(opt.id); as why) {
                      <span class="option__why anim-fade-up">{{ why }}</span>
                    }
                  </span>
                </button>
              }
            </div>
          }

          <!-- descritiva -->
          @if (q.type === 'DESCRIPTIVE') {
            @if (!feedback()) {
              <textarea class="input" rows="7" [(ngModel)]="answerText" name="answer"
                        placeholder="Explique com suas palavras — a IA avalia profundidade, precisão técnica e clareza."
                        [disabled]="submitting()"></textarea>
              <div class="charcount" [class.charcount--ok]="answerText.trim().length >= minChars(q)">
                {{ answerText.trim().length }}/{{ minChars(q) }} caracteres mínimos
              </div>
            } @else if (feedback()?.descriptiveEvaluation; as ev) {
              <div class="evaluation anim-fade-up"
                   [class.evaluation--correct]="ev.passed"
                   [class.evaluation--partial]="!ev.passed && ev.score >= 50"
                   [class.evaluation--wrong]="!ev.passed && ev.score < 50">
                <div class="evaluation__score">
                  <span class="evaluation__num numeral">{{ ev.score }}</span>
                  <span class="muted">/100</span>
                  <span class="chip" [class.chip--success]="ev.passed"
                        [class.chip--warning]="!ev.passed && ev.score >= 50"
                        [class.chip--danger]="!ev.passed && ev.score < 50">
                    {{ ev.passed ? 'Aprovado' : (ev.score >= 50 ? 'Quase lá' : 'Continue tentando') }}
                  </span>
                </div>
                <p class="evaluation__feedback">{{ ev.feedback }}</p>
                <div class="evaluation__cols">
                  @if (ev.strengths?.length) {
                    <div>
                      <h4 class="evaluation__h evaluation__h--good"><lw-icon name="check" [size]="14" /> Pontos fortes</h4>
                      <ul>@for (s of ev.strengths; track $index) { <li>{{ s }}</li> }</ul>
                    </div>
                  }
                  @if (ev.improvements?.length) {
                    <div>
                      <h4 class="evaluation__h evaluation__h--warn"><lw-icon name="trending-up" [size]="14" /> Para melhorar</h4>
                      <ul>@for (s of ev.improvements; track $index) { <li>{{ s }}</li> }</ul>
                    </div>
                  }
                </div>
                @if (ev.complementaryTip) {
                  <div class="evaluation__tip"><lw-icon name="sparkles" [size]="15" /> {{ ev.complementaryTip }}</div>
                }
              </div>
            }
          }

          <!-- desafio de código -->
          @if (q.type === 'CODE_CHALLENGE') {
            @if (!feedback()) {
              <lw-code-editor [(code)]="challengeCode" />
              @if (q.codeChallenge?.testCases?.length) {
                <div class="testcases">
                  <h4><lw-icon name="target" [size]="14" /> Casos de teste que serão validados</h4>
                  @for (tc of q.codeChallenge?.testCases; track $index) {
                    <code class="testcases__item mono">{{ tc.input }}</code>
                  }
                </div>
              }
            } @else if (feedback()?.codeEvaluation; as ev) {
              <div class="evaluation anim-fade-up"
                   [class.evaluation--correct]="ev.passed"
                   [class.evaluation--partial]="!ev.passed && ev.score >= 50"
                   [class.evaluation--wrong]="!ev.passed && ev.score < 50">
                <div class="evaluation__score">
                  <span class="evaluation__num numeral">{{ ev.score }}</span>
                  <span class="muted">/100</span>
                  <span class="chip" [class.chip--success]="ev.passed"
                        [class.chip--warning]="!ev.passed && ev.score >= 50"
                        [class.chip--danger]="!ev.passed && ev.score < 50">
                    {{ ev.passed ? 'Passou' : (ev.score >= 50 ? 'Quase lá' : 'Não passou') }}
                  </span>
                  <button class="btn btn--ghost btn--sm evaluation__viewcode" (click)="codeModalOpen.set(true)">
                    <lw-icon name="code" [size]="14" /> Ver meu código
                  </button>
                </div>
                @if (ev.testResults?.length) {
                  <div class="tests">
                    @for (t of ev.testResults; track $index) {
                      <div class="tests__row" [class.tests__row--pass]="t.passed">
                        <lw-icon [name]="t.passed ? 'check' : 'x'" [size]="14" />
                        <code class="mono">{{ t.testCase }}</code>
                      </div>
                    }
                  </div>
                }
                @if (ev.codeReview) {
                  <h4 class="evaluation__h"><lw-icon name="code" [size]="14" /> Code review</h4>
                  <p class="evaluation__feedback">{{ ev.codeReview }}</p>
                }
                @if (ev.bestPracticesFeedback) {
                  <h4 class="evaluation__h"><lw-icon name="shield" [size]="14" /> Boas práticas</h4>
                  <p class="evaluation__feedback">{{ ev.bestPracticesFeedback }}</p>
                }
                @if (ev.suggestedImprovement) {
                  <details class="suggestion">
                    <summary>Ver sugestão de código melhorado</summary>
                    <pre class="mono">{{ ev.suggestedImprovement }}</pre>
                  </details>
                }
              </div>
            }
          }

          <!-- rodapé da questão -->
          <div class="question__actions">
            @if (!feedback()) {
              <button class="btn btn--primary btn--lg" (click)="submit()" [disabled]="!canSubmit() || submitting()">
                @if (submitting()) {
                  <lw-spinner /> {{ q.type === 'MULTIPLE_CHOICE' ? 'Verificando…' : 'IA avaliando…' }}
                } @else { Responder }
              </button>
            } @else {
              <div class="verdict" [class]="'verdict verdict--' + verdictState()">
                <lw-icon [name]="verdictIcon()" [size]="18" />
                <span>
                  {{ verdictLabel() }}
                  @if ((feedback()?.xpEarned ?? 0) > 0) { <b>+{{ feedback()?.xpEarned }} XP</b> }
                </span>
              </div>
              <button class="btn btn--primary btn--lg" (click)="next()" [disabled]="submitting()">
                @if (submitting()) { <lw-spinner /> }
                {{ isLast() ? 'Concluir lição' : 'Continuar' }} <lw-icon name="arrow-right" [size]="17" />
              </button>
            }
          </div>
        </section>
      }

      <!-- ══════════ RESUMO ══════════ -->
      @if (phase() === 'summary' && completion(); as done) {
        <section class="summary anim-pop">
          <div class="summary__score-panel">
            <span class="summary__score numeral">{{ done.scorePercentage ?? 0 | number: '1.0-0' }}<small>%</small></span>
            <div class="summary__bar" [class.summary__bar--low]="(done.scorePercentage ?? 0) < 60">
              <span [style.width.%]="done.scorePercentage ?? 0"></span>
            </div>
            <span class="lw-label">Aproveitamento</span>
          </div>
          <h1>Lição concluída</h1>
          <p class="muted">
            @if (done.firstCompletion) { Um novo cristal de conhecimento foi aceso no seu mapa. }
            @else { Cristal energizado novamente — revisão em dia. }
          </p>

          <div class="summary__stats">
            <div class="card sstat"><lw-icon name="zap" [size]="18" /><b>+{{ done.xpEarned }}</b><span>XP ganho</span></div>
            <div class="card sstat"><lw-icon name="check" [size]="18" /><b>{{ correctCount() }}/{{ lesson()?.questions?.length }}</b><span>acertos</span></div>
            @if (done.nextReviewAt) {
              <div class="card sstat"><lw-icon name="gem" [size]="18" /><b>{{ done.nextReviewAt | date: 'dd/MM' }}</b><span>próxima revisão</span></div>
            }
          </div>

          @if (unlocked().length > 0) {
            <div class="summary__achievements">
              @for (a of unlocked(); track a.id) {
                <div class="card achievement anim-pop">
                  <span class="achievement__icon"><lw-icon [name]="a.icon ?? 'trophy'" [size]="20" /></span>
                  <div><strong>{{ a.title }}</strong><span class="muted"> · +{{ a.xpBonus }} XP</span></div>
                </div>
              }
            </div>
          }

          <div class="summary__actions">
            <a class="btn btn--ghost btn--lg" routerLink="/trilha">Voltar à trilha</a>
            <a class="btn btn--primary btn--lg" routerLink="/">Ir para o dashboard</a>
          </div>
        </section>
      }

      <!-- confete -->
      @if (confetti().length > 0) {
        <div class="confetti" aria-hidden="true">
          @for (piece of confetti(); track $index) {
            <span class="confetti__piece"
                  [style.--cf-x]="piece.x" [style.--cf-y]="piece.y" [style.--cf-r]="piece.r"
                  [style.background]="piece.color" [style.left]="piece.left"
                  [style.animationDelay]="piece.delay"></span>
          }
        </div>
      }
    </div>

    @if (chatOpen() && lesson()) {
      <lw-ai-chat [lessonId]="lesson()!.id" (close)="chatOpen.set(false)" />
    }

    <!-- pop-up: revisão do código enviado + testes -->
    @if (codeModalOpen() && currentQuestion(); as q) {
      <div class="cmodal" (click)="codeModalOpen.set(false)" (keydown.escape)="codeModalOpen.set(false)" tabindex="-1">
        <div class="cmodal__card anim-pop" role="dialog" aria-modal="true" aria-label="Seu código enviado" (click)="$event.stopPropagation()">
          <header class="cmodal__head">
            <h3><lw-icon name="code" [size]="16" /> Seu código enviado</h3>
            <button class="iconbtn" (click)="codeModalOpen.set(false)" title="Fechar">
              <lw-icon name="x" [size]="16" />
            </button>
          </header>
          <div class="cmodal__body">
            <lw-code-editor [code]="submittedCode()" [readonly]="true" />

            @if (feedback()?.codeEvaluation?.testResults; as results) {
              @if (results.length > 0) {
                <h4 class="cmodal__subtitle"><lw-icon name="target" [size]="14" /> Casos de teste</h4>
                <div class="tests">
                  @for (t of results; track $index) {
                    <div class="tests__row" [class.tests__row--pass]="t.passed">
                      <lw-icon [name]="t.passed ? 'check' : 'x'" [size]="14" />
                      <code class="mono">{{ t.testCase }}</code>
                    </div>
                  }
                </div>
              }
            } @else if (q.codeChallenge?.testCases; as tcs) {
              <h4 class="cmodal__subtitle"><lw-icon name="target" [size]="14" /> Casos de teste</h4>
              <div class="tests">
                @for (tc of tcs; track $index) {
                  <div class="tests__row tests__row--neutral">
                    <lw-icon name="target" [size]="14" />
                    <code class="mono">{{ tc.input }}</code>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page--lesson { max-width: 840px; }

    .iconbtn {
      display: flex; align-items: center; justify-content: center;
      width: 38px; height: 38px; flex-shrink: 0;
      border-radius: 999px;
      border: 1px solid var(--lw-rule);
      background: var(--lw-paper-raised);
      color: var(--lw-ink-muted);
      cursor: pointer;
      transition: color var(--lw-dur-fast) var(--lw-ease),
                  border-color var(--lw-dur-fast) var(--lw-ease),
                  background var(--lw-dur-fast) var(--lw-ease);
      &:hover { color: var(--lw-ink); border-color: var(--lw-ink-faint); background: var(--lw-paper-sunken); }
    }

    /* ---- abertura da lição ---- */
    .head {
      display: flex; gap: var(--lw-space-lg); align-items: flex-start;
      padding-bottom: var(--lw-space-lg);
      border-bottom: 1px solid var(--lw-rule);
      margin-bottom: var(--lw-space-xl);
    }
    .head__info { flex: 1; min-width: 0; }
    .head__info h1 {
      font-size: var(--lw-text-h1);
      letter-spacing: var(--lw-tracking-display);
      margin: 4px 0 var(--lw-space-md);
    }
    .head__meta { display: flex; align-items: center; gap: var(--lw-space-sm); flex-wrap: wrap; }

    /* ---- teoria: uma página de livro ---- */
    .theory {
      padding: var(--lw-space-2xl);
      border-color: var(--lw-rule);
    }
    .theory .md { max-width: var(--lw-measure); margin: 0 auto; }

    .foot {
      display: flex; align-items: center; justify-content: space-between; gap: var(--lw-space-lg);
      padding-top: var(--lw-space-lg);
      margin-top: var(--lw-space-lg);
      border-top: 1px solid var(--lw-rule);
      p { font-family: var(--lw-font-prose); font-style: italic; font-size: var(--lw-text-body); }
    }

    /* ---- barra de progresso das questões ---- */
    .qbar { display: flex; align-items: center; gap: var(--lw-space-md); margin-bottom: var(--lw-space-lg); }
    .qbar__count { font-size: 11.5px; color: var(--lw-ink-muted); flex-shrink: 0; }

    .question { padding: var(--lw-space-xl); }
    /* "pending": comunica pelo MOVIMENTO, sem cor própria. */
    .question--pending { animation: lw-halo-pulse 1.8s var(--lw-ease) infinite; border-color: var(--lw-rule-strong); }
    .question__type { display: flex; gap: var(--lw-space-sm); margin-bottom: var(--lw-space-lg); flex-wrap: wrap; }

    /* O enunciado é o texto mais importante da tela: serifa, grande. */
    .question__text {
      font-family: var(--lw-font-display);
      font-variation-settings: var(--lw-display-variation);
      font-size: var(--lw-text-h2);
      font-weight: 500;
      line-height: 1.3;
      letter-spacing: var(--lw-tracking-tight);
      margin-bottom: var(--lw-space-xl);
    }

    .hintbox { margin-bottom: var(--lw-space-lg); }
    .hintbox__toggle {
      display: inline-flex; align-items: center; gap: 6px;
      background: none; border: none; cursor: pointer;
      color: var(--lw-accent-deep); font-size: 13px; font-weight: 550; padding: 0;
      &:hover { text-decoration: underline; text-underline-offset: 3px; }
    }
    .hintbox__body {
      margin-top: var(--lw-space-sm);
      padding: var(--lw-space-sm) 0 var(--lw-space-sm) var(--lw-space-lg);
      border-left: 2px solid var(--lw-rule-strong);
      font-family: var(--lw-font-prose);
      font-size: var(--lw-text-body);
      line-height: 1.65;
      color: var(--lw-ink-muted);
    }

    /* ---- alternativas: linhas de prova, com a letra na margem ---- */
    .options { display: flex; flex-direction: column; gap: var(--lw-space-sm); }
    .option {
      display: flex; gap: var(--lw-space-md); align-items: flex-start;
      width: 100%;
      text-align: left;
      background: var(--lw-paper-raised);
      border: 1px solid var(--lw-rule);
      border-radius: var(--lw-radius);
      padding: 13px 15px;
      color: var(--lw-ink);
      font-size: var(--lw-text-body);
      line-height: 1.5;
      cursor: pointer;
      transition: border-color var(--lw-dur-fast) var(--lw-ease),
                  background var(--lw-dur-fast) var(--lw-ease);
      &:not(:disabled):hover { border-color: var(--lw-ink-faint); background: var(--lw-paper-sunken); }
      &:disabled { cursor: default; }
    }
    .option--selected { border-color: var(--lw-ink); background: var(--lw-paper-sunken); }
    .option--correct { border-color: var(--lw-eval-correct); background: var(--lw-eval-correct-bg); }
    .option--wrong { border-color: var(--lw-eval-wrong); background: var(--lw-eval-wrong-bg); }
    .option__mark {
      display: flex; align-items: center; justify-content: center;
      width: 26px; height: 26px; flex-shrink: 0;
      border-radius: 999px;
      background: var(--lw-paper-sunken);
      border: 1px solid var(--lw-rule-strong);
      color: var(--lw-ink-muted);
      font-family: var(--lw-font-mono); font-weight: 500; font-size: 11.5px;
      transition: background var(--lw-dur-fast) var(--lw-ease), color var(--lw-dur-fast) var(--lw-ease);
    }
    .option--selected .option__mark { background: var(--lw-ink); border-color: var(--lw-ink); color: var(--lw-paper); }
    .option--correct .option__mark { background: var(--lw-eval-correct); border-color: var(--lw-eval-correct); color: var(--lw-on-color); }
    .option--wrong .option__mark { background: var(--lw-eval-wrong); border-color: var(--lw-eval-wrong); color: var(--lw-on-color); }
    .option__body { display: flex; flex-direction: column; gap: 7px; flex: 1; min-width: 0; }
    .option__why {
      font-family: var(--lw-font-prose);
      font-size: 14.5px; line-height: 1.6;
      color: var(--lw-ink-muted);
      border-top: 1px solid var(--lw-rule);
      padding-top: 7px;
    }

    .charcount { margin-top: var(--lw-space-sm); font-family: var(--lw-font-mono); font-size: 10.5px; color: var(--lw-ink-faint); }
    .charcount--ok { color: var(--lw-eval-correct); }

    .testcases {
      margin-top: var(--lw-space-md);
      h4 {
        display: flex; align-items: center; gap: 7px;
        font-family: var(--lw-font-mono); font-size: 10.5px;
        text-transform: uppercase; letter-spacing: var(--lw-tracking-micro);
        margin-bottom: var(--lw-space-sm); color: var(--lw-ink-faint);
      }
    }
    .testcases__item {
      display: block;
      background: var(--lw-code-bg);
      border: 1px solid var(--lw-rule);
      border-radius: var(--lw-radius-sm);
      padding: 7px 12px;
      font-size: 12.5px;
      margin-bottom: 6px;
      overflow-x: auto;
    }

    /* ---- avaliação da IA: uma nota de margem com régua colorida ---- */
    .evaluation {
      border-left: 3px solid var(--lw-rule-strong);
      padding: 0 0 0 var(--lw-space-xl);
      background: none;
    }
    .evaluation--correct { border-left-color: var(--lw-eval-correct); }
    .evaluation--partial { border-left-color: var(--lw-eval-partial); }
    .evaluation--wrong   { border-left-color: var(--lw-eval-wrong); }
    .evaluation__score {
      display: flex; align-items: baseline; gap: var(--lw-space-xs);
      margin-bottom: var(--lw-space-md);
      .chip { margin-left: var(--lw-space-sm); align-self: center; }
      .muted { font-size: var(--lw-text-h3); }
    }
    .evaluation__num { font-size: 46px; font-weight: 500; line-height: 1; }
    .evaluation--correct .evaluation__num { color: var(--lw-eval-correct); }
    .evaluation--partial .evaluation__num { color: var(--lw-eval-partial); }
    .evaluation--wrong .evaluation__num   { color: var(--lw-eval-wrong); }
    .evaluation__feedback {
      font-family: var(--lw-font-prose);
      font-size: var(--lw-text-body); line-height: 1.65;
      margin-bottom: var(--lw-space-md);
      max-width: var(--lw-measure);
    }
    .evaluation__cols {
      display: grid; grid-template-columns: 1fr 1fr; gap: var(--lw-space-xl); margin-bottom: var(--lw-space-md);
      ul { margin: var(--lw-space-xs) 0 0; padding-left: 17px; font-size: 13.5px; line-height: 1.55; }
      li { margin-bottom: 6px; }
      li::marker { color: var(--lw-ink-faint); }
    }
    .evaluation__h {
      display: flex; align-items: center; gap: 7px;
      font-family: var(--lw-font-mono); font-size: 10.5px; font-weight: 500;
      text-transform: uppercase; letter-spacing: var(--lw-tracking-micro);
      color: var(--lw-ink-muted);
      margin: var(--lw-space-md) 0 4px;
    }
    .evaluation__h--good { color: var(--lw-eval-correct); }
    .evaluation__h--warn { color: var(--lw-eval-partial); }
    .evaluation__tip {
      display: flex; gap: 10px; align-items: flex-start;
      background: var(--lw-paper-sunken);
      border-radius: var(--lw-radius);
      padding: 12px 15px;
      font-family: var(--lw-font-prose);
      font-size: 14.5px; line-height: 1.6;
      margin-top: var(--lw-space-md);
      lw-icon { color: var(--lw-accent); margin-top: 3px; flex-shrink: 0; }
    }
    .evaluation__viewcode { margin-left: auto; align-self: center; }

    /* ---- modal do código ---- */
    .cmodal {
      position: fixed; inset: 0; z-index: 150;
      display: flex; align-items: center; justify-content: center;
      padding: var(--lw-space-xl);
      background: var(--lw-scrim);
      backdrop-filter: blur(3px);
      -webkit-backdrop-filter: blur(3px);
    }
    .cmodal__card {
      width: min(680px, 100%);
      max-height: 86vh;
      display: flex; flex-direction: column;
      background: var(--lw-paper-raised);
      border: 1px solid var(--lw-rule);
      border-radius: var(--lw-radius);
      box-shadow: var(--lw-lift-lg);
      overflow: hidden;
    }
    .cmodal__head {
      display: flex; align-items: center; justify-content: space-between;
      padding: var(--lw-space-md) var(--lw-space-lg);
      border-bottom: 1px solid var(--lw-rule);
      h3 { display: flex; align-items: center; gap: var(--lw-space-sm); font-size: var(--lw-text-h3); }
    }
    .cmodal__body { padding: var(--lw-space-lg); overflow-y: auto; }
    .cmodal__subtitle {
      display: flex; align-items: center; gap: 7px;
      font-family: var(--lw-font-mono); font-size: 10.5px;
      text-transform: uppercase; letter-spacing: var(--lw-tracking-micro);
      color: var(--lw-ink-faint);
      margin: var(--lw-space-lg) 0 var(--lw-space-sm);
    }
    .tests__row--neutral { color: var(--lw-ink-muted); }

    .tests { display: flex; flex-direction: column; gap: 5px; margin-bottom: var(--lw-space-md); }
    .tests__row {
      display: flex; align-items: center; gap: 9px;
      font-size: 13px;
      color: var(--lw-eval-wrong);
      code { overflow-x: auto; color: var(--lw-ink); }
    }
    .tests__row--pass { color: var(--lw-eval-correct); }

    .suggestion {
      margin-top: var(--lw-space-md);
      summary { cursor: pointer; font-size: 13px; font-weight: 550; color: var(--lw-accent-deep); }
      pre {
        margin-top: var(--lw-space-sm);
        background: var(--lw-code-bg);
        border: 1px solid var(--lw-rule);
        border-radius: var(--lw-radius);
        padding: var(--lw-space-md);
        font-size: 12.5px;
        line-height: 1.6;
        overflow-x: auto;
        white-space: pre-wrap;
      }
    }

    /* ---- veredito: o elemento-assinatura, em três estados ---- */
    .question__actions {
      display: flex; align-items: center; justify-content: flex-end; gap: var(--lw-space-lg);
      padding-top: var(--lw-space-lg);
      margin-top: var(--lw-space-xl);
      border-top: 1px solid var(--lw-rule);
      flex-wrap: wrap;
    }
    .verdict {
      display: flex; align-items: center; gap: 9px;
      font-family: var(--lw-font-display);
      font-variation-settings: var(--lw-display-variation);
      font-weight: 600; font-size: var(--lw-text-h3);
      margin-right: auto;
      b { color: inherit; font-family: var(--lw-font-mono); font-size: 13px; font-weight: 500; }
    }
    .verdict--correct { color: var(--lw-eval-correct); }
    .verdict--partial { color: var(--lw-eval-partial); }
    .verdict--wrong   { color: var(--lw-eval-wrong); }

    /* ---- resumo: a página de colofão ---- */
    .summary { display: flex; flex-direction: column; align-items: center; text-align: center; padding: var(--lw-space-2xl) 0; }
    .summary h1 { font-size: var(--lw-text-display); margin: var(--lw-space-xl) 0 var(--lw-space-xs); }
    .summary > .muted { font-family: var(--lw-font-prose); font-size: 17px; max-width: 46ch; }
    .summary__score-panel {
      display: flex; flex-direction: column; align-items: center; gap: var(--lw-space-sm);
      width: 210px; padding: var(--lw-space-xl);
      border-top: 2px solid var(--lw-ink);
      border-bottom: 1px solid var(--lw-rule);
    }
    .summary__score {
      font-size: 68px; font-weight: 500; line-height: 1;
      small { font-size: 24px; color: var(--lw-ink-faint); }
    }
    .summary__bar {
      width: 100%; height: 4px;
      background: var(--lw-paper-deep);
      border-radius: 999px;
      overflow: hidden;
      span {
        display: block; height: 100%;
        background: var(--lw-eval-correct);
        border-radius: 999px;
        transition: width var(--lw-dur-slow) var(--lw-ease-out);
      }
    }
    .summary__bar--low span { background: var(--lw-eval-partial); }

    .summary__stats {
      display: flex; margin: var(--lw-space-2xl) 0;
      border-top: 1px solid var(--lw-rule);
      border-bottom: 1px solid var(--lw-rule);
      flex-wrap: wrap; justify-content: center;
    }
    .sstat {
      display: flex; flex-direction: column; align-items: center; gap: 3px;
      min-width: 132px; padding: var(--lw-space-lg);
      background: none; border: none; border-radius: 0;
      lw-icon { color: var(--lw-ink-faint); margin-bottom: 3px; }
      b {
        font-family: var(--lw-font-display);
        font-variation-settings: var(--lw-display-variation);
        font-variant-numeric: tabular-nums;
        font-size: var(--lw-text-h2); font-weight: 500;
      }
      span {
        font-size: 10px; color: var(--lw-ink-faint);
        font-family: var(--lw-font-mono); text-transform: uppercase; letter-spacing: var(--lw-tracking-micro);
      }
    }
    .sstat + .sstat { border-left: 1px solid var(--lw-rule-hair); }

    .summary__achievements { display: flex; flex-direction: column; gap: var(--lw-space-sm); margin-bottom: var(--lw-space-xl); width: min(420px, 100%); }
    .achievement {
      display: flex; align-items: center; gap: var(--lw-space-md);
      padding: var(--lw-space-md) var(--lw-space-lg);
      border-color: var(--lw-eval-partial-edge);
      background: var(--lw-eval-partial-bg);
      text-align: left;
      strong { font-family: var(--lw-font-display); font-variation-settings: var(--lw-display-variation); font-size: var(--lw-text-h3); font-weight: 600; }
    }
    .achievement__icon {
      width: 38px; height: 38px; flex-shrink: 0;
      border-radius: 999px;
      display: flex; align-items: center; justify-content: center;
      background: var(--lw-paper-raised); color: var(--lw-eval-partial);
      border: 1px solid var(--lw-eval-partial-edge);
    }
    .summary__actions { display: flex; gap: var(--lw-space-md); flex-wrap: wrap; justify-content: center; }

    .confetti { position: fixed; inset: 0; pointer-events: none; z-index: 200; overflow: hidden; }
    .confetti__piece {
      position: absolute;
      top: -12px;
      width: 7px; height: 11px;
      border-radius: 1px;
      animation: lw-confetti-fall 1.6s ease-in forwards;
    }

    @media (max-width: 640px) {
      .head { flex-wrap: wrap; }
      .theory { padding: var(--lw-space-lg) var(--lw-space-md); }
      .question { padding: var(--lw-space-lg) var(--lw-space-md); }
      .question__text { font-size: var(--lw-text-h3); }
      .evaluation { padding-left: var(--lw-space-lg); }
      .evaluation__cols { grid-template-columns: 1fr; gap: var(--lw-space-md); }
      .hide-sm { display: none; }
      .foot { flex-direction: column; align-items: stretch; text-align: center; }
      .summary__stats { flex-direction: column; }
      .sstat + .sstat { border-left: none; border-top: 1px solid var(--lw-rule-hair); }
    }
  `],
})
export class LessonPlayer implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private session = inject(StudySessionService);
  private chatSession = inject(AiChatSessionService);
  private presence = inject(PresenceService);

  readonly phase = signal<Phase>('loading');
  readonly lesson = signal<LessonDetail | null>(null);
  readonly currentIndex = signal(0);
  readonly feedback = signal<AnswerResult | null>(null);
  readonly submitting = signal(false);
  readonly completion = signal<CompleteLessonResult | null>(null);
  readonly chatOpen = signal(false);
  readonly hintOpen = signal(false);
  readonly codeModalOpen = signal(false);
  readonly submittedCode = signal('');
  readonly shakeIt = signal(false);
  readonly pulseIt = signal(false);
  readonly confetti = signal<ConfettiPiece[]>([]);
  readonly unlocked = signal<Achievement[]>([]);

  readonly selectedOptionId = signal<string | null>(null);
  answerText = '';
  challengeCode = '';

  private results: AnswerResult[] = [];
  /**
   * Início da questão no relógio de presença: o tempo fora da tela não conta
   * como tempo de resposta (ver PresenceService).
   */
  private questionStartedAt = 0;

  readonly currentQuestion = computed<Question | null>(() => {
    const l = this.lesson();
    return l ? (l.questions[this.currentIndex()] ?? null) : null;
  });

  readonly questionProgress = computed(() => {
    const total = this.lesson()?.questions.length ?? 0;
    if (total === 0) return 0;
    const answered = this.currentIndex() + (this.feedback() ? 1 : 0);
    return (answered / total) * 100;
  });

  readonly isLast = computed(() => {
    const total = this.lesson()?.questions.length ?? 0;
    return this.currentIndex() >= total - 1;
  });

  /** Estado de avaliação em três níveis — "parcial" tem forma e cor próprias. */
  readonly verdictState = computed<Verdict>(() => {
    const fb = this.feedback();
    if (!fb) return 'wrong';
    if (fb.correct) return 'correct';
    const ev = fb.descriptiveEvaluation ?? fb.codeEvaluation;
    if (ev && ev.score >= 50) return 'partial';
    return 'wrong';
  });

  readonly verdictIcon = computed(() => {
    switch (this.verdictState()) {
      case 'correct': return 'check';
      case 'partial': return 'trending-up';
      default: return 'x';
    }
  });

  readonly verdictLabel = computed(() => {
    switch (this.verdictState()) {
      case 'correct': return 'Mandou bem!';
      case 'partial': return 'Quase lá!';
      default: return 'Não foi dessa vez.';
    }
  });

  readonly correctCount = () => this.results.filter(r => r.correct).length;

  async ngOnInit(): Promise<void> {
    // O cronômetro conta apenas estudo de verdade: roda enquanto a lição está aberta.
    this.session.start();
    const lessonId = this.route.snapshot.paramMap.get('id')!;
    try {
      const [detail] = await Promise.all([
        firstValueFrom(this.api.lesson(lessonId)),
        firstValueFrom(this.api.startLesson(lessonId)),
      ]);
      detail.questions.sort((a, b) => a.orderIndex - b.orderIndex);
      this.lesson.set(detail);
      this.phase.set('theory');
    } catch (err) {
      this.toast.apiError(err, 'Não foi possível carregar a lição.');
      this.router.navigateByUrl('/trilha');
    }
  }

  ngOnDestroy(): void {
    this.session.end();
    this.chatSession.end();
  }

  startQuestions(): void {
    this.phase.set('question');
    this.resetQuestionState();
  }

  minChars(q: Question): number {
    return q.minChars ?? 50;
  }

  optionsOf(q: Question) {
    return [...(q.options ?? [])].sort((a, b) => a.orderIndex - b.orderIndex);
  }

  optionText(opt: { optionText?: string; text?: string }): string {
    return opt.optionText ?? opt.text ?? '';
  }

  letter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  isCorrectOption(id: string): boolean {
    return this.feedback()?.correctOptionId === id
      || (this.feedback()?.options?.find(o => o.id === id)?.correct ?? false);
  }

  isWrongSelected(id: string): boolean {
    const fb = this.feedback();
    return !!fb && fb.selectedOptionId === id && !this.isCorrectOption(id);
  }

  explanationOf(id: string): string | undefined {
    return this.feedback()?.options?.find(o => o.id === id)?.explanation;
  }

  canSubmit(): boolean {
    const q = this.currentQuestion();
    if (!q) return false;
    switch (q.type) {
      case 'MULTIPLE_CHOICE': return this.selectedOptionId() !== null;
      case 'DESCRIPTIVE': return this.answerText.trim().length >= this.minChars(q);
      case 'CODE_CHALLENGE': return this.challengeCode.trim().length > 0;
    }
  }

  async submit(): Promise<void> {
    const q = this.currentQuestion();
    if (!q || !this.canSubmit() || this.submitting()) return;
    this.submitting.set(true);
    const timeSpentSeconds = Math.max(1, Math.round((this.presence.activeMs() - this.questionStartedAt) / 1000));
    if (q.type === 'CODE_CHALLENGE') this.submittedCode.set(this.challengeCode);
    try {
      const result = await firstValueFrom(this.api.answerQuestion(q.id, {
        selectedOptionId: q.type === 'MULTIPLE_CHOICE' ? this.selectedOptionId()! : undefined,
        answerText: q.type === 'DESCRIPTIVE' ? this.answerText.trim() : undefined,
        code: q.type === 'CODE_CHALLENGE' ? this.challengeCode : undefined,
        timeSpentSeconds,
      }));
      this.results.push(result);
      this.feedback.set(result);
      this.celebrate(result);
    } catch (err) {
      this.toast.apiError(err, 'Não foi possível enviar a resposta.');
    } finally {
      this.submitting.set(false);
    }
  }

  private celebrate(result: AnswerResult): void {
    if (result.correct) {
      this.pulseIt.set(true);
      setTimeout(() => this.pulseIt.set(false), 550);
      this.burstConfetti();
    } else {
      this.shakeIt.set(true);
      setTimeout(() => this.shakeIt.set(false), 500);
    }
    for (const a of result.newAchievements ?? []) {
      this.toast.achievement(a.title, a.xpBonus, a.icon);
      this.unlocked.update(list => [...list, a]);
    }
  }

  async next(): Promise<void> {
    if (this.isLast()) {
      await this.finishLesson();
      return;
    }
    this.currentIndex.update(i => i + 1);
    this.resetQuestionState();
  }

  async finishLesson(): Promise<void> {
    const l = this.lesson();
    if (!l || this.submitting()) return;
    this.submitting.set(true);
    try {
      const done = await firstValueFrom(this.api.completeLesson(l.id));
      this.completion.set(done);
      for (const a of done.newAchievements ?? []) {
        this.toast.achievement(a.title, a.xpBonus, a.icon);
        this.unlocked.update(list => (list.some(x => x.id === a.id) ? list : [...list, a]));
      }
      if (done.xpEarned > 0) this.toast.xp(done.xpEarned, l.title);
      this.chatOpen.set(false);
      this.chatSession.end();
      this.phase.set('summary');
      if ((done.scorePercentage ?? 0) >= 60) this.burstConfetti(40);
      this.refreshUser();
    } catch (err) {
      this.toast.apiError(err, 'Não foi possível concluir a lição.');
    } finally {
      this.submitting.set(false);
    }
  }

  private resetQuestionState(): void {
    this.feedback.set(null);
    this.hintOpen.set(false);
    this.codeModalOpen.set(false);
    this.submittedCode.set('');
    this.selectedOptionId.set(null);
    this.answerText = '';
    this.challengeCode = this.currentQuestion()?.codeChallenge?.initialCode ?? '';
    this.questionStartedAt = this.presence.activeMs();
  }

  private burstConfetti(count = 26): void {
    const pieces: ConfettiPiece[] = Array.from({ length: count }, () => ({
      left: `${Math.random() * 100}%`,
      x: `${(Math.random() - 0.5) * 240}px`,
      y: `${window.innerHeight * (0.55 + Math.random() * 0.45)}px`,
      r: `${(Math.random() - 0.5) * 720}deg`,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      delay: `${Math.random() * 0.25}s`,
    }));
    this.confetti.set(pieces);
    setTimeout(() => this.confetti.set([]), 2100);
  }

  private async refreshUser(): Promise<void> {
    try {
      const profile = await firstValueFrom(this.api.profile());
      this.auth.setUser(profile.user);
    } catch {
      /* xp/streak atualizam no próximo load */
    }
  }
}
