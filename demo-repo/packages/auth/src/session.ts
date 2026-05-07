export type Session = {
  userId: string;
  accountId: string;
};

export function requireSession(): Session {
  return { userId: "user_123", accountId: "acct_123" };
}
