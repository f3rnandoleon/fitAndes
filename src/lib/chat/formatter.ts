import { primeraImagenDeProducto, primeraImagenDeVariante } from "@/lib/catalogo-imagenes";
import type { ChatAction, OrderCardData, ProductCardData } from "@/lib/chat/types";
import type { CatalogProduct } from "@/types/catalogo";
import { getPedidoItemColor, getPedidoItemNombre, getPedidoItemTalla, getPedidoTotal, type Pedido } from "@/types/pedidos";

function formatPrice(value: number): string {
  return `Bs. ${new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
}

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return value;
  return parsed.toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function buildProductCard(
  product: CatalogProduct,
  options: {
    preferredColor?: string | null;
    preferredTalla?: string | null;
    preferredQuantity?: number | null;
  } = {},
): ProductCardData {
  const preferredVariant =
    product.variantes.find(
      (variant) =>
        (!options.preferredColor || variant.color.toLowerCase() === options.preferredColor.toLowerCase()) &&
        (!options.preferredTalla || variant.talla.toUpperCase() === options.preferredTalla.toUpperCase()),
    ) ?? null;

  const description = preferredVariant?.descripcion ?? product.variantes.find((variant) => variant.descripcion)?.descripcion ?? null;
  const image = primeraImagenDeVariante(preferredVariant) ?? primeraImagenDeProducto(product);

  const actions: ChatAction[] = [
    { type: "view_detail", label: "Ver detalle", productId: product._id },
    { type: "show_similar", label: "Similares", productId: product._id },
  ];

  return {
    type: "product",
    id: product._id,
    title: product.nombre,
    model: product.modelo,
    subtitle: [product.modelo, formatPrice(product.precioVenta)].join(" · "),
    price: product.precioVenta,
    image,
    description,
    detailHref: `/catalogo/${product._id}`,
    variants: product.variantes,
    preferredColor: options.preferredColor ?? preferredVariant?.color ?? null,
    preferredTalla: options.preferredTalla ?? preferredVariant?.talla ?? null,
    preferredQuantity: options.preferredQuantity ?? 1,
    actions,
  };
}

export function buildOrderCard(order: Pedido): OrderCardData {
  return {
    type: "order",
    id: order._id,
    title: order.numeroVenta,
    subtitle: `${formatDate(order.createdAt)} · ${order.items?.length ?? 0} item(s)`,
    status: order.estado,
    total: getPedidoTotal(order),
    detailHref: `/pedidos/${order._id}`,
    items:
      order.items?.map((item) => ({
        nombre: getPedidoItemNombre(item),
        cantidad: item.cantidad,
        color: getPedidoItemColor(item),
        talla: getPedidoItemTalla(item),
      })) ?? [],
    actions: [{ type: "show_order", label: "Ver pedido", orderId: order._id }],
  };
}

export function formatReadyToReserve(product: CatalogProduct, color?: string | null, talla?: string | null): string {
  const target = [product.nombre, color, talla].filter(Boolean).join(" · ");
  return `Tengo listo ${target}. Puedes agregarlo a tu reserva desde la tarjeta.`;
}
