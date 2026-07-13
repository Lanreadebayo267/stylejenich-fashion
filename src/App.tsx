import { useState } from 'react';
import type { PageId } from './types';
import Header from './components/Header';
import HomePage from './components/HomePage';
import GalleryPage from './components/GalleryPage';
import AboutPage from './components/AboutPage';
import ContactPage from './components/ContactPage';
import Footer from './components/Footer';

function App() {
  const [activePage, setActivePage] = useState<PageId>('home');

  const navigate = (page: PageId) => {
    setActivePage(page);
    window.scrollTo(0, 0);
  };

  return (
    <>
      <Header activePage={activePage} onNavigate={navigate} />
      <main>
        {activePage === 'home' && <HomePage onNavigate={navigate} />}
        {activePage === 'gallery' && <GalleryPage />}
        {activePage === 'about' && <AboutPage />}
        {activePage === 'contact' && <ContactPage />}
      </main>
      <Footer />
    </>
  );
}

export default App;
