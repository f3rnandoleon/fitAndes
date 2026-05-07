"use client";
import Image from "next/image";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";
import logo from "../../../../public/fitAndes.png";

function sanitizeCallbackUrl(value: string | null) {
  if (!value || !value.startsWith("/")) return "/dashboard";
  return value;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = sanitizeCallbackUrl(searchParams.get("callbackUrl"));
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
      callbackUrl,
    });

    setLoading(false);

    if (res?.error) {
      setError(res.error === "CredentialsSignin" ? "Correo o contrasena incorrectos." : res.error);
      return;
    }

    router.push(callbackUrl);
    router.refresh();
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
          <Image
            src={logo}
            alt="Nueva Colección"
            width={400}
            height={150}
            sizes="100vw"
            className="pointer-events-none object-cover object-center lg:object-right"
          />
        </Link>

        <div className="z-10">
          <p className="text-xs uppercase mb-5" style={{ letterSpacing: "0.25em", color: "#6b6058" }}>
            Portal de cliente
          </p>
          <h1
            className="text-5xl leading-tight mb-4"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 400, color: "var(--foreground)" }}
          >
            Tu tienda, en
            <br />
            tus manos
          </h1>
          <p className="text-sm leading-relaxed max-w-xs" style={{ color: "#4d433b" }}>
            Accede a tu historial de pedidos, sigue tus compras y administra tu cuenta desde cualquier dispositivo.
          </p>
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
            className="inline-flex lg:hidden text-xl uppercase font-bold mb-4"
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              letterSpacing: "0.2em",
              color: "#1a1a1a",
            }}
          >
            <Image
              src={logo}
              alt="Nueva Colección"
              width={400}
              height={100}
              sizes="100vw"
              className="pointer-events-none object-cover object-center lg:object-right"
            />
          </Link>

          <div className="mb-8">
            <h2
              className="text-4xl mb-2"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 400 }}
            >
              Bienvenido
            </h2>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Ingresa a tu cuenta de cliente
            </p>
          </div>



          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs uppercase" style={{ letterSpacing: "0.16em", color: "var(--subtle)" }}>
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
                className="border border-border rounded-[var(--radius-md)] px-4 py-3 text-sm placeholder:text-subtle/50 focus:outline-none focus:ring-1 focus:ring-foreground/10"
                style={{ background: "var(--background)" }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs uppercase" style={{ letterSpacing: "0.16em", color: "var(--subtle)" }}>
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                placeholder="********"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                autoComplete="current-password"
                className="border border-border rounded-[var(--radius-md)] px-4 py-3 text-sm placeholder:text-subtle/50 focus:outline-none focus:ring-1 focus:ring-foreground/10"
                style={{ background: "var(--background)" }}
              />
            </div>

            {error && (
              <p className="text-sm border px-3 py-2" style={{ color: "var(--danger)", borderColor: "#d9b2ac", background: "#f3e3e0" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 text-xs uppercase text-background py-3.5 bg-foreground transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-h-[48px] active:scale-95 rounded-full"
              style={{ letterSpacing: "0.18em" }}
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
              ) : (
                "Ingresar"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: "var(--muted)" }}>
            ¿No tienes cuenta?{" "}
            <Link href={`/registro${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`} className="hover:opacity-60 transition-opacity font-medium" style={{ color: "var(--foreground)" }}>
              Regístrate gratis
            </Link>
          </p>
          <div className="mt-6 active:scale-95">
            <GoogleAuthButton callbackUrl={callbackUrl} text="signin_with" promptText="o entra con Google" />
          </div>
        </div>
      </div>
    </div>
  );
}
