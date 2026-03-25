import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return _stripe;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const stripe = new Proxy({} as Stripe, { get: (_, p) => (getStripe() as any)[p] });

const PLATFORM_FEE_RATE = 0.02;

export function calculateFees(subtotal: number) {
  const platformFee = Math.round(subtotal * PLATFORM_FEE_RATE * 100) / 100;
  const total = Math.round((subtotal + platformFee) * 100) / 100;
  return { subtotal, platformFee, total };
}

export async function getOrCreateStripeCustomer(
  businessId: string,
  email: string,
  name: string,
  existingCustomerId?: string | null
) {
  if (existingCustomerId) {
    return existingCustomerId;
  }

  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { businessId },
  });

  return customer.id;
}

export async function createCheckoutSession({
  customerId,
  lineItems,
  platformFeeCents,
  orderId,
  successUrl,
  cancelUrl,
  savePaymentMethod,
}: {
  customerId: string;
  lineItems: Array<{ name: string; quantity: number; unitAmountCents: number }>;
  platformFeeCents: number;
  orderId: string;
  successUrl: string;
  cancelUrl: string;
  savePaymentMethod?: boolean;
}) {
  const stripeLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    ...lineItems.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: { name: item.name },
        unit_amount: item.unitAmountCents,
      },
      quantity: item.quantity,
    })),
    {
      price_data: {
        currency: "usd",
        product_data: { name: "Platform Fee (2%)" },
        unit_amount: platformFeeCents,
      },
      quantity: 1,
    },
  ];

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: customerId,
    line_items: stripeLineItems,
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { orderId },
    payment_intent_data: {
      metadata: { orderId },
    },
  };

  if (savePaymentMethod) {
    sessionParams.payment_intent_data!.setup_future_usage = "off_session";
  }

  return stripe.checkout.sessions.create(sessionParams);
}

export async function chargeRecurring({
  customerId,
  paymentMethodId,
  amountCents,
  orderId,
  description,
}: {
  customerId: string;
  paymentMethodId: string;
  amountCents: number;
  orderId: string;
  description: string;
}) {
  return stripe.paymentIntents.create({
    amount: amountCents,
    currency: "usd",
    customer: customerId,
    payment_method: paymentMethodId,
    off_session: true,
    confirm: true,
    description,
    metadata: { orderId },
  });
}
