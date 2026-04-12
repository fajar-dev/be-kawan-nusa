import { EducationCategory } from "../entities/education-category.entity";

export class EducationCategorySerializer {
    static single(item: EducationCategory) {
        return {
            id: item.id,
            name: item.name
        }
    }

    static collection(items: EducationCategory[]) {
        return items.map(item => this.single(item))
    }
}
