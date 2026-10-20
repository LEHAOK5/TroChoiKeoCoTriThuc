const fs = require('fs');
const path = require('path');
const { pool, query } = require('../src/db/pool');
const { getRandomQuestions } = require('../src/repositories/question.repository');

async function import600Questions() {
  console.log('--- STARTING 600 UNIQUE QUESTIONS IMPORT TO SUPABASE ---');
  
  // 1. Read questions_600.json
  const jsonPath = path.join(__dirname, 'questions_600.json');
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`File not found: ${jsonPath}`);
  }
  const questions = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(`Loaded ${questions.length} questions from JSON.`);

  if (questions.length !== 600) {
    throw new Error(`Expected exactly 600 questions, got ${questions.length}`);
  }

  // 2. Check current questions in DB
  const beforeCount = await query('SELECT count(*) as count, count(distinct question) as unique_count FROM questions');
  console.log(`Current questions in DB before import: Total = ${beforeCount.rows[0].count}, Unique = ${beforeCount.rows[0].unique_count}`);

  // 3. Clear old questions in database
  console.log('Truncating questions table...');
  await query('TRUNCATE TABLE questions RESTART IDENTITY');
  console.log('Table questions truncated successfully.');

  // 4. Insert 600 questions in batches of 50
  console.log('Inserting 600 unique questions in batches...');
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
        q.question.trim(),
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
    process.stdout.write(`Inserted ${Math.min(i + chunkSize, questions.length)} / ${questions.length} questions...\r`);
  }
  console.log('\nAll 600 questions inserted successfully!');

  // 5. Verify stats in Supabase DB
  const afterStats = await query(`
    SELECT 
      count(*) as total,
      count(distinct question) as total_unique,
      count(*) FILTER (WHERE category = 'LAW') as total_law,
      count(*) FILTER (WHERE category = 'IT') as total_it
    FROM questions
  `);
  console.log('Verification DB Stats:', afterStats.rows[0]);

  // 6. Test getRandomQuestions
  console.log('Testing getRandomQuestions(35)...');
  const sample = await getRandomQuestions(35);
  console.log(`getRandomQuestions returned ${sample.length} questions.`);
  const sampleCategories = sample.reduce((acc, q) => {
    acc[q.category] = (acc[q.category] || 0) + 1;
    return acc;
  }, {});
  console.log('Sample question categories distribution:', sampleCategories);

  console.log('--- 600 QUESTIONS IMPORT COMPLETED PERFECTLY ---');
  await pool.end();
  process.exit(0);
}

import600Questions().catch(err => {
  console.error('Import failed with error:', err);
  process.exit(1);
});
