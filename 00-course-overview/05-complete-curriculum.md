# المنهج الكامل — Complete Curriculum

> كل وحدة (Module) تتبع [القالب الموحّد ذا الـ19 قسمًا](10-module-template.md).
> الحالة: ✅ كل الوحدات مكتوبة ومفحوصة آليًا (البنية، الروابط، Mermaid، والأمثلة تُترجم وتُختبر في CI — انظر [CONTRIBUTING.md](../CONTRIBUTING.md)).

---

## LEVEL 0 — الأسس المطلقة (Absolute Foundations)

**الهدف:** بناء الخريطة الذهنية الكاملة: Human → Source Code → Compiler/Runtime → Machine → OS → Network/Storage → Application.

| # | Module | المحتوى | الحالة |
|---|---|---|---|
| 0 | [How Computers, Programs, and Software Engineers Fit Together](../level-0-absolute-foundations/module-00-how-everything-fits-together.md) | الخريطة الكبرى، ما هو مهندس البرمجيات | ✅ |
| 0.1 | [What is a Computer? Hardware vs Software](../level-0-absolute-foundations/module-01-what-is-a-computer.md) | Computer, Hardware, Software, CPU/RAM/Storage (intro) | ✅ |
| 0.2 | [Programs, Source Code, Machine Code, Compilers, Interpreters, Runtimes](../level-0-absolute-foundations/module-02-programs-and-code.md) | Program, Source Code, Machine Code, Compiler, Interpreter, Runtime | ✅ |
| 0.3 | [What Happens When I Run a Program? OS, Process, Memory](../level-0-absolute-foundations/module-03-running-a-program.md) | OS, Process, Memory (intro), Files (intro) | ✅ |
| 0.4 | [Files, Folders, Paths, Terminal, Shell, Environment Variables](../level-0-absolute-foundations/module-04-files-terminal-shell.md) | Basic computer literacy, practical | ✅ |
| 0.5 | [Processes, Ports, localhost, IP Address](../level-0-absolute-foundations/module-05-processes-ports-localhost.md) | Practical process & port literacy | ✅ |
| 0.6 | [Network, Client, Server, Browser](../level-0-absolute-foundations/module-06-network-client-server.md) | Network, Server, Client, Browser (intro) | ✅ |
| 0.7 | [Database, API, Web Application — The Big Map](../level-0-absolute-foundations/module-07-database-api-web-app.md) | Database, API, Web Application; connecting all layers | ✅ |
| ✔ | [Checkpoint 0](../level-0-absolute-foundations/checkpoint-0.md) | Conceptual / Coding / Debugging / Architecture | ✅ |

---

## LEVEL 1 — البرمجة والتفكير الحاسوبي (Programming + Computational Thinking)

**الهدف:** تعلّم البرمجة نفسها (ليس frameworks) بـ TypeScript/JavaScript، مع debugging و Git من اليوم الأول.

