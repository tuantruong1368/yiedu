"""Functional local product API. Every private resource is checked against membership/owner."""

import hashlib
import time
import uuid

from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.encoders import jsonable_encoder
from fastapi.responses import HTMLResponse
from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.exc import IntegrityError

from yiedu.auth import (
    DB,
    UserDep,
    digest_token,
    hash_password,
    issue_session,
    require_member,
    verify_password,
)
from yiedu.catalog import BUILTINS, TEMPLATES, initial_page
from yiedu.config import get_settings
from yiedu.extensions.manifest import ExtensionManifest
from yiedu.models import (
    AuditEvent,
    AuthSession,
    Completion,
    Course,
    Enrollment,
    LearningPath,
    Lesson,
    Membership,
    PackageListing,
    Tenant,
    TenantExtension,
    User,
    Workspace,
)
from yiedu.product_schemas import (
    CourseWrite,
    Credentials,
    ExtensionToggle,
    LessonWrite,
    ListingWrite,
    MemberWrite,
    PathWrite,
    Register,
    WorkspaceCreate,
    WorkspaceUpdate,
)
from yiedu.site_render import render_site
from yiedu.template_library import curriculum, get_template, lessons_for
from yiedu.template_seed import seed_template

router = APIRouter(prefix="/api/v1", tags=["product"])
RESERVED = {"www", "api", "admin", "auth", "administrator", "marketplace", "developer", "updates"}
_attempts: dict[str, list[float]] = {}


def encode(row):
    return jsonable_encoder({c.name: getattr(row, c.name) for c in row.__table__.columns})


def public_user(user):
    return {"id": str(user.id), "name": user.name, "email": user.email}


def commit(db):
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Dữ liệu đã tồn tại hoặc xung đột. Vui lòng tải lại.") from None


def get_tenant(db, tenant_id):
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(404, "Không tìm thấy hệ thống")
    return tenant


def get_course(db, tenant_id, course_id):
    course = db.scalar(select(Course).where(Course.id == course_id, Course.tenant_id == tenant_id))
    if not course:
        raise HTTPException(404, "Không tìm thấy khóa học")
    return course


def get_workspace(db, user, workspace_id, lock=False):
    statement = select(Workspace).where(Workspace.id == workspace_id, Workspace.owner_id == user.id)
    if lock:
        statement = statement.with_for_update()
    row = db.scalar(statement)
    if not row:
        raise HTTPException(404, "Không tìm thấy bản thiết kế")
    return row


def check_slug(slug):
    if slug in RESERVED:
        raise HTTPException(422, "Tên miền này dành riêng cho nền tảng")


def audit(db, tenant_id, actor_id, event_type, payload=None):
    db.add(
        AuditEvent(
            tenant_id=tenant_id, actor_id=actor_id, event_type=event_type, payload=payload or {}
        )
    )


def throttle(request, email):
    key = hashlib.sha256(
        f"{request.client.host if request.client else 'local'}:{email}".encode()
    ).hexdigest()
    now = time.monotonic()
    recent = [t for t in _attempts.get(key, []) if t > now - 60]
    if len(recent) >= 10:
        raise HTTPException(429, "Thử lại sau một phút")
    if len(_attempts) > 10000:
        _attempts.clear()
    _attempts[key] = [*recent, now]


@router.post("/auth/register", status_code=201)
def register(payload: Register, request: Request, response: Response, db: DB):
    if not get_settings().registration_enabled:
        raise HTTPException(403, "Đăng ký nền tảng đang đóng; dùng trang học viên của hệ thống")
    throttle(request, payload.email)
    user = User(
        email=payload.email, name=payload.name, password_hash=hash_password(payload.password)
    )
    db.add(user)
    commit(db)
    token = issue_session(db, user, response)
    return {"user": public_user(user), **({"token": token} if payload.client == "native" else {})}


