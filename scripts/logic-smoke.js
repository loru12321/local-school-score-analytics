const path = require('node:path');
const { pathToFileURL } = require('node:url');

const playwrightPath = 'C:/Users/loru/Desktop/system/school-system/node_modules/playwright';
const { chromium } = require(playwrightPath);

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto(pathToFileURL(path.resolve(__dirname, '..', 'index.html')).href);
  const result = await page.evaluate(async () => {
    const api = window.LocalSchoolAnalytics;
    const state = api.state;

    state.grade = 9;
    state.activeSchool = '映射校';
    state.scoreColumnOverrides = {};
    const source = api.buildScoreImportSource([
      ['学校', '班级', '姓名', '考号', '语文一卷', '语文二卷', '语文总', '数学'],
      ['映射校', '9.1', '甲', 'M001', 30, 60, 100, 120]
    ], { fileName: 'mapping.xlsx', sheetName: '成绩', sourceIndex: '0' });
    state.scoreImportSources = [source];
    api.parseScoreSources();
    const autoChinese = state.students[0].rawScores.语文;
    state.scoreColumnOverrides[api.scoreColumnOverrideKey(source.id, '语文')] = 4;
    api.parseScoreSources();
    const manualChinese = state.students[0].rawScores.语文;
    const mappingRows = state.scoreMappingRows.length;

    state.grade = 8;
    state.activeSchool = '方案校';
    state.examSchemes = { 8: { maxScores: { 体育: 60 }, totalSubjects: ['语文', '体育'] } };
    state.students = [
      { school: '方案校', className: '8.1', name: '甲', id: 'E001', rawScores: { 语文: 100, 体育: 50 }, scores: {}, total: 0, ranks: {} }
    ];
    state.subjects = ['语文', '体育'];
    state.teachers = [];
    api.analyze();
    const scheme = { totalSubjects: api.getTotalSubjects(), totalMax: api.getTotalMaxScore(), total: state.students[0].total };

    state.grade = 9;
    state.activeSchool = '走班校';
    state.examSchemes = {};
    state.students = [
      { school: '走班校', className: '9.1', name: '甲', id: 'A01', rawScores: { 语文: 120 }, scores: {}, total: 0, ranks: {} },
      { school: '走班校', className: '9.1', name: '乙', id: 'A02', rawScores: { 语文: 80 }, scores: {}, total: 0, ranks: {} }
    ];
    state.subjects = ['语文'];
    state.teachers = api.parseTeacherRows([
      ['班级', '学科', '教师姓名', '学生考号', '任课范围'],
      ['9.1', '语文', '分层教师', 'A01', 'A组']
    ]);
    api.analyze();
    const scopedTeacher = state.teacherRows[0];

    const distribution = api.buildDistributionRows();
    const reportRows = api.buildStudentReportRows(state.students[0]);
    const baseline = api.buildExamSnapshot('基准');
    state.examHistory = [baseline];
    state.selectedHistoryId = baseline.id;
    state.students[0].rawScores.语文 = 130;
    api.analyze();
    const comparisonRows = api.buildExamComparisonRows();
    const cloudPayload = api.buildCloudSnapshotPayload('云端测试', { id: '00000000-0000-0000-0000-000000000001' });
    const cohortYear = api.estimateCohortYear(9, new Date('2026-05-04T00:00:00+08:00'));
    const grade8CohortYear = api.estimateCohortYear(8, '2025-2026');
    const dateStringCohortYear = api.estimateCohortYear(9, '2026-05-04');
    const schoolYear = api.getSchoolYear(new Date('2026-05-04T00:00:00+08:00'));

    await new Promise((resolve, reject) => {
      const request = indexedDB.open('logic-smoke-db', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('items');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('items', 'readwrite');
        tx.objectStore('items').put({ ok: true }, 'latest');
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      };
    });

    return {
      autoChinese,
      manualChinese,
      mappingRows,
      scheme,
      scopedTeacher: {
        count: scopedTeacher.studentCount,
        scope: scopedTeacher.scopeText,
        risk: scopedTeacher.riskFlags
      },
      distributionLabels: distribution.map((row) => row.label),
      reportHasSubjectHeader: reportRows.some((row) => row[0] === '学科'),
      comparisonHasStudentGain: comparisonRows.some((row) => row[0] === '学生总分' && String(row[4]).startsWith('+')),
      cloudPayload: {
        grade: cloudPayload.grade,
        cohortYear: cloudPayload.cohort_year,
        schoolYear: cloudPayload.school_year,
        owner: cloudPayload.owner_id,
        hasAppSnapshot: Boolean(cloudPayload.snapshot?.app?.students?.length),
        hasExamSnapshot: Boolean(cloudPayload.snapshot?.exam?.students?.length)
      },
      cohortYear,
      grade8CohortYear,
      dateStringCohortYear,
      schoolYear
    };
  });

  await browser.close();
  if (errors.length) throw new Error(`Browser errors:\n${errors.join('\n')}`);
  if (result.autoChinese !== 100
    || result.manualChinese !== 30
    || result.mappingRows !== 2
    || result.scheme.totalSubjects.join('|') !== '语文|体育'
    || result.scheme.totalMax !== 210
    || result.scheme.total !== 150
    || result.scopedTeacher.count !== 1
    || result.scopedTeacher.scope !== 'A组'
    || !result.scopedTeacher.risk.includes('分组任课')
    || !result.distributionLabels.includes('语文')
    || !result.reportHasSubjectHeader
    || !result.comparisonHasStudentGain
    || result.cloudPayload.grade !== 9
    || result.cloudPayload.cohortYear !== 2022
    || result.cloudPayload.schoolYear !== '2025-2026'
    || result.cloudPayload.owner !== '00000000-0000-0000-0000-000000000001'
    || !result.cloudPayload.hasAppSnapshot
    || !result.cloudPayload.hasExamSnapshot
    || result.cohortYear !== 2022
    || result.grade8CohortYear !== 2023
    || result.dateStringCohortYear !== 2022
    || result.schoolYear !== '2025-2026') {
    throw new Error(`Logic smoke failed: ${JSON.stringify(result, null, 2)}`);
  }
  console.log(JSON.stringify({ ok: true, ...result }, null, 2));
})();
