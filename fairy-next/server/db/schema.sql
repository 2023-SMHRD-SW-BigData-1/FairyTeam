-- ============================================================================
-- FAIRY 전체 스키마 (MariaDB / MySQL 8, InnoDB, utf8mb4)
-- 중고거래 마켓 리빌드 — ADHOUSE와 동일 컨벤션:
--   · PK = BIGINT AUTO_INCREMENT (category 만 code 자연키)
--   · 감사컬럼 created_at/updated_at(DATETIME) + reg_id/update_id(누가)
--   · 소프트삭제 deleted_at (회원/상품 등 기록성)
--   · 금액 INT(원), 불리언 TINYINT(1), 상태 ENUM
--   · 위치 좌표 DECIMAL(10,7) (동네 기반 거래)
--   · SQL 파라미터는 앱에서 ? 바인딩 (SQL 인젝션 방지)
-- DBeaver(또는 mysql CLI)에서 이 파일을 실행하세요.
-- ============================================================================

CREATE DATABASE IF NOT EXISTS fairy DEFAULT CHARSET=utf8mb4;
USE fairy;

-- 재실행 가능하게: 자식 → 부모 순서로 DROP (FK 때문)
DROP TABLE IF EXISTS chat_message;
DROP TABLE IF EXISTS chat_room;
DROP TABLE IF EXISTS trade;
DROP TABLE IF EXISTS favorite;
DROP TABLE IF EXISTS product_image;
DROP TABLE IF EXISTS product;
DROP TABLE IF EXISTS store;
DROP TABLE IF EXISTS member;
DROP TABLE IF EXISTS category;

