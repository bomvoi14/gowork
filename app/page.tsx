"use client"
import { useState, useMemo, useEffect, useRef } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { AccountRegistration } from './components/account-registration';
interface Job {
  id: string;
  name: string;
  date: string;
  days: number;
  location: string;
  detail: string;
  approver: string;
  empId: string;
  department: string;
  phone: string;
  craft: string;
}
interface UserStat {
  name: string;
  empId: string;
  total: number;
  tcw: number;
  bkk: number;
  craft: string;
}
export default function Home() {
  const { data: session, status: sessionStatus } = useSession();
  const [data, setData] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const searchJustFocusedRef = useRef(false);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [modalCategory, setModalCategory] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState('กำลังตรวจสอบ...');
  const [selectedCraft, setSelectedCraft] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [profileModalStep, setProfileModalStep] = useState<'hidden' | 'edit' | 'invalid-phone' | 'confirm' | 'no-change' | 'success' | 'error'>('hidden');
  const [editPhone, setEditPhone] = useState('');
  const [editCraft, setEditCraft] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLineLoggingIn, setIsLineLoggingIn] = useState(false);
  const [showNotice, setShowNotice] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState<"ios" | "android" | "other" | null>(null);
  const [tourStep, setTourStep] = useState<number | null>(null);
  const [tourCompleted, setTourCompleted] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showBackExitToast, setShowBackExitToast] = useState(false);
  const [accountStatus, setAccountStatus] = useState<"checking" | "unbound" | "active" | "inactive" | "disabled" | "error">("checking");
  const [accountEmpId, setAccountEmpId] = useState("");
  const [accountRole, setAccountRole] = useState<"user" | "admin">("user");
  const [showAccount, setShowAccount] = useState(false);
  const selectedEmpIdRef = useRef("");
  const selectedCraftRef = useRef("All");
  const lastBackAtRef = useRef(0);
  const exitPendingRef = useRef(false);
  const backToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    setTourCompleted(localStorage.getItem("gtdTourCompleted") === "1");
  }, []);
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("Service Worker registration failed:", error);
      });
    }
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as any);
    };
    const onAppInstalled = () => {
      setInstallPrompt(null);
      setIsStandalone(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    const appUrl = "https://gtd-gowork.vercel.app";
    const ua = navigator.userAgent;
    const isIOS = /iphone|ipad|ipod/i.test(ua);
    const isAndroid = /android/i.test(ua);

    // ถ้า browser มี PWA install prompt พร้อม ให้ติดตั้งได้ทันที
    if (!isIOS && installPrompt) {
      installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
      return;
    }

    // กรณีเปิดจาก LINE / in-app browser หรือ iOS:
    // คัดลอก URL ก่อน แล้วแนะนำ browser ที่เหมาะสม
    try {
      await navigator.clipboard.writeText(appUrl);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = appUrl;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }

    if (isIOS) {
      setShowInstallHelp("ios");
    } else if (isAndroid) {
      setShowInstallHelp("android");
    } else {
      setShowInstallHelp("other");
    }
  };

  useEffect(() => { selectedEmpIdRef.current = selectedEmpId; }, [selectedEmpId]);
  useEffect(() => { selectedCraftRef.current = selectedCraft; }, [selectedCraft]);
  useEffect(() => {
    const currentUrl = () => window.location.pathname + window.location.search;
    // Keep one disposable history entry above the current page, including LINE's in-app browser.
    const armBack = () => window.history.pushState({ gtdBackGuard: true }, "", currentUrl());
    if (!window.history.state?.gtdBackGuard) armBack();

    // Chrome can restore this page from the back-forward cache without remounting React.
    // Reset the exit flag and restore the guard every time the page becomes active again.
    const handlePageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      exitPendingRef.current = false;
      lastBackAtRef.current = 0;
      setShowBackExitToast(false);
      if (backToastTimerRef.current) clearTimeout(backToastTimerRef.current);
      if (!window.history.state?.gtdBackGuard) armBack();
    };

    const handleBack = () => {
      if (exitPendingRef.current) return;
      if (selectedEmpIdRef.current) {
        selectedEmpIdRef.current = "";
        setShowNotice(false);
        setSelectedEmpId("");
        setSearch("");
        setModalCategory(null);
        setProfileModalStep("hidden");
        setTourStep(null);
        lastBackAtRef.current = 0;
        setShowBackExitToast(false);
        armBack();
        window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
        return;
      }
      if (selectedCraftRef.current !== "All") {
        selectedCraftRef.current = "All";
        setSelectedCraft("All");
        setCurrentPage(1);
        lastBackAtRef.current = 0;
        setShowBackExitToast(false);
        armBack();
        window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
        return;
      }
      const now = Date.now();
      if (now - lastBackAtRef.current <= 2000) {
        lastBackAtRef.current = 0;
        if (backToastTimerRef.current) clearTimeout(backToastTimerRef.current);
        setShowBackExitToast(false);
        // We are now at the underlying page; the next Back leaves this app.
        exitPendingRef.current = true;
        window.history.back();
        return;
      }
      lastBackAtRef.current = now;
      setShowBackExitToast(true);
      armBack();
      if (backToastTimerRef.current) clearTimeout(backToastTimerRef.current);
      backToastTimerRef.current = setTimeout(() => {
        setShowBackExitToast(false);
        lastBackAtRef.current = 0;
      }, 2000);
    };
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("popstate", handleBack);
    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("popstate", handleBack);
      if (backToastTimerRef.current) clearTimeout(backToastTimerRef.current);
    };
  }, []);

  const startTour = () => {
    setShowNotice(false);
    setTourStep(1);
  };
  const finishTour = () => {
    localStorage.setItem("gtdTourCompleted", "1");
    setTourCompleted(true);
    setTourStep(null);
  };
  const enterApp = () => {
    setShowNotice(false);
  };
  useEffect(() => {
    if (tourStep === null) return;
    const targets = [null, null, "tour-search", null, "tour-group", "tour-line", "tour-install"];
    const targetId = targets[tourStep];

    if (!targetId) return;
    const el = document.getElementById(targetId);
    if (!el) return;
    const previousPosition = el.style.position;
    const previousZIndex = el.style.zIndex;
    const previousBoxShadow = el.style.boxShadow;
    const previousBorderRadius = el.style.borderRadius;
    const previousTransition = el.style.transition;
    el.style.transition = "box-shadow 320ms ease, border-radius 320ms ease";
    if (tourStep === 4 || tourStep === 5) {
      // หน้า 4 และ 5 ใช้ตำแหน่งหน้าเว็บเดียวกับหน้า 5 ของ v0.10.3
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    } else if (tourStep === 6) {
      // หน้า 6: พาปุ่มติดตั้งขึ้นมาเหนือกล่องคำแนะนำ
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    const timer = window.setTimeout(() => {
      el.style.position = "relative";
      el.style.zIndex = "10002";
      el.style.boxShadow = "0 0 0 4px rgba(59,130,246,.9), 0 0 0 9999px rgba(15,23,42,.66)";
      el.style.borderRadius = tourStep === 2 ? "20px" : "16px";
    }, tourStep === 5 ? 700 : tourStep === 6 ? 750 : tourStep === 4 ? 650 : 520);
    return () => {
      window.clearTimeout(timer);
      el.style.position = previousPosition;
      el.style.zIndex = previousZIndex;
      el.style.boxShadow = previousBoxShadow;
      el.style.borderRadius = previousBorderRadius;
      el.style.transition = previousTransition;
    };
  }, [tourStep]);
  useEffect(() => {
    if (tourStep === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [tourStep]);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("skipWelcome") === "1") {
      setShowNotice(false);
      params.delete("skipWelcome");
      const query = params.toString();
      const cleanUrl = window.location.pathname + (query ? "?" + query : "");
      window.history.replaceState({}, "", cleanUrl);
      return;
    }
    setShowNotice(true);
  }, []);
  // บันทึกประวัติ LINE Login ผ่าน Server API 1 ครั้งต่อ session ของหน้าเว็บ
  useEffect(() => {
    if (!session?.user) return;
    const lineUserId = (session.user as any).lineUserId || "";
    const loginKey = "line_login_logged_" + (lineUserId || session.user.name || "unknown");
    if (sessionStorage.getItem(loginKey)) return;
    sessionStorage.setItem(loginKey, "1");
    const saveLogin = async () => {
      try {
        const response = await fetch("/api/account/login-audit", { method: "POST" });
        if (!response.ok) throw new Error("login audit failed");
      } catch (error) {
        sessionStorage.removeItem(loginKey);
        console.error("บันทึกประวัติ LINE Login ไม่สำเร็จ:", error);
      }
    };
    saveLogin();
  }, [session]);
  useEffect(() => {
    // Security V1 preview: do not load employee data before LINE authentication.
  if (sessionStatus !== "authenticated") {
      if (sessionStatus !== "loading") setLoading(false);
      return;
    }
    setLoading(true);
    fetch("/api/work-data", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.ok) throw new Error(result?.error || "load failed");
        return result.rows as string[][];
      })
      .then((rows) => {
        if (rows.length > 0 && rows[0][25]) setLastUpdated(rows[0][25]);
        else setLastUpdated("ไม่พบข้อมูลเวลา (Z1)");

        const formatted = rows.map((row) => {
          if (!row[1] || !row[2] || row[1] === "เลขทะเบียน") return null;
          return {
            id: String(row[1]).trim(),
            name: String(row[2]).trim(),
            date: row[3],
            days: parseInt(row[4]) || 0,
            location: row[5] || "",
            detail: row[6] || "",
            approver: row[7] || "",
            empId: row[8] ? String(row[8]).trim() : "",
            department: row[9] || "-",
            phone: row[10] || "-",
            craft: row[11] ? String(row[11]).trim() : "-"
          } as Job;
        }).filter((item): item is Job => item !== null);

        const craftMap = new Map<string, string>();
        const nameMap = new Map<string, string>();
        formatted.forEach((r) => {
          if (!r.empId) return;
          if (r.craft && r.craft !== "-" && r.craft !== "") craftMap.set(r.empId, r.craft);
          const currentName = nameMap.get(r.empId) || "";
          if (r.name.length > currentName.length) nameMap.set(r.empId, r.name);
        });
        formatted.forEach((r) => {
          if (!r.empId) return;
          if (craftMap.has(r.empId)) r.craft = craftMap.get(r.empId)!;
          if (nameMap.has(r.empId)) r.name = nameMap.get(r.empId)!;
        });
        setData(formatted);
      })
      .catch((error) => console.error("ดึงข้อมูลพลาด:", error))
      .finally(() => setLoading(false));
  }, [sessionStatus]);
  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    fetch("/api/account/status", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error();
        setAccountStatus(result.status);
        setAccountEmpId(result.status === "active" ? String(result.employee?.empId || "") : "");
        setAccountRole(result.status === "active" && result.role === "admin" ? "admin" : "user");
      })
      .catch(() => setAccountStatus("error"));
  }, [sessionStatus]);

  const userJobs = data.filter(d => d.empId === selectedEmpId && selectedEmpId !== '');
  const selectedUserInfo = userJobs.length > 0 ? userJobs[0] : null;
  const origCraft = selectedUserInfo?.craft && selectedUserInfo.craft !== '-' ? selectedUserInfo.craft : '';
  const origPhone = selectedUserInfo?.phone && selectedUserInfo.phone !== '-' ? selectedUserInfo.phone.replace(/\D/g, '') : '';
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 10) setEditPhone(val);
  };
  const handleInitialSubmit = () => {
    if (editPhone.length > 0 && editPhone.length < 10) {
      setProfileModalStep('invalid-phone');
      return;
    }
    if (editCraft === origCraft && editPhone === origPhone) {
      setProfileModalStep('no-change');
    } else {
      setProfileModalStep('confirm');
    }
  };
  const handleFinalSubmit = async () => {
    if (!selectedUserInfo) return;
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/account/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empId: selectedUserInfo.empId,
          editCraft,
          editPhone,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result?.error || "update failed");
      setProfileModalStep('success');
    } catch (e) {
      setProfileModalStep('error');
    }
    setIsSubmitting(false);
  };
  const uniqueUsers = Array.from(new Map(data.filter(d => d.empId).map(d => [d.empId, d])).values());
  const filteredUsers = uniqueUsers.filter(user => user.name.includes(search) && search !== '');
  const craftsList = useMemo(() => {
    const c = Array.from(new Set(data.map(d => d.craft).filter(c => c && c !== '-')));
    return ['All', ...c.sort()];
  }, [data]);
  const isBkkLocation = (job: Job) => {
    const text = (job.location + ' ' + job.detail).toLowerCase();
    return ['พระนคร', 'นวนคร', 'หนองจอก', 'น้ำเย็น', 'ไทรน้อย'].some(w => text.includes(w));
  };
  const getJobCategory = (job: Job) => {
    const text = (job.location + ' ' + job.detail).toLowerCase();
    if (['อบรม', 'หลักสูตร'].some(w => text.includes(w))) return 'train';
    if (['ตรวจเยี่ยม', 'เยี่ยม', 'site survey'].some(w => text.includes(w))) return 'visit';
    if (text.includes('ประชุม')) return 'meet';
    if (isBkkLocation(job)) return 'bkk';
    return 'tcw';
  };
  const topUsers = useMemo(() => {
    const stats = new Map<string, UserStat>();
    data.forEach(job => {
      if (!job.empId) return;
      if (selectedCraft !== 'All' && job.craft !== selectedCraft) return;
      if (!stats.has(job.empId)) {
        stats.set(job.empId, { name: job.name, empId: job.empId, total: 0, tcw: 0, bkk: 0, craft: job.craft });
      }
      const st = stats.get(job.empId)!;
      const cat = getJobCategory(job);
      if (cat === 'tcw') {
        st.tcw += job.days;
        st.total += job.days;
      } else if (cat === 'bkk') {
        st.bkk += job.days;
        st.total += job.days;
      }
    });
    return Array.from(stats.values())
      .sort((a, b) => b.total - a.total);
  }, [data, selectedCraft]);
  const totalPages = Math.ceil(topUsers.length / itemsPerPage);
  const paginatedUsers = topUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const summary = useMemo(() => {
    let tcw = 0, bkk = 0, meet = 0, train = 0, visit = 0;
    userJobs.forEach(job => {
      const cat = getJobCategory(job);
      if (cat === 'train') train += job.days;
      else if (cat === 'visit') visit += job.days;
      else if (cat === 'meet') meet += job.days;
      else if (cat === 'bkk') bkk += job.days;
      else tcw += job.days;
    });
    return { tcw, bkk, meet, train, visit, total: tcw + bkk };
  }, [userJobs]);
  const getJobsByCategory = (category: string) => {
    return userJobs.filter(job => getJobCategory(job) === category);
  };
  if (sessionStatus === "authenticated" && accountStatus === "checking") {
    return <div className="max-w-md mx-auto min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-600">กำลังตรวจสอบบัญชี...</div>;
  }
  if (sessionStatus === "authenticated" && accountStatus === "unbound") {
    return <AccountRegistration onRegistered={() => window.location.reload()} />;
  }
  if (sessionStatus === "authenticated" && accountStatus !== "active") {
    return <div className="max-w-md mx-auto min-h-screen bg-gray-50 flex items-center justify-center p-6"><div className="bg-white rounded-3xl p-7 shadow-lg text-center"><h1 className="font-bold text-gray-800">ไม่สามารถเข้าใช้งานได้</h1><p className="mt-2 text-sm text-gray-500">กรุณาติดต่อผู้ดูแลระบบ</p></div></div>;
  }

  if (sessionStatus === "loading") {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="w-full rounded-3xl bg-white p-7 text-center shadow-lg border border-gray-100">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-green-500"></div>
          <h1 className="text-lg font-bold text-gray-800">GTD-GoWork</h1>
          <p className="mt-2 text-sm text-gray-500">กำลังตรวจสอบการเข้าสู่ระบบ...</p>
        </div>
      </div>
    );
  }

  if (sessionStatus !== "authenticated") {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="w-full rounded-3xl bg-white p-7 text-center shadow-lg border border-gray-100">
          <img src="/gtd-logo.png" alt="GTD-GoWork" className="mx-auto mb-4 h-28 w-28 object-contain" />
          <h1 className="text-xl font-bold text-gray-800">GTD-GoWork</h1>
          <button
            type="button"
            onClick={() => {
              setIsLineLoggingIn(true);
              signIn("line", { callbackUrl: "/?skipWelcome=1" });
            }}
            disabled={isLineLoggingIn}
            className="mt-6 w-full rounded-xl bg-[#06C755] px-4 py-3 font-bold text-white shadow-sm disabled:opacity-60"
          >
            {isLineLoggingIn ? "กำลังไปที่ LINE" : "เข้าสู่ระบบด้วย LINE"}
          </button>
          <p className="mt-5 text-[11px] font-medium tracking-wide text-gray-400">
            GTD-GoWork · Secure Access
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 p-4 relative flex flex-col justify-between">
      <div>
        {/* แถบ LINE Login */}
        <div id="tour-line" className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm mb-4 border border-gray-100">
          {session ? (
            <div className="flex items-center gap-3 w-full justify-between">
              <div className="flex items-center gap-3">
                <img src={session.user?.image || '/staff-images/default.png'} alt="profile" className="w-10 h-10 rounded-full border border-gray-200" />
                <div>
                  <p className="text-sm font-bold text-gray-800">{session.user?.name}</p>
                  <p className="text-[10px] text-green-600 flex items-center gap-1">● ออนไลน์</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAccount(true)}
                  className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-100 font-bold transition-colors"
                >
                  บัญชีของฉัน
                </button>
                <button
                  onClick={() => {
                    const lineUserId = (session?.user as any)?.lineUserId || "";
                    const loginKey = "line_login_logged_" + (lineUserId || session?.user?.name || "unknown");
                    sessionStorage.removeItem(loginKey);
                    signOut({ callbackUrl: "/?skipWelcome=1" });
                  }}
                  className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 font-bold transition-colors"
                >
                  ออก
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center w-full">
              <p className="text-sm text-gray-600 font-medium">เข้าสู่ระบบเพื่อแก้ไขข้อมูล</p>
              <button
                disabled={isLineLoggingIn}
                onClick={() => {
                  if (isLineLoggingIn) return;
                  setIsLineLoggingIn(true);
                  signIn('line', { callbackUrl: '/?skipWelcome=1' });
                }}
                className={'text-white text-sm font-bold px-4 py-2 rounded-lg shadow-sm transition-all duration-150 active:scale-95 ' + (isLineLoggingIn ? 'bg-[#05a847] opacity-80 cursor-wait' : 'bg-[#06C755] hover:bg-[#05b34c]')}
              >
                {isLineLoggingIn ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    กำลังไปที่ LINE
                  </span>
                ) : (
                  'LINE Login'
                )}
              </button>
            </div>
          )}
        </div>
        <div className="text-center py-2 mb-2">
          <div className="inline-block mb-2">
            <img src="/header.png" alt="icon" className="w-16 h-16 object-contain drop-shadow-md" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">สรุปจำนวนวันปฏิบัติงาน</h1>
          <p className="text-sm text-gray-500 mt-1">จำนวนวันและรายละเอียดตามคำสั่งทั้งหมด</p>
          <p className="text-xs text-gray-400 mt-1">🔄 ข้อมูลอัปเดตล่าสุด: {lastUpdated}</p>
        </div>
        <div id="tour-search" className="relative -mx-3 -mt-3 mb-3 rounded-[20px] px-3 pt-3 pb-3 z-10">
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className="block text-gray-800 text-base font-bold">ค้นหารายชื่อผู้ปฏิบัติงาน</label>
            <button
              type="button"
              onClick={startTour}
              className="shrink-0 rounded-full border border-blue-300 bg-blue-50/80 px-3 py-1.5 text-xs font-bold text-blue-700 shadow-sm transition-all duration-200 hover:border-blue-400 hover:bg-blue-100 hover:shadow-md active:scale-95"
            >
              📘 วิธีใช้งาน
            </button>
          </div>
          <input
            type="text"
            placeholder="🔍 พิมพ์ชื่อ หรือนามสกุล..."
            className="w-full p-4 border-2 border-blue-200 rounded-xl bg-white text-gray-900 text-base shadow-md focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder-gray-400"
            value={search}
            onFocus={(e) => {
              searchJustFocusedRef.current = true;
              if (e.currentTarget.value) {
                requestAnimationFrame(() => e.currentTarget.select());
              }
            }}
            onPointerDown={(e) => {
              if (document.activeElement === e.currentTarget) {
                searchJustFocusedRef.current = false;
              }
            }}
            onClick={(e) => {
              if (searchJustFocusedRef.current) {
                searchJustFocusedRef.current = false;
                if (e.currentTarget.value) e.currentTarget.select();
              }
            }}
            onChange={(e) => { setSearch(e.target.value); setSelectedEmpId(''); setModalCategory(null); }}
          />
          {filteredUsers.length > 0 && selectedEmpId === '' && (
            <ul className="absolute w-full bg-white border border-gray-200 rounded-xl mt-1 shadow-xl max-h-60 overflow-y-auto z-20">
              {filteredUsers.map(user => (
                <li key={user.empId} className="p-3.5 hover:bg-blue-50 cursor-pointer border-b border-gray-100 text-gray-800 font-medium transition-colors flex items-center gap-3"
                    onClick={() => { setSelectedEmpId(user.empId); setSearch(user.name); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                  <div className="w-12 h-12 shrink-0 rounded-full overflow-hidden border border-gray-200 bg-gray-100">
                    <img
                      src={"/staff-images/" + user.empId + ".png"}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/staff-images/default.png';
                      }}
                      className="w-full h-full object-cover object-top"
                      alt="profile"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span>{user.name}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-500">{user.department}</span>
                      {user.craft !== '-' && (
                        <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">{user.craft}</span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        {loading ? (
          <div className="text-center text-gray-500 py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mb-2"></div>
            <p>⏳ กำลังโหลดข้อมูล...</p>
          </div>
        ) : selectedUserInfo ? (
          <div className="animate-fade-in space-y-4">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 rounded-xl shadow-md text-white flex justify-between items-start">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 shrink-0 mt-1 rounded-full overflow-hidden border-2 border-white/50 bg-gray-200 shadow-sm">
                  <img
                    src={"/staff-images/" + selectedUserInfo.empId + ".png"}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/staff-images/default.png';
                    }}
                    className="w-full h-full object-cover object-top"
                    alt="profile"
                  />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-bold leading-tight">{selectedUserInfo.name}</h2>
                  {selectedUserInfo.craft !== '-' && (
                    <span className="inline-block text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full mb-1">
                      {selectedUserInfo.craft}
                    </span>
                  )}
                  <p className="text-sm text-blue-100">เลขประจำตัว: {selectedUserInfo.empId}</p>
                  <p className="text-sm text-blue-100">สังกัด: {selectedUserInfo.department}</p>
                  <p className="text-sm text-blue-100">โทร: {selectedUserInfo.phone}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2 shrink-0 w-[60px]">
                <button onClick={() => { setSelectedEmpId(''); setSearch(''); }} className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg transition-colors w-full text-center shadow-sm">
                  ✕ ปิด
                </button>
                {/* แก้ไขได้เฉพาะข้อมูลของเลขประจำตัวที่ผูกกับ LINE นี้ */}
                {session && accountEmpId !== "" && (selectedUserInfo.empId === accountEmpId || accountRole === "admin") && (
                  <button
                    onClick={() => {
                      setEditCraft(origCraft);
                      setEditPhone(origPhone);
                      setProfileModalStep('edit');
                    }}
                    className="text-xs bg-[#ff8c00] hover:bg-[#e67e00] text-white px-3 py-1.5 rounded-lg transition-colors w-full text-center shadow-sm"
                  >
                    แก้ไข
                  </button>
                )}
              </div>
            </div>
            <details className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 group cursor-pointer" open>
              <summary className="font-bold text-gray-800 outline-none flex justify-between items-center select-none">
                <span>📊 สรุปจำนวนวันปฏิบัติงาน Site (รวม {summary.total} วัน)</span><span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="grid grid-cols-2 gap-3 mt-4 text-sm font-medium">
                <div onClick={() => setModalCategory('tcw')} className="bg-blue-50 p-3.5 rounded-xl text-blue-700 border border-blue-100 cursor-pointer hover:bg-blue-100 active:scale-95 transition-all flex justify-between items-center">
                  <span>ตจว.: {summary.tcw} วัน</span><span className="text-blue-400 text-base">🔍</span>
                </div>
                <div onClick={() => setModalCategory('bkk')} className="bg-emerald-50 p-3.5 rounded-xl text-emerald-700 border border-emerald-100 cursor-pointer hover:bg-emerald-100 active:scale-95 transition-all flex justify-between items-center">
                  <span>ปริมณฑล: {summary.bkk} วัน</span><span className="text-emerald-400 text-base">🔍</span>
                </div>
                <div onClick={() => setModalCategory('meet')} className="bg-purple-50 p-3.5 rounded-xl text-purple-700 border border-purple-100 cursor-pointer hover:bg-purple-100 active:scale-95 transition-all flex justify-between items-center">
                  <span>ประชุม: {summary.meet} วัน</span><span className="text-purple-400 text-base">🔍</span>
                </div>
                <div onClick={() => setModalCategory('train')} className="bg-amber-50 p-3.5 rounded-xl text-amber-700 border border-amber-100 cursor-pointer hover:bg-amber-100 active:scale-95 transition-all flex justify-between items-center">
                  <span>อบรม: {summary.train} วัน</span><span className="text-amber-400 text-base">🔍</span>
                </div>
                <div onClick={() => setModalCategory('visit')} className="bg-rose-50 p-3.5 rounded-xl text-rose-700 border border-rose-100 col-span-2 cursor-pointer hover:bg-rose-100 active:scale-95 transition-all flex justify-between items-center">
                  <span>ตรวจเยี่ยม Site/Site Survey: {summary.visit} วัน</span><span className="text-rose-400 text-base">🔍</span>
                </div>
              </div>
            </details>
            <h3 className="font-bold text-gray-700 pt-2 pb-1">รายละเอียดงานทั้งหมด</h3>
            <div className="space-y-3 pb-8">
              {userJobs.map((job, idx) => {
                const isBkk = isBkkLocation(job);
                return (
                  <div key={idx} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden transition-all hover:border-gray-300">
                    <button className="w-full p-4 text-left flex justify-between items-center focus:outline-none" onClick={() => setExpandedId(expandedId === idx.toString() ? null : idx.toString())}>
                      <div className="truncate pr-4 flex-1">
                        <p className="text-sm font-bold text-gray-800 truncate mb-1">
                          {job.location} <span className={isBkk ? "text-emerald-600 font-semibold" : "text-blue-600 font-semibold"}>{isBkk ? '(ปริมณฑล)' : '(ต่างจังหวัด)'}</span>
                        </p>
                        <p className="text-xs text-gray-500">📅 {job.date} ({job.days} วัน)</p>
                      </div>
                      <span className="text-gray-400 text-xs bg-gray-100 px-2.5 py-1.5 rounded-lg whitespace-nowrap font-medium">
                        {expandedId === idx.toString() ? 'ปิด ✕' : '🔍'}
                      </span>
                    </button>
                    {expandedId === idx.toString() && (
                      <div className="p-4 bg-gray-50 text-sm text-gray-700 border-t border-gray-100 space-y-2">
                        <div className="grid grid-cols-[80px_1fr] gap-2">
                          <span className="text-gray-400 font-medium">เลขคำสั่ง:</span><span className="font-mono text-gray-900 font-semibold">{job.id}</span>
                          <span className="text-gray-400 font-medium">สถานที่:</span><span className="text-gray-900 leading-relaxed">{job.location}</span>
                          <span className="text-gray-400 font-medium">งาน:</span><span className="text-gray-900 leading-relaxed">{job.detail}</span>
                          <span className="text-gray-400 font-medium">ผู้อนุมัติ:</span><span className="text-gray-900">{job.approver}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mt-4 overflow-hidden animate-fade-in flex flex-col">
            <div className="bg-blue-600 p-4 text-white text-center font-bold flex flex-col items-center justify-center gap-1 shrink-0">
              <div className="flex items-center gap-3">
                <img src="/trophy.png" alt="trophy" className="w-9 h-9 object-contain drop-shadow-md scale-125" />
                <span className="text-lg">จำนวนวันปฏิบัติงานตาม Group</span>
              </div>
            </div>
            <div id="tour-group" className="bg-gray-50 border-b border-gray-200 p-3 shrink-0 flex items-center gap-2">
              <label className="text-sm font-bold text-gray-600 whitespace-nowrap">Group:</label>
              <select
                value={selectedCraft}
                onChange={(e) => { selectedCraftRef.current = e.target.value; setSelectedCraft(e.target.value); setCurrentPage(1); lastBackAtRef.current = 0; setShowBackExitToast(false); }}
                className="w-full bg-white border border-gray-300 text-gray-700 rounded-lg px-3 py-2 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {craftsList.map(c => (
                  <option key={c} value={c}>{c === 'All' ? '🌟 ทั้งหมด' : c}</option>
                ))}
              </select>
            </div>
            <div className="divide-y divide-gray-100">
              {paginatedUsers.map((u, index) => {
                const actualRank = (currentPage - 1) * itemsPerPage + index;
                return (
                  <div key={u.empId} className="p-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors cursor-pointer"
                       onClick={() => { setSelectedEmpId(u.empId); setSearch(u.name); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                    <div className={'w-8 font-bold text-center text-xl ' + (actualRank > 2 ? 'text-gray-400 text-lg' : '')}>
                      {actualRank === 0 ? '🥇' : actualRank === 1 ? '🥈' : actualRank === 2 ? '🥉' : actualRank + 1}
                    </div>
                    <div className="w-12 h-12 shrink-0 rounded-full overflow-hidden border border-gray-200 bg-gray-100">
                      <img
                        src={"/staff-images/" + u.empId + ".png"}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/staff-images/default.png';
                        }}
                        className="w-full h-full object-cover object-top"
                        alt="profile"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-gray-800 truncate flex items-center gap-2">
                        {u.name}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5 flex-wrap">
                        {u.craft !== '-' && (
                          <span className="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full text-[10px]">{u.craft}</span>
                        )}
                        <span className="text-blue-600 font-medium">ตจว: {u.tcw}</span>
                        <span className="text-emerald-600 font-medium">ปริมณฑล: {u.bkk}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-gray-800 leading-none">{u.total}</div>
                      <div className="text-[10px] text-gray-400 mt-1">วัน</div>
                    </div>
                  </div>
                );
              })}
              {paginatedUsers.length === 0 && (
                <div className="p-6 text-center text-gray-400 text-sm">ไม่พบข้อมูลในหมวดหมู่นี้</div>
              )}
            </div>
            {totalPages > 1 && (
              <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-bold rounded-lg shadow-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 active:scale-95 transition-all"
                >
                  ◀ ก่อนหน้า
                </button>
                <span className="text-sm font-medium text-gray-600">
                  หน้า {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-bold rounded-lg shadow-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 active:scale-95 transition-all"
                >
                  ถัดไป ▶
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="mt-8 border-t border-gray-200 pt-5 text-center">
        <div id="tour-install" className="inline-block rounded-2xl px-2 pt-2">
          {!isStandalone ? (
            <button
              type="button"
              onClick={handleInstallApp}
              className="mb-3 inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 shadow-sm transition-all hover:border-blue-300 hover:bg-blue-100 active:scale-[0.98]"
            >
              <img src="/GTD.png" alt="" className="h-5 w-5 rounded-md object-contain" />
              ติดตั้ง GTD-GoWork
            </button>
          ) : (
            <div className="mb-3 inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
              <img src="/GTD.png" alt="" className="h-5 w-5 rounded-md object-contain" />
              ติดตั้ง GTD-GoWork แล้ว
            </div>
          )}
        </div>
        <div className="pb-4 text-center text-xs font-medium tracking-wide text-slate-500">
          GTD-GoWork v1.0.0 <span className="mx-1 opacity-60">·</span> Created by <span className="font-semibold">BOM_GTD</span>
        </div>
      </div>
      {showAccount && (
        <div className="fixed inset-0 z-[10030] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-gray-800">บัญชีของฉัน</h2>
                <p className="text-xs text-gray-500">เลขประจำตัว {accountEmpId || "-"}</p>
              </div>
              <button type="button" onClick={() => setShowAccount(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 font-bold text-gray-500">✕</button>
            </div>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-800">LINE</p>
                    <p className="mt-0.5 text-xs text-gray-500">{session.user?.name || "บัญชี LINE"}</p>
                  </div>
                  <span className="rounded-full bg-green-600 px-2.5 py-1 text-[11px] font-bold text-white">บัญชีหลัก</span>
                </div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <div><p className="font-bold text-gray-800">Google</p><p className="mt-0.5 text-xs text-gray-500">ยังไม่ได้เชื่อมบัญชี</p></div>
                  <span className="rounded-full bg-gray-200 px-2.5 py-1 text-[11px] font-bold text-gray-500">เร็วๆ นี้</span>
                </div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <div><p className="font-bold text-gray-800">Facebook</p><p className="mt-0.5 text-xs text-gray-500">ยังไม่ได้เชื่อมบัญชี</p></div>
                  <span className="rounded-full bg-gray-200 px-2.5 py-1 text-[11px] font-bold text-gray-500">เร็วๆ นี้</span>
                </div>
              </div>
            </div>
            <p className="mt-4 text-center text-[11px] leading-5 text-gray-400">LINE เป็นบัญชีหลักสำหรับยืนยันตัวตนของ GTD-GoWork</p>
          </div>
        </div>
      )}
      {/* Welcome Notice */}
      {showInstallHelp && (
        <div className="fixed inset-0 z-[10020] flex items-center justify-center bg-black/55 px-5 backdrop-blur-sm">
          <div className="w-full max-w-[360px] rounded-3xl bg-white p-5 text-center shadow-2xl">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-2xl">📲</div>
            <h2 className="text-[18px] font-bold text-slate-800">ติดตั้ง GTD-GoWork</h2>

            <div className="mt-3 rounded-xl bg-green-50 px-3 py-2 text-[13px] font-semibold text-green-700">
              ✓ คัดลอกลิงก์แล้ว
            </div>

            {showInstallHelp === "ios" ? (
              <div className="mt-4 text-left text-[14px] leading-7 text-slate-600">
                <p className="mb-1 font-bold text-slate-800">iPhone / iPad · ใช้ Safari</p>
                <p><b>1.</b> เปิด <b>Safari</b> แล้ววางลิงก์</p>
                <p><b>2.</b> แตะ <b>Share ⬆️</b></p>
                <p><b>3.</b> เลือก <b>Add to Home Screen</b></p>
                <p><b>4.</b> แตะ <b>Add / เพิ่ม</b></p>
              </div>
            ) : showInstallHelp === "android" ? (
              <div className="mt-4 text-left text-[14px] leading-7 text-slate-600">
                <p className="mb-1 font-bold text-slate-800">Android · ใช้ Google Chrome</p>
                <p><b>1.</b> เปิด <b>Chrome</b> แล้ววางลิงก์</p>
                <p><b>2.</b> แตะเมนู <b>เลื่อนมาล่างสุดของแอพ</b></p>
                <p><b>3.</b> เลือก <b>ติดตั้ง GTD-GoWork</b></p>
                <p><b>4.</b> ยืนยันการติดตั้ง</p>
              </div>
            ) : (
              <div className="mt-4 text-left text-[14px] leading-7 text-slate-600">
                <p className="mb-1 font-bold text-slate-800">คอมพิวเตอร์ · ใช้ Chrome / Edge</p>
                <p><b>1.</b> เปิด <b>Chrome / Edge</b> แล้ววางลิงก์ กด Enter</p>
                <p><b>2.</b> เลื่อนมาล่างสุดของแอพ</p>
                <p><b>3.</b> เลือก <b>ติดตั้ง GTD-GoWork</b></p>
                <p><b>4.</b> ยืนยันการติดตั้ง</p>
              </div>
            )}

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText("https://gtd-gowork.vercel.app");
                  } catch {}
                }}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-bold text-slate-700 active:scale-[0.98]"
              >
                📋 คัดลอกอีกครั้ง
              </button>
              <button
                type="button"
                onClick={() => setShowInstallHelp(null)}
                className="flex-1 rounded-xl bg-blue-600 px-3 py-2.5 text-[13px] font-bold text-white shadow-md shadow-blue-600/20 active:scale-[0.98]"
              >
                เข้าใจแล้ว
              </button>
            </div>
          </div>
        </div>
      )}

      {showNotice && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/45 backdrop-blur-[3px] px-5 animate-fade-in"
          onClick={() => setShowNotice(false)}
        >
          <div
            className="relative w-full max-w-[350px] overflow-hidden rounded-[28px] bg-white shadow-2xl ring-1 ring-black/5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowNotice(false)}
              aria-label="ปิด"
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xl leading-none text-slate-500 transition-all hover:bg-slate-200 hover:text-slate-700 active:scale-90"
            >
              ×
            </button>
            <div className="px-6 pb-6 pt-7 text-center">
              <img
                src="/GTD.png"
                alt="GTD"
                className="mx-auto mb-3 h-20 w-20 object-contain"
              />
              <h2 className="text-[19px] font-bold leading-7 text-slate-800">
                ระบบรายงานจำนวนวันปฏิบัติงาน (Site)
              </h2>
              <p className="mx-auto mt-3 max-w-[290px] text-[14px] leading-6 text-slate-600">
                หากพบข้อมูลไม่ถูกต้อง สามารถเข้าสู่ระบบ
                <br />
                <span className="font-bold text-[#06C755]">LINE Login</span>{' '}
                เพื่อแก้ไข Craft-เบอร์โทรได้
              </p>
              <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3.5 text-center">
                <p className="text-[15px] font-semibold leading-6 text-red-600">
                  <span className="font-bold">⚠️ ระบบรายงานจำนวนวันตามคำสั่ง ⚠️</span>
                  <br />
                  ไม่สามารถใช้อ้างอิงจำนวนวันปฏิบัติงานจริงได้
                </p>
              </div>
              <div className="mt-4">
                <button type="button" onClick={enterApp} className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-[0.98]">
                  เข้าใช้งาน
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showBackExitToast && (
        <div className="fixed bottom-6 left-1/2 z-[10030] -translate-x-1/2 px-4 pointer-events-none">
          <div className="whitespace-nowrap rounded-full bg-slate-900/95 px-5 py-3 text-[13px] font-semibold text-white shadow-2xl">
            กด Back อีกครั้งเพื่อออกจาก GTD-GoWork
          </div>
        </div>
      )}
      {/* Guided Tour - เปิดเมื่อผู้ใช้กดปุ่มวิธีใช้งานเท่านั้น */}
      {tourStep !== null && (() => {
        const steps = [
          { icon: "👋", title: "ยินดีต้อนรับ 👋", text: "เรียนรู้วิธีใช้งานระบบ GTD-GoWork ใน 6 ขั้นตอน" },
          { icon: "🔍", title: "ค้นหารายชื่อ", text: "พิมพ์ชื่อหรือนามสกุล แล้วเลือกรายชื่อผู้ปฏิบัติงานที่ต้องการตรวจสอบ" },
          { icon: "📊", title: "ดูรายละเอียดการปฏิบัติงาน", text: "เมื่อเลือกรายชื่อแล้ว คุณสามารถดูจำนวนวัน ตจว. ปริมณฑล ประชุม อบรม ตรวจเยี่ยม และแตะ 🔍 เพื่อดูรายละเอียดคำสั่ง" },
          { icon: "👥", title: "ดูข้อมูลตาม Group", text: "เลือก Group เพื่อดูจำนวนวันปฏิบัติงานของสมาชิกในแต่ละกลุ่ม" },
          { icon: "💬", title: "เข้าสู่ระบบ Line เพื่อแก้ไขข้อมูล", text: "หาก Craft หรือเบอร์โทรศัพท์ไม่ถูกต้อง ให้เข้าสู่ระบบ LINE Login แล้วกดปุ่ม แก้ไข" },
          { icon: "📲", title: "ติดตั้ง GTD-GoWork App บนเครื่อง", text: "ติดตั้ง GTD-GoWork App เพื่อเปิดใช้งานได้สะดวกยิ่งขึ้น" }
        ];
        const step = steps[tourStep - 1];
        return (
          <>
            <div className="pointer-events-none fixed inset-0 z-[10001] bg-slate-950/30 backdrop-blur-[5px] transition-all duration-300" />
            <div className="fixed inset-0 z-[10002] cursor-default" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} onWheel={(e) => e.preventDefault()} onTouchMove={(e) => e.preventDefault()} />
            {tourStep === 3 && (
              <div className="fixed left-1/2 top-3 z-[10003] w-[calc(100%-2rem)] max-w-[380px] -translate-x-1/2 pointer-events-none sm:top-5 sm:max-w-[430px]">
                <div className="h-[390px] overflow-hidden rounded-2xl border border-white/80 bg-white p-2 shadow-2xl sm:h-[430px]">
                  <img
                    src="/tour-step3.jpg"
                    alt="ตัวอย่างรายละเอียดการปฏิบัติงาน"
                    className="h-full w-full rounded-xl object-contain object-top"
                  />
                </div>
              </div>
            )}

            <div className={"fixed inset-0 z-[10003] pointer-events-none flex justify-center px-4 transition-all duration-500 " + (tourStep === 1 ? "items-center justify-center" : (tourStep === 4 || tourStep === 5) ? "items-start pt-[185px] sm:pt-[200px]" : tourStep === 6 ? "items-start pt-[90px] sm:pt-[105px]" : "items-end pb-5 sm:items-end sm:pb-8")} >
            <div className="pointer-events-auto w-full max-w-[360px] rounded-[24px] bg-white p-5 shadow-2xl ring-1 ring-black/5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-2xl">{tourStep === 1 ? "GTD" : step.icon}</div>
                  <div>
                    <p className="text-[11px] font-bold text-blue-600">วิธีใช้งาน · {tourStep} / {steps.length}</p>
                    <h3 className="text-[17px] font-bold text-slate-800">{step.title}</h3>
                  </div>
                </div>
                <button type="button" onClick={finishTour} className="text-xs font-semibold text-slate-400 hover:text-slate-600">ข้าม</button>
              </div>
              <p className="text-[14px] leading-6 text-slate-600">{step.text}</p>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex gap-1.5">
                  {steps.map((_, i) => <span key={i} className={"h-1.5 rounded-full transition-all " + (i === tourStep - 1 ? "w-6 bg-blue-600" : "w-1.5 bg-slate-200")}></span>)}
                </div>
                <div className="flex gap-2">
                  {tourStep > 1 && (
                    <button type="button" onClick={() => setTourStep(tourStep - 1)} className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200">ย้อนกลับ</button>
                  )}
                  {tourStep < steps.length ? (
                    <button type="button" onClick={() => setTourStep(tourStep + 1)} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">ถัดไป</button>
                  ) : (
                    <button type="button" onClick={finishTour} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">✓ เข้าใจแล้ว</button>
                  )}
                </div>
              </div>
            </div>
          </div>
          </>
        );
      })()}
      {/* Modern Saving Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm px-5 animate-fade-in">
          <div className="w-full max-w-[320px] rounded-[28px] bg-white px-7 py-8 text-center shadow-2xl ring-1 ring-black/5">
            <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-blue-100 animate-ping opacity-60"></div>
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 shadow-inner">
                <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-blue-100 border-t-blue-600"></div>
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-800">กำลังบันทึกข้อมูล...</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">ระบบกำลังอัปเดตข้อมูลของคุณ<br />กรุณารอสักครู่</p>
            <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"></div>
            </div>
            <p className="mt-3 text-[11px] text-slate-400">กรุณาอย่าปิดหน้าต่างหรือกดส่งซ้ำ</p>
          </div>
        </div>
      )}
      {modalCategory && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 text-base">รายละเอียด</h3>
              <button onClick={() => setModalCategory(null)} className="text-gray-400 hover:text-red-500 bg-gray-200 hover:bg-red-100 rounded-full w-8 h-8 flex items-center justify-center font-bold">✕</button>
            </div>
            <div className="p-4 overflow-y-auto space-y-3">
              {getJobsByCategory(modalCategory).length > 0 ? (
                getJobsByCategory(modalCategory).map((job, idx) => (
                  <div key={idx} className="bg-white border border-gray-200 rounded-xl p-3.5 text-sm shadow-sm relative pl-4">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl bg-blue-400"></div>
                    <p className="font-bold text-gray-800 mb-1">{job.location}</p>
                    <p className="text-gray-600 mb-2 text-xs leading-relaxed">{job.detail}</p>
                    <div className="flex justify-between items-end border-t border-gray-100 pt-2 mt-2">
                       <span className="text-xs text-gray-400">📅 {job.date}</span>
                       <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-md">รวม {job.days} วัน</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-400">ไม่มีข้อมูลในหมวดหมู่นี้</div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* ----------------- Modal แก้ไขประวัติ (จัดการ 4 สถานะ) ----------------- */}
      {profileModalStep !== 'hidden' && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white p-5 rounded-2xl w-full max-w-sm shadow-2xl">
            {profileModalStep === 'edit' && (
              <>
                <h3 className="font-bold text-lg text-gray-800 mb-4 border-b pb-2">แก้ไขข้อมูล</h3>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-sm text-gray-700">
                    <div className="grid grid-cols-[80px_1fr] gap-1.5">
                      <span className="text-gray-500 font-medium">ชื่อ:</span>
                      <span className="font-bold text-gray-900">{selectedUserInfo?.name}</span>
                      <span className="text-gray-500 font-medium">เลขประจำตัว:</span>
                      <span className="font-mono text-gray-900">{selectedUserInfo?.empId}</span>
                      <span className="text-gray-500 font-medium">สังกัด:</span>
                      <span className="text-gray-900">{selectedUserInfo?.department}</span>
                      <span className="text-gray-500 font-medium">เบอร์โทร:</span>
                      <span className="text-gray-900">{selectedUserInfo?.phone}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">เปลี่ยน Craft</label>
                    <select
                      className={'w-full border-2 border-gray-200 p-2.5 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-white transition-colors ' + (editCraft !== origCraft ? 'text-red-500 font-bold' : 'text-gray-900')}
                      value={editCraft}
                      onChange={e => setEditCraft(e.target.value)}
                    >
                      <option value="" className="text-gray-900">-- เลือก Craft --</option>
                      {craftsList.filter(c => c !== 'All').map(c => (
                        <option key={c} value={c} className="text-gray-900">{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">แก้ไขเบอร์โทรศัพท์</label>
                    <input
                      type="text"
                      maxLength={10}
                      placeholder="ระบุตัวเลข 10 หลัก"
                      className={'w-full border-2 border-gray-200 p-2.5 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors ' + (editPhone !== origPhone ? 'text-red-500 font-bold' : 'text-gray-900')}
                      value={editPhone}
                      onChange={handlePhoneChange}
                    />
                    <p className="text-[10px] text-gray-400 mt-1">* กรอกเฉพาะตัวเลข 10 หลัก</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <button
                    className="flex-1 bg-gray-100 text-gray-700 font-bold py-2.5 rounded-xl hover:bg-gray-200 transition-colors border border-gray-200"
                    onClick={() => setProfileModalStep('hidden')}
                  >
                    ยกเลิก
                  </button>
                  <button
                    className="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
                    onClick={handleInitialSubmit}
                  >
                    ส่งแก้ไข
                  </button>
                </div>
              </>
            )}
            {profileModalStep === 'invalid-phone' && (
              <div className="text-center py-4">
                <div className="text-5xl mb-3">⚠️</div>
                <h3 className="font-bold text-xl text-gray-800 mb-2">เบอร์โทรศัพท์ไม่ครบ</h3>
                <p className="text-sm text-gray-500 mb-6">กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก</p>
                <button
                  className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors"
                  onClick={() => setProfileModalStep('edit')}
                >
                  กลับไปแก้ไข
                </button>
              </div>
            )}
            {profileModalStep === 'error' && (
              <div className="text-center py-4">
                <div className="text-5xl mb-3">❌</div>
                <h3 className="font-bold text-xl text-gray-800 mb-2">ส่งข้อมูลไม่สำเร็จ</h3>
                <p className="text-sm text-gray-500 mb-6">ระบบไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง</p>
                <div className="flex gap-2">
                  <button
                    className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl border border-gray-200"
                    onClick={() => setProfileModalStep('edit')}
                  >
                    กลับไปแก้ไข
                  </button>
                  <button
                    className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl"
                    onClick={() => setProfileModalStep('confirm')}
                  >
                    ลองอีกครั้ง
                  </button>
                </div>
              </div>
            )}
            {profileModalStep === 'no-change' && (
              <div className="text-center py-4">
                <div className="text-4xl mb-3">⚠️</div>
                <h3 className="font-bold text-lg text-gray-800 mb-2">ไม่มีการแก้ไขข้อมูล</h3>
                <p className="text-sm text-gray-500 mb-6">คุณยังไม่ได้เปลี่ยนข้อมูลใดๆ เลย</p>
                <div className="flex flex-col gap-2">
                  <button
                    className="w-full bg-blue-50 text-blue-600 font-bold py-2.5 rounded-xl hover:bg-blue-100 transition-colors border border-blue-100"
                    onClick={() => setProfileModalStep('edit')}
                  >
                    กลับไปแก้ไข
                  </button>
                  <button
                    className="w-full bg-gray-100 text-gray-700 font-bold py-2.5 rounded-xl hover:bg-gray-200 transition-colors border border-gray-200"
                    onClick={() => setProfileModalStep('hidden')}
                  >
                    ยกเลิกการแก้ไข
                  </button>
                </div>
              </div>
            )}
            {profileModalStep === 'confirm' && (
              <div>
                <h3 className="font-bold text-lg text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                  <span>📝</span> ตรวจสอบการแก้ไข
                </h3>
                <div className="space-y-3 mb-6 bg-blue-50 p-4 rounded-xl border border-blue-100">
                  {editCraft !== origCraft && (
                    <div className="text-sm">
                      <span className="text-gray-500 font-medium block mb-1">Craft:</span>
                      <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200">
                        <span className="line-through text-gray-400">{origCraft || 'ไม่ระบุ'}</span>
                        <span>➔</span>
                        <span className="font-bold text-red-500">{editCraft || 'ไม่ระบุ'}</span>
                      </div>
                    </div>
                  )}
                  {editPhone !== origPhone && (
                    <div className="text-sm">
                      <span className="text-gray-500 font-medium block mb-1">เบอร์โทรศัพท์:</span>
                      <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200">
                        <span className="line-through text-gray-400">{origPhone || 'ไม่ระบุ'}</span>
                        <span>➔</span>
                        <span className="font-bold text-red-500">{editPhone || 'ไม่ระบุ'}</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    className="flex-1 bg-gray-100 text-gray-700 font-bold py-2.5 rounded-xl hover:bg-gray-200 transition-colors border border-gray-200"
                    onClick={() => setProfileModalStep('edit')}
                  >
                    ยกเลิก
                  </button>
                  <button
                    className="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    onClick={handleFinalSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? '⏳ กำลังส่ง...' : 'ส่งแก้ไข'}
                  </button>
                </div>
              </div>
            )}
            {profileModalStep === 'success' && (
              <div className="text-center py-6">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="font-bold text-xl text-blue-600 mb-2">การแก้ไขเสร็จสมบูรณ์</h3>
                <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                  โปรดรีเฟรชหน้าแอพเพื่ออัพเดทข้อมูลล่าสุด
                </p>
                <button
                  className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-md"
                  onClick={() => {
                    setProfileModalStep('hidden');
                    window.location.href = "/?skipWelcome=1";
                  }}
                >
                  ตกลง
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