| # | Module | المحتوى | الحالة |
|---|---|---|---|
| 1.0 | [Setting Up: Node.js, TypeScript, Editor](../level-1-programming/module-1.0-setup.md) | تثبيت البيئة، تشغيل أول ملف | ✅ |
| 1.1 | [Values, Variables, Types](../level-1-programming/module-1.1-values-variables-types.md) | value, variable, type, primitive types | ✅ |
| 1.2 | [Expressions, Operators, Conditions](../level-1-programming/module-1.2-expressions-conditions.md) | expression, operator, boolean, if/else, truthiness | ✅ |
| 1.3 | [Loops & Iteration](../level-1-programming/module-1.3-loops.md) | for, while, for..of, break/continue | ✅ |
| 1.4 | [Functions, Scope, Closures](../level-1-programming/module-1.4-functions-scope-closures.md) | function, parameter, argument, return, scope, closure | ✅ |
| 1.5 | [Arrays & Transformations](../level-1-programming/module-1.5-arrays.md) | array, index, methods (map/filter/reduce), iteration | ✅ |
| 1.6 | [Objects & References](../level-1-programming/module-1.6-objects-references.md) | object, property, reference vs value (first pass) | ✅ |
| 1.7 | [State, Side Effects, Immutability](../level-1-programming/module-1.7-state-side-effects-immutability.md) | state, side effect, immutability, pure function | ✅ |
| 1.8 | [Modules](../level-1-programming/module-1.8-modules.md) | import/export, module boundaries, package.json | ✅ |
| 1.9 | [Errors: Exceptions, Result, Fail Fast](../level-1-programming/module-1.9-errors.md) | Error, throw, try/catch, error types, stack trace | ✅ |
| 1.10 | [Input / Output](../level-1-programming/module-1.10-io.md) | stdin/stdout, process.argv, reading/writing files | ✅ |
| 1.11 | [Async & the Event Loop](../level-1-programming/module-1.11-async-event-loop.md) | callbacks → promises → async/await, event loop (intro) | ✅ |
| 1.12 | [Debugging as a Method](../level-1-programming/module-1.12-debugging.md) | reading errors, stack traces, console, breakpoints, hypotheses | ✅ |
| 1.13 | [Git I: Snapshots, Commits, Branches](../level-1-programming/module-1.13-git-1.md) | what problem Git solves, repo, working tree, staging, commit, branch, merge | ✅ |
| 1.14 | [Git II: Remotes, PRs, Conflicts, Bisect](../level-1-programming/module-1.14-git-2.md) | remote, push/pull, PR, rebase, revert, cherry-pick, bisect | ✅ |
| 1.15 | [TypeScript Types: Thinking in Types](../level-1-programming/module-1.15-typescript-types.md) | type annotations, interfaces, unions, generics (intro), narrowing | ✅ |
| 🛠 | [**Project 1:** CLI Application](../projects/project-1-cli/README.md) | | ✅ |
| 🛠 | [**Project 2:** Small Data-Processing Program](../projects/project-2-data-processing/README.md) | | ✅ |
| ✔ | [Checkpoint 1](../level-1-programming/checkpoint-1.md) | | ✅ |

---

## LEVEL 2 — أنظمة الحاسوب (Computer Systems)

**الهدف:** فهم كيف يعمل الحاسوب فعلًا، وربط كل مفهوم بالبرمجيات.

| # | Module | المحتوى | الحالة |
|---|---|---|---|
| 2.1 | [Bits, Bytes, Binary, Hexadecimal, Data Representation](../level-2-computer-systems/module-2.1-bits-bytes-encoding.md) | numbers, text (ASCII/UTF-8), images; Buffer in Node | ✅ |
| 2.2 | [CPU, Registers, Instructions, Cache, RAM, Storage](../level-2-computer-systems/module-2.2-cpu-cache-ram.md) | memory hierarchy and why it matters | ✅ |
| 2.3 | [Memory: Stack, Heap, References, Allocation, GC, Leaks](../level-2-computer-systems/module-2.3-memory-stack-heap-gc.md) | why `const user = {...}` is mutable; JS memory model | ✅ |
| 2.4 | [Operating Systems: What Does an OS Do?](../level-2-computer-systems/module-2.4-operating-systems.md) | process mgmt, memory mgmt, files, permissions, networking, devices | ✅ |
| 2.5 | [Process Deep Dive](../level-2-computer-systems/module-2.5-process-deep-dive.md) | program vs process, memory, PID, environment, lifecycle, exit codes, signals | ✅ |
| 2.6 | [Threads](../level-2-computer-systems/module-2.6-threads.md) | process → thread, shared memory, execution | ✅ |
| 2.7 | [Concurrency vs Parallelism; The Node.js Event Loop](../level-2-computer-systems/module-2.7-concurrency-event-loop.md) | examples from Node.js, databases, web servers | ✅ |
| 2.8 | [Networking From Zero](../level-2-computer-systems/module-2.8-networking-from-zero.md) | network, IP, port, packet | ✅ |
| 2.9 | [TCP & UDP](../level-2-computer-systems/module-2.9-tcp-udp.md) | connection, reliability, ordering, flow control, congestion (conceptual) | ✅ |
| 2.10 | [DNS](../level-2-computer-systems/module-2.10-dns.md) | domain → DNS → IP, with a real traced request | ✅ |
| 2.11 | [TLS](../level-2-computer-systems/module-2.11-tls.md) | encryption, certificates, public/private keys, CA, handshake | ✅ |
| 2.12 | [HTTP — From Zero to Professional](../level-2-computer-systems/module-2.12-http.md) | request/response, methods, headers, body, cookies, status codes, caching, auth | ✅ |
| 2.13 | [Web Application Architecture](../level-2-computer-systems/module-2.13-web-app-architecture.md) | Browser → DNS → TLS → HTTP → Server → Application → Database | ✅ |
| 🛠 | [**Project 3:** HTTP Server from scratch (raw TCP → HTTP parsing → node:http)](../projects/project-3-http-server/README.md) | | ✅ |
| ✔ | [Checkpoint 2](../level-2-computer-systems/checkpoint-2.md) | | ✅ |

