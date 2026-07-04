import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { LayoutDashboard, BookOpen, TrendingUp, User, Search, Plus, Trash2, ChevronRight } from 'lucide-react';
import axios from 'axios';

export default function App() {
  // --- GLOBAL STATE (Shared across all pages) ---
  const [weight, setWeight] = useState(localStorage.getItem('weight') || 70);
  const [height, setHeight] = useState(localStorage.getItem('height') || 175);
  const [age, setAge] = useState(localStorage.getItem('age') || 25);
  const [gender, setGender] = useState(localStorage.getItem('gender') || 'male');
  const [activity, setActivity] = useState(localStorage.getItem('activity') || 1.2);
  const [fitnessGoal, setFitnessGoal] = useState(localStorage.getItem('fitnessGoal') || 'maintenance');
  const [meals, setMeals] = useState(JSON.parse(localStorage.getItem('meals')) || []);
  const [liftData, setLiftData] = useState(JSON.parse(localStorage.getItem('lifts')) || [{ week: 'Wk 1', weight: 40 }]);

  useEffect(() => {
    localStorage.setItem('meals', JSON.stringify(meals));
    localStorage.setItem('lifts', JSON.stringify(liftData));
    localStorage.setItem('weight', weight);
    localStorage.setItem('height', height);
    localStorage.setItem('age', age);
    localStorage.setItem('gender', gender);
    localStorage.setItem('activity', activity);
    localStorage.setItem('fitnessGoal', fitnessGoal);
  }, [meals, liftData, weight, height, age, gender, activity, fitnessGoal]);

  // --- CALCULATION LOGIC ---
  const bmr = (10 * weight) + (6.25 * height) - (5 * age) + (gender === 'male' ? 5 : -161);
  const tdee = Math.round(bmr * activity);
  let goalCals = fitnessGoal === 'deficit' ? tdee - 500 : fitnessGoal === 'surplus' ? tdee + 500 : tdee;
  const eaten = meals.reduce((acc, m) => ({ cals: acc.cals + m.cals, p: acc.p + m.p, c: acc.c + m.c, f: acc.f + m.f }), { cals: 0, p: 0, c: 0, f: 0 });

  return (
    <Router>
      <div style={appContainer}>
        
        {/* MAIN CONTENT AREA */}
        <main style={mainContent}>
          <Routes>
            <Route path="/" element={<Dashboard goal={goalCals} eaten={eaten} goalP={goalCals*0.3/4} goalC={goalCals*0.4/4} goalF={goalCals*0.3/9} />} />
            <Route path="/diary" element={<Diary meals={meals} setMeals={setMeals} />} />
            <Route path="/lifting" element={<Lifting data={liftData} setData={setLiftData} />} />
            <Route path="/profile" element={<Profile stats={{weight, height, age, gender, fitnessGoal}} setters={{setWeight, setHeight, setAge, setGender, setFitnessGoal}} />} />
          </Routes>
        </main>

        {/* BOTTOM NAVIGATION BAR (Mobile Friendly) */}
        <nav style={navBar}>
          <NavLink to="/" icon={<LayoutDashboard />} label="Home" />
          <NavLink to="/diary" icon={<BookOpen />} label="Diary" />
          <NavLink to="/lifting" icon={<TrendingUp />} label="Stats" />
          <NavLink to="/profile" icon={<User />} label="Profile" />
        </nav>
      </div>
    </Router>
  );
}

// --- SUB-COMPONENTS (THE PAGES) ---

function Dashboard({ goal, eaten, goalP, goalC, goalF }) {
  return (
    <div style={pageStyle}>
      <h2 style={pageTitle}>Daily Summary</h2>
      <div style={heroCard}>
        <span style={{ fontSize: '14px', opacity: 0.8 }}>Calories Remaining</span>
        <h1 style={{ fontSize: '48px', margin: '10px 0' }}>{goal - Math.round(eaten.cals)}</h1>
        <div style={progressBar}><div style={{ ...progressFill, width: `${(eaten.cals/goal)*100}%` }}></div></div>
      </div>
      
      <div style={macroGrid}>
        <MacroTile label="Protein" current={eaten.p} goal={goalP} color="#ef4444" />
        <MacroTile label="Carbs" current={eaten.c} goal={goalC} color="#3b82f6" />
        <MacroTile label="Fats" current={eaten.f} goal={goalF} color="#f59e0b" />
      </div>
    </div>
  );
}

function Diary({ meals, setMeals }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const searchFood = async () => {
    const res = await axios.get(`https://api.edamam.com/api/food-database/v2/parser?app_id=f027c2f8&app_key=3668870954b9d03195f1d439818816c7&ingr=${query}`);
    setResults(res.data.hints);
  };

  return (
    <div style={pageStyle}>
      <h2 style={pageTitle}>Food Diary</h2>
      <div style={searchBox}>
        <input placeholder="Search food..." value={query} onChange={(e) => setQuery(e.target.value)} style={inputStyle} />
        <button onClick={searchFood} style={btnStyle}><Search size={18}/></button>
      </div>
      
      {results.length > 0 && <div style={resultsList}>
        {results.map((item, i) => (
          <div key={i} style={listItem}>
            <span>{item.food.label} ({Math.round(item.food.nutrients.ENERC_KCAL)} kcal)</span>
            <button onClick={() => setMeals([...meals, { id: Date.now(), name: item.food.label, cals: item.food.nutrients.ENERC_KCAL, p: item.food.nutrients.PROCNT, c: item.food.nutrients.CHOCDF, f: item.food.nutrients.FAT }])} style={addBtn}><Plus size={14}/></button>
          </div>
        ))}
      </div>}

      <h3 style={{ marginTop: '20px' }}>Today's Log</h3>
      {meals.map(m => (
        <div key={m.id} style={listItem}>
          <span>{m.name}</span>
          <span>{Math.round(m.cals)} kcal <Trash2 size={14} onClick={() => setMeals(meals.filter(x => x.id !== m.id))} style={{ marginLeft: '10px', color: '#ef4444' }} /></span>
        </div>
      ))}
    </div>
  );
}

