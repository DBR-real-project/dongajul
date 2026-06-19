const axios = require('axios');
const fs = require('fs');
const path = require('path');
const db = require('../config/db');

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
  const allKws = kws['__all__'] || [];
  if (allKws.length > 0) {
    lines.push(`2024~2025 전체 트렌드: ${allKws.slice(0, 15).join(', ')}`);
  }
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

// DB에서 기사 전문 조회 (URL 기준)
async function fetchContent(url) {
  if (!url) return '';
  try {
    const [[row]] = await db.query(
      'SELECT content FROM articles WHERE url = ? LIMIT 1',
      [url]
    );
    return (row?.content || '').slice(0, 1800);
  } catch {
    return '';
  }
}

// POST /api/compare
exports.compareArticles = async (req, res) => {
  const { article1, article2 } = req.body;
  if (!article1 || !article2) {
    return res.status(400).json({ error: '두 기사 정보가 필요합니다.' });
  }

  const labelKo = (lbl) =>
    lbl === 'success' ? '성공 사례' : lbl === 'failure' ? '실패 사례' : '결과 미상';

  // DB에서 기사 전문 병렬 조회
  const [content1, content2] = await Promise.all([
    fetchContent(article1.url),
    fetchContent(article2.url),
  ]);

  const trendCtx = buildTrendContext(
    article1.category || '',
    article2.category || ''
  );

  const formatArticle = (art, content, label) => {
    const body = content || art.summary || '';
    return `제목: ${art.title}
최종결과: ${labelKo(label)}
출처: ${art.source || '미상'} | 발행: ${art.published_at || '미상'} | 카테고리: ${art.category || '-'}
본문 (실제 내용):
${body.slice(0, 1800) || '(내용 없음)'}`;
  };

  const systemPrompt = `당신은 DBR·HBR 전략 사례 전문 분석가입니다.
실제 기사 본문 내용을 근거로 6개 차원을 채점합니다.
반드시 본문에서 찾을 수 있는 구체적 증거를 바탕으로 점수를 부여하고,
증거가 없는 차원은 50점 기준으로 소폭 조정하세요.

채점 기준:
- 시장타이밍(0~100): 진입 시점의 시장 상황, 선점 여부, 타이밍 실수 여부
- 실행력(0~100): 전략 실행 속도·완성도, 피벗 능력, 실제 성과
- 고객이해도(0~100): 타깃 고객 정의 정확도, 니즈 파악, 고객 반응
- 경쟁대응력(0~100): 경쟁사 대비 차별화, 포지셔닝 강도, 대응 전략
- 자원충분성(0~100): 자금·인력·기술 자원 보유 수준, 조달 능력
- 트렌드부합도(0~100): 2024~2025 시장 트렌드와의 정합성

성공 사례라도 실행이 부족하면 실행력은 낮게, 실패 사례라도 트렌드를 잘 읽었다면 트렌드부합도는 높게 채점하세요.`;

  const userPrompt = `아래 두 전략 사례를 비교 분석하세요.

━━━ [사례 A] ━━━
${formatArticle(article1, content1, article1.label)}

━━━ [사례 B] ━━━
${formatArticle(article2, content2, article2.label)}

━━━ [시장 트렌드 컨텍스트] ━━━
${trendCtx || '트렌드 데이터 없음'}

위 본문 내용을 근거로 6개 차원을 채점하고, 아래 JSON만 출력하세요:
{
  "scores": {
    "A": {"시장타이밍": 0, "실행력": 0, "고객이해도": 0, "경쟁대응력": 0, "자원충분성": 0, "트렌드부합도": 0},
    "B": {"시장타이밍": 0, "실행력": 0, "고객이해도": 0, "경쟁대응력": 0, "자원충분성": 0, "트렌드부합도": 0}
  },
  "score_basis": {
    "A": "사례 A 채점 근거 — 본문에서 찾은 핵심 증거 2~3가지",
    "B": "사례 B 채점 근거 — 본문에서 찾은 핵심 증거 2~3가지"
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
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.15,
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    let result;
    try {
      result = JSON.parse(response.data.choices[0].message.content);
    } catch (parseErr) {
      console.error('[compare] JSON 파싱 실패:', parseErr.message);
      return res.status(500).json({ error: 'AI 응답 파싱 실패' });
    }
    return res.json(result);
  } catch (err) {
    console.error('[compareController]', err.response?.data || err.message);
    const status = err.response?.status;
    if (status === 429) return res.status(503).json({ error: 'AI API 요청 한도 초과. 잠시 후 다시 시도해주세요.' });
    if (status === 401) return res.status(503).json({ error: 'AI API 인증 오류. 관리자에게 문의하세요.' });
    if (err.code === 'ECONNABORTED') return res.status(504).json({ error: 'AI 응답 시간 초과. 다시 시도해주세요.' });
    return res.status(500).json({ error: 'GPT 비교 분석 실패' });
  }
};
