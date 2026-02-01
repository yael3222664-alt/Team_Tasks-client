import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Comment } from '../../shared/interfaces/comment';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CommentsService {
  private readonly apiUrl = `${environment.apiUrl}/comments`;
  
  comments = signal<Comment[]>([]);

  constructor(private http: HttpClient) {}

  getComments(taskId: number): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.apiUrl}?taskId=${taskId}`).pipe(
      tap(data => this.comments.set(data))
    );
  }

  createComment(taskId: number, body: string): Observable<Comment> {
    return this.http.post<Comment>(this.apiUrl, { taskId, body }).pipe(
      tap(newComment => {
        this.comments.update(current => [...current, newComment]);
      })
    );
  }
}
