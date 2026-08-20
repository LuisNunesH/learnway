import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards';

export const routes: Routes = [
  {
    path: 'entrar',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login').then(m => m.Login),
  },
  {
    path: 'registrar',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register').then(m => m.Register),
  },
  {
    path: 'oauth/callback',
    loadComponent: () => import('./features/auth/oauth-callback').then(m => m.OAuthCallback),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./features/shell/shell').then(m => m.Shell),
    children: [
      { path: '', loadComponent: () => import('./features/dashboard/dashboard').then(m => m.Dashboard) },
      { path: 'trilha', loadComponent: () => import('./features/trail/trail').then(m => m.TrailMap) },
      { path: 'teoria', loadComponent: () => import('./features/theory/theory').then(m => m.TheoryPage) },
      { path: 'licao/:id', loadComponent: () => import('./features/lesson/lesson').then(m => m.LessonPlayer) },
      { path: 'revisoes', loadComponent: () => import('./features/review/review').then(m => m.ReviewQueue) },
      { path: 'flashcards', loadComponent: () => import('./features/flashcards/flashcards').then(m => m.FlashcardsPage) },
      { path: 'ranking', loadComponent: () => import('./features/leaderboard/leaderboard').then(m => m.Leaderboard) },
      { path: 'calendario', loadComponent: () => import('./features/calendar/calendar').then(m => m.CalendarPage) },
      { path: 'perfil', loadComponent: () => import('./features/profile/profile').then(m => m.ProfilePage) },
    ],
  },
  { path: '**', redirectTo: '' },
];
