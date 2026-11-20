import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

// A figure failure should not take the lesson shell down with it.
export default class LabErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="figure-error" role="alert">
          <p><strong>This figure hit an error.</strong> The rest of the page still works.</p>
          <button className="btn" onClick={() => this.setState({ error: null })}>Try the figure again</button>
        </div>
      );
    }
    return this.props.children;
  }
}
