'use client';

import { useState } from 'react';
import Link from 'next/link';

type TabType = 'my-cookies' | 'invoice' | 'add-token';

export default function MyPage() {
  const [activeTab, setActiveTab] = useState<TabType>('my-cookies');
  const [tokens, setTokens] = useState(84);

  const handleCharge = (amount: number, packName: string) => {
    setTokens((prev) => prev + amount);
    alert(`Successfully added ${amount} Tokens via ${packName}! ⚡`);
  };

  return (
      <main className="min-h-screen bg-[#FAF6F0] text-[#3E2723] flex flex-col items-center font-sans p-6 md:p-12">

        {/* 빽 투 홈 네비게이션 헤더 */}
        <div className="w-full max-w-2xl flex justify-between items-center mb-12">
          <Link
              href="/"
              className="text-sm font-bold text-[#C68B59] hover:text-[#B37A49] transition-colors flex items-center gap-1 group"
          >
            <span className="group-hover:-translate-x-1 transition-transform inline-block">←</span> Back to Oven
          </Link>
          <div className="flex items-center gap-2">
          <span className="text-xs bg-[#F0E5D8] px-2.5 py-1 rounded-md text-[#8D6E63] font-medium border border-[#D7C4B1]">
            Baker Profile
          </span>
            <span className="text-sm font-bold text-[#A0522D]">Baker A! 🧑‍🍳</span>
          </div>
        </div>

        {/* 마이페이지 메인 카드 레이아웃 */}
        <div className="w-full max-w-2xl bg-white border-2 border-[#D7C4B1] rounded-2xl shadow-xl overflow-hidden flex flex-col min-h-[500px]">

          {/* ==========================================
          1. 탭 내비게이션 (Tab List)
         ========================================== */}
          <div className="flex border-b border-[#D7C4B1] bg-[#F5F0E9]">
            <button
                onClick={() => setActiveTab('my-cookies')}
                className={`flex-1 py-4 text-center font-bold text-sm transition-all ${
                    activeTab === 'my-cookies'
                        ? 'bg-white text-[#C68B59] border-t-4 border-t-[#C68B59]'
                        : 'text-[#8D6E63] hover:bg-[#EADCC9]/50 hover:text-[#3E2723]'
                }`}
            >
              🍪 My Cookies
            </button>
            <button
                onClick={() => setActiveTab('invoice')}
                className={`flex-1 py-4 text-center font-bold text-sm transition-all ${
                    activeTab === 'invoice'
                        ? 'bg-white text-[#C68B59] border-t-4 border-t-[#C68B59]'
                        : 'text-[#8D6E63] hover:bg-[#EADCC9]/50 hover:text-[#3E2723]'
                }`}
            >
              📄 Invoice
            </button>
            <button
                onClick={() => setActiveTab('add-token')}
                className={`flex-1 py-4 text-center font-bold text-sm transition-all ${
                    activeTab === 'add-token'
                        ? 'bg-white text-[#C68B59] border-t-4 border-t-[#C68B59]'
                        : 'text-[#8D6E63] hover:bg-[#EADCC9]/50 hover:text-[#3E2723]'
                }`}
            >
              ⚡ Add Token
            </button>
          </div>

          {/* ==========================================
          2. 각 탭의 실제 콘텐츠 영역 (Tab Panels)
         ========================================== */}
          <div className="flex-1 p-8 bg-white">

            {/* 탭 1: My Cookies */}
            {activeTab === 'my-cookies' && (
                <div className="space-y-4 animate-fade-in">
                  <h3 className="text-lg font-bold text-[#4E342E] mb-2">Baked History</h3>
                  <div className="border border-[#EADCC9] rounded-xl p-4 bg-[#FAF6F0] flex justify-between items-center">
                    <div>
                      <p className="font-bold text-sm text-[#3E2723]">"Tech trends in Silicon Valley"</p>
                      <p className="text-xs text-[#8D6E63] mt-1">Baked at: 2026-07-02</p>
                    </div>
                    <span className="text-xs font-semibold bg-[#C68B59] text-white px-2 py-1 rounded-full">Success</span>
                  </div>
                  <div className="border border-[#EADCC9] rounded-xl p-4 bg-[#FAF6F0] flex justify-between items-center">
                    <div>
                      <p className="font-bold text-sm text-[#3E2723]">"AI open-source model updates"</p>
                      <p className="text-xs text-[#8D6E63] mt-1">Baked at: 2026-06-28</p>
                    </div>
                    <span className="text-xs font-semibold bg-[#C68B59] text-white px-2 py-1 rounded-full">Success</span>
                  </div>
                </div>
            )}

            {/* 탭 2: Invoice */}
            {activeTab === 'invoice' && (
                <div className="space-y-4 animate-fade-in">
                  <h3 className="text-lg font-bold text-[#4E342E] mb-2">Invoice & Billing</h3>
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                    <tr className="border-b border-[#D7C4B1] text-[#8D6E63]">
                      <th className="pb-2 font-medium">Date</th>
                      <th className="pb-2 font-medium">Description</th>
                      <th className="pb-2 font-medium text-right">Amount</th>
                    </tr>
                    </thead>
                    <tbody className="text-[#3E2723]">
                    <tr className="border-b border-[#FAF6F0]">
                      <td className="py-3 text-xs">2026-07-01</td>
                      <td className="py-3 font-medium">Token Top-up (100 Tokens)</td>
                      <td className="py-3 text-right font-bold text-[#A0522D]">$9.99</td>
                    </tr>
                    <tr className="border-b border-[#FAF6F0]">
                      <td className="py-3 text-xs">2026-06-15</td>
                      <td className="py-3 font-medium">Starter Kit Purchase</td>
                      <td className="py-3 text-right font-bold text-[#A0522D]">$4.99</td>
                    </tr>
                    </tbody>
                  </table>
                </div>
            )}

            {/* 탭 3: Add Token (기존 AppToken에서 토큰 추가 상점으로 변경) */}
            {activeTab === 'add-token' && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h3 className="text-lg font-bold text-[#4E342E] mb-1">Add Token Store</h3>
                    <p className="text-xs text-[#8D6E63]">Top up your token pantry to bake more high-quality News Cookies.</p>
                  </div>

                  {/* 현재 잔여 토큰량 요약 스크린 */}
                  <div className="bg-[#FAF6F0] border border-[#EADCC9] rounded-xl p-5 flex justify-between items-center shadow-inner">
                    <span className="text-sm font-medium text-[#4E342E]">Remaining Tokens</span>
                    <span className="text-2xl font-black text-[#C68B59] flex items-baseline gap-1">
                  {tokens} <span className="text-xs text-[#8D6E63] font-normal">Tokens</span>
                </span>
                  </div>

                  {/* 충전 패키지 선택 리스트 */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-[#8D6E63] uppercase tracking-wider">Select Package</h4>

                    {/* 패키지 1 */}
                    <div
                        onClick={() => handleCharge(10, 'Oven Starter Pack')}
                        className="w-full bg-[#FFFDF9] hover:bg-[#FAF6F0] border border-[#D7C4B1] hover:border-[#C68B59] p-4 rounded-xl flex justify-between items-center cursor-pointer transition-all active:scale-[0.99]"
                    >
                      <div>
                        <p className="font-bold text-sm text-[#3E2723]">🍪 Oven Starter Pack</p>
                        <p className="text-xs text-[#8D6E63] mt-0.5">+10 Dough Tokens</p>
                      </div>
                      <span className="bg-[#C68B59] text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-sm">$0.99</span>
                    </div>

                    {/* 패키지 2 */}
                    <div
                        onClick={() => handleCharge(50, 'Baker Delight Pack')}
                        className="w-full bg-[#FFFDF9] hover:bg-[#FAF6F0] border border-[#D7C4B1] hover:border-[#C68B59] p-4 rounded-xl flex justify-between items-center cursor-pointer transition-all active:scale-[0.99] relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 bg-[#A0522D] text-white text-[9px] font-bold px-2 py-0.5 rounded-bl">
                        POPULAR
                      </div>
                      <div>
                        <p className="font-bold text-sm text-[#3E2723]">🍪 Baker Delight Pack</p>
                        <p className="text-xs text-[#8D6E63] mt-0.5">+50 Dough Tokens</p>
                      </div>
                      <span className="bg-[#C68B59] text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-sm">$4.99</span>
                    </div>

                    {/* 패키지 3 */}
                    <div
                        onClick={() => handleCharge(120, 'Golden Master Chest')}
                        className="w-full bg-[#FFFDF9] hover:bg-[#FAF6F0] border border-[#D7C4B1] hover:border-[#C68B59] p-4 rounded-xl flex justify-between items-center cursor-pointer transition-all active:scale-[0.99]"
                    >
                      <div>
                        <p className="font-bold text-sm text-[#3E2723]">🍪 Golden Master Chest</p>
                        <p className="text-xs text-[#8D6E63] mt-0.5">+120 Dough Tokens</p>
                      </div>
                      <span className="bg-[#C68B59] text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-sm">$9.99</span>
                    </div>
                  </div>
                </div>
            )}

          </div>
        </div>
      </main>
  );
}