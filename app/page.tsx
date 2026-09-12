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

  // สร้างฟังก์ชันเก็บวัน-เวลาปัจจุบันตอนเปิดหน้าเว็บ
  const [currentTime] = useState(() => {
    const now = new Date();
    return now.toLocaleDateString('th-TH', { 
      year: 'numeric', month: 'short', day: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });
  });

  useEffect(() => {
    const sheetUrl = "https://docs.google.com/spreadsheets/d/1ZgOXg_qzS7C1myOlpr8iZSXDaQ8kmAar5kPx8HnprqE/export?format=csv";
    
    Papa.parse(sheetUrl, {
      download: true,
      header: false,
      complete: (results) => {
        const rows = results.data;
        const formatted = rows.map((row: any) => {
          if (!row[1] || !row[2] || row[1] === 'เลขทะเบียน') return null;
          
          return {
            id: row[1],
            name: row[2].trim(),
            date: row[3],
            days: parseInt(row[4]) || 0,
            location: row[5] || '',
            detail: row[6] || '',
            approver: row[7] || ''
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

  const uniqueNames = Array.from(new Set(data.map(d => d.name)));
  const filteredNames = uniqueNames.filter(name => name.includes(search) && search !== '');
  const userJobs = data.filter(d => d.name === selectedName);

  // ฟังก์ชันเช็คพื้นที่
  const isBkkLocation = (job: any) => {
    const text = (job.location + ' ' + job.detail).toLowerCase();
    return ['พระนคร', 'นวนคร', 'หนองจอก', 'น้ำเย็น', 'ไทรน้อย'].some(w => text.includes(w));
  };

  // ฟังก์ชันจัดหมวดหมู่หลัก (แยกประเภทงานกับพื้นที่อิสระจากกัน)
  const getJobCategory = (job: any) => {
    const text = (job.location + ' ' + job.detail).toLowerCase();
    
    if (['อบรม', 'หลักสูตร'].some(w => text.includes(w))) return 'train';
    if (['ตรวจเยี่ยม', 'เยี่ยม', 'site survey'].some(w => text.includes(w))) return 'visit';
    if (text.includes('ประชุม')) return 'meet';
    
    // ถ้าไม่ใช่ประเภทงานพิเศษ ให้แยกระหว่าง ปริมณฑล กับ ต่างจังหวัด
    if (isBkkLocation(job)) return 'bkk';
    return 'tcw';
  };

  const summary = useMemo(() => {
    let tcw = 0, bkk = 0, meet = 0, train = 0, visit = 0;
    userJobs.forEach(job => {
      const text = (job.location + ' ' + job.detail).toLowerCase();
      
      // 1. นับประเภทงานอิสระ
      if (['อบรม', 'หลักสูตร'].some(w => text.includes(w))) train += job.days;
      else if (['ตรวจเยี่ยม', 'เยี่ยม', 'site survey'].some(w => text.includes(w))) visit += job.days;
      else if (text.includes('ประชุม')) meet += job.days;

      // 2. นับพื้นที่ (แยกอิสระ ไม่ปะปนกับประเภทงาน)
      if (isBkkLocation(job)) {
        bkk += job.days;
      } else {
        tcw += job.days;
      }
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
        {/* หัวเว็บ / โลโก้ต้อนรับ */}
        <div className="text-center py-6 mb-2">
          <div className="inline-block bg-blue-100 p-3 rounded-full text-blue-600 mb-2 shadow-inner">
            📊
          </div>
          <h1 className="text-2xl font-bold text-gray-800">สรุปจำนวนวันออกงาน</h1>
          <p className="text-sm text-gray-500 mt-1">จำนวนวันและรายละเอียดตามคำสั่งทั้งหมด</p>
          <p className="text-xs text-gray-400 mt-1">🔄 ข้อมูลอัปเดตล่าสุด: {currentTime}</p>
        </div>

        {/* กล่องค้นหา */}
        <div className="relative mb-6 z-10">
          <label className="block text-gray-700 text-sm font-semibold mb-2">ค้นหารายชื่อผู้ปฏิบัติงาน</label>
          <input 
            type="text" 
            placeholder="🔍 พิมพ์ชื่อ หรือนามสกุล..." 
            className="w-full p-3.5 border border-gray-300 rounded-xl bg-white text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSelectedName(''); setModalCategory(null); }}
          />
          {filteredNames.length > 0 && search !== selectedName && (
            <ul className="absolute w-full bg-white border border-gray-200 rounded-xl mt-1 shadow-xl max-h-60 overflow-y-auto z-20">
              {filteredNames.map(name => (
                <li 
                  key={name} 
                  className="p-3.5 hover:bg-blue-50 cursor-pointer border-b border-gray-100 text-gray-800 font-medium transition-colors"
                  onClick={() => { setSelectedName(name); setSearch(name); }}
                >
                  👤 {name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {loading ? (
          <div className="text-center text-gray-500 py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mb-2"></div>
            <p>⏳ กำลังโหลดข้อมูลจาก Google Sheets...</p>
          </div>
        ) : selectedName ? (
          <div className="animate-fade-in space-y-4">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-xl shadow-md text-white flex justify-between items-center">
              <div>
                <p className="text-xs text-blue-100 uppercase tracking-wider font-semibold">ผู้ปฏิบัติงาน</p>
                <h2 className="text-xl font-bold">👤 {selectedName}</h2>
              </div>
              <button 
                onClick={() => { setSelectedName(''); setSearch(''); }}
                className="text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                ค้นหาใหม่
              </button>
            </div>

            <details className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 group cursor-pointer" open>
              <summary className="font-bold text-gray-800 outline-none flex justify-between items-center select-none">
                <span>📊 สรุปจำนวนวันออกงาน (รวม {summary.total} วัน)</span>
                <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="grid grid-cols-2 gap-3 mt-4 text-sm font-medium">
                <div 
                  onClick={() => setModalCategory('tcw')}
                  className="bg-blue-50 p-3.5 rounded-xl text-blue-700 border border-blue-100 cursor-pointer hover:bg-blue-100 active:scale-95 transition-all flex justify-between items-center">
                  <span>ตจว.: {summary.tcw} วัน</span>
                  <span className="text-blue-400 text-base">🔍</span>
                </div>
                <div 
                  onClick={() => setModalCategory('bkk')}
                  className="bg-emerald-50 p-3.5 rounded-xl text-emerald-700 border border-emerald-100 cursor-pointer hover:bg-emerald-100 active:scale-95 transition-all flex justify-between items-center">
                  <span>ปริมณฑล: {summary.bkk} วัน</span>
                  <span className="text-emerald-400 text-base">🔍</span>
                </div>
                <div 
                  onClick={() => setModalCategory('meet')}
                  className="bg-purple-50 p-3.5 rounded-xl text-purple-700 border border-purple-100 cursor-pointer hover:bg-purple-100 active:scale-95 transition-all flex justify-between items-center">
                  <span>ประชุม: {summary.meet} วัน</span>
                  <span className="text-purple-400 text-base">🔍</span>
                </div>
                <div 
                  onClick={() => setModalCategory('train')}
                  className="bg-amber-50 p-3.5 rounded-xl text-amber-700 border border-amber-100 cursor-pointer hover:bg-amber-100 active:scale-95 transition-all flex justify-between items-center">
                  <span>อบรม: {summary.train} วัน</span>
                  <span className="text-amber-400 text-base">🔍</span>
                </div>
                <div 
                  onClick={() => setModalCategory('visit')}
                  className="bg-rose-50 p-3.5 rounded-xl text-rose-700 border border-rose-100 col-span-2 cursor-pointer hover:bg-rose-100 active:scale-95 transition-all flex justify-between items-center">
                  <span>ตรวจเยี่ยม Site: {summary.visit} วัน</span>
                  <span className="text-rose-400 text-base">🔍</span>
                </div>
              </div>
            </details>

            <h3 className="font-bold text-gray-700 pt-2 pb-1">รายละเอียดงานทั้งหมด</h3>
            <div className="space-y-3 pb-8">
              {userJobs.map((job, idx) => {
                const isBkk = isBkkLocation(job);
                const regionTag = isBkk ? '(ปริมณฑล)' : '(ต่างจังหวัด)';

                return (
                  <div key={idx} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden transition-all hover:border-gray-300">
                    <button 
                      className="w-full p-4 text-left flex justify-between items-center focus:outline-none"
                      onClick={() => setExpandedId(expandedId === idx.toString() ? null : idx.toString())}
                    >
                      <div className="truncate pr-4 flex-1">
                        <p className="text-sm font-bold text-gray-800 truncate mb-1">
                          {job.location} <span className={isBkk ? "text-emerald-600 font-semibold" : "text-blue-600 font-semibold"}>{regionTag}</span>
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
                          <span className="text-gray-400 font-medium">เลขคำสั่ง:</span>
                          <span className="font-mono text-gray-900 font-semibold">{job.id}</span>
                          
                          <span className="text-gray-400 font-medium">สถานที่:</span>
                          <span className="text-gray-900 leading-relaxed">{job.location}</span>

                          <span className="text-gray-400 font-medium">งาน:</span>
                          <span className="text-gray-900 leading-relaxed">{job.detail}</span>
                          
                          <span className="text-gray-400 font-medium">ผู้อนุมัติ:</span>
                          <span className="text-gray-900">{job.approver}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* หน้าต้อนรับเมื่อยังไม่ได้เลือกชื่อ */
          <div className="text-center py-12 px-6 bg-white rounded-2xl border border-dashed border-gray-300 shadow-sm mt-4">
            <div className="text-4xl mb-3">🕵️</div>
            <h3 className="font-bold text-gray-700 text-base mb-1">ยังไม่ได้เลือกรายชื่อผู้ปฏิบัติงาน</h3>
            <p className="text-xs text-gray-400 leading-relaxed">กรุณาพิมพ์ชื่อหรือนามสกุลในช่องค้นหาด้านบน เพื่อเรียกดูข้อมูลตารางการออกงานครับ</p>
          </div>
        )}
      </div>

      {/* Footer เล็กๆ ด้านล่าง */}
      <div className="text-center py-4 text-xs text-gray-400 border-t border-gray-200 mt-8">
        สรุปข้อมูลการออกปฏิบัติงานภาคสนามตามรายการออกคำสั่ง
      </div>

      {/* Modal Popup แสดงรายละเอียดแยกหมวดหมู่ */}
      {modalCategory && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 text-base">
                {modalCategory === 'meet' && '📝 รายละเอียด: ประชุม'}
                {modalCategory === 'train' && '📚 รายละเอียด: อบรม'}
                {modalCategory === 'visit' && '🔎 รายละเอียด: ตรวจเยี่ยม Site'}
                {modalCategory === 'tcw' && '🚗 รายละเอียด: ต่างจังหวัด'}
                {modalCategory === 'bkk' && '🏙️ รายละเอียด: ปริมณฑล'}
              </h3>
              <button 
                onClick={() => setModalCategory(null)}
                className="text-gray-400 hover:text-red-500 bg-gray-200 hover:bg-red-100 rounded-full w-8 h-8 flex items-center justify-center font-bold transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto space-y-3">
              {getJobsByCategory(modalCategory).length > 0 ? (
                getJobsByCategory(modalCategory).map((job, idx) => (
                  <div key={idx} className="bg-white border border-gray-200 rounded-xl p-3.5 text-sm shadow-sm relative pl-4">
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl ${
                      modalCategory === 'meet' ? 'bg-purple-400' :
                      modalCategory === 'train' ? 'bg-amber-400' :
                      modalCategory === 'visit' ? 'bg-rose-400' :
                      modalCategory === 'bkk' ? 'bg-emerald-400' : 'bg-blue-400'
                    }`}></div>
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
            
            <div className="p-4 border-t bg-gray-50">
               <button 
                  onClick={() => setModalCategory(null)}
                  className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-800 active:scale-95 transition-all shadow-sm"
               >
                 ปิดหน้าต่าง
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}