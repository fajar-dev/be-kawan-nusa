import PDFDocument from 'pdfkit'
import { Redemption } from '../../modules/redemption/entities/redemption.entity'

const GREEN = '#4a7c3f'
const GREEN_BG = '#eef4ec'
const DARK = '#1c1c1c'
const GRAY = '#6b7280'
const BORDER = '#d1d5db'
const TABLE_HDR_BG = '#f5f5f5'
const M = 30

const fmtRp = (v: number) => `Rp. ${Number(v).toLocaleString('id-ID')}`

const fmtDate = (d: Date | string) => {
    const dt = new Date(d)
    const mo = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des']
    const day = String(dt.getDate()).padStart(2, '0')
    return `${day} ${mo[dt.getMonth()]} ${dt.getFullYear()}`
}

const fmtDateTime = (d: Date | string) => {
    const dt = new Date(d)
    const mo = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des']
    const day = String(dt.getDate()).padStart(2, '0')
    const h = String(dt.getHours()).padStart(2, '0')
    const mn = String(dt.getMinutes()).padStart(2, '0')
    return `${day} ${mo[dt.getMonth()]} ${dt.getFullYear()} - ${h}:${mn}`
}

export const generateWithdrawalNote = (redemption: Redemption): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 0, size: 'A4' })
        const chunks: Buffer[] = []

        doc.on('data', (chunk) => chunks.push(chunk))
        doc.on('end', () => resolve(Buffer.concat(chunks)))
        doc.on('error', (err) => reject(err))

        const fontUrls = {
            'Montserrat-400': 'https://cdn.jsdelivr.net/fontsource/fonts/montserrat@latest/latin-400-normal.ttf',
            'Montserrat-500': 'https://cdn.jsdelivr.net/fontsource/fonts/montserrat@latest/latin-500-normal.ttf',
            'Montserrat-600': 'https://cdn.jsdelivr.net/fontsource/fonts/montserrat@latest/latin-600-normal.ttf',
            'Montserrat-700': 'https://cdn.jsdelivr.net/fontsource/fonts/montserrat@latest/latin-700-normal.ttf',
            'Montserrat-800': 'https://cdn.jsdelivr.net/fontsource/fonts/montserrat@latest/latin-800-normal.ttf',
        }

        const setupFonts = async () => {
            try {
                const results = await Promise.all(
                    Object.entries(fontUrls).map(async ([name, url]) => {
                        const res = await fetch(url)
                        const buffer = await res.arrayBuffer()
                        return { name, buffer: Buffer.from(buffer) }
                    })
                )
                results.forEach(item => doc.registerFont(item.name, item.buffer))
                return true
            } catch (e) {
                console.error('Failed to fetch Montserrat fonts, falling back to Helvetica:', e)
                return false
            }
        }

        setupFonts().then((hasMontserrat) => {
            const PAGE_W = doc.page.width
            const PAGE_H = doc.page.height
            const CW = PAGE_W - M * 2

            const fontReg = hasMontserrat ? 'Montserrat-400' : 'Helvetica'
            const fontBold = hasMontserrat ? 'Montserrat-700' : 'Helvetica-Bold'
            const fontMedium = hasMontserrat ? 'Montserrat-500' : 'Helvetica-Bold'
            const fontSemiBold = hasMontserrat ? 'Montserrat-600' : 'Helvetica-Bold'

            const withdrawDetail = redemption.withdrawRedemption
            if (!withdrawDetail) {
                console.error('Withdrawal details missing for redemption note')
            }

            const gross = redemption.pointsUsed * 1000
            const tax = withdrawDetail ? Number(withdrawDetail.tax) : 0
            const net = withdrawDetail ? Number(withdrawDetail.payout) : 0

            const yy = String(new Date(redemption.createdAt).getFullYear()).slice(-2)
            const mm = String(new Date(redemption.createdAt).getMonth() + 1).padStart(2, '0')
            const seq = String(redemption.id).padStart(4, '0')
            const nomor = `MDI/${yy}/${mm}/SV/${seq}/SD`
            const terbit = fmtDate(redemption.createdAt)

            // Header Box
            const HM = 20
            const HX = HM - 8, HY = 11, HW = PAGE_W - (HM * 2) + 14, HH = 100
            doc.roundedRect(HX, HY, HW, HH, 7).fill(GREEN_BG)

            const midY = HY + (HH / 2)

            // Left Content: Title & Subtitle
            const textBlockH = 19 + 7 + 9
            const textY = midY - (textBlockH / 2)
            doc.font(fontSemiBold).fontSize(19).fillColor(GREEN)
                .text('Nota Penarikan Komisi', HX + 20, textY, { lineBreak: false })
            doc.font(fontMedium).fontSize(9).fillColor(GRAY)
                .text(`Nomor : ${nomor}   Terbit: ${terbit}`, HX + 20, textY + 26, { lineBreak: false })

            // Right Content: Logo & Tagline
            const logoBlockH = 20 + 8 + 6.3
            const logoY = midY - (logoBlockH / 2)
            doc.font(fontBold).fontSize(18)
            const kW = doc.widthOfString('kawan  ')
            const nW = doc.widthOfString('nusa ')
            const TAG = 'Portal Referral PT Media Antar Nusa'
            doc.font(fontReg).fontSize(6.3)
            const tagW = doc.widthOfString(TAG)
            const logoBlockW = Math.max(kW + nW, tagW)
            const LX = HX + HW - logoBlockW - 20

            doc.font(fontBold).fontSize(20).fillColor(DARK)
                .text('kawan  ', LX, logoY, { lineBreak: false })
            doc.font(fontBold).fontSize(20).fillColor(GREEN)
                .text('nusa', LX + kW, logoY, { lineBreak: false })
            doc.font(fontReg).fontSize(6.61).fillColor(DARK)
                .text(TAG, LX, logoY + 28, { width: logoBlockW, lineBreak: false })

            // Identity Section
            doc.y = HY + HH + 25
            const COLON_X = M + 162
            const VAL_X = M + 175

            const drawRow = (label: string, value: string) => {
                const currentY = doc.y
                doc.font(fontMedium).fontSize(11).fillColor(DARK)
                    .text(label, M, currentY, { lineBreak: false, width: 150 })
                doc.font(fontReg).fontSize(11).fillColor(DARK)
                    .text(':', COLON_X, currentY, { lineBreak: false })
                doc.font(fontReg).fontSize(11).fillColor(DARK)
                    .text(value, VAL_X, currentY, { width: CW - (VAL_X - M) })
                doc.moveDown(0.5)
            }

            const name = [redemption.user?.firstName, redemption.user?.lastName].filter(Boolean).join(' ')
            drawRow('Nama', name)
            drawRow('Nama Pemilik Rekening', withdrawDetail?.accountHolderName || '-')
            drawRow('Nomor Rekening', withdrawDetail?.accountNumber || '-')
            drawRow('Nama Bank', withdrawDetail?.bankName || '-')
            let y = doc.y + 12

            // Table
            const TW = CW
            const COLS = [140, 85, 115, 105, TW - 140 - 85 - 115 - 105]
            const HEADS = ['Waktu', 'Poin Ditarik', 'Poin Ditarik (Rp)', 'PPH (2,5%)', 'Ditransfer']
            const HRH = 27, DRH = 25

            doc.rect(M, y, TW, HRH).fill(TABLE_HDR_BG)
            doc.rect(M, y, TW, HRH).strokeColor(BORDER).lineWidth(0.5).stroke()

            let cx = M
            for (let i = 0; i < HEADS.length; i++) {
                doc.font(fontMedium).fontSize(10).fillColor(DARK)
                    .text(HEADS[i], cx + 9, y + 9, { width: COLS[i] - 14, align: 'left', lineBreak: false })
                cx += COLS[i]
                if (i < HEADS.length - 1) {
                    doc.moveTo(cx, y).lineTo(cx, y + HRH).strokeColor(BORDER).lineWidth(0.5).stroke()
                }
            }
            y += HRH

            doc.rect(M, y, TW, DRH).fill('#ffffff')
            doc.rect(M, y, TW, DRH).strokeColor(BORDER).lineWidth(0.5).stroke()

            const VALS = [
                fmtDateTime(redemption.createdAt),
                String(redemption.pointsUsed),
                fmtRp(gross),
                fmtRp(tax),
                fmtRp(net),
            ]

            cx = M
            for (let i = 0; i < VALS.length; i++) {
                doc.font(fontReg).fontSize(11).fillColor(DARK)
                    .text(VALS[i], cx + 9, y + 8, { width: COLS[i] - 14, align: 'left', lineBreak: false })
                cx += COLS[i]
                if (i < HEADS.length - 1) {
                    doc.moveTo(cx, y).lineTo(cx, y + DRH).strokeColor(BORDER).lineWidth(0.5).stroke()
                }
            }

            // Footer
            const NOTES = [
                'Nota penarikan komisi merupakan dokumen resmi yang diterbitkan secara digital oleh sistem sebagai bukti bahwa referral telah melakukan penarikan sejumlah poin atau komisi melalui portal mitra.',
                'Poin dikonversi ke rupiah dengan nilai Rp1.000 untuk setiap 1 poin.',
                'Nominal yang ditransfer merupakan hasil konversi poin ke rupiah setelah dikurangi PPh sebesar 2,5%.',
                'Dokumen ini tidak memerlukan tanda tangan & stempel karena dicetak secara komputerisasi.',
            ]

            const FY = PAGE_H - 150
            doc.moveTo(M, FY).lineTo(PAGE_W - M, FY).strokeColor(BORDER).lineWidth(0.5).stroke()

            doc.y = FY + 16
            for (let i = 0; i < NOTES.length; i++) {
                const cy = doc.y
                doc.font(fontReg).fontSize(11).fillColor(DARK).text(`${i + 1}.`, M, cy, { lineBreak: false })
                doc.font(fontReg).fontSize(11).fillColor(DARK).text(NOTES[i], M + 16, cy, { width: CW - 16 })
                doc.moveDown(0.4)
            }

            doc.end()
        })
    })
}