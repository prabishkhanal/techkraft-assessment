import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ApplicationsTable } from './applications-table';

describe('ApplicationsTable', () => {
  let component: ApplicationsTable;
  let fixture: ComponentFixture<ApplicationsTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationsTable],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationsTable);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
