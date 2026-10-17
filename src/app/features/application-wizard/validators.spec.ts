import { FormControl } from '@angular/forms';
import { digitsBetween, finiteNumber, notBlank } from './validators';
import { createMerchantForm } from './merchant-form';
describe('Merchant validation', () => {
  it('rejects whitespace-only fields', () => {
    expect(notBlank(new FormControl('   '))).toEqual({ blank: true });
    expect(notBlank(new FormControl('Demo Shop'))).toBeNull();
  });
  it('validates sensitive field lengths and rejects letters', () => {
    const validate = digitsBetween(8, 18);
    expect(validate(new FormControl('00001234'))).toBeNull();
    expect(validate(new FormControl('123'))).toBeTruthy();
    expect(validate(new FormControl('1234abcd'))).toBeTruthy();
    expect(validate(new FormControl('1'.repeat(19)))).toBeTruthy();
  });
  it('blocks invalid emails, phone numbers, and monthly volume', () => {
    const form = createMerchantForm();
    form.patchValue({ contactEmail: 'invalid', contactPhone: 'abc', estimatedMonthlyVolume: -1 });
    expect(form.controls.contactEmail.invalid).toBe(true);
    expect(form.controls.contactPhone.invalid).toBe(true);
    expect(form.controls.estimatedMonthlyVolume.invalid).toBe(true);
  });

  it('requires finite numeric amounts and accepts the monthly volume boundaries', () => {
    for (const value of [NaN, Infinity, -Infinity, '1000000']) {
      expect(finiteNumber(new FormControl(value))).toEqual({ number: true });
    }
    const control = createMerchantForm().controls.estimatedMonthlyVolume;
    for (const value of [1, 13750.5, 1000000000]) {
      control.setValue(value);
      expect(control.valid).toBe(true);
    }
    for (const value of [0, -1, NaN, 1000000001]) {
      control.setValue(value);
      expect(control.invalid).toBe(true);
    }
  });
});
