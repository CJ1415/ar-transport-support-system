const express = require('express');
const router = express.Router();
const path = require('path');
const Database = require('better-sqlite3');
const Groq = require('groq-sdk');

const dbPath = path.resolve(__dirname, '../db/ar_transport.db');
const db = new Database(dbPath);
db.exec('PRAGMA foreign_keys = ON;');

const faultColumns = db.prepare('PRAGMA table_info(faults)').all();
if (!faultColumns.some((column) => column.name === 'deleted_at')) {
    db.prepare('ALTER TABLE faults ADD COLUMN deleted_at TEXT').run();
}

// ── Groq AI client ─────────────────────────────────────────────────────────
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const CATEGORY_PROMPTS = {
    train_track: 'railway track, rail infrastructure, sleepers/ties, ballast, rail joints, fishplates, bolts',
    train: 'train carriage, locomotive, wheels, bogies, chassis, body panels, windows, doors',
    wall: 'concrete wall, brick wall, structural surface, plaster, mortar joints',
};

// ── Existing routes ───────────────────────────────────────────────────────────

router.get('/', (req, res) => {
    try {
        const stmt = db.prepare(`
            SELECT
                faults.id,
                locations.name AS location,
                faults.fault_type AS type,
                faults.asset_class,
                faults.severity,
                faults.status,
                faults.detected_at
            FROM faults
            JOIN locations
            ON faults.location_id = locations.id
            WHERE faults.deleted_at IS NULL
            ORDER BY faults.detected_at DESC
        `);
        const faults = stmt.all();
        res.json(faults);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Database fetch failed' });
    }
});

router.get('/locations', (req, res) => {
    try {
        const stmt = db.prepare(`SELECT id, name FROM locations ORDER BY name`);
        const locations = stmt.all();
        res.json(locations);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Failed to fetch locations' });
    }
});

router.post('/report', async (req, res) => {
    try {
        const { location_id, fault_type, severity, asset_class } = req.body;
        const user_id = req.user.id;

        if (!user_id || !location_id || !fault_type || !severity || !asset_class) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const sessionStmt = db.prepare(`
            SELECT id FROM sessions
            WHERE user_id = ? AND ended_at IS NULL
            LIMIT 1
        `);
        let session = sessionStmt.get(user_id);

        if (!session) {
            const createSessionStmt = db.prepare(`
                INSERT INTO sessions (user_id, location_id, device_uid)
                VALUES (?, ?, 'web-client')
            `);
            const sessionInfo = createSessionStmt.run(user_id, location_id);
            session = { id: sessionInfo.lastInsertRowid };
        }

        const insertStmt = db.prepare(`
            INSERT INTO faults (session_id, location_id, fault_type, asset_class, severity, status)
            VALUES (?, ?, ?, ?, ?, 'Open')
        `);
        const info = insertStmt.run(session.id, location_id, fault_type, asset_class, severity);

        res.status(201).json({ success: true, message: 'Fault saved!', id: info.lastInsertRowid });
    } catch (err) {
        console.error('SQL Error:', err.message);
        res.status(500).json({ error: 'Failed to save fault' });
    }
});

router.patch('/:id', (req, res) => {
    try {
        const faultId = parseInt(req.params.id, 10);
        const { status } = req.body;

        if (!faultId || !status) {
            return res.status(400).json({ error: 'Fault id and status are required' });
        }

        const validStatuses = ['Open', 'In progress', 'Resolved', 'Closed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid fault status' });
        }

        const updateStmt = db.prepare(`UPDATE faults SET status = ? WHERE id = ? AND deleted_at IS NULL`);
        const result = updateStmt.run(status, faultId);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Fault not found or already deleted' });
        }

        const auditStmt = db.prepare('INSERT INTO audit_logs (user_id, event_type, entity_type, entity_id) VALUES (?, ?, ?, ?)');
        auditStmt.run(req.user.id, 'Fault Completed', 'Fault', faultId);

        res.json({ success: true, message: 'Fault status updated', status });
    } catch (err) {
        console.error('Failed to update fault status:', err.message);
        res.status(500).json({ error: 'Failed to update fault status' });
    }
});

router.delete('/:id', (req, res) => {
    try {
        const faultId = parseInt(req.params.id, 10);
        if (!faultId) {
            return res.status(400).json({ error: 'Fault id is required' });
        }

        const deleteStmt = db.prepare('UPDATE faults SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL');
        const result = deleteStmt.run(faultId);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Fault not found or already deleted' });
        }

        const auditStmt = db.prepare('INSERT INTO audit_logs (user_id, event_type, entity_type, entity_id) VALUES (?, ?, ?, ?)');
        auditStmt.run(req.user.id, 'Fault Deleted', 'Fault', faultId);

        res.json({ success: true, message: 'Fault deleted' });
    } catch (err) {
        console.error('Failed to delete fault:', err.message);
        res.status(500).json({ error: 'Failed to delete fault' });
    }
});

// ── AR Detection route ────────────────────────────────────────────────────────

