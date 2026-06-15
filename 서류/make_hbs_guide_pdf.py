"""
HBS 데이터 처리 가이드 PDF 생성
출력: 서류/HBS_데이터처리_가이드.pdf
"""
import sys
sys.stdout.reconfigure(encoding="utf-8")

from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# ── 한국어 폰트 등록 ──
FONT_DIR = Path("C:/Windows/Fonts")
pdfmetrics.registerFont(TTFont("Malgun",   str(FONT_DIR / "malgun.ttf")))
pdfmetrics.registerFont(TTFont("MalgunBd", str(FONT_DIR / "malgunbd.ttf")))

W, H = A4
OUT = Path(__file__).parent / "HBS_데이터처리_가이드.pdf"

# ── 색상 ──
BLUE_DARK  = colors.HexColor("#0B2F61")
BLUE_MID   = colors.HexColor("#1A56A8")
BLUE_LIGHT = colors.HexColor("#E8F0FC")
GRAY_BG    = colors.HexColor("#F5F7FA")
GRAY_LINE  = colors.HexColor("#D1D9E6")
GREEN      = colors.HexColor("#1A7A4A")
ORANGE     = colors.HexColor("#C05400")
RED        = colors.HexColor("#B91C1C")

# ── 스타일 ──
def S(name, **kw):
    base = {
        "fontName": kw.pop("bold", False) and "MalgunBd" or "Malgun",
        "fontSize": 10,
        "leading":  16,
        "textColor": colors.black,
    }
    base.update(kw)
    return ParagraphStyle(name, **base)

sTitle   = S("Title",  fontName="MalgunBd", fontSize=22, leading=30, textColor=BLUE_DARK, spaceAfter=4)
sSubtitle= S("Sub",    fontName="Malgun",   fontSize=12, leading=18, textColor=BLUE_MID,  spaceAfter=12)
sH1      = S("H1",     fontName="MalgunBd", fontSize=14, leading=20, textColor=BLUE_DARK, spaceBefore=16, spaceAfter=6)
sH2      = S("H2",     fontName="MalgunBd", fontSize=11, leading=17, textColor=BLUE_MID,  spaceBefore=10, spaceAfter=4)
sBody    = S("Body",   fontName="Malgun",   fontSize=9.5, leading=16, spaceAfter=3)
sBullet  = S("Bullet", fontName="Malgun",   fontSize=9.5, leading=16, leftIndent=14, spaceAfter=2)
sCode    = S("Code",   fontName="Courier",  fontSize=8.5, leading=14, leftIndent=10,
             backColor=GRAY_BG, borderPadding=(4,6,4,6))
sNote    = S("Note",   fontName="Malgun",   fontSize=9,  leading=14, textColor=colors.HexColor("#555555"),
             leftIndent=12, spaceAfter=2)
sWarn    = S("Warn",   fontName="MalgunBd", fontSize=9.5, leading=15, textColor=RED, leftIndent=12, spaceAfter=2)
sGreen   = S("Green",  fontName="MalgunBd", fontSize=9.5, leading=15, textColor=GREEN, leftIndent=12, spaceAfter=2)

def HR(color=GRAY_LINE, thickness=0.5):
    return HRFlowable(width="100%", thickness=thickness, color=color, spaceAfter=6, spaceBefore=4)

def P(text, style=None):
    return Paragraph(text, style or sBody)

def H1(text): return Paragraph(text, sH1)
def H2(text): return Paragraph(text, sH2)
def SP(n=6):  return Spacer(1, n)

def bullet(text): return Paragraph(f"• {text}", sBullet)
def note(text):   return Paragraph(f"  ✔ {text}", sNote)
def warn(text):   return Paragraph(f"⚠ {text}", sWarn)
def ok(text):     return Paragraph(f"✅ {text}", sGreen)

