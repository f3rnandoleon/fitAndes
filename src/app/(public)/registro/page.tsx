"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function RegistroPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullname: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullname: form.fullname,
          email: form.email,
          password: form.password,
          role: "CLIENTE",
        }),
      });

      const data = await res.json();

      if (res.status === 409) {
        setError("Este correo ya está registrado.");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError(data?.message ?? "Error al crear la cuenta.");
        setLoading(false);
        return;
      }

      // Login automático tras registro exitoso
      const login = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (login?.error) {
        router.push("/login");
        return;
      }

      router.push("/portal/dashboard");
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
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
            Crea tu<br />cuenta.
          </h1>
          <p className="text-gray-400 text-base max-w-xs leading-relaxed">
            Regístrate gratis y empieza a seguir tus pedidos en tiempo real.
          </p>
        </div>

        <div className="flex flex-col gap-4 z-10">
          {[
            { num: "01", label: "Completa el formulario" },
            { num: "02", label: "Accede a tu portal" },
            { num: "03", label: "Sigue tus pedidos" },
          ].map(({ num, label }) => (
            <div key={num} className="flex items-center gap-4 text-sm text-gray-500">
              <span className="text-amber-400 font-bold text-xs tracking-widest min-w-[28px]">{num}</span>
              <span>{label}</span>
            </div>
          ))}
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
            <h2 className="text-3xl font-bold text-white mb-1">Crear cuenta</h2>
            <p className="text-gray-500 text-sm">Solo toma un momento</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="fullname" className="text-xs font-medium text-gray-400 uppercase tracking-widest">
                Nombre completo
              </label>
              <input
                id="fullname"
                type="text"
                placeholder="Juan Pérez"
                value={form.fullname}
                onChange={(e) => setForm({ ...form, fullname: e.target.value })}
                required
                autoComplete="name"
                className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/10 transition"
              />
            </div>

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

            <div className="grid grid-cols-2 gap-3">
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
                  autoComplete="new-password"
                  className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/10 transition"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="confirmPassword" className="text-xs font-medium text-gray-400 uppercase tracking-widest">
                  Confirmar
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  required
                  autoComplete="new-password"
                  className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/10 transition"
                />
              </div>
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
                "Crear cuenta"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-amber-400 font-medium hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}