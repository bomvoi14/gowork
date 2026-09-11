"use client"
import { useState, useMemo, useEffect } from 'react';
import Papa from 'papaparse';

export default function Home() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // State สำหรับควบคุม Modal ป๊อปอัป
  const [modalCategory, setModalCategory] = useState<string | null>(null);

  // ดึงข้อมูลจาก Google Sheets
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

  // ฟังก์ชันจัดหมวดหมู่งาน (เรียงลำดับความสำคัญ)
  const getJobCategory = (job: any) => {
    const text = (job.location + ' ' + job.detail).toLowerCase();
    
    // 1. เช็คอบรมก่อน (กันคำว่า "ห้องประชุม" ไปแย่ง)
    if (['อบรม', 'หลักสูตร'].some(w => text.includes(w))) return 'train';
    
    // 2. เช็คตรวจเยี่ยม (รวมคำว่า "เยี่ยม" เข้าไปแล้ว)
    if (['ตรวจเยี่ยม', 'เยี่ยม', 'site survey'].some(w => text.includes(w))) return 'visit';
    
    // 3. เช็คประชุม
    if (text.includes('ประชุม')) return 'meet';
    
    // 4. เช็คพื้นที่ปริมณฑล
    if (['พระนคร', 'นวนคร', 'หนองจอก', 'น้ำเย็น', 'ไทรน้อย'].some(w => text.includes(w))) return 'bkk';
    
    // 5. นอกนั้นให้เป็น ต่างจังหวัด
    return 'tcw';
  };

  const summary = useMemo(() => {
    let tcw = 0, bkk = 0, meet = 0, train = 0, visit = 0;
    userJobs.forEach(job => {
      const cat = getJobCategory(job);
      if (cat === 'meet') meet += job.days;
      else if (cat === 'train') train += job.days;
      else if (cat === 'visit') visit += job.days;
      else if (cat === 'bkk') bkk += job.days;
      else tcw += job.days; 
    });
    return { tcw, bkk, meet, train, visit, total: userJobs.reduce((sum, j) => sum + j.days, 0) };
  }, [userJobs]);

  const getJobsByCategory = (category: string) => {
    return userJobs.filter(job => getJobCategory(job) === category);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 p-4 relative">
      {/* กล่องค้นหา */}
      <div className="relative mb-6 z-10">
        <label className="block text-gray-700 text-sm font-semibold mb-2">ค้นหารายชื่อผู้ปฏิบัติงาน</label>
        <input 
          type="text" 
          placeholder="พิมพ์ชื่อ หรือนามสกุล..." 
          className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setSelectedName(''); setModalCategory(null); }}
        />
        {filteredNames.length > 0 && search !== selectedName && (
          <ul className="absolute w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-xl max-h-60 overflow-y-auto">
            {filteredNames.map(name => (
              <li 
                key={name} 
                className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 text-gray-800"
                onClick={() => { setSelectedName(name); setSearch(name); }}
              >
                {name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {loading ? (
        <div className="text-center text-gray-500 mt-10">⏳ กำลังโหลดข้อมูลจากชีท...</div>
      ) : selectedName ? (
        <div className="animate-fade-in space-y-4">
          <div className="bg-blue-600 p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">👤 {selectedName}</h2>
          </div>

          <details className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 group cursor-pointer" open>
            <summary className="font-bold text-gray-800 outline-none flex justify-between items-center">
              <span>📊 สรุปการออกงาน (รวม {summary.total} วัน)</span>
              <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="grid grid-cols-2 gap-3 mt-4 text-sm font-medium">
              <div 
                onClick={() => setModalCategory('tcw')}
                className="bg-blue-50 p-3 rounded-md text-blue-700 border border-blue-100 cursor-pointer hover:bg-blue-100 active:scale-95 transition-all">
                ตจว.: {summary.tcw} วัน <span className="text-xs text-blue-400 float-right mt-1">ดู 🔍</span>
              </div>
              <div 
                onClick={() => setModalCategory('bkk')}
                className="bg-emerald-50 p-3 rounded-md text-emerald-700 border border-emerald-100 cursor-pointer hover:bg-emerald-100 active:scale-95 transition-all">
                ปริมณฑล: {summary.bkk} วัน <span className="text-xs text-emerald-400 float-right mt-1">ดู 🔍</span>
              </div>
              <div 
                onClick={() => setModalCategory('meet')}
                className="bg-purple-50 p-3 rounded-md text-purple-700 border border-purple-100 cursor-pointer hover:bg-purple-100 active:scale-95 transition-all">
                ประชุม: {summary.meet} วัน <span className="text-xs text-purple-400 float-right mt-1">ดู 🔍</span>
              </div>
              <div 
                onClick={() => setModalCategory('train')}
                className="bg-amber-50 p-3 rounded-md text-amber-700 border border-amber-100 cursor-pointer hover:bg-amber-100 active:scale-95 transition-all">
                อบรม: {summary.train} วัน <span className="text-xs text-amber-400 float-right mt-1">ดู 🔍</span>
              </div>
              <div 
                onClick={() => setModalCategory('visit')}
                className="bg-rose-50 p-3 rounded-md text-rose-700 border border-rose-100 col-span-2 cursor-pointer hover:bg-rose-100 active:scale-95 transition-all flex justify-between items-center">
                <span>ตรวจเยี่ยม Site: {summary.visit} วัน</span>
                <span className="text-xs text-rose-400">ดูรายละเอียด 🔍</span>
              </div>
            </div>
          </details>

          <h3 className="font-bold text-gray-700 pt-2 pb-1">รายละเอียดงานทั้งหมด</h3>
          <div className="space-y-3 pb-8">
            {userJobs.map((job, idx) => {
              // เช็คพื้นที่เพื่อใส่ Tag ปริมณฑล/ต่างจังหวัด ท้ายชื่อสถานที่
              const isBkk = ['พระนคร', 'นวนคร', 'หนองจอก', 'น้ำเย็น', 'ไทรน้อย'].some(w => (job.location + ' ' + job.detail).includes(w));
              const regionTag = isBkk ? '(ปริมณฑล)' : '(ต่างจังหวัด)';

              return (
                <div key={idx} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                  <button 
                    className="w-full p-4 text-left flex justify-between items-center hover:bg-gray-50 focus:outline-none"
                    onClick={() => setExpandedId(expandedId === idx.toString() ? null : idx.toString())}
                  >
                    <div className="truncate pr-4 flex-1">
                      <p className="text-sm font-bold text-gray-800 truncate mb-1">
                        {job.location} <span className={isBkk ? "text-emerald-600" : "text-blue-600"}>{regionTag}</span>
                      </p>
                      <p className="text-xs text-gray-500">📅 {job.date} ({job.days} วัน)</p>
                    </div>
                    <span className="text-gray-400 text-xs bg-gray-100 px-2 py-1 rounded-full whitespace-nowrap">{expandedId === idx.toString() ? 'ปิด' : 'ดูเพิ่ม'}</span>
                  </button>
                  
                  {expandedId === idx.toString() && (
                    <div className="p-4 bg-gray-50 text-sm text-gray-700 border-t border-gray-200 space-y-2">
                      <div className="grid grid-cols-[80px_1fr] gap-2">
                        <span className="text-gray-500 font-medium">เลขคำสั่ง:</span>
                        <span className="font-mono text-gray-900">{job.id}</span>
                        
                        <span className="text-gray-500 font-medium">สถานที่:</span>
                        <span className="text-gray-900 leading-relaxed">{job.location}</span>

                        <span className="text-gray-500 font-medium">งาน:</span>
                        <span className="text-gray-900 leading-relaxed">{job.detail}</span>
                        
                        <span className="text-gray-500 font-medium">ผู้อนุมัติ:</span>
                        <span className="text-gray-900">{job.approver}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Modal Popup แสดงรายละเอียดแยกหมวดหมู่ */}
      {modalCategory && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 text-lg">
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
                  <div key={idx} className="bg-white border border-gray-200 rounded-lg p-3 text-sm shadow-sm relative pl-4">
                    <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${
                      modalCategory === 'meet' ? 'bg-purple-400' :
                      modalCategory === 'train' ? 'bg-amber-400' :
                      modalCategory === 'visit' ? 'bg-rose-400' :
                      modalCategory === 'bkk' ? 'bg-emerald-400' : 'bg-blue-400'
                    }`}></div>
                    <p className="font-bold text-gray-800 mb-1">{job.location}</p>
                    <p className="text-gray-600 mb-2">{job.detail}</p>
                    <div className="flex justify-between items-end border-t pt-2 mt-2">
                       <span className="text-xs text-gray-500">📅 {job.date}</span>
                       <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded">รวม {job.days} วัน</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">ไม่มีข้อมูลในหมวดหมู่นี้</div>
              )}
            </div>
            
            <div className="p-4 border-t bg-gray-50">
               <button 
                  onClick={() => setModalCategory(null)}
                  className="w-full bg-gray-800 text-white font-bold py-3 rounded-lg hover:bg-gray-700 active:scale-95 transition-all"
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