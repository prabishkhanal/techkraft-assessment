import { TestBed } from '@angular/core/testing';
import { ApplicationDetail } from './application-detail';

describe('ApplicationDetail', () => {
  let service: ApplicationDetail;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApplicationDetail);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
