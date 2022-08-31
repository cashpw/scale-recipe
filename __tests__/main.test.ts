import { scale } from '../src/main.js';

describe('scale', () => {
  describe('imperial', () => {
    describe('from whole cup', () => {
      const ingredient = '1 cup milk';
      it('to single cup', () => {
        expect(scale(ingredient, 1)).toEqual('1 cup milk');
      });
      it('to single pint', () => {
        expect(scale(ingredient, 2)).toEqual('1 pint milk');
      });
      it('to single quart', () => {
        expect(scale(ingredient, 4)).toEqual('1 quart milk');
      });
      it('to single gallon', () => {
        expect(scale(ingredient, 16)).toEqual('1 gallon milk');
      });
    });

    describe('from decimal cup', () => {
      const ingredient = '0.5 cup milk';
      it('to cup', () => {
        expect(scale(ingredient, 2)).toEqual('1 cup milk');
      });
      it('to pint', () => {
        expect(scale(ingredient, 2*2)).toEqual('1 pint milk');
      });
      it('to quart', () => {
        expect(scale(ingredient, 4*2)).toEqual('1 quart milk');
      });
      it('to gallon', () => {
        expect(scale(ingredient, 16*2)).toEqual('1 gallon milk');
      });
    });

    describe('from fractional cup', () => {
      const ingredient = '1/2 cup milk';
      it('to cup', () => {
        expect(scale(ingredient, 2)).toEqual('1 cup milk');
      });
      it('to pint', () => {
        expect(scale(ingredient, 2*2)).toEqual('1 pint milk');
      });
      it('to quart', () => {
        expect(scale(ingredient, 4*2)).toEqual('1 quart milk');
      });
      it('to gallon', () => {
        expect(scale(ingredient, 16*2)).toEqual('1 gallon milk');
      });
    });

    describe('from irrational fraction cup', () => {
      const ingredient = '1 1/2 cup milk';
      it('to pints', () => {
        expect(scale(ingredient, 2)).toEqual('1 1/2 pints milk');
      });
      it('to quarts', () => {
        expect(scale(ingredient, 4)).toEqual('1 1/2 quarts milk');
      });
      it('to gallons', () => {
        expect(scale(ingredient, 16)).toEqual('1 1/2 gallons milk');
      });
    });
  });

  it('is NOOP for factor of 1 with singular whole quantity', () => {
    const ingredient = '1 cup milk';

    expect(scale(ingredient, 1)).toEqual(ingredient);
  });

  it('formats from cups to cups', () => {
    const ingredient = '1.5 cups milk';

    expect(scale(ingredient, 1)).toEqual('1 1/2 cups milk');
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

  it('scales by positive fractional numbers to whole number', () => {
    const ingredient = '1/3 cups milk';

    expect(scale(ingredient, 3)).toEqual('1 cup milk');
  });

  it('scales and formats by a range of positive fractional imperial numbers', () => {
    const ingredient = '1/3-2/3 cups milk';

    expect(scale(ingredient, 14)).toEqual('1 1/6-2 1/3 quarts milk');
  });

  it('scales and formats by a range of positive fractional imperial numbers to whole numbers', () => {
    const ingredient = '1/3-2/3 cups milk';

    expect(scale(ingredient, 3)).toEqual('1-2 cups milk');
  });

  it('scales and formats by a mixed range of positive fractional imperial numbers', () => {
    const ingredient = '1-1 2/3 cups milk';

    expect(scale(ingredient, 14)).toEqual('3 1/2-5 5/6 quarts milk');
  });

  /*
  it('scales and formats by a range of positive fractional imperial numbers', () => {
    const ingredient = '1/3 cups milk';

    expect(scale(ingredient, 14)).toEqual('1 1/6 quarts milk');
  });
  */

  it('scales by a range of positive fractional metric numbers', () => {
    const ingredient = '500-600 milliliters milk';

    expect(scale(ingredient, 3)).toEqual('1.5-1.8 liters milk');
  });

  it('supports "of"', () => {
    const ingredient = '500-600 milliliters of milk';

    expect(scale(ingredient, 3)).toEqual('1.5-1.8 liters of milk');
  });

  it('supports "bunches"', () => {
    const ingredient = '1-2 bunches of flax';

    expect(scale(ingredient, 3)).toEqual('3-6 bunches of flax');
  });

  it('supports sixteenths', () => {
    const ingredient = '1 tablespoon cream';

    expect(scale(ingredient, 100)).toEqual('1 9/16 quarts cream');
  });
});
