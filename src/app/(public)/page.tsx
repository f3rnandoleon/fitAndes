import Link from "next/link";

export const metadata = {
  title: "ControlVentas — Nueva Colección",
  description: "Piezas atemporales confeccionadas con los materiales más nobles. Diseñadas para perdurar.",
};

export default function HomePage() {
  return (
    <main className="min-h-screen" style={{ background: "#f5f2ee", color: "#1a1a1a", fontFamily: "system-ui, sans-serif" }}>

      {/* ─── NAVBAR ─── */}
      <nav className="sticky top-0 z-20 border-b" style={{ background: "#f5f2ee", borderColor: "#e0dbd4" }}>
        <div className="max-w-7xl mx-auto px-6 py-4 grid grid-cols-3 items-center">
          <div className="flex items-center gap-8">
            {[
              { label: "Colección", href: "#" },
              { label: "Catálogo", href: "/catalogo" },
              { label: "Novedades", href: "#" },
            ].map((item) => (
              <Link key={item.label} href={item.href}
                className="text-xs uppercase opacity-80 hover:opacity-40 transition-opacity"
                style={{ letterSpacing: "0.15em", color: "#1a1a1a" }}>
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex justify-center">
            <Link href="/"
              className="text-2xl uppercase font-bold"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif", letterSpacing: "0.25em", color: "#1a1a1a" }}>
              ControlVentas
            </Link>
          </div>

          <div className="flex items-center justify-end gap-5">
            <Link href="/login"
              className="text-xs uppercase opacity-80 hover:opacity-40 transition-opacity"
              style={{ letterSpacing: "0.15em", color: "#1a1a1a" }}>
              Ingresar
            </Link>
            <Link href="/registro"
              className="text-xs uppercase px-4 py-2 border hover:opacity-60 transition-opacity"
              style={{ letterSpacing: "0.15em", border: "1px solid #1a1a1a", color: "#1a1a1a" }}>
              Registro
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative flex items-end overflow-hidden"
        style={{ minHeight: "88vh", background: "linear-gradient(135deg, #b8b0a5 0%, #cdc8c0 40%, #ddd9d3 100%)" }}>

        <div className="relative z-10 px-16 pb-20 max-w-xl">
          <p className="text-xs uppercase mb-5 opacity-70 text-white" style={{ letterSpacing: "0.25em" }}>
            Nueva Colección 2026
          </p>
          <h1 className="text-6xl text-white mb-6"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 400, lineHeight: 1.05 }}>
            Elegancia sin<br />esfuerzo
          </h1>
          <p className="text-sm leading-relaxed mb-10 opacity-80 text-white max-w-xs">
            Piezas atemporales confeccionadas con los materiales más nobles. Diseñadas para perdurar.
          </p>
          <Link href="/catalogo"
            className="inline-flex items-center gap-3 px-7 py-3.5 text-xs uppercase border border-white text-white hover:bg-white hover:text-stone-900 transition-colors"
            style={{ letterSpacing: "0.2em" }}>
            Explorar Colección →
          </Link>
        </div>

        {/* Anillos decorativos */}
        <div className="absolute right-0 top-0 h-full w-1/2 flex items-center justify-center pointer-events-none">
          <div className="absolute w-96 h-96 rounded-full border border-white/10" />
          <div className="absolute w-[560px] h-[560px] rounded-full border border-white/5" />
        </div>
      </section>

      {/* ─── RECIÉN LLEGADOS ─── */}
      <section className="py-24 px-6" style={{ background: "#f5f2ee" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs uppercase mb-3" style={{ letterSpacing: "0.25em", color: "#9c8f82" }}>
              Lo más nuevo
            </p>
            <h2 className="text-4xl font-normal" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              Recién Llegados
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { nombre: "Polera Premium", modelo: "Classic Fit", precio: "Bs. 120" },
              { nombre: "Blazer Estructurado", modelo: "Urban Line", precio: "Bs. 350" },
              { nombre: "Pantalón Sastre", modelo: "Slim Cut", precio: "Bs. 280" },
            ].map((item) => (
              <Link key={item.nombre} href="/catalogo" className="group block">
                <div className="relative overflow-hidden mb-4" style={{ background: "#e8e4de", aspectRatio: "3/4" }}>
                  <div className="absolute top-3 left-3 px-2.5 py-1 text-xs font-medium text-white"
                    style={{ background: "#b8965a", letterSpacing: "0.08em" }}>
                    NUEVO
                  </div>
                  {/* Placeholder imagen */}
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-20 h-20 opacity-20" fill="none" stroke="#9c8f82" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.8}
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  {/* Overlay hover */}
                  <div className="absolute inset-0 flex items-end justify-center pb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: "rgba(26,26,26,0.08)" }}>
                    <span className="text-xs uppercase px-5 py-2.5 text-white"
                      style={{ background: "#1a1a1a", letterSpacing: "0.2em" }}>
                      Ver producto
                    </span>
                  </div>
                </div>
                <h3 className="text-sm font-normal mb-0.5" style={{ color: "#1a1a1a" }}>{item.nombre}</h3>
                <p className="text-xs mb-1" style={{ color: "#9c8f82" }}>{item.modelo}</p>
                <p className="text-sm" style={{ color: "#1a1a1a" }}>{item.precio}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BANNER CUENTA ─── */}
      <section className="py-20 px-6" style={{ background: "#e8e4de" }}>
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-14">
          <div className="max-w-lg">
            <p className="text-xs uppercase mb-4" style={{ letterSpacing: "0.25em", color: "#9c8f82" }}>
              Tu cuenta de cliente
            </p>
            <h2 className="text-4xl font-normal mb-6 leading-tight"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              Sigue tus pedidos<br />en tiempo real
            </h2>
            <p className="text-sm leading-relaxed mb-8" style={{ color: "#6b6058" }}>
              Crea tu cuenta gratis y accede al historial completo de tus compras
              y el estado de cada pedido desde tu portal personal.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link href="/registro"
                className="px-7 py-3 text-xs uppercase text-white hover:opacity-80 transition-opacity"
                style={{ background: "#1a1a1a", letterSpacing: "0.2em" }}>
                Crear cuenta
              </Link>
              <Link href="/login"
                className="px-7 py-3 text-xs uppercase border hover:opacity-60 transition-opacity"
                style={{ border: "1px solid #1a1a1a", color: "#1a1a1a", letterSpacing: "0.2em" }}>
                Ingresar
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-md w-full">
            {[
              { icon: "📦", title: "Historial de pedidos", desc: "Todas tus compras con detalle completo." },
              { icon: "🔒", title: "Cuenta segura", desc: "Sesión protegida con JWT cifrado." },
              { icon: "⚡", title: "Registro en segundos", desc: "Sin formularios largos. Acceso inmediato." },
              { icon: "📱", title: "Cualquier dispositivo", desc: "Funciona igual en móvil y desktop." },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex gap-3">
                <span className="text-xl mt-0.5 shrink-0">{icon}</span>
                <div>
                  <p className="text-xs font-semibold uppercase mb-1" style={{ letterSpacing: "0.08em", color: "#1a1a1a" }}>
                    {title}
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: "#6b6058" }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SELECCIÓN ─── */}
      <section className="py-24 px-6" style={{ background: "#f5f2ee" }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <h2 className="text-3xl font-normal"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              Selección
            </h2>
            <Link href="/catalogo"
              className="text-xs uppercase flex items-center gap-2 hover:opacity-50 transition-opacity"
              style={{ letterSpacing: "0.2em", color: "#1a1a1a" }}>
              Ver todo →
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { nombre: "Polera Classic", precio: "Bs. 120", tag: "NUEVO", descuento: null },
              { nombre: "Blazer Urban", precio: "Bs. 350", tag: null, descuento: "-15%" },
              { nombre: "Camisa Lino", precio: "Bs. 180", tag: "NUEVO", descuento: null },
              { nombre: "Pantalón Sastre", precio: "Bs. 280", tag: null, descuento: null },
            ].map((item) => (
              <Link key={item.nombre} href="/catalogo" className="group block">
                <div className="relative overflow-hidden mb-3"
                  style={{ background: "#e8e4de", aspectRatio: "3/4" }}>
                  {item.tag && (
                    <div className="absolute top-3 left-3 px-2 py-0.5 text-xs font-medium text-white"
                      style={{ background: "#b8965a" }}>
                      {item.tag}
                    </div>
                  )}
                  {item.descuento && (
                    <div className="absolute top-3 left-3 px-2 py-0.5 text-xs font-medium text-white"
                      style={{ background: "#c0392b" }}>
                      {item.descuento}
                    </div>
                  )}
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-16 h-16 opacity-20" fill="none" stroke="#9c8f82" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.8}
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <div className="absolute inset-0 flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: "rgba(26,26,26,0.06)" }}>
                    <span className="text-xs uppercase px-4 py-2 text-white"
                      style={{ background: "#1a1a1a", letterSpacing: "0.15em" }}>
                      Ver
                    </span>
                  </div>
                </div>
                <p className="text-sm font-normal" style={{ color: "#1a1a1a" }}>{item.nombre}</p>
                <p className="text-sm mt-0.5" style={{ color: "#1a1a1a" }}>{item.precio}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ background: "#1a1a1a", color: "#f5f2ee" }}>
        <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <p className="text-xl font-bold uppercase mb-4"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif", letterSpacing: "0.3em" }}>
              ControlVentas
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "#9c8f82" }}>
              Moda de alta calidad con un compromiso inquebrantable por el diseño atemporal.
            </p>
          </div>

          <div>
            <p className="text-xs uppercase font-semibold mb-5" style={{ letterSpacing: "0.2em", color: "#9c8f82" }}>
              Comprar
            </p>
            <div className="flex flex-col gap-3">
              {["Nueva Colección", "Catálogo completo"].map((item) => (
                <Link key={item} href="/catalogo"
                  className="text-sm hover:opacity-50 transition-opacity"
                  style={{ color: "#f5f2ee" }}>
                  {item}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs uppercase font-semibold mb-5" style={{ letterSpacing: "0.2em", color: "#9c8f82" }}>
              Mi cuenta
            </p>
            <div className="flex flex-col gap-3">
              {[
                { label: "Ingresar", href: "/login" },
                { label: "Crear cuenta", href: "/registro" },
                { label: "Mis pedidos", href: "/portal/pedidos" },
              ].map((item) => (
                <Link key={item.label} href={item.href}
                  className="text-sm hover:opacity-50 transition-opacity"
                  style={{ color: "#f5f2ee" }}>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs uppercase font-semibold mb-5" style={{ letterSpacing: "0.2em", color: "#9c8f82" }}>
              Atención al cliente
            </p>
            <div className="flex flex-col gap-3">
              {["Contacto", "FAQ", "Política de privacidad"].map((item) => (
                <span key={item} className="text-sm" style={{ color: "#9c8f82" }}>{item}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t px-6 py-5 text-center" style={{ borderColor: "#2e2e2e" }}>
          <p className="text-xs" style={{ color: "#6b6058" }}>
            © {new Date().getFullYear()} ControlVentas. Todos los derechos reservados.
          </p>
        </div>
      </footer>

    </main>
  );
}