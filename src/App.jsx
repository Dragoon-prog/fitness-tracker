import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { LayoutDashboard, BookOpen, Scale, User, Search, Plus, Trash2, Target, Utensils } from 'lucide-react';
import axios from 'axios';
import { supabase } from './supabaseClient';
import Auth from './Auth';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- APP STATE ---
  const [weight, setWeight] = useState(70);
  const [height, setHeight] = useState(175);
  const [age, setAge] = useState(25);
  const [gender, setGender] = useState('male');
  const [activity, setActivity] = useState(1.2);
  const [fitnessGoal, setFitnessGoal] = useState('maintenance');
  const [meals, setMeals] = useState([]);
  const [weightHistory, setWeightHistory] = useState([]);

  // --- 1. AUTHENTICATION ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    supabase.auth.onAuthStateChange((_event, session) => setSession(session));
  }, []);

  // --- 2. DATABASE SYNC ---
  useEffect(() => {
    if (session) syncAllData();
  }, [session]);

  const syncAllData = async () => {
    const user = session.user;
    const today = new Date().toISOString().split('T')[0];

    // Fetch Profile
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (profile) {
      setWeight(profile.weight || 70);
      setHeight(profile.height || 175);
      setAge(profile.age || 25);
      setGender(profile.gender || 'male');
      setFitnessGoal(profile.fitness_goal || 'maintenance');
      setActivity(profile.activity_level || 1.2);
    }

    // Fetch Today's Meals
    const { data: mealsData } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`);
    if (mealsData) setMeals(mealsData.map(m => ({ id: m.id, name: m.name, cals: m.calories, p: m.protein, c: m.carbs, f: m.fat })));

    // Fetch Weight History
    const { data: weightData } = await supabase.from('weight_history').select('*').eq('user_id', user.id).order('date', { ascending: true });
    if (weightData) setWeightHistory(weightData.map(w => ({ date: new Date(w.date).toLocaleDateString(), weight: w.weight })));
  };

  // --- 3. CLOUD ACTIONS ---
  const saveProfile = async () => {
    const { error } = await supabase.from('profiles').upsert({
      id: session.user.id, weight: parseFloat(weight), height: parseFloat(height), age: parseInt(age), gender, fitness_goal: fitnessGoal, activity_level: activity
    });
    if (!error) alert("Profile Synced to Cloud!");
  };

  const saveMeal = async (foodObj) => {
    const { error } = await supabase.from('meals').insert([{ 
      user_id: session.user.id, 
      name: foodObj.label, 
      calories: foodObj.nutrients.ENERC_KCAL,
      protein: foodObj.nutrients.PROCNT, 
      carbs: foodObj.nutrients.CHOCDF, 
      fat: foodObj.nutrients.FAT
    }]);
    if (!error) syncAllData();
  };

  const deleteMeal = async (id) => {
    const { error } = await supabase.from('meals').delete().eq('id', id);
    if (!error) syncAllData();
  };

  const saveWeightLog = async (newW) => {
    const { error } = await supabase.from('weight_history').insert([{ user_id: session.user.id, weight: parseFloat(newW) }]);
    if (!error) { setWeight(newW); syncAllData(); }
  };

  // --- 4. CALCULATIONS ---
  const bmr = (10 * weight) + (6.25 * height) - (5 * age) + (gender === 'male' ? 5 : -161);
  const tdee = Math.round(bmr * activity);
  let goalCals = fitnessGoal === 'deficit' ? tdee - 500 : fitnessGoal === 'surplus' ? tdee + 500 : tdee;
  const eaten = meals.reduce((acc, m) => ({ cals: acc.cals + m.cals, p: acc.p + m.p, c: acc.c + m.c, f: acc.f + m.f }), { cals: 0, p: 0, c: 0, f: 0 });

  if (loading) return <div style={{padding:'50px', textAlign:'center'}}>Syncing...</div>;
  if (!session) return <Auth />;

  return (
    <Router>
      <div style={appContainer}>
        <main style={mainContent}>
          <Routes>
            <Route path="/" element={<Dashboard goal={goalCals} eaten={eaten} />} />
            <Route path="/diary" element={<Diary meals={meals} onAdd={saveMeal} onDelete={deleteMeal} />} />
            <Route path="/weight" element={<WeightRecorder data={weightHistory} onSave={saveWeightLog} currentWeight={weight} />} />
            <Route path="/profile" element={<Profile stats={{weight, height, age, gender, fitnessGoal, activity}} setters={{setWeight, setHeight, setAge, setGender, setFitnessGoal, setActivity}} onSave={saveProfile} onLogout={() => supabase.auth.signOut()} />} />
          </Routes>
        </main>

        <nav style={navBar}>
          <NavLink to="/" icon={<LayoutDashboard />} label="Home" />
          <NavLink to="/diary" icon={<BookOpen />} label="Diary" />
          <NavLink to="/weight" icon={<Scale />} label="Weight" />
          <NavLink to="/profile" icon={<User />} label="Profile" />
        </nav>
      </div>
    </Router>
  );
}

// --- PAGES ---

function Dashboard({ goal, eaten }) {
  const remaining = goal - Math.round(eaten.cals);
  return (
    <div style={pageStyle}>
      <h2 style={pageTitle}>Summary</h2>
      <div style={{...heroCard, background: remaining < 0 ? '#ef4444' : '#3b82f6'}}>
        <span style={{opacity:0.8, fontSize:'14px'}}>Calories Remaining</span>
        <h1 style={{fontSize:'48px', margin:'10px 0'}}>{remaining}</h1>
        <div style={progressBar}><div style={{...progressFill, width:`${(eaten.cals/goal)*100}%`}}></div></div>
      </div>
      <div style={{display:'flex', gap:'10px'}}>
        <MacroTile label="Protein" current={eaten.p} goal={goal*0.3/4} color="#ef4444" />
        <MacroTile label="Carbs" current={eaten.c} goal={goal*0.4/4} color="#3b82f6" />
        <MacroTile label="Fats" current={eaten.f} goal={goal*0.3/9} color="#f59e0b" />
      </div>
    </div>
  );
}

function Diary({ meals, onAdd, onDelete }) {
  const [q, setQ] = useState('');
  const [res, setRes] = useState([]);

  const search = async () => {
    if (!q) return;
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${q}&search_simple=1&action=process&json=1`;
    const response = await axios.get(url);
    const formatted = response.data.products
      .filter(p => p.nutriments && p.nutriments['energy-kcal_100g'])
      .map(p => ({
        label: p.product_name || "Unknown",
        nutrients: {
          ENERC_KCAL: p.nutriments['energy-kcal_100g'],
          PROCNT: p.nutriments.proteins_100g || 0,
          CHOCDF: p.nutriments.carbohydrates_100g || 0,
          FAT: p.nutriments.fat_100g || 0
        }
      }));
    setRes(formatted);
  };

  return (
    <div style={pageStyle}>
      <h2 style={pageTitle}>Food Diary</h2>
      <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
        <input style={inputStyle} placeholder="Search..." value={q} onChange={e => setQ(e.target.value)} onKeyPress={e => e.key==='Enter' && search()} />
        <button style={btnStyle} onClick={search}><Search size={18}/></button>
      </div>
      {res.length > 0 && <div style={cardStyle}>{res.slice(0,5).map((item, i) => (
        <div key={i} style={listItem}>
          <span>{item.label} <small>({Math.round(item.nutrients.ENERC_KCAL)} kcal)</small></span>
          <Plus size={18} style={{cursor:'pointer', color:'#3b82f6'}} onClick={() => onAdd(item)} />
        </div>
      ))}</div>}
      <h3 style={{marginTop:'30px'}}>Daily Log</h3>
      <div style={cardStyle}>
        {meals.length === 0 ? <p style={{color:'#94a3b8', textAlign:'center'}}>No items yet</p> : meals.map(m => (
          <div key={m.id} style={listItem}>
            <span>{m.name} <strong>{Math.round(m.cals)}</strong></span>
            <Trash2 size={14} style={{color:'#ef4444', cursor:'pointer'}} onClick={() => onDelete(m.id)} />
          </div>
        ))}
      </div>
    </div>
  );
}

