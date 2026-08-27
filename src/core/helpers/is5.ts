import axios, { AxiosInstance } from "axios"
import { config } from "../../config/config"

export class Is5Helper {
    private readonly http: AxiosInstance = axios.create({
        baseURL: config.is5.apiUrl,
        headers: {
            'X-Api-Key': config.is5.apiKey,
        },
    })

    async uploadAttachment(
        file: File | Blob | Buffer,
        type: 'foto-npwp' | 'foto-identitas',
        fileName?: string,
        contentType?: string,
    ): Promise<any> {
        const formData = new FormData()

        if (file instanceof Blob || file instanceof File) {
            formData.append('partner_attachment', file, fileName)
        } else if (Buffer.isBuffer(file)) {
            // IS5 validates the attachment's MIME type (jpg/jpeg/png/bmp), so the Blob
            // must carry the original content-type — an untyped Blob is rejected even
            // when the bytes and filename extension are a valid image.
            const blob = new Blob([file as any], contentType ? { type: contentType } : undefined)
            formData.append('partner_attachment', blob, fileName ?? 'attachment')
        } else {
            formData.append('partner_attachment', file as any, fileName)
        }

        formData.append('attachment_type', type)

        const res = await this.http.post<any>('/api/v2/client/partners/attachments', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
        return res?.data?.data.attachment_id
    }

    async addPartner(
        name: string,
        phone: string,
        bankAccount: string,
        address: string,
        bankAccountNo: string,
        bankAccountName: string,
        identityPhoto: number,
    ): Promise<any[]> {
        const res = await this.http.post<any>('/api/v2/client/partners', {
            partner_type: 'referral',
            name,
            phone,
            rekening_bank: bankAccount,
            address,
            rekening_no: bankAccountNo,
            rekening_name: bankAccountName,
            foto_identitas: identityPhoto,
        }, {
            headers: {
                'Content-Type': 'application/json',
            },
        })

        return res.data
    }
}

export const is5Helper = new Is5Helper()

