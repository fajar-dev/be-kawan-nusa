import { FeedbackService } from "./feedback.service"
import { FeedbackController } from "./feedback.controller"

const service = new FeedbackService()
export const feedbackController = new FeedbackController(service)
