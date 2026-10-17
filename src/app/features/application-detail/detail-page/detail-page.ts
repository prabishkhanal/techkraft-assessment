import { Component, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { ApplicationDetail } from '../application-detail';
import { PermissionService } from '../../../core/auth/permission';
import { SensitiveField } from '../sensitive-field/sensitive-field';
import { ReviewPanel } from '../review-panel/review-panel';
import { RiskHistory } from '../risk-history/risk-history';

@Component({
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    MatButtonModule,
    SensitiveField,
    ReviewPanel,
    RiskHistory,
  ],
  providers: [ApplicationDetail],
  selector: 'app-detail-page',
  styleUrl: './detail-page.scss',
  templateUrl: './detail-page.html',
})
export class DetailPage {
  readonly state = inject(ApplicationDetail);
  readonly permission = inject(PermissionService);
  private readonly route = inject(ActivatedRoute);
  constructor() {
    this.load();
  }
  load() {
    this.state.load(this.route.snapshot.paramMap.get('id')!);
  }
}
