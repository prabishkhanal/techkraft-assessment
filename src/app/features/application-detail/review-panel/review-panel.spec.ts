import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { testApplication } from '../../../testing/fixtures';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReviewPanel } from './review-panel';

describe('ReviewPanel', () => {
  let component: ReviewPanel;
  let fixture: ComponentFixture<ReviewPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
      imports: [ReviewPanel],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewPanel);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('application', testApplication);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
