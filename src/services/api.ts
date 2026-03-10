import { lunarCrushCategories } from '../mocks/topics';
import type { LunarCrushCategory } from '../types';

export async function fetchCategories(): Promise<LunarCrushCategory[]> {
    try {
        const response = await fetch('https://lunarcrush.com/api4/public/categories/list/v1');
        if (!response.ok) {
            console.warn('LunarCrush API fetch failed with status:', response.status);
            return lunarCrushCategories;
        }

        const data = await response.json();

        // Map the API response to our LunarCrushCategory interface.
        // We'll map the category name to a generic icon/group if not matched.
        if (data && Array.isArray(data.data)) {
            return data.data.map((item: Record<string, string>) => {
                // Try to find a hardcoded match for icon and group
                const match = lunarCrushCategories.find(c => c.category === item.category);
                return {
                    category: item.category,
                    title: item.title || item.category,
                    icon: match?.icon || 'analytics',
                    group: match?.group || 'other'
                };
            });
        }

        return lunarCrushCategories;
    } catch (error) {
        console.error('Error fetching LunarCrush categories:', error);
        return lunarCrushCategories;
    }
}
