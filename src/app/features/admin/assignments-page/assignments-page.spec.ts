import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AssignmentsPage } from './assignments-page';

describe('AssignmentsPage', () => {
  let component: AssignmentsPage;
  let fixture: ComponentFixture<AssignmentsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssignmentsPage],
    }).compileComponents();

    fixture = TestBed.createComponent(AssignmentsPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
