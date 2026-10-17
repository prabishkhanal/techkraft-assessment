import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { testApplication } from '../../../../testing/fixtures';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReviewSummary } from './review-summary';

describe('ReviewSummary', () => {
  let component: ReviewSummary;
  let fixture: ComponentFixture<ReviewSummary>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
      imports: [ReviewSummary],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewSummary);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('data', testApplication);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
