/**
 * One-Euro Filter & Exponential Smoothing for Real-Time AR Tracking
 * Eliminates jitter, trembling, and lag in 60fps landmark positions.
 */

export class LowPassFilter {
  private y: number = 0;
  private s: number = 0;
  private initialized: boolean = false;

  filter(value: number, alpha: number): number {
    if (!this.initialized) {
      this.s = value;
      this.initialized = true;
    } else {
      this.s = alpha * value + (1 - alpha) * this.s;
    }
    this.y = this.s;
    return this.y;
  }

  reset() {
    this.initialized = false;
  }
}

export class OneEuroFilter {
  private minCutoff: number;
  private beta: number;
  private dCutoff: number;

  private xFilter = new LowPassFilter();
  private dxFilter = new LowPassFilter();
  private lastTime: number = 0;

  constructor(minCutoff = 1.0, beta = 0.007, dCutoff = 1.0) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
  }

  private alpha(cutoff: number, dt: number): number {
    const tau = 1.0 / (2 * Math.PI * cutoff);
    return 1.0 / (1.0 + tau / dt);
  }

  filter(value: number, timestamp: number): number {
    if (this.lastTime === 0) {
      this.lastTime = timestamp;
      return this.xFilter.filter(value, 1.0);
    }

    const dt = Math.max(0.001, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;

    const dx = (value - (this.xFilter['y'] || value)) / dt;
    const edx = this.dxFilter.filter(dx, this.alpha(this.dCutoff, dt));
    const cutoff = this.minCutoff + this.beta * Math.abs(edx);

    return this.xFilter.filter(value, this.alpha(cutoff, dt));
  }

  reset() {
    this.xFilter.reset();
    this.dxFilter.reset();
    this.lastTime = 0;
  }
}

export class Point3DSmoother {
  private xFilter: OneEuroFilter;
  private yFilter: OneEuroFilter;
  private scaleFilter: OneEuroFilter;
  private rotFilter: OneEuroFilter;
  private pitchFilter: OneEuroFilter;

  constructor() {
    this.xFilter = new OneEuroFilter(0.8, 0.005);
    this.yFilter = new OneEuroFilter(0.8, 0.005);
    this.scaleFilter = new OneEuroFilter(0.5, 0.003);
    this.rotFilter = new OneEuroFilter(1.2, 0.01);
    this.pitchFilter = new OneEuroFilter(1.0, 0.008);
  }

  smooth(point: { x: number; y: number; scale: number; rotation: number; pitch: number }, timestamp: number) {
    return {
      x: this.xFilter.filter(point.x, timestamp),
      y: this.yFilter.filter(point.y, timestamp),
      scale: this.scaleFilter.filter(point.scale, timestamp),
      rotation: this.rotFilter.filter(point.rotation, timestamp),
      pitch: this.pitchFilter.filter(point.pitch, timestamp),
    };
  }

  reset() {
    this.xFilter.reset();
    this.yFilter.reset();
    this.scaleFilter.reset();
    this.rotFilter.reset();
    this.pitchFilter.reset();
  }
}
