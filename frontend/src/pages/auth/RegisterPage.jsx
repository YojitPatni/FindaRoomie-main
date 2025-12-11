import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../../store/auth';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, loading, error } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', age: 18, gender: 'other' });

  const onSubmit = async (e) => {
    e.preventDefault();
    const ok = await register(form);
    if (ok) navigate('/');
  };

  return (
    <div className="max-w-md mx-auto bg-base-100 p-6 rounded-box shadow">
      <h2 className="text-2xl font-semibold mb-4">Create account</h2>
      {error && <div className="alert alert-error mb-3">{error}</div>}
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="input input-bordered w-full" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <input className="input input-bordered w-full" placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        <input className="input input-bordered w-full" placeholder="Password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
        <input className="input input-bordered w-full" placeholder="Phone (10 digits)" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        <div className="flex gap-2">
          <input className="input input-bordered w-full" placeholder="Age" type="number" value={form.age} onChange={e => setForm({ ...form, age: Number(e.target.value) })} />
          <select className="select select-bordered w-full" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <button className={`btn btn-primary w-full ${loading ? 'loading' : ''}`} type="submit">Register</button>
      </form>
      <p className="mt-3 text-sm">Already have an account? <Link className="link" to="/login">Login</Link></p>
    </div>
  );
}
