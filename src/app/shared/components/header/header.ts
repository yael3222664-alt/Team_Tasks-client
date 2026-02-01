import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth';
import { TasksService } from '../../../core/services/tasks';
import { ProjectsService } from '../../../core/services/projects';
import { TeamsService } from '../../../core/services/teams';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class HeaderComponent {
  authService = inject(AuthService);
  private router = inject(Router);
  private tasksService = inject(TasksService);
  private projectsService = inject(ProjectsService);
  private teamsService = inject(TeamsService);
  
  searchQuery = '';
  isSearchOpen = false;
  searchResults = signal<any[]>([]);

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleSearch() {
    this.isSearchOpen = !this.isSearchOpen;
    if (!this.isSearchOpen) {
      this.searchQuery = '';
    }
  }

  onSearch() {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) {
      this.searchResults.set([]);
      return;
    }

    const tasks = this.tasksService.tasks().filter(t => 
      t.title.toLowerCase().includes(query) || 
      t.description?.toLowerCase().includes(query)
    );

    const projects = this.projectsService.projects().filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.description?.toLowerCase().includes(query)
    );

    const teams = this.teamsService.teams().filter(t => 
      t.name.toLowerCase().includes(query)
    );

    this.searchResults.set([
      ...tasks.map(t => ({ type: 'task', data: t })),
      ...projects.map(p => ({ type: 'project', data: p })),
      ...teams.map(t => ({ type: 'team', data: t }))
    ]);
  }

  goToMyTasks() {
    this.router.navigate(['/my-tasks']);
  }

  navigateToResult(result: any) {
    if (result.type === 'task') {
      this.router.navigate(['/tasks', result.data.project_id]);
    } else if (result.type === 'project') {
      this.router.navigate(['/tasks', result.data.id]);
    } else if (result.type === 'team') {
      this.router.navigate(['/projects', result.data.id]);
    }
    this.isSearchOpen = false;
    this.searchQuery = '';
    this.searchResults.set([]);
  }

  getResultTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      task: 'משימה',
      project: 'פרויקט',
      team: 'צוות'
    };
    return labels[type] || type;
  }
}
