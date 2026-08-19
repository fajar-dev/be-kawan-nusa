import type { EntityManager } from "typeorm"
import { AppDataSource } from "../../config/database"
import { NisHelper } from "./nis"
import { PointCalculator } from "./point"
import { PointType } from "../../modules/point/point.enum"
import { notificationService } from "../../modules/notification/notification.module"
import { NotificationType } from "../../modules/notification/notification.enum"

export interface PointSubmissionPayload {
    customerServiceId: number
    userId: number
    price: number
    point: number
    pointType: PointType
}

/**
 * Shared core of point-submission processing: sync the NIS account locally,
 * create the Point reward, then notify the referral partner. Used both for
 * the immediate attempt on approve (point-submission.service.ts) and by the
 * process-submissions cron job (retry path for whatever failed immediately).
 *
 * `withinTransaction` lets the caller piggyback extra writes (e.g. marking a
 * job_queues row processed) onto the same transaction as the Point insert,
 * so success is atomic with that bookkeeping.
 */
export async function createPointFromSubmission(
    pointSubmissionId: number,
    payload: PointSubmissionPayload,
    nisHelper: NisHelper,
    pointCalculator: PointCalculator,
    withinTransaction?: (manager: EntityManager) => Promise<void>,
): Promise<void> {
    const { customerServiceId, userId, price, point, pointType } = payload

    const syncResult = await nisHelper.syncAccountToLocal(customerServiceId, userId)
    if (!syncResult) {
        throw new Error(`Failed to sync NIS account for custServId ${customerServiceId}`)
    }

    await AppDataSource.transaction(async (manager) => {
        await pointCalculator.addPointsReward(manager, {
            customerServiceId: syncResult.customerServiceId,
            userId,
            price,
            point,
            remainingPoint: point,
            type: pointType,
            pointSubmissionId,
        })

        if (withinTransaction) {
            await withinTransaction(manager)
        }
    })

    await notificationService.safeNotifyUser(userId, {
        type: NotificationType.POINT,
        title: "Poin Baru",
        message: `${Number(point).toLocaleString("id-ID")} poin telah ditambahkan ke akun Anda.`,
        link: "/point/activity/reward",
    })
}
