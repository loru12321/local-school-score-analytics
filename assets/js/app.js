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
    const ZERO_WORDS = ['缺', 'ABS', '作弊', '违纪', '病假', '缓考', '取消', '零分', 'Q', 'CHE'];
    const CORE_GRADE9 = ['语文', '数学', '英语', '物理', '化学'];
    const STANDARD_FULL_MARKS = [30, 40, 50, 60, 70, 80, 90, 100, 120, 150, 160, 180, 200];
    const LOCAL_KEY = 'LOCAL_SCHOOL_SCORE_ANALYTICS_V1';

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
        subjectSourceHints: {},
        importStats: { duplicateStudents: 0, duplicateConflicts: [] },
        teachers: [],
        classRows: [],
        subjectRows: [],
        teacherRows: [],
        finalTeacherRows: [],
        studentAlerts: [],
        scoreAdjustments: {},
        teacherCoverage: { matched: 0, unmatched: [] },
        charts: {},
        logs: []
    };

    const els = {};

    document.addEventListener('DOMContentLoaded', () => {
        cacheElements();
        bindEvents();
        renderAll();
    });

    function cacheElements() {
        [
            'metric-grid', 'analysis-status', 'class-total-chart', 'subject-radar-chart', 'insight-grid',
            'score-file', 'teacher-file', 'score-file-name', 'teacher-file-name', 'import-log',
            'class-table', 'subject-matrix-table', 'teacher-final-table', 'teacher-detail-table',
            'teacher-status', 'pair-list', 'student-class-filter', 'student-subject-filter',
            'student-search', 'student-table', 'student-alert-grid', 'rail-grade-label', 'rail-total-label',
            'topbar-copy', 'school-select', 'subject-radar-note', 'blank-score-mode', 'score-rule-table'
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

        document.getElementById('parse-score-btn').addEventListener('click', async () => {
            if (!els.scoreFile.files.length) return toast('请选择成绩文件。', 'warn');
            await loadScoreFiles(Array.from(els.scoreFile.files));
        });
        document.getElementById('parse-teacher-btn').addEventListener('click', async () => {
            if (!els.teacherFile.files.length) return toast('请选择教师任课表。', 'warn');
            await loadTeacherFile(els.teacherFile.files[0]);
        });
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
                analyze();
                renderAll();
                log(`空白成绩口径切换为：${getBlankScoreModeText()}。`);
            });
        }
        if (els.scoreRuleTable) {
            els.scoreRuleTable.addEventListener('change', (event) => {
                const input = event.target.closest('[data-source-max-subject]');
                if (!input) return;
                const subject = input.dataset.sourceMaxSubject;
                const value = Number(input.value);
                const key = sourceMaxOverrideKey(subject);
                if (Number.isFinite(value) && value > 0) state.sourceMaxOverrides[key] = value;
                else delete state.sourceMaxOverrides[key];
                analyze();
                renderAll();
                log(`${subject} 原始满分调整为 ${Number.isFinite(value) && value > 0 ? value : '自动'}。`);
            });
        }
        els.schoolSelect.addEventListener('change', () => {
            state.activeSchool = els.schoolSelect.value;
            log(`切换分析学校：${state.activeSchool || '全部'}。`);
            analyze();
            renderAll();
        });

        [els.studentClassFilter, els.studentSubjectFilter, els.studentSearch].forEach((node) => {
            node.addEventListener('input', renderStudentTable);
            node.addEventListener('change', renderStudentTable);
        });
    }

    function switchView(id) {
        document.querySelectorAll('.view').forEach((view) => view.classList.toggle('active', view.id === id));
        document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.viewTarget === id));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async function loadScoreFiles(files) {
        try {
            state.students = [];
            state.subjects = [];
            state.thresholds = {};
            state.subjectSourceHints = {};
            state.importStats = { duplicateStudents: 0, duplicateConflicts: [] };
            for (const file of files) {
                const buffer = await file.arrayBuffer();
                const workbook = XLSX.read(buffer, { type: 'array' });
                workbook.SheetNames.forEach((sheetName) => {
                    const rows = worksheetToRows(workbook.Sheets[sheetName]);
                    parseScoreRows(rows, sheetName);
                });
            }
            state.subjects = sortSubjects([...new Set(state.subjects)]);
            mergeDuplicateStudents();
            ensureActiveSchool();
            analyze();
            log(`成绩导入完成：${state.students.length} 名学生，${getAnalysisStudents().length} 名进入当前年级分析，${getClasses().length} 个班级，${getAnalysisSubjects().length} 个学科${state.importStats.duplicateStudents ? `，合并重复 ${state.importStats.duplicateStudents} 条` : ''}${state.importStats.duplicateConflicts.length ? `，发现冲突 ${state.importStats.duplicateConflicts.length} 项` : ''}。`);
            toast('成绩解析完成。', 'ok');
            renderAll();
        } catch (error) {
            console.error(error);
            toast(`成绩解析失败：${error.message}`, 'warn');
        }
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

    function parseScoreRows(rows, defaultSchool) {
        if (!Array.isArray(rows) || rows.length < 2) return;
        const headerIndex = findHeaderRow(rows);
        if (headerIndex === -1) return;
        const headers = rows[headerIndex].map((cell) => cleanHeader(cell));
        const idx = {
            name: findBestHeader(headers, NAME_ALIASES),
            id: findBestHeader(headers, ID_ALIASES),
            className: findBestHeader(headers, CLASS_ALIASES),
            school: findBestHeader(headers, SCHOOL_ALIASES),
            subjects: buildSubjectColumns(headers)
        };

        Object.keys(idx.subjects).forEach((subject) => {
            if (!state.subjects.includes(subject)) state.subjects.push(subject);
        });

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
                cells.forEach(({ index: columnIndex, value: cellValue }) => {
                    if (!isBlankScoreCell(cellValue)) allBlank = false;
                    if (isAbsentScoreCell(cellValue)) hasAbsent = true;
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

    function parseTeacherRows(rows) {
        if (!Array.isArray(rows) || rows.length < 2) return [];
        const headerIndex = findTeacherHeaderRow(rows);
        if (headerIndex === -1) return [];
        const headers = rows[headerIndex].map((cell) => cleanHeader(cell));
        const classIndex = findBestHeader(headers, CLASS_ALIASES);
        const subjectIndex = findBestHeader(headers, ['学科', '科目', '课程', 'subject']);
        const teacherIndex = findBestHeader(headers, TEACHER_ALIASES);
        if (classIndex === -1) return [];
        if (subjectIndex === -1 || teacherIndex === -1) {
            return parseWideTeacherRows(rows, headerIndex, headers, classIndex);
        }
        const result = [];
        for (let rowIndex = headerIndex + 1; rowIndex < rows.length; rowIndex += 1) {
            const row = rows[rowIndex] || [];
            const className = normalizeClass(row[classIndex]);
            const subject = normalizeSubject(row[subjectIndex]);
            const teacher = cleanText(row[teacherIndex]);
            if (!className || !subject || !teacher) continue;
            result.push({ className, subject, teacher });
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
                splitTeacherCell(row[index]).forEach((teacher) => {
                    result.push({ className, subject, teacher });
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
            .map((item) => cleanText(item))
            .filter(Boolean);
    }

    function analyze() {
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
        rows.forEach((row) => {
            row.rateScore = scoreFromMax(row.metrics.total, max, weights);
            row.absoluteScore = achievementScore(row.metrics.total, getTotalMaxScore());
            row.balanceScore = calculateClassBalanceScore(row);
            const lowPenalty = clamp(row.metrics.total.lowRate * 18, 0, 10);
            row.qualityScore = round(clamp(row.rateScore * 0.46 + row.absoluteScore * 0.40 + row.balanceScore * 0.14 - lowPenalty, 0, 100), 2);
        });
        assignRanks(rows, (row) => row.qualityScore, (row, rank) => {
            row.rank = rank;
        });
        state.classRows = rows.sort((a, b) => a.rank - b.rank || naturalCompare(a.className, b.className));
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

    function buildTeacherRows() {
        state.teacherRows = [];
        state.finalTeacherRows = [];
        const teacherStatus = { ok: false, text: '等待任课表' };
        const analysisStudents = getAnalysisStudents();
        if (!analysisStudents.length || !state.teachers.length) {
            state.teacherCoverage = { matched: 0, unmatched: [] };
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
            const key = `${assignment.teacher}__${assignment.subject}`;
            if (!teacherSubjectGroups.has(key)) {
                teacherSubjectGroups.set(key, {
                    teacher: assignment.teacher,
                    subject: assignment.subject,
                    assignedClasses: new Set(),
                    matchedClasses: new Set(),
                    students: []
                });
            }
            const group = teacherSubjectGroups.get(key);
            group.assignedClasses.add(assignment.className);
            const classStudents = studentByClass.get(assignment.className) || [];
            const matchedStudents = classStudents.filter((student) => Number.isFinite(Number(student.scores[assignment.subject])));
            if (!classStudents.length || !matchedStudents.length) {
                unmatchedAssignments.push({
                    ...assignment,
                    reason: !classStudents.length ? '班级未匹配' : '该班无本学科成绩'
                });
            } else {
                group.matchedClasses.add(assignment.className);
            }
            matchedStudents.forEach((student) => group.students.push(student));
        });
        state.teacherCoverage = {
            matched: assignments.length - unmatchedAssignments.length,
            unmatched: unmatchedAssignments
        };

        teacherSubjectGroups.forEach((group) => {
            const uniqueStudents = uniqueBy(group.students, (student) => `${student.className}__${student.name}__${student.id}`);
            if (!uniqueStudents.length) return;
            const thresholds = state.thresholds[group.subject] || { exc: 0, pass: 0, low: 0 };
            const scores = uniqueStudents.map((student) => student.scores[group.subject]);
            const summary = metricSummary(scores, thresholds, getSubjectMaxScore(group.subject));
            const residual = buildSubjectResidual(group.subject, uniqueStudents);
            const row = {
                teacher: group.teacher,
                subject: group.subject,
                classes: Array.from(group.matchedClasses).sort(naturalCompare),
                studentCount: summary.count,
                avg: summary.avg,
                excRate: summary.excRate,
                passRate: summary.passRate,
                paperPassRate: summary.paperPassRate,
                lowRate: summary.lowRate,
                baselineAdjustment: residual.adjustment,
                residualAvg: residual.avgResidual,
                workloadAdjustment: 0,
                confidence: 1,
                leagueScore: 0,
                fairScore: 0,
                subjectRank: 0,
                relativeScore: 80,
                finalUnitScore: 0
            };
            if (!bySubject.has(row.subject)) bySubject.set(row.subject, []);
            bySubject.get(row.subject).push(row);
        });

        const weights = currentConfig().weights;
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
                row.fairScore = clamp(row.leagueScore * row.confidence + row.baselineAdjustment + row.workloadAdjustment - lowPenalty, 0, 100);
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
                row.finalUnitScore = row.fairScore * 0.88 + row.relativeScore * 0.12;
            });
        });

        state.teacherRows = Array.from(teacherSubjectGroups.values()).flatMap((group) => {
            const rows = bySubject.get(group.subject) || [];
            return rows.filter((row) => row.teacher === group.teacher && row.subject === group.subject);
        }).sort((a, b) => sortBySubjectRank(a, b));

        const byTeacher = new Map();
        state.teacherRows.forEach((row) => {
            if (!byTeacher.has(row.teacher)) {
                byTeacher.set(row.teacher, { teacher: row.teacher, subjects: [], totalWeight: 0, overallScore: 0, totalStudents: 0, rank: 0 });
            }
            const item = byTeacher.get(row.teacher);
            const weight = Math.max(row.studentCount, 1) * row.confidence;
            item.subjects.push(row);
            item.totalWeight += weight;
            item.overallScore += row.finalUnitScore * weight;
            item.totalStudents += row.studentCount;
        });
        const finalRows = Array.from(byTeacher.values()).map((row) => ({
            ...row,
            overallScore: row.totalWeight ? row.overallScore / row.totalWeight : 0,
            subjectText: row.subjects.map((item) => `${item.subject}(${item.classes.join(',')})`).join('；')
        }));
        assignRanks(finalRows, (row) => row.overallScore, (row, rank) => {
            row.rank = rank;
        });
        state.finalTeacherRows = finalRows.sort((a, b) => a.rank - b.rank || naturalCompare(a.teacher, b.teacher));

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

    function buildStudentAlerts() {
        const analysisStudents = getAnalysisStudents();
        const subjects = getAnalysisSubjects();
        const totalCount = analysisStudents.length || 1;
        const edgeRows = [];
        const biasRows = [];
        analysisStudents.forEach((student) => {
            subjects.forEach((subject) => {
                const score = Number(student.scores[subject]);
                if (!Number.isFinite(score)) return;
                const line = state.thresholds[subject] || {};
                if (score < line.exc && score >= line.exc - 5) {
                    edgeRows.push({ type: '优秀临界', student, subject, score, gap: round(line.exc - score, 1) });
                } else if (score < line.pass && score >= line.pass - 5) {
                    edgeRows.push({ type: '达标临界', student, subject, score, gap: round(line.pass - score, 1) });
                }
                const totalRank = student.ranks?.total?.grade || totalCount;
                const subjectRank = student.ranks?.[subject]?.grade || totalCount;
                if (totalRank <= totalCount * 0.4 && subjectRank >= totalCount * 0.6) {
                    biasRows.push({ type: '偏科提醒', student, subject, score, gap: subjectRank });
                }
            });
        });
        state.studentAlerts = [
            ...edgeRows.sort((a, b) => a.gap - b.gap).slice(0, 12),
            ...biasRows.sort((a, b) => b.gap - a.gap).slice(0, 12)
        ];
    }

    function renderAll() {
        renderShell();
        renderMetrics();
        renderCharts();
        renderInsights();
        renderImportLog();
        renderScoreRules();
        renderClassTable();
        renderSubjectMatrix();
        renderTeacherTables();
        renderPairing();
        renderStudentFilters();
        renderStudentTable();
        renderStudentAlerts();
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
    }

    function renderInsights() {
        const analysisStudents = getAnalysisStudents();
        const missingTeacher = analysisStudents.length && !state.teachers.length;
        const totalSubjects = getTotalSubjects();
        const extraSingleSubjects = getAnalysisSubjects().filter((subject) => !totalSubjects.includes(subject));
        const gradeScope = getGradeScopeStats();
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
                ? { title: '班级关注', body: `${weakClass.className} 综合分 ${weakClass.qualityScore.toFixed(1)}，可优先看学科矩阵。` }
                : { title: '班级关注', body: '导入成绩后自动生成班级站位。' },
            topSubject
                ? { title: '学科状态', body: `${topSubject.subject} 得分率 ${(topSubject.scoreRate * 100).toFixed(1)}%，样本 ${topSubject.count} 人。` }
                : { title: '学科状态', body: '导入成绩后自动生成各科均分与两率。' },
            state.studentAlerts.length
                ? { title: '学生名单', body: `已筛出 ${state.studentAlerts.length} 条临界或偏科提醒。` }
                : { title: '学生名单', body: '当前暂无临界或偏科提醒。' },
            state.finalTeacherRows.length
                ? { title: '教师总榜', body: `第 1 名：${state.finalTeacherRows[0].teacher}，最终分 ${state.finalTeacherRows[0].overallScore.toFixed(1)}。` }
                : { title: '教师总榜', body: '导入任课表后生成同学科校正排名。' },
            state.teacherCoverage.unmatched.length
                ? { title: '任课表提醒', body: `${state.teacherCoverage.unmatched.length} 条任课没有匹配到当前学校班级或学科成绩。` }
                : { title: '任课表匹配', body: state.teachers.length ? '任课表已和当前学校班级成绩对应。' : '等待导入任课表。' }
        ];
        els.insightGrid.innerHTML = items.map((item) => insightCard(item.title, item.body)).join('');
    }

    function renderImportLog() {
        els.importLog.textContent = state.logs.length ? state.logs.slice(-8).join('\n') : '暂无导入记录。';
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
                        <td>${getSubjectMaxScore(subject)}</td>
                        <td>${formatScore(rule.observedMax, 1)}</td>
                        <td>
                            <input class="score-rule-input" type="number" min="1" step="0.1" placeholder="自动" value="${escapeAttr(inputValue)}" data-source-max-subject="${escapeAttr(subject)}">
                        </td>
                        <td>${Number.isFinite(Number(rule.scale)) ? Number(rule.scale).toFixed(4) : '-'}</td>
                        <td>${totalIncluded ? '计入总分' : '单科诊断'}</td>
                    </tr>
                `;
            }).join('')
            : emptyRow(6);
    }

    function renderClassTable() {
        const table = els.classTable;
        table.querySelector('thead').innerHTML = `
            <tr>
                <th>排名</th><th>班级</th><th>人数</th><th>总分有效</th><th>总分均分</th><th>优秀率</th><th>达标率(前50%)</th><th>卷面及格率</th><th>低分率</th><th>学科均衡</th><th>综合分</th>
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
                    <td>${row.balanceScore.toFixed(1)}</td>
                    <td><strong>${row.qualityScore.toFixed(1)}</strong></td>
                </tr>
            `).join('')
            : emptyRow(11);
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

    function renderTeacherTables() {
        renderTeacherFinalTable();
        renderTeacherDetailTable();
    }

    function renderTeacherFinalTable() {
        const table = els.teacherFinalTable;
        table.querySelector('thead').innerHTML = `
            <tr>
                <th>最终排名</th><th>教师</th><th>最终分</th><th>任教学科 / 班级</th><th>覆盖学生</th><th>学科质量分</th>
            </tr>
        `;
        table.querySelector('tbody').innerHTML = state.finalTeacherRows.length
            ? state.finalTeacherRows.map((row) => `
                <tr>
                    <td>${rankBadge(row.rank)}</td>
                    <td><strong>${escapeHtml(row.teacher)}</strong></td>
                    <td>${row.overallScore.toFixed(1)}</td>
                    <td>${escapeHtml(row.subjectText)}</td>
                    <td>${row.totalStudents}</td>
                    <td>${row.subjects.map((item) => `${escapeHtml(item.subject)} ${item.fairScore.toFixed(1)} / 科内${item.subjectRank}`).join('<br>')}</td>
                </tr>
            `).join('')
            : emptyRow(6);
    }

    function renderTeacherDetailTable() {
        const table = els.teacherDetailTable;
        table.querySelector('thead').innerHTML = `
            <tr>
                <th>学科排名</th><th>教师</th><th>学科</th><th>班级</th><th>人数</th><th>均分</th><th>优秀率</th><th>达标率(前50%)</th><th>卷面及格率</th><th>基础校正</th><th>置信系数</th><th>质量分</th>
            </tr>
        `;
        table.querySelector('tbody').innerHTML = state.teacherRows.length
            ? state.teacherRows.map((row) => `
                <tr>
                    <td>${rankBadge(row.subjectRank)}</td>
                    <td>${escapeHtml(row.teacher)}</td>
                    <td>${escapeHtml(row.subject)}</td>
                    <td>${escapeHtml(row.classes.join('、'))}</td>
                    <td>${row.studentCount}</td>
                    <td>${formatScore(row.avg, 2)}</td>
                    <td>${percent(row.excRate)}</td>
                    <td>${percent(row.passRate)}</td>
                    <td>${formatNullablePercent(row.paperPassRate)}</td>
                    <td>${signed(row.baselineAdjustment)}</td>
                    <td>${row.confidence.toFixed(2)}</td>
                    <td><strong>${row.fairScore.toFixed(1)}</strong></td>
                </tr>
            `).join('')
            : emptyRow(12);
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
                <th>年级排名</th><th>班级排名</th><th>班级</th><th>姓名</th><th>考号</th><th>${escapeHtml(subject === 'total' ? currentConfig().totalLabel : subject)}</th><th>总分</th>
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
                    </tr>
                `;
            }).join('')
            : emptyRow(7);
    }

    function renderStudentAlerts() {
        els.studentAlertGrid.innerHTML = state.studentAlerts.length
            ? state.studentAlerts.slice(0, 12).map((item) => insightCard(
                `${item.type} · ${item.subject}`,
                `${item.student.className} ${item.student.name}：${item.score.toFixed(1)} 分，${item.type === '偏科提醒' ? `单科年级第 ${item.gap} 名` : `差 ${item.gap} 分`}`
            )).join('')
            : insightCard('暂无名单', '导入成绩后自动筛选临界生和偏科学生。');
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
        const rows = [['班级', '学科', '教师姓名']];
        ['01', '02'].forEach((classNo, classIndex) => {
            subjects.forEach((subject, subjectIndex) => {
                rows.push([`${state.grade}${classNo}`, subject, `${subject}教师${classIndex + subjectIndex + 1}`]);
            });
        });
        writeWorkbook('教师任课信息_导入模板.xlsx', [{ name: '任课表', rows }]);
    }

    function exportWorkbook() {
        const analysisStudents = getAnalysisStudents();
        if (!analysisStudents.length) return toast('暂无可导出的成绩数据。', 'warn');
        const sheets = [
            {
                name: '班级总览',
                rows: [
                    ['排名', '班级', '人数', '总分有效人数', '总分均分', '优秀率', '达标率(前50%)', '卷面及格率', '低分率', '相对两率一分', '绝对达成分', '学科均衡', '综合分'],
                    ...state.classRows.map((row) => [row.rank, row.className, row.studentCount, row.completeTotalCount, round(row.metrics.total.avg, 2), row.metrics.total.excRate, row.metrics.total.passRate, row.metrics.total.paperPassRate, row.metrics.total.lowRate, round(row.rateScore, 2), round(row.absoluteScore, 2), round(row.balanceScore, 2), row.qualityScore])
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
                name: '成绩折算',
                rows: [
                    ['学科', '配置满分', '导入最高分', '原始满分', '折算系数', '处理'],
                    ...getScoreAdjustmentRows()
                ]
            },
            {
                name: '教师最终排名',
                rows: [
                    ['最终排名', '教师', '最终分', '覆盖学生', '任教学科/班级'],
                    ...state.finalTeacherRows.map((row) => [row.rank, row.teacher, round(row.overallScore, 2), row.totalStudents, row.subjectText])
                ]
            },
            {
                name: '教师学科明细',
                rows: [
                    ['学科排名', '教师', '学科', '班级', '人数', '均分', '优秀率', '达标率(前50%)', '卷面及格率', '低分率', '相对两率一分', '绝对达成分', '两率一分综合', '基础校正', '工作量修正', '置信系数', '质量分'],
                    ...state.teacherRows.map((row) => [row.subjectRank, row.teacher, row.subject, row.classes.join('、'), row.studentCount, round(row.avg, 2), row.excRate, row.passRate, row.paperPassRate, row.lowRate, round(row.relativeLeagueScore, 2), round(row.absoluteScore, 2), round(row.leagueScore, 2), round(row.baselineAdjustment, 2), round(row.workloadAdjustment, 2), round(row.confidence, 3), round(row.fairScore, 2)])
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
                    ['成绩折算', getScoreAdjustmentSummary() || '按“原始满分→配置满分”的口径折算；未配置原始满分的科目在未超过配置满分时按原分，超出时自动推断并封顶。'],
                    ['重复导入', state.importStats.duplicateStudents ? `已合并 ${state.importStats.duplicateStudents} 条重复学生记录；${state.importStats.duplicateConflicts.length} 项分数冲突采用后导入值。` : '未发现重复学生记录。'],
                    ['优秀线', state.grade === 9 ? '本年级前 15%' : '本年级前 20%'],
                    ['达标线', '本年级前 50%，另列卷面及格率=满分60%'],
                    ['两率一分权重', `${currentConfig().weights.avg}/${currentConfig().weights.exc}/${currentConfig().weights.pass}`],
                    ['班级综合分', '相对两率一分 + 绝对达成分 + 学科均衡，并对低分率做小幅扣分；总分缺科学生不参与总分均分和总分排名。'],
                    ['教师最终排名', '同学科内比较为主，同时加入满分得分率的绝对达成分；基础校正、样本置信、工作量和低分率修正后，再以质量分为主、学科内百分位为辅汇总。']
                ]
            }
        ];
        writeWorkbook(`校内成绩分析_${currentConfig().label}_${dateStamp()}.xlsx`, sheets);
    }

    function exportStudentRanksWorkbook() {
        if (!getAnalysisStudents().length) return toast('暂无学生排名可导出。', 'warn');
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

    function writeWorkbook(filename, sheets) {
        const workbook = XLSX.utils.book_new();
        sheets.forEach((sheet) => {
            const ws = XLSX.utils.aoa_to_sheet(sheet.rows);
            ws['!cols'] = (sheet.rows[0] || []).map(() => ({ wch: 16 }));
            XLSX.utils.book_append_sheet(workbook, ws, sheet.name.slice(0, 31));
        });
        XLSX.writeFile(workbook, filename);
    }

    function saveLocal() {
        localStorage.setItem(LOCAL_KEY, JSON.stringify({
            grade: state.grade,
            activeSchool: state.activeSchool,
            students: state.students,
            subjects: state.subjects,
            teachers: state.teachers,
            blankScoreMode: state.blankScoreMode,
            sourceMaxOverrides: state.sourceMaxOverrides,
            subjectSourceHints: state.subjectSourceHints,
            importStats: state.importStats,
            logs: state.logs
        }));
        toast('已保存到本机浏览器。', 'ok');
    }

    function restoreLocal() {
        const raw = localStorage.getItem(LOCAL_KEY);
        if (!raw) return toast('没有找到本地保存。', 'warn');
        try {
            const data = JSON.parse(raw);
            state.grade = Number(data.grade || 9);
            state.activeSchool = cleanText(data.activeSchool || '');
            state.students = Array.isArray(data.students) ? data.students : [];
            state.subjects = sortSubjects(Array.isArray(data.subjects) ? data.subjects : []);
            state.teachers = Array.isArray(data.teachers) ? data.teachers : [];
            state.blankScoreMode = ['zero', 'exclude', 'absent'].includes(data.blankScoreMode) ? data.blankScoreMode : 'zero';
            state.sourceMaxOverrides = data.sourceMaxOverrides && typeof data.sourceMaxOverrides === 'object' ? data.sourceMaxOverrides : {};
            state.subjectSourceHints = data.subjectSourceHints && typeof data.subjectSourceHints === 'object' ? data.subjectSourceHints : {};
            state.importStats = data.importStats && typeof data.importStats === 'object' ? {
                duplicateStudents: Number(data.importStats.duplicateStudents || 0),
                duplicateConflicts: Array.isArray(data.importStats.duplicateConflicts) ? data.importStats.duplicateConflicts : []
            } : { duplicateStudents: 0, duplicateConflicts: [] };
            state.logs = Array.isArray(data.logs) ? data.logs : [];
            ensureActiveSchool();
            document.querySelectorAll('#grade-segment button').forEach((button) => {
                button.classList.toggle('active', Number(button.dataset.grade) === state.grade);
            });
            analyze();
            log('已恢复本地保存数据。');
            renderAll();
            toast('本地数据已恢复。', 'ok');
        } catch (error) {
            toast(`恢复失败：${error.message}`, 'warn');
        }
    }

    function clearData() {
        state.students = [];
        state.activeSchool = '';
        state.subjects = [];
        state.thresholds = {};
        state.subjectSourceHints = {};
        state.importStats = { duplicateStudents: 0, duplicateConflicts: [] };
        state.teachers = [];
        state.classRows = [];
        state.subjectRows = [];
        state.teacherRows = [];
        state.finalTeacherRows = [];
        state.studentAlerts = [];
        state.scoreAdjustments = {};
        state.teacherCoverage = { matched: 0, unmatched: [] };
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
            teacher: `${subject}${['张', '李', '王', '赵', '孙', '周'][(classIndex + subjectIndex) % 6]}老师`
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
        const config = currentConfig();
        if (state.grade === 9) return CORE_GRADE9.slice();
        return (config.templateSubjects || [])
            .filter((subject) => Object.prototype.hasOwnProperty.call(config.maxScores || {}, subject));
    }

    function getSubjectMaxScore(subject) {
        const config = currentConfig();
        return Number(config.maxScores?.[subject] || 100);
    }

    function getTotalMaxScore() {
        const subjects = getTotalSubjects();
        if (!subjects.length) return 0;
        return subjects.reduce((sum, subject) => sum + getSubjectMaxScore(subject), 0);
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
        return sortSubjects([...new Set([...(config.templateSubjects || []), ...getAnalysisSubjects()])]);
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
        return uniqueBy(list, (item) => `${item.className}__${item.subject}__${item.teacher}`)
            .sort((a, b) => {
                const classOrder = naturalCompare(a.className, b.className);
                if (classOrder) return classOrder;
                const subjectOrder = sortSubjects([a.subject, b.subject]);
                if (a.subject !== b.subject) return subjectOrder[0] === a.subject ? -1 : 1;
                return naturalCompare(a.teacher, b.teacher);
            });
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

    function rankBadge(rank) {
        const value = String(rank || '-');
        const num = Number(rank);
        const tone = Number.isFinite(num) && num <= 3 ? 'top' : '';
        return `<span class="rank-badge ${tone}">${escapeHtml(value)}</span>`;
    }

    function emptyRow(count) {
        return `<tr><td colspan="${count}" class="empty">暂无数据</td></tr>`;
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

    function round(value, digits = 2) {
        const factor = 10 ** digits;
        return Math.round((Number(value) || 0) * factor) / factor;
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
        normalizeClass,
        normalizeScoresForCurrentGrade,
        mergeDuplicateStudents,
        fillMergedRows,
        parseTeacherRows,
        parseScoreRows,
        buildSubjectColumns,
        buildStudentRankRows,
        achievementScore,
        formatExportScore,
        exportWorkbook
    };
})();
