import { useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, LogIn, LogOut, UserPlus, MessageCircle, Building2, Inbox, Send, Plus } from 'lucide-react';
import useAuthStore from './store/auth';
import useChatStore from './store/chat';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterPage from './pages/auth/RegisterPage.jsx';
import RoomsPage from './pages/rooms/RoomsPage.jsx';
import MyRoomsPage from './pages/rooms/MyRoomsPage.jsx';
import ChatPage from './pages/chat/ChatPage.jsx';
import RoomDetailPage from './pages/rooms/RoomDetailPage.jsx';
import NewRoomPage from './pages/rooms/NewRoomPage.jsx';
import EditRoomPage from './pages/rooms/EditRoomPage.jsx';
import SentRequestsPage from './pages/requests/SentRequestsPage.jsx';
import ReceivedRequestsPage from './pages/requests/ReceivedRequestsPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';
import PageTransition from './components/PageTransition.jsx';

function Navbar() {
  const { user, logout, fetchMe, pendingRequestsCount } = useAuthStore();
  const { unreadTotal, initSocketSubscriptions, loadChats, loadMemberships } = useChatStore();
  const navigate = useNavigate();

  useEffect(() => { fetchMe(); }, [fetchMe]);
  useEffect(() => {
    if (user) {
      initSocketSubscriptions();
      (async () => {
        try {
          await loadMemberships();
        } finally {
          await loadChats();
        }
      })();
    }
  }, [user, initSocketSubscriptions, loadChats, loadMemberships]);

  return (
    <div className="navbar bg-base-100/80 backdrop-blur sticky top-0 z-40 border-b border-base-200">
      <div className="flex-1">
        <Link to="/" className="btn btn-ghost text-xl font-bold">FindaRoomie</Link>
      </div>
      <div className="flex-none gap-2 items-center">
        <Link to="/rooms" className="btn btn-ghost"><Building2 className="w-4 h-4"/> Rooms</Link>
        {user ? (
          <>
            <Link to="/my-rooms" className="btn btn-ghost">My Rooms</Link>
            <Link to="/rooms/new" className="btn btn-ghost"><Plus className="w-4 h-4"/> New</Link>
            <Link to="/requests/received" className="btn btn-ghost relative">
              <Inbox className="w-4 h-4"/> Received
              {pendingRequestsCount > 0 && (
                <span className="badge badge-error badge-sm absolute -top-2 -right-2 text-white">
                  {pendingRequestsCount}
                </span>
              )}
            </Link>
            <Link to="/requests/sent" className="btn btn-ghost"><Send className="w-4 h-4"/> Sent</Link>
            <Link to="/chat" className="btn btn-ghost relative">
              <MessageCircle className="w-4 h-4"/> Chat
              {unreadTotal > 0 && (
                <span className="badge badge-primary badge-sm absolute -top-2 -right-2 text-white">
                  {unreadTotal}
                </span>
              )}
            </Link>
            <div className="flex items-center gap-2 px-2">
              <div className="avatar placeholder">
                <div className="bg-primary text-primary-content rounded-full w-8 h-8 flex items-center justify-center">
                  <span className="text-sm">{user?.name?.[0] || 'U'}</span>
                </div>
              </div>
              <span className="text-sm font-medium max-w-[140px] truncate" title={user?.name}>{user?.name}</span>
            </div>
            <button className="btn btn-outline btn-sm" onClick={async () => { await logout(); navigate('/'); }}>
              <LogOut className="w-4 h-4"/> Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-outline btn-sm"><LogIn className="w-4 h-4"/> Login</Link>
            <Link to="/register" className="btn btn-primary btn-sm text-white"><UserPlus className="w-4 h-4"/> Register</Link>
          </>
        )}
        <ThemeToggle />
      </div>
    </div>
  );
}

export default function App() {
  const location = useLocation();
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen">
      <Navbar />
      <div className="container mx-auto p-4">
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            <Routes location={location}>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/rooms" element={<RoomsPage />} />
              <Route path="/rooms/:id" element={<RoomDetailPage />} />
              <Route path="/rooms/:id/edit" element={<ProtectedRoute><EditRoomPage /></ProtectedRoute>} />
              <Route path="/my-rooms" element={<ProtectedRoute><MyRoomsPage /></ProtectedRoute>} />
              <Route path="/rooms/new" element={<ProtectedRoute><NewRoomPage /></ProtectedRoute>} />
              <Route path="/requests/sent" element={<ProtectedRoute><SentRequestsPage /></ProtectedRoute>} />
              <Route path="/requests/received" element={<ProtectedRoute><ReceivedRequestsPage /></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
            </Routes>
          </PageTransition>
        </AnimatePresence>
      </div>
      <Toaster />
    </motion.div>
  );
}
