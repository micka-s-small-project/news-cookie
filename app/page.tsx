'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from "@/src/utils/supabase";
import ReactMarkdown from 'react-markdown';

type StepType = 'INPUT' | 'BAKING' | 'RESULTS';

interface CookieOption {
  id: number;
  shape: 'SQUARE' | 'CIRCLE' | 'HEXAGON'; // API 명세와 일치시킴
  shapeClass: string;
  clipPath: string;
  text: string;
}

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [query, setQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [step, setStep] = useState<StepType>('INPUT');
  const [tokens, setTokens] = useState(0);
  const [isWaitlistModalOpen, setIsWaitlistModalOpen] = useState(false);

  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🌟 Gemini API로부터 받아온 3가지 쿠키 옵션을 저장할 상태
  const [cookies, setCookies] = useState<CookieOption[]>([]);

  // 선택된 쿠키의 상세 결과를 보여줄 상태들
  const [selectedCookieText, setSelectedCookieText] = useState<string | null>(null);
  const [isTasting, setIsTasting] = useState(false);
  const detailRef = useRef<HTMLDivElement>(null);

  const feedbackEmail = "edsolarrcnt5@gmail.com";
  const mailSubject = encodeURIComponent("[News Cookie] Feedback & Suggestions");
  const mailBody = encodeURIComponent("Hello Chef!\n\nHere is my feedback about News Cookie:\n\n");

  const [sources, setSources] = useState<{ title: string; url: string }[]>([]);

  const shapeDesignMap = {
    SQUARE: {
      shapeClass: "bg-[#8D6E63]",
      clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)", // 오각형 스퀘어 느낌
    },
    CIRCLE: {
      shapeClass: "bg-[#C68B59]",
      clipPath: "circle(50% at 50% 50%)",
    },
    HEXAGON: {
      shapeClass: "bg-[#D7A15C]",
      clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
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
      if (data) {
        setTokens(data.cookie_token ? Number(data.cookie_token) : 0);
      }
    } catch (error) {
      console.error('Error fetching user tokens:', error);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const voted = localStorage.getItem('news_cookie_voted_waitlist');
      if (voted === 'true') setHasVoted(true);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsLoggedIn(true);
        setUserEmail(session.user.email || '');
        setUserId(session.user.id);
        fetchUserTokens(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setIsLoggedIn(true);
        setUserEmail(session.user.email || '');
        setUserId(session.user.id);
        fetchUserTokens(session.user.id);
      } else {
        setIsLoggedIn(false);
        setUserEmail('');
        setUserId('');
        setTokens(0);
        setStep('INPUT');
        setSelectedCookieText(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleInteraction = () => {
    if (!isLoggedIn) {
      setIsModalOpen(true);
      return false;
    }
    return true;
  };

  // 🌟 [수정] 진짜 Gemini API 오븐을 호출하는 로직
  const handleBakeSubmit = async () => {
    if (!handleInteraction()) return;
    if (!query.trim()) return;

    setStep('BAKING');
    setSelectedCookieText(null);

    try {
      const response = await fetch('/api/bake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to bake cookies');
      }

      const bakedCookies: CookieOption[] = result.data.map((item: any) => {
        const design = shapeDesignMap[item.shape as 'SQUARE' | 'CIRCLE' | 'HEXAGON'] || shapeDesignMap.CIRCLE;
        return {
          id: item.id,
          shape: item.shape,
          text: item.text,
          ...design
        };
      });

      setCookies(bakedCookies);
      setStep('RESULTS');

    } catch (error) {
      console.error('Baking error:', error);
      alert('🍪 Oh no! The oven overheated. Please try baking again.');
      setStep('INPUT');
    }
  };

  const handleSelectQuery = async (cookieItem: CookieOption) => {
    if (tokens < 1) {
      setIsWaitlistModalOpen(true);
      return;
    }

    setIsTasting(true);
    setSelectedCookieText(null);
    setSources([]); // 이전 출처 UI 초기화

    try {
      const nextTokenCount = tokens - 1;
      const { error: tokenError } = await supabase
      .from('users')
      .update({ cookie_token: nextTokenCount })
      .eq('id', userId);

      if (tokenError) throw tokenError;
      setTokens(nextTokenCount);

      const response = await fetch('/api/taste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refinedQuery: cookieItem.text }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch taste analysis');
      }

      const { error: insertError } = await supabase
      .from('baked_cookies')
      .insert({
        user_id: userId,
        query: query,
        cookie_shape: cookieItem.shape,
        refined_query: cookieItem.text,
        result: data.result,
        sources: data.sources
      });

      if (insertError) {
        console.error('Failed to save baked cookie to history:', insertError);
      }

      setIsTasting(false);
      setSelectedCookieText(data.result);
      setSources(data.sources);

      setTimeout(() => {
        detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

    } catch (error) {
      console.error('Error tasting cookie:', error);
      alert('🍪 Insight baking failed. Your token has been safely preserved.');
      setIsTasting(false);
    }
  };

  const handleWaitlistSubmit = async () => {
    if (hasVoted || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      localStorage.setItem('news_cookie_voted_waitlist', 'true');
      setHasVoted(true);
      alert("💖 Thank you for voting! Your interest speeds up our official launch.");
      setIsWaitlistModalOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}` },
      });
      if (error) throw error;
    } catch (e) {
      console.error(e);
    } finally {
      setIsModalOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error(e);
    }
  };

  return (
      <main className="min-h-screen bg-[#FAF6F0] text-[#3E2723] flex flex-col items-center justify-between font-sans p-6 relative transition-all duration-500">

        {(step === 'BAKING' || isTasting) && (
            <div className="fixed inset-0 bg-black/10 backdrop-blur-[1px] z-50 cursor-wait flex items-center justify-center select-none pointer-events-auto">
              <div className="bg-white/90 border-2 border-[#C68B59] px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 font-bold text-[#4E342E] animate-bounce">
                <span>{step === 'BAKING' ? '🧁 Baking cookie...' : '🍴 맛있게 쿠키를 맛보는 중...'}</span>
              </div>
            </div>
        )}

        <div className="w-full max-w-3xl flex justify-end items-center z-30 pt-2">
          {isLoggedIn ? (
              <div className="flex items-center gap-3 animate-fade-in">
                <div className="text-xs font-bold bg-[#EADCC9] px-3 py-1.5 rounded-full text-[#5D4037] select-none">
                  ⚡ Pantry: <span className="text-[#C68B59] font-black">{tokens}</span> EA
                </div>
                <div className="text-sm font-bold bg-[#F0E5D8] px-4 py-2 rounded-full border border-[#D7C4B1] text-[#A0522D] shadow-sm flex items-center gap-2">
                  <span>{userEmail.split('@')[0]} 🧑‍🍳</span>
                  <button onClick={handleLogout} className="text-[11px] text-red-600 hover:underline font-normal ml-1">
                    Logout
                  </button>
                </div>
              </div>
          ) : (
              <button onClick={() => setIsModalOpen(true)} className="text-sm font-medium opacity-80 hover:opacity-100 transition-opacity bg-[#F0E5D8] px-3 py-1.5 rounded-full border border-[#D7C4B1]">
                Hello unknown Baker 👤
              </button>
          )}
        </div>

        <div className={`w-full text-center flex flex-col items-center gap-8 relative z-0 my-auto transition-all duration-300 ${step === 'RESULTS' ? 'max-w-3xl' : 'max-w-md'}`}>
          <h1 className="text-6xl font-extrabold tracking-tight select-none drop-shadow-sm text-[#4E342E]">
            News <span className="text-[#C68B59]">Cookie</span>
          </h1>

          {step === 'INPUT' && (
              <div className="w-full flex flex-col gap-3 animate-fade-in">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onClick={handleInteraction}
                    placeholder="What kind of cookie do you want to bake? Enter your query..."
                    className="w-full px-5 py-4 rounded-xl bg-white border-2 border-[#D7C4B1] text-[#3E2723] placeholder-[#A1887F] focus:outline-none focus:border-[#C68B59] focus:ring-2 focus:ring-[#C68B59]/20 transition-all shadow-inner text-base"
                />
                <button onClick={handleBakeSubmit} className="w-full bg-[#C68B59] text-white font-bold py-4 rounded-xl hover:bg-[#B37A49] active:scale-[0.99] transition-all shadow-md">
                  Bake your Cookie 🍪
                </button>
              </div>
          )}

          {step === 'BAKING' && (
              <div className="py-6 text-center space-y-4 animate-pulse">
                <span className="text-5xl inline-block animate-spin duration-1000">⏳</span>
                <h2 className="text-xl font-bold text-[#4E342E]">Baking your query into cookies...</h2>
                <p className="text-xs text-[#8D6E63]">Formulating 3 refined option shapes from Gemini oven.</p>
              </div>
          )}

          {step === 'RESULTS' && (
              <div className="w-full flex flex-col gap-6 animate-scale-up">
                <div className="text-center">
                  <p className="text-xs font-bold text-[#C68B59] tracking-wider uppercase">Baking Complete</p>
                  <h3 className="text-2xl font-black text-[#4E342E] mt-0.5">Select one cookie shape to taste</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                  {cookies.map((cookie) => (
                      <div key={cookie.id} className="bg-white border-2 border-[#D7C4B1] rounded-3xl p-6 flex flex-col justify-between items-center hover:border-[#C68B59] hover:bg-[#FFFDFB] transition-all shadow-sm hover:shadow-md group relative min-h-[420px]">
                        <div className="w-full flex flex-col items-center flex-1">
                          <div className="w-24 h-24 flex items-center justify-center relative mb-6">
                            <div className={`w-20 h-20 ${cookie.shapeClass} opacity-90 group-hover:scale-105 transition-transform duration-300 shadow-sm`} style={{ clipPath: cookie.clipPath }} />
                            <div className="absolute top-[35%] left-[35%] w-2 h-2 bg-[#3e1e11] rounded-full opacity-60" />
                            <div className="absolute top-[55%] left-[55%] w-2.5 h-2.5 bg-[#2c1308] rounded-full opacity-70" />
                            <div className="absolute top-[60%] left-[30%] w-2 h-2 bg-[#3e1e11] rounded-full opacity-60" />
                          </div>
                          <div className="w-full text-center border-t border-[#FAF6F0] pt-5 flex flex-col gap-2">
                            <span className="text-[11px] font-black text-[#C68B59] tracking-wider uppercase">{cookie.shape} Option 0{cookie.id}</span>
                            <p className="text-[14px] font-bold text-[#3E2723] leading-relaxed line-clamp-4 group-hover:line-clamp-none transition-all duration-300 px-1">{cookie.text}</p>
                          </div>
                        </div>
                        <button onClick={() => handleSelectQuery(cookie)} className="w-full mt-6 bg-[#FAF6F0] group-hover:bg-[#C68B59] text-[#C68B59] group-hover:text-white border border-[#D7C4B1] group-hover:border-[#C68B59] font-black py-3 rounded-xl text-sm transition-all active:scale-[0.98] shadow-sm">
                          Taste this Cookie 🍪
                        </button>
                      </div>
                  ))}
                </div>

                {/* 🌟 [수정] 스크롤 박스 및 마크다운 파싱이 적용된 디테일 뷰 영역 */}
                <div
                    ref={detailRef}
                    className={`w-full overflow-hidden transition-all duration-500 ease-in-out ${selectedCookieText ? 'max-h-[700px] opacity-100 mt-6' : 'max-h-0 opacity-0'}`}
                >
                  <div className="bg-white border-2 border-[#C68B59] rounded-2xl p-6 text-left shadow-lg relative bg-[radial-gradient(#FAF6F0_1px,transparent_1px)] [background-size:16px_16px]">
                    <div className="absolute top-4 right-4 bg-[#66BB6A] text-white font-black text-[10px] px-2 py-1 rounded shadow-sm tracking-wider">
                      FULLY BAKED 🍪
                    </div>

                    <h4 className="font-black text-[#4E342E] text-lg mb-4 flex items-center gap-2 border-b border-[#FAF6F0] pb-2">
                      <span>🍽️</span> Baked Insight Analysis
                    </h4>

                    {/* 🌟 마크다운 파싱 + 내부 스크롤뷰 장착 컨테이너 */}
                    <div className="text-sm bg-[#FAF6F0] text-[#3E2723] p-5 rounded-xl border border-[#D7C4B1] leading-relaxed max-h-[400px] overflow-y-auto font-sans prose prose-brown">
                      <ReactMarkdown>{selectedCookieText || ''}</ReactMarkdown>
                    </div>

                    {sources.length > 0 && (
                        <div className="mt-5 pt-4 border-t border-[#EADCC9]">
                          <h5 className="text-xs font-black text-[#C68B59] tracking-wider uppercase mb-2 flex items-center gap-1">
                            <span>🔗</span> Verified News Sources
                          </h5>
                          <ul className="flex flex-col gap-1.5">
                            {sources.map((source, idx) => (
                                <li key={idx} className="text-xs">
                                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-[#8D6E63] hover:text-[#C68B59] font-bold underline underline-offset-2 transition-colors break-all">
                                    • [{idx + 1}] {source.title}
                                  </a>
                                </li>
                            ))}
                          </ul>
                        </div>
                    )}

                    <p className="text-[11px] text-[#8D6E63] mt-4 italic text-right font-medium">
                      * 1 Token has been securely deducted from your Pantry.
                    </p>
                  </div>
                </div>

                <button onClick={() => { setQuery(''); setStep('INPUT'); setSelectedCookieText(null); }} className="text-xs text-[#8D6E63] hover:underline text-center mt-2">
                  ← Back to Prep Bench
                </button>
              </div>
          )}
        </div>

        <footer className="w-full max-w-3xl text-center pt-8 pb-2 border-t border-[#EADCC9] text-xs text-[#8D6E63] font-medium flex flex-col sm:flex-row justify-between items-center gap-2 relative z-10">
          <p>© 2026 News Cookie. All rights reserved.</p>
          <a href={`mailto:${feedbackEmail}?subject=${mailSubject}&body=${mailBody}`} className="text-[#C68B59] hover:text-[#B37A49] font-bold transition-colors underline underline-offset-4">
            💬 Send Us Feedback
          </a>
        </footer>

        {isModalOpen && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="absolute inset-0" onClick={() => setIsModalOpen(false)} />
              <div className="bg-[#FAF6F0] border-2 border-[#D7C4B1] p-8 rounded-2xl max-w-xs w-full text-center shadow-2xl relative z-10 flex flex-col items-center gap-6">
                <div>
                  <h2 className="text-xl font-bold text-[#4E342E] mb-1">Start Baking!</h2>
                  <p className="text-xs text-[#8D6E63]">Please sign in to get 3 FREE starter tokens</p>
                </div>
                <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 font-semibold py-3 px-4 border border-gray-300 rounded-xl shadow-sm hover:bg-gray-50 active:scale-[0.98] transition-all text-sm">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>Login with Google</span>
                </button>
                <button onClick={() => setIsModalOpen(false)} className="text-xs text-[#8D6E63] hover:underline">Maybe later</button>
              </div>
            </div>
        )}

        {isWaitlistModalOpen && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
              <div className="absolute inset-0" onClick={() => setIsWaitlistModalOpen(false)} />
              <div className="bg-[#FAF6F0] border-2 border-[#D7C4B1] p-6 rounded-3xl max-w-sm w-full shadow-2xl relative z-10 flex flex-col gap-4 text-center items-center">
                <span className="text-4xl">🔋</span>
                <div>
                  <h3 className="text-xl font-black text-[#4E342E]">Free Tokens Expired</h3>
                  <p className="text-xs text-[#8D6E63] mt-2 leading-relaxed">
                    You have used all 3 free starter tokens! <br/>
                    We are currently polishing additional features. Leave your feedback to help us grow!
                  </p>
                </div>
                <button onClick={handleWaitlistSubmit} disabled={hasVoted || isSubmitting} className={`w-full font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1 ${hasVoted ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#66BB6A] hover:bg-[#57A75B] text-white active:scale-[0.99]'}`}>
                  {isSubmitting ? <span>Submitting...</span> : hasVoted ? <span>✓ Already Submitted! Thanks!</span> : <span>I want more tokens! 👍</span>}
                </button>
                <button onClick={() => setIsWaitlistModalOpen(false)} className="text-xs text-[#8D6E63] hover:underline">Close</button>
              </div>
            </div>
        )}
      </main>
  );
}