import { useEffect, useState } from 'react';
import type { PageId } from '../types';

interface HeaderProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
}

const NAV_ITEMS: { id: PageId; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
];

function Header({ activePage, onNavigate }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (page: PageId) => {
    onNavigate(page);
    setMenuOpen(false);
  };

  return (
    <header className={scrolled ? 'scrolled' : ''}>
      <div className="container">
        <nav>
          <button className="logo" onClick={() => handleNavClick('home')}>
            <span className="logo-mark">SJ</span>
            <span className="logo-text">StyleJenich Fashion</span>
          </button>

          <ul className={`nav-links ${menuOpen ? 'active' : ''}`}>
            {NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <button
                  className={`nav-link ${activePage === item.id ? 'active' : ''}`}
                  onClick={() => handleNavClick(item.id)}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>

          <button
            id="menu-toggle"
            className="hamburger"
            aria-expanded={menuOpen}
            aria-controls="primary-nav"
            aria-label="Toggle navigation menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            ☰
          </button>
        </nav>
      </div>
    </header>
  );
}

export default Header;
