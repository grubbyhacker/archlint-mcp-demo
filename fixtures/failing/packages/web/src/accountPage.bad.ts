import { postTransaction } from "../../ledger/src/postTransaction";

export function unsafeBrowserPost() {
  return postTransaction({ id: "txn_123", accountId: "acct_123", amountCents: 100 });
}
