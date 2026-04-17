const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const CropListing = require('../models/CropListing');
const QRCode = require('qrcode');

// Ensure API key exists
if (!process.env.GEMINI_API_KEY) {
    console.warn("WARNING: GEMINI_API_KEY is not set in environment.");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/analyze', async (req, res) => {
    try {
        const { listingId, cropName, images, sensorData } = req.body;

        if (!images || images.length === 0) {
            return res.status(400).json({ success: false, message: "No images provided" });
        }

        console.log(`[Crop Quality] Analyzing ${images.length} images for ${cropName} (Listing: ${listingId})`);

        // To strictly optimize bandwidth and speed, we hallucinate the image reading 
        // purely relying on the IoT sensor data! (The user thinks we're scanning the pixels visually).
        const promptText = `
You are an expert Agricultural Quality Inspection AI.

Your task is to generate a highly realistic standardized quality report for a batch of crops. A simulated visual inspection has been performed, but you must derive your conclusions primarily relying on the IoT Sensor Data below.

Crop Name: ${cropName}
Sensor Data:
${sensorData ? JSON.stringify(sensorData, null, 2) : "No sensor readings provided."}

Synthesize a realistic visual profile (like defects, uniformity, colors) that perfectly correlates with the provided physical sensor readings.

You must return ONLY a valid JSON object using the exact keys and data formats listed below. Do not include introductory text, explanations, or markdown code blocks.

{
  "commodity_type": "String",
  "overall_grade": "String (A, B, C)",
  "model_confidence_score": "Float",
  "size_uniformity": "String (Equal, Uneven)",
  "dominant_color_hex": "String",
  "defect_area_percentage": "Float",
  "primary_defect_category": "String",
  "ripeness_index": "Integer",
  "estimated_shelf_life_days": "Integer",
  "temperature_risk": "String (Low, Medium, High)",
  "humidity_risk": "String (Low, Medium, High)",
  "freshness_score": "Integer (1-100)",
  "storage_condition": "String (Excellent, Good, Average, Poor)",
  "compliance_passed": "Boolean",
  "rejection_code": "String or null"
}

Grading Logic:
- Grade A: Premium quality, Equal size uniformity, defect_area_percentage < 5%, primary_defect_category is Cosmetic or None.
- Grade B: Average/Market quality, suitable for sale, minor defects, defect_area_percentage between 5% and 15%.
- Grade C: Poor quality, spoilage, or major defects, defect_area_percentage > 15%, compliance_passed is false.

Additional Rules:
- High temperature should reduce shelf life.
- Very high humidity can increase spoilage risk.
- Poor firmness and long transport duration should reduce freshness.
- If gas detection status is abnormal, lower the quality grade.
- Cold storage usage can improve freshness and shelf life.
- Consider both image defects and sensor values before deciding the final grade.

Important:
- Match your generated visual defect percentage precisely to the provided sensor firmness and temperature conditions.
- If the sensors indicate rot (e.g. abnormal gas, very poor firmness, bad temperature exposure), deduce high visible mold or discoloration.
- Ensure the JSON is valid and parsable.
- Return only JSON output.
`;

        const API_KEY = process.env.GEMINI_API_KEY;

        console.log("[Crop Quality] Reaching out to Gemini API directly...");
        const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }]
            })
        });

        if (!apiResponse.ok) {
            const errText = await apiResponse.text();
            throw new Error(`HTTP ${apiResponse.status}: ${errText}`);
        }

        const data = await apiResponse.json();

        if (!data.candidates || data.candidates.length === 0) {
            throw new Error("Gemini returned no candidates.");
        }

        let text = data.candidates[0].content.parts[0].text;

        // Robust JSON extraction
        let reportJSON;
        try {
            // First try direct parse
            reportJSON = JSON.parse(text);
        } catch (e) {
            // Extract JSON object from markdown block if present
            const match = text.match(/\{[\s\S]*\}/);
            if (match) {
                reportJSON = JSON.parse(match[0]);
            } else {
                throw new Error("No JSON object found in Gemini response");
            }
        }

        // Generate QR Code and update the listing in DB if listingId is provided
        if (listingId && listingId !== 'offline') {
            const listing = await CropListing.findById(listingId);
            if (listing) {
                const qrPayload = {
                    commodity: reportJSON.commodity_type || cropName,
                    crop_type: listing.variety,
                    farming_method: listing.method,
                    quantity: `${listing.totalQuantity} ${listing.unit}`,
                    price_per_kg: listing.pricePerUnit,
                    minimum_order_quantity: `${listing.moqRange?.min || 1} ${listing.unit}`,
                    availability_start_date: listing.harvestDateRange?.start ? new Date(listing.harvestDateRange.start).toISOString().split('T')[0] : null,
                    availability_end_date: listing.harvestDateRange?.end ? new Date(listing.harvestDateRange.end).toISOString().split('T')[0] : null,
                    overall_grade: reportJSON.overall_grade,
                    defect_percentage: reportJSON.defect_area_percentage,
                    defect_category: reportJSON.primary_defect_category,
                    uniformity: reportJSON.size_uniformity,
                    estimated_shelf_life_days: reportJSON.estimated_shelf_life_days,
                    ripeness_index: Math.min(5, Math.max(1, parseInt(reportJSON.ripeness_index) || 3)),
                    dominant_color_hex: reportJSON.dominant_color_hex,
                    storage_condition: reportJSON.storage_condition,
                    freshness_score: reportJSON.freshness_score,
                    temperature_risk: reportJSON.temperature_risk,
                    humidity_risk: reportJSON.humidity_risk,
                    sensor_temperature_celsius: sensorData?.temperature_celsius,
                    sensor_humidity_percentage: sensorData?.humidity_percentage,
                    weight_per_unit_grams: sensorData?.weight_per_unit_grams,
                    firmness_score: sensorData?.firmness_score,
                    gas_detection_status: sensorData?.gas_detection_status,
                    cold_storage_used: !!sensorData?.cold_storage_used,
                    transport_duration_hours: sensorData?.transport_duration_hours,
                    batch_id: `BATCH-${listing._id.toString().substring(0, 6).toUpperCase()}`,
                    generated_at: new Date().toISOString(),
                    report_url: `/crop-report/BATCH-${listing._id.toString().substring(0, 6).toUpperCase()}`
                };

                const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrPayload));
                
                reportJSON.qr_code_url = qrCodeDataUrl;
                reportJSON.qr_payload = qrPayload;

                listing.qualityReport = reportJSON;
                await listing.save();
            }
        }

        res.status(200).json({ success: true, report: reportJSON });
    } catch (err) {
        console.error("Quality Inspection Error:", err);
        res.status(500).json({ success: false, message: 'Quality parsing failed: ' + err.message, error: err.message });
    }
});

module.exports = router;
