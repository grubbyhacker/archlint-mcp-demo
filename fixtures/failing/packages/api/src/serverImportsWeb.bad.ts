import { renderAccountPage } from "../../web/src/accountPage";

export function invalidApiRender() {
  return renderAccountPage("acct_123");
}
