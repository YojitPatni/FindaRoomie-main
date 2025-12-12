import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

export default function NewRoomPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    location: { address: '', city: '', state: '', zipCode: '' },
    rent: { amount: '', currency: 'INR', period: 'monthly' },
    roomDetails: { type: 'single', size: '', furnished: 'unfurnished', bathrooms: '' },
    availability: { availableFrom: '' },
    capacity: '',
  });
  const [images, setImages] = useState([]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('location[address]', form.location.address);
      fd.append('location[city]', form.location.city);
      fd.append('location[state]', form.location.state);
      fd.append('location[zipCode]', form.location.zipCode);
      fd.append('rent[amount]', form.rent.amount);
      fd.append('rent[currency]', form.rent.currency);
      fd.append('rent[period]', form.rent.period);
      fd.append('roomDetails[type]', form.roomDetails.type);
      if (form.roomDetails.size) fd.append('roomDetails[size]', form.roomDetails.size);
      fd.append('roomDetails[furnished]', form.roomDetails.furnished);
      if (form.roomDetails.bathrooms) fd.append('roomDetails[bathrooms]', form.roomDetails.bathrooms);
      fd.append('availability[availableFrom]', form.availability.availableFrom);
      if (form.capacity) fd.append('capacity', form.capacity);
      images.forEach((f) => fd.append('images', f));

      const { data } = await api.post('/rooms', fd);
      navigate(`/rooms/${data.data._id}`);
    } catch (e) {
      window.alert(e.response?.data?.error || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-base-100 p-6 rounded-box shadow">
      <h2 className="text-2xl font-semibold mb-4">Create New Room</h2>
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

        <div className="grid md:grid-cols-2 gap-3">
          <input className="input input-bordered w-full" type="number" min={1} placeholder="Bathrooms" value={form.roomDetails.bathrooms || ''} onChange={e => setForm({ ...form, roomDetails: { ...form.roomDetails, bathrooms: e.target.value } })} />
          <input className="input input-bordered w-full" type="date" value={form.availability.availableFrom} onChange={e => setForm({ ...form, availability: { availableFrom: e.target.value } })} />
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <input className="input input-bordered w-full" type="number" min={1} placeholder="Required Persons (Capacity)" value={form.capacity || ''} onChange={e => setForm({ ...form, capacity: e.target.value })} />
        </div>

        <input className="file-input file-input-bordered w-full" type="file" accept="image/*" multiple onChange={(e) => setImages(Array.from(e.target.files))} />

        <button className={`btn btn-primary text-white ${loading ? 'loading' : ''}`} type="submit">Create Room</button>
      </form>
    </div>
  );
}
