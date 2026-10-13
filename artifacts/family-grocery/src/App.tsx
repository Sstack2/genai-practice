import { type ReactNode, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Check, CircleDollarSign, Clock3, ListChecks, MapPin, Pencil, RotateCcw, ShoppingBasket } from 'lucide-react';
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

const meals = [
  { type: 'Breakfast' as MealType, day: 'Mon', name: 'Banana peanut-butter oatmeal', description: 'Warm rolled oats with banana and a spoon of peanut butter.', cost: 3.1 },
  { type: 'Breakfast' as MealType, day: 'Tue', name: 'Spinach eggs & whole-grain toast', description: 'Soft eggs with spinach and toast on the side.', cost: 4.85 },
  { type: 'Breakfast' as MealType, day: 'Wed', name: 'Yogurt, oats & banana bowls', description: 'Plain yogurt topped with oats and sliced banana.', cost: 4.9 },
  { type: 'Breakfast' as MealType, day: 'Thu', name: 'Apple-cinnamon oatmeal', description: 'Oats simmered with apples and cinnamon.', cost: 3.6 },
  { type: 'Breakfast' as MealType, day: 'Fri', name: 'Bean & egg breakfast tacos', description: 'Eggs and black beans in warm tortillas with salsa.', cost: 5.7 },
  { type: 'Breakfast' as MealType, day: 'Sat', name: 'Peanut-butter toast & fruit', description: 'Whole-grain toast with peanut butter and fresh fruit.', cost: 4.5 },
  { type: 'Breakfast' as MealType, day: 'Sun', name: 'Potato, spinach & egg skillet', description: 'Crisp potatoes with eggs and a handful of greens.', cost: 6 },
  { type: 'Lunch' as MealType, day: 'Mon', name: 'Black bean & rice bowls', description: 'Brown rice, seasoned beans, cabbage, and salsa.', cost: 5 },
  { type: 'Lunch' as MealType, day: 'Tue', name: 'Chicken & carrot wraps', description: 'Chicken, crunchy carrots, and greens rolled in tortillas.', cost: 6.4 },
  { type: 'Lunch' as MealType, day: 'Wed', name: 'Lentil tomato soup & toast', description: 'A simple lentil soup with tomatoes, carrots, and whole-grain toast.', cost: 6.6 },
  { type: 'Lunch' as MealType, day: 'Thu', name: 'Chickpea spinach bowls', description: 'Chickpeas and spinach over brown rice with a yogurt dressing.', cost: 5.8 },
  { type: 'Lunch' as MealType, day: 'Fri', name: 'Tuna & apple sandwiches', description: 'Tuna sandwiches on whole-grain bread with apple slices.', cost: 6.4 },
  { type: 'Lunch' as MealType, day: 'Sat', name: 'Egg salad & carrot sticks', description: 'Egg salad on toast with fresh carrots on the side.', cost: 5.5 },
  { type: 'Lunch' as MealType, day: 'Sun', name: 'Salsa bean & rice bowls', description: 'A quick bowl of rice, beans, vegetables, and salsa.', cost: 5.2 },
  { type: 'Dinner' as MealType, day: 'Mon', name: 'Sheet-pan chicken & potatoes', description: 'Chicken thighs roasted with potatoes and carrots.', cost: 9.5 },
  { type: 'Dinner' as MealType, day: 'Tue', name: 'Black bean cabbage tacos', description: 'Black beans, crunchy cabbage, and a little cheese in tortillas.', cost: 8.2 },
  { type: 'Dinner' as MealType, day: 'Wed', name: 'Lentil tomato pasta', description: 'Whole-wheat pasta with tomato lentils and spinach.', cost: 8.7 },
  { type: 'Dinner' as MealType, day: 'Thu', name: 'Vegetable egg fried rice', description: 'Brown rice tossed with eggs and frozen vegetables.', cost: 7.8 },
  { type: 'Dinner' as MealType, day: 'Fri', name: 'Chicken, rice & greens', description: 'Seasoned chicken with brown rice and spinach.', cost: 10.2 },
  { type: 'Dinner' as MealType, day: 'Sat', name: 'Chickpea tomato curry', description: 'Chickpeas and tomatoes served over rice.', cost: 8.7 },
  { type: 'Dinner' as MealType, day: 'Sun', name: 'Whole-wheat pasta & beans', description: 'Pasta with beans, greens, and a simple tomato sauce.', cost: 9.35 },
];

