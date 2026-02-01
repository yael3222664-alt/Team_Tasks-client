import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Team } from '../../shared/interfaces/team';
import { User } from '../../shared/interfaces/user';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TeamsService {
  private readonly apiUrl = `${environment.apiUrl}/teams`;
  
  teams = signal<Team[]>([]);

  constructor(private http: HttpClient) {}

  getTeams(): Observable<Team[]> {
    return this.http.get<Team[]>(this.apiUrl).pipe(
      tap(data => this.teams.set(data))
    );
  }

  createTeam(name: string): Observable<Team> {
    return this.http.post<Team>(this.apiUrl, { name }).pipe(
      tap(() => this.getTeams().subscribe()) 
    );
  }

  addMember(teamId: number, userId: number, role: string = 'member'): Observable<any> {
    return this.http.post(`${this.apiUrl}/${teamId}/members`, { userId, role });
  }

  getTeamMembers(teamId: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/${teamId}/members`);
  }
}