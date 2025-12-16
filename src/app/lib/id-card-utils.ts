// app/lib/id-card-utils.ts

interface IDCardData {
  id: string;
  name: string;
  admissionNo: string;
  avatar: string | null;
  class: string;
  programme: string;
  department: string;
  academicYear: string;
  session: string;
  validUntil: string;
}

// Generate barcode placeholder
function generateBarcode(data: string): string {
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg width="200" height="60" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="60" fill="white"/>
      <rect x="10" y="10" width="4" height="40" fill="black"/>
      <rect x="18" y="10" width="2" height="40" fill="black"/>
      <rect x="24" y="10" width="6" height="40" fill="black"/>
      <rect x="34" y="10" width="2" height="40" fill="black"/>
      <rect x="40" y="10" width="4" height="40" fill="black"/>
      <rect x="48" y="10" width="2" height="40" fill="black"/>
      <rect x="54" y="10" width="6" height="40" fill="black"/>
      <rect x="64" y="10" width="4" height="40" fill="black"/>
      <rect x="72" y="10" width="2" height="40" fill="black"/>
      <rect x="78" y="10" width="4" height="40" fill="black"/>
      <rect x="86" y="10" width="6" height="40" fill="black"/>
      <rect x="96" y="10" width="2" height="40" fill="black"/>
      <rect x="102" y="10" width="4" height="40" fill="black"/>
      <rect x="110" y="10" width="2" height="40" fill="black"/>
      <rect x="116" y="10" width="6" height="40" fill="black"/>
      <rect x="126" y="10" width="4" height="40" fill="black"/>
      <rect x="134" y="10" width="2" height="40" fill="black"/>
      <rect x="140" y="10" width="6" height="40" fill="black"/>
      <rect x="150" y="10" width="2" height="40" fill="black"/>
      <rect x="156" y="10" width="4" height="40" fill="black"/>
      <rect x="164" y="10" width="6" height="40" fill="black"/>
      <rect x="174" y="10" width="2" height="40" fill="black"/>
      <rect x="180" y="10" width="4" height="40" fill="black"/>
      <text x="100" y="58" text-anchor="middle" font-size="8" font-family="monospace">${data}</text>
    </svg>
  `)}`;
}

