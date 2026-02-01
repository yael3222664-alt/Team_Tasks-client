import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Subject, takeUntil, switchMap } from 'rxjs';
import { TasksService } from '../../core/services/tasks';
import { AuthService } from '../../core/services/auth';
import { ProjectsService } from '../../core/services/projects';
import { HeaderComponent } from '../../shared/components/header/header';
import { Task } from '../../shared/interfaces/task';

@Component({
  selector: 'app-my-tasks',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './my-tasks.html',
  styleUrls: ['./my-tasks.css']
})
export class MyTasksComponent implements OnInit, OnDestroy {
  private tasksService = inject(TasksService);
  private authService = inject(AuthService);
  private projectsService = inject(ProjectsService);
  private router = inject(Router);
  private titleService = inject(Title);
  private destroy$ = new Subject<void>();

  currentUser = this.authService.currentUser;
  allTasks = this.tasksService.tasks;

  myTasks = computed(() => {
    const userId = this.currentUser()?.id;
    if (!userId) return [];
    return this.allTasks().filter(task => {
      // השרת מחזיר assignee_id, לא assigned_to
      const taskAssigneeId = (task as any).assignee_id || task.assigned_to;
      return taskAssigneeId === userId;
    });
  });

  backlogTasks = computed(() => 
    this.myTasks().filter(t => t.status === 'Backlog')
  );
  
  inProgressTasks = computed(() => 
    this.myTasks().filter(t => t.status === 'In Progress')
  );
  
  doneTasks = computed(() => 
    this.myTasks().filter(t => t.status === 'Done')
  );

  ngOnInit() {
    const userName = this.currentUser()?.name || 'משתמש';
    this.titleService.setTitle(`המשימות של ${userName} | TaskTeam`);
    this.loadAllTasks();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAllTasks() {
    this.projectsService.getProjects()
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => {
          const projects = this.projectsService.projects();
          const projectIds = projects.map(p => p.id.toString());
          return this.tasksService.loadAllProjectTasks(projectIds);
        })
      )
      .subscribe({
        next: () => {},
        error: (err) => console.error('Error loading tasks:', err)
      });
  }

  goToTask(task: Task) {
    this.router.navigate(['/tasks', task.project_id]);
  }

  getPriorityClass(priority: string): string {
    return `badge-${priority}`;
  }

  getStatusClass(status: string): string {
    if (status === 'Backlog') return 'backlog';
    if (status === 'In Progress') return 'in-progress';
    if (status === 'Done') return 'done';
    return '';
  }
}
