import { CustomerAddress } from "../entities/customer-address.entity"
import { Customer } from "../entities/customer.entity"

export class CustomerAddressResource {
    static single(customerAddress: CustomerAddress) {
        return {
            id: customerAddress.id,
            address: customerAddress.address,
            label: customerAddress.label
        }
    }

    static collection(customerAddresses: CustomerAddress[]) {
        return customerAddresses.map(customerAddress => this.single(customerAddress))
    }
}
