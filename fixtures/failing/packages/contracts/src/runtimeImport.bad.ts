import { requireSession } from "../../auth/src/session";

export type RuntimeBackedContract = ReturnType<typeof requireSession>;
