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
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollCourse, setEnrollCourse] = useState(null);
  const [matricText, setMatricText] = useState('');
  const [enrollError, setEnrollError] = useState('');
  const [enrollSuccess, setEnrollSuccess] = useState('');
  const [enrolledByCourse, setEnrolledByCourse] = useState({});
  const [expandedCourseIds, setExpandedCourseIds] = useState({});
  const [enrollSearchQuery, setEnrollSearchQuery] = useState('');
  const [enrollSuggestions, setEnrollSuggestions] = useState([]);
  const [enrollSearchLoading, setEnrollSearchLoading] = useState(false);

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

  const openEnrollModal = (course) => {
    setEnrollCourse(course);
    setMatricText('');
    setEnrollError('');
    setEnrollSuccess('');
    setShowEnrollModal(true);
    setEnrollSearchQuery('');
    setEnrollSuggestions([]);
  };

  const submitEnrollSingle = async (e) => {
    e.preventDefault();
    setEnrollError('');
    setEnrollSuccess('');
    if (!matricText.trim()) {
      setEnrollError('Enter one or more matric numbers');
      return;
    }
    try {
      const matricList = matricText.split(/[,\s]+/).filter(Boolean);
      await axios.post(`/api/courses/${enrollCourse._id}/enroll`, { studentIds: matricList });
      setEnrollSuccess(`Enrolled ${matricList.length} student(s) successfully`);
      setMatricText('');
    } catch (e) {
      setEnrollError(e.response?.data?.message || 'Failed to enroll student');
    }
  };

  const toggleEnrolled = async (course) => {
    const isExpanded = !!expandedCourseIds[course._id];
    const nextExpanded = { ...expandedCourseIds, [course._id]: !isExpanded };
    setExpandedCourseIds(nextExpanded);
    if (!isExpanded && !enrolledByCourse[course._id]) {
      try {
        const res = await axios.get(`/api/courses/${course._id}/enrollments`);
        setEnrolledByCourse({ ...enrolledByCourse, [course._id]: res.data });
      } catch (e) {
        console.error(e);
      }
    }
  };

  const removeEnrollment = async (courseId, studentId) => {
    try {
      await axios.delete(`/api/courses/${courseId}/enroll/${studentId}`);
      const current = enrolledByCourse[courseId] || [];
      const next = current.filter(e => e.studentId !== studentId);
      setEnrolledByCourse({ ...enrolledByCourse, [courseId]: next });
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to remove enrollment');
    }
  };

  const handleSearchInput = (e) => {
    const q = e.target.value;
    setEnrollSearchQuery(q);
  };

  useEffect(() => {
    let active = true;
    const fn = async () => {
      const q = enrollSearchQuery.trim();
      if (!q || q.length < 2) {
        setEnrollSuggestions([]);
        return;
      }
      setEnrollSearchLoading(true);
      try {
        const res = await axios.get('/api/users/search', { params: { q } });
        if (active) setEnrollSuggestions(res.data || []);
      } catch (e) {
        if (active) setEnrollSuggestions([]);
      } finally {
        if (active) setEnrollSearchLoading(false);
      }
    };
    const t = setTimeout(fn, 300);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [enrollSearchQuery]);

  const addSuggestionToMatric = (student) => {
    const id = student.studentId || '';
    if (!id) return;
    const parts = matricText.split(/[,\s]+/).filter(Boolean);
    if (parts.includes(id)) return;
    const next = (matricText ? matricText + ' ' : '') + id;
    setMatricText(next);
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
              <div className="cm-buttons">
                <button type="button" onClick={() => openEnrollModal(c)} className="cm-secondary">Enroll Students</button>
                <a href={`/staff/messaging/${c._id}`} className="cm-link">
                  <button type="button" className="cm-secondary">Open Messaging</button>
                </a>
                <a href={`/staff/requests/${c._id}`} className="cm-link">
                  <button type="button" className="cm-secondary">Open Request Queue</button>
                </a>
                <button onClick={() => handleComplete(c._id)} className="cm-danger" disabled={loading}>Mark Completed</button>
              </div>
              <div className="cm-enrolled">
                <button type="button" className="cm-secondary" onClick={() => toggleEnrolled(c)}>
                  {expandedCourseIds[c._id] ? 'Hide Enrolled' : 'View Enrolled'}
                </button>
                {expandedCourseIds[c._id] && (
                  <div className="cm-enrolled-list">
                    {(enrolledByCourse[c._id] || []).length === 0 && (
                      <div className="cm-empty">No enrolled students.</div>
                    )}
                    {(enrolledByCourse[c._id] || []).map(s => (
                      <div key={s.id} className="cm-enrolled-item">
                        <div className="cm-enrolled-info">
                          <span className="cm-tag">{s.studentId}</span>
                          <span className="cm-enrolled-name">{s.name}</span>
                          <span className="cm-enrolled-email">{s.email}</span>
                        </div>
                        <button type="button" className="cm-danger" onClick={() => removeEnrollment(c._id, s.studentId)}>Remove</button>
                      </div>
                    ))}
                  </div>
                )}
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
              <label className="cm-label">Search Students</label>
              <input
                className="cm-input"
                placeholder="Search by matric, email, name"
                value={enrollSearchQuery}
                onChange={handleSearchInput}
              />
              {enrollSearchLoading && <div className="cm-modal-sub">Searching...</div>}
              {!enrollSearchLoading && enrollSuggestions.length > 0 && (
                <div className="cm-suggestions">
                  {enrollSuggestions.map(s => (
                    <button
                      type="button"
                      key={s._id}
                      className="cm-suggestion"
                      onClick={() => addSuggestionToMatric(s)}
                    >
                      <span className="cm-tag">{s.studentId}</span>
                      <span className="cm-suggestion-name">{s.firstName} {s.lastName}</span>
                      <span className="cm-suggestion-email">{s.email}</span>
                    </button>
                  ))}
                </div>
              )}
              <label className="cm-label">Matric Numbers</label>
              <textarea
                className="cm-textarea"
                placeholder="Enter one or more matric numbers (comma or space separated)"
                value={matricText}
                onChange={e => setMatricText(e.target.value)}
                rows={3}
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
