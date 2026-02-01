import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, forkJoin, map, of } from 'rxjs';
import { Task } from '../../shared/interfaces/task';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TasksService {
  private readonly apiUrl = `${environment.apiUrl}/tasks`;
  
  tasks = signal<Task[]>([]);

  constructor(private http: HttpClient) {}

  getTasks(projectId: string): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}?projectId=${projectId}`).pipe(
      tap(tasks => this.tasks.set(tasks))
    );
  }

  loadAllProjectTasks(projectIds: string[]): Observable<Task[]> {
    if (projectIds.length === 0) {
      this.tasks.set([]);
      return of([]);
    }
    
    const taskRequests = projectIds.map(id => 
      this.http.get<Task[]>(`${this.apiUrl}?projectId=${id}`)
    );
    
    return forkJoin(taskRequests).pipe(
      map(taskArrays => {
        const allTasks = taskArrays.flat();
        this.tasks.set(allTasks);
        return allTasks;
      })
    );
  }

  createTask(taskData: Partial<Task>): Observable<Task> {
    const backendData = {
      projectId: taskData.project_id,
      title: taskData.title,
      description: taskData.description,
      status: taskData.status,
      priority: taskData.priority,
      assigneeId: taskData.assigned_to,
      dueDate: taskData.due_date
    };
    return this.http.post<Task>(this.apiUrl, backendData).pipe(
      tap(newTask => this.tasks.update(prev => [...prev, newTask]))
    );
  }

  updateTask(id: number, updates: Partial<Task>): Observable<Task> {
    const backendUpdates = {
      projectId: updates.project_id,
      title: updates.title,
      description: updates.description,
      status: updates.status,
      priority: updates.priority,
      assigneeId: updates.assigned_to,
      dueDate: updates.due_date
    };
    return this.http.patch<Task>(`${this.apiUrl}/${id}`, backendUpdates).pipe(
      tap(updatedTask => {
        this.tasks.update(prev => prev.map(t => t.id === id ? updatedTask : t));
      })
    );
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.tasks.update(prev => prev.filter(t => t.id !== id));
      })
    );
  }
}
