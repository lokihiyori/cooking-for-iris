const DEFAULT_DISHES = [
  {
    id: 1,
    name: "Creamy Pasta Carbonara",
    photo: "images/carbonara.webp",
    emoji: "🍝",
    category: "Pasta",
    description: "Rich and creamy Italian classic with crispy bacon, parmesan, and a silky egg sauce.",
    cookTime: "25 mins",
    ingredients: [
      "400g spaghetti",
      "200g bacon or pancetta",
      "4 egg yolks",
      "100g parmesan cheese, grated",
      "2 cloves garlic",
      "Salt & black pepper",
      "2 tbsp olive oil",
      "Fresh parsley for garnish"
    ],
    recipe: [
      "Bring a large pot of salted water to boil and cook spaghetti until al dente",
      "While pasta cooks, cut bacon into small pieces and fry until golden and crispy",
      "Add minced garlic to the bacon and cook for 30 seconds",
      "In a bowl, whisk together egg yolks, grated parmesan, and black pepper",
      "Drain pasta, reserving 1 cup of pasta water",
      "Toss hot pasta with the bacon, then remove from heat",
      "Pour egg mixture over pasta and toss quickly — the residual heat will cook the eggs into a silky sauce",
      "Add pasta water a little at a time until you reach desired creaminess",
      "Serve immediately with extra parmesan and parsley"
    ]
  },
  {
    id: 2,
    name: "Chicken Teriyaki Bowl",
    photo: "images/teriyaki.webp",
    emoji: "🍗",
    category: "Main Course",
    description: "Juicy glazed chicken thighs over fluffy rice with steamed veggies and sesame seeds.",
    cookTime: "35 mins",
    ingredients: [
      "500g chicken thighs, boneless",
      "4 tbsp soy sauce",
      "2 tbsp mirin",
      "2 tbsp honey",
      "1 tbsp rice vinegar",
      "1 clove garlic, minced",
      "1 tsp ginger, grated",
      "2 cups jasmine rice",
      "Steamed broccoli",
      "Sesame seeds",
      "Spring onions"
    ],
    recipe: [
      "Cook jasmine rice according to package instructions",
      "Mix soy sauce, mirin, honey, rice vinegar, garlic, and ginger to make the teriyaki sauce",
      "Season chicken thighs with salt and pepper",
      "Heat oil in a pan over medium-high heat and sear chicken skin-side down for 5 minutes",
      "Flip and cook for another 4 minutes",
      "Pour teriyaki sauce over chicken and simmer for 8-10 minutes until sauce thickens",
      "Steam broccoli until tender-crisp",
      "Slice chicken and serve over rice with broccoli",
      "Drizzle remaining sauce and top with sesame seeds and spring onions"
    ]
  },
  {
    id: 3,
    name: "Caesar Salad",
    photo: "images/caesar-salad.webp",
    emoji: "🥗",
    category: "Salads",
    description: "Crisp romaine lettuce, crunchy croutons, shaved parmesan, and creamy Caesar dressing.",
    cookTime: "15 mins",
    ingredients: [
      "2 heads romaine lettuce",
      "1 cup croutons",
      "50g parmesan, shaved",
      "2 anchovy fillets (optional)",
      "1 egg yolk",
      "2 tbsp lemon juice",
      "1 tsp Dijon mustard",
      "1 clove garlic, minced",
      "1/3 cup olive oil",
      "Salt & pepper"
    ],
    recipe: [
      "Wash and chop romaine lettuce into bite-sized pieces, pat dry",
      "For the dressing: blend anchovy, egg yolk, lemon juice, mustard, and garlic",
      "Slowly drizzle in olive oil while whisking to emulsify",
      "Season dressing with salt and pepper to taste",
      "Toss lettuce with dressing until evenly coated",
      "Top with croutons and shaved parmesan",
      "Serve immediately with extra lemon wedges"
    ]
  },
  {
    id: 4,
    name: "Hearty Beef Stew",
    photo: "images/beef-stew.webp",
    emoji: "🥘",
    category: "Main Course",
    description: "Tender chunks of beef slow-cooked with root vegetables in a rich, savory broth.",
    cookTime: "2 hours",
    ingredients: [
      "800g beef chuck, cubed",
      "4 potatoes, diced",
      "3 carrots, sliced",
      "2 celery stalks, chopped",
      "1 onion, diced",
      "3 cloves garlic, minced",
      "2 cups beef broth",
      "1 cup red wine (optional)",
      "2 tbsp tomato paste",
      "2 tbsp flour",
      "Fresh thyme & rosemary",
      "2 bay leaves",
      "Salt & pepper",
      "2 tbsp olive oil"
    ],
    recipe: [
      "Pat beef dry and season with salt, pepper, and flour",
      "Heat olive oil in a large Dutch oven and brown beef in batches — don't overcrowd",
      "Remove beef and sauté onion, celery, and garlic until softened",
      "Add tomato paste and cook for 1 minute",
      "Pour in red wine (if using) and scrape up browned bits from the bottom",
      "Return beef to the pot, add broth, herbs, and bay leaves",
      "Bring to a boil, then reduce to a gentle simmer",
      "After 1 hour, add potatoes and carrots",
      "Continue simmering for another 45-60 minutes until beef is fork-tender",
      "Remove bay leaves, adjust seasoning, and serve with crusty bread"
    ]
  },
  {
    id: 5,
    name: "Chocolate Lava Cake",
    emoji: "🍫",
    category: "Desserts",
    description: "Decadent individual chocolate cakes with a warm, molten center. Pure indulgence!",
    cookTime: "25 mins",
    ingredients: [
      "200g dark chocolate",
      "100g butter",
      "3 eggs",
      "3 egg yolks",
      "75g sugar",
      "30g flour",
      "Pinch of salt",
      "Butter & cocoa for ramekins",
      "Vanilla ice cream for serving",
      "Powdered sugar for dusting"
    ],
    recipe: [
      "Preheat oven to 220°C (425°F)",
      "Melt chocolate and butter together over a double boiler, stir until smooth",
      "In a separate bowl, whisk eggs, egg yolks, and sugar until thick and pale",
      "Fold the melted chocolate into the egg mixture",
      "Gently fold in flour and salt — do not overmix",
      "Butter and dust 4 ramekins with cocoa powder",
      "Divide batter evenly among ramekins",
      "Bake for exactly 12-14 minutes — edges should be set but center jiggly",
      "Let rest for 1 minute, then invert onto plates",
      "Dust with powdered sugar and serve immediately with vanilla ice cream"
    ]
  },
  {
    id: 6,
    name: "Garlic Butter Shrimp",
    emoji: "🦐",
    category: "Appetizers",
    description: "Succulent shrimp sautéed in a fragrant garlic butter sauce with a splash of white wine.",
    cookTime: "15 mins",
    ingredients: [
      "500g large shrimp, peeled & deveined",
      "4 tbsp butter",
      "5 cloves garlic, minced",
      "1/4 cup white wine",
      "2 tbsp lemon juice",
      "Red pepper flakes",
      "Fresh parsley, chopped",
      "Salt & pepper",
      "Crusty bread for serving"
    ],
    recipe: [
      "Pat shrimp dry and season with salt, pepper, and a pinch of red pepper flakes",
      "Melt butter in a large skillet over medium-high heat",
      "Add shrimp in a single layer and cook 2 minutes per side until pink",
      "Remove shrimp and add garlic to the pan, cook for 30 seconds",
      "Pour in white wine and lemon juice, let it simmer for 2 minutes",
      "Return shrimp to the pan and toss to coat in the sauce",
      "Garnish with fresh parsley",
      "Serve with crusty bread to soak up the amazing sauce"
    ]
  },
  {
    id: 7,
    name: "Mushroom Risotto",
    photo: "images/mushroom-risotto.webp",
    emoji: "🍄",
    category: "Main Course",
    description: "Luxuriously creamy Italian risotto with earthy mixed mushrooms and parmesan.",
    cookTime: "40 mins",
    ingredients: [
      "300g arborio rice",
      "300g mixed mushrooms, sliced",
      "1 onion, finely diced",
      "3 cloves garlic, minced",
      "1 cup white wine",
      "4 cups warm chicken broth",
      "50g butter",
      "60g parmesan, grated",
      "2 tbsp olive oil",
      "Fresh thyme",
      "Salt & pepper"
    ],
    recipe: [
      "Heat broth in a saucepan and keep it warm on low heat",
      "In a large pan, sauté mushrooms in olive oil until golden, then set aside",
      "In the same pan, melt half the butter and cook onion until translucent",
      "Add garlic and rice, stir for 2 minutes until rice is toasted",
      "Pour in white wine and stir until absorbed",
      "Add warm broth one ladle at a time, stirring frequently and waiting until each addition is absorbed",
      "Continue for about 18-20 minutes until rice is creamy and al dente",
      "Stir in mushrooms, remaining butter, and parmesan",
      "Season with salt, pepper, and fresh thyme",
      "Let rest for 2 minutes before serving"
    ]
  },
  {
    id: 8,
    name: "Strawberry Smoothie Bowl",
    emoji: "🍓",
    category: "Desserts",
    description: "A refreshing blend of frozen strawberries and banana topped with granola and fresh fruit.",
    cookTime: "10 mins",
    ingredients: [
      "2 cups frozen strawberries",
      "1 frozen banana",
      "1/2 cup Greek yogurt",
      "1/4 cup almond milk",
      "1 tbsp honey",
      "Granola for topping",
      "Fresh berries for topping",
      "Chia seeds",
      "Sliced almonds",
      "Coconut flakes"
    ],
    recipe: [
      "Blend frozen strawberries, banana, yogurt, almond milk, and honey until thick and smooth",
      "The consistency should be thicker than a regular smoothie — add less liquid if needed",
      "Pour into a bowl",
      "Arrange toppings beautifully: granola, fresh berries, chia seeds, almonds, and coconut",
      "Drizzle with a little extra honey if desired",
      "Serve immediately and enjoy!"
    ]
  },
  {
    id: 9,
    name: "Tom Yum Soup",
    emoji: "🍜",
    category: "Soups",
    description: "Aromatic Thai hot and sour soup with shrimp, mushrooms, and fragrant lemongrass.",
    cookTime: "30 mins",
    ingredients: [
      "300g shrimp",
      "200g mushrooms, halved",
      "4 cups chicken broth",
      "3 stalks lemongrass, smashed",
      "5 slices galangal",
      "4 kaffir lime leaves",
      "3 tbsp fish sauce",
      "2 tbsp lime juice",
      "2 Thai chilies, smashed",
      "1 can coconut milk (optional for creamy version)",
      "Cherry tomatoes",
      "Fresh cilantro"
    ],
    recipe: [
      "Bring chicken broth to a boil in a pot",
      "Add lemongrass, galangal, and kaffir lime leaves — simmer for 5 minutes",
      "Add mushrooms and tomatoes, cook for 3 minutes",
      "Add shrimp and cook until they turn pink (about 3 minutes)",
      "For creamy version, stir in coconut milk",
      "Season with fish sauce, lime juice, and chilies",
      "Taste and adjust — should be a balance of sour, salty, and spicy",
      "Garnish with fresh cilantro and serve hot"
    ]
  },
  {
    id: 10,
    name: "Bruschetta",
    emoji: "🍞",
    category: "Appetizers",
    description: "Toasted ciabatta topped with fresh tomatoes, basil, garlic, and a drizzle of balsamic.",
    cookTime: "15 mins",
    ingredients: [
      "1 baguette or ciabatta",
      "4 ripe tomatoes, diced",
      "Fresh basil leaves",
      "3 cloves garlic",
      "3 tbsp extra virgin olive oil",
      "1 tbsp balsamic vinegar",
      "Salt & pepper",
      "Mozzarella (optional)"
    ],
    recipe: [
      "Dice tomatoes and mix with torn basil, minced garlic, olive oil, and balsamic vinegar",
      "Season with salt and pepper, let it marinate for 10 minutes",
      "Slice bread into 1cm thick pieces",
      "Toast or grill bread until golden and crispy",
      "Rub each toast with a cut garlic clove for extra flavor",
      "Spoon tomato mixture generously onto each toast",
      "Add fresh mozzarella if desired",
      "Drizzle with a little extra olive oil and serve"
    ]
  }
];
