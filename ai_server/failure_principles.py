"""
비즈니스 저서 기반 전략 실패 원칙 Knowledge Base

출처: Porter(경쟁전략), Christensen(파괴적혁신), Thiel(Zero to One),
      Ries(린스타트업), Kim&Mauborgne(블루오션), Collins(좋은기업→위대한기업),
      Kahneman(생각에관한생각), Taleb(블랙스완), HBR 실패 연구 시리즈
"""
from __future__ import annotations

FAILURE_PRINCIPLES: list[dict] = [
    # ── Porter 경쟁전략 ──────────────────────────────────────
    {
        "id": "porter_01",
        "source": "Porter - 경쟁전략",
        "principle": "중간에 걸침(Stuck in the Middle)",
        "description": "원가우위도 차별화도 아닌 중간 포지션은 양쪽에서 공격받아 실패한다. 전략적 선택 없이 모두를 만족시키려는 기업은 어느 쪽도 이기지 못한다.",
        "risk_keywords": ["모두를 위한", "다양한 고객", "포지셔닝 불명확", "중간 가격"],
    },
    {
        "id": "porter_02",
        "source": "Porter - 경쟁전략",
        "principle": "진입장벽 없는 시장 진입",
        "description": "규모의 경제, 브랜드, 전환비용, 특허 등 진입장벽 없이 매력적인 시장에 진입하면 대형 플레이어의 역습으로 실패한다.",
        "risk_keywords": ["경쟁사 대비 우위 없음", "누구나 할 수 있는", "레드오션", "차별화 없음"],
    },
    # ── Christensen 파괴적 혁신 ──────────────────────────────
    {
        "id": "christensen_01",
        "source": "Christensen - 혁신기업의 딜레마",
        "principle": "기존 고객 의존 함정",
        "description": "기존 우량 고객의 요구에만 집중하다 하위 시장에서 올라오는 파괴적 혁신에 대응 못해 시장을 잃는다.",
        "risk_keywords": ["기존 고객 중심", "프리미엄 고객", "하이엔드"],
    },
    {
        "id": "christensen_02",
        "source": "Christensen - 혁신기업의 딜레마",
        "principle": "과잉 스펙 함정",
        "description": "고객이 필요로 하는 수준 이상의 성능을 제공하면 저가 경쟁자에게 시장을 빼앗긴다.",
        "risk_keywords": ["최고 성능", "최고 품질", "고사양", "프리미엄"],
    },
    # ── Thiel - Zero to One ──────────────────────────────────
    {
        "id": "thiel_01",
        "source": "Thiel - Zero to One",
        "principle": "경쟁 = 수익 파괴",
        "description": "완전경쟁 시장에서는 아무도 수익을 내지 못한다. 독점이 없는 전략은 장기적으로 실패한다.",
        "risk_keywords": ["기존 시장", "경쟁 심화", "레드오션", "가격 경쟁"],
    },
    {
        "id": "thiel_02",
        "source": "Thiel - Zero to One",
        "principle": "비밀 없는 사업",
        "description": "남들이 모르는 인사이트(비밀) 없이 시작한 사업은 진입장벽이 없어 곧 복제된다.",
        "risk_keywords": ["누구나 아는", "일반적인 방법", "기존 방식"],
    },
    # ── Ries - 린스타트업 ────────────────────────────────────
    {
        "id": "lean_01",
        "source": "Ries - 린스타트업",
        "principle": "검증 없는 대규모 투자",
        "description": "고객 검증 없이 대규모 자원을 투입하면 가설이 틀렸을 때 회복 불가능한 손실이 발생한다. Build-Measure-Learn 없이 전속력으로 달리다 벽에 부딪힌다.",
        "risk_keywords": ["전액 투자", "전부", "대규모", "검증 없이", "바로 출시"],
    },
    {
        "id": "lean_02",
        "source": "Ries - 린스타트업",
        "principle": "고객 개발 없는 제품 개발",
        "description": "실제 고객과 대화 없이 만든 제품은 시장에서 외면받는다. 가정(assumption)을 사실로 오인한 실패의 가장 흔한 패턴이다.",
        "risk_keywords": ["우리가 생각하기에", "고객이 원할 것", "시장조사 없이"],
    },
    # ── Kim & Mauborgne - 블루오션 ──────────────────────────
    {
        "id": "blueocean_01",
        "source": "Kim & Mauborgne - 블루오션 전략",
        "principle": "레드오션에서의 경쟁",
        "description": "이미 포화된 시장에서 기존 경쟁자보다 잘 하려는 전략은 수익성이 낮다. 경쟁이 없는 새 시장(블루오션)을 창출해야 한다.",
        "risk_keywords": ["시장점유율 확대", "경쟁사 이기기", "기존 시장"],
    },
    # ── Collins - 좋은기업에서 위대한기업으로 ────────────────
    {
        "id": "collins_01",
        "source": "Collins - 좋은기업에서 위대한기업으로",
        "principle": "핵심역량 밖의 무분별한 확장",
        "description": "고슴도치 원칙: 자신이 세계 최고가 될 수 없는 분야에 진입하면 실패한다. 핵심역량 없이 성장만 추구하는 기업은 결국 붕괴한다.",
        "risk_keywords": ["신사업 다각화", "기존과 다른 분야", "경험 없는"],
    },
    {
        "id": "collins_02",
        "source": "Collins - 좋은기업에서 위대한기업으로",
        "principle": "플라이휠 없는 성장",
        "description": "한 번의 결정적 행동으로 성공을 기대하는 것은 환상이다. 지속가능한 성장은 작은 성과가 쌓여 가속도가 붙는 플라이휠 구조가 필요하다.",
        "risk_keywords": ["단번에", "빠른 성장", "급격한 확장", "단기간"],
    },
    # ── HBR 실패 연구 ────────────────────────────────────────
    {
        "id": "hbr_01",
        "source": "HBR - Why Companies Fail",
        "principle": "실행 역량 없는 전략",
        "description": "훌륭한 전략도 실행 능력(인력, 프로세스, 자금)이 없으면 실패한다. 전략-실행 갭은 기업 실패의 가장 큰 원인 중 하나다.",
        "risk_keywords": ["계획만", "실행 방법 불명확", "팀 없음", "자금 없음"],
    },
    {
        "id": "hbr_02",
        "source": "HBR - 스타트업 실패 분석",
        "principle": "시장 수요 없는 제품",
        "description": "CB Insights 분석 결과 스타트업 실패 1위 원인(42%)은 시장 수요 없음. 기술이 뛰어나도 고객이 필요로 하지 않으면 실패한다.",
        "risk_keywords": ["기술 중심", "우리가 만들고 싶은", "시장 수요 미확인"],
    },
    {
        "id": "hbr_03",
        "source": "HBR - 성장의 함정",
        "principle": "수익성 없는 성장",
        "description": "매출 성장에 집착하다 단위경제학(유닛 이코노믹스)이 부정적인 상태에서 확장하면 손실이 기하급수적으로 증가한다.",
        "risk_keywords": ["성장 우선", "수익은 나중에", "규모 확장 후 수익화"],
    },
    # ── Taleb - 블랙스완 ─────────────────────────────────────
    {
        "id": "taleb_01",
        "source": "Taleb - 블랙스완",
        "principle": "극단적 집중 리스크",
        "description": "단일 자산, 단일 고객, 단일 채널에 전부를 베팅하면 예측 불가능한 충격(블랙스완)에 생존 불가능한 상태가 된다.",
        "risk_keywords": ["전재산", "전액", "전부", "하나에만", "올인", "단일"],
    },
    {
        "id": "taleb_02",
        "source": "Taleb - 블랙스완",
        "principle": "과거 데이터 과신",
        "description": "과거 성공 패턴이 미래를 보장하지 않는다. 특히 금융·투기 자산에서 과거 수익률을 근거로 베팅하면 파국적 손실이 발생한다.",
        "risk_keywords": ["과거에 성공했으니", "데이터상 안전", "역사적으로"],
    },
    # ── 한국 스타트업 / DBR 실패 패턴 ────────────────────────
    {
        "id": "kr_01",
        "source": "DBR 실패 사례 분석",
        "principle": "초기 수익모델 부재",
        "description": "한국 스타트업 실패의 주요 원인: 사용자는 늘었지만 수익모델 없이 투자금을 소진. 무료 서비스로 시장을 선점 후 유료 전환 실패.",
        "risk_keywords": ["무료로 먼저", "수익은 나중", "MAU 먼저", "트래픽 먼저"],
    },
    {
        "id": "kr_02",
        "source": "DBR 실패 사례 분석",
        "principle": "대기업 진입 시 생존 불가",
        "description": "시장이 검증되면 대기업이 진입해 스타트업을 압살한다. 진입장벽 없는 B2C 서비스는 대기업 카피에 취약하다.",
        "risk_keywords": ["대기업도 할 수 있는", "진입장벽 없음", "네이버 카카오 진입 가능"],
    },
]


def get_all_principles_text() -> str:
    """모든 원칙을 텍스트로 반환 (GPT 프롬프트 삽입용)"""
    lines = []
    for p in FAILURE_PRINCIPLES:
        lines.append(f"[{p['source']}] {p['principle']}: {p['description']}")
    return "\n".join(lines)


def find_relevant_principles(strategy_text: str, top_k: int = 5) -> list[dict]:
    """전략 텍스트와 관련된 실패 원칙 반환 (키워드 매칭)"""
    scored = []
    for p in FAILURE_PRINCIPLES:
        score = sum(1 for kw in p["risk_keywords"] if kw in strategy_text)
        if score > 0:
            scored.append((score, p))

    scored.sort(key=lambda x: -x[0])

    # 매칭 없으면 전체에서 상위 top_k 반환
    if not scored:
        return FAILURE_PRINCIPLES[:top_k]

    return [p for _, p in scored[:top_k]]


def format_principles_for_prompt(principles: list[dict]) -> str:
    """GPT 프롬프트에 삽입할 형태로 포맷"""
    lines = []
    for p in principles:
        lines.append(
            f"- [{p['source']}] {p['principle']}: {p['description']}"
        )
    return "\n".join(lines)
