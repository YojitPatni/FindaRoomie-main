import { useEffect, useState } from 'react';
import api from '../../utils/api';
import useAuthStore from '../../store/auth';

export default function ReceivedRequestsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { decrementPendingCount } = useAuthStore();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/requests/received');
      setItems(data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (id, action) => {
    try {
      await api.put(`/requests/${id}/${action}`);
      // Decrement pending count when accepting or rejecting
      decrementPendingCount();
      await load();
    } catch (e) {
      window.alert(e.response?.data?.error || 'Action failed');
    }
  };

  if (loading) return <div className="flex justify-center p-8"><span className="loading loading-spinner loading-lg"></span></div>;

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Received Requests</h2>
      <div className="space-y-3">
        {items.map((r) => (
          <div key={r._id} className="card bg-base-100 shadow">
            <div className="card-body">
              <div className="flex justify-between">
                <div>
                  <div className="font-semibold">{r.room?.title}</div>
                  <div className="flex items-center gap-2 text-sm opacity-90">
                    {r.requester?.avatar && <img src={r.requester.avatar} alt="avatar" className="w-8 h-8 rounded-full" />}
                    <div>
                      <div>From: <b>{r.requester?.name}</b> ({r.requester?.email})</div>
                      <div>Phone: {r.requester?.phone}</div>
                      <div>Age: {r.requester?.age} | Occupation: {r.requester?.occupation || '—'}</div>
                      {r.requester?.bio && <div className="opacity-80">Bio: {r.requester.bio}</div>}
                    </div>
                  </div>
                </div>
                <div>
                  <span className={`badge ${r.status==='accepted'?'badge-success':r.status==='rejected'?'badge-error':'badge-ghost'}`}>{r.status}</span>
                </div>
              </div>
              <div className="text-sm opacity-80">Message: {r.message}</div>
              <div className="flex gap-2 justify-end">
                {r.status === 'pending' ? (
                  <>
                    <button className="btn btn-success btn-sm text-white" onClick={() => handleAction(r._id, 'accept')}>Accept</button>
                    <button className="btn btn-error btn-sm text-white" onClick={() => handleAction(r._id, 'reject')}>Reject</button>
                  </>
                ) : (
                  <button className="btn btn-ghost btn-sm" disabled>Responded</button>
                )}
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="alert">No requests received.</div>
        )}
      </div>
    </div>
  );
}
