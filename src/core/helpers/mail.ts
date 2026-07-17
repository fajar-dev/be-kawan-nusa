import { transporter } from "../../config/smtp"
import { config } from "../../config/config"
import { logger } from "./logger"

interface MailPayload {
    to: string;
    subject: string;
    text?: string;
    html?: string;
}

export class Mail {
    /**
     * Internal method to send email via SMTP
     * Handles centering of logic, logging, and error handling.
     */
    private async transmit(payload: MailPayload) {
        const { to, subject, text, html } = payload

        try {
            const info = await transporter.sendMail({
                from: config.mail.from,
                to,
                subject,
                text: text || (html ? "Please view this email in an HTML-compatible client." : ""),
                html,
            })
            
            logger.info("Email sent", { event: "mail.sent", to, subject, messageId: info.messageId })
            return info
        } catch (error) {
            logger.error("Email send failed", { event: "mail.failed", to, subject, error: (error as Error).message })
            throw new Error(`Failed to send email to ${to}: ${(error as Error).message}`)
        }
    }

    /**
     * Send a plain text email via SMTP
     * @param to Recipient email address
     * @param subject Email subject
     * @param text Plain text content
     */
    async sendText(to: string, subject: string, text: string) {
        return this.transmit({ to, subject, text })
    }

    /**
     * Send an HTML email via SMTP
     * @param to Recipient email address
     * @param subject Email subject
     * @param html HTML content
     * @param text Optional plain text content fallback
     */
    async sendHtml(to: string, subject: string, html: string, text?: string) {
        return this.transmit({ to, subject, html, text })
    }
}

// Export a singleton instance
export const mail = new Mail()
export default mail