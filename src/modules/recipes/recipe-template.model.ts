import mongoose, { Document, Schema } from 'mongoose';

export interface IRecipeTemplateItem {
  name: string;
  quantity: number;
  unit: string;
}

export interface IRecipeTemplate extends Document {
  dishName: string;
  normalizedDishName: string;
  aliases: string[];
  category: string;
  cuisine: string;
  servingUnit: string;
  ingredients: IRecipeTemplateItem[];
  isActive: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const RecipeTemplateItemSchema = new Schema<IRecipeTemplateItem>({
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0.001 },
  unit: { type: String, required: true },
}, { _id: false });

const RecipeTemplateSchema = new Schema<IRecipeTemplate>(
  {
    dishName: { type: String, required: true },
    normalizedDishName: { type: String, required: true, unique: true },
    aliases: [{ type: String }],
    category: { type: String, required: true },
    cuisine: { type: String },
    servingUnit: { type: String, default: '1 serving' },
    ingredients: [RecipeTemplateItemSchema],
    isActive: { type: Boolean, default: true },
    version: { type: Number, default: 1 }
  },
  { timestamps: true }
);

// Indexes for fast searching
RecipeTemplateSchema.index({ normalizedDishName: 1 });
RecipeTemplateSchema.index({ aliases: 1 });

export const RecipeTemplate = mongoose.model<IRecipeTemplate>('RecipeTemplate', RecipeTemplateSchema);
