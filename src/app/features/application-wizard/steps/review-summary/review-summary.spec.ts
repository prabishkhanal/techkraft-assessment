import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReviewSummary } from './review-summary';

describe('ReviewSummary', () => {
  let component: ReviewSummary;
  let fixture: ComponentFixture<ReviewSummary>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewSummary],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewSummary);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