def section_box(title, content_rows, bg=BLUE_LIGHT):
    """제목 + 내용을 박스로 감싸는 테이블"""
    data = [[Paragraph(title, S("BoxTitle", fontName="MalgunBd", fontSize=10, textColor=BLUE_DARK))]] + \
           [[row] for row in content_rows]
    col_w = W - 40*mm
    style = [
        ("BACKGROUND", (0,0), (-1,0), BLUE_LIGHT),
        ("BACKGROUND", (0,1), (-1,-1), colors.white),
        ("BOX",        (0,0), (-1,-1), 1, BLUE_MID),
        ("LINEBELOW",  (0,0), (-1,0),  1, BLUE_MID),
        ("LEFTPADDING",  (0,0), (-1,-1), 10),
        ("RIGHTPADDING", (0,0), (-1,-1), 10),
        ("TOPPADDING",   (0,0), (-1,-1), 6),
        ("BOTTOMPADDING",(0,0), (-1,-1), 5),
        ("VALIGN",       (0,0), (-1,-1), "TOP"),
    ]
    return Table([[r] for r in [Paragraph(title, S("BoxTitle", fontName="MalgunBd", fontSize=10, textColor=BLUE_DARK))] + content_rows],
                 colWidths=[col_w], style=style)


def make_table(headers, rows, col_widths=None):
    col_w = col_widths or [W - 40*mm]
    hdr_style = S("TH", fontName="MalgunBd", fontSize=9, textColor=colors.white)
    cell_style = S("TD", fontName="Malgun",   fontSize=9, leading=14)
    data = [[Paragraph(h, hdr_style) for h in headers]] + \
           [[Paragraph(str(c), cell_style) for c in row] for row in rows]
    ts = TableStyle([
        ("BACKGROUND", (0,0), (-1,0), BLUE_DARK),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, GRAY_BG]),
        ("BOX",    (0,0), (-1,-1), 0.5, GRAY_LINE),
        ("GRID",   (0,0), (-1,-1), 0.3, GRAY_LINE),
        ("LEFTPADDING",  (0,0), (-1,-1), 8),
        ("RIGHTPADDING", (0,0), (-1,-1), 8),
        ("TOPPADDING",   (0,0), (-1,-1), 5),
        ("BOTTOMPADDING",(0,0), (-1,-1), 5),
        ("VALIGN",       (0,0), (-1,-1), "TOP"),
    ])
    return Table(data, colWidths=col_widths, style=ts)

# ════════════════════════════════════════════════
# 문서 조립
# ════════════════════════════════════════════════
doc = SimpleDocTemplate(str(OUT), pagesize=A4,
                        leftMargin=20*mm, rightMargin=20*mm,
                        topMargin=18*mm, bottomMargin=18*mm)
story = []

# ── 표지 영역 ──
story += [
    SP(10),
    Paragraph("HBS Working Knowledge", sSubtitle),
    Paragraph("데이터 처리 가이드", sTitle),
    HR(BLUE_MID, 1.5),
    SP(4),
    P("이 문서는 HBS_articles.csv / HBS_articles_ko.csv를 NLP 파이프라인에 통합하기 위한 "
      "처리 기준과 단계별 방법을 설명합니다. 기존 DBR / HBR 처리 방식을 기준으로 작성되었습니다."),
    SP(16),
]

# ════ 1. 데이터 파일 개요 ════
story += [H1("1. 데이터 파일 개요"), HR()]

col_w = [(W-40*mm)*r for r in [0.38, 0.12, 0.50]]
story.append(make_table(
    ["파일명", "건수", "설명"],
    [
        ["HBS_articles.csv",    "2,116건", "HBS Working Knowledge 영어 원문. title / content / summary / url / category / published_date / source 컬럼 포함."],
        ["HBS_articles_ko.csv", "2,116건", "영어 원문에 한국어 번역 컬럼을 추가한 파일. title_ko / summary_ko / content_ko_summary 포함. 번역 실패 0건."],
    ],
    col_widths=col_w,
))
story.append(SP(10))

