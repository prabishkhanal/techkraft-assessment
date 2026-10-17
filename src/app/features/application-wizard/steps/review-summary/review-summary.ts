import { Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ApplicationInput } from '../../../../core/api/applications-api';
import { MaskPipe } from '../../../../shared/pipes/mask-pipe';

@Component({
  standalone: true,
  imports: [DecimalPipe, MaskPipe],
  selector: 'app-review-summary',
  styleUrl: './review-summary.scss',
  templateUrl: './review-summary.html',
})
export class ReviewSummary {
  readonly data = input.required<ApplicationInput>();
  readonly storedTax = input('');
  readonly storedBank = input('');
}
