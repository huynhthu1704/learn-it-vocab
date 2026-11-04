// Role tagging rules. Each word starts with the role(s) from its word list header;
// these rules add every other role that also needs the word.
export const ROLE_IDS = ['student', 'dev', 'test', 'ba', 'pmo', 'hr', 'bizdev', 'sales', 'exec'];
const WORK = ROLE_IDS.filter(r => r !== 'student');
const L = s => s.split(',').map(x => x.trim().toLowerCase()).filter(Boolean);

const TECH_FOR_NONTECH = L(`developer, tester, designer, frontend, backend, full-stack, server, cloud, database, app, mobile app, website, software, hardware,
  AI, artificial intelligence, machine learning, data, API, integration, platform, SaaS, security, cybersecurity, bug, release, deploy, deployment, go-live,
  user interface, UI, UX, prototype, MVP, feature, requirement, user story, sprint, Agile, Scrum, Kanban, backlog, demo, roadmap, DevOps, QA, testing,
  version, update, downtime, outage, incident, uptime, data privacy, personal data, GDPR, encryption, open source, automation, dashboard, analytics`);
const HR = L(`developer, tester, designer, frontend, backend, full-stack, DevOps, QA engineer, automation engineer, SDET, test lead, tech lead, senior, junior,
  intern, internship, fresher, engineering manager, staff engineer, principal engineer, product owner, product manager, project manager, business analyst,
  Scrum Master, data, AI, machine learning, cloud, cybersecurity, Java, Python, JavaScript, TypeScript, SQL, HTML, CSS, Agile, Scrum, Figma, Git, GitHub,
  technical interview, coding test, system design interview, whiteboard interview, behavioural interview, STAR method, hiring loop, portfolio, CV, cover letter,
  LinkedIn, recruiter, job offer, salary negotiation, probation, ISTQB, CBAP, PMP, PSPO, soft skills, teamwork, onboarding, performance review, promotion,
  mentoring, mentorship, remote, work from home, overtime, working hours, sick leave, day off, headcount, career path, side project, open-source contribution`);
const BIZ = L(`SaaS, platform, cloud, API, integration, SLA, contract, RFP, vendor, demo, proposal, CRM, ERP, MVP, roadmap, feature, product, customer, client,
  stakeholder, KPI, metric, conversion rate, churn, retention, ROI, return on investment, value proposition, go-to-market, pricing strategy, B2B, B2C,
  partnership, due diligence, procurement, statement of work, fixed price, time and materials, change request, change order, scope, deadline, requirement,
  user acceptance, go-live, support team, security, data privacy, GDPR, compliance, uptime, outage, AI, machine learning, digital transformation,
  customer satisfaction, NPS, customer journey map, pain point, use case, prototype, proof of concept, subscription model, monetization, ecosystem,
  omnichannel, e-commerce, payment gateway, scalability, total cost of ownership, vendor lock-in, build vs buy, outsourcing, offshore team, warranty period,
  acceptance sign-off, revenue, profit, budget, cost, discount, invoice, price, business case, competitive analysis, market research, TAM, unit economics,
  customer lifetime value, customer acquisition cost, payback period`);
const PMO = L(`risk, issue, dependency, milestone, budget, resource, capacity, timeline, schedule, deadline, delay, on time, progress, status report,
  risk register, issue log, mitigation, mitigation plan, contingency plan, escalation, steering committee, governance, portfolio management,
  program management, PMO, benefits realization, earned value, burn rate, burndown chart, burnup chart, forecast, predictability, dependency management,
  scaled agile, SAFe, PI planning, release train, critical path, Gantt chart, work breakdown structure, deliverable, phase, baseline, change control,
  change request, RACI, stakeholder map, communication plan, KPI, OKR, metric, lessons learned, post-implementation review, success criteria,
  critical success factor, resource, headcount, annual budget, quarterly planning, velocity, sprint, retrospective, definition of done, release plan, go-live,
  go/no-go, sign-off, quality gate, SLA, vendor, contract, statement of work`);
