-- ============================================================================
-- 당신편 샘플 데이터 — schema.sql 실행 후에 실행하세요.
-- 테스트 계정 비번은 전부 "test1234" (bcrypt rounds=10).
-- 위치는 광주 일대(송정/충장로/상무/첨단 등) 실제 좌표 근사값.
-- ============================================================================
USE fairy;

-- 카테고리(대/중/소)는 seed_categories.sql 에서 먼저 INSERT (run-sql.js가 순서대로 실행).

-- 회원 (비번 모두 test1234)
INSERT INTO member (email, password_hash, name, nickname, phone, region_name, lat, lng, role) VALUES
  ('seller@fairy.com', '$2b$10$UN7SDdw5xEgO2Fhy8sGVquNuD2ECMVNFvDCs5leVpQzCpOqu3oQsC', '김판매', '판매왕', '010-1111-2222', '광주 광산구 송정동', 35.1395000, 126.7937000, 'MEMBER'),
  ('buyer@fairy.com',  '$2b$10$UN7SDdw5xEgO2Fhy8sGVquNuD2ECMVNFvDCs5leVpQzCpOqu3oQsC', '이구매', '득템러', '010-3333-4444', '광주 동구 충장로', 35.1490000, 126.9190000, 'MEMBER'),
  ('admin@fairy.com',  '$2b$10$UN7SDdw5xEgO2Fhy8sGVquNuD2ECMVNFvDCs5leVpQzCpOqu3oQsC', '관리자', '운영자', NULL, NULL, NULL, NULL, 'ADMIN');

-- 편의점 (위탁 픽업 장소) — 광주 일대 제휴 편의점
INSERT INTO store (brand, name, address, lat, lng) VALUES
  ('GS25',     'GS25 광주송정역점',   '광주 광산구 송정로 30',     35.1392000, 126.7925000),
  ('CU',       'CU 송정중앙점',       '광주 광산구 광산로29번길 8', 35.1410000, 126.7958000),
  ('세븐일레븐', '세븐일레븐 상무중앙점', '광주 서구 상무중앙로 80',   35.1525000, 126.8450000),
  ('이마트24',  '이마트24 첨단점',     '광주 광산구 첨단중앙로 102', 35.2240000, 126.8480000),
  ('GS25',     'GS25 수완지구점',     '광주 광산구 수완로 50',     35.1880000, 126.8150000),
  ('CU',       'CU 충장로점',         '광주 동구 충장로 70',       35.1488000, 126.9185000),
  ('세븐일레븐', '세븐일레븐 동명점',    '광주 동구 제봉로 158',     35.1462000, 126.9220000),
  ('이마트24',  '이마트24 광주터미널점', '광주 서구 무진대로 904',    35.1605000, 126.8790000);

-- 상품 (판매왕=1, 득템러=2 도 일부 판매) — 큐레이션 중고상품 18개
INSERT INTO product (seller_id, category_code, title, description, price, status, thumbnail_url, region_name, lat, lng) VALUES
  (1, '500', '아이폰 14 Pro 256GB 딥퍼플', '작년 구매. 케이스+필름 착용해 깨끗해요. 편의점 위탁거래 선호합니다.', 850000, 'ON_SALE', 'https://picsum.photos/seed/iphone14/600/600', '광주 광산구 송정동', 35.1395000, 126.7937000),
  (1, '500', '아이패드 에어 5세대 64GB', '인강용으로 쓰던 거예요. 액정 무흠집, 애플펜슬 별도.', 520000, 'ON_SALE', 'https://picsum.photos/seed/ipadair/600/600', '광주 광산구 송정동', 35.1395000, 126.7937000),
  (1, '500', '갤럭시 버즈2 프로 그라파이트', '한 달 사용. 충전기·이어팁 풀구성.', 95000, 'ON_SALE', 'https://picsum.photos/seed/buds2/600/600', '광주 광산구 송정동', 35.1395000, 126.7937000),
  (1, '500', '로지텍 MX Master 3S', '재택근무용 마우스. 잔기스 약간, 작동 완벽.', 75000, 'ON_SALE', 'https://picsum.photos/seed/mxmaster/600/600', '광주 광산구 송정동', 35.1395000, 126.7937000),
  (1, '100', '나이키 윈드러너 자켓 (M)', '한두 번 입은 새 제품급. 사이즈 안 맞아 판매.', 45000, 'ON_SALE', 'https://picsum.photos/seed/windrunner/600/600', '광주 광산구 송정동', 35.1395000, 126.7937000),
  (1, '100', '무신사 스탠다드 발마칸 코트 (L)', '작년 겨울 구매. 보풀 없이 깔끔.', 39000, 'ON_SALE', 'https://picsum.photos/seed/coat/600/600', '광주 광산구 송정동', 35.1395000, 126.7937000),
  (2, '200', '유니클로 캐시미어 니트 (L) 네이비', '몇 번 안 입었어요. 보관 잘 했습니다.', 28000, 'ON_SALE', 'https://picsum.photos/seed/knit/600/600', '광주 동구 충장로', 35.1490000, 126.9190000),
  (2, '200', '리바이스 501 청바지 32', '정사이즈. 밑단 수선 안 함.', 35000, 'ON_SALE', 'https://picsum.photos/seed/levis/600/600', '광주 동구 충장로', 35.1490000, 126.9190000),
  (1, '900', '다이슨 에어랩 컴플리트', '풀구성+박스. 거의 새것. 예약중이에요.', 320000, 'RESERVED', 'https://picsum.photos/seed/airwrap/600/600', '광주 광산구 송정동', 35.1395000, 126.7937000),
  (2, '900', '조말론 우드세이지&씨솔트 50ml', '70% 남음. 향 좋아요.', 88000, 'ON_SALE', 'https://picsum.photos/seed/jomalone/600/600', '광주 동구 충장로', 35.1490000, 126.9190000),
  (1, '700', '요넥스 배드민턴 라켓 아스트록스', '입문용으로 쓰던 거. 그립 새로 감음.', 42000, 'ON_SALE', 'https://picsum.photos/seed/racket/600/600', '광주 광산구 송정동', 35.1395000, 126.7937000),
  (2, '700', '트렉 입문용 로드자전거 (510)', '직거래는 부담돼서 가까운 편의점 픽업 원해요.', 280000, 'ON_SALE', 'https://picsum.photos/seed/roadbike/600/600', '광주 동구 충장로', 35.1490000, 126.9190000),
  (1, '1000', '1인용 패브릭 소파', '이사 정리. 나눔 가까운 가격! 가져가실 분만.', 0, 'ON_SALE', 'https://picsum.photos/seed/sofa1/600/600', '광주 광산구 송정동', 35.1395000, 126.7937000),
  (1, '1000', '이케아 책상+의자 세트', '재택용으로 쓰던 거예요. 흔들림 없음.', 60000, 'ON_SALE', 'https://picsum.photos/seed/deskset/600/600', '광주 광산구 송정동', 35.1395000, 126.7937000),
  (1, '800', '클린 코드 (로버트 마틴)', '밑줄 약간. 개발 공부용 강추.', 12000, 'ON_SALE', 'https://picsum.photos/seed/cleancode/600/600', '광주 광산구 송정동', 35.1395000, 126.7937000),
  (2, '800', '모던 자바스크립트 Deep Dive', '거의 새 책. 필기 없음.', 25000, 'ON_SALE', 'https://picsum.photos/seed/jsbook/600/600', '광주 동구 충장로', 35.1490000, 126.9190000),
  (1, '1100', '레고 테크닉 포르쉐 911', '조립 후 전시만. 부품 누락 없음.', 150000, 'ON_SALE', 'https://picsum.photos/seed/lego911/600/600', '광주 광산구 송정동', 35.1395000, 126.7937000),
  (2, '600', '필립스 에어프라이어 (거의새것)', '몇 번 안 썼어요. 박스 포함.', 45000, 'ON_SALE', 'https://picsum.photos/seed/airfryer/600/600', '광주 동구 충장로', 35.1490000, 126.9190000);

