import { TestBed } from '@angular/core/testing';
import { Validators } from './validators';

describe('Validators', () => {
  let service: Validators;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Validators);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
