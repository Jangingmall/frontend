/**
 * `items`에서 서로 다른 `count`개를 무작위로 뽑는다(Fisher-Yates 부분 셔플).
 * `random`을 주입받아 테스트에서 결정적으로 고정할 수 있게 한다. `count`가 `items` 길이
 * 이상이면 전체를 셔플해 반환한다.
 */
export function pickRandomSample<T>(
  items: readonly T[],
  count: number,
  random: () => number = Math.random,
): T[] {
  const pool = [...items];
  const sampleSize = Math.min(count, pool.length);
  for (let i = 0; i < sampleSize; i++) {
    const j = i + Math.floor(random() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, sampleSize);
}
