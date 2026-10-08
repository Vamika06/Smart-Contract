import PDFDocument from 'pdfkit';
import Scan from '../models/Scan.js';

const COLORS = {
  critical: [220, 38, 38],
  high: [234, 88, 12],
  medium: [217, 119, 6],
  low: [22, 163, 74],
  informational: [37, 99, 235],
};

export const generateReport = async (req, res, next) => {
  try {
    const scan = await Scan.findOne({ _id: req.params.id, user: req.user._id });
    if (!scan) {
      return res.status(404).json({ success: false, message: 'Scan not found' });
    }
    if (scan.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Scan is not completed yet' });
    }

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="security-report-${scan._id}.pdf"`);
    doc.pipe(res);

    doc.rect(0, 0, doc.page.width, 120).fill([15, 23, 42]);
    doc.fillColor('white').fontSize(28).font('Helvetica-Bold').text('Smart Contract Security Report', 50, 35);
    doc.fontSize(12).font('Helvetica').fillColor([148, 163, 184])
      .text(`Generated: ${new Date().toLocaleString()}`, 50, 75)
      .text(`Contract: ${scan.contractName}`, 50, 92);

    doc.moveDown(4);

    doc.fillColor([15, 23, 42]).fontSize(14).font('Helvetica-Bold').text('EXECUTIVE SUMMARY', 50, 140);
    doc.moveTo(50, 158).lineTo(545, 158).strokeColor([226, 232, 240]).stroke();

    const scoreColor = scan.securityScore >= 80 ? [22, 163, 74] : scan.securityScore >= 60 ? [217, 119, 6] : [220, 38, 38];
    doc.fontSize(48).font('Helvetica-Bold').fillColor(scoreColor).text(`${scan.securityScore}`, 50, 170);
    doc.fontSize(14).fillColor([100, 116, 139]).text('/100 Security Score', 120, 195);
    doc.fontSize(16).font('Helvetica-Bold').fillColor([15, 23, 42])
      .text(`Risk Level: ${scan.riskLevel?.toUpperCase() || 'N/A'}`, 50, 230);

    doc.moveDown(1);
    doc.fontSize(11).font('Helvetica').fillColor([71, 85, 105]);
    const details = [
      ['Contract Name', scan.contractName],
      ['File Name', scan.fileName],
      ['Compiler Version', scan.compilerVersion || 'Unknown'],
      ['Lines of Code', scan.linesOfCode?.toString() || '0'],
      ['Scan Duration', `${(scan.scanDuration / 1000).toFixed(1)}s`],
      ['Scan Date', new Date(scan.createdAt).toLocaleString()],
      ['Total Vulnerabilities', scan.summary?.total?.toString() || '0'],
    ];

    let y = 270;
    details.forEach(([label, value]) => {
      doc.font('Helvetica-Bold').text(`${label}:`, 50, y).font('Helvetica').text(value, 220, y);
      y += 20;
    });

    doc.addPage();
    doc.fillColor([15, 23, 42]).fontSize(16).font('Helvetica-Bold').text('VULNERABILITY SUMMARY', 50, 50);
    doc.moveTo(50, 72).lineTo(545, 72).strokeColor([226, 232, 240]).stroke();

    const sevLevels = ['critical', 'high', 'medium', 'low', 'informational'];
    let vy = 90;
    sevLevels.forEach(level => {
      const count = scan.summary?.[level] || 0;
      const color = COLORS[level];
      doc.rect(50, vy, 12, 12).fill(color);
      doc.fillColor([15, 23, 42]).fontSize(12).font('Helvetica')
        .text(`${level.charAt(0).toUpperCase() + level.slice(1)}:`, 70, vy)
        .font('Helvetica-Bold').text(count.toString(), 200, vy);
      vy += 22;
    });

    if (scan.aiAssessment?.overallRisk) {
      doc.moveDown(2);
      doc.fillColor([15, 23, 42]).fontSize(14).font('Helvetica-Bold').text('AI ASSESSMENT', 50, vy + 20);
      doc.moveTo(50, vy + 40).lineTo(545, vy + 40).strokeColor([226, 232, 240]).stroke();
      doc.fontSize(11).font('Helvetica').fillColor([71, 85, 105])
        .text(scan.aiAssessment.overallRisk, 50, vy + 55, { width: 495, align: 'justify' });
    }

    if (scan.vulnerabilities?.length > 0) {
      doc.addPage();
      doc.fillColor([15, 23, 42]).fontSize(16).font('Helvetica-Bold').text('DETAILED VULNERABILITIES', 50, 50);
      doc.moveTo(50, 72).lineTo(545, 72).strokeColor([226, 232, 240]).stroke();

      let detailY = 90;
      scan.vulnerabilities.forEach((vuln, idx) => {
        if (detailY > 700) { doc.addPage(); detailY = 50; }

        const color = COLORS[vuln.severity] || [100, 116, 139];
        doc.rect(50, detailY, 495, 22).fill([248, 250, 252]);
        doc.fillColor(color).fontSize(12).font('Helvetica-Bold')
          .text(`${idx + 1}. ${vuln.name}`, 55, detailY + 5);
        doc.fillColor([100, 116, 139]).fontSize(10).font('Helvetica')
          .text(`Severity: ${vuln.severity?.toUpperCase()} | Line: ${vuln.lineNumber} | ${vuln.cwe}`, 350, detailY + 7);
        detailY += 28;

        doc.fillColor([71, 85, 105]).fontSize(10).font('Helvetica')
          .text(vuln.description, 55, detailY, { width: 480 });
        detailY += 40;

        if (vuln.aiExplanation?.simpleExplanation) {
          doc.fillColor([15, 23, 42]).fontSize(10).font('Helvetica-Bold').text('Explanation:', 55, detailY);
          detailY += 15;
          doc.fillColor([71, 85, 105]).fontSize(10).font('Helvetica')
            .text(vuln.aiExplanation.simpleExplanation, 55, detailY, { width: 480 });
          detailY += 35;
        }

        doc.fillColor([15, 23, 42]).fontSize(10).font('Helvetica-Bold').text('Recommendation:', 55, detailY);
        detailY += 15;
        doc.fillColor([71, 85, 105]).fontSize(10).font('Helvetica')
          .text(vuln.recommendation, 55, detailY, { width: 480 });
        detailY += 40;

        doc.moveTo(50, detailY).lineTo(545, detailY).strokeColor([226, 232, 240]).stroke();
        detailY += 15;
      });
    }

    doc.addPage();
    doc.fillColor([15, 23, 42]).fontSize(16).font('Helvetica-Bold').text('RECOMMENDATIONS', 50, 50);
    doc.moveTo(50, 72).lineTo(545, 72).strokeColor([226, 232, 240]).stroke();

    const recs = scan.aiAssessment?.recommendations || [
      'Address all critical and high severity vulnerabilities before deployment',
      'Conduct a professional third-party security audit',
      'Implement comprehensive test coverage (unit, integration, fuzzing)',
      'Use OpenZeppelin battle-tested contract libraries',
      'Enable automated security scanning in CI/CD pipeline',
    ];

    recs.forEach((rec, i) => {
      doc.fillColor([37, 99, 235]).fontSize(11).font('Helvetica-Bold').text(`${i + 1}.`, 50, 90 + i * 25);
      doc.fillColor([71, 85, 105]).fontSize(11).font('Helvetica').text(rec, 70, 90 + i * 25, { width: 475 });
    });

    doc.fontSize(9).fillColor([148, 163, 184])
      .text('This report was generated automatically and should not replace a professional security audit.', 50, 750, { align: 'center', width: 495 });

    doc.end();
  } catch (error) {
    next(error);
  }
};
