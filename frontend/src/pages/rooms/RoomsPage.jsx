import { useEffect, useState } from 'react';
import api from '../../utils/api';
import { Link } from 'react-router-dom';

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const { data } = await api.get('/rooms');
        setRooms(data.data || []);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  if (loading) return <div className="flex justify-center p-8"><span className="loading loading-spinner loading-lg"></span></div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {rooms.map((r) => (
        <div key={r._id} className="card bg-base-100 shadow">
          {r.images?.[0]?.url && <figure><img src={r.images[0].url} alt={r.title} className="h-48 w-full object-cover" /></figure>}
          <div className="card-body">
            <h2 className="card-title">{r.title}</h2>
            <p>{r.location?.city}, {r.location?.state}</p>
            <div className="card-actions justify-end">
              <Link to={`/rooms/${r._id}`} className="btn btn-primary btn-sm text-white">View</Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
