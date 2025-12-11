import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../utils/api';

export default function EditRoomPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    location: { address: '', city: '', state: '', zipCode: '' },
    rent: { amount: '', currency: 'INR', period: 'monthly' },
    roomDetails: { type: 'single', size: '', furnished: 'unfurnished', bathrooms: 1 },
    availability: { availableFrom: '' },
    status: 'available',
    capacity: 1
  });

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/rooms/${id}`);
        const r = data.data;
        setForm({
          title: r.title || '',
          description: r.description || '',
          location: r.location || { address: '', city: '', state: '', zipCode: '' },
          rent: r.rent || { amount: '', currency: 'INR', period: 'monthly' },
          roomDetails: r.roomDetails || { type: 'single', size: '', furnished: 'unfurnished', bathrooms: 1 },
          availability: r.availability || { availableFrom: '' },
          status: r.status || 'available',
          capacity: r.capacity || 1
        });
      } catch (e) {
        window.alert('Failed to load room');
        navigate('/my-rooms');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Send JSON body (no images on edit for simplicity; can be added similar to NewRoomPage)
      const payload = {
        title: form.title,
        description: form.description,
        'location[address]': form.location.address,
        'location[city]': form.location.city,
        'location[state]': form.location.state,
        'location[zipCode]': form.location.zipCode,
        'rent[amount]': form.rent.amount,
        'rent[currency]': form.rent.currency,
        'rent[period]': form.rent.period,
        'roomDetails[type]': form.roomDetails.type,
        'roomDetails[size]': form.roomDetails.size,
        'roomDetails[furnished]': form.roomDetails.furnished,
        'roomDetails[bathrooms]': form.roomDetails.bathrooms,
        'availability[availableFrom]': form.availability.availableFrom,
        status: form.status,
        capacity: form.capacity
      };
      await api.put(`/rooms/${id}`, payload);
      navigate('/my-rooms');
    } catch (e) {
      window.alert(e.response?.data?.error || 'Failed to update room');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><span className="loading loading-spinner loading-lg"></span></div>;

  return (
    <div className="max-w-3xl mx-auto bg-base-100 p-6 rounded-box shadow">
      <h2 className="text-2xl font-semibold mb-4">Edit Room</h2>
      <form className="grid gap-4" onSubmit={onSubmit}>
        <input className="input input-bordered w-full" placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        <textarea className="textarea textarea-bordered w-full" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />

        <div className="grid md:grid-cols-2 gap-3">
          <input className="input input-bordered w-full" placeholder="Address" value={form.location.address} onChange={e => setForm({ ...form, location: { ...form.location, address: e.target.value } })} />
          <input className="input input-bordered w-full" placeholder="City" value={form.location.city} onChange={e => setForm({ ...form, location: { ...form.location, city: e.target.value } })} />
          <input className="input input-bordered w-full" placeholder="State" value={form.location.state} onChange={e => setForm({ ...form, location: { ...form.location, state: e.target.value } })} />
          <input className="input input-bordered w-full" placeholder="Zip Code (6 digits)" value={form.location.zipCode} onChange={e => setForm({ ...form, location: { ...form.location, zipCode: e.target.value } })} />
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <input className="input input-bordered w-full" type="number" placeholder="Rent Amount" value={form.rent.amount} onChange={e => setForm({ ...form, rent: { ...form.rent, amount: e.target.value } })} />
          <select className="select select-bordered w-full" value={form.rent.currency} onChange={e => setForm({ ...form, rent: { ...form.rent, currency: e.target.value } })}>
            <option>INR</option>
            <option>USD</option>
          </select>
          <select className="select select-bordered w-full" value={form.rent.period} onChange={e => setForm({ ...form, rent: { ...form.rent, period: e.target.value } })}>
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
            <option value="daily">Daily</option>
          </select>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <select className="select select-bordered w-full" value={form.roomDetails.type} onChange={e => setForm({ ...form, roomDetails: { ...form.roomDetails, type: e.target.value } })}>
            <option value="single">Single</option>
            <option value="shared">Shared</option>
            <option value="studio">Studio</option>
            <option value="1bhk">1BHK</option>
            <option value="2bhk">2BHK</option>
            <option value="3bhk">3BHK</option>
          </select>
          <input className="input input-bordered w-full" type="number" placeholder="Size (sq ft)" value={form.roomDetails.size} onChange={e => setForm({ ...form, roomDetails: { ...form.roomDetails, size: e.target.value } })} />
          <select className="select select-bordered w-full" value={form.roomDetails.furnished} onChange={e => setForm({ ...form, roomDetails: { ...form.roomDetails, furnished: e.target.value } })}>
            <option value="unfurnished">Unfurnished</option>
            <option value="semi">Semi</option>
            <option value="fully">Fully</option>
          </select>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <input className="input input-bordered w-full" type="number" min={1} placeholder="Bathrooms" value={form.roomDetails.bathrooms} onChange={e => setForm({ ...form, roomDetails: { ...form.roomDetails, bathrooms: e.target.value } })} />
          <input className="input input-bordered w-full" type="date" value={form.availability.availableFrom?.slice(0,10) || ''} onChange={e => setForm({ ...form, availability: { availableFrom: e.target.value } })} />
          <select className="select select-bordered w-full" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            <option value="available">available</option>
            <option value="occupied">occupied</option>
            <option value="pending">pending</option>
            <option value="inactive">inactive</option>
          </select>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <input className="input input-bordered w-full" type="number" min={1} placeholder="Required Persons (Capacity)" value={form.capacity} onChange={e => setForm({ ...form, capacity: Number(e.target.value) })} />
        </div>

        <button className={`btn btn-primary text-white ${saving ? 'loading' : ''}`} type="submit">Save Changes</button>
      </form>
    </div>
  );
}
