import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calculator, Search, TrendingUp, Pizza, Plus, Trash2, Utensils, Target, Info, User } from 'lucide-react';
import axios from 'axios';

export default function App() {
  // --- STATE ---
  const [weight, setWeight] = useState(localStorage.getItem('weight') || 70);
  const [height, setHeight] = useState(localStorage.getItem('height') || 175);
  const [age, setAge] = useState(localStorage.getItem('age') || 25);
  const [gender, setGender] = useState(localStorage.getItem('gender') || 'male'); // NEW: Gender State
  const [activity, setActivity] = useState(localStorage.getItem('activity') || 1.2);
  const [fitnessGoal, setFitnessGoal] = useState(localStorage.getItem('fitnessGoal') || 'maintenance');
  
  const [meals, setMeals] = useState(JSON.parse(localStorage.getItem('meals')) || []);
  const [liftData, setLiftData] = useState(JSON.parse(localStorage.getItem('lifts')) || [{ week: 'Wk 1', weight: 40 }]);
  const [query, setQuery] = useState('');
  const [foodResults, setFoodResults] = useState([]);
  const [newLift, setNewLift] = useState({ weight: '', reps: '' });
  const [hoveredFood, setHoveredFood] = useState(null);

  useEffect(() => {
    localStorage.setItem('meals', JSON.stringify(meals));
    localStorage.setItem('lifts', JSON.stringify(liftData));
    localStorage.setItem('weight', weight);
    localStorage.setItem('height', height);
    localStorage.setItem('age', age);
    localStorage.setItem('gender', gender); // NEW: Persistence
    localStorage.setItem('activity', activity);
    localStorage.setItem('fitnessGoal', fitnessGoal);
  }, [meals, liftData, weight, height, age, gender, activity, fitnessGoal]);

  // --- UPDATED CALORIE LOGIC ---
  const calculateTDEE = () => {
    // Mifflin-St Jeor Equation
    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
    
    // The Gender Factor
    if (gender === 'male') {
      bmr = bmr + 5;
    } else {
      bmr = bmr - 161;
    }
    
    return Math.round(bmr * activity);
  };

  const tdee = calculateTDEE();
  let goalCals = fitnessGoal === 'deficit' ? tdee - 500 : fitnessGoal === 'surplus' ? tdee + 500 : tdee;
  const eatenCals = Math.round(meals.reduce((acc, m) => acc + m.cals, 0));
  const bmi = (weight / ((height / 100) ** 2)).toFixed(1);

  // --- FUNCTIONS ---
  const searchFood = async () => {
    if (!query) return;
    try {
      const res = await axios.get(`https://api.edamam.com/api/food-database/v2/parser?app_id=f027c2f8&app_key=3668870954b9d03195f1d439818816c7&ingr=${query}`);
      setFoodResults(res.data.hints);
    } catch (err) { console.error(err); }
  };

  const addMeal = (f) => {
    setMeals([...meals, { id: Date.now(), name: f.label, cals: f.nutrients.ENERC_KCAL }]);
  };

  return (
    <div style={containerStyle}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Fitness Tracker</h1>

      {/* DASHBOARD TOP */}
      <div style={dashboardTop}>
        <div style={cardStyle}>
          <p style={labelStyle}>DAILY GOAL</p>
          <h2 style={{ margin: 0, color: '#3b82f6' }}>{goalCals} kcal</h2>
        </div>
        <div style={cardStyle}>
          <p style={labelStyle}>REMAINING</p>
          <h2 style={{ margin: 0, color: goalCals - eatenCals < 0 ? '#ef4444' : '#10b981' }}>{goalCals - eatenCals}</h2>
        </div>
      </div>

      <div style={mainGrid}>
        {/* SETTINGS CARD */}
        <div style={cardStyle}>
          <h3 style={headerStyle}><User size={18} /> Profile & Goal</h3>
          
          <label style={labelStyle}>Gender</label>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <button 
              onClick={() => setGender('male')}
              style={{ ...toggleBtn, backgroundColor: gender === 'male' ? '#3b82f6' : '#f1f5f9', color: gender === 'male' ? 'white' : '#64748b' }}
            >Male</button>
            <button 
              onClick={() => setGender('female')}
              style={{ ...toggleBtn, backgroundColor: gender === 'female' ? '#ec4899' : '#f1f5f9', color: gender === 'female' ? 'white' : '#64748b' }}
            >Female</button>
          </div>

          <label style={labelStyle}>Current Goal</label>
          <select value={fitnessGoal} onChange={(e) => setFitnessGoal(e.target.value)} style={fullInput}>
            <option value="deficit">Weight Loss</option>
            <option value="maintenance">Maintenance</option>
            <option value="surplus">Muscle Gain</option>
          </select>

          <div style={inputRow}><label>Weight (kg)</label><input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} style={smallInput} /></div>
          <div style={inputRow}><label>Age</label><input type="number" value={age} onChange={(e) => setAge(e.target.value)} style={smallInput} /></div>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '10px' }}>BMI: <strong>{bmi}</strong></p>
        </div>

        {/* FOOD DATABASE */}
        <div style={{ ...cardStyle, position: 'relative' }}>
          <h3 style={headerStyle}><Search size={18} /> Food Search</h3>
          <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
            <input placeholder="Search..." style={{ ...fullInput, margin: 0 }} value={query} onChange={(e) => setQuery(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && searchFood()} />
            <button onClick={searchFood} style={btnStyle}><Search size={18}/></button>
          </div>
          <div style={listStyle}>
            {foodResults.map((item, i) => (
              <div key={i} style={listItem} onMouseEnter={() => setHoveredFood(item.food)} onMouseLeave={() => setHoveredFood(null)}>
                <span>{item.food.label}</span>
                <button onClick={() => addMeal(item.food)} style={addBtn}>{Math.round(item.food.nutrients.ENERC_KCAL)} <Plus size={12}/></button>
              </div>
            ))}
          </div>
          {hoveredFood && (
            <div style={hoverCardStyle}>
              <h4 style={{ margin: '0 0 5px 0' }}>{hoveredFood.label}</h4>
              <p style={{ margin: 0, fontSize: '12px' }}>Protein: {Math.round(hoveredFood.nutrients.PROCNT)}g</p>
              <p style={{ margin: 0, fontSize: '12px' }}>Carbs: {Math.round(hoveredFood.nutrients.CHOCDF)}g</p>
              <p style={{ margin: 0, fontSize: '12px' }}>Fats: {Math.round(hoveredFood.nutrients.FAT)}g</p>
            </div>
          )}
        </div>

        {/* DIARY */}
        <div style={cardStyle}>
          <h3 style={headerStyle}><Utensils size={18} /> Daily Diary</h3>
          <div style={listStyle}>
            {meals.map((m) => (
              <div key={m.id} style={listItem}>
                <span>{m.name}</span>
                <Trash2 size={14} color="#ef4444" style={{ cursor: 'pointer' }} onClick={() => setMeals(meals.filter(x => x.id !== m.id))} />
              </div>
            ))}
          </div>
        </div>

        {/* GRAPH */}
        <div style={{ ...cardStyle, gridColumn: '1 / -1' }}>
          <h3 style={headerStyle}><TrendingUp size={18} /> Strength Progress</h3>
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
const labelStyle = { fontSize: '11px', color: '#64748b', fontWeight: 'bold', marginBottom: '8px', display: 'block' };
const inputRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' };
const smallInput = { padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '70px' };
const fullInput = { padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', marginBottom: '10px' };
const btnStyle = { background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', padding: '10px', cursor: 'pointer' };
const toggleBtn = { flex: 1, padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' };
const listStyle = { maxHeight: '250px', overflowY: 'auto' };
const listItem = { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' };
const addBtn = { background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: '6px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' };
const hoverCardStyle = { position: 'absolute', top: '50px', right: '-230px', width: '200px', background: '#1e293b', color: 'white', padding: '15px', borderRadius: '12px', zIndex: 100 };