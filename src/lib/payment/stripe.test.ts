import { createSetupIntent, createAndConfirmPaymentIntent } from './stripe';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Stripe, StripeCardElement } from '@stripe/stripe-js';

describe('stripe utils', () => {
  let mockSupabase: any;
  let mockStripe: any;
  let mockCardElement: any;

  beforeEach(() => {
    mockSupabase = {
      functions: {
        invoke: jest.fn(),
      },
    };

    mockStripe = {
      confirmCardSetup: jest.fn(),
      confirmCardPayment: jest.fn(),
    };

    mockCardElement = {};
  });

  describe('createSetupIntent', () => {
    it('successfully creates and confirms a setup intent', async () => {
      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: {
          clientSecret: 'test_client_secret',
          setupIntentId: 'test_setup_intent_id',
          customerId: 'test_customer_id',
        },
        error: null,
      });

      mockStripe.confirmCardSetup.mockResolvedValueOnce({
        setupIntent: {
          payment_method: 'test_payment_method_id',
        },
        error: null,
      });

      const result = await createSetupIntent(
        mockSupabase as SupabaseClient,
        mockStripe as Stripe,
        mockCardElement as StripeCardElement,
        'test@example.com',
        'cust_123'
      );

      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('setup-intent', {
        body: { user_email: 'test@example.com', customer_id: 'cust_123' },
      });
      expect(mockStripe.confirmCardSetup).toHaveBeenCalledWith('test_client_secret', {
        payment_method: { card: mockCardElement },
      });
      expect(result).toEqual({
        paymentMethodId: 'test_payment_method_id',
        setupIntentId: 'test_setup_intent_id',
        customerId: 'test_customer_id',
      });
    });

    it('throws error if supabase functions invoke fails', async () => {
      const mockError = new Error('Supabase function error');
      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: null,
        error: mockError,
      });

      await expect(
        createSetupIntent(
          mockSupabase as SupabaseClient,
          mockStripe as Stripe,
          mockCardElement as StripeCardElement,
          'test@example.com',
          'cust_123'
        )
      ).rejects.toThrow(mockError);

      expect(mockSupabase.functions.invoke).toHaveBeenCalled();
      expect(mockStripe.confirmCardSetup).not.toHaveBeenCalled();
    });

    it('throws error if stripe confirmCardSetup fails', async () => {
      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: {
          clientSecret: 'test_client_secret',
          setupIntentId: 'test_setup_intent_id',
          customerId: 'test_customer_id',
        },
        error: null,
      });

      const mockError = new Error('Stripe confirm error');
      mockStripe.confirmCardSetup.mockResolvedValueOnce({
        setupIntent: null,
        error: mockError,
      });

      await expect(
        createSetupIntent(
          mockSupabase as SupabaseClient,
          mockStripe as Stripe,
          mockCardElement as StripeCardElement,
          'test@example.com',
          'cust_123'
        )
      ).rejects.toThrow(mockError);

      expect(mockSupabase.functions.invoke).toHaveBeenCalled();
      expect(mockStripe.confirmCardSetup).toHaveBeenCalled();
    });
  });

  describe('createAndConfirmPaymentIntent', () => {
    const defaultOptions = {
      amount: 1000,
      currency: 'usd',
      customerId: 'cust_123',
      paymentMethodId: 'pm_123',
      masterId: 'master_123',
      description: 'Test payment',
    };

    it('successfully creates and confirms a payment intent using a saved card', async () => {
      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: {
          paymentIntentId: 'pi_123',
          clientSecret: 'pi_secret_123',
        },
        error: null,
      });

      mockStripe.confirmCardPayment.mockResolvedValueOnce({
        paymentIntent: { id: 'pi_123' },
        error: null,
      });

      const result = await createAndConfirmPaymentIntent(
        mockSupabase as SupabaseClient,
        mockStripe as Stripe,
        defaultOptions,
        true
      );

      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('create-payment-intent', {
        body: {
          amount: 1000,
          currency: 'usd',
          customer_id: 'cust_123',
          payment_method_id: 'pm_123',
          master_id: 'master_123',
          description: 'Test payment',
          capture_method: 'automatic',
        },
      });
      expect(mockStripe.confirmCardPayment).toHaveBeenCalledWith('pi_secret_123', {
        payment_method: 'pm_123',
      });
      expect(result).toEqual({
        paymentIntentId: 'pi_123',
        clientSecret: 'pi_secret_123',
      });
    });

    it('successfully creates and confirms a payment intent without using a saved card', async () => {
      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: {
          paymentIntentId: 'pi_123',
          clientSecret: 'pi_secret_123',
        },
        error: null,
      });

      mockStripe.confirmCardPayment.mockResolvedValueOnce({
        paymentIntent: { id: 'pi_123' },
        error: null,
      });

      const result = await createAndConfirmPaymentIntent(
        mockSupabase as SupabaseClient,
        mockStripe as Stripe,
        defaultOptions,
        false
      );

      expect(mockSupabase.functions.invoke).toHaveBeenCalled();
      expect(mockStripe.confirmCardPayment).toHaveBeenCalledWith('pi_secret_123', undefined);
      expect(result).toEqual({
        paymentIntentId: 'pi_123',
        clientSecret: 'pi_secret_123',
      });
    });

    it('throws error if supabase functions invoke fails', async () => {
      const mockError = new Error('Supabase payment intent error');
      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: null,
        error: mockError,
      });

      await expect(
        createAndConfirmPaymentIntent(
          mockSupabase as SupabaseClient,
          mockStripe as Stripe,
          defaultOptions,
          true
        )
      ).rejects.toThrow(mockError);

      expect(mockSupabase.functions.invoke).toHaveBeenCalled();
      expect(mockStripe.confirmCardPayment).not.toHaveBeenCalled();
    });

    it('throws error if stripe confirmCardPayment fails', async () => {
      mockSupabase.functions.invoke.mockResolvedValueOnce({
        data: {
          paymentIntentId: 'pi_123',
          clientSecret: 'pi_secret_123',
        },
        error: null,
      });

      const mockError = new Error('Stripe confirm payment error');
      mockStripe.confirmCardPayment.mockResolvedValueOnce({
        paymentIntent: null,
        error: mockError,
      });

      await expect(
        createAndConfirmPaymentIntent(
          mockSupabase as SupabaseClient,
          mockStripe as Stripe,
          defaultOptions,
          true
        )
      ).rejects.toThrow(mockError);

      expect(mockSupabase.functions.invoke).toHaveBeenCalled();
      expect(mockStripe.confirmCardPayment).toHaveBeenCalled();
    });
  });
});
