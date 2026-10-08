import mongoose from 'mongoose';

const vulnerabilitySchema = new mongoose.Schema({
  id: String,
  name: String,
  severity: { type: String, enum: ['critical', 'high', 'medium', 'low', 'informational'] },
  category: String,
  cwe: String,
  owasp: String,
  lineNumber: Number,
  lineNumbers: [Number],
  description: String,
  recommendation: String,
  codeSnippet: String,
  tool: { type: String, enum: ['slither', 'mythril', 'hardhat', 'static', 'ai'] },
  aiExplanation: {
    simpleExplanation: String,
    whyDangerous: String,
    realWorldExample: String,
    secureCodeFix: String,
    bestPractices: [String],
    exploitRisk: String,
  },
}, { _id: false });

const scanSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  contractName: { type: String, required: true },
  fileName: { type: String, default: 'contract.sol' },
  sourceCode: { type: String, required: true },
  compilerVersion: { type: String, default: '0.8.x' },
  status: { type: String, enum: ['pending', 'scanning', 'completed', 'failed'], default: 'pending' },
  securityScore: { type: Number, min: 0, max: 100, default: null },
  riskLevel: {
    type: String,
    enum: ['excellent', 'good', 'moderate', 'high', 'critical'],
    default: null,
  },
  vulnerabilities: [vulnerabilitySchema],
  summary: {
    critical: { type: Number, default: 0 },
    high: { type: Number, default: 0 },
    medium: { type: Number, default: 0 },
    low: { type: Number, default: 0 },
    informational: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  aiAssessment: {
    overallRisk: String,
    keyFindings: [String],
    recommendations: [String],
    contractPurpose: String,
    deploymentReadiness: String,
  },
  scanDuration: { type: Number, default: 0 },
  toolsUsed: [String],
  linesOfCode: { type: Number, default: 0 },
  tags: [String],
  isPublic: { type: Boolean, default: false },
  notes: { type: String, default: '' },
  errorMessage: { type: String, default: null },
}, { timestamps: true });

scanSchema.index({ user: 1, createdAt: -1 });
scanSchema.index({ securityScore: 1 });
scanSchema.index({ riskLevel: 1 });

export default mongoose.model('Scan', scanSchema);
