/* ================================================================
   UTILS — Math helpers for animations and interactions
   ================================================================ */

/** Linear interpolation between a and b */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Clamp value between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Map a value from one range to another */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
}

/** Normalize mouse position to -1..1 range */
export function normalizeMousePosition(
  x: number,
  y: number,
  width: number,
  height: number
): { nx: number; ny: number } {
  return {
    nx: (x / width) * 2 - 1,
    ny: -(y / height) * 2 + 1,
  };
}

/** Random float in range [min, max] */
export function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/** Smooth damp (spring-like interpolation) */
export function smoothDamp(
  current: number,
  target: number,
  velocity: { value: number },
  smoothTime: number,
  deltaTime: number,
  maxSpeed: number = Infinity
): number {
  smoothTime = Math.max(0.0001, smoothTime);
  const omega = 2.0 / smoothTime;
  const x = omega * deltaTime;
  const exp = 1.0 / (1.0 + x + 0.48 * x * x + 0.235 * x * x * x);
  let change = current - target;
  const maxChange = maxSpeed * smoothTime;
  change = clamp(change, -maxChange, maxChange);
  const adjustedTarget = current - change;
  const temp = (velocity.value + omega * change) * deltaTime;
  velocity.value = (velocity.value - omega * temp) * exp;
  let output = adjustedTarget + (change + temp) * exp;
  // Prevent overshooting
  if (target - current > 0.0 === output > target) {
    output = target;
    velocity.value = (output - target) / deltaTime;
  }
  return output;
}