-- 일부 상품을 소분류로 재배치 (대분류 필터엔 하위포함으로 여전히 잡힘)
UPDATE product SET category_code='511'  WHERE title LIKE '아이폰%';
UPDATE product SET category_code='521'  WHERE title LIKE '아이패드%';
UPDATE product SET category_code='541'  WHERE title LIKE '갤럭시 버즈%';
UPDATE product SET category_code='556'  WHERE title LIKE '로지텍%';
UPDATE product SET category_code='114'  WHERE title LIKE '나이키 윈드러너%';
UPDATE product SET category_code='113'  WHERE title LIKE '무신사%코트%';
UPDATE product SET category_code='221'  WHERE title LIKE '유니클로 캐시미어%';
UPDATE product SET category_code='231'  WHERE title LIKE '리바이스%';
UPDATE product SET category_code='943'  WHERE title LIKE '다이슨 에어랩%';
UPDATE product SET category_code='1011' WHERE title LIKE '1인용 패브릭 소파%';
UPDATE product SET category_code='1013' WHERE title LIKE '이케아 책상%';
UPDATE product SET category_code='812'  WHERE title LIKE '클린 코드%';
UPDATE product SET category_code='624'  WHERE title LIKE '필립스 에어프라이어%';

-- 추가 이미지 (아이폰/아이패드는 여러 장)
INSERT INTO product_image (product_id, url, sort_order) VALUES
  (1, 'https://picsum.photos/seed/iphone14/600/600', 0),
  (1, 'https://picsum.photos/seed/iphone14b/600/600', 1),
  (1, 'https://picsum.photos/seed/iphone14c/600/600', 2),
  (2, 'https://picsum.photos/seed/ipadair/600/600', 0),
  (2, 'https://picsum.photos/seed/ipadairb/600/600', 1),
  (9, 'https://picsum.photos/seed/airwrap/600/600', 0);

-- 찜: 득템러(2)가 아이폰(1)·아이패드(2) 찜
INSERT INTO favorite (member_id, product_id) VALUES (2, 1), (2, 2);

-- 채팅: 득템러(2)가 아이폰(1) 판매왕(1)에게 문의
INSERT INTO chat_room (id, product_id, buyer_id, seller_id) VALUES (1, 1, 2, 1);
INSERT INTO chat_message (room_id, sender_id, content) VALUES
  (1, 2, '안녕하세요! 아이폰 아직 판매하시나요?'),
  (1, 1, '네 판매중입니다 :)'),
  (1, 2, '혹시 송정역 GS25에 위탁 가능하실까요?'),
  (1, 1, '좋아요, 그 편의점 자주 가서 가능합니다!');

-- 위탁거래 예시: 다이슨 에어랩(상품9, RESERVED)을 득템러(2)가
--   판매왕(1)에게서 GS25 광주송정역점(store 1)에 위탁받아 CONSIGNED 상태
INSERT INTO trade (product_id, seller_id, buyer_id, store_id, price, status, consigned_at) VALUES
  (9, 1, 2, 1, 320000, 'CONSIGNED', NOW());
