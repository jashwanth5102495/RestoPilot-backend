"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const recipe_template_model_1 = require("../modules/recipes/recipe-template.model");
const templates = [
    {
        "dishName": "Chicken Biryani",
        "aliases": [
            "chicken biriyani",
            "chicken dum biryani",
            "hyderabadi chicken biryani"
        ],
        "category": "Biryani",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Chicken",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Basmati Rice",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Curd",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 30,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Mutton Biryani",
        "aliases": [
            "mutton dum biryani"
        ],
        "category": "Biryani",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Mutton",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Basmati Rice",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Curd",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 30,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Egg Biryani",
        "aliases": [],
        "category": "Biryani",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Egg",
                "quantity": 2,
                "unit": "pcs"
            },
            {
                "name": "Basmati Rice",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Curd",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 30,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Veg Biryani",
        "aliases": [
            "vegetable biryani",
            "veg dum biryani",
            "vegetable dum biryani"
        ],
        "category": "Biryani",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Mixed Vegetables",
                "quantity": 100,
                "unit": "g"
            },
            {
                "name": "Basmati Rice",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Curd",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 30,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Paneer Biryani",
        "aliases": [],
        "category": "Biryani",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Paneer",
                "quantity": 100,
                "unit": "g"
            },
            {
                "name": "Basmati Rice",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Curd",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 30,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Mushroom Biryani",
        "aliases": [],
        "category": "Biryani",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Mushroom",
                "quantity": 100,
                "unit": "g"
            },
            {
                "name": "Basmati Rice",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Curd",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 30,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Fish Biryani",
        "aliases": [],
        "category": "Biryani",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Fish",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Basmati Rice",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Curd",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 30,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Prawn Biryani",
        "aliases": [],
        "category": "Biryani",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Prawns",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Basmati Rice",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Curd",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 30,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Butter Chicken",
        "aliases": [
            "murgh makhani",
            "chicken makhani"
        ],
        "category": "North Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Chicken",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 40,
                "unit": "g"
            },
            {
                "name": "Butter",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Cream",
                "quantity": 30,
                "unit": "ml"
            },
            {
                "name": "Cashew",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Chicken Tikka Masala",
        "aliases": [],
        "category": "North Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Chicken",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 40,
                "unit": "g"
            },
            {
                "name": "Butter",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Cream",
                "quantity": 30,
                "unit": "ml"
            },
            {
                "name": "Cashew",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Kadai Chicken",
        "aliases": [],
        "category": "North Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Chicken",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 40,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Chicken Curry",
        "aliases": [],
        "category": "North Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Chicken",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 40,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Chicken Masala",
        "aliases": [],
        "category": "North Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Chicken",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 40,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Chicken Handi",
        "aliases": [],
        "category": "North Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Chicken",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 40,
                "unit": "g"
            },
            {
                "name": "Butter",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Cream",
                "quantity": 30,
                "unit": "ml"
            },
            {
                "name": "Cashew",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Chicken Korma",
        "aliases": [],
        "category": "North Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Chicken",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 40,
                "unit": "g"
            },
            {
                "name": "Butter",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Cream",
                "quantity": 30,
                "unit": "ml"
            },
            {
                "name": "Cashew",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Chicken Do Pyaza",
        "aliases": [],
        "category": "North Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Chicken",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 40,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Chicken Lababdar",
        "aliases": [],
        "category": "North Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Chicken",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 40,
                "unit": "g"
            },
            {
                "name": "Butter",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Cream",
                "quantity": 30,
                "unit": "ml"
            },
            {
                "name": "Cashew",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Chicken Kolhapuri",
        "aliases": [],
        "category": "North Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Chicken",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 60,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 40,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Chicken Saag",
        "aliases": [
            "palak chicken"
        ],
        "category": "North Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Chicken",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Spinach",
                "quantity": 100,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 20,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Chicken Keema",
        "aliases": [],
        "category": "North Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Minced Chicken",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 40,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Chicken Afghani",
        "aliases": [],
        "category": "North Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Chicken",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 40,
                "unit": "g"
            },
            {
                "name": "Butter",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Cream",
                "quantity": 30,
                "unit": "ml"
            },
            {
                "name": "Cashew",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Chicken Kali Mirch",
        "aliases": [],
        "category": "North Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Chicken",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 40,
                "unit": "g"
            },
            {
                "name": "Butter",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Cream",
                "quantity": 30,
                "unit": "ml"
            },
            {
                "name": "Cashew",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Mutton Curry",
        "aliases": [],
        "category": "North Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Mutton",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 40,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Mutton Masala",
        "aliases": [],
        "category": "North Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Mutton",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 40,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Mutton Rogan Josh",
        "aliases": [],
        "category": "North Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Mutton",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 60,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 40,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Mutton Korma",
        "aliases": [],
        "category": "North Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Mutton",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 40,
                "unit": "g"
            },
            {
                "name": "Butter",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Cream",
                "quantity": 30,
                "unit": "ml"
            },
            {
                "name": "Cashew",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Mutton Handi",
        "aliases": [],
        "category": "North Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Mutton",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 40,
                "unit": "g"
            },
            {
                "name": "Butter",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Cream",
                "quantity": 30,
                "unit": "ml"
            },
            {
                "name": "Cashew",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Mutton Do Pyaza",
        "aliases": [],
        "category": "North Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Mutton",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 40,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Mutton Keema",
        "aliases": [],
        "category": "North Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Minced Mutton",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 40,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Mutton Kolhapuri",
        "aliases": [],
        "category": "North Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Mutton",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 60,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 40,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Paneer Butter Masala",
        "aliases": [
            "paneer makhani"
        ],
        "category": "North Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Paneer",
                "quantity": 120,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 40,
                "unit": "g"
            },
            {
                "name": "Butter",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Cream",
                "quantity": 30,
                "unit": "ml"
            },
            {
                "name": "Cashew",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Kadai Paneer",
        "aliases": [],
        "category": "North Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Paneer",
                "quantity": 120,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 40,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Shahi Paneer",
        "aliases": [],
        "category": "North Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Paneer",
                "quantity": 120,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 40,
                "unit": "g"
            },
            {
                "name": "Butter",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Cream",
                "quantity": 30,
                "unit": "ml"
            },
            {
                "name": "Cashew",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Palak Paneer",
        "aliases": [],
        "category": "North Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Paneer",
                "quantity": 120,
                "unit": "g"
            },
            {
                "name": "Spinach",
                "quantity": 100,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 20,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Paneer Tikka Masala",
        "aliases": [],
        "category": "North Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Paneer",
                "quantity": 120,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 40,
                "unit": "g"
            },
            {
                "name": "Butter",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Cream",
                "quantity": 30,
                "unit": "ml"
            },
            {
                "name": "Cashew",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Paneer Lababdar",
        "aliases": [],
        "category": "North Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Paneer",
                "quantity": 120,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 40,
                "unit": "g"
            },
            {
                "name": "Butter",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Cream",
                "quantity": 30,
                "unit": "ml"
            },
            {
                "name": "Cashew",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Matar Paneer",
        "aliases": [],
        "category": "North Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Paneer",
                "quantity": 120,
                "unit": "g"
            },
            {
                "name": "Green Peas",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 40,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Paneer Do Pyaza",
        "aliases": [],
        "category": "North Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Paneer",
                "quantity": 120,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 40,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Achari Paneer",
        "aliases": [],
        "category": "North Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Paneer",
                "quantity": 120,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 60,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 40,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Dal Makhani",
        "aliases": [],
        "category": "North Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Black Urad Dal",
                "quantity": 80,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Butter",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Cream",
                "quantity": 20,
                "unit": "ml"
            }
        ]
    },
    {
        "dishName": "Dal Tadka",
        "aliases": [],
        "category": "North Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Yellow Dal",
                "quantity": 80,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 30,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Dal Fry",
        "aliases": [],
        "category": "North Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Yellow Dal",
                "quantity": 80,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 30,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Dal Palak",
        "aliases": [],
        "category": "North Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Yellow Dal",
                "quantity": 80,
                "unit": "g"
            },
            {
                "name": "Spinach",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 30,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Yellow Dal",
        "aliases": [],
        "category": "North Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Yellow Dal",
                "quantity": 80,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 30,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Dal Panchratna",
        "aliases": [],
        "category": "North Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Mixed Dal",
                "quantity": 80,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 30,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Chole Masala",
        "aliases": [],
        "category": "North Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Chickpeas",
                "quantity": 100,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 40,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Rajma Masala",
        "aliases": [],
        "category": "North Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Kidney Beans",
                "quantity": 100,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 40,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Aloo Gobi",
        "aliases": [],
        "category": "North Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Potato",
                "quantity": 100,
                "unit": "g"
            },
            {
                "name": "Cauliflower",
                "quantity": 100,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 40,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 30,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Aloo Jeera",
        "aliases": [
            "jeera aloo"
        ],
        "category": "North Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Potato",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 40,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 30,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Aloo Matar",
        "aliases": [],
        "category": "North Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Potato",
                "quantity": 100,
                "unit": "g"
            },
            {
                "name": "Green Peas",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 40,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Bhindi Masala",
        "aliases": [],
        "category": "North Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Okra",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 40,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 30,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Baingan Masala",
        "aliases": [],
        "category": "North Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Eggplant",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 40,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 30,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Mix Veg",
        "aliases": [
            "mixed veg",
            "mixed vegetables"
        ],
        "category": "North Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Mixed Vegetables",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 40,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Veg Kolhapuri",
        "aliases": [],
        "category": "North Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Mixed Vegetables",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 60,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 40,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Veg Korma",
        "aliases": [],
        "category": "North Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Mixed Vegetables",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 40,
                "unit": "g"
            },
            {
                "name": "Butter",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Cream",
                "quantity": 30,
                "unit": "ml"
            },
            {
                "name": "Cashew",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Malai Kofta",
        "aliases": [],
        "category": "North Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Paneer",
                "quantity": 80,
                "unit": "g"
            },
            {
                "name": "Potato",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 40,
                "unit": "g"
            },
            {
                "name": "Butter",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Cream",
                "quantity": 30,
                "unit": "ml"
            },
            {
                "name": "Cashew",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Dum Aloo",
        "aliases": [],
        "category": "North Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Baby Potato",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 40,
                "unit": "g"
            },
            {
                "name": "Butter",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Cream",
                "quantity": 30,
                "unit": "ml"
            },
            {
                "name": "Cashew",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Mushroom Masala",
        "aliases": [],
        "category": "North Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Mushroom",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 40,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Matar Mushroom",
        "aliases": [],
        "category": "North Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Mushroom",
                "quantity": 100,
                "unit": "g"
            },
            {
                "name": "Green Peas",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 40,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Palak Corn",
        "aliases": [],
        "category": "North Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Sweet Corn",
                "quantity": 80,
                "unit": "g"
            },
            {
                "name": "Spinach",
                "quantity": 100,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 20,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Steamed Rice",
        "aliases": [
            "plain rice",
            "white rice"
        ],
        "category": "Rice",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Rice",
                "quantity": 150,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Jeera Rice",
        "aliases": [],
        "category": "Rice",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Rice",
                "quantity": 150,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Ghee Rice",
        "aliases": [],
        "category": "Rice",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Rice",
                "quantity": 150,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Veg Pulao",
        "aliases": [
            "vegetable pulao"
        ],
        "category": "Rice",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Rice",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Mixed Vegetables",
                "quantity": 50,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Peas Pulao",
        "aliases": [],
        "category": "Rice",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Rice",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Green Peas",
                "quantity": 50,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Kashmiri Pulao",
        "aliases": [],
        "category": "Rice",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Rice",
                "quantity": 150,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Lemon Rice",
        "aliases": [],
        "category": "Rice",
        "cuisine": "South Indian",
        "ingredients": [
            {
                "name": "Rice",
                "quantity": 150,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Tomato Rice",
        "aliases": [],
        "category": "Rice",
        "cuisine": "South Indian",
        "ingredients": [
            {
                "name": "Rice",
                "quantity": 150,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Curd Rice",
        "aliases": [],
        "category": "Rice",
        "cuisine": "South Indian",
        "ingredients": [
            {
                "name": "Rice",
                "quantity": 100,
                "unit": "g"
            },
            {
                "name": "Curd",
                "quantity": 100,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Coconut Rice",
        "aliases": [],
        "category": "Rice",
        "cuisine": "South Indian",
        "ingredients": [
            {
                "name": "Rice",
                "quantity": 150,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Mushroom Rice",
        "aliases": [],
        "category": "Rice",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Rice",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Mushroom",
                "quantity": 50,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Veg Fried Rice",
        "aliases": [
            "vegetable fried rice"
        ],
        "category": "Chinese",
        "cuisine": "Indo-Chinese",
        "ingredients": [
            {
                "name": "Rice",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Carrot",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Cabbage",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Spring Onion",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Chicken Fried Rice",
        "aliases": [],
        "category": "Chinese",
        "cuisine": "Indo-Chinese",
        "ingredients": [
            {
                "name": "Rice",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Chicken",
                "quantity": 80,
                "unit": "g"
            },
            {
                "name": "Carrot",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Cabbage",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Spring Onion",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Egg Fried Rice",
        "aliases": [],
        "category": "Chinese",
        "cuisine": "Indo-Chinese",
        "ingredients": [
            {
                "name": "Rice",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Egg",
                "quantity": 2,
                "unit": "pcs"
            },
            {
                "name": "Carrot",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Cabbage",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Spring Onion",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Schezwan Fried Rice",
        "aliases": [],
        "category": "Chinese",
        "cuisine": "Indo-Chinese",
        "ingredients": [
            {
                "name": "Rice",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Carrot",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Cabbage",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Spring Onion",
                "quantity": 10,
                "unit": "g"
            },
            {
                "name": "Schezwan Sauce",
                "quantity": 15,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Mixed Fried Rice",
        "aliases": [],
        "category": "Chinese",
        "cuisine": "Indo-Chinese",
        "ingredients": [
            {
                "name": "Rice",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Chicken",
                "quantity": 40,
                "unit": "g"
            },
            {
                "name": "Carrot",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Cabbage",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Spring Onion",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Garlic Fried Rice",
        "aliases": [],
        "category": "Chinese",
        "cuisine": "Indo-Chinese",
        "ingredients": [
            {
                "name": "Rice",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Carrot",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Cabbage",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Spring Onion",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Paneer Fried Rice",
        "aliases": [],
        "category": "Chinese",
        "cuisine": "Indo-Chinese",
        "ingredients": [
            {
                "name": "Rice",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Paneer",
                "quantity": 80,
                "unit": "g"
            },
            {
                "name": "Carrot",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Cabbage",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Spring Onion",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Veg Hakka Noodles",
        "aliases": [],
        "category": "Chinese",
        "cuisine": "Indo-Chinese",
        "ingredients": [
            {
                "name": "Noodles",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Carrot",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Cabbage",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Capsicum",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Spring Onion",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Chicken Hakka Noodles",
        "aliases": [],
        "category": "Chinese",
        "cuisine": "Indo-Chinese",
        "ingredients": [
            {
                "name": "Noodles",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Chicken",
                "quantity": 80,
                "unit": "g"
            },
            {
                "name": "Carrot",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Cabbage",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Capsicum",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Spring Onion",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Egg Hakka Noodles",
        "aliases": [],
        "category": "Chinese",
        "cuisine": "Indo-Chinese",
        "ingredients": [
            {
                "name": "Noodles",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Egg",
                "quantity": 2,
                "unit": "pcs"
            },
            {
                "name": "Carrot",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Cabbage",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Capsicum",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Spring Onion",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Schezwan Noodles",
        "aliases": [],
        "category": "Chinese",
        "cuisine": "Indo-Chinese",
        "ingredients": [
            {
                "name": "Noodles",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Carrot",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Cabbage",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Capsicum",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Spring Onion",
                "quantity": 10,
                "unit": "g"
            },
            {
                "name": "Schezwan Sauce",
                "quantity": 15,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Garlic Noodles",
        "aliases": [],
        "category": "Chinese",
        "cuisine": "Indo-Chinese",
        "ingredients": [
            {
                "name": "Noodles",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Carrot",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Cabbage",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Capsicum",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Spring Onion",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Mixed Hakka Noodles",
        "aliases": [],
        "category": "Chinese",
        "cuisine": "Indo-Chinese",
        "ingredients": [
            {
                "name": "Noodles",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Chicken",
                "quantity": 40,
                "unit": "g"
            },
            {
                "name": "Carrot",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Cabbage",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Capsicum",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Spring Onion",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Chilli Garlic Noodles",
        "aliases": [],
        "category": "Chinese",
        "cuisine": "Indo-Chinese",
        "ingredients": [
            {
                "name": "Noodles",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Carrot",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Cabbage",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Capsicum",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Spring Onion",
                "quantity": 10,
                "unit": "g"
            },
            {
                "name": "Schezwan Sauce",
                "quantity": 15,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Veg Manchurian",
        "aliases": [],
        "category": "Starters",
        "cuisine": "Indo-Chinese",
        "ingredients": [
            {
                "name": "Mixed Vegetables",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Capsicum",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Corn Flour",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Gobi Manchurian",
        "aliases": [],
        "category": "Starters",
        "cuisine": "Indo-Chinese",
        "ingredients": [
            {
                "name": "Cauliflower",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Capsicum",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Corn Flour",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Chicken Manchurian",
        "aliases": [],
        "category": "Starters",
        "cuisine": "Indo-Chinese",
        "ingredients": [
            {
                "name": "Chicken",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Capsicum",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Corn Flour",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Paneer Manchurian",
        "aliases": [],
        "category": "Starters",
        "cuisine": "Indo-Chinese",
        "ingredients": [
            {
                "name": "Paneer",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Capsicum",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Corn Flour",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Chilli Chicken",
        "aliases": [],
        "category": "Starters",
        "cuisine": "Indo-Chinese",
        "ingredients": [
            {
                "name": "Chicken",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Capsicum",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Corn Flour",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Chilli Paneer",
        "aliases": [],
        "category": "Starters",
        "cuisine": "Indo-Chinese",
        "ingredients": [
            {
                "name": "Paneer",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Capsicum",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Corn Flour",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Chilli Gobi",
        "aliases": [],
        "category": "Starters",
        "cuisine": "Indo-Chinese",
        "ingredients": [
            {
                "name": "Cauliflower",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Capsicum",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Corn Flour",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Chilli Mushroom",
        "aliases": [],
        "category": "Starters",
        "cuisine": "Indo-Chinese",
        "ingredients": [
            {
                "name": "Mushroom",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Capsicum",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Corn Flour",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Dragon Chicken",
        "aliases": [],
        "category": "Starters",
        "cuisine": "Indo-Chinese",
        "ingredients": [
            {
                "name": "Chicken",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Capsicum",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Corn Flour",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Garlic Chicken",
        "aliases": [],
        "category": "Starters",
        "cuisine": "Indo-Chinese",
        "ingredients": [
            {
                "name": "Chicken",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Capsicum",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Corn Flour",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Pepper Chicken",
        "aliases": [],
        "category": "Starters",
        "cuisine": "Indo-Chinese",
        "ingredients": [
            {
                "name": "Chicken",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Capsicum",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Corn Flour",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Hot Garlic Chicken",
        "aliases": [],
        "category": "Starters",
        "cuisine": "Indo-Chinese",
        "ingredients": [
            {
                "name": "Chicken",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Capsicum",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Corn Flour",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Chicken 65",
        "aliases": [],
        "category": "Starters",
        "cuisine": "Indo-Chinese",
        "ingredients": [
            {
                "name": "Chicken",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Capsicum",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Corn Flour",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Chicken Lollipop",
        "aliases": [],
        "category": "Starters",
        "cuisine": "Indo-Chinese",
        "ingredients": [
            {
                "name": "Chicken Wings",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Capsicum",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Corn Flour",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Veg Manchow Soup",
        "aliases": [],
        "category": "Soup",
        "cuisine": "Indo-Chinese",
        "ingredients": [
            {
                "name": "Mixed Vegetables",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Corn Flour",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Chicken Manchow Soup",
        "aliases": [],
        "category": "Soup",
        "cuisine": "Indo-Chinese",
        "ingredients": [
            {
                "name": "Chicken",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Corn Flour",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Veg Hot and Sour Soup",
        "aliases": [],
        "category": "Soup",
        "cuisine": "Indo-Chinese",
        "ingredients": [
            {
                "name": "Mixed Vegetables",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Corn Flour",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Chicken Hot and Sour Soup",
        "aliases": [],
        "category": "Soup",
        "cuisine": "Indo-Chinese",
        "ingredients": [
            {
                "name": "Chicken",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Corn Flour",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Veg Sweet Corn Soup",
        "aliases": [],
        "category": "Soup",
        "cuisine": "Indo-Chinese",
        "ingredients": [
            {
                "name": "Sweet Corn",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Corn Flour",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Chicken Sweet Corn Soup",
        "aliases": [],
        "category": "Soup",
        "cuisine": "Indo-Chinese",
        "ingredients": [
            {
                "name": "Chicken",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Sweet Corn",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Corn Flour",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Tomato Soup",
        "aliases": [],
        "category": "Soup",
        "cuisine": "Global",
        "ingredients": [
            {
                "name": "Tomato",
                "quantity": 100,
                "unit": "g"
            },
            {
                "name": "Corn Flour",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Cream of Mushroom Soup",
        "aliases": [],
        "category": "Soup",
        "cuisine": "Global",
        "ingredients": [
            {
                "name": "Mushroom",
                "quantity": 80,
                "unit": "g"
            },
            {
                "name": "Corn Flour",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Tandoori Chicken",
        "aliases": [],
        "category": "Tandoor",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Chicken",
                "quantity": 250,
                "unit": "g"
            },
            {
                "name": "Curd",
                "quantity": 40,
                "unit": "g"
            },
            {
                "name": "Lemon",
                "quantity": 0.5,
                "unit": "pcs"
            }
        ]
    },
    {
        "dishName": "Chicken Tikka",
        "aliases": [],
        "category": "Tandoor",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Chicken",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Curd",
                "quantity": 40,
                "unit": "g"
            },
            {
                "name": "Lemon",
                "quantity": 0.5,
                "unit": "pcs"
            }
        ]
    },
    {
        "dishName": "Chicken Malai Tikka",
        "aliases": [],
        "category": "Tandoor",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Chicken",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Cream",
                "quantity": 30,
                "unit": "ml"
            },
            {
                "name": "Cheese",
                "quantity": 20,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Hariyali Chicken Tikka",
        "aliases": [],
        "category": "Tandoor",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Chicken",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Curd",
                "quantity": 40,
                "unit": "g"
            },
            {
                "name": "Lemon",
                "quantity": 0.5,
                "unit": "pcs"
            }
        ]
    },
    {
        "dishName": "Chicken Seekh Kebab",
        "aliases": [],
        "category": "Tandoor",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Minced Chicken",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Curd",
                "quantity": 40,
                "unit": "g"
            },
            {
                "name": "Lemon",
                "quantity": 0.5,
                "unit": "pcs"
            }
        ]
    },
    {
        "dishName": "Mutton Seekh Kebab",
        "aliases": [],
        "category": "Tandoor",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Minced Mutton",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Curd",
                "quantity": 40,
                "unit": "g"
            },
            {
                "name": "Lemon",
                "quantity": 0.5,
                "unit": "pcs"
            }
        ]
    },
    {
        "dishName": "Reshmi Kebab",
        "aliases": [],
        "category": "Tandoor",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Minced Chicken",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Cream",
                "quantity": 30,
                "unit": "ml"
            },
            {
                "name": "Cheese",
                "quantity": 20,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Paneer Tikka",
        "aliases": [],
        "category": "Tandoor",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Paneer",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Curd",
                "quantity": 40,
                "unit": "g"
            },
            {
                "name": "Lemon",
                "quantity": 0.5,
                "unit": "pcs"
            }
        ]
    },
    {
        "dishName": "Tandoori Paneer",
        "aliases": [],
        "category": "Tandoor",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Paneer",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Curd",
                "quantity": 40,
                "unit": "g"
            },
            {
                "name": "Lemon",
                "quantity": 0.5,
                "unit": "pcs"
            }
        ]
    },
    {
        "dishName": "Tandoori Mushroom",
        "aliases": [],
        "category": "Tandoor",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Mushroom",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Curd",
                "quantity": 40,
                "unit": "g"
            },
            {
                "name": "Lemon",
                "quantity": 0.5,
                "unit": "pcs"
            }
        ]
    },
    {
        "dishName": "Tandoori Fish",
        "aliases": [],
        "category": "Tandoor",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Fish",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Curd",
                "quantity": 40,
                "unit": "g"
            },
            {
                "name": "Lemon",
                "quantity": 0.5,
                "unit": "pcs"
            }
        ]
    },
    {
        "dishName": "Tandoori Prawns",
        "aliases": [],
        "category": "Tandoor",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Prawns",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Curd",
                "quantity": 40,
                "unit": "g"
            },
            {
                "name": "Lemon",
                "quantity": 0.5,
                "unit": "pcs"
            }
        ]
    },
    {
        "dishName": "Roti",
        "aliases": [],
        "category": "Breads",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Wheat Flour",
                "quantity": 50,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Butter Roti",
        "aliases": [],
        "category": "Breads",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Wheat Flour",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Butter",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Tandoori Roti",
        "aliases": [],
        "category": "Breads",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Wheat Flour",
                "quantity": 50,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Naan",
        "aliases": [],
        "category": "Breads",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Maida",
                "quantity": 60,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Butter Naan",
        "aliases": [],
        "category": "Breads",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Maida",
                "quantity": 60,
                "unit": "g"
            },
            {
                "name": "Butter",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Garlic Naan",
        "aliases": [],
        "category": "Breads",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Maida",
                "quantity": 60,
                "unit": "g"
            },
            {
                "name": "Butter",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Cheese Naan",
        "aliases": [],
        "category": "Breads",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Maida",
                "quantity": 60,
                "unit": "g"
            },
            {
                "name": "Cheese",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Butter",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Rumali Roti",
        "aliases": [],
        "category": "Breads",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Maida",
                "quantity": 50,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Plain Paratha",
        "aliases": [],
        "category": "Breads",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Wheat Flour",
                "quantity": 60,
                "unit": "g"
            },
            {
                "name": "Butter",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Lachha Paratha",
        "aliases": [],
        "category": "Breads",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Wheat Flour",
                "quantity": 60,
                "unit": "g"
            },
            {
                "name": "Butter",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Aloo Paratha",
        "aliases": [],
        "category": "Breads",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Wheat Flour",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Potato",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Butter",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Paneer Paratha",
        "aliases": [],
        "category": "Breads",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Wheat Flour",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Paneer",
                "quantity": 40,
                "unit": "g"
            },
            {
                "name": "Butter",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Plain Dosa",
        "aliases": [],
        "category": "South Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Dosa Batter",
                "quantity": 150,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Masala Dosa",
        "aliases": [],
        "category": "South Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Dosa Batter",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Potato",
                "quantity": 80,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Butter Dosa",
        "aliases": [],
        "category": "South Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Dosa Batter",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Butter",
                "quantity": 15,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Mysore Masala Dosa",
        "aliases": [],
        "category": "South Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Dosa Batter",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Potato",
                "quantity": 80,
                "unit": "g"
            },
            {
                "name": "Butter",
                "quantity": 15,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Paneer Dosa",
        "aliases": [],
        "category": "South Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Dosa Batter",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Paneer",
                "quantity": 50,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Onion Dosa",
        "aliases": [],
        "category": "South Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Dosa Batter",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 40,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Idli",
        "aliases": [],
        "category": "South Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Idli Batter",
                "quantity": 150,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Medu Vada",
        "aliases": [],
        "category": "South Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Urad Dal Batter",
                "quantity": 100,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Sambar",
        "aliases": [],
        "category": "South Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Toor Dal",
                "quantity": 40,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 40,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Rasam",
        "aliases": [],
        "category": "South Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Tomato",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 40,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Uttapam",
        "aliases": [],
        "category": "South Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Dosa Batter",
                "quantity": 150,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Onion Uttapam",
        "aliases": [],
        "category": "South Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Dosa Batter",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 40,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Pongal",
        "aliases": [],
        "category": "South Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Rice",
                "quantity": 80,
                "unit": "g"
            },
            {
                "name": "Moong Dal",
                "quantity": 40,
                "unit": "g"
            },
            {
                "name": "Butter",
                "quantity": 15,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Upma",
        "aliases": [],
        "category": "South Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Semolina",
                "quantity": 100,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Coconut Chutney",
        "aliases": [],
        "category": "South Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Coconut",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Green Chilli",
                "quantity": 5,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Tomato Chutney",
        "aliases": [],
        "category": "South Indian",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Tomato",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Green Chilli",
                "quantity": 5,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Egg Omelette",
        "aliases": [
            "omelette",
            "masala omelette",
            "egg omelet"
        ],
        "category": "Breakfast",
        "cuisine": "Global",
        "ingredients": [
            {
                "name": "Egg",
                "quantity": 2,
                "unit": "pcs"
            },
            {
                "name": "Onion",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 15,
                "unit": "g"
            },
            {
                "name": "Green Chilli",
                "quantity": 5,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Masala Omelette",
        "aliases": [],
        "category": "Breakfast",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Egg",
                "quantity": 2,
                "unit": "pcs"
            },
            {
                "name": "Onion",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 15,
                "unit": "g"
            },
            {
                "name": "Green Chilli",
                "quantity": 5,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Cheese Omelette",
        "aliases": [],
        "category": "Breakfast",
        "cuisine": "Global",
        "ingredients": [
            {
                "name": "Egg",
                "quantity": 2,
                "unit": "pcs"
            },
            {
                "name": "Cheese",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Butter",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Plain Omelette",
        "aliases": [],
        "category": "Breakfast",
        "cuisine": "Global",
        "ingredients": [
            {
                "name": "Egg",
                "quantity": 2,
                "unit": "pcs"
            },
            {
                "name": "Onion",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 15,
                "unit": "g"
            },
            {
                "name": "Green Chilli",
                "quantity": 5,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Poha",
        "aliases": [],
        "category": "Breakfast",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Flattened Rice",
                "quantity": 100,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Poori Bhaji",
        "aliases": [],
        "category": "Breakfast",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Wheat Flour",
                "quantity": 80,
                "unit": "g"
            },
            {
                "name": "Potato",
                "quantity": 100,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Chole Bhature",
        "aliases": [],
        "category": "Breakfast",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Maida",
                "quantity": 100,
                "unit": "g"
            },
            {
                "name": "Chickpeas",
                "quantity": 80,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Pav Bhaji",
        "aliases": [],
        "category": "Breakfast",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Pav",
                "quantity": 2,
                "unit": "pcs"
            },
            {
                "name": "Mixed Vegetables",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Butter",
                "quantity": 15,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Bread Omelette",
        "aliases": [],
        "category": "Breakfast",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Egg",
                "quantity": 2,
                "unit": "pcs"
            },
            {
                "name": "Bread",
                "quantity": 2,
                "unit": "pcs"
            },
            {
                "name": "Onion",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 15,
                "unit": "g"
            },
            {
                "name": "Green Chilli",
                "quantity": 5,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Egg Bhurji",
        "aliases": [],
        "category": "Breakfast",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Egg",
                "quantity": 2,
                "unit": "pcs"
            },
            {
                "name": "Onion",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 15,
                "unit": "g"
            },
            {
                "name": "Green Chilli",
                "quantity": 5,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Samosa",
        "aliases": [],
        "category": "Snacks",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Maida",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Potato",
                "quantity": 80,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Paneer Pakora",
        "aliases": [],
        "category": "Snacks",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Paneer",
                "quantity": 100,
                "unit": "g"
            },
            {
                "name": "Besan",
                "quantity": 40,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Onion Pakora",
        "aliases": [],
        "category": "Snacks",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Onion",
                "quantity": 100,
                "unit": "g"
            },
            {
                "name": "Besan",
                "quantity": 40,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Aloo Pakora",
        "aliases": [],
        "category": "Snacks",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Potato",
                "quantity": 100,
                "unit": "g"
            },
            {
                "name": "Besan",
                "quantity": 40,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Chicken Pakora",
        "aliases": [],
        "category": "Snacks",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Chicken",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Besan",
                "quantity": 40,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Fish Fry",
        "aliases": [],
        "category": "Snacks",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Fish",
                "quantity": 150,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Fish Fingers",
        "aliases": [],
        "category": "Snacks",
        "cuisine": "Global",
        "ingredients": [
            {
                "name": "Fish",
                "quantity": 150,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "French Fries",
        "aliases": [],
        "category": "Snacks",
        "cuisine": "Global",
        "ingredients": [
            {
                "name": "Potato",
                "quantity": 150,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Masala Fries",
        "aliases": [],
        "category": "Snacks",
        "cuisine": "Global",
        "ingredients": [
            {
                "name": "Potato",
                "quantity": 150,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Chilli Potato",
        "aliases": [],
        "category": "Snacks",
        "cuisine": "Indo-Chinese",
        "ingredients": [
            {
                "name": "Potato",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Capsicum",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Corn Flour",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Veg Spring Roll",
        "aliases": [],
        "category": "Snacks",
        "cuisine": "Indo-Chinese",
        "ingredients": [
            {
                "name": "Spring Roll Wrapper",
                "quantity": 2,
                "unit": "pcs"
            },
            {
                "name": "Mixed Vegetables",
                "quantity": 80,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Chicken Spring Roll",
        "aliases": [],
        "category": "Snacks",
        "cuisine": "Indo-Chinese",
        "ingredients": [
            {
                "name": "Spring Roll Wrapper",
                "quantity": 2,
                "unit": "pcs"
            },
            {
                "name": "Chicken",
                "quantity": 80,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Paneer Spring Roll",
        "aliases": [],
        "category": "Snacks",
        "cuisine": "Indo-Chinese",
        "ingredients": [
            {
                "name": "Spring Roll Wrapper",
                "quantity": 2,
                "unit": "pcs"
            },
            {
                "name": "Paneer",
                "quantity": 80,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Fish Masala",
        "aliases": [],
        "category": "Seafood",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Fish",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 40,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Fish Curry",
        "aliases": [],
        "category": "Seafood",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Fish",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 40,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Fish Tikka",
        "aliases": [],
        "category": "Seafood",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Fish",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Curd",
                "quantity": 40,
                "unit": "g"
            },
            {
                "name": "Lemon",
                "quantity": 0.5,
                "unit": "pcs"
            }
        ]
    },
    {
        "dishName": "Chilli Fish",
        "aliases": [],
        "category": "Seafood",
        "cuisine": "Indo-Chinese",
        "ingredients": [
            {
                "name": "Fish",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Capsicum",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Corn Flour",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Prawn Fry",
        "aliases": [],
        "category": "Seafood",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Prawns",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Curd",
                "quantity": 40,
                "unit": "g"
            },
            {
                "name": "Lemon",
                "quantity": 0.5,
                "unit": "pcs"
            }
        ]
    },
    {
        "dishName": "Prawn Masala",
        "aliases": [],
        "category": "Seafood",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Prawns",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 40,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Prawn Curry",
        "aliases": [],
        "category": "Seafood",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Prawns",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Tomato",
                "quantity": 40,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Chilli Prawns",
        "aliases": [],
        "category": "Seafood",
        "cuisine": "Indo-Chinese",
        "ingredients": [
            {
                "name": "Prawns",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Capsicum",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Corn Flour",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Garlic Prawns",
        "aliases": [],
        "category": "Seafood",
        "cuisine": "Indo-Chinese",
        "ingredients": [
            {
                "name": "Prawns",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Onion",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Capsicum",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Corn Flour",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Gulab Jamun",
        "aliases": [],
        "category": "Desserts",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Gulab Jamun",
                "quantity": 2,
                "unit": "pcs"
            },
            {
                "name": "Sugar",
                "quantity": 20,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Rasgulla",
        "aliases": [],
        "category": "Desserts",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Rasgulla",
                "quantity": 2,
                "unit": "pcs"
            },
            {
                "name": "Sugar",
                "quantity": 20,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Jalebi",
        "aliases": [],
        "category": "Desserts",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Jalebi",
                "quantity": 100,
                "unit": "g"
            },
            {
                "name": "Sugar",
                "quantity": 20,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Gajar Halwa",
        "aliases": [
            "carrot halwa"
        ],
        "category": "Desserts",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Carrot",
                "quantity": 100,
                "unit": "g"
            },
            {
                "name": "Milk",
                "quantity": 100,
                "unit": "ml"
            },
            {
                "name": "Sugar",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Almonds",
                "quantity": 5,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Kheer",
        "aliases": [
            "rice kheer"
        ],
        "category": "Desserts",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Milk",
                "quantity": 150,
                "unit": "ml"
            },
            {
                "name": "Rice",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Sugar",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Almonds",
                "quantity": 5,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Phirni",
        "aliases": [],
        "category": "Desserts",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Milk",
                "quantity": 150,
                "unit": "ml"
            },
            {
                "name": "Rice Flour",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Sugar",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Almonds",
                "quantity": 5,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Kulfi",
        "aliases": [],
        "category": "Desserts",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Milk",
                "quantity": 150,
                "unit": "ml"
            },
            {
                "name": "Sugar",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Almonds",
                "quantity": 5,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Mango Kulfi",
        "aliases": [],
        "category": "Desserts",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Milk",
                "quantity": 150,
                "unit": "ml"
            },
            {
                "name": "Mango Pulp",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Sugar",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Almonds",
                "quantity": 5,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Pista Kulfi",
        "aliases": [],
        "category": "Desserts",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Milk",
                "quantity": 150,
                "unit": "ml"
            },
            {
                "name": "Pistachio",
                "quantity": 10,
                "unit": "g"
            },
            {
                "name": "Sugar",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Almonds",
                "quantity": 5,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Rabri",
        "aliases": [],
        "category": "Desserts",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Milk",
                "quantity": 200,
                "unit": "ml"
            },
            {
                "name": "Sugar",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Almonds",
                "quantity": 5,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Shahi Tukda",
        "aliases": [],
        "category": "Desserts",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Bread",
                "quantity": 2,
                "unit": "pcs"
            },
            {
                "name": "Milk",
                "quantity": 100,
                "unit": "ml"
            },
            {
                "name": "Sugar",
                "quantity": 30,
                "unit": "g"
            },
            {
                "name": "Almonds",
                "quantity": 5,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Brownie",
        "aliases": [
            "chocolate brownie"
        ],
        "category": "Desserts",
        "cuisine": "Global",
        "ingredients": [
            {
                "name": "Brownie",
                "quantity": 1,
                "unit": "pcs"
            },
            {
                "name": "Sugar",
                "quantity": 20,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Fruit Custard",
        "aliases": [],
        "category": "Desserts",
        "cuisine": "Global",
        "ingredients": [
            {
                "name": "Milk",
                "quantity": 150,
                "unit": "ml"
            },
            {
                "name": "Mixed Fruits",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Sugar",
                "quantity": 20,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Masala Chai",
        "aliases": [
            "tea",
            "ginger tea"
        ],
        "category": "Beverages",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Milk",
                "quantity": 100,
                "unit": "ml"
            },
            {
                "name": "Tea Leaves",
                "quantity": 5,
                "unit": "g"
            },
            {
                "name": "Sugar",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Coffee",
        "aliases": [
            "filter coffee"
        ],
        "category": "Beverages",
        "cuisine": "Global",
        "ingredients": [
            {
                "name": "Milk",
                "quantity": 100,
                "unit": "ml"
            },
            {
                "name": "Coffee Powder",
                "quantity": 5,
                "unit": "g"
            },
            {
                "name": "Sugar",
                "quantity": 10,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Cold Coffee",
        "aliases": [],
        "category": "Beverages",
        "cuisine": "Global",
        "ingredients": [
            {
                "name": "Milk",
                "quantity": 200,
                "unit": "ml"
            },
            {
                "name": "Coffee Powder",
                "quantity": 5,
                "unit": "g"
            },
            {
                "name": "Sugar",
                "quantity": 15,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Sweet Lassi",
        "aliases": [
            "lassi"
        ],
        "category": "Beverages",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Curd",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Sugar",
                "quantity": 15,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Salted Lassi",
        "aliases": [],
        "category": "Beverages",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Curd",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Sugar",
                "quantity": 15,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Mango Lassi",
        "aliases": [],
        "category": "Beverages",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Curd",
                "quantity": 150,
                "unit": "g"
            },
            {
                "name": "Mango Pulp",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Sugar",
                "quantity": 15,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Buttermilk",
        "aliases": [],
        "category": "Beverages",
        "cuisine": "Indian",
        "ingredients": [
            {
                "name": "Curd",
                "quantity": 100,
                "unit": "g"
            },
            {
                "name": "Sugar",
                "quantity": 15,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Fresh Lime Soda",
        "aliases": [],
        "category": "Beverages",
        "cuisine": "Global",
        "ingredients": [
            {
                "name": "Lemon",
                "quantity": 1,
                "unit": "pcs"
            },
            {
                "name": "Soda",
                "quantity": 200,
                "unit": "ml"
            },
            {
                "name": "Sugar",
                "quantity": 15,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Fresh Lime Water",
        "aliases": [],
        "category": "Beverages",
        "cuisine": "Global",
        "ingredients": [
            {
                "name": "Lemon",
                "quantity": 1,
                "unit": "pcs"
            },
            {
                "name": "Sugar",
                "quantity": 15,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Mango Milkshake",
        "aliases": [],
        "category": "Beverages",
        "cuisine": "Global",
        "ingredients": [
            {
                "name": "Milk",
                "quantity": 200,
                "unit": "ml"
            },
            {
                "name": "Mango Pulp",
                "quantity": 50,
                "unit": "g"
            },
            {
                "name": "Sugar",
                "quantity": 15,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Banana Milkshake",
        "aliases": [],
        "category": "Beverages",
        "cuisine": "Global",
        "ingredients": [
            {
                "name": "Milk",
                "quantity": 200,
                "unit": "ml"
            },
            {
                "name": "Banana",
                "quantity": 1,
                "unit": "pcs"
            },
            {
                "name": "Sugar",
                "quantity": 15,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Chocolate Milkshake",
        "aliases": [],
        "category": "Beverages",
        "cuisine": "Global",
        "ingredients": [
            {
                "name": "Milk",
                "quantity": 200,
                "unit": "ml"
            },
            {
                "name": "Chocolate Syrup",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Sugar",
                "quantity": 15,
                "unit": "g"
            }
        ]
    },
    {
        "dishName": "Strawberry Milkshake",
        "aliases": [],
        "category": "Beverages",
        "cuisine": "Global",
        "ingredients": [
            {
                "name": "Milk",
                "quantity": 200,
                "unit": "ml"
            },
            {
                "name": "Strawberry Syrup",
                "quantity": 20,
                "unit": "g"
            },
            {
                "name": "Sugar",
                "quantity": 15,
                "unit": "g"
            }
        ]
    }
];
const runSeed = async () => {
    try {
        await (0, database_1.connectDatabase)();
        console.log('Connected to database. Seeding global recipe templates...');
        let insertedCount = 0;
        let updatedCount = 0;
        for (const t of templates) {
            const normalizedName = t.dishName.trim().toLowerCase().replace(/\s+/g, ' ');
            const updateData = {
                dishName: t.dishName,
                normalizedDishName: normalizedName,
                aliases: t.aliases.map(a => a.trim().toLowerCase().replace(/\s+/g, ' ')),
                category: t.category,
                cuisine: t.cuisine,
                servingUnit: '1 serving',
                ingredients: t.ingredients
            };
            const result = await recipe_template_model_1.RecipeTemplate.updateOne({ normalizedDishName: normalizedName }, { $set: updateData }, { upsert: true });
            if (result.upsertedCount > 0) {
                insertedCount++;
            }
            else if (result.modifiedCount > 0) {
                updatedCount++;
            }
        }
        console.log(`Seeding complete. Inserted: ${insertedCount}, Updated: ${updatedCount}`);
        process.exit(0);
    }
    catch (err) {
        console.error('Error seeding templates:', err);
        process.exit(1);
    }
};
runSeed();
