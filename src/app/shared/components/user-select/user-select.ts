import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../../interfaces/user';

@Component({
  selector: 'app-user-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-select.html',
  styleUrls: ['./user-select.css']
})
export class UserSelectComponent {
  @Input() selectedUserId: number | null = null;
  @Input() users: User[] = [];
  @Output() userSelected = new EventEmitter<number | null>();
  
  searchQuery = signal('');
  isOpen = signal(false);
  
  filteredUsers = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.users;
    return this.users.filter(u => 
      u.name.toLowerCase().includes(query) || 
      u.email.toLowerCase().includes(query)
    );
  });
  
  selectedUser = computed(() => {
    if (!this.selectedUserId) return null;
    return this.users.find(u => u.id === this.selectedUserId);
  });

  toggleDropdown() {
    this.isOpen.set(!this.isOpen());
    if (this.isOpen()) {
      this.searchQuery.set('');
    }
  }

  selectUser(userId: string | number | null) {
    this.userSelected.emit(userId ? Number(userId) : null);
    this.isOpen.set(false);
    this.searchQuery.set('');
  }

  getInitial(name: string): string {
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  getEmailInitial(email: string): string {
    return email ? email.charAt(0).toUpperCase() : '?';
  }

  isSelected(userId: number): boolean {
    return this.selectedUserId === userId;
  }
}
