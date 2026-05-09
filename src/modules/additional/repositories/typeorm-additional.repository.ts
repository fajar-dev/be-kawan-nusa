import { AppDataSource } from "../../../config/database"
import { IAdditionalRepository, SearchResult } from "../interfaces/additional.repository.interface"

export class TypeOrmAdditionalRepository implements IAdditionalRepository {
    async search(q: string, userId?: number): Promise<SearchResult[]> {
        let customerQuery =
            "SELECT id as title, 'Customer' as module, CONCAT('/customer/', id) as route FROM customers WHERE id LIKE ? OR name LIKE ?"
        let params: any[] = [`%${q}%`, `%${q}%`]

        if (userId) {
            customerQuery = `
                SELECT DISTINCT c.id as title, 'customer' as module, CONCAT('/customer/', c.id) as route
                FROM customers c
                INNER JOIN customer_services cs ON c.id = cs.customer_id
                WHERE cs.user_id = ? AND (c.id LIKE ? OR c.name LIKE ?)
            `
            params = [userId, `%${q}%`, `%${q}%`]
        }

        const query = `
            ${customerQuery}
            UNION ALL
            SELECT name as title, 'service' as module, CONCAT('/service/', code) as route FROM services WHERE name LIKE ? OR code LIKE ?
            UNION ALL
            SELECT title as title, 'educationArticle' as module, CONCAT('/education/article/', id) as route FROM education_articles WHERE title LIKE ?
            UNION ALL
            SELECT title as title, 'educationVideo' as module, CONCAT('/education/video/', id) as route FROM education_videos WHERE title LIKE ?
            LIMIT 20
        `

        const searchVal = `%${q}%`
        params.push(searchVal, searchVal, searchVal, searchVal)

        return await AppDataSource.query(query, params)
    }
}