# ════ 2. CSV 컬럼 설명 ════
story += [H1("2. CSV 컬럼 설명"), HR()]
story += [H2("■ HBS_articles.csv (원문)")]

col_w2 = [(W-40*mm)*r for r in [0.22, 0.78]]
story.append(make_table(
    ["컬럼명", "설명"],
    [
        ["title",          "기사 제목 (영어)"],
        ["content",        "기사 본문 (영어, 평균 1,000~3,000자)"],
        ["summary",        "기사 요약 또는 메타 description (영어)"],
        ["url",            "원문 URL (HBS Working Knowledge)"],
        ["category",       "카테고리 (Strategy & Innovation / Leadership / Data & Technology 등 12개)"],
        ["published_date", "게시일 (YYYY-MM-DD 형식, 일부 YYYY-01-01)"],
        ["source",         "데이터 출처 — 고정값 'HBS'"],
    ],
    col_widths=col_w2,
))
story.append(SP(8))
story += [H2("■ HBS_articles_ko.csv (번역본 추가 컬럼)")]
story.append(make_table(
    ["컬럼명", "설명"],
    [
        ["title_ko",          "제목 한국어 번역 (Google Translate)"],
        ["summary_ko",        "요약 한국어 번역"],
        ["content_ko_summary","본문 앞 500자 한국어 번역 (전체 번역 대신 핵심 요약용)"],
    ],
    col_widths=col_w2,
))
story.append(SP(12))

# ════ 3. 기존 파이프라인 요약 ════
story += [H1("3. 기존 DBR / HBR 처리 파이프라인 (참고)"), HR()]
story.append(P("DBR(11,273건) + HBR(2,062건) + NAVER(55,465건) 데이터는 아래 5단계 파이프라인으로 처리되었습니다. "
               "HBS 처리 시 동일한 흐름을 따르되 영어 특성에 맞게 수정합니다."))
story.append(SP(6))

steps = [
    ("① 전처리",         "BLUE", "Kiwi 형태소 분석 → NNG/NNP/VV/VA 품사 필터 → 불용어 220개 제거\n"
                                  "산출물: DBR_preprocessed.parquet / HBR_preprocessed.parquet"),
    ("② 라벨링",         "BLUE", "Stage 1: 성공/실패 키워드 히트 → success_ratio (≥0.65 성공 / ≤0.35 실패)\n"
                                  "Stage 2: TF-IDF 센트로이드 코사인 유사도 재분류 (모호 → neutral)\n"
                                  "산출물: label(success/failure/neutral), confidence 컬럼"),
    ("③ SBERT 임베딩",   "BLUE", "모델: jhgan/ko-sroberta-multitask (768차원, 한국어 특화)\n"
                                  "DBR+HBR+NAVER → 임베딩 생성 → FAISS IndexFlatIP 구축"),
    ("④ 리스크 모델",    "BLUE", "MLP (hidden=512×128) — Test AUC 0.9771, Failure F1 0.78\n"
                                  "risk_score = P(failure|embedding), class_weight='balanced'"),
    ("⑤ UMAP+K-means",  "BLUE", "768차원 임베딩 → UMAP 2D → K-means 12클러스터\n"
                                  "산출물: umap_coords_v3.parquet, cluster_info_v3.parquet"),
]

col_w3 = [(W-40*mm)*r for r in [0.22, 0.78]]
rows3 = [[s[0], s[2].replace("\n", "<br/>")] for s in steps]
story.append(make_table(["단계", "처리 내용"], rows3, col_widths=col_w3))
story.append(SP(12))

# ════ 4. HBS 처리 방법 ════
story += [H1("4. HBS 데이터 처리 방법"), HR()]
story.append(P("HBS 기사는 <b>영어</b>이므로 기존 Kiwi 기반 전처리를 그대로 쓸 수 없습니다. "
               "아래 두 가지 선택지 중 하나를 팀 상황에 맞게 선택하세요."))
story.append(SP(8))

