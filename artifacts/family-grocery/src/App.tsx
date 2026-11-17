import { type ReactNode, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Check, CircleDollarSign, Clock3, MapPin, Pencil, RotateCcw, ShoppingBasket, ChevronDown, Leaf } from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import './index.css';

const queryClient = new QueryClient();
type Step = 'setup' | 'plan' | 'compare' | 'confirmed';
type StorePlan = 'usual' | 'save';
type WeekChoice = 'standard' | 'extra';
type MealType = 'Breakfast' | 'Lunch' | 'Dinner';
type Diet = 'none' | 'vegetarian' | 'vegan';
type IngredientKey = keyof typeof ingredientCatalog;
type RecipeIngredient = { key: IngredientKey; amount: number };

// Seeded unit prices and store package sizes are illustrative prototype data.
const ingredientCatalog = {
  oats: { name: 'Rolled oats', unit: 'lb', price: 1.08, check: true },
  banana: { name: 'Bananas', unit: 'lb', price: .88 },
  peanut: { name: 'Peanut butter', unit: 'oz', price: .13 },
  eggs: { name: 'Eggs', unit: 'each', price: .25 },
  spinach: { name: 'Spinach', unit: 'oz', price: .18 },
  bread: { name: 'Whole-grain bread', unit: 'oz', price: .09, gluten: true },
  apples: { name: 'Apples', unit: 'lb', price: 1.22 },
  cinnamon: { name: 'Cinnamon', unit: 'tsp', price: .08, check: true },
  blackBeans: { name: 'Black beans', unit: 'can', price: 1.05 },
  tortillas: { name: 'Corn tortillas', unit: 'each', price: .16, check: true },
  salsa: { name: 'Salsa', unit: 'oz', price: .10, check: true },
  rice: { name: 'Brown rice', unit: 'lb', price: .82 },
  carrots: { name: 'Carrots', unit: 'lb', price: .78 },
  lentils: { name: 'Dry lentils', unit: 'lb', price: 1.35 },
  tomatoes: { name: 'Canned tomatoes', unit: 'can', price: 1.08 },
  oil: { name: 'Cooking oil', unit: 'tbsp', price: .09 },
  seasoning: { name: 'Seasoning blend', unit: 'tsp', price: .08, check: true },
  chickpeas: { name: 'Chickpeas', unit: 'can', price: 1.05 },
  yogurt: { name: 'Plain yogurt', unit: 'oz', price: .08, dairy: true },
  tuna: { name: 'Tuna', unit: 'can', price: 1.28, meat: true },
  chicken: { name: 'Chicken thighs', unit: 'lb', price: 2.35, meat: true },
  potatoes: { name: 'Potatoes', unit: 'lb', price: .58 },
  cabbage: { name: 'Cabbage', unit: 'lb', price: .72 },
  cheese: { name: 'Shredded cheese', unit: 'oz', price: .24, dairy: true },
  pasta: { name: 'Whole-wheat pasta', unit: 'lb', price: 1.15, gluten: true },
  frozenVeg: { name: 'Frozen mixed vegetables', unit: 'oz', price: .09 },
  onion: { name: 'Onions', unit: 'each', price: .38 },
  garlic: { name: 'Garlic', unit: 'clove', price: .08 },
  tofu: { name: 'Firm tofu', unit: 'oz', price: .12 },
  veganYogurt: { name: 'Plain plant-based yogurt', unit: 'oz', price: .12 },
  veganCheese: { name: 'Plant-based shredded cheese', unit: 'oz', price: .34 },
  gfBread: { name: 'Gluten-free bread', unit: 'oz', price: .16, check: true },
  gfPasta: { name: 'Gluten-free pasta', unit: 'lb', price: 2.05, check: true },
  berries: { name: 'Frozen berries', unit: 'oz', price: .13 },
  lemon: { name: 'Lemon', unit: 'each', price: .55 },
} as const;
type Store = 'kroger' | 'aldi';
type StoreBuy = { packageSize: number; packages: number; quantity: number; cost: number };
type BasketItem = {
  key: IngredientKey; item: string; unit: string; needed: number; alreadyHave: number; pantryEntered: number; pantryUnit: string; remaining: number;
  check: boolean; krogerBuy: StoreBuy; aldiBuy: StoreBuy;
};
// Average edible-size estimates used only to translate counted fruit into pounds;
// bananas are weighed whole and unpeeled for checkout estimates.
const pieceWeightLb: Partial<Record<IngredientKey, number>> = { apples: .33, banana: .26 };
const packageSizes: Record<IngredientKey, Record<Store, number>> = {
  oats: { kroger: 2, aldi: 2 }, banana: { kroger: 1, aldi: 1 }, peanut: { kroger: 16, aldi: 16 },
  eggs: { kroger: 12, aldi: 12 }, spinach: { kroger: 5, aldi: 10 }, bread: { kroger: 20, aldi: 24 },
  apples: { kroger: 3, aldi: 3 }, cinnamon: { kroger: 12, aldi: 24 }, blackBeans: { kroger: 1, aldi: 1 },
  tortillas: { kroger: 10, aldi: 20 }, salsa: { kroger: 16, aldi: 24 }, rice: { kroger: 2, aldi: 5 },
  carrots: { kroger: 1, aldi: 2 }, lentils: { kroger: 1, aldi: 2 }, tomatoes: { kroger: 1, aldi: 1 },
  oil: { kroger: 64, aldi: 128 }, seasoning: { kroger: 24, aldi: 48 }, chickpeas: { kroger: 1, aldi: 1 },
  yogurt: { kroger: 32, aldi: 32 }, tuna: { kroger: 1, aldi: 1 }, chicken: { kroger: 1, aldi: 2 },
  potatoes: { kroger: 5, aldi: 10 }, cabbage: { kroger: 1, aldi: 1 }, cheese: { kroger: 8, aldi: 16 },
  pasta: { kroger: 1, aldi: 2 }, frozenVeg: { kroger: 12, aldi: 16 }, onion: { kroger: 1, aldi: 3 },
  garlic: { kroger: 10, aldi: 20 }, tofu: { kroger: 14, aldi: 14 }, veganYogurt: { kroger: 24, aldi: 32 },
  veganCheese: { kroger: 8, aldi: 16 }, gfBread: { kroger: 16, aldi: 18 }, gfPasta: { kroger: .75, aldi: 1 },
  berries: { kroger: 12, aldi: 16 }, lemon: { kroger: 1, aldi: 3 },
};

