<?php
/**
 * Seed some dummy data for local dev / TEST server.
 * Company: Northwind Labs (@example.com). All accounts are auto-verified.
 *
 * This script is idempotent: it checks for existing rows before inserting.
 */

require_once __DIR__ . '/../config/db_connection.php';

$mysqli = get_db_connection();

function ensure_user(mysqli $db, string $email, string $password, string $displayName, string $role = 'employee'): int {
    $stmt = $db->prepare('SELECT id FROM Users WHERE email = ? LIMIT 1');
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $stmt->bind_result($id);
    if ($stmt->fetch()) {
        $stmt->close();
        return (int) $id;
    }
    $stmt->close();

    $hash = password_hash($password, PASSWORD_DEFAULT);
    $now = date('Y-m-d H:i:s');
    $stmt = $db->prepare('INSERT INTO Users (email, password_hash, display_name, role, email_verified_at) VALUES (?, ?, ?, ?, ?)');
    $stmt->bind_param('sssss', $email, $hash, $displayName, $role, $now);
    $stmt->execute();
    $newId = (int) $stmt->insert_id;
    $stmt->close();
    return $newId;
}

function ensure_team(mysqli $db, string $name, ?string $department, ?int $managerId): int {
    $stmt = $db->prepare('SELECT id FROM Teams WHERE name = ? LIMIT 1');
    $stmt->bind_param('s', $name);
    $stmt->execute();
    $stmt->bind_result($id);
    if ($stmt->fetch()) {
        $stmt->close();
        return (int) $id;
    }
    $stmt->close();

    $stmt = $db->prepare('INSERT INTO Teams (name, department, manager_id) VALUES (?, ?, ?)');
    $stmt->bind_param('ssi', $name, $department, $managerId);
    $stmt->execute();
    $newId = (int) $stmt->insert_id;
    $stmt->close();
    return $newId;
}

function ensure_team_member(mysqli $db, string $email, string $name, string $roleTitle, string $department, int $teamId, ?int $userId): void {
    $stmt = $db->prepare('SELECT id FROM TeamMembers WHERE email = ? LIMIT 1');
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $stmt->close();

    if ($row) {
        $stmt = $db->prepare('UPDATE TeamMembers SET team_id = ?, user_id = ?, name = ?, role = ?, department = ? WHERE id = ?');
        $stmt->bind_param('iisssi', $teamId, $userId, $name, $roleTitle, $department, $row['id']);
        $stmt->execute();
        $stmt->close();
        return;
    }

    $stmt = $db->prepare('INSERT INTO TeamMembers (user_id, team_id, name, role, department, email) VALUES (?, ?, ?, ?, ?, ?)');
    $stmt->bind_param('iissss', $userId, $teamId, $name, $roleTitle, $department, $email);
    $stmt->execute();
    $stmt->close();
}

/**
 * Seed a review with full performance-history fields.
 * Idempotent: checks by user_id + title.
 */
function ensure_review(
    mysqli $db,
    int $userId,
    ?int $managerId,
    string $title,
    string $content,
    int $rating,
    ?int $score,
    ?string $managerFeedback,
    string $reviewType,
    ?string $tags,
    ?string $reviewDate,
    ?int $scoreTechnical = null,
    ?int $scoreImpact = null,
    ?int $scoreLeadership = null
): void {
    $stmt = $db->prepare('SELECT id FROM Reviews WHERE user_id = ? AND title = ? LIMIT 1');
    $stmt->bind_param('is', $userId, $title);
    $stmt->execute();
    if ($stmt->fetch()) {
        $stmt->close();
        return;
    }
    $stmt->close();

    $stmt = $db->prepare(
        'INSERT INTO Reviews (user_id, manager_id, review_date, title, content, score, score_technical, score_impact, score_leadership, rating, manager_feedback, review_type, tags)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->bind_param(
        'iisssiiiiisss',
        $userId,
        $managerId,
        $reviewDate,
        $title,
        $content,
        $score,
        $scoreTechnical,
        $scoreImpact,
        $scoreLeadership,
        $rating,
        $managerFeedback,
        $reviewType,
        $tags
    );
    $stmt->execute();
    $stmt->close();
}

