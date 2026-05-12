// import { startTransition } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';

/* const AnimatedNumber = ({ value }: { value: number }) => {
    // Simplified animation for minimalism
    return <span>{value.toLocaleString()}</span>;
}; */

const Dashboard = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const prediction = location.state?.prediction;

    if (!prediction) return null;

    const parseShapData = (shapStr: string) => {
        try {
            if (shapStr.startsWith('{') && !shapStr.includes(':')) {
                const cleaned = shapStr.slice(1, -1);
                return cleaned.split(', ').map(pair => {
                    const [key, val] = pair.split('=');
                    return { name: key.toUpperCase(), impact: parseFloat(val) };
                });
            }
            const cleaned = shapStr.replace(/'/g, '"');
            const obj = JSON.parse(cleaned);
            return Object.entries(obj).map(([name, value]) => ({ name: name.toUpperCase(), impact: value as number }));
        } catch (e) { return []; }
    };

    const shapData = prediction.shapValues ? parseShapData(prediction.shapValues) : [];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen bg-warm-grey p-8 md:p-12 lg:p-24 text-ink-black font-sans"
        >
            {/* Header */}
            <header className="flex justify-between items-start mb-24 border-b border-ink-black/10 pb-8">
                <div>
                    <button onClick={() => navigate('/')} className="flex items-center space-x-2 text-xs font-bold uppercase tracking-[0.2em] hover:text-vibrant-orange transition-colors mb-4">
                        <ArrowLeft size={12} /> <span>Back</span>
                    </button>
                    <h1 className="font-serif text-5xl md:text-7xl">Analysis Report.</h1>
                </div>
                <div className="text-right hidden md:block">
                    <div className="text-xs font-bold uppercase tracking-[0.2em] text-ink-black/40">Status</div>
                    <div className="flex items-center justify-end space-x-2 mt-2">
                        <span className="w-2 h-2 rounded-full bg-vibrant-orange animate-pulse"></span>
                        <span className="font-medium">Live Computation</span>
                    </div>
                </div>
            </header>

            {/* Key Metrics - Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-24 mb-32">
                {[
                    { label: 'Projected Yield', val: prediction.predictedYield, sub: 'KG / HA' },
                    { label: 'Risk Index', val: (prediction.riskScore * 100).toFixed(1) + '%', sub: 'STABILITY' },
                    { label: 'Est. Revenue', val: '₹' + prediction.profitEstimation.toLocaleString(), sub: 'INR' }
                ].map((stat, i) => (
                    <div key={i} className="flex flex-col border-l border-ink-black pl-8 py-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-black/40 mb-4">{stat.label}</span>
                        <span className="font-serif text-5xl lg:text-6xl mb-2">{stat.val}</span>
                        <span className="text-xs font-medium text-vibrant-orange font-mono">{stat.sub}</span>
                    </div>
                ))}
            </div>

            {/* Deep Dive Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 border-t border-ink-black/10 pt-24">

                {/* AI Verdict */}
                <div className="lg:col-span-5">
                    <h3 className="font-serif text-3xl mb-8">AI Verdict</h3>
                    <p className="text-xl leading-relaxed text-ink-black/80 font-light mb-12">
                        "{prediction.explanation}"
                    </p>

                    <div className="space-y-6">
                        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-black/40 border-b border-ink-black/10 pb-4">Recommendation Protocol</div>
                        {['Optimize Nitrogen inputs', 'Monitor irrigation schedule', 'Post-harvest soil analysis'].map((rec, i) => (
                            <div key={i} className="flex justify-between items-center group cursor-pointer">
                                <span className="text-sm font-medium group-hover:translate-x-2 transition-transform">{rec}</span>
                                <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-vibrant-orange" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* SHAP Chart (Minimal) */}
                <div className="lg:col-span-7">
                    <div className="flex justify-between items-end mb-12">
                        <h3 className="font-serif text-3xl">Impact Factors</h3>
                        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-black/40">SHAP Analysis</div>
                    </div>

                    <div className="h-[400px] w-full bg-paper-white p-8">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={shapData} layout="vertical" barGap={2} barCategoryGap="20%">
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', fill: '#1a1a1a' }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{ fill: '#f3f4f6' }}
                                    contentStyle={{ borderRadius: '0px', border: '1px solid #1a1a1a', background: '#fff', boxShadow: 'none' }}
                                />
                                <Bar dataKey="impact" barSize={2}>
                                    {shapData.map((entry, index) => (
                                        <Cell key={index} fill={entry.impact > 0 ? '#1a1a1a' : '#ff3300'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-between mt-4 text-[10px] font-mono text-ink-black/40">
                        <span>NEGATIVE IMPACT (RED)</span>
                        <span>POSITIVE IMPACT (BLACK)</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default Dashboard;