type MealSeed = { type: MealType; day: string; title: string; note: string; ingredients: RecipeIngredient[]; prep: number; cook: number };
const seeds: MealSeed[] = [
  { type: 'Breakfast', day: 'Mon', title: 'Banana peanut-butter oatmeal', note: 'A warm bowl with creamy peanut butter and sliced banana.', ingredients: [{ key: 'oats', amount: .65 }, { key: 'banana', amount: .7 }, { key: 'peanut', amount: 3 }, { key: 'cinnamon', amount: 1 }], prep: 5, cook: 8 },
  { type: 'Breakfast', day: 'Tue', title: 'Spinach eggs & toast', note: 'Soft eggs and spinach with a slice of toast.', ingredients: [{ key: 'eggs', amount: 6 }, { key: 'spinach', amount: 4 }, { key: 'bread', amount: 6 }, { key: 'oil', amount: 1 }], prep: 7, cook: 8 },
  { type: 'Breakfast', day: 'Wed', title: 'Yogurt, oats & banana bowls', note: 'Cool yogurt topped with oats, banana, and berries.', ingredients: [{ key: 'yogurt', amount: 18 }, { key: 'oats', amount: .35 }, { key: 'banana', amount: .5 }, { key: 'berries', amount: 6 }], prep: 8, cook: 0 },
  { type: 'Breakfast', day: 'Thu', title: 'Apple-cinnamon oatmeal', note: 'Tender apple and cinnamon stirred into warm oats.', ingredients: [{ key: 'oats', amount: .65 }, { key: 'apples', amount: .6 }, { key: 'cinnamon', amount: 1 }, { key: 'peanut', amount: 2 }], prep: 5, cook: 8 },
  { type: 'Breakfast', day: 'Fri', title: 'Bean & egg breakfast tacos', note: 'A hearty filling of beans, eggs, and mild salsa.', ingredients: [{ key: 'eggs', amount: 4 }, { key: 'blackBeans', amount: 1 }, { key: 'tortillas', amount: 8 }, { key: 'salsa', amount: 3 }], prep: 8, cook: 10 },
  { type: 'Breakfast', day: 'Sat', title: 'Peanut-butter toast & fruit', note: 'Toast with peanut butter and fresh apple slices.', ingredients: [{ key: 'bread', amount: 12 }, { key: 'peanut', amount: 4 }, { key: 'apples', amount: .7 }], prep: 7, cook: 3 },
  { type: 'Breakfast', day: 'Sun', title: 'Potato, spinach & egg skillet', note: 'Golden potatoes, wilted greens, and gently cooked eggs.', ingredients: [{ key: 'potatoes', amount: 1.2 }, { key: 'spinach', amount: 4 }, { key: 'eggs', amount: 6 }, { key: 'oil', amount: 2 }, { key: 'seasoning', amount: 1 }], prep: 10, cook: 18 },
  { type: 'Lunch', day: 'Mon', title: 'Black bean & rice bowls', note: 'Rice, warm beans, crunchy cabbage, and salsa.', ingredients: [{ key: 'rice', amount: .65 }, { key: 'blackBeans', amount: 2 }, { key: 'cabbage', amount: .5 }, { key: 'salsa', amount: 4 }, { key: 'oil', amount: 1 }], prep: 8, cook: 25 },
  { type: 'Lunch', day: 'Tue', title: 'Chicken & carrot wraps', note: 'Tender chicken, crisp carrots, and greens in soft wraps.', ingredients: [{ key: 'chicken', amount: .8 }, { key: 'carrots', amount: .5 }, { key: 'spinach', amount: 3 }, { key: 'tortillas', amount: 8 }, { key: 'yogurt', amount: 3 }], prep: 12, cook: 15 },
  { type: 'Lunch', day: 'Wed', title: 'Lentil tomato soup & toast', note: 'A simple one-pot soup with carrots and toast on the side.', ingredients: [{ key: 'lentils', amount: .55 }, { key: 'tomatoes', amount: 1 }, { key: 'carrots', amount: .5 }, { key: 'onion', amount: 1 }, { key: 'bread', amount: 8 }, { key: 'seasoning', amount: 1 }], prep: 12, cook: 30 },
  { type: 'Lunch', day: 'Thu', title: 'Chickpea spinach rice bowls', note: 'Chickpeas and greens over rice with a cool yogurt dressing.', ingredients: [{ key: 'chickpeas', amount: 2 }, { key: 'spinach', amount: 4 }, { key: 'rice', amount: .5 }, { key: 'yogurt', amount: 5 }, { key: 'lemon' as IngredientKey, amount: 1 }], prep: 10, cook: 20 },
  { type: 'Lunch', day: 'Fri', title: 'Tuna & apple sandwiches', note: 'Tuna salad sandwiches with crisp apple on the side.', ingredients: [{ key: 'tuna', amount: 2 }, { key: 'yogurt', amount: 4 }, { key: 'bread', amount: 12 }, { key: 'apples', amount: .6 }], prep: 12, cook: 0 },
  { type: 'Lunch', day: 'Sat', title: 'Egg salad & carrot sticks', note: 'Creamy egg salad on toast with crunchy carrots.', ingredients: [{ key: 'eggs', amount: 6 }, { key: 'yogurt', amount: 3 }, { key: 'bread', amount: 10 }, { key: 'carrots', amount: .5 }, { key: 'seasoning', amount: .5 }], prep: 12, cook: 10 },
  { type: 'Lunch', day: 'Sun', title: 'Salsa bean & rice bowls', note: 'Rice and beans with vegetables and a spoonful of salsa.', ingredients: [{ key: 'rice', amount: .6 }, { key: 'blackBeans', amount: 2 }, { key: 'frozenVeg', amount: 8 }, { key: 'salsa', amount: 4 }, { key: 'oil', amount: 1 }], prep: 8, cook: 25 },
  { type: 'Dinner', day: 'Mon', title: 'Sheet-pan chicken & potatoes', note: 'Chicken thighs roasted with potatoes and carrots.', ingredients: [{ key: 'chicken', amount: 1.4 }, { key: 'potatoes', amount: 1.4 }, { key: 'carrots', amount: .7 }, { key: 'oil', amount: 2 }, { key: 'seasoning', amount: 2 }], prep: 12, cook: 40 },
  { type: 'Dinner', day: 'Tue', title: 'Black bean cabbage tacos', note: 'Crisp cabbage and beans tucked into warm tortillas.', ingredients: [{ key: 'blackBeans', amount: 2 }, { key: 'cabbage', amount: .7 }, { key: 'tortillas', amount: 12 }, { key: 'cheese', amount: 5 }, { key: 'salsa', amount: 4 }], prep: 12, cook: 12 },
  { type: 'Dinner', day: 'Wed', title: 'Lentil tomato pasta', note: 'Pasta with tomato lentils and a handful of spinach.', ingredients: [{ key: 'pasta', amount: .8 }, { key: 'lentils', amount: .4 }, { key: 'tomatoes', amount: 1 }, { key: 'spinach', amount: 4 }, { key: 'garlic', amount: 2 }, { key: 'oil', amount: 1 }], prep: 10, cook: 28 },
  { type: 'Dinner', day: 'Thu', title: 'Vegetable egg fried rice', note: 'Brown rice tossed with eggs and colorful vegetables.', ingredients: [{ key: 'rice', amount: .7 }, { key: 'eggs', amount: 5 }, { key: 'frozenVeg', amount: 12 }, { key: 'onion', amount: 1 }, { key: 'oil', amount: 2 }, { key: 'seasoning', amount: 1 }], prep: 12, cook: 18 },
  { type: 'Dinner', day: 'Fri', title: 'Chicken, rice & greens', note: 'Seasoned chicken served with brown rice and spinach.', ingredients: [{ key: 'chicken', amount: 1.3 }, { key: 'rice', amount: .65 }, { key: 'spinach', amount: 5 }, { key: 'onion', amount: 1 }, { key: 'oil', amount: 1 }, { key: 'seasoning', amount: 2 }], prep: 12, cook: 30 },
  { type: 'Dinner', day: 'Sat', title: 'Chickpea tomato curry', note: 'Chickpeas simmered in tomatoes and served over rice.', ingredients: [{ key: 'chickpeas', amount: 3 }, { key: 'tomatoes', amount: 2 }, { key: 'rice', amount: .6 }, { key: 'onion', amount: 1 }, { key: 'garlic', amount: 2 }, { key: 'seasoning', amount: 2 }, { key: 'oil', amount: 1 }], prep: 12, cook: 28 },
  { type: 'Dinner', day: 'Sun', title: 'Whole-wheat pasta & beans', note: 'Comforting pasta with beans, greens, and tomato sauce.', ingredients: [{ key: 'pasta', amount: .8 }, { key: 'blackBeans', amount: 1 }, { key: 'spinach', amount: 4 }, { key: 'tomatoes', amount: 1 }, { key: 'garlic', amount: 2 }, { key: 'oil', amount: 1 }], prep: 10, cook: 25 },
];
// Curated low-cost alternative menu. Its ingredients deliberately repeat across
// the week so the shared package-rounding and pantry calculation can be compared fairly.
const extraLowCostSeeds: MealSeed[] = [
  { type: 'Breakfast', day: 'Mon', title: 'Banana cinnamon oats', note: 'Warm oats with banana and cinnamon.', ingredients: [{ key: 'oats', amount: .65 }, { key: 'banana', amount: .7 }, { key: 'cinnamon', amount: 1 }], prep: 5, cook: 8 },
  { type: 'Breakfast', day: 'Tue', title: 'Peanut butter banana oats', note: 'Oats with peanut butter and banana.', ingredients: [{ key: 'oats', amount: .65 }, { key: 'peanut', amount: 3 }, { key: 'banana', amount: .5 }], prep: 5, cook: 8 },
  { type: 'Breakfast', day: 'Wed', title: 'Apple cinnamon oatmeal', note: 'Oats topped with apple and cinnamon.', ingredients: [{ key: 'oats', amount: .65 }, { key: 'apples', amount: .6 }, { key: 'cinnamon', amount: 1 }], prep: 5, cook: 8 },
  { type: 'Breakfast', day: 'Thu', title: 'Berry peanut oats', note: 'Oats with berries and a little peanut butter.', ingredients: [{ key: 'oats', amount: .65 }, { key: 'berries', amount: 6 }, { key: 'peanut', amount: 2 }], prep: 5, cook: 8 },
  { type: 'Breakfast', day: 'Fri', title: 'Banana oat bowls', note: 'Soft oats with sliced banana.', ingredients: [{ key: 'oats', amount: .65 }, { key: 'banana', amount: .7 }, { key: 'peanut', amount: 2 }], prep: 5, cook: 8 },
  { type: 'Breakfast', day: 'Sat', title: 'Apple peanut oatmeal', note: 'Warm oats with apple and peanut butter.', ingredients: [{ key: 'oats', amount: .65 }, { key: 'apples', amount: .7 }, { key: 'peanut', amount: 2 }], prep: 5, cook: 8 },
  { type: 'Breakfast', day: 'Sun', title: 'Berry banana oats', note: 'Oats with banana and frozen berries.', ingredients: [{ key: 'oats', amount: .65 }, { key: 'banana', amount: .5 }, { key: 'berries', amount: 6 }], prep: 5, cook: 8 },
  { type: 'Lunch', day: 'Mon', title: 'Black bean rice bowls', note: 'Rice, beans, cabbage, and salsa.', ingredients: [{ key: 'rice', amount: .65 }, { key: 'blackBeans', amount: 2 }, { key: 'cabbage', amount: .5 }, { key: 'salsa', amount: 3 }], prep: 8, cook: 25 },
  { type: 'Lunch', day: 'Tue', title: 'Lentil tomato soup', note: 'Lentils simmered with tomatoes, carrots, and onion.', ingredients: [{ key: 'lentils', amount: .55 }, { key: 'tomatoes', amount: 1 }, { key: 'carrots', amount: .5 }, { key: 'onion', amount: 1 }, { key: 'seasoning', amount: 1 }], prep: 12, cook: 30 },
  { type: 'Lunch', day: 'Wed', title: 'Chickpea rice bowls', note: 'Chickpeas and rice with spinach and lemon.', ingredients: [{ key: 'chickpeas', amount: 2 }, { key: 'rice', amount: .5 }, { key: 'spinach', amount: 3 }, { key: 'lemon', amount: 1 }], prep: 10, cook: 20 },
  { type: 'Lunch', day: 'Thu', title: 'Potato black bean bowls', note: 'Potatoes and black beans with salsa.', ingredients: [{ key: 'potatoes', amount: 1 }, { key: 'blackBeans', amount: 2 }, { key: 'salsa', amount: 3 }], prep: 10, cook: 25 },
  { type: 'Lunch', day: 'Fri', title: 'Lentil carrot rice', note: 'Rice and lentils with carrots and seasoning.', ingredients: [{ key: 'rice', amount: .55 }, { key: 'lentils', amount: .45 }, { key: 'carrots', amount: .5 }, { key: 'seasoning', amount: 1 }], prep: 10, cook: 28 },
  { type: 'Lunch', day: 'Sat', title: 'Black bean cabbage bowls', note: 'Beans and cabbage served over brown rice.', ingredients: [{ key: 'blackBeans', amount: 2 }, { key: 'cabbage', amount: .6 }, { key: 'rice', amount: .5 }, { key: 'salsa', amount: 2 }], prep: 8, cook: 25 },
  { type: 'Lunch', day: 'Sun', title: 'Vegetable bean rice', note: 'Rice, black beans, and frozen vegetables.', ingredients: [{ key: 'rice', amount: .6 }, { key: 'blackBeans', amount: 2 }, { key: 'frozenVeg', amount: 8 }, { key: 'onion', amount: 1 }], prep: 8, cook: 25 },
  { type: 'Dinner', day: 'Mon', title: 'Lentil potato stew', note: 'Lentils and potatoes simmered in tomato broth.', ingredients: [{ key: 'lentils', amount: .6 }, { key: 'potatoes', amount: 1.2 }, { key: 'tomatoes', amount: 1 }, { key: 'carrots', amount: .5 }, { key: 'seasoning', amount: 1 }], prep: 12, cook: 32 },
  { type: 'Dinner', day: 'Tue', title: 'Black bean vegetable rice', note: 'Beans and mixed vegetables over brown rice.', ingredients: [{ key: 'blackBeans', amount: 2 }, { key: 'rice', amount: .65 }, { key: 'frozenVeg', amount: 10 }, { key: 'onion', amount: 1 }], prep: 10, cook: 25 },
  { type: 'Dinner', day: 'Wed', title: 'Chickpea tomato rice', note: 'Chickpeas simmered in tomatoes and served with rice.', ingredients: [{ key: 'chickpeas', amount: 2 }, { key: 'tomatoes', amount: 1 }, { key: 'rice', amount: .6 }, { key: 'garlic', amount: 2 }], prep: 10, cook: 28 },
  { type: 'Dinner', day: 'Thu', title: 'Tofu vegetable rice skillet', note: 'Tofu and mixed vegetables cooked with rice.', ingredients: [{ key: 'tofu', amount: 14 }, { key: 'rice', amount: .6 }, { key: 'frozenVeg', amount: 10 }, { key: 'seasoning', amount: 1 }], prep: 12, cook: 20 },
  { type: 'Dinner', day: 'Fri', title: 'Bean cabbage potato skillet', note: 'Black beans, cabbage, and potatoes cooked together.', ingredients: [{ key: 'blackBeans', amount: 2 }, { key: 'cabbage', amount: .6 }, { key: 'potatoes', amount: 1 }, { key: 'onion', amount: 1 }], prep: 12, cook: 25 },
  { type: 'Dinner', day: 'Sat', title: 'Lentil carrot tomato stew', note: 'Lentils, carrots, and tomatoes simmered until tender.', ingredients: [{ key: 'lentils', amount: .6 }, { key: 'carrots', amount: .7 }, { key: 'tomatoes', amount: 1 }, { key: 'seasoning', amount: 1 }], prep: 10, cook: 30 },
  { type: 'Dinner', day: 'Sun', title: 'Black bean rice skillet', note: 'Rice and beans with spinach and salsa.', ingredients: [{ key: 'blackBeans', amount: 2 }, { key: 'rice', amount: .65 }, { key: 'spinach', amount: 3 }, { key: 'salsa', amount: 3 }], prep: 10, cook: 25 },
];

