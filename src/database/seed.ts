import { AppDataSource } from "../config/database";
import fs from "fs";
import path from "path";

async function seed() {
    try {
        console.log("🌱 Starting database seeding...");
        
        await AppDataSource.initialize();
        console.log("✅ Database connected.");

        const seedersDir = path.join(process.cwd(), "database/seeders");
        
        // Define order (same as master_seeder.sql)
        const seedFiles = [
            "users_seeder.sql",
            "catalog_seeder.sql",
            "education_seeder.sql",
            "template_promotion_seeder.sql",
            "customers_seeder.sql",
            "redemption_seeder.sql"
        ];

        for (const file of seedFiles) {
            console.log(`⏳ Seeding ${file}...`);
            const filePath = path.join(seedersDir, file);
            
            if (!fs.existsSync(filePath)) {
                console.warn(`⚠️  File ${file} not found, skipping.`);
                continue;
            }

            const sql = fs.readFileSync(filePath, "utf8");
            
            // Remove SOURCE lines if any (though they shouldn't be in the individual files)
            // Divide by semicolon but be careful with multi-line strings
            // A simpler way for Bun is to just execute the whole thing if the driver supports it
            // mysql2 supports multiple statements if enabled in connection options
            
            await AppDataSource.query(sql);
            console.log(`✅ ${file} completed.`);
        }

        console.log("✨ Seeding finished successfully!");
        await AppDataSource.destroy();
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:");
        console.error(error);
        process.exit(1);
    }
}

seed();
