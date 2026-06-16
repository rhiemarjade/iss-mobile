# ISS Mobile Grade Encoding

This is a GitHub Pages-ready static mobile companion for the ISS Local App. This v7 build uses the dual desktop/mobile layout and removes the search, current-load CSV button, missing-grade filter, and per-learner status chip from the Grade Encoding screen.

Included modules:

1. Dashboard
2. My Loads
3. Grade Encoding
4. My Loads student CSV export
5. Grade Correction request, tracking, cancellation, and review actions when the logged-in account is allowed by the database functions

This site uses Supabase Auth and the existing ISS Supabase RPC functions. It does not include FastAPI, Python, backup, restore, SF9, SF10, reports, admin tools, or the service role key.

## Files

```text
index.html
styles.css
app.js
config.js
config.sample.js
manifest.json
assets/iss_logo.png
.nojekyll
```

## Before publishing

Open `config.js` and confirm that it contains only:

```js
window.ISS_MOBILE_CONFIG = {
    supabaseUrl: "...",
    supabaseAnonKey: "..."
};
```

Do not add the Supabase service role key to this site.

## GitHub Pages deployment

1. Create a new GitHub repository, for example `iss-mobile-grade-encoding`.
2. Upload the files in this folder to the repository root.
3. Go to Repository Settings, Pages.
4. Set Source to `Deploy from a branch`.
5. Select the `main` branch and `/root` folder.
6. Save.
7. Open the GitHub Pages URL after deployment.

## Required database functions

The current app calls these existing ISS functions and view:

```text
get_current_user_context()
get_teacher_load_summary_rows()
get_teacher_grade_encoding_rows(p_class_id, p_subject_id)
save_teacher_grade_batch(p_items)
create_grade_correction_request(p_grade_id, p_quarter, p_requested_grade, p_reason)
get_grade_correction_requests(p_status, p_school_year_id, p_period)
get_grade_correction_pending_count()
approve_grade_correction_request(p_request_id, p_review_notes)
reject_grade_correction_request(p_request_id, p_review_notes)
cancel_grade_correction_request(p_request_id, p_cancel_notes)
system_settings_view
```

## Security reminder

GitHub Pages is public static hosting. This app relies on Supabase authenticated RPC permissions and database rules. Before sharing the URL with teachers, verify that the database functions enforce user scope, especially that teachers can only read and update their assigned loads.
