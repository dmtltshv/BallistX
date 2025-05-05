import { useEffect } from 'react';
import { FaSun, FaMoon } from 'react-icons/fa';
import './ThemeToggle.css';

const ThemeToggle = ({ theme, toggleTheme }) => {
  useEffect(() => {
    const savedTheme = localStorage.getItem('ballistic-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  return (
    <button className="theme-toggle" onClick={toggleTheme}>
      {theme === 'light' ? (
        <FaMoon size={18} />
      ) : (
        <FaSun size={18} />
      )}
      <span className="theme-text">
        {theme === 'light' ? 'Темная тема' : 'Светлая тема'}
      </span>
    </button>
  );
};

export default ThemeToggle;