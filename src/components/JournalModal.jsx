import { useState, useEffect } from 'react';
import { FaTimes, FaTrash, FaFileExport, FaFileCsv, FaFileImage } from 'react-icons/fa';
import { toJpeg } from 'html-to-image';

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
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose(); // вызываем функцию закрытия окна
      }
    };
  
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
      const notesToDelete = notes.filter(n => n.sessionId === id);
      for (const note of notesToDelete) {
        await offlineManager.deleteNote(note.id);
      }
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

  const exportToCSV = (session) => {
    const csvRows = [
      'Дистанция (м),Скорость (м/с),Падение (см),Поправка (MOA),Ветер (MOA)',
      ...session.results.map(r =>
        [r.range, r.velocity.toFixed(1), r.drop.toFixed(1), r.correction.moa.toFixed(1), r.windage.moa.toFixed(1)].join(',')
      )
    ];

    const blob = new Blob(["﻿" + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ballistics.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="journal-modal card-glass">
        <div className="modal-header">
          <h2 className="section-title" data-icon="🕒">Журнал расчетов</h2>
          <button onClick={onClose} className="btn-glow close-button">
            <FaTimes />
          </button>
        </div>

        <div className="modal-content">
          <div className="sessions-column">
            {isLoading && <div className="loading">Загрузка...</div>}
            {sessions.length > 0 ? (
              sessions.map(session => (
                <div 
                  key={session.id} 
                  className={`session-item card-glass ${selectedSession?.id === session.id ? 'active' : ''}`}
                  onClick={() => setSelectedSession(session)}
                >
                  <h4>{new Date(session.date).toLocaleString()}</h4>
                  <p>{session.bulletName}</p>
                  <p>{session.velocity} м/с</p>
                  <div className="session-actions">
                    <button className="btn-glow export-btn" onClick={(e) => { e.stopPropagation(); exportToCSV(session); }}>
                      <FaFileCsv />
                    </button>
                    <button className="btn-glow delete-btn" onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.id); }}>
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">Нет сохраненных сессий</div>
            )}
          </div>

          <div className="details-column">
            {selectedSession && (
              <div className="session-details card-glass">
                <h3 className="section-title" data-icon="📌">Детали сессии</h3>
                <p><strong>Пуля:</strong> {selectedSession.bulletName}</p>
                <p><strong>Скорость:</strong> {selectedSession.velocity} м/с</p>
                <p><strong>Пристрелка:</strong> {selectedSession.zeroRange} м</p>
                <p><strong>Высота прицела:</strong> {selectedSession.scopeHeight} мм</p>
                <button className="btn-glow load-btn" onClick={() => { onLoadSession(selectedSession); onClose(); }}>
                  Загрузить
                </button>
              </div>
            )}

            {selectedSession && (
              <div className="notes-section">
                <h3 className="section-title" data-icon="📝">Заметки</h3>
                {notes.map(note => (
                  <div key={note.id} className="note-item card-glass">
                    <div className="note-date">🗒️ {new Date(note.date).toLocaleString()}</div>
                    <div className="note-text">{note.text}</div>
                  </div>
                ))}
                <div className="add-note">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows="3"
                    placeholder="Добавить новую заметку..."
                  />
                  <button className="btn-glow add-btn" onClick={handleAddNote} disabled={!newNote.trim()}>
                    Добавить заметку
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JournalModal;