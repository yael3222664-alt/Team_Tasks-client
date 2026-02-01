import { Component, OnInit, inject, signal, output, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../../../core/services/users';
import { User } from '../../interfaces/user';
import { NotificationService } from '../../../core/services/notification';
import { UserSelectComponent } from '../user-select/user-select';

@Component({
  selector: 'app-add-member-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, UserSelectComponent],
  templateUrl: './add-member-modal.html',
  styleUrls: ['./add-member-modal.css']
})
export class AddMemberModalComponent implements OnInit {
  private usersService = inject(UsersService);
  private notificationService = inject(NotificationService);
  
  isOpen = signal(false);
  selectedUserId = signal<number | null>(null);
  selectedRole = signal<string>('member');
  
  teamMembers = input<User[]>([]);
  
  users = this.usersService.users;
  
  availableUsers = computed(() => {
    const allUsers = this.users();
    const members = this.teamMembers();
    const memberIds = members.map(m => m.id);
    return allUsers.filter(u => !memberIds.includes(u.id));
  });

  selectedUser = computed(() => {
    const userId = this.selectedUserId();
    if (!userId) return null;
    return this.users().find(u => u.id === userId);
  });
  
  memberAdded = output<{ userId: number; role: string }>();
  modalClosed = output<void>();

  ngOnInit() {
    this.usersService.getUsers().subscribe({
      error: () => this.notificationService.showError('טעינת משתמשים נכשלה')
    });
  }

  open() {
    this.isOpen.set(true);
    this.selectedUserId.set(null);
    this.selectedRole.set('member');
  }

  close() {
    this.isOpen.set(false);
    this.modalClosed.emit();
  }

  onUserSelected(userId: number | null) {
    this.selectedUserId.set(userId);
  }

  onSubmit() {
    const userId = this.selectedUserId();
    const role = this.selectedRole();
    
    if (!userId) {
      this.notificationService.showError('אנא בחר משתמש');
      return;
    }

    this.memberAdded.emit({ 
      userId: userId, 
      role 
    });
    this.close();
  }
}
