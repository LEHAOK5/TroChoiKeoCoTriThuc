const fs = require('fs');
const path = require('path');
const { pool, query } = require('../src/db/pool');
const { getRandomQuestions } = require('../src/repositories/question.repository');

async function import600Questions() {
  console.log('=== BẮT ĐẦU DỌN DẸP CSDL & NẠP 600 CÂU HỎI MỚI ===');

  // 1. Đọc file JSON chứa 600 câu hỏi đã được trích xuất
  let jsonPath = path.join(__dirname, 'questions_600.json');
  if (!fs.existsSync(jsonPath)) {
    jsonPath = path.join(__dirname, '../../../scratch/parsed_600_questions.json');
  }
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Không tìm thấy file: ${jsonPath}`);
  }
  const questions = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(`Đã đọc ${questions.length} câu hỏi từ file JSON.`);

  if (questions.length !== 600) {
    throw new Error(`Yêu cầu đúng 600 câu hỏi, hiện có ${questions.length}`);
  }

  // 2. Thống kê trước khi xóa
  const beforeStats = await query(`
    SELECT 
      (SELECT count(*) FROM questions) as total_questions,
      (SELECT count(*) FROM booth_registrations) as total_registrations,
      (SELECT count(*) FROM match_history) as total_matches,
      (SELECT count(*) FROM admin_users) as total_admins
  `);
  console.log('Thống kê trước khi dọn dẹp:', beforeStats.rows[0]);

  // 3. Thực hiện dọn dẹp các bảng dữ liệu cũ
  console.log('Đang làm sạch các bảng questions, booth_registrations, match_history...');
  await query('TRUNCATE TABLE questions, booth_registrations, match_history RESTART IDENTITY CASCADE');
  console.log('Đã làm sạch và reset ID của 3 bảng thành công!');

  // 4. Nạp 600 câu hỏi mới theo lô (chunk 50)
  console.log('Bắt đầu nạp 600 câu hỏi vào bảng questions...');
  const chunkSize = 50;
  for (let i = 0; i < questions.length; i += chunkSize) {
    const chunk = questions.slice(i, i + chunkSize);
    const valuePlaceholders = [];
    const values = [];
    let paramIdx = 1;

    for (const q of chunk) {
      valuePlaceholders.push(`($${paramIdx}, $${paramIdx+1}, $${paramIdx+2}, $${paramIdx+3}, $${paramIdx+4})`);
      values.push(
        q.category,
        q.question,
        JSON.stringify(q.options),
        q.answer_index,
        q.explanation || ''
      );
      paramIdx += 5;
    }

    const insertSql = `
      INSERT INTO questions (category, question, options, answer_index, explanation)
      VALUES ${valuePlaceholders.join(',\n')}
    `;

    await query(insertSql, values);
    process.stdout.write(`Đã nạp: ${Math.min(i + chunkSize, questions.length)} / ${questions.length} câu...\r`);
  }
  console.log('\nĐã nạp thành công toàn bộ 600 câu hỏi!');

  // 5. Kiểm tra & xác minh số lượng bản ghi sau khi nạp
  const afterStats = await query(`
    SELECT 
      (SELECT count(*) FROM questions) as total_questions,
      (SELECT count(*) FILTER (WHERE category = 'IT') FROM questions) as it_questions,
      (SELECT count(*) FILTER (WHERE category = 'LAW') FROM questions) as law_questions,
      (SELECT count(*) FROM booth_registrations) as total_registrations,
      (SELECT count(*) FROM match_history) as total_matches,
      (SELECT count(*) FROM admin_users) as total_admins
  `);
  console.log('Thống kê sau khi nạp mới:', afterStats.rows[0]);

  // 6. Kiểm tra hàm lấy ngẫu nhiên câu hỏi của game (getRandomQuestions)
  console.log('Kiểm tra hàm getRandomQuestions(35)...');
  const sample = await getRandomQuestions(35);
  console.log(`Lấy thành công ${sample.length} câu hỏi ngẫu nhiên cho trận đấu.`);
  if (sample.length > 0) {
    console.log('Mẫu câu hỏi ngẫu nhiên số 1:', {
      id: sample[0].id,
      category: sample[0].category,
      question: sample[0].question.slice(0, 70) + '...',
      options: sample[0].options,
      answer_index: sample[0].answer_index,
      explanation: sample[0].explanation ? sample[0].explanation.slice(0, 60) + '...' : ''
    });
  }

  console.log('=== HOÀN TẤT THÀNH CÔNG ===');
  await pool.end();
  process.exit(0);
}

import600Questions().catch(err => {
  console.error('Lỗi trong quá trình thực thi:', err);
  process.exit(1);
});
