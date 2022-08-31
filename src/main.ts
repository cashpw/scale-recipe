const convert = require('convert-units');
const spelling = require('american-english');
const pluralize = require('pluralize');

import { Decimal } from 'decimal.js';
import { parseIngredient, Ingredient } from 'parse-ingredient';
import { formatQuantity } from 'format-quantity-with-sixteenths';

const UNIT_OF_MEASURE_CONVERSION = {
  // Mass | imperial
  ounce: 'oz',
  pound: 'lb',

  // Mass | metric
  milligram: 'mg',
  gram: 'g',
  kilogram: 'kg',

  // Volume | imperial
  teaspoon: 'tsp',
  tablespoon: 'Tbs',
  cup: 'cup',
  pint: 'pnt',
  quart: 'qt',
  gallon: 'gal',

  // Volume | metric
  milliliter: 'ml',
  liter: 'l',
  kiloliter: 'kl',
};

const EXCLUDE_UNITS = [
  // Mass | imperial
  't',

  // Mass | metric
  'mcg',
  'mt',

  // Volume | imperial
  'fl-oz',
  'in3',
  'ft3',
  'yd3',

  // Volume | metric
  'mm3',
  'cm3',
  'm3',
  'km3',
  'cl',
  'dl',
  'krm',
  'tsk',
  'msk',
  'kkp',
  'glas',
  'kanna',
];

const IMPERIAL_UNITS = [
  // Mass | imperial
  'qt',
  'oz',

  // Volume | imperial
  'tsp',
  'Tbs',
  'cup',
  'pnt',
  'qt',
  'gal',
];

function getUnitsToExclude(quantity: number, unitOfMeasure: string): string[] {
  const unitsToExclude = EXCLUDE_UNITS;

  if (unitOfMeasure === 'cup' && quantity > 1 / 8) {
    unitsToExclude.push('Tbs');
    unitsToExclude.push('tsp');
  }

  return unitsToExclude;
}

function getHumanUnit(singular: string, plural: string, value: number): string {
  const pluralizedUnitOfMeasure = (value > 1 ? plural : singular).toLowerCase();
  const unitedStatesSpelling = spelling.toUS(
    pluralizedUnitOfMeasure.toLowerCase(),
  );

  if (unitedStatesSpelling === 'word_not_found') {
    return pluralizedUnitOfMeasure;
  }

  return unitedStatesSpelling;
}

function getBestUnitOfMeasure(
  quantity: number,
  currentUnitOfMeasure: string,
): { singular: string; plural: string; val: number; unit: string } {
  const relevantUnitOfMeasure = UNIT_OF_MEASURE_CONVERSION[currentUnitOfMeasure]
    ? UNIT_OF_MEASURE_CONVERSION[currentUnitOfMeasure]
    : currentUnitOfMeasure;
  let bestUnitOfMeasure;
  try {
    bestUnitOfMeasure = convert(quantity)
      .from(relevantUnitOfMeasure)
      .toBest({ exclude: getUnitsToExclude(quantity, currentUnitOfMeasure) });
  } catch (e) {
    bestUnitOfMeasure = {
      singular: currentUnitOfMeasure,
      plural: pluralize(currentUnitOfMeasure),
      val: quantity,
      unit: currentUnitOfMeasure,
    };
  }

  return {
    ...bestUnitOfMeasure,
  };
}

function ingredientToString(ingredient: Ingredient): string {
  const { quantity, quantity2, unitOfMeasureID } = ingredient;
  const components = [];

  if (unitOfMeasureID) {
    const formatQuantityOptions = {
      tolerance: 0.009,
    };

    if (quantity2) {
      const {
        val: quantityVal,
        unit,
        singular,
        plural,
      } = getBestUnitOfMeasure(quantity, unitOfMeasureID);
      let quantity2Val;
      try {
        quantity2Val = convert(quantity2)
          .from(UNIT_OF_MEASURE_CONVERSION[unitOfMeasureID])
          .to(unit);
      } catch (e) {
        quantity2Val = quantity2;
      }
      const humanUnit = getHumanUnit(singular, plural, quantity2Val);

      if (IMPERIAL_UNITS.includes(unit)) {
        const formattedQuantityVal = formatQuantity(
          quantityVal,
          formatQuantityOptions,
        );
        const formattedQuantity2Val = formatQuantity(
          quantity2Val,
          formatQuantityOptions,
        );

        components.push(`${formattedQuantityVal}-${formattedQuantity2Val}`);
      } else {
        components.push(`${quantityVal}-${quantity2Val}`);
      }
      components.push(humanUnit);
    } else {
      const {
        val: quantityVal,
        singular,
        plural,
        unit,
      } = getBestUnitOfMeasure(quantity, unitOfMeasureID);
      const humanUnit = getHumanUnit(singular, plural, quantityVal);

      if (IMPERIAL_UNITS.includes(unit)) {
        const formattedQuantityVal = formatQuantity(
          quantityVal,
          formatQuantityOptions,
        );
        components.push(`${formattedQuantityVal}`);
      } else {
        components.push(`${quantityVal}`);
      }
      components.push(humanUnit);
    }
  }

  if (ingredient.description) {
    components.push(ingredient.description);
  }

  return components.join(' ');
}

const QUANTITY_NUMBERS = /([0-9 .\/]+)/g
const IMPROPER_FRACTION = /^([0-9]+) ([0-9]+)\/([0-9]+)/
const FRACTION = /^([0-9]+)\/([0-9]+)/

function decimalify(quantity: string): Decimal {
  if (IMPROPER_FRACTION.test(quantity)) {
    const [_, whole, numerator, denominator] = quantity.match(IMPROPER_FRACTION);

    return new Decimal(whole).times(denominator).plus(numerator).dividedBy(denominator);
  }

  if (FRACTION.test(quantity)) {
    const [_, numerator, denominator] = quantity.match(FRACTION);

    return new Decimal(numerator).dividedBy(denominator);
  }

  return new Decimal(quantity);
}


function parseQuantities(ingredient:string, parsedIngredient: {quantity: number|null, quantity2: number|null}): {quantity: Decimal|null, quantity2: Decimal|null} {
  let quantity =
    parsedIngredient.quantity === null
      ? null
      : new Decimal(parsedIngredient.quantity);
  let quantity2 =
    parsedIngredient.quantity2 === null
      ? null
      : new Decimal(parsedIngredient.quantity2);

  const quantityNumbers = ingredient.match(QUANTITY_NUMBERS).filter((match) => match !== ' '
  ).map((match) => match.trim());
  if (quantityNumbers.length == 1) {
    //console.log(quantityNumbers)
    quantity = decimalify(quantityNumbers[0]);
  } else {
    //console.log(quantityNumbers[0])
    //console.log(quantityNumbers[1])
    quantity = decimalify(quantityNumbers[0]);
    quantity2 = decimalify(quantityNumbers[1]);
  }

  return {
    quantity,
    quantity2,
  };
}

export function scale(ingredient: string, factor: number): string {
  const parsedIngredient = parseIngredient(ingredient.toLowerCase(), {
    normalizeUOM: true,
    allowLeadingOf: true,
  })[0];

  const {quantity, quantity2} = parseQuantities(ingredient, parsedIngredient);

  const scaledQuantity = quantity ? quantity.times(factor).toNumber() : null;
  const scaledQuantity2 = quantity2 ? quantity2.times(factor).toNumber() : null;

  return ingredientToString({
    ...parsedIngredient,
    quantity: scaledQuantity,
    quantity2: scaledQuantity2,
  });
}
