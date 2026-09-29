import type { ReactNode } from "react";
import { Card, Container } from "../ui";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: ReactNode; children: ReactNode }) {
  return (
    <Container className="py-12 sm:py-20 max-w-md">
      <h1 className="text-3xl font-bold animate-rise">{title}</h1>
      {subtitle && <p className="mt-2 text-muted leading-relaxed">{subtitle}</p>}
      <Card className="mt-8 animate-rise [animation-delay:80ms]">{children}</Card>
    </Container>
  );
}