const EXEC = L(`technical debt, digital transformation, build vs buy, vendor lock-in, cloud computing, cloud, AI, artificial intelligence, cybersecurity, compliance,
  regulatory compliance, scalability, ROI, return on investment, KPI, OKR, north star metric, roadmap, product strategy, product vision, headcount,
  attrition rate, risk appetite, governance, SLA, outage, incident, postmortem, data protection, GDPR, outsourcing, offshore team, MVP, product-market fit,
  total cost of ownership, CAPEX, OPEX, business case, cost-benefit analysis, feasibility study, executive summary, executive sponsor, C-level,
  steering committee, board meeting, strategic initiative, operating model, target operating model, enterprise architecture, change management,
  organizational change, customer centricity, operational efficiency, revenue, profit, budget, annual budget, burn rate, unit economics, go-to-market,
  pricing strategy, partnership, due diligence, engineering culture, psychological safety, technical leadership, developer experience, outage, disaster recovery`);

// Everyday office words every working role uses.
const OFFICE = L(`report, status, survey, Excel, spreadsheet, export, training, attachment, remote, onboarding, presentation, slide, schedule, calendar, online meeting, chat, message`);

// IT terms every BA, PO and PM needs (the IT glossary that used to live in BAPO Path's General Knowledge).
const BAPO_IT = L(`SDLC, requirement, functional requirement, non-functional requirement, MVP, scope creep, technical debt, change request, API,
  frontend, backend, integration, microservices, database, SQL, data migration, dashboard, UAT, bug, test case, regression testing, SIT,
  environment, deployment, CI/CD, go-live, rollback, authentication, authorization`);

export function tagRoles(w) {
  const add = (rs) => { for (const r of rs) if (!w.roles.includes(r)) w.roles.push(r); };
  const t = w.term.toLowerCase(), c = w.topic, l = w.level;
  // Words that only university lists use (lectures, theses, academic writing) stay with students.
  const studentOnly = w.roles.length === 1 && w.roles[0] === 'student';
  // Everyday workplace words: every role.
  if (!studentOnly && ['communication', 'meeting', 'time'].includes(c)) add(ROLE_IDS);
  if (!studentOnly && l === 1 && ['document', 'people', 'business', 'money'].includes(c)) add(ROLE_IDS);
  // Basic screen, device and career-start words: the hands-on product roles, not business roles.
  if (!studentOnly && l === 1 && ['web', 'security', 'mobile', 'design', 'data', 'devices'].includes(c)) add(['dev', 'test', 'ba', 'pmo']);
  if (!studentOnly && l === 1 && c === 'career') add(['dev', 'test', 'ba', 'hr']);
  if (TECH_FOR_NONTECH.includes(t)) add(['hr', 'bizdev', 'sales', 'pmo', 'exec']);
  // IT HR
  if (['people', 'career', 'hr'].includes(c) || HR.includes(t)) add(['hr']);
  // Business development and Sales: business and money words, and domain words beyond the everyday consumer ones
  // (a bizdev person selling to a bank needs "loan origination", not "ATM").
  if (['business', 'money'].includes(c) || (l >= 2 && ['banking', 'ecommerce', 'healthcare', 'insurance', 'logistics', 'education', 'telecom'].includes(c)) || BIZ.includes(t)) add(['bizdev', 'sales']);
  if (OFFICE.includes(t)) add(WORK);
  // PMO
  if (['agile', 'process'].includes(c) || (c === 'release' && l <= 2) || PMO.includes(t)) add(['pmo']);
  // Manager / C-level
  if (((c === 'business' || c === 'money') && l >= 2) || EXEC.includes(t)) add(['exec']);
  // BA / PO / PM: the core IT glossary.
  if (BAPO_IT.includes(t)) add(['ba']);
  // Testers also need most bug words; BAs need most domain words.
  if (c === 'bug' && l <= 2) add(['dev', 'test']);
}
