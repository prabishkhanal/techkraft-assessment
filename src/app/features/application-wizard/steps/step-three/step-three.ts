import { Component, effect, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MerchantForm } from '../../merchant-form';
import { FormField } from '../../../../shared/form-field/form-field';

@Component({
  standalone: true,
  imports: [FormField, ReactiveFormsModule, DecimalPipe],
  selector: 'app-step-three',
  styleUrl: './step-three.scss',
  templateUrl: './step-three.html',
})
export class StepThree {
  readonly form = input.required<MerchantForm>();
  readonly storedTax = input('');
  readonly storedBank = input('');
  readonly volumeOptions = [1000, 5000, 10000, 25000, 50000, 100000, 1000000];
  readonly volumeChoice = new FormControl('', { nonNullable: true });

  constructor() {
    effect((onCleanup) => {
      const control = this.form().controls.estimatedMonthlyVolume;
      const choiceFor = (value: number) =>
        this.volumeOptions.includes(value) ? String(value) : value ? 'custom' : '';
      // Loaded drafts select their preset, or expose the saved custom amount.
      this.volumeChoice.setValue(choiceFor(control.value), { emitEvent: false });
      const values = control.valueChanges.subscribe((value) => {
        if (this.volumeChoice.value !== 'custom') {
          this.volumeChoice.setValue(choiceFor(value), { emitEvent: false });
        }
      });
      const choices = this.volumeChoice.valueChanges.subscribe((choice) => {
        // Switching to Custom retains the current amount so it can be adjusted.
        if (choice === 'custom') return;
        control.setValue(choice ? Number(choice) : 0);
        control.markAsDirty();
      });
      onCleanup(() => {
        values.unsubscribe();
        choices.unsubscribe();
      });
    });
  }
}
