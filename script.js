* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
}

body {
  background-color: #f5f7fa;
  color: #333;
  padding-bottom: 40px;
}

header {
  background-color: #4CAF50;
  color: white;
  text-align: center;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

main {
  max-width: 600px;
  margin: 0 auto;
  padding: 15px;
}

#map-container {
  width: 100%;
  height: 320px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  margin-bottom: 20px;
}

#map {
  width: 100%;
  height: 100%;
}

.card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  margin-bottom: 20px;
}

.card h2 {
  font-size: 1.2rem;
  margin-bottom: 15px;
  color: #2e7d32;
}

.button-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.sub-group {
  margin-top: 8px;
}

.button-group button {
  flex: 1;
  min-width: 90px;
  padding: 10px;
  border: 1px solid #4CAF50;
  background-color: #f1f8e9;
  color: #2e7d32;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.button-group button:hover {
  background-color: #4CAF50;
  color: white;
}

.target-selection {
  margin-bottom: 15px;
}

.target-badge {
  display: inline-block;
  margin-top: 5px;
  padding: 6px 12px;
  background-color: #e8f5e9;
  color: #2e7d32;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: bold;
}

.divider {
  border: none;
  border-top: 1px dashed #ddd;
  margin: 15px 0;
}

.info-text {
  font-size: 0.9rem;
  color: #666;
  background: #f9f9f9;
  padding: 10px;
  border-radius: 6px;
}

.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  font-weight: bold;
  margin-bottom: 5px;
  font-size: 0.9rem;
}

.form-group input, .form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 0.95rem;
}

.btn-submit {
  width: 100%;
  padding: 12px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
}

.btn-submit:hover {
  background-color: #45a049;
}

.log-list {
  list-style: none;
}

.log-item {
  border-bottom: 1px solid #eee;
  padding: 12px 0;
}

.log-item:last-child {
  border-bottom: none;
}

.log-title {
  font-weight: bold;
  color: #333;
}

.log-details {
  font-size: 0.85rem;
  color: #888;
  margin-top: 4px;
}

.log-memo {
  font-size: 0.9rem;
  color: #555;
  margin-top: 6px;
}
