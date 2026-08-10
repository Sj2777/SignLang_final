import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import HeroSection from './sections/HeroSection';
import FeaturesSection from './sections/FeaturesSection';
import AccountTypesSection from './sections/AccountTypesSection';
import StatsSection from './sections/StatsSection';
import styles from './LandingPage.module.css';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <HeroSection onCTA={() => navigate('/auth?tab=signup')} />
        <StatsSection />
        <FeaturesSection />
        <AccountTypesSection onNavigate={() => navigate('/auth?tab=signup')} />
      </main>
      <Footer />
    </div>
  );
}
