'use client';

import { useState, useEffect } from 'react';
import { supabase } from "@/src/utils/supabase";
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface BakedCookieHistory {
  id: string;
  query: string;
  cookie_shape: 'SQUARE' | 'CIRCLE' | 'HEXAGON';
  refined_query: string;
  result: string;
  sources: { title: string; url: string }[];
  created_at: string;
}

export default function MyPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [tokens, setTokens] = useState<number>(0);

  const [historyCookies, setHistoryCookies] = useState<BakedCookieHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  const shapeDesignMap = {
    SQUARE: { shapeClass: "bg-[#8D6E63]", clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)", label: "📊 Timeline & Impact" },
    CIRCLE: { shapeClass: "bg-[#C68B59]", clipPath: "circle(50% at 50% 50%)", label: "🔥 Latest Trend" },
    HEXAGON: { shapeClass: "bg-[#D7A15C]", clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)", label: "📈 Data & Stats" }
  };

  const fetchBakedHistory = async (uid: string) => {
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
      .from('baked_cookies')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });

      if (error) throw error;
      setHistoryCookies(data || []);
    } catch (error) {
      console.error('Error fetching baked history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const fetchUserTokens = async (uid: string) => {
    try {
      const { data, error } = await supabase
      .from('users')
      .select('cookie_token')
      .eq('id', uid)
      .single();

      if (error) throw error;
      if (data) setTokens(data.cookie_token ? Number(data.cookie_token) : 0);
    } catch (error) {
      console.error('Error fetching tokens:', error);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsLoggedIn(true);
        setUserEmail(session.user.email || '');
        setUserId(session.user.id);
        fetchUserTokens(session.user.id);
        fetchBakedHistory(session.user.id);
      } else {
        router.push('/'); // Guard: redirect to home if not logged in
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setIsLoggedIn(true);
        setUserEmail(session.user.email || '');
        setUserId(session.user.id);
        fetchUserTokens(session.user.id);
        fetchBakedHistory(session.user.id);
      } else {
        router.push('/');
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  return (
      <main className="min-h-screen bg-[#FAF6F0] text-[#3E2723] flex flex-col items-center font-sans p-6 md:p-12 transition-all duration-500">

        {/* Back to Home Navigation Header */}
        <div className="w-full max-w-2xl flex justify-between items-center mb-10">
          <Link
              href="/"
              className="text-sm font-black text-[#C68B59] hover:text-[#B37A49] transition-colors flex items-center gap-1 group"
          >
            <span className="group-hover:-translate-x-1 transition-transform inline-block">←</span> Back to Oven Room
          </Link>

          {/* User Info Bar */}
          {isLoggedIn && (
              <div className="flex items-center gap-3 animate-fade-in">
                <div className="text-[11px] font-black bg-[#EADCC9] px-2.5 py-1.5 rounded-full text-[#5D4037] select-none">
                  ⚡ Pantry: <span className="text-[#C68B59]">{tokens}</span> EA
                </div>
                <div className="text-xs font-bold bg-[#F0E5D8] px-3.5 py-2 rounded-full border border-[#D7C4B1] text-[#A0522D] shadow-sm">
                  <span>{userEmail.split('@')[0]} 🧑‍🍳</span>
                </div>
              </div>
          )}
        </div>

        <div className="w-full max-w-2xl bg-white border-2 border-[#D7C4B1] rounded-2xl shadow-xl overflow-hidden flex flex-col min-h-[500px]">

          <div className="border-b border-[#D7C4B1] bg-[#F5F0E9] px-6 py-4 flex justify-between items-center">
            <div>
              <h3 className="text-base font-black text-[#4E342E]">My Cookie Jar 🏺</h3>
            </div>
            <span className="text-xs bg-white text-[#C68B59] border border-[#D7C4B1] px-2.5 py-1 rounded-md font-bold">
              Total: {historyCookies.length} EA
            </span>
          </div>

          <div className="flex-1 p-6 bg-white max-h-[65vh] overflow-y-auto">
            {isLoadingHistory ? (
                <div className="py-24 text-center text-sm font-bold text-[#8D6E63] animate-pulse">
                  🏺 Retrieving reports smoothly from the cookie jar...
                </div>
            ) : historyCookies.length === 0 ? (
                <div className="py-24 bg-[#FFFDF9] border border-dashed border-[#D7C4B1] rounded-xl text-center text-sm text-[#8D6E63] font-medium leading-relaxed">
                  The cookie jar is empty!
                </div>
            ) : (
                <div className="flex flex-col gap-3.5">
                  {historyCookies.map((item) => {
                    const design = shapeDesignMap[item.cookie_shape] || shapeDesignMap.CIRCLE;
                    const isExpanded = expandedHistoryId === item.id;

                    return (
                        <div
                            key={item.id}
                            className="bg-[#FFFDF9] border-2 border-[#D7C4B1] rounded-xl p-4 shadow-sm hover:border-[#C68B59] transition-all"
                        >
                          <div
                              className="flex justify-between items-center cursor-pointer select-none"
                              onClick={() => setExpandedHistoryId(isExpanded ? null : item.id)}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 ${design.shapeClass} opacity-90`} style={{ clipPath: design.clipPath }} />
                              <div>
                                <span className="text-[9px] font-black text-[#C68B59] tracking-wide uppercase block">{design.label}</span>
                                <h4 className="text-sm font-bold text-[#4E342E] line-clamp-1 mt-0.5">Analysis for "{item.query}"</h4>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 text-right">
                          <span className="text-[11px] text-[#A1887F] font-mono hidden sm:inline">
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                              <span className="text-xs font-bold text-[#C68B59]">
                            {isExpanded ? '▲' : '▼'}
                          </span>
                            </div>
                          </div>

                          {/* Expanded Panel Body */}
                          {isExpanded && (
                              <div className="mt-4 pt-4 border-t border-[#FAF6F0] flex flex-col gap-4 animate-fade-in text-left">
                                <div>
                                  <span className="text-[10px] font-bold text-[#8D6E63] uppercase block mb-1">Refined Recipe Prompt</span>
                                  <p className="text-xs bg-[#FAF6F0] p-3 rounded-xl border border-[#EADCC9] text-[#5D4037] font-medium leading-relaxed italic">
                                    "{item.refined_query}"
                                  </p>
                                </div>

                                <div>
                                  <span className="text-[10px] font-bold text-[#8D6E63] uppercase block mb-1">Full Analysis Report</span>
                                  <div className="text-sm bg-[#FAF6F0] text-[#3E2723] p-4 rounded-xl border border-[#D7C4B1] leading-relaxed max-h-[300px] overflow-y-auto font-sans prose prose-brown">
                                    <ReactMarkdown>{item.result}</ReactMarkdown>
                                  </div>
                                </div>

                                {item.sources && item.sources.length > 0 && (
                                    <div>
                                      <span className="text-[10px] font-black text-[#C68B59] tracking-wider uppercase block mb-1.5">Verified Sources</span>
                                      <ul className="flex flex-col gap-1.5 bg-[#FAF6F0]/50 p-3 rounded-xl border border-[#FAF6F0]">
                                        {item.sources.map((source, idx) => (
                                            <li key={idx} className="text-xs">
                                              <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-[#8D6E63] hover:text-[#C68B59] underline break-all font-semibold transition-colors">
                                                • [{idx + 1}] {source.title}
                                              </a>
                                            </li>
                                        ))}
                                      </ul>
                                    </div>
                                )}
                              </div>
                          )}
                        </div>
                    );
                  })}
                </div>
            )}
          </div>
        </div>
      </main>
  );
}