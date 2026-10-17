import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, catchError, concatMap, finalize, of, startWith, switchMap, tap } from 'rxjs';
import { ApplicationsApi, ApplicationInput } from '../../core/api/applications-api';
import { apiError } from '../../core/api/api-error';
import { Application } from '../../core/models';

interface SaveJob {
  id: string | null;
  data: Partial<ApplicationInput>;
  revision: number;
  submit: boolean;
}

// Provided per wizard. concatMap keeps writes in order; a failed save never ends the queue.
@Injectable()
export class ApplicationDraft {
  private readonly api = inject(ApplicationsApi);
  private readonly jobs = new Subject<SaveJob>();
  private readonly resetQueue = new Subject<void>();
  private readonly destroy = inject(DestroyRef);
  readonly busy = signal(false);
  readonly message = signal('Draft loaded');
  readonly error = signal('');
  readonly savedRevision = signal(0);
  readonly submitted = signal<Application | null>(null);
  readonly application = signal<Application | null>(null);
  private pending = 0;
  constructor() {
    this.resetQueue
      .pipe(
        startWith(undefined),
        switchMap(() =>
          this.jobs.pipe(
            concatMap((job) => {
              if (this.submitted()) {
                this.pending--;
                this.busy.set(this.pending > 0);
                return of(null);
              }
              this.message.set(job.submit ? 'Submitting…' : 'Saving draft…');
              this.error.set('');
              // Resolve the ID when the job starts, after any queued creation finishes.
              const id = job.id ?? this.application()?.id;
              const write = id ? this.api.save(id, job.data) : this.api.create(job.data);
              return write.pipe(
                tap((app) => this.application.set(app)),
                switchMap((app) => (job.submit ? this.api.submit(app.id) : of(app))),
                tap((app) => {
                  this.savedRevision.set(job.revision);
                  this.message.set('All changes saved');
                  if (job.submit) this.submitted.set(app);
                }),
                catchError((error) => {
                  this.error.set(apiError(error));
                  this.message.set('Save failed. Your changes remain in this form.');
                  return of(null);
                }),
                finalize(() => {
                  this.pending--;
                  this.busy.set(this.pending > 0);
                }),
              );
            }),
          ),
        ),
        takeUntilDestroyed(this.destroy),
      )
      .subscribe();
  }
  reset() {
    this.resetQueue.next();
    this.pending = 0;
    this.busy.set(false);
    this.application.set(null);
    this.submitted.set(null);
    this.savedRevision.set(0);
    this.error.set('');
    this.message.set('Not saved yet');
  }
  save(id: string | null, data: Partial<ApplicationInput>, revision: number, submit = false) {
    this.pending++;
    this.busy.set(true);
    this.jobs.next({ id, data, revision, submit });
  }
}
