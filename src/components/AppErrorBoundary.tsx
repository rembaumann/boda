import { Component, type ReactNode } from "react";
import { appConfig } from "../config/app.config";
import { AppFrame } from "./AppFrame";

type Props = { children: ReactNode };
type State = { message: string | null };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { message: null };

  static getDerivedStateFromError(error: Error): State {
    return { message: error.message };
  }

  componentDidCatch(error: Error): void {
    console.error(error);
  }

  render() {
    if (!this.state.message) return this.props.children;
    return (
      <AppFrame>
        <main className="screen">
          <h1 className="wordmark" translate="no">
            {appConfig.name}
          </h1>
          <p role="alert">{this.state.message}</p>
          <button type="button" className="primary" onClick={() => window.location.reload()}>
            Reload
          </button>
        </main>
      </AppFrame>
    );
  }
}
