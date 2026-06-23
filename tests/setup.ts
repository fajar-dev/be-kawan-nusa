import { beforeAll, afterAll } from "bun:test"
import { AppDataSource } from "../src/config/database"

beforeAll(async () => {
    // Ensure DB is connected for integration tests
    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize()
    }
})

afterAll(async () => {
    if (AppDataSource.isInitialized) {
        await AppDataSource.destroy()
    }
})
