export type Money = number & { readonly __brand: "RWF" }

export const zeroMoney = 0 as Money

export function rwf(amount: number): Money {
  if (!Number.isInteger(amount)) {
    throw new Error(`Money must be a whole number of RWF, got ${amount}`)
  }
  if (amount < 0) {
    throw new Error(`Money cannot be negative, got ${amount}`)
  }
  return amount as Money
}

export function addMoney(a: Money, b: Money): Money {
  return rwf(a + b)
}

export function subtractMoney(a: Money, b: Money): Money {
  return rwf(a - b)
}

export function multiplyMoney(amount: Money, factor: number): Money {
  if (!Number.isInteger(factor)) {
    throw new Error(`Money can only be multiplied by a whole number, got ${factor}`)
  }
  return rwf(amount * factor)
}

export function sumMoney(amounts: Money[]): Money {
  return amounts.reduce(addMoney, zeroMoney)
}

export function formatMoney(amount: Money): string {
  return `${amount.toLocaleString("en-US")} RWF`
}
