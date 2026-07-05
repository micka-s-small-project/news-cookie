import { NextResponse } from 'next/server';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { TavilySearchAPIRetriever } from '@langchain/community/retrievers/tavily_search_api';

export async function POST(request: Request) {
  try {
    const { refinedQuery } = await request.json();

    if (!refinedQuery || typeof refinedQuery !== 'string' || !refinedQuery.trim()) {
      return NextResponse.json({ error: 'Refined query is required' }, { status: 400 });
    }

    const retriever = new TavilySearchAPIRetriever({
      k: 5,
      kwargs: {
        searchDepth: "advanced",
        includeRawContent: false,
      }
    });

    const docs = await retriever.invoke(refinedQuery);

    const contextText = docs.map(doc => doc.pageContent).join("\n\n");
    const sources = docs.map(doc => ({
      title: doc.metadata?.title || "News Source",
      url: doc.metadata?.source || doc.metadata?.url
    })).filter(source => source.url); // 유효한 링크 주소가 있는 것만 필터링

    const model = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash",              // 1. modelName -> model 로 변경
      apiKey: process.env.GEMINI_API_KEY,      // 2. 혹은 환경변수 이름을 GOOGLE_API_KEY로 세팅했다면 생략 가능
      temperature: 0.2,
    });

    const chefPrompt = `
You are the "News Cookie Master Chef" in 2026. 
Your mission is to answer the user's inquiry based strictly on the real-time news articles provided below.

[Real-time News Context]
${contextText}

[User Request]
${refinedQuery}

[Strict Formatting Instructions]
1. Respond in the SAME language as the User Request (If Korean, write in Korean).
2. Do not hallucinate or make up any facts outside the provided context.
3. Structure your response beautifully with Markdown: Use bolding, clean headers, and bullet points.
4. Keep it highly insight-rich, engaging, and professional based on the prompt's perspective.
`;

    // 7. Gemini 구동 및 최종 리포트 도출
    const aiResponse = await model.invoke(chefPrompt);
    const finalResult = aiResponse.content;

    return NextResponse.json({
      success: true,
      result: finalResult,
      sources: sources
    });

  } catch (error: any) {
    console.error('🔥 [Taste API Runtime Error]:', error);
    return NextResponse.json(
        { error: 'Failed to extract news insight from the oven', details: error.message },
        { status: 500 }
    );
  }
}