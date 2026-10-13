import { type ReactNode, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Check, CircleDollarSign, Clock3, ListChecks, MapPin, Pencil, RotateCcw, ShoppingBasket, ChevronDown, Leaf } from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import './index.css';

const queryClient = new QueryClient();
type Step = 'setup' | 'plan' | 'compare' | 'confirmed';
type StorePlan = 'usual' | 'save';
type MealType = 'Breakfast' | 'Lunch' | 'Dinner';
type Diet = 'none' | 'vegetarian' | 'vegan';
type IngredientKey = keyof typeof ingredientCatalog;
type RecipeIngredient = { key: IngredientKey; amount: number };

// One seeded unit price drives recipe quantities, the consolidated list, and both basket estimates.
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

const replacements: Partial<Record<IngredientKey, IngredientKey>> = {
  chicken: 'chickpeas', tuna: 'blackBeans', eggs: 'tofu', yogurt: 'veganYogurt',
  cheese: 'veganCheese', bread: 'gfBread', pasta: 'gfPasta',
};
const money = (n: number) => `$${n.toFixed(2)}`;
const householdLabel = (n: number) => `${n} ${n === 1 ? 'person' : 'people'}`;
const unitLabel = (n: number, unit: string) => `${Number(n.toFixed(2))} ${unit}`;
const describeIngredient = (key: IngredientKey, glutenFree: boolean) => {
  const item = ingredientCatalog[key];
  return `${item.name}${glutenFree && 'check' in item && item.check ? ' (check for a gluten-free label)' : ''}`;
};

