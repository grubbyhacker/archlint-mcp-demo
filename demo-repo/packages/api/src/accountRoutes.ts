import { requireSession } from "../../auth/src/session";
import { currentBalance } from "../../ledger/src/balance";
import { getAccount } from "./accountClient";

export function accountSummary() {
  const session = requireSession();
  const account = getAccount(session.accountId);
  return {
    account,
    balanceCents: currentBalance(account)
  };
}
