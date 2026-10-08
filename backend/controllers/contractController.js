import Scan from '../models/Scan.js';
import User from '../models/User.js';
import { analyzeContract } from '../services/analysisService.js';
import { analyzeVulnerabilityWithAI, generateOverallAssessment } from '../services/aiService.js';

export const scanContract = async (req, res, next) => {
  const startTime = Date.now();
  let scan;

  try {
    let sourceCode, contractName, fileName;

    if (req.file) {
      sourceCode = req.file.buffer.toString('utf-8');
      fileName = req.file.originalname;
      contractName = req.body.contractName || fileName.replace('.sol', '');
    } else {
      sourceCode = req.body.sourceCode;
      contractName = req.body.contractName || 'Unnamed Contract';
      fileName = req.body.fileName || 'contract.sol';
    }

    if (!sourceCode) {
      return res.status(400).json({ success: false, message: 'Source code is required' });
    }
    if (sourceCode.length > 500000) {
      return res.status(400).json({ success: false, message: 'Contract too large (max 500KB)' });
    }
    if (!sourceCode.includes('pragma solidity') && !sourceCode.includes('contract ')) {
      return res.status(400).json({ success: false, message: 'File does not appear to be a valid Solidity contract' });
    }

    scan = await Scan.create({
      user: req.user._id,
      contractName,
      fileName,
      sourceCode,
      status: 'scanning',
    });

    res.json({
      success: true,
      message: 'Scan started',
      scanId: scan._id,
    });

    const analysis = analyzeContract(sourceCode);
    const toolsUsed = ['static-analyzer'];

    const aiEnhancedVulns = await Promise.all(
      analysis.vulnerabilities.map(async (vuln) => {
        const aiExplanation = await analyzeVulnerabilityWithAI(vuln, sourceCode);
        return { ...vuln, aiExplanation };
      })
    );

    const aiAssessment = await generateOverallAssessment(
      sourceCode,
      aiEnhancedVulns,
      analysis.securityScore
    );

    const scanDuration = Date.now() - startTime;

    await Scan.findByIdAndUpdate(scan._id, {
      status: 'completed',
      vulnerabilities: aiEnhancedVulns,
      summary: analysis.summary,
      securityScore: analysis.securityScore,
      riskLevel: analysis.riskLevel,
      compilerVersion: analysis.compilerVersion,
      linesOfCode: analysis.linesOfCode,
      aiAssessment,
      scanDuration,
      toolsUsed,
    });

    await User.findByIdAndUpdate(req.user._id, { $inc: { totalScans: 1 } });

  } catch (error) {
    console.error('Scan error:', error);
    if (scan) {
      await Scan.findByIdAndUpdate(scan._id, {
        status: 'failed',
        errorMessage: error.message,
      });
    }
  }
};

export const getScanStatus = async (req, res, next) => {
  try {
    const scan = await Scan.findOne({ _id: req.params.id, user: req.user._id });
    if (!scan) {
      return res.status(404).json({ success: false, message: 'Scan not found' });
    }
    res.json({ success: true, scan });
  } catch (error) {
    next(error);
  }
};

export const getScanHistory = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 10, search = '', riskLevel = '', sortBy = 'createdAt', sortOrder = 'desc',
    } = req.query;

    const query = { user: req.user._id };
    if (search) {
      query.$or = [
        { contractName: { $regex: search, $options: 'i' } },
        { fileName: { $regex: search, $options: 'i' } },
      ];
    }
    if (riskLevel) query.riskLevel = riskLevel;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [scans, total] = await Promise.all([
      Scan.find(query)
        .select('-sourceCode -vulnerabilities')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Scan.countDocuments(query),
    ]);

    res.json({
      success: true,
      scans,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getScanById = async (req, res, next) => {
  try {
    const scan = await Scan.findOne({ _id: req.params.id, user: req.user._id });
    if (!scan) {
      return res.status(404).json({ success: false, message: 'Scan not found' });
    }
    res.json({ success: true, scan });
  } catch (error) {
    next(error);
  }
};

export const deleteScan = async (req, res, next) => {
  try {
    const scan = await Scan.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!scan) {
      return res.status(404).json({ success: false, message: 'Scan not found' });
    }
    res.json({ success: true, message: 'Scan deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateScanNotes = async (req, res, next) => {
  try {
    const { notes, tags } = req.body;
    const update = {};
    if (notes !== undefined) update.notes = notes;
    if (tags !== undefined) update.tags = tags;

    const scan = await Scan.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      update,
      { new: true }
    );
    if (!scan) {
      return res.status(404).json({ success: false, message: 'Scan not found' });
    }
    res.json({ success: true, scan });
  } catch (error) {
    next(error);
  }
};
