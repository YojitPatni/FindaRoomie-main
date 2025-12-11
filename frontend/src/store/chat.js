import { create } from 'zustand';
import api from '../utils/api';
import { getSocket } from '../utils/socket';

const useChatStore = create((set, get) => ({
  chats: [],
  chatsLoading: false,
  selectedChatId: null,
  messages: {}, // { [chatId]: [message] }
  messagesLoading: false,
  unreadTotal: 0,
  // Group (room) chat state
  memberships: [],
  membershipsLoading: false,
  selectedRoomId: null,
  roomMessages: {}, // { [roomId]: [message] }
  roomMessagesLoading: false,
  roomUnread: {}, // { [roomId]: number }

  initSocketSubscriptions: () => {
    const socket = getSocket();
    if (socket._chatHandlersInstalled) return; // simple guard

    socket.on('dm:new-message', ({ chatId, message }) => {
      const current = get().messages[chatId] || [];
      set({ messages: { ...get().messages, [chatId]: [...current, message] } });
      // Increment unread only if this chat isn't currently open
      if (get().selectedChatId !== chatId) {
        set({ unreadTotal: (get().unreadTotal || 0) + 1 });
      }
    });

    socket.on('room:new-message', ({ roomId, message }) => {
      const current = get().roomMessages[roomId] || [];
      set({ roomMessages: { ...get().roomMessages, [roomId]: [...current, message] } });
      // Increment unread only if this room isn't currently open
      if (get().selectedRoomId !== roomId) {
        const prevMap = get().roomUnread || {};
        const nextCount = (prevMap[roomId] || 0) + 1;
        set({ roomUnread: { ...prevMap, [roomId]: nextCount }, unreadTotal: (get().unreadTotal || 0) + 1 });
      }
    });

    socket._chatHandlersInstalled = true;
  },

  loadChats: async () => {
    set({ chatsLoading: true });
    try {
      const { data } = await api.get('/chats');
      const chats = data.data || [];
      const unread = chats.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
      // also fetch room unread map for memberships (if loaded)
      const memberships = get().memberships || [];
      const roomUnread = {};
      let roomUnreadSum = 0;
      await Promise.all(memberships.map(async (r) => {
        try {
          const res = await api.get(`/room-chats/${r._id}/unread`);
          const count = res.data?.unread || 0;
          roomUnread[r._id] = count;
          roomUnreadSum += count;
        } catch {}
      }));
      set({ chats, chatsLoading: false, roomUnread, unreadTotal: unread + roomUnreadSum });
    } catch (e) {
      set({ chatsLoading: false });
      throw e;
    }
  },

  loadMemberships: async () => {
    set({ membershipsLoading: true });
    try {
      const { data } = await api.get('/rooms/me/memberships');
      set({ memberships: data.data || [], membershipsLoading: false });
    } catch (e) {
      set({ membershipsLoading: false });
      throw e;
    }
  },

  createOrGetChat: async (roomId, participantId) => {
    const { data } = await api.post('/chats', { roomId, participantId });
    const chat = data.data;
    // Ensure it's in the list
    const existing = get().chats.find(c => c._id === chat._id);
    if (!existing) set({ chats: [chat, ...get().chats] });
    // Select and join
    await get().selectChat(chat._id);
    return chat._id;
  },

  selectChat: async (chatId) => {
    set({ selectedChatId: chatId, messagesLoading: true });
    const socket = getSocket();
    socket.emit('join-chat', chatId);
    try {
      const { data } = await api.get(`/chats/${chatId}/messages?limit=50&page=1`);
      set({ messages: { ...get().messages, [chatId]: data.data || [] }, messagesLoading: false });
      // Mark DM as read and recompute unread badge
      await api.put(`/chats/${chatId}/read`);
      await get().loadChats();
    } catch (e) {
      set({ messagesLoading: false });
      throw e;
    }
  },

  sendMessage: (content) => new Promise((resolve, reject) => {
    const chatId = get().selectedChatId;
    if (!chatId || !content?.trim()) return reject(new Error('No chat or content'));
    const socket = getSocket();
    socket.emit('send-dm-message', { chatId, content: content.trim() }, (res) => {
      if (!res?.ok) return reject(new Error(res?.error || 'Failed to send'));
      // append message (server also broadcasts, but ensure sender sees immediately)
      const current = get().messages[chatId] || [];
      set({ messages: { ...get().messages, [chatId]: [...current, res.data] } });
      resolve(res.data);
    });
  }),

  // Room group chat actions
  selectRoom: async (roomId) => {
    set({ selectedRoomId: roomId, roomMessagesLoading: true });
    const socket = getSocket();
    await new Promise((resolve) => {
      socket.emit('join-room-chat', roomId, () => resolve());
    });
    try {
      const { data } = await api.get(`/room-chats/${roomId}/messages?limit=50&page=1`);
      set({ roomMessages: { ...get().roomMessages, [roomId]: data.data || [] }, roomMessagesLoading: false });
      // Mark as read and recompute badge
      await api.put(`/room-chats/${roomId}/read`);
      // recompute total unread
      const prevMap = get().roomUnread || {};
      set({ roomUnread: { ...prevMap, [roomId]: 0 } });
      await get().loadChats();
    } catch (e) {
      set({ roomMessagesLoading: false });
      throw e;
    }
  },

  sendRoomMessage: (content) => new Promise((resolve, reject) => {
    const roomId = get().selectedRoomId;
    if (!roomId || !content?.trim()) return reject(new Error('No room or content'));
    const socket = getSocket();
    socket.emit('send-room-message', { roomId, content: content.trim() }, (res) => {
      if (!res?.ok) return reject(new Error(res?.error || 'Failed to send'));
      const current = get().roomMessages[roomId] || [];
      set({ roomMessages: { ...get().roomMessages, [roomId]: [...current, res.data] } });
      resolve(res.data);
    });
  })
}));

export default useChatStore;
