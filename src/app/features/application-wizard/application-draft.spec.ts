import { TestBed } from '@angular/core/testing';
import { ApplicationDraft } from './application-draft';

describe('ApplicationDraft', () => {
  let service: ApplicationDraft;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApplicationDraft);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
