const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');

const playwrightPath = 'C:/Users/loru/Desktop/system/school-system/node_modules/playwright';
const { chromium } = require(playwrightPath);

const realScoreFile = 'C:/Users/loru/Desktop/月考0427.xlsx';
const realTeacherFile = 'C:/Users/loru/Desktop/初中部任课教师一览表2025.09.05.xlsx';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto(pathToFileURL(path.resolve(__dirname, '..', 'index.html')).href);

  let realResult = { skipped: true };
  if (fs.existsSync(realScoreFile)) {
    await page.locator('[data-view-target="import"]').first().click();
    await page.locator('#score-file').setInputFiles(realScoreFile);
    await page.locator('#parse-score-btn').click();
    await page.waitForFunction(() => window.LocalSchoolAnalytics?.getAnalysisStudents()?.length > 0);
    if (fs.existsSync(realTeacherFile)) {
      await page.locator('#teacher-file').setInputFiles(realTeacherFile);
      await page.locator('#parse-teacher-btn').click();
      await page.waitForFunction(() => window.LocalSchoolAnalytics?.state?.teachers?.length > 0);
    }
    realResult = await page.evaluate(() => {
      const api = window.LocalSchoolAnalytics;
      const state = api.state;
      const class96 = state.classRows.find((row) => row.className === '9.6');
      const gate = api.buildAnalysisGate();
      return {
        skipped: false,
        students: api.getAnalysisStudents().length,
        totalMax: api.getTotalMaxScore(),
        subjects: api.getAnalysisSubjects(),
        class96ChineseAvg: Number(class96?.subjects?.语文?.avg?.toFixed(2)),
        class96DevelopmentScore: Number(class96?.developmentScore),
        class96BottomThirdAvg: Number(class96?.bottomThirdAvg),
        teacherAssignments: state.teachers.length,
        teacherRows: state.teacherRows.length,
        gateBlocks: gate.blocks.length
      };
    });
  }

  const synthetic = await page.evaluate(() => {
    const api = window.LocalSchoolAnalytics;
    const state = api.state;

    state.grade = 9;
    state.activeSchool = '回归校';
    state.blankScoreMode = 'zero';
    state.examSchemes = {};
    state.sourceMaxOverrides = {};
    state.importStats = { duplicateStudents: 0, duplicateConflicts: [] };
    state.referenceRoster = api.parseRosterRows([
      ['学校', '班级', '姓名', '考号', '状态'],
      ['回归校', '9.1', '甲', 'R001', '参考'],
      ['回归校', '9.1', '乙', 'R002', '缺考'],
      ['回归校', '9.1', '名单外', 'R999', '参考']
    ], '名单');
    state.subjects = ['语文', '数学', '英语', '物理', '化学'];
    state.students = [
      { school: '回归校', className: '9.1', name: '甲', id: 'R001', rawScores: { 语文: 120, 数学: 110, 英语: 105, 物理: 80, 化学: 70 }, scores: {}, total: 0, ranks: {} },
      { school: '回归校', className: '9.1', name: '乙', id: 'R002', rawScores: { 语文: 0, 数学: 90, 英语: 88, 物理: 60, 化学: 50 }, blankScores: { 语文: false }, absentScores: { 语文: true }, scoreReasons: { 语文: 'absent' }, scores: {}, total: 0, ranks: {} },
      { school: '回归校', className: '9.2', name: '丙', id: 'R003', rawScores: { 语文: 95, 数学: 95, 英语: 92, 物理: 65, 化学: 45 }, scores: {}, total: 0, ranks: {} }
    ];
    state.teachers = api.parseTeacherRows([
      ['班级', '学科', '教师姓名', '任课权重'],
      ['9.1', '语文', '语文甲', '50%'],
      ['9.2', '语文', '语文乙', '1']
    ]);
    state.examHistory = [{
      id: 'base',
      name: '基准',
      grade: 9,
      students: state.students.map((student, index) => ({
        key: `${student.school}__${student.className}__${student.id}`,
        matchKeys: api.getStudentMatchKeys(student),
        className: student.className,
        name: student.name,
        id: student.id,
        scores: { 语文: index === 0 ? 100 : 90 },
        total: null,
        gradeRank: null,
        classRank: null
      }))
    }];
    state.selectedHistoryId = 'base';
    state.evaluationWeights = { classRelative: 46, classAbsolute: 40, classBalance: 14, classLowPenalty: 18, teacherQuality: 80, teacherRelative: 10, teacherHistory: 10 };
    state.weightConfigLocked = true;
    api.analyze();
    const roster = api.buildRosterDiagnostics();
    const gate = api.buildAnalysisGate();
    const traceRows = api.buildCalculationTraceRows();
    const teacherWeighted = state.teacherRows.find((row) => row.teacher === '语文甲');

    state.students[0].rawScores.语文 = 180;
    api.analyze();
    const overMaxGate = api.buildAnalysisGate();

    return {
      normalizedChemistry: state.students.find((student) => student.id === 'R001').scores.化学,
      rosterMissing: roster.missingFromScores.length,
      rosterExtra: roster.extraInScores.length,
      gateBlocksBeforeOverMax: gate.blocks.length,
      overMaxBlocks: overMaxGate.blocks.length,
      overMaxRows: state.importDiagnostics.overMaxRows.length,
      teacherWeight: teacherWeighted?.teachingWeight,
      effectiveStudentWeight: teacherWeighted?.effectiveStudentWeight,
      historyAdjustmentFinite: Number.isFinite(Number(teacherWeighted?.historyAdjustment)),
      developmentScoreFinite: state.classRows.every((row) => Number.isFinite(Number(row.developmentScore))),
      bottomThirdAvgFinite: state.classRows.every((row) => Number.isFinite(Number(row.bottomThirdAvg))),
      teacherConversionFinite: state.teacherRows.every((row) => Number.isFinite(Number(row.conversionScore))),
      hasSupportAlert: state.studentAlerts.some((item) => item.type === '后1/3托底'),
      traceHasTeacher: traceRows.some((row) => row[0] === '教师学科'),
      traceHasRawSourceMax: traceRows.some((row) => row[0] === '学生学科' && row[2] === '化学' && row[5] === 100 && row[6] === 60),
      weightsLocked: state.weightConfigLocked,
      scoreBands: api.buildScoreBandRows().map((row) => row.count)
    };
  });

  await browser.close();
  if (errors.length) throw new Error(`Browser errors:\n${errors.join('\n')}`);

  if (!realResult.skipped) {
    if (realResult.students < 100
      || realResult.totalMax !== 600
      || realResult.class96ChineseAvg !== 95.09
      || !Number.isFinite(realResult.class96DevelopmentScore)
      || !Number.isFinite(realResult.class96BottomThirdAvg)
      || !realResult.subjects.includes('语文')
      || (fs.existsSync(realTeacherFile) && realResult.teacherAssignments < 20)
      || realResult.gateBlocks !== 0) {
      throw new Error(`Real fixture regression failed: ${JSON.stringify(realResult, null, 2)}`);
    }
  }

  if (synthetic.normalizedChemistry !== 42
    || synthetic.rosterMissing !== 1
    || synthetic.rosterExtra !== 1
    || synthetic.gateBlocksBeforeOverMax !== 0
    || synthetic.overMaxBlocks < 1
    || synthetic.overMaxRows < 1
    || synthetic.teacherWeight !== 0.5
    || synthetic.effectiveStudentWeight !== 1
    || !synthetic.historyAdjustmentFinite
    || !synthetic.developmentScoreFinite
    || !synthetic.bottomThirdAvgFinite
    || !synthetic.teacherConversionFinite
    || !synthetic.hasSupportAlert
    || !synthetic.traceHasTeacher
    || !synthetic.traceHasRawSourceMax
    || !synthetic.weightsLocked
    || !synthetic.scoreBands.some(Boolean)) {
    throw new Error(`Synthetic regression failed: ${JSON.stringify(synthetic, null, 2)}`);
  }

  console.log(JSON.stringify({ ok: true, realResult, synthetic }, null, 2));
})();
