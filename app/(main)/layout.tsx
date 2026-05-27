import { Sidebar } from "@/components/shell/sidebar";
import { AutoResumeToast } from "@/components/shell/auto-resume-toast";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      <main className="pl-14">{children}</main>
      <AutoResumeToast />
    </div>
  );
}
