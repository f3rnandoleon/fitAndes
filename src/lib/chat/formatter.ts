import { primeraImagenDeProducto, primeraImagenDeVariante } from "@/lib/catalogo-imagenes";
import type { ChatAction, OrderCardData, ProductCardData } from "@/lib/chat/types";
import { filterCatalogAvailableVariants, type CatalogProduct } from "@/types/catalogo";
import { getPedidoEstado, getPedidoItemColor, getPedidoItemNombre, getPedidoItemTalla, getPedidoNumero, getPedidoTotal, type Pedido } from "@/types/pedidos";
import { formatPrice, formatDate } from "@/lib/format";

export function buildProductCard(
  product: CatalogProduct,
  options: {
    preferredColor?: string | null;
    preferredTalla?: string | null;
    preferredQuantity?: number | null;
  } = {},
): ProductCardData {
  const productWithAvailableVariants = filterCatalogAvailableVariants(product);
  const preferredVariant =
    productWithAvailableVariants.variantes.find(
      (variant) =>
        (!options.preferredColor || variant.color.toLowerCase() === options.preferredColor.toLowerCase()) &&
        (!options.preferredTalla || variant.talla.toUpperCase() === options.preferredTalla.toUpperCase()),
    ) ?? null;

  const description =
    preferredVariant?.descripcion ??
    productWithAvailableVariants.variantes.find((variant) => variant.descripcion)?.descripcion ??
    null;
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
    variants: productWithAvailableVariants.variantes,
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
    title: getPedidoNumero(order),
    subtitle: `${formatDate(order.createdAt)} · ${order.items?.length ?? 0} item(s)`,
    status: getPedidoEstado(order),
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
