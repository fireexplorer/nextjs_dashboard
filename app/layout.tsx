import {ReactNode} from "react"
import './ui/global.css'
import {inter} from "./ui/fonts"
import {Metadata} from "next"


export const metadata: Metadata = {
    title: 'Acme Dashboard',
    description: 'Next.js 官方课程；使用 App 路由创建。',
    // metadataBase: new URL('')
}


export default function RootLayout({children,}: { children: ReactNode }) {
    return (
        <html lang="en">
        <body className={`${inter.className} antialiased`}>{children}</body>
        </html>
    )
}
