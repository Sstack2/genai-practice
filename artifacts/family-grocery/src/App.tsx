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

const meals = [
  { day: 'Mon', name: 'Lemon chicken & roasted broccoli', description: 'Sheet-pan chicken, potatoes, broccoli, and a bright lemon finish.', cost: 18.6 },
  { day: 'Tue', name: 'Black bean taco bowls', description: 'Brown rice, seasoned beans, corn, avocado, and crunchy cabbage.', cost: 15.9 },
  { day: 'Wed', name: 'Turkey meatballs with marinara', description: 'Tender meatballs over spaghetti with a simple side salad.', cost: 22.4 },
  { day: 'Thu', name: 'Ginger veggie fried rice', description: 'Eggs, frozen vegetables, edamame, and leftover-friendly rice.', cost: 13.8 },
  { day: 'Fri', name: 'Salmon, couscous & cucumber salad', description: 'Roasted salmon with herbs, couscous, and a cool yogurt dressing.', cost: 24.2 },
];

const groceryItems = [
  { item: 'Chicken breasts', quantity: '2.2 lb', price: 11.4 },
  { item: 'Salmon fillets', quantity: '1.5 lb', price: 17.9 },
  { item: 'Ground turkey', quantity: '1.5 lb', price: 9.6 },
  { item: 'Black beans', quantity: '3 cans', price: 3.3 },
  { item: 'Eggs', quantity: '1 dozen', price: 4.1 },
  { item: 'Brown rice', quantity: '2 lb bag', price: 3.8 },
  { item: 'Spaghetti', quantity: '1 box', price: 2.1 },
  { item: 'Couscous', quantity: '1 box', price: 2.8 },
  { item: 'Broccoli & cabbage', quantity: '2 heads', price: 5.7 },
  { item: 'Frozen vegetables', quantity: '1 bag', price: 2.6 },
  { item: 'Potatoes', quantity: '3 lb bag', price: 4.2 },
  { item: 'Avocado & cucumber', quantity: '4 items', price: 5.4 },
  { item: 'Pantry extras', quantity: 'lemon, herbs, yogurt', price: 7.9 },
];

const money = (value: number) => `$${value.toFixed(2)}`;
const wholeMoney = (value: number) => `$${Math.round(value)}`;
const scaledQuantity = (quantity: string, scale: number) => {
  const match = quantity.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
  if (!match) return quantity;
  const base = Number(match[1]);
  const unit = match[2];
  const scaled = base * scale;
  const rounded = unit.includes('lb') ? Math.max(0.5, Math.round(scaled * 10) / 10) : Math.max(1, Math.ceil(scaled));
  return `${rounded} ${unit}`;
};

function Progress({ step }: { step: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: 'setup', label: 'Your week' },
    { id: 'plan', label: 'Dinner plan' },
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
          <div className="brand-mark"><span className="brand-dot">GT</span> Good Table</div>
          <p className="rail-copy">A small plan for the real week ahead: five dinners, one grocery run, no guesswork.</p>
          <div className="rail-note">Sample mode<br />Prices, places, and travel times are illustrative demo data.</div>
        </aside>
        <main className="main-area">
          <header className="topbar">
            <div className="mobile-brand"><span className="brand-dot">GT</span> Good Table</div>
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
      <h1 className="page-title">Good dinners, without the budget drift.</h1>
      <p className="page-intro">Tell us who is eating and what you want to spend. We’ll shape five practical dinners, then lay out the tradeoff between one easy stop and a money-saving second stop.</p>
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
          <label className="field-label" htmlFor="budget-input">Weekly dinner budget</label>
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
          <p className="helper">A weekly target for the groceries behind these five dinners, not a live store quote.</p>
          <div className="button-row">
            <button className="primary-button" data-testid="build-plan-button" onClick={onContinue} type="button">
              Build my dinner plan <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </section>
        <aside className="panel snapshot-card" aria-label="Plan preview">
          <span className="snapshot-label">Your starting point</span>
          <div className="snapshot-number">{household} × 5</div>
          <div className="snapshot-detail">dinners for {household === 1 ? 'one person' : `${household} people`} with an illustrative {wholeMoney(budget)} weekly target.</div>
          <div className="button-row">
            <span className="snapshot-detail">Good Table keeps the maths visible as you decide.</span>
          </div>
        </aside>
      </div>
      <p className="fine-print">Good Table is a planning prototype. It does not use location services, live pricing, accounts, or checkout.</p>
    </>
  );
}

