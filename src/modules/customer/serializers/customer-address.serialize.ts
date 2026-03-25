import { CustomerAddress } from "../entities/customer-address.entity"

export class CustomerAddressSerializer {
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
