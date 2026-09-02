import { Branch } from "../entities/branch.entity"

export class BranchSerializer {
    static single(item: Branch) {
        return {
            id: item.id,
            code: item.code,
            name: item.name,
        }
    }

    static collection(items: Branch[]) {
        return items.map(item => this.single(item))
    }
}
