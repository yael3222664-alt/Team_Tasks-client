import { Component, OnInit, OnDestroy, inject, signal, model, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ProjectsService } from '../../core/services/projects';
import { NotificationService } from '../../core/services/notification';
import { HeaderComponent } from '../../shared/components/header/header';
import { TeamsService } from '../../core/services/teams';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent],
  templateUrl: './projects.html',
  styleUrls: ['./projects.css']
})
export class ProjectsComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  public projectsService = inject(ProjectsService);
  private teamsService = inject(TeamsService);
  private notificationService = inject(NotificationService);
  private titleService = inject(Title);
  private destroy$ = new Subject<void>();
  
  teamId = signal<string | null>(null);
  teamName = signal<string>('');
  newProjectName = model('');
  newProjectDescription = model('');

  teamProjects = computed(() => {
    const currentTeamId = Number(this.teamId());
    const allProjects = this.projectsService.projects();
    return allProjects.filter(p => p.team_id === currentTeamId);
  });

  constructor() {
    effect(() => {
      this.teamProjects();
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('teamId');
    this.teamId.set(id);
    
    this.teamsService.getTeams()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          const team = this.teamsService.teams().find(t => t.id === id);
          if (team) {
            this.teamName.set(team.name);
            this.titleService.setTitle(`פרויקטים של צוות ${team.name} | TaskTeam`);
          }
        }
      });
    
    this.projectsService.getProjects()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: () => this.notificationService.showError('טעינת פרויקטים נכשלה')
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onCreateProject() {
    const id = this.teamId();
    const name = this.newProjectName().trim();
    const description = this.newProjectDescription().trim();
    if (id && name) {
      this.projectsService.createProject(id, name, description || undefined)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.newProjectName.set('');
            this.newProjectDescription.set('');
            this.notificationService.showSuccess('פרויקט נוצר בהצלחה!');
          },
          error: () => this.notificationService.showError('יצירת פרויקט נכשלה')
        });
    }
  }
}