const replacements: Partial<Record<IngredientKey, IngredientKey>> = {
  chicken: 'chickpeas', tuna: 'blackBeans', eggs: 'tofu', yogurt: 'veganYogurt',
  cheese: 'veganCheese',
};
const money = (n: number) => `$${n.toFixed(2)}`;
const householdLabel = (n: number) => `${n} ${n === 1 ? 'person' : 'people'}`;
const unitLabel = (n: number, unit: string) => `${Number(n.toFixed(2))} ${unit}`;
const describeIngredient = (key: IngredientKey, glutenFree: boolean) => {
  const item = ingredientCatalog[key];
  return `${item.name}${glutenFree && 'check' in item && item.check ? ' (check for a gluten-free label)' : ''}`;
};

type Meal = MealSeed & { ingredients: RecipeIngredient[]; title: string; note: string; substitution: string };
function makeMealsFromSeeds(source: MealSeed[], diet: Diet, glutenFree: boolean): Meal[] {
  return source.map((seed) => {
    const ingredients = seed.ingredients.map(({ key, amount }) => {
      let nextKey = key;
      if (diet === 'vegan' && replacements[key]) nextKey = replacements[key]!;
      else if (diet === 'vegetarian' && (key === 'chicken' || key === 'tuna')) nextKey = replacements[key]!;
      if (glutenFree && nextKey === 'bread') nextKey = 'gfBread';
      if (glutenFree && nextKey === 'pasta') nextKey = 'gfPasta';
      return { key: nextKey, amount };
    });
    let title = seed.title;
    if (diet === 'vegan') {
      title = title.replace(/eggs?/gi, 'tofu').replace(/yogurt/gi, 'plant yogurt').replace(/cheese/gi, 'plant cheese').replace(/chicken/gi, 'chickpea').replace(/tuna/gi, 'bean').replace(/egg salad/gi, 'tofu salad');
    } else if (diet === 'vegetarian') {
      title = title.replace(/chicken/gi, 'chickpea').replace(/tuna/gi, 'bean');
    }
    if (glutenFree) title = title.replace(/whole-wheat pasta/gi, 'pasta').replace(/pasta/gi, 'gluten-free pasta').replace(/toast/gi, 'gluten-free toast').replace(/sandwiches/gi, 'gluten-free sandwiches');
    let note = seed.note;
    if (diet === 'vegan') note = note.replace(/eggs?/gi, 'tofu').replace(/chicken/gi, 'chickpeas').replace(/tuna/gi, 'beans').replace(/yogurt/gi, 'plant-based yogurt').replace(/cheese/gi, 'plant-based cheese');
    else if (diet === 'vegetarian') note = note.replace(/chicken/gi, 'chickpeas').replace(/tuna/gi, 'beans');
    if (glutenFree) note = note.replace(/pasta/gi, 'gluten-free pasta').replace(/toast/gi, 'gluten-free toast').replace(/bread/gi, 'gluten-free bread').replace(/wraps?/gi, 'corn tortilla wraps');
    if (diet === 'vegan' && seed.ingredients.some((x) => ['eggs', 'yogurt', 'cheese', 'chicken', 'tuna'].includes(x.key))) note += ' Plant-based swaps keep the whole meal vegan.';
    if (diet === 'vegetarian' && seed.ingredients.some((x) => ['chicken', 'tuna'].includes(x.key))) note += ' Beans replace meat or fish.';
    if (glutenFree) note += ' Choose certified gluten-free versions where noted.';
    return { ...seed, ingredients, title, note, substitution: diet === 'vegan' ? 'Plant-based swaps; no animal products.' : diet === 'vegetarian' ? 'Meat and fish replaced with plant proteins; eggs and dairy are fine.' : glutenFree ? 'Gluten-free grains and label-checked pantry choices.' : 'No dietary swaps needed.' };
  });
}
function makeMeals(diet: Diet, glutenFree: boolean) { return makeMealsFromSeeds(seeds, diet, glutenFree); }
function makeExtraLowCostMeals(diet: Diet, glutenFree: boolean) { return makeMealsFromSeeds(extraLowCostSeeds, diet, glutenFree); }