@router.post("/auth/login")
def login(payload: Credentials, request: Request, response: Response, db: DB):
    throttle(request, payload.email)
    user = db.scalar(select(User).where(User.email == payload.email))
    valid = verify_password(
        payload.password, user.password_hash if user else hash_password("dummy-password")
    )
    if not user or not valid:
        raise HTTPException(401, "Email hoặc mật khẩu không đúng")
    token = issue_session(db, user, response)
    return {"user": public_user(user), **({"token": token} if payload.client == "native" else {})}


@router.post("/auth/logout")
def logout(request: Request, response: Response, db: DB):
    header = request.headers.get("authorization", "")
    token = header[7:] if header.startswith("Bearer ") else request.cookies.get("yiedu_session")
    if token:
        db.execute(delete(AuthSession).where(AuthSession.token_hash == digest_token(token)))
        db.commit()
    response.delete_cookie("yiedu_session", path="/")
    return {"ok": True}


@router.get("/auth/me")
def me(user: UserDep):
    return public_user(user)


@router.get("/catalog/templates")
def templates():
    return TEMPLATES


@router.get("/catalog/templates/{template_id}")
def template_preview(template_id: str):
    try:
        get_template(template_id)
        return {
            "template": next(t for t in TEMPLATES if t["id"] == template_id),
            "document": initial_page(template_id),
            "courses": curriculum(template_id),
        }
    except KeyError:
        raise HTTPException(404, "Template not found") from None


@router.get("/catalog/templates/{template_id}/courses/{module_id}")
def template_lessons(template_id: str, module_id: str):
    try:
        if module_id not in get_template(template_id)["module_ids"]:
            raise KeyError(module_id)
        return lessons_for(module_id)
    except KeyError:
        raise HTTPException(404, "Learning unit not found") from None


@router.get("/me/dashboard")
def dashboard(user: UserDep, db: DB):
    memberships = db.execute(
        select(Membership, Tenant).join(Tenant).where(Membership.user_id == user.id)
    ).all()
    return {
        "user": public_user(user),
        "sites": [{**encode(t), "role": m.role} for m, t in memberships],
        "workspaces": [
            encode(w) for w in db.scalars(select(Workspace).where(Workspace.owner_id == user.id))
        ],
    }


@router.post("/workspaces", status_code=201)
def create_workspace(payload: WorkspaceCreate, user: UserDep, db: DB):
    if get_settings().instance_mode == "standalone":
        raise HTTPException(403, "Bản độc lập chỉ vận hành hệ thống đã nhập")
    check_slug(payload.slug)
    row = Workspace(
        owner_id=user.id,
        **payload.model_dump(),
        data=initial_page(payload.template_id, payload.name),
    )
    db.add(row)
    commit(db)
    return encode(row)


@router.get("/workspaces/{workspace_id}")
def read_workspace(workspace_id: uuid.UUID, user: UserDep, db: DB):
    return encode(get_workspace(db, user, workspace_id))


@router.put("/workspaces/{workspace_id}")
def save_workspace(workspace_id: uuid.UUID, payload: WorkspaceUpdate, user: UserDep, db: DB):
    row = get_workspace(db, user, workspace_id, lock=True)
    if row.revision != payload.revision:
        raise HTTPException(409, "Bản thiết kế đã thay đổi ở cửa sổ khác. Vui lòng tải lại.")
    check_slug(payload.slug)
    if row.tenant_id and payload.slug != get_tenant(db, row.tenant_id).slug:
        raise HTTPException(422, "Chưa hỗ trợ đổi domain sau xuất bản")
    row.data = payload.data
    row.name = payload.name
    row.slug = payload.slug
    row.revision += 1
    commit(db)
    return encode(row)


