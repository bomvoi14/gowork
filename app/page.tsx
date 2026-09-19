/* eslint-disable @next/next/no-img-element */
"use client"
import { useState, useMemo, useEffect } from 'react';
import Papa from 'papaparse';

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
  const [data, setData] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [modalCategory, setModalCategory] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState('กำลังตรวจสอบ...');
  
  const [selectedCraft, setSelectedCraft] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // เพิ่ม type เพื่อแยกว่าแก้ประวัติ หรือ แก้งาน
  const [reportModal, setReportModal] = useState<{isOpen: boolean, job: Job | null, type: 'job' | 'profile'}>({isOpen: false, job: null, type: 'job'});
  const [reportMessage, setReportMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycby7nMBc3RqicY55NNNS0MyeDrVZky1e-v9arDpWH_FoFLVDlZGHbu6S_HIcU6_OV-Wd/exec";

  useEffect(() => {
    const sheetUrl = "https://docs.google.com/spreadsheets/d/1ZgOXg_qzS7C1myOlpr8iZSXDaQ8kmAar5kPx8HnprqE/export?format=csv";
    
    Papa.parse(sheetUrl, {
      download: true,
      header: false,
      complete: (results) => {
        const rows = results.data as string[][];
        
        if (rows.length > 0 && rows[0][25]) {
          setLastUpdated(rows[0][25]);
        } else {
          setLastUpdated('ไม่พบข้อมูลเวลา (Z1)');
        }

        const formatted = rows.map((row) => {
          if (!row[1] || !row[2] || row[1] === 'เลขทะเบียน') return null;
          return {
            id: String(row[1]).trim(),        
            name: String(row[2]).trim(),      
            date: row[3],                     
            days: parseInt(row[4]) || 0,      
            location: row[5] || '',           
            detail: row[6] || '',             
            approver: row[7] || '',           
            empId: row[8] ? String(row[8]).trim() : '', 
            department: row[9] || '-',        
            phone: row[10] || '-',
            craft: row[11] ? String(row[11]).trim() : '-' 
          } as Job;
        }).filter((item): item is Job => item !== null);

        const craftMap = new Map<string, string>();
        const nameMap = new Map<string, string>();
        
        formatted.forEach(r => {
          if (r.empId) {
             if (r.craft && r.craft !== '-' && r.craft !== '') {
                 craftMap.set(r.empId, r.craft);
             }
             const currentName = nameMap.get(r.empId) || '';
             if (r.name.length > currentName.length) {
                nameMap.set(r.empId, r.name);
             }
          }
        });

        formatted.forEach(r => {
          if (r.empId) {
             if (craftMap.has(r.empId)) {
                 r.craft = craftMap.get(r.empId)!;
             }
             if (nameMap.has(r.empId)) {
                 r.name = nameMap.get(r.empId)!;
             }
          }
        });
        
        setData(formatted);
        setLoading(false);
      },
      error: (err) => {
        console.error("ดึงข้อมูลพลาด:", err);
        setLoading(false);
      }
    });
  }, []);

  const handleReportSubmit = async () => {
    if (!reportMessage.trim() || !reportModal.job) return;
    setIsSubmitting(true);
    
    try {
      await fetch(SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          empId: reportModal.job.empId,
          name: reportModal.job.name,
          jobId: reportModal.type === 'profile' ? 'แก้ไขประวัติบุคคล' : reportModal.job.id,
          message: reportMessage
        })
      });
      alert("ส่งข้อมูลสำเร็จ!");
      setReportModal({isOpen: false, job: null, type: 'job'});
      setReportMessage('');
    } catch (e) {
      alert("ส่งไม่สำเร็จ กรุณาลองใหม่");
    }
    setIsSubmitting(false);
  };

  const uniqueUsers = Array.from(new Map(data.filter(d => d.empId).map(d => [d.empId, d])).values());
  const filteredUsers = uniqueUsers.filter(user => user.name.includes(search) && search !== '');
  
  const userJobs = data.filter(d => d.empId === selectedEmpId && selectedEmpId !== '');
  const selectedUserInfo = userJobs.length > 0 ? userJobs[0] : null;

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

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 p-4 relative flex flex-col justify-between">
      <div>
        <div className="text-center py-6 mb-2">
          <div className="inline-block mb-2">
            <img src="/header.png" alt="icon" className="w-16 h-16 object-contain drop-shadow-md" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">สรุปจำนวนวันปฏิบัติงาน</h1>
          <p className="text-sm text-gray-500 mt-1">จำนวนวันและรายละเอียดตามคำสั่งทั้งหมด</p>
          <p className="text-xs text-gray-400 mt-1">🔄 ข้อมูลอัปเดตล่าสุด: {lastUpdated}</p>
        </div>

        <div className="relative mb-6 z-10">
          <label className="block text-gray-800 text-base font-bold mb-2">ค้นหารายชื่อผู้ปฏิบัติงาน</label>
          <input 
            type="text" 
            placeholder="🔍 พิมพ์ชื่อ หรือนามสกุล..." 
            className="w-full p-4 border-2 border-blue-200 rounded-xl bg-white text-gray-900 text-base shadow-md focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder-gray-400"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSelectedEmpId(''); setModalCategory(null); }}
          />
          {filteredUsers.length > 0 && selectedEmpId === '' && (
            <ul className="absolute w-full bg-white border border-gray-200 rounded-xl mt-1 shadow-xl max-h-60 overflow-y-auto z-20">
              {filteredUsers.map(user => (
                <li key={user.empId} className="p-3.5 hover:bg-blue-50 cursor-pointer border-b border-gray-100 text-gray-800 font-medium transition-colors flex items-center gap-3" 
                    onClick={() => { setSelectedEmpId(user.empId); setSearch(user.name); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                  <div className="w-12 h-12 shrink-0 rounded-full overflow-hidden border border-gray-200 bg-gray-100">
                    <img 
                      src={`/staff-images/${user.empId}.png`} 
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
                    src={`/staff-images/${selectedUserInfo.empId}.png`} 
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
              <div className="flex flex-col gap-2 shrink-0">
                <button onClick={() => { setSelectedEmpId(''); setSearch(''); }} className="text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg transition-colors w-full text-center">
                  ✕ ปิด
                </button>
                <button onClick={() => setReportModal({isOpen: true, job: selectedUserInfo, type: 'profile'})} className="text-[10px] bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors border border-white/20 w-full text-center">
                  ✏️ แก้ประวัติ
                </button>
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
                  <span>ตรวจเยี่ยม Site: {summary.visit} วัน</span><span className="text-rose-400 text-base">🔍</span>
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
                        <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end">
                          <button 
                            onClick={() => setReportModal({isOpen: true, job, type: 'job'})}
                            className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 font-medium border border-red-100 transition-colors"
                          >
                            ⚠️ แจ้งแก้ไขงานนี้
                          </button>
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
                <span className="text-lg">จัดอันดับวันปฏิบัติงาน Site</span>
              </div>
            </div>
            
            <div className="bg-gray-50 border-b border-gray-200 p-3 shrink-0 flex items-center gap-2">
              <label className="text-sm font-bold text-gray-600 whitespace-nowrap">Group:</label>
              <select 
                value={selectedCraft}
                onChange={(e) => { setSelectedCraft(e.target.value); setCurrentPage(1); }}
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
                    <div className={`w-8 font-bold text-center text-xl ${actualRank > 2 ? 'text-gray-400 text-lg' : ''}`}>
                      {actualRank === 0 ? '🥇' : actualRank === 1 ? '🥈' : actualRank === 2 ? '🥉' : actualRank + 1}
                    </div>
                    <div className="w-12 h-12 shrink-0 rounded-full overflow-hidden border border-gray-200 bg-gray-100">
                      <img 
                        src={`/staff-images/${u.empId}.png`} 
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

      <div className="text-center py-4 text-xs text-gray-400 border-t border-gray-200 mt-8">
        สรุปข้อมูลการออกปฏิบัติงานภาคสนามตามรายการออกคำสั่ง
      </div>

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

      {/* Modal แจ้งแก้ไข */}
      {reportModal.isOpen && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white p-5 rounded-2xl w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-lg text-gray-800 mb-1">
              {reportModal.type === 'profile' ? 'แจ้งแก้ไขข้อมูลส่วนบุคคล' : 'แจ้งแก้ไขข้อมูลงาน'}
            </h3>
            <p className="text-xs text-gray-500 mb-4 bg-gray-100 p-2 rounded">
              {reportModal.type === 'profile' ? (
                <>
                  รหัสพนักงาน: <span className="font-mono font-bold text-gray-700">{reportModal.job?.empId}</span><br/>
                  ชื่อ: {reportModal.job?.name}
                </>
              ) : (
                <>
                  รหัสงาน: <span className="font-mono font-bold text-gray-700">{reportModal.job?.id}</span><br/>
                  สถานที่: {reportModal.job?.location}
                </>
              )}
            </p>
            <textarea 
              className="w-full border-2 border-gray-200 p-3 text-sm rounded-xl focus:outline-none focus:border-red-400 bg-gray-50" 
              rows={4} 
              placeholder={reportModal.type === 'profile' ? "ระบุ สังกัด, Craft หรือเบอร์โทร ที่ถูกต้อง..." : "ระบุสิ่งที่ต้องการให้แอดมินแก้ไข..."}
              value={reportMessage}
              onChange={e => setReportMessage(e.target.value)}
            />
            <div className="flex gap-2 mt-5">
              <button 
                className="flex-1 bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl hover:bg-gray-300" 
                onClick={() => setReportModal({isOpen:false, job:null, type: 'job'})}
              >
                ยกเลิก
              </button>
              <button 
                className="flex-1 bg-red-500 text-white font-bold py-2.5 rounded-xl hover:bg-red-600 disabled:opacity-50 flex justify-center items-center gap-2" 
                onClick={handleReportSubmit} 
                disabled={isSubmitting || !reportMessage.trim()}
              >
                {isSubmitting ? '⏳ กำลังส่ง...' : '📤 ส่งแจ้งเตือน'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}