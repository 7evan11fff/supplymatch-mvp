import { prisma } from "./db";

interface CreateNotificationParams {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  return prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link ?? null,
    },
  });
}

export async function notifyQuoteRequested(
  supplierName: string,
  businessUserId: string,
  adminUserIds: string[]
) {
  const promises = adminUserIds.map((adminId) =>
    createNotification({
      userId: adminId,
      type: "quote_requested",
      title: "New Quote Request",
      message: `A new quote has been requested from ${supplierName}.`,
      link: "/admin/quotes",
    })
  );
  await Promise.all(promises);
}

export async function notifyQuotePriced(
  supplierName: string,
  businessUserId: string
) {
  await createNotification({
    userId: businessUserId,
    type: "quote_priced",
    title: "Quote Ready",
    message: `${supplierName} has priced your quote. Review and accept it.`,
    link: "/dashboard/quotes",
  });
}

export async function notifyOrderPaid(
  orderId: string,
  businessName: string,
  adminUserIds: string[]
) {
  const promises = adminUserIds.map((adminId) =>
    createNotification({
      userId: adminId,
      type: "order_paid",
      title: "Order Paid",
      message: `${businessName} has paid for their order.`,
      link: "/admin/orders",
    })
  );
  await Promise.all(promises);
}

export async function notifyOrderStatusChange(
  businessUserId: string,
  supplierName: string,
  newStatus: string
) {
  const statusLabel = newStatus.replace(/_/g, " ").toLowerCase();
  await createNotification({
    userId: businessUserId,
    type: "order_status",
    title: "Order Update",
    message: `Your order from ${supplierName} is now ${statusLabel}.`,
    link: "/dashboard/orders",
  });
}

export async function notifyNewBooking(
  businessName: string,
  adminUserIds: string[]
) {
  const promises = adminUserIds.map((adminId) =>
    createNotification({
      userId: adminId,
      type: "new_booking",
      title: "New Booking Request",
      message: `${businessName} has requested a supplier booking.`,
      link: "/admin/bookings",
    })
  );
  await Promise.all(promises);
}

export async function notifyBookingApproved(
  supplierName: string,
  businessUserId: string
) {
  await createNotification({
    userId: businessUserId,
    type: "booking_approved",
    title: "Booking Approved",
    message: `Your booking with ${supplierName} has been approved! You can now request quotes.`,
    link: "/dashboard/recommendations",
  });
}
