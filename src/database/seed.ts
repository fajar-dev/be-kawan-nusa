import { AppDataSource } from "../config/database";
import fs from "fs";
import path from "path";

async function seed() {
    try {
        console.log("Starting database seeding...");
        
        await AppDataSource.initialize();
        console.log("Database connected successfully.");

        const seedersDir = path.join(process.cwd(), "database/seeders");
        const seedFiles = [
            "users_seeder.sql",
            "catalog_seeder.sql",
            "education_seeder.sql",
            "template_promotion_seeder.sql",
            "customers_seeder.sql",
            "redemption_seeder.sql"
        ];

        for (const file of seedFiles) {
            const filePath = path.join(seedersDir, file);
            
            if (!fs.existsSync(filePath)) {
                console.warn(`Warning: File ${file} not found, skipping.`);
                continue;
            }

            console.log(`Executing ${file}...`);
            const sql = fs.readFileSync(filePath, "utf8");
            
            await AppDataSource.query(sql);
            console.log(`Completed ${file}.`);
        }

        console.log("Database seeding completed successfully.");
        await AppDataSource.destroy();
        process.exit(0);
    } catch (error) {
        console.error("Database seeding failed:");
        console.error(error);
        process.exit(1);
    }
}

seed();
