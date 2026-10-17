import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const notBlank: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  typeof control.value === 'string' && !control.value.trim() ? { blank: true } : null;

export const finiteNumber: ValidatorFn = (control) =>
  control.value == null || (typeof control.value === 'number' && Number.isFinite(control.value))
    ? null
    : { number: true };

export function digitsBetween(min: number, max = min): ValidatorFn {
  return (control) =>
    !control.value || new RegExp(`^\\d{${min},${max}}$`).test(control.value)
      ? null
      : { digits: { min, max } };
}