type Meal = MealSeed & { ingredients: RecipeIngredient[]; title: string; note: string; substitution: string };
function makeMeals(diet: Diet, glutenFree: boolean): Meal[] {
  return seeds.map((seed) => {
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

function getBasket(meals: Meal[], household: number, glutenFree: boolean) {
  const scale = household / 6;
  const aggregate = new Map<IngredientKey, number>();
  for (const meal of meals) for (const ingredient of meal.ingredients) aggregate.set(ingredient.key, (aggregate.get(ingredient.key) || 0) + ingredient.amount * scale);
  return [...aggregate.entries()].map(([key, quantity]) => {
    const item = ingredientCatalog[key];
    return { key, item: item.name, unit: item.unit, quantity, price: quantity * item.price, check: glutenFree && 'check' in item && !!item.check };
  });
}
// Store premium follows household scaling, independent of which ingredients appear in the basket.
const storePremium = (household: number) => 9.6 * household / 6;

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
function Setup({ household, budget, diet, glutenFree, setHousehold, setBudget, setDiet, setGlutenFree, onContinue }: { household: number; budget: number; diet: Diet; glutenFree: boolean; setHousehold: (n: number) => void; setBudget: (n: number) => void; setDiet: (d: Diet) => void; setGlutenFree: (g: boolean) => void; onContinue: () => void }) {
  const choices: { id: Diet; label: string; detail: string }[] = [{ id: 'none', label: 'No dietary restrictions', detail: 'The full menu' }, { id: 'vegetarian', label: 'Vegetarian', detail: 'Eggs and dairy included' }, { id: 'vegan', label: 'Vegan', detail: 'No animal products' }];
  return <>
    <p className="eyebrow">Start with the week you actually have</p><h1 className="page-title">A full week of meals, within your budget.</h1><p className="page-intro">Tell us who is eating, what to spend, and how you eat. We’ll plan breakfast, lunch, and dinner for seven days, then compare one easy stop with a lower-cost second stop.</p>
    <div className="setup-layout" style={{ marginTop: '1.7rem' }}><section className="panel setup-card" aria-labelledby="week-details-heading"><div className="panel-heading"><div><h2 className="panel-title" id="week-details-heading">This week’s details</h2><p className="panel-kicker">You can change these before you confirm a store plan.</p></div><Pencil size={18} aria-hidden="true" color="hsl(157 39% 31%)" /></div>
      <label className="field-label" id="household-label">Household size</label><div className="choice-grid" role="group" aria-labelledby="household-label">{[1, 2, 3, 4, 5, 6].map((size) => <button className={`choice-button ${household === size ? 'is-selected' : ''}`} data-testid={`household-size-${size}`} key={size} onClick={() => setHousehold(size)} type="button" aria-pressed={household === size}>{size} {size === 1 ? 'person' : 'people'}</button>)}</div>
      <label className="field-label" htmlFor="budget-input">Weekly grocery budget</label><div className="money-input"><span aria-hidden="true">$</span><input id="budget-input" data-testid="budget-input" inputMode="decimal" min="1" onChange={(event) => setBudget(Math.max(0, Number(event.target.value.replace(/[^0-9.]/g, '')) || 0))} type="number" value={budget || ''} /></div><p className="helper">Target for ingredients across all 21 planned meals, using illustrative sample prices.</p>
      <fieldset className="diet-fieldset"><legend className="field-label">Dietary preferences <span className="optional-label">optional</span></legend><div className="diet-choice-grid" role="radiogroup" aria-label="Choose a dietary pattern">{choices.map((choice) => <button key={choice.id} type="button" role="radio" aria-checked={diet === choice.id} className={`diet-choice ${diet === choice.id ? 'is-selected' : ''}`} data-testid={`diet-${choice.id}`} onClick={() => setDiet(choice.id)}><span className="diet-choice-top">{choice.label}{diet === choice.id && <Check size={15} aria-hidden="true" />}</span><small>{choice.detail}</small></button>)}</div><label className={`gf-choice ${glutenFree ? 'is-selected' : ''}`}><input type="checkbox" checked={glutenFree} onChange={(e) => setGlutenFree(e.target.checked)} data-testid="diet-gluten-free" /><span className="gf-icon"><Leaf size={16} aria-hidden="true" /></span><span><strong>Gluten-free</strong><small>Can be combined with vegetarian or vegan. Label checks are called out in the grocery list.</small></span></label></fieldset>
      <div className="button-row"><button className="primary-button" data-testid="build-plan-button" onClick={onContinue} type="button">Build my weekly meal plan <ArrowRight size={16} aria-hidden="true" /></button></div></section>
      <aside className="panel snapshot-card" aria-label="Plan preview"><span className="snapshot-label">Your starting point</span><div className="snapshot-number">{household} × 21</div><div className="snapshot-detail">meals for {householdLabel(household)} with an illustrative ${Math.round(budget)} weekly target.</div><div className="snapshot-preferences">{diet === 'none' ? 'No dietary restrictions' : diet === 'vegan' ? 'Vegan' : 'Vegetarian'}{glutenFree ? ' · Gluten-free' : ''}</div><div className="button-row"><span className="snapshot-detail">BendBites keeps the maths visible as you decide.</span></div></aside></div>
    <p className="fine-print">BendBites is a planning prototype. It does not use location services, live pricing, accounts, or checkout.</p>
  </>;
}
function recipeSteps(meal: Meal) {
  const ingredients = meal.ingredients.map(({ key, amount }) => `${unitLabel(amount, ingredientCatalog[key].unit)} ${describeIngredient(key, meal.note.includes('certified gluten-free'))}`).join(', ');
  const hotIngredients = meal.ingredients.filter(({ key }) => ['eggs', 'chicken', 'tofu', 'pasta', 'rice', 'lentils', 'potatoes', 'blackBeans', 'chickpeas', 'frozenVeg', 'tomatoes'].includes(key));
  const hotText = hotIngredients.map(({ key }) => ingredientCatalog[key].name.toLowerCase()).join(', ') || 'the main ingredients';
  return [
    `Gather and measure: ${ingredients}. Rinse produce and open any cans.`,
    `Cook ${hotText} until tender and safely heated. Follow the package directions for grains or pasta, and use only the seasonings listed above.`,
    `Stir in the remaining ingredients, warm through if needed, then taste and serve. The recipe uses only the ingredients shown above.`,
  ];
}
function Plan({ household, budget, meals, glutenFree, onBack, onContinue }: { household: number; budget: number; meals: Meal[]; glutenFree: boolean; onBack: () => void; onContinue: () => void }) {
  const basket = useMemo(() => getBasket(meals, household, glutenFree), [meals, household, glutenFree]);
  const listTotal = basket.reduce((total, item) => total + item.price, 0);
  const budgetRoom = budget - listTotal;
  const scale = household / 6;
  return <>
    <div className="plan-header"><div><p className="eyebrow">A week with a little structure</p><h1>21 meals, one useful list.</h1></div><div className="budget-readout">WEEKLY GROCERY TARGET<strong data-testid="weekly-budget-value">{money(budget)}</strong></div></div>
    <p className="page-intro" style={{ marginTop: 0 }}>Seven days of breakfast, lunch, and dinner. Ingredient quantities and estimates are scaled for {householdLabel(household)}; recipes, list, and totals all share the same ingredient data.</p>
    <div className="plan-grid" style={{ marginTop: '1.4rem' }}><section className="meal-section-stack" aria-label="Seven-day meal plan">{(['Breakfast', 'Lunch', 'Dinner'] as MealType[]).map((type) => <section className="panel list-card meal-section" key={type} aria-labelledby={`meal-type-${type.toLowerCase()}`}><div className="list-head"><h2 id={`meal-type-${type.toLowerCase()}`}>{type}</h2><span>7 days · {householdLabel(household)}</span></div><div className="meal-grid" style={{ marginTop: '.65rem' }}>{meals.filter((meal) => meal.type === type).map((meal) => {
      const mealCost = meal.ingredients.reduce((sum, ing) => sum + ing.amount * scale * ingredientCatalog[ing.key].price, 0);
      const steps = recipeSteps(meal);
      return <article className="panel meal-row" key={`${meal.type}-${meal.day}`} data-testid={`meal-${meal.type.toLowerCase()}-${meal.day.toLowerCase()}`}><span className="day-tag">{meal.day}</span><div className="meal-main"><h3 className="meal-name">{meal.title}</h3><p className="meal-desc">{meal.note}</p><span className="meal-cost" data-testid={`meal-cost-${meal.type.toLowerCase()}-${meal.day.toLowerCase()}`}>{money(mealCost)} ingredients</span><details className="recipe-disclosure"><summary data-testid={`recipe-toggle-${meal.type.toLowerCase()}-${meal.day.toLowerCase()}`}><span>How to make this</span><ChevronDown size={15} aria-hidden="true" /></summary><div className="recipe-content"><p className="recipe-meta"><Clock3 size={14} aria-hidden="true" /> {meal.prep} min prep · {meal.cook ? `${meal.cook} min cook` : 'no cooking'} · scaled for {householdLabel(household)}</p><h4>Ingredients</h4><ul>{meal.ingredients.map(({ key, amount }, i) => <li key={`${key}-${i}`}>{unitLabel(amount * scale, ingredientCatalog[key].unit)} {describeIngredient(key, meal.note.includes('certified gluten-free'))}</li>)}</ul><h4>Steps</h4><ol>{steps.map((step, i) => <li key={i}>{step}</li>)}</ol><p className="recipe-substitution">{meal.substitution}</p></div></details></div></article>;
    })}</div></section>)}</section>
      <section className="panel list-card" aria-labelledby="grocery-heading"><div className="list-head"><h2 id="grocery-heading">Consolidated grocery list</h2><span>{basket.length} ingredients · 7 days</span></div><ul className="grocery-list">{basket.map((item) => <li className="grocery-item" key={item.key}><span>{item.item}{item.check && <small className="label-check">Check GF label</small>}</span><span>{unitLabel(item.quantity, item.unit)} · {money(item.price)}</span></li>)}</ul><div className="summary-line" style={{ marginTop: '1rem' }}><span>Estimated ingredient subtotal</span><strong data-testid="grocery-total">{money(listTotal)}</strong></div><p className="helper">Usage quantities aggregated from these 21 recipes at seeded illustrative unit prices. Gluten-free label checks are marked where relevant.</p></section></div>
    <section className="panel comparison-intro" style={{ marginTop: '1rem' }}><div style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-start' }}><ListChecks size={19} aria-hidden="true" color="hsl(157 39% 31%)" /><div><strong style={{ fontSize: '.84rem' }}>A quick budget check</strong><p style={{ marginTop: '.25rem' }}>{budgetRoom >= 0 ? `The lower-cost full-week basket is ${money(listTotal)}—${money(budgetRoom)} under your target.` : `The lower-cost full-week basket is ${money(listTotal)}, or ${money(Math.abs(budgetRoom))} over target. You can compare options, but cannot confirm an over-budget basket.`}</p></div></div></section>
    <div className="button-row"><button className="secondary-button" data-testid="back-to-setup-button" onClick={onBack} type="button"><ArrowLeft size={16} aria-hidden="true" /> Edit week</button><button className="primary-button" data-testid="compare-stores-button" onClick={onContinue} type="button">Compare store plans <ArrowRight size={16} aria-hidden="true" /></button></div><p className="fine-print">Sample ingredient prices only. Both store estimates cover this exact consolidated list; no live pricing.</p>
  </>;
}
function OptionCard({ plan, household, budget, baseTotal, selected, onSelect }: { plan: StorePlan; household: number; budget: number; baseTotal: number; selected: boolean; onSelect: () => void }) {
  const isSave = plan === 'save';
  const total = baseTotal + (isSave ? 0 : storePremium(household));
  const miles = isSave ? '3.4 mi' : '1.2 mi';
  const time = isSave ? '18 min' : '7 min';
  return <article className={`panel option-card ${isSave ? 'is-recommended' : ''}`} aria-label={`${isSave ? 'Two-store savings' : 'Single-store convenience'} option`}>{isSave && <span className="recommend-tag">Save {money(storePremium(household))} sample</span>}<div className="option-title"><div><h3>{isSave ? 'Split the shop' : 'Keep it simple'}</h3><p>{isSave ? 'Kroger + Aldi' : 'Kroger only'} · sample locations</p></div><div className="option-total" data-testid={`compare-total-${plan}`}>{money(total)}<small>estimated basket</small></div></div><div className="metric-stack"><div><span className="metric-label">Store stops</span><span className="metric-value">{isSave ? '2' : '1'}</span></div><div><span className="metric-label">Weekly saving</span><span className="metric-value">{isSave ? money(storePremium(household)) : '—'}</span></div><div><span className="metric-label">Drive time</span><span className="metric-value">{time}</span></div></div><p className="option-note">{isSave ? 'Aldi covers lower-priced pantry staples and produce; Kroger fills the remaining items.' : 'One familiar stop and fewer minutes in the car. The convenience premium is included.'}</p><p className={`option-budget-status ${total <= budget ? 'fits-budget' : 'over-budget'}`} data-testid={`budget-status-${plan}`}>{total <= budget ? `${money(budget - total)} under your weekly target` : `${money(total - budget)} over your weekly target`}</p><div className="trip-lines"><div className="trip-line"><span><MapPin size={13} aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: '.3rem' }} />Location distance</span><strong>{miles}</strong></div><div className="trip-line"><span><Clock3 size={13} aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: '.3rem' }} />Illustrative drive time</span><strong>{time}{isSave ? ' · +11 min' : ''}</strong></div></div><div className="button-row"><button className={selected ? 'primary-button' : 'secondary-button'} data-testid={`select-plan-${plan}`} onClick={onSelect} type="button" aria-pressed={selected}>{selected ? <><Check size={16} aria-hidden="true" /> Selected</> : <>Choose this plan <ArrowRight size={16} aria-hidden="true" /></>}</button></div></article>;
}
function Compare({ household, budget, baseTotal, selected, setSelected, onBack, onConfirm }: { household: number; budget: number; baseTotal: number; selected: StorePlan | null; setSelected: (plan: StorePlan) => void; onBack: () => void; onConfirm: () => void }) {
  const chosenTotal = selected ? baseTotal + (selected === 'usual' ? storePremium(household) : 0) : 0;
  const chosenFitsBudget = !!selected && chosenTotal <= budget;
  return <><section className="panel comparison-intro"><p className="eyebrow">The part worth deciding</p><h1>Is the second stop worth it to you?</h1><p>Both options cover the same full week of 21 meals for {householdLabel(household)}. The lower-cost basket is {money(baseTotal)}; Kroger’s convenience estimate adds {money(storePremium(household))}. Sample estimates, not live pricing or navigation.</p></section><div className="compare-grid"><OptionCard plan="usual" household={household} budget={budget} baseTotal={baseTotal} selected={selected === 'usual'} onSelect={() => setSelected('usual')} /><OptionCard plan="save" household={household} budget={budget} baseTotal={baseTotal} selected={selected === 'save'} onSelect={() => setSelected('save')} /></div><section className="panel" style={{ padding: '1rem', marginTop: '.9rem' }}><div style={{ display: 'flex', gap: '.7rem', alignItems: 'flex-start' }}><CircleDollarSign size={20} aria-hidden="true" color="hsl(157 39% 31%)" /><div><strong style={{ fontSize: '.84rem' }}>Your {money(budget)} all-meals weekly target</strong><p className="helper" style={{ marginTop: '.25rem' }} aria-live="polite">{selected ? chosenFitsBudget ? `${money(chosenTotal)} sample basket selected · ${money(budget - chosenTotal)} left before target.` : `${money(chosenTotal)} sample basket selected · ${money(chosenTotal - budget)} over target. Raise the budget or edit your week before confirming.` : `Choose exactly one plan. The cheaper basket is ${baseTotal <= budget ? `${money(budget - baseTotal)} under target` : `${money(baseTotal - budget)} over target`}.`}</p></div></div></section><div className="button-row"><button className="secondary-button" data-testid="back-to-plan-button" onClick={onBack} type="button"><ArrowLeft size={16} aria-hidden="true" /> Back to meal plan</button><button className="primary-button" data-testid="confirm-plan-button" disabled={!selected || !chosenFitsBudget} onClick={onConfirm} type="button">{selected && !chosenFitsBudget ? 'Over budget' : `Confirm ${selected ? (selected === 'save' ? 'split shop' : 'Kroger shop') : 'a plan'}`} <Check size={16} aria-hidden="true" /></button></div><p className="fine-print">All prices, store names, distances, and travel times are illustrative demo data.</p></>;
}
function Confirmation({ household, budget, selected, total, basketCount, onCompare, onReset }: { household: number; budget: number; selected: StorePlan; total: number; basketCount: number; onCompare: () => void; onReset: () => void }) {
  const isSave = selected === 'save';
  return <><div className="confirm-layout"><section className="panel confirmation-card"><span className="confirm-kicker">Week set · sample plan</span><h1>{isSave ? 'The extra stop earns its keep.' : 'A simpler shop for this week.'}</h1><p>Your {isSave ? 'Kroger + Aldi split' : 'Kroger-only shop'} is set for {householdLabel(household)}. You have a full seven-day plan covering breakfast, lunch, and dinner, plus one consolidated list.</p><div className="button-row"><button className="secondary-button" data-testid="change-plan-button" onClick={onCompare} type="button">Change store plan</button></div></section><section className="panel chosen-summary" aria-labelledby="chosen-heading"><h2 id="chosen-heading">Your chosen plan</h2><div className="summary-line"><span>All 21 meals</span><strong data-testid="confirmed-total">{money(total)} sample total</strong></div><div className="summary-line"><span>Stops</span><strong>{isSave ? 'Kroger + Aldi' : 'Kroger'}</strong></div><div className="summary-line"><span>Travel</span><strong>{isSave ? '3.4 mi · 18 min sample' : '1.2 mi · 7 min sample'}</strong></div><div className="summary-line"><span>Target</span><strong>{money(budget)} weekly</strong></div><p className="fine-print">Totals are illustrative sample estimates, not live prices.</p></section></div><section className="panel" style={{ marginTop: '1rem', padding: '1.1rem' }}><div style={{ display: 'flex', gap: '.7rem', alignItems: 'flex-start' }}><ShoppingBasket size={20} aria-hidden="true" color="hsl(157 39% 31%)" /><div><strong style={{ fontSize: '.85rem' }}>The week at a glance</strong><p className="helper">21 meals · {basketCount} grocery ingredients · {isSave ? `save ${money(storePremium(household))} in the sample` : 'skip the extra stop'}.</p></div></div></section><div className="button-row"><button className="text-button" data-testid="start-over-button" onClick={onReset} type="button"><RotateCcw size={14} aria-hidden="true" /> Start over</button></div></>;
}
function Home() {
  const [step, setStep] = useState<Step>('setup');
  const [household, setHousehold] = useState(6);
  const [budget, setBudget] = useState(150);
  const [diet, setDiet] = useState<Diet>('none');
  const [glutenFree, setGlutenFree] = useState(false);
  const [selected, setSelected] = useState<StorePlan | null>(null);
  const meals = useMemo(() => makeMeals(diet, glutenFree), [diet, glutenFree]);
  const basket = useMemo(() => getBasket(meals, household, glutenFree), [meals, household, glutenFree]);
  const baseTotal = basket.reduce((sum, item) => sum + item.price, 0);
  const reset = () => { setStep('setup'); setSelected(null); };
  const updateHousehold = (value: number) => { setHousehold(value); setSelected(null); };
  const updateBudget = (value: number) => { setBudget(value); setSelected(null); };
  const updateDiet = (value: Diet) => { setDiet(value); setSelected(null); };
  const updateGluten = (value: boolean) => { setGlutenFree(value); setSelected(null); };
  return <Shell step={step}>{step === 'setup' && <Setup household={household} budget={budget} diet={diet} glutenFree={glutenFree} setHousehold={updateHousehold} setBudget={updateBudget} setDiet={updateDiet} setGlutenFree={updateGluten} onContinue={() => setStep('plan')} />}{step === 'plan' && <Plan household={household} budget={budget} meals={meals} glutenFree={glutenFree} onBack={() => setStep('setup')} onContinue={() => { setSelected(null); setStep('compare'); }} />}{step === 'compare' && <Compare household={household} budget={budget} baseTotal={baseTotal} selected={selected} setSelected={setSelected} onBack={() => setStep('plan')} onConfirm={() => setStep('confirmed')} />}{step === 'confirmed' && selected && <Confirmation household={household} budget={budget} selected={selected} total={baseTotal + (selected === 'usual' ? storePremium(household) : 0)} basketCount={basket.length} onCompare={() => setStep('compare')} onReset={reset} />}</Shell>;
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
