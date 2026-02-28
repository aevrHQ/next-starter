import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { decryptSession } from "@/lib/session";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) {
    redirect("/login");
  }

  const session = await decryptSession(token);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Welcome back, {session.email}!
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-col gap-2">
            <h3 className="font-semibold leading-none tracking-tight">
              Account Status
            </h3>
            <p className="text-sm text-muted-foreground">
              Your PayID is successfully connected.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm font-medium">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