router.post('/detect', async (req, res) => {
    const { imageBase64, imageType, category } = req.body;

    if (!imageBase64 || !imageType || !category) {
        return res.status(400).json({ error: 'imageBase64, imageType and category are required' });
    }

    const subject = CATEGORY_PROMPTS[category] || category;

    const prompt = `You are an expert structural inspection AI specialising in fault detection for ${subject}.
Analyse the image carefully and identify any faults, defects, cracks, damage, or areas of concern.

Respond ONLY with a valid JSON object — no markdown, no code blocks, raw JSON only:
{
  "overallSeverity": "none|low|medium|high|critical",
  "summary": "A concise 1-2 sentence summary of findings",
  "faults": [
    {
      "label": "Short fault name",
      "severity": "low|medium|high|critical",
      "description": "Brief description of this specific fault",
      "xPercent": 20.5,
      "yPercent": 35.2,
      "widthPercent": 15.0,
      "heightPercent": 10.0
    }
  ]
}

Rules:
- xPercent/yPercent = top-left corner of bounding box (0-100 scale of image dimensions)
- widthPercent/heightPercent = box size (0-100 scale)
- If no faults found, set overallSeverity to "none" and faults to []
- Maximum 8 faults per image`;

    try {
        const response = await groq.chat.completions.create({
            model: 'meta-llama/llama-4-scout-17b-16e-instruct',
            max_tokens: 2048,
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt },
                        { type: 'image_url', image_url: { url: `data:image/${imageType};base64,${imageBase64}` } },
                    ],
                },
            ],
        });

        const content = response.choices[0]?.message?.content ?? '{}';
        let parsed;
        try {
            const match = content.match(/\{[\s\S]*\}/);
            parsed = JSON.parse(match ? match[0] : content);
        } catch {
            parsed = { overallSeverity: 'none', summary: 'Analysis complete.', faults: [] };
        }

        const faults = Array.isArray(parsed.faults) ? parsed.faults : [];

        res.json({
            scanId: Date.now(),
            category,
            overallSeverity: parsed.overallSeverity || 'none',
            summary: parsed.summary || '',
            faultCount: faults.length,
            faults,
        });
    } catch (err) {
        console.error('Groq detection error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── Tool Check route ──────────────────────────────────────────────────────────

router.post('/toolcheck', async (req, res) => {
    const { imageBase64: currentBase64, imageType, referenceImageBase64, referenceImageType } = req.body;

    if (!currentBase64 || !imageType) {
        return res.status(400).json({ error: 'imageBase64 and imageType are required' });
    }

    const toolList = Array.isArray(req.body.toolList) ? req.body.toolList.filter(Boolean) : [];
    const hasToolList = toolList.length > 0;
    const hasReference = !!referenceImageBase64;

    try {
        let issues = [];
        let summary = '';

        if (hasToolList) {
            // ── Written tool list provided — single pass check ─────────────────
            const toolListText = toolList.map((t, i) => `${i + 1}. ${t}`).join('\n');

            const checkResponse = await groq.chat.completions.create({
                model: 'meta-llama/llama-4-scout-17b-16e-instruct',
                max_tokens: 2048,
                messages: [{
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: `You are an expert tool inventory AI. Your task is to verify the presence and correct placement of tools in a toolbox based on this required list:
${toolListText}

Follow this step-by-step process:
1. Scan the image systematically.
2. Identify all visible tools.
3. Identify all empty foam cutouts, slots, or shadows where a tool should be.
4. Cross-reference the visible tools with the required list.

CRITICAL RULES:
- Do NOT flag a tool as missing if it is present anywhere in the image.
- An empty cutout usually looks like a dark shadow in the exact shape of the missing tool.
- If all tools are present and correctly placed, return an empty "issues" array.

Respond ONLY with raw JSON in this exact format:
{
  "reasoning": "Explain step by step what you see before declaring an issue.",
  "summary": "One sentence summary.",
  "issues": [
    {
      "name": "exact tool name from the list",
      "status": "missing|misplaced",
      "notes": "Specific visual evidence (e.g., 'The foam cutout for the wrench is empty')",
      "xPercent": 20.5,
      "yPercent": 35.2,
      "widthPercent": 10.0,
      "heightPercent": 8.0
    }
  ]
}`
                        },
                        { type: 'image_url', image_url: { url: `data:image/${imageType};base64,${currentBase64}` } }
                    ]
                }]
            });

            const content = checkResponse.choices[0]?.message?.content ?? '{}';
            let parsed;
            try {
                const m = content.match(/\{[\s\S]*\}/);
                parsed = JSON.parse(m ? m[0] : content);
            } catch {
                parsed = { summary: 'Scan complete.', issues: [] };
            }
            issues = Array.isArray(parsed.issues) ? parsed.issues : [];
            summary = parsed.summary || '';

        } else if (hasReference) {
            // ── Pass 1: Extract expected inventory from reference image ──────
            const refResponse = await groq.chat.completions.create({
                model: 'meta-llama/llama-4-scout-17b-16e-instruct',
                max_tokens: 1024,
                messages: [{
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: `You are a tool inventory AI. Look at this toolbox image and list EVERY individual tool you can see.
Be specific with names (e.g. "Phillips Screwdriver #2", "10mm Spanner", "Claw Hammer").
Respond ONLY with raw JSON — no markdown:
{"tools": [{"name": "exact tool name", "location": "brief position, e.g. top-left, second row center, bottom-right corner"}]}`
                        },
                        { type: 'image_url', image_url: { url: `data:image/${referenceImageType || 'png'};base64,${referenceImageBase64}` } }
                    ]
                }]
            });

            const refContent = refResponse.choices[0]?.message?.content ?? '{}';
            let refParsed;
            try {
                const m = refContent.match(/\{[\s\S]*\}/);
                refParsed = JSON.parse(m ? m[0] : refContent);
            } catch {
                refParsed = { tools: [] };
            }
            const expectedTools = Array.isArray(refParsed.tools) ? refParsed.tools : [];

            if (expectedTools.length === 0) {
                return res.json({ scanId: Date.now(), summary: 'Could not read reference inventory.', issues: [] });
            }

            // ── Pass 2: Check current image against extracted inventory ─────────
            const toolListText = expectedTools
                .map((t, i) => `${i + 1}. ${t.name} — expected position: ${t.location}`)
                .join('\n');

            const checkResponse = await groq.chat.completions.create({
                model: 'meta-llama/llama-4-scout-17b-16e-instruct',
                max_tokens: 2048,
                messages: [{
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: `You are an expert tool inventory AI. You must compare the current toolbox against this expected baseline inventory:
${toolListText}

Carefully examine the image and for each expected tool, decide:
- Is it PRESENT and roughly in its expected location? → ignore it.
- Is the specific foam slot for this tool clearly EMPTY (showing a dark shadow/cutout)? → report as "missing".
- Is it present, but clearly sitting loosely on top of other tools or in the wrong slot? → report as "misplaced".

Respond ONLY with raw JSON in this exact format:
{
  "reasoning": "Explain step by step. Match visible tools to baseline. Identify empty foam cutouts.",
  "summary": "One sentence summary of the issues found.",
  "issues": [
    {
      "name": "exact tool name from the list",
      "status": "missing|misplaced",
      "notes": "brief visual evidence",
      "xPercent": 20.5,
      "yPercent": 35.2,
      "widthPercent": 10.0,
      "heightPercent": 8.0
    }
  ]
}

Bounding box rules (coordinates are % of image width/height):
- MISSING → draw the box tightly around the EMPTY FOAM CUTOUT.
- MISPLACED → draw the box tightly around the tool where it currently sits.
- If all tools are accounted for, return an empty issues array.`
                        },
                        { type: 'image_url', image_url: { url: `data:image/${imageType};base64,${currentBase64}` } }
                    ]
                }]
            });

            const checkContent = checkResponse.choices[0]?.message?.content ?? '{}';
            let checkParsed;
            try {
                const m = checkContent.match(/\{[\s\S]*\}/);
                checkParsed = JSON.parse(m ? m[0] : checkContent);
            } catch {
                checkParsed = { summary: 'Scan complete.', issues: [] };
            }
            issues = Array.isArray(checkParsed.issues) ? checkParsed.issues : [];
            summary = checkParsed.summary || '';

        } else {
            // ── Single image fallback ─────────────────
            const response = await groq.chat.completions.create({
                model: 'meta-llama/llama-4-scout-17b-16e-instruct',
                max_tokens: 2048,
                messages: [{
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: `You are a tool inventory AI analyzing a toolbox.
Your goal is to find visual evidence of missing tools (empty foam cutouts/shadows) or misplaced tools.

Respond ONLY with raw JSON:
{
  "reasoning": "I am scanning the foam inserts. I see a distinct empty cutout shaped like a screwdriver...",
  "summary": "Brief summary of issues.",
  "issues": [
    {
      "name": "Describe the shape of the missing/misplaced tool",
      "status": "missing|misplaced",
      "notes": "Visual evidence",
      "xPercent": 20.5,
      "yPercent": 35.2,
      "widthPercent": 10.0,
      "heightPercent": 8.0
    }
  ]
}`
                        },
                        { type: 'image_url', image_url: { url: `data:image/${imageType};base64,${currentBase64}` } }
                    ]
                }]
            });
            const content = response.choices[0]?.message?.content ?? '{}';
            let parsed;
            try {
                const m = content.match(/\{[\s\S]*\}/);
                parsed = JSON.parse(m ? m[0] : content);
            } catch {
                parsed = { summary: 'Scan complete.', issues: [] };
            }
            issues = Array.isArray(parsed.issues) ? parsed.issues : [];
            summary = parsed.summary || '';
        }

        res.json({ scanId: Date.now(), summary, issues });

    } catch (err) {
        console.error('Groq toolcheck error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;