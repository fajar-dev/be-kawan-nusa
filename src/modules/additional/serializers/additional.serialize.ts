export class AdditionalSerializer {
    static single(service: any) {
        return {
            code: service.code,
            name: service.name
        }
    }

    static collection(services: any[]) {
        return services.map(service => this.single(service))
    }
}