# 선택지 A
story += [H2("[ 선택지 A ] 한국어 번역 컬럼 활용 — 권장 ✅")]
story.append(P("HBS_articles_ko.csv의 <b>title_ko + summary_ko + content_ko_summary</b>를 사용해 "
               "기존 DBR/HBR 파이프라인(Kiwi 전처리)을 그대로 적용합니다."))
story.append(SP(4))
story.append(make_table(
    ["장점", "단점"],
    [["기존 코드 재사용 가능 (preprocess.py 수정 최소화)\n"
      "Kiwi 형태소 분석기 그대로 사용\n"
      "DBR/HBR과 동일한 임베딩 공간에서 FAISS 검색 가능",
      "번역 과정에서 일부 뉘앙스 손실 가능\n"
      "content_ko_summary는 500자 요약이므로 전체 내용 미반영"]],
    col_widths=[(W-40*mm)*0.5, (W-40*mm)*0.5],
))
story.append(SP(4))
story += [
    ok("처리 대상 텍스트: title_ko + ' ' + summary_ko + ' ' + content_ko_summary 합치기"),
    ok("이후 preprocess.py의 Kiwi 분석 적용 (기존과 동일)"),
    ok("라벨링, 임베딩, FAISS 통합도 기존 스크립트 그대로 사용 가능"),
]
story.append(SP(10))

# 선택지 B
story += [H2("[ 선택지 B ] 영어 원문 직접 처리")]
story.append(P("HBS_articles.csv의 <b>content + summary</b> 영어 원문을 NLTK로 전처리 후 "
               "multilingual SBERT로 임베딩합니다."))
story.append(SP(4))
story.append(make_table(
    ["장점", "단점"],
    [["원문 정보 100% 보존\n"
      "paraphrase-multilingual-MiniLM-L12-v2 모델이 영어 지원",
      "전처리 코드 별도 작성 필요 (NLTK 설치)\n"
      "영어/한국어 혼합 인덱스에서 검색 품질 저하 가능"]],
    col_widths=[(W-40*mm)*0.5, (W-40*mm)*0.5],
))
story.append(SP(12))

# ════ 5. 단계별 처리 가이드 (선택지 A 기준) ════
story += [H1("5. 단계별 처리 상세 가이드 (선택지 A 기준)"), HR()]

# ─ ① 전처리 ─
story += [H2("① 전처리")]
story.append(P("기존 preprocess.py를 참고하여 HBS용 전처리 코드를 작성합니다."))
story.append(SP(3))
story.append(Paragraph(
    "# HBS 전처리 핵심 흐름 (선택지 A: 번역 컬럼 사용)<br/>"
    "import pandas as pd<br/>"
    "from kiwipiepy import Kiwi<br/><br/>"
    "df = pd.read_csv('크롤링/HBS_articles_ko.csv')<br/>"
    "# 번역 컬럼 합치기<br/>"
    "df['text'] = df['title_ko'].fillna('') + ' ' + df['summary_ko'].fillna('') + ' ' + df['content_ko_summary'].fillna('')<br/>"
    "# 이후 preprocess.py의 Kiwi 분석 함수 그대로 호출",
    sCode
))
story.append(SP(4))
story += [
    note("출력: HBS_preprocessed.parquet (clean_text, tokens, token_str, n_tokens 컬럼 포함)"),
    note("category 컬럼은 영어 그대로 저장 (Strategy & Innovation 등)"),
    note("source 컬럼 값 = 'HBS' — articles 테이블 삽입 시 그대로 사용"),
]
story.append(SP(10))

# ─ ② 라벨링 ─
story += [H2("② 라벨링")]
story.append(P("기존 label.py의 성공/실패 키워드 사전과 TF-IDF 방식을 그대로 사용합니다. "
               "단, HBS 기사는 경영학 사례 중심이므로 키워드 히트율이 DBR보다 낮을 수 있습니다."))
