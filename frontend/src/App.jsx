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

  const navLinks = (
    <>
      <li>
        <Link to="/rooms" className="flex items-center gap-2">
          <Building2 className="w-4 h-4" /> Rooms
        </Link>
      </li>
      {user && (
        <>
          <li><Link to="/my-rooms">My Rooms</Link></li>
          <li><Link to="/rooms/new">Post a Room</Link></li>
          <li>
            <Link to="/requests/received" className="justify-between">
              Requests
              {pendingRequestsCount > 0 && (
                <span className="badge badge-error badge-sm text-white animate-pulse">{pendingRequestsCount}</span>
              )}
            </Link>
          </li>
          <li>
            <Link to="/chat" className="justify-between">
              Chat
              {unreadTotal > 0 && (
                <span className="badge badge-primary badge-sm text-white">{unreadTotal}</span>
              )}
            </Link>
          </li>
        </>
      )}
    </>
  );

  return (
    <div className="navbar bg-base-100/80 backdrop-blur-md border-b border-base-content/10 sticky top-0 z-50 transition-all duration-300">
      <div className="navbar-start">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" /></svg>
          </div>
          <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow-lg bg-base-100 rounded-box w-52 border border-base-200">
            {navLinks}
          </ul>
        </div>
        <Link to="/" className="btn btn-ghost text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent hover:scale-105 transition-transform">
          FindaRoomie
        </Link>
      </div>

      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1 gap-1">
          {navLinks}
        </ul>
      </div>

      <div className="navbar-end gap-2">
        <ThemeToggle />
        {user ? (
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar ring ring-primary ring-offset-base-100 ring-offset-2">
              <div className="w-10 rounded-full bg-neutral text-neutral-content flex items-center justify-center">
                {user.avatar && user.avatar.startsWith('http') ? (
                  <img src={user.avatar} alt="avatar" />
                ) : (
                  <span className="text-xl font-bold">{user.name?.[0] || 'U'}</span>
                )}
              </div>
            </div>
            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow-xl bg-base-100 rounded-box w-52 border border-base-200">
              <li className="menu-title px-4 py-2">
                <span className="text-xs opacity-50">Signed in as</span>
                <span className="font-bold text-base">{user.name}</span>
              </li>
              <li><Link to="/profile" className="justify-between">Profile <span className="badge badge-ghost badge-sm">New</span></Link></li>
              <li><Link to="/settings">Settings</Link></li>
              <div className="divider my-1"></div>
              <li><button onClick={async () => { await logout(); navigate('/'); }} className="text-error">Logout</button></li>
            </ul>
          </div>
        ) : (
          <div className="flex gap-2">
            <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
            <Link to="/register" className="btn btn-primary btn-sm shadow-md hover:shadow-lg transition-shadow">Register</Link>
          </div>
        )}
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
