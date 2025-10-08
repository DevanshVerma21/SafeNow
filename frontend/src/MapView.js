import React, {useEffect, useRef} from 'react';
import L from 'leaflet';

export default function MapView({alerts, responders}){
  const mapRef = useRef(null);
  const markersRef = useRef({});

  useEffect(()=>{
    if(!mapRef.current){
      mapRef.current = L.map('map').setView([20,0], 2);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapRef.current);
    }
  },[])

  useEffect(()=>{
    // add/update alert markers
    alerts.forEach(a=>{
      const id = a.id;
      const lat = a.location.lat;
      const lng = a.location.lng;
      const key = `alert_${id}`;
      if(markersRef.current[key]){
        markersRef.current[key].setLatLng([lat,lng]);
      } else {
        const color = a.status === 'open' ? 'red' : (a.status === 'assigned' ? 'orange' : 'green');
  let popupText = `${a.type} - ${a.status}`;
  if(a.eta_seconds){ popupText += `\nETA: ${Math.round(a.eta_seconds)}s`; }
  if(a.nearest_responder_eta){ popupText += `\nNearest ETA: ${Math.round(a.nearest_responder_eta)}s (id:${a.nearest_responder_id})`; }
  const marker = L.circleMarker([lat,lng], {radius:8, color}).addTo(mapRef.current).bindPopup(popupText);
        markersRef.current[key] = marker;
      }
    })
  },[alerts])

  useEffect(()=>{
    // show responders
    responders.forEach(r=>{
      const id = r.id;
      const loc = r.last_location || {};
      if(!loc.lat) return;
      const key = `res_${id}`;
      if(markersRef.current[key]){
        markersRef.current[key].setLatLng([loc.lat, loc.lng]);
      } else {
        const marker = L.marker([loc.lat, loc.lng]).addTo(mapRef.current).bindPopup(`Responder ${id}`);
        markersRef.current[key] = marker;
      }
    })
  },[responders])

  return <div id="map" style={{height: '70vh', width: '100%'}} />
}
