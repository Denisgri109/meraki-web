import type { SupabaseClient } from '@supabase/supabase-js';
import type { Stripe, StripeCardElement } from '@stripe/stripe-js';

export interface SetupIntentResult {
  paymentMethodId: string;
  setupIntentId: string;
  customerId: string;
}

export async function createSetupIntent(
  supabase: SupabaseClient,
  stripe: Stripe,
  cardElement: StripeCardElement,
  email?: string,
  customerId?: string
): Promise<SetupIntentResult> {
  const { data: setupIntentData, error: setupError } = await supabase.functions.invoke('setup-intent', {
    body: { user_email: email, customer_id: customerId },
  });
  if (setupError) throw setupError;

  const { setupIntent, error: confirmSetupError } = await stripe.confirmCardSetup(
    setupIntentData.clientSecret,
    { payment_method: { card: cardElement } }
  );
  if (confirmSetupError) throw confirmSetupError;

  return {
    paymentMethodId: setupIntent!.payment_method as string,
    setupIntentId: setupIntentData.setupIntentId,
    customerId: setupIntentData.customerId,
  };
}

export interface PaymentIntentOptions {
  amount: number;
  currency: string;
  customerId?: string;
  paymentMethodId: string;
  masterId: string;
  description: string;
}

export interface PaymentIntentResult {
  paymentIntentId: string;
  clientSecret: string;
}

export async function createAndConfirmPaymentIntent(
  supabase: SupabaseClient,
  stripe: Stripe,
  options: PaymentIntentOptions,
  usingSavedCard: boolean
): Promise<PaymentIntentResult> {
  const { data: paymentIntentData, error: piError } = await supabase.functions.invoke('create-payment-intent', {
    body: {
      amount: options.amount,
      currency: options.currency,
      customer_id: options.customerId,
      payment_method_id: options.paymentMethodId,
      master_id: options.masterId,
      description: options.description,
      capture_method: 'automatic',
    }
  });
  if (piError) throw piError;

  const { error: confirmPaymentError } = await stripe.confirmCardPayment(
    paymentIntentData.clientSecret,
    usingSavedCard ? { payment_method: options.paymentMethodId } : undefined
  );
  if (confirmPaymentError) throw confirmPaymentError;

  return paymentIntentData;
}
