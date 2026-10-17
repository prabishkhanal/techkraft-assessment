import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { ApplicationDetail } from './application-detail';

describe('ApplicationDetail', () => {
  let service: ApplicationDetail;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        ApplicationDetail,
      ],
    });
    service = TestBed.inject(ApplicationDetail);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