story.append(SP(3))
story.append(make_table(
    ["라벨", "기준", "참고 DBR 비율"],
    [
        ["success", "success_ratio ≥ 0.65 (키워드 히트 최소 3개)", "86.9%"],
        ["failure", "success_ratio ≤ 0.35 (키워드 히트 최소 3개)", "4.7%"],
        ["neutral", "중간값 또는 히트 부족 → TF-IDF Stage 2 재분류", "8.3%"],
    ],
    col_widths=[(W-40*mm)*r for r in [0.15, 0.55, 0.30]],
))
story.append(SP(4))
story += [
    note("출력: HBS_labeled.parquet (label, confidence 컬럼 추가)"),
    warn("failure 비율이 낮을 경우 Stage 2 sim_threshold를 0.10으로 낮춰 시도"),
    note("label.py 실행 시 --source HBS 인자 지원하면 소스별 분리 가능"),
]
story.append(SP(10))

# ─ ③ 임베딩 + FAISS ─
story += [H2("③ SBERT 임베딩 + FAISS 통합")]
story.append(P("기존 embed.py는 DBR+HBR을 처리합니다. HBS를 기존 FAISS 인덱스에 추가하거나 "
               "별도 인덱스를 만드는 두 방식 중 선택하세요."))
story.append(SP(3))
story.append(make_table(
    ["방식", "설명", "권장"],
    [
        ["기존 인덱스에 추가",
         "HBS_labeled.parquet을 DBR+HBR과 합쳐 embed.py 재실행 → 하나의 faiss.index 생성\n"
         "articles_meta.parquet에 HBS 행 추가",
         "권장 ✅"],
        ["별도 인덱스 생성",
         "HBS 전용 faiss_hbs.index 생성 → ai_server에서 두 인덱스 동시 검색",
         "복잡도 증가"],
    ],
    col_widths=[(W-40*mm)*r for r in [0.22, 0.58, 0.20]],
))
story.append(SP(4))
story += [
    note("사용 모델: jhgan/ko-sroberta-multitask (768차원) — 한국어 번역 텍스트에 적합"),
    note("기존 인덱스 추가 시 embeddings.npy도 np.vstack으로 합치기"),
    warn("FAISS write_index() 한글 경로 버그 — faiss.serialize_index() + Path.write_bytes() 사용"),
]
story.append(SP(10))

# ─ ④ 리스크 모델 ─
story += [H2("④ 리스크 모델 재학습 (선택)")]
story.append(P("기존 risk_model.pkl은 DBR+HBR+NAVER 68,800건으로 학습되었습니다. "
               "HBS 2,116건을 추가하면 소폭 성능 향상이 기대되지만 재학습은 선택 사항입니다."))
story.append(SP(3))
story += [
    note("재학습 시: neutral 제외, class_weight='balanced', 5-fold stratified CV 유지"),
    note("현재 모델 성능: Test AUC 0.9771 / Failure F1 0.78 — 재학습 없어도 충분"),
    note("재학습 스크립트: 데이터처리/risk_model.py"),
]
story.append(SP(10))

# ─ ⑤ DB 임포트 ─
story += [H2("⑤ DB 임포트")]
story.append(P("기존 import_articles_to_db.py를 HBS 데이터에도 적용합니다."))
story.append(SP(3))
story.append(make_table(
    ["테이블", "삽입 내용"],
    [
        ["articles",       "title(=title_ko 권장 또는 title 영어), content, summary, url, source='HBS', category, published_date"],
        ["article_labels", "label(success/failure/neutral), label_method='auto', confidence"],
        ["article_vectors","embedding_vector(JSON), umap_x, umap_y, cluster_id"],
    ],
    col_widths=col_w2,
))
story.append(SP(4))
story += [
    note("article_no = URL MD5 해시 20자 (import_articles_to_db.py 기존 로직 동일)"),
    note("url 기준 중복 스킵 → 재실행 안전"),
    warn("articles.title 컬럼 길이(VARCHAR) 확인 — HBS 제목이 길 경우 초과 주의"),
]
story.append(SP(12))

