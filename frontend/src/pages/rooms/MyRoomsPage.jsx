import { useEffect, useState } from 'react';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';

export default function MyRoomsPage() {
  const [rooms, setRooms] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRooms = async () => {
      const { data } = await api.get('/rooms/me/my-rooms');
      setRooms(data.data || []);
    };
    fetchRooms();
  }, []);

  const refresh = async () => {
    const { data } = await api.get('/rooms/me/my-rooms');
    setRooms(data.data || []);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this room? This action cannot be undone.')) return;
    try {
      await api.delete(`/rooms/${id}`);
      await refresh();
    } catch (e) {
      window.alert(e.response?.data?.error || 'Delete failed');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">My Rooms</h2>
        <button className="btn btn-primary text-white" onClick={() => navigate('/rooms/new')}>New Room</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((r) => (
          <div key={r._id} className="card bg-base-100 shadow">
            {r.images?.[0]?.url && <figure><img src={r.images[0].url} alt={r.title} className="h-48 w-full object-cover" /></figure>}
            <div className="card-body">
              <h2 className="card-title">{r.title}</h2>
              <p>Status: {r.status}</p>
              <div className="card-actions justify-end">
                <button className="btn btn-outline btn-sm" onClick={() => navigate(`/rooms/${r._id}/edit`)}>Edit</button>
                <button className="btn btn-error btn-sm text-white" onClick={() => handleDelete(r._id)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
