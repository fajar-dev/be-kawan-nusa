import PDFDocument from 'pdfkit'
import { Withdraw } from '../../modules/withdraw/entities/withdraw.entity'

const GREEN = '#4a7c3f'
const GREEN_BG = '#eef4ec'
const DARK = '#1c1c1c'
const GRAY = '#6b7280'
const BORDER = '#d1d5db'
const TABLE_HDR_BG = '#f5f5f5'

const PAGE_W = 595.28
const PAGE_H = 841.89
const M = 48
const CW = PAGE_W - M * 2

const fmtRp = (v: number) => `Rp. ${Number(v).toLocaleString('id-ID')}`

const fmtDate = (d: Date | string) => {
    const dt = new Date(d)
    const mo = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agt','Sep','Okt','Nov','Des']
    return `${dt.getDate()} ${mo[dt.getMonth()]} ${dt.getFullYear()}`
}

const fmtDateTime = (d: Date | string) => {
    const dt = new Date(d)
    const mo = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agt','Sep','Okt','Nov','Des']
    const h = String(dt.getHours()).padStart(2, '0')
    const mn = String(dt.getMinutes()).padStart(2, '0')
    return `${dt.getDate()} ${mo[dt.getMonth()]} ${dt.getFullYear()} - ${h}:${mn}`
}

/**
 * Generate a PDF Nota Penarikan Komisi matching the KawanNusa design
 */