const groceryItems = [
  { item: 'Rolled oats', quantity: '4 lb', price: 4 },
  { item: 'Bananas', quantity: '5 lb', price: 4.5 },
  { item: 'Peanut butter', quantity: '2 jars', price: 5 },
  { item: 'Eggs', quantity: '3 dozen', price: 10 },
  { item: 'Whole-grain bread', quantity: '3 loaves', price: 7.5 },
  { item: 'Milk', quantity: '2 gallons', price: 6.5 },
  { item: 'Apples', quantity: '4 lb', price: 5 },
  { item: 'Plain yogurt', quantity: '1 tub', price: 4 },
  { item: 'Frozen berries', quantity: '1 bag', price: 3.5 },
  { item: 'Brown rice', quantity: '10 lb', price: 8 },
  { item: 'Dry lentils', quantity: '3 lb', price: 4 },
  { item: 'Black beans', quantity: '8 cans', price: 8 },
  { item: 'Chicken thighs', quantity: '4 lb', price: 8 },
  { item: 'Whole-wheat pasta', quantity: '3 lb', price: 3.5 },
  { item: 'Corn tortillas', quantity: '2 packs', price: 4 },
  { item: 'Frozen vegetables', quantity: '3 bags', price: 5.5 },
  { item: 'Carrots', quantity: '5 lb', price: 4 },
  { item: 'Potatoes', quantity: '10 lb', price: 5.5 },
  { item: 'Canned tomatoes', quantity: '4 cans', price: 4 },
  { item: 'Spinach', quantity: '1 bag', price: 2 },
  { item: 'Shredded cheese', quantity: '1 lb', price: 4 },
  { item: 'Tuna', quantity: '3 cans', price: 3.75 },
  { item: 'Chickpeas', quantity: '2 cans', price: 2 },
  { item: 'Onions', quantity: '3 lb', price: 2.5 },
  { item: 'Salsa', quantity: '1 jar', price: 2 },
  { item: 'Cooking oil & seasoning allowance', quantity: '1 set', price: 4 },
  { item: 'Seasonal fruit top-up', quantity: '4 lb', price: 5.5 },
  { item: 'Cabbage, cucumber & garlic', quantity: '1 bundle', price: 5.75 },
];

const money = (value: number) => `$${value.toFixed(2)}`;
const wholeMoney = (value: number) => `$${Math.round(value)}`;
const FAMILY_OF_SIX_BASKET = groceryItems.reduce((total, item) => total + item.price, 0);
const CONVENIENCE_PREMIUM_FOR_SIX = 9.6;
const getBasketTotal = (plan: StorePlan, household: number) => {
  const familyOfSixTotal = FAMILY_OF_SIX_BASKET + (plan === 'usual' ? CONVENIENCE_PREMIUM_FOR_SIX : 0);
  return Math.round(familyOfSixTotal * (household / 6) * 100) / 100;
};
const getSavings = (household: number) =>
  Math.round(CONVENIENCE_PREMIUM_FOR_SIX * (household / 6) * 100) / 100;

const scaledQuantity = (quantity: string, scale: number) => {
  const match = quantity.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
  if (!match) return quantity;
  const base = Number(match[1]);
  const unit = match[2];
  const scaled = base * scale;
  const rounded = unit.includes('lb') ? Math.max(0.5, Math.round(scaled * 10) / 10) : Math.max(1, Math.ceil(scaled));
  return `${rounded} ${unit}`;
};

function Shamrock({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="6" r="4.2" />
      <circle cx="7.2" cy="10.5" r="4.2" />
      <circle cx="16.8" cy="10.5" r="4.2" />
      <path d="M12 9.5v10c0 1.5-.8 2.7-2.2 3.6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function BrandWordmark() {
  return (
    <span className="brand-wordmark" role="img" aria-label="Bend Bites">
      <span aria-hidden="true">
        Be<span className="brand-nd">ND</span> B<span className="wordmark-i">ı<Shamrock className="wordmark-shamrock" /></span>tes
      </span>
    </span>
  );
}

function Progress({ step }: { step: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: 'setup', label: 'Your week' },
    { id: 'plan', label: 'Meal plan' },
    { id: 'compare', label: 'Store options' },
    { id: 'confirmed', label: 'Confirmed' },
  ];
  const current = steps.findIndex((item) => item.id === step);
  return (
    <nav className="progress-row" aria-label="Planning progress">
      {steps.map((item, index) => (
        <div className={`progress-step ${index === current ? 'is-current' : ''} ${index < current ? 'is-done' : ''}`} key={item.id}>
          <span className="step-num">{index < current ? <Check size={12} strokeWidth={3} /> : index + 1}</span>
          <span>{item.label}</span>
          {index < steps.length - 1 && <span className="step-line" aria-hidden="true" />}
        </div>
      ))}
    </nav>
  );
}

