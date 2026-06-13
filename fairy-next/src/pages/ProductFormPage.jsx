// 상품 등록/수정 — /products/new(등록) · /products/:id/edit(수정) 공용.
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProduct, createProduct, updateProduct } from '../api/products';
import { getCategoryTree } from '../api/categories';
import { uploadImages } from '../api/uploads';
import { assetUrl } from '../api/client';
import './ProductFormPage.css';

export default function ProductFormPage() {
  const { id } = useParams();          // 있으면 수정 모드
  const editing = Boolean(id);
  const navigate = useNavigate();

  const [tree, setTree] = useState([]);        // 대>중>소
  const [major, setMajor] = useState('');      // 선택된 대분류 code
  const [middle, setMiddle] = useState('');    // 선택된 중분류 code
  const [form, setForm] = useState({
    title: '', categoryCode: '', price: '', description: '',
    isNegotiable: false, conditionType: 'USED', exchangeable: false, quantity: 1,
    regionName: '',
  });
  const [images, setImages] = useState([]); // URL 배열
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { getCategoryTree().then(setTree).catch(() => {}); }, []);

  // 코드로 트리에서 [대,중,소] 경로 찾기 (수정 모드 사전선택용)
  function findPath(nodes, code, trail = []) {
    for (const n of nodes) {
      const next = [...trail, n.code];
      if (n.code === code) return next;
      const found = findPath(n.children || [], code, next);
      if (found) return found;
    }
    return null;
  }
  // 트리·기존 categoryCode가 준비되면 대/중 선택 복원
  useEffect(() => {
    if (!editing || !tree.length || !form.categoryCode) return;
    const path = findPath(tree, form.categoryCode);
    if (path) { setMajor(path[0] || ''); setMiddle(path[1] || ''); }
  }, [editing, tree, form.categoryCode]);

  const middles = tree.find((m) => m.code === major)?.children || [];
  const minors = middles.find((m) => m.code === middle)?.children || [];

  function pickMajor(code) { setMajor(code); setMiddle(''); setForm((f) => ({ ...f, categoryCode: code })); }
  function pickMiddle(code) { setMiddle(code); setForm((f) => ({ ...f, categoryCode: code })); }
  function pickMinor(code) { setForm((f) => ({ ...f, categoryCode: code })); }

  // 수정 모드면 기존 값 채움
  useEffect(() => {
    if (!editing) return;
    getProduct(id).then((p) => {
      setForm({
        title: p.title, categoryCode: p.categoryCode, price: String(p.price),
        description: p.description || '', isNegotiable: p.isNegotiable,
        conditionType: p.conditionType || 'USED', exchangeable: p.exchangeable || false,
        quantity: p.quantity || 1, regionName: p.regionName || '',
      });
      setImages(p.images || []);
    }).catch((e) => setErr(e.message));
  }, [id, editing]);

  const set = (k) => (e) =>
    setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  async function onPickImages(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    setErr('');
    try {
      const urls = await uploadImages(files);
      setImages((prev) => [...prev, ...urls].slice(0, 5));
    } catch (e) { setErr(e.message); }
    finally { setUploading(false); }
  }

  function removeImage(url) { setImages(images.filter((u) => u !== url)); }

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    if (!form.title || !form.categoryCode) { setErr('제목과 카테고리는 필수예요'); return; }
    setBusy(true);
    const payload = {
      title: form.title,
      categoryCode: form.categoryCode,
      price: Number(form.price) || 0,
      description: form.description,
      isNegotiable: form.isNegotiable,
      conditionType: form.conditionType,
      exchangeable: form.exchangeable,
      quantity: Number(form.quantity) || 1,
      regionName: form.regionName,
      images,
    };
    try {
      if (editing) {
        await updateProduct(id, payload);
        navigate(`/products/${id}`);
      } else {
        const { id: newId } = await createProduct(payload);
        navigate(`/products/${newId}`);
      }
    } catch (e) { setErr(e.message); setBusy(false); }
  }

  return (
    <main className="container page center-narrow">
      <h1 className="page-title">{editing ? '상품 수정' : '내 물건 팔기'}</h1>
      <form onSubmit={onSubmit} className="pf">
        {/* 사진 */}
        <div className="field">
          <label>사진 (최대 5장)</label>
          <div className="pf-imgs">
            {images.map((u) => (
              <div key={u} className="pf-img">
                <img src={assetUrl(u)} alt="" />
                <button type="button" className="pf-imgx" onClick={() => removeImage(u)}>×</button>
              </div>
            ))}
            {images.length < 5 && (
              <label className="pf-add">
                {uploading ? '…' : '＋'}
                <input type="file" accept="image/*" multiple hidden onChange={onPickImages} />
              </label>
            )}
          </div>
        </div>

        <div className="field">
          <label>제목</label>
          <input className="input" value={form.title} onChange={set('title')} required />
        </div>
        <div className="field">
          <label>카테고리 <span className="muted">(대 → 중 → 소)</span></label>
          <div className="pf-cats">
            <ul className="pf-catcol">
              {tree.map((m) => (
                <li key={m.code}>
                  <button type="button" className={major === m.code ? 'on' : ''} onClick={() => pickMajor(m.code)}>
                    {m.emoji} {m.name}
                  </button>
                </li>
              ))}
            </ul>
            <ul className="pf-catcol">
              {middles.length === 0 ? <li className="pf-catempty">중분류 선택</li>
                : middles.map((m) => (
                  <li key={m.code}>
                    <button type="button" className={middle === m.code ? 'on' : ''} onClick={() => pickMiddle(m.code)}>{m.name}</button>
                  </li>
                ))}
            </ul>
            <ul className="pf-catcol">
              {minors.length === 0 ? <li className="pf-catempty">소분류 선택</li>
                : minors.map((m) => (
                  <li key={m.code}>
                    <button type="button" className={form.categoryCode === m.code ? 'on' : ''} onClick={() => pickMinor(m.code)}>{m.name}</button>
                  </li>
                ))}
            </ul>
          </div>
        </div>
        <div className="field">
          <label>상품상태</label>
          <div className="pf-radios">
            <label className={form.conditionType === 'USED' ? 'on' : ''}>
              <input type="radio" checked={form.conditionType === 'USED'} onChange={() => setForm({ ...form, conditionType: 'USED' })} /> 중고상품
            </label>
            <label className={form.conditionType === 'NEW' ? 'on' : ''}>
              <input type="radio" checked={form.conditionType === 'NEW'} onChange={() => setForm({ ...form, conditionType: 'NEW' })} /> 새상품
            </label>
          </div>
        </div>
        <div className="field">
          <label>교환</label>
          <div className="pf-radios">
            <label className={!form.exchangeable ? 'on' : ''}>
              <input type="radio" checked={!form.exchangeable} onChange={() => setForm({ ...form, exchangeable: false })} /> 교환불가
            </label>
            <label className={form.exchangeable ? 'on' : ''}>
              <input type="radio" checked={form.exchangeable} onChange={() => setForm({ ...form, exchangeable: true })} /> 교환가능
            </label>
          </div>
        </div>
        <div className="field">
          <label>가격 (원) · 0이면 나눔</label>
          <input className="input" type="number" min="0" value={form.price} onChange={set('price')} placeholder="0" />
        </div>
        <label className="pf-check">
          <input type="checkbox" checked={form.isNegotiable} onChange={set('isNegotiable')} /> 가격 제안 받기
        </label>
        <div className="field">
          <label>수량</label>
          <input className="input" type="number" min="1" value={form.quantity} onChange={set('quantity')} />
        </div>
        <div className="field">
          <label>거래 희망 동네</label>
          <input className="input" value={form.regionName} onChange={set('regionName')} placeholder="예: 광주 광산구 송정동" />
        </div>
        <div className="field">
          <label>설명</label>
          <textarea className="textarea" value={form.description} onChange={set('description')}
            placeholder="상품 상태, 거래 방법 등을 적어주세요." />
        </div>

        {err && <p className="error-text">{err}</p>}
        <button className="btn btn-primary btn-block" disabled={busy || uploading}>
          {busy ? '저장 중…' : editing ? '수정 완료' : '등록하기'}
        </button>
      </form>
    </main>
  );
}