@router.post("/workspaces/{workspace_id}/publish")
def publish_workspace(workspace_id: uuid.UUID, user: UserDep, db: DB):
    row = get_workspace(db, user, workspace_id, lock=True)
    check_slug(row.slug)
    WorkspaceUpdate(name=row.name, slug=row.slug, data=row.data, revision=row.revision)
    template = next(t for t in TEMPLATES if t["id"] == row.template_id)
    creating_tenant = row.tenant_id is None
    if row.tenant_id:
        require_member(db, user, row.tenant_id, ["owner", "admin"])
        tenant = get_tenant(db, row.tenant_id)
    else:
        tenant = Tenant(
            slug=row.slug,
            name=row.name,
            branding={"color": template["color"]},
            template_id=row.template_id,
        )
        db.add(tenant)
        try:
            db.flush()
        except IntegrityError:
            db.rollback()
            raise HTTPException(409, "Tên miền đã được sử dụng") from None
        db.add(Membership(tenant_id=tenant.id, user_id=user.id, role="owner"))
        row.tenant_id = tenant.id
    if creating_tenant and row.include_sample_content:
        seed_template(db, tenant)
    tenant.name = row.name
    tenant.published_page = row.data
    if row.data.get("schema_version") == "2.0":
        tenant.branding = row.data["branding"]
    audit(db, tenant.id, user.id, "site.published", {"revision": row.revision})
    commit(db)
    return {"tenant": encode(tenant), "workspace": encode(row)}


@router.get("/sites/{slug}")
def public_site(slug: str, db: DB):
    row = db.scalar(select(Tenant).where(Tenant.slug == slug))
    if not row:
        raise HTTPException(404, "Không tìm thấy website")
    courses = db.scalars(
        select(Course).where(Course.tenant_id == row.id, Course.published.is_(True))
    )
    paths = db.scalars(select(LearningPath).where(LearningPath.tenant_id == row.id))
    return {
        "tenant": encode(row),
        "courses": [encode(c) for c in courses],
        "paths": [encode(p) for p in paths],
    }


@router.post("/sites/{slug}/join")
def join_site(slug: str, user: UserDep, db: DB):
    tenant = db.scalar(select(Tenant).where(Tenant.slug == slug))
    if not tenant:
        raise HTTPException(404, "Không tìm thấy website")
    member = db.scalar(
        select(Membership).where(Membership.tenant_id == tenant.id, Membership.user_id == user.id)
    )
    if not member:
        member = Membership(tenant_id=tenant.id, user_id=user.id, role="learner")
        db.add(member)
        commit(db)
    return {"tenant_id": str(tenant.id), "role": member.role}


@router.get("/sites/{slug}/render", response_class=HTMLResponse)
def published_document(slug: str, db: DB, page: str = "", locale: str = "vi"):
    tenant = db.scalar(select(Tenant).where(Tenant.slug == slug))
    if not tenant or tenant.published_page.get("schema_version") != "2.0":
        raise HTTPException(404, "Published page not found")
    if locale not in {"vi", "en"} or len(page) > 63:
        raise HTTPException(422, "Invalid page or locale")
    courses = [
        encode(row)
        for row in db.scalars(
            select(Course)
            .where(Course.tenant_id == tenant.id, Course.published.is_(True))
            .order_by(Course.created_at)
        )
    ]
    try:
        html, csp = render_site(tenant.published_page, courses, slug, page, locale)
    except KeyError:
        raise HTTPException(404, "Published page not found") from None
    return HTMLResponse(
        html,
        headers={
            "Cache-Control": "no-store",
            "Content-Security-Policy": csp,
            "X-Content-Type-Options": "nosniff",
        },
    )


