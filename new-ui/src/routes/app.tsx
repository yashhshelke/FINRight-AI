import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/finexa/AppShell";
import { ProtectedRoute } from "@/components/finexa/ProtectedRoute";

export const Route = createFileRoute("/app")({
  component: AppLayout,
  ssr: false,
});

function AppLayout() {
  return (
    <ProtectedRoute>
      <AppShell />
    </ProtectedRoute>
  );
}

export { Outlet };
