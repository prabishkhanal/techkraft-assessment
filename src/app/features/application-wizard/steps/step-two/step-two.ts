import { Component, input } from '@angular/core';
import { MerchantForm } from '../../merchant-form';
import { FormField } from '../../../../shared/form-field/form-field';

@Component({
  standalone: true,
  imports: [FormField],
  selector: 'app-step-two',
  styleUrl: './step-two.scss',
  templateUrl: './step-two.html',
})
export class StepTwo {
  readonly form = input.required<MerchantForm>();
}