@router.get("/runtime/{tenant_id}/overview")
def overview(tenant_id: uuid.UUID, user: UserDep, db: DB):
    member = require_member(db, user, tenant_id)
    tenant = get_tenant(db, tenant_id)
    courses = select(Course).where(Course.tenant_id == tenant_id).order_by(Course.created_at)
    if member.role == "learner":
        courses = courses.where(Course.published.is_(True))
    lessons = (
        select(Lesson)
        .join(Course)
        .where(Lesson.tenant_id == tenant_id)
        .order_by(Lesson.position, Lesson.id)
    )
    if member.role == "learner":
        enrolled = select(Enrollment.course_id).where(
            Enrollment.tenant_id == tenant_id, Enrollment.user_id == user.id
        )
        lessons = lessons.where(Course.published.is_(True), Course.id.in_(enrolled))
    # Return metadata only here. Lesson body is served after enrollment/prerequisite checks.
    lesson_rows = [
        {
            **{
                k: v
                for k, v in encode(lesson).items()
                if k not in {"content", "video_url", "document", "translations"}
            },
            "localized_titles": {
                lang: translation.get("title", "")
                for lang, translation in lesson.translations.items()
            },
        }
        for lesson in db.scalars(lessons)
    ]
    completed = list(
        db.scalars(
            select(Completion.lesson_id).where(
                Completion.tenant_id == tenant_id, Completion.user_id == user.id
            )
        )
    )
    enrolled_ids = list(
        db.scalars(
            select(Enrollment.course_id).where(
                Enrollment.tenant_id == tenant_id, Enrollment.user_id == user.id
            )
        )
    )
    members = []
    if member.role in ["owner", "admin"]:
        rows = db.execute(
            select(Membership, User).join(User).where(Membership.tenant_id == tenant_id)
        ).all()
        members = [{**public_user(u), "role": m.role} for m, u in rows]
    events = []
    if member.role in ["owner", "admin", "instructor"]:
        events = [
            encode(e)
            for e in db.scalars(
                select(AuditEvent)
                .where(AuditEvent.tenant_id == tenant_id)
                .order_by(AuditEvent.created_at.desc())
                .limit(50)
            )
        ]
    return {
        "tenant": encode(tenant),
        "role": member.role,
        "courses": [encode(c) for c in db.scalars(courses)],
        "lessons": lesson_rows,
        "paths": [
            encode(p)
            for p in db.scalars(select(LearningPath).where(LearningPath.tenant_id == tenant_id))
        ],
        "completed": [str(x) for x in completed],
        "enrolled": [str(x) for x in enrolled_ids],
        "members": members,
        "extensions": [
            encode(e)
            for e in db.scalars(
                select(TenantExtension).where(TenantExtension.tenant_id == tenant_id)
            )
        ],
        "events": events,
    }


@router.post("/runtime/{tenant_id}/courses", status_code=201)
def add_course(tenant_id: uuid.UUID, payload: CourseWrite, user: UserDep, db: DB):
    require_member(db, user, tenant_id, ["owner", "admin", "instructor"])
    row = Course(tenant_id=tenant_id, **payload.model_dump())
    db.add(row)
    audit(db, tenant_id, user.id, "course.created")
    commit(db)
    return encode(row)


@router.put("/runtime/{tenant_id}/courses/{course_id}")
def edit_course(
    tenant_id: uuid.UUID, course_id: uuid.UUID, payload: CourseWrite, user: UserDep, db: DB
):
    require_member(db, user, tenant_id, ["owner", "admin", "instructor"])
    row = get_course(db, tenant_id, course_id)
    for key, value in payload.model_dump().items():
        setattr(row, key, value)
    audit(db, tenant_id, user.id, "course.updated", {"course_id": str(course_id)})
    commit(db)
    return encode(row)


@router.post("/runtime/{tenant_id}/courses/{course_id}/lessons", status_code=201)
def add_lesson(
    tenant_id: uuid.UUID, course_id: uuid.UUID, payload: LessonWrite, user: UserDep, db: DB
):
    require_member(db, user, tenant_id, ["owner", "admin", "instructor"])
    get_course(db, tenant_id, course_id)
    row = Lesson(
        tenant_id=tenant_id, course_id=course_id, **payload.model_dump(exclude={"revision"})
    )
    db.add(row)
    commit(db)
    return encode(row)


