import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationDraft } from './application-draft';
import { testApplication } from '../../testing/fixtures';
describe('ApplicationDraft', () => {
  let draft: ApplicationDraft;
  let backend: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ApplicationDraft, provideHttpClient(), provideHttpClientTesting()],
    });
    draft = TestBed.inject(ApplicationDraft);
    backend = TestBed.inject(HttpTestingController);
  });
  afterEach(() => backend.verify());
  it('serializes saves so an older write cannot overwrite a newer one', () => {
    draft.save('app-2', { businessName: 'First' }, 1);
    draft.save('app-2', { businessName: 'Second' }, 2);
    const first = backend.expectOne('/api/applications/app-2');
    expect(first.request.body.businessName).toBe('First');
    backend.expectNone('/api/applications/app-2');
    first.flush(testApplication);
    const second = backend.expectOne('/api/applications/app-2');
    expect(second.request.body.businessName).toBe('Second');
    second.flush(testApplication);
    expect(draft.savedRevision()).toBe(2);
    expect(draft.busy()).toBe(false);
  });
  it('keeps the queue usable after an error and supports explicit retry', () => {
    draft.save('app-2', { businessName: 'Retained' }, 1);
    backend
      .expectOne('/api/applications/app-2')
      .flush({ message: 'Try again' }, { status: 500, statusText: 'Error' });
    expect(draft.error()).toBe('Try again');
    expect(draft.savedRevision()).toBe(0);
    draft.save('app-2', { businessName: 'Retained' }, 1);
    backend.expectOne('/api/applications/app-2').flush(testApplication);
    expect(draft.error()).toBe('');
    expect(draft.savedRevision()).toBe(1);
  });
  it('waits for the latest save before submitting', () => {
    draft.save('app-2', { businessName: 'Final' }, 1, true);
    backend.expectNone('/api/applications/app-2/submit');
    backend.expectOne('/api/applications/app-2').flush(testApplication);
    backend.expectOne('/api/applications/app-2/submit').flush(testApplication);
    expect(draft.submitted()?.id).toBe('app-2');
  });

  it('creates once then updates the returned ID for snapshots queued during creation', () => {
    draft.save(null, { businessName: 'First' }, 1);
    draft.save(null, { businessName: 'Second' }, 2);
    const creation = backend.expectOne('/api/applications');
    expect(creation.request.method).toBe('POST');
    creation.flush(testApplication);
    const update = backend.expectOne('/api/applications/app-2');
    expect(update.request.method).toBe('PATCH');
    expect(update.request.body.businessName).toBe('Second');
    backend.expectNone('/api/applications');
    update.flush(testApplication);
    expect(draft.savedRevision()).toBe(2);
    expect(draft.busy()).toBe(false);
  });

  it('retains the created ID if submission fails so retry cannot create a duplicate', () => {
    draft.save(null, { businessName: 'Final' }, 1, true);
    backend.expectOne('/api/applications').flush(testApplication);
    backend
      .expectOne('/api/applications/app-2/submit')
      .flush({ message: 'Try again' }, { status: 503, statusText: 'Unavailable' });
    expect(draft.application()?.id).toBe('app-2');
    draft.save(null, { businessName: 'Final' }, 1, true);
    backend.expectOne('/api/applications/app-2').flush(testApplication);
    backend.expectOne('/api/applications/app-2/submit').flush(testApplication);
    backend.expectNone('/api/applications');
    expect(draft.submitted()?.id).toBe('app-2');
  });

  it('discards the previous record queue when the user confirms starting another form', () => {
    draft.save('app-2', { businessName: 'Old snapshot' }, 1);
    draft.save('app-2', { businessName: 'Queued old snapshot' }, 2);
    const old = backend.expectOne('/api/applications/app-2');
    draft.reset();
    expect(old.cancelled).toBe(true);
    expect(draft.busy()).toBe(false);
    expect(draft.application()).toBeNull();
    expect(draft.savedRevision()).toBe(0);
    draft.save(null, { businessName: 'New Demo' }, 1);
    const creation = backend.expectOne('/api/applications');
    expect(creation.request.body.businessName).toBe('New Demo');
    creation.flush({ ...testApplication, id: 'new-draft' });
    backend.expectNone('/api/applications/app-2');
    expect(draft.application()?.id).toBe('new-draft');
    expect(draft.busy()).toBe(false);
  });
});
