import type { Metadata } from "next";

export const metadata: Metadata = { title: "Limpar" };

export default function CleanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
