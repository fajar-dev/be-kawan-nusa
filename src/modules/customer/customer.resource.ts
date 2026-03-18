import { Customer } from "./customer.entity"

export class CustomerResource {
    static single(customer: Customer) {
        return {
            id: customer.id,
            name: customer.name,
            company: customer.company || "N/A",
            category: customer.category || "N/A",
            registration_date: customer.registrationDate?.toISOString().split('T')[0] || null,
            activation_date: customer.activationDate?.toISOString().split('T')[0] || null,
            sales_name: customer.salesName || "N/A",
            is_active: customer.isActive,
            phones: customer.phones ? customer.phones.map(p => ({
                id: p.id,
                phone: p.phone,
                label: p.label || "N/A"
            })) : [],
            emails: customer.emails ? customer.emails.map(e => ({
                id: e.id,
                email: e.email,
                label: e.label || "N/A"
            })) : [],
            created_at: customer.createdAt.toISOString(),
            updated_at: customer.updatedAt.toISOString(),
        }
    }

    static collection(customers: Customer[]) {
        return customers.map(customer => this.single(customer))
    }
}
