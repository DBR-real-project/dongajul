-- ============================================================
--  동아줄 — AI 전략 리스크 진단 서비스
--  ERDCloud 용 DDL (MySQL)
--  작성일: 2026-06-20
--  테이블 수: 15개
--  붙여넣기 순서: FK 참조 순서 준수 (부모 테이블 먼저)
-- ============================================================

-- ────────────────────────────────────────────────────────────
--  1. users  (회원)
-- ────────────────────────────────────────────────────────────
CREATE TABLE users (
    user_id            INT            NOT NULL AUTO_INCREMENT COMMENT '회원 고유 식별자',
    email              VARCHAR(100)   NOT NULL                COMMENT '로그인 ID, 중복 불가',
    password_hash      VARCHAR(255)                           COMMENT 'bcrypt 해시, 소셜 로그인 시 NULL',
    nickname           VARCHAR(100)                           COMMENT '사용자 닉네임',
    user_type          ENUM('normal','admin')
                                      NOT NULL DEFAULT 'normal' COMMENT 'normal/admin',
    subscription_type  ENUM('free','standard','premium','enterprise')
                                      NOT NULL DEFAULT 'free'  COMMENT '구독 등급',
    profile_image_url  TEXT                                   COMMENT '프로필 이미지 URL',
    provider           VARCHAR(50)                            COMMENT 'kakao/naver/google',
    provider_id        VARCHAR(255)                           COMMENT '소셜 로그인 고유 ID',
    refresh_token      VARCHAR(512)                           COMMENT 'JWT Refresh Token',
    notif_email        TINYINT(1)     DEFAULT 1               COMMENT '이메일 알림 (0/1)',
    notif_push         TINYINT(1)     DEFAULT 1               COMMENT '푸시 알림 (0/1)',
    notif_marketing    TINYINT(1)     DEFAULT 0               COMMENT '마케팅 수신 동의 (0/1)',
    created_at         DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '가입일',
    updated_at         DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일',
    last_login_at      DATETIME                               COMMENT '최종 로그인 일시',
    PRIMARY KEY (user_id),
    UNIQUE KEY uq_email (email)
);

-- ────────────────────────────────────────────────────────────
--  2. articles  (기사)
-- ────────────────────────────────────────────────────────────
CREATE TABLE articles (
    article_id     INT            NOT NULL AUTO_INCREMENT COMMENT '기사 고유 식별자',
    article_no     VARCHAR(50)    NOT NULL                COMMENT '원문 고유 번호 (URL MD5)',
    title          VARCHAR(500)   NOT NULL                COMMENT '기사 제목',
    content        LONGTEXT                               COMMENT '기사 원문 본문',
    summary        TEXT                                   COMMENT '서비스 노출용 요약',
    url            TEXT           NOT NULL                COMMENT '원문 링크',
    company_name   VARCHAR(200)                           COMMENT '주요 기업명',
    industry       VARCHAR(100)                           COMMENT '산업 분류',
    strategy_type  VARCHAR(100)                           COMMENT '전략 유형',
    published_at   DATE                                   COMMENT '기사 발행일',
    crawled_at     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '크롤링 수집일',
    source         VARCHAR(50)                            COMMENT 'DBR/HBR/HBS',
    category       VARCHAR(100)                           COMMENT '기사 카테고리',
    PRIMARY KEY (article_id),
    UNIQUE KEY uq_article_no (article_no)
);

-- ────────────────────────────────────────────────────────────
--  3. clusters  (클러스터)
-- ────────────────────────────────────────────────────────────
CREATE TABLE clusters (
    cluster_id               INT            NOT NULL AUTO_INCREMENT COMMENT '클러스터 고유 식별자',
    cluster_name             VARCHAR(100)                           COMMENT '클러스터 주제명',
    representative_industry  VARCHAR(100)                           COMMENT '대표 산업군',
    top_keywords             TEXT                                   COMMENT '대표 키워드 (JSON 문자열)',
    article_count            INT            DEFAULT 0               COMMENT '포함 기사 수',
    center_x                 FLOAT                                  COMMENT 'UMAP 중심 X좌표',
    center_y                 FLOAT                                  COMMENT 'UMAP 중심 Y좌표',
    PRIMARY KEY (cluster_id)
);

