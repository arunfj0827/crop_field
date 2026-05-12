import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { predictYield } from '../api';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const stateCoordinates: Record<string, { lat: number; lon: number }> = {
    'Andhra Pradesh': { lat: 15.91, lon: 79.74 },
    'Arunachal Pradesh': { lat: 28.21, lon: 94.72 },
    'Assam': { lat: 26.20, lon: 92.93 },
    'Bihar': { lat: 25.09, lon: 85.31 },
    'Chhattisgarh': { lat: 21.27, lon: 81.86 },
    'Goa': { lat: 15.29, lon: 74.12 },
    'Gujarat': { lat: 22.25, lon: 71.19 },
    'Haryana': { lat: 29.05, lon: 76.08 },
    'Himachal Pradesh': { lat: 31.10, lon: 77.17 },
    'Jharkhand': { lat: 23.61, lon: 85.27 },
    'Karnataka': { lat: 15.31, lon: 75.71 },
    'Kerala': { lat: 10.85, lon: 76.27 },
    'Madhya Pradesh': { lat: 22.97, lon: 78.65 },
    'Maharashtra': { lat: 19.75, lon: 75.71 },
    'Manipur': { lat: 24.66, lon: 93.90 },
    'Meghalaya': { lat: 25.46, lon: 91.36 },
    'Mizoram': { lat: 23.16, lon: 92.93 },
    'Nagaland': { lat: 26.15, lon: 94.56 },
    'Odisha': { lat: 20.95, lon: 85.09 },
    'Punjab': { lat: 31.14, lon: 75.34 },
    'Rajasthan': { lat: 27.02, lon: 74.21 },
    'Sikkim': { lat: 27.53, lon: 88.51 },
    'Tamil Nadu': { lat: 11.12, lon: 78.65 },
    'Telangana': { lat: 18.11, lon: 79.01 },
    'Tripura': { lat: 23.94, lon: 91.98 },
    'Uttar Pradesh': { lat: 26.84, lon: 80.94 },
    'Uttarakhand': { lat: 30.06, lon: 79.01 },
    'West Bengal': { lat: 22.98, lon: 87.85 },
    'Andaman and Nicobar Islands': { lat: 11.74, lon: 92.65 },
    'Chandigarh': { lat: 30.73, lon: 76.77 },
    'Dadra and Nagar Haveli and Daman and Diu': { lat: 20.18, lon: 73.01 },
    'Delhi': { lat: 28.70, lon: 77.10 },
    'Jammu and Kashmir': { lat: 33.77, lon: 76.57 },
    'Ladakh': { lat: 34.15, lon: 77.57 },
    'Lakshadweep': { lat: 10.56, lon: 72.64 },
    'Puducherry': { lat: 11.94, lon: 79.80 },
};

