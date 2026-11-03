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
 * Muestra el estado de la sesión durante el checkout o la opción de comprar como invitado.
 */
export function CheckoutAuthStatus({ authenticated, user, loading, onLogin }: Props) {
  return (
    <Card className="min-w-[280px] bg-white/90">
      <p className="text-[10px] uppercase tracking-[0.16em] text-subtle mb-3">
        {authenticated ? "Cuenta vinculada" : "Modo de compra"}
      </p>
      {authenticated ? (
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">{user?.fullname ?? "Cliente FitAndes"}</p>
          <p className="text-[11px] text-muted">{user?.email}</p>
          {loading && (
            <p className="text-[10px] text-subtle mt-2 animate-pulse">
              Sincronizando libreta de direcciones...
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
              Compra Rápida
            </span>
            <p className="text-xs text-muted mt-1.5 leading-relaxed">
              Puedes finalizar sin crear contraseña. Si ya tienes cuenta:
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onLogin} className="w-full text-xs">
            Iniciar sesión
          </Button>
        </div>
      )}
    </Card>
  );
}
