import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Project } from '../../shared/interfaces/project';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProjectsService {
  private readonly apiUrl = `${environment.apiUrl}/projects`;
  projects = signal<Project[]>([]);

  constructor(private http: HttpClient) {}

  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(this.apiUrl).pipe(
      tap(data => this.projects.set(data))
    );
  }

  createProject(teamId: string, name: string, description?: string): Observable<Project> {
    const body: any = { teamId, name };
    if (description) {
      body.description = description;
    }
    return this.http.post<Project>(this.apiUrl, body).pipe(
      tap(newProject => {
        this.projects.update(current => [...current, newProject]);
      })
    );
  }
}