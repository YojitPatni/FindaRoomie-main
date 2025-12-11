import { useEffect, useState } from 'react';
import api from '../../utils/api';

export default function SentRequestsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/requests/sent');
        setItems(data.data || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="flex justify-center p-8"><span className="loading loading-spinner loading-lg"></span></div>;

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Sent Requests</h2>
      <div className="space-y-3">
        {items.map((r) => (
          <div key={r._id} className="card bg-base-100 shadow">
            <div className="card-body">
              <div className="flex justify-between">
                <div>
                  <div className="font-semibold">{r.room?.title}</div>
                  <div className="text-sm opacity-90">
                    Owner: <b>{r.owner?.name}</b>
                    <div>Email: {r.owner?.email}</div>
                    <div>Phone: {r.owner?.phone}</div>
                  </div>
                </div>
                <div>
                  <span className={`badge ${r.status==='accepted'?'badge-success':r.status==='rejected'?'badge-error':'badge-ghost'}`}>{r.status}</span>
                </div>
              </div>
              <div className="text-sm opacity-80">Message: {r.message}</div>
              {r.responseMessage && <div className="text-sm">Owner response: {r.responseMessage}</div>}
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="alert">You haven't sent any requests yet.</div>
        )}
      </div>
    </div>
  );
}