---

## LEVEL 3 — علوم الحاسوب الأساسية (Core Computer Science)

**الهدف:** هياكل البيانات والخوارزميات والتعقيد **كأدوات حكم** لا كمواد حفظ؛ وقواعد البيانات من الصفر.

| # | Module | المحتوى | الحالة |
|---|---|---|---|
| 3.1 | [Arrays & Hash Maps (Deep)](../level-3-core-computer-science/module-3.1-arrays-hash-maps.md) | what problem, what operations, where in real software | ✅ |
| 3.2 | [Sets, Stacks, Queues](../level-3-core-computer-science/module-3.2-sets-stacks-queues.md) | call stack, task queue, dedup, undo | ✅ |
| 3.3 | [Linked Lists](../level-3-core-computer-science/module-3.3-linked-lists.md) | why they exist, when arrays fail | ✅ |
| 3.4 | [Trees](../level-3-core-computer-science/module-3.4-trees.md) | DOM, file systems, JSON, B-Trees (preview) | ✅ |
| 3.5 | [Heaps & Priority Queues](../level-3-core-computer-science/module-3.5-heaps-priority-queues.md) | schedulers, job priorities | ✅ |
| 3.6 | [Graphs](../level-3-core-computer-science/module-3.6-graphs.md) | BFS, DFS, dependencies, shortest path (conceptual) | ✅ |
| 3.7 | [Algorithmic Thinking](../level-3-core-computer-science/module-3.7-algorithmic-thinking.md) | decomposition, searching, sorting, traversal, recursion, iteration, divide & conquer | ✅ |
| 3.8 | [Big-O From Intuition](../level-3-core-computer-science/module-3.8-big-o.md) | 1 → 10 → 100 → 1000 ops; O(1), O(log n), O(n), O(n log n), O(n²) | ✅ |
| 3.9 | [Algorithms That Matter](../level-3-core-computer-science/module-3.9-algorithms-that-matter.md) | recognizing complexity, choosing structures, reducing work, tradeoffs | ✅ |
| 3.10 | [Databases From Zero](../level-3-core-computer-science/module-3.10-databases-from-zero.md) | why not files? tables, rows, columns, keys, relationships | ✅ |
| 3.11 | [SQL From Zero](../level-3-core-computer-science/module-3.11-sql-from-zero.md) | SELECT, WHERE, ORDER BY, LIMIT, JOIN, GROUP BY, INSERT, UPDATE, DELETE | ✅ |
| 3.12 | [Database Design](../level-3-core-computer-science/module-3.12-database-design.md) | User, Organization, Product, Order, OrderItem; relationships; normalization | ✅ |
| 3.13 | [Indexes](../level-3-core-computer-science/module-3.13-indexes.md) | scan vs seek, B-Tree model, EXPLAIN, tradeoffs | ✅ |
| 3.14 | [Transactions & ACID](../level-3-core-computer-science/module-3.14-transactions-acid.md) | transfer money example, crash in the middle, ACID | ✅ |
| 🛠 | [**Project 4:** Database-backed Store API (PostgreSQL, raw SQL, migrations, transactions, indexes)](../projects/project-4-db-api/README.md) | | ✅ |
| ✔ | [Checkpoint 3](../level-3-core-computer-science/checkpoint-3.md) | | ✅ |