-- ────────────────────────────────────────────────────────────
--  4. article_labels  (기사 라벨)
-- ────────────────────────────────────────────────────────────
CREATE TABLE article_labels (
    label_id      INT            NOT NULL AUTO_INCREMENT COMMENT '라벨 고유 식별자',
    article_id    INT            NOT NULL                COMMENT 'articles.article_id 참조',
    label         ENUM('success','failure','neutral')
                                 NOT NULL                COMMENT '성공/실패/중립',
    label_method  ENUM('auto','manual')
                                 NOT NULL DEFAULT 'auto' COMMENT '자동/수동 라벨링',
    confidence    FLOAT                                  COMMENT '자동 라벨 신뢰도 (0~1)',
    created_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '라벨링 일시',
    PRIMARY KEY (label_id),
    CONSTRAINT fk_al_article FOREIGN KEY (article_id) REFERENCES articles (article_id)
);

-- ────────────────────────────────────────────────────────────
--  5. article_vectors  (기사 벡터)
-- ────────────────────────────────────────────────────────────
CREATE TABLE article_vectors (
    vector_id         INT    NOT NULL AUTO_INCREMENT COMMENT '벡터 고유 식별자',
    article_id        INT    NOT NULL                COMMENT 'articles.article_id 참조, 기사당 1개',
    tfidf_vector      JSON                           COMMENT 'TF-IDF 벡터 (예비 컬럼)',
    embedding_vector  JSON                           COMMENT 'SBERT 임베딩 벡터 (768차원)',
    cluster_id        INT                            COMMENT 'clusters.cluster_id 참조',
    umap_x            FLOAT                          COMMENT 'UMAP 2D 변환 X값',
    umap_y            FLOAT                          COMMENT 'UMAP 2D 변환 Y값',
    created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '벡터 생성일',
    PRIMARY KEY (vector_id),
    UNIQUE KEY uq_av_article (article_id),
    CONSTRAINT fk_av_article FOREIGN KEY (article_id)  REFERENCES articles  (article_id),
    CONSTRAINT fk_av_cluster FOREIGN KEY (cluster_id)  REFERENCES clusters  (cluster_id)
);

-- ────────────────────────────────────────────────────────────
--  6. diagnosis_requests  (전략 진단 요청)
-- ────────────────────────────────────────────────────────────
CREATE TABLE diagnosis_requests (
    diagnosis_id  INT     NOT NULL AUTO_INCREMENT COMMENT '진단 요청 고유 식별자',
    user_id       INT     NOT NULL                COMMENT 'users.user_id 참조',
    input_text    TEXT                            COMMENT '사용자 자연어 전략 입력',
    industry      VARCHAR(100)                    COMMENT '사용자 산업군',
    status        ENUM('pending','processing','completed','failed')
                          NOT NULL DEFAULT 'pending' COMMENT '진단 진행 상태',
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '요청 생성일',
    PRIMARY KEY (diagnosis_id),
    CONSTRAINT fk_dr_user FOREIGN KEY (user_id) REFERENCES users (user_id)
);

-- ────────────────────────────────────────────────────────────
--  7. analysis_results  (분석 결과)
-- ────────────────────────────────────────────────────────────
CREATE TABLE analysis_results (
    result_id        INT          NOT NULL AUTO_INCREMENT COMMENT '분석 결과 고유 식별자',
    diagnosis_id     INT          NOT NULL                COMMENT 'diagnosis_requests.diagnosis_id 참조, 1:1',
    risk_score       FLOAT                                COMMENT '전략 리스크 점수 (0~1)',
    query_umap_x     FLOAT                                COMMENT '진단 입력의 UMAP X좌표',
    query_umap_y     FLOAT                                COMMENT '진단 입력의 UMAP Y좌표',
    query_cluster_id INT                                  COMMENT '진단 입력이 속한 클러스터 ID',
    analysis_mode    VARCHAR(50)                          COMMENT 'contrast/success_only/auto',
    success_keywords TEXT                                 COMMENT '유사 성공 사례 카테고리 키워드',
    failure_keywords TEXT                                 COMMENT '유사 실패 사례 카테고리 키워드',
    report_json      MEDIUMTEXT                           COMMENT 'GPT 생성 리포트 전체 JSON',
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '결과 생성일',
    PRIMARY KEY (result_id),
    UNIQUE KEY uq_ar_diagnosis (diagnosis_id),
    CONSTRAINT fk_ar_diagnosis FOREIGN KEY (diagnosis_id) REFERENCES diagnosis_requests (diagnosis_id)
);

