import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login';
import { RegisterComponent } from './features/auth/register/register';
import { authGuard, guestGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'teams', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [guestGuard] },
  { 
    path: 'teams', 
    canActivate: [authGuard],
    loadComponent: () => import('./features/teams/teams').then(m => m.TeamsComponent) 
  },
  { 
    path: 'projects/:teamId', 
    canActivate: [authGuard],
    loadComponent: () => import('./features/projects/projects').then(m => m.ProjectsComponent) 
  },
  { 
    path: 'tasks/:projectId', 
    canActivate: [authGuard],
    loadComponent: () => import('./features/tasks/tasks').then(m => m.TasksComponent) 
  },
  {
    path: 'my-tasks',
    canActivate: [authGuard],
    loadComponent: () => import('./features/my-tasks/my-tasks').then(m => m.MyTasksComponent)
  },
  { path: '**', redirectTo: 'teams' }
];