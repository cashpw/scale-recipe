const convert = require('convert-units');
import { parseIngredient, Ingredient } from 'parse-ingredient';
// import {formatQuantity} from 'format-quantity';
const spelling = require('american-english');
import { Decimal } from 'decimal.js';

// const convert = configureMeasurements(allMeasures);

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

function getUnitsToExclude(quantity: number, unitOfMeasure: string) {
  const unitsToExclude = EXCLUDE_UNITS;

  if (unitOfMeasure === 'cup' && quantity > 1 / 8) {
    unitsToExclude.push('Tbs');
    unitsToExclude.push('tsp');
  }

  return unitsToExclude;
}

function getBestUnitOfMeasure(
  quantity: number,
  quantity2: number|null,
  currentUnitOfMeasure: string,
): { val: number; unit: string, humanUnit: string,} {
  const relevantUnitOfMeasure = UNIT_OF_MEASURE_CONVERSION[currentUnitOfMeasure]
    ? UNIT_OF_MEASURE_CONVERSION[currentUnitOfMeasure]
    : currentUnitOfMeasure;
  const bestUnitOfMeasure = convert(quantity)
    .from(relevantUnitOfMeasure)
    .toBest({ exclude: getUnitsToExclude(quantity, currentUnitOfMeasure) });

  let pluralizedUnitOfMeasure: string;
  if (quantity2) {
    const convertedQuantity2 = convert(quantity2).from(UNIT_OF_MEASURE_CONVERSION[currentUnitOfMeasure]).to(bestUnitOfMeasure.unit);
    pluralizedUnitOfMeasure = (
    convertedQuantity2 > 1
      ? bestUnitOfMeasure.plural
      : bestUnitOfMeasure.singular
  );
  } else {
  pluralizedUnitOfMeasure = (
    bestUnitOfMeasure.val > 1
      ? bestUnitOfMeasure.plural
      : bestUnitOfMeasure.singular
  );
  }
  pluralizedUnitOfMeasure = pluralizedUnitOfMeasure.toLowerCase();
  const unitedStatesSpelling = spelling.toUS(pluralizedUnitOfMeasure);

  if (unitedStatesSpelling === 'word_not_found') {
    return {
      val: bestUnitOfMeasure.val,
      unit: bestUnitOfMeasure.unit,
      humanUnit: pluralizedUnitOfMeasure,
    };
  }

  return {
    val: bestUnitOfMeasure.val,
    unit: bestUnitOfMeasure.unit,
    humanUnit:
      unitedStatesSpelling !== 'word_not_found'
        ? unitedStatesSpelling
        : pluralizedUnitOfMeasure,
  };
}

function ingredientToString(ingredient: Ingredient): string {
  const { quantity, quantity2, unitOfMeasureID } = ingredient;
  const components = [];

  if (quantity2) {
    const { val: quantityVal, unit,humanUnit,} = getBestUnitOfMeasure(
      quantity,
      quantity2,
      unitOfMeasureID,
    );
    const quantity2Val = convert(quantity2).from(UNIT_OF_MEASURE_CONVERSION[unitOfMeasureID]).to(unit);

    components.push(`${quantityVal}-${quantity2Val}`);
    components.push(humanUnit);
  } else {
    const { val, humanUnit } = getBestUnitOfMeasure(
      quantity,
      /* quantity2= */ null,
      unitOfMeasureID,
    );

    components.push(val);
    components.push(humanUnit);
  }

  if (ingredient.description) {
    components.push(ingredient.description);
  }

  return components.join(' ');
}

const FIRST_FRACTIONAL_REGEX = /^([0-9]+)\/([0-9]+)/;
const SECOND_FRACTIONAL_REGEX = /^[^\s]+-([0-9]+)\/([0-9]+)/;
const RANGE_FRACTIONAL_REGEX = /^([0-9]+)\/([0-9]+)-([0-9]+)\/([0-9]+)/;

export function scale(ingredient: string, factor: number): string {
  const parsedIngredient = parseIngredient(ingredient, {
    normalizeUOM: true,
    allowLeadingOf: true,
  })[0];

  let quantity = parsedIngredient.quantity === null ? null : new Decimal(parsedIngredient.quantity);
  let quantity2 = parsedIngredient.quantity2 === null ? null : new Decimal(parsedIngredient.quantity2);
  if (RANGE_FRACTIONAL_REGEX.test(ingredient)) {
    const match = ingredient.match(RANGE_FRACTIONAL_REGEX);
    const quantity1Numerator = match[1];
    const quantity1Denominator = match[2];
    const quantity2Numerator = match[3];
    const quantity2Denominator = match[4];

    quantity = new Decimal(quantity1Numerator).dividedBy(quantity1Denominator);
    quantity2 = new Decimal(quantity2Numerator).dividedBy(quantity2Denominator);
  } else if (FIRST_FRACTIONAL_REGEX.test(ingredient)) {
    const match = ingredient.match(FIRST_FRACTIONAL_REGEX);
    const numerator = match[1];
    const denominator = match[2];

    quantity = new Decimal(numerator).dividedBy(denominator);
  } else if (SECOND_FRACTIONAL_REGEX.test(ingredient)) {
    const match = ingredient.match(SECOND_FRACTIONAL_REGEX);
    const numerator = match[1];
    const denominator = match[2];

    quantity = new Decimal(numerator).dividedBy(denominator);
  }

  const scaledQuantity =
    quantity
      ? quantity.times(factor).toNumber()
      : null;
  const scaledQuantity2 =
    quantity2
      ? quantity2.times(factor).toNumber()
      : null;

  return ingredientToString({
    ...parsedIngredient,
    quantity: scaledQuantity,
    quantity2: scaledQuantity2,
  });
}