---

## LEVEL 4 — أسس هندسة البرمجيات (Software Engineering Foundations)

**الهدف:** الانتقال من "كيف تعمل الأنظمة" إلى "كيف يبني البشر الأنظمة ويطوّرونها".

| # | Module | المحتوى | الحالة |
|---|---|---|---|
| 4.0 | [CS vs SE — The Transition](../level-4-software-engineering-foundations/module-4.0-cs-vs-se.md) | why engineering ≠ coding | ✅ |
| 4.1 | [SDLC in Detail](../level-4-software-engineering-foundations/module-4.1-sdlc.md) | Discovery → … → Evolution; iterative reality | ✅ |
| 4.2 | [Requirements](../level-4-software-engineering-foundations/module-4.2-requirements.md) | functional, non-functional, constraints, assumptions, acceptance criteria | ✅ |
| 4.3 | [User Stories & Acceptance Criteria](../level-4-software-engineering-foundations/module-4.3-user-stories-acceptance-criteria.md) | As a / I want / So that; Given / When / Then; limitations | ✅ |
| 4.4 | [Engineering Estimation](../level-4-software-engineering-foundations/module-4.4-estimation.md) | why estimates are uncertain; decomposition, relative estimation, risk | ✅ |
| 4.5 | [Software Design](../level-4-software-engineering-foundations/module-4.5-software-design.md) | requirements → architecture → design → implementation | ✅ |
| 4.6 | [Abstraction, Encapsulation, Modularity](../level-4-software-engineering-foundations/module-4.6-abstraction-encapsulation-modularity.md) | `sendEmail()` hides SMTP; boundaries | ✅ |
| 4.7 | [Coupling & Cohesion](../level-4-software-engineering-foundations/module-4.7-coupling-cohesion.md) | simple → professional examples | ✅ |
| 4.8 | [SOLID (Without Dogma)](../level-4-software-engineering-foundations/module-4.8-solid.md) | per principle: beginner explanation, bad example, refactoring, when NOT to apply | ✅ |
| 4.9 | [Design Patterns That Matter](../level-4-software-engineering-foundations/module-4.9-design-patterns.md) | Adapter, Strategy, Factory, Observer, Repository, Dependency Injection | ✅ |
| 4.10 | [Clean Code](../level-4-software-engineering-foundations/module-4.10-clean-code.md) | naming, functions, duplication, side effects, complexity, readability | ✅ |
| 4.11 | [Testing From Zero](../level-4-software-engineering-foundations/module-4.11-testing.md) | why; unit / integration / e2e; mental model Code → Expected → Test → Confidence | ✅ |
| 4.12 | [Debugging Deeply](../level-4-software-engineering-foundations/module-4.12-debugging-deeply.md) | stack traces, logs, breakpoints, profilers, network tools, DB inspection | ✅ |
| 4.13 | [Refactoring](../level-4-software-engineering-foundations/module-4.13-refactoring.md) | better structure without changing behavior | ✅ |
| 4.14 | [Legacy Code](../level-4-software-engineering-foundations/module-4.14-legacy-code.md) | repository archaeology, characterization tests, safe change | ✅ |
| 4.15 | [Technical Debt](../level-4-software-engineering-foundations/module-4.15-tech-debt.md) | debt vs bad code; managing it | ✅ |
| ✔ | [Checkpoint 4](../level-4-software-engineering-foundations/checkpoint-4.md) | | ✅ |

