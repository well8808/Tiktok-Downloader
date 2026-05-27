import { Sidebar } from "@/components/shell/sidebar";
import { AutoResumeToast } from "@/components/shell/auto-resume-toast";
import { PageTransition } from "@/components/shell/page-transition";
import { KeyboardNav } from "@/components/shell/keyboard-nav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      <main className="pl-14">
        <PageTransition>{children}</PageTransition>
      </main>
      <AutoResumeToast />
      <KeyboardNav />
    </div>
  );
}
