import { Component, OnInit, OnDestroy, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeamsService } from '../../core/services/teams';
import { Router, RouterModule } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { AddMemberModalComponent } from '../../shared/components/add-member-modal/add-member-modal';
import { NotificationService } from '../../core/services/notification';
import { HeaderComponent } from '../../shared/components/header/header';
import { User } from '../../shared/interfaces/user';

@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, AddMemberModalComponent, HeaderComponent],
  templateUrl: './teams.html',
  styleUrls: ['./teams.css']
})
export class TeamsComponent implements OnInit, OnDestroy {
  
  public teamsService = inject(TeamsService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);
  private titleService = inject(Title);
  private destroy$ = new Subject<void>();
  
  newTeamName = signal('');
  currentTeamId = signal<string>('');
  currentTeamMembers = signal<User[]>([]);

  addMemberModal = viewChild<AddMemberModalComponent>('addMemberModal');

  ngOnInit() {
    this.titleService.setTitle('ניהול צוותים | TaskTeam');
    this.loadTeams();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTeams() {
    this.teamsService.getTeams()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: () => this.notificationService.showError('טעינת צוותים נכשלה')
      });
  }

  onCreateTeam() {
    const name = this.newTeamName().trim();
    if (name) {
      this.teamsService.createTeam(name)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.newTeamName.set('');
            this.notificationService.showSuccess('צוות נוצר בהצלחה!');
            this.loadTeams();
          },
          error: () => this.notificationService.showError('יצירת צוות נכשלה')
        });
    }
  }

  onViewProjects(teamId: string) {
    this.router.navigate(['/projects', teamId]);
  }

  onAddMember(teamId: string) {
    this.currentTeamId.set(teamId);
    this.teamsService.getTeamMembers(teamId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (members) => {
          this.currentTeamMembers.set(members);
          this.addMemberModal()?.open();
        },
        error: () => this.notificationService.showError('טעינת חברי צוות נכשלה')
      });
  }

  handleMemberAdded(data: { userId: number; role: string }) {
    const teamId = this.currentTeamId();
    if (!teamId) return;
    
    this.teamsService.getTeamMembers(teamId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (members) => {
          const isAlreadyMember = members.some(m => Number(m.id) === data.userId);
          
          if (isAlreadyMember) {
            this.notificationService.showError('המשתמש כבר חבר בצוות זה');
            return;
          }
          
          this.teamsService.addMember(Number(teamId), data.userId, data.role)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                this.notificationService.showSuccess('חבר נוסף בהצלחה!');
                this.loadTeams();
              },
              error: (err) => {
                const errorMsg = err.error?.error || 'שגיאה בהוספת חבר לצוות';
                this.notificationService.showError(errorMsg);
              }
            });
        },
        error: () => {
          this.notificationService.showError('שגיאה בבדיקת חברי הצוות');
        }
      });
  }
}