function getBasket(meals: Meal[], household: number, glutenFree: boolean, pantry: Partial<Record<IngredientKey, number>>): BasketItem[] {
  const scale = household / 6;
  const aggregate = new Map<IngredientKey, number>();
  for (const meal of meals) for (const ingredient of meal.ingredients) aggregate.set(ingredient.key, (aggregate.get(ingredient.key) || 0) + ingredient.amount * scale);
  return [...aggregate.entries()].map(([key, quantity]) => {
    const item = ingredientCatalog[key];
    const pantryEntered = Math.max(0, pantry[key] ?? 0);
    const pantryUnit = pieceWeightLb[key] ? 'pieces' : item.unit;
    const alreadyHave = pantryEntered * (pieceWeightLb[key] ?? 1);
    const remaining = Math.max(0, quantity - alreadyHave);
    const makeBuy = (store: Store): StoreBuy => {
      if (pieceWeightLb[key]) {
        const packages = remaining > 0 ? Math.ceil(remaining / pieceWeightLb[key]!) : 0;
        const estimatedLb = packages * pieceWeightLb[key]!;
        return { packageSize: pieceWeightLb[key]!, packages, quantity: estimatedLb, cost: estimatedLb * item.price * (store === 'aldi' ? .9 : 1) };
      }
      const packageSize = packageSizes[key][store];
      const packages = remaining > 0 ? Math.ceil(remaining / packageSize) : 0;
      return { packageSize, packages, quantity: packages * packageSize, cost: packages * packageSize * item.price * (store === 'aldi' ? .9 : 1) };
    };
    return { key, item: item.name, unit: item.unit, needed: quantity, alreadyHave, pantryEntered, pantryUnit, remaining, check: glutenFree && 'check' in item && !!item.check, krogerBuy: makeBuy('kroger'), aldiBuy: makeBuy('aldi') };
  });
}
// Store premium follows household scaling, independent of which ingredients appear in the basket.
const storePremium = (household: number) => 9.6 * household / 6;
const aldiItems = new Set<IngredientKey>(['oats', 'banana', 'apples', 'rice', 'carrots', 'lentils', 'tomatoes', 'chickpeas', 'potatoes', 'cabbage', 'frozenVeg', 'onion', 'garlic', 'berries']);
function estimateStores(basket: BasketItem[], household: number) {
  const kroger = basket.reduce((sum, item) => sum + item.krogerBuy.cost, 0) + storePremium(household);
  const split = basket.reduce((sum, item) => sum + (aldiItems.has(item.key) ? item.aldiBuy.cost : item.krogerBuy.cost), 0);
  return { kroger, split };
}

