import { TestBed } from '@angular/core/testing';
import { DashboardQuery } from './dashboard-query';

describe('DashboardQuery', () => {
  let service: DashboardQuery;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DashboardQuery);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
