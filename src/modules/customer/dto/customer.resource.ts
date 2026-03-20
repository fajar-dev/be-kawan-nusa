import { Customer } from "../entities/customer.entity"

export class CustomerResource {
    static single(customer: Customer) {
        return {
            id: customer.id,
            name: customer.name,
            company: customer.company,
            type: customer.type,
            activationDate: customer.activationDate,
            registrationDate: customer.registrationDate,
            salesName: customer.salesName,
            isActive: customer.isActive,
            ...(customer.phones && {
                phones: customer.phones.map(p => ({
                    id: p.id,
                    phone: p.phone,
                    label: p.label
                }))
            }),
            ...(customer.emails && {
                emails: customer.emails.map(e => ({
                    id: e.id,
                    email: e.email,
                    label: e.label
                }))
            }),
            ...(customer.addresses && {
                addresses: customer.addresses.map(a => ({
                    id: a.id,
                    address: a.address,
                    label: a.label
                }))
            })
        }
    }

    static collection(customers: Customer[]) {
        return customers.map(customer => this.single(customer))
    }
}
