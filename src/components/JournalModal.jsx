import { useState, useEffect } from 'react';
import { FaTimes, FaTrash, FaFileExport, FaFileCsv, FaFileImage } from 'react-icons/fa';
import { toJpeg } from 'html-to-image';
import './JournalModal.css';

const JournalModal = ({ 
  show, 
  onClose, 
  offlineManager, 
  onLoadSession,
  customBullets = []
}) => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!show) return;

    const loadSessions = async () => {
      try {
        const db = await offlineManager.getDB();
        const tx = db.transaction('sessions', 'readonly');
        const store = tx.objectStore('sessions');
        const index = store.index('date');
        const request = index.getAll();

        request.onsuccess = (e) => {
          setSessions(e.target.result.reverse() || []);
        };
      } catch (error) {
        console.error('Error loading sessions:', error);
      }
    };

    loadSessions();
  }, [show, offlineManager]);

  useEffect(() => {
    if (!selectedSession) return;

    const loadNotes = async () => {
      try {
        const db = await offlineManager.getDB();
        const tx = db.transaction('notes', 'readonly');
        const store = tx.objectStore('notes');
        const index = store.index('sessionId');
        const request = index.getAll(selectedSession.id);

        request.onsuccess = (e) => {
          setNotes(e.target.result || []);
        };
      } catch (error) {
        console.error('Error loading notes:', error);
      }
    };

    loadNotes();
  }, [selectedSession, offlineManager]);

  const handleAddNote = async () => {
    if (!newNote.trim() || !selectedSession) return;

    const note = {
      sessionId: selectedSession.id,
      date: new Date().toISOString(),
      text: newNote.trim()
    };

    try {
      await offlineManager.addNote(note);
      setNotes([...notes, note]);
      setNewNote('');
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Ошибка при добавлении заметки');
    }
  };

  const handleDeleteSession = async (id) => {
    if (!window.confirm('Удалить эту сессию и все связанные заметки?')) return;

    try {
      // Удаляем заметки сессии
      const notesToDelete = notes.filter(n => n.sessionId === id);
      for (const note of notesToDelete) {
        await offlineManager.deleteNote(note.id);
      }

      // Удаляем саму сессию
      await offlineManager.deleteSession(id);
      
      setSessions(sessions.filter(s => s.id !== id));
      if (selectedSession?.id === id) {
        setSelectedSession(null);
        setNotes([]);
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Ошибка при удалении сессии');
    }
  };

  const exportToJPG = async (session) => {
    try {
      // Создаем временный элемент для рендеринга
      const node = document.createElement('div');
      node.style.background = 'white';
      node.style.padding = '20px';
      node.style.color = 'black';
      node.style.fontFamily = 'Arial, sans-serif';
      
      node.innerHTML = `
        <h2 style="margin-top: 0;">Баллистический расчет</h2>
        <div style="margin-bottom: 15px;">
          <div><strong>Дата:</strong> ${new Date(session.date).toLocaleString()}</div>
          <div><strong>Патрон:</strong> ${session.bulletName}</div>
          <div><strong>Скорость:</strong> ${session.velocity} м/с</div>
        </div>
        
        <h3>Погодные условия</h3>
        <div style="margin-bottom: 15px;">
          <div>Температура: ${session.conditions.temperature}°C</div>
          <div>Давление: ${session.conditions.pressure} мм рт.ст.</div>
          <div>Ветер: ${session.conditions.windSpeed} м/с, ${session.conditions.windAngle}°</div>
        </div>
        
        <h3>Результаты</h3>
        <table border="1" cellpadding="5" cellspacing="0" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f0f0f0;">
              <th>Дистанция (м)</th>
              <th>Скорость (м/с)</th>
              <th>Падение (см)</th>
              <th>Поправка (MOA)</th>
            </tr>
          </thead>
          <tbody>
            ${session.results.filter((_, i) => i % 2 === 0).map(r => `
              <tr>
                <td>${r.range}</td>
                <td>${r.velocity.toFixed(1)}</td>
                <td>${r.drop.toFixed(1)}</td>
                <td>${r.correction.moa.toFixed(1)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      document.body.appendChild(node);
      
      const dataUrl = await toJpeg(node, {
        quality: 0.95,
        backgroundColor: 'white'
      });
      
      const link = document.createElement('a');
      link.download = `ballistic_${session.bulletName.replace(/[^\w]/g, '_')}.jpg`;
      link.href = dataUrl;
      link.click();
      
      document.body.removeChild(node);
    } catch (error) {
      console.error('Error exporting to JPG:', error);
      alert('Ошибка при экспорте в JPG');
    }
  };

  const exportToCSV = (session) => {
    const csvRows = [];
    
    // Заголовок
    csvRows.push('Баллистический расчет');
    csvRows.push(`Патрон: ${session.bulletName}`);
    csvRows.push(`Дата: ${new Date(session.date).toLocaleString()}`);
    csvRows.push('');
    
    // Погодные условия
    csvRows.push('Погодные условия');
    csvRows.push(`Температура: ${session.conditions.temperature}°C`);
    csvRows.push(`Давление: ${session.conditions.pressure} мм рт.ст.`);
    csvRows.push(`Ветер: ${session.conditions.windSpeed} м/с, ${session.conditions.windAngle}°`);
    csvRows.push('');
    
    // Данные
    csvRows.push('Дистанция (м),Скорость (м/с),Падение (см),Поправка (MOA),Ветер (MOA)');
    session.results.forEach(r => {
      csvRows.push([
        r.range,
        r.velocity.toFixed(1),
        r.drop.toFixed(1),
        r.correction.moa.toFixed(1),
        r.windage.moa.toFixed(1)
      ].join(','));
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `ballistic_${session.bulletName.replace(/[^\w]/g, '_')}.csv`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="journal-modal">
        <div className="modal-header">
          <h2>Журнал расчетов</h2>
          <button onClick={onClose} className="close-btn">
            <FaTimes />
          </button>
        </div>

        <div className="modal-content">
          <div className="sessions-column">
            <h3>Сохраненные сессии</h3>
            {isLoading && <div className="loading">Загрузка...</div>}
            
            {sessions.length > 0 ? (
              <div className="sessions-list">
                {sessions.map(session => (
                  <div 
                    key={session.id} 
                    className={`session-item ${selectedSession?.id === session.id ? 'active' : ''}`}
                    onClick={() => setSelectedSession(session)}
                  >
                    <div className="session-info">
                      <h4>{new Date(session.date).toLocaleString()}</h4>
                      <p>{session.bulletName}</p>
                      <p>{session.velocity} м/с, {session.zeroRange}м</p>
                    </div>
                    <div className="session-actions">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          exportToJPG(session);
                        }}
                        className="export-btn"
                        title="Экспорт в JPG"
                      >
                        <FaFileImage />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          exportToCSV(session);
                        }}
                        className="export-btn"
                        title="Экспорт в CSV"
                      >
                        <FaFileCsv />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(session.id);
                        }}
                        className="delete-btn"
                        title="Удалить"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>Нет сохраненных сессий</p>
              </div>
            )}
          </div>

          <div className="details-column">
            {selectedSession ? (
              <>
                <div className="session-details">
                  <h3>Детали сессии</h3>
                  <div className="detail-row">
                    <span>Патрон:</span>
                    <span>{selectedSession.bulletName}</span>
                  </div>
                  <div className="detail-row">
                    <span>Скорость:</span>
                    <span>{selectedSession.velocity} м/с</span>
                  </div>
                  <div className="detail-row">
                    <span>Пристрелка:</span>
                    <span>{selectedSession.zeroRange} м</span>
                  </div>
                  <div className="detail-row">
                    <span>Высота прицела:</span>
                    <span>{selectedSession.scopeHeight} мм</span>
                  </div>
                  
                  <h4>Погодные условия</h4>
                  <div className="detail-row">
                    <span>Температура:</span>
                    <span>{selectedSession.conditions.temperature}°C</span>
                  </div>
                  <div className="detail-row">
                    <span>Давление:</span>
                    <span>{selectedSession.conditions.pressure} мм рт.ст.</span>
                  </div>
                  <div className="detail-row">
                    <span>Ветер:</span>
                    <span>{selectedSession.conditions.windSpeed} м/с, {selectedSession.conditions.windAngle}°</span>
                  </div>
                  
                  <button 
                    onClick={() => {
                      onLoadSession(selectedSession);
                      onClose();
                    }}
                    className="load-btn"
                  >
                    Загрузить эту сессию
                  </button>
                </div>

                <div className="notes-section">
                  <h3>Заметки</h3>
                  {notes.length > 0 ? (
                    <div className="notes-list">
                      {notes.map(note => (
                        <div key={note.id} className="note-item">
                          <div className="note-date">
                            {new Date(note.date).toLocaleString()}
                          </div>
                          <div className="note-text">{note.text}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-notes">
                      <p>Нет заметок для этой сессии</p>
                    </div>
                  )}
                  
                  <div className="add-note">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Добавить новую заметку..."
                      rows="3"
                    />
                    <button 
                      onClick={handleAddNote}
                      disabled={!newNote.trim()}
                      className="add-btn"
                    >
                      Добавить заметку
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="select-session-prompt">
                <p>Выберите сессию для просмотра деталей</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JournalModal;