function ForkLeaf({ className }: { className: string }) {
  return <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M29 59C27 44 22 33 15 25C11 20 7 13 6 7M29 59C27 43 23 32 18 25M29 59C30 43 28 32 23 23C19 17 16 11 15 5M29 59C32 43 33 32 30 23C28 17 27 11 28 5" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M35 39C34 26 42 12 58 5C58 22 52 36 37 42C36 41 35 40 35 39Z" fill="currentColor" /><path d="M30 57C36 43 43 28 54 12" stroke="hsl(var(--background))" strokeWidth="2.5" strokeLinecap="round" /><path d="M28 58C31 47 35 39 40 32" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" /></svg>;
}
function Shamrock({ className }: { className: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 10.5C7.1 8.6 6.8 4.2 9 2.8c1.2-.8 2.6-.1 3 1.5.4-1.6 1.8-2.3 3-1.5 2.2 1.4 1.9 5.8-3 7.7Z" /><path d="M10.7 11.1C7 7.3 2.8 8.1 2.5 11c-.3 2.6 2.2 4.1 5.2 2.9.8 3.4 4.2 4.2 5.9 1.1l-2.9-3.9Z" /><path d="M13.3 11.1c3.7-3.8 7.9-3 8.2-.1.3 2.6-2.2 4.1-5.2 2.9-.8 3.4-4.2 4.2-5.9 1.1l2.9-3.9Z" /><path d="M12 9.5c.2 5.4.7 9.1 3.5 12.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
}
function BrandWordmark() {
  return <span className="brand-wordmark" role="img" aria-label="BendBites"><span aria-hidden="true">BendB<span className="wordmark-i">ı<Shamrock className="wordmark-shamrock" /></span>tes</span></span>;
}
function Progress({ step }: { step: Step }) {
  const steps: { id: Step; label: string }[] = [{ id: 'setup', label: 'Your week' }, { id: 'plan', label: 'Meal plan' }, { id: 'compare', label: 'Store options' }, { id: 'confirmed', label: 'Confirmed' }];
  const current = steps.findIndex((item) => item.id === step);
  return <nav className="progress-row" aria-label="Planning progress">{steps.map((item, index) => <div className={`progress-step ${index === current ? 'is-current' : ''} ${index < current ? 'is-done' : ''}`} key={item.id}><span className="step-num">{index < current ? <Check size={12} strokeWidth={3} /> : index + 1}</span><span>{item.label}</span>{index < steps.length - 1 && <span className="step-line" aria-hidden="true" />}</div>)}</nav>;
}
function Shell({ children, step }: { children: ReactNode; step: Step }) {
  return <div className="app-shell"><div className="shell-grid"><aside className="side-rail"><div className="brand-mark"><ForkLeaf className="brand-symbol" /><BrandWordmark /></div><p className="rail-copy">A practical plan for the whole week: three meals a day, one grocery list, no guesswork.</p><div className="rail-note">Sample mode<br />Prices, places, and travel times are illustrative demo data.</div></aside><main className="main-area"><header className="topbar"><div className="mobile-brand"><ForkLeaf className="brand-symbol" /><BrandWordmark /></div><span className="sample-pill">Illustrative demo</span></header><div className="content-wrap"><Progress step={step} />{children}</div></main></div></div>;
}
function Setup({ household, budget, diet, glutenFree, budgetRequired, setHousehold, setBudget, setDiet, setGlutenFree, onContinue }: { household: number; budget: number; diet: Diet; glutenFree: boolean; budgetRequired: boolean; setHousehold: (n: number) => void; setBudget: (n: number) => void; setDiet: (d: Diet) => void; setGlutenFree: (g: boolean) => void; onContinue: () => void }) {
  const choices: { id: Diet; label: string; detail: string }[] = [{ id: 'none', label: 'No dietary restrictions', detail: 'The full menu' }, { id: 'vegetarian', label: 'Vegetarian', detail: 'Eggs and dairy included' }, { id: 'vegan', label: 'Vegan', detail: 'No animal products' }];
  return <>
    <p className="eyebrow">Start with the week you actually have</p><h1 className="page-title">A full week of meals, within your budget.</h1><p className="page-intro">Tell us who is eating, what to spend, and how you eat. We’ll plan breakfast, lunch, and dinner for seven days, then compare one easy stop with a two-store option.</p>
    <div className="setup-layout" style={{ marginTop: '1.7rem' }}><section className="panel setup-card" aria-labelledby="week-details-heading"><div className="panel-heading"><div><h2 className="panel-title" id="week-details-heading">This week’s details</h2><p className="panel-kicker">You can change these before you confirm a store plan.</p></div><Pencil size={18} aria-hidden="true" color="hsl(157 39% 31%)" /></div>
      <label className="field-label" id="household-label">Household size</label><div className="choice-grid" role="group" aria-labelledby="household-label">{[1, 2, 3, 4, 5, 6].map((size) => <button className={`choice-button ${household === size ? 'is-selected' : ''}`} data-testid={`household-size-${size}`} key={size} onClick={() => setHousehold(size)} type="button" aria-pressed={household === size}>{size} {size === 1 ? 'person' : 'people'}</button>)}</div>
      <label className="field-label" htmlFor="budget-input">Weekly grocery budget</label><div className="money-input"><span aria-hidden="true">$</span><input id="budget-input" data-testid="budget-input" aria-invalid={budgetRequired || undefined} aria-describedby={budgetRequired ? 'budget-required-message' : undefined} inputMode="decimal" min="1" onChange={(event) => setBudget(Math.max(0, Number(event.target.value.replace(/[^0-9.]/g, '')) || 0))} type="number" value={budget || ''} /></div><p className="helper">Target for ingredients across all 21 planned meals, using illustrative sample prices.</p>{budgetRequired && <p id="budget-required-message" className="budget-required" role="alert">Enter your weekly budget to continue. Your other details are still saved.</p>}
      <fieldset className="diet-fieldset"><legend className="field-label">Dietary preferences <span className="optional-label">optional</span></legend><div className="diet-choice-grid" role="radiogroup" aria-label="Choose a dietary pattern">{choices.map((choice) => <button key={choice.id} type="button" role="radio" aria-checked={diet === choice.id} className={`diet-choice ${diet === choice.id ? 'is-selected' : ''}`} data-testid={`diet-${choice.id}`} onClick={() => setDiet(choice.id)}><span className="diet-choice-top">{choice.label}{diet === choice.id && <Check size={15} aria-hidden="true" />}</span><small>{choice.detail}</small></button>)}</div><label className={`gf-choice ${glutenFree ? 'is-selected' : ''}`}><input type="checkbox" checked={glutenFree} onChange={(e) => setGlutenFree(e.target.checked)} data-testid="diet-gluten-free" /><span className="gf-icon"><Leaf size={16} aria-hidden="true" /></span><span><strong>Gluten-free</strong><small>Can be combined with vegetarian or vegan. Label checks are called out in the grocery list.</small></span></label></fieldset>
      <div className="button-row"><button className="primary-button" data-testid="build-plan-button" onClick={onContinue} type="button">Build my weekly meal plan <ArrowRight size={16} aria-hidden="true" /></button></div></section>
      <aside className="panel snapshot-card" aria-label="Plan preview"><span className="snapshot-label">Your starting point</span><div className="snapshot-number">{household} × 21</div><div className="snapshot-detail">{budget > 0 ? `Meals for ${householdLabel(household)} with an illustrative ${money(budget)} weekly target.` : 'Enter a weekly budget to compare the store plans.'}</div><div className="snapshot-preferences">{diet === 'none' ? 'No dietary restrictions' : diet === 'vegan' ? 'Vegan' : 'Vegetarian'}{glutenFree ? ' · Gluten-free' : ''}</div><div className="button-row"><span className="snapshot-detail">BendBites keeps the maths visible as you decide.</span></div></aside></div>
    <p className="fine-print">BendBites is a planning prototype. It does not use location services, live pricing, accounts, or checkout.</p>
  </>;
}
function recipeSteps(meal: Meal, household: number) {
  const scale = household / 6;
  const glutenFree = meal.note.includes('certified gluten-free');
  const ingredients = meal.ingredients.map(({ key, amount }) => `${unitLabel(amount * scale, ingredientCatalog[key].unit)} ${describeIngredient(key, glutenFree)}`).join(', ');
  const hotIngredients = meal.ingredients.filter(({ key }) => ['eggs', 'chicken', 'tofu', 'pasta', 'rice', 'lentils', 'potatoes', 'blackBeans', 'chickpeas', 'frozenVeg', 'tomatoes'].includes(key));
  const hotText = hotIngredients.map(({ key }) => ingredientCatalog[key].name.toLowerCase()).join(', ') || 'the main ingredients';
  return [
    `Gather and measure: ${ingredients}. Rinse produce and open any cans.`,
    `Cook ${hotText} until tender and safely heated. Follow the package directions for grains or pasta, and use only the seasonings listed above.`,
    `Stir in the remaining ingredients, warm through if needed, then taste and serve. The recipe uses only the ingredients shown above.`,
  ];
}
function Plan({ household, budget, meals, standardMeals, extraMeals, basket, estimates, standardSplit, extraSplit, weekChoice, onSelectWeek, checkedItems, onToggleIngredient, onPantryChange, onBack, onContinue }: { household: number; budget: number; meals: Meal[]; standardMeals: Meal[]; extraMeals: Meal[]; basket: BasketItem[]; estimates: { kroger: number; split: number }; standardSplit: number; extraSplit: number; weekChoice: WeekChoice; onSelectWeek: (choice: WeekChoice) => void; checkedItems: Record<string, boolean>; onToggleIngredient: (key: string) => void; onPantryChange: (key: IngredientKey, value: number) => void; onBack: () => void; onContinue: () => void }) {
  const [showExtraPreview, setShowExtraPreview] = useState(false);
  const standardTitles = new Map(standardMeals.map((meal) => [`${meal.type}-${meal.day}`, meal.title]));
  const changedMeals = extraMeals.filter((meal) => standardTitles.get(`${meal.type}-${meal.day}`) !== meal.title);
  const delta = extraSplit - standardSplit;
  const budgetStatus = (total: number) => total <= budget ? `${money(budget - total)} remaining` : `${money(total - budget)} over budget`;
  const listTotal = Math.min(estimates.kroger, estimates.split);
  const lowestIsSplit = estimates.split <= estimates.kroger;
  const budgetRoom = budget - listTotal;
  const scale = household / 6;
  const checkedCount = basket.filter((item) => checkedItems[item.key]).length;
  return <>
    <section className="panel extra-week-card" aria-labelledby="extra-week-heading">
      <div className="extra-week-heading"><div><p className="eyebrow">Simulated AI suggestion</p><h2 id="extra-week-heading">Extra-low-cost week</h2><p className="helper">A curated full week that reuses affordable ingredients. Preview it even if the standard low-cost basket is over budget.</p></div><button type="button" className="secondary-button" data-testid="preview-extra-week" onClick={() => setShowExtraPreview((open) => !open)}>{showExtraPreview ? 'Hide comparison' : 'Preview week'}</button></div>
      {showExtraPreview && <div className="extra-week-preview" data-testid="extra-week-comparison">
        <p className="sample-note">Simulated AI menu · sample checkout estimates · same household, pantry quantities, and split-shop store option.</p>
        <div className="week-cost-grid"><div><strong>Standard low-cost</strong><span>{money(standardSplit)}</span><small>{budgetStatus(standardSplit)}</small></div><div><strong>Extra-low-cost</strong><span>{money(extraSplit)}</span><small>{budgetStatus(extraSplit)}</small></div></div>
        <p className="extra-week-delta">{delta < -.005 ? `Extra-low-cost saves ${money(-delta)} at checkout.` : delta > .005 ? `Extra-low-cost costs ${money(delta)} more at checkout.` : 'Both weeks have the same estimated checkout total.'}</p>
        <details className="changed-meals" open><summary>{changedMeals.length} meals change</summary><ul>{changedMeals.map((meal) => <li key={`${meal.type}-${meal.day}`}><strong>{meal.day} {meal.type}:</strong> {standardTitles.get(`${meal.type}-${meal.day}`)} → {meal.title}</li>)}</ul></details>
        <div className="button-row"><button type="button" data-testid="keep-standard-week" className={weekChoice === 'standard' ? 'primary-button' : 'secondary-button'} onClick={() => onSelectWeek('standard')}>{weekChoice === 'standard' ? 'Keeping standard week' : 'Keep standard week'}</button><button type="button" data-testid="keep-extra-week" className={weekChoice === 'extra' ? 'primary-button' : 'secondary-button'} onClick={() => onSelectWeek('extra')}>{weekChoice === 'extra' ? 'Keeping extra-low-cost week' : 'Use extra-low-cost week'}</button></div>
      </div>}
    </section>
    <div className="plan-header"><div><p className="eyebrow">{weekChoice === 'extra' ? 'Extra-low-cost week · simulated AI suggestion' : 'A week with a little structure'}</p><h1>21 meals, one useful list.</h1></div><div className="budget-readout">WEEKLY GROCERY TARGET<strong data-testid="weekly-budget-value">{money(budget)}</strong></div></div>
    <p className="page-intro" style={{ marginTop: 0 }}>Seven days of breakfast, lunch, and dinner. Ingredient quantities and estimates are scaled for {householdLabel(household)}; recipes, list, and totals all share the same ingredient data.</p>
    <section className="panel checkout-summary" aria-label="Estimated checkout and budget status">
      <div><span className="checkout-summary-label">Lowest estimated checkout · sample prices</span><strong data-testid="top-checkout-total">{money(listTotal)}</strong></div>
      <span className={`checkout-budget-status ${budgetRoom >= 0 ? 'fits-budget' : 'over-budget'}`} data-testid="top-budget-status">{lowestIsSplit ? 'Split shop' : 'Kroger only'} · {budgetRoom >= 0 ? `${money(budgetRoom)} under budget` : `${money(Math.abs(budgetRoom))} over budget`}</span>
    </section>
    <div className="plan-grid" style={{ marginTop: '1.4rem' }}><section className="meal-section-stack" aria-label="Seven-day meal plan">{(['Breakfast', 'Lunch', 'Dinner'] as MealType[]).map((type) => <section className="panel list-card meal-section" key={type} aria-labelledby={`meal-type-${type.toLowerCase()}`}><div className="list-head"><h2 id={`meal-type-${type.toLowerCase()}`}>{type}</h2><span>7 days · {householdLabel(household)}</span></div><div className="meal-grid" style={{ marginTop: '.65rem' }}>{meals.filter((meal) => meal.type === type).map((meal) => {
      const mealCost = meal.ingredients.reduce((sum, ing) => sum + ing.amount * scale * ingredientCatalog[ing.key].price, 0);
       const steps = recipeSteps(meal, household);
      return <article className="panel meal-row" key={`${meal.type}-${meal.day}`} data-testid={`meal-${meal.type.toLowerCase()}-${meal.day.toLowerCase()}`}><span className="day-tag">{meal.day}</span><div className="meal-main"><h3 className="meal-name">{meal.title}</h3><p className="meal-desc">{meal.note}</p><span className="meal-cost" data-testid={`meal-cost-${meal.type.toLowerCase()}-${meal.day.toLowerCase()}`}>{money(mealCost)} ingredients</span><details className="recipe-disclosure"><summary data-testid={`recipe-toggle-${meal.type.toLowerCase()}-${meal.day.toLowerCase()}`}><span>How to make this</span><ChevronDown size={15} aria-hidden="true" /></summary><div className="recipe-content"><p className="recipe-meta"><Clock3 size={14} aria-hidden="true" /> {meal.prep} min prep · {meal.cook ? `${meal.cook} min cook` : 'no cooking'} · scaled for {householdLabel(household)}</p><h4>Ingredients</h4><ul>{meal.ingredients.map(({ key, amount }, i) => <li key={`${key}-${i}`}>{unitLabel(amount * scale, ingredientCatalog[key].unit)} {describeIngredient(key, meal.note.includes('certified gluten-free'))}</li>)}</ul><h4>Steps</h4><ol>{steps.map((step, i) => <li key={i}>{step}</li>)}</ol><p className="recipe-substitution">{meal.substitution}</p></div></details></div></article>;
    })}</div></section>)}</section>
      <section className="panel list-card" aria-labelledby="grocery-heading"><div className="list-head"><h2 id="grocery-heading">Consolidated grocery list</h2><span aria-live="polite">{checkedCount}/{basket.length} checked · 7 days</span></div><p className="helper">Amounts to buy are rounded to sample package sizes. Pantry amounts default to zero; prices and pack sizes are illustrative.</p><ul className="grocery-list">{basket.map((item) => {
        const splitStore: Store = aldiItems.has(item.key) ? 'aldi' : 'kroger';
        const splitBuy = splitStore === 'aldi' ? item.aldiBuy : item.krogerBuy;
        const formatBuy = (buy: StoreBuy) => {
          if (!buy.packages) return 'Already covered';
          if (pieceWeightLb[item.key]) {
            const fruit = item.key === 'apples' ? 'apple' : 'banana';
            const countLabel = `${buy.packages} ${fruit}${buy.packages === 1 ? '' : 's'}`;
            return `${countLabel} · about ${Number(buy.quantity.toFixed(1))} lb`;
          }
          return `${buy.packages} × ${unitLabel(buy.packageSize, item.unit)}`;
        };
        return <li className={`grocery-item ${checkedItems[item.key] ? 'is-checked' : ''}`} key={item.key}>
          <input className="grocery-check" type="checkbox" checked={!!checkedItems[item.key]} onChange={() => onToggleIngredient(item.key)} aria-label={`${checkedItems[item.key] ? 'Uncheck' : 'Check off'} ${item.item}`} data-testid={`grocery-check-${item.key}`} />
          <span className="grocery-name">{item.item}{item.check && <small className="label-check">Check GF label</small>}</span>
          <div className="grocery-quantity-grid">
            <div className="quantity-cell"><small>Needed for the week</small><strong>{unitLabel(item.needed, item.unit)}</strong></div>
            <label className="quantity-cell pantry-cell"><span>Already have</span><span className="pantry-input-wrap"><input aria-label={`Already have ${item.item}`} data-testid={`pantry-${item.key}`} inputMode="decimal" min="0" step={pieceWeightLb[item.key] ? 1 : 'any'} type="number" value={item.pantryEntered || ''} onChange={(event) => onPantryChange(item.key, Math.max(0, Number(event.target.value) || 0))} /><small>{item.pantryUnit}</small></span>{pieceWeightLb[item.key] && <small className="pantry-conversion">About {pieceWeightLb[item.key]} lb each · {item.pantryEntered} {item.pantryEntered === 1 ? 'piece' : 'pieces'} ≈ {Number(item.alreadyHave.toFixed(2))} lb</small>}</label>
            <div className="quantity-cell buy-cell"><small>Buy at store</small><strong>Kroger only: {formatBuy(item.krogerBuy)}</strong><strong>Split shop · {splitStore === 'aldi' ? 'Aldi' : 'Kroger'}: {formatBuy(splitBuy)}</strong></div>
          </div>
        </li>;
      })}</ul><div className="summary-line" style={{ marginTop: '1rem' }}><span>Kroger-only estimate</span><strong data-testid="grocery-total-kroger">{money(estimates.kroger)}</strong></div><div className="summary-line"><span>Split-shop estimate</span><strong data-testid="grocery-total-split">{money(estimates.split)}</strong></div><p className="helper">Apples and bananas are estimated loose by piece and weight; bananas use whole, unpeeled weight. Other ingredients use sample package sizes. The split plan routes pantry staples and produce to Aldi; remaining items use Kroger.</p></section></div>
    <div className="button-row"><button className="secondary-button" data-testid="back-to-setup-button" onClick={onBack} type="button"><ArrowLeft size={16} aria-hidden="true" /> Edit week</button><button className="primary-button" data-testid="compare-stores-button" onClick={onContinue} type="button">Compare store plans <ArrowRight size={16} aria-hidden="true" /></button></div><p className="fine-print">Sample ingredient prices only. Both store estimates cover this exact consolidated list; no live pricing.</p>
  </>;
}
function OptionCard({ plan, household, budget, estimates, selected, onSelect }: { plan: StorePlan; household: number; budget: number; estimates: { kroger: number; split: number }; selected: boolean; onSelect: () => void }) {
  const isSave = plan === 'save';
  const total = isSave ? estimates.split : estimates.kroger;
  const savings = estimates.kroger - estimates.split;
  const miles = isSave ? '3.4 mi' : '1.2 mi';
  const time = isSave ? '18 min' : '7 min';
  const costAndDrive = savings > 0 ? `Save ${money(savings)} · +11 min drive` : savings < 0 ? `Costs ${money(-savings)} more · +11 min drive` : 'Same cost · +11 min drive';
  return <article className={`panel option-card ${isSave && savings > 0 ? 'is-recommended' : ''}`} aria-label={`${isSave ? 'Two-store' : 'Single-store'} option`}><div className="option-title"><div><h3>{isSave ? 'Split the shop' : 'Keep it simple'}</h3><p>{isSave ? 'Kroger + Aldi' : 'Kroger only'} · sample locations</p></div><div className="option-total" data-testid={`compare-total-${plan}`}>{money(total)}<small>sample checkout</small></div></div><div className="metric-stack"><div><span className="metric-label">Store stops</span><span className="metric-value">{isSave ? '2' : '1'}</span></div><div className="decision-metric"><span className="metric-label">{isSave ? 'Cost + extra drive vs. Kroger' : 'Drive time'}</span><span className="metric-value">{isSave ? costAndDrive : time}</span></div></div><p className={`option-budget-status ${total <= budget ? 'fits-budget' : 'over-budget'}`} data-testid={`budget-status-${plan}`}>{total <= budget ? `${money(budget - total)} under budget` : `${money(total - budget)} over budget`}</p><div className="trip-lines"><div className="trip-line"><span><MapPin size={13} aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: '.3rem' }} />Location distance</span><strong>{miles}</strong></div></div><div className="button-row"><button className={selected ? 'primary-button' : 'secondary-button'} data-testid={`select-plan-${plan}`} onClick={onSelect} type="button" aria-pressed={selected}>{selected ? <><Check size={16} aria-hidden="true" /> Selected</> : <>Choose this plan <ArrowRight size={16} aria-hidden="true" /></>}</button></div></article>;
}
function Compare({ household, budget, estimates, weekChoice, selected, setSelected, onBack, onConfirm }: { household: number; budget: number; estimates: { kroger: number; split: number }; weekChoice: WeekChoice; selected: StorePlan | null; setSelected: (plan: StorePlan) => void; onBack: () => void; onConfirm: () => void }) {
  const chosenTotal = selected ? (selected === 'usual' ? estimates.kroger : estimates.split) : 0;
  const chosenFitsBudget = !!selected && chosenTotal <= budget;
  const lowest = Math.min(estimates.kroger, estimates.split);
  return <><section className="panel comparison-intro"><p className="eyebrow">{weekChoice === 'extra' ? 'Extra-low-cost week · simulated AI suggestion' : 'Store options'}</p><h1>Is the second stop worth it?</h1><p>Sample estimates use your pantry-adjusted list. Store locations and drive times are illustrative.</p></section><div className="compare-grid"><OptionCard plan="usual" household={household} budget={budget} estimates={estimates} selected={selected === 'usual'} onSelect={() => setSelected('usual')} /><OptionCard plan="save" household={household} budget={budget} estimates={estimates} selected={selected === 'save'} onSelect={() => setSelected('save')} /></div><section className="panel" style={{ padding: '1rem', marginTop: '.9rem' }}><div style={{ display: 'flex', gap: '.7rem', alignItems: 'flex-start' }}><CircleDollarSign size={20} aria-hidden="true" color="hsl(157 39% 31%)" /><div><strong style={{ fontSize: '.84rem' }}>Your {money(budget)} all-meals weekly target</strong><p className="helper" style={{ marginTop: '.25rem' }} aria-live="polite">{selected ? chosenFitsBudget ? `${money(chosenTotal)} selected · ${money(budget - chosenTotal)} under budget.` : `${money(chosenTotal)} selected · ${money(chosenTotal - budget)} over budget. Raise the budget or edit your week to confirm.` : `Choose a plan. The lowest estimate is ${lowest <= budget ? `${money(budget - lowest)} under budget` : `${money(lowest - budget)} over budget`}.`}</p></div></div></section><div className="button-row"><button className="secondary-button" data-testid="back-to-plan-button" onClick={onBack} type="button"><ArrowLeft size={16} aria-hidden="true" /> Back to meal plan</button><button className="primary-button" data-testid="confirm-plan-button" disabled={!selected || !chosenFitsBudget} onClick={onConfirm} type="button">{selected && !chosenFitsBudget ? 'Over budget' : `Confirm ${selected ? (selected === 'save' ? 'split shop' : 'Kroger shop') : 'a plan'}`} <Check size={16} aria-hidden="true" /></button></div><p className="fine-print">All prices, store names, distances, and travel times are illustrative demo data.</p></>;
}
function Confirmation({ household, budget, selected, weekChoice, total, splitSavings, basketCount, onCompare, onReset }: { household: number; budget: number; selected: StorePlan; weekChoice: WeekChoice; total: number; splitSavings: number; basketCount: number; onCompare: () => void; onReset: () => void }) {
  const isSave = selected === 'save';
  return <><div className="confirm-layout"><section className="panel confirmation-card"><span className="confirm-kicker">Week set · sample plan</span><h1>{isSave ? splitSavings > 0 ? 'The extra stop saves this week.' : 'Your two-store plan is set.' : 'A simpler shop for this week.'}</h1><p>Your {isSave ? 'Kroger + Aldi split' : 'Kroger-only shop'} is set for {householdLabel(household)}. You have a full seven-day plan covering breakfast, lunch, and dinner, plus one consolidated list.</p><div className="button-row"><button className="secondary-button" data-testid="change-plan-button" onClick={onCompare} type="button">Change store plan</button></div></section><section className="panel chosen-summary" aria-labelledby="chosen-heading"><h2 id="chosen-heading">Your chosen plan</h2><div className="summary-line"><span>Meal plan</span><strong>{weekChoice === 'extra' ? 'Extra-low-cost · simulated AI' : 'Standard'}</strong></div><div className="summary-line"><span>All 21 meals</span><strong data-testid="confirmed-total">{money(total)} sample total</strong></div><div className="summary-line"><span>Stops</span><strong>{isSave ? 'Kroger + Aldi' : 'Kroger'}</strong></div><div className="summary-line"><span>Travel</span><strong>{isSave ? '3.4 mi · 18 min sample' : '1.2 mi · 7 min sample'}</strong></div><div className="summary-line"><span>Target</span><strong>{money(budget)} weekly</strong></div><p className="fine-print">Totals are illustrative sample estimates, not live prices.</p></section></div><section className="panel" style={{ marginTop: '1rem', padding: '1.1rem' }}><div style={{ display: 'flex', gap: '.7rem', alignItems: 'flex-start' }}><ShoppingBasket size={20} aria-hidden="true" color="hsl(157 39% 31%)" /><div><strong style={{ fontSize: '.85rem' }}>The week at a glance</strong><p className="helper">21 meals · {basketCount} grocery ingredients · {isSave ? splitSavings > 0 ? `save ${money(splitSavings)} in the sample` : 'two-store plan selected' : 'skip the extra stop'}.</p></div></div></section><div className="button-row"><button className="text-button" data-testid="start-over-button" onClick={onReset} type="button"><RotateCcw size={14} aria-hidden="true" /> Start over</button></div></>;
}
function Home() {
  const [step, setStep] = useState<Step>('setup');
  const [household, setHousehold] = useState(6);
  const [budget, setBudget] = useState(150);
  const [budgetRequired, setBudgetRequired] = useState(false);
  const [diet, setDiet] = useState<Diet>('none');
  const [glutenFree, setGlutenFree] = useState(false);
  const [selected, setSelected] = useState<StorePlan | null>(null);
  const [weekChoice, setWeekChoice] = useState<WeekChoice>('standard');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [pantry, setPantry] = useState<Partial<Record<IngredientKey, number>>>({});
  const standardMeals = useMemo(() => makeMeals(diet, glutenFree), [diet, glutenFree]);
  const extraMeals = useMemo(() => makeExtraLowCostMeals(diet, glutenFree), [diet, glutenFree]);
  const meals = weekChoice === 'extra' ? extraMeals : standardMeals;
  const standardBasket = useMemo(() => getBasket(standardMeals, household, glutenFree, pantry), [standardMeals, household, glutenFree, pantry]);
  const extraBasket = useMemo(() => getBasket(extraMeals, household, glutenFree, pantry), [extraMeals, household, glutenFree, pantry]);
  const basket = weekChoice === 'extra' ? extraBasket : standardBasket;
  const estimates = useMemo(() => estimateStores(basket, household), [basket, household]);
  const standardEstimates = useMemo(() => estimateStores(standardBasket, household), [standardBasket, household]);
  const extraEstimates = useMemo(() => estimateStores(extraBasket, household), [extraBasket, household]);
  const reset = () => { setStep('setup'); setSelected(null); setWeekChoice('standard'); setCheckedItems({}); setPantry({}); };
  const updateHousehold = (value: number) => { setHousehold(value); setSelected(null); };
  const updateBudget = (value: number) => { setBudget(value); setSelected(null); if (value > 0) setBudgetRequired(false); };
  const updateDiet = (value: Diet) => { setDiet(value); setSelected(null); setCheckedItems({}); };
  const updateGluten = (value: boolean) => { setGlutenFree(value); setSelected(null); setCheckedItems({}); };
  const toggleIngredient = (key: string) => setCheckedItems((current) => ({ ...current, [key]: !current[key] }));
  const beginPlan = () => { if (budget <= 0) { setBudgetRequired(true); return; } setBudgetRequired(false); setStep('plan'); };
  return <Shell step={step}>{step === 'setup' && <Setup household={household} budget={budget} diet={diet} glutenFree={glutenFree} budgetRequired={budgetRequired} setHousehold={updateHousehold} setBudget={updateBudget} setDiet={updateDiet} setGlutenFree={updateGluten} onContinue={beginPlan} />}{step === 'plan' && <Plan household={household} budget={budget} meals={meals} standardMeals={standardMeals} extraMeals={extraMeals} basket={basket} estimates={estimates} standardSplit={standardEstimates.split} extraSplit={extraEstimates.split} weekChoice={weekChoice} onSelectWeek={setWeekChoice} checkedItems={checkedItems} onToggleIngredient={toggleIngredient} onPantryChange={(key, value) => setPantry((current) => ({ ...current, [key]: value }))} onBack={() => setStep('setup')} onContinue={() => { setSelected(null); setStep('compare'); }} />}{step === 'compare' && <Compare household={household} budget={budget} estimates={estimates} weekChoice={weekChoice} selected={selected} setSelected={setSelected} onBack={() => setStep('plan')} onConfirm={() => setStep('confirmed')} />}{step === 'confirmed' && selected && <Confirmation household={household} budget={budget} selected={selected} weekChoice={weekChoice} total={selected === 'usual' ? estimates.kroger : estimates.split} splitSavings={Math.max(0, estimates.kroger - estimates.split)} basketCount={basket.length} onCompare={() => setStep('compare')} onReset={reset} />}</Shell>;
}
function Router() {
  return <RoutedErrorBoundary><Switch><Route path="/" component={Home} /><Route component={NotFound} /></Switch></RoutedErrorBoundary>;
}
function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}
function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}
export default App;
