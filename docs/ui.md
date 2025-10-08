# UI/UX Wireframes and Notes

Major screens

1. Landing / Immediate Login
- Fullscreen simple entry with phone/email input and OTP flow. No role selection visible.

2. User Dashboard
- Prominent red SOS button (fixed at bottom center).
- Map view showing user's location and nearby open alerts/responders.
- Feed list of recent alerts with expand to show details and option to 'Share Route'.

3. SOS flow
- When SOS clicked: request high-accuracy geolocation; show modal to choose type (medical/disaster/safety), attach photos/voice, optionally re-verify via OTP, then send.
- After sending: show status card with assigned responder and ETA.

4. Responder Dashboard
- Map with tasks pinned; quick accept/decline; arrival/complete buttons.

5. Admin Dashboard
- Table of open alerts, map heatmap overlay, assignment panel, analytics panels (response times, false alert rate).

Design notes
- Use clear color coding: red for SOS, amber for assigned, green for resolved.
- Keep controls large and accessible for emergency use.
