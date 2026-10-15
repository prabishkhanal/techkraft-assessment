import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SensitiveField } from './sensitive-field';

describe('SensitiveField', () => {
  let component: SensitiveField;
  let fixture: ComponentFixture<SensitiveField>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SensitiveField],
    }).compileComponents();

    fixture = TestBed.createComponent(SensitiveField);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
