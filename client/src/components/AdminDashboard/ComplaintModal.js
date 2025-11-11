import React from 'react';

// Minimal modal used by AdminDashboard; keeps API but simple markup for build
const ComplaintModal = ({ complaint, onClose, onStatusChange, onPriorityChange, categoryIcons }) => {
  if (!complaint) return null;
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
      <div style={{ background:'#fff', padding:20, maxWidth:600, width:'90%', borderRadius:8 }}>
        <h3 style={{ marginTop:0 }}>{complaint.title || complaint.name || 'Complaint'}</h3>
        <p style={{ whiteSpace:'pre-wrap' }}>{complaint.description}</p>
        <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
          <span>Category: {complaint.category}</span>
          <span>Priority: {complaint.priority}</span>
          <span>Status: {complaint.status}</span>
        </div>
        <div style={{ marginTop:12, display:'flex', gap:8 }}>
          <label>
            Priority:
            <select value={complaint.priority} onChange={(e)=>onPriorityChange(complaint.id || complaint._id, e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </label>
          <label>
            Status:
            <select value={complaint.status} onChange={(e)=>onStatusChange(complaint.id || complaint._id, e.target.value)}>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </label>
        </div>
        <div style={{ marginTop:16, textAlign:'right' }}>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default ComplaintModal;