function WeightRecorder({ data, onSave, currentWeight }) {
  const [val, setVal] = useState(currentWeight);
  return (
    <div style={pageStyle}>
      <h2 style={pageTitle}>Weight Tracker</h2>
      <div style={heroCard}>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data}><XAxis dataKey="date" stroke="#fff" fontSize={10} /><YAxis stroke="#fff" fontSize={10} domain={['dataMin - 2', 'dataMax + 2']} /><Tooltip /><Line type="monotone" dataKey="weight" stroke="#fff" strokeWidth={3} dot={{r:4, fill:'#fff'}} /></LineChart>
        </ResponsiveContainer>
      </div>
      <div style={cardStyle}>
        <label style={labelStyle}>Log Daily Weight (kg)</label>
        <div style={{display:'flex', gap:'10px'}}>
          <input type="number" style={inputStyle} value={val} onChange={e => setVal(e.target.value)} />
          <button style={btnStyle} onClick={() => onSave(val)}>Log Weight</button>
        </div>
      </div>
    </div>
  );
}

function Profile({ stats, setters, onSave, onLogout }) {
  return (
    <div style={pageStyle}>
      <h2 style={pageTitle}>Profile</h2>
      <div style={cardStyle}>
        <label style={labelStyle}>Goal</label>
        <select style={fullInput} value={stats.fitnessGoal} onChange={e => setters.setFitnessGoal(e.target.value)}>
          <option value="deficit">Lose Weight</option>
          <option value="maintenance">Maintain</option>
          <option value="surplus">Bulk</option>
        </select>
        
        <label style={labelStyle}>Gender</label>
        <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
          <button onClick={() => setters.setGender('male')} style={{...toggleBtn, background: stats.gender==='male'?'#3b82f6':'#f1f5f9', color: stats.gender==='male'?'#fff':'#64748b'}}>Male</button>
          <button onClick={() => setters.setGender('female')} style={{...toggleBtn, background: stats.gender==='female'?'#ec4899':'#f1f5f9', color: stats.gender==='female'?'#fff':'#64748b'}}>Female</button>
        </div>

        {/* --- WEIGHT ADDED BACK HERE --- */}
        <label style={labelStyle}>Weight (kg)</label>
        <input type="number" style={fullInput} value={stats.weight} onChange={e => setters.setWeight(e.target.value)} />

        <label style={labelStyle}>Height (cm)</label>
        <input type="number" style={fullInput} value={stats.height} onChange={e => setters.setHeight(e.target.value)} />
        
        <label style={labelStyle}>Age</label>
        <input type="number" style={fullInput} value={stats.age} onChange={e => setters.setAge(e.target.value)} />
        
        <button onClick={onSave} style={{...btnStyle, width:'100%', marginBottom:'10px'}}>Sync to Cloud</button>
        <button onClick={onLogout} style={{width:'100%', background:'none', border:'1px solid #ef4444', color:'#ef4444', padding:'10px', borderRadius:'12px', cursor:'pointer'}}>Logout</button>
      </div>
    </div>
  );
}

