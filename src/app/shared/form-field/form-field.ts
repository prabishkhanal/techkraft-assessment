import { Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-form-field',
  imports: [ReactiveFormsModule],
  template: `
    <label [for]="name()">{{ label() }}</label>
    <!-- A static numeric type lets Angular select NumberValueAccessor. -->
    @if (type() === 'number') {
      <input
        type="number"
        [id]="name()"
        [formControl]="control()"
        [placeholder]="placeholder()"
        [attr.inputmode]="inputMode()"
        [attr.min]="min()"
        [attr.max]="max()"
        step="any"
        [attr.aria-invalid]="control().touched && control().invalid"
        [attr.aria-describedby]="name() + '-hint'"
        autocomplete="off"
      />
    } @else {
      <input
        [id]="name()"
        [type]="type()"
        [formControl]="control()"
        [placeholder]="placeholder()"
        [attr.inputmode]="inputMode()"
        [attr.aria-invalid]="control().touched && control().invalid"
        [attr.aria-describedby]="name() + '-hint'"
        autocomplete="off"
      />
    }
    <p
      [id]="name() + '-hint'"
      class="field-hint"
      [class.error]="control().touched && control().invalid"
    >
      {{ control().touched && control().invalid ? errorMessage() : hint() }}
    </p>
  `,
})
export class FormField {
  readonly control = input.required<FormControl>();
  readonly name = input.required<string>();
  readonly label = input.required<string>();
  readonly type = input('text');
  readonly placeholder = input('');
  readonly inputMode = input('text');
  readonly hint = input('');
  readonly min = input<number | null>(null);
  readonly max = input<number | null>(null);
  errorMessage() {
    const errors = this.control().errors || {};
    if (errors['required'] || errors['blank']) return `${this.label()} is required.`;
    if (errors['email']) return 'Enter a valid email address.';
    if (errors['number']) return 'Enter a valid numeric amount.';
    if (errors['digits'])
      return `Use ${errors['digits'].min === errors['digits'].max ? errors['digits'].min : errors['digits'].min + '–' + errors['digits'].max} digits.`;
    if (errors['min'] || errors['max']) return 'Enter a value from 1 to 1,000,000,000.';
    if (errors['maxlength']) return 'Use no more than 160 characters.';
    return 'Enter a valid phone number (7–20 characters).';
  }
}
