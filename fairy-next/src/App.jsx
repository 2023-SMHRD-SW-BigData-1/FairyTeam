// 앱 루트 — 라우터 + 전역 Provider + 공통 헤더.
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ProductFormPage from './pages/ProductFormPage';
import TradeRequestPage from './pages/TradeRequestPage';
import TradesPage from './pages/TradesPage';
import FavoritesPage from './pages/FavoritesPage';
import ChatListPage from './pages/ChatListPage';
import ChatRoomPage from './pages/ChatRoomPage';
import MyPage from './pages/MyPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/products/new" element={<ProtectedRoute><ProductFormPage /></ProtectedRoute>} />
          <Route path="/products/:id/edit" element={<ProtectedRoute><ProductFormPage /></ProtectedRoute>} />
          <Route path="/products/:id/trade" element={<ProtectedRoute><TradeRequestPage /></ProtectedRoute>} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/trades" element={<ProtectedRoute><TradesPage /></ProtectedRoute>} />
          <Route path="/favorites" element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><ChatListPage /></ProtectedRoute>} />
          <Route path="/chat/:roomId" element={<ProtectedRoute><ChatRoomPage /></ProtectedRoute>} />
          <Route path="/mypage" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
          <Route path="*" element={<div className="empty">페이지를 찾을 수 없어요</div>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
