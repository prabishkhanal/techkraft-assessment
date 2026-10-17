import { MaskPipe } from './mask-pipe';
describe('MaskPipe', () => {
  const pipe = new MaskPipe();
  it('shows only the last four characters', () =>
    expect(pipe.transform('000000001234')).toBe('••••1234'));
  it('handles absent values', () => expect(pipe.transform(null)).toBe('Not provided'));
});
