import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { CartProvider, useCart } from './CartContext';
import '@testing-library/jest-dom';

const TestComponent = () => {
  const { items, getItemCount } = useCart();
  return (
    <div>
      <div data-testid="item-count">{getItemCount()}</div>
      <div data-testid="items-length">{items.length}</div>
    </div>
  );
};

describe('CartContext', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('handles invalid JSON in localStorage gracefully', async () => {
    window.localStorage.setItem('meraki_web_cart', 'invalid-json');

    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('item-count')).toHaveTextContent('0');
      expect(screen.getByTestId('items-length')).toHaveTextContent('0');
    });

    expect(console.error).toHaveBeenCalledWith(
      'Error loading cart:',
      expect.any(SyntaxError)
    );
  });
});
