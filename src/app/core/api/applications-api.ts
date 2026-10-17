import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Application, PageResult, RiskHistoryEntry, RiskDecision } from '../models';

export type ApplicationInput = Pick<
  Application,
  | 'businessName'
  | 'businessType'
  | 'registrationNumber'
  | 'contactName'
  | 'contactEmail'
  | 'contactPhone'
  | 'taxId'
  | 'bankAccountNumber'
  | 'estimatedMonthlyVolume'
>;
export interface ApplicationQuery {
  search: string;
  status: string;
  page: number;
  pageSize: number;
}

@Injectable({ providedIn: 'root' })
export class ApplicationsApi {
  private readonly http = inject(HttpClient);
  list(query: ApplicationQuery) {
    return this.http.get<PageResult<Application>>('/api/applications', { params: { ...query } });
  }
  get(id: string) {
    return this.http.get<Application>(`/api/applications/${encodeURIComponent(id)}`);
  }
  create(data: Partial<ApplicationInput>) {
    return this.http.post<Application>('/api/applications', data);
  }
  save(id: string, data: Partial<ApplicationInput>) {
    return this.http.patch<Application>(`/api/applications/${id}`, data);
  }
  submit(id: string) {
    return this.http.post<Application>(`/api/applications/${id}/submit`, {});
  }
  history(id: string) {
    return this.http.get<RiskHistoryEntry[]>(`/api/applications/${id}/history`);
  }
  sensitive(id: string) {
    return this.http.get<Pick<Application, 'taxId' | 'bankAccountNumber'>>(
      `/api/applications/${id}/sensitive`,
    );
  }
  decide(id: string, decision: RiskDecision, comment: string) {
    return this.http.post<Application>(`/api/applications/${id}/decision`, { decision, comment });
  }
  reviewers() {
    return this.http.get<{ username: string }[]>('/api/reviewers');
  }
  assign(id: string, assignedTo: string | null) {
    return this.http.post<Application>(`/api/applications/${id}/assignment`, { assignedTo });
  }
}
