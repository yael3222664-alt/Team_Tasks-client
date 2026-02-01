import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { AuthResponse, User } from '../../shared/interfaces/user';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  currentUser = signal<User | null>(this.getUserFromStorage());
  isLoading = signal<boolean>(false);
  authError = signal<string | null>(null);

  isLoggedIn = computed(() => !!this.currentUser());

  constructor(private http: HttpClient) {}

  register(userData: any): Observable<AuthResponse> {
    this.isLoading.set(true);

    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData).pipe(
      tap(res => {
        this.setSession(res);
        this.isLoading.set(false);
      }),
      catchError(err => {
        this.isLoading.set(false);
        return throwError(() => err);
      })
    );
  }

  login(credentials: any): Observable<AuthResponse> {
    this.isLoading.set(true);

    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe( 
      tap(res => {
        this.setSession(res);
        this.isLoading.set(false);
      }),
      catchError(err => {
        this.isLoading.set(false);
        return throwError(() => err);
      })
    );
  }

  private setSession(authResult: AuthResponse): void {
    localStorage.setItem('token', authResult.token); 
    localStorage.setItem('user', JSON.stringify(authResult.user));
    this.currentUser.set(authResult.user);
  }

  private getUserFromStorage(): User | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  logout(): void {
    localStorage.clear();
    this.currentUser.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem('token'); 
  }
}