function Shell({ children, step }: { children: ReactNode; step: Step }) {
  return (
    <div className="app-shell">
      <div className="shell-grid">
        <aside className="side-rail">
          <div className="brand-mark"><span className="brand-dot"><Shamrock className="brand-shamrock" /></span><BrandWordmark /></div>
          <p className="rail-copy">A practical plan for the whole week: three meals a day, one grocery list, no guesswork.</p>
          <div className="rail-note">Sample mode<br />Prices, places, and travel times are illustrative demo data.</div>
        </aside>
        <main className="main-area">
          <header className="topbar">
            <div className="mobile-brand"><span className="brand-dot"><Shamrock className="brand-shamrock" /></span><BrandWordmark /></div>
            <span className="sample-pill">Illustrative demo</span>
          </header>
          <div className="content-wrap">
            <Progress step={step} />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function Setup({ household, budget, setHousehold, setBudget, onContinue }: {
  household: number;
  budget: number;
  setHousehold: (value: number) => void;
  setBudget: (value: number) => void;
  onContinue: () => void;
}) {
  return (
    <>
      <p className="eyebrow">Start with the week you actually have</p>
      <h1 className="page-title">A full week of meals, within your budget.</h1>
      <p className="page-intro">Tell us who is eating and what you want to spend. We’ll plan breakfast, lunch, and dinner for seven days, then compare one easy stop with a lower-cost second stop.</p>
      <div className="setup-layout" style={{ marginTop: '1.7rem' }}>
        <section className="panel setup-card" aria-labelledby="week-details-heading">
          <div className="panel-heading">
            <div>
              <h2 className="panel-title" id="week-details-heading">This week’s details</h2>
              <p className="panel-kicker">You can change these before you confirm a store plan.</p>
            </div>
            <Pencil size={18} aria-hidden="true" color="hsl(157 39% 31%)" />
          </div>
          <label className="field-label" id="household-label">Household size</label>
          <div className="choice-grid" role="group" aria-labelledby="household-label">
            {[1, 2, 3, 4, 5, 6].map((size) => (
              <button
                className={`choice-button ${household === size ? 'is-selected' : ''}`}
                data-testid={`household-size-${size}`}
                key={size}
                onClick={() => setHousehold(size)}
                type="button"
                aria-pressed={household === size}
              >
                {size} {size === 1 ? 'person' : 'people'}
              </button>
            ))}
          </div>
          <label className="field-label" htmlFor="budget-input">Weekly grocery budget</label>
          <div className="money-input">
            <span aria-hidden="true">$</span>
            <input
              id="budget-input"
              data-testid="budget-input"
              inputMode="decimal"
              min="1"
              onChange={(event) => setBudget(Math.max(0, Number(event.target.value.replace(/[^0-9.]/g, '')) || 0))}
              type="number"
              value={budget || ''}
            />
          </div>
          <p className="helper">This target covers the groceries for all 21 planned meals, not a live store quote.</p>
          <div className="button-row">
            <button className="primary-button" data-testid="build-plan-button" onClick={onContinue} type="button">
              Build my weekly meal plan <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </section>
        <aside className="panel snapshot-card" aria-label="Plan preview">
          <span className="snapshot-label">Your starting point</span>
           <div className="snapshot-number">{household} × 21</div>
           <div className="snapshot-detail">meals for {household === 1 ? 'one person' : `${household} people`} with an illustrative {wholeMoney(budget)} weekly grocery target.</div>
          <div className="button-row">
            <span className="snapshot-detail">Bend Bites keeps the maths visible as you decide.</span>
          </div>
        </aside>
      </div>
      <p className="fine-print">Bend Bites is a planning prototype. It does not use location services, live pricing, accounts, or checkout.</p>
    </>
  );
}

function Plan({ household, budget, onBack, onContinue }: { household: number; budget: number; onBack: () => void; onContinue: () => void }) {
  const scale = household / 6;
  const list = useMemo(() => groceryItems.map((item) => ({ ...item, quantity: scaledQuantity(item.quantity, scale), price: item.price * scale })), [scale]);
  const listTotal = getBasketTotal('save', household);
  const budgetRoom = budget - listTotal;
  return (
    <>
      <div className="plan-header">
        <div>
          <p className="eyebrow">A week with a little structure</p>
          <h1>21 meals, one useful list.</h1>
        </div>
        <div className="budget-readout">WEEKLY GROCERY TARGET<strong data-testid="weekly-budget-value">{money(budget)}</strong></div>
      </div>
      <p className="page-intro" style={{ marginTop: 0 }}>A full seven days of breakfast, lunch, and dinner. Shared staples keep the six-person sample basket at {money(FAMILY_OF_SIX_BASKET)} before any convenience premium; quantities and estimates adjust for {household} {household === 1 ? 'person' : 'people'}.</p>
      <div className="plan-grid" style={{ marginTop: '1.4rem' }}>
        <section className="meal-section-stack" aria-label="Seven-day meal plan">
          {(['Breakfast', 'Lunch', 'Dinner'] as MealType[]).map((type) => (
            <section className="panel list-card meal-section" key={type} aria-labelledby={`meal-type-${type.toLowerCase()}`}>
              <div className="list-head">
                <h2 id={`meal-type-${type.toLowerCase()}`}>{type}</h2>
                <span>7 days · {household} {household === 1 ? 'person' : 'people'}</span>
              </div>
              <div className="meal-grid" style={{ marginTop: '.65rem' }}>
                {meals.filter((meal) => meal.type === type).map((meal) => (
                  <article className="panel meal-row" key={`${meal.type}-${meal.day}`} data-testid={`meal-${meal.type.toLowerCase()}-${meal.day.toLowerCase()}`}>
                    <span className="day-tag">{meal.day}</span>
                    <div><h3 className="meal-name">{meal.name}</h3><p className="meal-desc">{meal.description}</p></div>
                    <span className="meal-cost" data-testid={`meal-cost-${meal.type.toLowerCase()}-${meal.day.toLowerCase()}`}>{money(meal.cost * scale)}</span>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </section>
        <section className="panel list-card" aria-labelledby="grocery-heading">
          <div className="list-head">
            <h2 id="grocery-heading">Consolidated grocery list</h2>
            <span>{groceryItems.length} items · 7 days</span>
          </div>
          <ul className="grocery-list">
            {list.map((item) => <li className="grocery-item" key={item.item}><span>{item.item}</span><span>{item.quantity} · {money(item.price)}</span></li>)}
          </ul>
          <div className="summary-line" style={{ marginTop: '1rem' }}><span>Illustrative list subtotal</span><strong data-testid="grocery-total">{money(listTotal)}</strong></div>
          <p className="helper">This is the lower-cost sample basket for all 21 meals. Pantry basics are included; store totals may vary.</p>
        </section>
      </div>
      <section className="panel comparison-intro" style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-start' }}><ListChecks size={19} aria-hidden="true" color="hsl(157 39% 31%)" /><div><strong style={{ fontSize: '.84rem' }}>A quick budget check</strong><p style={{ marginTop: '.25rem' }}>{budgetRoom >= 0 ? `The lower-cost full-week basket is ${money(listTotal)}—${money(budgetRoom)} under your target.` : `The lower-cost full-week basket is ${money(listTotal)}, or ${money(Math.abs(budgetRoom))} over target. The comparison will show this before you confirm.`}</p></div></div>
      </section>
      <div className="button-row">
        <button className="secondary-button" data-testid="back-to-setup-button" onClick={onBack} type="button"><ArrowLeft size={16} aria-hidden="true" /> Edit week</button>
        <button className="primary-button" data-testid="compare-stores-button" onClick={onContinue} type="button">Compare store plans <ArrowRight size={16} aria-hidden="true" /></button>
      </div>
      <p className="fine-print">Meal and store prices are illustrative. The store comparison totals cover the grocery list for all 21 meals.</p>
    </>
  );
}

function OptionCard({ plan, household, budget, selected, onSelect }: { plan: StorePlan; household: number; budget: number; selected: boolean; onSelect: () => void }) {
  const isSave = plan === 'save';
  const total = getBasketTotal(plan, household);
  const miles = isSave ? '3.4 mi' : '1.2 mi';
  const time = isSave ? '18 min' : '7 min';
  return (
    <article className={`panel option-card ${isSave ? 'is-recommended' : ''}`} aria-label={`${isSave ? 'Two-store savings' : 'Single-store convenience'} option`}>
      {isSave && <span className="recommend-tag">Save {money(getSavings(household))} sample</span>}
      <div className="option-title">
        <div>
          <h3>{isSave ? 'Split the shop' : 'Keep it simple'}</h3>
          <p>{isSave ? 'Kroger + Aldi' : 'Kroger only'} · sample locations</p>
        </div>
        <div className="option-total" data-testid={`compare-total-${plan}`}>{money(total)}<small>estimated basket</small></div>
      </div>
      <div className="metric-stack">
        <div><span className="metric-label">Store stops</span><span className="metric-value">{isSave ? '2' : '1'}</span></div>
        <div><span className="metric-label">Weekly saving</span><span className="metric-value">{isSave ? money(getSavings(household)) : '—'}</span></div>
        <div><span className="metric-label">Extra driving</span><span className="metric-value">{isSave ? '+11 min' : '—'}</span></div>
      </div>
      <p className="option-note">{isSave ? 'Aldi covers pantry staples and produce at a lower sample price; Kroger fills the remaining items.' : 'One familiar stop, one list, and fewer minutes in the car. The premium is the convenience.'}</p>
      <p className={`option-budget-status ${total <= budget ? 'fits-budget' : 'over-budget'}`} data-testid={`budget-status-${plan}`}>
        {total <= budget ? `${money(budget - total)} under your weekly target` : `${money(total - budget)} over your weekly target`}
      </p>
      <div className="trip-lines">
        <div className="trip-line"><span><MapPin size={13} aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: '.3rem' }} />Location distance</span><strong>{miles}</strong></div>
        <div className="trip-line"><span><Clock3 size={13} aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: '.3rem' }} />Illustrative drive time</span><strong>{time}</strong></div>
      </div>
      <div className="button-row">
        <button className={selected ? 'primary-button' : 'secondary-button'} data-testid={`select-plan-${plan}`} onClick={onSelect} type="button" aria-pressed={selected}>
          {selected ? <><Check size={16} aria-hidden="true" /> Selected</> : <>Choose this plan <ArrowRight size={16} aria-hidden="true" /></>}
        </button>
      </div>
    </article>
  );
}

function Compare({ household, budget, selected, setSelected, onBack, onConfirm }: {
  household: number;
  budget: number;
  selected: StorePlan | null;
  setSelected: (plan: StorePlan) => void;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const chosenTotal = selected ? getBasketTotal(selected, household) : 0;
  const chosenFitsBudget = !!selected && chosenTotal <= budget;
  return (
    <>
      <section className="panel comparison-intro">
        <p className="eyebrow">The part worth deciding</p>
        <h1>Is the second stop worth {selected === 'save' ? 'it to you' : '11 extra minutes'}?</h1>
        <p>Both options cover the same full week of 21 meals for {household} {household === 1 ? 'person' : 'people'}. The six-person lower-cost basket is {money(FAMILY_OF_SIX_BASKET)}; the numbers are sample estimates for Kroger and Aldi—not live pricing or navigation.</p>
      </section>
      <div className="compare-grid">
        <OptionCard plan="usual" household={household} budget={budget} selected={selected === 'usual'} onSelect={() => setSelected('usual')} />
        <OptionCard plan="save" household={household} budget={budget} selected={selected === 'save'} onSelect={() => setSelected('save')} />
      </div>
      <section className="panel" style={{ padding: '1rem', marginTop: '.9rem' }}>
        <div style={{ display: 'flex', gap: '.7rem', alignItems: 'flex-start' }}>
          <CircleDollarSign size={20} aria-hidden="true" color="hsl(157 39% 31%)" />
          <div>
            <strong style={{ fontSize: '.84rem' }}>Your {money(budget)} all-meals weekly target</strong>
            <p className="helper" style={{ marginTop: '.25rem' }} aria-live="polite">{selected ? chosenFitsBudget ? `${money(chosenTotal)} sample basket selected · ${money(budget - chosenTotal)} left before target.` : `${money(chosenTotal)} sample basket selected · ${money(chosenTotal - budget)} over target. Raise the budget or edit your week before confirming.` : 'Choose exactly one plan to see how it lands against your target.'}</p>
          </div>
        </div>
      </section>
      <div className="button-row">
        <button className="secondary-button" data-testid="back-to-plan-button" onClick={onBack} type="button"><ArrowLeft size={16} aria-hidden="true" /> Back to meal plan</button>
        <button className="primary-button" data-testid="confirm-plan-button" disabled={!selected || !chosenFitsBudget} onClick={onConfirm} type="button">{selected && !chosenFitsBudget ? 'Over budget' : `Confirm ${selected ? (selected === 'save' ? 'split shop' : 'Kroger shop') : 'a plan'}`} <Check size={16} aria-hidden="true" /></button>
      </div>
      <p className="fine-print">All prices, store names, distances, and travel times are illustrative demo data for this prototype.</p>
    </>
  );
}

function Confirmation({ household, budget, selected, onCompare, onReset }: { household: number; budget: number; selected: StorePlan; onCompare: () => void; onReset: () => void }) {
  const isSave = selected === 'save';
  const total = getBasketTotal(selected, household);
  return (
    <>
      <div className="confirm-layout">
        <section className="panel confirmation-card">
          <span className="confirm-kicker">Week set · sample plan</span>
          <h1>{isSave ? 'The extra stop earns its keep.' : 'A simpler shop for this week.'}</h1>
          <p>Your {isSave ? 'Kroger + Aldi split' : 'Kroger-only shop'} is set for {household} {household === 1 ? 'person' : 'people'}. You have a full seven-day plan covering breakfast, lunch, and dinner, plus one consolidated list.</p>
          <div className="button-row">
            <button className="secondary-button" data-testid="change-plan-button" onClick={onCompare} type="button">Change store plan</button>
          </div>
        </section>
        <section className="panel chosen-summary" aria-labelledby="chosen-heading">
          <h2 id="chosen-heading">Your chosen plan</h2>
          <div className="summary-line"><span>All 21 meals</span><strong data-testid="confirmed-total">{money(total)} sample total</strong></div>
          <div className="summary-line"><span>Stops</span><strong>{isSave ? 'Kroger + Aldi' : 'Kroger'}</strong></div>
          <div className="summary-line"><span>Travel</span><strong>{isSave ? '3.4 mi · 18 min sample' : '1.2 mi · 7 min sample'}</strong></div>
          <div className="summary-line"><span>Target</span><strong>{money(budget)} weekly</strong></div>
          <p className="fine-print">Keep this screen handy with the full meal plan and grocery list. Totals are illustrative, not live.</p>
        </section>
      </div>
      <section className="panel" style={{ marginTop: '1rem', padding: '1.1rem' }}>
        <div style={{ display: 'flex', gap: '.7rem', alignItems: 'flex-start' }}><ShoppingBasket size={20} aria-hidden="true" color="hsl(157 39% 31%)" /><div><strong style={{ fontSize: '.85rem' }}>The week at a glance</strong><p className="helper">21 meals · {groceryItems.length} grocery items · {isSave ? `save the sample ${money(getSavings(household))}` : 'skip the extra stop'}.</p></div></div>
      </section>
      <div className="button-row">
        <button className="text-button" data-testid="start-over-button" onClick={onReset} type="button"><RotateCcw size={14} aria-hidden="true" /> Start over</button>
      </div>
    </>
  );
}

function Home() {
  const [step, setStep] = useState<Step>('setup');
  const [household, setHousehold] = useState(6);
  const [budget, setBudget] = useState(150);
  const [selected, setSelected] = useState<StorePlan | null>(null);

  const reset = () => { setStep('setup'); setSelected(null); };
  const updateHousehold = (value: number) => { setHousehold(value); setSelected(null); };
  const updateBudget = (value: number) => { setBudget(value); setSelected(null); };
  return (
    <Shell step={step}>
      {step === 'setup' && <Setup household={household} budget={budget} setHousehold={updateHousehold} setBudget={updateBudget} onContinue={() => setStep('plan')} />}
      {step === 'plan' && <Plan household={household} budget={budget} onBack={() => setStep('setup')} onContinue={() => setStep('compare')} />}
      {step === 'compare' && <Compare household={household} budget={budget} selected={selected} setSelected={setSelected} onBack={() => setStep('plan')} onConfirm={() => setStep('confirmed')} />}
      {step === 'confirmed' && selected && <Confirmation household={household} budget={budget} selected={selected} onCompare={() => setStep('compare')} onReset={reset} />}
    </Shell>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;