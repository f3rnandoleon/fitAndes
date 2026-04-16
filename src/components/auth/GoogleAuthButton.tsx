"use client";

import { useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

type GoogleButtonText = "signin_with" | "signup_with" | "continue_with";

type Props = {
  callbackUrl?: string;
  text?: GoogleButtonText;
  promptText: string;
};

const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export default function GoogleAuthButton({
  callbackUrl = "/dashboard",
  text = "continue_with",
  promptText,
}: Props) {
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    if (window.google?.accounts?.id) {
      setScriptReady(true);
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GOOGLE_SCRIPT_SRC}"]`);
    const handleLoad = () => setScriptReady(true);
    const handleError = () => setError("No se pudo cargar el acceso con Google.");

    if (existing) {
      existing.addEventListener("load", handleLoad);
      existing.addEventListener("error", handleError);

      if (existing.dataset.loaded === "true") {
        setScriptReady(true);
      }

      return () => {
        existing.removeEventListener("load", handleLoad);
        existing.removeEventListener("error", handleError);
      };
    }

    const script = document.createElement("script");
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", () => {
      script.dataset.loaded = "true";
      setScriptReady(true);
    });
    script.addEventListener("error", handleError);
    document.head.appendChild(script);

    return () => {
      script.removeEventListener("error", handleError);
    };
  }, []);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !scriptReady || !buttonRef.current || !window.google?.accounts?.id) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response) => {
        if (!response.credential) {
          setError("Google no devolvio una credencial valida.");
          return;
        }

        setLoading(true);
        setError("");

        try {
          const result = await signIn("google-id-token", {
            idToken: response.credential,
            redirect: false,
            callbackUrl,
          });

          if (result?.error) {
            setError(result.error);
            return;
          }

          router.push(result?.url ?? callbackUrl);
          router.refresh();
        } catch {
          setError("No pudimos iniciar sesion con Google.");
        } finally {
          setLoading(false);
        }
      },
    });

    buttonRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(buttonRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      text,
      shape: "rectangular",
      logo_alignment: "left",
      width: 320,
    });
  }, [callbackUrl, router, scriptReady, text]);

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1" style={{ background: "var(--border)" }} />
        <span className="text-[11px] uppercase" style={{ letterSpacing: "0.18em", color: "var(--subtle)" }}>
          {promptText}
        </span>
        <div className="h-px flex-1" style={{ background: "var(--border)" }} />
      </div>

      <div className={`min-h-[44px] transition-opacity ${loading ? "opacity-60 pointer-events-none" : ""}`} aria-busy={loading}>
        {scriptReady ? (
          <div ref={buttonRef} className="flex justify-center" />
        ) : (
          <div
            className="flex min-h-[44px] items-center justify-center border px-4 text-xs uppercase"
            style={{ borderColor: "var(--border)", letterSpacing: "0.16em", color: "var(--muted)" }}
          >
            Cargando Google...
          </div>
        )}
      </div>

      {error ? (
        <p className="text-sm border px-3 py-2" style={{ color: "var(--danger)", borderColor: "#d9b2ac", background: "#f3e3e0" }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
