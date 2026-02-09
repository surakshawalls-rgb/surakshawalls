// src/app/services/recipe.service.ts
import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface ProductRecipe {
  id: string;
  product_name: string;
  product_variant: string | null;
  mold_volume_cuft: number;
  dry_volume_cuft: number;
  cement_bags_per_unit: number;
  aggregates_cft_per_unit: number;
  sariya_kg_per_unit: number;
  active: boolean;
  notes?: string;
}

export interface MaterialCost {
  material_name: string;
  unit: string;
  current_stock: number;
  unit_cost: number;
}

export interface MaterialCalculation {
  product_name: string;
  product_variant: string | null;
  quantity: number;
  materials: {
    cement: number;
    aggregates: number;
    sariya: number;
  };
  costs: {
    cement_cost: number;
    aggregates_cost: number;
    sariya_cost: number;
    total_cost: number;
  };
  cost_per_unit: number;
  stock_check: {
    cement_available: boolean;
    aggregates_available: boolean;
    sariya_available: boolean;
    all_available: boolean;
  };
  current_stock: {
    cement: number;
    aggregates: number;
    sariya: number;
  };
}

@Injectable({ providedIn: 'root' })
export class RecipeService {

  constructor(private supabase: SupabaseService) {}

  /**
   * Get all active recipes
   */
  async getRecipes(): Promise<ProductRecipe[]> {
    console.log('[RecipeService] getRecipes called');
    const { data, error } = await this.supabase.supabase
      .from('product_recipes')
      .select('*')
      .eq('active', true)
      .order('product_name', { ascending: true });

    if (error) {
      console.error('[RecipeService] getRecipes error:', error);
      throw error;
    }

    console.log('[RecipeService] getRecipes data:', data);
    return data || [];
  }

  /**
   * Get recipe by product name and variant
   */
  async getRecipe(productName: string, variant: string | null = null): Promise<ProductRecipe | null> {
    let query = this.supabase.supabase
      .from('product_recipes')
      .select('*')
      .eq('product_name', productName)
      .eq('active', true);

    if (variant) {
      query = query.eq('product_variant', variant);
    } else {
      query = query.is('product_variant', null);
    }

    const { data, error } = await query.single();

    if (error) {
      console.error('[RecipeService] getRecipe error:', error);
      return null;
    }

    return data;
  }

  /**
   * Get current material costs and stock levels
   */
  async getMaterialCosts(): Promise<Record<string, MaterialCost>> {
    const { data, error } = await this.supabase.supabase
      .from('raw_materials_master')
      .select('material_name, unit, current_stock, unit_cost')
      .eq('active', true);

    if (error) {
      console.error('[RecipeService] getMaterialCosts error:', error);
      throw error;
    }

    // Convert to map for easy lookup
    const costMap: Record<string, MaterialCost> = {};
    data?.forEach((item: MaterialCost) => {
      costMap[item.material_name] = item;
    });

    return costMap;
  }

  /**
   * Calculate materials needed for production
   * Uses 3:1 ratio (1 cement : 3 aggregates) with 1.7 conversion factor
   */
  async calculateMaterialsNeeded(
    productName: string,
    variant: string | null,
    quantity: number
  ): Promise<MaterialCalculation | null> {
    try {
      // 1. Get recipe
      const recipe = await this.getRecipe(productName, variant);
      if (!recipe) {
        throw new Error(`Recipe not found for ${productName} ${variant || ''}`);
      }

      // 2. Get material costs
      const materialCosts = await this.getMaterialCosts();

      // 3. Calculate materials (recipe × quantity)
      const cement = recipe.cement_bags_per_unit * quantity;
      const aggregates = recipe.aggregates_cft_per_unit * quantity;
      const sariya = recipe.sariya_kg_per_unit * quantity;

      // 4. Calculate costs
      const cementCost = cement * (materialCosts['Cement']?.unit_cost || 0);
      const aggregatesCost = aggregates * (materialCosts['Aggregates']?.unit_cost || 0);
      const sariyaCost = sariya * (materialCosts['Sariya (4mm)']?.unit_cost || 0);
      const totalCost = cementCost + aggregatesCost + sariyaCost;

      // 5. Check stock availability
      const cementStock = materialCosts['Cement']?.current_stock || 0;
      const aggregatesStock = materialCosts['Aggregates']?.current_stock || 0;
      const sariyaStock = materialCosts['Sariya (4mm)']?.current_stock || 0;

      const cementAvailable = cementStock >= cement;
      const aggregatesAvailable = aggregatesStock >= aggregates;
      const sariyaAvailable = sariyaStock >= sariya;

      return {
        product_name: productName,
        product_variant: variant,
        quantity,
        materials: {
          cement,
          aggregates,
          sariya
        },
        costs: {
          cement_cost: cementCost,
          aggregates_cost: aggregatesCost,
          sariya_cost: sariyaCost,
          total_cost: totalCost
        },
        cost_per_unit: totalCost / quantity,
        stock_check: {
          cement_available: cementAvailable,
          aggregates_available: aggregatesAvailable,
          sariya_available: sariyaAvailable,
          all_available: cementAvailable && aggregatesAvailable && sariyaAvailable
        },
        current_stock: {
          cement: cementStock,
          aggregates: aggregatesStock,
          sariya: sariyaStock
        }
      };

    } catch (error) {
      console.error('[RecipeService] calculateMaterialsNeeded error:', error);
      return null;
    }
  }

  /**
   * Get product list with variants
   */
  async getProductList(): Promise<Array<{product_name: string, variants: string[]}>> {
    console.log('[RecipeService] getProductList called');
    const recipes = await this.getRecipes();
    console.log('[RecipeService] Recipes for product list:', recipes);
    
    const productMap = new Map<string, Set<string>>();
    
    recipes.forEach(recipe => {
      // Create entry for product if it doesn't exist
      if (!productMap.has(recipe.product_name)) {
        productMap.set(recipe.product_name, new Set());
      }
      // Add variant if it exists (null variants will have empty set)
      if (recipe.product_variant) {
        productMap.get(recipe.product_name)?.add(recipe.product_variant);
      }
    });

    // Convert map to array with product name and variants
    const result = Array.from(productMap.entries()).map(([product_name, variantSet]) => ({
      product_name,
      variants: Array.from(variantSet)
    }));
    
    console.log('[RecipeService] Product list result:', result);
    return result;
  }

  /**
   * Get recipe display name (for UI)
   */
  getRecipeDisplayName(productName: string, variant: string | null): string {
    if (variant) {
      return `${productName} (${variant})`;
    }
    return productName;
  }
}
