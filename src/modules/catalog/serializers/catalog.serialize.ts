import { Catalog } from "../entities/catalog.entity";

export class CatalogSerializer {
    static single(item: any) {
        return {
            id: Number(item.id),
            categoryId: Number(item.categoryId),
            name: item.name,
            description: item.description,
            point: Number(item.point),
            image: item.image,
            expiredDate: item.expiredDate,
            category: item.category ? {
                id: item.category.id,
                name: item.category.name
            } : null
        }
    }

    static collection(items: Catalog[]) {
        return items.map(item => this.single(item))
    }
}
