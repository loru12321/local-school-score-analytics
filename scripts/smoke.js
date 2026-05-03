const path = require('node:path');
const { pathToFileURL } = require('node:url');

const playwrightPath = 'C:/Users/loru/Desktop/system/school-system/node_modules/playwright';
const { chromium } = require(playwrightPath);

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 980 } });
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  const indexUrl = pathToFileURL(path.resolve(__dirname, '..', 'index.html')).href;
  await page.goto(indexUrl);
  await page.getByRole('button', { name: '8' }).click();
  await page.getByRole('button', { name: '载入示例' }).click();
  await page.waitForFunction(() => window.LocalSchoolAnalytics?.state?.students?.length > 0);
  await page.waitForFunction(() => window.LocalSchoolAnalytics?.state?.grade === 8);
  const grade8Config = await page.evaluate(() => ({
    totalSubjects: window.LocalSchoolAnalytics.getTotalSubjects(),
    chineseMax: window.LocalSchoolAnalytics.getSubjectMaxScore('语文'),
    mathMax: window.LocalSchoolAnalytics.getSubjectMaxScore('数学'),
    englishMax: window.LocalSchoolAnalytics.getSubjectMaxScore('英语'),
    physicsMax: window.LocalSchoolAnalytics.getSubjectMaxScore('物理'),
    chemistryMax: window.LocalSchoolAnalytics.getSubjectMaxScore('化学'),
    politicsMax: window.LocalSchoolAnalytics.getSubjectMaxScore('政治'),
    historyMax: window.LocalSchoolAnalytics.getSubjectMaxScore('历史'),
    geographyMax: window.LocalSchoolAnalytics.getSubjectMaxScore('地理'),
    biologyMax: window.LocalSchoolAnalytics.getSubjectMaxScore('生物'),
    totalMax: window.LocalSchoolAnalytics.getTotalMaxScore(),
    classes: [...new Set(window.LocalSchoolAnalytics.getAnalysisStudents().map((student) => student.className))],
    normalizedClasses: ['6.10班', '6年10班', '610', '10班', '六年级十班', '六.十48', '九.六44'].map((value) => window.LocalSchoolAnalytics.normalizeClass(value)),
    studentRankHeader: window.LocalSchoolAnalytics.buildStudentRankRows()[0]
  }));
  await page.getByRole('button', { name: '9' }).click();
  await page.getByRole('button', { name: '载入示例' }).click();
  await page.waitForFunction(() => window.LocalSchoolAnalytics?.state?.grade === 9);
  const grade9Config = await page.evaluate(() => ({
    chineseMax: window.LocalSchoolAnalytics.getSubjectMaxScore('语文'),
    mathMax: window.LocalSchoolAnalytics.getSubjectMaxScore('数学'),
    englishMax: window.LocalSchoolAnalytics.getSubjectMaxScore('英语'),
    physicsMax: window.LocalSchoolAnalytics.getSubjectMaxScore('物理'),
    chemistryMax: window.LocalSchoolAnalytics.getSubjectMaxScore('化学'),
    politicsMax: window.LocalSchoolAnalytics.getSubjectMaxScore('政治'),
    totalMax: window.LocalSchoolAnalytics.getTotalMaxScore()
  }));

  const desktop = await page.evaluate(() => ({
    students: window.LocalSchoolAnalytics.getAnalysisStudents().length,
    rawStudents: window.LocalSchoolAnalytics.state.students.length,
    teachers: window.LocalSchoolAnalytics.state.finalTeacherRows.length,
    totalSubjects: window.LocalSchoolAnalytics.getTotalSubjects(),
    classRows: document.querySelectorAll('#class-table tbody tr').length,
    teacherRows: document.querySelectorAll('#teacher-final-table tbody tr').length,
    canvasPixels: Array.from(document.querySelectorAll('canvas')).map((canvas) => {
      const ctx = canvas.getContext('2d');
      const sample = ctx.getImageData(0, 0, Math.min(canvas.width, 80), Math.min(canvas.height, 80)).data;
      return sample.some((value) => value !== 0);
    }),
    radarValues: window.LocalSchoolAnalytics.state.charts.subjectRadar?.data?.datasets?.[0]?.data || []
  }));

  await page.getByRole('button', { name: '学生' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出学生排名' }).click();
  const download = await downloadPromise;
  const suggestedName = download.suggestedFilename();

  const grade9Normalization = await page.evaluate(() => {
    const api = window.LocalSchoolAnalytics;
    const state = api.state;
    const fullRaw = { 语文: 150, 数学: 150, 英语: 150, 物理: 100, 化学: 100 };
    const midRaw = { 语文: 120, 数学: 110, 英语: 105, 物理: 80, 化学: 70 };
    state.grade = 9;
    state.activeSchool = '折算校';
    state.subjects = ['语文', '数学', '英语', '物理', '化学'];
    state.students = [
      { school: '折算校', className: '9.1', name: '满分生', id: 'Z001', rawScores: fullRaw, scores: { ...fullRaw }, total: 0, ranks: {} },
      { school: '折算校', className: '9.1', name: '折算生', id: 'Z002', rawScores: midRaw, scores: { ...midRaw }, total: 0, ranks: {} }
    ];
    state.teachers = [];
    api.analyze();
    return {
      totalMax: api.getTotalMaxScore(),
      firstTotal: state.students[0].total,
      secondScores: state.students[1].scores,
      adjustments: state.scoreAdjustments,
      summary: api.getScoreAdjustmentSummary()
    };
  });

  const explicitSourceMax = await page.evaluate(() => {
    const api = window.LocalSchoolAnalytics;
    const state = api.state;
    state.grade = 9;
    state.activeSchool = '难卷校';
    state.blankScoreMode = 'zero';
    state.sourceMaxOverrides = {};
    state.subjects = ['物理', '化学'];
    state.students = [
      { school: '难卷校', className: '9.1', name: '甲', id: 'D001', rawScores: { 物理: 88, 化学: 50 }, scores: {}, total: 0, ranks: {} },
      { school: '难卷校', className: '9.2', name: '乙', id: 'D002', rawScores: { 物理: 70, 化学: 40 }, scores: {}, total: 0, ranks: {} }
    ];
    state.teachers = [];
    api.analyze();
    return {
      firstScores: state.students[0].scores,
      firstTotal: state.students[0].total,
      adjustments: state.scoreAdjustments
    };
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(250);
  const mobile = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
    hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2
  }));

  const edgeCases = await page.evaluate(() => {
    const api = window.LocalSchoolAnalytics;
    const teacherTitleRows = api.parseTeacherRows([
      ['银山实验学校任课安排'],
      ['班级', '学科', '教师姓名'],
      ['8.10班', '物理', '张老师']
    ]);
    const wideTeacherRows = api.parseTeacherRows([
      ['初中部任课教师一览表'],
      ['级部主任', '班级', '班主任', '语文', '数学', '英语', '物理', '化学', '政治'],
      ['宋波', '九.六44', '班主任', '语文甲/语文乙', '数学甲', '英语甲', '物理甲', '化学甲', '政治甲']
    ]);
    const mergedTeacherSourceRows = [
      ['初中部任课教师一览表'],
      ['级部主任', '班级', '班主任', '语文', '数学', '英语', '物理', '化学'],
      ['商建军', '九.一50', '商建军', '李秀莉', '宋利华', '陈丽军', '商建军', '张景旭'],
      ['', '九.二48', '卞如如', '', '', '', '', '']
    ];
    api.fillMergedRows(mergedTeacherSourceRows, [
      { s: { r: 2, c: 3 }, e: { r: 3, c: 3 } },
      { s: { r: 2, c: 4 }, e: { r: 3, c: 4 } },
      { s: { r: 2, c: 5 }, e: { r: 3, c: 5 } },
      { s: { r: 2, c: 6 }, e: { r: 3, c: 6 } },
      { s: { r: 2, c: 7 }, e: { r: 3, c: 7 } }
    ]);
    const mergedTeacherRows = api.parseTeacherRows(mergedTeacherSourceRows);
    const state = api.state;
    state.grade = 8;
    state.activeSchool = '甲校';
    state.blankScoreMode = 'zero';
    state.students = [
      { school: '甲校', className: '8.1', name: '甲一', id: 'A001', scores: { 语文: 120 }, total: 0, ranks: {} },
      { school: '甲校', className: '8.1', name: '甲二', id: 'A002', scores: { 语文: 105 }, total: 0, ranks: {} },
      { school: '乙校', className: '8.1', name: '乙一', id: 'B001', scores: { 语文: 110, 物理: 85 }, total: 0, ranks: {} }
    ];
    state.subjects = ['语文', '物理'];
    state.teachers = [
      { className: '8.1', subject: '语文', teacher: '甲语文老师' },
      { className: '8.2', subject: '语文', teacher: '错班老师' },
      { className: '8.1', subject: '物理', teacher: '甲物理老师' }
    ];
    api.analyze();
    return {
      teacherTitleRows,
      wideTeacherRows,
      mergedTeacherRows,
      analysisSubjects: api.getAnalysisSubjects(),
      totalSubjects: api.getTotalSubjects(),
      finalTeachers: state.finalTeacherRows.map((row) => row.teacher),
      teacherRows: state.teacherRows.map((row) => ({ teacher: row.teacher, subject: row.subject, classes: row.classes, count: row.studentCount })),
      unmatched: state.teacherCoverage.unmatched,
      rankHeader: api.buildStudentRankRows()[0]
    };
  });

  const duplicateAndWhitelist = await page.evaluate(() => {
    const api = window.LocalSchoolAnalytics;
    const state = api.state;
    state.grade = 8;
    state.activeSchool = '白名单校';
    state.students = [];
    state.subjects = [];
    state.teachers = [];
    state.importStats = { duplicateStudents: 0 };
    state.blankScoreMode = 'zero';
    api.parseScoreRows([
      ['学校', '班级', '姓名', '考号', '语文', '物理', '体育', '科学'],
      ['白名单校', '8.1', '甲', 'W001', 110, 80, 50, 70]
    ], '成绩');
    api.parseScoreRows([
      ['学校', '班级', '姓名', '考号', '语文'],
      ['白名单校', '8.1', '甲', 'W001', 120]
    ], '成绩');
    api.mergeDuplicateStudents();
    api.analyze();
    return {
      studentCount: state.students.length,
      duplicateStudents: state.importStats.duplicateStudents,
      subjects: api.getAnalysisSubjects(),
      totalSubjects: api.getTotalSubjects(),
      totalMax: api.getTotalMaxScore(),
      total: state.students[0].total,
      chinese: state.students[0].scores.语文,
      hasSportsScore: Number.isFinite(Number(state.students[0].scores.体育))
    };
  });

  const moduleConsistency = await page.evaluate(() => {
    const api = window.LocalSchoolAnalytics;
    const state = api.state;
    state.grade = 9;
    state.activeSchool = '模块校';
    state.subjects = ['语文', '数学', '英语', '物理', '化学'];
    state.students = [
      { school: '模块校', className: '9.1', name: '完整一', id: 'M001', rawScores: { 语文: 140, 数学: 135, 英语: 130, 物理: 88, 化学: 58 }, scores: {}, total: 0, ranks: {} },
      { school: '模块校', className: '9.1', name: '缺科生', id: 'M002', rawScores: { 语文: 120, 数学: 118, 英语: 110, 物理: 80 }, scores: {}, total: 0, ranks: {} },
      { school: '模块校', className: '9.2', name: '完整二', id: 'M003', rawScores: { 语文: 110, 数学: 108, 英语: 100, 物理: 76, 化学: 45 }, scores: {}, total: 0, ranks: {} }
    ];
    state.teachers = [
      { className: '9.1', subject: '语文', teacher: '语文甲' },
      { className: '9.2', subject: '语文', teacher: '语文乙' },
      { className: '9.3', subject: '语文', teacher: '错班教师' }
    ];
    api.analyze();
    const rankRows = api.buildStudentRankRows();
    const classOne = state.classRows.find((row) => row.className === '9.1');
    const missing = state.students.find((student) => student.name === '缺科生');
    return {
      totals: state.students.map((student) => ({ name: student.name, total: Number.isFinite(student.total) ? student.total : null, rank: student.ranks?.total?.grade || null })),
      classOne: {
        studentCount: classOne.studentCount,
        completeTotalCount: classOne.completeTotalCount,
        totalAvg: classOne.metrics.total.avg,
        absoluteScore: classOne.absoluteScore
      },
      missingExportTotal: rankRows.find((row) => row[1] === '缺科生').at(-3),
      teacherCount: state.finalTeacherRows.length,
      unmatchedCount: state.teacherCoverage.unmatched.length,
      missingSubjects: missing.totalMissingSubjects
    };
  });

  const multiColumnParsing = await page.evaluate(() => {
    const api = window.LocalSchoolAnalytics;
    const state = api.state;
    state.grade = 9;
    state.activeSchool = '考号';
    state.students = [];
    state.subjects = [];
    state.teachers = [];
    api.parseScoreRows([
      ['考号', '姓名', '班级', '语文一卷', '语文二卷', '语文总', '数学一卷', '数学二卷', '数学总', '数学折合', '英语一卷', '英语二卷', '英语总', '物理一卷', '物理二卷', '物理总', '化学一卷', '化学二卷', '化学总'],
      [1, '甲', '9.6', 20, 70, 90, 24, 60, 84, 105, 50, 70, 120, 20, 80, 100, 30, 70, 100],
      [2, '乙', '9.6', 22, 78.18, 100.18, 30, 66, 96, 120, 55, 75, 130, 25, 75, 100, 20, 60, 80],
      [3, '丙', '9.5', '', '', '', 18, 62, 80, 100, 40, 60, 100, 20, 60, 80, 20, 50, 70]
    ], '考号');
    api.analyze();
    const classRow = state.classRows.find((row) => row.className === '9.6');
    const blankClassRow = state.classRows.find((row) => row.className === '9.5');
    const class96Students = state.students.filter((student) => student.className === '9.6');
    state.blankScoreMode = 'exclude';
    api.analyze();
    const excludeBlankClassRow = state.classRows.find((row) => row.className === '9.5');
    state.blankScoreMode = 'zero';
    return {
      subjects: api.getAnalysisSubjects(),
      chineseAvg: Number(classRow.subjects.语文.avg.toFixed(2)),
      mathScores: class96Students.map((student) => student.scores.数学),
      physicsScores: class96Students.map((student) => student.scores.物理),
      chemistryScores: class96Students.map((student) => student.scores.化学),
      blankChineseAvg: blankClassRow.subjects.语文.avg,
      blankChineseCount: blankClassRow.subjects.语文.count,
      excludeBlankChineseAvg: excludeBlankClassRow.subjects.语文.avg,
      excludeBlankChineseCount: excludeBlankClassRow.subjects.语文.count,
      totals: class96Students.map((student) => student.total)
    };
  });

  await browser.close();

  if (errors.length) {
    throw new Error(`Browser errors:\n${errors.join('\n')}`);
  }
  if (!desktop.students || !desktop.teachers || !desktop.classRows || !desktop.teacherRows) {
    throw new Error(`Smoke failed: ${JSON.stringify(desktop)}`);
  }
  if (grade8Config.chineseMax !== 150
    || grade8Config.mathMax !== 150
    || grade8Config.englishMax !== 150
    || grade8Config.physicsMax !== 100
    || grade8Config.chemistryMax !== 100
    || grade8Config.politicsMax !== 100
    || grade8Config.historyMax !== 50
    || grade8Config.geographyMax !== 50
    || grade8Config.biologyMax !== 50
    || grade8Config.totalMax !== 900
    || !grade8Config.totalSubjects.includes('化学')
    || !grade8Config.classes.every((name) => String(name).startsWith('8.'))) {
    throw new Error(`Grade 8 full-score config failed: ${JSON.stringify(grade8Config)}`);
  }
  if (grade9Config.chineseMax !== 150
    || grade9Config.mathMax !== 150
    || grade9Config.englishMax !== 150
    || grade9Config.politicsMax !== 100
    || grade9Config.physicsMax !== 90
    || grade9Config.chemistryMax !== 60
    || grade9Config.totalMax !== 600) {
    throw new Error(`Grade 9 full-score config failed: ${JSON.stringify(grade9Config)}`);
  }
  if (grade9Normalization.totalMax !== 600
    || grade9Normalization.firstTotal !== 600
    || grade9Normalization.secondScores.物理 !== 72
    || grade9Normalization.secondScores.化学 !== 42
    || grade9Normalization.adjustments.物理.sourceMax !== 100
    || grade9Normalization.adjustments.物理.scale !== 0.9
    || grade9Normalization.adjustments.化学.sourceMax !== 100
    || grade9Normalization.adjustments.化学.scale !== 0.6
    || !grade9Normalization.summary.includes('物理100→90')
    || !grade9Normalization.summary.includes('化学100→60')) {
    throw new Error(`Grade 9 score normalization failed: ${JSON.stringify(grade9Normalization)}`);
  }
  if (explicitSourceMax.firstScores.物理 !== 79.2
    || explicitSourceMax.firstScores.化学 !== 30
    || explicitSourceMax.firstTotal !== 109.2
    || explicitSourceMax.adjustments.物理.sourceMax !== 100
    || explicitSourceMax.adjustments.化学.sourceMax !== 100
    || explicitSourceMax.adjustments.物理.scale !== 0.9
    || explicitSourceMax.adjustments.化学.scale !== 0.6) {
    throw new Error(`Explicit source max should not depend on observed max: ${JSON.stringify(explicitSourceMax)}`);
  }
  if (grade8Config.normalizedClasses.join('|') !== '6.10|6.10|6.10|8.10|6.10|6.10|9.6') {
    throw new Error(`Class normalization failed: ${JSON.stringify(grade8Config.normalizedClasses)}`);
  }
  if (!grade8Config.studentRankHeader.includes('物理校排') || !grade8Config.studentRankHeader.includes('总分校排')) {
    throw new Error(`Student rank export header failed: ${JSON.stringify(grade8Config.studentRankHeader)}`);
  }
  if (!desktop.canvasPixels.every(Boolean)) {
    throw new Error(`Chart canvas appears blank: ${JSON.stringify(desktop.canvasPixels)}`);
  }
  if (desktop.radarValues.some((value) => value > 100)) {
    throw new Error(`Radar chart should use percent-of-full-score values: ${JSON.stringify(desktop.radarValues)}`);
  }
  if (!suggestedName.includes('学生各科与总分排名') || !suggestedName.endsWith('.xlsx')) {
    throw new Error(`Student rank download failed: ${suggestedName}`);
  }
  if (mobile.hasHorizontalOverflow && mobile.width > 980) {
    throw new Error(`Unexpected mobile page overflow: ${JSON.stringify(mobile)}`);
  }
  if (edgeCases.teacherTitleRows.length !== 1 || edgeCases.teacherTitleRows[0].className !== '8.10') {
    throw new Error(`Teacher header detection failed: ${JSON.stringify(edgeCases.teacherTitleRows)}`);
  }
  if (edgeCases.wideTeacherRows.length !== 7
    || !edgeCases.wideTeacherRows.every((row) => row.className === '9.6')
    || !edgeCases.wideTeacherRows.some((row) => row.subject === '语文' && row.teacher === '语文乙')
    || !edgeCases.wideTeacherRows.some((row) => row.subject === '化学' && row.teacher === '化学甲')) {
    throw new Error(`Wide teacher roster parsing failed: ${JSON.stringify(edgeCases.wideTeacherRows)}`);
  }
  if (edgeCases.mergedTeacherRows.length !== 10
    || !edgeCases.mergedTeacherRows.some((row) => row.className === '9.2' && row.subject === '语文' && row.teacher === '李秀莉')
    || !edgeCases.mergedTeacherRows.some((row) => row.className === '9.2' && row.subject === '化学' && row.teacher === '张景旭')) {
    throw new Error(`Merged teacher roster parsing failed: ${JSON.stringify(edgeCases.mergedTeacherRows)}`);
  }
  if (edgeCases.analysisSubjects.join('|') !== '语文' || edgeCases.totalSubjects.join('|') !== '语文') {
    throw new Error(`Active school subject isolation failed: ${JSON.stringify(edgeCases)}`);
  }
  if (edgeCases.finalTeachers.join('|') !== '甲语文老师' || edgeCases.teacherRows.length !== 1 || edgeCases.unmatched.length !== 2) {
    throw new Error(`Teacher unmatched exclusion failed: ${JSON.stringify(edgeCases)}`);
  }
  if (edgeCases.rankHeader.some((header) => String(header).startsWith('物理'))) {
    throw new Error(`Student rank export should only include active-school subjects: ${JSON.stringify(edgeCases.rankHeader)}`);
  }
  if (moduleConsistency.totals.find((row) => row.name === '缺科生').total !== null
    || moduleConsistency.totals.find((row) => row.name === '缺科生').rank !== null
    || moduleConsistency.classOne.studentCount !== 2
    || moduleConsistency.classOne.completeTotalCount !== 1
    || moduleConsistency.missingExportTotal !== ''
    || !moduleConsistency.missingSubjects.includes('化学')
    || moduleConsistency.teacherCount !== 2
    || moduleConsistency.unmatchedCount !== 1
    || moduleConsistency.classOne.absoluteScore <= 0) {
    throw new Error(`Module consistency checks failed: ${JSON.stringify(moduleConsistency)}`);
  }
  if (duplicateAndWhitelist.studentCount !== 1
    || duplicateAndWhitelist.duplicateStudents !== 1
    || duplicateAndWhitelist.chinese !== 120
    || duplicateAndWhitelist.totalSubjects.join('|') !== '语文|物理'
    || duplicateAndWhitelist.totalMax !== 250
    || duplicateAndWhitelist.total !== 200
    || !duplicateAndWhitelist.hasSportsScore
    || !duplicateAndWhitelist.subjects.includes('体育')) {
    throw new Error(`Duplicate merge or 6-8 total whitelist failed: ${JSON.stringify(duplicateAndWhitelist)}`);
  }
  if (multiColumnParsing.chineseAvg !== 95.09
    || multiColumnParsing.mathScores.join('|') !== '105|120'
    || multiColumnParsing.physicsScores.join('|') !== '90|90'
    || multiColumnParsing.chemistryScores.join('|') !== '60|48'
    || multiColumnParsing.blankChineseAvg !== 0
    || multiColumnParsing.blankChineseCount !== 1
    || multiColumnParsing.excludeBlankChineseAvg !== 0
    || multiColumnParsing.excludeBlankChineseCount !== 0
    || multiColumnParsing.totals.some((value) => value > 600)) {
    throw new Error(`Multi-column score parsing failed: ${JSON.stringify(multiColumnParsing)}`);
  }

  console.log(JSON.stringify({ ok: true, desktop, mobile, edgeCases, grade9Normalization, explicitSourceMax, duplicateAndWhitelist, moduleConsistency, multiColumnParsing }, null, 2));
})();
