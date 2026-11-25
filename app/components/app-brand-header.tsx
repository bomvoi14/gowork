import { APP_VERSION } from "../release";

export function AppBrandHeader() {
  return (
    <header className="app-brand-header" lang="en">
      <span className="app-brand-name">GTD-GoWork</span>
      <span className="app-version-chip">v{APP_VERSION}</span>
    </header>
  );
}
