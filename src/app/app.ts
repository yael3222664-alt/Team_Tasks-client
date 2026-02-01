import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { ThemeToggleComponent } from './shared/components/theme-toggle/theme-toggle';
import { HeaderComponent } from './shared/components/header/header';
import { BackToTopComponent } from './shared/components/back-to-top/back-to-top';
import { FooterComponent } from './shared/components/footer/footer';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ThemeToggleComponent, HeaderComponent, BackToTopComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private router = inject(Router);
  protected readonly title = signal('TaskTeam');
  protected isAuthPage = signal(false);

  constructor() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.isAuthPage.set(
          event.url.includes('/login') || event.url.includes('/register')
        );
      });
  }
}