---

## LEVEL 5 — بناء برمجيات حقيقية (Building Real Software)

| # | Module | المحتوى | الحالة |
|---|---|---|---|
| 5.1 | [API Design](../level-5-building-real-software/module-5.1-api-design.md) | REST, resources, methods, status codes, pagination, filtering, sorting, versioning, idempotency | ✅ |
| 5.2 | [Authentication](../level-5-building-real-software/module-5.2-authentication.md) | identity, passwords & hashing, sessions, cookies, tokens, JWT, OAuth (conceptual) | ✅ |
| 5.3 | [Authorization](../level-5-building-real-software/module-5.3-authorization.md) | roles, permissions, resource ownership, multi-tenancy | ✅ |
| 5.4 | [Security From Beginner to Professional](../level-5-building-real-software/module-5.4-security.md) | threat, attacker, asset, trust boundary; least privilege, validation, secrets, encryption; XSS, CSRF, SQLi, SSRF, IDOR | ✅ |
| 5.5 | [Threat Modeling](../level-5-building-real-software/module-5.5-threat-modeling.md) | Assets → Entry points → Trust boundaries → Threats → Mitigations; STRIDE | ✅ |
| 5.6 | [Concurrency in Business Logic](../level-5-building-real-software/module-5.6-concurrency-business-logic.md) | race conditions, deadlocks, atomicity, locks, optimistic/pessimistic concurrency | ✅ |
| 5.7 | [Anatomy of a Production System](../level-5-building-real-software/module-5.7-production-anatomy.md) | Application → DB → Cache → Queue → Worker → External Services | ✅ |
| 5.8 | [Caching](../level-5-building-real-software/module-5.8-caching.md) | why, what, where, how long, invalidation | ✅ |
| 5.9 | [Queues & Background Jobs](../level-5-building-real-software/module-5.9-queues-jobs-workers.md) | producer/queue/consumer; file upload example | ✅ |
| 5.10 | [Deployment From Zero](../level-5-building-real-software/module-5.10-deployment.md) | server, process, container, environment, DNS, HTTPS, DB, LB | ✅ |
| 5.11 | [Docker](../level-5-building-real-software/module-5.11-docker-containers.md) | what problem; image, container, filesystem, network, volume | ✅ |
| 5.12 | [CI/CD](../level-5-building-real-software/module-5.12-ci-cd.md) | Code → Build → Test → Artifact → Deploy | ✅ |
| 5.13 | [Cloud (Provider-Agnostic)](../level-5-building-real-software/module-5.13-cloud-fundamentals.md) | compute, storage, database, network, LB, secrets, monitoring | ✅ |
| 🛠 | **Project 5:** [Authenticated Application](../projects/project-5-auth-app/README.md) | | ✅ |
| 🛠 | **Project 6:** [Production-style Backend](../projects/project-6-production-backend/README.md) | | ✅ |
| ✔ | [Checkpoint 5](../level-5-building-real-software/checkpoint-5.md) | | ✅ |

---

## LEVEL 6 — الهندسة الاحترافية (Professional Engineering)