def require_enrollment(db, user, tenant_id, course):
    enrollment = db.scalar(
        select(Enrollment).where(
            Enrollment.tenant_id == tenant_id,
            Enrollment.user_id == user.id,
            Enrollment.course_id == course.id,
        )
    )
    if not enrollment or not course.published:
        raise HTTPException(403, "Bạn cần ghi danh vào khóa học đã xuất bản")
    for path in db.scalars(select(LearningPath).where(LearningPath.tenant_id == tenant_id)):
        ids = path.course_ids
        if str(course.id) in ids:
            for previous in ids[: ids.index(str(course.id))]:
                lesson_ids = set(
                    db.scalars(
                        select(Lesson.id).where(
                            Lesson.tenant_id == tenant_id, Lesson.course_id == uuid.UUID(previous)
                        )
                    )
                )
                done = set(
                    db.scalars(
                        select(Completion.lesson_id).where(
                            Completion.tenant_id == tenant_id, Completion.user_id == user.id
                        )
                    )
                )
                if not lesson_ids or not lesson_ids.issubset(done):
                    raise HTTPException(
                        403, "Hoàn thành khóa học trước trong lộ trình để mở bước này"
                    )


@router.get("/runtime/{tenant_id}/lessons/{lesson_id}")
def read_lesson(tenant_id: uuid.UUID, lesson_id: uuid.UUID, user: UserDep, db: DB):
    member = require_member(db, user, tenant_id)
    row = db.scalar(select(Lesson).where(Lesson.tenant_id == tenant_id, Lesson.id == lesson_id))
    if not row:
        raise HTTPException(404, "Không tìm thấy bài học")
    course = get_course(db, tenant_id, row.course_id)
    if member.role == "learner":
        require_enrollment(db, user, tenant_id, course)
    return encode(row)


@router.put("/runtime/{tenant_id}/lessons/{lesson_id}")
def edit_lesson(
    tenant_id: uuid.UUID, lesson_id: uuid.UUID, payload: LessonWrite, user: UserDep, db: DB
):
    require_member(db, user, tenant_id, ["owner", "admin", "instructor"])
    row = db.scalar(
        select(Lesson)
        .where(Lesson.tenant_id == tenant_id, Lesson.id == lesson_id)
        .with_for_update()
    )
    if not row:
        raise HTTPException(404, "Không tìm thấy bài học")
    if payload.revision is not None and payload.revision != row.revision:
        raise HTTPException(409, "Bài học đã thay đổi. Tải lại trước khi lưu / Revision conflict")
    for key, value in payload.model_dump(exclude={"revision"}).items():
        setattr(row, key, value)
    row.revision += 1
    commit(db)
    return encode(row)


@router.post("/runtime/{tenant_id}/courses/{course_id}/enroll")
def enroll(tenant_id: uuid.UUID, course_id: uuid.UUID, user: UserDep, db: DB):
    require_member(db, user, tenant_id)
    course = get_course(db, tenant_id, course_id)
    if not course.published:
        raise HTTPException(403, "Khóa học chưa xuất bản")
    db.execute(
        insert(Enrollment)
        .values(id=uuid.uuid4(), tenant_id=tenant_id, user_id=user.id, course_id=course_id)
        .on_conflict_do_nothing(index_elements=["tenant_id", "user_id", "course_id"])
    )
    commit(db)
    return {"ok": True}


