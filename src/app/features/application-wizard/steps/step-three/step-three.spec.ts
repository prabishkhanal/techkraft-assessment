import { createMerchantForm } from '../../merchant-form';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StepThree } from './step-three';

describe('StepThree', () => {
  let component: StepThree;
  let fixture: ComponentFixture<StepThree>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepThree],
    }).compileComponents();

    fixture = TestBed.createComponent(StepThree);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('form', createMerchantForm());
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  function choose(value: string) {
    const select = fixture.nativeElement.querySelector('#monthlyVolumeOption') as HTMLSelectElement;
    select.value = value;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  it('writes a preset as a numeric amount and hides the custom input', () => {
    choose('1000000');
    expect(component.form().controls.estimatedMonthlyVolume.value).toBe(1000000);
    expect(fixture.nativeElement.querySelector('#estimatedMonthlyVolume')).toBeNull();
    expect(component.form().controls.estimatedMonthlyVolume.valid).toBe(true);
  });

  it('accepts a custom decimal amount as a number and can switch back to a preset', () => {
    choose('custom');
    const input = fixture.nativeElement.querySelector(
      '#estimatedMonthlyVolume',
    ) as HTMLInputElement;
    input.value = '13750.50';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(component.form().controls.estimatedMonthlyVolume.value).toBe(13750.5);
    expect(component.volumeChoice.value).toBe('custom');
    choose('5000');
    expect(component.form().controls.estimatedMonthlyVolume.value).toBe(5000);
    expect(fixture.nativeElement.querySelector('#estimatedMonthlyVolume')).toBeNull();
  });

  it('restores an existing custom value without changing it or emitting a save', () => {
    const form = createMerchantForm();
    form.controls.estimatedMonthlyVolume.setValue(31415.75);
    const changes = vi.fn();
    form.valueChanges.subscribe(changes);
    fixture.componentRef.setInput('form', form);
    fixture.detectChanges();
    expect(component.volumeChoice.value).toBe('custom');
    expect(fixture.nativeElement.querySelector('#estimatedMonthlyVolume').value).toBe('31415.75');
    expect(changes).not.toHaveBeenCalled();
  });

  it('shows field errors for an out-of-range or empty custom amount', () => {
    choose('custom');
    const input = fixture.nativeElement.querySelector(
      '#estimatedMonthlyVolume',
    ) as HTMLInputElement;
    for (const value of ['-1', '1000000001', '']) {
      input.value = value;
      input.dispatchEvent(new Event('input'));
      input.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      expect(component.form().controls.estimatedMonthlyVolume.invalid).toBe(true);
      expect(input.getAttribute('aria-invalid')).toBe('true');
      expect(
        fixture.nativeElement
          .querySelector('#estimatedMonthlyVolume-hint')
          .classList.contains('error'),
      ).toBe(true);
    }
  });
});
