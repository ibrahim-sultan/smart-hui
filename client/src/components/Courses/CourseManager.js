import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import './CourseManager.css';

const CourseManager = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({
    code: '',
    title: '',
    faculty: '',
    department: user?.department || '',
    semester: 'Harmattan',
    session: '',
    startDate: '',
    endDate: ''
  });
  const [enrollInput, setEnrollInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollCourse, setEnrollCourse] = useState(null);
  const [matricNumber, setMatricNumber] = useState('');
  const [enrollError, setEnrollError] = useState('');
  const [enrollSuccess, setEnrollSuccess] = useState('');

  const loadCourses = async () => {
    try {
      const res = await axios.get('/api/courses/mine');
      setCourses(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const faculties = [
    'Computing and IT',
    'Science',
    'Management Sciences',
    'Humanities',
    'Education',
    'Law',
    'Health Sciences'
  ];

  const departmentsByFaculty = {
    'Computing and IT': ['Computer Science', 'Information Systems', 'Software Engineering', 'Cyber Security'],
    'Science': ['Mathematics', 'Physics', 'Chemistry', 'Biology'],
    'Management Sciences': ['Accounting', 'Business Administration', 'Economics', 'Banking and Finance'],
    'Humanities': ['English', 'History', 'Mass Communication', 'Islamic Studies'],
    'Education': ['Educational Management', 'Guidance and Counselling', 'Curriculum Studies'],
    'Law': ['Private Law', 'Public Law', 'Commercial Law'],
    'Health Sciences': ['Nursing', 'Medical Laboratory Science', 'Public Health']
  };

  const currentDepartments = form.faculty ? departmentsByFaculty[form.faculty] || [] : [];

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await axios.post('/api/courses', form);
      setMessage(`Created course ${res.data.code}`);
      setForm({ code: '', title: '', faculty: '', department: user?.department || '', semester: 'Harmattan', session: '', startDate: '', endDate: '' });
      loadCourses();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId) => {
    setLoading(true);
    setMessage('');
    try {
      const matricList = enrollInput.split(/[,\s]+/).filter(Boolean);
      await axios.post(`/api/courses/${courseId}/enroll`, { studentIds: matricList });
      setMessage(`Enrolled ${matricList.length} students`);
      setEnrollInput('');
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to enroll students');
    } finally {
      setLoading(false);
    }
  };

  const openEnrollModal = (course) => {
    setEnrollCourse(course);
    setMatricNumber('');
    setEnrollError('');
    setEnrollSuccess('');
    setShowEnrollModal(true);
  };

  const submitEnrollSingle = async (e) => {
    e.preventDefault();
    setEnrollError('');
    setEnrollSuccess('');
    if (!matricNumber.trim()) {
      setEnrollError('Enter a student matric number');
      return;
    }
    try {
      await axios.post(`/api/courses/${enrollCourse._id}/enroll`, { studentIds: [matricNumber.trim()] });
      setEnrollSuccess(`Enrolled ${matricNumber.trim()} successfully`);
      setMatricNumber('');
    } catch (e) {
      setEnrollError(e.response?.data?.message || 'Failed to enroll student');
    }
  };

  const handleComplete = async (courseId) => {
    setLoading(true);
    setMessage('');
    try {
      const res = await axios.patch(`/api/courses/${courseId}/complete`);
      setMessage(`Marked ${res.data.code} as completed`);
      loadCourses();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to complete course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cm-container">
      <motion.div
        className="cm-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="cm-icon">👨‍🏫</div>
        <h2>Lecturer Course Manager</h2>
        <p>Create, manage, and complete your courses</p>
      </motion.div>

      {message && <div className="cm-status">{message}</div>}

      <motion.form
        onSubmit={handleCreate}
        className="cm-create-form"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="cm-form-title">Create Course</div>
        <input className="cm-input" placeholder="Code e.g., CMP401" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required />
        <input className="cm-input" placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
        <label className="cm-label">Faculty</label>
        <select
          className="cm-select"
          value={form.faculty}
          onChange={e => {
            const nextFaculty = e.target.value;
            const nextDepartments = departmentsByFaculty[nextFaculty] || [];
            setForm({
              ...form,
              faculty: nextFaculty,
              department: nextDepartments.length > 0 ? nextDepartments[0] : ''
            });
          }}
          required
        >
          <option value="">Select Faculty</option>
          {faculties.map(f => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
        <label className="cm-label">Department</label>
        <select
          className="cm-select"
          value={form.department}
          onChange={e => setForm({ ...form, department: e.target.value })}
          required
          disabled={!form.faculty}
        >
          <option value="">{form.faculty ? 'Select Department' : 'Select a faculty first'}</option>
          {currentDepartments.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
          {form.faculty && currentDepartments.length === 0 && (
            <option value="">No departments available</option>
          )}
        </select>
        <select className="cm-select" value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })}>
          <option value="Harmattan">Harmattan</option>
          <option value="Rain">Rain</option>
        </select>
        <input className="cm-input" placeholder="Session e.g., 2025/2026" value={form.session} onChange={e => setForm({ ...form, session: e.target.value })} required />
        <label className="cm-label">Start Date</label>
        <input className="cm-input" type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} required />
        <label className="cm-label">End Date</label>
        <input className="cm-input" type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} required />
        <button type="submit" className="cm-primary" disabled={loading}>Create</button>
      </motion.form>

      <div className="cm-list">
        <div className="cm-list-title">My Courses</div>
        {courses.length === 0 && <div className="cm-empty">No courses yet.</div>}
        {courses.map(c => (
          <motion.div
            key={c._id}
            className="cm-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="cm-card-header">
              <div className="cm-card-title">{c.code} — {c.title}</div>
              <div className={`cm-status-badge ${c.status === 'active' ? 'active' : 'completed'}`}>
                {c.status}
              </div>
            </div>
            <div className="cm-card-meta">
              Session {c.session}, Semester {c.semester}
            </div>
            <div className="cm-card-meta">
              Faculty {c.faculty}, Dept {c.department}
            </div>
            <div className="cm-card-meta">
              Start {new Date(c.startDate).toLocaleDateString()} | End {new Date(c.endDate).toLocaleDateString()}
            </div>
            <div className="cm-actions">
              <textarea
                className="cm-textarea"
                placeholder="Enter matric numbers separated by comma or space"
                value={enrollInput}
                onChange={e => setEnrollInput(e.target.value)}
                rows={3}
              />
              <div className="cm-buttons">
                <button onClick={() => handleEnroll(c._id)} className="cm-secondary" disabled={loading}>Enroll Students</button>
                <button type="button" onClick={() => openEnrollModal(c)} className="cm-secondary">Enroll Student</button>
                <a href={`/staff/messaging/${c._id}`} className="cm-link">
                  <button type="button" className="cm-secondary">Open Messaging</button>
                </a>
                <a href={`/staff/requests/${c._id}`} className="cm-link">
                  <button type="button" className="cm-secondary">Open Request Queue</button>
                </a>
                <button onClick={() => handleComplete(c._id)} className="cm-danger" disabled={loading}>Mark Completed</button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      {showEnrollModal && enrollCourse && (
        <motion.div className="cm-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.div className="cm-modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <div className="cm-modal-header">
              <div className="cm-modal-icon">📝</div>
              <div>
                <div className="cm-modal-title">Enroll Student</div>
                <div className="cm-modal-sub">Course: {enrollCourse.code} — {enrollCourse.title}</div>
              </div>
              <button className="cm-modal-close" onClick={() => setShowEnrollModal(false)}>✕</button>
            </div>
            <form onSubmit={submitEnrollSingle} className="cm-modal-form">
              {enrollError && <div className="cm-modal-error">{enrollError}</div>}
              {enrollSuccess && <div className="cm-modal-success">{enrollSuccess}</div>}
              <label className="cm-label">Student Matric Number</label>
              <input
                className="cm-input"
                placeholder="e.g., HUI/CSC/21/001"
                value={matricNumber}
                onChange={e => setMatricNumber(e.target.value)}
              />
              <div className="cm-modal-actions">
                <button type="button" className="cm-secondary" onClick={() => setShowEnrollModal(false)}>Cancel</button>
                <button type="submit" className="cm-primary">Enroll</button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default CourseManager;
