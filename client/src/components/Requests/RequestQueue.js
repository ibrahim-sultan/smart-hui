import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const RequestQueue = () => {
  const { courseId } = useParams();
  const [items, setItems] = useState([]);
  const [statusMsg, setStatusMsg] = useState('');

  const loadQueue = async () => {
    try {
      const res = await axios.get(`/api/requests/queue/${courseId}`);
      setItems(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const updateStatus = async (id, status) => {
    setStatusMsg('');
    try {
      await axios.patch(`/api/requests/${id}/status`, { status });
      setStatusMsg(`Status updated to ${status}`);
      loadQueue();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to update status');
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Request Queue</h2>
      {statusMsg && <div style={{ color: 'green' }}>{statusMsg}</div>}
      {items.length === 0 && <div>No pending requests.</div>}
      {items.map(r => (
        <div key={r._id} style={{ border: '1px solid #ccc', padding: 12, marginBottom: 12 }}>
          <div style={{ fontWeight: 'bold' }}>{r.category} — {r.urgency}</div>
          <div>Student: {r.student?.firstName} {r.student?.lastName} ({r.student?.studentId})</div>
          <div style={{ marginTop: 8 }}>{r.details}</div>
          {r.autoResolved && r.autoResponse && (
            <div style={{ background: '#f7f7f7', padding: 8, marginTop: 8 }}>
              Auto-response: {r.autoResponse}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={() => updateStatus(r._id, 'responded')}>Responded</button>
            <button onClick={() => updateStatus(r._id, 'deferred')}>Defer</button>
            <button onClick={() => updateStatus(r._id, 'approved_visit')}>Approve Visit</button>
            <button onClick={() => updateStatus(r._id, 'closed')}>Close</button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RequestQueue;