# ════ 6. 주의사항 ════
story += [H1("6. 주의사항 및 체크리스트"), HR()]
story.append(make_table(
    ["항목", "내용"],
    [
        ["인코딩",      "HBS_articles_ko.csv는 UTF-8. open() 시 encoding='utf-8' 필수"],
        ["빈 컬럼",     "일부 기사의 content가 짧을 수 있음 (100자 미만 필터됨). n_tokens 확인"],
        ["날짜 형식",   "published_date가 YYYY-01-01 형태인 기사 존재 (연도만 확인된 경우)"],
        ["카테고리",    "Social Responsibility, Artificial Intelligence는 0건 — 다른 카테고리와 URL 중복"],
        ["Leadership",  "11건 수집 — HBS 사이트에서 해당 컬렉션 기사 수가 적음"],
        ["FAISS 경로",  "한글 경로 사용 불가 — serialize_index() 방식으로 저장"],
        ["DB charset",  "campus.smhrd.com DB는 latin1 기반 — db.js에 charset 옵션 절대 추가 금지"],
    ],
    col_widths=col_w2,
))
story.append(SP(12))

# ════ 7. 빠른 실행 순서 ════
story += [H1("7. 빠른 실행 순서 (체크리스트)"), HR()]
checklist = [
    "HBS_articles_ko.csv 파일 확인 (크롤링/ 폴더)",
    "preprocess.py 수정 — 번역 컬럼(title_ko + summary_ko + content_ko_summary) 합치기 후 Kiwi 분석",
    "python 데이터처리/preprocess.py --source HBS 실행 → HBS_preprocessed.parquet 생성",
    "python 데이터처리/label.py --source HBS 실행 → HBS_labeled.parquet 생성 (label/confidence)",
    "embed.py에 HBS_labeled.parquet 추가 후 재실행 → 기존 FAISS 인덱스에 통합",
    "python 데이터처리/import_articles_to_db.py --source HBS 실행 → articles/article_labels 테이블 삽입",
    "(선택) risk_model.py 재학습 — HBS 포함 전체 데이터셋으로",
    "(선택) umap_cluster_v3.py 재실행 → article_vectors umap_x/y/cluster_id 업데이트",
]
col_wc = [(W-40*mm)*r for r in [0.06, 0.94]]
rows_c = [[f"{i+1}", text] for i, text in enumerate(checklist)]
ts_c = TableStyle([
    ("ROWBACKGROUNDS", (0,0), (-1,-1), [colors.white, GRAY_BG]),
    ("BOX",  (0,0), (-1,-1), 0.5, GRAY_LINE),
    ("GRID", (0,0), (-1,-1), 0.3, GRAY_LINE),
    ("LEFTPADDING",  (0,0), (-1,-1), 8),
    ("RIGHTPADDING", (0,0), (-1,-1), 8),
    ("TOPPADDING",   (0,0), (-1,-1), 5),
    ("BOTTOMPADDING",(0,0), (-1,-1), 5),
    ("ALIGN", (0,0), (0,-1), "CENTER"),
    ("FONT", (0,0), (0,-1), "MalgunBd"),
    ("TEXTCOLOR", (0,0), (0,-1), BLUE_DARK),
    ("VALIGN", (0,0), (-1,-1), "TOP"),
])
cell_s = S("CK", fontName="Malgun", fontSize=9.5, leading=15)
tdata = [[Paragraph(str(i+1), S("Num", fontName="MalgunBd", fontSize=10, textColor=BLUE_DARK)),
          Paragraph(text, cell_s)] for i, text in enumerate(checklist)]
story.append(Table(tdata, colWidths=col_wc, style=ts_c))
story.append(SP(16))

# ── 푸터 ──
story.append(HR(BLUE_MID, 0.8))
story.append(P("동아줄 프로젝트 — 작성일 2026-06-15 | 문의: 데이터 처리 담당"))

# ── 빌드 ──
doc.build(story)
print(f"[완료] {OUT}")
