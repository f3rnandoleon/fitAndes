"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface Props {
  authenticated: boolean;
  user?: {
    fullname?: string | null;
    email?: string | null;
  };
  loading: boolean;
  onLogin: () => void;
}

/**
 * Component to show the user's session status during checkout.
 */
export function CheckoutAuthStatus({ authenticated, user, loading, onLogin }: Props) {
  return (
    <Card className="min-w-[280px] bg-white/80">
      <p className="text-[10px] uppercase tracking-[0.16em] text-subtle mb-3">
        Estado de sesion
      </p>
      {authenticated ? (
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">{user?.fullname ?? "Cliente FitAndes"}</p>
          <p className="text-[11px] text-muted">{user?.email}</p>
          {loading && (
            <p className="text-[10px] text-subtle mt-2 animate-pulse">
              Sincronizando datos...
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-foreground">Necesitas iniciar sesion para confirmar tu reserva.</p>
          <Button variant="outline" size="sm" onClick={onLogin} className="w-full">
            Iniciar sesion
          </Button>
        </div>
      )}
    </Card>
  );
}