@router.post("/runtime/{tenant_id}/lessons/{lesson_id}/complete")
def complete_lesson(tenant_id: uuid.UUID, lesson_id: uuid.UUID, user: UserDep, db: DB):
    require_member(db, user, tenant_id)
    row = db.scalar(select(Lesson).where(Lesson.tenant_id == tenant_id, Lesson.id == lesson_id))
    if not row:
        raise HTTPException(404, "Không tìm thấy bài học")
    require_enrollment(db, user, tenant_id, get_course(db, tenant_id, row.course_id))
    inserted = db.scalar(
        insert(Completion)
        .values(id=uuid.uuid4(), tenant_id=tenant_id, user_id=user.id, lesson_id=lesson_id)
        .on_conflict_do_nothing(index_elements=["tenant_id", "user_id", "lesson_id"])
        .returning(Completion.id)
    )
    if inserted and db.scalar(
        select(TenantExtension).where(
            TenantExtension.tenant_id == tenant_id,
            TenantExtension.package_id == "yiedu.activity-log",
            TenantExtension.enabled.is_(True),
        )
    ):
        audit(db, tenant_id, user.id, "learning.lesson.completed", {"lesson_id": str(lesson_id)})
    commit(db)
    return {"ok": True}


def validate_learning_path(db, tenant_id, payload, excluding=None):
    # Serialize path graph edits within a tenant, including concurrent create requests.
    db.execute(select(Tenant.id).where(Tenant.id == tenant_id).with_for_update())
    ids = set(payload.course_ids)
    found = set(
        db.scalars(select(Course.id).where(Course.tenant_id == tenant_id, Course.id.in_(ids)))
    )
    if ids != found:
        raise HTTPException(422, "Lộ trình có khóa học không thuộc tenant")
    # Across paths, consistent global order prevents cyclic prerequisites.
    edges = {}
    all_paths = [
        p.course_ids
        for p in db.scalars(select(LearningPath).where(LearningPath.tenant_id == tenant_id))
        if p.id != excluding
    ]
    all_paths.append([str(x) for x in payload.course_ids])
    for sequence in all_paths:
        for a, b in zip(sequence, sequence[1:]):
            edges.setdefault(a, set()).add(b)
    active, visited = set(), set()

    def visit(node):
        if node in active:
            raise HTTPException(422, "Điều kiện tiên quyết giữa các lộ trình có vòng lặp")
        if node in visited:
            return
        active.add(node)
        for target in edges.get(node, set()):
            visit(target)
        active.remove(node)
        visited.add(node)

    for node in list(edges):
        visit(node)


@router.post("/runtime/{tenant_id}/paths", status_code=201)
def add_path(tenant_id: uuid.UUID, payload: PathWrite, user: UserDep, db: DB):
    require_member(db, user, tenant_id, ["owner", "admin", "instructor"])
    validate_learning_path(db, tenant_id, payload)
    row = LearningPath(
        tenant_id=tenant_id, title=payload.title, course_ids=[str(x) for x in payload.course_ids]
    )
    db.add(row)
    commit(db)
    return encode(row)


@router.post("/runtime/{tenant_id}/members")
def set_member(tenant_id: uuid.UUID, payload: MemberWrite, user: UserDep, db: DB):
    require_member(db, user, tenant_id, ["owner"])
    target = db.scalar(select(User).where(User.email == payload.email.strip().lower()))
    if not target:
        raise HTTPException(404, "Người dùng cần đăng ký tài khoản trước")
    row = db.scalar(
        select(Membership).where(Membership.tenant_id == tenant_id, Membership.user_id == target.id)
    )
    if row and row.role == "owner":
        raise HTTPException(422, "Không thay đổi owner bằng thao tác này")
    if row:
        row.role = payload.role
    else:
        db.add(Membership(tenant_id=tenant_id, user_id=target.id, role=payload.role))
    audit(
        db,
        tenant_id,
        user.id,
        "membership.updated",
        {"user_id": str(target.id), "role": payload.role},
    )
    commit(db)
    return {"ok": True}


@router.get("/catalog/extensions")
def extension_catalog():
    return BUILTINS


