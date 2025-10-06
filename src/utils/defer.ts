export function defer(fn: () => void): number {
  return requestAnimationFrame(fn);
}

export function cancelDefer(deferId: number): void {
  cancelAnimationFrame(deferId);
}
