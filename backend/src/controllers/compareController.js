const axios = require('axios');
const fs = require('fs');
const path = require('path');

let _trendKeywords = null;

function loadTrendKeywords() {
  if (_trendKeywords) return _trendKeywords;
  try {
    const filePath = path.join(__dirname, '../../../데이터처리/output/trend_keywords.json');
    _trendKeywords = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    console.warn('[compare] trend_keywords.json 로드 실패:', e.message);
    _trendKeywords = {};
  }
  return _trendKeywords;
}

// 기사 카테고리 → NAVER 트렌드 카테고리 매핑
const CAT_MAP = {
  '마케팅': ['구독경제', '소비트렌드', '로컬브랜드', 'MZ세대'],
  '브랜드': ['로컬브랜드', 'MZ세대', '소비트렌드'],
  '스타트업': ['스타트업', '창업', '투자유치', '초기창업'],
  '창업': ['창업', '스타트업', '창업지원사업', 'TIPS'],
  'AI': ['생성형AI', 'AI 자동화', 'AI SaaS'],
  '디지털': ['디지털전환', 'AI SaaS', 'AI 자동화'],
  'HR': ['생산성', 'MZ세대'],
  '인사': ['생산성', 'MZ세대'],
  '금융': ['투자유치', '벤처투자', '정책자금'],
  '투자': ['투자유치', '벤처투자'],
  'ESG': ['ESG'],
  '지속': ['ESG'],
  '전략': ['신사업', '디지털전환'],
  '혁신': ['생성형AI', 'AI 자동화', '신사업'],
  '플랫폼': ['AI SaaS', '구독경제', '디지털전환'],
  '유통': ['소비트렌드', '구독경제'],
  '헬스': ['웰니스', '1인가구'],
};

function buildTrendContext(cat1, cat2) {
  const kws = loadTrendKeywords();
  const lines = [];

  // 전체 트렌드 상위 키워드
  const allKws = kws['__all__'] || [];
  if (allKws.length > 0) {
    lines.push(`2024~2025 전체 트렌드: ${allKws.slice(0, 15).join(', ')}`);
  }

  // 카테고리 특화 트렌드
  const matched = new Set();
  for (const cat of [cat1, cat2]) {
    if (!cat) continue;
    for (const [key, trendCats] of Object.entries(CAT_MAP)) {
      if (cat.includes(key)) {
        for (const tc of trendCats) {
          if (kws[tc] && !matched.has(tc)) {
            matched.add(tc);
            lines.push(`${tc} 트렌드: ${kws[tc].slice(0, 8).join(', ')}`);
          }
        }
      }
    }
  }

  return lines.slice(0, 4).join('\n');
}

// POST /api/compare
exports.compareArticles = async (req, res) => {
  const { article1, article2 } = req.body;
  if (!article1 || !article2) {
    return res.status(400).json({ error: '두 기사 정보가 필요합니다.' });
  }

  const labelKo = (lbl) =>
    lbl === 'success' ? '성공' : lbl === 'failure' ? '실패' : '중립';

  const trendCtx = buildTrendContext(
    article1.category || article1.strategy || '',
    article2.category || article2.strategy || ''
  );

  const prompt = `당신은 경영전략 분석 전문가입니다. 두 기업 전략 사례를 비교 분석하세요.

[사례 A]
제목: ${article1.title}
결과: ${labelKo(article1.label)}
출처: ${article1.source || '미상'}  발행: ${article1.published_at || '미상'}
카테고리: ${article1.category || '-'}
요약: ${(article1.summary || '').slice(0, 350)}

[사례 B]
제목: ${article2.title}
결과: ${labelKo(article2.label)}
출처: ${article2.source || '미상'}  발행: ${article2.published_at || '미상'}
카테고리: ${article2.category || '-'}
요약: ${(article2.summary || '').slice(0, 350)}

[2024~2025 시장 트렌드 컨텍스트 (내부 참고용)]
${trendCtx || '트렌드 데이터 없음'}

아래 6개 항목으로 각 사례를 0~100점으로 채점하세요.
- 시장타이밍: 시장 진입 시점이 얼마나 적절했는가
- 실행력: 전략을 실제로 실행하는 역량
- 고객이해도: 타깃 고객 니즈를 얼마나 정확히 파악했는가
- 경쟁대응력: 경쟁사 대비 포지셔닝 강도
- 자원충분성: 자금·인력·기술 자원이 충분했는가
- 트렌드부합도: 현재 2024~2025 시장 트렌드와의 정합성

반드시 아래 JSON만 출력하세요:
{
  "scores": {
    "A": {"시장타이밍": 0, "실행력": 0, "고객이해도": 0, "경쟁대응력": 0, "자원충분성": 0, "트렌드부합도": 0},
    "B": {"시장타이밍": 0, "실행력": 0, "고객이해도": 0, "경쟁대응력": 0, "자원충분성": 0, "트렌드부합도": 0}
  },
  "analysis": "두 사례의 핵심 공통점과 차이점 2~3문장",
  "key_differences": ["차이점1 (한 문장)", "차이점2 (한 문장)", "차이점3 (한 문장)"],
  "trend_insight": "현재 트렌드 관점에서 두 사례의 시사점 한 문장",
  "recommendation": "이 비교에서 얻을 수 있는 전략적 시사점 1~2문장"
}`;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 25000,
      }
    );

    const result = JSON.parse(response.data.choices[0].message.content);
    return res.json(result);
  } catch (err) {
    console.error('[compareController]', err.response?.data || err.message);
    return res.status(500).json({ error: 'GPT 비교 분석 실패' });
  }
};
