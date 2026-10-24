import {mobileTranslator} from "./i18n";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import { useVideoPlayer, VideoView } from "expo-video";
type Session = { base: string; token: string };
function LessonVideo({ url }: { url: string }) {
  const player = useVideoPlayer(url);
  return (
    <VideoView
      player={player}
      style={{ width: "100%", height: 220, borderRadius: 12 }}
      fullscreenOptions={{ enable: true }}
    />
  );
}
export default function App() {
 const [locale,setLocale]=useState<"vi"|"en">("vi"); const tr=mobileTranslator(locale);
 useEffect(()=>{SecureStore.getItemAsync("yiedu.locale").then(v=>{if(v==="en")setLocale(v)})},[]);
  const [session, setSession] = useState<Session | null>(null),
    [base, setBase] = useState(process.env.EXPO_PUBLIC_API_URL || ""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [dashboard, setDashboard] = useState<any>(null),
    [school, setSchool] = useState<any>(null),
    [lesson, setLesson] = useState<any>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function request(
    path: string,
    method = "GET",
    body?: any,
    auth = session,
  ) {
    const res = await fetch(auth!.base + "/api/v1" + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(auth?.token ? { Authorization: "Bearer " + auth.token } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await res.json();
    if (!res.ok)
      throw new Error(
        typeof data.detail === "string" ? data.detail : tr("Dữ liệu không hợp lệ"),
      );
    return data;
  }
  async function perform(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    SecureStore.getItemAsync("yiedu.session").then(async (raw) => {
      if (raw) {
        const saved = JSON.parse(raw);
        setSession(saved);
        try {
          setDashboard(await request("/me/dashboard", "GET", undefined, saved));
        } catch {
          await SecureStore.deleteItemAsync("yiedu.session");
          setSession(null);
        }
      }
    });
  }, []);
  async function login() {
    const origin = new URL(base.trim());
    if (
      origin.username ||
      origin.password ||
      origin.pathname !== "/" ||
      origin.search ||
      origin.hash
    )
      throw new Error(tr("Nhập origin máy chủ, ví dụ https://api.example.com"));
    if (
      origin.protocol !== "https:" &&
      !(
        process.env.EXPO_PUBLIC_ALLOW_HTTP_DEV === "true" &&
        origin.protocol === "http:"
      )
    )
      throw new Error(tr("Cần HTTPS; HTTP chỉ bật riêng cho phát triển."));
    const trusted = { base: origin.origin, token: "" };
    const data = await request(
      "/auth/login",
      "POST",
      { email, password, client: "native" },
      trusted,
    );
    const next = { ...trusted, token: data.token };
    await SecureStore.setItemAsync("yiedu.session", JSON.stringify(next));
    setSession(next);
    setPassword("");
    setDashboard(await request("/me/dashboard", "GET", undefined, next));
  }
  async function openSchool(id: string) {
    setSchool(await request("/runtime/" + id + "/overview"));
    setLesson(null);
  }
  async function logout() {
    try {
      await request("/auth/logout", "POST");
    } catch {}
    await SecureStore.deleteItemAsync("yiedu.session");
    setSession(null);
    setSchool(null);
    setDashboard(null);
  }
  const button = (label: string, fn: () => void, secondary = false) => (
    <TouchableOpacity
      disabled={busy}
      style={[s.button, secondary && s.secondary]}
      onPress={fn}
    >
      <Text style={[s.buttonText, secondary && { color: "#215d4c" }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style="dark" /><TouchableOpacity onPress={()=>{const next=locale==="vi"?"en":"vi";setLocale(next);SecureStore.setItemAsync("yiedu.locale",next)}}><Text style={s.link}>Tiếng Việt / English</Text></TouchableOpacity>
      <ScrollView contentContainerStyle={s.page}>
        <View style={s.top}>
          <Text style={s.brand}>
            {school?.tenant.name||"YiEdu"}
          </Text>
          {session && (
            <TouchableOpacity onPress={() => perform(logout)}>
              <Text style={s.link}>{tr("Đăng xuất")}</Text>
            </TouchableOpacity>
          )}
        </View>
        {!session ? (
          <>
            <Text style={s.kicker}>{tr("KHÔNG GIAN HỌC TẬP CỦA BẠN")}</Text>
            <Text style={s.title}>{tr("Học hôm nay.")}{`\n`}{tr("Tiến xa ngày mai.")}</Text>
            <Text style={s.muted}>{tr("Dùng tài khoản đã đăng ký tại website tenant. Nhập máy chủ tin cậy; token được lưu riêng cho máy chủ đó.")}</Text>
            <View style={s.panel}>
              <Text style={s.label}>{tr("Máy chủ API")}</Text>
              <TextInput
                style={s.input}
                value={base}
                onChangeText={setBase}
                placeholder="https://api.yiedu.vn"
                autoCapitalize="none"
                keyboardType="url"
              />
              <Text style={s.label}>Email</Text>
              <TextInput
                style={s.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="ban@example.com"
              />
              <Text style={s.label}>{tr("Mật khẩu")}</Text>
              <TextInput
                style={s.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              {button(tr("Đăng nhập →"), () => perform(login))}
            </View>
          </>
        ) : !school ? (
          <>
            <Text style={s.kicker}>{tr("CHÀO MỪNG TRỞ LẠI")}</Text>
            <Text style={s.title}>{tr("Xin chào,")}{`\n`}
              {dashboard?.user.name}.
            </Text>
            <Text style={s.muted}>{tr("Chọn hệ thống để tiếp tục hành trình học tập.")}</Text>
            {dashboard?.sites.map((site: any) => (
              <TouchableOpacity
                key={site.id}
                style={s.panel}
                onPress={() => perform(() => openSchool(site.id))}
              >
                <Text style={s.cardTitle}>{site.name}</Text>
                <Text style={s.link}>{site.role}{tr("· Vào học →")}</Text>
              </TouchableOpacity>
            ))}
            {dashboard?.sites.length === 0 && (
              <Text style={s.muted}>{tr("Chưa tham gia hệ thống nào. Tham gia tại website tenant trước.")}</Text>
            )}
          </>
        ) : lesson ? (
          <>
            {button(tr("← Khóa học"), () => setLesson(null), true)}
            <Text style={s.kicker}>{tr("BÀI HỌC")}</Text>
            <Text style={s.title}>{lesson.translations?.[locale]?.title||lesson.title}</Text>
            {lesson.video_url && <LessonVideo url={lesson.video_url} />}
            <View style={s.panel}>
              <Text style={s.content}>{lesson.translations?.[locale]?.content||lesson.content}</Text>
            </View>
            {button(
              school.completed.includes(lesson.id)
                ? tr("✓ Đã hoàn thành")
                : tr("Đánh dấu hoàn thành"),
              () =>
                perform(async () => {
                  await request(
                    "/runtime/" +
                      school.tenant.id +
                      "/lessons/" +
                      lesson.id +
                      "/complete",
                    "POST",
                  );
                  await openSchool(school.tenant.id);
                }),
            )}
          </>
        ) : (
          <>
            {button(tr("← Hệ thống của tôi"), () => setSchool(null), true)}
            <Text style={s.kicker}>{school.tenant.name}</Text>
            <Text style={s.title}>{tr("Từng bước")}{`\n`}{tr("đến mục tiêu.")}</Text>
            {school.paths.map((path: any) => (
              <View style={s.panel} key={path.id}>
                <Text style={s.cardTitle}>{path.title}</Text>
                {path.course_ids.map((id: string, i: number) => (
                  <Text key={id} style={s.path}>
                    {i + 1}.{" "}
                    {school.courses.find((c: any) => c.id === id)?.title ||
                      tr("Khóa học chưa xuất bản")}
                  </Text>
                ))}
              </View>
            ))}
            {school.courses.map((course: any) => (
              <View style={s.panel} key={course.id}>
                <Text style={s.kicker}>{tr("KHÓA HỌC")}</Text>
                <Text style={s.cardTitle}>{course.title}</Text>
                <Text style={s.muted}>{course.description}</Text>
                {school.enrolled.includes(course.id)
                  ? school.lessons
                      .filter((l: any) => l.course_id === course.id)
                      .map((l: any) => (
                        <TouchableOpacity
                          style={s.lesson}
                          key={l.id}
                          onPress={() =>
                            perform(async () =>
                              setLesson(
                                await request(
                                  "/runtime/" +
                                    school.tenant.id +
                                    "/lessons/" +
                                    l.id,
                                ),
                              ),
                            )
                          }
                        >
                          <Text style={s.link}>
                            {school.completed.includes(l.id) ? "✓" : "▷"}{" "}
                            {l.title}
                          </Text>
                        </TouchableOpacity>
                      ))
                  : button(tr("Ghi danh miễn phí"), () =>
                      perform(async () => {
                        await request(
                          "/runtime/" +
                            school.tenant.id +
                            "/courses/" +
                            course.id +
                            "/enroll",
                          "POST",
                        );
                        await openSchool(school.tenant.id);
                      }),
                    )}
              </View>
            ))}
          </>
        )}
        {error !== "" && (
          <View style={s.error}>
            <Text style={{ color: "#9a472d" }}>{error}</Text>
          </View>
        )}
        {busy && <ActivityIndicator color="#215d4c" style={{ margin: 20 }} />}
        <Text style={s.footer}>{school?.tenant.name||"YIEDU / LEARN · BUILD · GROW"}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8f9f5" },
  page: { padding: 24, paddingTop: 20, paddingBottom: 50 },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 45,
  },
  brand: { fontSize: 31, fontWeight: "800", color: "#233b34" },
  kicker: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    color: "#77906b",
    textTransform: "uppercase",
    marginBottom: 15,
  },
  title: {
    fontSize: 36,
    fontWeight: "700",
    letterSpacing: -1.5,
    color: "#233b34",
    lineHeight: 43,
    marginBottom: 20,
  },
  muted: { fontSize: 13, color: "#84917b", lineHeight: 22, marginBottom: 12 },
  panel: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e0e6d9",
    padding: 23,
    borderRadius: 16,
    marginVertical: 12,
  },
  label: { fontSize: 12, fontWeight: "600", color: "#41543a", marginBottom: 8 },
  input: {
    borderColor: "#dfe7d8",
    borderWidth: 1,
    padding: 14,
    borderRadius: 9,
    fontSize: 14,
    color: "#233b34",
    marginBottom: 20,
  },
  button: {
    padding: 16,
    backgroundColor: "#215d4c",
    borderRadius: 10,
    marginVertical: 10,
    alignItems: "center",
  },
  buttonText: { color: "white", fontWeight: "600", fontSize: 14 },
  secondary: { backgroundColor: "#e8efdf" },
  cardTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#233b34",
    marginBottom: 10,
  },
  path: { color: "#788b6d", fontSize: 13, lineHeight: 25 },
  link: { color: "#215d4c", fontWeight: "600", fontSize: 13 },
  lesson: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#edf1e7",
  },
  content: { color: "#55684b", fontSize: 16, lineHeight: 28 },
  error: {
    padding: 15,
    backgroundColor: "#fff0e8",
    borderRadius: 10,
    marginTop: 15,
  },
  footer: {
    fontSize: 8,
    letterSpacing: 2,
    textAlign: "center",
    marginTop: 40,
    color: "#9ba78f",
  },
});
