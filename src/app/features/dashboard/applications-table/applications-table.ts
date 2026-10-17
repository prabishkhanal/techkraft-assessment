import { Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Application } from '../../../core/models';

@Component({
  standalone: true,
  imports: [DatePipe, RouterLink],
  selector: 'app-applications-table',
  styleUrl: './applications-table.scss',
  templateUrl: './applications-table.html',
})
export class ApplicationsTable {
  readonly applications = input<Application[]>([]);
}
