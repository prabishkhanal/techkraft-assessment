import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import { Role } from '../../core/models';
import { SessionService } from '../../core/auth/session';

@Directive({
  standalone: true,
  selector: '[appHasRole]',
})
export class HasRole {
  readonly appHasRole = input.required<Role[]>();
  private readonly session = inject(SessionService);
  private readonly template = inject(TemplateRef);
  private readonly container = inject(ViewContainerRef);
  constructor() {
    effect(() => {
      this.container.clear();
      const role = this.session.role();
      if (role && this.appHasRole().includes(role))
        this.container.createEmbeddedView(this.template);
    });
  }
}
