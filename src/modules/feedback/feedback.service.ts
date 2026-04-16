import * as fs from "node:fs"
import * as path from "node:path"
import { config } from "../../config/config"
import { FeedbackItem } from "./serializers/feedback.serialize"

export class FeedbackService {
    async store(userId: number, name: string, data: { message: string; type: string; url?: string }, imageFiles: File[]) {
        const uploadDir = path.join(process.cwd(), "public", "uploads", "feedback")

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true })
        }

        const timestamp = Date.now()
        const imageUrls: string[] = []

        for (let i = 0; i < imageFiles.length; i++) {
            const file = imageFiles[i]
            const rawExt = file.type.split("/")[1]
            const ext = rawExt === "jpeg" ? "jpg" : rawExt
            const filename = `feedback_${userId}_${timestamp}_${i}.${ext}`
            const filePath = path.join(uploadDir, filename)

            fs.writeFileSync(filePath, Buffer.from(await file.arrayBuffer()))
            imageUrls.push(`${config.app.appUrl}/api/uploads/feedback/${filename}`)
        }

        fetch(config.feedback.scriptUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId: String(userId),
                name,
                image: imageUrls,
                url: data.url ?? "",
                type: data.type,
                message: data.message,
            }),
        }).catch(() => {})

        return imageUrls
    }

    async getByUser(userId: number): Promise<FeedbackItem[]> {
        const response = await fetch(config.feedback.scriptUrl)
        if (!response.ok) {
            return []
        }

        const data = await response.json() as FeedbackItem[]
        return data.filter((item) => item.userId === String(userId))
    }
}
