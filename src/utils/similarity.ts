export function scoreSimilarity(target: string, actual: string): number {
  const normalize = (text: string) =>
    new Set(
      text
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .split(/\s+/)
        .filter((item) => item.length > 1)
    );

  const targetSet = normalize(target);
  const actualSet = normalize(actual);
  if (targetSet.size === 0) {
    return 0;
  }

  let overlap = 0;
  for (const word of targetSet) {
    if (actualSet.has(word)) {
      overlap += 1;
    }
  }

  return Math.round((overlap / targetSet.size) * 100);
}
