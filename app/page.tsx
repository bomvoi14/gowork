"use client"
import { useState, useMemo, useEffect } from 'react';
import Papa from 'papaparse';

export default function Home() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [modalCategory, setModalCategory] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState('กำลังตรวจสอบ...');

  useEffect(() => {
    const sheetUrl = "https://docs.google.com/spreadsheets/d/1ZgOXg_qzS7C1myOlpr8iZSXDaQ8kmAar5kPx8HnprqE/export?format=csv";
    
    Papa.parse(sheetUrl, {
      download: true,
      header: false,
      complete: (results) => {
        const rows = results.data as any[][];
        
        if (rows.length > 0 && rows[0][25]) {
          setLastUpdated(rows[0][25] as string);
        } else {
          setLastUpdated('ไม่พบข้อมูลเวลา (Z1)');
        }

        const formatted = rows.map((row: any) => {
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
            phone: row[10] || '-'             
          };
        }).filter(Boolean);
        
        setData(formatted);
        setLoading(false);
      },
      error: (err) => {
        console.error("ดึงข้อมูลพลาด:", err);
        setLoading(false);
      }
    });
  }, []);

  const uniqueUsers = Array.from(new Map(data.map(d => [d.name, d])).entries()).map(([name, d]) => d);
  const filteredUsers = uniqueUsers.filter(user => user.name.includes(search) && search !== '');
  
  const userJobs = data.filter(d => d.name === selectedName);
  const selectedUserInfo = userJobs.length > 0 ? userJobs[0] : null;

  const isBkkLocation = (job: any) => {
    const text = (job.location + ' ' + job.detail).toLowerCase();
    return ['พระนคร', 'นวนคร', 'หนองจอก', 'น้ำเย็น', 'ไทรน้อย'].some(w => text.includes(w));
  };

  const getJobCategory = (job: any) => {
    const text = (job.location + ' ' + job.detail).toLowerCase();
    if (['อบรม', 'หลักสูตร'].some(w => text.includes(w))) return 'train';
    if (['ตรวจเยี่ยม', 'เยี่ยม', 'site survey'].some(w => text.includes(w))) return 'visit';
    if (text.includes('ประชุม')) return 'meet';
    if (isBkkLocation(job)) return 'bkk';
    return 'tcw';
  };

  const summary = useMemo(() => {
    let tcw = 0, bkk = 0, meet = 0, train = 0, visit = 0;
    userJobs.forEach(job => {
      const text = (job.location + ' ' + job.detail).toLowerCase();
      if (['อบรม', 'หลักสูตร'].some(w => text.includes(w))) train += job.days;
      else if (['ตรวจเยี่ยม', 'เยี่ยม', 'site survey'].some(w => text.includes(w))) visit += job.days;
      else if (text.includes('ประชุม')) meet += job.days;

      if (isBkkLocation(job)) bkk += job.days;
      else tcw += job.days;
    });
    return { tcw, bkk, meet, train, visit, total: userJobs.reduce((sum, j) => sum + j.days, 0) };
  }, [userJobs]);

  const getJobsByCategory = (category: string) => {
    if (category === 'tcw') return userJobs.filter(job => !isBkkLocation(job));
    if (category === 'bkk') return userJobs.filter(job => isBkkLocation(job));
    return userJobs.filter(job => getJobCategory(job) === category);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 p-4 relative flex flex-col justify-between">
      <div>
        <div className="text-center py-6 mb-2">
          <div className="inline-block bg-blue-100 p-3 rounded-full text-blue-600 mb-2 shadow-inner">📊</div>
          <h1 className="text-2xl font-bold text-gray-800">สรุปจำนวนวันปฏิบัติงาน</h1>
          <p className="text-sm text-gray-500 mt-1">จำนวนวันและรายละเอียดตามคำสั่งทั้งหมด</p>
          <p className="text-xs text-gray-400 mt-1">🔄 ข้อมูลอัปเดตล่าสุด: {lastUpdated}</p>
        </div>

        <div className="relative mb-6 z-10">
          <label className="block text-gray-700 text-sm font-semibold mb-2">ค้นหารายชื่อผู้ปฏิบัติงาน</label>
          <input 
            type="text" 
            placeholder="🔍 พิมพ์ชื่อ หรือนามสกุล..." 
            className="w-full p-3.5 border border-gray-300 rounded-xl bg-white text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSelectedName(''); setModalCategory(null); }}
          />
          {filteredUsers.length > 0 && search !== selectedName && (
            <ul className="absolute w-full bg-white border border-gray-200 rounded-xl mt-1 shadow-xl max-h-60 overflow-y-auto z-20">
              {filteredUsers.map(user => (
                <li key={user.name} className="p-3.5 hover:bg-blue-50 cursor-pointer border-b border-gray-100 text-gray-800 font-medium transition-colors flex items-center gap-3" onClick={() => { setSelectedName(user.name); setSearch(user.name); }}>
                  
                  {/* แก้รูปตอนค้นหา */}
                  <div className="w-10 h-10 shrink-0 rounded-full overflow-hidden border border-gray-200 bg-gray-100">
                    <img 
                      src={`/staff-images/${user.empId}.png`} 
                      onError={(e) => { 
                        e.currentTarget.onerror = null; 
                        e.currentTarget.src = `http://mmdapp.egat.co.th/mmdstaff/images_new/${user.empId}.png`; 
                      }}
                      className="w-full h-full object-cover object-top" 
                      alt="profile"
                    />
                  </div>

                  <div className="flex flex-col">
                    <span>{user.name}</span>
                    <span className="text-xs text-gray-500">{user.department}</span>
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
                
                {/* แก้รูปโปรไฟล์หลัก */}
                <div className="w-16 h-16 shrink-0 mt-1 rounded-full overflow-hidden border-2 border-white/50 bg-gray-200 shadow-sm">
                  <img 
                    src={`/staff-images/${selectedUserInfo.empId}.png`} 
                    onError={(e) => { 
                      e.currentTarget.onerror = null; 
                      e.currentTarget.src = `http://mmdapp.egat.co.th/mmdstaff/images_new/${selectedUserInfo.empId}.png`; 
                    }}
                    className="w-full h-full object-cover object-top" 
                    alt="profile"
                  />
                </div>

                <div className="space-y-1">
                  <h2 className="text-xl font-bold leading-tight">{selectedUserInfo.name}</h2>
                  <p className="text-sm text-blue-100">เลขประจำตัว: {selectedUserInfo.empId}</p>
                  <p className="text-sm text-blue-100">สังกัด: {selectedUserInfo.department}</p>
                  <p className="text-sm text-blue-100">โทร: {selectedUserInfo.phone}</p>
                </div>
              </div>
              <button onClick={() => { setSelectedName(''); setSearch(''); }} className="text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg transition-colors shrink-0">
                ✕ ปิด
              </button>
            </div>

            <details className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 group cursor-pointer" open>
              <summary className="font-bold text-gray-800 outline-none flex justify-between items-center select-none">
                <span>📊 สรุปจำนวนวันปฏิบัติงาน (รวม {summary.total} วัน)</span><span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
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
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 px-6 bg-white rounded-2xl border border-dashed border-gray-300 shadow-sm mt-4">
            <div className="text-4xl mb-3">🕵️</div>
            <h3 className="font-bold text-gray-700 text-base mb-1">ยังไม่ได้เลือกรายชื่อผู้ปฏิบัติงาน</h3>
            <p className="text-xs text-gray-400 leading-relaxed">กรุณาพิมพ์ชื่อหรือนามสกุลในช่องค้นหาด้านบน เพื่อเรียกดูข้อมูล</p>
          </div>
        )}
      </div>
    </div>
  );
}