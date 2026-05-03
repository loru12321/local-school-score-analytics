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
    normalizedClasses: ['6.10班', '6年10班', '610', '10班', '六年级十班'].map((value) => window.LocalSchoolAnalytics.normalizeClass(value)),
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
    const state = api.state;
    state.grade = 8;
    state.activeSchool = '甲校';
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
      analysisSubjects: api.getAnalysisSubjects(),
      totalSubjects: api.getTotalSubjects(),
      finalTeachers: state.finalTeacherRows.map((row) => row.teacher),
      teacherRows: state.teacherRows.map((row) => ({ teacher: row.teacher, subject: row.subject, classes: row.classes, count: row.studentCount })),
      unmatched: state.teacherCoverage.unmatched,
      rankHeader: api.buildStudentRankRows()[0]
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
  if (grade8Config.normalizedClasses.join('|') !== '6.10|6.10|6.10|8.10|6.10') {
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
  if (edgeCases.analysisSubjects.join('|') !== '语文' || edgeCases.totalSubjects.join('|') !== '语文') {
    throw new Error(`Active school subject isolation failed: ${JSON.stringify(edgeCases)}`);
  }
  if (edgeCases.finalTeachers.join('|') !== '甲语文老师' || edgeCases.teacherRows.length !== 1 || edgeCases.unmatched.length !== 2) {
    throw new Error(`Teacher unmatched exclusion failed: ${JSON.stringify(edgeCases)}`);
  }
  if (edgeCases.rankHeader.some((header) => String(header).startsWith('物理'))) {
    throw new Error(`Student rank export should only include active-school subjects: ${JSON.stringify(edgeCases.rankHeader)}`);
  }

  console.log(JSON.stringify({ ok: true, desktop, mobile, edgeCases }, null, 2));
})();