-- ============================================================================
-- 1. 카테고리 — code 가 URL의 :code 로 쓰임 (/category/100). 소량 고정 룩업.
-- ============================================================================
CREATE TABLE category (
  code        VARCHAR(20)  NOT NULL,
  name        VARCHAR(50)  NOT NULL,
  emoji       VARCHAR(10)  NULL,
  parent_code VARCHAR(20)  NULL,                  -- 상위 분류 (대→NULL, 중→대, 소→중)
  depth       TINYINT      NOT NULL DEFAULT 1,    -- 1=대분류 2=중분류 3=소분류
  sort_order  INT          NOT NULL DEFAULT 0,
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (code),
  KEY idx_category_parent (parent_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- 2. 회원 — 비번은 반드시 BCrypt 해시 (옛 Fairy의 평문저장 → 폐기)
-- ============================================================================
CREATE TABLE member (
  id            BIGINT       NOT NULL AUTO_INCREMENT,
  email         VARCHAR(190) NOT NULL,
  password_hash VARCHAR(100) NOT NULL,
  name          VARCHAR(50)  NOT NULL,
  nickname      VARCHAR(50)  NOT NULL,
  phone         VARCHAR(30)  NULL,
  birth_date    DATE         NULL,                 -- 생년월일(YYYY-MM-DD)
  avatar_url    VARCHAR(500) NULL,
  -- 동네(거래 위치) 기본값: 위치 미설정 회원도 가입은 됨
  region_name   VARCHAR(100) NULL,
  lat           DECIMAL(10,7) NULL,
  lng           DECIMAL(10,7) NULL,
  role          ENUM('MEMBER','ADMIN') NOT NULL DEFAULT 'MEMBER',
  status        ENUM('ACTIVE','SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
  reg_id        VARCHAR(190) NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_id     VARCHAR(190) NULL,
  updated_at    DATETIME     NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    DATETIME     NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_member_email (email),
  UNIQUE KEY uq_member_nickname (nickname)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- 2-1. 편의점 — 위탁 픽업 장소. (당신편의 핵심: 여기서 비대면 거래)
--      카카오맵 좌표로 "가까운/중간 지점 편의점" 검색에 사용.
-- ============================================================================
CREATE TABLE store (
  id         BIGINT        NOT NULL AUTO_INCREMENT,
  brand      VARCHAR(30)   NOT NULL,             -- GS25/CU/세븐일레븐/이마트24
  name       VARCHAR(100)  NOT NULL,             -- 'GS25 송정역점'
  address    VARCHAR(200)  NOT NULL,
  lat        DECIMAL(10,7) NOT NULL,
  lng        DECIMAL(10,7) NOT NULL,
  is_partner TINYINT(1)    NOT NULL DEFAULT 1,   -- 제휴 편의점(위탁 가능)
  created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_store_geo (lat, lng)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- 3. 상품 — 판매자(seller_id) 소유. 상태: 판매중/예약중/거래완료
-- ============================================================================
CREATE TABLE product (
  id            BIGINT       NOT NULL AUTO_INCREMENT,
  seller_id     BIGINT       NOT NULL,
  category_code VARCHAR(20)  NOT NULL,
  title         VARCHAR(120) NOT NULL,
  description   TEXT         NULL,
  price         INT          NOT NULL DEFAULT 0,          -- 원 단위. 0 = 나눔
  is_negotiable TINYINT(1)   NOT NULL DEFAULT 0,          -- 가격제안 받기
  condition_type ENUM('USED','NEW') NOT NULL DEFAULT 'USED', -- 상품상태(중고/새상품)
  exchangeable  TINYINT(1)   NOT NULL DEFAULT 0,          -- 교환 가능 여부
  quantity      INT          NOT NULL DEFAULT 1,          -- 수량
  status        ENUM('ON_SALE','RESERVED','SOLD') NOT NULL DEFAULT 'ON_SALE',
  thumbnail_url VARCHAR(500) NULL,                        -- 대표사진(목록용)
  view_count    INT          NOT NULL DEFAULT 0,
  -- 거래 희망 위치(동네)
  region_name   VARCHAR(100) NULL,
  lat           DECIMAL(10,7) NULL,
  lng           DECIMAL(10,7) NULL,
  reg_id        VARCHAR(190) NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_id     VARCHAR(190) NULL,
  updated_at    DATETIME     NULL ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    DATETIME     NULL,
  PRIMARY KEY (id),
  KEY idx_product_category (category_code, status, deleted_at),
  KEY idx_product_seller (seller_id),
  KEY idx_product_created (created_at),
  CONSTRAINT fk_product_seller   FOREIGN KEY (seller_id)     REFERENCES member(id),
  CONSTRAINT fk_product_category FOREIGN KEY (category_code) REFERENCES category(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- 4. 상품 이미지 — 여러 장(정렬순). 0번이 보통 썸네일.
-- ============================================================================
CREATE TABLE product_image (
  id         BIGINT       NOT NULL AUTO_INCREMENT,
  product_id BIGINT       NOT NULL,
  url        VARCHAR(500) NOT NULL,
  sort_order INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_image_product (product_id, sort_order),
  CONSTRAINT fk_image_product FOREIGN KEY (product_id)
    REFERENCES product(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- 5. 찜 — (회원, 상품) 복합 PK = 같은 상품 중복 찜 방지
-- ============================================================================
CREATE TABLE favorite (
  member_id  BIGINT   NOT NULL,
  product_id BIGINT   NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (member_id, product_id),
  KEY idx_fav_product (product_id),
  CONSTRAINT fk_fav_member  FOREIGN KEY (member_id)  REFERENCES member(id)  ON DELETE CASCADE,
  CONSTRAINT fk_fav_product FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- 6. 채팅방 — 상품 1개에 (구매자, 판매자) 1:1. 같은 조합 중복 생성 방지.
-- ============================================================================
CREATE TABLE chat_room (
  id         BIGINT   NOT NULL AUTO_INCREMENT,
  product_id BIGINT   NOT NULL,
  buyer_id   BIGINT   NOT NULL,   -- 문의를 건 사람
  seller_id  BIGINT   NOT NULL,   -- 상품 주인
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_room (product_id, buyer_id),
  KEY idx_room_buyer (buyer_id),
  KEY idx_room_seller (seller_id),
  CONSTRAINT fk_room_product FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE,
  CONSTRAINT fk_room_buyer   FOREIGN KEY (buyer_id)   REFERENCES member(id),
  CONSTRAINT fk_room_seller  FOREIGN KEY (seller_id)  REFERENCES member(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- 7. 채팅 메시지 — 텍스트/이미지/이모티콘. read_at 으로 안읽음 표시.
-- ============================================================================
CREATE TABLE chat_message (
  id         BIGINT   NOT NULL AUTO_INCREMENT,
  room_id    BIGINT   NOT NULL,
  sender_id  BIGINT   NOT NULL,
  content    VARCHAR(2000) NULL,
  image_url  VARCHAR(500)  NULL,
  emoticon   VARCHAR(50)   NULL,
  read_at    DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_msg_room (room_id, id),
  CONSTRAINT fk_msg_room   FOREIGN KEY (room_id)   REFERENCES chat_room(id) ON DELETE CASCADE,
  CONSTRAINT fk_msg_sender FOREIGN KEY (sender_id) REFERENCES member(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- 8. 위탁거래 — 당신편의 핵심 흐름.
--    REQUESTED  거래 약속(편의점 선택)  →  product.status=RESERVED
--    CONSIGNED  판매자가 편의점에 물건 맡김 (위탁 완료)
--    DONE       구매자가 편의점에서 픽업 →  product.status=SOLD
--    CANCELED   취소                    →  product.status=ON_SALE 복귀
-- ============================================================================
CREATE TABLE trade (
  id           BIGINT NOT NULL AUTO_INCREMENT,
  product_id   BIGINT NOT NULL,
  seller_id    BIGINT NOT NULL,
  buyer_id     BIGINT NOT NULL,
  store_id     BIGINT NOT NULL,                 -- 위탁 픽업 편의점
  price        INT    NOT NULL,                 -- 거래 확정가
  status       ENUM('REQUESTED','CONSIGNED','DONE','CANCELED') NOT NULL DEFAULT 'REQUESTED',
  requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  consigned_at DATETIME NULL,                   -- 판매자가 맡긴 시각
  done_at      DATETIME NULL,                   -- 구매자가 픽업한 시각
  PRIMARY KEY (id),
  KEY idx_trade_product (product_id),
  KEY idx_trade_seller (seller_id),
  KEY idx_trade_buyer (buyer_id),
  CONSTRAINT fk_trade_product FOREIGN KEY (product_id) REFERENCES product(id),
  CONSTRAINT fk_trade_seller  FOREIGN KEY (seller_id)  REFERENCES member(id),
  CONSTRAINT fk_trade_buyer   FOREIGN KEY (buyer_id)   REFERENCES member(id),
  CONSTRAINT fk_trade_store   FOREIGN KEY (store_id)   REFERENCES store(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
