import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { SessionService } from '../../../core/auth/session';
import { AuthApi } from '../../../core/api/auth-api';
import { apiError } from '../../../core/api/api-error';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule],
  selector: 'app-login',
  styleUrl: './login.scss',
  templateUrl: './login.html',
})
export class Login {
  private readonly api = inject(AuthApi);
  private readonly destroy = inject(DestroyRef);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);
  readonly username = new FormControl('sales-user', { nonNullable: true });
  readonly form = new FormGroup({ username: this.username });
  readonly busy = signal(false);
  readonly error = signal('');
  login() {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    this.api
      .login(this.username.value)
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: (user) => {
          this.session.login(user);
          void this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.error.set(apiError(error));
          this.busy.set(false);
        },
      });
  }
}
