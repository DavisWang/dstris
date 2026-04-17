import { ALL_PIECES, PieceType } from './pieces';

export class Bag7 {
  private queue: PieceType[] = [];

  constructor() {
    this.refill();
    this.refill();
  }

  peek(n: number): PieceType[] {
    while (this.queue.length < n + 1) this.refill();
    return this.queue.slice(0, n);
  }

  next(): PieceType {
    if (this.queue.length < 6) this.refill();
    return this.queue.shift()!;
  }

  private refill(): void {
    const bag = [...ALL_PIECES];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    this.queue.push(...bag);
  }
}
