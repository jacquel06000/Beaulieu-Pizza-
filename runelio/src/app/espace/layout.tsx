import type { Metadata } from "next";
import { SpaceNav } from "@/components/space/space-nav";
import { Container } from "@/components/ui";
import { requirePageUser } from "@/server/session";

export const metadata: Metadata = { robots: { index: false } };

export default async function SpaceLayout({ children }: LayoutProps<"/espace">) {
  const user = await requirePageUser();
  return (
    <Container className="py-8 sm:py-12">
      <SpaceNav isAdmin={user.role === "admin"} />
      <div className="mt-8">{children}</div>
    </Container>
  );
}
