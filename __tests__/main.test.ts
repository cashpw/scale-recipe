import { scale } from '../src/main.js';

describe('scale', () => {
  it('is NOOP for factor of 1 with singular whole quantity', () => {
    const ingredient = '1 cup milk';

    expect(scale(ingredient, 1)).toEqual(ingredient);
  });

  it('scales from cups to pints', () => {
    const ingredient = '3 cups milk';

    expect(scale(ingredient, 1)).toEqual('1.5 pints milk');
  });

  it('scales from cups to cups', () => {
    const ingredient = '1.5 cups milk';

    expect(scale(ingredient, 1)).toEqual('1.5 cups milk');
  });

  it('does NOT format quantity for metric units of measure', () => {
    const ingredient = '1.5 liters milk';

    expect(scale(ingredient, 1)).toEqual('1.5 liters milk');
  });

  it('scales by positive whole number', () => {
    const ingredient = '1 milliliter milk';

    expect(scale(ingredient, 2)).toEqual('2 milliliters milk');
  });

  it('scales to positive fractional number', () => {
    const ingredient = '1 milliliter milk';

    expect(scale(ingredient, 1.5)).toEqual('1.5 milliliters milk');
  });

  it('scales to singular larger unit', () => {
    const ingredient = '1 milliliter milk';

    expect(scale(ingredient, 1000)).toEqual('1 liter milk');
  });

  it('scales to plural larger unit', () => {
    const ingredient = '1 milliliter milk';

    expect(scale(ingredient, 2000)).toEqual('2 liters milk');
  });

  it('scales by positive fractional numbers', () => {
    const ingredient = '1/3 cups milk';

    expect(scale(ingredient, 3)).toEqual('1 cup milk');
  });

  it('scales by a range of positive fractional imperial numbers', () => {
    const ingredient = '1/3-2/3 cups milk';

    expect(scale(ingredient, 14)).toEqual('1-2 cups milk');
  });

  it('scales by a range of positive fractional metric numbers', () => {
    const ingredient = '500-600 milliliters milk';

    expect(scale(ingredient, 3)).toEqual('1.5-1.8 liters milk');
  });

  it('supports "of"', () => {
    const ingredient = '500-600 milliliters of milk';

    expect(scale(ingredient, 3)).toEqual('1.5-1.8 liters of milk');
  });
});