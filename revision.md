# BendBites- Prototype Revision and Evaluation

## Product and Intended User:
BendBites helps households plan seven days of breakfast, lunch, and dinner around a low-cost grocery budget. Users can review recipes, include dietary restrictions and preferences (gluten free, vegetarian, or vegan), account for ingredients already at home, compare estimated shopping costs, and decide whether an additional store stop is worthwhile. 

## Priority Improvements:
I focused on two main improvements based on peer feedback and my own testing.
1. Make checkout estimates reflect what users need to purchase. The app now separates "Needed for the week," "Already have", and "Buy at store". It subtracts pantry quantities before rounding remaining needs to sample package sizes. Apple and bananas also support approximate conversions from pieces to pounds (as most people count their fruit in pieces, but grocery stores use pounds).
2. Offer an extra-low cost week budget. Users can preview a curated alternative menu adhering to their dietary restrictions, see which meals change, and compare estimated checkout costs using the same household, pantry quantities, and store options.
3. I also explored a layout revision in response to feedback about the abundance of text and scrolling. However, while I appreciated the feedback, I decided to keep the current layout and prioritized the two improvements above.

## Response to Peer Feedback: 
| Feedback or Observed Issue | Decision | What Changed or Why it was Deferred |
| --- | --- | --- |
| The original estimate priced quantities used in recipes, including fractional eggs and cans. This could understate the checkout cost. | Acted on | Checkout estimates now use sample purchasable quantities after subtracting pantry supplies. | 
| The meals stayed the same when the budget changed, and editing the week did not offer a cheaper plan. | Acted on | Added an extra-low cost weekly plan with a preview of meal replacements, checkout savings, and the remaining budget gap. |
| Vegetarian substitutions produced awkward recipe names and instructions. | Partly addressed | The alternative week uses curated recipes. A complete review of vegetarian ingredients, names, and instructions remains a priority. |
| The results contained too much text and required substantial scrolling. | Deferred | Explored a layout edit and retained the current layout for now, prioritizing calculations and lower-cost meal options. | 

My own product judgement also shaped the revisions. I wanted to preserve weekly ingredient quantities because shoppers may already have food at home. I therefore combined package pricing with user-editable pantry quantities. I also produced conversions so users could enter familiar quantities such as two bananas rather than having to guess how many ounces of bananas they have. 

## Evaluation Approach:
I tested five distinct situations using sample household information. The two typical cases focus on common shopping tasks: using already owned pantry supplies and entering produce by count. The tight and very tight budgets serve as challenge and risk cases.
The success criteria below describe the behavior evaluated. Pass ratings apply to the observed behavior in each row. Prices, package sizes, product weights, stores, and driving times are illustrative. 

## Five Test Cases:
| Case | Input or Action | Expected Results/ Success Criterion | Actual Result | Pass, Partial, or Fail | Implication or next step | 
| --- | --- | --- | --- | --- | --- |
| Typical 1: Pantry staples/ pre-owned ingredients | In the three person plan, entered 1 lb of oats against a requirement of 0.82 lb. Separately entered 6 eggs against a 13.5 egg requirement. | Should subtract pantry quantities before calculating purchases. Fully covered ingredients should require no purchase and have a note saying requirement fulfilled. | Oats became "Already covered". Entering 6 eggs reduced the purchase from two dozen eggs to one dozen. | Pass | The displayed purchase quantities respond to pantry supplies. Additional tests should check other package sizes and pantry quantities. |
| Typical 2: Produce by count | Enter 2 bananas against a weekly requirement of 0.6 lb. | Convert pieces to approximate weight and show a whole-piece purchase quantity. | The app estimated 2 bananas as 0.52 lb and recommended buying 1 banana, about 0.3 lb. With the pantry blank, it recommended 3 bananas, about 0.8 lb. | Pass | The conversion makes the shopping list easier to interpret. Actual produce weight and cost will vary. | 
| Challenge: Extra-low cost week | Use 6 people, a $60 budget, and a vegetarian preference. Compare standard and extra-low cost menus using the same pantry quantities and split-store options. | Show actual meal changes, calculate the checkout difference, and display any remaining budget gap. | The standard budget menu was $99.22. The extra-low cost menu was $71.82, saving $27.40. It remained $11.82 over budget. The preview listed 21 meal changes. | Pass (for comparison and gap reporting) | The alternative reduced the estimate while showing that the target was still unmet. | 
| Invalid or null input: Missing budget | Leave the budget blank and attempt to generate a plan. | Prevent generation of a plan and explain what information is needed to proceed to plan. | The app prevented generation and displayed an error message reading " Enter your weekly budget to continue. Your other details are still saved." | Pass for blocking and generating corrective messaging | The app gives a clear next action. The message reports that other details are retained. | 
| Risk: Understated checkout cost | Use 3 people, a $40 budget, no dietary restrictions, and blank/no inputs in the pantry fields. Then enter enough eggs to cover the full weekly egg requirement. | Use purchase quantities for checkout estimates, show the budget gap, and remove the egg purchase when fully covered. | With pantry fields blank, the Kroger-only shop option was $71.79 and the split shop option was $72.61. With enough eggs at home, the totals became $65.79 and $66.61, respectively. Both estimates fell by $6.00 and remained above $40. | Pass or observed totals and budget comparison | Pantry supplies reduce the cash needed for the grocery trip. This case demonstrates why both package quantities and pantry inputs matter. |

