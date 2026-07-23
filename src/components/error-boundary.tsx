import { Component, type ErrorInfo, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled error in page", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <Card className="mx-auto mt-12 max-w-lg">
          <CardHeader>
            <CardTitle>Something went wrong</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              {this.state.error.message}
            </p>
            <Button
              variant="outline"
              className="self-start"
              onClick={() => this.setState({ error: null })}
            >
              Try again
            </Button>
          </CardContent>
        </Card>
      );
    }
    return this.props.children;
  }
}
