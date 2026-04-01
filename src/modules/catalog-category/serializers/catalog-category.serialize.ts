import { CatalogCategory } from "../entities/catalog-category.entity";

export class CatalogCategorySerializer {
    static single(item: CatalogCategory) {
        return {
            id: item.id,
            name: item.name
        }
    }

    static collection(items: CatalogCategory[]) {
        return items.map(item => this.single(item))
    }
}
