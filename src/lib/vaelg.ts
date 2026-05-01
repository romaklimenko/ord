// Frekvensgulvet sættes så ord uden korpusrang tilsammen får ca. 25 % af
// sandsynlighedsmassen, når der er ~30.000 ranked og ~37.000 ikke-ranked kort.
// Top-30k-frekvenser summer til ca. 1.0, så gulv * 67k ≈ 0.33 → 25 % andel.
const FREKVENS_GULV = 5e-6;

export function frekvensVægt(frekvens: number | undefined): number {
  return (frekvens ?? 0) + FREKVENS_GULV;
}

export function vægtetTilfældigt<T>(
  items: T[],
  vægt: (item: T) => number,
  tilfældig: () => number = Math.random,
): T {
  if (items.length === 0) {
    throw new Error("vægtetTilfældigt kaldt med tom liste.");
  }

  let total = 0;
  for (const item of items) {
    total += Math.max(0, vægt(item));
  }

  if (total <= 0) {
    return items[Math.floor(tilfældig() * items.length)];
  }

  let valgt = tilfældig() * total;
  for (const item of items) {
    valgt -= Math.max(0, vægt(item));
    if (valgt <= 0) {
      return item;
    }
  }

  return items[items.length - 1];
}