// Download single ID card with modern design
export function downloadIDCard(student: IDCardData): void {
  const cardHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>ID Card - ${student.name}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Arial', sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: #f3f4f6;
          padding: 20px;
        }
        
        .card-container {
          display: flex;
          gap: 30px;
          flex-wrap: wrap;
          justify-content: center;
        }
        
        .id-card {
          width: 400px;
          height: 250px;
          background: white;
          border-radius: 15px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          position: relative;
        }
        
        /* FRONT CARD */
        .card-front {
          background: linear-gradient(135deg, #0891b2 0%, #0e7490 50%, #164e63 100%);
          position: relative;
        }
        
        .decorative-corner {
          position: absolute;
          top: 0;
          right: 0;
          width: 150px;
          height: 150px;
          background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
          clip-path: polygon(100% 0, 100% 100%, 0 0);
        }
        
        .decorative-corner-2 {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 120px;
          height: 120px;
          background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.1) 100%);
          clip-path: polygon(0 100%, 100% 100%, 0 0);
        }
        
        .front-content {
          position: relative;
          z-index: 1;
          height: 100%;
          display: flex;
          padding: 20px;
        }
        
        .front-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          color: white;
        }
        
        .logo-section {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 10px;
        }
        
        .logo {
          width: 50px;
          height: 50px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        }
        
        .institution {
          flex: 1;
        }
        
        .institution-name {
          font-size: 13px;
          font-weight: 700;
          line-height: 1.2;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .card-title {
          font-size: 24px;
          font-weight: 700;
          letter-spacing: 2px;
          margin: 15px 0 10px 0;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        
        .student-details {
          font-size: 11px;
          line-height: 1.8;
        }
        
        .detail-row {
          display: flex;
          margin-bottom: 3px;
        }
        
        .detail-label {
          width: 80px;
          font-weight: 600;
          opacity: 0.9;
        }
        
        .detail-value {
          flex: 1;
          font-weight: 700;
        }
        
        .front-right {
          width: 130px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        
        .photo-frame {
          width: 110px;
          height: 130px;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0,0,0,0.3);
          border: 3px solid white;
        }
        
        .photo-frame img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .default-photo {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 50px;
        }
        
        .barcode-container {
          width: 110px;
          height: 35px;
          background: white;
          border-radius: 4px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        
        .barcode-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        /* BACK CARD */
        .card-back {
          background: linear-gradient(135deg, #164e63 0%, #0e7490 50%, #0891b2 100%);
          position: relative;
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        
        .back-header {
          text-align: center;
          color: white;
        }
        
        .back-title {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 5px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .back-subtitle {
          font-size: 11px;
          opacity: 0.9;
        }
        
        .back-content {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 10px;
          padding: 15px;
          flex: 1;
          margin: 15px 0;
        }
        
        .info-section {
          margin-bottom: 12px;
        }
        
        .info-title {
          font-size: 10px;
          font-weight: 700;
          color: #0e7490;
          text-transform: uppercase;
          margin-bottom: 6px;
          letter-spacing: 0.5px;
        }
        
        .info-text {
          font-size: 10px;
          color: #374151;
          line-height: 1.6;
        }
        
        .emergency-box {
          background: #fef3c7;
          border-left: 3px solid #f59e0b;
          padding: 8px;
          border-radius: 4px;
          margin-bottom: 10px;
        }
        
        .signature-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 10px;
        }
        
        .signature-box {
          text-align: center;
        }
        
        .signature-line {
          width: 100px;
          height: 30px;
          border-bottom: 1px solid #9ca3af;
          margin-bottom: 3px;
        }
        
        .signature-label {
          font-size: 8px;
          color: #6b7280;
          text-transform: uppercase;
        }
        
        .validity-badge {
          background: #dcfce7;
          color: #15803d;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 700;
          text-align: center;
        }
        
        .back-footer {
          text-align: center;
          color: white;
          font-size: 9px;
          opacity: 0.9;
        }
        
        @media print {
          body {
            background: white;
          }
          
          .card-container {
            page-break-inside: avoid;
          }
          
          .id-card {
            box-shadow: none;
            page-break-inside: avoid;
          }
        }
        
        @page {
          size: A4 landscape;
          margin: 10mm;
        }
      </style>
    </head>
    <body>
      <div class="card-container">
        <!-- FRONT CARD -->
        <div class="id-card card-front">
          <div class="decorative-corner"></div>
          <div class="decorative-corner-2"></div>
          
          <div class="front-content">
            <div class="front-left">
              <div>
                <div class="logo-section">
                  <div class="logo">🏫</div>
                  <div class="institution">
                    <div class="institution-name">
                      Kongoni Technical<br/>
                      & Vocational College
                    </div>
                  </div>
                </div>
                
                <div class="card-title">STUDENT ID CARD</div>
                
                <div class="student-details">
                  <div class="detail-row">
                    <span class="detail-label">NAME</span>
                    <span class="detail-value">: ${student.name}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">ADM NO.</span>
                    <span class="detail-value">: ${student.admissionNo}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">CLASS</span>
                    <span class="detail-value">: ${student.class}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">PROGRAMME</span>
                    <span class="detail-value">: ${student.programme}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="front-right">
              <div class="photo-frame">
                ${student.avatar 
                  ? `<img src="${student.avatar}" alt="${student.name}"/>` 
                  : '<div class="default-photo">👤</div>'
                }
              </div>
              
              <div class="barcode-container">
                <img src="${generateBarcode(student.admissionNo)}" alt="Barcode"/>
              </div>
            </div>
          </div>
        </div>
        
        <!-- BACK CARD -->
        <div class="id-card card-back">
          <div class="decorative-corner"></div>
          <div class="decorative-corner-2"></div>
          
          <div class="back-header">
            <div class="back-title">Important Information</div>
            <div class="back-subtitle">Please read carefully</div>
          </div>
          
          <div class="back-content">
            <div class="emergency-box">
              <div class="info-title">⚠️ Emergency Contact</div>
              <div class="info-text">
                In case of emergency, please contact the college administration at:<br/>
                <strong>Phone:</strong> +254729114157<br/>
                <strong>Email:</strong> info@kongonitvc.ac.ke
              </div>
            </div>
            
            <div class="info-section">
              <div class="info-title">📋 Terms & Conditions</div>
              <div class="info-text">
                • This card is the property of Kongoni TVC and must be surrendered upon request.<br/>
                • Loss of this card must be reported immediately.<br/>
                • This card is non-transferable and must be carried at all times on campus.<br/>
                • Misuse of this card may result in disciplinary action.
              </div>
            </div>
            
            <div class="signature-section">
              <div class="signature-box">
                <div class="signature-line"></div>
                <div class="signature-label">Student Signature</div>
              </div>
              
              <div class="validity-badge">
                Valid Until<br/>${student.validUntil}
              </div>
              
              <div class="signature-box">
                <div class="signature-line"></div>
                <div class="signature-label">Authorized By</div>
              </div>
            </div>
          </div>
          
          <div class="back-footer">
            <strong>Department:</strong> ${student.department} | 
            <strong>Session:</strong> ${student.session} | 
            <strong>Year:</strong> ${student.academicYear}
          </div>
        </div>
      </div>
      
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 500);
        };
      </script>
    </body>
    </html>
  `;

  // Open in new window for printing/downloading
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(cardHTML);
    printWindow.document.close();
  } else {
    alert('Please allow pop-ups to download ID cards');
  }
}

// Download all ID cards (opens multiple print dialogs)
export function downloadAllIDCards(students: IDCardData[]): void {
  if (students.length === 0) {
    alert('No ID cards to download');
    return;
  }

  const confirmed = confirm(`This will open ${students.length} print dialogs. Continue?`);
  if (!confirmed) return;

  students.forEach((student, index) => {
    setTimeout(() => {
      downloadIDCard(student);
    }, index * 1000); // Stagger the downloads
  });
}