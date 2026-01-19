import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import './StudentInbox.css';

const StudentInbox = () => {
  const [courses, setCourses] = useState([]);
  const [selected, setSelected] = useState('');
  const [messages, setMessages] = useState([]);

  const loadCourses = async () => {
    try {
      const res = await axios.get('/api/courses/enrolled');
      setCourses(res.data || []);
      if ((res.data || []).length > 0) {
        setSelected(res.data[0]._id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadMessages = async (courseId) => {
    if (!courseId) return;
    try {
      const res = await axios.get(`/api/messaging/course/${courseId}`);
      setMessages(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    loadMessages(selected);
  }, [selected]);

  return (
    <div className="inbox-container">
      <motion.div
        className="inbox-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="inbox-icon">✉️</div>
        <h2>Course Inbox</h2>
        <p>View broadcasts and private messages from your lecturers</p>
      </motion.div>

      <motion.div
        className="inbox-select-row"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <select
          className="inbox-select"
          value={selected}
          onChange={e => setSelected(e.target.value)}
        >
          {courses.map(c => (
            <option key={c._id} value={c._id}>
              {c.code} — {c.title}
            </option>
          ))}
        </select>
      </motion.div>

      <motion.div
        className="messages-list"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {messages.length === 0 && (
          <div className="empty-state">No messages for this course.</div>
        )}
        {messages.map((m, idx) => (
          <motion.div
            key={m._id}
            className="message-item"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <div className="message-top">
              <span className={`message-type ${m.isBroadcast ? 'broadcast' : 'private'}`}>
                {m.isBroadcast ? 'Broadcast' : 'Private'}
              </span>
              <span className="message-category">
                {m.category || 'General'}
              </span>
            </div>
            <div className="message-content">
              {m.content}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default StudentInbox;
