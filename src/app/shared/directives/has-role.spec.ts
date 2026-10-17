import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HasRole } from './has-role';
import { SessionService } from '../../core/auth/session';
import { Role } from '../../core/models';
import { testUser } from '../../testing/fixtures';
@Component({ imports: [HasRole], template: '<p *appHasRole="roles">Admin action</p>' })
class Host {
  roles = [Role.Admin];
}
describe('HasRole', () => {
  it('adds and removes content as the session role changes', () => {
    const fixture = TestBed.createComponent(Host);
    const session = TestBed.inject(SessionService);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Admin action');
    session.login(testUser(Role.Admin));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Admin action');
    session.login(testUser(Role.Sales));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Admin action');
  });
});