// --- STYLES & HELPERS ---
const appContainer = { minHeight:'100vh', backgroundColor:'#f8fafc', paddingBottom:'90px' };
const mainContent = { padding:'20px' };
const navBar = { position:'fixed', bottom:0, left:0, right:0, height:'75px', background:'white', borderTop:'1px solid #e2e8f0', display:'flex', justifyContent:'space-around', alignItems:'center', boxShadow:'0 -2px 10px rgba(0,0,0,0.05)' };
const pageStyle = { maxWidth:'450px', margin:'0 auto' };
const pageTitle = { fontSize:'24px', fontWeight:'bold', marginBottom:'20px', textAlign: 'center' };
const heroCard = { color:'white', padding:'25px', borderRadius:'24px', boxShadow:'0 10px 20px rgba(0,0,0,0.1)', marginBottom:'20px' };
const progressBar = { height:'8px', background:'rgba(255,255,255,0.3)', borderRadius:'10px', marginTop:'15px', overflow:'hidden' };
const progressFill = { height:'100%', background:'white' };
const cardStyle = { background:'white', padding:'20px', borderRadius:'20px', border:'1px solid #e2e8f0', marginBottom:'15px' };
const inputStyle = { flex:1, padding:'12px', borderRadius:'12px', border:'1px solid #cbd5e1', fontSize:'16px' };
const fullInput = { width:'100%', padding:'12px', borderRadius:'12px', border:'1px solid #cbd5e1', marginBottom:'15px', boxSizing:'border-box' };
const btnStyle = { background:'#3b82f6', color:'white', border:'none', borderRadius:'12px', padding:'12px 20px', fontWeight:'bold', cursor:'pointer' };
const listItem = { display:'flex', justifyContent:'space-between', padding:'15px 0', borderBottom:'1px solid #f1f5f9' };
const labelStyle = { display:'block', fontSize:'12px', fontWeight:'bold', color:'#64748b', marginBottom:'5px' };
const toggleBtn = { flex:1, padding:'12px', border:'none', borderRadius:'12px', cursor:'pointer', fontWeight:'bold' };
function NavLink({ to, icon, label }) { return <Link to={to} style={{ textDecoration:'none', color:'#64748b', display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}> {icon} <span style={{fontSize:'10px'}}>{label}</span> </Link>; }
function MacroTile({ label, current, goal, color }) { return <div style={{...cardStyle, flex:1, textAlign:'center', padding:'10px', marginBottom:0}}> <span style={{fontSize:'10px', color:'#64748b'}}>{label}</span> <div style={{fontWeight:'bold', fontSize:'14px'}}>{Math.round(current)}g</div> <div style={{height:'3px', background:'#eee', marginTop:'5px'}}><div style={{height:'100%', background:color, width:`${(current/goal)*100}%` || '0%'}}></div></div> </div>; }