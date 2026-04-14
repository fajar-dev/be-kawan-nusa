import { Repository } from "typeorm"
import { CustomerType } from "../customer/customer.enum"
import { CustomerServiceStatus } from "../customer-service/customer-service.enum"
import { RewardPointType } from "../reward/reward.enum"
import { ServiceCategory } from "../service/service.enum"

export class AdditionalService {
    async getServiceCategories() {
        return Object.entries(ServiceCategory).map(([key, value]) => ({
            code: key,
            name: value
        }))
    }
    async getCustomerTypes() {
        return Object.entries(CustomerType)
            .map(([key, value]) => ({
                code: key,
                name: value
            }))
            .sort((a, b) => a.name.localeCompare(b.name))
    }

    async getCustomerServiceStatus() {
        return Object.entries(CustomerServiceStatus).map(([key, value]) => ({
            code: key,
            name: value
        }))
    }

    async getRewardPointTypes() {
        return Object.entries(RewardPointType).map(([key, value]) => ({
            code: key,
            name: value
        }))
    }

    async search(q: string, userId?: number) {
        let customerQuery = "SELECT id as title, 'Customer' as module, CONCAT('/customer/', id) as route FROM customers WHERE id LIKE ? OR name LIKE ?";
        let params: any[] = [`%${q}%`, `%${q}%`];

        if (userId) {
            customerQuery = `
                SELECT DISTINCT c.id as title, 'customer' as module, CONCAT('/customer/', c.id) as route 
                FROM customers c
                INNER JOIN customer_services cs ON c.id = cs.customer_id
                WHERE cs.user_id = ? AND (c.id LIKE ? OR c.name LIKE ?)
            `;
            params = [userId, `%${q}%`, `%${q}%`];
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
        `;
        
        const searchVal = `%${q}%`;
        params.push(searchVal, searchVal, searchVal, searchVal);
        
        const { AppDataSource } = await import("../../config/database");
        return await AppDataSource.query(query, params);
    }
}
