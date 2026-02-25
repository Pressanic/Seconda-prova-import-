import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import Toaster from "@/components/ui/Toaster";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();
    if (!session?.user) redirect("/login");

    return (
        <div className="flex h-screen bg-[#0f172a] overflow-hidden">
            <Sidebar user={session.user as any} />
            <div className="flex flex-col flex-1 overflow-hidden">
                <Topbar user={session.user as any} />
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
            <Toaster />
        </div>
    );
}
