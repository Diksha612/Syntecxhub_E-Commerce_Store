import { useEffect, useState } from 'react'; import { Routes, Route, Link, useNavigate, useParams, Navigate } from 'react-router-dom'; import { motion } from 'framer-motion';
import { api, useStore, err } from './api';
const inr = (n: number) => '₹' + Number(n).toFixed(0);
function Nav() {
  const { user, set, dark, toggle } = useStore(); const nav = useNavigate();
  return <nav className="glass m-3 px-5 py-3 flex items-center gap-4 sticky top-3 z-10">
    <Link to="/" className="font-bold text-lg bg-gradient-to-r from-indigo-500 to-cyan-500 bg-clip-text text-transparent">SmartMart AI</Link>
    <div className="flex-1" />{user?.role !== 'admin' && <Link to="/cart">Cart</Link>}
    {user && <Link to="/orders">Orders</Link>}{user?.role === 'admin' && <Link to="/admin">Admin</Link>}
    <button onClick={toggle}>{dark ? '☀️' : '🌙'}</button>
    {user ? <button onClick={() => { set(null); nav('/'); }}>Logout</button> : <Link to="/login" className="btn">Login</Link>}
  </nav>;
}
function Home() {
  const [items, setItems] = useState<any[]>(); const [q, setQ] = useState(''); const [cat, setCat] = useState(''); const [sort, setSort] = useState(''); const [max, setMax] = useState('');
  useEffect(() => { setItems(undefined); const t = setTimeout(() => api.get('/products', { params: { q, category: cat, sort, max } }).then(r => setItems(r.data)), 250); return () => clearTimeout(t); }, [q, cat, sort, max]);
  return <div className="max-w-6xl mx-auto p-4">
    <div className="glass p-6 mb-6"><h1 className="text-3xl font-bold">Shop smarter with AI</h1>
      <div className="grid sm:grid-cols-4 gap-2 mt-4">
        <input className="inp sm:col-span-2" placeholder="Search products…" value={q} onChange={e => setQ(e.target.value)} />
        <select className="inp" value={cat} onChange={e => setCat(e.target.value)}><option value="">All categories</option>{['Electronics', 'Fashion', 'Home'].map(c => <option key={c}>{c}</option>)}</select>
        <select className="inp" value={sort} onChange={e => setSort(e.target.value)}><option value="">Newest</option><option value="best">Best sellers</option><option value="price_asc">Price ↑</option><option value="price_desc">Price ↓</option></select>
        <input className="inp" type="number" placeholder="Max price" value={max} onChange={e => setMax(e.target.value)} />
      </div></div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {!items ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="glass h-64 animate-pulse" />) :
        items.map(p => <motion.div key={p._id} whileHover={{ y: -6 }} className="glass overflow-hidden"><Link to={`/p/${p._id}`}>
          <img src={p.image} className="h-40 w-full object-cover" /><div className="p-3"><div className="font-medium truncate">{p.name}</div>
          <div className="text-indigo-500 font-semibold">{inr(p.price)}</div><div className="text-xs opacity-60">{p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}</div></div></Link></motion.div>)}
    </div></div>;
}
function Product() {
  const { id } = useParams(); const { user } = useStore(); const nav = useNavigate(); const [d, setD] = useState<any>(); const [rating, setRating] = useState(5); const [comment, setComment] = useState('');
  const load = () => api.get('/products/' + id).then(r => setD(r.data)); useEffect(() => { load(); }, [id]);
  if (!d) return <div className="p-8">Loading…</div>; const p = d.product;
  const add = async () => { if (!user) return nav('/login'); const cart = (await api.get('/cart')).data; const ex = cart.find((i: any) => i.product._id === p._id); await api.put('/cart', { product: p._id, qty: (ex?.qty || 0) + 1 }); nav('/cart'); };
  return <div className="max-w-5xl mx-auto p-4"><div className="glass p-5 grid md:grid-cols-2 gap-6"><img src={p.image} className="rounded-xl w-full" />
    <div><h1 className="text-2xl font-bold">{p.name}</h1><p className="opacity-70 my-2">{p.description}</p><div className="text-2xl text-indigo-500 font-bold">{inr(p.price)}</div>
      <div className="text-sm my-1">⭐ {p.rating.toFixed(1)} ({p.numReviews}) · {p.stock <= 5 && p.stock > 0 ? `Only ${p.stock} left!` : `${p.stock} in stock`}</div>
      {user?.role === 'admin' ? <div className="text-sm opacity-70 mt-3">Admin accounts manage products and orders and can't place orders.</div> : <button className="btn mt-3" disabled={!p.stock} onClick={add}>Add to cart</button>}</div></div>
    <h2 className="font-semibold mt-6 mb-2">Related</h2><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{d.related.map((r: any) => <Link key={r._id} to={`/p/${r._id}`} className="glass p-3">{r.name}<div className="text-indigo-500">{inr(r.price)}</div></Link>)}</div>
    <h2 className="font-semibold mt-6 mb-2">Reviews</h2>{d.reviews.map((r: any) => <div key={r._id} className="glass p-3 mb-2"><b>{r.name}</b> {'⭐'.repeat(r.rating)}<div>{r.comment}</div></div>)}
    {user && <div className="glass p-3 flex gap-2"><select className="inp w-20" value={rating} onChange={e => setRating(+e.target.value)}>{[5, 4, 3, 2, 1].map(n => <option key={n}>{n}</option>)}</select><input className="inp" placeholder="Write a review" value={comment} onChange={e => setComment(e.target.value)} />
      <button className="btn" onClick={async () => { await api.post(`/products/${id}/reviews`, { rating, comment }); setComment(''); load(); }}>Post</button></div>}</div>;
}
function Cart() {
  const [items, setItems] = useState<any[]>([]); const [coupon, setCoupon] = useState(''); const [pct, setPct] = useState(0); const [addr, setAddr] = useState({ line1: '', city: '', state: '', zip: '' }); const [msg, setMsg] = useState(''); const nav = useNavigate();
  const { user } = useStore(); const load = () => api.get('/cart').then(r => setItems(r.data)).catch(() => {}); useEffect(() => { if (user?.role !== 'admin') load(); }, []);
  if (user?.role === 'admin') return <Navigate to="/admin" />;
  const sub = items.reduce((a, i) => a + i.product.price * i.qty, 0); const total = sub * (1 - pct / 100);
  const setQty = (id: string, qty: number) => api.put('/cart', { product: id, qty }).then(load);
  return <div className="max-w-4xl mx-auto p-4 grid md:grid-cols-3 gap-4"><div className="md:col-span-2 space-y-2">{!items.length && <div className="glass p-6">Your cart is empty.</div>}
    {items.map(i => <div key={i.product._id} className="glass p-3 flex items-center gap-3"><img src={i.product.image} className="w-16 h-16 rounded-lg object-cover" /><div className="flex-1">{i.product.name}<div className="text-indigo-500">{inr(i.product.price)}</div></div>
      <button onClick={() => setQty(i.product._id, i.qty - 1)}>−</button>{i.qty}<button onClick={() => setQty(i.product._id, i.qty + 1)}>+</button><button onClick={() => setQty(i.product._id, 0)}>🗑</button></div>)}</div>
    <div className="glass p-4 space-y-2 h-fit"><div className="flex gap-2"><input className="inp" placeholder="Coupon" value={coupon} onChange={e => setCoupon(e.target.value)} /><button className="btn" onClick={() => api.get('/coupons/' + coupon).then(r => setPct(r.data.percent)).catch(() => { setPct(0); setMsg('Invalid coupon'); })}>Apply</button></div>
      {(['line1', 'city', 'state', 'zip'] as const).map(k => <input key={k} className="inp" placeholder={k} value={addr[k]} onChange={e => setAddr({ ...addr, [k]: e.target.value })} />)}
      <div className="font-bold">Total: {inr(total)}</div><div className="text-red-500 text-sm">{msg}</div>
      <button className="btn w-full" disabled={!items.length || !addr.line1} onClick={() => api.post('/orders', { address: addr, coupon: pct ? coupon : undefined }).then(() => nav('/orders')).catch(e => setMsg(err(e)))}>Place order</button></div></div>;
}
function Orders() {
  const [o, setO] = useState<any[]>([]); useEffect(() => { api.get('/orders').then(r => setO(r.data)); }, []);
  return <div className="max-w-3xl mx-auto p-4 space-y-3">{o.map(x => <div key={x._id} className="glass p-4"><div className="flex justify-between"><b>#{x._id.slice(-6)}</b><span className="px-2 rounded bg-indigo-500/20">{x.status}</span></div>
    {x.items.map((i: any, k: number) => <div key={k} className="text-sm">{i.name} × {i.qty}</div>)}<div className="font-semibold mt-1">{inr(x.total)}</div></div>)}</div>;
}
function Auth({ mode }: { mode: 'login' | 'register' }) {
  const [f, setF] = useState({ name: '', email: '', password: '' }); const [e, setE] = useState(''); const { set } = useStore(); const nav = useNavigate();
  const go = () => api.post('/auth/' + mode, f).then(r => { set(r.data.user, r.data.token); nav(r.data.user.role === 'admin' ? '/admin' : '/'); }).catch(x => setE(err(x)));
  return <div className="glass max-w-sm mx-auto mt-16 p-6 space-y-3"><h1 className="text-xl font-bold capitalize">{mode}</h1>
    {mode === 'register' && <input className="inp" placeholder="Name" onChange={x => setF({ ...f, name: x.target.value })} />}
    <input className="inp" placeholder="Email" onChange={x => setF({ ...f, email: x.target.value })} /><input className="inp" type="password" placeholder="Password" onChange={x => setF({ ...f, password: x.target.value })} />
    <div className="text-red-500 text-sm">{e}</div><button className="btn w-full" onClick={go}>Continue</button>
    <Link className="text-sm text-indigo-500" to={mode === 'login' ? '/register' : '/login'}>{mode === 'login' ? 'Create account' : 'Have an account?'}</Link></div>;
}
function Admin() {
  const { user } = useStore(); const [tab, setTab] = useState('dashboard');
  const [s, setS] = useState<any>(); const [prods, setP] = useState<any[]>([]); const [ord, setO] = useState<any[]>([]); const [oErr, setOErr] = useState('');
  const blank = { name: '', price: '', stock: '', category: 'Electronics', image: '', description: '' };
  const [n, setN] = useState<any>(blank); const [editId, setEditId] = useState(''); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState('');
  const load = () => {
    api.get('/admin/stats').then(r => setS(r.data)).catch(() => {});
    api.get('/products').then(r => setP(r.data)).catch(() => {});
    api.get('/admin/orders').then(r => { setO(r.data); setOErr(''); }).catch(e => setOErr(err(e)));
  };
  useEffect(() => { if (user?.role === 'admin') load(); }, []);
  if (user?.role !== 'admin') return <Navigate to="/" />;
  const upload = async (f?: File) => {
    if (!f) return; setBusy(true); setMsg(''); const fd = new FormData(); fd.append('image', f);
    try { const r = await api.post('/admin/upload', fd); setN((p: any) => ({ ...p, image: r.data.url })); } catch (e) { setMsg(err(e)); }
    setBusy(false);
  };
  const save = async () => {
    try { const body = { ...n, price: +n.price, stock: +n.stock }; editId ? await api.put('/admin/products/' + editId, body) : await api.post('/admin/products', body);
      setN(blank); setEditId(''); setMsg('Saved'); load(); } catch (e) { setMsg(err(e)); }
  };
  const mx = Math.max(1, ...(s?.daily || []).map((d: any) => d.revenue));
  return <div className="max-w-6xl mx-auto p-4 space-y-4">
    <div className="flex gap-2">{['dashboard', 'products', 'orders'].map(t => <button key={t} onClick={() => setTab(t)} className={tab === t ? 'btn capitalize' : 'glass px-4 py-2 capitalize'}>{t}</button>)}</div>
    {tab === 'dashboard' && (!s ? <div className="glass p-6">Loading…</div> : <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[['Revenue', inr(s.revenue)], ['Orders', s.orders], ['Customers', s.users], ['Products', s.products]].map(([k, v]) => <div key={k as string} className="glass p-4"><div className="text-sm opacity-60">{k}</div><div className="text-2xl font-bold">{v}</div></div>)}</div>
      <div className="glass p-4"><b>Revenue (last 14 days)</b><div className="flex items-end gap-1 h-32 mt-2">{s.daily.map((d: any) => <div key={d._id} title={`${d._id}: ${inr(d.revenue)}`} className="flex-1 bg-gradient-to-t from-indigo-500 to-cyan-400 rounded-t" style={{ height: `${(d.revenue / mx) * 100}%` }} />)}</div></div>
      {s.lowStock.length > 0 && <div className="glass p-4">⚠️ Low stock: {s.lowStock.map((p: any) => `${p.name} (${p.stock})`).join(', ')}</div>}</>)}
    {tab === 'products' && <>
      <div className="glass p-4"><b>{editId ? 'Edit product' : 'Add product'}</b>
        <div className="grid md:grid-cols-3 gap-2 mt-2">{['name', 'price', 'stock', 'category', 'description'].map(k => <input key={k} className="inp" placeholder={k} value={n[k]} onChange={e => setN({ ...n, [k]: e.target.value })} />)}
          <input className="inp" placeholder="image URL (or upload below)" value={n.image} onChange={e => setN({ ...n, image: e.target.value })} /></div>
        <div className="flex items-center gap-3 mt-2"><input type="file" accept="image/*" onChange={e => upload(e.target.files?.[0])} />{busy && <span>Uploading…</span>}{n.image && <img src={n.image} className="h-14 rounded" />}</div>
        <div className="flex items-center gap-3 mt-3"><button className="btn" disabled={busy} onClick={save}>{editId ? 'Update' : 'Add'}</button>{editId && <button onClick={() => { setN(blank); setEditId(''); }}>Cancel</button>}<span className="text-sm">{msg}</span></div></div>
      <div className="glass p-4">{prods.map(p => <div key={p._id} className="flex gap-3 py-1 items-center"><img src={p.image} className="w-10 h-10 rounded object-cover" /><span className="flex-1">{p.name}</span><span>{inr(p.price)}</span><span className="w-16 text-sm">stock {p.stock}</span>
        <button onClick={() => { setEditId(p._id); setN({ name: p.name, price: p.price, stock: p.stock, category: p.category, image: p.image || '', description: p.description || '' }); window.scrollTo(0, 0); }}>✏️</button>
        <button onClick={() => api.delete('/admin/products/' + p._id).then(load)}>🗑</button></div>)}</div></>}
    {tab === 'orders' && <div className="space-y-3">
      {oErr && <div className="glass p-4 text-red-500">{oErr} <button className="underline" onClick={load}>Retry</button></div>}
      {!oErr && !ord.length && <div className="glass p-6">No orders yet.</div>}
      {ord.map(o => <div key={o._id} className="glass p-4"><div className="flex flex-wrap gap-3 items-center"><b>#{o._id.slice(-6)}</b><span className="flex-1">{o.user?.name || 'Deleted user'} · {o.user?.email}</span><span>{inr(o.total)}</span>
        <select className="inp w-32" value={o.status} onChange={e => api.put('/admin/orders/' + o._id, { status: e.target.value }).then(load)}>{['placed', 'shipped', 'delivered', 'cancelled'].map(x => <option key={x}>{x}</option>)}</select></div>
        <div className="text-sm opacity-70 mt-2">{o.items.map((i: any) => `${i.name} × ${i.qty}`).join(', ')}</div>
        <div className="text-xs opacity-60">{[o.address?.line1, o.address?.city, o.address?.state, o.address?.zip].filter(Boolean).join(', ')}</div></div>)}</div>}
  </div>;
}
export default function App() {
  return <><Nav /><Routes><Route path="/" element={<Home />} /><Route path="/p/:id" element={<Product />} /><Route path="/cart" element={<Cart />} /><Route path="/orders" element={<Orders />} />
    <Route path="/login" element={<Auth mode="login" />} /><Route path="/register" element={<Auth mode="register" />} /><Route path="/admin" element={<Admin />} /></Routes></>;
}
