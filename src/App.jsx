import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { LayoutDashboard, BookOpen, Scale, User, Search, Plus, Trash2, Save } from 'lucide-react';
import axios from 'axios';

export default function App() {
  // --- GLOBAL STATE ---
  const [weight, setWeight] = useState(localStorage.getItem('weight') || 70);
  const [height, setHeight] = useState(localStorage.getItem('height') || 175);
  const [age, setAge] = useState(localStorage.getItem('age') || 25);
  const [gender, setGender] = useState(localStorage.getItem('gender') || 'male');
  const [activity, setActivity] = useState(localStorage.getItem('activity') || 1.2);
  const [fitnessGoal, setFitnessGoal] = useState(localStorage.getItem('fitnessGoal') || 'maintenance');
  
  const [meals, setMeals] = useState(JSON.parse(localStorage.getItem('meals')) || []);
  
  // Changed from lifting data to Weight History
  const [weightHistory, setWeightHistory] = useState(JSON.parse(localStorage.getItem('weightHistory')) || [
    { date: 'Week 1', weight: 70 }
  ]);

  useEffect(() => {
    localStorage.setItem('meals', JSON.stringify(meals));
    localStorage.setItem('weightHistory', JSON.stringify(weightHistory));
    localStorage.setItem('weight', weight);
    localStorage.setItem('height', height);
    localStorage.setItem('age', age);
    localStorage.setItem('gender', gender);
    localStorage.setItem('activity', activity);
    localStorage.setItem('fitnessGoal', fitnessGoal);
  }, [meals, weightHistory, weight, height, age, gender, activity, fitnessGoal]);

  // --- CALCULATION LOGIC ---
  const bmr = (10 * weight) + (6.25 * height) - (5 * age) + (gender === 'male' ? 5 : -161);
  const tdee = Math.round(bmr * activity);
  let goalCals = fitnessGoal === 'deficit' ? tdee - 500 : fitnessGoal === 'surplus' ? tdee + 500 : tdee;
  const eaten = meals.reduce((acc, m) => ({ cals: acc.cals + m.cals, p: acc.p + m.p, c: acc.c + m.c, f: acc.f + m.f }), { cals: 0, p: 0, c: 0, f: 0 });

  return (
    <Router>
      <div style={appContainer}>
        <main style={mainContent}>
          <Routes>
            <Route path="/" element={<Dashboard goal={goalCals} eaten={eaten} goalP={goalCals*0.3/4} goalC={goalCals*0.4/4} goalF={goalCals*0.3/9} />} />
            <Route path="/diary" element={<Diary meals={meals} setMeals={setMeals} />} />
            <Route path="/weight" element={<WeightRecorder data={weightHistory} setData={setWeightHistory} currentWeight={weight} setGlobalWeight={setWeight} />} />
            <Route path="/profile" element={<Profile stats={{weight, height, age, gender, fitnessGoal}} setters={{setWeight, setHeight, setAge, setGender, setFitnessGoal}} />} />
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

// --- NEW COMPONENT: WEIGHT RECORDER ---

function WeightRecorder({ data, setData, currentWeight, setGlobalWeight }) {
  const [logWeight, setLogWeight] = useState(currentWeight);

  const addWeightLog = () => {
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const newLog = { date: today, weight: parseFloat(logWeight) };
    setData([...data, newLog]);
    setGlobalWeight(logWeight); // Update your main weight for calorie calculation
  };

  return (
    <div style={pageStyle}>
      <h2 style={pageTitle}>Weight Tracker</h2>
      
      <div style={heroCard}>
        <span style={{ fontSize: '14px', opacity: 0.8 }}>Current Weight Trend</span>
        <div style={{ width: '100%', height: 200, marginTop: '10px' }}>
          <ResponsiveContainer>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
              <XAxis dataKey="date" stroke="#fff" fontSize={10} />
              <YAxis stroke="#fff" fontSize={10} domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
              <Line type="monotone" dataKey="weight" stroke="#fff" strokeWidth={4} dot={{ r: 6, fill: '#fff' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={cardStyle}>
        <h3 style={{ marginBottom: '15px' }}>Log New Weight</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="number" 
            value={logWeight} 
            onChange={(e) => setLogWeight(e.target.value)} 
            style={inputStyle} 
            placeholder="kg"
          />
          <button onClick={addWeightLog} style={btnStyle}>Save Log</button>
        </div>
        <p style={{ fontSize: '12px', color: '#64748b', marginTop: '15px' }}>
          Tip: Weigh yourself at the same time every morning for the most accurate graph.
        </p>
      </div>

      <button 
        onClick={() => { if(window.confirm('Delete history?')) setData([]); }} 
        style={{ marginTop: '20px', background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', cursor: 'pointer' }}
      >
        Clear History
      </button>
    </div>
  );
}

// --- (Other components like Dashboard, Diary, Profile stay similar but updated for UI) ---

function Dashboard({ goal, eaten, goalP, goalC, goalF }) {
  return (
    <div style={pageStyle}>
      <h2 style={pageTitle}>Daily Summary</h2>
      <div style={heroCard}>
        <span style={{ fontSize: '14px', opacity: 0.8 }}>Calories Left</span>
        <h1 style={{ fontSize: '48px', margin: '10px 0' }}>{goal - Math.round(eaten.cals)}</h1>
        <div style={progressBar}><div style={{ ...progressFill, width: `${(eaten.cals/goal)*100}%` }}></div></div>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
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
      <h2 style={pageTitle}>Diary</h2>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input style={inputStyle} placeholder="Search..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <button style={btnStyle} onClick={searchFood}><Search size={18} /></button>
      </div>
      {results.slice(0,5).map((item, i) => (
        <div key={i} style={listItem}>
          <span>{item.food.label} ({Math.round(item.food.nutrients.ENERC_KCAL)} kcal)</span>
          <Plus size={18} style={{cursor:'pointer'}} onClick={() => setMeals([...meals, { id: Date.now(), name: item.food.label, cals: item.food.nutrients.ENERC_KCAL, p: item.food.nutrients.PROCNT, c: item.food.nutrients.CHOCDF, f: item.food.nutrients.FAT }])} />
        </div>
      ))}
      <h3 style={{marginTop:'30px'}}>Eaten Today</h3>
      {meals.map(m => (
        <div key={m.id} style={listItem}>
          <span>{m.name}</span>
          <span>{Math.round(m.cals)} kcal <Trash2 size={14} style={{color:'#ef4444', marginLeft:'10px'}} onClick={() => setMeals(meals.filter(x => x.id !== m.id))} /></span>
        </div>
      ))}
    </div>
  );
}

function Profile({ stats, setters }) {
  return (
    <div style={pageStyle}>
      <h2 style={pageTitle}>Profile</h2>
      <div style={cardStyle}>
        <label style={labelStyle}>Goal</label>
        <select style={fullInput} value={stats.fitnessGoal} onChange={(e) => setters.setFitnessGoal(e.target.value)}>
          <option value="deficit">Lose Weight</option>
          <option value="maintenance">Maintain</option>
          <option value="surplus">Bulk</option>
        </select>
        <label style={labelStyle}>Gender</label>
        <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
           <button onClick={() => setters.setGender('male')} style={{...toggleBtn, background: stats.gender==='male'?'#3b82f6':'#eee', color: stats.gender==='male'?'#fff':'#000'}}>Male</button>
           <button onClick={() => setters.setGender('female')} style={{...toggleBtn, background: stats.gender==='female'?'#ec4899':'#eee', color: stats.gender==='female'?'#fff':'#000'}}>Female</button>
        </div>
        <label style={labelStyle}>Height (cm)</label>
        <input type="number" style={fullInput} value={stats.height} onChange={(e) => setters.setHeight(e.target.value)} />
        <label style={labelStyle}>Age</label>
        <input type="number" style={fullInput} value={stats.age} onChange={(e) => setters.setAge(e.target.value)} />
      </div>
    </div>
  );
}

// --- SHARED STYLES & HELPERS ---
function NavLink({ to, icon, label }) {
  return (
    <Link to={to} style={{ textDecoration: 'none', color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      {icon} <span style={{ fontSize: '10px' }}>{label}</span>
    </Link>
  );
}
function MacroTile({ label, current, goal, color }) {
  return (
    <div style={{ ...cardStyle, flex: 1, textAlign: 'center', padding: '10px' }}>
      <span style={{ fontSize: '10px', color: '#64748b' }}>{label}</span>
      <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{Math.round(current)}g</div>
      <div style={{ height: '3px', background: '#eee', marginTop: '5px' }}><div style={{ height: '100%', background: color, width: `${(current/goal)*100}%` }}></div></div>
    </div>
  );
}

const appContainer = { minHeight: '100vh', backgroundColor: '#f8fafc', paddingBottom: '90px' };
const mainContent = { padding: '20px' };
const navBar = { position: 'fixed', bottom: 0, left: 0, right: 0, height: '75px', background: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-around', alignItems: 'center', boxShadow: '0 -2px 10px rgba(0,0,0,0.05)' };
const pageStyle = { maxWidth: '450px', margin: '0 auto' };
const pageTitle = { fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' };
const heroCard = { background: '#3b82f6', color: 'white', padding: '25px', borderRadius: '24px', boxShadow: '0 10px 20px rgba(59,130,246,0.2)', marginBottom: '20px' };
const progressBar = { height: '8px', background: 'rgba(255,255,255,0.3)', borderRadius: '10px', marginTop: '15px', overflow: 'hidden' };
const progressFill = { height: '100%', background: 'white' };
const cardStyle = { background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0' };
const inputStyle = { flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '16px' };
const fullInput = { width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', marginBottom: '15px', boxSizing: 'border-box' };
const btnStyle = { background: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', padding: '12px 20px', fontWeight: 'bold', cursor: 'pointer' };
const listItem = { display: 'flex', justifyContent: 'space-between', padding: '15px 0', borderBottom: '1px solid #f1f5f9' };
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '5px' };
const toggleBtn = { flex: 1, padding: '12px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' };