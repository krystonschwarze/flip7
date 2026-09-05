export type Hand = {
  numbers: number[];
  bonuses: number[];
  doubled: boolean;
  bust: boolean;
};
export const emptyHand = (): Hand => ({
  numbers: [],
  bonuses: [],
  doubled: false,
  bust: false,
});
export const isHand = (value: unknown): value is Hand => {
  if (!value || typeof value !== "object") return false;
  const h = value as Hand;
  return (
    Array.isArray(h.numbers) &&
    h.numbers.length <= 7 &&
    new Set(h.numbers).size === h.numbers.length &&
    h.numbers.every((n) => Number.isInteger(n) && n >= 0 && n <= 12) &&
    Array.isArray(h.bonuses) &&
    new Set(h.bonuses).size === h.bonuses.length &&
    h.bonuses.every((n) => [2, 4, 6, 8, 10].includes(n)) &&
    typeof h.doubled === "boolean" &&
    typeof h.bust === "boolean"
  );
};
export function handScore(hand: Hand): number {
  if (!isHand(hand)) throw new Error("Diese Kartenauswahl ist ungültig.");
  if (hand.bust) return 0;
  return (
    hand.numbers.reduce((sum, n) => sum + n, 0) * (hand.doubled ? 2 : 1) +
    hand.bonuses.reduce((sum, n) => sum + n, 0) +
    (hand.numbers.length === 7 ? 15 : 0)
  );
}
export const hasCards = (hand: Hand): boolean =>
  hand.numbers.length > 0 ||
  hand.bonuses.length > 0 ||
  hand.doubled ||
  hand.bust;
