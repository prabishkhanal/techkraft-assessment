import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  standalone: true,
  name: 'mask',
})
export class MaskPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return value ? '••••' + value.slice(-4) : 'Not provided';
  }
}
