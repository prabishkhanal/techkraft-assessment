import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WizardContainer } from './wizard-container';

describe('WizardContainer', () => {
  let component: WizardContainer;
  let fixture: ComponentFixture<WizardContainer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WizardContainer],
    }).compileComponents();

    fixture = TestBed.createComponent(WizardContainer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
