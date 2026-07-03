import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calculator, Search, TrendingUp, Pizza, Plus, Trash2 } from 'lucide-react';
import axios from 'axios';

export default function App() {
  // --- 1. LOAD DATA FROM STORAGE ---
  const savedLifts = JSON.parse(localStorage.getItem('lifts')) || [
    { week: 'Wk 1', weight: 40 },
  ];
  const savedCalories = JSON.parse(localStorage.getItem('calories')) || 0;

  // --- 2. STATE ---
  const [weight, setWeight] = useState(70);
  const [height, setHeight] = useState(175);
  const [age, setAge] = useState(25);
  const [activity, setActivity] = useState(1.2);
  const [query, setQuery] = useState('');
  const [foodResults, setFoodResults] = useState([]);
  const [dailyCalories, setDailyCalories] = useState(savedCalories);
  const [liftData, setLiftData] = useState(savedLifts);
  const [newLift, setNewLift] = useState({ weight: '', reps: '' });

  // --- 3. PERSISTENCE (Save to browser) ---
  useEffect(() => {
    localStorage.setItem('lifts', JSON.stringify(liftData));
    localStorage.setItem('calories', JSON.stringify(dailyCalories));
  }, [liftData, dailyCalories]);

  // --- 4. CALCULATIONS ---
  const bmi = (weight / ((height / 100) ** 2)).toFixed(1);
  const maintenance = Math.round(((10 * weight) + (6.25 * height) - (5 * age) + 5) * activity);

  // --- 5. FUNCTIONS ---
  const searchFood = async () => {
    if (!query) return;
    try {
      const res = await axios.get(`https://api.edamam.com/api/food-database/v2/parser?app_id=f027c2f8&app_key=3668870954b9d03195f1d439818816c7&ingr=${query}`);
      setFoodResults(res.data.hints);
    } catch (err) { console.error("API Error", err); }
  };

  const addLiftRecord = () => {
    if (!newLift.weight) return;
    const nextWeek = `Wk ${liftData.length + 1}`;
    // We use the 1-Rep Max formula: Weight * (1 + Reps/30)
    const strengthScore = Math.round(newLift.weight * (1 + (newLift.reps || 1) / 30));
    setLiftData([...liftData, { week: nextWeek, weight: strengthScore }]);
    setNewLift({ weight: '', reps: '' });
  };

  return (
    <div style={containerStyle}>
      <h1 style={{ textAlign: 'center', color: '#1e293b' }}>Fitness Tracker</h1>

      <div style={gridStyle}>
        
        {/* BODY METRICS */}
        <div style={cardStyle}>
          <h3 style={headerStyle}><Calculator color="#2563eb" /> Body Metrics</h3>
          <div style={inputRow}><label>Weight (kg):</label><input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} style={inputStyle} /></div>
          <div style={inputRow}><label>Height (cm):</label><input type="number" value={height} onChange={(e) => setHeight(e.target.value)} style={inputStyle} /></div>
          <div style={inputRow}>
            <label>Activity:</label>
            <select onChange={(e) => setActivity(e.target.value)} style={inputStyle}>
              <option value="1.2">Sedentary</option>
              <option value="1.375">Lightly Active</option>
              <option value="1.55">Moderate</option>
              <option value="1.725">Very Active</option>
            </select>
          </div>
          <div style={resultBox}>
            <p><strong>BMI:</strong> {bmi}</p>
            <p><strong>Maintenance:</strong> {maintenance} kcal</p>
          </div>
        </div>

        {/* FOOD DATABASE */}
        <div style={cardStyle}>
          <h3 style={headerStyle}><Pizza color="#ea580c" /> Food Database</h3>
          <div style={{ display: 'flex', gap: '5px' }}>
            <input placeholder="Search Food..." style={{ ...inputStyle, flex: 1 }} value={query} onChange={(e) => setQuery(e.target.value)} />
            <button onClick={searchFood} style={btnStyle}><Search size={16}/></button>
          </div>
          
          <div style={listStyle}>
            {foodResults.slice(0, 5).map((item, i) => (
              <div key={i} style={listItem}>
                <span>{item.food.label} ({Math.round(item.food.nutrients.ENERC_KCAL)} kcal)</span>
                <button onClick={() => setDailyCalories(prev => prev + item.food.nutrients.ENERC_KCAL)} style={addBtn}><Plus size={12}/></button>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>Total: {Math.round(dailyCalories)} kcal</strong>
            <button onClick={() => setDailyCalories(0)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'red' }}><Trash2 size={16}/></button>
          </div>
        </div>

        {/* PROGRESS RECORDER */}
        <div style={{ ...cardStyle, gridColumn: '1 / -1' }}>
          <h3 style={headerStyle}><TrendingUp color="#16a34a" /> Lifting Progression (Strength Score)</h3>
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'flex-end' }}>
            <div><label style={labelSmall}>Weight (kg)</label><input type="number" value={newLift.weight} onChange={(e) => setNewLift({...newLift, weight: e.target.value})} style={inputStyle} /></div>
            <div><label style={labelSmall}>Reps</label><input type="number" value={newLift.reps} onChange={(e) => setNewLift({...newLift, reps: e.target.value})} style={inputStyle} /></div>
            <button onClick={addLiftRecord} style={btnStyle}>Log Lift</button>
            <button onClick={() => setLiftData([])} style={{...btnStyle, background: '#ef4444'}}>Clear Graph</button>
          </div>

          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <LineChart data={liftData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis label={{ value: 'Est. 1RM', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Line type="monotone" dataKey="weight" stroke="#2563eb" strokeWidth={3} animationDuration={500} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}

// --- STYLES ---
const containerStyle = { padding: '30px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' };
const cardStyle = { background: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', border: '1px solid #e2e8f0' };
const headerStyle = { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' };
const inputRow = { display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' };
const inputStyle = { padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '100px' };
const labelSmall = { display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' };
const resultBox = { marginTop: '15px', padding: '15px', backgroundColor: '#f1f5f9', borderRadius: '10px' };
const btnStyle = { background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', padding: '10px 15px', cursor: 'pointer' };
const listStyle = { marginTop: '15px', maxHeight: '150px', overflowY: 'auto' };
const listItem = { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '14px' };
const addBtn = { background: '#f1f5f9', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '4px' };