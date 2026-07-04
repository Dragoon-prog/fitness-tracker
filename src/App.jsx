import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calculator, Search, TrendingUp, Pizza, Plus, Trash2, Utensils, Target, Zap } from 'lucide-react';
import axios from 'axios';

export default function App() {
  // --- STATE ---
  const [weight, setWeight] = useState(localStorage.getItem('weight') || 70);
  const [height, setHeight] = useState(localStorage.getItem('height') || 175);
  const [age, setAge] = useState(localStorage.getItem('age') || 25);
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
    localStorage.setItem('activity', activity);
    localStorage.setItem('fitnessGoal', fitnessGoal);
  }, [meals, liftData, weight, height, age, activity, fitnessGoal]);

  // --- CALORIE & MACRO LOGIC ---
  const tdee = Math.round(((10 * weight) + (6.25 * height) - (5 * age) + 5) * activity);
  let goalCals = fitnessGoal === 'deficit' ? tdee - 500 : fitnessGoal === 'surplus' ? tdee + 500 : tdee;

  // Goals for Macros (Standard Fitness Split: 30% Prot, 40% Carb, 30% Fat)
  const goalProt = Math.round((goalCals * 0.30) / 4);
  const goalCarb = Math.round((goalCals * 0.40) / 4);
  const goalFat = Math.round((goalCals * 0.30) / 9);

  // Eaten Macros
  const eaten = meals.reduce((acc, m) => ({
    cals: acc.cals + m.cals,
    p: acc.p + m.p,
    c: acc.c + m.c,
    f: acc.f + m.f
  }), { cals: 0, p: 0, c: 0, f: 0 });

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
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
        <span>{label}</span>
        <span>{Math.round(current)}g / {goal}g</span>
      </div>
      <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ height: '100%', background: color, width: `${Math.min((current/goal)*100, 100)}%`, transition: 'width 0.4s' }}></div>
      </div>
    </div>
  );

  return (
    <div style={containerStyle}>
      <header style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0, color: '#0f172a' }}>Fitness Tracker</h1>
        <p style={{ color: '#64748b', fontSize: '14px' }}>Log, Track, and Grow</p>
      </header>

      {/* DASHBOARD SUMMARY */}
      <div style={summaryGrid}>
        <div style={cardStyle}>
          <p style={{ color: '#64748b', fontSize: '12px', margin: '0 0 5px 0' }}>CALORIES REMAINING</p>
          <h2 style={{ margin: 0, color: goalCals - eaten.cals < 0 ? '#ef4444' : '#10b981' }}>{goalCals - Math.round(eaten.cals)}</h2>
          <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '10px', marginTop: '10px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: '#3b82f6', width: `${(eaten.cals/goalCals)*100}%` }}></div>
          </div>
        </div>
        <div style={cardStyle}>
          <p style={{ color: '#64748b', fontSize: '12px', margin: '0 0 10px 0' }}>DAILY MACROS</p>
          <MacroBar label="Protein" current={eaten.p} goal={goalProt} color="#ef4444" />
          <MacroBar label="Carbs" current={eaten.c} goal={goalCarb} color="#3b82f6" />
          <MacroBar label="Fats" current={eaten.f} goal={goalFat} color="#f59e0b" />
        </div>
      </div>

      <div style={mainGrid}>
        {/* STATS CONTROL */}
        <div style={cardStyle}>
          <h3 style={headerStyle}><Target size={18} /> Goal & Stats</h3>
          <select value={fitnessGoal} onChange={(e) => setFitnessGoal(e.target.value)} style={fullInput}>
            <option value="deficit">Weight Loss</option>
            <option value="maintenance">Maintain</option>
            <option value="surplus">Build Muscle</option>
          </select>
          <div style={inputRow}><label>Weight</label><input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} style={smallInput} /></div>
          <div style={inputRow}><label>Height</label><input type="number" value={height} onChange={(e) => setHeight(e.target.value)} style={smallInput} /></div>
        </div>

        {/* FOOD SEARCH */}
        <div style={cardStyle}>
          <h3 style={headerStyle}><Search size={18} /> Find Food</h3>
          <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
            <input placeholder="Search..." style={{ ...fullInput, margin: 0 }} value={query} onChange={(e) => setQuery(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && searchFood()} />
            <button onClick={searchFood} style={btnStyle}><Plus size={18}/></button>
          </div>
          <div style={listStyle}>
            {foodResults.map((item, i) => (
              <div key={i} style={listItem}>
                <div>
                   <div style={{ fontWeight: '600' }}>{item.food.label}</div>
                   <div style={{ fontSize: '11px', color: '#64748b' }}>P: {Math.round(item.food.nutrients.PROCNT)}g | C: {Math.round(item.food.nutrients.CHOCDF)}g</div>
                </div>
                <button onClick={() => addMeal(item.food)} style={addBtn}>{Math.round(item.food.nutrients.ENERC_KCAL)} <Plus size={12}/></button>
              </div>
            ))}
          </div>
        </div>

        {/* MEAL LIST */}
        <div style={cardStyle}>
          <h3 style={headerStyle}><Utensils size={18} /> Today's Diary</h3>
          <div style={listStyle}>
            {meals.length === 0 ? <p style={{ textAlign: 'center', color: '#94a3b8' }}>Empty</p> : meals.map((m) => (
              <div key={m.id} style={listItem}>
                <span>{m.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                   <span style={{ fontWeight: 'bold' }}>{Math.round(m.cals)}</span>
                   <Trash2 size={14} color="#ef4444" style={{ cursor: 'pointer' }} onClick={() => setMeals(meals.filter(x => x.id !== m.id))} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PROGRESSION */}
        <div style={{ ...cardStyle, gridColumn: '1 / -1' }}>
          <h3 style={headerStyle}><TrendingUp size={18} /> Strength Tracker</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input placeholder="kg" type="number" value={newLift.weight} onChange={(e) => setNewLift({...newLift, weight: e.target.value})} style={smallInput} />
            <input placeholder="reps" type="number" value={newLift.reps} onChange={(e) => setNewLift({...newLift, reps: e.target.value})} style={smallInput} />
            <button onClick={() => setLiftData([...liftData, { week: `Wk ${liftData.length+1}`, weight: Math.round(newLift.weight * (1 + newLift.reps/30)) }])} style={btnStyle}>Log Lift</button>
          </div>
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer><LineChart data={liftData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="week" /><YAxis /><Tooltip /><Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} /></LineChart></ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- STYLES ---
const containerStyle = { padding: '20px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'Inter, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' };
const summaryGrid = { display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px', marginBottom: '20px' };
const mainGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' };
const cardStyle = { background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' };
const headerStyle = { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px', fontSize: '15px', fontWeight: '600' };
const inputRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' };
const smallInput = { padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '80px' };
const fullInput = { padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', marginBottom: '15px' };
const btnStyle = { background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold' };
const listStyle = { maxHeight: '250px', overflowY: 'auto' };
const listItem = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' };
const addBtn = { background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: '6px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' };