| # | Module | المحتوى | الحالة |
|---|---|---|---|
| 6.1 | [Working in a Team](../level-6-professional-engineering/module-6.1-working-in-a-team.md) | tickets, issues, requirements, pull requests | ✅ |
| 6.2 | [Code Review](../level-6-professional-engineering/module-6.2-code-review.md) | correctness, security, performance, architecture, tests, maintainability | ✅ |
| 6.3 | [Design Review, RFCs, ADRs](../level-6-professional-engineering/module-6.3-design-review-rfc-adr.md) | tradeoffs, risks, constraints, alternatives | ✅ |
| 6.4 | [Engineering Communication](../level-6-professional-engineering/module-6.4-engineering-communication.md) | "Assumption / Constraint / Tradeoff / Risk / Alternative / Recommendation" | ✅ |
| 6.5 | [Documentation](../level-6-professional-engineering/module-6.5-documentation.md) | README, architecture docs, runbooks | ✅ |
| 6.6 | [Observability](../level-6-professional-engineering/module-6.6-observability.md) | logs, metrics, traces; how do I know what production is doing? | ✅ |
| 6.7 | [Incident Response](../level-6-professional-engineering/module-6.7-incident-response.md) | detect → investigate → mitigate → recover → learn; postmortems | ✅ |
| 6.8 | [Product Thinking](../level-6-professional-engineering/module-6.8-product-thinking.md) | feature ≠ requirement; user, problem, business goal, constraint, success criteria | ✅ |
| 6.9 | [Software Architecture Styles](../level-6-professional-engineering/module-6.9-architecture-styles.md) | layered, feature-based, modular monolith, microservices | ✅ |
| ✔ | [Checkpoint 6](../level-6-professional-engineering/checkpoint-6.md) | conceptual · coding · debugging · architecture + team package | ✅ |

---

## LEVEL 7 — الأنظمة المتقدمة (Advanced Systems)

| # | Module | المحتوى | الحالة |
|---|---|---|---|
| 7.1 | [Distributed Systems: 1 → 2 → 10 Servers](../level-7-advanced-systems/module-7.1-distributed-systems-1-2-10.md) | what breaks | ✅ |
| 7.2 | [Failure: Partial Failure, Timeouts, Retries, Idempotency](../level-7-advanced-systems/module-7.2-failure-timeouts-retries-idempotency.md) | duplicate messages | ✅ |
| 7.3 | [Replication, Consistency, CAP (Correctly)](../level-7-advanced-systems/module-7.3-replication-consistency-cap.md) | partitions; C vs A tradeoff; eventual consistency | ✅ |
| 7.4 | [Load Balancing & Scaling](../level-7-advanced-systems/module-7.4-load-balancing-scaling.md) | horizontal/vertical, stateless services, sticky sessions | ✅ |
| 7.5 | [Reliability Patterns](../level-7-advanced-systems/module-7.5-reliability-patterns.md) | availability, redundancy, failover, graceful degradation, circuit breakers | ✅ |
| 7.6 | [The System Design Process](../level-7-advanced-systems/module-7.6-system-design-process.md) | 7-step repeatable process | ✅ |
| 7.7 | [System Design Challenges](../level-7-advanced-systems/module-7.7-system-design-challenges.md) | URL shortener, notifications, file upload, payment workflow, chat | ✅ |
| 7.8 | [Performance Engineering](../level-7-advanced-systems/module-7.8-performance-engineering.md) | CPU, memory, network, DB, cache, serialization; "what is the bottleneck?" | ✅ |
| 7.9 | [Microservices In Depth](../level-7-advanced-systems/module-7.9-microservices-in-depth.md) | why, when they help, when they hurt | ✅ |
| 🛠 | [**Project 7:** Distributed System Exercise](../projects/project-7-distributed/README.md) | | ✅ |
| ✔ | [Checkpoint 7](../level-7-advanced-systems/checkpoint-7.md) | | ✅ |

---

## LEVEL 8 — هندسة البرمجيات في عصر الذكاء الاصطناعي (AI-Native SE)

