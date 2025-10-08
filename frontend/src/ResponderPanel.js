import React, {useState} from 'react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API || 'http://localhost:8000';

export default function ResponderPanel({alerts, onResponderRegistered}){
  const [status, setStatus] = useState('available');
  const [responderId, setResponderId] = useState(null);
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');

  async function register(){
    const payload = {user_id: 'demo_responder', responder_type: 'volunteer', status, location: {lat: parseFloat(lat), lng: parseFloat(lng)}};
    const res = await axios.post(`${API_BASE}/responders/heartbeat`, payload);
    setResponderId(res.data.id);
    if(onResponderRegistered) onResponderRegistered(res.data.id);
  }

  async function accept(alert_id){
    if(!responderId) return alert('Register first');
    await axios.post(`${API_BASE}/responders/${responderId}/accept`, {alert_id});
  }

  async function decline(alert_id){
    if(!responderId) return alert('Register first');
    await axios.post(`${API_BASE}/responders/${responderId}/decline`, {alert_id});
  }

  const assigned = alerts.filter(a=> a.assigned_to && a.assigned_to === responderId);

  return (
    <div style={{border:'1px solid #ccc', padding:10, marginTop:10}}>
      <h4>Responder Panel</h4>
      <div>
        <label>Lat: <input value={lat} onChange={e=>setLat(e.target.value)} /></label>
        <label style={{marginLeft:10}}>Lng: <input value={lng} onChange={e=>setLng(e.target.value)} /></label>
        <label style={{marginLeft:10}}>Status:
          <select value={status} onChange={e=>setStatus(e.target.value)}>
            <option value="available">available</option>
            <option value="busy">busy</option>
            <option value="offline">offline</option>
          </select>
        </label>
        <button onClick={register} style={{marginLeft:10}}>Register Heartbeat</button>
      </div>
      <div style={{marginTop:10}}>
        <strong>Responder ID:</strong> {responderId || 'not registered'}
      </div>
      <div style={{marginTop:10}}>
        <h5>Assigned Alerts</h5>
        {assigned.length===0 && <div>No assigned alerts</div>}
        <ul>
          {assigned.map(a=> (
            <li key={a.id}>{a.type} @ {a.location?.lat},{a.location?.lng} - {a.status}
              <button onClick={()=>accept(a.id)} style={{marginLeft:8}}>Accept</button>
              <button onClick={()=>decline(a.id)} style={{marginLeft:8}}>Decline</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