-- ────────────────────────────────────────────────────────────
--  8. similar_article_matches  (유사 기사 매칭)
-- ────────────────────────────────────────────────────────────
CREATE TABLE similar_article_matches (
    match_id          INT    NOT NULL AUTO_INCREMENT COMMENT '매칭 고유 식별자',
    diagnosis_id      INT    NOT NULL                COMMENT 'diagnosis_requests.diagnosis_id 참조',
    article_id        INT    NOT NULL                COMMENT 'articles.article_id 참조',
    similarity_score  FLOAT                          COMMENT '코사인 유사도 (0~1)',
    recommend_rank    INT                            COMMENT '화면 표시 순위 (1~5)',
    case_type         VARCHAR(20)                    COMMENT 'success/failure/neutral',
    PRIMARY KEY (match_id),
    CONSTRAINT fk_sam_diagnosis FOREIGN KEY (diagnosis_id) REFERENCES diagnosis_requests (diagnosis_id),
    CONSTRAINT fk_sam_article   FOREIGN KEY (article_id)   REFERENCES articles           (article_id)
);

-- ────────────────────────────────────────────────────────────
--  9. semantic_maps  (시맨틱 맵)
-- ────────────────────────────────────────────────────────────
CREATE TABLE semantic_maps (
    map_id          INT NOT NULL AUTO_INCREMENT COMMENT '맵 노드 고유 식별자',
    diagnosis_id    INT NOT NULL                COMMENT 'diagnosis_requests.diagnosis_id 참조',
    article_id      INT NOT NULL                COMMENT 'articles.article_id 참조',
    recommend_rank  INT                         COMMENT '화면 표시 순위',
    PRIMARY KEY (map_id),
    CONSTRAINT fk_sm_diagnosis FOREIGN KEY (diagnosis_id) REFERENCES diagnosis_requests (diagnosis_id),
    CONSTRAINT fk_sm_article   FOREIGN KEY (article_id)   REFERENCES articles           (article_id)
);

-- ────────────────────────────────────────────────────────────
--  10. strategies  (전략 워크스페이스)
-- ────────────────────────────────────────────────────────────
CREATE TABLE strategies (
    strategy_id         INT            NOT NULL AUTO_INCREMENT COMMENT '전략 고유 식별자',
    user_id             INT            NOT NULL                COMMENT 'users.user_id 참조',
    name                VARCHAR(255)   NOT NULL                COMMENT '전략 이름',
    content             TEXT                                   COMMENT '전략 상세 내용',
    keywords            JSON           DEFAULT NULL            COMMENT '전략 키워드 목록 (JSON 배열)',
    metrics_conversion  FLOAT          DEFAULT 5.0             COMMENT '전환율 목표값 (%)',
    metrics_roi         FLOAT          DEFAULT 100             COMMENT 'ROI 목표값 (%)',
    metrics_growth      FLOAT          DEFAULT 10              COMMENT '성장률 목표값 (%)',
    metrics_cost        FLOAT          DEFAULT 1000            COMMENT '비용 목표값 (만원)',
    metrics_engagement  FLOAT          DEFAULT 5.0             COMMENT '참여율 목표값 (%)',
    created_at          TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '전략 생성일',
    updated_at          TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '최종 수정일',
    PRIMARY KEY (strategy_id),
    CONSTRAINT fk_st_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
);

-- ────────────────────────────────────────────────────────────
--  11. chat_sessions  (AI 채팅 세션)
-- ────────────────────────────────────────────────────────────
CREATE TABLE chat_sessions (
    session_id  INT          NOT NULL AUTO_INCREMENT COMMENT '세션 고유 식별자',
    user_id     INT          NOT NULL                COMMENT 'users.user_id 참조',
    title       VARCHAR(200) DEFAULT '새 대화'       COMMENT '대화 세션 제목',
    created_at  DATETIME     NOT NULL DEFAULT NOW()  COMMENT '세션 생성일',
    updated_at  DATETIME     NOT NULL DEFAULT NOW() ON UPDATE NOW() COMMENT '최종 메시지 일시',
    PRIMARY KEY (session_id),
    INDEX idx_cs_user_updated (user_id, updated_at),
    CONSTRAINT fk_cs_user FOREIGN KEY (user_id) REFERENCES users (user_id)
);

