import { useEffect, useState } from 'react';
import useChatStore from '../../store/chat';
import api from '../../utils/api';
import useAuthStore from '../../store/auth';

export default function ChatPage() {
  const {
    initSocketSubscriptions,
    memberships,
    membershipsLoading,
    loadMemberships,
    selectedRoomId,
    roomMessages,
    roomMessagesLoading,
    roomUnread,
    selectRoom,
    sendRoomMessage
  } = useChatStore();
  const { user } = useAuthStore();

  useEffect(() => {
    initSocketSubscriptions();
    loadMemberships();
  }, [initSocketSubscriptions, loadMemberships]);

  const roomMsgsRaw = selectedRoomId ? (roomMessages[selectedRoomId] || []) : [];
  const roomMsgs = [...roomMsgsRaw].sort((a,b)=> new Date(a.createdAt||0) - new Date(b.createdAt||0));
  const [roomInput, setRoomInput] = useState('');
  const [containerRef, setContainerRef] = useState(null);

  useEffect(() => {
    if (containerRef) {
      containerRef.scrollTop = containerRef.scrollHeight;
    }
  }, [containerRef, roomMsgs.length]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto">
      <div className="md:col-span-1 bg-base-100 rounded-box p-3 shadow space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Your Rooms</h3>
        </div>
        <div className="space-y-2">
          {membershipsLoading && <div className="opacity-70 text-sm">Loading rooms...</div>}
          {!membershipsLoading && memberships.length === 0 && (
            <div className="opacity-70 text-sm">No rooms yet.</div>
          )}
          {memberships.map((r) => (
            <div key={r._id} className="p-2 rounded-box border">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium truncate max-w-[200px]">{r.title}</div>
                  <div className="text-xs opacity-70">Owner: {r.owner?.name}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button className={`btn btn-xs ${selectedRoomId===r._id?'btn-primary text-white':'btn-outline'}`} onClick={()=>selectRoom(r._id)}>
                    Open Room Chat
                  </button>
                  {roomUnread?.[r._id] > 0 && (
                    <span className="badge badge-error badge-sm text-white">{roomUnread[r._id]}</span>
                  )}
                </div>
              </div>
              <div className="mt-2 text-xs opacity-70">Roommates</div>
              <div className="mt-1 flex flex-wrap gap-2">
                {r.owner && (<span className="badge badge-outline">{r.owner.name} (Owner)</span>)}
                {(r.tenants && r.tenants.length>0 ? r.tenants : (r.tenant ? [r.tenant] : [])).map((t) => (
                  <span key={t._id} className="badge badge-outline">{t.name}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="md:col-span-2 bg-base-100 rounded-box p-3 shadow flex flex-col h-[70vh] min-h-0 overflow-hidden">
        {!selectedRoomId ? (
          <div className="flex-1 flex items-center justify-center opacity-70">Select a room to view group chat</div>
        ) : (
          <>
          <div className="font-semibold mb-2">Room Chat</div>
          <div className="flex-1 overflow-auto space-y-2 pr-1 min-h-0" ref={setContainerRef}>
            {roomMessagesLoading ? (
              <div className="flex justify-center p-4"><span className="loading loading-spinner" /></div>
            ) : (
              roomMsgs.map((m, idx) => (
                <div key={idx} className={`chat ${m?.sender?._id === user?._id ? 'chat-end' : 'chat-start'}`}>
                  <div className="chat-header text-xs opacity-70">{m?.sender?.name}</div>
                  <div className="chat-bubble break-words max-w-[80%]">{m.content}</div>
                </div>
              ))
            )}
          </div>
          <form className="mt-2 flex gap-2" onSubmit={async (e)=>{ e.preventDefault(); if(!roomInput.trim()) return; try{ await sendRoomMessage(roomInput); setRoomInput(''); }catch(err){ window.alert(err.message); } }}>
            <input className="input input-bordered flex-1" placeholder="Message everyone in this room" value={roomInput} onChange={(e)=>setRoomInput(e.target.value)} />
            <button type="submit" className="btn btn-primary text-white">Send</button>
          </form>
          </>
        )}
      </div>
    </div>
  );
}

