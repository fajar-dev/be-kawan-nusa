import { GoogleSpreadsheet } from 'google-spreadsheet'
import { JWT } from 'google-auth-library'
import { config } from '../../config/config'

export class GoogleSheetsHelper {
    private doc: GoogleSpreadsheet

    constructor(spreadsheetId?: string) {
        const id = spreadsheetId || config.googleSheet.spreadsheetId
        if (!id) {
            throw new Error('Google Spreadsheet ID is required')
        }
        if (!config.googleSheet.serviceAccountEmail || !config.googleSheet.privateKey) {
            throw new Error('Google Service Account Email and Private Key are required')
        }

        const serviceAccountAuth = new JWT({
            email: config.googleSheet.serviceAccountEmail,
            key: config.googleSheet.privateKey,
            scopes: [
                'https://www.googleapis.com/auth/spreadsheets.readonly',
                // Use .readonly for crawling, remove .readonly if you need to write
            ],
        })

        this.doc = new GoogleSpreadsheet(id, serviceAccountAuth)
    }

    /**
     * Load document information (sheets, title, etc)
     */
    public async loadInfo() {
        await this.doc.loadInfo()
    }

    /**
     * Get the title of the document
     */
    public get title() {
        return this.doc.title
    }

    /**
     * Get all sheet titles in the document
     */
    public async getAllSheetTitles(): Promise<string[]> {
        await this.loadInfo()
        return this.doc.sheetsByIndex.map(sheet => sheet.title)
    }

    /**
     * Get raw values (without header mapping) from a specific sheet index (0-based)
     */
    public async getRawRows(sheetIndex: number = 0): Promise<any[][]> {
        await this.loadInfo()
        const sheet = this.doc.sheetsByIndex[sheetIndex]
        if (!sheet) throw new Error(`Sheet at index ${sheetIndex} not found`)

        // Using direct API request to bypass google-spreadsheet header enforcement
        const authClient = (this.doc as any).auth || (this.doc as any).jwtClient
        if (!authClient) throw new Error("Could not find auth client to make raw request")

        const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.doc.spreadsheetId}/values/'${sheet.title}'`
        const res = await authClient.request({ url })
        return (res.data as any).values || []
    }

    /**
     * Get raw values from a specific sheet title
     */
    public async getRawRowsByTitle(title: string): Promise<any[][]> {
        await this.loadInfo()
        const sheet = this.doc.sheetsByTitle[title]
        if (!sheet) throw new Error(`Sheet with title "${title}" not found`)

        const authClient = (this.doc as any).auth || (this.doc as any).jwtClient
        if (!authClient) throw new Error("Could not find auth client to make raw request")

        const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.doc.spreadsheetId}/values/'${title}'`
        const res = await authClient.request({ url })
        return (res.data as any).values || []
    }
}
