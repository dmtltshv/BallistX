import { useState, useEffect } from 'react';
import { FaTimes, FaPlus, FaTrash, FaCheck } from 'react-icons/fa';

const BulletLibraryModal = ({ show, onClose, bullets, onSelect, offlineManager }) => {
  const [customBullets, setCustomBullets] = useState([]);
  const [activeTab, setActiveTab] = useState('library');
  const [newBullet, setNewBullet] = useState({
    caliber: '',
    name: '',
    weight: '',
    bc: ''
  });

  useEffect(() => {
    if (!show) return;

    const loadCustomBullets = async () => {
      try {
        const db = await offlineManager.getDB();
        const tx = db.transaction('bullets', 'readonly');
        const store = tx.objectStore('bullets');
        const request = store.getAll();

        request.onsuccess = (e) => {
          setCustomBullets(e.target.result || []);
        };
      } catch (error) {
        console.error('Error loading bullets:', error);
      }
    };

    loadCustomBullets();
  }, [show, offlineManager]);

  const handleBulletSelect = (bullet) => {
    onSelect(bullet);
    onClose();
  };

  const handleAddBullet = async () => {
    if (!newBullet.caliber || !newBullet.name || !newBullet.weight || !newBullet.bc) {
      alert('Заполните все поля');
      return;
    }
  
    const bullet = {
      id: `custom_${Date.now()}`,
      caliber: newBullet.caliber,
      name: newBullet.name,
      weight: parseFloat(newBullet.weight),
      bc: parseFloat(newBullet.bc),
      diameter: parseFloat(newBullet.caliber),
      mass: parseFloat(newBullet.weight) / 1000,
      custom: true
    };
  
    try {
      await offlineManager.addBullet(bullet);
      setCustomBullets(prev => [...prev, bullet]);
      if (onAddCustomBullet) {
        onAddCustomBullet(bullet); // <<< добавляем в глобальное состояние
      }
      setNewBullet({ caliber: '', name: '', weight: '', bc: '' });
      setActiveTab('custom');
    } catch (error) {
      console.error('Error saving bullet:', error);
      alert('Ошибка сохранения пули');
    }
  };

  const handleDeleteBullet = async (id) => {
    if (!window.confirm('Удалить этот патрон из библиотеки?')) return;

    try {
      await offlineManager.deleteBullet(id);
      setCustomBullets(customBullets.filter(b => b.id !== id));
    } catch (error) {
      console.error('Error deleting bullet:', error);
      alert('Ошибка удаления пули');
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="bullet-library-modal card-glass">
        <div className="modal-header">
          <h2 className="section-title" data-icon="🧱">Библиотека патронов</h2>
          <button onClick={onClose} className="btn-glow">
            <FaTimes />
          </button>
        </div>

        <div className="modal-tabs">
          <button className={`tab-btn ${activeTab === 'library' ? 'active' : ''}`} onClick={() => setActiveTab('library')}>
            Стандартные
          </button>
          <button className={`tab-btn ${activeTab === 'custom' ? 'active' : ''}`} onClick={() => setActiveTab('custom')}>
            Мои патроны
          </button>
          <button className={`tab-btn ${activeTab === 'add' ? 'active' : ''}`} onClick={() => setActiveTab('add')}>
            Добавить
          </button>
        </div>

        <div className="modal-content">
          {activeTab === 'library' && (
            <div className="bullet-list">
              {bullets.map(bullet => (
                <div key={bullet.id} className="bullet-item card-glass">
                  <div className="bullet-info">
                    <h3>{bullet.caliber} {bullet.name}</h3>
                    <div className="bullet-details">
                      <span>Вес: {bullet.weight}г</span>
                      <span>BC: {bullet.bc}</span>
                    </div>
                  </div>
                  <button onClick={() => handleBulletSelect(bullet)} className="btn-glow select-btn">
                    <FaCheck /> Выбрать
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'custom' && (
            <div className="bullet-list">
              {customBullets.length > 0 ? (
                customBullets.map(bullet => (
                  <div key={bullet.id} className="bullet-item card-glass">
                    <div className="bullet-info">
                      <h3>{bullet.caliber} {bullet.name}</h3>
                      <div className="bullet-details">
                        <span>Вес: {bullet.weight}г</span>
                        <span>BC: {bullet.bc}</span>
                      </div>
                    </div>
                    <div className="bullet-actions">
                      <button onClick={() => { onSelect(bullet); onClose(); }} className="btn-glow select-btn">
                        <FaCheck /> Выбрать
                      </button>
                      <button onClick={() => handleDeleteBullet(bullet.id)} className="btn-glow delete-btn">
                        <FaTrash /> Удалить
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>Нет пользовательских патронов</p>
                  <button onClick={() => setActiveTab('add')} className="btn-glow add-first-btn">
                    <FaPlus /> Добавить первый патрон
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'add' && (
            <div className="add-bullet-form">
              <div className="form-group">
                <label>Калибр (мм):</label>
                <input
                  type="number"
                  step="0.1"
                  value={newBullet.caliber}
                  onChange={(e) => setNewBullet({ ...newBullet, caliber: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Название:</label>
                <input
                  type="text"
                  value={newBullet.name}
                  onChange={(e) => setNewBullet({ ...newBullet, name: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Вес (г):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newBullet.weight}
                    onChange={(e) => setNewBullet({ ...newBullet, weight: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Балл. коэффициент:</label>
                  <input
                    type="number"
                    step="0.001"
                    value={newBullet.bc}
                    onChange={(e) => setNewBullet({ ...newBullet, bc: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-actions">
                <button onClick={handleAddBullet} className="btn-glow save-btn">
                  <FaPlus /> Сохранить патрон
                </button>
                <button onClick={() => setActiveTab('custom')} className="btn-glow cancel-btn">
                  Отмена
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulletLibraryModal;