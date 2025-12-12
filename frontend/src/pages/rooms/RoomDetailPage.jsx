import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import useAuthStore from '../../store/auth';
import { getSocket } from '../../utils/socket';
import useChatStore from '../../store/chat';

export default function RoomDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { createOrGetChat } = useChatStore();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reqData, setReqData] = useState({ message: '', moveInDate: '', leaseDuration: '' });
  const [roomMsgs, setRoomMsgs] = useState([]);
  const [roomMsgLoading, setRoomMsgLoading] = useState(false);
  const [roomInput, setRoomInput] = useState('');
  const [joinedRoomChat, setJoinedRoomChat] = useState(false);
  const [imageErrors, setImageErrors] = useState({});

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const { data } = await api.get(`/rooms/${id}`);
        setRoom(data.data);
      } catch (e) {
        setError('Failed to load room');
      } finally {
        setLoading(false);
      }
    };
    fetchRoom();
  }, [id]);

  // Join room chat if member and listen to messages
  useEffect(() => {
    if (!room || !user) return;
    const isMember = room.owner?._id === user._id || (Array.isArray(room.tenants) && room.tenants.some(t => t?._id === user._id));
    if (!isMember) return;

    const socket = getSocket();
    socket.emit('join-room-chat', id, async (res) => {
      if (res?.ok) {
        setJoinedRoomChat(true);
        try {
          setRoomMsgLoading(true);
          const { data } = await api.get(`/room-chats/${id}/messages?limit=50&page=1`);
          setRoomMsgs(data.data || []);
        } finally {
          setRoomMsgLoading(false);
        }
      }
    });

    const handler = ({ roomId, message }) => {
      if (roomId === id) setRoomMsgs(prev => [...prev, message]);
    };
    socket.on('room:new-message', handler);

    return () => {
      socket.off('room:new-message', handler);
      socket.emit('leave-room-chat', id);
    };
  }, [room, user, id]);

  const sendRequest = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        roomId: id,
        message: reqData.message,
        moveInDate: reqData.moveInDate,
      };
      if (reqData.leaseDuration) {
        payload.leaseDuration = Number(reqData.leaseDuration);
      }
      await api.post('/requests', payload);
      window.alert('Request sent');
      navigate('/requests/sent');
    } catch (e) {
      window.alert(e.response?.data?.error || 'Failed to send request');
    }
  };

  if (loading) return <div className="flex justify-center p-8"><span className="loading loading-spinner loading-lg"></span></div>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!room) return null;

  const isOwner = user && room.owner && room.owner._id === user._id;
  const capacity = room.capacity || 1;
  const accepted = Array.isArray(room.tenants) ? room.tenants.length : (room.tenant ? 1 : 0);
  const isFull = accepted >= capacity;
  const isMember = user && (isOwner || (Array.isArray(room.tenants) && room.tenants.some(t => t?._id === user._id)));

  return (
    <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6 min-h-full">
      <div className="md:col-span-2 space-y-4">
        <div className="carousel w-full h-72 bg-base-200 rounded-box">
          {(room.images?.length ? room.images : [{ url: 'https://placehold.co/800x400' }]).map((img, idx) => (
            <div key={idx} id={`slide${idx}`} className="carousel-item relative w-full">
              <img
                src={imageErrors[idx] ? 'https://placehold.co/800x400?text=Image+Not+Available' : img.url}
                className="w-full object-cover"
                onError={() => setImageErrors(prev => ({ ...prev, [idx]: true }))}
              />
            </div>
          ))}
        </div>
        <div className="bg-base-100 rounded-box p-4 shadow">
          <h1 className="text-3xl font-bold">{room.title}</h1>
          <p className="opacity-80">{room.location?.address}, {room.location?.city}, {room.location?.state} {room.location?.zipCode}</p>
          <div className="mt-2">Rent: <b>{room.rent?.amount}</b> {room.rent?.currency} / {room.rent?.period}</div>
          <div className="mt-1">Status: <span className="badge badge-outline capitalize">{room.status}</span></div>
          <div className="mt-1">Capacity: <b>{accepted}</b> / {capacity}</div>
          <p className="mt-4 whitespace-pre-wrap">{room.description}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-base-100 rounded-box p-4 shadow">
          <h3 className="font-semibold mb-2">Owner</h3>
          <div>{room.owner?.name}</div>
          <div className="text-sm opacity-80">{room.owner?.email}</div>
          {user && room.owner?._id !== user._id && (
            <button className="btn btn-sm btn-outline mt-2" onClick={async () => {
              try {
                await createOrGetChat(id, room.owner._id);
                navigate('/chat');
              } catch (e) {
                window.alert(e.response?.data?.error || 'Failed to start chat');
              }
            }}>Message Owner</button>
          )}
        </div>

        {(room.tenants?.length > 0 || room.tenant) && (
          <div className="bg-base-100 rounded-box p-4 shadow">
            <h3 className="font-semibold mb-2">Accepted Tenants</h3>
            <div className="space-y-2">
              {(room.tenants && room.tenants.length > 0 ? room.tenants : [room.tenant]).map((t, idx) => (
                <div key={t?._id || idx} className="flex items-center gap-2">
                  {t?.avatar && <img src={t.avatar} alt="avatar" className="w-8 h-8 rounded-full" />}
                  <div>
                    <div className="font-medium">{t?.name}</div>
                    <div className="text-sm opacity-80">{t?.email}</div>
                    {t?.phone && <div className="text-sm opacity-80">{t.phone}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isOwner && !isFull && (
          <div className="bg-base-100 rounded-box p-4 shadow">
            <h3 className="font-semibold mb-2">Request to Rent</h3>
            {user ? (
              <form className="space-y-3" onSubmit={sendRequest}>
                <textarea className="textarea textarea-bordered w-full" placeholder="Message to owner" value={reqData.message} onChange={(e) => setReqData({ ...reqData, message: e.target.value })} />
                <input className="input input-bordered w-full" type="date" value={reqData.moveInDate} onChange={(e) => setReqData({ ...reqData, moveInDate: e.target.value })} />
                <input className="input input-bordered w-full" type="number" min={1} max={24} placeholder="Lease duration (months)" value={reqData.leaseDuration || ''} onChange={(e) => setReqData({ ...reqData, leaseDuration: e.target.value })} />
                <button className="btn btn-primary w-full text-white" type="submit">Send Request</button>
              </form>
            ) : (
              <div className="alert">Please login to send a request.</div>
            )}
          </div>
        )}
        {isFull && (
          <div className="alert">This room is full and not accepting more requests.</div>
        )}

        {isMember && (
          <div className="bg-base-100 rounded-box p-4 shadow">
            <h3 className="font-semibold mb-2">Room Group Chat</h3>
            {!joinedRoomChat && <div className="text-sm opacity-70">Connecting to chat...</div>}
            <div className="border rounded-box p-3 h-64 overflow-auto bg-base-200/30 mb-2">
              {roomMsgLoading ? (
                <div className="flex justify-center p-4"><span className="loading loading-spinner" /></div>
              ) : (
                roomMsgs.map((m, idx) => (
                  <div key={idx} className="chat chat-start">
                    <div className="chat-header text-xs opacity-70">{m?.sender?.name}</div>
                    <div className="chat-bubble">{m.content}</div>
                  </div>
                ))
              )}
            </div>
            <form className="flex gap-2" onSubmit={(e) => {
              e.preventDefault();
              const text = roomInput.trim();
              if (!text) return;
              const socket = getSocket();
              socket.emit('send-room-message', { roomId: id, content: text }, (res) => {
                if (res?.ok) {
                  setRoomMsgs(prev => [...prev, res.data]);
                  setRoomInput('');
                } else {
                  window.alert(res?.error || 'Failed to send');
                }
              });
            }}>
              <input className="input input-bordered flex-1" placeholder="Message everyone in this room" value={roomInput} onChange={(e) => setRoomInput(e.target.value)} />
              <button className="btn btn-primary text-white" type="submit">Send</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
