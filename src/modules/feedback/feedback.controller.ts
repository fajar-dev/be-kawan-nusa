import { Context } from "hono"
import { FeedbackService } from "./feedback.service"
import { ApiResponse } from "../../core/helpers/response"
import { FeedbackSerializer } from "./serializers/feedback.serialize"

export class FeedbackController {
    constructor(private readonly service: FeedbackService) {}

    async index(c: Context) {
        const user = c.get("user")
        const role = c.get("role") as string
        const source = role === "admin" ? 'internal' : 'eksternal'
        const data = await this.service.getByUser(user.id, source)
        return ApiResponse.success(c, await FeedbackSerializer.collection(data), "Feedback retrieved successfully")
    }

    async store(c: Context) {
        const user = c.get("user")
        const role = c.get("role") as string

        const body = await c.req.parseBody({ all: true })

        const message = body["message"] as string
        const type = body["type"] as string
        const url = body["url"] as string | undefined

        const raw = body["images[]"]
        const imageFiles: File[] = Array.isArray(raw) ? (raw as File[]) : [raw as File]

        await this.service.store(
            user.id,
            `${user.name}`,
            role === "admin" ? 'internal' : 'eksternal',
            { message, type, url },
            imageFiles
        )

        return ApiResponse.success(c, null, "Feedback submitted successfully", 201)
    }
}
