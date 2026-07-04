import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calculator, Search, TrendingUp, Pizza, Plus, Trash2, Utensils, Target, Info } from 'lucide-react';
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
  
  // Hover State for Food Details
  const [hoveredFood, setHoveredFood] = useState(null);

  useEffect(() => {
    localStorage.setItem('meals', JSON.stringify(meals));
    localStorage.setItem('lifts', JSON.stringify(liftData));
    localStorage.setItem('weight', weight);
    localStorage.setItem('height', height);
    localStorage.setItem('age', age);
    localStorage.setItem('activity', activity);
    localStorage.setItem('fitnessGoal', fitnessGoal);
  }, [meals, liftData, weight, height, age, activity, fitnessGoal]);

  // --- LOGIC ---
  const tdee = Math.round(((10 * weight) + (6.25 * height) - (5 * age) + 5) * activity);
  let goalCals = fitnessGoal === 'deficit' ? tdee - 500 : fitnessGoal === 'surplus' ? tdee + 500 : tdee;
  const eatenCals = Math.round(meals.reduce((acc, m) => acc + m.cals, 0));

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

  return (
    <div style={containerStyle}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Fitness Tracker</h1>

      {/* DASHBOARD TOP */}
      <div style={dashboardTop}>
        <div style={cardStyle}>
          <p style={labelStyle}>KCAL REMAINING</p>
          <h2 style={{ margin: 0, color: goalCals - eatenCals < 0 ? '#ef4444' : '#10b981' }}>{goalCals - eatenCals}</h2>
        </div>
        <div style={cardStyle}>
          <p style={labelStyle}>CURRENT WEIGHT</p>
          <h2 style={{ margin: 0 }}>{weight} kg</h2>
        </div>
      </div>

      <div style={mainGrid}>
        {/* FOOD SEARCH WITH HOVER DETAIL */}
        <div style={{ ...cardStyle, position: 'relative' }}>
          <h3 style={headerStyle}><Search size={18} /> Food Database</h3>
          <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
            <input 
               placeholder="Search (e.g. Eggs)..." 
               style={{ ...fullInput, margin: 0 }} 
               value={query} 
               onChange={(e) => setQuery(e.target.value)}
               onKeyPress={(e) => e.key === 'Enter' && searchFood()} 
            />
            <button onClick={searchFood} style={btnStyle}><Search size={18}/></button>
          </div>

          <div style={listStyle}>
            {foodResults.map((item, i) => (
              <div 
                key={i} 
                style={listItem}
                onMouseEnter={() => setHoveredFood(item.food)}
                onMouseLeave={() => setHoveredFood(null)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Info size={14} color="#94a3b8" />
                  <span>{item.food.label}</span>
                </div>
                <button onClick={() => addMeal(item.food)} style={addBtn}>
                  {Math.round(item.food.nutrients.ENERC_KCAL)} kcal <Plus size={12}/>
                </button>
              </div>
            ))}
          </div>

          {/* THE HOVER CARD (Floating Detail) */}
          {hoveredFood && (
            <div style={hoverCardStyle}>
              <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #eee' }}>{hoveredFood.label}</h4>
              <div style={macroDetail}><span>Calories:</span> <strong>{Math.round(hoveredFood.nutrients.ENERC_KCAL)} kcal</strong></div>
              <div style={macroDetail}><span>Protein:</span> <strong>{Math.round(hoveredFood.nutrients.PROCNT)}g</strong></div>
              <div style={macroDetail}><span>Carbs:</span> <strong>{Math.round(hoveredFood.nutrients.CHOCDF)}g</strong></div>
              <div style={macroDetail}><span>Fats:</span> <strong>{Math.round(hoveredFood.nutrients.FAT)}g</strong></div>
              <div style={macroDetail}><span>Fiber:</span> <strong>{Math.round(hoveredFood.nutrients.FIBTG || 0)}g</strong></div>
              <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '10px' }}>Values per 100g/serving</p>
            </div>
          )}
        </div>

        {/* LOGGED MEALS */}
        <div style={cardStyle}>
          <h3 style={headerStyle}><Utensils size={18} /> Daily Diary</h3>
          <div style={listStyle}>
            {meals.map((m) => (
              <div key={m.id} style={listItem}>
                <span>{m.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <strong>{Math.round(m.cals)}</strong>
                  <Trash2 size={14} color="#ef4444" style={{ cursor: 'pointer' }} onClick={() => setMeals(meals.filter(x => x.id !== m.id))} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* GOALS SECTION */}
        <div style={cardStyle}>
          <h3 style={headerStyle}><Target size={18} /> Settings</h3>
          <label style={labelStyle}>Fitness Goal</label>
          <select value={fitnessGoal} onChange={(e) => setFitnessGoal(e.target.value)} style={fullInput}>
            <option value="deficit">Deficit (-500)</option>
            <option value="maintenance">Maintenance</option>
            <option value="surplus">Surplus (+500)</option>
          </select>
          <div style={inputRow}><label>Weight (kg)</label><input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} style={smallInput} /></div>
          <div style={inputRow}><label>Height (cm)</label><input type="number" value={height} onChange={(e) => setHeight(e.target.value)} style={smallInput} /></div>
        </div>

        {/* GRAPH */}
        <div style={{ ...cardStyle, gridColumn: '1 / -1' }}>
          <h3 style={headerStyle}><TrendingUp size={18} /> Strength Progression</h3>
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer><LineChart data={liftData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="week" /><YAxis /><Tooltip /><Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={3} /></LineChart></ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- STYLES ---
const containerStyle = { padding: '20px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'Inter, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' };
const dashboardTop = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' };
const mainGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' };
const cardStyle = { background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' };
const headerStyle = { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px', fontSize: '15px', fontWeight: 'bold' };
const labelStyle = { fontSize: '11px', color: '#64748b', fontWeight: 'bold', letterSpacing: '0.5px' };
const inputRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' };
const smallInput = { padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '70px' };
const fullInput = { padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', marginBottom: '10px' };
const btnStyle = { background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', padding: '10px', cursor: 'pointer' };
const listStyle = { maxHeight: '300px', overflowY: 'auto' };
const listItem = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' };
const addBtn = { background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: '6px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' };

// NEW: Hover Card Styles
const hoverCardStyle = {
  position: 'absolute', top: '100px', right: '-250px', width: '220px', background: '#1e293b', color: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 100, pointerEvents: 'none'
};
const macroDetail = { display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' };