import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calculator, Search, TrendingUp, Pizza, Plus, Trash2, Utensils, Target, User, Zap } from 'lucide-react';
import axios from 'axios';

export default function App() {
  // --- 1. STATE & PERSISTENCE ---
  const [weight, setWeight] = useState(localStorage.getItem('weight') || 70);
  const [height, setHeight] = useState(localStorage.getItem('height') || 175);
  const [age, setAge] = useState(localStorage.getItem('age') || 25);
  const [gender, setGender] = useState(localStorage.getItem('gender') || 'male');
  const [activity, setActivity] = useState(localStorage.getItem('activity') || 1.2);
  const [fitnessGoal, setFitnessGoal] = useState(localStorage.getItem('fitnessGoal') || 'maintenance');
  
  const [meals, setMeals] = useState(JSON.parse(localStorage.getItem('meals')) || []);
  const [liftData, setLiftData] = useState(JSON.parse(localStorage.getItem('lifts')) || [{ week: 'Wk 1', weight: 40 }]);
  const [query, setQuery] = useState('');
  const [foodResults, setFoodResults] = useState([]);
  const [newLift, setNewLift] = useState({ weight: '', reps: '' });

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

  // --- 2. CALORIE & MACRO LOGIC ---
  const bmr = (10 * weight) + (6.25 * height) - (5 * age) + (gender === 'male' ? 5 : -161);
  const tdee = Math.round(bmr * activity);
  
  let goalCals = fitnessGoal === 'deficit' ? tdee - 500 : fitnessGoal === 'surplus' ? tdee + 500 : tdee;
  
  // Macros Goal (30/40/30 split)
  const goalProt = Math.round((goalCals * 0.3) / 4);
  const goalCarb = Math.round((goalCals * 0.4) / 4);
  const goalFat = Math.round((goalCals * 0.3) / 9);

  // Macros Eaten
  const eaten = meals.reduce((acc, m) => ({
    cals: acc.cals + m.cals,
    p: acc.p + (m.p || 0),
    c: acc.c + (m.c || 0),
    f: acc.f + (m.f || 0)
  }), { cals: 0, p: 0, c: 0, f: 0 });

  // --- 3. FUNCTIONS ---
  const searchFood = async () => {
    if (!query) return;
    try {
      const res = await axios.get(`https://api.edamam.com/api/food-database/v2/parser?app_id=f027c2f8&app_key=3668870954b9d03195f1d439818816c7&ingr=${query}`);
      setFoodResults(res.data.hints);
    } catch (err) { console.error(err); }
  };

  const addMeal = (f) => {
    setMeals([...meals, { 
      id: Date.now(), 
      name: f.label, 
      cals: f.nutrients.ENERC_KCAL,
      p: f.nutrients.PROCNT || 0,
      c: f.nutrients.CHOCDF || 0,
      f: f.nutrients.FAT || 0
    }]);
  };

  const MacroBar = ({ label, current, goal, color }) => (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '2px' }}>{label}: {Math.round(current)}g</div>
      <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ height: '100%', background: color, width: `${Math.min((current/goal)*100, 100)}%`, transition: 'width 0.4s' }}></div>
      </div>
    </div>
  );

  return (
    <div style={containerStyle}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>Fitness Tracker</h1>

      {/* TOP DASHBOARD */}
      <div style={summaryBar}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span style={labelStyle}>CALORIES LEFT</span>
            <span style={{ fontWeight: 'bold' }}>{goalCals - Math.round(eaten.cals)} / {goalCals}</span>
          </div>
          <div style={progressContainer}><div style={{ ...progressFill, width: `${(eaten.cals/goalCals)*100}%` }}></div></div>
          <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
            <MacroBar label="Prot" current={eaten.p} goal={goalProt} color="#ef4444" />
            <MacroBar label="Carb" current={eaten.c} goal={goalCarb} color="#3b82f6" />
            <MacroBar label="Fat" current={eaten.f} goal={goalFat} color="#f59e0b" />
          </div>
        </div>
      </div>

      <div style={mainGrid}>
        {/* PROFILE SETTINGS */}
        <div style={cardStyle}>
          <h3 style={headerStyle}><User size={18} /> Profile & Goal</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <button onClick={() => setGender('male')} style={{ ...toggleBtn, backgroundColor: gender === 'male' ? '#3b82f6' : '#f1f5f9', color: gender === 'male' ? 'white' : '#64748b' }}>Male</button>
            <button onClick={() => setGender('female')} style={{ ...toggleBtn, backgroundColor: gender === 'female' ? '#ec4899' : '#f1f5f9', color: gender === 'female' ? 'white' : '#64748b' }}>Female</button>
          </div>
          <select value={fitnessGoal} onChange={(e) => setFitnessGoal(e.target.value)} style={fullInput}>
            <option value="deficit">Weight Loss (Deficit)</option>
            <option value="maintenance">Maintenance</option>
            <option value="surplus">Build Muscle (Surplus)</option>
          </select>
          <div style={inputRow}><label>Weight (kg)</label><input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} style={smallInput} /></div>
          <div style={inputRow}><label>Height (cm)</label><input type="number" value={height} onChange={(e) => setHeight(e.target.value)} style={smallInput} /></div>
          <div style={inputRow}><label>Age</label><input type="number" value={age} onChange={(e) => setAge(e.target.value)} style={smallInput} /></div>
        </div>

        {/* FOOD SEARCH */}
        <div style={cardStyle}>
          <h3 style={headerStyle}><Search size={18} /> Food Database</h3>
          <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
            <input placeholder="Search..." style={{ ...fullInput, margin: 0 }} value={query} onChange={(e) => setQuery(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && searchFood()} />
            <button onClick={searchFood} style={btnStyle}><Plus size={18}/></button>
          </div>
          <div style={listStyle}>
            {foodResults.map((item, i) => (
              <div key={i} style={listItem}>
                <div>{item.food.label} <small style={{ color: '#94a3b8' }}>({Math.round(item.food.nutrients.ENERC_KCAL)} kcal)</small></div>
                <button onClick={() => addMeal(item.food)} style={addBtn}><Plus size={12}/></button>
              </div>
            ))}
          </div>
        </div>

        {/* DAILY MEALS */}
        <div style={cardStyle}>
          <h3 style={headerStyle}><Utensils size={18} /> Today's Diary</h3>
          <div style={listStyle}>
            {meals.map((m) => (
              <div key={m.id} style={listItem}>
                <span>{m.name}</span>
                <Trash2 size={14} color="#ef4444" style={{ cursor: 'pointer' }} onClick={() => setMeals(meals.filter(x => x.id !== m.id))} />
              </div>
            ))}
          </div>
        </div>

        {/* PROGRESSION */}
        <div style={{ ...cardStyle, gridColumn: '1 / -1' }}>
          <h3 style={headerStyle}><TrendingUp size={18} /> Strength Progression</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
             <input placeholder="kg" type="number" value={newLift.weight} onChange={(e) => setNewLift({...newLift, weight: e.target.value})} style={smallInput} />
             <input placeholder="reps" type="number" value={newLift.reps} onChange={(e) => setNewLift({...newLift, reps: e.target.value})} style={smallInput} />
             <button onClick={() => setLiftData([...liftData, { week: `Wk ${liftData.length+1}`, weight: Math.round(newLift.weight * (1 + newLift.reps/30)) }])} style={btnStyle}>Log</button>
          </div>
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer><LineChart data={liftData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="week" /><YAxis /><Tooltip /><Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={3} /></LineChart></ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- STYLES ---
const containerStyle = { padding: '20px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'Inter, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' };
const summaryBar = { background: 'white', padding: '20px', borderRadius: '15px', marginBottom: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' };
const progressContainer = { height: '10px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden' };
const progressFill = { height: '100%', background: '#3b82f6', transition: 'width 0.5s ease' };
const mainGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' };
const cardStyle = { background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' };
const headerStyle = { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px', fontSize: '15px', fontWeight: 'bold' };
const labelStyle = { fontSize: '11px', color: '#64748b', fontWeight: 'bold' };
const inputRow = { display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' };
const smallInput = { padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '70px' };
const fullInput = { padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', marginBottom: '10px' };
const btnStyle = { background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', padding: '10px', cursor: 'pointer' };
const toggleBtn = { flex: 1, padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const listStyle = { maxHeight: '200px', overflowY: 'auto' };
const listItem = { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' };
const addBtn = { background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: '6px' };