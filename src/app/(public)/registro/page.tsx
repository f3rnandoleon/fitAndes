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
      setError("Las contrasenas no coinciden.");
      return;
    }

    if (form.password.length < 6) {
      setError("La contrasena debe tener al menos 6 caracteres.");
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
        setError("Este correo ya esta registrado.");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError(data?.message ?? "Error al crear la cuenta.");
        setLoading(false);
        return;
      }

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
      setError("Error de conexion. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div
        className="hidden lg:flex flex-1 flex-col justify-between p-12 border-r relative overflow-hidden"
        style={{
          borderColor: "var(--border)",
          background: "linear-gradient(145deg, #b8b0a5 0%, #cdc8c0 45%, #ddd9d3 100%)",
        }}
      >
        <Link
          href="/"
          className="text-2xl uppercase font-bold z-10"
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            letterSpacing: "0.25em",
            color: "#1a1a1a",
          }}
        >
          ControlVentas
        </Link>

        <div className="z-10">
          <p className="text-xs uppercase mb-5" style={{ letterSpacing: "0.25em", color: "#6b6058" }}>
            Nuevo cliente
          </p>
          <h1
            className="text-5xl leading-tight mb-4"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 400, color: "#1a1a1a" }}
          >
            Crea tu cuenta
            <br />
            en segundos
          </h1>
          <p className="text-sm leading-relaxed max-w-xs" style={{ color: "#4d433b" }}>
            Registrate gratis y empieza a seguir tus pedidos con un panel disenado para ti.
          </p>
        </div>

        <div className="flex flex-col gap-4 z-10">
          {[
            { num: "01", label: "Completa el formulario" },
            { num: "02", label: "Accede a tu portal" },
            { num: "03", label: "Sigue tus pedidos" },
          ].map(({ num, label }) => (
            <div key={num} className="flex items-center gap-4 text-sm" style={{ color: "#4d433b" }}>
              <span className="font-semibold text-xs min-w-[28px]" style={{ letterSpacing: "0.15em", color: "#1a1a1a" }}>
                {num}
              </span>
              <span>{label}</span>
            </div>
          ))}
        </div>

        <div className="absolute -bottom-24 -right-24 pointer-events-none">
          <div className="absolute w-80 h-80 rounded-full border border-[#1a1a1a]/10 top-0 left-0 -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute w-[520px] h-[520px] rounded-full border border-[#1a1a1a]/5 top-0 left-0 -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute w-[700px] h-[700px] rounded-full border border-[#1a1a1a]/[0.03] top-0 left-0 -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>

      <div className="flex flex-1 lg:flex-none lg:w-[500px] items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="inline-flex lg:hidden text-xl uppercase font-bold mb-10"
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              letterSpacing: "0.2em",
              color: "#1a1a1a",
            }}
          >
            ControlVentas
          </Link>

          <div className="mb-8">
            <h2
              className="text-4xl mb-2"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 400 }}
            >
              Crear cuenta
            </h2>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Solo toma un momento
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="fullname" className="text-xs uppercase" style={{ letterSpacing: "0.16em", color: "var(--subtle)" }}>
                Nombre completo
              </label>
              <input
                id="fullname"
                type="text"
                placeholder="Juan Perez"
                value={form.fullname}
                onChange={(e) => setForm({ ...form, fullname: e.target.value })}
                required
                autoComplete="name"
                className="border rounded-none px-4 py-3 text-sm placeholder:text-[#8f8377] focus:outline-none focus:ring-0"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs uppercase" style={{ letterSpacing: "0.16em", color: "var(--subtle)" }}>
                Correo electronico
              </label>
              <input
                id="email"
                type="email"
                placeholder="tu@correo.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoComplete="email"
                className="border rounded-none px-4 py-3 text-sm placeholder:text-[#8f8377] focus:outline-none focus:ring-0"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-xs uppercase" style={{ letterSpacing: "0.16em", color: "var(--subtle)" }}>
                  Contrasena
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="********"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  autoComplete="new-password"
                  className="border rounded-none px-4 py-3 text-sm placeholder:text-[#8f8377] focus:outline-none focus:ring-0"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="confirmPassword" className="text-xs uppercase" style={{ letterSpacing: "0.16em", color: "var(--subtle)" }}>
                  Confirmar
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="********"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  required
                  autoComplete="new-password"
                  className="border rounded-none px-4 py-3 text-sm placeholder:text-[#8f8377] focus:outline-none focus:ring-0"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                />
              </div>
            </div>

            {error && (
              <p className="text-sm border px-3 py-2" style={{ color: "var(--danger)", borderColor: "#d9b2ac", background: "#f3e3e0" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 text-xs uppercase text-white py-3.5 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-h-[48px]"
              style={{ background: "#1a1a1a", letterSpacing: "0.18em" }}
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Crear cuenta"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: "var(--muted)" }}>
            Ya tienes cuenta?{" "}
            <Link href="/login" className="hover:opacity-60 transition-opacity" style={{ color: "#1a1a1a" }}>
              Inicia sesion
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
