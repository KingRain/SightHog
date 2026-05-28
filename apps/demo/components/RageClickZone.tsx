"use client";

export default function RageClickZone() {
  return (
    <div className="card rage-zone">
      <p className="muted" style={{ marginTop: 0 }}>
        Frustration testing
      </p>
      <p>Click this button five or more times within two seconds.</p>
      <button type="button" className="btn btn-danger" id="rage-test-btn">
        Broken checkout button
      </button>
    </div>
  );
}
