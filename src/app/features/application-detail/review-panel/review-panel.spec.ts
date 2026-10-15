import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReviewPanel } from './review-panel';

describe('ReviewPanel', () => {
  let component: ReviewPanel;
  let fixture: ComponentFixture<ReviewPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewPanel],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewPanel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