@router.put("/runtime/{tenant_id}/extensions/{package_id}")
def toggle_extension(
    tenant_id: uuid.UUID, package_id: str, payload: ExtensionToggle, user: UserDep, db: DB
):
    require_member(db, user, tenant_id, ["owner", "admin"])
    if package_id not in {p["package_id"] for p in BUILTINS}:
        raise HTTPException(
            422, "Chỉ hỗ trợ extension first-party đã tích hợp; không chạy code ngoài"
        )
    row = db.scalar(
        select(TenantExtension).where(
            TenantExtension.tenant_id == tenant_id, TenantExtension.package_id == package_id
        )
    )
    if not row:
        row = TenantExtension(tenant_id=tenant_id, package_id=package_id, enabled=payload.enabled)
        db.add(row)
    else:
        row.enabled = payload.enabled
    audit(
        db,
        tenant_id,
        user.id,
        "extension.configured",
        {"package_id": package_id, "enabled": payload.enabled},
    )
    commit(db)
    return encode(row)


@router.get("/runtime/{tenant_id}/courses/{course_id}/certificate")
def certificate(tenant_id: uuid.UUID, course_id: uuid.UUID, user: UserDep, db: DB):
    require_member(db, user, tenant_id)
    course = get_course(db, tenant_id, course_id)
    require_enrollment(db, user, tenant_id, course)
    enabled = db.scalar(
        select(TenantExtension).where(
            TenantExtension.tenant_id == tenant_id,
            TenantExtension.package_id == "yiedu.certificates",
            TenantExtension.enabled.is_(True),
        )
    )
    lessons = set(
        db.scalars(
            select(Lesson.id).where(Lesson.tenant_id == tenant_id, Lesson.course_id == course_id)
        )
    )
    done = set(
        db.scalars(
            select(Completion.lesson_id).where(
                Completion.tenant_id == tenant_id, Completion.user_id == user.id
            )
        )
    )
    if not enabled or not lessons or not lessons.issubset(done):
        raise HTTPException(403, "Chưa đủ điều kiện nhận chứng nhận")
    return {
        "learner": user.name,
        "course": course.title,
        "school": get_tenant(db, tenant_id).name,
        "reference": hashlib.sha256(f"{tenant_id}:{user.id}:{course_id}".encode()).hexdigest()[:16],
    }


@router.get("/developer/packages")
def my_packages(user: UserDep, db: DB):
    return [
        encode(p)
        for p in db.scalars(select(PackageListing).where(PackageListing.seller_id == user.id))
    ]


@router.post("/developer/packages", status_code=201)
def submit_package(payload: ListingWrite, user: UserDep, db: DB):
    if get_settings().instance_mode == "standalone":
        raise HTTPException(403, "Developer portal thuộc nền tảng YiEdu")
    try:
        manifest = ExtensionManifest.model_validate(payload.manifest)
    except ValueError as exc:
        raise HTTPException(422, "Manifest không hợp lệ") from exc
    row = PackageListing(
        seller_id=user.id,
        package_id=manifest.package_id,
        manifest=manifest.model_dump(),
        description=payload.description,
    )
    db.add(row)
    commit(db)
    return encode(row)


@router.get("/marketplace")
def marketplace(db: DB):
    return [
        encode(p)
        for p in db.scalars(select(PackageListing).where(PackageListing.status == "approved"))
    ]


@router.get("/runtime/{tenant_id}/updates")
def update_status(tenant_id: uuid.UUID, user: UserDep, db: DB):
    require_member(db, user, tenant_id, ["owner", "admin"])
    return {
        "current_version": "0.7.0",
        "configured": False,
        "message": (
            "Chưa cấu hình release registry và trust key. Không có bản cập nhật được xác minh."
        ),
    }


@router.get("/runtime/{tenant_id}/export")
def export_tenant(tenant_id: uuid.UUID, user: UserDep, db: DB):
    require_member(db, user, tenant_id, ["owner"])
    from yiedu.portable import create_export

    audit(db, tenant_id, user.id, "export.created")
    commit(db)
    content = create_export(db, get_tenant(db, tenant_id))
    return Response(
        content,
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="yiedu-{tenant_id}.zip"',
            "Cache-Control": "no-store",
        },
    )


