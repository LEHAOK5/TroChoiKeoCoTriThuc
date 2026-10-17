const express = require('express');
const { saveRegistration } = require('../repositories/registration.repository');
const { createSessionToken } = require('../utils/session');
const { registerLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

router.post('/', registerLimiter, async (req, res, next) => {
  try {
    const { fullName, studentId, faculty = '', phone = '', consent = true } = req.body;

    if (!fullName || !fullName.trim() || !studentId || !studentId.trim()) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Họ tên và MSSV là bắt buộc'
        }
      });
    }

    // Save to database
    const record = await saveRegistration({
      fullName: fullName.trim(),
      studentId: studentId.trim(),
      faculty: faculty.trim(),
      phone: phone.trim(),
      consent
    });

    // Issue signed session token
    const sessionToken = createSessionToken({
      registrationId: record.id,
      fullName: record.full_name,
      studentId: record.student_id,
      faculty: record.faculty,
      phone: record.phone
    });

    res.json({
      success: true,
      sessionToken,
      player: {
        id: record.id,
        fullName: record.full_name,
        studentId: record.student_id,
        faculty: record.faculty,
        phone: record.phone
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