/** Legacy: keep backward compat for reviews without new fields */
function ensure_review_with_title(mysqli $db, int $userId, string $title, string $content, int $rating): void {
    ensure_review($db, $userId, null, $title, $content, $rating, null, null, 'annual', null, null);
}

function ensure_event_with_title(mysqli $db, int $userId, string $title, string $eventType, string $date, string $description, string $taggedPeers): void {
    $stmt = $db->prepare('SELECT id FROM CollaborationEvents WHERE user_id = ? AND title = ? LIMIT 1');
    $stmt->bind_param('is', $userId, $title);
    $stmt->execute();
    if ($stmt->fetch()) {
        $stmt->close();
        return;
    }
    $stmt->close();

    $status = 'submitted';
    $stmt = $db->prepare(
        'INSERT INTO CollaborationEvents (user_id, event_type, title, event_date, description, tagged_peers, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->bind_param('issssss', $userId, $eventType, $title, $date, $description, $taggedPeers, $status);
    $stmt->execute();
    $stmt->close();
}

/**
 * Seed a pending feedback request (employee -> manager). Idempotent by (requested_by, requested_from) and status pending.
 */
function ensure_feedback_request(mysqli $db, int $requestedBy, int $requestedFrom, ?string $message = null): void {
    $stmt = $db->prepare('SELECT id FROM FeedbackRequests WHERE requested_by = ? AND requested_from = ? AND status = ? LIMIT 1');
    $status = 'pending';
    $stmt->bind_param('iis', $requestedBy, $requestedFrom, $status);
    $stmt->execute();
    if ($stmt->fetch()) {
        $stmt->close();
        return;
    }
    $stmt->close();

    $stmt = $db->prepare('INSERT INTO FeedbackRequests (requested_by, requested_from, message, status) VALUES (?, ?, ?, ?)');
    $stmt->bind_param('iiss', $requestedBy, $requestedFrom, $message, $status);
    $stmt->execute();
    $stmt->close();
}

$password = 'Password123!';
$domain = 'example.com';

// --- 1 admin ---
$adminId = ensure_user($mysqli, "admin@{$domain}", $password, 'Admin User', 'admin');

// --- 3–4 managers ---
$m1 = ensure_user($mysqli, "alex.manager@{$domain}", $password, 'Alex Chen', 'manager');
$m2 = ensure_user($mysqli, "jordan.manager@{$domain}", $password, 'Jordan Blake', 'manager');
$m3 = ensure_user($mysqli, "priya.manager@{$domain}", $password, 'Priya Sharma', 'manager');
$m4 = ensure_user($mysqli, "sam.manager@{$domain}", $password, 'Sam Rivera', 'manager');

// --- 6–7 teams (Engineering, Product, Design, People Ops, Support, Operations, QA) ---
$teamEngId    = ensure_team($mysqli, 'Engineering', 'Engineering', $m1);
$teamProdId   = ensure_team($mysqli, 'Product', 'Product', $m2);
$teamDesignId = ensure_team($mysqli, 'Design', 'Design', $m2);
$teamPeopleId = ensure_team($mysqli, 'People Ops', 'People Ops', $m3);
$teamSupportId = ensure_team($mysqli, 'Support', 'Support', $m3);
$teamOpsId    = ensure_team($mysqli, 'Operations', 'Operations', $m4);
$teamQAId     = ensure_team($mysqli, 'QA', 'QA', $m4);

// --- ~20 employees (all @example.com, varied roles) ---
$employees = [
    ['Morgan Lee', 'Software Engineer', 'Engineering', $teamEngId],
    ['Casey Kim', 'Senior Software Engineer', 'Engineering', $teamEngId],
    ['Riley Jones', 'DevOps Engineer', 'Engineering', $teamEngId],
    ['Quinn Davis', 'Software Engineer', 'Engineering', $teamEngId],
    ['Avery Wilson', 'Product Manager', 'Product', $teamProdId],
    ['Taylor Brown', 'Product Analyst', 'Product', $teamProdId],
    ['Skyler Moore', 'Associate Product Manager', 'Product', $teamProdId],
    ['Jamie Taylor', 'Product Designer', 'Design', $teamDesignId],
    ['Drew Anderson', 'UX Designer', 'Design', $teamDesignId],
    ['Jordan UX', 'Senior Product Designer', 'Design', $teamDesignId],
    ['Morgan Hill', 'People Operations Analyst', 'People Ops', $teamPeopleId],
    ['Cameron Clark', 'HR Specialist', 'People Ops', $teamPeopleId],
    ['Reese Lewis', 'Support Engineer', 'Support', $teamSupportId],
    ['Sage Walker', 'Customer Success Specialist', 'Support', $teamSupportId],
    ['Finley Hall', 'Support Lead', 'Support', $teamSupportId],
    ['Emery Young', 'Operations Coordinator', 'Operations', $teamOpsId],
    ['Parker King', 'QA Engineer', 'QA', $teamQAId],
    ['Blake Wright', 'QA Analyst', 'QA', $teamQAId],
    ['Hayden Scott', 'Test Automation Engineer', 'QA', $teamQAId],
];
$employeeIds = [];
foreach ($employees as $i => $e) {
    $name = $e[0];
    $roleTitle = $e[1];
    $dept = $e[2];
    $teamId = $e[3];
    $local = str_replace(' ', '.', strtolower($name)) . '.' . $i;
    $email = "{$local}@{$domain}";
    $uid = ensure_user($mysqli, $email, $password, $name, 'employee');
    $employeeIds[] = $uid;
    ensure_team_member($mysqli, $email, $name, $roleTitle, $dept, $teamId, $uid);
}

// Managers as team members (one directory row per manager, primary team)
ensure_team_member($mysqli, "alex.manager@{$domain}", 'Alex Chen', 'Engineering Manager', 'Engineering', $teamEngId, $m1);
ensure_team_member($mysqli, "jordan.manager@{$domain}", 'Jordan Blake', 'Product Director', 'Product', $teamProdId, $m2);
ensure_team_member($mysqli, "priya.manager@{$domain}", 'Priya Sharma', 'People Ops Manager', 'People Ops', $teamPeopleId, $m3);
ensure_team_member($mysqli, "sam.manager@{$domain}", 'Sam Rivera', 'Operations Manager', 'Operations', $teamOpsId, $m4);

// Admin in directory (optional, one row in General or first team)
ensure_team_member($mysqli, "admin@{$domain}", 'Admin User', 'Administrator', 'General', $teamEngId, $adminId);

// ===== Seed performance history reviews for first employee (Morgan Lee) =====
$firstEmployeeId = $employeeIds[0]; // Morgan Lee, managed by Alex Chen ($m1)

ensure_review(
    $mysqli,
    $firstEmployeeId,
    $m1,
    'Annual Performance Review',
    'Consistently exceeds expectations and is a strong peer mentor within the team.',
    5,
    92,
    'Morgan consistently delivers high-quality work and has become a pivotal member of the engineering team. Their leadership on Project Alpha was exceptional, demonstrating both technical mastery and excellent stakeholder management. Morgan\'s attention to detail in the new design system migration has significantly reduced front-end development time.',
    'annual',
    'LEADERSHIP,TECHNICAL',
    '2023-10-12',
    95,  // score_technical
    90,  // score_impact
    88   // score_leadership
);

ensure_review(
    $mysqli,
    $firstEmployeeId,
    $m1,
    'Mid-Year Performance Sync',
    'Solid progress on goals; recommended to increase cross-team visibility of impact.',
    5,
    96,
    'Outstanding progress over the last six months. Morgan\'s contribution to the mobile redesign has exceeded expectations. Their proactive approach to identifying potential UX bottlenecks before they reach development has saved the project numerous iterations.',
    'mid-year',
    'UX DESIGN,PROACTIVE',
    '2023-04-15',
    94,  // score_technical
    98,  // score_impact
    92   // score_leadership
);

ensure_review(
    $mysqli,
    $firstEmployeeId,
    $m1,
    'Quarterly Review (Q1)',
    'Strong start to the year with excellent technical contributions.',
    5,
    94,
    'Morgan has hit the ground running this year. The integration of accessibility-first design principles into our workflow was a major win. Looking forward to seeing them take more ownership of the enterprise-level dashboards in Q2.',
    'quarterly',
    'ACCESSIBILITY',
    '2023-01-20',
    96,  // score_technical
    91,  // score_impact
    85   // score_leadership
);

ensure_review(
    $mysqli,
    $firstEmployeeId,
    $m1,
    'Year-End Performance Review',
    'Exceeded expectations across technical delivery, collaboration, and leadership.',
    5,
    93,
    'Morgan has had an outstanding year. Their work on the design system migration and consistent mentorship of newer team members has set a high bar. Recommended for increased scope in the next cycle.',
    'annual',
    'TECHNICAL,LEADERSHIP,COLLABORATION',
    '2024-12-05',
    92,  // score_technical
    94,  // score_impact
    93   // score_leadership
);

// Additional review for second employee (Casey Kim)
$secondEmployeeId = $employeeIds[1];
ensure_review(
    $mysqli,
    $secondEmployeeId,
    $m1,
    'Annual Performance Review',
    'Exceptional senior engineer who drives architectural improvements.',
    5,
    90,
    'Casey has been instrumental in improving our CI/CD pipeline and mentoring junior developers. Their code reviews are thorough and educational.',
    'annual',
    'TECHNICAL,MENTORSHIP',
    '2023-10-15',
    93,  // score_technical
    88,  // score_impact
    86   // score_leadership
);

// Legacy review for manager (Leadership 360)
ensure_review($mysqli, $m1, null, 'Leadership 360 Review', 'Creates psychological safety and invests in mentoring; could delegate more to grow the team.', 4, 88, null, 'annual', 'LEADERSHIP', '2023-09-01', 82, 85, 91);

// Seed collaboration events for Morgan Lee (demo employee)
ensure_event_with_title($mysqli, $firstEmployeeId, 'Onboarding mentorship for new hire', 'mentorship', date('Y-m-d', strtotime('-21 days')), 'Paired with a new engineer for their first three weeks.', 'Alex Chen, Casey Kim');
ensure_event_with_title($mysqli, $firstEmployeeId, 'Knowledge share: Performance dashboards', 'knowledge', date('Y-m-d', strtotime('-10 days')), 'Hosted a brown-bag session on performance dashboards.', 'Team Performance');
ensure_event_with_title($mysqli, $firstEmployeeId, 'Peer support: Production incident', 'peer_support', date('Y-m-d', strtotime('-14 days')), 'Helped debug and resolve a production latency spike with the on-call engineer.', 'Riley Jones');
ensure_event_with_title($mysqli, $firstEmployeeId, 'Cross-team API design review', 'cross_dept', date('Y-m-d', strtotime('-7 days')), 'Led API contract review with Product and Platform teams for the new billing service.', 'Avery Wilson, Jamie Taylor');
ensure_event_with_title($mysqli, $firstEmployeeId, 'Mentored intern on React patterns', 'mentorship', date('Y-m-d', strtotime('-5 days')), 'Weekly pairing session on component design and state management.', 'Quinn Davis');
ensure_event_with_title($mysqli, $firstEmployeeId, 'Documentation sprint: API v2', 'knowledge', date('Y-m-d', strtotime('-3 days')), 'Updated internal wiki and runbooks for the new API version.', 'Engineering');
ensure_event_with_title($mysqli, $firstEmployeeId, 'Pair programming: Auth refactor', 'peer_support', date('Y-m-d', strtotime('-1 day')), 'Joint refactor of auth middleware with Casey; reduced duplication and improved test coverage.', 'Casey Kim');

// Extra collaboration events for Alex (manager) — visible in manager demo
ensure_event_with_title($mysqli, $m1, '1:1 with Morgan Lee', 'mentorship', date('Y-m-d', strtotime('-2 days')), 'Quarterly goals and career growth discussion.', 'Morgan Lee');
ensure_event_with_title($mysqli, $m1, 'Team retro facilitation', 'cross_dept', date('Y-m-d', strtotime('-5 days')), 'Facilitated engineering team retrospective; captured action items for next sprint.', 'Engineering');

// Pending feedback requests so manager (Alex) sees "Reviews due" and notifications
ensure_feedback_request($mysqli, $firstEmployeeId, $m1, 'I would appreciate your feedback before the year-end review cycle. Thanks!');
ensure_feedback_request($mysqli, $secondEmployeeId, $m1, 'Could you share feedback on my last two sprints when you have a moment?');

// Seed demo calendar-style events (mirrors frontend shared calendar dummy data).
// Use the primary engineering manager as the owning user for these collaboration records.
$today = new DateTimeImmutable('now');
$year = (int) $today->format('Y');
$month = (int) $today->format('m');

$calendarDate = static function (int $y, int $m, int $d): string {
    return sprintf('%04d-%02d-%02d', $y, $m, $d);
};

$calendarEvents = [
    // Matches peers calendar: Weekly standups, focus blocks, 1:1s, demos, PTO, etc.
    ['Weekly team standup',            'cross_dept', $calendarDate($year, $month, 3),  '09:30–10:00',  'Weekly engineering standup (sprint updates, blockers).'],
    ['Focus block – code review',      'cross_dept', $calendarDate($year, $month, 4),  '16:00–17:00',  'Deep focus on code reviews and technical debt.'],
    ['1:1 with manager',               'cross_dept', $calendarDate($year, $month, 5),  '14:00–14:30',  'Bi-weekly 1:1 with manager to review goals and feedback.'],
    ['Project sync: Q2 goals',         'cross_dept', $calendarDate($year, $month, 7),  '11:00–12:00',  'Project status sync on Q2 roadmap and dependencies.'],
    ['Design review with Product',     'cross_dept', $calendarDate($year, $month, 9),  '15:00–16:00',  'Joint design review with Product and Design teams.'],
    ['Focus time (no meetings)',       'cross_dept', $calendarDate($year, $month, 12), '13:00–15:00',  'Blocked focus time for deep work (no meetings).'],
    ['Cross-team demo',                'cross_dept', $calendarDate($year, $month, 15), '10:00–11:00',  'Demo of latest feature work to cross-functional partners.'],
    ['Weekly team standup (repeat)',   'cross_dept', $calendarDate($year, $month, 18), '09:30–10:00',  'Recurring weekly engineering standup.'],
    ['1:1 with mentor',                'cross_dept', $calendarDate($year, $month, 19), '17:00–17:30',  'Career development 1:1 with senior mentor.'],
    ['Out of office — PTO',            'cross_dept', $calendarDate($year, $month, 22), 'All day',      'Planned personal time off.'],
    ['Peer pairing session',           'cross_dept', $calendarDate($year, $month, 25), '11:30–12:00',  'Pair programming session with a teammate.'],
];

foreach ($calendarEvents as [$title, $eventType, $date, $timeRange, $details]) {
    // Store time information inside the description so it is visible in the database.
    $description = $timeRange . ' — ' . $details;
    ensure_event_with_title($mysqli, $m1, $title, $eventType, $date, $description, 'Team Engineering');
}

echo "Dummy data seeded successfully (1 admin, 4 managers, " . count($employees) . " employees, 7 teams, performance reviews, collaboration events, pending feedback requests, calendar demo events).\n";
