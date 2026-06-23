import { TypeOrmEducationVideoRepository } from "./repositories/typeorm-education-video.repository"
import { EducationVideoService } from "./education-video.service"
import { EducationVideoController } from "./education-video.controller"

const repository = new TypeOrmEducationVideoRepository()
const service = new EducationVideoService(repository)
export const educationVideoController = new EducationVideoController(service)
