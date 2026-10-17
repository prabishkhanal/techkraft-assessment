import { TestBed } from '@angular/core/testing';
import { FormControl, Validators } from '@angular/forms';
import { FormField } from './form-field';

describe('FormField', () => {
  it('keeps numeric input as a number for the API, rather than a numeric string', () => {
    TestBed.configureTestingModule({ imports: [FormField] });
    const fixture = TestBed.createComponent(FormField);
    const control = new FormControl(0, { nonNullable: true });
    fixture.componentRef.setInput('control', control);
    fixture.componentRef.setInput('name', 'volume');
    fixture.componentRef.setInput('label', 'Monthly volume');
    fixture.componentRef.setInput('type', 'number');
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = '1000000';
    input.dispatchEvent(new Event('input'));
    expect(control.value).toBe(1000000);
  });

  it('associates validation feedback with the input and clears it after correction', () => {
    TestBed.configureTestingModule({ imports: [FormField] });
    const fixture = TestBed.createComponent(FormField);
    const control = new FormControl('', { nonNullable: true, validators: Validators.required });
    fixture.componentRef.setInput('control', control);
    fixture.componentRef.setInput('name', 'business');
    fixture.componentRef.setInput('label', 'Business name');
    fixture.componentRef.setInput('hint', 'Use a fictional business.');
    control.markAsTouched();
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('business-hint');
    expect(fixture.nativeElement.querySelector('label').htmlFor).toBe(input.id);
    expect(fixture.nativeElement.textContent).toContain('Business name is required.');

    input.value = 'Demo Shop';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(control.value).toBe('Demo Shop');
    expect(input.getAttribute('aria-invalid')).toBe('false');
    expect(fixture.nativeElement.textContent).toContain('Use a fictional business.');
  });
});
