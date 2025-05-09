import { useEffect } from 'react';
import { FaSun, FaMoon } from 'react-icons/fa';

const ThemeToggle = ({ theme, toggleTheme }) => {
  useEffect(() => {
    const savedTheme = localStorage.getItem('ballistic-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  return (
    <button className="btn-glow theme-toggle" onClick={toggleTheme}>
      {theme === 'light' ? (
        <><FaMoon /> Темная тема</>
      ) : (
        <><FaSun /> Светлая тема</>
      )}
    </button>
  );
};

export default ThemeToggle;