import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Subject, takeUntil } from 'rxjs';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { TasksService } from '../../core/services/tasks';
import { Task, TaskPriority, TaskStatus } from '../../shared/interfaces/task';
import { TaskCommentsComponent } from '../../shared/components/task-comments/task-comments';
import { UsersService } from '../../core/services/users';
import { NotificationService } from '../../core/services/notification';
import { UserSelectComponent } from '../../shared/components/user-select/user-select';
import { HeaderComponent } from '../../shared/components/header/header';
import { ProjectsService } from '../../core/services/projects';
import { TeamsService } from '../../core/services/teams';
import { User } from '../../shared/interfaces/user';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, TaskCommentsComponent, UserSelectComponent, HeaderComponent, DragDropModule],
  templateUrl: './tasks.html',
  styleUrls: ['./tasks.css']
})
export class TasksComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  public tasksService = inject(TasksService);
  private projectsService = inject(ProjectsService);
  private usersService = inject(UsersService);
  private teamsService = inject(TeamsService);
  private notificationService = inject(NotificationService);
  private titleService = inject(Title);
  private destroy$ = new Subject<void>();
  
  users = this.usersService.users;

  projectId = signal<string | null>(null);
  projectName = signal<string>('');
  teamId = signal<string | null>(null);
  teamMembers = signal<User[]>([]);
  selectedTask = signal<Task | null>(null);
  
  isModalOpen = signal(false);
  isEditMode = signal(false);
  modalStatus = signal<TaskStatus>('Backlog');
  
  taskTitle = signal('');
  taskDescription = signal('');
  taskPriority = signal<TaskPriority>('medium');
  taskAssignedTo = signal<number | null>(null);
  taskDueDate = signal('');
  editingTaskId = signal<number | null>(null);
  
  deleteTaskId = signal<number | null>(null);
  isDeleteConfirmOpen = signal(false);
  
  notification = signal<{message: string, type: 'success' | 'error' | 'info' | 'warning'} | null>(null);

  backlogTasks = computed(() => 
    this.tasksService.tasks().filter(t => t.status === 'Backlog')
  );
  inProgressTasks = computed(() => 
    this.tasksService.tasks().filter(t => t.status === 'In Progress')
  );
  doneTasks = computed(() => 
    this.tasksService.tasks().filter(t => t.status === 'Done')
  );

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('projectId');
    if (id) {
      this.projectId.set(id);
      this.loadTasks(id);
      
      this.projectsService.getProjects()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            const project = this.projectsService.projects().find(p => p.id === Number(id));
            if (project) {
              this.projectName.set(project.name);
              this.titleService.setTitle(`משימות של פרויקט ${project.name} | TaskTeam`);
              this.teamId.set(project.team_id.toString());
              this.loadTeamMembers(project.team_id.toString());
            }
          }
        });
    }
    this.usersService.getUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: () => this.notificationService.showError('טעינת משתמשים נכשלה')
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTasks(projectId: string) {
    this.tasksService.getTasks(projectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: () => this.notificationService.showError('טעינת משימות נכשלה')
      });
  }

  loadTeamMembers(teamId: string) {
    this.teamsService.getTeamMembers(teamId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (members) => this.teamMembers.set(members),
        error: () => this.notificationService.showError('טעינת חברי צוות נכשלה')
      });
  }

  updateStatus(task: Task, newStatus: TaskStatus) {
    this.tasksService.updateTask(task.id, { status: newStatus })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.showNotification('סטטוס עודכן בהצלחה', 'success'),
        error: () => this.showNotification('עדכון סטטוס נכשל', 'error')
      });
  }

  onDeleteTask(taskId: number) {
    this.deleteTaskId.set(taskId);
    this.isDeleteConfirmOpen.set(true);
  }
  
  confirmDelete() {
    if (this.deleteTaskId()) {
      this.tasksService.deleteTask(this.deleteTaskId()!)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.showNotification('משימה נמחקה בהצלחה', 'success');
            this.isDeleteConfirmOpen.set(false);
            this.deleteTaskId.set(null);
          },
          error: () => this.showNotification('מחיקת משימה נכשלה', 'error')
        });
    }
  }
  
  cancelDelete() {
    this.isDeleteConfirmOpen.set(false);
    this.deleteTaskId.set(null);
  }

  // פונקציה להוספת משימה
  openAddTaskModal(status: TaskStatus) {
    this.isEditMode.set(false);
    this.modalStatus.set(status);
    this.resetForm();
    this.isModalOpen.set(true);
  }
  
  resetForm() {
    this.taskTitle.set('');
    this.taskDescription.set('');
    this.taskPriority.set('medium');
    this.taskAssignedTo.set(null);
    this.taskDueDate.set('');
    this.editingTaskId.set(null);
  }
  
  closeModal() {
    this.isModalOpen.set(false);
    this.resetForm();
  }
  
  submitTask() {
    if (!this.taskTitle().trim()) {
      this.showNotification('נא להזין כותרת למשימה', 'error');
      return;
    }
    
    if (this.isEditMode() && this.editingTaskId()) {
      this.updateExistingTask();
    } else {
      this.createNewTask();
    }
  }
  
  createNewTask() {
    if (!this.projectId()) return;
    
    const newTask: Partial<Task> = {
      title: this.taskTitle(),
      description: this.taskDescription() || null,
      status: this.modalStatus(),
      project_id: Number(this.projectId()!),
      priority: this.taskPriority(),
      assigned_to: this.taskAssignedTo(),
      due_date: this.taskDueDate() || null
    };

    this.tasksService.createTask(newTask)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showNotification('משימה נוצרה בהצלחה!', 'success');
          this.closeModal();
        },
        error: () => this.showNotification('יצירת משימה נכשלה', 'error')
      });
  }

  // עריכת משימה קיימת
  onEditTask(task: Task) {
    this.isEditMode.set(true);
    this.editingTaskId.set(task.id);
    this.taskTitle.set(task.title);
    this.taskDescription.set(task.description || '');
    this.taskPriority.set(task.priority);
    this.taskAssignedTo.set(task.assigned_to || null);
    this.taskDueDate.set(task.due_date || '');
    this.modalStatus.set(task.status);
    this.isModalOpen.set(true);
  }
  
  updateExistingTask() {
    const updates: Partial<Task> = {
      title: this.taskTitle(),
      description: this.taskDescription() || null,
      priority: this.taskPriority(),
      assigned_to: this.taskAssignedTo(),
      due_date: this.taskDueDate() || null,
      status: this.modalStatus()
    };

    this.tasksService.updateTask(this.editingTaskId()!, updates)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showNotification('משימה עודכנה בהצלחה!', 'success');
          this.closeModal();
        },
        error: () => this.showNotification('עדכון משימה נכשל', 'error')
      });
  }

  openTaskComments(task: Task) {
    this.selectedTask.set(task);
  }

  closeTaskComments() {
    this.selectedTask.set(null);
  }
  
  showNotification(message: string, type: 'success' | 'error' | 'info' | 'warning') {
    this.notification.set({ message, type });
    setTimeout(() => this.notification.set(null), 5000);
  }

  getUserName(userId: number): string {
    const user = this.users().find(u => u.id === userId);
    return user?.name || 'לא משויך';
  }

  getAssignedUser() {
    const userId = this.taskAssignedTo();
    if (!userId) return null;
    return this.teamMembers().find(u => u.id === userId);
  }

  drop(event: CdkDragDrop<Task[]>, newStatus: TaskStatus) {
    const task = event.item.data as Task;
    if (task.status !== newStatus) {
      this.updateStatus(task, newStatus);
    }
  }
}