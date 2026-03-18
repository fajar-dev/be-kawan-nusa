import { transporter } from "../../config/mail"
import { config } from "../../config/config"

class Mail {
    /**
     * Send a plain text email via SMTP
     * @param to Recipient email address
     * @param subject Email subject
     * @param text Plain text content
     */
    async sendText(to: string, subject: string, text: string) {
        try {
            const info = await transporter.sendMail({
                from: config.mail.from,
                to,
                subject,
                text,
            })
            
            console.log(`[Mail] Text message sent successfully to ${to} (ID: ${info.messageId})`)
            return info
        } catch (error) {
            console.error(`[Mail] Error sending text email to ${to}:`, error)
            throw new Error(`Failed to send text email to ${to}: ${(error as Error).message}`)
        }
    }

    /**
     * Send an HTML email via SMTP
     * @param to Recipient email address
     * @param subject Email subject
     * @param html HTML content
     * @param text Optional plain text content fallback
     */
    async sendHtml(to: string, subject: string, html: string, text?: string) {
        try {
            const info = await transporter.sendMail({
                from: config.mail.from,
                to,
                subject,
                html,
                text: text || "HTML is required to view this email.",
            })
            
            console.log(`[Mail] HTML message sent successfully to ${to} (ID: ${info.messageId})`)
            return info
        } catch (error) {
            console.error(`[Mail] Error sending HTML email to ${to}:`, error)
            throw new Error(`Failed to send HTML email to ${to}: ${(error as Error).message}`)
        }
    }
}

// Export a singleton instance
export const mail = new Mail()
export default mail
