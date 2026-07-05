import { Analytics } from "@vercel/analytics/next"
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "News Cookie | AI-Powered News Insights 🍪",
  description: "Bake your complex queries into crystal-clear news insight reports and store them in your jar.",
  icons: {
    icon: `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🍪</text></svg>`,
  },

  keywords: [
    "News Cookie",
    "AI News Summary",
    "Real-time News Analysis",
    "Trend Insights",
    "AI 보고서",
    "실시간 뉴스 요약",
    "트렌드 분석",
    "뉴스 쿠키"
  ],

  verification: {
    other: {
      "google-site-verification": "7c32BZjEU4U7RC2Gze3ZJ03scOcVKqdumOMju_KGMuw",
      "naver-site-verification": "e3d4cb14dace68c835e0753a611053c26afcf20b",
    },
  },

  robots: {
    index: true,
    follow: true,
  },

  // 🌟 오픈그래프(소셜 공유 카드) 설정 완료
  openGraph: {
    title: "News Cookie 🍪",
    description: "Bake your queries into crystal-clear news insight reports with AI.",
    url: "https://new-cookie.micka-lab.com",
    siteName: "News Cookie",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html
          lang="en"
          className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
      <body className="min-h-full flex flex-col">
      {children}
      {/* 🌟 Vercel Analytics 트래킹 컴포넌트 삽입 */}
      <Analytics />
      </body>
      </html>
  );
}