function Lifting({ data, setData }) {
  const [newLift, setNewLift] = useState({ w: '', r: '' });
  return (
    <div style={pageStyle}>
      <h2 style={pageTitle}>Progression</h2>
      <div style={heroCard}>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="week" /><YAxis /><Tooltip /><Line type="monotone" dataKey="weight" stroke="#fff" strokeWidth={3} /></LineChart>
        </ResponsiveContainer>
      </div>
      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <input placeholder="kg" type="number" onChange={(e) => setNewLift({...newLift, w: e.target.value})} style={inputStyle} />
        <input placeholder="reps" type="number" onChange={(e) => setNewLift({...newLift, r: e.target.value})} style={inputStyle} />
        <button onClick={() => setData([...data, { week: `Wk ${data.length+1}`, weight: Math.round(newLift.w * (1 + newLift.r/30)) }])} style={btnStyle}>Log</button>
      </div>
    </div>
  );
}

function Profile({ stats, setters }) {
  return (
    <div style={pageStyle}>
      <h2 style={pageTitle}>Settings</h2>
      <div style={cardStyle}>
        <label style={labelStyle}>Gender</label>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <button onClick={() => setters.setGender('male')} style={{ ...toggleBtn, background: stats.gender === 'male' ? '#3b82f6' : '#eee', color: stats.gender === 'male' ? '#fff' : '#000' }}>Male</button>
          <button onClick={() => setters.setGender('female')} style={{ ...toggleBtn, background: stats.gender === 'female' ? '#ec4899' : '#eee', color: stats.gender === 'female' ? '#fff' : '#000' }}>Female</button>
        </div>
        <label style={labelStyle}>Weight (kg)</label>
        <input type="number" value={stats.weight} onChange={(e) => setters.setWeight(e.target.value)} style={fullInput} />
        <label style={labelStyle}>Height (cm)</label>
        <input type="number" value={stats.height} onChange={(e) => setters.setHeight(e.target.value)} style={fullInput} />
        <label style={labelStyle}>Goal</label>
        <select value={stats.fitnessGoal} onChange={(e) => setters.setFitnessGoal(e.target.value)} style={fullInput}>
          <option value="deficit">Lose Weight</option>
          <option value="maintenance">Maintain</option>
          <option value="surplus">Bulk</option>
        </select>
      </div>
    </div>
  );
}

// --- HELPERS ---
function NavLink({ to, icon, label }) {
  return (
    <Link to={to} style={{ textDecoration: 'none', color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      {icon}
      <span style={{ fontSize: '10px' }}>{label}</span>
    </Link>
  );
}

function MacroTile({ label, current, goal, color }) {
  return (
    <div style={{ ...cardStyle, flex: 1, textAlign: 'center' }}>
      <span style={{ fontSize: '12px', color: '#64748b' }}>{label}</span>
      <div style={{ fontWeight: 'bold', margin: '5px 0' }}>{Math.round(current)}g</div>
      <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '4px' }}><div style={{ height: '100%', background: color, width: `${(current/goal)*100}%` }}></div></div>
    </div>
  );
}

// --- STYLES ---
const appContainer = { minHeight: '100vh', backgroundColor: '#f8fafc', paddingBottom: '80px' };
const mainContent = { padding: '20px' };
const navBar = { position: 'fixed', bottom: 0, left: 0, right: 0, height: '70px', background: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-around', alignItems: 'center', boxShadow: '0 -2px 10px rgba(0,0,0,0.05)' };
const pageStyle = { maxWidth: '500px', margin: '0 auto' };
const pageTitle = { fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' };
const heroCard = { background: '#3b82f6', color: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 10px 20px rgba(59,130,246,0.3)', marginBottom: '20px' };
const progressBar = { height: '8px', background: 'rgba(255,255,255,0.3)', borderRadius: '10px', marginTop: '15px' };
const progressFill = { height: '100%', background: 'white', borderRadius: '10px' };
const macroGrid = { display: 'flex', gap: '10px' };
const cardStyle = { background: 'white', padding: '15px', borderRadius: '16px', border: '1px solid #e2e8f0' };
const inputStyle = { flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1' };
const fullInput = { width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', marginBottom: '15px', boxSizing: 'border-box' };
const btnStyle = { background: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', padding: '12px 20px' };
const searchBox = { display: 'flex', gap: '10px', marginBottom: '20px' };
const listItem = { display: 'flex', justifyContent: 'space-between', padding: '15px 0', borderBottom: '1px solid #f1f5f9' };
const addBtn = { background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '8px' };
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '5px' };
const toggleBtn = { flex: 1, padding: '10px', border: 'none', borderRadius: '10px', cursor: 'pointer' };
const resultsList = { background: 'white', borderRadius: '16px', padding: '0 15px', border: '1px solid #e2e8f0' };