@router.get("/instance")
def instance_info(db: DB):
    mode = get_settings().instance_mode
    tenant = db.scalar(select(Tenant)) if mode == "standalone" else None
    return {"mode": mode, "version": "0.7.0", "tenant": encode(tenant) if tenant else None}


@router.put("/runtime/{tenant_id}/paths/{path_id}")
def edit_path(tenant_id: uuid.UUID, path_id: uuid.UUID, payload: PathWrite, user: UserDep, db: DB):
    require_member(db, user, tenant_id, ["owner", "admin", "instructor"])
    row = db.scalar(
        select(LearningPath)
        .where(LearningPath.tenant_id == tenant_id, LearningPath.id == path_id)
        .with_for_update()
    )
    if not row:
        raise HTTPException(404, "Không tìm thấy lộ trình")
    validate_learning_path(db, tenant_id, payload, excluding=path_id)
    row.title = payload.title
    row.course_ids = [str(x) for x in payload.course_ids]
    row.revision += 1
    audit(db, tenant_id, user.id, "path.updated", {"path_id": str(path_id)})
    commit(db)
    return encode(row)


@router.delete("/runtime/{tenant_id}/paths/{path_id}")
def delete_path(tenant_id: uuid.UUID, path_id: uuid.UUID, user: UserDep, db: DB):
    require_member(db, user, tenant_id, ["owner", "admin", "instructor"])
    row = db.scalar(
        select(LearningPath).where(LearningPath.tenant_id == tenant_id, LearningPath.id == path_id)
    )
    if not row:
        raise HTTPException(404, "Không tìm thấy lộ trình")
    db.delete(row)
    audit(db, tenant_id, user.id, "path.deleted", {"path_id": str(path_id)})
    commit(db)
    return {"ok": True}


@router.delete("/runtime/{tenant_id}/lessons/{lesson_id}")
def delete_lesson(tenant_id: uuid.UUID, lesson_id: uuid.UUID, user: UserDep, db: DB):
    require_member(db, user, tenant_id, ["owner", "admin", "instructor"])
    row = db.scalar(select(Lesson).where(Lesson.tenant_id == tenant_id, Lesson.id == lesson_id))
    if not row:
        raise HTTPException(404, "Không tìm thấy bài học")
    db.execute(
        delete(Completion).where(
            Completion.tenant_id == tenant_id, Completion.lesson_id == lesson_id
        )
    )
    db.delete(row)
    audit(db, tenant_id, user.id, "lesson.deleted", {"lesson_id": str(lesson_id)})
    commit(db)
    return {"ok": True}


@router.delete("/runtime/{tenant_id}/courses/{course_id}")
def delete_course(tenant_id: uuid.UUID, course_id: uuid.UUID, user: UserDep, db: DB):
    require_member(db, user, tenant_id, ["owner", "admin", "instructor"])
    row = get_course(db, tenant_id, course_id)
    paths = db.scalars(select(LearningPath).where(LearningPath.tenant_id == tenant_id))
    if any(str(course_id) in path.course_ids for path in paths):
        raise HTTPException(409, "Bỏ khóa học khỏi lộ trình trước khi xóa")
    lesson_ids = select(Lesson.id).where(
        Lesson.tenant_id == tenant_id, Lesson.course_id == course_id
    )
    db.execute(
        delete(Completion).where(
            Completion.tenant_id == tenant_id, Completion.lesson_id.in_(lesson_ids)
        )
    )
    db.execute(
        delete(Enrollment).where(
            Enrollment.tenant_id == tenant_id, Enrollment.course_id == course_id
        )
    )
    db.execute(delete(Lesson).where(Lesson.tenant_id == tenant_id, Lesson.course_id == course_id))
    db.delete(row)
    audit(db, tenant_id, user.id, "course.deleted", {"course_id": str(course_id)})
    commit(db)
    return {"ok": True}
