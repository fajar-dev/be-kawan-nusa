export interface FeedbackItem {
    timestamp: string
    userId: string
    name: string
    image: string[]
    url: string
    category: string
    message: string
    type: string
    reply: string
}

export class FeedbackSerializer {
    static single(item: FeedbackItem) {
        return {
            timestamp: item.timestamp,
            userId: item.userId,
            name: item.name,
            images: item.image,
            url: item.url,
            category: item.category,
            message: item.message,
            type: item.type,
            reply: item.reply,
        }
    }

    static collection(items: FeedbackItem[]) {
        return items.map((item) => this.single(item))
    }
}
