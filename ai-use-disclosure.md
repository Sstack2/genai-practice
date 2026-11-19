# AI-use Disclosure

## Tools Used: 
I used ChatGPT-6.1 Sol Light and the Replit Agent.

## Development assistance
ChatGPT helped with the design of prompts so that it could incorporate everything that I wanted to change in a concise way so that Replit would read the prompt and generate the design I intended.

## Representative prompts and revisions

### 1. Accounting for ingredients already at home

My prompt excerpt:

“...The reason why it shows how much of each you will need for the week is because I wanted to accommodate for what people already had at home so they wouldn't buy it again. Is there a way to integrate that into my first prompt?”
ChatGPT suggested keeping weekly recipe quantities visible, adding an “Already have” field, subtracting pantry supplies, and rounding the remaining needs to purchasable package sizes. I used this approach in the Replit development prompt.

After reviewing the result, I identified another usability issue. People often count apples and bananas by pieces, while the app used pounds for pricing. I requested approximate piece to pound conversions so users could enter what they had at home and see how many additional pieces, not pounds, to buy.

### 2. Offering a lower-cost meal plan

My prompt excerpt:

“...The whole idea of the app is to be on a budget. Maybe there could be an extra low cost meal option?”
ChatGPT suggested an “Extra-low cost week” using curated recipes that share affordable ingredients. The suggestion included a preview of meal changes, a comparison using the same pantry quantities and store option, and a visible remaining budget gap.

I used this suggestion in Replit and clarified that the app should show the amount still over budget when its available plans could not meet the target instead of hallucinating low prices. The 6 person, $60 test helped me evaluate this behavior.

## Human judgment

I substantially adapted the initial package pricing approach to preserve my original goal of helping shoppers use food that they already have at home. I decided that users needed to see weekly recipe requirements, enter pantry quantities, and view the remaining purchases needed.
I also requested produce conversions after noticing that entering pounds of bananas or apples would be inconvenient and highly likely to result in over or under purchasing for many users. These decisions came from considering how someone would use the app in their kitchen and while shopping.
For the extra-low cost option, I accepted that some extreme budgets would remain unmet. I wanted the app to offer a cheaper plan and clearly report the remaining gap.

## Verification

I reviewed the generated prompts and edited them when they did not fully reflect my intended experience. I then manually tested the revised prototype and captured screenshots.

My checks included:

- Entering 1 lb of oats against a weekly requirement of 0.82 lb, which changed the purchase status to “Already covered.”
- Entering 6 eggs against a requirement of 13.5 eggs, which reduced the purchase quantity from two dozen to one dozen.
- Entering enough eggs to cover the weekly requirement, which reduced both store estimates by $6.00.
- Entering 2 bananas and checking the displayed conversion and remaining purchase quantity.
- Comparing the 6 person standard and extra-low-cost menus. The split-store estimate decreased from $99.22 to $71.82, with the remaining $11.82 budget gap displayed.
- Leaving the budget blank, which prevented plan generation and displayed a corrective message.

The approximate apple and banana weights still need verification against a documented source and a clear size assumption as produce weight varies. Sample prices and package sizes also need checking against actual store information. Complete recipe suitability, nutritional adequacy, and broader usability require further evaluation.

## AI inside the product

The intended AI task is to suggest affordable meals using household size, budget, dietary preferences, and pantry information. Its intended output is a revised weekly menu with meal replacements, estimated shopping costs, and an explanation of the budget difference.
The current prototype demonstrates this behavior through a curated alternative menu labeled “Simulated AI Suggestion.” Pantry subtraction, produce conversions, package rounding, and checkout comparisons are implemented calculations.
Prices, package sizes, produce weights, and driving times are illustrative. My tests evaluated the simulated experience and displayed calculations. Live generative-model performance remains untested.
