export const bank = {
  name: "The Nasal Bank",
  welcome:
    "Put some pretend coins into savings, or take them out when you’re ready to spend. Your coins are always yours. No fees!",
};
export function transferCoins(
  balance: number,
  savings: number,
  direction: "deposit" | "withdraw",
  coins: number,
) {
  if (!Number.isSafeInteger(coins) || coins <= 0)
    throw new Error("Choose a whole number of coins, at least 1.");
  if (direction === "deposit" && coins > balance)
    throw new Error("You don’t have that many coins in your pocket.");
  if (direction === "withdraw" && coins > savings)
    throw new Error("You don’t have that many coins in savings.");
  const change = direction === "deposit" ? -coins : coins;
  const next = { balance: balance + change, savings: savings - change };
  if (
    !Number.isSafeInteger(next.balance) ||
    !Number.isSafeInteger(next.savings)
  )
    throw new Error("That is too many coins to move at once.");
  return next;
}