-- ────────────────────────────────────────────────────────────
--  12. chat_messages  (AI 채팅 메시지)
-- ────────────────────────────────────────────────────────────
CREATE TABLE chat_messages (
    msg_id      INT     NOT NULL AUTO_INCREMENT     COMMENT '메시지 고유 식별자',
    user_id     INT     NOT NULL                    COMMENT 'users.user_id 참조',
    session_id  INT     DEFAULT NULL                COMMENT 'chat_sessions.session_id 참조',
    role        ENUM('user','assistant') NOT NULL   COMMENT '발화자 역할',
    content     TEXT    NOT NULL                    COMMENT '메시지 내용',
    created_at  DATETIME NOT NULL DEFAULT NOW()     COMMENT '메시지 생성일',
    PRIMARY KEY (msg_id),
    INDEX idx_cm_user_created (user_id, created_at),
    INDEX idx_cm_session (session_id),
    CONSTRAINT fk_cm_user    FOREIGN KEY (user_id)    REFERENCES users         (user_id),
    CONSTRAINT fk_cm_session FOREIGN KEY (session_id) REFERENCES chat_sessions (session_id) ON DELETE SET NULL
);

-- ────────────────────────────────────────────────────────────
--  13. feedbacks  (피드백)
-- ────────────────────────────────────────────────────────────
CREATE TABLE feedbacks (
    feedback_id   INT      NOT NULL AUTO_INCREMENT COMMENT '피드백 고유 식별자',
    user_id       INT      NOT NULL                COMMENT 'users.user_id 참조',
    diagnosis_id  INT      NOT NULL                COMMENT 'diagnosis_requests.diagnosis_id 참조',
    rating        TINYINT                          COMMENT '사용자 평점 (1~5)',
    opinion_text  TEXT                             COMMENT '사용자 의견',
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '피드백 생성일',
    PRIMARY KEY (feedback_id),
    CONSTRAINT fk_fb_user      FOREIGN KEY (user_id)      REFERENCES users              (user_id),
    CONSTRAINT fk_fb_diagnosis FOREIGN KEY (diagnosis_id) REFERENCES diagnosis_requests (diagnosis_id)
);

-- ────────────────────────────────────────────────────────────
--  14. notifications  (알림)
-- ────────────────────────────────────────────────────────────
CREATE TABLE notifications (
    notification_id    INT          NOT NULL AUTO_INCREMENT COMMENT '알림 고유 식별자',
    user_id            INT          NOT NULL                COMMENT 'users.user_id 참조',
    notification_type  VARCHAR(50)                          COMMENT '알림 유형',
    message            TEXT                                 COMMENT '알림 메시지',
    is_read            TINYINT      DEFAULT 0               COMMENT '읽음 여부 (0: 미확인, 1: 확인)',
    created_at         DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '알림 생성일',
    PRIMARY KEY (notification_id),
    CONSTRAINT fk_nf_user FOREIGN KEY (user_id) REFERENCES users (user_id)
);

-- ────────────────────────────────────────────────────────────
--  15. subscriptions  (구독)
-- ────────────────────────────────────────────────────────────
CREATE TABLE subscriptions (
    subscription_id  INT         NOT NULL AUTO_INCREMENT COMMENT '구독 고유 식별자',
    user_id          INT         NOT NULL                COMMENT 'users.user_id 참조',
    plan_type        VARCHAR(50) NOT NULL                COMMENT 'free/premium_monthly/premium_annual',
    status           VARCHAR(50) DEFAULT 'active'        COMMENT 'active/expired/cancelled',
    start_date       DATE        NOT NULL                COMMENT '구독 시작일',
    end_date         DATE        NOT NULL                COMMENT '구독 만료일',
    auto_renewal     TINYINT     DEFAULT 0               COMMENT '자동 갱신 (0/1)',
    payment_method   VARCHAR(50)                         COMMENT '결제 수단',
    created_at       DATETIME    DEFAULT CURRENT_TIMESTAMP COMMENT '구독 생성일',
    updated_at       DATETIME    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '최종 수정일',
    PRIMARY KEY (subscription_id),
    CONSTRAINT fk_sub_user FOREIGN KEY (user_id) REFERENCES users (user_id)
);