## Before and After Comparison: 
I repeated the 3 person, $40 budget, no dietary restriction cases with pantry fields left blank.
| Measure | Earlier Prototype | Revised Prototype |
| --- | --- | --- |
| Kroger-only estimate | $44.58 | $71.79 |
| Split-store estimate | $39.78 | $72.61 |
| Split-store extra budget status | $0.22 under budget | $32.61 over budget | 
| Eggs | Listed 13.5 eggs with a proportional ingredient cost | Show 13.5 eggs needed and two dozen to purchase |
| Pantry Adjustments | No separate quantity entry in the earlier list | Users can enter what they have and recalculate purchases | 

The revision changed the affordability decision. The earlier version suggested that the split-store basket fit the $40 budget. The revised version showed both options exceeding the target when the pantry was empty. 
I also tested the revised pantry behavior. Having enough eggs to cover the weekly requirement reduced both store estimates by $6.00. Entering 6 eggs reduced the  purchase quantity from two dozen eggs to one dozen eggs.

## What the evidence tells me: 
The revised prototype better explains how weekly recipe needs translate into grocery purchases. Pantry inputs changed the displayed shopping quantities, and package pricing changes an apparently affordable basket into an over-budget basket. The extra-low cost menu reduced the 6 person split-store estimate by $27.40 while showing the remaining $11.82 gap. These obsservations support the value  of comparing meal  and shopping choices. The tests provide early evidence about the interface and sample calculations. Actual store prices, complete dietary suitabiity, nutritional adequacy, and broader usability reamin unverified. I would next check calculation consistency, review the complete recipes, and ask another person to try the revised flow. 

## Concrete Risk and Response:
A household with limited grocery funds could rely on an understated estimate and discover that the required purchases exceed their budget. I responded by subtracting pantry quantities and using sample package sizes to calculate remaining purchases for ease of use but also to reduce food waste and incurred grocery cost. The app also displays how far each estimate is above or below the target.
The 3 person, $40 test assessed this response. The split-store estimate changed from $39.78 in the earlier prototype to $72.61 with the revised purchase calculation and an empty pantry. Providing enough eggs at home reduced the revised estimate to $66.61.
This response connects to the course theme of cautioning against over-reliance on AI tools. The purchasing assumptions and budget gap help users assess the recommendation before choosing a plan; however, actual prices and produce weights remain uncertain, and the interface labels its figures as sample estimates.

## AI role and implementation status
The intended AI task is to suggest lower cost meals using household size, dietary preferences, budget, and pantry information. Its intended output is a revised meal plan with understandable replacements and a checkout comparison.
The current alternative menu is curated and labeled “Simulated AI Suggestion.” The interface lets users preview the meal changes and compare their estimated cost. Pantry subtraction, package rounding, and budget comparisons are implemented calculations.
These tests evaluate the usefulness and clarity of the simulated experience and its displayed calculations. Live generative-model performance remains untested and store pricing is illustrative.

## Remaining limitations
- Prices, package sizes, produce weights, locations, and driving times are illustrative.
- The curated menus provide limited flexibility across preferences and budgets.
- Very very low budgets can exceed the cost of every available plan.
- Complete nutritional adequacy has not been established.
- The revised layout still requires scrolling.
- Confirmation behavior and broader usability need further testing.

## Next priorities
1. Check checkout calculations, displayed differences, and store comparisons across more pantry quantities and package sizes.
2. Review the complete vegetarian recipes and expand the affordable menu choices.
3. Have another person complete the revised flow and use their observations to guide layout and instruction changes.
