export interface SearchResult {
    title: string
    module: string
    route: string
}

export interface IAdditionalRepository {
    search(q: string, userId?: number): Promise<SearchResult[]>
}