function Plan({ household, budget, onBack, onContinue }: { household: number; budget: number; onBack: () => void; onContinue: () => void }) {
  const scale = household / 4;
  const list = useMemo(() => groceryItems.map((item) => ({ ...item, quantity: scaledQuantity(item.quantity, scale), price: item.price * scale })), [scale]);
  const listTotal = list.reduce((sum, item) => sum + item.price, 0);
  const plannedCost = 94.9 * scale;
  const budgetRoom = budget - 129 * scale;
  return (
    <>
      <div className="plan-header">
        <div>
          <p className="eyebrow">A week with a little structure</p>
          <h1>Five dinners, one useful list.</h1>
        </div>
        <div className="budget-readout">WEEKLY TARGET<strong data-testid="weekly-budget-value">{money(budget)}</strong></div>
      </div>
      <p className="page-intro" style={{ marginTop: 0 }}>Familiar ingredients do double duty here, so Friday’s leftovers can make Thursday easier. Quantities and sample prices are scaled for {household} {household === 1 ? 'person' : 'people'}.</p>
      <div className="plan-grid" style={{ marginTop: '1.4rem' }}>
        <section aria-labelledby="meals-heading">
          <div className="panel list-card">
            <div className="list-head">
              <h2 id="meals-heading">The dinner plan</h2>
              <span>5 nights · sample</span>
            </div>
            <div className="meal-grid" style={{ marginTop: '.65rem' }}>
              {meals.map((meal) => (
                <article className="panel meal-row" key={meal.day}>
                  <span className="day-tag">{meal.day}</span>
                  <div><h3 className="meal-name">{meal.name}</h3><p className="meal-desc">{meal.description}</p></div>
                  <span className="meal-cost">{money(meal.cost * scale)}</span>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="panel list-card" aria-labelledby="grocery-heading">
          <div className="list-head">
            <h2 id="grocery-heading">Consolidated grocery list</h2>
            <span>{groceryItems.length} items</span>
          </div>
          <ul className="grocery-list">
            {list.map((item) => <li className="grocery-item" key={item.item}><span>{item.item}</span><span>{item.quantity} · {money(item.price)}</span></li>)}
          </ul>
          <div className="summary-line" style={{ marginTop: '1rem' }}><span>Illustrative list subtotal</span><strong data-testid="grocery-total">{money(listTotal)}</strong></div>
          <p className="helper">Pantry basics are included as a small sample allowance. Store totals may vary.</p>
        </section>
      </div>
      <section className="panel comparison-intro" style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-start' }}><ListChecks size={19} aria-hidden="true" color="hsl(157 39% 31%)" /><div><strong style={{ fontSize: '.84rem' }}>A quick budget check</strong><p style={{ marginTop: '.25rem' }}>{budgetRoom >= 0 ? `${money(Math.abs(budgetRoom))} stays available after the sample two-store basket.` : `${money(Math.abs(budgetRoom))} over target with the sample two-store basket. Adjust the target or household size if needed.`}</p></div></div>
      </section>
      <div className="button-row">
        <button className="secondary-button" data-testid="back-to-setup-button" onClick={onBack} type="button"><ArrowLeft size={16} aria-hidden="true" /> Edit week</button>
        <button className="primary-button" data-testid="compare-stores-button" onClick={onContinue} type="button">Compare store plans <ArrowRight size={16} aria-hidden="true" /></button>
      </div>
      <p className="fine-print">The dinner costs above are recipe-level illustrations. Store comparison totals below represent the full sample basket needed for the week.</p>
    </>
  );
}

function OptionCard({ plan, household, selected, onSelect }: { plan: StorePlan; household: number; selected: boolean; onSelect: () => void }) {
  const scale = household / 4;
  const isSave = plan === 'save';
  const total = (isSave ? 124.8 : 147.2) * scale;
  const miles = isSave ? '3.4 mi' : '1.2 mi';
  const time = isSave ? '18 min' : '7 min';
  return (
    <article className={`panel option-card ${isSave ? 'is-recommended' : ''}`} aria-label={`${isSave ? 'Two-store savings' : 'Single-store convenience'} option`}>
      {isSave && <span className="recommend-tag">Save $22.40 sample</span>}
      <div className="option-title">
        <div>
          <h3>{isSave ? 'Split the shop' : 'Keep it simple'}</h3>
          <p>{isSave ? 'Kroger + Aldi' : 'Kroger only'} · sample locations</p>
        </div>
        <div className="option-total" data-testid={`compare-total-${plan}`}>{money(total)}<small>estimated basket</small></div>
      </div>
      <div className="metric-stack">
        <div><span className="metric-label">Store stops</span><span className="metric-value">{isSave ? '2' : '1'}</span></div>
        <div><span className="metric-label">Weekly saving</span><span className="metric-value">{isSave ? money(22.4 * scale) : '—'}</span></div>
        <div><span className="metric-label">Extra driving</span><span className="metric-value">{isSave ? '+11 min' : '—'}</span></div>
      </div>
      <p className="option-note">{isSave ? 'Aldi covers pantry staples and produce at a lower sample price; Kroger fills the remaining items.' : 'One familiar stop, one list, and fewer minutes in the car. The premium is the convenience.'}</p>
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
  const scale = household / 4;
  const chosenTotal = selected === 'save' ? 124.8 * scale : selected === 'usual' ? 147.2 * scale : 0;
  return (
    <>
      <section className="panel comparison-intro">
        <p className="eyebrow">The part worth deciding</p>
        <h1>Is the second stop worth {selected === 'save' ? 'it to you' : '11 extra minutes'}?</h1>
        <p>Both options cover the same five-dinner list for {household} {household === 1 ? 'person' : 'people'}. The numbers are sample estimates for a Kroger near home (1.2 mi) and an Aldi farther out (3.4 mi)—not live pricing or navigation.</p>
      </section>
      <div className="compare-grid">
        <OptionCard plan="usual" household={household} selected={selected === 'usual'} onSelect={() => setSelected('usual')} />
        <OptionCard plan="save" household={household} selected={selected === 'save'} onSelect={() => setSelected('save')} />
      </div>
      <section className="panel" style={{ padding: '1rem', marginTop: '.9rem' }}>
        <div style={{ display: 'flex', gap: '.7rem', alignItems: 'flex-start' }}>
          <CircleDollarSign size={20} aria-hidden="true" color="hsl(157 39% 31%)" />
          <div>
            <strong style={{ fontSize: '.84rem' }}>Your {money(budget)} weekly target</strong>
            <p className="helper" style={{ marginTop: '.25rem' }}>{selected ? `${money(chosenTotal)} sample basket selected · ${money(Math.max(0, budget - chosenTotal))} left before target.` : 'Choose exactly one plan to see how it lands against your target.'}</p>
          </div>
        </div>
      </section>
      <div className="button-row">
        <button className="secondary-button" data-testid="back-to-plan-button" onClick={onBack} type="button"><ArrowLeft size={16} aria-hidden="true" /> Back to dinners</button>
        <button className="primary-button" data-testid="confirm-plan-button" disabled={!selected} onClick={onConfirm} type="button">Confirm {selected ? (selected === 'save' ? 'split shop' : 'Kroger shop') : 'a plan'} <Check size={16} aria-hidden="true" /></button>
      </div>
      <p className="fine-print">All prices, store names, distances, and travel times are illustrative demo data for this prototype.</p>
    </>
  );
}

function Confirmation({ household, budget, selected, onCompare, onReset }: { household: number; budget: number; selected: StorePlan; onCompare: () => void; onReset: () => void }) {
  const isSave = selected === 'save';
  const total = (isSave ? 124.8 : 147.2) * (household / 4);
  return (
    <>
      <div className="confirm-layout">
        <section className="panel confirmation-card">
          <span className="confirm-kicker">Week set · sample plan</span>
          <h1>{isSave ? 'The extra stop earns its keep.' : 'A simpler shop for this week.'}</h1>
          <p>Your {isSave ? 'Kroger + Aldi split' : 'Kroger-only shop'} is set for {household} {household === 1 ? 'person' : 'people'}. You have a clear five-dinner plan and one consolidated list to take with you.</p>
          <div className="button-row">
            <button className="secondary-button" data-testid="change-plan-button" onClick={onCompare} type="button">Change store plan</button>
          </div>
        </section>
        <section className="panel chosen-summary" aria-labelledby="chosen-heading">
          <h2 id="chosen-heading">Your chosen plan</h2>
          <div className="summary-line"><span>Groceries</span><strong data-testid="confirmed-total">{money(total)} sample total</strong></div>
          <div className="summary-line"><span>Stops</span><strong>{isSave ? 'Kroger + Aldi' : 'Kroger'}</strong></div>
          <div className="summary-line"><span>Travel</span><strong>{isSave ? '3.4 mi · 18 min sample' : '1.2 mi · 7 min sample'}</strong></div>
          <div className="summary-line"><span>Target</span><strong>{money(budget)} weekly</strong></div>
          <p className="fine-print">Keep this screen handy with the dinner plan and grocery list above. Totals are illustrative, not live.</p>
        </section>
      </div>
      <section className="panel" style={{ marginTop: '1rem', padding: '1.1rem' }}>
        <div style={{ display: 'flex', gap: '.7rem', alignItems: 'flex-start' }}><ShoppingBasket size={20} aria-hidden="true" color="hsl(157 39% 31%)" /><div><strong style={{ fontSize: '.85rem' }}>The week at a glance</strong><p className="helper">Five dinners · {groceryItems.length} grocery items · {isSave ? 'save the sample $22.40' : 'skip the extra stop'}.</p></div></div>
      </section>
      <div className="button-row">
        <button className="text-button" data-testid="start-over-button" onClick={onReset} type="button"><RotateCcw size={14} aria-hidden="true" /> Start over</button>
      </div>
    </>
  );
}

function Home() {
  const [step, setStep] = useState<Step>('setup');
  const [household, setHousehold] = useState(4);
  const [budget, setBudget] = useState(150);
  const [selected, setSelected] = useState<StorePlan | null>(null);

  const reset = () => { setStep('setup'); setSelected(null); };
  return (
    <Shell step={step}>
      {step === 'setup' && <Setup household={household} budget={budget} setHousehold={setHousehold} setBudget={setBudget} onContinue={() => setStep('plan')} />}
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