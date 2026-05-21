import { Sidebar } from "@/components/common/Sidebar";
import { MobileNav } from "@/components/common/MobileNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        <main className="flex-1 p-4 md:p-6 lg:p-8 pb-24 lg:pb-8">
          {children}
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
