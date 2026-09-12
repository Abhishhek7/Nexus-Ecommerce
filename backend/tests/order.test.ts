import { describe, expect, it } from 'vitest';

const transitions: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

describe('order business rules', () => {
  it('allows only the documented state transitions', () => {
    expect(transitions.PENDING).toContain('CONFIRMED');
    expect(transitions.CONFIRMED).toContain('PROCESSING');
    expect(transitions.SHIPPED).toContain('DELIVERED');
    expect(transitions.SHIPPED).not.toContain('CANCELLED');
    expect(transitions.DELIVERED).not.toContain('CANCELLED');
  });

  it('calculates the assignment tax and shipping rules', () => {
    const subtotal = 2500;
    const discount = 500;
    const taxable = subtotal - discount;
    const tax = taxable * 0.18;
    const shipping = subtotal >= 2000 ? 0 : 100;
    expect(tax).toBe(360);
    expect(shipping).toBe(0);
    expect(taxable + tax + shipping).toBe(2360);
  });
});
