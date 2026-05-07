import type { Account } from "../../contracts/src/account";

export function getAccount(accountId: string): Account {
  return { id: accountId, balanceCents: 5000 };
}
