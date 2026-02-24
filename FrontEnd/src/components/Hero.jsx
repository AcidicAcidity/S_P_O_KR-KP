import { motion } from "framer-motion";
import banner from "../assets/schastliv_kogda_ti_net.jpg";

function Hero() {
  return (
    <motion.section
      className="hero"
      initial={{ opacity: 0, scale: 1.05 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1 }}
    >
      <img src={banner} alt="Баннер" className="hero-banner" />

      <div className="hero-dark-overlay" />

      <motion.div
        className="hero-overlay"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h1 className="hero-title">Счастлив, когда ты нет</h1>
        <p className="hero-subtitle">Драма • 2024</p>
        <button className="buy-btn">Купить билет</button>
      </motion.div>
    </motion.section>
  );
}

export default Hero;