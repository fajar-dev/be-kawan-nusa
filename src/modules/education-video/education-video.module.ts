import { TypeOrmEducationVideoRepository } from "./repositories/typeorm-education-video.repository"
import { EducationVideoService } from "./education-video.service"
import { EducationVideoController } from "./education-video.controller"

const educationVideoRepository = new TypeOrmEducationVideoRepository()
const educationVideoService = new EducationVideoService(educationVideoRepository)

export const educationVideoController = new EducationVideoController(educationVideoService)
