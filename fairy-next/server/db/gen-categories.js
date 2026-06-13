// 원본 당신편 CategoryList/*.jsx 에서 대/중/소 분류를 읽어 category INSERT SQL 생성.
//   사용: node db/gen-categories.js > db/seed_categories.sql
// 코드 규칙: 대분류=x00, 중분류=xy0(부모=x00), 소분류=xyz(부모=xy0).
import fs from 'fs';
import path from 'path';

// 대분류 11개 (이름·이모지)
const MAJORS = [
  ['100', '여성의류', '👗'], ['200', '남성의류', '👔'], ['300', '신발', '👟'],
  ['400', '가방/지갑', '👜'], ['500', '디지털', '📱'], ['600', '가전제품', '📺'],
  ['700', '스포츠/레저', '⚽'], ['800', '도서/티켓/문구', '📚'], ['900', '뷰티/미용', '💄'],
  ['1000', '가구/인테리어', '🛋️'], ['1100', '생활/주방용품', '🍳'],
];

// 원본 컴포넌트 경로 (대분류 코드 → Category{n}.jsx)
const SRC = path.resolve('..', '..', 'react-fairy', 'src', 'componenet', 'Navigation', 'CategoryList');
const FILE_BY_MAJOR = {
  '100': 'Category1', '200': 'Category2', '300': 'Category3', '400': 'Category4',
  '500': 'Category5', '600': 'Category6', '700': 'Category7', '800': 'Category8',
  '900': 'Category9', '1000': 'Category10', '1100': 'Category11',
};

const esc = (s) => s.replace(/'/g, "''");
const rows = [];
// 대분류
MAJORS.forEach(([code, name, emoji], i) =>
  rows.push(`('${code}', '${esc(name)}', '${emoji}', NULL, 1, ${i + 1})`)
);

// 코드 → 부모/깊이 계산
function parentOf(code) {
  if (code.endsWith('00')) return null;                       // 대분류
  if (code.endsWith('0')) return code.slice(0, -2) + '00';    // 중분류 → 대분류
  return code.slice(0, -1) + '0';                             // 소분류 → 중분류
}
function depthOf(code) {
  if (code.endsWith('00')) return 1;
  if (code.endsWith('0')) return 2;
  return 3;
}

for (const major of Object.keys(FILE_BY_MAJOR)) {
  const file = path.join(SRC, FILE_BY_MAJOR[major] + '.jsx');
  const txt = fs.readFileSync(file, 'utf8');
  const re = /keyword=(\d+)"><p className='(?:ctgPH|ctgP)'>([^<]+)</g;
  let m, order = 0;
  while ((m = re.exec(txt)) !== null) {
    const code = m[1];
    const name = m[2].trim();
    rows.push(`('${code}', '${esc(name)}', NULL, '${parentOf(code)}', ${depthOf(code)}, ${++order})`);
  }
}

console.log('USE fairy;');
console.log('-- 카테고리 대/중/소 (원본 당신편 CategoryList에서 자동 생성)');
console.log('INSERT INTO category (code, name, emoji, parent_code, depth, sort_order) VALUES');
console.log(rows.join(',\n') + ';');
