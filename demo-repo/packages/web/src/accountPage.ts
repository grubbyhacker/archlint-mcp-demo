import { getAccount } from "../../api/src/accountClient";
import type { Account } from "../../contracts/src/account";

export function renderAccountPage(accountId: string): Account {
  return getAccount(accountId);
}
