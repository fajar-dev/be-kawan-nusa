/**
 * Queue type constants.
 * Add new types here when other modules need the queue.
 */
export const QueueType = {
    POINT_SUBMISSION: "point-submission",
} as const

export type QueueType = (typeof QueueType)[keyof typeof QueueType]
