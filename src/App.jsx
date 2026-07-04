import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calculator, Search, TrendingUp, Pizza, Plus, Trash2, Utensils } from 'lucide-react';
import axios from 'axios';

export default function App() {
  // --- 1. PERSISTENT STATE ---
  const [weight, setWeight] = useState(localStorage.getItem('weight') || 70);
  const [height, setHeight] = useState(localStorage.getItem('height') || 175);
  const [age, setAge] = useState(localStorage.getItem('age') || 25);
  const [activity, setActivity] = useState(localStorage.getItem('activity') || 1.2);
  
  const [meals, setMeals] = useState(JSON.parse(localStorage.getItem('meals')) || []);
  const [liftData, setLiftData] = useState(JSON.parse(localStorage.getItem('lifts')) || [{ week: 'Wk 1', weight: 40 }]);

  const [query, setQuery] = useState('');
  const [foodResults, setFoodResults] = useState([]);
  const [newLift, setNewLift] = useState({ weight: '', reps: '' });

  // --- 2. SAVE ON EVERY CHANGE ---
  useEffect(() => {
    localStorage.setItem('meals', JSON.stringify(meals));
    localStorage.setItem('lifts', JSON.stringify(liftData));
    localStorage.setItem('weight', weight);
    localStorage.setItem('height', height);
    localStorage.setItem('age', age);
    localStorage.setItem('activity', activity);
  }, [meals, liftData, weight, height, age, activity]);

  // --- 3. CALCULATIONS ---
  const bmi = (weight / ((height / 100) ** 2)).toFixed(1);
  const goalCalories = Math.round(((10 * weight) + (6.25 * height) - (5 * age) + 5) * activity);
  const eatenCalories = Math.round(meals.reduce((acc, meal) => acc + meal.calories, 0));
  const remaining = goalCalories - eatenCalories;
  const progressPercent = Math.min((eatenCalories / goalCalories) * 100, 100);

  // --- 4. FUNCTIONS ---
  const searchFood = async () => {
    if (!query) return;
    try {
      const res = await axios.get(`https://api.edamam.com/api/food-database/v2/parser?app_id=f027c2f8&app_key=3668870954b9d03195f1d439818816c7&ingr=${query}`);
      setFoodResults(res.data.hints);
    } catch (err) { console.error(err); }
  };

  const addMeal = (food) => {
    const newEntry = {
      id: Date.now(),
      name: food.label,
      calories: food.nutrients.ENERC_KCAL,
      protein: food.nutrients.PROCNT || 0
    };
    setMeals([...meals, newEntry]);
  };

  const removeMeal = (id) => setMeals(meals.filter(m => m.id !== id));

  return (
    <div style={containerStyle}>
      <h1 style={{ textAlign: 'center', color: '#1e293b' }}>Fitness Tracker</h1>

      {/* TOP SUMMARY BAR */}
      <div style={summaryBar}>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Daily Goal: {goalCalories} kcal</p>
          <div style={progressContainer}><div style={{ ...progressFill, width: `${progressPercent}%` }}></div></div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ margin: 0, color: remaining < 0 ? '#ef4444' : '#10b981' }}>{remaining}</h2>
          <p style={{ margin: 0, fontSize: '12px' }}>kcal remaining</p>
        </div>
      </div>

      <div style={gridStyle}>
        {/* BODY METRICS */}
        <div style={cardStyle}>
          <h3 style={headerStyle}><Calculator color="#2563eb" /> Stats & BMI: {bmi}</h3>
          <div style={inputRow}><label>Weight (kg):</label><input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} style={inputStyle} /></div>
          <div style={inputRow}><label>Height (cm):</label><input type="number" value={height} onChange={(e) => setHeight(e.target.value)} style={inputStyle} /></div>
          <select onChange={(e) => setActivity(e.target.value)} style={{ ...inputStyle, width: '100%' }}>
            <option value="1.2">Sedentary</option>
            <option value="1.55">Active</option>
          </select>
        </div>

        {/* FOOD SEARCH */}
        <div style={cardStyle}>
          <h3 style={headerStyle}><Search color="#ea580c" /> Search Food</h3>
          <div style={{ display: 'flex', gap: '5px' }}>
            <input placeholder="Search..." style={{ ...inputStyle, flex: 1 }} value={query} onChange={(e) => setQuery(e.target.value)} />
            <button onClick={searchFood} style={btnStyle}><Search size={16}/></button>
          </div>
          <div style={listStyle}>
            {foodResults.slice(0, 5).map((item, i) => (
              <div key={i} style={listItem}>
                <span>{item.food.label} ({Math.round(item.food.nutrients.ENERC_KCAL)} kcal)</span>
                <button onClick={() => addMeal(item.food)} style={addBtn}><Plus size={12}/></button>
              </div>
            ))}
          </div>
        </div>

        {/* DAILY MEAL TRACKER */}
        <div style={cardStyle}>
          <h3 style={headerStyle}><Utensils color="#8b5cf6" /> Daily Meals</h3>
          <div style={listStyle}>
            {meals.length === 0 ? <p style={{ color: '#94a3b8' }}>No meals logged today.</p> : 
              meals.map((meal) => (
                <div key={meal.id} style={listItem}>
                  <span>{meal.name} - <strong>{Math.round(meal.calories)} kcal</strong></span>
                  <button onClick={() => removeMeal(meal.id)} style={{ border: 'none', color: '#ef4444', background: 'none', cursor: 'pointer' }}><Trash2 size={14}/></button>
                </div>
              ))
            }
          </div>
          <button onClick={() => setMeals([])} style={{ marginTop: '10px', background: 'none', border: '1px solid #ddd', cursor: 'pointer', fontSize: '12px', padding: '5px', borderRadius: '5px' }}>Clear Day</button>
        </div>

        {/* GRAPH */}
        <div style={{ ...cardStyle, gridColumn: '1 / -1' }}>
          <h3 style={headerStyle}><TrendingUp color="#16a34a" /> Lifting Progress</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
             <input placeholder="kg" type="number" value={newLift.weight} onChange={(e) => setNewLift({...newLift, weight: e.target.value})} style={inputStyle} />
             <input placeholder="reps" type="number" value={newLift.reps} onChange={(e) => setNewLift({...newLift, reps: e.target.value})} style={inputStyle} />
             <button onClick={() => setLiftData([...liftData, { week: `Wk ${liftData.length+1}`, weight: Math.round(newLift.weight * (1 + newLift.reps/30)) }])} style={btnStyle}>Log</button>
          </div>
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer><LineChart data={liftData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="week" /><YAxis /><Tooltip /><Line type="monotone" dataKey="weight" stroke="#2563eb" strokeWidth={3} /></LineChart></ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- STYLES ---
const containerStyle = { padding: '20px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' };
const summaryBar = { background: 'white', padding: '20px', borderRadius: '15px', display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' };
const progressContainer = { height: '10px', background: '#e2e8f0', borderRadius: '10px', marginTop: '8px', overflow: 'hidden' };
const progressFill = { height: '100%', background: '#2563eb', transition: 'width 0.5s ease' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' };
const cardStyle = { background: 'white', padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgb(0 0 0 / 0.05)' };
const headerStyle = { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', fontSize: '16px' };
const inputRow = { display: 'flex', justifyContent: 'space-between', marginBottom: '10px' };
const inputStyle = { padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '80px' };
const btnStyle = { background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 12px', cursor: 'pointer' };
const listStyle = { maxHeight: '200px', overflowY: 'auto' };
const listItem = { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '14px' };
const addBtn = { background: '#f1f5f9', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '4px 8px' };