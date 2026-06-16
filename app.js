(() => {
    "use strict";

    const cfg = window.ISS_MOBILE_CONFIG || {};

    if (!window.supabase || !cfg.supabaseUrl || !cfg.supabaseAnonKey) {
        document.body.innerHTML = `
            <main class="login-view">
                <section class="login-card">
                    <h1>ISS Mobile setup needed</h1>
                    <p class="message">Supabase configuration is missing. Check config.js before publishing this site.</p>
                </section>
            </main>`;
        return;
    }

    const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);

    const $ = (id) => document.getElementById(id);

    const els = {
        loginView: $("loginView"),
        appShell: $("appShell"),
        loginForm: $("loginForm"),
        emailInput: $("emailInput"),
        passwordInput: $("passwordInput"),
        loginBtn: $("loginBtn"),
        loginMessage: $("loginMessage"),
        logoutBtn: $("logoutBtn"),
        menuBtn: $("menuBtn"),
        sidebar: $("sidebar"),
        drawerOverlay: $("drawerOverlay"),
        pageTitle: $("pageTitle"),
        pageSubtitle: $("pageSubtitle"),
        connectionStatus: $("connectionStatus"),
        userRoleText: $("userRoleText"),
        dashboardPage: $("dashboardPage"),
        loadsPage: $("loadsPage"),
        gradePage: $("gradePage"),
        correctionsPage: $("correctionsPage"),
        dashboardName: $("dashboardName"),
        dashboardEmail: $("dashboardEmail"),
        statSchoolYear: $("statSchoolYear"),
        statPeriod: $("statPeriod"),
        statLoads: $("statLoads"),
        statCorrections: $("statCorrections"),
        dashboardMessage: $("dashboardMessage"),
        dashboardLoads: $("dashboardLoads"),
        dashboardRefreshBtn: $("dashboardRefreshBtn"),
        loadsMessage: $("loadsMessage"),
        loadsGrid: $("loadsGrid"),
        loadsRefreshBtn: $("loadsRefreshBtn"),
        downloadMyLoadsCsvBtn: $("downloadMyLoadsCsvBtn"),
        gradeTitle: $("gradeTitle"),
        gradeSubtitle: $("gradeSubtitle"),
        gradeTableBody: $("gradeTableBody"),
        gradeCardList: $("gradeCardList"),
        gradeMessage: $("gradeMessage"),
        studentSearchInput: $("studentSearchInput"),
        missingOnlyInput: $("missingOnlyInput"),
        changeCountText: $("changeCountText"),
        saveGradesBtn: $("saveGradesBtn"),
        backToLoadsBtn: $("backToLoadsBtn"),
        refreshGradesBtn: $("refreshGradesBtn"),
        downloadCurrentLoadCsvBtn: $("downloadCurrentLoadCsvBtn"),
        studentGradeModal: $("studentGradeModal"),
        closeStudentGradeBtn: $("closeStudentGradeBtn"),
        cancelStudentGradeBtn: $("cancelStudentGradeBtn"),
        saveStudentGradeBtn: $("saveStudentGradeBtn"),
        studentGradeTitle: $("studentGradeTitle"),
        studentGradeSubtitle: $("studentGradeSubtitle"),
        studentGradeNameText: $("studentGradeNameText"),
        studentGradeSectionText: $("studentGradeSectionText"),
        studentGradeSubjectText: $("studentGradeSubjectText"),
        studentGradeFields: $("studentGradeFields"),
        studentGradeModalMessage: $("studentGradeModalMessage"),
        correctionBadge: $("correctionBadge"),
        correctionMessage: $("correctionMessage"),
        correctionsRefreshBtn: $("correctionsRefreshBtn"),
        correctionStatusFilter: $("correctionStatusFilter"),
        correctionPeriodFilter: $("correctionPeriodFilter"),
        correctionList: $("correctionList"),
        pendingCountText: $("pendingCountText"),
        approvedCountText: $("approvedCountText"),
        rejectedCountText: $("rejectedCountText"),
        cancelledCountText: $("cancelledCountText"),
        requestCorrectionModal: $("requestCorrectionModal"),
        closeRequestCorrectionBtn: $("closeRequestCorrectionBtn"),
        cancelRequestCorrectionBtn: $("cancelRequestCorrectionBtn"),
        submitRequestCorrectionBtn: $("submitRequestCorrectionBtn"),
        requestCorrectionSubtitle: $("requestCorrectionSubtitle"),
        requestStudentText: $("requestStudentText"),
        requestSubjectText: $("requestSubjectText"),
        requestPeriodText: $("requestPeriodText"),
        requestedGradeInput: $("requestedGradeInput"),
        requestReasonInput: $("requestReasonInput"),
        requestCorrectionMessage: $("requestCorrectionMessage"),
        reviewCorrectionModal: $("reviewCorrectionModal"),
        closeReviewCorrectionBtn: $("closeReviewCorrectionBtn"),
        cancelReviewCorrectionBtn: $("cancelReviewCorrectionBtn"),
        confirmReviewCorrectionBtn: $("confirmReviewCorrectionBtn"),
        reviewCorrectionTitle: $("reviewCorrectionTitle"),
        reviewCorrectionSubtitle: $("reviewCorrectionSubtitle"),
        reviewStudentText: $("reviewStudentText"),
        reviewSubjectText: $("reviewSubjectText"),
        reviewChangeText: $("reviewChangeText"),
        reviewNotesInput: $("reviewNotesInput"),
        reviewCorrectionMessage: $("reviewCorrectionMessage")
    };

    const state = {
        user: null,
        context: null,
        settings: null,
        loads: [],
        selectedLoad: null,
        gradeRows: [],
        corrections: [],
        pendingCorrectionCount: 0,
        selectedCorrectionRequest: null,
        selectedCorrectionAction: "",
        selectedGradeCorrection: null,
        selectedStudentGradeRow: null,
        connection: {
            browserOnline: window.navigator.onLine !== false,
            supabaseReachable: false,
            checking: false,
            timer: null
        }
    };

    function getViewMode() {
        const width = window.innerWidth || document.documentElement.clientWidth || 0;
        const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
        if (width >= 1024 && finePointer) return "desktop";
        if (width >= 720) return "tablet";
        return "mobile";
    }

    function applyViewMode() {
        const mode = getViewMode();
        const previous = document.body.dataset.viewMode || "";
        document.body.dataset.viewMode = mode;
        document.body.classList.toggle("desktop-mode", mode === "desktop");
        document.body.classList.toggle("touch-mode", mode !== "desktop");
        return previous !== mode;
    }

    function isDesktopGradeView() {
        return (document.body.dataset.viewMode || getViewMode()) === "desktop";
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function roleLabels() {
        const ctx = state.context;
        if (!ctx) return ["Teacher"];

        const labels = [];
        if (ctx.is_subject_teacher) labels.push("Subject Teacher");
        if (ctx.is_adviser) labels.push("Adviser");
        if (ctx.is_registrar) labels.push("Registrar");
        if (ctx.is_coordinator) labels.push("Coordinator");
        if (ctx.is_school_head) labels.push("School Head");
        if (ctx.is_system_admin) labels.push("System Admin");
        return labels.length ? labels : ["User"];
    }

    function printableReportName(value) {
        return String(value || "")
            .replace(/\s+/g, " ")
            .trim()
            .toUpperCase();
    }

    function fullName(row) {
        return [row?.last_name, row?.first_name, row?.middle_name, row?.suffix]
            .filter(Boolean)
            .join(" ");
    }

    function printableGradeSheetStudentName(row) {
        const lastName = printableReportName(row?.last_name);
        const firstName = printableReportName(row?.first_name);
        const suffix = printableReportName(row?.suffix);
        const middleName = printableReportName(row?.middle_name);
        const givenName = [firstName, suffix, middleName].filter(Boolean).join(" ");
        return lastName && givenName ? `${lastName}, ${givenName}` : (lastName || givenName || printableReportName(fullName(row)));
    }

    function genderRank(gender) {
        const value = String(gender || "").trim().toLowerCase();
        if (value === "m" || value === "male") return 1;
        if (value === "f" || value === "female") return 2;
        return 3;
    }

    function sortStudentsByGenderThenName(rows) {
        return [...rows].sort((a, b) => {
            const genderCompare = genderRank(a.gender) - genderRank(b.gender);
            if (genderCompare !== 0) return genderCompare;

            const lastCompare = String(a.last_name || "").localeCompare(String(b.last_name || ""));
            if (lastCompare !== 0) return lastCompare;

            const firstCompare = String(a.first_name || "").localeCompare(String(b.first_name || ""));
            if (firstCompare !== 0) return firstCompare;

            return String(a.middle_name || "").localeCompare(String(b.middle_name || ""));
        });
    }

    function normalizeGradingSystem(value) {
        const normalized = String(value || "").trim().toLowerCase();
        return normalized === "trimester" ? "Trimester" : "Quarterly";
    }

    function currentDisplayGradingSystem() {
        return normalizeGradingSystem(
            state.settings?.default_grading_system ||
            state.settings?.grading_system ||
            state.settings?.current_grading_system ||
            "Quarterly"
        );
    }

    function gradingSystemForLoad(load = state.selectedLoad) {
        return normalizeGradingSystem(
            load?.grading_system ||
            state.settings?.default_grading_system ||
            state.settings?.grading_system ||
            state.settings?.current_grading_system ||
            "Quarterly"
        );
    }

    function displayPeriodsForLoad(load = state.selectedLoad) {
        return gradingSystemForLoad(load) === "Trimester" ? [1, 2, 3] : [1, 2, 3, 4];
    }

    function displayActiveQuarterForLoad(value, load = state.selectedLoad) {
        const quarter = Number(value || 1);
        if (gradingSystemForLoad(load) === "Trimester" && quarter >= 4) return 3;
        return Math.min(Math.max(quarter, 1), 4);
    }

    function periodLabel(quarter, gradingSystem = currentDisplayGradingSystem()) {
        const value = Number(quarter || 1);
        const normalized = normalizeGradingSystem(gradingSystem);

        if (normalized === "Trimester") {
            if (value === 1) return "T1";
            if (value === 2) return "T2";
            return "T3";
        }

        if (value === 1) return "Q1";
        if (value === 2) return "Q2";
        if (value === 3) return "Q3";
        return "Q4";
    }

    function gradeValue(row, quarter) {
        return row?.[`q${quarter}_grade`];
    }

    function gradeValueAsText(value) {
        return value === null || value === undefined ? "" : String(value);
    }

    function isTrimesterLoad(load = state.selectedLoad) {
        return gradingSystemForLoad(load) === "Trimester";
    }

    function isGradeEncodingOpen() {
        return state.settings?.grade_encoding_open !== false && state.selectedLoad?.grade_encoding_open !== false;
    }

    function gradeEncodingClosedNotice() {
        return "Grade encoding is currently closed in Settings. You may still view grades, but encoding and saving changes are disabled.";
    }

    function isSystemLocked() {
        return state.settings?.system_locked === true;
    }

    function systemLockedNotice() {
        const customMessage = String(state.settings?.system_lock_message || "").trim();
        return customMessage
            ? `System is locked. ${customMessage}`
            : "System is currently locked in Settings. Viewing and exports remain available, but changes cannot be saved.";
    }

    function isConnectionAvailable() {
        return state.connection.browserOnline === true && state.connection.supabaseReachable === true;
    }

    function connectionUnavailableNotice() {
        if (state.connection.browserOnline === false) return "This device appears to be offline. Saving changes is disabled.";
        if (state.connection.supabaseReachable === false) return "ISS cannot connect to Supabase right now. Saving changes is disabled.";
        return "Connection status is not ready yet.";
    }

    function blockIfWriteUnavailable(messageElement) {
        if (!isConnectionAvailable()) {
            messageElement.textContent = connectionUnavailableNotice();
            return true;
        }

        if (isSystemLocked()) {
            messageElement.textContent = systemLockedNotice();
            return true;
        }

        return false;
    }

    function canEditQuarter(row, quarter, activeQuarter) {
        const existingValue = gradeValue(row, quarter);

        if (!isGradeEncodingOpen() || isSystemLocked()) return false;
        if (isTrimesterLoad() && quarter === 4) return false;
        if (quarter > activeQuarter) return false;
        if (quarter === activeQuarter) return true;
        if (quarter < activeQuarter && (existingValue === null || existingValue === "")) return true;
        return false;
    }

    function canReviewGradeCorrections() {
        const ctx = state.context;
        return Boolean(ctx?.is_system_admin || ctx?.is_registrar || ctx?.is_coordinator || ctx?.is_school_head);
    }

    function canRequestGradeCorrection(row, quarter, editable, textValue) {
        const ctx = state.context;
        if (!isConnectionAvailable() || !isGradeEncodingOpen() || isSystemLocked()) return false;
        if (!row || !quarter || editable) return false;
        if (textValue === "") return false;
        if (row[`q${quarter}_visible`] === false) return false;
        if (row[`q${quarter}_can_encode`] === false) return false;
        return Boolean(ctx?.is_subject_teacher || ctx?.is_system_admin || ctx?.is_registrar || ctx?.is_coordinator);
    }

    function formatTimestamp(value) {
        if (!value) return "";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);
        return date.toLocaleString("en-PH", {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "numeric",
            minute: "2-digit"
        });
    }

    function statusBadge(status) {
        const value = String(status || "Pending");
        return `<span class="status-badge ${escapeHtml(value.toLowerCase())}">${escapeHtml(value)}</span>`;
    }

    function setPage(page) {
        const pageMap = {
            dashboard: [els.dashboardPage, "Dashboard", "Mobile grade encoding companion"],
            loads: [els.loadsPage, "My Loads", "Open a load to encode grades"],
            grade: [els.gradePage, "Grade Encoding", "Encode the selected class and subject"],
            corrections: [els.correctionsPage, "Grade Correction", "Request, review, and track grade corrections"]
        };

        Object.values(pageMap).forEach(([section]) => section.classList.add("hidden"));
        const selected = pageMap[page] || pageMap.dashboard;
        selected[0].classList.remove("hidden");
        els.pageTitle.textContent = selected[1];
        els.pageSubtitle.textContent = selected[2];

        document.querySelectorAll(".nav-item").forEach((button) => {
            button.classList.toggle("active", button.dataset.page === page || (button.dataset.page === "loads" && page === "grade"));
        });

        closeDrawer();
    }

    function showLogin() {
        els.loginView.classList.remove("hidden");
        els.appShell.classList.add("hidden");
    }

    function showApp() {
        els.loginView.classList.add("hidden");
        els.appShell.classList.remove("hidden");
    }

    function openDrawer() {
        els.sidebar.classList.add("open");
        els.drawerOverlay.classList.remove("hidden");
    }

    function closeDrawer() {
        els.sidebar.classList.remove("open");
        els.drawerOverlay.classList.add("hidden");
    }

    async function loadUserContext() {
        const { data, error } = await client.rpc("get_current_user_context");
        if (error) throw error;
        state.context = Array.isArray(data) ? (data[0] || null) : data;
        return state.context;
    }

    async function loadCurrentSystemSettings() {
        const { data, error } = await client
            .from("system_settings_view")
            .select("*")
            .limit(1);

        if (error) {
            console.warn("System settings could not be loaded", error);
            return state.settings;
        }

        state.settings = (data || [])[0] || state.settings || null;
        return state.settings;
    }

    function updateUserDisplay() {
        const ctx = state.context;
        const name = ctx?.full_name || state.user?.email || "Teacher";
        els.dashboardName.textContent = name;
        els.dashboardEmail.textContent = state.user?.email || ctx?.deped_email || "";
        els.userRoleText.textContent = roleLabels().join(" | ");
    }

    function updatePeriodLabels() {
        const gradeHeaderSystem = state.selectedLoad ? gradingSystemForLoad(state.selectedLoad) : currentDisplayGradingSystem();
        document.querySelectorAll("[data-period-header]").forEach((header) => {
            const period = Number(header.dataset.periodHeader || 0);
            header.textContent = periodLabel(period, gradeHeaderSystem);
            header.classList.toggle("hidden", gradeHeaderSystem === "Trimester" && period === 4);
        });

        const gradingSystem = currentDisplayGradingSystem();
        const trimester = gradingSystem === "Trimester";
        Array.from(els.correctionPeriodFilter.options).forEach((option) => {
            const period = Number(option.value || 0);
            if (!period) return;
            option.textContent = periodLabel(period, gradingSystem);
            option.hidden = trimester && period === 4;
            option.disabled = trimester && period === 4;
        });

        if (trimester && els.correctionPeriodFilter.value === "4") {
            els.correctionPeriodFilter.value = "3";
        }
    }

    function rpcCountValue(data) {
        if (typeof data === "number") return data;
        if (Array.isArray(data)) {
            const first = data[0];
            if (typeof first === "number") return first;
            if (first && typeof first === "object") return Number(first.count ?? first.value ?? Object.values(first)[0] ?? 0);
        }
        if (data && typeof data === "object") return Number(data.count ?? data.value ?? Object.values(data)[0] ?? 0);
        return 0;
    }

    function updateCorrectionBadge() {
        const count = Number(state.pendingCorrectionCount || 0);
        els.correctionBadge.textContent = count > 99 ? "99+" : String(count);
        els.correctionBadge.classList.toggle("hidden", count <= 0);
        els.statCorrections.textContent = String(count);
    }

    async function refreshCorrectionBadge() {
        try {
            const { data, error } = await client.rpc("get_grade_correction_pending_count", {});
            if (error) throw error;
            state.pendingCorrectionCount = rpcCountValue(data);
        } catch (error) {
            console.warn("Pending correction count could not be loaded", error);
            state.pendingCorrectionCount = 0;
        }
        updateCorrectionBadge();
    }

    function setConnectionDisplay() {
        if (isConnectionAvailable()) {
            els.connectionStatus.textContent = "Online";
            els.connectionStatus.classList.remove("offline");
        } else if (state.connection.checking) {
            els.connectionStatus.textContent = "Checking";
            els.connectionStatus.classList.remove("offline");
        } else {
            els.connectionStatus.textContent = "Offline";
            els.connectionStatus.classList.add("offline");
        }
        updateChangeCount();
    }

    async function checkConnection() {
        state.connection.browserOnline = window.navigator.onLine !== false;
        if (!state.connection.browserOnline) {
            state.connection.supabaseReachable = false;
            setConnectionDisplay();
            return false;
        }

        state.connection.checking = true;
        setConnectionDisplay();

        try {
            const { error } = await client
                .from("system_settings_view")
                .select("current_school_year_id")
                .limit(1);
            if (error) throw error;
            state.connection.supabaseReachable = true;
        } catch (error) {
            console.warn("Connection check failed", error);
            state.connection.supabaseReachable = false;
        } finally {
            state.connection.checking = false;
            setConnectionDisplay();
        }

        return isConnectionAvailable();
    }

    function startConnectionMonitor() {
        if (state.connection.timer) window.clearInterval(state.connection.timer);
        checkConnection();
        state.connection.timer = window.setInterval(checkConnection, 30000);
    }

    function stopConnectionMonitor() {
        if (state.connection.timer) window.clearInterval(state.connection.timer);
        state.connection.timer = null;
        state.connection.supabaseReachable = false;
        setConnectionDisplay();
    }

    function updateDashboardStats() {
        const sy = state.settings?.school_year || state.settings?.current_school_year || state.loads[0]?.school_year || "Not set";
        const activePeriod = state.loads[0]?.active_quarter || state.settings?.active_quarter || state.settings?.current_quarter || 1;
        const gradingSystem = state.loads[0] ? gradingSystemForLoad(state.loads[0]) : currentDisplayGradingSystem();

        els.statSchoolYear.textContent = sy;
        els.statPeriod.textContent = periodLabel(activePeriod, gradingSystem);
        els.statLoads.textContent = String(state.loads.length);
        updateCorrectionBadge();
    }

    function renderDashboardLoads() {
        els.dashboardLoads.innerHTML = "";

        if (!state.loads.length) {
            els.dashboardLoads.innerHTML = `<p class="message">No teaching loads found for this account.</p>`;
            return;
        }

        state.loads.slice(0, 6).forEach((load) => {
            const row = document.createElement("div");
            row.className = "compact-load-row";
            row.innerHTML = `
                <div>
                    <strong>Grade ${escapeHtml(load.grade_level)} ${escapeHtml(load.section_name || "")}</strong><br>
                    <span class="muted">${escapeHtml(load.subject_name || "Subject not set")} | ${escapeHtml(periodLabel(load.active_quarter, gradingSystemForLoad(load)))}</span>
                </div>
                <button class="secondary" type="button">Open</button>
            `;
            row.addEventListener("click", () => openLoad(load));
            els.dashboardLoads.appendChild(row);
        });
    }

    function renderLoadCards() {
        els.loadsGrid.innerHTML = "";

        if (!state.loads.length) {
            els.loadsMessage.textContent = "No assigned loads found.";
            return;
        }

        els.loadsMessage.textContent = "Select a load to open the grade encoding table.";

        state.loads.forEach((load) => {
            const total = Number(load.total_students || 0);
            const encoded = Number(load.active_quarter_encoded || 0);
            const missing = Number(load.active_quarter_missing || 0);
            const percent = total > 0 ? Math.round((encoded / total) * 100) : 0;
            const card = document.createElement("article");
            card.className = "load-card";
            card.innerHTML = `
                <div class="load-title">Grade ${escapeHtml(load.grade_level)} ${escapeHtml(load.section_name || "")}</div>
                <div class="load-subject">${escapeHtml(load.subject_name || "Subject not set")}</div>
                <div class="load-meta">
                    SY ${escapeHtml(load.school_year || "Not set")}<br>
                    Active Period: ${escapeHtml(periodLabel(load.active_quarter, gradingSystemForLoad(load)))}<br>
                    Students: ${total} | Encoded: ${encoded} | Missing: ${missing}
                </div>
                <div class="progress-line"><div class="progress-fill" style="width: ${percent}%"></div></div>
            `;
            card.addEventListener("click", () => openLoad(load));
            els.loadsGrid.appendChild(card);
        });
    }

    async function loadMyLoads() {
        els.dashboardMessage.textContent = "Loading teacher loads...";
        els.loadsMessage.textContent = "Loading teacher loads...";
        await loadCurrentSystemSettings();
        updatePeriodLabels();

        const { data, error } = await client.rpc("get_teacher_load_summary_rows");
        if (error) throw error;

        state.loads = (data || []).sort((a, b) => {
            const gradeCompare = Number(a.grade_level || 0) - Number(b.grade_level || 0);
            if (gradeCompare !== 0) return gradeCompare;
            const sectionCompare = String(a.section_name || "").localeCompare(String(b.section_name || ""));
            if (sectionCompare !== 0) return sectionCompare;
            return String(a.subject_name || "").localeCompare(String(b.subject_name || ""));
        });

        renderDashboardLoads();
        renderLoadCards();
        updateDashboardStats();
        els.dashboardMessage.textContent = "Dashboard loaded.";
        els.loadsMessage.textContent = state.loads.length ? "Select a load to open the grade encoding table." : "No assigned loads found.";
    }

    async function openLoad(load) {
        state.selectedLoad = load;
        state.gradeRows = [];
        els.gradeMessage.textContent = "Loading grades...";
        els.gradeTableBody.innerHTML = "";
        els.studentSearchInput.value = "";
        els.missingOnlyInput.checked = false;
        els.changeCountText.textContent = "No pending changes";
        els.gradeTitle.textContent = `Grade ${load.grade_level} ${load.section_name}`;
        els.gradeSubtitle.textContent = `${load.subject_name || "Subject"} | SY ${load.school_year || "Not set"} | ${gradingSystemForLoad(load)} | Active Period: ${periodLabel(load.active_quarter, gradingSystemForLoad(load))}`;
        setPage("grade");
        updatePeriodLabels();

        try {
            const { data, error } = await client.rpc("get_teacher_grade_encoding_rows", {
                p_class_id: load.class_id,
                p_subject_id: load.subject_id
            });

            if (error) throw error;
            state.gradeRows = sortStudentsByGenderThenName(data || []);
            renderGradeTable();
        } catch (error) {
            console.error(error);
            els.gradeMessage.textContent = `Grade rows could not be loaded: ${error.message}`;
            updateChangeCount();
        }
    }

    function activeQuarterValue(row) {
        if (!state.selectedLoad) return null;
        return gradeValue(row, displayActiveQuarterForLoad(state.selectedLoad.active_quarter, state.selectedLoad));
    }

    function getFilteredGradeRows() {
        const search = els.studentSearchInput.value.trim().toLowerCase();
        const missingOnly = els.missingOnlyInput.checked;

        return state.gradeRows.filter((row) => {
            const name = fullName(row).toLowerCase();
            const lrn = String(row.lrn || "").toLowerCase();
            const matchesSearch = !search || name.includes(search) || lrn.includes(search);
            const activeValue = activeQuarterValue(row);
            const isMissing = activeValue === null || activeValue === "";
            const matchesMissing = !missingOnly || isMissing;
            return matchesSearch && matchesMissing;
        });
    }

    function isCompactGradeView() {
        return !isDesktopGradeView();
    }

    function gradeInputHtml(row, quarter, activeQuarter) {
        const value = gradeValue(row, quarter);
        const textValue = gradeValueAsText(value);
        const visible = row[`q${quarter}_visible`] !== false;
        const periodOwner = row[`q${quarter}_can_encode`] !== false;
        const editable = visible && periodOwner && canEditQuarter(row, quarter, activeQuarter);

        if (!visible) return `<span class="masked-grade">**</span>`;

        const requestButton = canRequestGradeCorrection(row, quarter, editable, textValue)
            ? `<button class="correction-dot" type="button" data-request-grade-id="${escapeHtml(row.grade_id)}" data-request-quarter="${quarter}" title="Request correction">✎</button>`
            : "";

        return `
            <div class="grade-input-wrap">
                <input class="grade-input ${editable ? "" : "locked"}" type="text" inputmode="numeric" pattern="[0-9]*" value="${escapeHtml(textValue)}" data-grade-id="${escapeHtml(row.grade_id)}" data-quarter="${quarter}" data-original="${escapeHtml(textValue)}" ${editable ? "" : "disabled"}>
                ${requestButton}
            </div>`;
    }

    function periodChipHtml(row, quarter, activeQuarter, gradingSystem) {
        const visible = row[`q${quarter}_visible`] !== false;
        const value = visible ? gradeValueAsText(gradeValue(row, quarter)) : "**";
        const periodOwner = row[`q${quarter}_can_encode`] !== false;
        const editable = visible && periodOwner && canEditQuarter(row, quarter, activeQuarter);
        const currentMissing = quarter === activeQuarter && value === "" && editable;
        const classes = ["student-period-chip"];
        if (quarter === activeQuarter) classes.push("active");
        if (editable) classes.push("editable");
        if (currentMissing) classes.push("missing");
        if (!visible) classes.push("masked");
        return `<span class="${classes.join(" ")}"><b>${escapeHtml(periodLabel(quarter, gradingSystem))}</b>${escapeHtml(value || "Blank")}</span>`;
    }

    function renderGradeCards(rows, periods, activeQuarter) {
        if (!els.gradeCardList) return;
        els.gradeCardList.innerHTML = "";

        const gradingSystem = gradingSystemForLoad(state.selectedLoad);

        rows.forEach((row) => {
            const allDisplayedVisible = periods.every((quarter) => row[`q${quarter}_visible`] !== false);
            const finalVisible = row.final_visible !== undefined ? row.final_visible !== false : allDisplayedVisible;
            const remarksVisible = row.remarks_visible !== undefined ? row.remarks_visible !== false : finalVisible;
            const activeValue = gradeValue(row, activeQuarter);
            const activeEditable = canEditQuarter(row, activeQuarter, activeQuarter) && row[`q${activeQuarter}_visible`] !== false && row[`q${activeQuarter}_can_encode`] !== false;
            const needsActiveGrade = activeEditable && (activeValue === null || activeValue === undefined || activeValue === "");
            const article = document.createElement("article");
            article.className = `student-grade-card student-picker-card ${needsActiveGrade ? "needs-grade" : ""}`;
            article.dataset.openStudentGradeId = row.grade_id;
            article.setAttribute("tabindex", "0");
            article.setAttribute("role", "button");
            article.setAttribute("aria-label", `Encode grades for ${fullName(row)}`);

            const periodFields = periods.map((quarter) => periodChipHtml(row, quarter, activeQuarter, gradingSystem)).join("");

            article.innerHTML = `
                <div class="student-card-head">
                    <div>
                        <strong class="student-name">${escapeHtml(fullName(row))}</strong>
                        <span class="student-lrn">LRN ${escapeHtml(row.lrn || "")}</span>
                    </div>
                    <span class="gender-pill">${escapeHtml(row.gender || "")}</span>
                </div>
                <div class="student-period-chips">${periodFields}</div>
                <div class="student-result-row">
                    <span>Final <strong>${finalVisible ? escapeHtml(row.final_average ?? "") : '<span class="masked-grade">**</span>'}</strong></span>
                    <span>Remarks <strong>${remarksVisible ? escapeHtml(row.remarks ?? "") : '<span class="masked-grade">**</span>'}</strong></span>
                </div>
                <div class="student-card-action">Tap to encode this learner</div>`;

            els.gradeCardList.appendChild(article);
        });
    }

    function renderGradeTableRows(rows, periods, activeQuarter) {
        if (!els.gradeTableBody) return;
        els.gradeTableBody.innerHTML = "";
        const allPeriods = displayPeriodsForLoad(state.selectedLoad);
        rows.forEach((row) => {
            const allDisplayedVisible = allPeriods.every((quarter) => row[`q${quarter}_visible`] !== false);
            const finalVisible = row.final_visible !== undefined ? row.final_visible !== false : allDisplayedVisible;
            const remarksVisible = row.remarks_visible !== undefined ? row.remarks_visible !== false : finalVisible;
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${escapeHtml(row.lrn || "")}</td>
                <td>${escapeHtml(fullName(row))}</td>
                <td>${escapeHtml(row.gender || "")}</td>
                ${periods.map((quarter) => `<td>${gradeInputHtml(row, quarter, activeQuarter)}</td>`).join("")}
                <td>${finalVisible ? escapeHtml(row.final_average ?? "") : '<span class="masked-grade">**</span>'}</td>
                <td>${remarksVisible ? escapeHtml(row.remarks ?? "") : '<span class="masked-grade">**</span>'}</td>`;
            els.gradeTableBody.appendChild(tr);
        });
    }

    function renderGradeTable() {
        els.gradeTableBody.innerHTML = "";
        if (els.gradeCardList) els.gradeCardList.innerHTML = "";

        if (!state.selectedLoad) {
            els.gradeMessage.textContent = "Select a load first.";
            return;
        }

        const rows = getFilteredGradeRows();
        if (!rows.length) {
            els.gradeMessage.textContent = "No students found for the selected filter.";
            updateChangeCount();
            return;
        }

        const desktopGradeView = isDesktopGradeView();
        els.saveGradesBtn.classList.toggle("hidden", !desktopGradeView);

        if (!isConnectionAvailable()) {
            els.gradeMessage.textContent = connectionUnavailableNotice();
        } else if (isSystemLocked()) {
            els.gradeMessage.textContent = systemLockedNotice();
        } else if (!isGradeEncodingOpen()) {
            els.gradeMessage.textContent = gradeEncodingClosedNotice();
        } else if (desktopGradeView) {
            els.gradeMessage.textContent = "Encode grades in the table, then click Save Changes.";
        } else {
            els.gradeMessage.textContent = "Tap a learner, enter the grade, then save.";
        }

        const activeQuarter = displayActiveQuarterForLoad(state.selectedLoad.active_quarter, state.selectedLoad);
        const periods = displayPeriodsForLoad(state.selectedLoad);
        if (desktopGradeView) {
            renderGradeTableRows(rows, periods, activeQuarter);
        } else {
            renderGradeCards(rows, periods, activeQuarter);
        }
        updateChangeCount();
    }

    function updateChangeCount() {
        if (!els.changeCountText || !els.saveGradesBtn) return;
        const gradeOpen = isGradeEncodingOpen();
        const systemLocked = isSystemLocked();
        const connectionAvailable = isConnectionAvailable();
        const desktopGradeView = isDesktopGradeView();
        els.saveGradesBtn.classList.toggle("hidden", !desktopGradeView);

        if (!connectionAvailable) {
            els.changeCountText.textContent = "Connection unavailable";
            els.saveGradesBtn.disabled = true;
            return;
        }
        if (systemLocked) {
            els.changeCountText.textContent = "System is locked";
            els.saveGradesBtn.disabled = true;
            return;
        }
        if (!gradeOpen) {
            els.changeCountText.textContent = "Grade encoding is closed";
            els.saveGradesBtn.disabled = true;
            return;
        }

        if (!desktopGradeView) {
            els.changeCountText.textContent = "Saved per learner";
            els.saveGradesBtn.disabled = true;
            return;
        }

        let count = 0;
        document.querySelectorAll(".grade-input:not(:disabled)").forEach((input) => {
            const changed = input.value.trim() !== input.dataset.original && input.value.trim() !== "";
            input.classList.toggle("changed", changed);
            if (changed) count += 1;
        });

        els.changeCountText.textContent = count ? `${count} pending change(s)` : "No pending changes";
        els.saveGradesBtn.disabled = count === 0;
    }

    function studentModalInputHtml(row, quarter, activeQuarter, gradingSystem) {
        const value = gradeValue(row, quarter);
        const textValue = gradeValueAsText(value);
        const visible = row[`q${quarter}_visible`] !== false;
        const periodOwner = row[`q${quarter}_can_encode`] !== false;
        const editable = visible && periodOwner && canEditQuarter(row, quarter, activeQuarter);

        if (!visible) {
            return `
                <div class="student-grade-field locked-field">
                    <div class="student-grade-field-main">
                        <span>${escapeHtml(periodLabel(quarter, gradingSystem))}</span>
                        <strong>**</strong>
                    </div>
                    <em>Hidden</em>
                </div>`;
        }

        const requestButton = canRequestGradeCorrection(row, quarter, editable, textValue)
            ? `<button class="secondary small-request-btn" type="button" data-request-grade-id="${escapeHtml(row.grade_id)}" data-request-quarter="${quarter}">Request correction</button>`
            : "";

        if (editable) {
            return `
                <label class="student-grade-field editable-field ${quarter === activeQuarter ? "active-field" : ""}">
                    <span>${escapeHtml(periodLabel(quarter, gradingSystem))}</span>
                    <input class="student-grade-edit-input" type="text" inputmode="numeric" pattern="[0-9]*" value="${escapeHtml(textValue)}" data-grade-id="${escapeHtml(row.grade_id)}" data-quarter="${quarter}" data-original="${escapeHtml(textValue)}">
                    <em>${quarter === activeQuarter ? "Active period" : "Allowed blank previous period"}</em>
                </label>`;
        }

        return `
            <div class="student-grade-field locked-field ${quarter === activeQuarter ? "active-field" : ""}">
                <div class="student-grade-field-main">
                    <span>${escapeHtml(periodLabel(quarter, gradingSystem))}</span>
                    <strong>${escapeHtml(textValue || "Blank")}</strong>
                </div>
                <em>Saved or locked</em>
                ${requestButton}
            </div>`;
    }

    function updateStudentGradeModalSaveState() {
        if (!els.saveStudentGradeBtn || !els.studentGradeFields) return;
        const inputs = els.studentGradeFields.querySelectorAll(".student-grade-edit-input");
        let count = 0;
        inputs.forEach((input) => {
            const changed = input.value.trim() !== input.dataset.original && input.value.trim() !== "";
            input.classList.toggle("changed", changed);
            if (changed) count += 1;
        });
        const canSave = isConnectionAvailable() && !isSystemLocked() && isGradeEncodingOpen() && count > 0;
        els.saveStudentGradeBtn.disabled = !canSave;
        if (!isConnectionAvailable()) {
            els.studentGradeModalMessage.textContent = connectionUnavailableNotice();
        } else if (isSystemLocked()) {
            els.studentGradeModalMessage.textContent = systemLockedNotice();
        } else if (!isGradeEncodingOpen()) {
            els.studentGradeModalMessage.textContent = gradeEncodingClosedNotice();
        } else if (count > 0) {
            els.studentGradeModalMessage.textContent = `${count} unsaved change(s) for this learner.`;
        } else {
            els.studentGradeModalMessage.textContent = "Enter a grade, then save this learner immediately.";
        }
    }

    function openStudentGradeModal(gradeId) {
        const row = state.gradeRows.find((item) => String(item.grade_id) === String(gradeId));
        if (!row) {
            els.gradeMessage.textContent = "Learner row could not be found. Please refresh the load and try again.";
            return;
        }

        state.selectedStudentGradeRow = row;
        const gradingSystem = gradingSystemForLoad(state.selectedLoad);
        const activeQuarter = displayActiveQuarterForLoad(state.selectedLoad.active_quarter, state.selectedLoad);
        const periods = displayPeriodsForLoad(state.selectedLoad);
        const gradeSection = `Grade ${row.grade_level || state.selectedLoad?.grade_level || ""} ${row.section_name || state.selectedLoad?.section_name || ""}`.trim();
        const subject = row.subject_name || state.selectedLoad?.subject_name || "Subject not set";

        els.studentGradeTitle.textContent = "Encode Student Grade";
        els.studentGradeSubtitle.textContent = `${row.lrn || "No LRN"} | ${periodLabel(activeQuarter, gradingSystem)} active`;
        els.studentGradeNameText.textContent = fullName(row);
        els.studentGradeSectionText.textContent = gradeSection;
        els.studentGradeSubjectText.textContent = subject;
        els.studentGradeFields.innerHTML = periods.map((quarter) => studentModalInputHtml(row, quarter, activeQuarter, gradingSystem)).join("");
        els.studentGradeModal.classList.remove("hidden");
        updateStudentGradeModalSaveState();

        const firstEditable = els.studentGradeFields.querySelector(".student-grade-edit-input");
        if (firstEditable) setTimeout(() => firstEditable.focus(), 0);
    }

    function hideStudentGradeModal() {
        els.studentGradeModal.classList.add("hidden");
        state.selectedStudentGradeRow = null;
        if (els.studentGradeFields) els.studentGradeFields.innerHTML = "";
    }

    function collectStudentGradeItems() {
        if (!isGradeEncodingOpen()) throw new Error(gradeEncodingClosedNotice());
        const inputs = els.studentGradeFields.querySelectorAll(".student-grade-edit-input");
        const items = [];

        for (const input of inputs) {
            const valueText = input.value.trim();
            const original = input.dataset.original;
            if (valueText === "" || valueText === original) continue;

            const newGrade = Number(valueText);
            if (!Number.isInteger(newGrade) || newGrade < 60 || newGrade > 100) {
                throw new Error("Grades must be whole numbers from 60 to 100.");
            }

            items.push({
                grade_id: input.dataset.gradeId,
                quarter: Number(input.dataset.quarter),
                new_grade: newGrade,
                reason: "Teacher per-student encoding"
            });
        }

        return items;
    }

    async function saveStudentGrade() {
        if (blockIfWriteUnavailable(els.studentGradeModalMessage)) return;
        if (!state.selectedStudentGradeRow) {
            els.studentGradeModalMessage.textContent = "Learner row is missing. Please close and try again.";
            return;
        }

        let items;
        try {
            items = collectStudentGradeItems();
        } catch (error) {
            els.studentGradeModalMessage.textContent = error.message;
            return;
        }

        if (!items.length) {
            els.studentGradeModalMessage.textContent = "No changes to save for this learner.";
            updateStudentGradeModalSaveState();
            return;
        }

        els.saveStudentGradeBtn.disabled = true;
        els.studentGradeModalMessage.textContent = "Saving this learner...";

        try {
            const { data, error } = await client.rpc("save_teacher_grade_batch", { p_items: items });
            if (error) throw error;

            const results = data || [];
            const saved = results.filter((row) => row.saved);
            const failed = results.filter((row) => !row.saved);

            if (failed.length > 0) {
                els.studentGradeModalMessage.textContent = `${saved.length} saved, ${failed.length} failed. First error: ${failed[0].message}`;
                updateStudentGradeModalSaveState();
                return;
            }

            const savedName = fullName(state.selectedStudentGradeRow);
            items.forEach((item) => {
                const row = state.gradeRows.find((entry) => String(entry.grade_id) === String(item.grade_id));
                if (row) row[`q${item.quarter}_grade`] = item.new_grade;
            });
            hideStudentGradeModal();
            els.gradeMessage.textContent = `Saved grade changes for ${savedName}.`;

            try {
                await loadMyLoads();
                const refreshedLoad = state.loads.find((load) => load.class_id === state.selectedLoad.class_id && load.subject_id === state.selectedLoad.subject_id);
                if (refreshedLoad) await openLoad(refreshedLoad);
                else renderGradeTable();
            } catch (refreshError) {
                console.error(refreshError);
                renderGradeTable();
                els.gradeMessage.textContent = `Saved grade changes for ${savedName}. Refresh failed, but the saved learner is preserved. Tap Refresh when the signal returns.`;
            }
        } catch (error) {
            console.error(error);
            els.studentGradeModalMessage.textContent = error.message || "Unable to save this learner. Keep this form open and try again when the signal returns.";
            updateStudentGradeModalSaveState();
        }
    }

    function collectChangedGrades() {
        if (!isGradeEncodingOpen()) throw new Error(gradeEncodingClosedNotice());
        const inputs = document.querySelectorAll(".grade-input:not(:disabled)");
        const items = [];

        for (const input of inputs) {
            const original = input.dataset.original;
            const valueText = input.value.trim();
            if (valueText === "") continue;
            if (valueText === original) continue;

            const newGrade = Number(valueText);
            if (!Number.isInteger(newGrade) || newGrade < 60 || newGrade > 100) {
                throw new Error("Grades must be whole numbers from 60 to 100.");
            }

            items.push({
                grade_id: input.dataset.gradeId,
                quarter: Number(input.dataset.quarter),
                new_grade: newGrade,
                reason: "Teacher batch encoding"
            });
        }

        return items;
    }

    async function saveGrades() {
        if (blockIfWriteUnavailable(els.gradeMessage)) return;

        let items;
        try {
            items = collectChangedGrades();
        } catch (error) {
            els.gradeMessage.textContent = error.message;
            return;
        }

        if (!items.length) {
            els.gradeMessage.textContent = "No changes to save.";
            return;
        }

        els.saveGradesBtn.disabled = true;
        els.gradeMessage.textContent = `Saving ${items.length} change(s)...`;

        try {
            const { data, error } = await client.rpc("save_teacher_grade_batch", { p_items: items });
            if (error) throw error;

            const results = data || [];
            const saved = results.filter((row) => row.saved);
            const failed = results.filter((row) => !row.saved);

            if (failed.length > 0) {
                els.gradeMessage.textContent = `${saved.length} saved, ${failed.length} failed. First error: ${failed[0].message}`;
            } else {
                els.gradeMessage.textContent = `${saved.length} grade change(s) saved successfully.`;
            }

            await loadMyLoads();
            const refreshedLoad = state.loads.find((load) => load.class_id === state.selectedLoad.class_id && load.subject_id === state.selectedLoad.subject_id);
            if (refreshedLoad) await openLoad(refreshedLoad);
        } catch (error) {
            console.error(error);
            els.gradeMessage.textContent = error.message || "Unable to save grades.";
            updateChangeCount();
        }
    }

    function compactSubjectSearchText(load) {
        return [load?.sf_learning_area, load?.subject_code, load?.subject_name]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();
    }

    function normalizedMyLoadCsvSubject(load) {
        const text = compactSubjectSearchText(load);
        if (!text) return "";

        if (
            text.includes("mapeh") ||
            (text.includes("music") && text.includes("health")) ||
            (text.includes("physical education") && text.includes("health")) ||
            (/\bpe\b/.test(text) && text.includes("health"))
        ) return "MAPEH";

        if (text.includes("filipino")) return "Filipino";
        if (text.includes("english")) return "English";
        if (text.includes("mathematics") || /\bmath\b/.test(text)) return "Mathematics";
        if (text.includes("science")) return "Science";
        if (text.includes("araling panlipunan")) return "Araling Panlipunan";
        if (text.includes("values education") || text.includes("edukasyon sa pagpapakatao") || /\besp\b/.test(text)) return "Values Education";
        if (load?.is_tle_elective || text.includes("tle") || text.includes("technology and livelihood") || text.includes("livelihood education")) return "TLE";

        return String(load?.sf_learning_area || load?.subject_name || "")
            .replace(/\s+(7|8|9|10)\s*$/i, "")
            .trim();
    }

    function myLoadCsvSubjectOrder(subject) {
        const order = {
            Filipino: 1,
            English: 2,
            Mathematics: 3,
            Science: 4,
            "Araling Panlipunan": 5,
            TLE: 6,
            "Values Education": 7,
            MAPEH: 8
        };
        return order[subject] || 99;
    }

    function groupedMyLoadCsvExportLoads() {
        const seen = new Set();
        const groups = [];

        state.loads.forEach((load) => {
            const subject = normalizedMyLoadCsvSubject(load);
            if (!load?.class_id || !load?.subject_id || !subject) return;

            const key = `${load.class_id}|${subject}`;
            if (seen.has(key)) return;
            seen.add(key);
            groups.push({ ...load, csv_subject_name: subject });
        });

        return groups.sort((a, b) => {
            const gradeCompare = Number(a.grade_level || 0) - Number(b.grade_level || 0);
            if (gradeCompare !== 0) return gradeCompare;
            const sectionCompare = String(a.section_name || "").localeCompare(String(b.section_name || ""));
            if (sectionCompare !== 0) return sectionCompare;
            return myLoadCsvSubjectOrder(a.csv_subject_name) - myLoadCsvSubjectOrder(b.csv_subject_name);
        });
    }

    function csvField(value) {
        const text = String(value ?? "");
        return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    }

    function downloadTextFile(filename, content, mimeType = "text/csv;charset=utf-8") {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
    }

    function myLoadCsvExportFilename() {
        const schoolYears = [...new Set(state.loads.map((load) => load.school_year).filter(Boolean))];
        const schoolYearToken = schoolYears.length === 1 ? String(schoolYears[0]).replace(/[^A-Za-z0-9]+/g, "_") : "All_SY";
        const teacherToken = printableReportName(state.context?.full_name || state.user?.email || "Subject_Teacher")
            .replace(/[^A-Z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "") || "Subject_Teacher";
        return `My_Loads_Students_${teacherToken}_${schoolYearToken}.csv`;
    }

    async function exportMyLoadStudentsCsv() {
        if (!state.context?.is_subject_teacher) {
            els.loadsMessage.textContent = "This export is available only for Subject Teacher accounts.";
            return;
        }

        const exportGroups = groupedMyLoadCsvExportLoads();
        if (!exportGroups.length) {
            els.loadsMessage.textContent = "No teaching loads are available for CSV export.";
            return;
        }

        els.downloadMyLoadsCsvBtn.disabled = true;
        els.downloadMyLoadsCsvBtn.textContent = "Preparing...";
        const exportRows = [];
        const seenRows = new Set();

        try {
            for (let index = 0; index < exportGroups.length; index += 1) {
                const load = exportGroups[index];
                els.loadsMessage.textContent = `Preparing CSV ${index + 1} of ${exportGroups.length}: Grade ${load.grade_level} ${load.section_name} ${load.csv_subject_name}...`;

                const { data, error } = await client.rpc("get_teacher_grade_encoding_rows", {
                    p_class_id: load.class_id,
                    p_subject_id: load.subject_id
                });
                if (error) throw new Error(`Could not load Grade ${load.grade_level} ${load.section_name} ${load.csv_subject_name}: ${error.message}`);

                sortStudentsByGenderThenName(data || []).forEach((row) => {
                    const learnerKey = row.student_id || row.lrn || printableGradeSheetStudentName(row);
                    const uniqueKey = `${load.class_id}|${load.csv_subject_name}|${learnerKey}`;
                    if (seenRows.has(uniqueKey)) return;
                    seenRows.add(uniqueKey);
                    exportRows.push({
                        lrn: row.lrn || "",
                        complete_name: printableGradeSheetStudentName(row),
                        gender: row.gender || "",
                        grade_level: load.grade_level || row.grade_level || "",
                        section_name: load.section_name || row.section_name || "",
                        subject_name: load.csv_subject_name,
                        sort_grade: Number(load.grade_level || row.grade_level || 0),
                        sort_section: String(load.section_name || row.section_name || ""),
                        sort_subject: myLoadCsvSubjectOrder(load.csv_subject_name),
                        sort_gender: genderRank(row.gender),
                        sort_last_name: row.last_name || "",
                        sort_first_name: row.first_name || "",
                        sort_middle_name: row.middle_name || ""
                    });
                });
            }

            if (!exportRows.length) {
                els.loadsMessage.textContent = "No learner rows were found for the current teaching loads.";
                return;
            }

            exportRows.sort((a, b) => {
                if (a.sort_grade !== b.sort_grade) return a.sort_grade - b.sort_grade;
                const sectionCompare = a.sort_section.localeCompare(b.sort_section);
                if (sectionCompare !== 0) return sectionCompare;
                if (a.sort_subject !== b.sort_subject) return a.sort_subject - b.sort_subject;
                if (a.sort_gender !== b.sort_gender) return a.sort_gender - b.sort_gender;
                const lastCompare = a.sort_last_name.localeCompare(b.sort_last_name);
                if (lastCompare !== 0) return lastCompare;
                const firstCompare = a.sort_first_name.localeCompare(b.sort_first_name);
                if (firstCompare !== 0) return firstCompare;
                return a.sort_middle_name.localeCompare(b.sort_middle_name);
            });

            const headers = ["LRN", "Complete Name", "Gender", "Grade Level", "Section", "Subject"];
            const csvLines = [
                headers.map(csvField).join(","),
                ...exportRows.map((row) => [
                    row.lrn,
                    row.complete_name,
                    row.gender,
                    row.grade_level,
                    row.section_name,
                    row.subject_name
                ].map(csvField).join(","))
            ];

            downloadTextFile(myLoadCsvExportFilename(), `\ufeff${csvLines.join("\r\n")}`);
            els.loadsMessage.textContent = `Student CSV exported with ${exportRows.length} learner subject record(s).`;
        } catch (error) {
            console.error(error);
            els.loadsMessage.textContent = error.message || "Unable to export My Loads student CSV.";
        } finally {
            els.downloadMyLoadsCsvBtn.disabled = false;
            els.downloadMyLoadsCsvBtn.textContent = "Download CSV";
        }
    }

    function exportCurrentLoadCsv() {
        if (!state.selectedLoad || !state.gradeRows.length) {
            els.gradeMessage.textContent = "Open a teaching load before downloading a CSV.";
            return;
        }

        const gradingSystem = gradingSystemForLoad(state.selectedLoad);
        const periods = displayPeriodsForLoad(state.selectedLoad);
        const headers = [
            "LRN",
            "Complete Name",
            "Gender",
            ...periods.map((period) => periodLabel(period, gradingSystem)),
            "Final Grade",
            "Remarks"
        ];

        const csvLines = [
            headers.map(csvField).join(","),
            ...sortStudentsByGenderThenName(state.gradeRows).map((row) => {
                const periodValues = periods.map((period) => row[`q${period}_visible`] === false ? "**" : gradeValueAsText(gradeValue(row, period)));
                const finalVisible = row.final_visible !== false;
                const remarksVisible = row.remarks_visible !== false;
                return [
                    row.lrn || "",
                    printableGradeSheetStudentName(row),
                    row.gender || "",
                    ...periodValues,
                    finalVisible ? (row.final_average ?? "") : "**",
                    remarksVisible ? (row.remarks ?? "") : "**"
                ].map(csvField).join(",");
            })
        ];

        const grade = state.selectedLoad.grade_level ? `Grade_${state.selectedLoad.grade_level}` : "Grade";
        const section = String(state.selectedLoad.section_name || "Section").replace(/\s+/g, "_");
        const subject = String(state.selectedLoad.subject_name || "Subject").replace(/[^A-Za-z0-9]+/g, "_");
        downloadTextFile(`Grade_Encoding_${grade}_${section}_${subject}.csv`, `\ufeff${csvLines.join("\r\n")}`);
        els.gradeMessage.textContent = "Current load CSV downloaded.";
    }

    function openGradeCorrectionRequestModal(gradeId, quarter) {
        const row = state.gradeRows.find((item) => String(item.grade_id) === String(gradeId));
        if (!row) {
            els.gradeMessage.textContent = "Grade row could not be found. Please refresh the load and try again.";
            return;
        }

        const currentValue = gradeValue(row, quarter);
        if (currentValue === null || currentValue === undefined || currentValue === "") {
            els.gradeMessage.textContent = "Only existing saved grades can be requested for correction.";
            return;
        }

        state.selectedGradeCorrection = { row, quarter };
        els.requestedGradeInput.value = "";
        els.requestReasonInput.value = "";
        els.requestStudentText.textContent = fullName(row);
        els.requestSubjectText.textContent = row.subject_name || state.selectedLoad?.subject_name || "Subject not set";
        els.requestPeriodText.textContent = `${periodLabel(quarter, gradingSystemForLoad(state.selectedLoad))} | Current Grade: ${gradeValueAsText(currentValue)}`;
        els.requestCorrectionSubtitle.textContent = `Grade ${row.grade_level || ""} ${row.section_name || ""}`.trim();
        els.requestCorrectionMessage.textContent = "Enter the corrected grade and reason.";
        els.requestCorrectionModal.classList.remove("hidden");
        setTimeout(() => els.requestedGradeInput.focus(), 0);
    }

    function hideGradeCorrectionRequestModal() {
        els.requestCorrectionModal.classList.add("hidden");
        state.selectedGradeCorrection = null;
    }

    async function submitGradeCorrectionRequest() {
        if (blockIfWriteUnavailable(els.requestCorrectionMessage)) return;
        const selected = state.selectedGradeCorrection;
        if (!selected?.row || !selected?.quarter) {
            els.requestCorrectionMessage.textContent = "Grade row is missing. Please close this window and try again.";
            return;
        }

        const requestedGrade = Number(els.requestedGradeInput.value || 0);
        const reason = els.requestReasonInput.value.trim();

        if (!Number.isInteger(requestedGrade) || requestedGrade < 60 || requestedGrade > 100) {
            els.requestCorrectionMessage.textContent = "Corrected grade must be a whole number from 60 to 100.";
            return;
        }

        if (!reason) {
            els.requestCorrectionMessage.textContent = "Please provide a reason for the correction.";
            return;
        }

        els.submitRequestCorrectionBtn.disabled = true;
        els.requestCorrectionMessage.textContent = "Submitting correction request...";

        try {
            const { error } = await client.rpc("create_grade_correction_request", {
                p_grade_id: selected.row.grade_id,
                p_quarter: selected.quarter,
                p_requested_grade: requestedGrade,
                p_reason: reason
            });

            if (error) throw error;
            hideGradeCorrectionRequestModal();
            els.gradeMessage.textContent = "Grade correction request submitted for review.";
            await refreshCorrectionBadge();
            await loadGradeCorrectionPage(false);
        } catch (error) {
            console.error(error);
            els.requestCorrectionMessage.textContent = error.message || "Unable to submit correction request.";
        } finally {
            els.submitRequestCorrectionBtn.disabled = false;
        }
    }

    function correctionFilteredRows() {
        const status = els.correctionStatusFilter.value || "";
        const period = els.correctionPeriodFilter.value || "";
        return state.corrections.filter((row) => {
            const matchesStatus = !status || row.status === status;
            const matchesPeriod = !period || Number(row.grading_period) === Number(period);
            return matchesStatus && matchesPeriod;
        });
    }

    function updateCorrectionSummary() {
        const counts = { Pending: 0, Approved: 0, Rejected: 0, Cancelled: 0 };
        state.corrections.forEach((row) => {
            const status = row.status || "Pending";
            if (counts[status] !== undefined) counts[status] += 1;
        });
        els.pendingCountText.textContent = counts.Pending;
        els.approvedCountText.textContent = counts.Approved;
        els.rejectedCountText.textContent = counts.Rejected;
        els.cancelledCountText.textContent = counts.Cancelled;
        state.pendingCorrectionCount = counts.Pending;
        updateCorrectionBadge();
    }

    function renderCorrectionList() {
        updateCorrectionSummary();
        els.correctionList.innerHTML = "";
        const rows = correctionFilteredRows();

        if (!rows.length) {
            els.correctionList.innerHTML = `<p class="message">No grade correction requests found for the selected filters.</p>`;
            return;
        }

        rows.forEach((row) => {
            const card = document.createElement("article");
            card.className = "correction-card";
            const subject = [row.subject_code, row.subject_name].filter(Boolean).join(" | ") || "Subject not set";
            const gradeSection = [`Grade ${row.grade_level || ""}`, row.section_name || ""].join(" ").trim();
            const status = String(row.status || "Pending").trim();
            const canCancel = (row.can_cancel === true || String(row.can_cancel).toLowerCase() === "true") && status.toLowerCase() === "pending";
            const canReview = (row.can_review === true || String(row.can_review).toLowerCase() === "true") && status.toLowerCase() === "pending";

            const actionButtons = [];
            if (canReview || (canReviewGradeCorrections() && status.toLowerCase() === "pending")) {
                actionButtons.push(`<button class="success" type="button" data-correction-action="approve" data-request-id="${escapeHtml(row.request_id)}">Approve</button>`);
                actionButtons.push(`<button class="danger" type="button" data-correction-action="reject" data-request-id="${escapeHtml(row.request_id)}">Reject</button>`);
            }
            if (canCancel && !canReviewGradeCorrections()) {
                actionButtons.push(`<button class="secondary" type="button" data-correction-action="cancel" data-request-id="${escapeHtml(row.request_id)}">Cancel</button>`);
            }

            card.innerHTML = `
                <div class="correction-card-head">
                    <div>
                        <strong>${escapeHtml(row.student_name || "")}</strong><br>
                        <span class="muted">${escapeHtml(row.lrn || "")} | ${escapeHtml(gradeSection)}</span>
                    </div>
                    ${statusBadge(status)}
                </div>
                <div class="correction-meta">
                    <div><strong>Subject</strong><br>${escapeHtml(subject)}</div>
                    <div><strong>Change</strong><br>${escapeHtml(periodLabel(row.grading_period))}: ${escapeHtml(gradeValueAsText(row.current_grade))} to ${escapeHtml(gradeValueAsText(row.requested_grade))}</div>
                    <div><strong>Requested</strong><br>${escapeHtml(formatTimestamp(row.requested_at))}</div>
                </div>
                <p class="muted"><strong>Reason:</strong> ${escapeHtml(row.reason || "No reason recorded")}</p>
                ${row.review_notes ? `<p class="muted"><strong>Review Notes:</strong> ${escapeHtml(row.review_notes)}</p>` : ""}
                ${actionButtons.length ? `<div class="correction-actions">${actionButtons.join("")}</div>` : ""}
            `;

            card.querySelectorAll("[data-correction-action]").forEach((button) => {
                button.addEventListener("click", () => openCorrectionReviewModal(row.request_id, button.dataset.correctionAction));
            });

            els.correctionList.appendChild(card);
        });
    }

    async function loadGradeCorrectionPage(showMessage = true) {
        if (showMessage) els.correctionMessage.textContent = "Loading grade correction requests...";
        els.correctionList.innerHTML = `<p class="message">Loading requests...</p>`;

        try {
            const { data, error } = await client.rpc("get_grade_correction_requests", {
                p_status: null,
                p_school_year_id: null,
                p_period: null
            });
            if (error) throw error;
            state.corrections = data || [];
            renderCorrectionList();
            if (showMessage) {
                const count = state.corrections.length;
                els.correctionMessage.textContent = count === 1 ? "1 grade correction request loaded." : `${count} grade correction requests loaded.`;
            }
        } catch (error) {
            console.error(error);
            state.corrections = [];
            renderCorrectionList();
            els.correctionMessage.textContent = error.message || "Unable to load requests.";
        }
    }

    function openCorrectionReviewModal(requestId, action) {
        const row = state.corrections.find((item) => String(item.request_id) === String(requestId));
        if (!row) {
            els.correctionMessage.textContent = "Selected request could not be found. Please refresh.";
            return;
        }

        const status = String(row.status || "Pending").trim().toLowerCase();
        if (status !== "pending") {
            els.correctionMessage.textContent = "Only pending correction requests can be updated.";
            return;
        }

        const reviewAction = String(action || "").trim().toLowerCase();
        const rowCanReview = row.can_review === true || String(row.can_review).toLowerCase() === "true";
        if ((reviewAction === "approve" || reviewAction === "reject") && !(canReviewGradeCorrections() || rowCanReview)) {
            els.correctionMessage.textContent = "Your account can view this request but cannot approve or reject it.";
            return;
        }

        state.selectedCorrectionRequest = row;
        state.selectedCorrectionAction = reviewAction;
        els.reviewNotesInput.value = "";

        const actionLabel = reviewAction === "approve" ? "Approve" : reviewAction === "reject" ? "Reject" : "Cancel";
        els.reviewCorrectionTitle.textContent = `${actionLabel} Grade Correction`;
        els.reviewCorrectionSubtitle.textContent = row.reason ? `Reason: ${row.reason}` : "No reason recorded.";
        els.reviewStudentText.textContent = row.student_name || "Student not set";
        els.reviewSubjectText.textContent = [row.subject_code, row.subject_name].filter(Boolean).join(" | ") || "Subject not set";
        els.reviewChangeText.textContent = `${gradeValueAsText(row.current_grade)} to ${gradeValueAsText(row.requested_grade)} (${periodLabel(row.grading_period)})`;
        els.reviewCorrectionMessage.textContent = reviewAction === "approve"
            ? "Approving will immediately update the actual grade and write to the grade change log."
            : "Confirm this action to update the request status.";
        els.confirmReviewCorrectionBtn.textContent = actionLabel;
        els.confirmReviewCorrectionBtn.className = reviewAction === "approve" ? "success" : (reviewAction === "reject" ? "danger" : "secondary");
        els.reviewCorrectionModal.classList.remove("hidden");
    }

    function hideCorrectionReviewModal() {
        els.reviewCorrectionModal.classList.add("hidden");
        state.selectedCorrectionRequest = null;
        state.selectedCorrectionAction = "";
    }

    async function confirmCorrectionReview() {
        if (blockIfWriteUnavailable(els.reviewCorrectionMessage)) return;
        const row = state.selectedCorrectionRequest;
        const action = state.selectedCorrectionAction;
        const notes = els.reviewNotesInput.value.trim();

        if (!row?.request_id || !action) {
            els.reviewCorrectionMessage.textContent = "Request details are missing. Please close and try again.";
            return;
        }

        let rpcName = "";
        let params = {};
        if (action === "approve") {
            rpcName = "approve_grade_correction_request";
            params = { p_request_id: row.request_id, p_review_notes: notes || null };
        } else if (action === "reject") {
            rpcName = "reject_grade_correction_request";
            params = { p_request_id: row.request_id, p_review_notes: notes || null };
        } else {
            rpcName = "cancel_grade_correction_request";
            params = { p_request_id: row.request_id, p_cancel_notes: notes || null };
        }

        els.confirmReviewCorrectionBtn.disabled = true;
        els.reviewCorrectionMessage.textContent = "Saving action...";

        try {
            const { error } = await client.rpc(rpcName, params);
            if (error) throw error;
            hideCorrectionReviewModal();
            await loadGradeCorrectionPage();
            await refreshCorrectionBadge();
            if (state.selectedLoad) await openLoad(state.selectedLoad);
        } catch (error) {
            console.error(error);
            els.reviewCorrectionMessage.textContent = error.message || "Unable to update request.";
        } finally {
            els.confirmReviewCorrectionBtn.disabled = false;
        }
    }

    async function login(email, password) {
        els.loginMessage.textContent = "Signing in...";
        els.loginBtn.disabled = true;

        try {
            const { data, error } = await client.auth.signInWithPassword({ email, password });
            if (error) throw error;
            state.user = data.user;
            await loadUserContext();
            await loadCurrentSystemSettings();
            updateUserDisplay();
            updatePeriodLabels();
            showApp();
            startConnectionMonitor();
            setPage("dashboard");
            await loadMyLoads();
            await loadGradeCorrectionPage(false);
            await refreshCorrectionBadge();
            els.loginMessage.textContent = "";
        } catch (error) {
            console.error(error);
            els.loginMessage.textContent = error.message || "Login failed.";
            await client.auth.signOut();
            showLogin();
        } finally {
            els.loginBtn.disabled = false;
        }
    }

    async function logout() {
        await client.auth.signOut();
        stopConnectionMonitor();
        state.user = null;
        state.context = null;
        state.settings = null;
        state.loads = [];
        state.selectedLoad = null;
        state.gradeRows = [];
        state.corrections = [];
        els.emailInput.value = "";
        els.passwordInput.value = "";
        els.loginMessage.textContent = "";
        showLogin();
    }

    async function checkSession() {
        try {
            const { data, error } = await client.auth.getUser();
            if (error || !data?.user) {
                await client.auth.signOut();
                showLogin();
                return;
            }

            state.user = data.user;
            await loadUserContext();
            await loadCurrentSystemSettings();
            updateUserDisplay();
            updatePeriodLabels();
            showApp();
            startConnectionMonitor();
            setPage("dashboard");
            await loadMyLoads();
            await loadGradeCorrectionPage(false);
            await refreshCorrectionBadge();
        } catch (error) {
            console.error(error);
            await client.auth.signOut();
            showLogin();
            els.loginMessage.textContent = error.message || "Could not restore session. Please log in again.";
        }
    }

    function bindEvents() {
        els.loginForm.addEventListener("submit", (event) => {
            event.preventDefault();
            login(els.emailInput.value.trim(), els.passwordInput.value);
        });

        els.logoutBtn.addEventListener("click", logout);
        els.menuBtn.addEventListener("click", openDrawer);
        els.drawerOverlay.addEventListener("click", closeDrawer);
        window.addEventListener("online", checkConnection);
        window.addEventListener("offline", checkConnection);

        document.querySelectorAll(".nav-item").forEach((button) => {
            button.addEventListener("click", async () => {
                const page = button.dataset.page;
                if (page === "corrections") await loadGradeCorrectionPage();
                setPage(page);
            });
        });

        document.querySelectorAll("[data-nav-target]").forEach((button) => {
            button.addEventListener("click", () => setPage(button.dataset.navTarget));
        });

        els.dashboardRefreshBtn.addEventListener("click", async () => {
            try {
                await loadMyLoads();
                await refreshCorrectionBadge();
            } catch (error) {
                els.dashboardMessage.textContent = error.message || "Unable to refresh dashboard.";
            }
        });

        els.loadsRefreshBtn.addEventListener("click", async () => {
            try {
                await loadMyLoads();
            } catch (error) {
                els.loadsMessage.textContent = error.message || "Unable to refresh loads.";
            }
        });

        els.downloadMyLoadsCsvBtn.addEventListener("click", exportMyLoadStudentsCsv);
        els.backToLoadsBtn.addEventListener("click", () => setPage("loads"));
        els.refreshGradesBtn.addEventListener("click", () => {
            if (state.selectedLoad) openLoad(state.selectedLoad);
        });
        els.downloadCurrentLoadCsvBtn.addEventListener("click", exportCurrentLoadCsv);
        els.saveGradesBtn.addEventListener("click", saveGrades);
        els.studentSearchInput.addEventListener("input", renderGradeTable);
        els.missingOnlyInput.addEventListener("change", renderGradeTable);
        const bindGradeContainerEvents = (container) => {
            if (!container) return;
            container.addEventListener("input", (event) => {
                if (event.target.classList.contains("grade-input")) updateChangeCount();
            });
            container.addEventListener("click", (event) => {
                const button = event.target.closest("[data-request-grade-id]");
                if (button) {
                    event.stopPropagation();
                    openGradeCorrectionRequestModal(button.dataset.requestGradeId, Number(button.dataset.requestQuarter || 0));
                    return;
                }
                const card = event.target.closest("[data-open-student-grade-id]");
                if (card) openStudentGradeModal(card.dataset.openStudentGradeId);
            });
            container.addEventListener("keydown", (event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                const card = event.target.closest("[data-open-student-grade-id]");
                if (!card) return;
                event.preventDefault();
                openStudentGradeModal(card.dataset.openStudentGradeId);
            });
        };

        bindGradeContainerEvents(els.gradeTableBody);
        bindGradeContainerEvents(els.gradeCardList);

        let lastCompactGradeView = isCompactGradeView();
        window.addEventListener("resize", () => {
            const modeChanged = applyViewMode();
            const compactNow = isCompactGradeView();
            if (!modeChanged && compactNow === lastCompactGradeView) return;
            lastCompactGradeView = compactNow;
            if (state.selectedLoad) renderGradeTable();
            closeDrawer();
        });

        els.studentGradeFields.addEventListener("input", (event) => {
            if (event.target.classList.contains("student-grade-edit-input")) updateStudentGradeModalSaveState();
        });
        els.studentGradeFields.addEventListener("click", (event) => {
            const button = event.target.closest("[data-request-grade-id]");
            if (!button) return;
            hideStudentGradeModal();
            openGradeCorrectionRequestModal(button.dataset.requestGradeId, Number(button.dataset.requestQuarter || 0));
        });
        els.closeStudentGradeBtn.addEventListener("click", hideStudentGradeModal);
        els.cancelStudentGradeBtn.addEventListener("click", hideStudentGradeModal);
        els.saveStudentGradeBtn.addEventListener("click", saveStudentGrade);

        els.closeRequestCorrectionBtn.addEventListener("click", hideGradeCorrectionRequestModal);
        els.cancelRequestCorrectionBtn.addEventListener("click", hideGradeCorrectionRequestModal);
        els.submitRequestCorrectionBtn.addEventListener("click", submitGradeCorrectionRequest);
        els.closeReviewCorrectionBtn.addEventListener("click", hideCorrectionReviewModal);
        els.cancelReviewCorrectionBtn.addEventListener("click", hideCorrectionReviewModal);
        els.confirmReviewCorrectionBtn.addEventListener("click", confirmCorrectionReview);

        els.correctionsRefreshBtn.addEventListener("click", () => loadGradeCorrectionPage());
        els.correctionStatusFilter.addEventListener("change", renderCorrectionList);
        els.correctionPeriodFilter.addEventListener("change", renderCorrectionList);
    }

    applyViewMode();
    bindEvents();
    checkSession();
})();
