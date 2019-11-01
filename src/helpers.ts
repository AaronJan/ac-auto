export function sleepImmediate(): Promise<void> {
  return new Promise(resolve => setImmediate(resolve));
}
