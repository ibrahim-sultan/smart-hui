import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import './MessageComposer.css';

const MessageComposer = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [broadcast, setBroadcast] = useState({ content: '', category: '' });
  const [pm, setPm] = useState({ studentId: '', content: '', category: '' });
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('');

  const loadCourse = async () => {
    if (!courseId) return;
    try {
      const mine = await axios.get('/api/courses/mine');
      const found = (mine.data || []).find(c => c._id === courseId);
      setCourse(found || null);
    } catch (e) {
      console.error(e);
    }
  };

  const loadMessages = async () => {
    if (!courseId) return;
    try {
      const res = await axios.get(`/api/messaging/course/${courseId}`);
      setMessages(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadCourse();
    loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const sendBroadcast = async (e) => {
    e.preventDefault();
    setStatus('');
    try {
      await axios.post('/api/messaging/broadcast', { courseId, content: broadcast.content, category: broadcast.category });
      setStatus('Broadcast sent');
      setBroadcast({ content: '', category: '' });
      loadMessages();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to send broadcast');
    }
  };

  const sendPrivate = async (e) => {
    e.preventDefault();
    setStatus('');
    try {
      await axios.post('/api/messaging/private', { courseId, studentId: pm.studentId, content: pm.content, category: pm.category });
      setStatus('Private message sent');
      setPm({ studentId: '', content: '', category: '' });
      loadMessages();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to send private message');
    }
  };

  return (
    <div className="mc-container">
      <motion.div
        className="mc-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mc-icon">🗣️</div>
        <h2>Course Messaging</h2>
        {course && <div className="mc-course">{course.code} — {course.title}</div>}
      </motion.div>

      {status && <div className="mc-status">{status}</div>}

      <div className="mc-grid">
        <motion.form
          onSubmit={sendBroadcast}
          className="mc-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mc-card-title">Broadcast</div>
          <input className="mc-input" placeholder="Category (optional)" value={broadcast.category} onChange={e => setBroadcast({ ...broadcast, category: e.target.value })} />
          <textarea className="mc-textarea" placeholder="Message content" value={broadcast.content} onChange={e => setBroadcast({ ...broadcast, content: e.target.value })} rows={4} required />
          <button type="submit" className="mc-primary">Send Broadcast</button>
        </motion.form>

        <motion.form
          onSubmit={sendPrivate}
          className="mc-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mc-card-title">Private</div>
          <input className="mc-input" placeholder="Student Matric Number" value={pm.studentId} onChange={e => setPm({ ...pm, studentId: e.target.value })} required />
          <input className="mc-input" placeholder="Category (optional)" value={pm.category} onChange={e => setPm({ ...pm, category: e.target.value })} />
          <textarea className="mc-textarea" placeholder="Message content" value={pm.content} onChange={e => setPm({ ...pm, content: e.target.value })} rows={4} required />
          <button type="submit" className="mc-primary">Send Private</button>
        </motion.form>
      </div>

      <div className="mc-list">
        <div className="mc-list-title">Messages</div>
        {messages.length === 0 && <div className="mc-empty">No messages yet.</div>}
        {messages.map((m, idx) => (
          <motion.div
            key={m._id}
            className="mc-msg-item"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <div className="mc-msg-top">
              <span className={`mc-type ${m.isBroadcast ? 'broadcast' : 'private'}`}>
                {m.isBroadcast ? 'Broadcast' : `Private`}
              </span>
              <span className="mc-category">{m.category || 'General'}</span>
            </div>
            <div className="mc-content">{m.content}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MessageComposer;
