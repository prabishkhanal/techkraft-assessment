import { FormControl, FormGroup, Validators } from '@angular/forms';
import { digitsBetween, finiteNumber, notBlank } from './validators';

const text = () =>
  new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, notBlank, Validators.maxLength(160)],
  });
export function createMerchantForm() {
  return new FormGroup({
    businessName: text(),
    businessType: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    registrationNumber: text(),
    contactName: text(),
    contactEmail: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email, Validators.maxLength(160)],
    }),
    contactPhone: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\+?[\d ()-]{7,20}$/)],
    }),
    taxId: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, digitsBetween(9)],
    }),
    bankAccountNumber: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, digitsBetween(8, 18)],
    }),
    estimatedMonthlyVolume: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, finiteNumber, Validators.min(1), Validators.max(1e9)],
    }),
  });
}
export type MerchantForm = ReturnType<typeof createMerchantForm>;