| # | Module | المحتوى | الحالة |
|---|---|---|---|
| 8.1 | [What Changes When AI Can Generate Code?](../level-8-ai-native-engineering/module-8.1-what-changes.md) | AI vs SE | ✅ |
| 8.2 | [Vibe Coding vs Engineering](../level-8-ai-native-engineering/module-8.2-vibe-coding-vs-engineering.md) | Prompt → Code → Looks good ≠ engineering | ✅ |
| 8.3 | [AI-Assisted SDLC](../level-8-ai-native-engineering/module-8.3-ai-assisted-sdlc.md) | AI mapped onto every phase; human judgment remains responsible | ✅ |
| 8.4 | [AI Agents](../level-8-ai-native-engineering/module-8.4-ai-agents.md) | agent, tools, context, planning, execution, feedback, verification | ✅ |
| 8.5 | [Context Engineering](../level-8-ai-native-engineering/module-8.5-context-engineering.md) | repo context, architecture docs, conventions, requirements, tests, constraints | ✅ |
| 8.6 | [AI Delegation](../level-8-ai-native-engineering/module-8.6-ai-delegation.md) | vague request → structured engineering task | ✅ |
| 8.7 | [AI Verification](../level-8-ai-native-engineering/module-8.7-ai-verification.md) | compile → typecheck → tests → behavior → security → performance → architecture → human review | ✅ |
| 8.8 | [AI Failure Modes](../level-8-ai-native-engineering/module-8.8-ai-failure-modes.md) | hallucinated/outdated APIs, wrong assumptions, vulnerabilities, missing edge cases, over-abstraction | ✅ |
| 8.9 | [AI Security](../level-8-ai-native-engineering/module-8.9-ai-security.md) | prompt injection, repo instruction poisoning, malicious files, tool permissions, secrets, destructive commands | ✅ |
| 8.10 | [Human-in-the-Loop](../level-8-ai-native-engineering/module-8.10-human-in-the-loop.md) | migrations, auth, payments, security, prod deploy, destructive ops, infra | ✅ |
| 8.11 | [The AI-Era Engineering Loop](../level-8-ai-native-engineering/module-8.11-ai-era-engineering-loop.md) | UNDERSTAND → SPECIFY → DESIGN → DELEGATE → VERIFY → REVIEW → INTEGRATE → DEPLOY → OBSERVE → LEARN | ✅ |
| 🛠 | [**Project 8:** AI-assisted Engineering Project](../projects/project-8-ai-assisted/README.md) | | ✅ |
| ✔ | [Checkpoint 8](../level-8-ai-native-engineering/checkpoint-8.md) | | ✅ |

---

## LEVEL 9 — مشروع التخرج الاحترافي (Professional Capstone)

| # | Module | المحتوى | الحالة |
|---|---|---|---|
| 9.1 | [Capstone SaaS — Mode A (Human-led)](../level-9-capstone/module-9.1-capstone-mode-a.md) | full SDLC, no code until design complete | ✅ |
| 9.2 | [Capstone SaaS — Mode B (AI-assisted)](../level-9-capstone/module-9.2-capstone-mode-b.md) | student provides spec/arch/constraints/tests; AI implements; student verifies | ✅ |
| 9.3 | [Final Self-Assessment](../level-9-capstone/module-9.3-final-self-assessment.md) | 16 questions | ✅ |
| 9.4 | [Final Professional Challenge](../level-9-capstone/module-9.4-final-professional-challenge.md) | new problem ([final-challenge.md](../level-9-capstone/final-challenge.md)), 15 independent steps, no solution given | ✅ |
| 🛠 | [**Capstone:** SaaS (Mode A + Mode B)](../projects/capstone/README.md) | | ✅ |

---

## التحديات المستمرة (Cross-cutting Challenges)

موجودة داخل كل module، ومفهرسة في [`../challenges/`](../challenges/):

| النوع | Beginner | Intermediate | Advanced | Professional |
|---|---|---|---|---|
| **Debugging** | syntax, logic, type bugs | API, DB, async bugs | race condition, cache, authz bugs | distributed failure, latency, partial outage |
| **Architecture** | 1 server, 1 DB, 100 users | 100,000 users | 1M users | multi-region, compliance |
| **Code Review** | flawed function | flawed module | flawed service | flawed system change |
| **System Design** | — | URL shortener | notifications, file upload | payments, chat |
| **Security** | — | IDOR, leaked stack traces | token reuse, tenant leak | executable uploads, SSRF |
| **Failure** | — | DB slow | Redis down, email provider down | duplicate webhook, worker crash, network timeout |
| **Performance** | — | slow loop | slow query | serialization, cache stampede |
