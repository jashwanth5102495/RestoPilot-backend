import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IRecipeItem {
  ingredientId: Types.ObjectId;
  quantity: number; // Quantity in the ingredient's base unit
  unit: string; // Display unit (can be 'kg', mapped to 'g' internally, etc.)
}

export interface IRecipe extends Document {
  restaurantId: Types.ObjectId;
  dishId: Types.ObjectId;
  items: IRecipeItem[];
  createdAt: Date;
  updatedAt: Date;
}

const RecipeItemSchema = new Schema<IRecipeItem>({
  ingredientId: { type: Schema.Types.ObjectId, ref: 'Ingredient', required: true },
  quantity: { type: Number, required: true, min: 0.001 },
  unit: { type: String, required: true },
}, { _id: false });

const RecipeSchema = new Schema<IRecipe>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    dishId: { type: Schema.Types.ObjectId, ref: 'Dish', required: true, unique: true },
    items: [RecipeItemSchema],
  },
  { timestamps: true }
);

RecipeSchema.index({ restaurantId: 1, dishId: 1 }, { unique: true });

export const Recipe = mongoose.model<IRecipe>('Recipe', RecipeSchema);
