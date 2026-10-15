import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RiskHistory } from './risk-history';

describe('RiskHistory', () => {
  let component: RiskHistory;
  let fixture: ComponentFixture<RiskHistory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RiskHistory],
    }).compileComponents();

    fixture = TestBed.createComponent(RiskHistory);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
