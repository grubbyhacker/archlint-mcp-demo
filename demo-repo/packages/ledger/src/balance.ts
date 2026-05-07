import type { Account } from "../../contracts/src/account";

export function currentBalance(account: Account): number {
  return account.balanceCents;
}
