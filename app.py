import os
import time
from datetime import datetime

import cv2
import numpy as np
import torch
from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO

# -------------------- Config --------------------
MODEL_NAME = os.environ.get("MODEL_NAME", "yolov8n.pt")       # fast & small
CONF_THRESHOLD = float(os.environ.get("CONF_THRESHOLD", 0.25))
PORT = int(os.environ.get("PORT", 5000))

# -------------------- Model load --------------------
device = "cuda" if torch.cuda.is_available() else "cpu"
model = YOLO(MODEL_NAME)
try:
    model.to(device)
except Exception:
    pass
print(f"[BOOT] Model loaded: {MODEL_NAME} on {device}")

# -------------------- Glare detection --------------------
def detect_glare_yolov8_enhanced(image_bgr: np.ndarray):
    start_time = time.time()
    h, w = image_bgr.shape[:2]
    total_pixels = max(1, h * w)

    # YOLO object cues
    image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    predict_device = 0 if device == "cuda" else None
    yolo_results = model.predict(
        source=image_rgb,
        imgsz=640,
        conf=CONF_THRESHOLD,
        verbose=False,
        device=predict_device
    )

    yolo_glare_score, bright_objects = 0.0, 0
    # Heuristic: treat some COCO classes as glare proxies (2=car, 9=traffic light, 11=stop sign)
    if len(yolo_results) > 0 and getattr(yolo_results[0], "boxes", None) is not None:
        for box in yolo_results[0].boxes:
            conf = float(box.conf[0])
            class_id = int(box.cls[0])
            if class_id in [2, 9, 11] and conf > 0.5:
                bright_objects += 1
                yolo_glare_score += conf * 0.1

    # HSV intensity
    hsv = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2HSV)
    bright_mask = cv2.inRange(hsv, (0, 0, 200), (180, 100, 255))
    brightness_ratio = cv2.countNonZero(bright_mask) / total_pixels

    extreme_bright_mask = cv2.inRange(hsv, (0, 0, 240), (180, 50, 255))
    extreme_brightness_ratio = cv2.countNonZero(extreme_bright_mask) / total_pixels

    # Gradient
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    grad_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
    grad_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
    gradient_magnitude = np.sqrt(grad_x ** 2 + grad_y ** 2)
    gradient_ratio = float((gradient_magnitude > 120).sum()) / total_pixels

    # Center region
    cy, cx = h // 2, w // 2
    cs = max(1, min(h, w) // 3)
    y1, y2 = max(0, cy - cs // 2), min(h, cy + cs // 2)
    x1, x2 = max(0, cx - cs // 2), min(w, cx + cs // 2)
    center_region = bright_mask[y1:y2, x1:x2]
    center_bright_ratio = (cv2.countNonZero(center_region) / center_region.size) if center_region.size else 0.0

    # Scores
    intensity_score = min(brightness_ratio * 8.0, 1.0)
    hsv_score = min(extreme_brightness_ratio * 20.0, 1.0)
    gradient_score = min(gradient_ratio * 4.0, 1.0)
    center_score = min(center_bright_ratio * 6.0, 1.0)
    yolo_score = min(yolo_glare_score, 1.0)

    composite = (
        0.2 * intensity_score
        + 0.3 * hsv_score
        + 0.1 * gradient_score
        + 0.3 * center_score
        + 0.1 * yolo_score
    )
    composite = float(np.clip(composite, 0.0, 1.0))

    if composite >= 0.7:
        level = "danger"
    elif composite >= 0.5:
        level = "warning"
    elif composite >= 0.3:
        level = "caution"
    elif composite >= 0.15:
        level = "info"
    else:
        level = "none"

    return {
        "has_glare": composite > 0.15,
        "confidence": round(composite, 3),
        "alert_level": level,
        "processing_time": round(time.time() - start_time, 3),
        "method_scores": {
            "intensity": round(intensity_score, 3),
            "hsv": round(hsv_score, 3),
            "gradient": round(gradient_score, 3),
            "center_focus": round(center_score, 3),
            "yolo_objects": round(yolo_score, 3)
        },
        "brightness_analysis": {
            "bright_area_ratio": round(brightness_ratio, 4),
            "extreme_bright_ratio": round(extreme_brightness_ratio, 4),
            "center_glare_ratio": round(center_bright_ratio, 4),
            "gradient_activity": round(gradient_ratio, 4),
            "bright_objects_detected": int(bright_objects)
        }
    }

# -------------------- Flask app --------------------
app = Flask(__name__)
CORS(
    app,
    origins=["*"],
    methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "ngrok-skip-browser-warning"],
)

@app.route("/", methods=["GET"])
def root_health():
    return jsonify({
        "status": "VisoraX YOLOv8 Backend Online",
        "model": MODEL_NAME,
        "gpu_available": torch.cuda.is_available(),
        "timestamp": datetime.now().isoformat()
    })

@app.route("/dashcam/status", methods=["GET"])
def dashcam_status():
    return jsonify({
        "battery_level": 89,
        "storage_used_gb": 3.2,
        "temperature": 28,
        "gps_connected": True,
        "model_loaded": True,
        "ai_model": MODEL_NAME,
        "gpu_accelerated": torch.cuda.is_available(),
        "timestamp": datetime.now().isoformat()
    })

@app.route("/dashcam/analyze", methods=["POST", "OPTIONS"])
def analyze_dashcam_image():
    if request.method == "OPTIONS":
        return jsonify({"status": "OK"}), 200

    if "image" not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    image_file = request.files["image"]
    if image_file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    try:
        nparr = np.frombuffer(image_file.read(), np.uint8)
        image_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if image_bgr is None:
            return jsonify({"error": "Invalid image format"}), 400
    except Exception as e:
        return jsonify({"error": f"Read failed: {str(e)}"}), 400

    try:
        analysis = detect_glare_yolov8_enhanced(image_bgr)
        meta = {
            k: request.form.get(k)
            for k in ("latitude", "longitude", "speed_kmh", "heading", "driver_id", "vehicle_id")
            if request.form.get(k) is not None
        }
        resp = {
            **analysis,
            "model": MODEL_NAME,
            "image_dimensions": f"{image_bgr.shape[1]}x{image_bgr.shape[0]}",
            "gpu_accelerated": torch.cuda.is_available(),
            "timestamp": datetime.now().isoformat()
        }
        if meta:
            resp["metadata"] = meta
        return jsonify(resp), 200
    except Exception as e:
        return jsonify({"error": f"Analysis failed: {str(e)}"}), 500

@app.route("/fleet/vehicles", methods=["GET"])
def get_fleet_vehicles():
    fleet_vehicles = [
        {"vehicle_id": "TN01AB1234", "driver_id": "Driver 001", "status": "active",
         "current_location": {"latitude": 13.0827, "longitude": 80.2707},
         "total_incidents": 3, "last_seen": "2025-10-10T17:30:00Z"},
        {"vehicle_id": "KL07CD5678", "driver_id": "Driver 002", "status": "active",
         "current_location": {"latitude": 9.9312, "longitude": 76.2673},
         "total_incidents": 1, "last_seen": "2025-10-10T17:25:00Z"},
        {"vehicle_id": "MH12EF9012", "driver_id": "Driver 003", "status": "maintenance",
         "current_location": {"latitude": 19.0760, "longitude": 72.8777},
         "total_incidents": 7, "last_seen": "2025-10-10T16:30:00Z"}
    ]
    return jsonify({
        "vehicles": fleet_vehicles,
        "total_count": len(fleet_vehicles),
        "timestamp": datetime.now().isoformat()
    })

# -------------------- Entrypoint --------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=False, threaded=True)
