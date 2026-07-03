import { EducationVideo } from "../entities/education-video.entity"

export interface EducationVideoListFilters {
    categoryId?: number
    q?: string
    currentUserId?: number
    isView?: boolean
    startDate?: string
    endDate?: string
}

export interface IEducationVideoRepository {
    findAll(
        page: number,
        limit: number,
        filters?: EducationVideoListFilters
    ): Promise<{ data: EducationVideo[]; total: number }>

    findById(id: number): Promise<EducationVideo | null>

    getViewedVideoIds(userId: number, videoIds: number[]): Promise<number[]>

    recordView(videoId: number, userId: number): Promise<void>

    hasViewed(videoId: number, userId: number): Promise<boolean>

    save(video: EducationVideo): Promise<EducationVideo>

    delete(id: number): Promise<void>
}
