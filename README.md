# BendBites ☘️

BendBites is a meal-planning prototype for families in South Bend that shows a weekly meal plan, an illustrative grocery list, and how estimated costs compare with their grocery budget.

## First Working Slice

Users enter household size, weekly budget, and optional dietary preferences. The prototype displays breakfast, lunch, and dinner for seven days, scales ingredient quantities, and combines ingredients into a grocery list.

Users can check off groceries, view optional cooking instructions, and compare two illustrative store plans. The app identifies whether each basket fits the budget and prevents confirmation of an over-budget plan.

## Open the Prototype

https://family-grocery-planner.replit.app

Enter your household size and weekly budget, select any dietary preferences, and continue through the meal plan and store comparison.

## AI Role and Prototype Status

The future AI system is intended to create affordable meal plans based on household size, budget, dietary preferences, and available ingredients, suggesting cheaper alternatives when necessary.

The current prototype does not call a live AI model. It demonstrates the intended recommendation experience using a fixed weekly menu, hard-coded sample data, and frontend rules.

Working behavior includes household quantity scaling, dietary substitutions, grocery-list interactions, expandable cooking instructions, cost calculations, and budget checks.

Meal generation and budget optimization are simulated: the app does not invent meals or change the menu to fit a budget. Grocery prices, store comparisons, distances, and travel times are illustrative rather than live data. Cooking instructions use a shared three-step template.

Replit AI assisted with development; this is separate from AI functionality inside the product.

## Three Test Cases

Tests were conducted on October 13, 2026.

| Test | Input or action | What happened | Result |
|---|---|---|---|
| Typical case | Family of 4; $100 weekly budget | Completed the flow and received a weekly plan with a $53.04 sample grocery total for Kroger + Aldi, below budget. | Pass for prototype flow |
| Challenge case | Family of 6; $200 weekly budget; gluten-free and vegetarian selected | Completed the flow with both preferences selected. The displayed sample grocery total was $88.95 for Kroger, below budget. Dietary compliance was verified but actual prices were not. | Pass for prototype flow |
| Invalid-input attempt and low-budget edge case | Family of 4; attempted $0, then entered $1 | The input control prevented entering zero without displaying an error message. At $1, the app flagged the cheaper basket as $52.04 over budget and the single-store basket as $58.44 over budget. Over-budget confirmation is blocked by the app’s logic. | Partial: zero was prevented and the shortfall was clear, but input guidance could improve |

These tests evaluate the user-facing prototype. They do not validate actual grocery prices, nutritional adequacy, or every dietary substitution.

## Known Limitations

1. **No live AI or budget optimization.** The menu is fixed and dietary preferences apply rule-based substitutions. Future work will generate and validate alternative menus that fit the user’s budget.

2. **Illustrative costs and store data.** Prices and travel values are hard-coded samples. The single-store option adds a fixed convenience premium rather than comparing actual item prices. Future work will validate full-package costs and use current store data.

3. **Limited cooking instructions and validation.** Recipes share a generic three-step template. Future work will add meal-specific instructions, verify portions and dietary substitutions, and provide clearer guidance for unsupported inputs.

## Implementation References

- `artifacts/family-grocery/src/App.tsx`: meal data, sample prices, dietary substitutions, quantity scaling, grocery totals, recipe template, and store/travel estimates.
- `artifacts/api-server/src/routes/index.ts` and `artifacts/api-server/src/routes/health.ts`: API routing currently supports a health check; there are no AI meal-generation, live pricing, or location endpoints.
