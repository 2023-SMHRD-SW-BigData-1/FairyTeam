// 당신편 헤더 — 원본 구조 재현:
//   ① 상단 GNB(회원가입/로그인·마이페이지·로그아웃)
//   ② 로고 + 검색창 + 액션(판매하기/거래/채팅/찜)
//   ③ 카테고리 네비(전체 카테고리 메가드롭다운 + 퀵링크)
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/useAuth';
import { getCategoryTree } from '../api/categories';
import logo from '../assets/logo.svg';
import './Header.css';

const QUICK = [
  { label: 'EVENT', code: '500', hot: true },
  { label: '할인상품', code: '800' },
  { label: '장마철', code: '1100' },
  { label: '뜨는상품', code: '900' },
];

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [tree, setTree] = useState([]);
  const [openCat, setOpenCat] = useState(false);
  const [hovered, setHovered] = useState('');  // 호버된 대분류 code
  const catRef = useRef(null);

  useEffect(() => { getCategoryTree().then(setTree).catch(() => {}); }, []);
  const subCats = tree.find((m) => m.code === hovered)?.children || [];

  // 바깥 클릭 시 카테고리 메뉴 닫기
  useEffect(() => {
    function onDoc(e) { if (catRef.current && !catRef.current.contains(e.target)) setOpenCat(false); }
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  function onSearch(e) {
    e.preventDefault();
    navigate(`/?q=${encodeURIComponent(q.trim())}`);
  }
  function goCat(code) { setOpenCat(false); navigate(`/?category=${code}`); }

  return (
    <header className="hd">
      {/* ① 상단 GNB */}
      <div className="hd-gnb">
        <div className="container hd-gnb-inner">
          {user ? (
            <>
              <Link to="/mypage" className="hd-gnb-link">마이페이지</Link>
              <span className="hd-gnb-sep">|</span>
              <Link to="/trades" className="hd-gnb-link">거래내역</Link>
              <span className="hd-gnb-sep">|</span>
              <button className="hd-gnb-link" onClick={() => { logout(); navigate('/'); }}>로그아웃</button>
            </>
          ) : (
            <Link to="/login" className="hd-gnb-link">회원가입/로그인</Link>
          )}
        </div>
      </div>

      {/* ② 로고 + 검색 + 액션 */}
      <div className="container hd-main">
        <Link to="/" className="hd-logo"><img src={logo} alt="당신편" className="hd-logo-img" /></Link>

        <form className="hd-search" onSubmit={onSearch}>
          <input className="hd-search-input" placeholder="상품명, 지역명, @상점명 입력"
            value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="hd-search-btn" aria-label="검색">🔍</button>
        </form>

        <nav className="hd-actions">
          <Link to="/products/new" className="hd-act"><span className="hd-act-ic">＋</span>판매하기</Link>
          {user && <Link to="/trades" className="hd-act"><span className="hd-act-ic">🤝</span>거래</Link>}
          {user && <Link to="/chat" className="hd-act"><span className="hd-act-ic">💬</span>채팅</Link>}
          {user && <Link to="/favorites" className="hd-act"><span className="hd-act-ic">♥</span>찜</Link>}
        </nav>
      </div>

      {/* ③ 카테고리 네비 */}
      <div className="hd-nav">
        <div className="container hd-nav-inner">
          <div className="hd-catwrap" ref={catRef}>
            <button className={`hd-catbtn ${openCat ? 'on' : ''}`} onClick={() => setOpenCat((v) => !v)}>
              <span className="hd-catbars">≡</span> 전체 카테고리
            </button>
            {openCat && (
              <div className="hd-mega" onMouseLeave={() => setHovered('')}>
                <div className="hd-mega-majors">
                  {tree.map((c) => (
                    <button key={c.code} className={`hd-mega-item ${hovered === c.code ? 'on' : ''}`}
                      onMouseEnter={() => setHovered(c.code)} onClick={() => goCat(c.code)}>
                      <span className="hd-mega-emoji">{c.emoji}</span> {c.name}
                      <span className="hd-mega-arr">›</span>
                    </button>
                  ))}
                </div>
                {subCats.length > 0 && (
                  <div className="hd-mega-subs">
                    {subCats.map((s) => (
                      <div key={s.code} className="hd-mega-subcol">
                        <button className="hd-mega-mid" onClick={() => goCat(s.code)}>{s.name}</button>
                        {(s.children || []).map((leaf) => (
                          <button key={leaf.code} className="hd-mega-leaf" onClick={() => goCat(leaf.code)}>{leaf.name}</button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <ul className="hd-quick">
            {QUICK.map((qk) => (
              <li key={qk.label}>
                <button className={`hd-quick-link ${qk.hot ? 'hot' : ''}`} onClick={() => goCat(qk.code)}>
                  {qk.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </header>
  );
}
