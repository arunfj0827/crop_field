import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const Welcome = () => {
    const navigate = useNavigate();

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-screen w-full bg-paper-white relative flex flex-col justify-between p-8 md:p-12 overflow-hidden"
        >
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-vibrant-orange/5 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-warm-grey/20 rounded-full blur-[100px]"></div>
            </div>

            {/* Header */}
            <header className="flex justify-between items-center z-10">
                <div className="text-xs font-bold tracking-[0.2em] uppercase text-ink-black">AgriTech <span className="text-vibrant-orange">●</span></div>
                <div className="text-xs font-medium text-ink-black/40">EDITION 2024</div>
            </header>

            {/* Center Content */}
            <div className="flex-grow flex flex-col justify-center items-center z-10 text-center relative">
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                >
                    <h1 className="font-serif text-7xl md:text-9xl text-ink-black leading-[0.8] tracking-tighter mb-6">
                        Cultivating <br />
                        <span className="italic text-soft-charcoal">Future.</span>
                    </h1>
                </motion.div>

                <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 1 }}
                    className="font-sans text-sm md:text-base text-ink-black/60 max-w-sm leading-relaxed mt-8"
                >
                    Precision agriculture powered by advanced machine learning.
                    Predict yields, optimize resources, and ensure food security.
                </motion.p>
            </div>

            {/* Footer / CTA */}
            <div className="flex justify-center z-10 mb-12">
                <motion.button
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.05 }}
                    transition={{ delay: 0.8, duration: 0.8 }}
                    onClick={() => navigate('/analyze')}
                    className="group flex items-center space-x-4 bg-ink-black text-white px-10 py-5 rounded-full hover:bg-vibrant-orange transition-colors duration-500"
                >
                    <span className="text-sm font-medium tracking-[0.2em] uppercase">Enter Experience</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </motion.button>
            </div>
        </motion.div>
    );
};

export default Welcome;
