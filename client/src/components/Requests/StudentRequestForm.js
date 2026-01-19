import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import './StudentRequestForm.css';

const StudentRequestForm = () => {
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [form, setForm] = useState({ category: 'general_inquiries', urgency: 'normal', details: '' });
  const [status, setStatus] = useState('');

  const loadCourses = async () => {
    try {
      const res = await axios.get('/api/courses/enrolled');
      setCourses(res.data || []);
      if ((res.data || []).length > 0) {
        setCourseId(res.data[0]._id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const submitReq = async (e) => {
    e.preventDefault();
    setStatus('');
    try {
      await axios.post('/api/requests', { courseId, category: form.category, urgency: form.urgency, details: form.details });
      setStatus('Request submitted');
      setForm({ category: 'general_inquiries', urgency: 'normal', details: '' });
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to submit request');
    }
  };

  return (
    <div className="request-container">
      <motion.div
        className="request-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="request-icon">📬</div>
        <h2>Contact Lecturer</h2>
        <p>Send a categorized request to your course lecturer</p>
      </motion.div>

      {status && <div className="request-status">{status}</div>}

      <motion.form
        onSubmit={submitReq}
        className="request-form"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <label>Course</label>
        <select
          className="request-select"
          value={courseId}
          onChange={e => setCourseId(e.target.value)}
        >
          {courses.map(c => (
            <option key={c._id} value={c._id}>
              {c.code} — {c.title}
            </option>
          ))}
        </select>

        <label>Category</label>
        <select
          className="request-select"
          value={form.category}
          onChange={e => setForm({ ...form, category: e.target.value })}
        >
          <option value="assignment_clarification">Assignment Clarification</option>
          <option value="result_issues">Result Issues</option>
          <option value="project_supervision">Project Supervision</option>
          <option value="general_inquiries">General Inquiries</option>
        </select>

        <label>Urgency</label>
        <select
          className="request-select"
          value={form.urgency}
          onChange={e => setForm({ ...form, urgency: e.target.value })}
        >
          <option value="normal">Normal</option>
          <option value="urgent">Urgent</option>
        </select>

        <label>Details</label>
        <textarea
          className="request-textarea"
          rows={5}
          value={form.details}
          onChange={e => setForm({ ...form, details: e.target.value })}
          required
        />

        <button type="submit" className="request-submit">
          Submit Request
        </button>
      </motion.form>
    </div>
  );
};

export default StudentRequestForm;
