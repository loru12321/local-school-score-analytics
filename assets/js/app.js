(() => {
    const SUBJECT_ORDER = ['语文', '数学', '英语', '物理', '化学', '政治', '历史', '地理', '生物', '科学', '体育'];
    const SUBJECT_ALIASES = new Map([
        ['语文', '语文'],
        ['数学', '数学'],
        ['英语', '英语'],
        ['物理', '物理'],
        ['化学', '化学'],
        ['政治', '政治'],
        ['道法', '政治'],
        ['道德与法治', '政治'],
        ['思政', '政治'],
        ['历史', '历史'],
        ['地理', '地理'],
        ['生物', '生物'],
        ['生物学', '生物'],
        ['科学', '科学'],
        ['体育', '体育']
    ]);
    const SUBJECT_HEADER_EXCLUDES = ['排名', '名次', '排位', '等级', '赋分', '折算', '标准分', '相对分', '序号'];
    const NAME_ALIASES = ['姓名', '学生姓名', '考生姓名', '学生', 'name'];
    const ID_ALIASES = ['考号', '学号', '准考证号', '考生号', 'id'];
    const CLASS_ALIASES = ['班级', '班别', '班号', '行政班', '教学班', '班', 'class'];
    const SCHOOL_ALIASES = ['学校', '学校名称', '校名', '参考单位', '单位名称', '毕业学校', '所在学校'];
    const TEACHER_ALIASES = ['教师姓名', '老师', '教师', '任课教师', '姓名'];
    const TEACHER_ID_ALIASES = ['教师编号', '教师工号', '工号', '编号', '手机号', '电话', '联系方式', 'teacherid', 'teacher_id'];
    const TEACHER_SCOPE_ALIASES = ['任课范围', '授课范围', '分组', '层次', '走班', '备注', 'scope'];
    const TEACHER_STUDENT_ID_ALIASES = ['学生考号', '考号名单', '学号名单', '学生编号', 'studentids', 'student_ids'];
    const TEACHER_STUDENT_NAME_ALIASES = ['学生名单', '姓名名单', '学生姓名', 'studentnames', 'student_names'];
    const TEACHER_WEIGHT_ALIASES = ['任课比例', '任课权重', '承担比例', '课时比例', '权重', '比例', 'weight'];
    const ROSTER_STATUS_ALIASES = ['参考状态', '考试状态', '状态', '备注', 'status'];
    const ZERO_WORDS = ['缺', 'ABS', '作弊', '违纪', '病假', '缓考', '取消', '零分', 'Q', 'CHE'];
    const SCORE_STATUS_RULES = [
        { key: 'blank', label: '空白', regex: /^$/ },
        { key: 'absent', label: '缺考', regex: /缺考|缺|ABS|未考|未参考|N\/A/ },
        { key: 'exempt', label: '免考', regex: /免考|免试/ },
        { key: 'cheat', label: '作弊/违纪', regex: /作弊|违纪|取消|CHE/ },
        { key: 'deferred', label: '缓考/病假', regex: /缓考|病假|请假/ },
        { key: 'transfer', label: '转入未考', regex: /转入|新转|借读/ },
        { key: 'trueZero', label: '真实0分', regex: /^0(?:\.0+)?$/ }
    ];
    const DEFAULT_EVALUATION_WEIGHTS = {
        classRelative: 36,
        classAbsolute: 26,
        classBalance: 14,
        classDevelopment: 24,
        classLowPenalty: 12,
        teacherQuality: 78,
        teacherRelative: 10,
        teacherHistory: 4,
        teacherConversion: 8
    };
    const EVALUATION_WEIGHT_LABELS = {
        classRelative: '班级相对两率一分',
        classAbsolute: '班级绝对达成',
        classBalance: '班级学科均衡',
        classDevelopment: '班级托底发展',
        classLowPenalty: '班级低分率扣分系数',
        teacherQuality: '教师质量分',
        teacherRelative: '教师学科内相对分',
        teacherHistory: '教师历史进步校正',
        teacherConversion: '教师临界转化'
    };
    const SCORE_REASON_LABELS = Object.fromEntries([
        ...SCORE_STATUS_RULES.map((rule) => [rule.key, rule.label]),
        ['present', '正常参考']
    ]);
    const SCORE_BAND_RULES = [
        { key: 'excellent', label: '优秀段', text: '优秀段(≥85%)', minRate: 0.85, maxRate: Infinity },
        { key: 'good', label: '良好段', text: '良好段(75%-85%)', minRate: 0.75, maxRate: 0.85 },
        { key: 'pass', label: '及格段', text: '及格段(60%-75%)', minRate: 0.6, maxRate: 0.75 },
        { key: 'low', label: '低分段', text: '低分段(<60%)', minRate: -Infinity, maxRate: 0.6 }
    ];
    const CORE_GRADE9 = ['语文', '数学', '英语', '物理', '化学'];
    const STANDARD_FULL_MARKS = [30, 40, 50, 60, 70, 80, 90, 100, 120, 150, 160, 180, 200];
    const LOCAL_KEY = 'LOCAL_SCHOOL_SCORE_ANALYTICS_V1';
    const LOCAL_DB_NAME = 'LOCAL_SCHOOL_SCORE_ANALYTICS_DB';
    const LOCAL_DB_STORE = 'snapshots';
    const LOCAL_DB_KEY = 'latest';
    const CLOUD_CONFIG_KEY = 'LOCAL_SCHOOL_SCORE_ANALYTICS_SUPABASE_CONFIG';
    const CLOUD_SNAPSHOT_VERSION = 1;
    const HISTORY_LIMIT = 12;

    const GRADE_CONFIG = {
        6: {
            label: '6 年级',
            totalLabel: '全科总',
            excRatio: 0.2,
            weights: { avg: 60, exc: 70, pass: 70 },
            templateSubjects: ['语文', '数学', '英语', '政治', '历史', '地理', '生物'],
            maxScores: { '语文': 150, '数学': 150, '英语': 150, '政治': 100, '历史': 50, '地理': 50, '生物': 50 },
            sourceMaxScores: {}
        },
        7: {
            label: '7 年级',
            totalLabel: '全科总',
            excRatio: 0.2,
            weights: { avg: 60, exc: 70, pass: 70 },
            templateSubjects: ['语文', '数学', '英语', '政治', '历史', '地理', '生物'],
            maxScores: { '语文': 150, '数学': 150, '英语': 150, '政治': 100, '历史': 50, '地理': 50, '生物': 50 },
            sourceMaxScores: {}
        },
        8: {
            label: '8 年级',
            totalLabel: '全科总',
            excRatio: 0.2,
            weights: { avg: 60, exc: 70, pass: 70 },
            templateSubjects: ['语文', '数学', '英语', '物理', '化学', '政治', '历史', '地理', '生物'],
            maxScores: { '语文': 150, '数学': 150, '英语': 150, '物理': 100, '化学': 100, '政治': 100, '历史': 50, '地理': 50, '生物': 50 },
            sourceMaxScores: { '物理': 100, '化学': 100 }
        },
        9: {
            label: '9 年级',
            totalLabel: '五科总',
            excRatio: 0.15,
            weights: { avg: 50, exc: 80, pass: 50 },
            templateSubjects: ['语文', '数学', '英语', '物理', '化学', '政治', '历史', '体育'],
            maxScores: { '语文': 150, '数学': 150, '英语': 150, '物理': 90, '化学': 60, '政治': 100, '历史': 60, '体育': 50 },
            sourceMaxScores: { '物理': 100, '化学': 100 }
        }
    };

    const state = {
        grade: 9,
        activeSchool: '',
        students: [],
        subjects: [],
        thresholds: {},
        blankScoreMode: 'zero',
        sourceMaxOverrides: {},
        examSchemes: {},
        scoreImportSources: [],
        scoreColumnOverrides: {},
        scoreMappingRows: [],
        analysisConfirmed: false,
        analysisGate: { blocks: [], warnings: [], infos: [] },
        subjectSourceHints: {},
        importStats: { duplicateStudents: 0, duplicateConflicts: [] },
        referenceRoster: [],
        rosterDiagnostics: { missingFromScores: [], extraInScores: [], statusCounts: {} },
        examSchemeTemplates: [],
        evaluationWeights: { ...DEFAULT_EVALUATION_WEIGHTS },
        weightConfigLocked: false,
        teachers: [],
        teacherRankSubjects: [],
        teacherRankSubjectsCustom: false,
        teacherDiagnostics: { sameName: [], rankedSubjects: [], excludedSubjects: [], teacherCount: 0 },
        importDiagnostics: {},
        classRows: [],
        subjectRows: [],
        teacherRows: [],
        finalTeacherRows: [],
        studentAlerts: [],
        scoreAdjustments: {},
        teacherCoverage: { matched: 0, unmatched: [] },
        selectedClassName: '',
        selectedStudentKey: '',
        selectedTeacherKey: '',
        examHistory: [],
        selectedHistoryId: '',
        cloudConfig: { url: '', anonKey: '' },
        cloudUser: null,
        cloudSnapshots: [],
        cloudHistoryScope: 'cohort',
        selectedCloudSnapshotId: '',
        anonymizeSalt: 'local-school',
        performanceStats: { lastAnalyzeMs: 0, studentCount: 0, subjectCount: 0 },
        charts: {},
        logs: []
    };

    const els = {};
    let supabaseClient = null;
    let supabaseClientKey = '';

    document.addEventListener('DOMContentLoaded', () => {
        cacheElements();
        restoreCloudConfig();
        bindEvents();
        refreshCloudUser().catch(() => renderCloudPanel());
        renderAll();
    });

    function cacheElements() {
        [
            'metric-grid', 'analysis-status', 'class-total-chart', 'subject-radar-chart', 'insight-grid',
            'score-file', 'teacher-file', 'score-file-name', 'teacher-file-name', 'import-log',
            'class-table', 'subject-matrix-table', 'teacher-final-table', 'teacher-detail-table',
            'teacher-status', 'pair-list', 'student-class-filter', 'student-subject-filter',
            'student-search', 'student-table', 'student-alert-grid', 'rail-grade-label', 'rail-total-label',
            'topbar-copy', 'school-select', 'subject-radar-note', 'blank-score-mode', 'score-rule-table',
            'teacher-rank-subject-list', 'score-mapping-table', 'reset-exam-scheme-btn',
            'preflight-panel', 'confirm-analysis-btn', 'roster-file', 'roster-file-name', 'parse-roster-btn',
            'scheme-name', 'save-scheme-btn', 'scheme-template-select', 'apply-scheme-btn',
            'weight-config-table', 'lock-weight-config',
            'class-drilldown-select', 'class-drilldown-panel', 'distribution-table',
            'student-report-card', 'export-student-report-btn',
            'teacher-explain-select', 'teacher-explain-panel',
            'export-report-btn', 'history-name', 'save-history-btn', 'history-select', 'comparison-panel',
            'score-band-chart', 'export-html-report-btn', 'export-anonymous-btn', 'clear-local-db-btn', 'privacy-panel',
            'cloud-url', 'cloud-anon-key', 'cloud-email', 'cloud-password', 'cloud-exam-date', 'cloud-school-year', 'save-cloud-config-btn',
            'cloud-login-btn', 'cloud-logout-btn', 'cloud-sync-btn', 'cloud-refresh-btn', 'cloud-history-scope', 'cloud-history-select',
            'cloud-use-baseline-btn', 'cloud-restore-btn', 'cloud-status', 'cloud-panel'
        ].forEach((id) => {
            els[toCamel(id)] = document.getElementById(id);
        });
    }

    function bindEvents() {
        document.querySelectorAll('[data-view-target]').forEach((node) => {
            node.addEventListener('click', () => switchView(node.dataset.viewTarget));
        });

        document.querySelectorAll('#grade-segment button').forEach((button) => {
            button.addEventListener('click', () => {
                document.querySelectorAll('#grade-segment button').forEach((item) => item.classList.remove('active'));
                button.classList.add('active');
                state.grade = Number(button.dataset.grade);
                state.teacherRankSubjects = [];
                state.teacherRankSubjectsCustom = false;
                state.analysisConfirmed = false;
                log(`切换到 ${currentConfig().label}，总分口径为 ${currentConfig().totalLabel}。`);
                analyze();
                renderAll();
            });
        });

        els.scoreFile.addEventListener('change', () => {
            els.scoreFileName.textContent = fileListText(els.scoreFile.files);
        });
        els.teacherFile.addEventListener('change', () => {
            els.teacherFileName.textContent = fileListText(els.teacherFile.files);
        });
        if (els.rosterFile) {
            els.rosterFile.addEventListener('change', () => {
                els.rosterFileName.textContent = fileListText(els.rosterFile.files);
            });
        }

        document.getElementById('parse-score-btn').addEventListener('click', async () => {
            if (!els.scoreFile.files.length) return toast('请选择成绩文件。', 'warn');
            await loadScoreFiles(Array.from(els.scoreFile.files));
        });
        document.getElementById('parse-teacher-btn').addEventListener('click', async () => {
            if (!els.teacherFile.files.length) return toast('请选择教师任课表。', 'warn');
            await loadTeacherFile(els.teacherFile.files[0]);
        });
        if (els.parseRosterBtn) {
            els.parseRosterBtn.addEventListener('click', async () => {
                if (!els.rosterFile.files.length) return toast('请选择参考名单文件。', 'warn');
                await loadRosterFile(els.rosterFile.files[0]);
            });
        }
        document.getElementById('download-score-template-btn').addEventListener('click', downloadScoreTemplate);
        document.getElementById('download-teacher-template-btn').addEventListener('click', downloadTeacherTemplate);
        document.getElementById('sample-data-btn').addEventListener('click', loadSampleData);
        document.getElementById('save-local-btn').addEventListener('click', saveLocal);
        document.getElementById('restore-local-btn').addEventListener('click', restoreLocal);
        document.getElementById('clear-data-btn').addEventListener('click', clearData);
        document.getElementById('export-workbook-btn').addEventListener('click', exportWorkbook);
        document.getElementById('export-student-ranks-btn').addEventListener('click', exportStudentRanksWorkbook);
        if (els.blankScoreMode) {
            els.blankScoreMode.addEventListener('change', () => {
                state.blankScoreMode = els.blankScoreMode.value;
                state.analysisConfirmed = false;
                analyze();
                renderAll();
                log(`空白成绩口径切换为：${getBlankScoreModeText()}。`);
            });
        }
        if (els.scoreRuleTable) {
            els.scoreRuleTable.addEventListener('change', (event) => {
                const maxInput = event.target.closest('[data-target-max-subject]');
                if (maxInput) {
                    const subject = maxInput.dataset.targetMaxSubject;
                    const value = Number(maxInput.value);
                    const scheme = ensureExamSchemeOverride();
                    if (Number.isFinite(value) && value > 0) scheme.maxScores[subject] = value;
                    else delete scheme.maxScores[subject];
                    state.analysisConfirmed = false;
                    analyze();
                    renderAll();
                    log(`${subject} 配置满分调整为 ${Number.isFinite(value) && value > 0 ? value : '默认'}。`);
                    return;
                }
                const totalInput = event.target.closest('[data-total-subject]');
                if (totalInput) {
                    const subject = totalInput.dataset.totalSubject;
                    const scheme = ensureExamSchemeOverride();
                    const set = new Set(Array.isArray(scheme.totalSubjects) ? scheme.totalSubjects : getDefaultTotalSubjectsForGrade(state.grade));
                    if (totalInput.checked) set.add(subject);
                    else set.delete(subject);
                    scheme.totalSubjects = sortSubjects(Array.from(set));
                    state.analysisConfirmed = false;
                    analyze();
                    renderAll();
                    log(`${subject} ${totalInput.checked ? '纳入' : '移出'}${currentConfig().totalLabel}。`);
                    return;
                }
                const input = event.target.closest('[data-source-max-subject]');
                if (!input) return;
                const subject = input.dataset.sourceMaxSubject;
                const value = Number(input.value);
                const key = sourceMaxOverrideKey(subject);
                if (Number.isFinite(value) && value > 0) state.sourceMaxOverrides[key] = value;
                else delete state.sourceMaxOverrides[key];
                state.analysisConfirmed = false;
                analyze();
                renderAll();
                log(`${subject} 原始满分调整为 ${Number.isFinite(value) && value > 0 ? value : '自动'}。`);
            });
        }
        if (els.resetExamSchemeBtn) {
            els.resetExamSchemeBtn.addEventListener('click', () => {
                delete state.examSchemes[state.grade];
                state.sourceMaxOverrides = Object.fromEntries(Object.entries(state.sourceMaxOverrides || {}).filter(([key]) => !key.startsWith(`${state.grade}__`)));
                state.analysisConfirmed = false;
                analyze();
                renderAll();
                log(`${currentConfig().label} 已恢复默认考试口径。`);
            });
        }
        if (els.confirmAnalysisBtn) {
            els.confirmAnalysisBtn.addEventListener('click', () => {
                buildAnalysisGate();
                if (state.analysisGate.blocks.length) {
                    toast(`仍有 ${state.analysisGate.blocks.length} 项阻断问题，先修正后再确认。`, 'warn');
                    renderPreflightPanel();
                    return;
                }
                state.analysisConfirmed = true;
                log('已确认导入检查，当前分析标记为正式分析。');
                renderAll();
            });
        }
        if (els.saveSchemeBtn) {
            els.saveSchemeBtn.addEventListener('click', () => saveCurrentExamSchemeTemplate());
        }
        if (els.applySchemeBtn) {
            els.applySchemeBtn.addEventListener('click', () => applySelectedExamSchemeTemplate());
        }
        if (els.lockWeightConfig) {
            els.lockWeightConfig.addEventListener('change', () => {
                state.weightConfigLocked = Boolean(els.lockWeightConfig.checked);
                log(`评价权重已${state.weightConfigLocked ? '锁定' : '解锁'}。`);
                renderWeightConfig();
            });
        }
        if (els.weightConfigTable) {
            els.weightConfigTable.addEventListener('change', (event) => {
                const input = event.target.closest('[data-weight-key]');
                if (!input || state.weightConfigLocked) return;
                const value = Number(input.value);
                if (Number.isFinite(value) && value >= 0) {
                    state.evaluationWeights[input.dataset.weightKey] = value;
                    state.analysisConfirmed = false;
                    analyze();
                    renderAll();
                    log(`评价权重 ${input.dataset.weightKey} 调整为 ${value}。`);
                }
            });
        }
        if (els.scoreMappingTable) {
            els.scoreMappingTable.addEventListener('change', (event) => {
                const select = event.target.closest('[data-score-map-subject]');
                if (!select) return;
                const key = scoreColumnOverrideKey(select.dataset.sourceId, select.dataset.scoreMapSubject);
                if (select.value === 'auto') delete state.scoreColumnOverrides[key];
                else state.scoreColumnOverrides[key] = Number(select.value);
                state.analysisConfirmed = false;
                parseScoreSources();
                renderAll();
                log(`${select.dataset.scoreMapSubject} 成绩列映射已更新。`);
            });
        }
        if (els.teacherRankSubjectList) {
            els.teacherRankSubjectList.addEventListener('change', (event) => {
                const input = event.target.closest('[data-teacher-rank-subject]');
                if (!input) return;
                const subject = input.dataset.teacherRankSubject;
                const set = new Set(state.teacherRankSubjectsCustom ? state.teacherRankSubjects : getDefaultTeacherRankSubjects());
                if (input.checked) set.add(subject);
                else set.delete(subject);
                state.teacherRankSubjects = sortSubjects(Array.from(set));
                state.teacherRankSubjectsCustom = true;
                state.analysisConfirmed = false;
                analyze();
                renderAll();
                log(`教师总榜科目调整为：${getTeacherRankSubjects().join('、') || '无'}。`);
            });
        }
        els.schoolSelect.addEventListener('change', () => {
            state.activeSchool = els.schoolSelect.value;
            state.analysisConfirmed = false;
            log(`切换分析学校：${state.activeSchool || '全部'}。`);
            analyze();
            renderAll();
        });

        [els.studentClassFilter, els.studentSubjectFilter, els.studentSearch].forEach((node) => {
            node.addEventListener('input', renderStudentTable);
            node.addEventListener('change', renderStudentTable);
        });
        if (els.studentTable) {
            els.studentTable.addEventListener('click', (event) => {
                const button = event.target.closest('[data-student-report-key]');
                if (!button) return;
                state.selectedStudentKey = button.dataset.studentReportKey;
                renderStudentReport();
            });
        }
        if (els.exportStudentReportBtn) {
            els.exportStudentReportBtn.addEventListener('click', exportStudentReportWorkbook);
        }
        if (els.classDrilldownSelect) {
            els.classDrilldownSelect.addEventListener('change', () => {
                state.selectedClassName = els.classDrilldownSelect.value;
                renderClassDrilldown();
            });
        }
        if (els.teacherExplainSelect) {
            els.teacherExplainSelect.addEventListener('change', () => {
                state.selectedTeacherKey = els.teacherExplainSelect.value;
                renderTeacherExplanation();
            });
        }
        if (els.exportReportBtn) {
            els.exportReportBtn.addEventListener('click', exportReportWorkbook);
        }
        if (els.exportHtmlReportBtn) {
            els.exportHtmlReportBtn.addEventListener('click', exportHtmlReport);
        }
        if (els.exportAnonymousBtn) {
            els.exportAnonymousBtn.addEventListener('click', exportAnonymousWorkbook);
        }
        if (els.clearLocalDbBtn) {
            els.clearLocalDbBtn.addEventListener('click', clearLocalStorageData);
        }
        if (els.saveHistoryBtn) {
            els.saveHistoryBtn.addEventListener('click', () => saveCurrentExamToHistory());
        }
        if (els.historySelect) {
            els.historySelect.addEventListener('change', () => {
                state.selectedHistoryId = els.historySelect.value;
                renderExamComparison();
            });
        }
        if (els.saveCloudConfigBtn) els.saveCloudConfigBtn.addEventListener('click', saveCloudConfig);
        if (els.cloudLoginBtn) els.cloudLoginBtn.addEventListener('click', loginOrRegisterCloud);
        if (els.cloudLogoutBtn) els.cloudLogoutBtn.addEventListener('click', logoutCloud);
        if (els.cloudSyncBtn) els.cloudSyncBtn.addEventListener('click', syncCurrentExamToCloud);
        if (els.cloudRefreshBtn) els.cloudRefreshBtn.addEventListener('click', loadCloudSnapshots);
        if (els.cloudExamDate) {
            els.cloudExamDate.addEventListener('change', () => {
                const examDate = getCloudExamDate();
                if (els.cloudSchoolYear) els.cloudSchoolYear.value = getSchoolYear(parseDateInput(examDate));
                refreshCloudHistoryScopeView();
            });
        }
        if (els.cloudSchoolYear) els.cloudSchoolYear.addEventListener('change', refreshCloudHistoryScopeView);
        if (els.cloudHistoryScope) {
            els.cloudHistoryScope.addEventListener('change', () => {
                state.cloudHistoryScope = cleanText(els.cloudHistoryScope.value) || 'cohort';
                refreshCloudHistoryScopeView();
            });
        }
        if (els.cloudHistorySelect) {
            els.cloudHistorySelect.addEventListener('change', () => {
                state.selectedCloudSnapshotId = els.cloudHistorySelect.value;
                renderCloudPanel();
            });
        }
        if (els.cloudUseBaselineBtn) els.cloudUseBaselineBtn.addEventListener('click', useCloudSnapshotAsBaseline);
        if (els.cloudRestoreBtn) els.cloudRestoreBtn.addEventListener('click', restoreCloudSnapshot);
    }

    function switchView(id) {
        document.querySelectorAll('.view').forEach((view) => view.classList.toggle('active', view.id === id));
        document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.viewTarget === id));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async function loadScoreFiles(files) {
        try {
            resetScoreDataForImport();
            state.teacherRankSubjects = [];
            state.teacherRankSubjectsCustom = false;
            state.scoreImportSources = [];
            state.scoreColumnOverrides = {};
            state.analysisConfirmed = false;
            for (const [fileIndex, file] of files.entries()) {
                const buffer = await file.arrayBuffer();
                const workbook = XLSX.read(buffer, { type: 'array' });
                workbook.SheetNames.forEach((sheetName, sheetIndex) => {
                    const rows = worksheetToRows(workbook.Sheets[sheetName]);
                    state.scoreImportSources.push(buildScoreImportSource(rows, {
                        fileName: file.name,
                        sheetName,
                        sourceIndex: `${fileIndex}-${sheetIndex}`
                    }));
                });
            }
            parseScoreSources();
            log(`成绩导入完成：${state.students.length} 名学生，${getAnalysisStudents().length} 名进入当前年级分析，${getClasses().length} 个班级，${getAnalysisSubjects().length} 个学科${state.importStats.duplicateStudents ? `，合并重复 ${state.importStats.duplicateStudents} 条` : ''}${state.importStats.duplicateConflicts.length ? `，发现冲突 ${state.importStats.duplicateConflicts.length} 项` : ''}。`);
            toast('成绩解析完成。', 'ok');
            renderAll();
        } catch (error) {
            console.error(error);
            toast(`成绩解析失败：${error.message}`, 'warn');
        }
    }

    function resetScoreDataForImport() {
        state.students = [];
        state.subjects = [];
        state.thresholds = {};
        state.subjectSourceHints = {};
        state.importStats = { duplicateStudents: 0, duplicateConflicts: [] };
        state.scoreMappingRows = [];
        state.selectedClassName = '';
        state.selectedStudentKey = '';
        state.analysisGate = { blocks: [], warnings: [], infos: [] };
    }

    function buildScoreImportSource(rows, meta) {
        const headerIndex = findHeaderRow(rows);
        const headers = headerIndex >= 0 ? (rows[headerIndex] || []).map((cell) => cleanHeader(cell)) : [];
        return {
            id: `${cleanText(meta.fileName || '文件')}__${cleanText(meta.sheetName || 'Sheet')}__${meta.sourceIndex || state.scoreImportSources.length}`,
            fileName: cleanText(meta.fileName || '成绩文件'),
            sheetName: cleanText(meta.sheetName || 'Sheet'),
            defaultSchool: cleanText(meta.sheetName || meta.fileName || '成绩'),
            rows,
            headerIndex,
            headers,
            subjectColumns: buildSubjectColumns(headers)
        };
    }

    function parseScoreSources() {
        const sources = state.scoreImportSources.slice();
        resetScoreDataForImport();
        state.scoreImportSources = sources;
        sources.forEach((source) => {
            parseScoreRows(source.rows, source.defaultSchool, { sourceId: source.id });
        });
        state.subjects = sortSubjects([...new Set(state.subjects)]);
        mergeDuplicateStudents();
        ensureActiveSchool();
        analyze();
    }

    async function loadTeacherFile(file) {
        try {
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: 'array' });
            const teachers = [];
            workbook.SheetNames.forEach((sheetName) => {
                const rows = worksheetToRows(workbook.Sheets[sheetName]);
                teachers.push(...parseTeacherRows(rows));
            });
            state.teachers = uniqueTeacherAssignments(teachers);
            state.analysisConfirmed = false;
            ensureActiveSchool();
            analyze();
            log(`任课表导入完成：${state.teachers.length} 条班级-学科-教师映射。`);
            toast('任课表解析完成。', 'ok');
            renderAll();
        } catch (error) {
            console.error(error);
            toast(`任课表解析失败：${error.message}`, 'warn');
        }
    }

    async function loadRosterFile(file) {
        try {
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: 'array' });
            const roster = [];
            workbook.SheetNames.forEach((sheetName) => {
                const rows = worksheetToRows(workbook.Sheets[sheetName]);
                roster.push(...parseRosterRows(rows, sheetName));
            });
            state.referenceRoster = uniqueBy(roster, (item) => referenceKey(item));
            state.analysisConfirmed = false;
            analyze();
            log(`参考名单导入完成：${state.referenceRoster.length} 人。`);
            toast('参考名单解析完成。', 'ok');
            renderAll();
        } catch (error) {
            console.error(error);
            toast(`参考名单解析失败：${error.message}`, 'warn');
        }
    }

    function worksheetToRows(sheet) {
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        return fillMergedRows(rows, sheet?.['!merges'] || []);
    }

    function fillMergedRows(rows, merges = []) {
        if (!Array.isArray(rows) || !Array.isArray(merges)) return rows;
        merges.forEach((range) => {
            const value = rows[range.s.r]?.[range.s.c];
            if (isBlankScoreCell(value)) return;
            for (let rowIndex = range.s.r; rowIndex <= range.e.r; rowIndex += 1) {
                if (!rows[rowIndex]) rows[rowIndex] = [];
                for (let columnIndex = range.s.c; columnIndex <= range.e.c; columnIndex += 1) {
                    if (isBlankScoreCell(rows[rowIndex][columnIndex])) {
                        rows[rowIndex][columnIndex] = value;
                    }
                }
            }
        });
        return rows;
    }

    function parseScoreRows(rows, defaultSchool, options = {}) {
        if (!Array.isArray(rows) || rows.length < 2) return;
        const headerIndex = findHeaderRow(rows);
        if (headerIndex === -1) return;
        const headers = rows[headerIndex].map((cell) => cleanHeader(cell));
        const subjectColumns = resolveSubjectColumnsForSource(buildSubjectColumns(headers), options.sourceId);
        const idx = {
            name: findBestHeader(headers, NAME_ALIASES),
            id: findBestHeader(headers, ID_ALIASES),
            className: findBestHeader(headers, CLASS_ALIASES),
            school: findBestHeader(headers, SCHOOL_ALIASES),
            subjects: subjectColumns
        };

        Object.keys(idx.subjects).forEach((subject) => {
            if (!state.subjects.includes(subject)) state.subjects.push(subject);
        });
        registerScoreMappingRows(options.sourceId, defaultSchool, headers, idx.subjects);

        if (idx.name === -1) return;
        for (let rowIndex = headerIndex + 1; rowIndex < rows.length; rowIndex += 1) {
            const row = rows[rowIndex] || [];
            const name = cleanName(row[idx.name]);
            if (!name || name === '姓名') continue;
            const className = normalizeClass(row[idx.className]);
            const student = {
                school: cleanText(idx.school >= 0 ? row[idx.school] : '') || inferDefaultSchool(defaultSchool),
                className: className || '未分班',
                name,
                id: cleanText(idx.id >= 0 ? row[idx.id] : ''),
                rawScores: {},
                blankScores: {},
                absentScores: {},
                scoreReasons: {},
                scoreMeta: {},
                scores: {},
                total: 0,
                validCount: 0,
                ranks: {}
            };

            let hasScore = false;
            Object.entries(idx.subjects).forEach(([subject, columnGroup]) => {
                const cells = selectSubjectScoreCells(row, columnGroup);
                let sum = 0;
                let valid = false;
                let allBlank = true;
                let hasAbsent = false;
                const reasonCounts = {};
                cells.forEach(({ index: columnIndex, value: cellValue }) => {
                    const status = detectScoreStatus(cellValue);
                    if (status.key !== 'blank') allBlank = false;
                    if (['absent', 'exempt', 'cheat', 'deferred', 'transfer'].includes(status.key)) hasAbsent = true;
                    reasonCounts[status.key] = Number(reasonCounts[status.key] || 0) + 1;
                    const score = parseScore(cellValue, true);
                    if (Number.isFinite(score)) {
                        sum += score;
                        valid = true;
                    }
                });
                if (valid) {
                    student.rawScores[subject] = round(sum);
                    student.blankScores[subject] = allBlank;
                    student.absentScores[subject] = hasAbsent;
                    student.scoreReasons[subject] = pickDominantScoreReason(reasonCounts);
                    student.scoreMeta[subject] = {
                        allBlank,
                        hasAbsent,
                        sourceHint: getScoreSourceHint(headers, cells),
                        columns: cells.map((cell) => cleanText(headers[cell.index])).filter(Boolean)
                    };
                    registerSubjectSourceHint(subject, student.scoreMeta[subject].sourceHint);
                    student.scores[subject] = round(sum);
                    student.validCount += 1;
                    hasScore = true;
                }
            });
            if (hasScore) state.students.push(student);
        }
    }

    function resolveSubjectColumnsForSource(subjectColumns, sourceId) {
        if (!sourceId) return subjectColumns;
        const result = {};
        Object.entries(subjectColumns).forEach(([subject, columnGroup]) => {
            const override = state.scoreColumnOverrides?.[scoreColumnOverrideKey(sourceId, subject)];
            if (Number.isInteger(Number(override)) && Number(override) >= 0) {
                result[subject] = {
                    final: [Number(override)],
                    components: [],
                    candidates: columnGroup.candidates || []
                };
                return;
            }
            result[subject] = columnGroup;
        });
        return result;
    }

    function registerScoreMappingRows(sourceId, defaultSchool, headers, subjectColumns) {
        if (!sourceId) return;
        const source = state.scoreImportSources.find((item) => item.id === sourceId);
        Object.entries(source?.subjectColumns || subjectColumns).forEach(([subject, baseGroup]) => {
            const currentGroup = subjectColumns[subject] || baseGroup;
            const override = state.scoreColumnOverrides?.[scoreColumnOverrideKey(sourceId, subject)];
            state.scoreMappingRows.push({
                sourceId,
                fileName: source?.fileName || defaultSchool || '',
                sheetName: source?.sheetName || defaultSchool || '',
                subject,
                autoColumns: describeSubjectColumnSelection(headers, baseGroup),
                currentColumns: describeSubjectColumnSelection(headers, currentGroup),
                sourceHint: getScoreSourceHint(headers, selectSubjectScoreCells([], currentGroup)),
                override: Number.isInteger(Number(override)) ? Number(override) : null,
                candidates: baseGroup.candidates || []
            });
        });
    }

    function selectSubjectScoreCells(row, columnGroup) {
        if (Array.isArray(columnGroup)) {
            return columnGroup.map((index) => ({ index, value: row[index] }));
        }
        const finalCells = (columnGroup.final || []).map((index) => ({ index, value: row[index] }));
        const componentCells = (columnGroup.components || []).map((index) => ({ index, value: row[index] }));
        const finalHasValue = finalCells.some((cell) => !isBlankScoreCell(cell.value));
        if (finalHasValue || !componentCells.length) return finalCells.length ? finalCells : componentCells;
        const componentHasValue = componentCells.some((cell) => !isBlankScoreCell(cell.value));
        return componentHasValue ? componentCells : finalCells;
    }

    function getScoreSourceHint(headers, cells) {
        const names = cells.map((cell) => cleanText(headers[cell.index])).join(' ');
        if (/折合|折算|折后|折分|赋分/.test(names)) return 'converted';
        if (/卷面|原始|原分|一卷|二卷|三卷|客观|主观|选择|非选择|小题|卷[一二三四五六七八九十]/.test(names)) return 'raw';
        return 'plain';
    }

    function describeSubjectColumnSelection(headers, columnGroup) {
        const cells = selectSubjectScoreCells([], columnGroup || {});
        const names = cells.map((cell) => cleanText(headers[cell.index])).filter(Boolean);
        return names.length ? names.join(' + ') : '未识别';
    }

    function scoreColumnOverrideKey(sourceId, subject) {
        return `${sourceId}__${subject}`;
    }

    function registerSubjectSourceHint(subject, hint) {
        if (!subject || !hint) return;
        if (!state.subjectSourceHints[subject]) state.subjectSourceHints[subject] = {};
        state.subjectSourceHints[subject][hint] = Number(state.subjectSourceHints[subject][hint] || 0) + 1;
    }

    function mergeDuplicateStudents() {
        const merged = [];
        const byKey = new Map();
        let duplicateCount = 0;
        const conflicts = [];
        state.students.forEach((student) => {
            const key = studentIdentityKey(student);
            if (!key || !byKey.has(key)) {
                const copy = {
                    ...student,
                    rawScores: { ...(student.rawScores || {}) },
                    blankScores: { ...(student.blankScores || {}) },
                    absentScores: { ...(student.absentScores || {}) },
                    scoreReasons: { ...(student.scoreReasons || {}) },
                    scoreMeta: { ...(student.scoreMeta || {}) },
                    scores: { ...(student.scores || {}) },
                    ranks: {}
                };
                if (key) byKey.set(key, copy);
                merged.push(copy);
                return;
            }
            duplicateCount += 1;
            const existing = byKey.get(key);
            existing.school = existing.school || student.school;
            existing.className = existing.className || student.className;
            existing.name = existing.name || student.name;
            existing.id = existing.id || student.id;
            Object.entries(student.rawScores || {}).forEach(([subject, score]) => {
                if (Number.isFinite(Number(score))) {
                    const oldScore = Number(existing.rawScores?.[subject]);
                    const newScore = Number(score);
                    if (Number.isFinite(oldScore) && Math.abs(oldScore - newScore) > 0.0001) {
                        conflicts.push({
                            school: existing.school || student.school,
                            className: existing.className || student.className,
                            name: existing.name || student.name,
                            id: existing.id || student.id,
                            subject,
                            oldScore,
                            newScore,
                            kept: '后导入'
                        });
                    }
                    existing.rawScores[subject] = score;
                    existing.blankScores[subject] = Boolean(student.blankScores?.[subject]);
                    existing.absentScores[subject] = Boolean(student.absentScores?.[subject]);
                    existing.scoreReasons[subject] = student.scoreReasons?.[subject] || existing.scoreReasons?.[subject] || 'present';
                    existing.scoreMeta[subject] = { ...(student.scoreMeta?.[subject] || {}) };
                    existing.scores[subject] = score;
                }
            });
            existing.validCount = Object.keys(existing.rawScores).length;
        });
        state.students = merged;
        state.importStats.duplicateStudents = duplicateCount;
        state.importStats.duplicateConflicts = conflicts;
    }

    function studentIdentityKey(student) {
        const school = cleanText(student.school);
        const className = cleanText(student.className);
        const id = cleanText(student.id);
        const name = cleanName(student.name);
        if (id) return `${school}__${className}__id:${id}`;
        if (name) return `${school}__${className}__name:${name}`;
        return '';
    }

    function parseRosterRows(rows, defaultSchool) {
        if (!Array.isArray(rows) || rows.length < 2) return [];
        const headerIndex = findHeaderRow(rows);
        const headers = (rows[headerIndex] || []).map((cell) => cleanHeader(cell));
        const idx = {
            name: findBestHeader(headers, NAME_ALIASES),
            id: findBestHeader(headers, ID_ALIASES),
            className: findBestHeader(headers, CLASS_ALIASES),
            school: findBestHeader(headers, SCHOOL_ALIASES),
            status: findBestHeader(headers, ROSTER_STATUS_ALIASES)
        };
        if (idx.name === -1 && idx.id === -1) return [];
        const result = [];
        for (let rowIndex = headerIndex + 1; rowIndex < rows.length; rowIndex += 1) {
            const row = rows[rowIndex] || [];
            const name = cleanName(idx.name >= 0 ? row[idx.name] : '');
            const id = cleanText(idx.id >= 0 ? row[idx.id] : '');
            if (!name && !id) continue;
            result.push({
                school: cleanText(idx.school >= 0 ? row[idx.school] : '') || inferDefaultSchool(defaultSchool),
                className: normalizeClass(idx.className >= 0 ? row[idx.className] : '') || '未分班',
                name,
                id,
                status: cleanText(idx.status >= 0 ? row[idx.status] : '参考')
            });
        }
        return result;
    }

    function parseTeacherRows(rows) {
        if (!Array.isArray(rows) || rows.length < 2) return [];
        const headerIndex = findTeacherHeaderRow(rows);
        if (headerIndex === -1) return [];
        const headers = rows[headerIndex].map((cell) => cleanHeader(cell));
        const classIndex = findBestHeader(headers, CLASS_ALIASES);
        const subjectIndex = findBestHeader(headers, ['学科', '科目', '课程', 'subject']);
        const teacherIndex = findBestHeader(headers, TEACHER_ALIASES);
        const teacherIdIndex = findBestHeader(headers, TEACHER_ID_ALIASES);
        const scopeIndex = findBestHeader(headers, TEACHER_SCOPE_ALIASES);
        const studentIdIndex = findBestHeader(headers, TEACHER_STUDENT_ID_ALIASES);
        const studentNameIndex = findBestHeader(headers, TEACHER_STUDENT_NAME_ALIASES);
        const weightIndex = findBestHeader(headers, TEACHER_WEIGHT_ALIASES);
        if (classIndex === -1) return [];
        if (subjectIndex === -1 || teacherIndex === -1) {
            return parseWideTeacherRows(rows, headerIndex, headers, classIndex);
        }
        const result = [];
        for (let rowIndex = headerIndex + 1; rowIndex < rows.length; rowIndex += 1) {
            const row = rows[rowIndex] || [];
            const className = normalizeClass(row[classIndex]);
            const subject = normalizeSubject(row[subjectIndex]);
            const identity = parseTeacherIdentity(row[teacherIndex], teacherIdIndex >= 0 ? row[teacherIdIndex] : '');
            const scope = parseTeacherScope(
                scopeIndex >= 0 ? row[scopeIndex] : '',
                studentIdIndex >= 0 ? row[studentIdIndex] : '',
                studentNameIndex >= 0 ? row[studentNameIndex] : ''
            );
            const teachingWeight = parseTeacherWeight(weightIndex >= 0 ? row[weightIndex] : '');
            if (!className || !subject || !identity.teacher) continue;
            result.push({ className, subject, ...identity, ...scope, teachingWeight });
        }
        return result;
    }

    function parseWideTeacherRows(rows, headerIndex, headers, classIndex) {
        const subjectColumns = headers
            .map((header, index) => ({ subject: normalizeSubjectHeader(header), index }))
            .filter((item) => item.subject && item.index !== classIndex);
        if (!subjectColumns.length) return [];
        const result = [];
        for (let rowIndex = headerIndex + 1; rowIndex < rows.length; rowIndex += 1) {
            const row = rows[rowIndex] || [];
            const className = normalizeClass(row[classIndex]);
            if (!className) continue;
            subjectColumns.forEach(({ subject, index }) => {
                splitTeacherCell(row[index]).forEach((identity) => {
                    result.push({ className, subject, ...identity });
                });
            });
        }
        return result;
    }

    function splitTeacherCell(value) {
        const text = cleanText(value);
        if (!text) return [];
        return text
            .split(/[、，,；;\/]+/)
            .map((item) => parseTeacherIdentity(item))
            .filter((item) => item.teacher);
    }

    function parseTeacherIdentity(value, explicitId = '') {
        let text = cleanText(value);
        let teacherId = cleanText(explicitId);
        if (!text) return { teacher: '', teacherId: '', teacherKey: '' };
        const inline = text.match(/^(.+?)(?:\(|（|\[|【|#)([A-Za-z0-9_-]{2,})(?:\)|）|\]|】)?$/);
        if (inline && !teacherId) {
            text = cleanText(inline[1]);
            teacherId = cleanText(inline[2]);
        }
        const teacher = normalizeTeacherName(text);
        return {
            teacher,
            teacherId,
            teacherKey: teacherId ? `${teacher}#${teacherId}` : teacher
        };
    }

    function normalizeTeacherName(value) {
        return cleanText(value).replace(/\s+/g, '');
    }

    function parseTeacherScope(scopeValue, idValue, nameValue) {
        const scopeText = cleanText(scopeValue);
        return {
            scopeText,
            studentIds: splitRosterList(idValue),
            studentNames: splitRosterList(nameValue).map(cleanName).filter(Boolean)
        };
    }

    function splitRosterList(value) {
        const text = cleanText(value);
        if (!text) return [];
        return [...new Set(text.split(/[、，,；;\/\s]+/).map((item) => cleanText(item)).filter(Boolean))];
    }

    function parseTeacherWeight(value) {
        const text = cleanText(value);
        if (!text) return 1;
        const percentMatch = text.match(/(\d+(?:\.\d+)?)\s*%/);
        if (percentMatch) return clamp(Number(percentMatch[1]) / 100, 0, 1);
        const numeric = Number(text.match(/\d+(?:\.\d+)?/)?.[0]);
        if (!Number.isFinite(numeric) || numeric <= 0) return 1;
        return numeric > 1 ? clamp(numeric / 100, 0, 1) : clamp(numeric, 0, 1);
    }

    function analyze() {
        const startedAt = nowMs();
        ensureActiveSchool();
        normalizeScoresForCurrentGrade();
        const totalSubjects = getTotalSubjects();
        state.students.forEach((student) => {
            const missingSubjects = totalSubjects.filter((subject) => !Number.isFinite(Number(student.scores[subject])));
            student.totalMissingSubjects = missingSubjects;
            student.totalComplete = totalSubjects.length > 0 && !missingSubjects.length;
            student.total = student.totalComplete
                ? round(totalSubjects.reduce((sum, subject) => sum + Number(student.scores[subject]), 0), 1)
                : NaN;
            student.ranks = {};
        });
        buildThresholds();
        buildStudentRanks();
        buildClassRows();
        buildSubjectRows();
        buildTeacherRows();
        buildStudentAlerts();
        buildImportDiagnostics();
        state.performanceStats = {
            lastAnalyzeMs: round(nowMs() - startedAt, 1),
            studentCount: getAnalysisStudents().length,
            subjectCount: getAnalysisSubjects().length
        };
    }

    function normalizeScoresForCurrentGrade() {
        state.students.forEach(ensureRawScores);
        const analysisStudents = getAnalysisStudents();
        const adjustments = {};
        state.subjects.forEach((subject) => {
            const targetMax = getSubjectMaxScore(subject);
            const rawValues = analysisStudents
                .filter((student) => !shouldExcludeScore(student, subject))
                .filter((student) => !isScoreAlreadyConverted(student, subject))
                .map((student) => student.rawScores?.[subject])
                .map(Number)
                .filter(Number.isFinite);
            const convertedValues = analysisStudents
                .filter((student) => !shouldExcludeScore(student, subject))
                .filter((student) => isScoreAlreadyConverted(student, subject))
                .map((student) => student.rawScores?.[subject])
                .map(Number)
                .filter(Number.isFinite);
            const observedMax = rawValues.length
                ? Math.max(...rawValues)
                : (convertedValues.length ? Math.max(...convertedValues) : 0);
            const sourceMax = inferSourceMax(subject, observedMax, targetMax, {
                convertedOnly: !rawValues.length && convertedValues.length > 0
            });
            const scale = sourceMax > 0 ? targetMax / sourceMax : 1;
            adjustments[subject] = {
                subject,
                targetMax,
                observedMax: round(observedMax, 1),
                sourceMax: round(sourceMax, 1),
                scale: round(scale, 4),
                adjusted: Math.abs(scale - 1) > 0.0001,
                convertedCount: convertedValues.length
            };
        });

        state.students.forEach((student) => {
            const normalized = {};
            state.subjects.forEach((subject) => {
                if (shouldExcludeScore(student, subject)) return;
                const rawScore = Number(student.rawScores?.[subject]);
                if (!Number.isFinite(rawScore)) return;
                const rule = adjustments[subject] || {};
                const targetMax = Number(rule.targetMax || getSubjectMaxScore(subject));
                const scale = isScoreAlreadyConverted(student, subject) ? 1 : Number(rule.scale || 1);
                normalized[subject] = round(clamp(rawScore * scale, 0, targetMax), 2);
            });
            student.scores = normalized;
        });
        state.scoreAdjustments = adjustments;
    }

    function ensureRawScores(student) {
        if (!student.rawScores || typeof student.rawScores !== 'object') {
            student.rawScores = { ...(student.scores || {}) };
        }
        if (!student.blankScores || typeof student.blankScores !== 'object') {
            student.blankScores = {};
        }
        if (!student.absentScores || typeof student.absentScores !== 'object') {
            student.absentScores = {};
        }
        if (!student.scoreReasons || typeof student.scoreReasons !== 'object') {
            student.scoreReasons = {};
        }
        if (!student.scoreMeta || typeof student.scoreMeta !== 'object') {
            student.scoreMeta = {};
        }
    }

    function inferSourceMax(subject, observedMax, targetMax, options = {}) {
        const observed = Number(observedMax || 0);
        const target = Number(targetMax || 0);
        if (options.convertedOnly && !getSourceMaxOverride(subject)) return target || observed || 0;
        const configuredSourceMax = getConfiguredSourceMaxScore(subject, { useDefault: true });
        if (Number.isFinite(configuredSourceMax) && configuredSourceMax > 0) return configuredSourceMax;
        if (!target || observed <= 0) return target || observed || 0;
        const tolerance = Math.max(3, target * 0.05);
        if (observed <= target + tolerance) return target;
        if (state.grade === 9 && ['物理', '化学'].includes(subject) && observed <= 100) return 100;
        return STANDARD_FULL_MARKS.find((mark) => mark >= observed - 0.001 && mark > target) || observed;
    }

    function shouldExcludeScore(student, subject) {
        const isBlank = Boolean(student.blankScores?.[subject]);
        const isAbsent = Boolean(student.absentScores?.[subject]);
        if (state.blankScoreMode === 'zero') return false;
        if (state.blankScoreMode === 'absent') return isBlank;
        if (state.blankScoreMode === 'exclude') return isBlank || isAbsent;
        return false;
    }

    function isScoreAlreadyConverted(student, subject) {
        if (getSourceMaxOverride(subject)) return false;
        return student.scoreMeta?.[subject]?.sourceHint === 'converted';
    }

    function buildThresholds() {
        state.thresholds = {};
        const keys = [...getAnalysisSubjects(), 'total'];
        const analysisStudents = getAnalysisStudents();
        keys.forEach((key) => {
            const values = analysisStudents
                .map((student) => key === 'total' ? student.total : student.scores[key])
                .filter((value) => Number.isFinite(Number(value)))
                .map(Number)
                .sort((a, b) => b - a);
            const exc = pickLine(values, currentConfig().excRatio);
            const pass = pickLine(values, 0.5);
            const maxScore = key === 'total' ? getTotalMaxScore() : getSubjectMaxScore(key);
            state.thresholds[key] = { exc, pass, low: pass * 0.6, paperPass: maxScore ? maxScore * 0.6 : 0, maxScore };
        });
    }

    function buildStudentRanks() {
        const analysisStudents = getAnalysisStudents();
        const subjects = getAnalysisSubjects();
        assignRanks(analysisStudents.filter((student) => Number.isFinite(Number(student.total))), (student) => student.total, (student, rank) => {
            ensureRank(student, 'total').grade = rank;
        });
        subjects.forEach((subject) => {
            assignRanks(analysisStudents.filter((student) => Number.isFinite(Number(student.scores[subject]))), (student) => student.scores[subject], (student, rank) => {
                ensureRank(student, subject).grade = rank;
            });
        });
        groupBy(analysisStudents, (student) => student.className).forEach((rows) => {
            assignRanks(rows.filter((student) => Number.isFinite(Number(student.total))), (student) => student.total, (student, rank) => {
                ensureRank(student, 'total').class = rank;
            });
            subjects.forEach((subject) => {
                assignRanks(rows.filter((student) => Number.isFinite(Number(student.scores[subject]))), (student) => student.scores[subject], (student, rank) => {
                    ensureRank(student, subject).class = rank;
                });
            });
        });
    }

    function buildClassRows() {
        const rows = [];
        const subjects = getAnalysisSubjects();
        const classGroups = groupBy(getAnalysisStudents(), (student) => student.className);
        classGroups.forEach((students, className) => {
            const totalMetrics = metricSummary(students.map((student) => student.total), state.thresholds.total, getTotalMaxScore());
            const row = {
                className,
                students,
                studentCount: students.length,
                completeTotalCount: totalMetrics.count,
                metrics: { total: totalMetrics },
                subjects: {}
            };
            subjects.forEach((subject) => {
                row.subjects[subject] = metricSummary(students.map((student) => student.scores[subject]), state.thresholds[subject], getSubjectMaxScore(subject));
            });
            rows.push(row);
        });

        const max = {
            avg: Math.max(0, ...rows.map((row) => row.metrics.total.avg)),
            exc: Math.max(0, ...rows.map((row) => row.metrics.total.excRate)),
            pass: Math.max(0, ...rows.map((row) => row.metrics.total.passRate))
        };
        const weights = currentConfig().weights;
        const evalWeights = getEvaluationWeights();
        buildClassDevelopmentContext(rows);
        const classWeightTotal = Math.max(evalWeights.classRelative + evalWeights.classAbsolute + evalWeights.classBalance + evalWeights.classDevelopment, 1);
        rows.forEach((row) => {
            row.rateScore = scoreFromMax(row.metrics.total, max, weights);
            row.absoluteScore = achievementScore(row.metrics.total, getTotalMaxScore());
            row.balanceScore = calculateClassBalanceScore(row);
            const lowPenalty = clamp(row.metrics.total.lowRate * evalWeights.classLowPenalty, 0, 10);
            row.lowPenalty = lowPenalty;
            row.qualityScore = round(clamp((
                row.rateScore * evalWeights.classRelative
                + row.absoluteScore * evalWeights.classAbsolute
                + row.balanceScore * evalWeights.classBalance
                + row.developmentScore * evalWeights.classDevelopment
            ) / classWeightTotal - lowPenalty, 0, 100), 2);
            row.riskFlags = buildClassRiskFlags(row);
        });
        assignRanks(rows, (row) => row.qualityScore, (row, rank) => {
            row.rank = rank;
        });
        state.classRows = rows.sort((a, b) => a.rank - b.rank || naturalCompare(a.className, b.className));
    }

    function buildClassRiskFlags(row) {
        const flags = [];
        if (row.studentCount < 20) flags.push('样本少');
        if (row.studentCount && row.completeTotalCount / row.studentCount < 0.85) flags.push('总分有效偏低');
        if (row.metrics.total.lowRate >= 0.25) flags.push('低分率高');
        if (row.balanceScore < 70) flags.push('学科不均衡');
        if (Number(row.gradeBottomShare || 0) >= 0.45) flags.push('后1/3集中');
        if (Number(row.developmentScore || 80) < 65) flags.push('托底偏弱');
        if (Number(row.marginalRate || 0) >= 0.18) flags.push('临界生较多');
        return flags;
    }

    function buildSubjectRows() {
        state.subjectRows = getAnalysisSubjects().map((subject) => {
            const values = getAnalysisStudents().map((student) => student.scores[subject]);
            const maxScore = getSubjectMaxScore(subject);
            const summary = metricSummary(values, state.thresholds[subject], getSubjectMaxScore(subject));
            const classMetrics = state.classRows.map((row) => ({
                className: row.className,
                ...row.subjects[subject]
            }));
            assignRanks(classMetrics, (item) => item.avg, (item, rank) => {
                item.rank = rank;
            });
            return { subject, ...summary, scoreRate: maxScore > 0 ? summary.avg / maxScore : 0, classMetrics };
        });
    }

    function calculateClassBalanceScore(row) {
        const ratios = getAnalysisSubjects()
            .map((subject) => {
                const maxScore = getSubjectMaxScore(subject);
                const avgValue = row.subjects?.[subject]?.avg;
                return maxScore > 0 && Number.isFinite(Number(avgValue)) ? (Number(avgValue) / maxScore) * 100 : null;
            })
            .filter((value) => Number.isFinite(Number(value)));
        if (ratios.length <= 1) return 80;
        const avgRatio = average(ratios);
        const spread = standardDeviation(ratios);
        return clamp(avgRatio + 18 - spread * 0.9, 0, 100);
    }

    function buildClassDevelopmentContext(rows) {
        const completeStudents = getAnalysisStudents().filter((student) => Number.isFinite(Number(student.total)));
        const totalCount = completeStudents.length;
        const bottomCount = totalCount ? Math.max(1, Math.ceil(totalCount / 3)) : 0;
        const gradeBottomStudents = completeStudents.slice().sort((a, b) => Number(a.total) - Number(b.total)).slice(0, bottomCount);
        const gradeBottomKeys = new Set(gradeBottomStudents.map((student) => studentKey(student)));
        const expectedBottomShare = totalCount ? bottomCount / totalCount : 0;
        const totalMax = getTotalMaxScore();
        const passLine = Number(state.thresholds.total?.pass || 0);
        const edgeWindow = Math.max(8, totalMax * 0.04);

        completeStudents.slice().sort((a, b) => Number(b.total) - Number(a.total)).forEach((student, index) => {
            const layerIndex = totalCount ? index / totalCount : 1;
            student.localLayer = layerIndex < 1 / 3 ? 'A' : (layerIndex < 2 / 3 ? 'B' : 'C');
        });

        const stats = rows.map((row) => {
            const valid = row.students.filter((student) => Number.isFinite(Number(student.total)));
            const ownBottomCount = valid.length ? Math.max(1, Math.ceil(valid.length / 3)) : 0;
            const ownBottom = valid.slice().sort((a, b) => Number(a.total) - Number(b.total)).slice(0, ownBottomCount);
            const bottomThirdAvg = ownBottom.length ? average(ownBottom.map((student) => Number(student.total))) : 0;
            const gradeBottomCount = valid.filter((student) => gradeBottomKeys.has(studentKey(student))).length;
            const marginalRows = valid.filter((student) => passLine > 0 && Number(student.total) < passLine && Number(student.total) >= passLine - edgeWindow);
            const history = buildClassHistoryAdjustment(valid);
            return {
                row,
                validCount: valid.length,
                bottomThirdAvg,
                gradeBottomCount,
                gradeBottomShare: valid.length ? gradeBottomCount / valid.length : 0,
                marginalCount: marginalRows.length,
                marginalRate: valid.length ? marginalRows.length / valid.length : 0,
                history
            };
        });

        const bottomAvgs = stats.filter((item) => item.validCount).map((item) => item.bottomThirdAvg);
        const minBottomAvg = bottomAvgs.length ? Math.min(...bottomAvgs) : 0;
        const maxBottomAvg = bottomAvgs.length ? Math.max(...bottomAvgs) : 0;
        stats.forEach((item) => {
            const rangeScore = maxBottomAvg > minBottomAvg
                ? scoreFromRange(item.bottomThirdAvg, minBottomAvg, maxBottomAvg, 58, 100)
                : 80;
            const scoreRateScore = totalMax > 0 ? clamp((item.bottomThirdAvg / totalMax) * 118, 45, 96) : rangeScore;
            const bottomAvgScore = clamp(rangeScore * 0.68 + scoreRateScore * 0.32, 0, 100);
            const concentrationScore = item.validCount && expectedBottomShare
                ? clamp(100 - Math.max(0, item.gradeBottomShare - expectedBottomShare) * 180 + Math.max(0, expectedBottomShare - item.gradeBottomShare) * 35, 45, 100)
                : 80;
            const historyScore = item.history.matchedCount >= 5 ? clamp(80 + Number(item.history.adjustment || 0) * 2.5, 0, 100) : 80;
            item.row.bottomThirdAvg = round(item.bottomThirdAvg, 2);
            item.row.gradeBottomCount = item.gradeBottomCount;
            item.row.gradeBottomShare = round(item.gradeBottomShare, 4);
            item.row.marginalCount = item.marginalCount;
            item.row.marginalRate = round(item.marginalRate, 4);
            item.row.classHistoryAdjustment = round(item.history.adjustment || 0, 2);
            item.row.classHistoryAvgChange = round(item.history.avgChange || 0, 2);
            item.row.classHistoryMatchedCount = item.history.matchedCount || 0;
            item.row.developmentScore = round(clamp(bottomAvgScore * 0.55 + concentrationScore * 0.3 + historyScore * 0.15, 0, 100), 2);
        });
    }

    function buildClassHistoryAdjustment(students) {
        const baseline = getSelectedBaselineSnapshot();
        const totalMax = getTotalMaxScore();
        if (!baseline || !totalMax) return { adjustment: 0, avgChange: 0, matchedCount: 0 };
        const baseMap = buildStudentBaselineMap(baseline);
        const baselineTotalMax = Number(baseline.totalMax || totalMax);
        const currentRows = getAnalysisStudents()
            .map((student) => {
                const base = findBaselineStudent(baseMap, student);
                const nowTotal = Number(student.total);
                const baseTotal = Number(base?.total);
                if (!Number.isFinite(nowTotal) || !Number.isFinite(baseTotal) || !baselineTotalMax) return null;
                return { student, change: (nowTotal / totalMax - baseTotal / baselineTotalMax) * 100 };
            })
            .filter(Boolean);
        if (currentRows.length < 8) return { adjustment: 0, avgChange: 0, matchedCount: 0 };
        const allAvgChange = average(currentRows.map((item) => item.change));
        const allSpread = standardDeviation(currentRows.map((item) => item.change)) || 1;
        const studentKeys = new Set(students.flatMap((student) => getStudentMatchKeys(student)));
        const ownChanges = currentRows
            .filter((item) => getStudentMatchKeys(item.student).some((key) => studentKeys.has(key)))
            .map((item) => item.change);
        if (ownChanges.length < 5) return { adjustment: 0, avgChange: 0, matchedCount: ownChanges.length };
        const avgChange = average(ownChanges);
        return {
            adjustment: clamp(((avgChange - allAvgChange) / allSpread) * 5, -6, 6),
            avgChange,
            matchedCount: ownChanges.length
        };
    }

    function buildTeacherRows() {
        state.teacherRows = [];
        state.finalTeacherRows = [];
        const teacherStatus = { ok: false, text: '等待任课表' };
        const analysisStudents = getAnalysisStudents();
        if (!analysisStudents.length || !state.teachers.length) {
            state.teacherCoverage = { matched: 0, unmatched: [] };
            state.teacherDiagnostics = { sameName: [], rankedSubjects: [], excludedSubjects: [], teacherCount: 0 };
            if (els.teacherStatus) {
                els.teacherStatus.textContent = teacherStatus.text;
                els.teacherStatus.className = 'status-pill warn';
            }
            return;
        }

        const bySubject = new Map();
        const studentByClass = groupBy(analysisStudents, (student) => student.className);
        const assignments = state.teachers;
        const unmatchedAssignments = [];
        const teacherSubjectGroups = new Map();
        assignments.forEach((assignment) => {
            const teacherKey = cleanText(assignment.teacherKey) || assignment.teacher;
            const key = `${teacherKey}__${assignment.subject}`;
            if (!teacherSubjectGroups.has(key)) {
                teacherSubjectGroups.set(key, {
                    teacher: assignment.teacher,
                    teacherId: assignment.teacherId || '',
                    teacherKey,
                    subject: assignment.subject,
                    assignedClasses: new Set(),
                    matchedClasses: new Set(),
                    scopeTexts: new Set(),
                    students: [],
                    teachingWeights: []
                });
            }
            const group = teacherSubjectGroups.get(key);
            group.assignedClasses.add(assignment.className);
            if (assignment.scopeText) group.scopeTexts.add(assignment.scopeText);
            const classStudents = studentByClass.get(assignment.className) || [];
            const scopedStudents = filterStudentsByTeacherScope(classStudents, assignment);
            const matchedStudents = scopedStudents.filter((student) => Number.isFinite(Number(student.scores[assignment.subject])));
            if (!classStudents.length || !scopedStudents.length || !matchedStudents.length) {
                unmatchedAssignments.push({
                    ...assignment,
                    reason: !classStudents.length ? '班级未匹配' : (!scopedStudents.length ? '任课范围未匹配' : '该班无本学科成绩')
                });
            } else {
                group.matchedClasses.add(assignment.className);
            }
            matchedStudents.forEach((student) => {
                group.students.push(student);
                group.teachingWeights.push({ key: studentKey(student), weight: Number(assignment.teachingWeight || 1) });
            });
        });
        state.teacherCoverage = {
            matched: assignments.length - unmatchedAssignments.length,
            unmatched: unmatchedAssignments
        };

        teacherSubjectGroups.forEach((group) => {
            const uniqueStudents = uniqueBy(group.students, (student) => `${student.className}__${student.name}__${student.id}`);
            if (!uniqueStudents.length) return;
            const teachingLoad = calculateTeacherTeachingLoad(group, uniqueStudents);
            const thresholds = state.thresholds[group.subject] || { exc: 0, pass: 0, low: 0 };
            const scores = uniqueStudents.map((student) => student.scores[group.subject]);
            const summary = metricSummary(scores, thresholds, getSubjectMaxScore(group.subject));
            const residual = buildSubjectResidual(group.subject, uniqueStudents);
            const historyAdjustment = buildTeacherHistoryAdjustment(group.subject, uniqueStudents);
            const conversionMetrics = buildTeacherConversionMetrics(group.subject, uniqueStudents);
            const row = {
                teacher: group.teacher,
                teacherId: group.teacherId,
                teacherKey: group.teacherKey,
                subject: group.subject,
                classes: Array.from(group.matchedClasses).sort(naturalCompare),
                scopeText: Array.from(group.scopeTexts).join('、'),
                studentCount: summary.count,
                avg: summary.avg,
                excRate: summary.excRate,
                passRate: summary.passRate,
                paperPassRate: summary.paperPassRate,
                lowRate: summary.lowRate,
                baselineAdjustment: residual.adjustment,
                residualAvg: residual.avgResidual,
                historyAdjustment: historyAdjustment.adjustment,
                historyAvgChange: historyAdjustment.avgChange,
                historyMatchedCount: historyAdjustment.matchedCount,
                conversionScore: conversionMetrics.score,
                conversionAdjustment: conversionMetrics.adjustment,
                conversionSummary: conversionMetrics.summary,
                conversionMatchedCount: conversionMetrics.matchedCount,
                teachingWeight: teachingLoad.avgWeight,
                effectiveStudentWeight: teachingLoad.effectiveStudentWeight,
                workloadAdjustment: 0,
                confidence: 1,
                leagueScore: 0,
                fairScore: 0,
                subjectRank: 0,
                relativeScore: 80,
                finalUnitScore: 0,
                riskFlags: []
            };
            if (!bySubject.has(row.subject)) bySubject.set(row.subject, []);
            bySubject.get(row.subject).push(row);
        });

        const weights = currentConfig().weights;
        const evalWeights = getEvaluationWeights();
        const teacherWeightTotal = Math.max(evalWeights.teacherQuality + evalWeights.teacherRelative + evalWeights.teacherHistory + evalWeights.teacherConversion, 1);
        bySubject.forEach((rows) => {
            const max = {
                avg: Math.max(0, ...rows.map((row) => row.avg)),
                exc: Math.max(0, ...rows.map((row) => row.excRate)),
                pass: Math.max(0, ...rows.map((row) => row.passRate))
            };
            const medianCount = median(rows.map((row) => row.studentCount)) || 1;
            rows.forEach((row) => {
                row.relativeLeagueScore = scoreFromMax(row, max, weights);
                row.absoluteScore = achievementScore(row, getSubjectMaxScore(row.subject));
                row.leagueScore = row.relativeLeagueScore * 0.45 + row.absoluteScore * 0.55;
                const sampleFactor = clamp(Math.sqrt(Math.max(row.studentCount, 1) / Math.max(medianCount, 1)), 0.65, 1);
                row.confidence = clamp(0.86 + 0.14 * sampleFactor, 0.86, 1);
                row.workloadAdjustment = clamp((Math.sqrt(Math.max(row.studentCount, 0)) - Math.sqrt(Math.max(medianCount, 1))) * 1.6, -2, 2);
                const lowPenalty = clamp(row.lowRate * 12, 0, 8);
                row.lowPenalty = lowPenalty;
                row.fairScore = clamp(row.leagueScore * row.confidence + row.baselineAdjustment + row.historyAdjustment + row.conversionAdjustment + row.workloadAdjustment - lowPenalty, 0, 100);
            });
            assignRanks(rows, (row) => row.fairScore, (row, rank) => {
                row.subjectRank = rank;
            });
            rows.forEach((row) => {
                const n = rows.length;
                const rankRelative = n <= 1 ? 80 : 60 + ((n - row.subjectRank) / Math.max(n - 1, 1)) * 40;
                const fairScores = rows.map((item) => item.fairScore);
                const fairMin = Math.min(...fairScores);
                const fairMax = Math.max(...fairScores);
                const scoreRelative = fairMax > fairMin
                    ? 60 + ((row.fairScore - fairMin) / (fairMax - fairMin)) * 40
                    : 80;
                row.relativeScore = scoreRelative * 0.7 + rankRelative * 0.3;
                const historyScore = clamp(80 + Number(row.historyAdjustment || 0) * 2.5, 0, 100);
                row.historyScore = historyScore;
                row.finalUnitScore = (
                    row.fairScore * evalWeights.teacherQuality
                    + row.relativeScore * evalWeights.teacherRelative
                    + historyScore * evalWeights.teacherHistory
                    + row.conversionScore * evalWeights.teacherConversion
                ) / teacherWeightTotal;
                row.riskFlags = buildTeacherRiskFlags(row);
            });
        });

        state.teacherRows = Array.from(teacherSubjectGroups.values()).flatMap((group) => {
            const rows = bySubject.get(group.subject) || [];
            return rows.filter((row) => row.teacherKey === group.teacherKey && row.subject === group.subject);
        }).sort((a, b) => sortBySubjectRank(a, b));

        const rankedSubjects = getTeacherRankSubjects();
        state.teacherRows.forEach((row) => {
            row.inFinalRank = rankedSubjects.includes(row.subject);
        });
        const byTeacher = new Map();
        state.teacherRows.filter((row) => row.inFinalRank).forEach((row) => {
            if (!byTeacher.has(row.teacherKey)) {
                byTeacher.set(row.teacherKey, { teacher: row.teacher, teacherId: row.teacherId, teacherKey: row.teacherKey, subjects: [], totalWeight: 0, overallScore: 0, totalStudents: 0, rank: 0 });
            }
            const item = byTeacher.get(row.teacherKey);
            const weight = Math.max(row.effectiveStudentWeight || row.studentCount, 1) * row.confidence;
            item.subjects.push(row);
            item.totalWeight += weight;
            item.overallScore += row.finalUnitScore * weight;
            item.totalStudents += row.studentCount;
        });
        const finalRows = Array.from(byTeacher.values()).map((row) => ({
            ...row,
            overallScore: row.totalWeight ? row.overallScore / row.totalWeight : 0,
            subjectText: row.subjects.map((item) => `${item.subject}(${item.classes.join(',')}${item.scopeText ? `/${item.scopeText}` : ''})`).join('；'),
            riskFlags: [...new Set(row.subjects.flatMap((item) => item.riskFlags || []))]
        }));
        assignRanks(finalRows, (row) => row.overallScore, (row, rank) => {
            row.rank = rank;
        });
        state.finalTeacherRows = finalRows.sort((a, b) => a.rank - b.rank || naturalCompare(a.teacher, b.teacher));
        state.teacherDiagnostics = buildTeacherDiagnostics(assignments, rankedSubjects);

        if (els.teacherStatus) {
            const unmatchedCount = state.teacherCoverage.unmatched.length;
            els.teacherStatus.textContent = unmatchedCount
                ? `已分析 ${state.finalTeacherRows.length} 位教师，${unmatchedCount} 条未匹配`
                : `已分析 ${state.finalTeacherRows.length} 位教师`;
            els.teacherStatus.className = unmatchedCount ? 'status-pill warn' : 'status-pill ok';
        }
    }

    function buildSubjectResidual(subject, students) {
        const allRows = getAnalysisStudents().filter((student) => Number.isFinite(Number(student.scores[subject])));
        const points = allRows.map((student) => {
            const base = getBaseScoreExcluding(student, subject);
            return Number.isFinite(base) ? { x: base, y: Number(student.scores[subject]) } : null;
        }).filter(Boolean);
        const subjectSd = standardDeviation(points.map((point) => point.y)) || 1;
        if (points.length < 8 || standardDeviation(points.map((point) => point.x)) < 0.01) {
            return { avgResidual: 0, adjustment: 0 };
        }
        const model = linearRegression(points);
        const residuals = students
            .map((student) => {
                const x = getBaseScoreExcluding(student, subject);
                const y = Number(student.scores[subject]);
                if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
                return y - (model.a + model.b * x);
            })
            .filter((value) => Number.isFinite(value));
        const avgResidual = residuals.length ? average(residuals) : 0;
        return {
            avgResidual,
            adjustment: clamp((avgResidual / subjectSd) * 8, -12, 12)
        };
    }

    function buildTeacherDiagnostics(assignments, rankedSubjects) {
        const byName = groupBy(assignments, (item) => item.teacher);
        const sameName = [];
        let noIdCount = 0;
        byName.forEach((rows, teacher) => {
            const identities = uniqueBy(rows, (item) => item.teacherKey || item.teacher).map((item) => ({
                teacherKey: item.teacherKey || item.teacher,
                teacherId: item.teacherId || '',
                subjects: sortSubjects([...new Set(rows.filter((row) => (row.teacherKey || row.teacher) === (item.teacherKey || item.teacher)).map((row) => row.subject))]),
                classes: [...new Set(rows.filter((row) => (row.teacherKey || row.teacher) === (item.teacherKey || item.teacher)).map((row) => row.className))].sort(naturalCompare)
            }));
            if (rows.some((row) => !row.teacherId)) noIdCount += 1;
            if (identities.length > 1) sameName.push({ teacher, identities });
        });
        const analysisSubjects = getAnalysisSubjects();
        return {
            sameName,
            noIdCount,
            rankedSubjects: rankedSubjects.slice(),
            excludedSubjects: analysisSubjects.filter((subject) => !rankedSubjects.includes(subject)),
            teacherCount: uniqueBy(assignments, (item) => item.teacherKey || item.teacher).length
        };
    }

    function filterStudentsByTeacherScope(students, assignment) {
        const ids = new Set((assignment.studentIds || []).map((item) => cleanText(item)));
        const names = new Set((assignment.studentNames || []).map((item) => cleanName(item)));
        if (!ids.size && !names.size) return students;
        return students.filter((student) => ids.has(cleanText(student.id)) || names.has(cleanName(student.name)));
    }

    function calculateTeacherTeachingLoad(group, uniqueStudents) {
        const weights = new Map();
        (group.teachingWeights || []).forEach((item) => {
            const value = clamp(Number(item.weight || 1), 0, 1);
            weights.set(item.key, Math.max(weights.get(item.key) || 0, value));
        });
        const studentWeights = uniqueStudents.map((student) => {
            const keys = [`${student.className}__${student.name}__${student.id}`, studentKey(student)];
            const found = keys.map((key) => weights.get(key)).find((value) => Number.isFinite(Number(value)));
            return Number.isFinite(Number(found)) ? Number(found) : 1;
        });
        return {
            avgWeight: studentWeights.length ? average(studentWeights) : 1,
            effectiveStudentWeight: studentWeights.reduce((sum, value) => sum + value, 0)
        };
    }

    function buildTeacherHistoryAdjustment(subject, students) {
        const baseline = getSelectedBaselineSnapshot();
        if (!baseline) return { adjustment: 0, avgChange: 0, matchedCount: 0 };
        const baseMap = buildStudentBaselineMap(baseline);
        const currentRows = getAnalysisStudents()
            .map((student) => {
                const base = findBaselineStudent(baseMap, student);
                const nowScore = Number(student.scores?.[subject]);
                const baseScore = Number(base?.scores?.[subject]);
                if (!Number.isFinite(nowScore) || !Number.isFinite(baseScore)) return null;
                return { student, change: nowScore - baseScore };
            })
            .filter(Boolean);
        if (currentRows.length < 8) return { adjustment: 0, avgChange: 0, matchedCount: 0 };
        const allAvgChange = average(currentRows.map((item) => item.change));
        const allSpread = standardDeviation(currentRows.map((item) => item.change)) || 1;
        const studentKeys = new Set(students.flatMap((student) => getStudentMatchKeys(student)));
        const ownChanges = currentRows
            .filter((item) => getStudentMatchKeys(item.student).some((key) => studentKeys.has(key)))
            .map((item) => item.change);
        if (ownChanges.length < 5) return { adjustment: 0, avgChange: 0, matchedCount: ownChanges.length };
        const avgChange = average(ownChanges);
        return {
            adjustment: clamp(((avgChange - allAvgChange) / allSpread) * 6, -8, 8),
            avgChange,
            matchedCount: ownChanges.length
        };
    }

    function buildTeacherConversionMetrics(subject, students) {
        const maxScore = getSubjectMaxScore(subject);
        const thresholds = state.thresholds[subject] || {};
        const passLine = Number(thresholds.pass || 0);
        const excLine = Number(thresholds.exc || 0);
        const paperPassLine = maxScore ? maxScore * 0.6 : Number(thresholds.paperPass || 0);
        const edgeWindow = Math.max(3, maxScore * 0.06);
        const baseline = getSelectedBaselineSnapshot();
        const ownKeys = new Set(students.flatMap((student) => getStudentMatchKeys(student)));

        if (!baseline || !maxScore) {
            const current = students
                .map((student) => Number(student.scores?.[subject]))
                .filter(Number.isFinite);
            const passEdge = current.filter((score) => passLine > 0 && score < passLine && score >= passLine - edgeWindow).length;
            const lowCount = current.filter((score) => paperPassLine > 0 && score < paperPassLine).length;
            const lowRate = current.length ? lowCount / current.length : 0;
            return {
                score: 80,
                adjustment: 0,
                matchedCount: 0,
                summary: current.length ? `待历史基准；当前达标临界 ${passEdge} 人，卷面低分 ${lowCount} 人(${percent(lowRate)})` : '待成绩样本'
            };
        }

        const baseMap = buildStudentBaselineMap(baseline);
        const matched = getAnalysisStudents()
            .map((student) => {
                const base = findBaselineStudent(baseMap, student);
                const nowScore = Number(student.scores?.[subject]);
                const baseScore = Number(base?.scores?.[subject]);
                if (!Number.isFinite(nowScore) || !Number.isFinite(baseScore)) return null;
                return { student, nowScore, baseScore };
            })
            .filter(Boolean);
        const ownMatched = matched.filter((item) => getStudentMatchKeys(item.student).some((key) => ownKeys.has(key)));
        if (matched.length < 8 || ownMatched.length < 5) {
            return {
                score: 80,
                adjustment: 0,
                matchedCount: ownMatched.length,
                summary: ownMatched.length ? `历史匹配 ${ownMatched.length} 人，样本偏少暂不加减分` : '待历史匹配'
            };
        }

        const countHit = (rows, predicate, hitPredicate) => {
            const candidates = rows.filter(predicate);
            return {
                total: candidates.length,
                hit: candidates.filter(hitPredicate).length,
                rate: candidates.length ? candidates.filter(hitPredicate).length / candidates.length : null
            };
        };
        const passEdge = countHit(
            ownMatched,
            (item) => passLine > 0 && item.baseScore < passLine && item.baseScore >= passLine - edgeWindow,
            (item) => item.nowScore >= passLine
        );
        const excEdge = countHit(
            ownMatched,
            (item) => excLine > 0 && item.baseScore < excLine && item.baseScore >= excLine - edgeWindow,
            (item) => item.nowScore >= excLine
        );
        const lowLift = countHit(
            ownMatched,
            (item) => paperPassLine > 0 && item.baseScore < paperPassLine,
            (item) => item.nowScore >= paperPassLine
        );
        const fall = countHit(
            ownMatched,
            (item) => passLine > 0 && item.baseScore >= passLine,
            (item) => item.nowScore < passLine
        );

        const componentScores = [];
        if (passEdge.total) componentScores.push({ weight: passEdge.total, score: 65 + passEdge.rate * 35 });
        if (lowLift.total) componentScores.push({ weight: lowLift.total, score: 65 + lowLift.rate * 35 });
        if (excEdge.total) componentScores.push({ weight: excEdge.total * 0.7, score: 70 + excEdge.rate * 30 });
        if (fall.total) componentScores.push({ weight: fall.total * 0.5, score: 88 - fall.rate * 28 });
        const rawScore = componentScores.length
            ? componentScores.reduce((sum, item) => sum + item.score * item.weight, 0) / componentScores.reduce((sum, item) => sum + item.weight, 0)
            : 80;
        const score = round(clamp(rawScore, 45, 100), 2);
        const summary = [
            `达标临界 ${passEdge.total ? `${passEdge.hit}/${passEdge.total}` : '0'}`,
            `低分转出 ${lowLift.total ? `${lowLift.hit}/${lowLift.total}` : '0'}`,
            `优秀临界 ${excEdge.total ? `${excEdge.hit}/${excEdge.total}` : '0'}`,
            fall.total ? `达标回落 ${fall.hit}/${fall.total}` : ''
        ].filter(Boolean).join('；');
        return {
            score,
            adjustment: clamp((score - 80) / 5, -4, 4),
            matchedCount: ownMatched.length,
            summary
        };
    }

    function getSelectedBaselineSnapshot() {
        const history = state.examHistory || [];
        return history.find((item) => item.id === state.selectedHistoryId)
            || history.find((item) => Number(item.grade) === Number(state.grade))
            || null;
    }

    function buildStudentBaselineMap(snapshot) {
        const map = new Map();
        (snapshot?.students || []).forEach((student) => {
            (student.matchKeys || getStudentMatchKeys(student)).forEach((key) => {
                if (!map.has(key)) map.set(key, student);
            });
        });
        return map;
    }

    function findBaselineStudent(map, student) {
        for (const key of getStudentMatchKeys(student)) {
            if (map.has(key)) return map.get(key);
        }
        return null;
    }

    function buildTeacherRiskFlags(row) {
        const flags = [];
        if (row.studentCount < 15) flags.push('样本少');
        if (row.confidence < 0.92) flags.push('置信低');
        if (row.lowRate >= 0.25) flags.push('低分率高');
        if (Math.abs(row.baselineAdjustment) >= 8) flags.push('基础波动大');
        if (Math.abs(row.historyAdjustment || 0) >= 6) flags.push('历史波动大');
        if (Number(row.conversionMatchedCount || 0) >= 5 && Number(row.conversionScore || 80) < 65) flags.push('转化偏弱');
        if (Number(row.teachingWeight || 1) < 0.99) flags.push('任课权重');
        if (row.scopeText) flags.push('分组任课');
        return flags;
    }

    function buildStudentAlerts() {
        const analysisStudents = getAnalysisStudents();
        const subjects = getAnalysisSubjects();
        const completeStudents = analysisStudents.filter((student) => Number.isFinite(Number(student.total)));
        const totalCount = completeStudents.length || 1;
        const edgeRows = [];
        const biasRows = [];
        const supportRows = [];
        const potentialRows = [];
        analysisStudents.forEach((student) => {
            subjects.forEach((subject) => {
                const score = Number(student.scores[subject]);
                if (!Number.isFinite(score)) return;
                const line = state.thresholds[subject] || {};
                const subjectWindow = Math.max(3, getSubjectMaxScore(subject) * 0.05);
                if (score < line.exc && score >= line.exc - subjectWindow) {
                    edgeRows.push({ type: '优秀临界', student, subject, score, gap: round(line.exc - score, 1), note: `距优秀线 ${round(line.exc - score, 1)} 分` });
                } else if (score < line.pass && score >= line.pass - subjectWindow) {
                    edgeRows.push({ type: '达标临界', student, subject, score, gap: round(line.pass - score, 1), note: `距达标线 ${round(line.pass - score, 1)} 分` });
                }
                const totalRank = student.ranks?.total?.grade || totalCount;
                const subjectRank = student.ranks?.[subject]?.grade || totalCount;
                if (totalRank <= totalCount * 0.4 && subjectRank >= totalCount * 0.6) {
                    biasRows.push({ type: '偏科提醒', student, subject, score, gap: subjectRank, note: `总分靠前，单科年级第 ${subjectRank} 名` });
                }
            });
            const totalRank = student.ranks?.total?.grade;
            if (Number.isFinite(Number(student.total)) && totalRank) {
                const weak = getStudentWeakestSubject(student);
                if (weak && totalRank > totalCount * 2 / 3) {
                    supportRows.push({
                        type: '后1/3托底',
                        student,
                        subject: weak.subject,
                        score: weak.score,
                        gap: totalRank,
                        note: `总分年级第 ${totalRank} 名，${weak.subject}得分率 ${round(weak.rate * 100, 1)}%`
                    });
                }
                if (totalRank > totalCount * 0.35 && totalRank <= totalCount * 0.75) {
                    const nearPass = subjects
                        .map((subject) => {
                            const score = Number(student.scores?.[subject]);
                            const pass = Number(state.thresholds[subject]?.pass || 0);
                            const windowSize = Math.max(3, getSubjectMaxScore(subject) * 0.06);
                            if (!Number.isFinite(score) || !pass || score >= pass || score < pass - windowSize) return null;
                            return { subject, score, gap: round(pass - score, 1) };
                        })
                        .filter(Boolean)
                        .sort((a, b) => a.gap - b.gap)[0];
                    if (nearPass) {
                        potentialRows.push({
                            type: '潜力提升',
                            student,
                            subject: nearPass.subject,
                            score: nearPass.score,
                            gap: nearPass.gap,
                            note: `总分校内${student.localLayer || 'B'}层，${nearPass.subject}距达标线 ${nearPass.gap} 分`
                        });
                    }
                }
            }
        });
        state.studentAlerts = [
            ...edgeRows.sort((a, b) => a.gap - b.gap).slice(0, 10),
            ...supportRows.sort((a, b) => b.gap - a.gap).slice(0, 8),
            ...potentialRows.sort((a, b) => a.gap - b.gap).slice(0, 8),
            ...biasRows.sort((a, b) => b.gap - a.gap).slice(0, 8)
        ];
    }

    function getStudentWeakestSubject(student) {
        return getAnalysisSubjects()
            .map((subject) => {
                const score = Number(student.scores?.[subject]);
                const maxScore = getSubjectMaxScore(subject);
                if (!Number.isFinite(score) || !maxScore) return null;
                return { subject, score, rate: score / maxScore };
            })
            .filter(Boolean)
            .sort((a, b) => a.rate - b.rate)[0] || null;
    }

    function buildImportDiagnostics() {
        const analysisStudents = getAnalysisStudents();
        const subjects = getAnalysisSubjects();
        const blankCounts = {};
        const absentCounts = {};
        const reasonCounts = {};
        const overMaxRows = [];
        analysisStudents.forEach((student) => {
            subjects.forEach((subject) => {
                if (student.blankScores?.[subject]) blankCounts[subject] = Number(blankCounts[subject] || 0) + 1;
                if (student.absentScores?.[subject]) absentCounts[subject] = Number(absentCounts[subject] || 0) + 1;
                const reason = student.scoreReasons?.[subject] || 'present';
                if (!reasonCounts[subject]) reasonCounts[subject] = {};
                reasonCounts[subject][reason] = Number(reasonCounts[subject][reason] || 0) + 1;
                const score = Number(student.scores?.[subject]);
                const rawScore = Number(student.rawScores?.[subject]);
                const maxScore = getSubjectMaxScore(subject);
                const rule = state.scoreAdjustments?.[subject] || {};
                const sourceMax = Number(rule.sourceMax || getConfiguredSourceMaxScore(subject, { useDefault: true }) || maxScore);
                const hasConfiguredSourceMax = Number.isFinite(getConfiguredSourceMaxScore(subject, { useDefault: true }));
                if (Number.isFinite(rawScore) && maxScore > 0 && rawScore > maxScore + 0.001 && !hasConfiguredSourceMax) {
                    overMaxRows.push({ className: student.className, name: student.name, id: student.id, subject, score: rawScore, maxScore, stage: '需确认原始满分' });
                }
                if (Number.isFinite(rawScore) && sourceMax > 0 && rawScore > sourceMax + 0.001) {
                    overMaxRows.push({ className: student.className, name: student.name, id: student.id, subject, score: rawScore, maxScore: sourceMax, stage: '原始分' });
                }
                if (Number.isFinite(score) && maxScore > 0 && score > maxScore + 0.001) {
                    overMaxRows.push({ className: student.className, name: student.name, id: student.id, subject, score, maxScore, stage: '折算后' });
                }
            });
        });
        const gradeScope = getGradeScopeStats();
        const extraSubjects = subjects.filter((subject) => !getTotalSubjects().includes(subject));
        const rosterDiagnostics = buildRosterDiagnostics();
        state.rosterDiagnostics = rosterDiagnostics;
        state.importDiagnostics = {
            blankCounts,
            absentCounts,
            reasonCounts,
            overMaxRows,
            extraSubjects,
            gradeScope,
            rosterDiagnostics,
            duplicateConflicts: state.importStats.duplicateConflicts || [],
            teacherSameName: state.teacherDiagnostics?.sameName || [],
            teacherNoIdCount: state.teacherDiagnostics?.noIdCount || 0
        };
        buildAnalysisGate();
    }

    function buildRosterDiagnostics() {
        const rosterRows = getRosterInScope();
        const analysisStudents = getAnalysisStudents();
        const studentKeySet = new Set();
        analysisStudents.forEach((student) => {
            getStudentMatchKeys(student).forEach((key) => studentKeySet.add(key));
        });
        const rosterKeySet = new Set();
        const missingFromScores = [];
        const statusCounts = {};
        rosterRows.forEach((item) => {
            const status = normalizeRosterStatus(item.status);
            statusCounts[status] = Number(statusCounts[status] || 0) + 1;
            const keys = getReferenceMatchKeys(item);
            keys.forEach((key) => rosterKeySet.add(key));
            if (!keys.some((key) => studentKeySet.has(key))) missingFromScores.push(item);
        });
        const extraInScores = rosterRows.length
            ? analysisStudents.filter((student) => !getStudentMatchKeys(student).some((key) => rosterKeySet.has(key)))
            : [];
        return { totalRoster: rosterRows.length, missingFromScores, extraInScores, statusCounts };
    }

    function buildAnalysisGate() {
        const diag = state.importDiagnostics || {};
        const analysisStudents = getAnalysisStudents();
        const subjects = getAnalysisSubjects();
        const totalSubjects = getTotalSubjects();
        const gate = { blocks: [], warnings: [], infos: [] };
        const add = (level, title, body) => gate[level].push({ title, body });
        if (state.students.length && !analysisStudents.length) {
            add('blocks', '当前年级无学生', `已导入 ${state.students.length} 人，但没有识别到 ${currentConfig().label} 学生，请检查班级格式或年级选择。`);
        }
        if (analysisStudents.length && !subjects.length) {
            add('blocks', '未识别成绩学科', '成绩表没有识别到可计算的学科列，请在成绩列映射中修正。');
        }
        if (analysisStudents.length && !totalSubjects.length) {
            add('blocks', '总分科目为空', `当前 ${currentConfig().totalLabel} 没有纳入任何学科，请在计算口径中勾选总分科目。`);
        }
        const blockingOverMaxRows = (diag.overMaxRows || []).filter((item) => totalSubjects.includes(item.subject));
        if (blockingOverMaxRows.length) {
            add('blocks', '总分科目存在超满分', `${blockingOverMaxRows.length} 条总分科目成绩超过配置满分或未确认原始满分，需先修正口径。`);
        } else if (diag.overMaxRows?.length) {
            add('warnings', '单科诊断存在超满分', `${diag.overMaxRows.length} 条非总分科目成绩超过当前配置，单科结论需先核对满分。`);
        }
        const missingCore = state.grade === 9 ? CORE_GRADE9.filter((subject) => !subjects.includes(subject)) : [];
        if (missingCore.length) {
            add('warnings', '九年级核心科目不完整', `当前没有识别到 ${missingCore.join('、')}，总分排名会只统计已识别且已纳入口径的科目。`);
        }
        const completeTotal = analysisStudents.filter((student) => Number.isFinite(Number(student.total))).length;
        if (analysisStudents.length && totalSubjects.length && completeTotal / analysisStudents.length < 0.85) {
            add('warnings', '总分有效人数偏低', `${completeTotal}/${analysisStudents.length} 人具备完整总分科目，缺科学生不会进入总分均分和总分排名。`);
        }
        if (diag.duplicateConflicts?.length) {
            add('warnings', '重复学生分数冲突', `${diag.duplicateConflicts.length} 项重复导入冲突已采用后导入值，建议导出“重复冲突”核对。`);
        } else if (state.importStats.duplicateStudents) {
            add('infos', '重复学生已合并', `已按学校、班级、考号/姓名合并 ${state.importStats.duplicateStudents} 条重复记录。`);
        }
        if (sumObjectValues(diag.blankCounts || {})) {
            add('warnings', '存在空白成绩', `空白成绩当前口径：${getBlankScoreModeText()}。如空白代表未参考，可切换口径后再确认。`);
        }
        if (sumObjectValues(diag.absentCounts || {})) {
            add('warnings', '存在缺考/异常成绩', '系统已识别缺考、免考、缓考、作弊等标记，并在诊断表中分学科统计。');
        }
        const roster = diag.rosterDiagnostics || state.rosterDiagnostics || {};
        if (roster.totalRoster) {
            if (roster.missingFromScores?.length) add('warnings', '参考名单有人未出现在成绩表', `${roster.missingFromScores.length} 人在参考名单中，但成绩表没有匹配到。`);
            if (roster.extraInScores?.length) add('warnings', '成绩表有人不在参考名单', `${roster.extraInScores.length} 人有成绩但不在参考名单，可能是转入或名单未更新。`);
            add('infos', '参考名单已参与校验', `名单 ${roster.totalRoster} 人；状态分布：${formatStatusCounts(roster.statusCounts)}。`);
        }
        if (state.teacherCoverage.unmatched?.length) {
            add('warnings', '任课表未完全匹配', `${state.teacherCoverage.unmatched.length} 条任课没有匹配到当前班级、范围或学科成绩。`);
        } else if (state.teachers.length) {
            add('infos', '任课表匹配正常', `已匹配 ${state.teacherCoverage.matched} 条班级-学科-教师映射。`);
        }
        if (!state.weightConfigLocked) {
            add('infos', '评价权重未锁定', '当前权重可继续调整；正式留档前建议锁定，避免误改口径。');
        }
        if (!gate.blocks.length && !gate.warnings.length && analysisStudents.length) {
            add('infos', '导入检查通过', '未发现会阻断计算的导入风险，可以确认生成正式分析。');
        }
        state.analysisGate = gate;
        return gate;
    }

    function getRosterInScope() {
        return (state.referenceRoster || []).filter((item) => {
            const sameSchool = !state.activeSchool || !item.school || cleanText(item.school) === state.activeSchool;
            const grade = getStudentGrade(item);
            return sameSchool && (!grade || grade === state.grade);
        });
    }

    function referenceKey(item) {
        const school = cleanText(item.school);
        const className = cleanText(item.className);
        const id = cleanText(item.id);
        const name = cleanName(item.name);
        if (id) return `${school}__${className}__id:${id}`;
        if (name) return `${school}__${className}__name:${name}`;
        return '';
    }

    function getReferenceMatchKeys(item) {
        return getStudentMatchKeys(item);
    }

    function getStudentMatchKeys(student) {
        const school = cleanText(student.school || state.activeSchool);
        const className = cleanText(student.className);
        const id = cleanText(student.id);
        const name = cleanName(student.name);
        const keys = [];
        if (id) {
            keys.push(`${school}__${className}__id:${id}`);
            keys.push(`${school}__id:${id}`);
            keys.push(`id:${id}`);
        }
        if (name) {
            keys.push(`${school}__${className}__name:${name}`);
            keys.push(`${school}__name:${name}`);
            keys.push(`name:${name}`);
        }
        return [...new Set(keys.filter(Boolean))];
    }

    function normalizeRosterStatus(value) {
        const text = cleanText(value) || '参考';
        if (/不参考|未参考|转出|休学|退学/.test(text)) return '不参考/转出';
        if (/缺考|缺|未考/.test(text)) return '缺考';
        if (/免考|免试/.test(text)) return '免考';
        if (/缓考|病假|请假/.test(text)) return '缓考/请假';
        if (/转入|新转/.test(text)) return '转入';
        return '参考';
    }

    function formatStatusCounts(counts) {
        const parts = Object.entries(counts || {}).map(([key, value]) => `${key}${value}`);
        return parts.length ? parts.join('、') : '无';
    }

    function renderAll() {
        renderShell();
        renderMetrics();
        renderCharts();
        renderInsights();
        renderImportLog();
        renderScoreMapping();
        renderPreflightPanel();
        renderScoreRules();
        renderSchemeTemplates();
        renderWeightConfig();
        renderClassTable();
        renderClassDrilldown();
        renderSubjectMatrix();
        renderDistributionTable();
        renderTeacherTables();
        renderTeacherExplanation();
        renderPairing();
        renderStudentFilters();
        renderStudentTable();
        renderStudentReport();
        renderStudentAlerts();
        renderExamComparison();
        renderCloudPanel();
        renderPrivacyPanel();
    }

    function renderShell() {
        const config = currentConfig();
        renderSchoolSelect();
        els.railGradeLabel.textContent = config.label;
        els.railTotalLabel.textContent = config.totalLabel;
        const analysisStudents = getAnalysisStudents();
        els.topbarCopy.textContent = state.students.length
            ? `${state.activeSchool || '当前学校'}：${analysisStudents.length} 名学生，${getClasses().length} 个班级，${getAnalysisSubjects().length} 个学科。`
            : '本地解析成绩与任课表，生成班级、学科、学生和教师画像。';
        if (els.subjectRadarNote) {
            els.subjectRadarNote.textContent = state.grade === 9
                ? '9 年级五科总只纳入语数英物化。'
                : `${currentConfig().label}总分只纳入年级配置内学科，额外列保留单科诊断。`;
        }
    }

    function renderSchoolSelect() {
        const schools = getSchoolNames();
        const picker = document.getElementById('school-picker');
        if (!els.schoolSelect || !picker) return;
        picker.style.display = schools.length ? 'inline-flex' : 'none';
        els.schoolSelect.innerHTML = schools.map((school) => `<option value="${escapeAttr(school)}">${escapeHtml(school)}</option>`).join('');
        if (schools.includes(state.activeSchool)) {
            els.schoolSelect.value = state.activeSchool;
        }
    }

    function renderMetrics() {
        const analysisStudents = getAnalysisStudents();
        const analysisSubjects = getAnalysisSubjects();
        const totalMetrics = metricSummary(analysisStudents.map((student) => student.total), state.thresholds.total || {}, getTotalMaxScore());
        const teacherCount = state.finalTeacherRows.length;
        const items = [
            { label: '学生数', value: analysisStudents.length, note: `${getClasses().length} 个班级` },
            { label: '学科数', value: analysisSubjects.length, note: getTotalSubjects().join('、') || '未识别' },
            { label: '总分均分', value: totalMetrics.count ? totalMetrics.avg.toFixed(1) : '-', note: `${currentConfig().totalLabel}口径` },
            { label: '可分析教师', value: teacherCount, note: `${state.teachers.length} 条任课映射，${state.teacherCoverage.unmatched.length} 条未匹配` }
        ];
        els.metricGrid.innerHTML = items.map((item) => `
            <div class="metric-card">
                <span>${escapeHtml(item.label)}</span>
                <strong>${escapeHtml(item.value)}</strong>
                <em>${escapeHtml(item.note)}</em>
            </div>
        `).join('');

        els.analysisStatus.textContent = state.students.length ? '已生成' : '等待数据';
        els.analysisStatus.className = state.students.length ? 'status-pill ok' : 'status-pill warn';
    }

    function renderCharts() {
        if (!window.Chart) return;
        const classLabels = state.classRows.map((row) => row.className);
        const classValues = state.classRows.map((row) => round(row.metrics.total.avg, 1));
        drawChart('classTotals', els.classTotalChart, {
            type: 'bar',
            data: {
                labels: classLabels.length ? classLabels : ['暂无'],
                datasets: [{ label: '总分均分', data: classValues.length ? classValues : [0], borderRadius: 6, backgroundColor: '#2563eb' }]
            },
            options: chartOptions('总分均分')
        });

        const subjectLabels = state.subjectRows.map((row) => row.subject);
        const subjectValues = state.subjectRows.map((row) => {
            const maxScore = getSubjectMaxScore(row.subject);
            return maxScore > 0 ? round((row.avg / maxScore) * 100, 1) : 0;
        });
        drawChart('subjectRadar', els.subjectRadarChart, {
            type: 'radar',
            data: {
                labels: subjectLabels.length ? subjectLabels : ['暂无'],
                datasets: [{
                    label: '均分得分率',
                    data: subjectValues.length ? subjectValues : [0],
                    backgroundColor: 'rgba(15, 118, 110, 0.16)',
                    borderColor: '#0f766e',
                    pointBackgroundColor: '#0f766e'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                plugins: { legend: { display: false } },
                scales: { r: { beginAtZero: true, suggestedMax: 100, ticks: { backdropColor: 'transparent', callback: (value) => `${value}%` } } }
            }
        });

        const bandRows = buildScoreBandRows();
        drawChart('scoreBands', els.scoreBandChart, {
            type: 'bar',
            data: {
                labels: bandRows.map((row) => row.label),
                datasets: [{
                    label: '人数',
                    data: bandRows.map((row) => row.count),
                    backgroundColor: ['#047857', '#2563eb', '#b45309', '#b91c1c'],
                    borderRadius: 6
                }]
            },
            options: chartOptions('人数')
        });
    }

    function renderInsights() {
        const analysisStudents = getAnalysisStudents();
        const missingTeacher = analysisStudents.length && !state.teachers.length;
        const totalSubjects = getTotalSubjects();
        const extraSingleSubjects = getAnalysisSubjects().filter((subject) => !totalSubjects.includes(subject));
        const gradeScope = getGradeScopeStats();
        const importDiagnosticText = getImportDiagnosticSummary();
        const adjustmentSummary = getScoreAdjustmentSummary();
        const weakClass = state.classRows.slice().sort((a, b) => a.qualityScore - b.qualityScore)[0];
        const topSubject = state.subjectRows.slice().sort((a, b) => b.scoreRate - a.scoreRate)[0];
        const items = [
            missingTeacher
                ? { title: '任课表缺失', body: '教师画像需要导入班级、学科、教师姓名映射。' }
                : { title: '任课映射', body: `${state.teachers.length} 条映射，已覆盖 ${new Set(state.teachers.map((item) => item.subject)).size} 个学科。` },
            gradeScope.otherCount
                ? { title: '年级筛选', body: `当前只分析 ${currentConfig().label} ${analysisStudents.length} 人，已排除其他年级 ${gradeScope.otherCount} 人。` }
                : { title: '年级筛选', body: `当前 ${currentConfig().label} 进入分析 ${analysisStudents.length} 人。` },
            extraSingleSubjects.length
                ? { title: '单科诊断', body: `${extraSingleSubjects.join('、')} 不计入${currentConfig().totalLabel}，只保留单科分析。` }
                : { title: '总分口径', body: `${currentConfig().totalLabel}：${totalSubjects.join('、') || '等待学科识别'}。` },
            { title: '满分口径', body: getMaxScoreSummary() },
            adjustmentSummary
                ? { title: '成绩折算', body: adjustmentSummary }
                : { title: '成绩折算', body: '按原始满分确认表折算；未配置原始满分的科目保持自动推断并封顶。' },
            weakClass
                ? { title: '班级关注', body: `${weakClass.className} 综合分 ${weakClass.qualityScore.toFixed(1)}，托底发展 ${Number(weakClass.developmentScore || 0).toFixed(1)}。` }
                : { title: '班级关注', body: '导入成绩后自动生成班级站位。' },
            topSubject
                ? { title: '学科状态', body: `${topSubject.subject} 得分率 ${(topSubject.scoreRate * 100).toFixed(1)}%，样本 ${topSubject.count} 人。` }
                : { title: '学科状态', body: '导入成绩后自动生成各科均分与两率。' },
            state.studentAlerts.length
                ? { title: '学生名单', body: `已筛出 ${state.studentAlerts.length} 条临界、托底或偏科提醒。` }
                : { title: '学生名单', body: '当前暂无临界、托底或偏科提醒。' },
            state.finalTeacherRows.length
                ? { title: '教师总榜', body: `第 1 名：${state.finalTeacherRows[0].teacher}，最终分 ${state.finalTeacherRows[0].overallScore.toFixed(1)}。` }
                : { title: '教师总榜', body: '导入任课表后生成同学科校正排名。' },
            state.teacherCoverage.unmatched.length
                ? { title: '任课表提醒', body: `${state.teacherCoverage.unmatched.length} 条任课没有匹配到当前学校班级或学科成绩。` }
                : { title: '任课表匹配', body: state.teachers.length ? '任课表已和当前学校班级成绩对应。' : '等待导入任课表。' },
            state.teacherDiagnostics.sameName.length
                ? { title: '同名教师', body: `${state.teacherDiagnostics.sameName.length} 个姓名存在多个编号，已按编号分开统计。` }
                : { title: '教师身份', body: state.teacherDiagnostics.noIdCount ? `${state.teacherDiagnostics.noIdCount} 个教师姓名未带编号；如有同名，请在任课表加教师编号。` : '教师身份未发现同名编号冲突。' },
            { title: '导入诊断', body: importDiagnosticText }
        ];
        els.insightGrid.innerHTML = items.map((item) => insightCard(item.title, item.body)).join('');
    }

    function renderImportLog() {
        els.importLog.textContent = state.logs.length ? state.logs.slice(-8).join('\n') : '暂无导入记录。';
    }

    function getImportDiagnosticSummary() {
        const diag = state.importDiagnostics || {};
        const blankTotal = sumObjectValues(diag.blankCounts || {});
        const absentTotal = sumObjectValues(diag.absentCounts || {});
        const parts = [];
        if (blankTotal) parts.push(`空白 ${blankTotal}`);
        if (absentTotal) parts.push(`缺考 ${absentTotal}`);
        if (diag.duplicateConflicts?.length) parts.push(`重复冲突 ${diag.duplicateConflicts.length}`);
        if (diag.overMaxRows?.length) parts.push(`超满分 ${diag.overMaxRows.length}`);
        if (diag.gradeScope?.otherCount) parts.push(`其他年级 ${diag.gradeScope.otherCount}`);
        if (diag.extraSubjects?.length) parts.push(`额外学科 ${diag.extraSubjects.join('、')}`);
        if (diag.rosterDiagnostics?.missingFromScores?.length) parts.push(`名单未匹配 ${diag.rosterDiagnostics.missingFromScores.length}`);
        if (diag.rosterDiagnostics?.extraInScores?.length) parts.push(`成绩未入名单 ${diag.rosterDiagnostics.extraInScores.length}`);
        return parts.length ? parts.join('；') : '未发现明显导入风险。';
    }

    function renderScoreMapping() {
        if (!els.scoreMappingTable) return;
        els.scoreMappingTable.querySelector('thead').innerHTML = `
            <tr>
                <th>文件</th><th>Sheet</th><th>学科</th><th>自动识别列</th><th>当前采用列</th><th>手动指定</th><th>来源判断</th>
            </tr>
        `;
        const rows = state.scoreMappingRows || [];
        els.scoreMappingTable.querySelector('tbody').innerHTML = rows.length
            ? rows.map((row) => `
                <tr>
                    <td>${escapeHtml(row.fileName)}</td>
                    <td>${escapeHtml(row.sheetName)}</td>
                    <td><strong>${escapeHtml(row.subject)}</strong></td>
                    <td>${escapeHtml(row.autoColumns)}</td>
                    <td>${escapeHtml(row.currentColumns)}</td>
                    <td>
                        <select class="mapping-select" data-source-id="${escapeAttr(row.sourceId)}" data-score-map-subject="${escapeAttr(row.subject)}">
                            <option value="auto">自动：${escapeHtml(row.autoColumns)}</option>
                            ${(row.candidates || []).map((candidate) => `
                                <option value="${candidate.index}" ${row.override === candidate.index ? 'selected' : ''}>${escapeHtml(candidate.header)}（第 ${candidate.index + 1} 列）</option>
                            `).join('')}
                        </select>
                    </td>
                    <td>${scoreSourceHintText(row.sourceHint)}</td>
                </tr>
            `).join('')
            : emptyRow(7, '选择并解析成绩文件后显示列映射。');
    }

    function scoreSourceHintText(value) {
        const map = { converted: '已折算列', raw: '原始/分卷列', plain: '普通成绩列' };
        return map[value] || '普通成绩列';
    }

    function renderPreflightPanel() {
        if (!els.preflightPanel) return;
        const gate = buildAnalysisGate();
        const analysisStudents = getAnalysisStudents();
        if (!state.students.length) {
            els.preflightPanel.innerHTML = '<div class="empty">解析成绩后显示导入前校验。</div>';
            if (els.confirmAnalysisBtn) {
                els.confirmAnalysisBtn.disabled = true;
                els.confirmAnalysisBtn.textContent = '确认生成正式分析';
            }
            return;
        }
        const groups = [
            { key: 'blocks', label: '阻断', tone: 'block' },
            { key: 'warnings', label: '提醒', tone: 'warn' },
            { key: 'infos', label: '通过', tone: '' }
        ];
        const items = groups.flatMap((group) => (gate[group.key] || []).map((item) => ({ ...item, ...group })));
        els.preflightPanel.innerHTML = `
            <div class="detail-grid">
                ${detailItem('当前分析学生', analysisStudents.length)}
                ${detailItem('总分科目', getTotalSubjects().join('、') || '-')}
                ${detailItem('导入状态', gate.blocks.length ? `${gate.blocks.length} 项阻断` : (state.analysisConfirmed ? '已确认' : '待确认'))}
                ${detailItem('耗时', `${state.performanceStats.lastAnalyzeMs || 0} ms`)}
            </div>
            <div class="gate-list">
                ${items.map((item) => `
                    <div class="gate-item ${item.tone}">
                        <strong>${escapeHtml(item.label)}：${escapeHtml(item.title)}</strong>
                        <span>${escapeHtml(item.body)}</span>
                    </div>
                `).join('') || '<div class="empty">暂无校验项。</div>'}
            </div>
        `;
        if (els.confirmAnalysisBtn) {
            els.confirmAnalysisBtn.disabled = Boolean(gate.blocks.length || !analysisStudents.length);
            els.confirmAnalysisBtn.textContent = gate.blocks.length
                ? '存在阻断项'
                : (state.analysisConfirmed ? '已确认正式分析' : '确认生成正式分析');
        }
    }

    function renderScoreRules() {
        if (els.blankScoreMode) els.blankScoreMode.value = state.blankScoreMode || 'zero';
        if (!els.scoreRuleTable) return;
        const subjects = getRuleSubjects();
        els.scoreRuleTable.querySelector('thead').innerHTML = `
            <tr>
                <th>学科</th><th>配置满分</th><th>导入最高分</th><th>原始满分</th><th>折算系数</th><th>总分口径</th>
            </tr>
        `;
        els.scoreRuleTable.querySelector('tbody').innerHTML = subjects.length
            ? subjects.map((subject) => {
                const rule = state.scoreAdjustments?.[subject] || {};
                const override = getSourceMaxOverride(subject);
                const resolved = Number(rule.sourceMax || getConfiguredSourceMaxScore(subject, { useDefault: true }));
                const inputValue = Number.isFinite(override) && override > 0
                    ? override
                    : (Number.isFinite(resolved) && resolved > 0 ? resolved : '');
                const totalSubjectSet = getAnalysisSubjects().length ? getTotalSubjects() : getConfiguredTotalSubjects();
                const totalIncluded = totalSubjectSet.includes(subject);
                return `
                    <tr>
                        <td>${escapeHtml(subject)}</td>
                        <td>
                            <input class="score-rule-input" type="number" min="1" step="0.1" value="${escapeAttr(getSubjectMaxScore(subject))}" data-target-max-subject="${escapeAttr(subject)}">
                        </td>
                        <td>${formatScore(rule.observedMax, 1)}</td>
                        <td>
                            <input class="score-rule-input" type="number" min="1" step="0.1" placeholder="自动" value="${escapeAttr(inputValue)}" data-source-max-subject="${escapeAttr(subject)}">
                        </td>
                        <td>${Number.isFinite(Number(rule.scale)) ? Number(rule.scale).toFixed(4) : '-'}</td>
                        <td>
                            <label class="setting-control">
                                <input type="checkbox" data-total-subject="${escapeAttr(subject)}" ${totalIncluded ? 'checked' : ''}>
                                <span>${totalIncluded ? '计入总分' : '单科诊断'}</span>
                            </label>
                        </td>
                    </tr>
                `;
            }).join('')
            : emptyRow(6);
    }

    function renderSchemeTemplates() {
        if (!els.schemeTemplateSelect) return;
        const templates = getExamSchemeTemplates();
        els.schemeTemplateSelect.innerHTML = templates.length
            ? templates.map((item) => `<option value="${escapeAttr(item.id)}">${escapeHtml(item.name)}</option>`).join('')
            : '<option value="">暂无方案</option>';
    }

    function renderWeightConfig() {
        if (!els.weightConfigTable) return;
        if (els.lockWeightConfig) els.lockWeightConfig.checked = Boolean(state.weightConfigLocked);
        els.weightConfigTable.querySelector('thead').innerHTML = '<tr><th>项目</th><th>权重/系数</th><th>说明</th></tr>';
        const descriptions = {
            classRelative: '班级间相对比较，仍使用当前年级两率一分权重。',
            classAbsolute: '按满分得分率、卷面及格率等绝对达成评价。',
            classBalance: '学科得分率越均衡，该项越高。',
            classDevelopment: '看校内后 1/3 学生、班级后 1/3 均分和历史进步，更适合单校托底诊断。',
            classLowPenalty: '低分率扣分系数，最终扣分封顶 10 分。',
            teacherQuality: '教师学科项以质量分为主。',
            teacherRelative: '教师同学科内相对百分位，防止只看原始差距。',
            teacherHistory: '有历史基准时按学生进步幅度做轻量校正。',
            teacherConversion: '有历史基准时看临界生达标、低分转出；无基准时只作中性提醒。'
        };
        els.weightConfigTable.querySelector('tbody').innerHTML = Object.keys(DEFAULT_EVALUATION_WEIGHTS).map((key) => `
            <tr>
                <td>${escapeHtml(EVALUATION_WEIGHT_LABELS[key] || key)}</td>
                <td><input class="weight-input" type="number" min="0" step="1" value="${escapeAttr(state.evaluationWeights[key] ?? DEFAULT_EVALUATION_WEIGHTS[key])}" data-weight-key="${escapeAttr(key)}" ${state.weightConfigLocked ? 'disabled' : ''}></td>
                <td>${escapeHtml(descriptions[key] || '')}</td>
            </tr>
        `).join('');
    }

    function renderClassTable() {
        const table = els.classTable;
        table.querySelector('thead').innerHTML = `
            <tr>
                <th>排名</th><th>班级</th><th>人数</th><th>总分有效</th><th>总分均分</th><th>优秀率</th><th>达标率(前50%)</th><th>卷面及格率</th><th>低分率</th><th>后1/3均分</th><th>校内后1/3占比</th><th>临界人数</th><th>学科均衡</th><th>托底发展</th><th>综合分</th><th>风险提示</th>
            </tr>
        `;
        table.querySelector('tbody').innerHTML = state.classRows.length
            ? state.classRows.map((row) => `
                <tr>
                    <td>${rankBadge(row.rank)}</td>
                    <td>${escapeHtml(row.className)}</td>
                    <td>${row.studentCount}</td>
                    <td>${row.completeTotalCount}</td>
                    <td>${formatScore(row.metrics.total.avg, 2)}</td>
                    <td>${percent(row.metrics.total.excRate)}</td>
                    <td>${percent(row.metrics.total.passRate)}</td>
                    <td>${formatNullablePercent(row.metrics.total.paperPassRate)}</td>
                    <td>${percent(row.metrics.total.lowRate)}</td>
                    <td>${formatScore(row.bottomThirdAvg, 2)}</td>
                    <td>${percent(row.gradeBottomShare || 0)}</td>
                    <td>${row.marginalCount || 0}</td>
                    <td>${row.balanceScore.toFixed(1)}</td>
                    <td>${Number(row.developmentScore || 0).toFixed(1)}</td>
                    <td><strong>${row.qualityScore.toFixed(1)}</strong></td>
                    <td>${riskText(row.riskFlags)}</td>
                </tr>
            `).join('')
            : emptyRow(16);
    }

    function renderClassDrilldown() {
        if (!els.classDrilldownSelect || !els.classDrilldownPanel) return;
        const classes = state.classRows.map((row) => row.className);
        const keep = classes.includes(state.selectedClassName) ? state.selectedClassName : (classes[0] || '');
        state.selectedClassName = keep;
        els.classDrilldownSelect.innerHTML = classes.length
            ? classes.map((className) => `<option value="${escapeAttr(className)}">${escapeHtml(className)}</option>`).join('')
            : '<option value="">暂无班级</option>';
        els.classDrilldownSelect.value = keep;
        const row = state.classRows.find((item) => item.className === keep);
        if (!row) {
            els.classDrilldownPanel.innerHTML = '<div class="empty">导入成绩后显示班级下钻。</div>';
            return;
        }
        const weakSubjects = Object.entries(row.subjects)
            .map(([subject, metric]) => ({ subject, ...metric, rate: getSubjectMaxScore(subject) ? metric.avg / getSubjectMaxScore(subject) : 0 }))
            .sort((a, b) => a.rate - b.rate)
            .slice(0, 3);
        const students = getAnalysisStudents().filter((student) => student.className === row.className);
        const lowStudents = students
            .filter((student) => Number.isFinite(Number(student.total)))
            .sort((a, b) => a.total - b.total)
            .slice(0, 8);
        els.classDrilldownPanel.innerHTML = `
            <div class="detail-grid">
                ${detailItem('班级', row.className)}
                ${detailItem('总分均分', formatScore(row.metrics.total.avg, 2))}
                ${detailItem('有效/人数', `${row.completeTotalCount}/${row.studentCount}`)}
                ${detailItem('后1/3均分', formatScore(row.bottomThirdAvg, 2))}
                ${detailItem('托底发展分', Number(row.developmentScore || 0).toFixed(1))}
                ${detailItem('校内后1/3占比', percent(row.gradeBottomShare || 0))}
                ${detailItem('临界人数', `${row.marginalCount || 0} 人`)}
                ${detailItem('风险', row.riskFlags?.length ? row.riskFlags.join('、') : '正常')}
            </div>
            <table class="mini-table">
                <thead><tr><th>薄弱学科</th><th>均分</th><th>得分率</th><th>班内优秀率</th><th>卷面及格率</th></tr></thead>
                <tbody>${weakSubjects.map((item) => `
                    <tr><td>${escapeHtml(item.subject)}</td><td>${formatScore(item.avg, 2)}</td><td>${percent(item.rate)}</td><td>${percent(item.excRate)}</td><td>${formatNullablePercent(item.paperPassRate)}</td></tr>
                `).join('') || emptyRow(5)}</tbody>
            </table>
            <table class="mini-table">
                <thead><tr><th>重点关注学生</th><th>总分</th><th>班排</th><th>缺少总分科目</th></tr></thead>
                <tbody>${lowStudents.map((student) => `
                    <tr><td>${escapeHtml(student.name)}</td><td>${formatScore(student.total, 2)}</td><td>${student.ranks?.total?.class || '-'}</td><td>${escapeHtml((student.totalMissingSubjects || []).join('、') || '-')}</td></tr>
                `).join('') || emptyRow(4)}</tbody>
            </table>
        `;
    }

    function renderSubjectMatrix() {
        const table = els.subjectMatrixTable;
        const classes = state.classRows.map((row) => row.className);
        table.querySelector('thead').innerHTML = `<tr><th>学科</th><th>年级均分</th>${classes.map((name) => `<th>${escapeHtml(name)}</th>`).join('')}</tr>`;
        table.querySelector('tbody').innerHTML = state.subjectRows.length
            ? state.subjectRows.map((row) => `
                <tr>
                    <td><strong>${escapeHtml(row.subject)}</strong></td>
                    <td>${formatScore(row.avg, 2)}</td>
                    ${classes.map((className) => {
                        const item = row.classMetrics.find((metric) => metric.className === className);
                        return `<td>${item ? `${formatScore(item.avg, 2)} / ${rankBadge(item.rank)}` : '-'}</td>`;
                    }).join('')}
                </tr>
            `).join('')
            : emptyRow(Math.max(2, classes.length + 2));
    }

    function renderDistributionTable() {
        if (!els.distributionTable) return;
        const rows = buildDistributionRows();
        els.distributionTable.querySelector('thead').innerHTML = `
            <tr>
                <th>项目</th><th>满分</th><th>人数</th><th>均分</th><th>标准差</th><th>最低</th><th>Q1</th><th>中位数</th><th>Q3</th><th>最高</th><th>优秀段(≥85%)</th><th>良好段(75%-85%)</th><th>及格段(60%-75%)</th><th>低分段(<60%)</th>
            </tr>
        `;
        els.distributionTable.querySelector('tbody').innerHTML = rows.length
            ? rows.map((row) => `
                <tr>
                    <td>${escapeHtml(row.label)}</td><td>${row.maxScore}</td><td>${row.count}</td><td>${formatScore(row.avg, 2)}</td><td>${formatScore(row.sd, 2)}</td>
                    <td>${formatScore(row.min, 2)}</td><td>${formatScore(row.q1, 2)}</td><td>${formatScore(row.median, 2)}</td><td>${formatScore(row.q3, 2)}</td><td>${formatScore(row.max, 2)}</td>
                    <td>${percent(row.bandExcellent)}</td><td>${percent(row.bandGood)}</td><td>${percent(row.bandPass)}</td><td>${percent(row.bandLow)}</td>
                </tr>
            `).join('')
            : emptyRow(14);
    }

    function renderTeacherTables() {
        renderTeacherRankSubjects();
        renderTeacherFinalTable();
        renderTeacherDetailTable();
    }

    function renderTeacherRankSubjects() {
        if (!els.teacherRankSubjectList) return;
        const subjects = getAnalysisSubjects();
        const selected = new Set(getTeacherRankSubjects());
        els.teacherRankSubjectList.innerHTML = subjects.length
            ? subjects.map((subject) => `
                <label class="check-chip">
                    <input type="checkbox" data-teacher-rank-subject="${escapeAttr(subject)}" ${selected.has(subject) ? 'checked' : ''}>
                    <span>${escapeHtml(subject)}</span>
                </label>
            `).join('')
            : '<span class="muted-note">导入成绩后可选择进入教师最终排名的学科。</span>';
    }

    function renderTeacherFinalTable() {
        const table = els.teacherFinalTable;
        table.querySelector('thead').innerHTML = `
            <tr>
                <th>最终排名</th><th>教师</th><th>教师编号</th><th>最终分</th><th>任教学科 / 班级</th><th>覆盖学生</th><th>风险提示</th><th>学科质量分</th>
            </tr>
        `;
        table.querySelector('tbody').innerHTML = state.finalTeacherRows.length
            ? state.finalTeacherRows.map((row) => `
                <tr>
                    <td>${rankBadge(row.rank)}</td>
                    <td><strong>${escapeHtml(row.teacher)}</strong></td>
                    <td>${escapeHtml(row.teacherId || '-')}</td>
                    <td>${row.overallScore.toFixed(1)}</td>
                    <td>${escapeHtml(row.subjectText)}</td>
                    <td>${row.totalStudents}</td>
                    <td>${riskText(row.riskFlags)}</td>
                    <td>${row.subjects.map((item) => `${escapeHtml(item.subject)} ${item.fairScore.toFixed(1)} / 科内${item.subjectRank}`).join('<br>')}</td>
                </tr>
            `).join('')
            : emptyRow(8);
    }

    function renderTeacherDetailTable() {
        const table = els.teacherDetailTable;
        table.querySelector('thead').innerHTML = `
            <tr>
                <th>学科排名</th><th>教师</th><th>学科</th><th>总榜</th><th>班级/范围</th><th>人数</th><th>任课权重</th><th>均分</th><th>优秀率</th><th>达标率(前50%)</th><th>卷面及格率</th><th>基础校正</th><th>历史校正</th><th>转化分</th><th>置信系数</th><th>质量分</th><th>风险提示</th>
            </tr>
        `;
        table.querySelector('tbody').innerHTML = state.teacherRows.length
            ? state.teacherRows.map((row) => `
                <tr>
                    <td>${rankBadge(row.subjectRank)}</td>
                    <td>${escapeHtml(row.teacher)}</td>
                    <td>${escapeHtml(row.subject)}</td>
                    <td>${row.inFinalRank ? '纳入' : '排除'}</td>
                    <td>${escapeHtml(row.classes.join('、') + (row.scopeText ? ` / ${row.scopeText}` : ''))}</td>
                    <td>${row.studentCount}</td>
                    <td>${percent(row.teachingWeight || 1)}</td>
                    <td>${formatScore(row.avg, 2)}</td>
                    <td>${percent(row.excRate)}</td>
                    <td>${percent(row.passRate)}</td>
                    <td>${formatNullablePercent(row.paperPassRate)}</td>
                    <td>${signed(row.baselineAdjustment)}</td>
                    <td>${signed(row.historyAdjustment || 0)}</td>
                    <td title="${escapeAttr(row.conversionSummary || '')}">${Number(row.conversionScore || 80).toFixed(1)}</td>
                    <td>${row.confidence.toFixed(2)}</td>
                    <td><strong>${row.fairScore.toFixed(1)}</strong></td>
                    <td>${riskText(row.riskFlags)}</td>
                </tr>
            `).join('')
            : emptyRow(17);
    }

    function renderTeacherExplanation() {
        if (!els.teacherExplainSelect || !els.teacherExplainPanel) return;
        const rows = state.finalTeacherRows;
        const keep = rows.some((row) => row.teacherKey === state.selectedTeacherKey) ? state.selectedTeacherKey : (rows[0]?.teacherKey || '');
        state.selectedTeacherKey = keep;
        els.teacherExplainSelect.innerHTML = rows.length
            ? rows.map((row) => `<option value="${escapeAttr(row.teacherKey)}">${escapeHtml(row.teacher)}${row.teacherId ? `(${escapeHtml(row.teacherId)})` : ''}</option>`).join('')
            : '<option value="">暂无教师</option>';
        els.teacherExplainSelect.value = keep;
        const teacher = rows.find((row) => row.teacherKey === keep);
        if (!teacher) {
            els.teacherExplainPanel.innerHTML = '<div class="empty">导入任课表后显示教师排名解释。</div>';
            return;
        }
        els.teacherExplainPanel.innerHTML = `
            <div class="detail-grid">
                ${detailItem('教师', teacher.teacher)}
                ${detailItem('最终分', teacher.overallScore.toFixed(2))}
                ${detailItem('覆盖学生', teacher.totalStudents)}
                ${detailItem('风险', teacher.riskFlags?.length ? teacher.riskFlags.join('、') : '正常')}
            </div>
            <table class="mini-table">
                <thead><tr><th>学科</th><th>班级/范围</th><th>人数</th><th>均分</th><th>质量分</th><th>科内相对分</th><th>转化分</th><th>学科项分</th><th>权重</th><th>校正/风险</th></tr></thead>
                <tbody>${teacher.subjects.map((item) => {
                    const weight = Math.max(item.effectiveStudentWeight || item.studentCount, 1) * item.confidence;
                    return `
                        <tr>
                            <td>${escapeHtml(item.subject)}</td>
                            <td>${escapeHtml(item.classes.join('、') + (item.scopeText ? ` / ${item.scopeText}` : ''))}</td>
                            <td>${item.studentCount}</td>
                            <td>${formatScore(item.avg, 2)}</td>
                            <td>${item.fairScore.toFixed(2)}</td>
                            <td>${item.relativeScore.toFixed(2)}</td>
                            <td title="${escapeAttr(item.conversionSummary || '')}">${Number(item.conversionScore || 80).toFixed(2)}</td>
                            <td>${item.finalUnitScore.toFixed(2)}</td>
                            <td>${weight.toFixed(2)}</td>
                            <td>基础${signed(item.baselineAdjustment)} / 历史${signed(item.historyAdjustment || 0)} / 转化${signed(item.conversionAdjustment || 0)}；${riskText(item.riskFlags)}</td>
                        </tr>
                    `;
                }).join('')}</tbody>
            </table>
        `;
    }

    function renderPairing() {
        const groups = groupBy(state.teacherRows, (row) => row.subject);
        const pairs = [];
        groups.forEach((rows, subject) => {
            if (rows.length < 2) return;
            const sorted = rows.slice().sort((a, b) => b.fairScore - a.fairScore);
            const top = sorted[0];
            const bottom = sorted[sorted.length - 1];
            const gap = top.fairScore - bottom.fairScore;
            if (gap >= 8) pairs.push({ subject, top, bottom, gap });
        });
        els.pairList.innerHTML = pairs.length
            ? pairs.map((pair) => `
                <div class="pair-card">
                    <strong>${escapeHtml(pair.subject)}：${escapeHtml(pair.top.teacher)} → ${escapeHtml(pair.bottom.teacher)}</strong>
                    <span>质量分差 ${pair.gap.toFixed(1)}。建议围绕临界生、低分率和作业反馈做一次同课异构或听评课。</span>
                </div>
            `).join('')
            : '<div class="empty">暂无需要生成的结对子建议。</div>';
    }

    function renderStudentFilters() {
        const keepClass = els.studentClassFilter.value;
        const keepSubject = els.studentSubjectFilter.value;
        els.studentClassFilter.innerHTML = `<option value="">全部班级</option>${getClasses().map((item) => `<option value="${escapeAttr(item)}">${escapeHtml(item)}</option>`).join('')}`;
        els.studentSubjectFilter.innerHTML = `<option value="total">总分</option>${getAnalysisSubjects().map((item) => `<option value="${escapeAttr(item)}">${escapeHtml(item)}</option>`).join('')}`;
        if ([...els.studentClassFilter.options].some((option) => option.value === keepClass)) els.studentClassFilter.value = keepClass;
        if ([...els.studentSubjectFilter.options].some((option) => option.value === keepSubject)) els.studentSubjectFilter.value = keepSubject;
    }

    function renderStudentTable() {
        const subject = els.studentSubjectFilter.value || 'total';
        const className = els.studentClassFilter.value || '';
        const search = cleanText(els.studentSearch.value).toLowerCase();
        const rows = getAnalysisStudents()
            .filter((student) => !className || student.className === className)
            .filter((student) => !search || `${student.name}${student.id}`.toLowerCase().includes(search))
            .sort((a, b) => {
                const rankA = a.ranks?.[subject]?.grade || 99999;
                const rankB = b.ranks?.[subject]?.grade || 99999;
                return rankA - rankB || naturalCompare(a.className, b.className);
            })
            .slice(0, 300);

        const table = els.studentTable;
        table.querySelector('thead').innerHTML = `
            <tr>
                <th>年级排名</th><th>班级排名</th><th>班级</th><th>姓名</th><th>考号</th><th>${escapeHtml(subject === 'total' ? currentConfig().totalLabel : subject)}</th><th>总分</th><th>报告</th>
            </tr>
        `;
        table.querySelector('tbody').innerHTML = rows.length
            ? rows.map((student) => {
                const score = subject === 'total' ? student.total : student.scores[subject];
                return `
                    <tr>
                        <td>${rankBadge(student.ranks?.[subject]?.grade || '-')}</td>
                        <td>${rankBadge(student.ranks?.[subject]?.class || '-')}</td>
                        <td>${escapeHtml(student.className)}</td>
                        <td>${escapeHtml(student.name)}</td>
                        <td>${escapeHtml(student.id || '-')}</td>
                        <td>${formatScore(score, 2)}</td>
                        <td>${formatScore(student.total, 2)}</td>
                        <td><button class="ghost-button" data-student-report-key="${escapeAttr(studentKey(student))}">报告</button></td>
                    </tr>
                `;
            }).join('')
            : emptyRow(8);
        if (!state.selectedStudentKey && rows[0]) state.selectedStudentKey = studentKey(rows[0]);
    }

    function renderStudentReport() {
        if (!els.studentReportCard) return;
        const student = getSelectedStudent();
        if (!student) {
            els.studentReportCard.innerHTML = '<div class="empty">导入成绩后可生成学生个人报告。</div>';
            return;
        }
        const reportRows = buildStudentReportRows(student);
        const subjectHeaderIndex = reportRows.findIndex((row) => row[0] === '学科');
        const subjectRows = subjectHeaderIndex >= 0 ? reportRows.slice(subjectHeaderIndex + 1) : [];
        const weak = subjectRows.slice().sort((a, b) => Number(a[7]) - Number(b[7]))[0];
        const strong = subjectRows.slice().sort((a, b) => Number(b[7]) - Number(a[7]))[0];
        els.studentReportCard.innerHTML = `
            <div class="detail-grid">
                ${detailItem('学生', `${student.className} ${student.name}`)}
                ${detailItem(currentConfig().totalLabel, formatScore(student.total, 2))}
                ${detailItem('总分校排/班排', `${student.ranks?.total?.grade || '-'}/${student.ranks?.total?.class || '-'}`)}
                ${detailItem('优势/短板', `${strong?.[0] || '-'} / ${weak?.[0] || '-'}`)}
            </div>
            <table class="mini-table">
                <thead><tr><th>学科</th><th>分数</th><th>校排</th><th>班排</th><th>距优秀线</th><th>距达标线</th><th>得分率</th><th>判断</th></tr></thead>
                <tbody>${subjectRows.map((row) => `
                    <tr><td>${escapeHtml(row[0])}</td><td>${row[1]}</td><td>${row[2]}</td><td>${row[3]}</td><td>${row[4]}</td><td>${row[5]}</td><td>${percent(Number(row[7]) / 100)}</td><td>${escapeHtml(row[8])}</td></tr>
                `).join('') || emptyRow(8)}</tbody>
            </table>
        `;
    }

    function renderStudentAlerts() {
        els.studentAlertGrid.innerHTML = state.studentAlerts.length
            ? state.studentAlerts.slice(0, 12).map((item) => insightCard(
                `${item.type} · ${item.subject}`,
                `${item.student.className} ${item.student.name}：${item.score.toFixed(1)} 分，${item.note || (item.type === '偏科提醒' ? `单科年级第 ${item.gap} 名` : `差 ${item.gap} 分`)}`
            )).join('')
            : insightCard('暂无名单', '导入成绩后自动筛选临界生、后1/3托底学生和偏科学生。');
    }

    function renderExamComparison() {
        if (!els.historySelect || !els.comparisonPanel) return;
        const history = state.examHistory || [];
        const keep = history.some((item) => item.id === state.selectedHistoryId) ? state.selectedHistoryId : (history[0]?.id || '');
        state.selectedHistoryId = keep;
        els.historySelect.innerHTML = history.length
            ? history.map((item) => `<option value="${escapeAttr(item.id)}">${escapeHtml(item.name)}</option>`).join('')
            : '<option value="">暂无历史</option>';
        els.historySelect.value = keep;
        const rows = buildExamComparisonRows().slice(1);
        if (!rows.length) {
            els.comparisonPanel.innerHTML = '<div class="empty">先保存一次当前考试，下一次导入成绩后即可做对比。</div>';
            return;
        }
        els.comparisonPanel.innerHTML = `
            <table class="mini-table">
                <thead><tr><th>类型</th><th>对象</th><th>本次</th><th>基准</th><th>变化</th><th>说明</th></tr></thead>
                <tbody>${rows.slice(0, 24).map((row) => `
                    <tr><td>${escapeHtml(row[0])}</td><td>${escapeHtml(row[1])}</td><td>${row[2]}</td><td>${row[3]}</td><td>${row[4]}</td><td>${escapeHtml(row[5])}</td></tr>
                `).join('')}</tbody>
            </table>
        `;
    }

    function renderCloudPanel() {
        if (!els.cloudPanel) return;
        if (els.cloudUrl) els.cloudUrl.value = state.cloudConfig.url || '';
        if (els.cloudAnonKey) els.cloudAnonKey.value = state.cloudConfig.anonKey || '';
        ensureCloudMetaInputs();
        const configured = hasCloudConfig();
        const connected = Boolean(state.cloudUser);
        const previewExamDate = getCloudExamDate();
        const previewSchoolYear = getCloudSchoolYear(previewExamDate);
        const previewCohortYear = estimateCohortYear(state.grade, previewSchoolYear);
        syncCloudHistoryScopeOptions();
        if (els.cloudStatus) {
            els.cloudStatus.textContent = connected ? `已登录 ${state.cloudUser.email || ''}` : (configured ? '待登录' : '未配置');
            els.cloudStatus.className = connected ? 'status-pill ok' : 'status-pill warn';
        }
        if (els.cloudHistorySelect) {
            const keep = state.cloudSnapshots.some((item) => item.id === state.selectedCloudSnapshotId)
                ? state.selectedCloudSnapshotId
                : (state.cloudSnapshots[0]?.id || '');
            state.selectedCloudSnapshotId = keep;
            els.cloudHistorySelect.innerHTML = state.cloudSnapshots.length
                ? state.cloudSnapshots.map((item) => `<option value="${escapeAttr(item.id)}">${escapeHtml(formatCloudSnapshotLabel(item))}</option>`).join('')
                : '<option value="">暂无云端历史</option>';
            els.cloudHistorySelect.value = keep;
        }
        const selected = state.cloudSnapshots.find((item) => item.id === state.selectedCloudSnapshotId);
        const rows = [
            ['配置状态', configured ? '已保存 Supabase URL 与 anon key' : '请先填写 Supabase URL 与 anon key'],
            ['登录状态', connected ? `${state.cloudUser.email || state.cloudUser.id}` : '未登录'],
            ['云端范围', getCloudHistoryScopeLabel()],
            ['云端记录', `${state.cloudSnapshots.length} 条`],
            ['当前届别口径', `${previewSchoolYear} 学年 ${state.grade}年级 = ${previewCohortYear}级（六年级入学年份）`],
            ['当前选择', selected ? `${formatCloudSnapshotLabel(selected)}，学生 ${selected.student_count || 0} 人` : '无'],
            ['选择校验', selected ? formatCloudSnapshotScopeStatus(selected) : '无']
        ];
        els.cloudPanel.innerHTML = `
            <div class="detail-grid">
                ${rows.map((row) => detailItem(row[0], row[1])).join('')}
            </div>
            <div class="muted-note">云端快照按登录账号隔离；届别按乡镇系统口径使用“六年级入学年份”，例如 2025-2026 学年 9 年级为 2022级。</div>
        `;
    }

    function refreshCloudHistoryScopeView() {
        state.selectedCloudSnapshotId = '';
        if (state.cloudUser) loadCloudSnapshots();
        else renderCloudPanel();
    }

    function restoreCloudConfig() {
        try {
            const raw = localStorage.getItem(CLOUD_CONFIG_KEY);
            const data = raw ? JSON.parse(raw) : {};
            state.cloudConfig = {
                url: cleanText(data.url),
                anonKey: cleanText(data.anonKey)
            };
        } catch (error) {
            state.cloudConfig = { url: '', anonKey: '' };
        }
    }

    function saveCloudConfig() {
        state.cloudConfig = {
            url: cleanText(els.cloudUrl?.value),
            anonKey: cleanText(els.cloudAnonKey?.value)
        };
        supabaseClient = null;
        supabaseClientKey = '';
        localStorage.setItem(CLOUD_CONFIG_KEY, JSON.stringify(state.cloudConfig));
        renderCloudPanel();
        toast('Supabase 配置已保存在本机浏览器。', 'ok');
    }

    function hasCloudConfig() {
        return Boolean(cleanText(state.cloudConfig.url) && cleanText(state.cloudConfig.anonKey));
    }

    function getSupabaseClient() {
        if (!hasCloudConfig()) throw new Error('请先填写并保存 Supabase URL 与 anon key。');
        if (!window.supabase?.createClient) throw new Error('Supabase JS 未加载，请检查网络或刷新页面。');
        const key = `${state.cloudConfig.url}|${state.cloudConfig.anonKey}`;
        if (!supabaseClient || supabaseClientKey !== key) {
            supabaseClient = window.supabase.createClient(state.cloudConfig.url, state.cloudConfig.anonKey);
            supabaseClientKey = key;
        }
        return supabaseClient;
    }

    async function refreshCloudUser() {
        if (!hasCloudConfig() || !window.supabase?.createClient) {
            renderCloudPanel();
            return null;
        }
        const client = getSupabaseClient();
        const { data: sessionData, error: sessionError } = await client.auth.getSession();
        if (sessionError || !sessionData?.session) {
            state.cloudUser = null;
            renderCloudPanel();
            return null;
        }
        const { data, error } = await client.auth.getUser();
        if (error) {
            state.cloudUser = null;
        } else {
            state.cloudUser = data?.user || null;
        }
        renderCloudPanel();
        return state.cloudUser;
    }

    async function loginOrRegisterCloud() {
        try {
            saveCloudConfig();
            const email = cleanText(els.cloudEmail?.value);
            const password = String(els.cloudPassword?.value || '');
            if (!email || !password) return toast('请输入 Supabase 登录邮箱和密码。', 'warn');
            const client = getSupabaseClient();
            let { data, error } = await client.auth.signInWithPassword({ email, password });
            if (error) {
                if (isCloudEmailConfirmationError(error)) {
                    state.cloudUser = null;
                    throw new Error('邮箱尚未确认，请先在 Supabase Auth 中确认该账号，或关闭邮箱确认后重新登录。');
                }
                if (!isCloudInvalidCredentialsError(error)) throw error;
                const signUp = await client.auth.signUp({ email, password });
                data = signUp.data;
                error = signUp.error;
            }
            if (error) throw error;
            if (!data?.session) {
                state.cloudUser = null;
                toast('注册请求已提交；如果项目开启邮箱确认，请先完成确认再登录。', 'warn');
            } else {
                state.cloudUser = data?.user || null;
                toast('Supabase 已登录。', 'ok');
                await loadCloudSnapshots();
            }
            renderCloudPanel();
        } catch (error) {
            toast(`Supabase 登录失败：${friendlyCloudError(error)}`, 'warn');
            renderCloudPanel();
        }
    }

    async function logoutCloud() {
        try {
            const client = getSupabaseClient();
            await client.auth.signOut();
            state.cloudUser = null;
            state.cloudSnapshots = [];
            state.selectedCloudSnapshotId = '';
            renderCloudPanel();
            toast('已退出 Supabase。', 'ok');
        } catch (error) {
            toast(`退出失败：${friendlyCloudError(error)}`, 'warn');
        }
    }

    async function ensureCloudUser() {
        const user = state.cloudUser || await refreshCloudUser();
        if (!user) throw new Error('请先登录 Supabase。');
        return user;
    }

    async function syncCurrentExamToCloud() {
        try {
            if (!getAnalysisStudents().length) return toast('暂无可上传的分析数据。', 'warn');
            const user = await ensureCloudUser();
            const client = getSupabaseClient();
            const name = cleanText(els.historyName?.value) || `${currentConfig().label}_${dateStamp()}`;
            const payload = buildCloudSnapshotPayload(name, user);
            const { error } = await client.from('analysis_snapshots').insert(payload);
            if (error) throw error;
            toast('当前分析已上传到 Supabase 云端历史。', 'ok');
            await loadCloudSnapshots();
        } catch (error) {
            toast(`上传失败：${friendlyCloudError(error)}`, 'warn');
        }
    }

    function buildCloudSnapshotPayload(name, user) {
        const exam = buildExamSnapshot(name);
        const app = buildLocalSnapshot();
        const totalMetrics = metricSummary(getAnalysisStudents().map((student) => student.total), state.thresholds.total || {}, getTotalMaxScore());
        const examDate = getCloudExamDate();
        const schoolYear = getCloudSchoolYear(examDate);
        const cohortYear = estimateCohortYear(state.grade, schoolYear);
        return {
            owner_id: user.id,
            school_name: state.activeSchool || '本校',
            grade: Number(state.grade || 9),
            cohort_year: cohortYear,
            school_year: schoolYear,
            exam_name: name,
            exam_date: examDate,
            student_count: getAnalysisStudents().length,
            class_count: getClasses().length,
            subject_count: getAnalysisSubjects().length,
            total_max: getTotalMaxScore(),
            total_avg: totalMetrics.count ? round(totalMetrics.avg, 2) : null,
            source: 'local-school-score-analytics',
            snapshot: {
                version: CLOUD_SNAPSHOT_VERSION,
                savedAt: new Date().toISOString(),
                cohortPolicy: {
                    type: 'entry_year',
                    label: '六年级入学年份',
                    grade: Number(state.grade || 9),
                    schoolYear,
                    cohortYear
                },
                exam,
                app
            }
        };
    }

    async function loadCloudSnapshots() {
        try {
            await ensureCloudUser();
            const client = getSupabaseClient();
            const meta = getCloudScopeMeta();
            let query = client
                .from('analysis_snapshots')
                .select('id, school_name, grade, cohort_year, school_year, exam_name, exam_date, student_count, class_count, subject_count, total_max, total_avg, created_at');
            if (state.cloudHistoryScope === 'cohort') {
                query = query.eq('cohort_year', meta.cohortYear);
            } else if (state.cloudHistoryScope === 'grade') {
                query = query.eq('cohort_year', meta.cohortYear).eq('grade', meta.grade);
            }
            const { data, error } = await query
                .order('exam_date', { ascending: false })
                .order('created_at', { ascending: false })
                .limit(100);
            if (error) throw error;
            state.cloudSnapshots = Array.isArray(data) ? data : [];
            state.selectedCloudSnapshotId = state.cloudSnapshots.some((item) => item.id === state.selectedCloudSnapshotId)
                ? state.selectedCloudSnapshotId
                : (state.cloudSnapshots[0]?.id || '');
            renderCloudPanel();
            toast(`已读取 ${getCloudHistoryScopeLabel()}：${state.cloudSnapshots.length} 条。`, 'ok');
        } catch (error) {
            toast(`读取云端历史失败：${friendlyCloudError(error)}`, 'warn');
            renderCloudPanel();
        }
    }

    async function getCloudSnapshotRecord() {
        await ensureCloudUser();
        const id = cleanText(state.selectedCloudSnapshotId || els.cloudHistorySelect?.value);
        if (!id) throw new Error('请选择一条云端历史。');
        const client = getSupabaseClient();
        const { data, error } = await client
            .from('analysis_snapshots')
            .select('id, grade, cohort_year, school_year, exam_name, exam_date, snapshot')
            .eq('id', id)
            .single();
        if (error) throw error;
        return data;
    }

    async function useCloudSnapshotAsBaseline() {
        try {
            const record = await getCloudSnapshotRecord();
            if (!confirmCloudSnapshotScope(record, '作为历史基准')) return;
            const exam = record.snapshot?.exam;
            if (!exam) throw new Error('该云端记录缺少考试快照。');
            state.examHistory = [exam, ...state.examHistory.filter((item) => item.id !== exam.id)].slice(0, HISTORY_LIMIT);
            state.selectedHistoryId = exam.id;
            renderExamComparison();
            renderCloudPanel();
            toast(`已将“${record.exam_name}”作为历史基准。`, 'ok');
        } catch (error) {
            toast(`调用云端历史失败：${friendlyCloudError(error)}`, 'warn');
        }
    }

    async function restoreCloudSnapshot() {
        try {
            const record = await getCloudSnapshotRecord();
            if (!confirmCloudSnapshotScope(record, '恢复完整快照')) return;
            const app = record.snapshot?.app;
            if (!app) throw new Error('该云端记录缺少完整分析快照。');
            applyLocalSnapshot(app);
            toast(`已恢复云端快照：${record.exam_name}。`, 'ok');
        } catch (error) {
            toast(`恢复云端快照失败：${friendlyCloudError(error)}`, 'warn');
        }
    }

    function formatCloudSnapshotLabel(item) {
        if (!item) return '';
        const date = item.exam_date || cleanText(item.created_at).slice(0, 10);
        return `${date} · ${item.exam_name} · ${item.grade}年级 · ${item.cohort_year}级`;
    }

    function syncCloudHistoryScopeOptions() {
        if (!els.cloudHistoryScope) return;
        const meta = getCloudScopeMeta();
        const options = [
            ['cohort', `当前届别：${meta.cohortYear}级`],
            ['grade', `当前年级：${meta.grade}年级 ${meta.cohortYear}级`],
            ['all', '全部云端记录']
        ];
        const nextScope = options.some(([value]) => value === state.cloudHistoryScope) ? state.cloudHistoryScope : 'cohort';
        state.cloudHistoryScope = nextScope;
        els.cloudHistoryScope.innerHTML = options.map(([value, label]) => `<option value="${value}">${escapeHtml(label)}</option>`).join('');
        els.cloudHistoryScope.value = nextScope;
    }

    function getCloudScopeMeta() {
        const examDate = getCloudExamDate();
        const schoolYear = getCloudSchoolYear(examDate);
        return {
            grade: Number(state.grade || 9),
            schoolYear,
            examDate,
            cohortYear: estimateCohortYear(state.grade, schoolYear)
        };
    }

    function getCloudHistoryScopeLabel() {
        const meta = getCloudScopeMeta();
        if (state.cloudHistoryScope === 'all') return '全部云端记录';
        if (state.cloudHistoryScope === 'grade') return `${meta.grade}年级 ${meta.cohortYear}级`;
        return `${meta.cohortYear}级`;
    }

    function formatCloudSnapshotScopeStatus(record) {
        const warnings = getCloudSnapshotScopeWarnings(record);
        return warnings.length ? `需确认：${warnings.join('；')}` : '与当前届别口径一致';
    }

    function confirmCloudSnapshotScope(record, actionLabel) {
        const warnings = getCloudSnapshotScopeWarnings(record);
        if (!warnings.length) return true;
        const message = `${actionLabel}前请确认：\n${warnings.join('\n')}\n\n继续使用这条云端历史吗？`;
        return window.confirm(message);
    }

    function getCloudSnapshotScopeWarnings(record) {
        const meta = getCloudScopeMeta();
        const warnings = [];
        if (!record) return ['未读取到云端历史元数据'];
        if (Number(record.cohort_year) !== meta.cohortYear) {
            warnings.push(`届别不同，快照为 ${record.cohort_year || '未知'}级，当前为 ${meta.cohortYear}级`);
        }
        if (Number(record.grade) !== meta.grade) {
            warnings.push(`年级不同，快照为 ${record.grade || '未知'}年级，当前为 ${meta.grade}年级`);
        }
        const recordSchoolYear = cleanText(record.school_year);
        if (recordSchoolYear && recordSchoolYear !== meta.schoolYear) {
            warnings.push(`学年不同，快照为 ${recordSchoolYear}，当前为 ${meta.schoolYear}`);
        }
        return warnings;
    }

    function getSchoolYear(date = new Date()) {
        const source = date instanceof Date ? date : parseDateInput(date);
        const year = source.getFullYear();
        const start = source.getMonth() + 1 >= 9 ? year : year - 1;
        return `${start}-${start + 1}`;
    }

    function estimateCohortYear(grade = state.grade, dateOrSchoolYear = new Date()) {
        const schoolStart = getSchoolYearStart(dateOrSchoolYear);
        return schoolStart - (Number(grade || 9) - 6);
    }

    function ensureCloudMetaInputs() {
        const today = new Date();
        if (els.cloudExamDate && !cleanText(els.cloudExamDate.value)) {
            els.cloudExamDate.value = formatDateInput(today);
        }
        if (els.cloudSchoolYear && !cleanText(els.cloudSchoolYear.value)) {
            els.cloudSchoolYear.value = getSchoolYear(today);
        }
    }

    function getCloudExamDate() {
        const value = cleanText(els.cloudExamDate?.value);
        return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : formatDateInput(new Date());
    }

    function getCloudSchoolYear(examDate = getCloudExamDate()) {
        return normalizeSchoolYear(els.cloudSchoolYear?.value) || getSchoolYear(parseDateInput(examDate));
    }

    function normalizeSchoolYear(value) {
        const text = cleanText(value);
        if (!text) return '';
        let match = text.match(/(20\d{2})\D+(20\d{2})/);
        if (match) {
            const start = Number(match[1]);
            const end = Number(match[2]);
            if (Number.isFinite(start) && Number.isFinite(end) && end === start + 1) return `${start}-${end}`;
        }
        match = text.match(/(20\d{2})/);
        if (match) {
            const start = Number(match[1]);
            return `${start}-${start + 1}`;
        }
        return '';
    }

    function getSchoolYearStart(dateOrSchoolYear = new Date()) {
        if (dateOrSchoolYear instanceof Date) {
            const year = dateOrSchoolYear.getFullYear();
            return dateOrSchoolYear.getMonth() + 1 >= 9 ? year : year - 1;
        }
        const text = cleanText(dateOrSchoolYear);
        if (/^\d{4}-\d{1,2}-\d{1,2}/.test(text)) {
            const date = parseDateInput(text);
            const year = date.getFullYear();
            return date.getMonth() + 1 >= 9 ? year : year - 1;
        }
        const normalized = normalizeSchoolYear(text);
        if (normalized) return Number(normalized.slice(0, 4));
        const date = parseDateInput(text);
        const year = date.getFullYear();
        return date.getMonth() + 1 >= 9 ? year : year - 1;
    }

    function parseDateInput(value) {
        if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
        const text = cleanText(value);
        const match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
        if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
        const date = new Date(text);
        return Number.isNaN(date.getTime()) ? new Date() : date;
    }

    function formatDateInput(date = new Date()) {
        const source = parseDateInput(date);
        const y = source.getFullYear();
        const m = String(source.getMonth() + 1).padStart(2, '0');
        const d = String(source.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function friendlyCloudError(error) {
        const text = cleanText(error?.message || error);
        if (/relation .*analysis_snapshots.*does not exist/i.test(text)) return '数据库表不存在，请先在 Supabase SQL Editor 执行 supabase/migrations/20260504_school_analysis_cloud.sql。';
        if (/row-level security|permission denied|violates row-level security/i.test(text)) return '权限策略未生效或未登录，请检查 RLS 脚本和当前账号。';
        if (/email_not_confirmed|Email not confirmed|邮箱尚未确认/i.test(text)) return '邮箱尚未确认，请先在 Supabase Auth 中确认该账号，或关闭邮箱确认后重新登录。';
        if (/Invalid login credentials/i.test(text)) return '邮箱或密码不正确；如刚注册且开启邮箱确认，请先确认邮件。';
        return text || '未知错误';
    }

    function isCloudEmailConfirmationError(error) {
        return /email_not_confirmed|Email not confirmed/i.test(cleanText(`${error?.code || ''} ${error?.message || error}`));
    }

    function isCloudInvalidCredentialsError(error) {
        return /invalid_credentials|Invalid login credentials|user not found/i.test(cleanText(`${error?.code || ''} ${error?.message || error}`));
    }

    function renderPrivacyPanel() {
        if (!els.privacyPanel) return;
        const stats = state.performanceStats || {};
        els.privacyPanel.innerHTML = `
            <div class="detail-grid">
                ${detailItem('本次分析数据', `${getAnalysisStudents().length} 人 / ${getAnalysisSubjects().length} 科`)}
                ${detailItem('本地历史', `${(state.examHistory || []).length} 次`)}
                ${detailItem('最近计算耗时', `${stats.lastAnalyzeMs || 0} ms`)}
                ${detailItem('正式确认', state.analysisConfirmed ? '已确认' : '待确认')}
            </div>
            <div class="muted-note">所有 Excel 解析与计算都在当前浏览器完成；“清除本地保存”只删除浏览器留档，不会删除你电脑上的源 Excel 文件。</div>
        `;
    }

    function downloadScoreTemplate() {
        const config = currentConfig();
        const headers = ['学校', '班级', '姓名', '考号', ...config.templateSubjects];
        const gradePrefix = state.grade;
        const rows = [
            headers,
            ['银山实验学校', `${gradePrefix}01`, '张三', `${gradePrefix}001`, ...config.templateSubjects.map((subject, index) => round(getSubjectMaxScore(subject) * (0.82 - index * 0.015), 1))],
            ['银山实验学校', `${gradePrefix}01`, '李四', `${gradePrefix}002`, ...config.templateSubjects.map((subject, index) => round(getSubjectMaxScore(subject) * (0.75 - index * 0.012), 1))]
        ];
        writeWorkbook(`校内成绩模板_${config.label}.xlsx`, [{ name: '成绩表', rows }]);
    }

    function downloadTeacherTemplate() {
        const subjects = currentConfig().templateSubjects;
        const rows = [['班级', '学科', '教师姓名', '教师编号', '任课范围', '学生考号', '学生名单']];
        ['01', '02'].forEach((classNo, classIndex) => {
            subjects.forEach((subject, subjectIndex) => {
                rows.push([`${state.grade}${classNo}`, subject, `${subject}教师${classIndex + subjectIndex + 1}`, `${subject.slice(0, 1)}${classIndex + subjectIndex + 1}`, '', '', '']);
            });
        });
        writeWorkbook('教师任课信息_导入模板.xlsx', [{ name: '任课表', rows }]);
    }

    function exportWorkbook() {
        const analysisStudents = getAnalysisStudents();
        if (!analysisStudents.length) return toast('暂无可导出的成绩数据。', 'warn');
        if (!canProceedWithExport()) return;
        const sheets = [
            {
                name: '班级总览',
                rows: [
                    ['排名', '班级', '人数', '总分有效人数', '总分均分', '优秀率', '达标率(前50%)', '卷面及格率', '低分率', '后1/3均分', '校内后1/3占比', '临界人数', '相对两率一分', '绝对达成分', '学科均衡', '托底发展', '综合分', '风险提示'],
                    ...state.classRows.map((row) => [row.rank, row.className, row.studentCount, row.completeTotalCount, round(row.metrics.total.avg, 2), row.metrics.total.excRate, row.metrics.total.passRate, row.metrics.total.paperPassRate, row.metrics.total.lowRate, round(row.bottomThirdAvg, 2), row.gradeBottomShare, row.marginalCount || 0, round(row.rateScore, 2), round(row.absoluteScore, 2), round(row.balanceScore, 2), round(row.developmentScore, 2), row.qualityScore, (row.riskFlags || []).join('、')])
                ]
            },
            {
                name: '学科明细',
                rows: [
                    ['学科', '满分', '人数', '均分', '优秀线', '达标线(前50%)', '卷面及格线', '优秀率', '达标率(前50%)', '卷面及格率'],
                    ...state.subjectRows.map((row) => [row.subject, getSubjectMaxScore(row.subject), row.count, round(row.avg, 2), state.thresholds[row.subject]?.exc || 0, state.thresholds[row.subject]?.pass || 0, state.thresholds[row.subject]?.paperPass || 0, row.excRate, row.passRate, row.paperPassRate])
                ]
            },
            {
                name: '成绩分布',
                rows: buildDistributionExportRows()
            },
            {
                name: '成绩折算',
                rows: [
                    ['学科', '配置满分', '导入最高分', '原始满分', '折算系数', '处理'],
                    ...getScoreAdjustmentRows()
                ]
            },
            {
                name: '教师最终排名',
                rows: [
                    ['最终排名', '教师', '教师编号', '最终分', '覆盖学生', '风险提示', '任教学科/班级'],
                    ...state.finalTeacherRows.map((row) => [row.rank, row.teacher, row.teacherId || '', round(row.overallScore, 2), row.totalStudents, (row.riskFlags || []).join('、'), row.subjectText])
                ]
            },
            {
                name: '教师学科明细',
                rows: [
                    ['学科排名', '教师', '教师编号', '学科', '是否进总榜', '班级', '任课范围', '人数', '有效学生权重', '任课权重', '均分', '优秀率', '达标率(前50%)', '卷面及格率', '低分率', '相对两率一分', '绝对达成分', '两率一分综合', '基础校正', '历史校正', '转化分', '转化说明', '工作量修正', '置信系数', '质量分', '科内相对分', '学科项分', '风险提示'],
                    ...state.teacherRows.map((row) => [row.subjectRank, row.teacher, row.teacherId || '', row.subject, row.inFinalRank ? '是' : '否', row.classes.join('、'), row.scopeText || '', row.studentCount, round(row.effectiveStudentWeight || row.studentCount, 2), round(row.teachingWeight || 1, 3), round(row.avg, 2), row.excRate, row.passRate, row.paperPassRate, row.lowRate, round(row.relativeLeagueScore, 2), round(row.absoluteScore, 2), round(row.leagueScore, 2), round(row.baselineAdjustment, 2), round(row.historyAdjustment || 0, 2), round(row.conversionScore || 80, 2), row.conversionSummary || '', round(row.workloadAdjustment, 2), round(row.confidence, 3), round(row.fairScore, 2), round(row.relativeScore, 2), round(row.finalUnitScore, 2), (row.riskFlags || []).join('、')])
                ]
            },
            {
                name: '学生明细',
                rows: buildStudentRankRows()
            },
            ...(state.teacherCoverage.unmatched.length ? [{
                name: '任课未匹配',
                rows: [
                    ['班级', '学科', '教师', '原因'],
                    ...state.teacherCoverage.unmatched.map((item) => [item.className, item.subject, item.teacher, item.reason])
                ]
            }] : []),
            ...(state.importStats.duplicateConflicts.length ? [{
                name: '重复冲突',
                rows: [
                    ['学校', '班级', '姓名', '考号', '学科', '原分', '新分', '采用'],
                    ...state.importStats.duplicateConflicts.map((item) => [item.school, item.className, item.name, item.id, item.subject, item.oldScore, item.newScore, item.kept])
                ]
            }] : []),
            {
                name: '导入诊断',
                rows: buildImportDiagnosticRows()
            },
            {
                name: '导入前校验',
                rows: buildAnalysisGateRows()
            },
            {
                name: '计算追溯',
                rows: buildCalculationTraceRows()
            },
            ...(state.teacherDiagnostics.sameName.length || state.teacherDiagnostics.excludedSubjects.length || state.teacherDiagnostics.noIdCount ? [{
                name: '教师诊断',
                rows: buildTeacherDiagnosticRows()
            }] : []),
            {
                name: '学生个人报告',
                rows: getSelectedStudent() ? buildStudentReportRows(getSelectedStudent()) : [['提示'], ['未选择学生']]
            },
            {
                name: '考试对比',
                rows: buildExamComparisonRows()
            },
            {
                name: '算法口径',
                rows: [
                    ['项目', '口径'],
                    ['学校', state.activeSchool || '全部'],
                    ['年级', currentConfig().label],
                    ['年级筛选', '只纳入当前年级班级号的学生；无法识别年级的班级保留分析，其他年级自动排除。'],
                    ['总分科目', getTotalSubjects().join('、')],
                    ['满分配置', getMaxScoreSummary()],
                    ['原始满分', getSourceMaxSummary()],
                    ['空白成绩', getBlankScoreModeText()],
                    ['参考名单', state.rosterDiagnostics.totalRoster ? `已导入 ${state.rosterDiagnostics.totalRoster} 人；${formatStatusCounts(state.rosterDiagnostics.statusCounts)}` : '未导入'],
                    ['成绩折算', getScoreAdjustmentSummary() || '按“原始满分→配置满分”的口径折算；未配置原始满分的科目在未超过配置满分时按原分，超出时自动推断并封顶。'],
                    ['重复导入', state.importStats.duplicateStudents ? `已合并 ${state.importStats.duplicateStudents} 条重复学生记录；${state.importStats.duplicateConflicts.length} 项分数冲突采用后导入值。` : '未发现重复学生记录。'],
                    ['教师总榜科目', getTeacherRankSubjects().join('、') || '未选择'],
                    ['评价权重', formatEvaluationWeights()],
                    ['成绩分数段', getScoreBandRuleText()],
                    ['优秀线', state.grade === 9 ? '本年级前 15%' : '本年级前 20%'],
                    ['达标线', '本年级前 50%，另列卷面及格率=满分60%'],
                    ['两率一分权重', `${currentConfig().weights.avg}/${currentConfig().weights.exc}/${currentConfig().weights.pass}`],
                    ['单校发展评价', '借鉴乡镇级部“托底、临界、进步”思路，但不做多校横向排名；只在本校年级内按前中后 1/3、后 1/3 均分、临界生和历史进步做诊断。'],
                    ['班级综合分', '相对两率一分 + 绝对达成分 + 学科均衡 + 托底发展，并对低分率做小幅扣分；总分缺科学生不参与总分均分和总分排名。'],
                    ['教师最终排名', '同学科内比较为主，同时加入满分得分率的绝对达成分；基础校正、历史进步、临界/低分转化、样本置信、任课权重、工作量和低分率修正后，再按配置权重汇总。']
                ]
            }
        ];
        writeWorkbook(`校内成绩分析_${currentConfig().label}_${dateStamp()}.xlsx`, sheets);
    }

    function exportStudentRanksWorkbook() {
        if (!getAnalysisStudents().length) return toast('暂无学生排名可导出。', 'warn');
        if (!canProceedWithExport()) return;
        writeWorkbook(`学生各科与总分排名_${state.activeSchool || '本校'}_${currentConfig().label}_${dateStamp()}.xlsx`, [
            { name: '学生排名', rows: buildStudentRankRows() },
            {
                name: '口径说明',
                rows: [
                    ['项目', '口径'],
                    ['学校', state.activeSchool || '全部'],
                    ['年级', currentConfig().label],
                    ['年级筛选', '只纳入当前年级班级号的学生；无法识别年级的班级保留分析，其他年级自动排除。'],
                    ['总分科目', getTotalSubjects().join('、')],
                    ['满分配置', getMaxScoreSummary()],
                    ['原始满分', getSourceMaxSummary()],
                    ['空白成绩', getBlankScoreModeText()],
                    ['成绩折算', getScoreAdjustmentSummary() || '按“原始满分→配置满分”的口径折算；未配置原始满分的科目在未超过配置满分时按原分，超出时自动推断并封顶。'],
                    ['排名', '校排为当前所选学校内排名；班排为当前班级内排名；同分并列。']
                ]
            }
        ]);
    }

    function exportStudentReportWorkbook() {
        const student = getSelectedStudent();
        if (!student) return toast('请选择学生后再导出个人报告。', 'warn');
        if (!canProceedWithExport()) return;
        writeWorkbook(`学生个人报告_${student.className}_${student.name}_${dateStamp()}.xlsx`, [
            { name: '个人报告', rows: buildStudentReportRows(student) },
            { name: '口径说明', rows: [['项目', '口径'], ['总分科目', getTotalSubjects().join('、')], ['满分配置', getMaxScoreSummary()], ['排名', '校排为当前所选学校内排名；班排为当前班级内排名；同分并列。']] }
        ]);
    }

    function exportReportWorkbook() {
        if (!getAnalysisStudents().length) return toast('暂无可导出的报告数据。', 'warn');
        if (!canProceedWithExport()) return;
        writeWorkbook(`校内成绩分析报告版_${currentConfig().label}_${dateStamp()}.xlsx`, [
            { name: '报告摘要', rows: buildReportSummaryRows() },
            { name: '班级诊断', rows: buildClassDiagnosisRows() },
            { name: '成绩分布', rows: buildDistributionExportRows() },
            { name: '教师解释', rows: buildTeacherExplanationExportRows() },
            { name: '学生提醒', rows: buildStudentAlertExportRows() },
            { name: '考试对比', rows: buildExamComparisonRows() },
            { name: '导入前校验', rows: buildAnalysisGateRows() },
            { name: '计算追溯', rows: buildCalculationTraceRows() }
        ]);
    }

    function exportHtmlReport() {
        if (!getAnalysisStudents().length) return toast('暂无可导出的报告数据。', 'warn');
        if (!canProceedWithExport()) return;
        const summaryRows = buildReportSummaryRows();
        const classRows = buildClassDiagnosisRows();
        const alertRows = buildStudentAlertExportRows();
        const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>校内成绩分析报告</title>
<style>
body{font-family:"Microsoft YaHei",Arial,sans-serif;margin:32px;color:#111827;background:#f8fafc}
h1{font-size:26px;margin:0 0 6px} h2{margin:28px 0 10px;font-size:18px}
.meta{color:#64748b;margin-bottom:20px}
table{width:100%;border-collapse:collapse;background:#fff;margin-bottom:18px}
th,td{border:1px solid #d9e1ec;padding:8px 10px;text-align:left;font-size:13px}
th{background:#eef3f9}.warn{color:#b45309;font-weight:700}.ok{color:#047857;font-weight:700}
</style>
</head>
<body>
<h1>${escapeHtml(state.activeSchool || '本校')} ${escapeHtml(currentConfig().label)}成绩分析报告</h1>
<div class="meta">${escapeHtml(dateStamp())} 生成；${escapeHtml(currentConfig().totalLabel)}：${escapeHtml(getTotalSubjects().join('、'))}</div>
${htmlTable('报告摘要', summaryRows)}
${htmlTable('班级诊断', classRows)}
${htmlTable('导入前校验', buildAnalysisGateRows())}
${htmlTable('学生提醒', alertRows)}
${htmlTable('教师解释', buildTeacherExplanationExportRows())}
</body>
</html>`;
        downloadBlob(`校内成绩分析报告_${currentConfig().label}_${dateStamp()}.html`, new Blob([html], { type: 'text/html;charset=utf-8' }));
        toast('HTML 报告已生成。', 'ok');
    }

    function exportAnonymousWorkbook() {
        if (!getAnalysisStudents().length) return toast('暂无可导出的匿名数据。', 'warn');
        if (!canProceedWithExport()) return;
        const subjectRows = getAnalysisSubjects();
        const studentHeader = ['班级', '匿名学生', ...subjectRows.flatMap((subject) => [`${subject}分数`, `${subject}校排`, `${subject}班排`]), currentConfig().totalLabel, '总分校排', '总分班排'];
        const studentRows = getAnalysisStudents()
            .slice()
            .sort((a, b) => (a.ranks?.total?.grade || 99999) - (b.ranks?.total?.grade || 99999))
            .map((student) => {
                const row = [student.className, anonymizePerson('S', `${student.school}|${student.className}|${student.id || student.name}`)];
                subjectRows.forEach((subject) => row.push(formatExportScore(student.scores?.[subject]), student.ranks?.[subject]?.grade || '', student.ranks?.[subject]?.class || ''));
                row.push(formatExportScore(student.total), student.ranks?.total?.grade || '', student.ranks?.total?.class || '');
                return row;
            });
        writeWorkbook(`校内成绩分析_匿名版_${currentConfig().label}_${dateStamp()}.xlsx`, [
            { name: '匿名学生明细', rows: [studentHeader, ...studentRows] },
            { name: '班级总览', rows: buildClassDiagnosisRows() },
            {
                name: '匿名教师明细',
                rows: [
                    ['排名', '匿名教师', '学科/班级', '最终分', '覆盖学生', '风险提示'],
                    ...state.finalTeacherRows.map((row) => [row.rank, anonymizePerson('T', `${row.teacher}|${row.teacherId}`), row.subjectText, round(row.overallScore, 2), row.totalStudents, (row.riskFlags || []).join('、')])
                ]
            },
            { name: '口径说明', rows: [['项目', '口径'], ['匿名规则', '同一姓名/编号在本次导出内保持稳定匿名编号，不含原始姓名和考号。'], ['总分科目', getTotalSubjects().join('、')], ['评价权重', formatEvaluationWeights()]] }
        ]);
    }

    async function clearLocalStorageData() {
        localStorage.removeItem(LOCAL_KEY);
        try {
            await deleteLocalDatabase();
            toast('本地保存已清除。', 'ok');
        } catch (error) {
            toast(`本地数据库清理失败：${error.message}`, 'warn');
        }
        renderPrivacyPanel();
    }

    function canProceedWithExport() {
        const gate = buildAnalysisGate();
        if (gate.blocks.length) {
            toast(`存在 ${gate.blocks.length} 项阻断问题，暂不导出正式结果。`, 'warn');
            renderPreflightPanel();
            return false;
        }
        if (!state.analysisConfirmed) {
            toast('当前分析尚未点击“确认生成正式分析”，导出将按当前口径生成。', 'warn');
        }
        return true;
    }

    function buildStudentRankRows() {
        const header = ['班级', '姓名', '考号'];
        const subjects = getAnalysisSubjects();
        subjects.forEach((subject) => {
            header.push(`${subject}分数`, `${subject}校排`, `${subject}班排`);
        });
        header.push(currentConfig().totalLabel, '总分校排', '总分班排');

        const rows = getAnalysisStudents()
            .slice()
            .sort((a, b) => (a.ranks?.total?.grade || 99999) - (b.ranks?.total?.grade || 99999) || naturalCompare(a.className, b.className))
            .map((student) => {
                const row = [student.className, student.name, student.id];
                subjects.forEach((subject) => {
                    row.push(
                        formatExportScore(student.scores[subject]),
                        student.ranks?.[subject]?.grade || '',
                        student.ranks?.[subject]?.class || ''
                    );
                });
                row.push(formatExportScore(student.total), student.ranks?.total?.grade || '', student.ranks?.total?.class || '');
                return row;
            });
        return [header, ...rows];
    }

    function buildAnalysisGateRows() {
        const gate = state.analysisGate || buildAnalysisGate();
        const rows = [
            ['级别', '项目', '说明']
        ];
        [
            ['阻断', gate.blocks],
            ['提醒', gate.warnings],
            ['通过', gate.infos]
        ].forEach(([label, items]) => {
            (items || []).forEach((item) => rows.push([label, item.title, item.body]));
        });
        if (rows.length === 1) rows.push(['通过', '暂无校验项', '']);
        return rows;
    }

    function buildCalculationTraceRows() {
        const rows = [
            ['层级', '对象', '学科/项目', '原始分', '折算后', '原始满分', '配置满分', '折算系数', '统计口径/公式', '校排', '班排']
        ];
        getAnalysisStudents().forEach((student) => {
            getAnalysisSubjects().forEach((subject) => {
                const rule = state.scoreAdjustments?.[subject] || {};
                rows.push([
                    '学生学科',
                    `${student.className} ${student.name}${student.id ? `(${student.id})` : ''}`,
                    subject,
                    formatExportScore(student.rawScores?.[subject]),
                    formatExportScore(student.scores?.[subject]),
                    rule.sourceMax || '',
                    getSubjectMaxScore(subject),
                    rule.scale || 1,
                    SCORE_REASON_LABELS[student.scoreReasons?.[subject] || 'present'] || '',
                    student.ranks?.[subject]?.grade || '',
                    student.ranks?.[subject]?.class || ''
                ]);
            });
            rows.push([
                '学生总分',
                `${student.className} ${student.name}${student.id ? `(${student.id})` : ''}`,
                currentConfig().totalLabel,
                '',
                formatExportScore(student.total),
                '',
                getTotalMaxScore(),
                '',
                student.totalComplete ? `总分科目：${getTotalSubjects().join('、')}` : `缺少：${(student.totalMissingSubjects || []).join('、')}`,
                student.ranks?.total?.grade || '',
                student.ranks?.total?.class || ''
            ]);
        });
        state.classRows.forEach((row) => {
            rows.push([
                '班级综合',
                row.className,
                currentConfig().totalLabel,
                '',
                row.qualityScore,
                '',
                100,
                '',
                `相对${round(row.rateScore, 2)}、绝对${round(row.absoluteScore, 2)}、均衡${round(row.balanceScore, 2)}、托底${round(row.developmentScore || 0, 2)}、后1/3均分${round(row.bottomThirdAvg || 0, 2)}、校内后1/3占比${percent(row.gradeBottomShare || 0)}、历史${signed(row.classHistoryAdjustment || 0)}、低分扣${round(row.lowPenalty || 0, 2)}；权重${formatEvaluationWeights('class')}`,
                row.rank,
                ''
            ]);
        });
        state.teacherRows.forEach((row) => {
            rows.push([
                '教师学科',
                `${row.teacher}${row.teacherId ? `(${row.teacherId})` : ''}`,
                row.subject,
                '',
                round(row.finalUnitScore, 2),
                '',
                100,
                '',
                `质量${round(row.fairScore, 2)}、相对${round(row.relativeScore, 2)}、历史${round(row.historyAdjustment || 0, 2)}、转化${round(row.conversionScore || 80, 2)}、任课权重${round(row.teachingWeight || 1, 2)}；权重${formatEvaluationWeights('teacher')}`,
                row.subjectRank,
                ''
            ]);
        });
        return rows;
    }

    function formatEvaluationWeights(scope = '') {
        const weights = getEvaluationWeights();
        const keys = scope === 'class'
            ? ['classRelative', 'classAbsolute', 'classBalance', 'classDevelopment', 'classLowPenalty']
            : (scope === 'teacher' ? ['teacherQuality', 'teacherRelative', 'teacherHistory', 'teacherConversion'] : Object.keys(DEFAULT_EVALUATION_WEIGHTS));
        return keys.map((key) => `${EVALUATION_WEIGHT_LABELS[key] || key}${weights[key]}`).join('、');
    }

    function getScoreBandRuleText() {
        return '按对应项目满分比例划分：优秀≥85%，良好75%-85%，及格60%-75%，低分<60%。';
    }

    function buildStudentReportRows(student) {
        if (!student) return [['项目', '内容'], ['提示', '未选择学生']];
        const header = ['学科', '分数', '校排', '班排', '距优秀线', '距达标线', '满分', '得分率', '判断'];
        const rows = getAnalysisSubjects().map((subject) => {
            const score = Number(student.scores?.[subject]);
            const maxScore = getSubjectMaxScore(subject);
            const thresholds = state.thresholds[subject] || {};
            const rate = Number.isFinite(score) && maxScore > 0 ? round((score / maxScore) * 100, 1) : 0;
            let label = '未参考';
            if (Number.isFinite(score)) {
                if (score >= Number(thresholds.exc || 0)) label = '优势';
                else if (score < Number(thresholds.pass || 0)) label = '需提升';
                else label = '稳定';
            }
            return [
                subject,
                formatExportScore(score),
                student.ranks?.[subject]?.grade || '',
                student.ranks?.[subject]?.class || '',
                Number.isFinite(score) ? round(score - Number(thresholds.exc || 0), 1) : '',
                Number.isFinite(score) ? round(score - Number(thresholds.pass || 0), 1) : '',
                maxScore,
                rate,
                label
            ];
        });
        return [
            ['项目', '内容'],
            ['学校', student.school || state.activeSchool || '本校'],
            ['班级', student.className],
            ['姓名', student.name],
            ['考号', student.id || ''],
            [currentConfig().totalLabel, formatExportScore(student.total)],
            ['总分校排', student.ranks?.total?.grade || ''],
            ['总分班排', student.ranks?.total?.class || ''],
            [],
            header,
            ...rows
        ];
    }

    function buildDistributionExportRows() {
        return [
            ['项目', '满分', '人数', '均分', '标准差', '最低', 'Q1', '中位数', 'Q3', '最高', '优秀段(≥85%)', '良好段(75%-85%)', '及格段(60%-75%)', '低分段(<60%)'],
            ...buildDistributionRows().map((row) => [row.label, row.maxScore, row.count, round(row.avg, 2), round(row.sd, 2), round(row.min, 2), round(row.q1, 2), round(row.median, 2), round(row.q3, 2), round(row.max, 2), row.bandExcellent, row.bandGood, row.bandPass, row.bandLow])
        ];
    }

    function buildReportSummaryRows() {
        const totalMetrics = metricSummary(getAnalysisStudents().map((student) => student.total), state.thresholds.total || {}, getTotalMaxScore());
        const topClass = state.classRows[0];
        const weakClass = state.classRows.slice().sort((a, b) => a.qualityScore - b.qualityScore)[0];
        const weakSubject = state.subjectRows.slice().sort((a, b) => a.scoreRate - b.scoreRate)[0];
        return [
            ['项目', '内容'],
            ['学校', state.activeSchool || '全部'],
            ['年级', currentConfig().label],
            ['学生数', getAnalysisStudents().length],
            ['班级数', getClasses().length],
            ['总分科目', getTotalSubjects().join('、')],
            ['总分均分', round(totalMetrics.avg, 2)],
            ['最高班级', topClass ? `${topClass.className} 综合分 ${topClass.qualityScore}` : ''],
            ['关注班级', weakClass ? `${weakClass.className} 综合分 ${weakClass.qualityScore}` : ''],
            ['关注学科', weakSubject ? `${weakSubject.subject} 得分率 ${(weakSubject.scoreRate * 100).toFixed(1)}%` : ''],
            ['导入诊断', getImportDiagnosticSummary()]
        ];
    }

    function buildClassDiagnosisRows() {
        return [
            ['班级', '综合排名', '人数', '总分有效', '总分均分', '后1/3均分', '校内后1/3占比', '临界人数', '托底发展分', '综合分', '薄弱学科', '风险提示'],
            ...state.classRows.map((row) => {
                const weakSubjects = Object.entries(row.subjects)
                    .map(([subject, metric]) => ({ subject, rate: getSubjectMaxScore(subject) ? metric.avg / getSubjectMaxScore(subject) : 0 }))
                    .sort((a, b) => a.rate - b.rate)
                    .slice(0, 3)
                    .map((item) => item.subject)
                    .join('、');
                return [row.className, row.rank, row.studentCount, row.completeTotalCount, round(row.metrics.total.avg, 2), round(row.bottomThirdAvg, 2), row.gradeBottomShare || 0, row.marginalCount || 0, round(row.developmentScore || 0, 2), row.qualityScore, weakSubjects, (row.riskFlags || []).join('、')];
            })
        ];
    }

    function buildTeacherExplanationExportRows() {
        const rows = [['教师', '教师编号', '最终排名', '最终分', '学科', '班级', '任课范围', '人数', '有效学生权重', '均分', '质量分', '科内相对分', '历史校正', '转化分', '转化说明', '学科项分', '汇总权重', '基础校正', '风险提示']];
        state.finalTeacherRows.forEach((teacher) => {
            teacher.subjects.forEach((item) => {
                rows.push([teacher.teacher, teacher.teacherId || '', teacher.rank, round(teacher.overallScore, 2), item.subject, item.classes.join('、'), item.scopeText || '', item.studentCount, round(item.effectiveStudentWeight || item.studentCount, 2), round(item.avg, 2), round(item.fairScore, 2), round(item.relativeScore, 2), round(item.historyAdjustment || 0, 2), round(item.conversionScore || 80, 2), item.conversionSummary || '', round(item.finalUnitScore, 2), round(Math.max(item.effectiveStudentWeight || item.studentCount, 1) * item.confidence, 2), round(item.baselineAdjustment, 2), (item.riskFlags || []).join('、')]);
            });
        });
        return rows;
    }

    function buildStudentAlertExportRows() {
        return [
            ['类型', '班级', '姓名', '学科', '分数', '差距/名次', '说明'],
            ...state.studentAlerts.map((item) => [item.type, item.student.className, item.student.name, item.subject, round(item.score, 2), item.gap, item.note || ''])
        ];
    }

    function buildExamComparisonRows() {
        const baseline = (state.examHistory || []).find((item) => item.id === state.selectedHistoryId);
        const rows = [['类型', '对象', '本次', '基准', '变化', '说明']];
        if (!baseline || !getAnalysisStudents().length) return rows;
        const baseClassMap = new Map((baseline.classes || []).map((item) => [item.className, item]));
        state.classRows.forEach((row) => {
            const base = baseClassMap.get(row.className);
            if (!base) return;
            rows.push(['班级总分均分', row.className, round(row.metrics.total.avg, 2), round(base.totalAvg, 2), signed(row.metrics.total.avg - base.totalAvg), '正数表示本次高于基准']);
            rows.push(['班级综合分', row.className, round(row.qualityScore, 2), round(base.qualityScore, 2), signed(row.qualityScore - base.qualityScore), '正数表示综合表现提升']);
            if (Number.isFinite(Number(base.developmentScore))) {
                rows.push(['班级托底发展', row.className, round(row.developmentScore, 2), round(base.developmentScore, 2), signed(row.developmentScore - base.developmentScore), '正数表示后1/3与临界托底状态改善']);
            }
        });
        const baseStudentMap = buildStudentBaselineMap(baseline);
        getAnalysisStudents().forEach((student) => {
            const base = findBaselineStudent(baseStudentMap, student);
            if (!base) return;
            const totalNow = Number.isFinite(Number(student.total)) ? Number(student.total) : null;
            const totalChange = totalNow !== null && Number.isFinite(Number(base.total)) ? totalNow - Number(base.total) : null;
            const rankChange = Number.isFinite(Number(student.ranks?.total?.grade)) && Number.isFinite(Number(base.gradeRank))
                ? Number(base.gradeRank) - Number(student.ranks.total.grade)
                : null;
            if (base.className && base.className !== student.className) {
                rows.push(['学生班级变化', `${student.name}${student.id ? `(${student.id})` : ''}`, student.className, base.className, '', '已按考号/姓名跨班级匹配。']);
            }
            rows.push(['学生总分', `${student.className} ${student.name}`, totalNow === null ? '' : round(totalNow, 2), base.total ?? '', totalChange === null ? '' : signed(totalChange), '正数表示总分提升']);
            rows.push(['学生校排', `${student.className} ${student.name}`, student.ranks?.total?.grade || '', base.gradeRank || '', rankChange === null ? '' : signed(rankChange), '正数表示名次前进']);
        });
        return rows;
    }

    function buildDistributionRows() {
        const items = [
            { key: 'total', label: currentConfig().totalLabel, maxScore: getTotalMaxScore() },
            ...getAnalysisSubjects().map((subject) => ({ key: subject, label: subject, maxScore: getSubjectMaxScore(subject) }))
        ];
        return items.map((item) => {
            const values = getAnalysisStudents()
                .map((student) => item.key === 'total' ? student.total : student.scores?.[item.key])
                .map(Number)
                .filter(Number.isFinite)
                .sort((a, b) => a - b);
            const count = values.length;
            const maxScore = Number(item.maxScore || 0);
            const band = (minRate, maxRate = Infinity) => {
                if (!count || !maxScore) return 0;
                return values.filter((value) => value >= maxScore * minRate && value < maxScore * maxRate).length / count;
            };
            const bandRates = Object.fromEntries(SCORE_BAND_RULES.map((rule) => [rule.key, band(rule.minRate, rule.maxRate)]));
            return {
                label: item.label,
                maxScore,
                count,
                avg: count ? average(values) : 0,
                sd: standardDeviation(values),
                min: count ? values[0] : 0,
                q1: percentile(values, 0.25),
                median: percentile(values, 0.5),
                q3: percentile(values, 0.75),
                max: count ? values[count - 1] : 0,
                bandExcellent: bandRates.excellent,
                bandGood: bandRates.good,
                bandPass: bandRates.pass,
                bandLow: bandRates.low
            };
        }).filter((row) => row.count);
    }

    function buildScoreBandRows() {
        const maxScore = getTotalMaxScore();
        const values = getAnalysisStudents()
            .map((student) => student.total)
            .map(Number)
            .filter(Number.isFinite);
        if (!maxScore || !values.length) return SCORE_BAND_RULES.map((rule) => ({ ...rule, label: rule.text, count: 0, rate: 0 }));
        return SCORE_BAND_RULES.map((rule) => {
            const count = values.filter((value) => value >= maxScore * rule.minRate && value < maxScore * rule.maxRate).length;
            return { ...rule, label: rule.text, count, rate: count / values.length };
        });
    }

    function buildImportDiagnosticRows() {
        const diag = state.importDiagnostics || {};
        const rows = [
            ['类型', '对象', '数量/分数', '说明']
        ];
        Object.entries(diag.blankCounts || {}).forEach(([subject, count]) => rows.push(['空白成绩', subject, count, getBlankScoreModeText()]));
        Object.entries(diag.absentCounts || {}).forEach(([subject, count]) => rows.push(['缺考/异常成绩', subject, count, getBlankScoreModeText()]));
        Object.entries(diag.reasonCounts || {}).forEach(([subject, counts]) => {
            Object.entries(counts || {}).forEach(([reason, count]) => {
                if (reason === 'present') return;
                rows.push(['成绩原因细分', `${subject} ${SCORE_REASON_LABELS[reason] || reason}`, count, '按单元格文字识别。']);
            });
        });
        (diag.extraSubjects || []).forEach((subject) => rows.push(['额外学科', subject, '', '只做单科诊断，不计入当前总分。']));
        if (diag.gradeScope?.otherCount) rows.push(['年级筛选', '其他年级', diag.gradeScope.otherCount, '已排除当前年级分析。']);
        const roster = diag.rosterDiagnostics || {};
        Object.entries(roster.statusCounts || {}).forEach(([status, count]) => rows.push(['参考名单状态', status, count, '来自参考名单状态/备注列。']));
        (roster.missingFromScores || []).forEach((item) => rows.push(['名单未匹配成绩', `${item.className} ${item.name || item.id}`, item.status || '', '参考名单中存在，成绩表未匹配到。']));
        (roster.extraInScores || []).forEach((student) => rows.push(['成绩未入参考名单', `${student.className} ${student.name || student.id}`, '', '成绩表中存在，参考名单未匹配到。']));
        (diag.overMaxRows || []).forEach((item) => rows.push(['超满分', `${item.className} ${item.name} ${item.subject}`, item.score, `${item.stage || '成绩'}满分 ${item.maxScore}`]));
        (diag.duplicateConflicts || []).forEach((item) => rows.push(['重复冲突', `${item.className} ${item.name} ${item.subject}`, `${item.oldScore}→${item.newScore}`, item.kept]));
        if (rows.length === 1) rows.push(['正常', '导入数据', '', '未发现明显导入风险。']);
        return rows;
    }

    function buildTeacherDiagnosticRows() {
        const diag = state.teacherDiagnostics || {};
        const rows = [['类型', '教师', '详情', '说明']];
        if (diag.noIdCount) rows.push(['教师编号', '未提供编号', diag.noIdCount, '如校内存在同名教师，建议任课表增加教师编号/工号。']);
        (diag.sameName || []).forEach((item) => {
            item.identities.forEach((identity) => {
                rows.push(['同名教师', item.teacher, `${identity.teacherId || identity.teacherKey}：${identity.subjects.join('、')} ${identity.classes.join('、')}`, '已按教师编号分开统计。']);
            });
        });
        (diag.excludedSubjects || []).forEach((subject) => rows.push(['总榜科目', subject, '', '该学科有明细，但未纳入教师最终总榜。']));
        if (rows.length === 1) rows.push(['正常', '教师任课', '', '未发现同名编号或科目口径风险。']);
        return rows;
    }

    function writeWorkbook(filename, sheets) {
        const workbook = XLSX.utils.book_new();
        sheets.forEach((sheet) => {
            const ws = XLSX.utils.aoa_to_sheet(sheet.rows);
            formatWorksheet(ws, sheet.rows);
            XLSX.utils.book_append_sheet(workbook, ws, sheet.name.slice(0, 31));
        });
        XLSX.writeFile(workbook, filename);
    }

    function htmlTable(title, rows) {
        const [header = [], ...body] = rows || [];
        return `
            <h2>${escapeHtml(title)}</h2>
            <table>
                <thead><tr>${header.map((cell) => `<th>${escapeHtml(cell)}</th>`).join('')}</tr></thead>
                <tbody>${body.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody>
            </table>
        `;
    }

    function downloadBlob(filename, blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    function anonymizePerson(prefix, value) {
        const hash = Math.abs(hashString(`${state.anonymizeSalt}|${value}`)).toString(36).toUpperCase().padStart(6, '0').slice(0, 6);
        return `${prefix}${hash}`;
    }

    function hashString(value) {
        let hash = 0;
        String(value || '').split('').forEach((ch) => {
            hash = ((hash << 5) - hash) + ch.charCodeAt(0);
            hash |= 0;
        });
        return hash;
    }

    function formatWorksheet(ws, rows) {
        const header = rows[0] || [];
        const widths = header.map((_, columnIndex) => {
            const maxLength = rows.reduce((max, row) => Math.max(max, cleanText(row[columnIndex]).length), 8);
            return { wch: Math.min(Math.max(maxLength + 2, 10), 32) };
        });
        ws['!cols'] = widths;
        ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: Math.max(rows.length - 1, 0), c: Math.max(header.length - 1, 0) } }) };
        header.forEach((title, columnIndex) => {
            const text = cleanText(title);
            if (!/(率|系数|占比)$|率\(|优秀率|达标率|低分率|及格率|优秀段|良好段|及格段|低分段/.test(text)) return;
            for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
                const cell = ws[XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex })];
                if (cell && typeof cell.v === 'number' && cell.v >= 0 && cell.v <= 1) cell.z = '0.0%';
            }
        });
    }

    async function saveLocal() {
        const snapshot = buildLocalSnapshot();
        try {
            await putLocalData(LOCAL_DB_KEY, snapshot);
            localStorage.setItem(LOCAL_KEY, JSON.stringify({ storedInIndexedDB: true, savedAt: new Date().toISOString() }));
            toast('已保存到本机浏览器数据库。', 'ok');
        } catch (error) {
            localStorage.setItem(LOCAL_KEY, JSON.stringify(snapshot));
            toast('IndexedDB 不可用，已用浏览器备用存储保存。', 'ok');
        }
    }

    function buildLocalSnapshot() {
        return {
            grade: state.grade,
            activeSchool: state.activeSchool,
            students: state.students,
            subjects: state.subjects,
            teachers: state.teachers,
            teacherRankSubjects: state.teacherRankSubjects,
            teacherRankSubjectsCustom: state.teacherRankSubjectsCustom,
            blankScoreMode: state.blankScoreMode,
            sourceMaxOverrides: state.sourceMaxOverrides,
            examSchemes: state.examSchemes,
            scoreColumnOverrides: state.scoreColumnOverrides,
            subjectSourceHints: state.subjectSourceHints,
            importStats: state.importStats,
            referenceRoster: state.referenceRoster,
            examSchemeTemplates: state.examSchemeTemplates,
            evaluationWeights: state.evaluationWeights,
            weightConfigLocked: state.weightConfigLocked,
            analysisConfirmed: state.analysisConfirmed,
            examHistory: state.examHistory,
            selectedHistoryId: state.selectedHistoryId,
            logs: state.logs
        };
    }

    async function restoreLocal() {
        try {
            let data = await getLocalData(LOCAL_DB_KEY);
            if (!data) {
                const raw = localStorage.getItem(LOCAL_KEY);
                if (!raw) return toast('没有找到本地保存。', 'warn');
                const parsed = JSON.parse(raw);
                data = parsed.storedInIndexedDB ? null : parsed;
            }
            if (!data) return toast('没有找到可恢复的数据。', 'warn');
            applyLocalSnapshot(data);
            toast('本地数据已恢复。', 'ok');
        } catch (error) {
            toast(`恢复失败：${error.message}`, 'warn');
        }
    }

    function applyLocalSnapshot(data) {
        state.grade = Number(data.grade || 9);
        state.activeSchool = cleanText(data.activeSchool || '');
        state.students = Array.isArray(data.students) ? data.students : [];
        state.subjects = sortSubjects(Array.isArray(data.subjects) ? data.subjects : []);
        state.teachers = Array.isArray(data.teachers) ? data.teachers : [];
        state.teacherRankSubjects = sortSubjects(Array.isArray(data.teacherRankSubjects) ? data.teacherRankSubjects : []);
        state.teacherRankSubjectsCustom = Boolean(data.teacherRankSubjectsCustom || state.teacherRankSubjects.length);
        state.blankScoreMode = ['zero', 'exclude', 'absent'].includes(data.blankScoreMode) ? data.blankScoreMode : 'zero';
        state.sourceMaxOverrides = data.sourceMaxOverrides && typeof data.sourceMaxOverrides === 'object' ? data.sourceMaxOverrides : {};
        state.examSchemes = data.examSchemes && typeof data.examSchemes === 'object' ? data.examSchemes : {};
        state.scoreColumnOverrides = data.scoreColumnOverrides && typeof data.scoreColumnOverrides === 'object' ? data.scoreColumnOverrides : {};
        state.subjectSourceHints = data.subjectSourceHints && typeof data.subjectSourceHints === 'object' ? data.subjectSourceHints : {};
        state.importStats = data.importStats && typeof data.importStats === 'object' ? {
            duplicateStudents: Number(data.importStats.duplicateStudents || 0),
            duplicateConflicts: Array.isArray(data.importStats.duplicateConflicts) ? data.importStats.duplicateConflicts : []
        } : { duplicateStudents: 0, duplicateConflicts: [] };
        state.referenceRoster = Array.isArray(data.referenceRoster) ? data.referenceRoster : [];
        state.examSchemeTemplates = Array.isArray(data.examSchemeTemplates) ? data.examSchemeTemplates : [];
        state.evaluationWeights = data.evaluationWeights && typeof data.evaluationWeights === 'object' ? { ...DEFAULT_EVALUATION_WEIGHTS, ...data.evaluationWeights } : { ...DEFAULT_EVALUATION_WEIGHTS };
        state.weightConfigLocked = Boolean(data.weightConfigLocked);
        state.analysisConfirmed = Boolean(data.analysisConfirmed);
        state.examHistory = Array.isArray(data.examHistory) ? data.examHistory : [];
        state.selectedHistoryId = cleanText(data.selectedHistoryId || '');
        state.logs = Array.isArray(data.logs) ? data.logs : [];
        ensureActiveSchool();
        document.querySelectorAll('#grade-segment button').forEach((button) => {
            button.classList.toggle('active', Number(button.dataset.grade) === state.grade);
        });
        analyze();
        log('已恢复本地保存数据。');
        renderAll();
    }

    function openLocalDb() {
        return new Promise((resolve, reject) => {
            if (!window.indexedDB) {
                reject(new Error('当前浏览器不支持 IndexedDB'));
                return;
            }
            const request = indexedDB.open(LOCAL_DB_NAME, 1);
            request.onupgradeneeded = () => {
                request.result.createObjectStore(LOCAL_DB_STORE);
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error || new Error('IndexedDB 打开失败'));
        });
    }

    async function putLocalData(key, value) {
        const db = await openLocalDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(LOCAL_DB_STORE, 'readwrite');
            tx.objectStore(LOCAL_DB_STORE).put(value, key);
            tx.oncomplete = () => {
                db.close();
                resolve();
            };
            tx.onerror = () => {
                db.close();
                reject(tx.error || new Error('IndexedDB 写入失败'));
            };
        });
    }

    async function getLocalData(key) {
        const db = await openLocalDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(LOCAL_DB_STORE, 'readonly');
            const request = tx.objectStore(LOCAL_DB_STORE).get(key);
            request.onsuccess = () => {
                db.close();
                resolve(request.result || null);
            };
            request.onerror = () => {
                db.close();
                reject(request.error || new Error('IndexedDB 读取失败'));
            };
        });
    }

    function deleteLocalDatabase() {
        return new Promise((resolve, reject) => {
            if (!window.indexedDB) {
                resolve();
                return;
            }
            const request = indexedDB.deleteDatabase(LOCAL_DB_NAME);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error || new Error('IndexedDB 删除失败'));
            request.onblocked = () => resolve();
        });
    }

    async function saveCurrentExamToHistory() {
        if (!getAnalysisStudents().length) return toast('暂无可保存的考试数据。', 'warn');
        const name = cleanText(els.historyName?.value) || `${currentConfig().label}_${dateStamp()}`;
        const snapshot = buildExamSnapshot(name);
        state.examHistory = [snapshot, ...state.examHistory.filter((item) => item.id !== snapshot.id)].slice(0, HISTORY_LIMIT);
        state.selectedHistoryId = snapshot.id;
        renderExamComparison();
        try {
            await saveLocal();
        } catch (error) {
            toast('考试历史已保存在当前页面，自动持久化失败。', 'warn');
        }
        log(`已保存考试历史：${name}。`);
    }

    function buildExamSnapshot(name) {
        const createdAt = new Date().toISOString();
        return {
            id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
            name,
            createdAt,
            grade: state.grade,
            school: state.activeSchool || '全部',
            totalMax: getTotalMaxScore(),
            totalSubjects: getTotalSubjects(),
            classes: state.classRows.map((row) => ({
                className: row.className,
                totalAvg: row.metrics.total.avg,
                qualityScore: row.qualityScore,
                developmentScore: row.developmentScore,
                bottomThirdAvg: row.bottomThirdAvg,
                gradeBottomShare: row.gradeBottomShare,
                studentCount: row.studentCount,
                completeTotalCount: row.completeTotalCount
            })),
            students: getAnalysisStudents().map((student) => ({
                key: studentKey(student),
                matchKeys: getStudentMatchKeys(student),
                className: student.className,
                name: student.name,
                id: student.id,
                scores: { ...(student.scores || {}) },
                total: Number.isFinite(Number(student.total)) ? Number(student.total) : null,
                gradeRank: student.ranks?.total?.grade || null,
                classRank: student.ranks?.total?.class || null
            }))
        };
    }

    function clearData() {
        state.students = [];
        state.activeSchool = '';
        state.subjects = [];
        state.thresholds = {};
        state.scoreImportSources = [];
        state.scoreColumnOverrides = {};
        state.scoreMappingRows = [];
        state.teacherRankSubjects = [];
        state.teacherRankSubjectsCustom = false;
        state.teacherDiagnostics = { sameName: [], rankedSubjects: [], excludedSubjects: [], teacherCount: 0 };
        state.importDiagnostics = {};
        state.subjectSourceHints = {};
        state.importStats = { duplicateStudents: 0, duplicateConflicts: [] };
        state.analysisConfirmed = false;
        state.analysisGate = { blocks: [], warnings: [], infos: [] };
        state.referenceRoster = [];
        state.rosterDiagnostics = { missingFromScores: [], extraInScores: [], statusCounts: {} };
        state.teachers = [];
        state.classRows = [];
        state.subjectRows = [];
        state.teacherRows = [];
        state.finalTeacherRows = [];
        state.studentAlerts = [];
        state.scoreAdjustments = {};
        state.teacherCoverage = { matched: 0, unmatched: [] };
        state.selectedClassName = '';
        state.selectedStudentKey = '';
        state.selectedTeacherKey = '';
        log('已清空当前数据。');
        renderAll();
    }

    function loadSampleData() {
        const sampleGrade = Number(state.grade || 9);
        state.grade = sampleGrade;
        document.querySelectorAll('#grade-segment button').forEach((button) => {
            button.classList.toggle('active', Number(button.dataset.grade) === sampleGrade);
        });
        const subjects = currentConfig().templateSubjects;
        const classes = [`${sampleGrade}.1`, `${sampleGrade}.2`, `${sampleGrade}.3`, `${sampleGrade}.4`];
        const names = ['安然', '陈雨', '邓凯', '冯宁', '郭明', '韩旭', '姜琳', '李想', '孟舟', '秦川', '宋一', '唐悦', '王泽', '许晴', '杨帆', '赵越'];
        state.students = [];
        state.teacherRankSubjects = [];
        state.teacherRankSubjectsCustom = false;
        state.scoreMappingRows = [];
        state.selectedClassName = '';
        state.selectedStudentKey = '';
        state.selectedTeacherKey = '';
        let id = sampleGrade * 1000 + 1;
        classes.forEach((className, classIndex) => {
            for (let i = 0; i < 18; i += 1) {
                const student = {
                    school: '银山实验学校',
                    className,
                    name: `${names[(i + classIndex * 3) % names.length]}${i + 1}`,
                    id: String(id++),
                    rawScores: {},
                    blankScores: {},
                    absentScores: {},
                    scoreReasons: {},
                    scoreMeta: {},
                    scores: {},
                    total: 0,
                    validCount: subjects.length,
                    ranks: {}
                };
                subjects.forEach((subject, subjectIndex) => {
                    const full = getSubjectMaxScore(subject);
                    const baseRatio = 0.66 + classIndex * 0.018 + (i % 5) * 0.012 + (subjectIndex % 3) * 0.01;
                    const wave = (((i * 7 + subjectIndex * 5 + classIndex * 3) % 17) - 8) * full * 0.012;
                    const classBoost = subject === '物理' && className === `${sampleGrade}.3` ? full * 0.09 : 0;
                    const classDrop = subject === '英语' && className === `${sampleGrade}.2` ? -full * 0.06 : 0;
                    student.rawScores[subject] = round(clamp(full * baseRatio + wave + classBoost + classDrop, full * 0.28, full * 0.98), 1);
                    student.blankScores[subject] = false;
                    student.absentScores[subject] = false;
                    student.scoreReasons[subject] = 'present';
                    student.scoreMeta[subject] = { sourceHint: 'converted', allBlank: false, hasAbsent: false, columns: [subject] };
                    student.scores[subject] = student.rawScores[subject];
                });
                state.students.push(student);
            }
        });
        state.subjects = sortSubjects(subjects);
        state.teachers = uniqueTeacherAssignments(classes.flatMap((className, classIndex) => subjects.map((subject, subjectIndex) => ({
            className,
            subject,
            teacher: `${subject}${['张', '李', '王', '赵', '孙', '周'][(classIndex + subjectIndex) % 6]}老师`,
            teacherId: `${subjectIndex + 1}${classIndex + 1}`
        }))));
        state.activeSchool = '银山实验学校';
        analyze();
        log(`已载入 ${currentConfig().label} 示例成绩和任课表。`);
        renderAll();
        toast('示例数据已载入。', 'ok');
    }

    function currentConfig() {
        return GRADE_CONFIG[state.grade] || GRADE_CONFIG[9];
    }

    function getEvaluationWeights() {
        return Object.fromEntries(Object.entries(DEFAULT_EVALUATION_WEIGHTS).map(([key, fallback]) => {
            const value = Number(state.evaluationWeights?.[key]);
            return [key, Number.isFinite(value) && value >= 0 ? value : fallback];
        }));
    }

    function getSchoolNames() {
        return [...new Set(state.students.map((student) => cleanText(student.school)).filter(Boolean))].sort(naturalCompare);
    }

    function inferDefaultSchool(value) {
        const text = cleanText(value);
        if (!text) return '本校';
        const key = cleanHeader(text).toLowerCase();
        const nonSchoolNames = ['考号', '成绩', '成绩表', '学生成绩', '分数', '总表', '汇总', 'sheet1', 'sheet2', 'sheet3'];
        if (nonSchoolNames.includes(key) || normalizeSubject(key)) return '本校';
        return text;
    }

    function ensureActiveSchool() {
        const schools = getSchoolNames();
        if (!schools.length) {
            state.activeSchool = '';
            return;
        }
        if (!state.activeSchool || !schools.includes(state.activeSchool)) {
            state.activeSchool = schools[0];
        }
    }

    function getAnalysisStudents() {
        return getSchoolScopedStudents().filter((student) => {
            const grade = getStudentGrade(student);
            return !grade || grade === state.grade;
        });
    }

    function getSchoolScopedStudents() {
        if (!state.activeSchool) return state.students;
        return state.students.filter((student) => cleanText(student.school) === state.activeSchool);
    }

    function getGradeScopeStats() {
        const rows = getSchoolScopedStudents();
        const otherGrades = {};
        let current = 0;
        let unknown = 0;
        rows.forEach((student) => {
            const grade = getStudentGrade(student);
            if (!grade) {
                unknown += 1;
            } else if (grade === state.grade) {
                current += 1;
            } else {
                otherGrades[grade] = Number(otherGrades[grade] || 0) + 1;
            }
        });
        const otherCount = Object.values(otherGrades).reduce((sum, value) => sum + Number(value || 0), 0);
        return { total: rows.length, current, unknown, otherGrades, otherCount };
    }

    function getStudentGrade(student) {
        const match = cleanText(student.className).match(/^([6-9])(?:\.|$)/);
        return match ? Number(match[1]) : 0;
    }

    function getAnalysisSubjects() {
        const analysisStudents = getAnalysisStudents();
        if (!analysisStudents.length) return state.subjects.slice();
        return state.subjects.filter((subject) => analysisStudents.some((student) => Number.isFinite(Number(student.scores?.[subject]))));
    }

    function getTotalSubjects() {
        const subjects = getAnalysisSubjects();
        const configuredSubjects = getConfiguredTotalSubjects();
        if (state.grade === 9) {
            return CORE_GRADE9.filter((subject) => subjects.includes(subject));
        }
        return configuredSubjects.filter((subject) => subjects.includes(subject));
    }

    function getConfiguredTotalSubjects() {
        const override = state.examSchemes?.[state.grade]?.totalSubjects;
        if (Array.isArray(override)) return sortSubjects(override.filter((subject) => getSubjectMaxScore(subject) > 0));
        return getDefaultTotalSubjectsForGrade(state.grade);
    }

    function getDefaultTotalSubjectsForGrade(grade = state.grade) {
        const config = GRADE_CONFIG[grade] || GRADE_CONFIG[9];
        if (Number(grade) === 9) return CORE_GRADE9.slice();
        return (config.templateSubjects || [])
            .filter((subject) => Object.prototype.hasOwnProperty.call(config.maxScores || {}, subject));
    }

    function getSubjectMaxScore(subject) {
        const override = Number(state.examSchemes?.[state.grade]?.maxScores?.[subject]);
        if (Number.isFinite(override) && override > 0) return override;
        return getDefaultSubjectMaxScore(subject, state.grade);
    }

    function getDefaultSubjectMaxScore(subject, grade = state.grade) {
        const config = GRADE_CONFIG[grade] || GRADE_CONFIG[9];
        return Number(config.maxScores?.[subject] || 100);
    }

    function ensureExamSchemeOverride() {
        const key = String(state.grade);
        if (!state.examSchemes[key]) state.examSchemes[key] = { maxScores: {}, totalSubjects: null };
        if (!state.examSchemes[key].maxScores) state.examSchemes[key].maxScores = {};
        return state.examSchemes[key];
    }

    function getExamSchemeTemplates() {
        const defaults = Object.entries(GRADE_CONFIG).map(([grade, config]) => ({
            id: `default-${grade}`,
            grade: Number(grade),
            name: `${config.label}默认方案`,
            scheme: {
                maxScores: { ...(config.maxScores || {}) },
                totalSubjects: getDefaultTotalSubjectsForGrade(Number(grade))
            }
        }));
        const custom = (state.examSchemeTemplates || []).filter((item) => item && item.id);
        return [...custom, ...defaults].filter((item) => Number(item.grade) === Number(state.grade));
    }

    function saveCurrentExamSchemeTemplate() {
        const name = cleanText(els.schemeName?.value) || `${currentConfig().label}方案_${dateStamp()}`;
        const scheme = {
            maxScores: Object.fromEntries(getRuleSubjects().map((subject) => [subject, getSubjectMaxScore(subject)])),
            totalSubjects: getTotalSubjects()
        };
        const template = { id: `scheme-${Date.now()}`, grade: state.grade, name, scheme };
        state.examSchemeTemplates = [template, ...(state.examSchemeTemplates || []).filter((item) => item.name !== name)].slice(0, 20);
        renderSchemeTemplates();
        log(`已保存考试方案：${name}。`);
        toast('考试方案已保存。', 'ok');
    }

    function applySelectedExamSchemeTemplate() {
        const id = els.schemeTemplateSelect?.value;
        const template = getExamSchemeTemplates().find((item) => item.id === id);
        if (!template) return toast('请选择要应用的考试方案。', 'warn');
        state.examSchemes[String(state.grade)] = {
            maxScores: { ...(template.scheme?.maxScores || {}) },
            totalSubjects: sortSubjects([...(template.scheme?.totalSubjects || [])])
        };
        state.analysisConfirmed = false;
        analyze();
        renderAll();
        log(`已应用考试方案：${template.name}。`);
        toast('考试方案已应用。', 'ok');
    }

    function getTotalMaxScore() {
        const subjects = getTotalSubjects();
        if (!subjects.length) return 0;
        return subjects.reduce((sum, subject) => sum + getSubjectMaxScore(subject), 0);
    }

    function getDefaultTeacherRankSubjects() {
        const totalSubjects = getTotalSubjects();
        return totalSubjects.length ? totalSubjects : getAnalysisSubjects();
    }

    function getTeacherRankSubjects() {
        const analysisSubjects = getAnalysisSubjects();
        const selected = state.teacherRankSubjectsCustom
            ? state.teacherRankSubjects.filter((subject) => analysisSubjects.includes(subject))
            : getDefaultTeacherRankSubjects();
        return sortSubjects([...new Set(selected)]);
    }

    function getMaxScoreSummary() {
        const subjects = getAnalysisSubjects();
        if (!subjects.length) return '等待识别学科后显示。';
        return subjects.map((subject) => `${subject}${getSubjectMaxScore(subject)}`).join('、');
    }

    function getSourceMaxSummary() {
        const items = getRuleSubjects()
            .map((subject) => {
                const adjustedSourceMax = Number(state.scoreAdjustments?.[subject]?.sourceMax);
                const sourceMax = Number.isFinite(adjustedSourceMax) && adjustedSourceMax > 0
                    ? adjustedSourceMax
                    : getConfiguredSourceMaxScore(subject, { useDefault: true });
                return Number.isFinite(sourceMax) && sourceMax > 0 ? `${subject}${sourceMax}` : '';
            })
            .filter(Boolean);
        return items.length ? items.join('、') : '未手动配置，按导入分自动推断。';
    }

    function getRuleSubjects() {
        const config = currentConfig();
        const scheme = state.examSchemes?.[state.grade] || {};
        return sortSubjects([...new Set([
            ...(config.templateSubjects || []),
            ...getAnalysisSubjects(),
            ...Object.keys(scheme.maxScores || {}),
            ...(scheme.totalSubjects || [])
        ])]);
    }

    function sourceMaxOverrideKey(subject) {
        return `${state.grade}__${subject}`;
    }

    function getSourceMaxOverride(subject) {
        const override = Number(state.sourceMaxOverrides?.[sourceMaxOverrideKey(subject)]);
        return Number.isFinite(override) && override > 0 ? override : NaN;
    }

    function getConfiguredSourceMaxScore(subject, options = {}) {
        const override = getSourceMaxOverride(subject);
        if (Number.isFinite(override) && override > 0) return override;
        if (!options.useDefault) return NaN;
        const configured = Number(currentConfig().sourceMaxScores?.[subject]);
        return Number.isFinite(configured) && configured > 0 ? configured : NaN;
    }

    function getBlankScoreModeText() {
        const labels = {
            zero: '空白/缺考按 0 分',
            exclude: '空白/缺考剔除',
            absent: '空白剔除，缺考按 0 分'
        };
        return labels[state.blankScoreMode] || labels.zero;
    }

    function getScoreAdjustmentRows() {
        return getAnalysisSubjects()
            .map((subject) => state.scoreAdjustments?.[subject])
            .filter((item) => item && item.observedMax > 0)
            .map((item) => [
                item.subject,
                item.targetMax,
                item.observedMax,
                item.sourceMax,
                item.scale,
                item.adjusted ? '已折算' : '原分'
            ]);
    }

    function getScoreAdjustmentSummary() {
        const adjusted = getAnalysisSubjects()
            .map((subject) => state.scoreAdjustments?.[subject])
            .filter((item) => item?.adjusted);
        if (!adjusted.length) return '';
        return adjusted.map((item) => `${item.subject}${item.sourceMax}→${item.targetMax}`).join('、') + ' 后参与统计。';
    }

    function normalizeSubjectHeader(header) {
        const raw = cleanText(header).replace(/\s+/g, '');
        if (!raw || SUBJECT_HEADER_EXCLUDES.some((word) => raw.includes(word))) return '';
        return normalizeSubject(raw);
    }

    function buildSubjectColumns(headers) {
        const groups = {};
        headers.forEach((header, index) => {
            const candidate = getSubjectColumnCandidate(header, index);
            if (!candidate) return;
            if (!groups[candidate.subject]) groups[candidate.subject] = [];
            groups[candidate.subject].push(candidate);
        });

        const result = {};
        Object.entries(groups).forEach(([subject, candidates]) => {
            const finalCandidates = candidates
                .filter((item) => !item.isComponent)
                .sort((a, b) => b.priority - a.priority || a.header.length - b.header.length || a.index - b.index);
            const componentIndexes = candidates
                .filter((item) => item.isComponent)
                .sort((a, b) => a.index - b.index)
                .map((item) => item.index);
            if (finalCandidates.length) {
                result[subject] = {
                    final: [finalCandidates[0].index],
                    components: componentIndexes,
                    candidates
                };
                return;
            }
            result[subject] = {
                final: [],
                components: componentIndexes,
                candidates
            };
        });
        return result;
    }

    function getSubjectColumnCandidate(header, index) {
        const raw = cleanText(header).replace(/\s+/g, '');
        if (!raw) return null;
        const subject = normalizeSubject(raw);
        if (!subject) return null;
        const hardExcludes = ['排名', '名次', '排位', '等级', '标准分', '相对分', '序号'];
        if (hardExcludes.some((word) => raw.includes(word))) return null;

        const exact = raw === subject;
        const isConverted = raw.includes('折合') || raw.includes('折算');
        const isTotal = raw.includes('总分') || raw.includes('总成绩') || raw.endsWith('总') || raw.includes('合计');
        const isPlainScore = raw.includes('成绩') || raw.includes('分数') || raw.includes('得分');
        const isComponent = /[一二三四五六七八九十0-9]+卷|客观|主观|选择|非选择|小题|卷[一二三四五六七八九十]/.test(raw);
        let priority = 50;
        if (isConverted) priority = 110;
        else if (exact) priority = 100;
        else if (isTotal) priority = 95;
        else if (isPlainScore) priority = 85;
        else if (isComponent) priority = 10;
        return { subject, index, header: raw, priority, isComponent };
    }

    function normalizeSubject(value) {
        const raw = cleanText(value).replace(/\s+/g, '');
        if (!raw) return '';
        if (SUBJECT_ALIASES.has(raw)) return SUBJECT_ALIASES.get(raw);
        for (const [alias, subject] of SUBJECT_ALIASES.entries()) {
            if (raw.includes(alias)) return subject;
        }
        return '';
    }

    function normalizeClass(value) {
        const original = cleanText(value).replace(/\s+/g, '');
        const chineseDottedMatch = original.match(/^([六七八九6-9])(?:年级|年)?[.．·、,_-]?([一二三四五六七八九十〇零]+|\d{1,2})(?:班)?(?:\d{1,3}人?)?$/);
        if (chineseDottedMatch) {
            const grade = parseGradeToken(chineseDottedMatch[1]);
            const classNo = parseClassToken(chineseDottedMatch[2]);
            if (grade && classNo) return `${grade}.${classNo}`;
        }
        const chineseMatch = original.match(/^([六七八九6-9])(?:年级|年)?([一二三四五六七八九十〇零0-9]+)(?:班)?$/);
        if (chineseMatch) {
            const grade = parseGradeToken(chineseMatch[1]);
            const classNo = parseClassToken(chineseMatch[2]);
            if (grade && classNo) return `${grade}.${classNo}`;
        }

        const raw = original
            .replace(/[班级年]/g, '')
            .replace(/[（）()]/g, '')
            .replace(/[、,_-]+/g, '.')
            .replace(/\s+/g, '');
        if (!raw) return '';
        const dotted = raw.match(/^([6-9])\.(\d+)$/);
        if (dotted) return `${dotted[1]}.${Number(dotted[2])}`;
        const digits = raw.replace(/\D/g, '');
        if (/^[6-9]\d{1,3}$/.test(digits)) return `${digits[0]}.${Number(digits.slice(1))}`;
        if (/^\d+$/.test(digits)) return `${state.grade}.${Number(digits)}`;
        return raw;
    }

    function parseGradeToken(token) {
        const map = { '六': 6, '七': 7, '八': 8, '九': 9 };
        const num = Number(token);
        return Number.isFinite(num) && num >= 6 && num <= 9 ? num : map[token];
    }

    function parseClassToken(token) {
        const text = cleanText(token);
        const direct = Number(text);
        if (Number.isFinite(direct) && direct > 0) return direct;
        const map = { '零': 0, '〇': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9 };
        if (text === '十') return 10;
        if (text.startsWith('十')) return 10 + (map[text.slice(1)] || 0);
        if (text.includes('十')) {
            const [tens, ones] = text.split('十');
            return (map[tens] || 1) * 10 + (map[ones] || 0);
        }
        return map[text] || 0;
    }

    function parseScore(value, blankAsZero = false) {
        if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
        const text = cleanText(value).replace(/[\uff01-\uff5e]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0)).toUpperCase();
        if (!text) return blankAsZero ? 0 : NaN;
        if (ZERO_WORDS.some((word) => text.includes(word))) return 0;
        const match = text.match(/-?\d+(?:\.\d+)?/);
        return match ? Number(match[0]) : NaN;
    }

    function detectScoreStatus(value) {
        if (typeof value === 'number') return Number(value) === 0 ? { key: 'trueZero', label: '真实0分' } : { key: 'present', label: '正常参考' };
        const text = cleanText(value).replace(/[\uff01-\uff5e]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0)).toUpperCase();
        for (const rule of SCORE_STATUS_RULES) {
            if (rule.regex.test(text)) return { key: rule.key, label: rule.label };
        }
        return { key: 'present', label: '正常参考' };
    }

    function pickDominantScoreReason(reasonCounts) {
        const priority = ['cheat', 'transfer', 'deferred', 'exempt', 'absent', 'blank', 'trueZero', 'present'];
        return priority.find((key) => reasonCounts[key]) || 'present';
    }

    function isBlankScoreCell(value) {
        return cleanText(value) === '';
    }

    function isAbsentScoreCell(value) {
        const text = cleanText(value).replace(/[\uff01-\uff5e]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0)).toUpperCase();
        return Boolean(text) && ZERO_WORDS.some((word) => text.includes(word));
    }

    function findHeaderRow(rows) {
        for (let i = 0; i < Math.min(rows.length, 8); i += 1) {
            const headers = (rows[i] || []).map((cell) => cleanHeader(cell));
            const hasName = findBestHeader(headers, NAME_ALIASES) !== -1;
            const subjectCount = headers.filter((header, index) => getSubjectColumnCandidate(header, index)).length;
            if (hasName && subjectCount > 0) return i;
        }
        return 0;
    }

    function findTeacherHeaderRow(rows) {
        for (let i = 0; i < Math.min(rows.length, 8); i += 1) {
            const headers = (rows[i] || []).map((cell) => cleanHeader(cell));
            const hasClass = findBestHeader(headers, CLASS_ALIASES) !== -1;
            const hasSubject = findBestHeader(headers, ['学科', '科目', '课程', 'subject']) !== -1;
            const hasTeacher = findBestHeader(headers, TEACHER_ALIASES) !== -1;
            const wideSubjectCount = headers.filter((header) => normalizeSubjectHeader(header)).length;
            if (hasClass && ((hasSubject && hasTeacher) || wideSubjectCount > 0)) return i;
        }
        return 0;
    }

    function findBestHeader(headers, aliases) {
        let best = { index: -1, score: -1 };
        headers.forEach((header, index) => {
            const text = cleanHeader(header).toLowerCase();
            aliases.forEach((alias) => {
                const key = cleanHeader(alias).toLowerCase();
                let score = -1;
                if (text === key) score = 100 + key.length;
                else if (key.length > 1 && text.includes(key)) score = 50 + key.length;
                if (score > best.score) best = { index, score };
            });
        });
        return best.index;
    }

    function metricSummary(values, thresholds = {}, maxScore = 0) {
        const list = values.map(Number).filter(Number.isFinite);
        const paperPassLine = Number(maxScore || thresholds.maxScore || 0) > 0
            ? Number(maxScore || thresholds.maxScore || 0) * 0.6
            : 0;
        if (!list.length) return { count: 0, avg: 0, excRate: 0, passRate: 0, paperPassRate: null, lowRate: 0 };
        const avgValue = average(list);
        return {
            count: list.length,
            avg: avgValue,
            excRate: list.filter((value) => value >= Number(thresholds.exc || 0)).length / list.length,
            passRate: list.filter((value) => value >= Number(thresholds.pass || 0)).length / list.length,
            paperPassRate: paperPassLine > 0 ? list.filter((value) => value >= paperPassLine).length / list.length : null,
            lowRate: list.filter((value) => value < Number(thresholds.low || 0)).length / list.length
        };
    }

    function scoreFromMax(metric, max, weights) {
        const totalWeight = weights.avg + weights.exc + weights.pass;
        const ratedAvg = max.avg > 0 ? (metric.avg / max.avg) * weights.avg : 0;
        const ratedExc = max.exc > 0 ? (metric.excRate / max.exc) * weights.exc : 0;
        const ratedPass = max.pass > 0 ? (metric.passRate / max.pass) * weights.pass : 0;
        return totalWeight > 0 ? ((ratedAvg + ratedExc + ratedPass) / totalWeight) * 100 : 0;
    }

    function achievementScore(metric, maxScore) {
        const full = Number(maxScore || 0);
        const avgScore = full > 0 ? clamp((Number(metric.avg || 0) / full) * 100, 0, 100) : 0;
        const paperPassScore = Number.isFinite(Number(metric.paperPassRate)) ? Number(metric.paperPassRate) * 100 : 0;
        const passScore = Number(metric.passRate || 0) * 100;
        const excScore = Number(metric.excRate || 0) * 100;
        return clamp(avgScore * 0.55 + paperPassScore * 0.25 + passScore * 0.12 + excScore * 0.08, 0, 100);
    }

    function scoreFromRange(value, minValue, maxValue, minScore = 60, maxScore = 100) {
        const valueNumber = Number(value);
        const minNumber = Number(minValue);
        const maxNumber = Number(maxValue);
        if (!Number.isFinite(valueNumber) || !Number.isFinite(minNumber) || !Number.isFinite(maxNumber) || maxNumber <= minNumber) {
            return (minScore + maxScore) / 2;
        }
        return clamp(minScore + ((valueNumber - minNumber) / (maxNumber - minNumber)) * (maxScore - minScore), minScore, maxScore);
    }

    function getBaseScoreExcluding(student, subject) {
        const subjects = getTotalSubjects().filter((item) => item !== subject && Number.isFinite(Number(student.scores[item])));
        if (!subjects.length) return NaN;
        return subjects.reduce((sum, item) => sum + Number(student.scores[item]), 0);
    }

    function linearRegression(points) {
        const xMean = average(points.map((point) => point.x));
        const yMean = average(points.map((point) => point.y));
        let numerator = 0;
        let denominator = 0;
        points.forEach((point) => {
            numerator += (point.x - xMean) * (point.y - yMean);
            denominator += Math.pow(point.x - xMean, 2);
        });
        const b = denominator ? numerator / denominator : 0;
        return { a: yMean - b * xMean, b };
    }

    function assignRanks(rows, valueGetter, setter) {
        const sorted = rows.slice().sort((a, b) => Number(valueGetter(b) || 0) - Number(valueGetter(a) || 0));
        let lastValue = null;
        let lastRank = 0;
        sorted.forEach((row, index) => {
            const value = Number(valueGetter(row) || 0);
            if (lastValue === null || Math.abs(value - lastValue) > 0.0001) {
                lastRank = index + 1;
                lastValue = value;
            }
            setter(row, lastRank);
        });
    }

    function ensureRank(student, key) {
        if (!student.ranks[key]) student.ranks[key] = {};
        return student.ranks[key];
    }

    function studentKey(student) {
        return `${cleanText(student.school || state.activeSchool)}__${cleanText(student.className)}__${cleanText(student.id) || cleanName(student.name)}`;
    }

    function getSelectedStudent() {
        const students = getAnalysisStudents();
        if (!students.length) return null;
        if (!state.selectedStudentKey || !students.some((student) => studentKey(student) === state.selectedStudentKey)) {
            state.selectedStudentKey = studentKey(students.slice().sort((a, b) => (a.ranks?.total?.grade || 99999) - (b.ranks?.total?.grade || 99999))[0]);
        }
        return students.find((student) => studentKey(student) === state.selectedStudentKey) || null;
    }

    function groupBy(list, getter) {
        const map = new Map();
        list.forEach((item) => {
            const key = getter(item);
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(item);
        });
        return map;
    }

    function uniqueBy(list, getter) {
        const map = new Map();
        list.forEach((item) => {
            const key = getter(item);
            if (!map.has(key)) map.set(key, item);
        });
        return Array.from(map.values());
    }

    function uniqueTeacherAssignments(list) {
        const normalized = list.map((item) => ({
            ...item,
            teacher: normalizeTeacherName(item.teacher),
            teacherId: cleanText(item.teacherId),
            teacherKey: cleanText(item.teacherKey) || (item.teacherId ? `${normalizeTeacherName(item.teacher)}#${cleanText(item.teacherId)}` : normalizeTeacherName(item.teacher)),
            scopeText: cleanText(item.scopeText),
            studentIds: Array.isArray(item.studentIds) ? item.studentIds.map(cleanText).filter(Boolean) : [],
            studentNames: Array.isArray(item.studentNames) ? item.studentNames.map(cleanName).filter(Boolean) : [],
            teachingWeight: Number.isFinite(Number(item.teachingWeight)) ? clamp(Number(item.teachingWeight), 0, 1) : 1
        }));
        return uniqueBy(normalized, (item) => `${item.className}__${item.subject}__${item.teacherKey}__${teacherScopeKey(item)}`)
            .sort((a, b) => {
                const classOrder = naturalCompare(a.className, b.className);
                if (classOrder) return classOrder;
                const subjectOrder = sortSubjects([a.subject, b.subject]);
                if (a.subject !== b.subject) return subjectOrder[0] === a.subject ? -1 : 1;
                return naturalCompare(a.teacherKey, b.teacherKey);
            });
    }

    function teacherScopeKey(item) {
        return `${cleanText(item.scopeText)}|${(item.studentIds || []).join(',')}|${(item.studentNames || []).join(',')}`;
    }

    function getClasses() {
        return [...new Set(getAnalysisStudents().map((student) => student.className))].sort(naturalCompare);
    }

    function pickLine(values, ratio) {
        if (!values.length) return 0;
        const index = Math.max(0, Math.ceil(values.length * ratio) - 1);
        return values[Math.min(index, values.length - 1)] || 0;
    }

    function average(values) {
        return values.length ? values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length : 0;
    }

    function sumObjectValues(object) {
        return Object.values(object || {}).reduce((sum, value) => sum + Number(value || 0), 0);
    }

    function percentile(values, ratio) {
        const list = values.map(Number).filter(Number.isFinite).sort((a, b) => a - b);
        if (!list.length) return 0;
        const index = (list.length - 1) * ratio;
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        if (lower === upper) return list[lower];
        return list[lower] + (list[upper] - list[lower]) * (index - lower);
    }

    function median(values) {
        const list = values.map(Number).filter(Number.isFinite).sort((a, b) => a - b);
        if (!list.length) return 0;
        const middle = Math.floor(list.length / 2);
        return list.length % 2 ? list[middle] : (list[middle - 1] + list[middle]) / 2;
    }

    function standardDeviation(values) {
        const list = values.map(Number).filter(Number.isFinite);
        if (list.length < 2) return 0;
        const avgValue = average(list);
        return Math.sqrt(average(list.map((value) => Math.pow(value - avgValue, 2))));
    }

    function sortSubjects(subjects) {
        return subjects.slice().sort((a, b) => {
            const ai = SUBJECT_ORDER.indexOf(a);
            const bi = SUBJECT_ORDER.indexOf(b);
            if (ai !== bi) return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
            return naturalCompare(a, b);
        });
    }

    function sortBySubjectRank(a, b) {
        const subjectOrder = sortSubjects([a.subject, b.subject]);
        if (a.subject !== b.subject) return subjectOrder[0] === a.subject ? -1 : 1;
        return a.subjectRank - b.subjectRank || naturalCompare(a.teacher, b.teacher);
    }

    function naturalCompare(a, b) {
        return String(a).localeCompare(String(b), 'zh-CN', { numeric: true });
    }

    function drawChart(key, canvas, config) {
        if (!canvas) return;
        if (state.charts[key]) state.charts[key].destroy();
        state.charts[key] = new Chart(canvas, config);
    }

    function chartOptions(label) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `${label}: ${ctx.raw}` } } },
            scales: { y: { beginAtZero: true, grid: { color: '#e5edf6' } }, x: { grid: { display: false } } }
        };
    }

    function log(message) {
        const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
        state.logs.push(`[${time}] ${message}`);
    }

    function toast(message, type = '') {
        const node = document.createElement('div');
        node.className = `toast ${type}`;
        node.textContent = message;
        document.getElementById('toast-region').appendChild(node);
        setTimeout(() => node.remove(), 2600);
    }

    function insightCard(title, body) {
        return `<div class="insight-card"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(body)}</span></div>`;
    }

    function detailItem(label, value) {
        return `<div class="detail-item"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
    }

    function rankBadge(rank) {
        const value = String(rank || '-');
        const num = Number(rank);
        const tone = Number.isFinite(num) && num <= 3 ? 'top' : '';
        return `<span class="rank-badge ${tone}">${escapeHtml(value)}</span>`;
    }

    function emptyRow(count, message = '暂无数据') {
        return `<tr><td colspan="${count}" class="empty">${escapeHtml(message)}</td></tr>`;
    }

    function percent(value) {
        return `${(Number(value || 0) * 100).toFixed(1)}%`;
    }

    function formatNullablePercent(value) {
        return value === null || value === undefined || !Number.isFinite(Number(value))
            ? '-'
            : percent(value);
    }

    function formatScore(value, digits = 1) {
        const num = Number(value);
        return Number.isFinite(num) ? num.toFixed(digits) : '-';
    }

    function formatExportScore(value) {
        const num = Number(value);
        return Number.isFinite(num) ? num : '';
    }

    function signed(value) {
        const num = Number(value || 0);
        return `${num >= 0 ? '+' : ''}${num.toFixed(1)}`;
    }

    function riskText(flags) {
        const list = (flags || []).filter(Boolean);
        return list.length ? `<span class="risk-text">${escapeHtml(list.join('、'))}</span>` : '<span class="ok-text">正常</span>';
    }

    function round(value, digits = 2) {
        const factor = 10 ** digits;
        return Math.round((Number(value) || 0) * factor) / factor;
    }

    function nowMs() {
        return window.performance?.now ? window.performance.now() : Date.now();
    }

    function clamp(value, min, max) {
        return Math.min(Math.max(Number(value) || 0, min), max);
    }

    function cleanText(value) {
        return String(value ?? '').trim();
    }

    function cleanHeader(value) {
        return cleanText(value).replace(/\s+/g, '').replace(/[：:]/g, '');
    }

    function cleanName(value) {
        return cleanText(value).replace(/\s+/g, '').replace(/[\u200b-\u200f\uFEFF]/g, '');
    }

    function fileListText(files) {
        const list = Array.from(files || []);
        if (!list.length) return '未选择文件';
        return list.map((file) => file.name).join('，');
    }

    function dateStamp() {
        const date = new Date();
        return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    }

    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[ch]));
    }

    function escapeAttr(value) {
        return escapeHtml(value).replace(/"/g, '&quot;');
    }

    function toCamel(id) {
        return id.replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
    }

    window.LocalSchoolAnalytics = {
        state,
        analyze,
        loadSampleData,
        getTotalSubjects,
        getGradeScopeStats,
        getSubjectMaxScore,
        getTotalMaxScore,
        getAnalysisStudents,
        getAnalysisSubjects,
        getScoreAdjustmentSummary,
        getBlankScoreModeText,
        getConfiguredSourceMaxScore,
        getScoreBandRuleText,
        normalizeClass,
        normalizeScoresForCurrentGrade,
        mergeDuplicateStudents,
        fillMergedRows,
        parseTeacherRows,
        parseScoreRows,
        parseScoreSources,
        buildScoreImportSource,
        scoreColumnOverrideKey,
        buildSubjectColumns,
        buildStudentRankRows,
        buildStudentReportRows,
        buildDistributionRows,
        buildScoreBandRows,
        parseRosterRows,
        buildRosterDiagnostics,
        buildAnalysisGate,
        buildAnalysisGateRows,
        buildCalculationTraceRows,
        buildExamSnapshot,
        buildCloudSnapshotPayload,
        estimateCohortYear,
        getSchoolYear,
        getCloudScopeMeta,
        getCloudSnapshotScopeWarnings,
        buildExamComparisonRows,
        getEvaluationWeights,
        getStudentMatchKeys,
        loadCloudSnapshots,
        useCloudSnapshotAsBaseline,
        restoreCloudSnapshot,
        exportReportWorkbook,
        exportStudentReportWorkbook,
        saveCurrentExamToHistory,
        achievementScore,
        formatExportScore,
        exportWorkbook
    };
})();
