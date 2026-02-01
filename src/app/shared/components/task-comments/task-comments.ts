import { Component, Input, OnInit, inject, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommentsService } from '../../../core/services/comments';
import { NotificationService } from '../../../core/services/notification';
import { UsersService } from '../../../core/services/users';

@Component({
  selector: 'app-task-comments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-comments.html',
  styleUrls: ['./task-comments.css']
})
export class TaskCommentsComponent implements OnInit {
  @Input() taskId!: number;
  
  private commentsService = inject(CommentsService);
  private notificationService = inject(NotificationService);
  private usersService = inject(UsersService);
  newCommentBody = model('');
  
  comments = this.commentsService.comments;
  users = this.usersService.users;
  
  ngOnInit() {
    this.usersService.getUsers().subscribe();
    
    if (this.taskId) {
      this.commentsService.getComments(this.taskId).subscribe({
        error: () => this.notificationService.showError('טעינת תגובות נכשלה')
      });
    }
  }
  
  onAddComment() {
    const body = this.newCommentBody().trim();
    if (body && this.taskId) {
      this.commentsService.createComment(this.taskId, body).subscribe({
        next: () => {
          this.newCommentBody.set('');
        },
        error: () => this.notificationService.showError('הוספת תגובה נכשלה')
      });
    }
  }
  
  getEmailInitial(userId: number): string {
    const user = this.users().find(u => u.id === userId);
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return '?';
  }

  getUserName(userId: number): string {
    const user = this.users().find(u => u.id === userId);
    return user?.name || 'משתמש לא ידוע';
  }
}