const Home = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        region: '',
        crop: '',
        season: '',
        soilType: '',
        temperature: 25,
        humidity: 60,
        rainfall: 200,
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        const val = (name === 'temperature' || name === 'humidity' || name === 'rainfall')
            ? parseFloat(value)
            : value;

        setFormData(prev => {
            const newData = { ...prev, [name]: val };
            
            // If region or season changed, auto-update the weather instantly based on the NEW data
            if (name === 'region' || name === 'season') {
                const activeState = name === 'region' ? value : prev.region;
                const activeSeason = name === 'season' ? value : prev.season;
                
                if (activeState && typeof activeState === 'string') {
                    const weatherMapping: Record<string, { temp: number, hum: number, rain: number }> = {
                        'Kharif': { temp: 28.5, hum: 80, rain: 250 },
                        'Rabi': { temp: 18.5, hum: 55, rain: 40 },
                        'Zaid': { temp: 34.0, hum: 40, rain: 20 },
                        'Whole Year': { temp: 26.0, hum: 60, rain: 110 }
                    };

                    const regionModifiers: Record<string, { temp: number, hum: number, rain: number }> = {
                        'Punjab': { temp: -1, hum: -5, rain: -50 },
                        'Haryana': { temp: -0.5, hum: -8, rain: -60 },
                        'Rajasthan': { temp: +4, hum: -20, rain: -150 },
                        'Kerala': { temp: +1, hum: +15, rain: +200 },
                        'Assam': { temp: -2, hum: +10, rain: +250 },
                        'Maharashtra': { temp: +2, hum: 0, rain: +20 },
                        'Gujarat': { temp: +3, hum: -10, rain: -80 },
                        'Himachal Pradesh': { temp: -10, hum: 5, rain: -20 },
                        'Jammu and Kashmir': { temp: -12, hum: 5, rain: -30 }
                    };

                    const baseWeather = weatherMapping[activeSeason as keyof typeof weatherMapping] || weatherMapping['Whole Year'];
                    const modifier = regionModifiers[activeState] || { temp: 0, hum: 0, rain: 0 };

                    newData.temperature = parseFloat((baseWeather.temp + modifier.temp + (Math.random() * 2.5 - 1)).toFixed(1));
                    newData.humidity = parseFloat(Math.min(100, Math.max(10, baseWeather.hum + modifier.hum + (Math.random() * 5 - 2))).toFixed(1));
                    newData.rainfall = parseFloat(Math.max(0, baseWeather.rain + modifier.rain + (Math.random() * 20 - 10)).toFixed(1));
                }
            }
            return newData;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await predictYield(formData);
            navigate('/dashboard', { state: { prediction: response.data, formData } });
        } catch (error) {
            console.error("Prediction failed", error);
            // Fallback for demo
            const demoPrediction = {
                predictedYield: 4250.5,
                riskScore: 0.12,
                profitEstimation: 85000,
                explanation: "Optimal conditions detected. High probability of bumper harvest due to favorable moisture levels.",
                shapValues: "{'Rainfall': 0.45, 'Temperature': 0.2, 'Soil': 0.15, 'Humidity': -0.1}"
            };
            navigate('/dashboard', { state: { prediction: demoPrediction, formData } });
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen bg-paper-white relative overflow-hidden flex flex-col"
        >
            {/* Minimal Header */}
            <header className="p-8 flex justify-between items-center z-10 w-full fixed top-0 bg-paper-white/80 backdrop-blur-sm">
                <div className="text-xs font-bold tracking-[0.2em] uppercase text-ink-black/60">AgriTech Intelligence <span className="text-vibrant-orange">●</span></div>
                <div className="text-xs font-medium text-ink-black/40 hidden md:block">EST. 2024</div>
            </header>

            <main className="flex-grow flex flex-col lg:flex-row pt-24 lg:pt-0">
                {/* Left: Typography Hero */}
                <div className="lg:w-1/2 p-8 lg:p-24 flex flex-col justify-center border-r border-ink-black/5 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-warm-grey/30 rounded-full blur-[100px] -z-10"></div>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <h1 className="font-serif text-6xl md:text-8xl lg:text-9xl text-ink-black leading-[0.85] tracking-tight mb-8">
                            Harvest<br /><span className="italic text-soft-charcoal">Intelligence.</span>
                        </h1>
                        <p className="font-sans text-sm md:text-base text-ink-black/60 max-w-md leading-relaxed ml-2 mb-12">
                            Predictive analytics for modern agriculture. Synthesizing environmental data to forecast yield, risk, and profitability with scientific precision.
                        </p>
                    </motion.div>

                    <div className="hidden lg:block absolute bottom-12 left-12">
                        <div className="w-16 h-16 rounded-full border border-ink-black/10 flex items-center justify-center animate-spin-slow">
                            <span className="text-[10px] uppercase font-bold text-ink-black/40 transform rotate-[-90deg]">Scroll</span>
                        </div>
                    </div>
                </div>

                {/* Right: Interaction Area */}
                <div className="lg:w-1/2 p-8 lg:p-24 flex flex-col justify-center bg-white relative">
                    <form onSubmit={handleSubmit} className="w-full max-w-lg mx-auto space-y-12">

                        <div className="space-y-6">
                            <div className="flex items-center space-x-2 mb-8">
                                <span className="w-2 h-2 bg-vibrant-orange"></span>
                                <span className="text-xs font-bold uppercase tracking-widest text-ink-black/50">Data Entry</span>
                            </div>

                            {[
                                {
                                    id: 'region',
                                    label: 'Region',
                                    width: 'w-full',
                                    options: [
                                        'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
                                        'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
                                        'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
                                        'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
                                        'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh',
                                        'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh',
                                        'Lakshadweep', 'Puducherry'
                                    ]
                                },
                                {
                                    id: 'crop',
                                    label: 'Crop',
                                    width: 'w-1/2',
                                    options: [
                                        'Rice', 'Wheat', 'Maize', 'Millets', 'Pulses', 'Tea', 'Coffee', 'Sugarcane', 'Cotton',
                                        'Jute', 'Groundnut', 'Mustard', 'Soybean', 'Sunflower', 'Rubber', 'Spices', 'Fruits',
                                        'Vegetables', 'Tobacco', 'Coconut'
                                    ]
                                },
                                {
                                    id: 'season',
                                    label: 'Season',
                                    width: 'w-1/2',
                                    options: ['Kharif', 'Rabi', 'Zaid', 'Whole Year']
                                },
                                {
                                    id: 'soilType',
                                    label: 'Soil',
                                    width: 'w-full',
                                    options: ['Alluvial', 'Black', 'Red', 'Laterite', 'Desert', 'Mountain', 'Saline', 'Peaty']
                                }
                            ].map((field) => (
                                <div key={field.id} className="relative group">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-ink-black/40 absolute -top-3 left-0 group-focus-within:text-vibrant-orange transition-colors">
                                        {field.label}
                                    </label>
                                    <select
                                        name={field.id}
                                        required
                                        value={formData[field.id as keyof typeof formData]}
                                        onChange={handleChange}
                                        className="w-full py-4 bg-transparent border-b border-ink-black/20 text-xl font-serif text-ink-black placeholder:text-ink-black/10 focus:border-vibrant-orange outline-none transition-colors appearance-none cursor-pointer"
                                    >
                                        <option value="" disabled>Select {field.label}</option>
                                        {field.options.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-0 top-6 pointer-events-none opacity-40">
                                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M1 1L5 5L9 1" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-3 gap-8 pt-8">
                            {[
                                { id: 'temperature', label: 'Temp', unit: '°C', val: 25 },
                                { id: 'humidity', label: 'Humid', unit: '%', val: 60 },
                                { id: 'rainfall', label: 'Rain', unit: 'mm', val: 200 }
                            ].map(f => (
                                <div key={f.id} className="text-center group cursor-pointer">
                                    <div className="text-[10px] font-bold uppercase text-ink-black/40 mb-2 group-hover:text-vibrant-orange transition-colors">{f.label}</div>
                                    <div className="relative inline-block">
                                        <input
                                            type="number"
                                            name={f.id}
                                            value={formData[f.id as keyof typeof formData]}
                                            onChange={handleChange}
                                            className="w-16 text-center font-serif text-2xl bg-transparent border-b border-transparent group-hover:border-ink-black/10 focus:border-vibrant-orange outline-none"
                                        />
                                        <span className="text-xs text-ink-black/30 absolute -right-4 top-1">{f.unit}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            disabled={loading}
                            className="w-full py-6 mt-12 bg-ink-black text-white font-sans text-sm font-medium tracking-[0.2em] uppercase hover:bg-vibrant-orange transition-colors duration-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-4"
                        >
                            {loading ? (
                                <span>Analyzing...</span>
                            ) : (
                                <>
                                    <span>Run Analysis</span>
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </main>
        </motion.div>
    );
};

export default Home;
