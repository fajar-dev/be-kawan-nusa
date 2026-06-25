import axios, { AxiosInstance } from "axios"
import { config } from "../../config/config"

interface NusaContactResponse {
    data: Record<string, unknown>[]
}

export class NusaContactHelper {
    private readonly http: AxiosInstance = axios.create({
        baseURL: config.nusaContact.apiUrl,
        headers: {
            'X-Api-Key': config.nusaContact.apiKey,
            'Content-Type': 'application/json',
        },
    })

    async sendOTP(to: string, otp: string): Promise<void> {
        try {
            await this.http.post<NusaContactResponse>(`/messages?phone_number_id=${config.nusaContact.phoneId}`, {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to,
                type: "template",
                template: {
                    name: "otp_kawan_nusa",
                    language: { code: "id" },
                    components: [
                        {
                            type: "body",
                            parameters: [{ type: "text", text: otp }],
                        },
                        {
                            type: "button",
                            sub_type: "url",
                            index: "0",
                            parameters: [{ type: "text", text: otp }],
                        },
                    ],
                },
            })
            console.log(`[NusaContact] OTP sent to ${to}`)
        } catch (error) {
            console.error(`[NusaContact] Failed to send OTP to ${to}:`, (error as Error).message)
            throw error
        }
    }
}

export const nusaContactHelper = new NusaContactHelper()
