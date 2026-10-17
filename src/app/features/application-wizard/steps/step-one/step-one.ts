import { Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MerchantForm } from '../../merchant-form';
import { FormField } from '../../../../shared/form-field/form-field';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, FormField],
  selector: 'app-step-one',
  styleUrl: './step-one.scss',
  templateUrl: './step-one.html',
})
export class StepOne {
  readonly form = input.required<MerchantForm>();
}
