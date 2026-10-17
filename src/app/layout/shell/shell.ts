import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { SessionService } from '../../core/auth/session';
import { PermissionService } from '../../core/auth/permission';

@Component({
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatButtonModule],
  selector: 'app-shell',
  styleUrl: './shell.scss',
  templateUrl: './shell.html',
})
export class Shell {
  readonly session = inject(SessionService);
  readonly permission = inject(PermissionService);
  private readonly router = inject(Router);
  logout() {
    void this.router.navigate(['/login']).then((left) => {
      if (left) this.session.logout();
    });
  }
}