export const generateWithdrawalNote = (withdraw: Withdraw): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 0, size: 'A4' })
        const chunks: Buffer[] = []

        doc.on('data', (chunk) => chunks.push(chunk))
        doc.on('end', () => resolve(Buffer.concat(chunks)))
        doc.on('error', (err) => reject(err))

        const gross = withdraw.point * 1000
        const tax = Number(withdraw.tax)
        const net = Number(withdraw.payout)

        const yy = String(new Date(withdraw.createdAt).getFullYear()).slice(-2)
        const mm = String(new Date(withdraw.createdAt).getMonth() + 1).padStart(2, '0')
        const seq = String(withdraw.id).padStart(4, '0')
        const nomor = `MDI/${yy}/${mm}/SV/${seq}/SD`
        const terbit = fmtDate(withdraw.createdAt)

        // ─────────────────────────────────────────────────
        // HEADER BOX — rounded green background
        // ─────────────────────────────────────────────────
        const HX = M - 8, HY = 25, HW = CW + 16, HH = 70

        doc.roundedRect(HX, HY, HW, HH, 7).fill(GREEN_BG)

        // Title left
        doc.font('Helvetica-Bold').fontSize(18).fillColor(GREEN)
            .text('Nota Penarikan Komisi', HX + 16, HY + 14, { lineBreak: false })

        // Subtitle left
        doc.font('Helvetica').fontSize(8.5).fillColor(GRAY)
            .text(`Nomor : ${nomor}   Terbit: ${terbit}`, HX + 16, HY + 40, { lineBreak: false })

        // Logo right — measure widths to position accurately
        doc.font('Helvetica-Bold').fontSize(17)
        const kW = doc.widthOfString('kawan ')
        const nW = doc.widthOfString('nusa')
        const TAG = 'Portal Referral PT Media Antar Nusa'
        doc.font('Helvetica').fontSize(7)
        const tagW = doc.widthOfString(TAG)
        const logoBlockW = Math.max(kW + nW, tagW)
        const LX = HX + HW - logoBlockW - 16
        const LY = HY + 14

        doc.font('Helvetica-Bold').fontSize(17).fillColor(GREEN)
            .text('kawan ', LX, LY, { lineBreak: false })

        doc.font('Helvetica-Bold').fontSize(17).fillColor(DARK)
            .text('nusa', LX + kW, LY, { lineBreak: false })

        doc.font('Helvetica').fontSize(7).fillColor(GRAY)
            .text(TAG, LX, LY + 22, { width: logoBlockW, align: 'right', lineBreak: false })

        // ─────────────────────────────────────────────────
        // IDENTITY SECTION
        // ─────────────────────────────────────────────────
        let y = HY + HH + 25
        const COLON_X = M + 162
        const VAL_X = M + 175

        const drawRow = (label: string, value: string, yp: number) => {
            doc.font('Helvetica-Bold').fontSize(10).fillColor(DARK)
                .text(label, M, yp, { lineBreak: false })
            doc.font('Helvetica').fontSize(10).fillColor(DARK)
                .text(':', COLON_X, yp, { lineBreak: false })
            doc.font('Helvetica').fontSize(10).fillColor(DARK)
                .text(value, VAL_X, yp, { width: CW - (VAL_X - M) })
        }

        const name = [withdraw.user?.firstName, withdraw.user?.lastName].filter(Boolean).join(' ')

        drawRow('Nama', name, y); y += 20
        drawRow('Nama Pemilik Rekening', withdraw.accountHolderName, y); y += 20
        drawRow('Nomor Rekening', withdraw.accountNumber, y); y += 20
        drawRow('Nama Bank', withdraw.bankName, y)
        y = doc.y + 22

        // ─────────────────────────────────────────────────
        // TABLE
        // ─────────────────────────────────────────────────
        const TW = CW
        const COLS = [118, 82, 112, 88, TW - 118 - 82 - 112 - 88]
        const HEADS = ['Waktu', 'Poin Ditarik', 'Poin Ditarik (Rp)', 'PPH (2,5%)', 'Ditransfer']
        const HRH = 27, DRH = 25

        // Header row
        doc.rect(M, y, TW, HRH).fill(TABLE_HDR_BG)
        doc.rect(M, y, TW, HRH).strokeColor(BORDER).lineWidth(0.5).stroke()

        let cx = M
        for (let i = 0; i < HEADS.length; i++) {
            doc.font('Helvetica-Bold').fontSize(9.5).fillColor(DARK)
                .text(HEADS[i], cx + 9, y + 9, { width: COLS[i] - 14, lineBreak: false })
            cx += COLS[i]
            if (i < HEADS.length - 1) {
                doc.moveTo(cx, y).lineTo(cx, y + HRH).strokeColor(BORDER).lineWidth(0.5).stroke()
            }
        }
        y += HRH

        // Data row
        doc.rect(M, y, TW, DRH).fill('#ffffff')
        doc.rect(M, y, TW, DRH).strokeColor(BORDER).lineWidth(0.5).stroke()

        const VALS = [
            fmtDateTime(withdraw.createdAt),
            String(withdraw.point),
            fmtRp(gross),
            fmtRp(tax),
            fmtRp(net),
        ]

        cx = M
        for (let i = 0; i < VALS.length; i++) {
            doc.font('Helvetica').fontSize(9.5).fillColor(DARK)
                .text(VALS[i], cx + 9, y + 8, { width: COLS[i] - 14, lineBreak: false })
            cx += COLS[i]
            if (i < VALS.length - 1) {
                doc.moveTo(cx, y).lineTo(cx, y + DRH).strokeColor(BORDER).lineWidth(0.5).stroke()
            }
        }

        // ─────────────────────────────────────────────────
        // FOOTER NOTES — pinned near bottom of page
        // ─────────────────────────────────────────────────
        const NOTES = [
            'Nota penarikan komisi merupakan dokumen resmi yang diterbitkan secara digital oleh sistem sebagai bukti bahwa referral telah melakukan penarikan sejumlah poin atau komisi melalui portal mitra.',
            'Poin dikonversi ke rupiah dengan nilai Rp1.000 untuk setiap 1 poin.',
            'Nominal yang ditransfer merupakan hasil konversi poin ke rupiah setelah dikurangi PPh sebesar 2,5%.',
            'Dokumen ini tidak memerlukan tanda tangan & stempel karena dicetak secara komputerisasi.',
        ]

        const FY = PAGE_H - 158

        doc.moveTo(M, FY).lineTo(PAGE_W - M, FY)
            .strokeColor(BORDER).lineWidth(0.5).stroke()

        let fy = FY + 14
        for (let i = 0; i < NOTES.length; i++) {
            doc.font('Helvetica').fontSize(12).fillColor(DARK)
                .text(`${i + 1}.`, M, fy, { lineBreak: false })
            doc.font('Helvetica').fontSize(12).fillColor(DARK)
                .text(NOTES[i], M + 16, fy, { width: CW - 16 })
            fy = doc.y + 4
        }

        doc.end()
    })
}