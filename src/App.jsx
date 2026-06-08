import { useMemo, useState } from 'react';
import { EventPriority, EventStatus, EventType } from './models/enums.js';
import { createDefaultEventService } from './services/serviceFactory.js';
import { RecordingNotificationObserver } from './services/notificationCenter.js';

const defaultForm = {
  title: 'Архітектурна консультація',
  description: 'Планування етапів проєкту та перевірка ризиків.',
  organizerId: 'u-1',
  participantIds: ['u-2'],
  startAt: '2026-06-05T10:00',
  endAt: '2026-06-05T11:00',
  location: 'Room A',
  type: EventType.MEETING,
  priority: EventPriority.NORMAL,
  reminderMinutes: '60,30',
  capacity: 8
};

export function App() {
  const runtime = useMemo(() => {
    const created = createDefaultEventService();
    const observer = new RecordingNotificationObserver();
    created.notificationCenter.subscribe(observer);
    return { ...created, observer };
  }, []);
  const [form, setForm] = useState(defaultForm);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [message, setMessage] = useState('Готово до планування');

  const participants = runtime.participantRepository.findAll();
  const selectedEvent = events.find((event) => event.id === selectedEventId);

  function refresh() {
    setEvents(runtime.service.listEvents());
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function buildCommand() {
    return {
      ...form,
      participantIds: form.participantIds,
      startAt: new Date(form.startAt),
      endAt: new Date(form.endAt),
      capacity: Number(form.capacity),
      reminderMinutes: form.reminderMinutes.split(',').map((value) => Number(value.trim())).filter(Boolean)
    };
  }

  function handleCreate(event) {
    event.preventDefault();
    try {
      const created = runtime.service.createEvent(buildCommand());
      setSelectedEventId(created.id);
      setMessage(`Створено подію ${created.id}`);
      refresh();
    } catch (error) {
      setMessage(error.message);
    }
  }

  function handleReschedule() {
    if (!selectedEvent) return;
    try {
      const nextStart = new Date(selectedEvent.startAt.getTime() + 30 * 60000);
      const nextEnd = new Date(selectedEvent.endAt.getTime() + 30 * 60000);
      runtime.service.updateEvent(selectedEvent.id, { startAt: nextStart, endAt: nextEnd });
      setMessage('Подію перенесено на 30 хвилин');
      refresh();
    } catch (error) {
      setMessage(error.message);
    }
  }

  function handleCancel() {
    if (!selectedEvent) return;
    try {
      runtime.service.cancelEvent(selectedEvent.id, 'Скасовано організатором', new Date('2026-06-01T10:00:00.000Z'));
      setMessage('Подію скасовано');
      refresh();
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <main className="app-shell">
      <section className="workspace">
        <form className="panel planner-form" onSubmit={handleCreate}>
          <div>
            <p className="eyebrow">Event Planner</p>
            <h1>Планування подій</h1>
          </div>

          <label>
            <span>Назва</span>
            <input value={form.title} onChange={(event) => updateForm('title', event.target.value)} />
          </label>

          <label>
            <span>Опис</span>
            <textarea value={form.description} onChange={(event) => updateForm('description', event.target.value)} />
          </label>

          <div className="grid two">
            <label>
              <span>Початок</span>
              <input type="datetime-local" value={form.startAt} onChange={(event) => updateForm('startAt', event.target.value)} />
            </label>
            <label>
              <span>Завершення</span>
              <input type="datetime-local" value={form.endAt} onChange={(event) => updateForm('endAt', event.target.value)} />
            </label>
          </div>

          <div className="grid three">
            <label>
              <span>Тип</span>
              <select value={form.type} onChange={(event) => updateForm('type', event.target.value)}>
                {Object.values(EventType).map((type) => <option key={type}>{type}</option>)}
              </select>
            </label>
            <label>
              <span>Пріоритет</span>
              <select value={form.priority} onChange={(event) => updateForm('priority', event.target.value)}>
                {Object.values(EventPriority).map((priority) => <option key={priority}>{priority}</option>)}
              </select>
            </label>
            <label>
              <span>Місткість</span>
              <input type="number" min="1" value={form.capacity} onChange={(event) => updateForm('capacity', event.target.value)} />
            </label>
          </div>

          <label>
            <span>Локація</span>
            <input value={form.location} onChange={(event) => updateForm('location', event.target.value)} />
          </label>

          <fieldset>
            <legend>Учасники</legend>
            {participants.filter((participant) => participant.id !== form.organizerId).map((participant) => (
              <label className="check-row" key={participant.id}>
                <input
                  type="checkbox"
                  checked={form.participantIds.includes(participant.id)}
                  onChange={(event) => {
                    const next = event.target.checked
                      ? [...form.participantIds, participant.id]
                      : form.participantIds.filter((id) => id !== participant.id);
                    updateForm('participantIds', next);
                  }}
                />
                {participant.name}
              </label>
            ))}
          </fieldset>

          <label>
            <span>Нагадування, хвилини</span>
            <input value={form.reminderMinutes} onChange={(event) => updateForm('reminderMinutes', event.target.value)} />
          </label>

          <button type="submit">Створити подію</button>
          <p className="status-line">{message}</p>
        </form>

        <section className="panel event-list">
          <div className="toolbar">
            <h2>Календар</h2>
            <div className="actions">
              <button type="button" onClick={handleReschedule} disabled={!selectedEvent}>Перенести</button>
              <button type="button" onClick={handleCancel} disabled={!selectedEvent || selectedEvent.status === EventStatus.CANCELLED}>Скасувати</button>
            </div>
          </div>

          <div className="events">
            {events.map((event) => (
              <button
                type="button"
                className={`event-row ${event.id === selectedEventId ? 'selected' : ''}`}
                key={event.id}
                onClick={() => setSelectedEventId(event.id)}
              >
                <span>
                  <strong>{event.title}</strong>
                  <small>{event.location} · {event.type} · {event.priority}</small>
                </span>
                <span className={`badge ${event.status}`}>{event.status}</span>
              </button>
            ))}
            {events.length === 0 && <p className="empty">Подій ще немає</p>}
          </div>

          {selectedEvent && (
            <aside className="details">
              <h3>{selectedEvent.title}</h3>
              <p>{selectedEvent.description}</p>
              <dl>
                <div><dt>Початок</dt><dd>{selectedEvent.startAt.toLocaleString('uk-UA')}</dd></div>
                <div><dt>Кінець</dt><dd>{selectedEvent.endAt.toLocaleString('uk-UA')}</dd></div>
                <div><dt>Учасників</dt><dd>{selectedEvent.participantIds.length}</dd></div>
                <div><dt>Версія</dt><dd>{selectedEvent.version}</dd></div>
              </dl>
            </aside>
          )}

          <div className="notifications">
            <h3>In-app сповіщення</h3>
            {runtime.observer.messages.slice(-6).map((notification, index) => (
              <p key={`${notification.eventId}-${notification.subject}-${index}`}>
                <strong>{notification.subject}</strong> для {notification.recipientId}
              </p>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
