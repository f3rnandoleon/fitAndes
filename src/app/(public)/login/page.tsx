"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Correo o contraseña incorrectos.");
      return;
    }

    router.push("/portal/dashboard");
  };

  return (
    <div className="flex min-h-screen bg-gray-950 text-gray-100">

      {/* LEFT PANEL */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900 border-r border-gray-800 relative overflow-hidden">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-lg z-10">
          <span className="text-2xl">◈</span>
          <span>ControlVentas</span>
        </div>

        <div className="z-10">
          <h1 className="text-5xl font-extrabold leading-tight text-white mb-4">
            Tu tienda,<br />en tu mano.
          </h1>
          <p className="text-gray-400 text-base max-w-xs leading-relaxed">
            Accede a tu historial de pedidos, sigue tus compras y más.
          </p>
        </div>

        <div className="absolute -bottom-24 -right-24 pointer-events-none">
          <div className="absolute w-72 h-72 rounded-full border border-amber-400/10 top-0 left-0 -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute w-[500px] h-[500px] rounded-full border border-amber-400/5 top-0 left-0 -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute w-[700px] h-[700px] rounded-full border border-amber-400/[0.03] top-0 left-0 -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex flex-1 lg:flex-none lg:w-[480px] items-center justify-center p-6 bg-gray-950">
        <div className="w-full max-w-sm">

          <div className="flex lg:hidden items-center gap-2 text-amber-400 font-bold text-lg mb-10">
            <span className="text-2xl">◈</span>
            <span>ControlVentas</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-1">Bienvenido</h2>
            <p className="text-gray-500 text-sm">Ingresa a tu cuenta de cliente</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-medium text-gray-400 uppercase tracking-widest">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                placeholder="tu@correo.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoComplete="email"
                className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/10 transition"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-medium text-gray-400 uppercase tracking-widest">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                autoComplete="current-password"
                className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/10 transition"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed text-gray-950 font-bold rounded-lg py-3 text-sm tracking-wide transition flex items-center justify-center min-h-[48px]"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-gray-950/30 border-t-gray-950 rounded-full animate-spin" />
              ) : (
                "Ingresar"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            ¿No tienes cuenta?{" "}
            <Link href="/registro" className="text-amber-400 font-medium hover:underline">
              Regístrate gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}