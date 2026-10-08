import OpenAI from 'openai';

let openaiClient = null;

function getOpenAIClient() {
  if (openaiClient) return openaiClient;

  if (process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT) {
    openaiClient = new OpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4'}`,
      defaultHeaders: { 'api-key': process.env.AZURE_OPENAI_API_KEY },
      defaultQuery: { 'api-version': process.env.AZURE_OPENAI_API_VERSION || '2024-02-01' },
    });
    return openaiClient;
  }

  if (process.env.OPENAI_API_KEY) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    return openaiClient;
  }

  return null;
}

async function callOllama(prompt) {
  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL || 'llama3',
        prompt,
        stream: false,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) throw new Error('Ollama request failed');
    const data = await response.json();
    return data.response;
  } catch {
    return null;
  }
}

async function callAI(messages, systemPrompt) {
  const client = getOpenAIClient();

  if (client) {
    try {
      const completion = await client.chat.completions.create({
        model: process.env.AZURE_OPENAI_DEPLOYMENT || process.env.OPENAI_MODEL || 'gpt-4',
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        temperature: 0.3,
        max_tokens: 2000,
      });
      return completion.choices[0].message.content;
    } catch (err) {
      console.error('OpenAI error:', err.message);
    }
  }

  const prompt = `${systemPrompt}\n\n${messages.map(m => `${m.role}: ${m.content}`).join('\n')}`;
  const ollamaResponse = await callOllama(prompt);
  if (ollamaResponse) return ollamaResponse;

  return null;
}

function parseJsonResponse(text) {
  try {
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/(\{[\s\S]*\})/);
    if (jsonMatch) return JSON.parse(jsonMatch[1]);
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function analyzeVulnerabilityWithAI(vulnerability, contractCode) {
  const systemPrompt = `You are an expert smart contract security auditor specializing in Solidity vulnerabilities. 
Provide detailed, actionable security analysis in JSON format only.`;

  const userMessage = `Analyze this Solidity vulnerability and provide a detailed explanation:

Vulnerability: ${vulnerability.name}
Severity: ${vulnerability.severity}
Category: ${vulnerability.category}
CWE: ${vulnerability.cwe}
Description: ${vulnerability.description}
Code snippet:
\`\`\`solidity
${vulnerability.codeSnippet || 'N/A'}
\`\`\`

Return ONLY a JSON object with these exact fields:
{
  "simpleExplanation": "Explain in simple terms (2-3 sentences)",
  "whyDangerous": "Why this is dangerous to the contract and users (2-3 sentences)",
  "realWorldExample": "A real-world attack scenario example (2-3 sentences)",
  "secureCodeFix": "Solidity code showing the secure fix (just the code, no markdown)",
  "bestPractices": ["practice 1", "practice 2", "practice 3"],
  "exploitRisk": "Low/Medium/High/Critical - brief explanation"
}`;

  const response = await callAI([{ role: 'user', content: userMessage }], systemPrompt);

  if (!response) {
    return {
      simpleExplanation: vulnerability.description,
      whyDangerous: `${vulnerability.name} vulnerabilities can lead to financial loss and contract compromise.`,
      realWorldExample: `Historical attacks like the DAO hack exploited ${vulnerability.category} vulnerabilities.`,
      secureCodeFix: `// Apply ${vulnerability.recommendation}`,
      bestPractices: [vulnerability.recommendation, 'Conduct regular security audits', 'Use OpenZeppelin battle-tested contracts'],
      exploitRisk: `${vulnerability.severity.charAt(0).toUpperCase() + vulnerability.severity.slice(1)} - Based on pattern analysis`,
    };
  }

  const parsed = parseJsonResponse(response);
  if (parsed) return parsed;

  return {
    simpleExplanation: response.substring(0, 200),
    whyDangerous: vulnerability.description,
    realWorldExample: 'See OWASP Smart Contract Security resources.',
    secureCodeFix: `// ${vulnerability.recommendation}`,
    bestPractices: [vulnerability.recommendation],
    exploitRisk: vulnerability.severity,
  };
}

export async function generateOverallAssessment(contractCode, vulnerabilities, securityScore) {
  const systemPrompt = `You are an expert smart contract security auditor. Provide comprehensive security assessments in JSON format.`;

  const vulnSummary = vulnerabilities.map(v => `- ${v.name} (${v.severity})`).join('\n');

  const userMessage = `Analyze this Solidity smart contract and provide an overall security assessment.

Security Score: ${securityScore}/100
Vulnerabilities Found:
${vulnSummary || 'No vulnerabilities detected'}

Contract Code (first 2000 chars):
\`\`\`solidity
${contractCode.substring(0, 2000)}
\`\`\`

Return ONLY a JSON object:
{
  "overallRisk": "Brief overall risk assessment (2-3 sentences)",
  "contractPurpose": "What this contract appears to do (1-2 sentences)",
  "keyFindings": ["finding 1", "finding 2", "finding 3"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "deploymentReadiness": "Ready/Not Ready/Needs Review - with brief explanation"
}`;

  const response = await callAI([{ role: 'user', content: userMessage }], systemPrompt);

  if (!response) {
    return {
      overallRisk: securityScore >= 80 ? 'Contract appears reasonably secure with minor issues.' : 'Contract has significant security vulnerabilities requiring attention.',
      contractPurpose: 'Smart contract purpose could not be automatically determined.',
      keyFindings: vulnerabilities.slice(0, 3).map(v => `${v.name} detected at line ${v.lineNumber}`),
      recommendations: ['Complete a professional audit before deployment', 'Use OpenZeppelin battle-tested contracts', 'Implement comprehensive test coverage'],
      deploymentReadiness: securityScore >= 80 ? 'Needs Review - Minor fixes recommended' : 'Not Ready - Address critical vulnerabilities first',
    };
  }

  const parsed = parseJsonResponse(response);
  if (parsed) return parsed;

  return {
    overallRisk: response.substring(0, 300),
    contractPurpose: 'Smart contract purpose analysis.',
    keyFindings: ['See vulnerability details above'],
    recommendations: ['Address all high and critical vulnerabilities', 'Consider a professional audit'],
    deploymentReadiness: securityScore >= 80 ? 'Needs Review' : 'Not Ready',
  };
}
