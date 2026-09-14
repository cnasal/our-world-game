export const resaleShop = {
  name: "The Nasal Resale Shop",
  welcome:
    "Trade things from your backpack for pretend coins. We pay half the shop price, rounded down. Each button sells one item.",
};
export const resalePrice = (price: number) => Math.floor(price / 2);
