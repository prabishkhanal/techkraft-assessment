import { Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RiskHistoryEntry } from '../../../core/models';

@Component({
  standalone: true,
  imports: [DatePipe],
  selector: 'app-risk-history',
  styleUrl: './risk-history.scss',
  templateUrl: './risk-history.html',
})
export class RiskHistory {
  readonly history = input<RiskHistoryEntry[]>([]);
}
