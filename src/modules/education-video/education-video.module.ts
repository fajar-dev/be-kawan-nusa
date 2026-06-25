import { EducationVideoRepository } from "./repositories/education-video.repository"
import { EducationVideoService } from "./education-video.service"
import { EducationVideoController } from "./education-video.controller"

const repository = new EducationVideoRepository()
const service = new EducationVideoService(repository)
export const educationVideoController = new EducationVideoController(service)
